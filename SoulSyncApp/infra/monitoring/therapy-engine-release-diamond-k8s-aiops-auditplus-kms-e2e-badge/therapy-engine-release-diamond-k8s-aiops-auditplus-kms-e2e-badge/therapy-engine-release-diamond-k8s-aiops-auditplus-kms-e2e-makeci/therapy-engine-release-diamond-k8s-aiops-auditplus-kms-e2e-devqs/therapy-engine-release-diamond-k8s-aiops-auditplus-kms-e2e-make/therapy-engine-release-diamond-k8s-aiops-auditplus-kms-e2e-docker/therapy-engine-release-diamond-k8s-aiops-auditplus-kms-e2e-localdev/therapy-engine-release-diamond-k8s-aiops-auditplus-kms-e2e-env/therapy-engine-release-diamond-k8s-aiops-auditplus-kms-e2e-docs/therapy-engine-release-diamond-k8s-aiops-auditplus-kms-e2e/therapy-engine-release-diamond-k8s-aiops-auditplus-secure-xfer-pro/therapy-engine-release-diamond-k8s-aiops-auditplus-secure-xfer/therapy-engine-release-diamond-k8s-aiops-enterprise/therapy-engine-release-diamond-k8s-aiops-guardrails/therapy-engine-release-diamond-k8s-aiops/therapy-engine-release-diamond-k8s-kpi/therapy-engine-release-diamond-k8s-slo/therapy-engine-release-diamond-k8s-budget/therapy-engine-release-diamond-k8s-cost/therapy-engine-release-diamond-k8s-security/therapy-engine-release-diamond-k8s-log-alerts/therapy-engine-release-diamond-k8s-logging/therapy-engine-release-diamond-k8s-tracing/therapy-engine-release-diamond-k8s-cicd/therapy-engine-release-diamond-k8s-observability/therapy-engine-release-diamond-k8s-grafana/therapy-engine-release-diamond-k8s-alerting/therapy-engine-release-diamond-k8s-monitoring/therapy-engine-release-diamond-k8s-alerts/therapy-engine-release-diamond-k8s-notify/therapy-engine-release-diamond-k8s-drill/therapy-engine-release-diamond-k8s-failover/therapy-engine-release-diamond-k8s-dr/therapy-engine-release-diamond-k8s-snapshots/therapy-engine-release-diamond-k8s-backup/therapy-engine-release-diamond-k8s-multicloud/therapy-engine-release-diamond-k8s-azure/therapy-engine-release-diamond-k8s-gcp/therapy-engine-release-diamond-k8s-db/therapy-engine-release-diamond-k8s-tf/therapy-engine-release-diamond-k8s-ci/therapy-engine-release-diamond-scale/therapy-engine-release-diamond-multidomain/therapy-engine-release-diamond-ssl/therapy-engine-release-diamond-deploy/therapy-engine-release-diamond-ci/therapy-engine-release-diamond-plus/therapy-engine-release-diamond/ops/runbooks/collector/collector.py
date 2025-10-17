import os, tarfile, io, time, json, requests
from kubernetes import client, config
from datetime import datetime, timezone

def k8s():
    try:
        config.load_incluster_config()
    except Exception:
        config.load_kube_config()
    return client.CoreV1Api(), client.AppsV1Api(), client.EventsV1Api()

def write_text(tar, path, text):
    data = text.encode("utf-8", "ignore")
    info = tarfile.TarInfo(name=path)
    info.size = len(data)
    info.mtime = int(time.time())
    tar.addfile(info, io.BytesIO(data))

def main():
    ns = os.getenv("TARGET_NAMESPACE","default")
    label = os.getenv("APP_LABEL","therapy-backend")
    metric = os.getenv("METRIC","unknown")
    reasons = json.loads(os.getenv("REASONS_JSON","[]"))
    score = os.getenv("SCORE","0")
    explanation = json.loads(os.getenv("EXPLANATION_JSON","{}"))
    prom = os.getenv("PROM_URL","http://prometheus-server.default.svc")
    s3_bucket = os.getenv("S3_BUCKET","")
    s3_prefix = os.getenv("S3_PREFIX","runbooks")
    runbook_id = os.getenv("RUNBOOK_ID","0000")
    now = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    core, apps, evapi = k8s()

    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w:gz") as tar:
        write_text(tar, "meta.json", json.dumps({
            "timestamp": now, "namespace": ns, "app_label": label,
            "metric": metric, "reasons": reasons, "score": score,
            "explanation": explanation
        }, indent=2))

        pods = core.list_namespaced_pod(ns, label_selector=f"app={label}").items
        write_text(tar, "pods.json", json.dumps([p.to_dict() for p in pods], default=str))
        for p in pods:
            name = p.metadata.name
            try:
                logs = core.read_namespaced_pod_log(name=name, namespace=ns, tail_lines=500)
            except Exception as e:
                logs = f"<error fetching logs: {e}>"
            write_text(tar, f"logs/{name}.log", logs)

        try:
            deps = apps.list_namespaced_deployment(ns, label_selector=f"app={label}").items
            write_text(tar, "deployments.json", json.dumps([d.to_dict() for d in deps], default=str))
        except Exception as e:
            write_text(tar, "deployments.json", json.dumps({"error": str(e)}))

        try:
            events = evapi.list_namespaced_event(ns).items
            write_text(tar, "events.json", json.dumps([e.to_dict() for e in events], default=str))
        except Exception as e:
            write_text(tar, "events.json", json.dumps({"error": str(e)}))

        try:
            r = requests.get(prom.rstrip("/") + "/api/v1/query", params={"query": metric}, timeout=10)
            write_text(tar, "prometheus_query.json", r.text)
        except Exception as e:
            write_text(tar, "prometheus_query.json", json.dumps({"error": str(e)}))

    buf.seek(0)

    # S3 upload
    if s3_bucket:
        try:
            import boto3
            s3 = boto3.client("s3", region_name=os.getenv("AWS_REGION","eu-central-1"))
            key = f"{s3_prefix}/{now}-{runbook_id}-{metric.replace(':','_')}.tar.gz"
            s3.upload_fileobj(buf, s3_bucket, key)
            print(f"s3://{s3_bucket}/{key}")
        except Exception as e:
            print(f"<s3 upload failed: {e}>")

    # GCS upload
    if os.getenv("GCS_BUCKET"):
        try:
            from google.cloud import storage
            gcs = storage.Client()
            bucket = gcs.bucket(os.getenv("GCS_BUCKET"))
            prefix = os.getenv("GCS_PREFIX","runbooks")
            key = f"{prefix}/{now}-{runbook_id}-{metric.replace(':','_')}.tar.gz"
            blob = bucket.blob(key)
            buf.seek(0)
            blob.upload_from_file(buf, rewind=True)
            print(f"gs://{os.getenv('GCS_BUCKET')}/{key}")
        except Exception as e:
            print(f"<gcs upload failed: {e}>")

    # Azure Blob upload
    if os.getenv("AZURE_STORAGE_ACCOUNT") and os.getenv("AZURE_STORAGE_KEY") and os.getenv("AZURE_CONTAINER"):
        try:
            from azure.storage.blob import BlobServiceClient
            account = os.getenv("AZURE_STORAGE_ACCOUNT")
            key = os.getenv("AZURE_STORAGE_KEY")
            container = os.getenv("AZURE_CONTAINER")
            prefix = os.getenv("AZURE_PREFIX","runbooks")
            blob_service = BlobServiceClient(account_url=f"https://{account}.blob.core.windows.net/", credential=key)
            blob_client = blob_service.get_blob_client(container=container, blob=f"{prefix}/{now}-{runbook_id}-{metric.replace(':','_')}.tar.gz")
            buf.seek(0)
            blob_client.upload_blob(buf, overwrite=True)
            print(f"https://{account}.blob.core.windows.net/{container}/{prefix}/{now}-{runbook_id}-{metric.replace(':','_')}.tar.gz")
        except Exception as e:
            print(f"<azure upload failed: {e}>")

if __name__ == "__main__":
    main()
