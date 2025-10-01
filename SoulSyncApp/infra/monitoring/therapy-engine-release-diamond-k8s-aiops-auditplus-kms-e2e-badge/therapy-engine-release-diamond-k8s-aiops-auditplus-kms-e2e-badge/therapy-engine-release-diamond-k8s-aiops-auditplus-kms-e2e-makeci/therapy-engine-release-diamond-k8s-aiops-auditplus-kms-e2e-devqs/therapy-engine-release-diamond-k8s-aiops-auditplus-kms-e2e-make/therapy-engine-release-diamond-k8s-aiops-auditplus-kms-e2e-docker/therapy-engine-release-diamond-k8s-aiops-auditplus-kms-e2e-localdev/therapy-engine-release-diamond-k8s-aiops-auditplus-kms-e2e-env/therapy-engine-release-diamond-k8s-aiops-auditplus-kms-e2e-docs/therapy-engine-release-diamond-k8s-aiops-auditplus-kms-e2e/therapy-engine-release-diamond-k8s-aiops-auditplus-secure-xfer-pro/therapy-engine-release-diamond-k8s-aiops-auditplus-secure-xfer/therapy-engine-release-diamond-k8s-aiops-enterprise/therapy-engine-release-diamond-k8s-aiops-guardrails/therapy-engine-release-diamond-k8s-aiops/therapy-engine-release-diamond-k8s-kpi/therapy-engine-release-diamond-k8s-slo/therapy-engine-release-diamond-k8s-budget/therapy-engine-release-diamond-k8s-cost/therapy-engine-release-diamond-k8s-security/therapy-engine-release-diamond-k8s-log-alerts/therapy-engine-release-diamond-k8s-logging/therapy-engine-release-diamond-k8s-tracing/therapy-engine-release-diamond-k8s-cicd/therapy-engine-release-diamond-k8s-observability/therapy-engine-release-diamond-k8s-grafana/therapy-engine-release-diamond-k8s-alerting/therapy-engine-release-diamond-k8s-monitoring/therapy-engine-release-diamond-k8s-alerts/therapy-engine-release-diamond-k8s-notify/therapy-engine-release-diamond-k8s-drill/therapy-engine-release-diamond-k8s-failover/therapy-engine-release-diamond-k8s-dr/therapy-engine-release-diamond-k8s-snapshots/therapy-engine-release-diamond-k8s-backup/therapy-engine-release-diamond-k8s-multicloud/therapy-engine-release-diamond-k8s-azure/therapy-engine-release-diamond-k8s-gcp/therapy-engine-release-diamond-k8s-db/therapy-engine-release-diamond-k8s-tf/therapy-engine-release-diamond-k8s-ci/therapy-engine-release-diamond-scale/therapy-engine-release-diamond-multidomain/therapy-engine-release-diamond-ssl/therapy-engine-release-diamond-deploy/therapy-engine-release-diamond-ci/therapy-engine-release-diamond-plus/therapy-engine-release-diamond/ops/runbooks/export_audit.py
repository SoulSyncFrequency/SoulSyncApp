import os, csv, json, psycopg2, psycopg2.extras
from datetime import datetime, timedelta, timezone

DATABASE_URL = os.getenv("AIOPS_DATABASE_URL")
DAYS = int(os.getenv("EXPORT_DAYS","7"))
OUTFILE = os.getenv("EXPORT_FILE") or f"audit-{datetime.now().strftime('%Y%m%d')}.csv"


if not DATABASE_URL:
    # Allow mock mode for CI/e2e
    DATABASE_URL = "mock"

rows = []
if DATABASE_URL.lower().startswith("mock"):
    # Prepare mock data (no DB required)
    from collections import namedtuple
    Row = namedtuple("Row", ["ts","source","app_label","namespace","metric","action","reasons","details"])
    rows = [
        Row("2025-09-01T12:00:00Z","webhook","therapy-backend","default","latency_p99","request",["spike"],{"path":"/trigger"}),
        Row("2025-09-01T12:00:10Z","webhook","therapy-backend","default","latency_p99","approval_pending",["spike"],{"action_id":"abcd1234"}),
        Row("2025-09-01T12:00:20Z","webhook","therapy-backend","default","latency_p99","approved",["spike"],{"by":"tester"}),
    ]
else:
    # --- Export from DB ---
    conn = psycopg2.connect(DATABASE_URL)
    cutoff = datetime.now(timezone.utc) - timedelta(days=DAYS)
    with conn, conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
        cur.execute("SELECT ts, source, app_label, namespace, metric, action, reasons, details FROM runbooks_audit WHERE ts >= %s ORDER BY ts DESC", (cutoff,))
        rows = cur.fetchall()

with open(OUTFILE,"w",newline="",encoding="utf-8") as csvfile:
    w = csv.writer(csvfile)
    w.writerow(["ts","source","app_label","namespace","metric","action","reasons","details"])
    for r in rows:
        if isinstance(r, dict) or hasattr(r, "keys"):
            ts = r["ts"]; source=r["source"]; app=r["app_label"]; ns=r["namespace"]; metric=r["metric"]; action=r["action"]; reasons=r["reasons"]; details=r["details"]
        else:
            ts,source,app,ns,metric,action,reasons,details = r
        w.writerow([ts, source, app, ns, metric, action, json.dumps(reasons), json.dumps(details)])

print(f"Wrote {len(rows)} rows to {OUTFILE}")

# === Helpers: Secret retrieval and Envelope encryption ===
def _get_pgp_from_secrets():
    # Try AWS Secrets Manager
    try:
        sec = os.getenv("AWS_PGP_SECRET_NAME")
        if sec:
            import boto3
            sm = boto3.client("secretsmanager", region_name=os.getenv("AWS_REGION","eu-central-1"))
            r = sm.get_secret_value(SecretId=sec)
            s = r.get("SecretString") or ""
            if s.strip():
                return s
    except Exception as e:
        print(f"<AWS SecretsManager fetch failed: {e}>")
    # Try GCP Secret Manager
    try:
        gsec = os.getenv("GCP_PGP_SECRET_NAME")
        gproj = os.getenv("GCP_PROJECT_ID")
        if gsec and gproj:
            from google.cloud import secretmanager
            client = secretmanager.SecretManagerServiceClient()
            name = f"projects/{gproj}/secrets/{gsec}/versions/latest"
            resp = client.access_secret_version(name=name)
            s = resp.payload.data.decode("utf-8")
            if s.strip():
                return s
    except Exception as e:
        print(f"<GCP SecretManager fetch failed: {e}>")
    # Try Azure Key Vault Secret
    try:
        kv_url = os.getenv("AZURE_KEY_VAULT_URL")
        kv_sec = os.getenv("AZURE_KV_PGP_SECRET_NAME")
        if kv_url and kv_sec:
            from azure.identity import DefaultAzureCredential
            from azure.keyvault.secrets import SecretClient
            cred = DefaultAzureCredential()
            client = SecretClient(vault_url=kv_url, credential=cred)
            s = client.get_secret(kv_sec).value
            if s.strip():
                return s
    except Exception as e:
        print(f"<Azure KV Secret fetch failed: {e}>")
    return None

def _envelope_encrypt_aesgcm(path: str):
    # Returns (new_path, meta_dict)
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    import os, json, base64, secrets
    with open(path,"rb") as f:
        data = f.read()
    key = secrets.token_bytes(32)
    nonce = secrets.token_bytes(12)
    aesgcm = AESGCM(key)
    ct = aesgcm.encrypt(nonce, data, None)
    meta = {"scheme":"envelope-aesgcm","original_filename": os.path.basename(path)}
    # Wrap key with providers if configured
    # AWS KMS
    try:
        key_id = os.getenv("AWS_KMS_KEY_ID")
        if key_id:
            import boto3, base64 as b64
            kms = boto3.client("kms", region_name=os.getenv("AWS_REGION","eu-central-1"))
            r = kms.encrypt(KeyId=key_id, Plaintext=key)
            meta.setdefault("wrapped_keys", {})["aws_kms"] = base64.b64encode(r["CiphertextBlob"]).decode()
    except Exception as e:
        print(f"<AWS KMS wrap failed: {e}>")
    # GCP KMS
    try:
        gckey = os.getenv("GCP_KMS_KEY")
        if gckey:
            from google.cloud import kms
            client = kms.KeyManagementServiceClient()
            r = client.encrypt(name=gckey, plaintext=key)
            meta.setdefault("wrapped_keys", {})["gcp_kms"] = base64.b64encode(r.ciphertext).decode()
    except Exception as e:
        print(f"<GCP KMS wrap failed: {e}>")
    # Azure Key Vault Keys
    try:
        kv_key_id = os.getenv("AZURE_KV_KEY_ID")
        if kv_key_id:
            from azure.identity import DefaultAzureCredential
            from azure.keyvault.keys.crypto import CryptographyClient, EncryptionAlgorithm, KeyWrapAlgorithm
            cred = DefaultAzureCredential()
            crypto = CryptographyClient(key_identifier=kv_key_id, credential=cred)
            # Prefer wrap_key (RSA/KEYWRAP)
            try:
                w = crypto.wrap_key(algorithm=KeyWrapAlgorithm.rsa_oaep_256, key=key)
                wrapped = w.encrypted_key
            except Exception:
                # fallback: encrypt raw data key
                w = crypto.encrypt(algorithm=EncryptionAlgorithm.rsa_oaep_256, plaintext=key)
                wrapped = w.ciphertext
            meta.setdefault("wrapped_keys", {})["azure_kv"] = base64.b64encode(wrapped).decode()
    except Exception as e:
        print(f"<Azure KV wrap failed: {e}>")

    meta["nonce"] = base64.b64encode(nonce).decode()
    meta["ciphertext"] = base64.b64encode(ct).decode()
    meta["created"] = datetime.utcnow().isoformat() + "Z"
    out = path + ".envelope.json"
    with open(out,"w",encoding="utf-8") as f:
        json.dump(meta,f,indent=2)
    return out, meta



# --- Filename masking (privacy) ---
mode = os.getenv("AUDIT_FILENAME_MODE","plain").lower()
if mode == "hashed":
    import hashlib, hmac, secrets
    salt = os.getenv("AUDIT_FILENAME_SALT") or secrets.token_hex(8)
    base = OUTFILE.rsplit(".",1)[0]
    ext = OUTFILE.rsplit(".",1)[1] if "." in OUTFILE else "csv"
    tag = hmac.new(salt.encode(), base.encode(), hashlib.sha256).hexdigest()[:6]
    new_name = f"{base}-{tag}.{ext}"
    try:
        os.rename(OUTFILE, new_name)
        OUTFILE = new_name
        print(f"Renamed (masked) to {OUTFILE}")
    except Exception as e:
        print(f"<masking failed: {e}>")



# --- PGP encryption (before uploads) ---
pgp_key = os.getenv("AUDIT_PGP_PUBLIC_KEY") or _get_pgp_from_secrets()
pgp_key_file = os.getenv("AUDIT_PGP_PUBLIC_KEY_FILE")
pgp_keys_multi = [k for k in (os.getenv("AUDIT_PGP_PUBLIC_KEYS","").split(",") if os.getenv("AUDIT_PGP_PUBLIC_KEYS") else []) if k.strip()]
pgp_key_files_multi = [k for k in (os.getenv("AUDIT_PGP_PUBLIC_KEY_FILES","").split(",") if os.getenv("AUDIT_PGP_PUBLIC_KEY_FILES") else []) if k.strip()]
pgp_comment = os.getenv("AUDIT_PGP_COMMENT","")
AUDIT_ENCRYPTION = os.getenv("AUDIT_ENCRYPTION","off").lower() in ("on","true","1","pgp")
USE_GPG_CLI = os.getenv("AUDIT_GPG_CLI","off").lower() in ("on","true","1")

def _write_with_comment(armored_text: str, out_path: str, comment: str):
    if comment:
        armored_text = armored_text.replace("-----BEGIN PGP MESSAGE-----
", f"-----BEGIN PGP MESSAGE-----
Comment: {comment}

", 1)
    with open(out_path, "w", encoding="utf-8") as ef:
        ef.write(armored_text)

if AUDIT_ENCRYPTION or pgp_key or pgp_key_file or pgp_keys_multi or pgp_key_files_multi:
    # Prefer GPG CLI if requested (supports single-file multi-recipient)
    if USE_GPG_CLI and (pgp_keys_multi or pgp_key_files_multi or pgp_key or pgp_key_file):
        try:
            import subprocess, tempfile, shutil
            homedir = tempfile.mkdtemp(prefix="audit-gpg-")
            # import keys
            keyfiles = []
            if pgp_key:
                p = os.path.join(homedir, "key0.asc"); open(p,"w",encoding="utf-8").write(pgp_key); keyfiles.append(p)
            if pgp_key_file and os.path.exists(pgp_key_file):
                keyfiles.append(pgp_key_file)
            for i,k in enumerate(pgp_keys_multi):
                if k.strip():
                    p = os.path.join(homedir, f"key{i+1}.asc"); open(p,"w",encoding="utf-8").write(k); keyfiles.append(p)
            for kf in pgp_key_files_multi:
                if os.path.exists(kf): keyfiles.append(kf)
            for kf in keyfiles:
                subprocess.run(["gpg","--homedir",homedir,"--batch","--import",kf], check=True, capture_output=True)
            # get fingerprints
            cp = subprocess.run(["gpg","--homedir",homedir,"--list-keys","--with-colons"], check=True, capture_output=True, text=True)
            fprs = [line.split(":")[9] for line in cp.stdout.splitlines() if line.startswith("fpr:")]
            if not fprs:
                raise RuntimeError("No fingerprints imported")
            enc_out = OUTFILE + ".gpg"
            cmd = ["gpg","--homedir",homedir,"--batch","--yes","-a","-o",enc_out,"-e"]
            if pgp_comment:
                cmd = ["gpg","--homedir",homedir,"--batch","--yes","-a","--comment",pgp_comment,"-o",enc_out,"-e"]
            for f in fprs:
                cmd += ["-r", f]
            cmd.append(OUTFILE)
            sp = subprocess.run(cmd, capture_output=True, text=True)
            if sp.returncode != 0:
                raise RuntimeError(f"gpg failed: {sp.stderr[:200]}")
            if os.getenv("AUDIT_PGP_DELETE_PLAINTEXT","true").lower() == "true":
                try: os.remove(OUTFILE)
                except Exception: pass
            OUTFILE = enc_out
            print(f"Encrypted (GPG multi-recipient) to {OUTFILE}")
            shutil.rmtree(homedir, ignore_errors=True)
        except Exception as e:
            print(f"<GPG CLI encryption failed, falling back to PGPy: {e}>")
            USE_GPG_CLI = False

    if not USE_GPG_CLI:
        try:
            from pgpy import PGPKey, PGPMessage
            # Gather keys
            key_blobs = []
            if pgp_key: key_blobs.append(("key","inline", pgp_key))
            if pgp_key_file and os.path.exists(pgp_key_file): key_blobs.append(("key","file", open(pgp_key_file,"r",encoding="utf-8").read()))
            for i,k in enumerate(pgp_keys_multi): key_blobs.append((f"key{i}", "inline", k))
            for kf in pgp_key_files_multi:
                if os.path.exists(kf): key_blobs.append(("file", "file", open(kf,"r",encoding="utf-8").read()))
            if not key_blobs:
                print("<PGP encryption skipped: no key provided>")
            else:
                # If multiple keys -> create multiple encrypted files (one per recipient)
                if len(key_blobs) == 1:
                    key, _ = PGPKey.from_blob(key_blobs[0][2])
                    with open(OUTFILE, "rb") as fsrc:
                        msg = PGPMessage.new(fsrc.read(), file=True, name=os.path.basename(OUTFILE))
                    enc = key.encrypt(msg)
                    enc_name = OUTFILE + ".gpg"
                    _write_with_comment(str(enc), enc_name, pgp_comment)
                    if os.getenv("AUDIT_PGP_DELETE_PLAINTEXT","true").lower() == "true":
                        try: os.remove(OUTFILE)
                        except Exception: pass
                    OUTFILE = enc_name
                    print(f"Encrypted (PGPy) to {OUTFILE}")
                else:
                    outfiles = []
                    for idx,(_,_,blob) in enumerate(key_blobs):
                        try:
                            key, _ = PGPKey.from_blob(blob)
                            with open(OUTFILE, "rb") as fsrc:
                                msg = PGPMessage.new(fsrc.read(), file=True, name=os.path.basename(OUTFILE))
                            enc = key.encrypt(msg)
                            suffix = getattr(key, 'fingerprint', None) or f"r{idx+1}"
                            enc_name = OUTFILE + f".{str(suffix)[-8:]}.gpg"
                            _write_with_comment(str(enc), enc_name, pgp_comment)
                            outfiles.append(enc_name)
                        except Exception as e2:
                            print(f"<Encrypt for recipient {idx+1} failed: {e2}>")
                    if outfiles:
                        if os.getenv("AUDIT_PGP_DELETE_PLAINTEXT","true").lower() == "true":
                            try: os.remove(OUTFILE)
                            except Exception: pass
                        OUTFILE = outfiles[0]
                        print(f"Encrypted for {len(outfiles)} recipients: {', '.join(os.path.basename(x) for x in outfiles)}")
        except Exception as e:
            print(f"<PGPy encryption failed: {e}>")



# --- KMS/KeyVault envelope mode (optional) ---
# If AUDIT_ENC_MODE contains 'kms', apply envelope encryption to OUTFILE
enc_mode = os.getenv("AUDIT_ENC_MODE","pgp").lower()  # values: pgp | kms | pgp+kms
if "kms" in enc_mode:
    try:
        new_path, meta = _envelope_encrypt_aesgcm(OUTFILE)
        if os.getenv("AUDIT_KMS_DELETE_ORIGINAL","true").lower() == "true":
            try: os.remove(OUTFILE)
            except Exception: pass
        OUTFILE = new_path
        print(f"Envelope-encrypted via KMS providers to {OUTFILE}")
    except Exception as e:
        print(f"<KMS envelope encryption failed: {e}>")

# --- S3 upload & retention ---

bucket = os.getenv("AUDIT_S3_BUCKET")
if bucket:
    try:
        import boto3
        s3 = boto3.client("s3", region_name=os.getenv("AWS_REGION","eu-central-1"))
        prefix = os.getenv("AUDIT_S3_PREFIX","audit")
        key = f"{prefix}/{os.path.basename(OUTFILE)}"
        with open(OUTFILE,"rb") as f2:
            s3.upload_fileobj(f2, bucket, key)
        print(f"Uploaded to s3://{bucket}/{key}")
        # Retention
        ret_days = int(os.getenv("AUDIT_S3_RETENTION_DAYS","90"))
        if ret_days > 0:
            from datetime import timedelta
            cutoff = datetime.now(timezone.utc) - timedelta(days=ret_days)
            resp = s3.list_objects_v2(Bucket=bucket, Prefix=prefix+"/")
            for obj in resp.get("Contents", []):
                if obj["LastModified"] < cutoff:
                    s3.delete_object(Bucket=bucket, Key=obj["Key"])
                    print(f"Deleted old audit file: {obj['Key']}")
    except Exception as e:
        print(f"<S3 upload/retention failed: {e}>")

# --- GCS retention ---
gcs_bucket = os.getenv("GCS_BUCKET")
gcs_prefix = os.getenv("GCS_PREFIX","audit")
gcs_ret_days = int(os.getenv("GCS_RETENTION_DAYS","90"))
if gcs_bucket and gcs_ret_days > 0:
    try:
        from google.cloud import storage
        cutoff = datetime.now(timezone.utc) - timedelta(days=gcs_ret_days)
        gcs = storage.Client()
        bucket = gcs.bucket(gcs_bucket)
        blobs = bucket.list_blobs(prefix=gcs_prefix+"/")
        for b in blobs:
            if b.time_created and b.time_created.replace(tzinfo=timezone.utc) < cutoff:
                b.delete()
                print(f"Deleted old GCS audit file: {b.name}")
    except Exception as e:
        print(f"<GCS retention failed: {e}>")

# --- Azure retention ---
az_account = os.getenv("AZURE_STORAGE_ACCOUNT")
az_key = os.getenv("AZURE_STORAGE_KEY")
az_container = os.getenv("AZURE_CONTAINER")
az_prefix = os.getenv("AZURE_PREFIX","audit")
az_ret_days = int(os.getenv("AZURE_RETENTION_DAYS","90"))
if az_account and az_key and az_container and az_ret_days > 0:
    try:
        from azure.storage.blob import BlobServiceClient
        cutoff = datetime.now(timezone.utc) - timedelta(days=az_ret_days)
        blob_service = BlobServiceClient(account_url=f"https://{az_account}.blob.core.windows.net/", credential=az_key)
        container_client = blob_service.get_container_client(az_container)
        for blob in container_client.list_blobs(name_starts_with=az_prefix+"/"):
            if blob.last_modified and blob.last_modified.replace(tzinfo=timezone.utc) < cutoff:
                container_client.delete_blob(blob)
                print(f"Deleted old Azure audit file: {blob.name}")
    except Exception as e:
        print(f"<Azure retention failed: {e}>")

# --- Google Drive upload + retention ---
gdrive_folder = os.getenv("GDRIVE_FOLDER_ID")
gdrive_ret_days = int(os.getenv("GDRIVE_RETENTION_DAYS","90"))
if gdrive_folder:
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
        creds_path = os.getenv("GDRIVE_CREDENTIALS_JSON")
        creds = service_account.Credentials.from_service_account_file(creds_path, scopes=["https://www.googleapis.com/auth/drive"])
        service = build("drive","v3",credentials=creds)
        media_path = OUTFILE
        # Simple upload
        from googleapiclient.http import MediaFileUpload
        media = MediaFileUpload(media_path, resumable=False)
        file_metadata = {"name": os.path.basename(OUTFILE), "parents":[gdrive_folder]}
        service.files().create(body=file_metadata, media_body=media, fields="id").execute()
        print(f"Uploaded to Google Drive folder {gdrive_folder}: {OUTFILE}")
        # Retention
        cutoff = datetime.now(timezone.utc) - timedelta(days=gdrive_ret_days)
        results = service.files().list(q=f"'{gdrive_folder}' in parents", fields="files(id,name,createdTime)").execute()
        for fmeta in results.get("files",[]):
            created = datetime.fromisoformat(fmeta["createdTime"].replace("Z","+00:00"))
            if created < cutoff:
                service.files().delete(fileId=fmeta["id"]).execute()
                print(f"Deleted old Drive file: {fmeta['name']}")
    except Exception as e:
        print(f"<Google Drive export failed: {e}>")

# --- Dropbox upload + retention ---
dropbox_token = os.getenv("DROPBOX_TOKEN")
dropbox_folder = os.getenv("DROPBOX_FOLDER","/audit")
dropbox_ret_days = int(os.getenv("DROPBOX_RETENTION_DAYS","90"))
if dropbox_token:
    try:
        import dropbox
        dbx = dropbox.Dropbox(dropbox_token)
        dest_path = f"{dropbox_folder}/{os.path.basename(OUTFILE)}"
        with open(OUTFILE,"rb") as f2:
            dbx.files_upload(f2.read(), dest_path, mode=dropbox.files.WriteMode.overwrite)
        print(f"Uploaded to Dropbox: {dest_path}")
        # retention
        cutoff = datetime.now(timezone.utc) - timedelta(days=dropbox_ret_days)
        res = dbx.files_list_folder(dropbox_folder)
        for entry in res.entries:
            if isinstance(entry, dropbox.files.FileMetadata):
                if entry.client_modified < cutoff:
                    dbx.files_delete_v2(entry.path_lower)
                    print(f"Deleted old Dropbox file: {entry.name}")
    except Exception as e:
        print(f"<Dropbox export failed: {e}>")

# --- OneDrive/SharePoint (Graph) + MSAL ---
def _get_graph_token():
    tenant = os.getenv("MS_TENANT_ID")
    client_id = os.getenv("MS_CLIENT_ID")
    client_secret = os.getenv("MS_CLIENT_SECRET")
    if not (tenant and client_id and client_secret):
        return None
    try:
        import msal
        app = msal.ConfidentialClientApplication(
            client_id,
            authority=f"https://login.microsoftonline.com/{tenant}",
            client_credential=client_secret
        )
        result = app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"])
        if result and result.get("access_token"):
            return result["access_token"]
    except Exception as e:
        print(f"<msal token error: {e}>")
    return None

# OneDrive
onedrive_token = os.getenv("ONEDRIVE_ACCESS_TOKEN") or _get_graph_token()
onedrive_folder = os.getenv("ONEDRIVE_FOLDER","/audit")
onedrive_ret_days = int(os.getenv("ONEDRIVE_RETENTION_DAYS","90"))
if onedrive_token:
    try:
        import requests
        base = "https://graph.microsoft.com/v1.0"
        with open(OUTFILE, "rb") as f2:
            up = requests.put(f"{base}/me/drive/root:{onedrive_folder}/{os.path.basename(OUTFILE)}:/content",
                              headers={"Authorization": f"Bearer {onedrive_token}"}, data=f2.read(), timeout=20)
            if up.status_code >= 300:
                print(f"<OneDrive upload failed: {up.status_code} {up.text[:200]}>")
            else:
                print(f"Uploaded to OneDrive: {onedrive_folder}/{os.path.basename(OUTFILE)}")
        # Retention
        from datetime import timedelta
        cutoff = datetime.now(timezone.utc) - timedelta(days=onedrive_ret_days)
        resp = requests.get(f"{base}/me/drive/root:{onedrive_folder}:/children",
                            headers={"Authorization": f"Bearer {onedrive_token}"}, timeout=10)
        if resp.ok:
            for item in resp.json().get("value", []):
                lm = item.get("lastModifiedDateTime")
                fid = item.get("id"); name = item.get("name")
                if lm and fid:
                    lm_dt = datetime.fromisoformat(lm.replace("Z","+00:00"))
                    if lm_dt < cutoff:
                        requests.delete(f"{base}/me/drive/items/{fid}",
                                        headers={"Authorization": f"Bearer {onedrive_token}"}, timeout=8)
                        print(f"Deleted old OneDrive file: {name}")
    except Exception as e:
        print(f"<OneDrive export failed: {e}>")

# SharePoint
sp_token = os.getenv("SHAREPOINT_ACCESS_TOKEN") or onedrive_token or _get_graph_token()
sp_site_id = os.getenv("SHAREPOINT_SITE_ID")
sp_drive_id = os.getenv("SHAREPOINT_DRIVE_ID")
sp_folder = os.getenv("SHAREPOINT_FOLDER","/audit")
sp_ret_days = int(os.getenv("SHAREPOINT_RETENTION_DAYS","90"))
if sp_token and sp_site_id and sp_drive_id:
    try:
        import requests
        base = "https://graph.microsoft.com/v1.0"
        with open(OUTFILE, "rb") as f2:
            up = requests.put(f"{base}/sites/{sp_site_id}/drives/{sp_drive_id}/root:{sp_folder}/{os.path.basename(OUTFILE)}:/content",
                              headers={"Authorization": f"Bearer {sp_token}"}, data=f2.read(), timeout=20)
            if up.status_code >= 300:
                print(f"<SharePoint upload failed: {up.status_code} {up.text[:200]}>")
            else:
                print(f"Uploaded to SharePoint: {sp_folder}/{os.path.basename(OUTFILE)}")
        # Retention
        from datetime import timedelta
        cutoff = datetime.now(timezone.utc) - timedelta(days=sp_ret_days)
        resp = requests.get(f"{base}/sites/{sp_site_id}/drives/{sp_drive_id}/root:{sp_folder}:/children",
                            headers={"Authorization": f"Bearer {sp_token}"}, timeout=10)
        if resp.ok:
            for item in resp.json().get("value", []):
                lm = item.get("lastModifiedDateTime")
                fid = item.get("id"); name = item.get("name")
                if lm and fid:
                    lm_dt = datetime.fromisoformat(lm.replace("Z","+00:00"))
                    if lm_dt < cutoff:
                        requests.delete(f"{base}/sites/{sp_site_id}/drives/{sp_drive_id}/items/{fid}",
                                        headers={"Authorization": f"Bearer {sp_token}"}, timeout=8)
                        print(f"Deleted old SharePoint file: {name}")
    except Exception as e:
        print(f"<SharePoint export failed: {e}>")

# --- SFTP upload & retention ---
sftp_host = os.getenv("SFTP_HOST")
if sftp_host:
    try:
        import paramiko, time, os as _os
        sftp_port = int(os.getenv("SFTP_PORT","22"))
        sftp_user = os.getenv("SFTP_USERNAME")
        sftp_pass = os.getenv("SFTP_PASSWORD")
        sftp_key = os.getenv("SFTP_PRIVATE_KEY")
        sftp_passphrase = os.getenv("SFTP_PASSPHRASE")
        remote_dir = os.getenv("SFTP_REMOTE_DIR","/audit")
        transport = paramiko.Transport((sftp_host, sftp_port))
        if sftp_key and _os.path.exists(sftp_key):
            pkey = None
            for key_cls in (paramiko.RSAKey, paramiko.Ed25519Key, paramiko.ECDSAKey, paramiko.DSSKey):
                try:
                    pkey = key_cls.from_private_key_file(sftp_key, password=sftp_passphrase)
                    break
                except Exception:
                    continue
            if pkey is None:
                raise RuntimeError("Unsupported/invalid private key format")
            transport.connect(username=sftp_user, pkey=pkey)
        else:
            transport.connect(username=sftp_user, password=sftp_pass)
        sftp = paramiko.SFTPClient.from_transport(transport)
        # Ensure remote dir
        try:
            sftp.chdir(remote_dir)
        except Exception:
            parts = [p for p in remote_dir.strip("/").split("/") if p]
            path = ""
            for p in parts:
                path += "/" + p
                try: sftp.mkdir(path)
                except Exception: pass
            sftp.chdir(remote_dir)
        dest = remote_dir.rstrip("/") + "/" + os.path.basename(OUTFILE)
        sftp.put(OUTFILE, dest)
        print(f"Uploaded to SFTP: {dest}")
        # Verification
        verify = os.getenv("SFTP_VERIFY","off").lower()
        try:
            if verify in ("size","sha256"):
                import hashlib
                lsize = os.path.getsize(OUTFILE)
                rstat = sftp.stat(dest)
                if verify == "size" and int(rstat.st_size) != int(lsize):
                    print(f"<SFTP verify size mismatch: local {lsize} vs remote {rstat.st_size}>")
                elif verify == "sha256":
                    h_local = hashlib.sha256()
                    with open(OUTFILE,"rb") as lf:
                        for chunk in iter(lambda: lf.read(65536), b""):
                            h_local.update(chunk)
                    h_remote = hashlib.sha256()
                    with sftp.open(dest, 'rb') as rf:
                        while True:
                            data = rf.read(65536)
                            if not data: break
                            h_remote.update(data)
                    if h_local.hexdigest() != h_remote.hexdigest():
                        print(f"<SFTP verify sha256 mismatch>")
                    else:
                        print("SFTP verify sha256 OK")
        except Exception as ve:
            print(f"<SFTP verify failed: {ve}>")
        # Retention
        ret_days = int(os.getenv("SFTP_RETENTION_DAYS","0"))
        if ret_days > 0:
            cutoff = time.time() - ret_days*86400
            for attr in sftp.listdir_attr(remote_dir):
                fname = attr.filename
                if (fname.endswith(".csv") or fname.endswith(".gpg") or fname.endswith(".pgp")) and attr.st_mtime < cutoff:
                    try:
                        sftp.remove(remote_dir.rstrip("/") + "/" + fname)
                        print(f"Deleted old SFTP file: {fname}")
                    except Exception:
                        pass
        sftp.close(); transport.close()
    except Exception as e:
        print(f"<SFTP upload failed: {e}>")
