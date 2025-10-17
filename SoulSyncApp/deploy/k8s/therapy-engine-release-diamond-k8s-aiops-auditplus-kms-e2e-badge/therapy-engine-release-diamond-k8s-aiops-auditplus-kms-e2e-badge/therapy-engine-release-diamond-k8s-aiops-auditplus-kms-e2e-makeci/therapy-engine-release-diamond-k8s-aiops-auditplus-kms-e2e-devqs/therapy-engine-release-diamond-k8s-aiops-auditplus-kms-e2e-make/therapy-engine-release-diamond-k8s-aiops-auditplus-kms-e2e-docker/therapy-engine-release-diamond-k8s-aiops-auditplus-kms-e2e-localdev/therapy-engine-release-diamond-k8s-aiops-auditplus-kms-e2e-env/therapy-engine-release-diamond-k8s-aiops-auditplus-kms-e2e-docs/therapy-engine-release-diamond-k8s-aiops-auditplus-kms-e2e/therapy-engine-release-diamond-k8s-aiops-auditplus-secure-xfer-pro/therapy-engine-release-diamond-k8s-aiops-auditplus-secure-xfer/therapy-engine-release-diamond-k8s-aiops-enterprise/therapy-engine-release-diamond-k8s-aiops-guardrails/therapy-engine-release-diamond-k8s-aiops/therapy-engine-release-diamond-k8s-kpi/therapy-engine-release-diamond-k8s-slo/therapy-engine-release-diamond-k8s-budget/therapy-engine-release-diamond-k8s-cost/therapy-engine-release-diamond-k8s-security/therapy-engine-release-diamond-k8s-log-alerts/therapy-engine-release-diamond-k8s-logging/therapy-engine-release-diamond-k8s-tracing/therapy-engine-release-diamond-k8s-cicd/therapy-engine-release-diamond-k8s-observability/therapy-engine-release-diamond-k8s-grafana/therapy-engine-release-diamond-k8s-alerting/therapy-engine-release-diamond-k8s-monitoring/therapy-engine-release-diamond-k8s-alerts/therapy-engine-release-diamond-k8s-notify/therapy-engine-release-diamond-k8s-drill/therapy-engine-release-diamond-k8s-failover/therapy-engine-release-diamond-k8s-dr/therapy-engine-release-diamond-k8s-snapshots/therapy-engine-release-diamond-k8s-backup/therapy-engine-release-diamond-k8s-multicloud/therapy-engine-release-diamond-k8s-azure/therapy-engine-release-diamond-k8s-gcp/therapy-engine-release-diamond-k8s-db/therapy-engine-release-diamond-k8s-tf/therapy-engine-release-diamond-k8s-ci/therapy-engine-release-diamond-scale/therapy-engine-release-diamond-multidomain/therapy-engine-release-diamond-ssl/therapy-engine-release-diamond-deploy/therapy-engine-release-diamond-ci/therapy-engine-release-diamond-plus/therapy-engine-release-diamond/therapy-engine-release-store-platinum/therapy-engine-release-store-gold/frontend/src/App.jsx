import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { SignInWithApple } from '@capacitor-community/apple-sign-in';
import { FingerprintAuth } from '@capacitor/fingerprint-auth';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Preferences } from '@capacitor/preferences';
import React, { useMemo, useState, useRef, useEffect } from "react";
import demoTherapy from "./demo_therapy.json";
import { t } from "./i18n";
import { motion } from "framer-motion";
import { Download, FileUp, FileText, Wand2, ClipboardList, Brain, Heart, Sparkles, Zap, ShieldCheck, FlaskConical, Gauge, FileJson, FileType2, RotateCcw } from "lucide-react";

const CHAKRAS = [
  { key: "root", name: "1) Root — Muladhara", color: "#E11D48" },
  { key: "sacral", name: "2) Sacral — Svadhisthana", color: "#F97316" },
  { key: "solar", name: "3) Solar Plexus — Manipura", color: "#F59E0B" },
  { key: "heart", name: "4) Heart — Anahata", color: "#10B981" },
  { key: "throat", name: "5) Throat — Vishuddha", color: "#3B82F6" },
  { key: "thirdEye", name: "6) Third Eye — Ajna", color: "#8B5CF6" },
  { key: "crown", name: "7) Crown — Sahasrara", color: "#A855F7" },
];

const HZ_MAP = { root:396, sacral:417, solar:528, heart:639, throat:741, thirdEye:852, crown:963 };

const NUTRITION_POLICY = {
  carbs: ["potatoes", "sweet potatoes", "white rice", "fruit", "lactose (dairy)", "honey"],
  proteins: ["red meat", "eggs", "dairy", "organs (liver, heart, kidneys)", "fish", "oysters"],
  fats: ["butter/ghee", "beef tallow", "dairy fat", "egg yolks", "coconut oil", "olive oil", "avocado"],
  avoid: [
    "PUFA seed oils (sunflower, soybean, canola, etc.)",
    "nuts & seeds",
    "oats",
    "leafy/stem vegetables (antinutrients)",
    "fish oil supplements (use whole seafood instead)",
  ],
  notes: [
    "Cholesterol is vital for hormones (T, progesterone, Vit D).",
    "Fruit/fructose are fine; obesity is about empty calories + sedentarism.",
    "Salt is essential; balance sodium/potassium.",
  ],
};

const LIKERT = [
  { v: 0, label: "Never" },
  { v: 1, label: "Rarely" },
  { v: 2, label: "Sometimes" },
  { v: 3, label: "Often" },
  { v: 4, label: "Always" },
];

function clamp(min, v, max) { return Math.max(min, Math.min(max, v)); }
function scoreChakras(answers) {
  const sums = {};
  CHAKRAS.forEach(({ key }) => {
    const arr = answers[key] || [];
    const total = arr.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
    const avg = arr.length ? total / arr.length : 0;
    sums[key] = { total, avg, pct: Math.round((avg / 4) * 100) };
  });
  return sums;
}
function pickPrimaryChakras(scores, count = 2) {
  const entries = Object.entries(scores);
  entries.sort((a, b) => a[1].avg - b[1].avg);
  return entries.slice(0, count).map(([k]) => k);
}
function f0ScoreFromChakras(scores) {
  const h = scores.heart?.avg ?? 0;
  const c = scores.crown?.avg ?? 0;
  const e = scores.thirdEye?.avg ?? 0;
  const r = scores.root?.avg ?? 0;
  const s = scores.solar?.avg ?? 0;
  const base = (h + c + e) / 12; // 0..1
  const drag = (r + s) / 8; // 0..1
  const raw = clamp(0, base * 0.7 + (1 - drag) * 0.3, 1);
  return Number(raw.toFixed(2));
}
function hzPlan(primaryChakras) {
  const unique = Array.from(new Set(primaryChakras));
  return unique.map(key => ({ chakra: key, hz: HZ_MAP[key] }));
}

function TherapyEngineApp() {

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onStep, setOnStep] = useState(1);
  useEffect(()=>{
    const seen = localStorage.getItem('onboardingSeen') === '1';
    if (!seen) setShowOnboarding(true);
  },[]);
  function finishOnboarding(){
    localStorage.setItem('onboardingSeen','1');
    setShowOnboarding(false);
  }


  const [showAdmin, setShowAdmin] = useState(false);
  const [stats, setStats] = useState(null);
  async function loadStats(){
    const r = await fetch((import.meta.env.VITE_API_URL || "http://localhost:5050") + "/admin/stats", { headers: token? { Authorization: "Bearer " + token } : {} });
    const j = await r.json(); setStats(j);
  }


  async function goPremiumIAP() {
    try {
      const mod = await import('../../mobile/iap/iapClient.js');
      const out = await mod.buyPremiumViaIAP('premium_monthly');
      if (out.ok) { alert('Purchase completed. Thank you!'); await loadPremium(); }
      else { alert('IAP not available: ' + (out.error||'')); }
    } catch (e) { alert('IAP init failed'); console.error(e); }
  }

  const urlDemo = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('demo') === '1';
  useEffect(()=>{ if (urlDemo) setTherapy(demoTherapy); },[]);

  useEffect(()=>{
    const API = (import.meta.env.VITE_API_URL || "http://localhost:5050");
    const orig = window.fetch.bind(window);
    window.fetch = async (input, init={}) => {
      let res = await orig(input, init);
      if (res && res.status === 401) {
        const rt = localStorage.getItem('refreshToken');
        if (rt) {
          try {
            const r = await orig(API + "/auth/refresh", { method:'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ refresh_token: rt }) });
            if (r.ok) {
              const jj = await r.json();
              if (jj.token) await setTokenPersist(jj.token);
              if (jj.refresh_token) localStorage.setItem('refreshToken', jj.refresh_token);
              if (init && init.headers) {
                init = { ...init, headers: { ...init.headers, Authorization: 'Bearer ' + (jj.token || '') } };
              }
              res = await orig(input, init);
            }
          } catch {}
        }
      }
      return res;
    };
  }, []);


  useEffect(()=>{
    const ask = localStorage.getItem('pushOpt');
    if (token && (ask===null)) setShowPushOpt(true);
  }, [token]);


  const [premium, setPremium] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  async function loadPremium() {
    try {
      const provider = (remoteFlags && remoteFlags.billingProvider) || 'stripe';
      const url = provider === 'revenuecat'
        ? ((import.meta.env.VITE_API_URL || "http://localhost:5050") + "/billing/revenuecat/status")
        : ((import.meta.env.VITE_API_URL || "http://localhost:5050") + "/billing/status");
      const r = await fetch(url, { headers: token? { Authorization: "Bearer " + token } : {} });
      const j = await r.json(); setPremium(!!j.premium);
    } catch {}
  } : {} });
      const j = await r.json(); setPremium(!!j.premium);
    } catch {}
  }
  async function goPremium() {
    try {
      const r = await fetch((import.meta.env.VITE_API_URL || "http://localhost:5050") + "/billing/create-checkout-session", { method: "POST", headers: token? { Authorization: "Bearer " + token } : {} });
      const j = await r.json(); if (j.url) window.location.href = j.url; else alert(j.error||'Billing not configured');
    } catch (e) { alert('Billing failed'); }
  }


  const [showSettings, setShowSettings] = useState(false);
  const [highContrast, setHighContrast] = useState(localStorage.getItem('hc')==='1');
  const [telemetry, setTelemetry] = useState(localStorage.getItem('telemetry') || '0');
  const [analytics, setAnalytics] = useState(localStorage.getItem('analytics') || '0');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');

  useEffect(()=>{
    const root = document.documentElement;
    if (theme === 'dark' || (theme==='system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  useEffect(()=>{ localStorage.setItem('lang', lang); }, [lang]);
  useEffect(()=>{
    try{
      const root = document.documentElement;
      if (highContrast) root.classList.add('hc'); else root.classList.remove('hc');
      localStorage.setItem('hc', highContrast?'1':'0');
    }catch{}
  }, [highContrast]);

  useEffect(()=>{ localStorage.setItem('telemetry', telemetry); }, [telemetry]);
  useEffect(()=>{ localStorage.setItem('analytics', analytics); }, [analytics]);

  async function exportMyData() {
    try {
      const r = await fetch((import.meta.env.VITE_API_URL || "http://localhost:5050") + "/me/export", { headers: token? { Authorization: "Bearer " + token } : {} });
      if (!r.ok) throw new Error('Export failed');
      const j = await r.json();
      const blob = new Blob([JSON.stringify(j,null,2)], { type: 'application/json' });
      const a = document.createElement('a'); const url = URL.createObjectURL(blob);
      a.href = url; a.download = 'my-data.json'; a.click(); URL.revokeObjectURL(url);
    } catch (e) { alert('Export failed'); }
  }
  async function deleteMyAccount() {
    if (!confirm('Delete your account and all data? This cannot be undone.')) return;
    try {
      const r = await fetch((import.meta.env.VITE_API_URL || "http://localhost:5050") + "/me", { method: 'DELETE', headers: token? { Authorization: "Bearer " + token } : {} });
      if (!r.ok) throw new Error('Delete failed');
      await setTokenPersist('');
      alert('Account deleted.');
    } catch (e) { alert('Delete failed'); }
  }


  async function loginWithGoogle() {
    try {
      await GoogleAuth.initialize({ clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID, scopes: ['profile','email'] });
      const g = await GoogleAuth.signIn();
      const id_token = g?.authentication?.idToken || g?.idToken;
      if (!id_token) throw new Error('No id_token');
      const r = await fetch((import.meta.env.VITE_API_URL || "http://localhost:5050") + "/auth/oauth/google", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ id_token })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'OAuth failed');
      await setTokenPersist(j.token);
      await initPushRegistration();
    } catch (e) { alert('Google login failed'); console.error(e); }
  }
  async function loginWithApple() {
    try {
      const resp = await SignInWithApple.authorize({ clientId: import.meta.env.VITE_APPLE_CLIENT_ID, redirectURI: 'https://localhost/callback', scopes: 'email name', state: 'state123', nonce: 'nonce' });
      const id_token = resp?.response?.identityToken;
      if (!id_token) throw new Error('No identityToken');
      const r = await fetch((import.meta.env.VITE_API_URL || "http://localhost:5050") + "/auth/oauth/apple", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ id_token })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'OAuth failed');
      await setTokenPersist(j.token);
      await initPushRegistration();
    } catch (e) { alert('Apple login failed'); console.error(e); }
  }


  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [locked, setLocked] = useState(false);

  async function checkBiometricAvailability() {
    try {
      const avail = await FingerprintAuth.isAvailable();
      return avail?.isAvailable;
    } catch { return false; }
  }
  async function enableBiometricLock() {
    const ok = await checkBiometricAvailability();
    if (!ok) { alert('Biometrics not available'); return; }
    setBiometricEnabled(true);
    await Preferences.set({ key: 'biometricEnabled', value: '1' });
    alert('Biometric lock enabled.');
  }
  async function disableBiometricLock() {
    setBiometricEnabled(false);
    await Preferences.remove({ key: 'biometricEnabled' });
    alert('Biometric lock disabled.');
  }
  async function unlockWithBiometrics() {
    try {
      const result = await FingerprintAuth.authenticate({ reason: 'Unlock TherapyEngine' });
      if (result?.verified) setLocked(false);
    } catch (e) { console.error('biometric auth failed', e); }
  }


  async function initPushRegistration() {
    try {
      const perm = await PushNotifications.requestPermissions();
      if (perm.receive !== 'granted') return;
      await PushNotifications.register();

      PushNotifications.addListener('registration', async (tokenObj) => {
        try {
          const platform = Capacitor.getPlatform();
          const tokenValue = tokenObj.value;
          await fetch((import.meta.env.VITE_API_URL || "http://localhost:5050") + "/push/register", {
            method: "POST",
            headers: { "Content-Type":"application/json", ...(token? { Authorization: "Bearer " + token } : {}) },
            body: JSON.stringify({ platform, token: tokenValue })
          });
        } catch (e) { console.error('send token failed', e); }
      });

      PushNotifications.addListener('registrationError', (err) => {
        console.error('push registration error', err);
      });

      PushNotifications.addListener('pushNotificationReceived', (notif) => {
        console.log('push received', notif);
      });

    } catch (e) {
      console.error('initPushRegistration failed', e);
    }
  }

  async function scheduleFiveDayReminders(therapy) {
    try {
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display !== 'granted') return;
      const now = new Date();
      const notifications = (therapy?.diet || []).map((d, i) => {
        const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, 9, 0, 0, 0); // 9:00 local time
        return {
          id: 100 + i,
          title: `Day ${i+1}: ${d.title}`,
          body: d.focus || 'Check your plan for today.',
          schedule: { at },
          sound: undefined,
          attachments: undefined,
          actionTypeId: "",
          extra: { day: i+1 }
        };
      });
      await LocalNotifications.schedule({ notifications });
      alert('Scheduled 5-day reminders at 09:00.');
    } catch (e) {
      console.error('scheduleFiveDayReminders failed', e);
    }
  }


  async function saveTherapyFile(filename, content) {
    try {
      await Filesystem.writeFile({ path: filename, data: content, directory: 'Documents' });
      alert('Saved to Documents/' + filename);
    } catch (e) {
      console.error('Save failed', e);
    }
  }

  async function shareTherapy(content, filename) {
    try {
      await Share.share({ title: 'Therapy Report', text: content, dialogTitle: 'Share via', url: undefined });
    } catch (e) {
      console.error('Share failed', e);
    }
  }


  // Load token from Preferences on mount
  useEffect(()=>{
    (async()=>{
      const { value } = await Preferences.get({ key: 'token' });
      if (value) setToken(value);
    })();
  },[]);

  useEffect(()=>{
    (async()=>{
      const be = await Preferences.get({ key: 'biometricEnabled' });
      if (be?.value === '1') { setBiometricEnabled(true); setLocked(true); await unlockWithBiometrics(); }
    })();
  },[]);



  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [authMode, setAuthMode] = useState("login"); // or 'register'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [myTherapies, setMyTherapies] = useState([]);

  async function setTokenPersist(t) {
    if (t) { await Preferences.set({ key: 'token', value: t }); } else { await Preferences.remove({ key: 'token' }); }
    setToken(t);
    if (t) localStorage.setItem("token", t); else localStorage.removeItem("token");
  }

  async function authCall(path) {
    const url = (import.meta.env.VITE_API_URL || "http://localhost:5050") + path;
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    if (!r.ok) throw new Error("Auth failed");
    const j = await r.json();
    if (j.token) { await setTokenPersist(j.token); if (j.refresh_token) localStorage.setItem('refreshToken', j.refresh_token); await initPushRegistration(); setRequiresTerms(!!j.requiresTerms); setTermsVersion(j.termsVersion||'1'); if (j.requiresTerms) setShowLegal(true); await loadPremium(); try { const m = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:5050') + '/me', { headers: { Authorization: 'Bearer ' + j.token } }); const u = await m.json(); setIsAdmin(u?.role==='admin'); } catch {} }
    return j;
  }

  async function loadMyTherapies() {
    const url = (import.meta.env.VITE_API_URL || "http://localhost:5050") + "/api/therapies";
    const r = await fetch(url, { headers: token ? { Authorization: "Bearer " + token } : {} });
    const j = await r.json();
    setMyTherapies(j);
  }

  const [tab, setTab] = useState("prompt");
  const [freeText, setFreeText] = useState("");
  const [files, setFiles] = useState([]);
  const [parsedLabs, setParsedLabs] = useState({});
  const [answers, setAnswers] = useState(() => {
    const o = {}; CHAKRAS.forEach(({ key }) => o[key] = Array(20).fill(null)); return o;
  });
  const [showFollowUps, setShowFollowUps] = useState(false);
  const [followUps, setFollowUps] = useState([]);
  const [followUpAnswers, setFollowUpAnswers] = useState([]);
  const [therapy, setTherapy] = useState(null);
  const [requiresTerms, setRequiresTerms] = useState(false);
  const [termsVersion, setTermsVersion] = useState('1');
  const [brandName, setBrandName] = useState('TherapyEngine');
  const [brandPrimary, setBrandPrimary] = useState('#111827');
  const [remoteFlags, setRemoteFlags] = useState({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [geoCountry, setGeoCountry] = useState('XX');
  const [psyAvailable, setPsyAvailable] = useState(true);
  const outputRef = useRef(null);

  const scores = useMemo(() => scoreChakras(answers), [answers]);

  useEffect(()=>{
    if (analytics !== '1') return;
    const d = (import.meta.env.VITE_PLAUSIBLE_DOMAIN || '');
    if (d) {
      const s = document.createElement('script');
      s.setAttribute('defer','');
      s.setAttribute('data-domain', d);
      s.src = 'https://plausible.io/js/script.js';
      document.head.appendChild(s);
    } else {
      fetch((import.meta.env.VITE_API_URL || "http://localhost:5050") + "/analytics/track", { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ event:'app_open', props:{ ts: Date.now() }})});
    }
  }, [analytics]);

  useEffect(()=>{
    fetch((import.meta.env.VITE_API_URL || "http://localhost:5050") + "/geo").then(r=>r.json()).then(j=> setGeoCountry(j.country || 'XX')).catch(()=>{});
  },[]);


  function onFileChange(e) {
    const fl = Array.from(e.target.files || []);
    setFiles(fl);
    fl.forEach(f => {
      if (/\.(txt|csv|json)$/i.test(f.name)) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const s = String(reader.result || "");
            const labs = extractLabsFromText(s);
            setParsedLabs(prev => ({ ...prev, ...labs }));
          } catch {}
        };
        reader.readAsText(f);
      }
    });
  }

  function extractLabsFromText(txt) {
    const out = {};
    const patterns = {
      hemoglobin: /(hemoglobin|hb)[:\s]*([0-9]+\.?[0-9]*)/i,
      tsh: /(tsh)[:\s]*([0-9]+\.?[0-9]*)/i,
      vitaminD: /(vit\s*D|25\(OH\)D|vitamin\s*d)[:\s]*([0-9]+\.?[0-9]*)/i,
      crp: /(crp)[:\s]*([0-9]+\.?[0-9]*)/i,
    };
    for (let k in patterns) {
      const m = (txt||"").match(patterns[k]);
      if (m) out[k] = parseFloat(m[2]);
    }
    return out;
  }

  function scoreToF0(sc) {
    return f0ScoreFromChakras(sc);
  }

  async function exportPDF() {
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    const node = outputRef.current;
    if (!node) return;
    const canvas = await html2canvas(node, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 40;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    if (imgHeight < pageHeight) {
      pdf.addImage(imgData, "PNG", 20, 20, imgWidth, imgHeight);
    } else {
      let h = imgHeight;
      let sX = 0, sY = 0, sWidth = canvas.width, sHeight = Math.floor(canvas.width * (pageHeight - 40) / imgWidth);
      const pageCanvas = document.createElement("canvas");
      const pageCtx = pageCanvas.getContext("2d");
      pageCanvas.width = sWidth; pageCanvas.height = sHeight;
      while (h > 0) {
        pageCtx.clearRect(0, 0, sWidth, sHeight);
        pageCtx.drawImage(canvas, sX, sY, sWidth, sHeight, 0, 0, sWidth, sHeight);
        const pageData = pageCanvas.toDataURL("image/png");
        pdf.addImage(pageData, "PNG", 20, 20, imgWidth, pageHeight - 40);
        h -= sHeight; sY += sHeight;
        if (h > 0) pdf.addPage();
      }
    }
    pdf.save("therapy.pdf");
  }

  function downloadJSON() {
    const blob = new Blob([JSON.stringify(therapy, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "therapy.json"; a.click();
    URL.revokeObjectURL(url);
  }

  
  async function downloadFromBackend(path, payload, filename) {
    const url = (import.meta.env.VITE_API_URL || "http://localhost:5050") + path;
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...(token? { Authorization: "Bearer " + token } : {}) }, body: JSON.stringify(payload) });
    if (!r.ok) throw new Error("Export failed");
    const blob = await r.blob();
    const a = document.createElement("a");
    const obj = URL.createObjectURL(blob);
    a.href = obj; a.download = filename; a.click();
    URL.revokeObjectURL(obj);
  }

  function resetAll() {
    setFreeText(""); setFiles([]); setParsedLabs({});
    setAnswers(() => { const o = {}; CHAKRAS.forEach(({ key }) => o[key] = Array(20).fill(null)); return o; });
    setFollowUps([]); setFollowUpAnswers([]); setShowFollowUps(false);
    setTherapy(null);
  }

  async function callBackend(payload) {
    const url = (import.meta.env.VITE_API_URL || "http://localhost:5050") + "/api/generateTherapy";
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...(token? { Authorization: "Bearer " + token } : {}) }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error("Backend error");
      return await r.json();
    } catch (e) {
      return null;
    }
  }

  async function generateFromPrompt() {
    const payload = { mode: "prompt", text: freeText, labsText: Object.entries(parsedLabs).map(([k,v]) => `${k}:${v}`).join(" ") };
    const resp = await callBackend(payload);
    if (resp) { setTherapy(resp); return; }

    // Fallback local (if backend not running)
    const kw = (freeText || "").toLowerCase();
    const pattern = { root:[], sacral:[], solar:[], heart:[], throat:[], thirdEye:[], crown:[] };
    if (kw.includes("back") || kw.includes("lumbar")) pattern.root = Array(20).fill(1);
    if (kw.includes("anxiety")) pattern.solar = Array(20).fill(1.5);
    if (kw.includes("depression")) pattern.crown = Array(20).fill(1);
    if (kw.includes("prostatitis")) pattern.sacral = Array(20).fill(1);
    const sc = scoreChakras(pattern);
    const primary = pickPrimaryChakras(sc, 2);
    const f0 = scoreToF0(sc);
    const hz = hzPlan(primary);
    const smiles = { label: "Glycine-derived bio-photonic candidate", smiles:"NCC(=O)O", record:`[F0 ${f0} | EM Calming | SMILES NCC(=O)O]`, note:"For simulation only." };
    const diet = buildDiet(primary[0] || "root");
    const supps = buildSupps(null);
    setTherapy({ mode: "prompt", primaryChakras: primary, scores: sc, f0, hz, smiles, diet, supps, modules:["Nutrition","F0","Breath"], labs: parsedLabs, notes: safetyNotes(), textEcho: freeText.trim() });
  }

  function buildDiet(primary) {
    const baseDay = (title, focus, meals) => ({ title, focus, meals });
    const dairyPush = primary === "sacral";
    const proteinPush = primary === "root" || primary === "solar";
    const fruitHeart = primary === "heart" || primary === "crown";
    const meal = (name, items) => ({ name, items });
    return [
      baseDay("Day 1 — Energy & Hormones","Stabilize thyroid/adrenals; carb-protein balance.",[
        meal("Breakfast",[dairyPush ? "Raw/low-heat milk + honey" : "Eggs (3) fried in butter","Orange juice or ripe fruit"]),
        meal("Lunch",["Potatoes with butter/ghee", proteinPush ? "200–300g beef" : "Salmon (whole, not oil) + white rice"]),
        meal("Dinner",["Yogurt/kefir (if tolerated) or cottage cheese",fruitHeart ? "Berries + honey" : "Sweet potato"]),
      ]),
      baseDay("Day 2 — Neurotransmitters & Emotions","Support GABA/serotonin balance, calm focus.",[
        meal("Breakfast",["Omelet with cheese","Ripe fruit"]),
        meal("Lunch",["White rice","Oysters or lean beef","Bone broth"]),
        meal("Dinner",["Potatoes + butter","Greek yogurt (full fat)"]),
      ]),
      baseDay("Day 3 — Chakra Balance & Anti-inflammatory","Lower PUFA load, optimize mineral density.",[
        meal("Breakfast",["Raw milk latte (no seed oils)","Fruit"]),
        meal("Lunch",["Beef/lamb","Rice or potatoes","Liver (1–2×/wk)"]),
        meal("Dinner",["Cottage cheese","Honey","Baked sweet potato"]),
      ]),
      baseDay("Day 4 — Tissue & Hormone Regeneration","High-quality amino acids + cholesterol.",[
        meal("Breakfast",["Eggs + butter","Fruit"]),
        meal("Lunch",["Beef heart or steak","Potatoes with ghee"]),
        meal("Dinner",["Ricotta/yogurt","Honey + fruit"]),
      ]),
      baseDay("Day 5 — Integration & F₀ Resonance","Simplify, light dinner; heart-coherence practice.",[
        meal("Breakfast",["Milk + honey","Banana"]),
        meal("Lunch",["White fish (not oil)","Rice","Fruit"]),
        meal("Dinner",["Bone broth","Cottage cheese (small)","Early sleep"]),
      ]),
    ];
  }

  function buildSupps() {
    return [
      "Creatine monohydrate (3–5g/day)",
      "Magnesium glycinate (200–400mg/day)",
      "Zinc (food-first: oysters)",
      "Boron (low dose, cycles)",
      "Niacin (flush B3) — titrate, support blood flow",
      "Glycine (food-first: collagen/gelatin, liver)",
    ];
  }
  function safetyNotes() {
    return [
      "Educational prototype. Not medical advice. Consult qualified professionals.",
      "Use F₀ resonance filter: if F₀_score < 0.6, prioritize coherence practices before advanced modules.",
      "Psilocybin module only where legal, supervised, and clinically appropriate.",
      "Quantum/cheminformatics simulations do not imply human safety or efficacy.",
      "Avoid PUFA seed oils, nuts, oats, and leafy/stem vegetables per Nutrition & Lifestyle module.",
    ];
  }

  const scoresState = scores;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6" />
            <h1 className="text-xl font-bold">Therapy Engine — Dual‑Mode (Prompt ⟷ 140Q + 10 Follow‑ups)</h1>
          </div>
          
          <div className="flex items-center gap-2">

            {!token ? (
              <div className="flex items-center gap-2">
                <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email" className="px-2 py-1 rounded-lg border text-sm"/>
                <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="password" type="password" className="px-2 py-1 rounded-lg border text-sm"/>
                {authMode==="register" && (<label className="text-xs text-slate-600 flex items-center gap-2"><input type="checkbox" checked={acceptedTerms} onChange={e=>setAcceptedTerms(e.target.checked)} />{t(lang,"agreeTerms")}</label>)}
                <button onClick={()=>authCall(authMode==="login"?"/auth/login":"/auth/register")} className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-sm">{authMode==="login"?t(lang,"login"):t(lang,"register")}</button>
                <button onClick={()=>setAuthMode(authMode==="login"?"register":"login")} className="px-3 py-1.5 rounded-xl bg-slate-100 text-sm">{authMode==="login"?"Need account?":"Have account?"}</button>
                <button onClick={loginWithGoogle} className="px-3 py-1.5 rounded-xl bg-slate-100 text-sm">Google</button>
                <button onClick={loginWithApple} className="px-3 py-1.5 rounded-xl bg-slate-100 text-sm">Apple</button>
              {therapy && therapy.modules && !therapy.modules.includes("Psilocybin") && (<div className="text-xs text-slate-500">Note: Psilocybin module unavailable for your region ({geoCountry}).</div>)}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {!premium && (<><button onClick={goPremium} className="btn-brand">{t(lang,'goPremium')}</button><button onClick={goPremiumIAP} className="px-3 py-1.5 rounded-xl bg-yellow-200 text-sm">{t(lang,'buyViaStore')}</button></>)}
                <button onClick={loadMyTherapies} className="px-3 py-1.5 rounded-xl bg-slate-100 text-sm">{t(lang,'myTherapies')}</button>
                {!biometricEnabled ? (
                  <button onClick={enableBiometricLock} className="px-3 py-1.5 rounded-xl bg-slate-100 text-sm">{t(lang,'enableBiometric')}</button>
                ) : (
                  <button onClick={disableBiometricLock} className="px-3 py-1.5 rounded-xl bg-slate-100 text-sm">{t(lang,'disableBiometric')}</button>
                )}
                <button onClick={()=>setTokenPersist("")} className="px-3 py-1.5 rounded-xl bg-slate-100 text-sm">{t(lang,'logout')}</button>
              {therapy && therapy.modules && !therapy.modules.includes("Psilocybin") && (<div className="text-xs text-slate-500">Note: Psilocybin module unavailable for your region ({geoCountry}).</div>)}
              </div>
            )}

              <div className="flex items-center gap-2">
                <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email" className="px-2 py-1 rounded-lg border text-sm"/>
                <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="password" type="password" className="px-2 py-1 rounded-lg border text-sm"/>
                {authMode==="register" && (<label className="text-xs text-slate-600 flex items-center gap-2"><input type="checkbox" checked={acceptedTerms} onChange={e=>setAcceptedTerms(e.target.checked)} />{t(lang,"agreeTerms")}</label>)}
                <button onClick={()=>authCall(authMode==="login"?"/auth/login":"/auth/register")} className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-sm">{authMode==="login"?t(lang,"login"):t(lang,"register")}</button>
                <button onClick={()=>setAuthMode(authMode==="login"?"register":"login")} className="px-3 py-1.5 rounded-xl bg-slate-100 text-sm">{authMode==="login"?"Need account?":"Have account?"}</button>
              {therapy && therapy.modules && !therapy.modules.includes("Psilocybin") && (<div className="text-xs text-slate-500">Note: Psilocybin module unavailable for your region ({geoCountry}).</div>)}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {!premium && (<><button onClick={goPremium} className="btn-brand">{t(lang,'goPremium')}</button><button onClick={goPremiumIAP} className="px-3 py-1.5 rounded-xl bg-yellow-200 text-sm">{t(lang,'buyViaStore')}</button></>)}
                <button onClick={loadMyTherapies} className="px-3 py-1.5 rounded-xl bg-slate-100 text-sm">{t(lang,'myTherapies')}</button>
                <button onClick={()=>setTokenPersist("")} className="px-3 py-1.5 rounded-xl bg-slate-100 text-sm">{t(lang,'logout')}</button>
              {therapy && therapy.modules && !therapy.modules.includes("Psilocybin") && (<div className="text-xs text-slate-500">Note: Psilocybin module unavailable for your region ({geoCountry}).</div>)}
              </div>
            )}
          </div>

            <button onClick={resetAll} className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm flex items-center gap-2"><RotateCcw className="w-4 h-4"/>Reset</button>
            {therapy && (
              <>
                <button onClick={downloadJSON} className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm flex items-center gap-2"><FileJson className="w-4 h-4"/>JSON</button>
                <button onClick={exportPDF} className="px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-black text-sm flex items-center gap-2"><Download className="w-4 h-4"/>PDF</button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid md:grid-cols-5 gap-6">
        {locked && (<div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center"><div className="bg-white rounded-2xl p-6 text-center space-y-3"><div className="text-lg font-semibold">Locked</div><div className="text-sm text-slate-600">Authenticate to continue</div><button onClick={unlockWithBiometrics} className="px-4 py-2 rounded-xl bg-slate-900 text-white">Unlock</button></div></div>)}
        <section className="md:col-span-2 space-y-6">
          <div className="grid gap-4">
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={() => setTab("prompt")} className={`p-4 rounded-2xl border ${tab === "prompt" ? "border-slate-900 bg-white" : "border-slate-200 bg-white hover:border-slate-300"}`}>
              <div className="flex items-center gap-3"><Wand2 className="w-5 h-5"/><h2 className="font-semibold">Option 1 — Free‑form prompt & uploads</h2></div>
              <p className="text-sm text-slate-600 mt-1">Paste your condition/story and (optionally) upload labs or notes. The engine builds a full therapy stack.</p>
            </motion.button>
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={() => setTab("questionnaire")} className={`p-4 rounded-2xl border ${tab === "questionnaire" ? "border-slate-900 bg-white" : "border-slate-200 bg-white hover:border-slate-300"}`}>
              <div className="flex items-center gap-3"><ClipboardList className="w-5 h-5"/><h2 className="font-semibold">Option 2 — Questionnaire (20×7) + 10 follow‑ups</h2></div>
              <p className="text-sm text-slate-600 mt-1">Answer 140 questions (20 per chakra). The engine then asks 10 tailored questions and generates therapy.</p>
            </motion.button>
          </div>

          {tab === "prompt" && (
            <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
              <div className="flex items-center gap-2 text-slate-700"><FileText className="w-4 h-4"/><span className="text-sm font-semibold">Describe your state</span></div>
              <textarea value={freeText} onChange={e => setFreeText(e.target.value)} placeholder="E.g., I have lower back pain for 2 years, anxiety gets worse at night..." className="w-full min-h-[140px] p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300"/>
              <div className="flex items-center gap-2 text-slate-700"><FileUp className="w-4 h-4"/><span className="text-sm font-semibold">Upload labs/notes (txt,csv,json; images allowed for reference)</span></div>
              <input type="file" multiple onChange={onFileChange} className="block w-full text-sm" accept=".txt,.csv,.json,image/*"/>
              {Object.keys(parsedLabs).length > 0 && (
                <div className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="font-semibold mb-1">Parsed labs (quick parse):</div>
                  <pre className="whitespace-pre-wrap">{JSON.stringify(parsedLabs, null, 2)}</pre>
                {therapy && therapy.modules && !therapy.modules.includes("Psilocybin") && (<div className="text-xs text-slate-500">Note: Psilocybin module unavailable for your region ({geoCountry}).</div>)}
              </div>
              )}
              <button onClick={generateFromPrompt} className="w-full py-2.5 rounded-xl bg-slate-900 text-white hover:bg-black flex items-center justify-center gap-2"><Wand2 className="w-4 h-4"/>Generate therapy</button>
            </div>
          )}

          {tab === "questionnaire" && (
            <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-5">
              {CHAKRAS.map(({ key, name, color }) => (
                <div key={key} className="border border-slate-200 rounded-2xl p-3">
                  <div className="flex items-center justify-between mb-2"><div className="font-semibold" style={{ color }}>{name}</div><div className="text-xs text-slate-500">Answer all 20</div></div>
                  <div className="grid gap-2">
                    {Array.from({length:20}).map((_, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-3">
                        <label className="text-sm text-slate-700 flex-1">{idx + 1}. {/* question text minimized to save bundle */}</label>
                        <div className="flex items-center gap-1">
                          {LIKERT.map(opt => (
                            <button key={opt.v} onClick={() => {
                              setAnswers(prev => {
                                const clone = { ...prev, [key]: [...prev[key]] };
                                clone[key][idx] = opt.v; return clone;
                              });
                            }} className={`px-2 py-1 rounded-lg text-xs border ${answers[key][idx] === opt.v ? "bg-slate-900 text-white border-slate-900" : "border-slate-200 bg-white hover:border-slate-300"}`}>{opt.v}</button>
                          ))}
                        {therapy && therapy.modules && !therapy.modules.includes("Psilocybin") && (<div className="text-xs text-slate-500">Note: Psilocybin module unavailable for your region ({geoCountry}).</div>)}
              </div>
                      {therapy && therapy.modules && !therapy.modules.includes("Psilocybin") && (<div className="text-xs text-slate-500">Note: Psilocybin module unavailable for your region ({geoCountry}).</div>)}
              </div>
                    ))}
                  {therapy && therapy.modules && !therapy.modules.includes("Psilocybin") && (<div className="text-xs text-slate-500">Note: Psilocybin module unavailable for your region ({geoCountry}).</div>)}
              </div>
                {therapy && therapy.modules && !therapy.modules.includes("Psilocybin") && (<div className="text-xs text-slate-500">Note: Psilocybin module unavailable for your region ({geoCountry}).</div>)}
              </div>
              ))}

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm">
                <div className="flex items-center gap-2 font-semibold mb-1"><Gauge className="w-4 h-4"/>Progress snapshot</div>
                <div className="grid grid-cols-2 gap-2">
                  {CHAKRAS.map(({ key, name, color }) => (
                    <div key={key} className="text-xs">
                      <div className="flex items-center justify-between"><span>{name}</span><span className="font-semibold">{scoresState[key]?.pct ?? 0}%</span></div>
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden mt-1"><div className="h-full" style={{ width: `${scoresState[key]?.pct ?? 0}%`, background: color }} /></div>
                    {therapy && therapy.modules && !therapy.modules.includes("Psilocybin") && (<div className="text-xs text-slate-500">Note: Psilocybin module unavailable for your region ({geoCountry}).</div>)}
              </div>
                  ))}
                {therapy && therapy.modules && !therapy.modules.includes("Psilocybin") && (<div className="text-xs text-slate-500">Note: Psilocybin module unavailable for your region ({geoCountry}).</div>)}
              </div>
              {therapy && therapy.modules && !therapy.modules.includes("Psilocybin") && (<div className="text-xs text-slate-500">Note: Psilocybin module unavailable for your region ({geoCountry}).</div>)}
              </div>

              {!showFollowUps && (
                <button onClick={()=>{
                  // Require all answered
                  for (let { key } of CHAKRAS) {
                    const arr = answers[key];
                    if (arr.some(v => v === null)) { alert(`Please answer all 20 questions for ${key.toUpperCase()} first.`); return; }
                  }
                  // Simple follow-ups for weakest 3
                  const sc = scoreChakras(answers);
                  const weakest = Object.entries(sc).sort((a,b)=> a[1].avg - b[1].avg).slice(0,3).map(([k])=>k);
                  const bank = {
                    root: ["Describe your lower back pain patterns.","Do you feel safe at home/work? Explain.","How regular are your bowel movements?","List 3 routines you keep daily."],
                    sacral: ["Any pelvic floor tension or pain?","How is your libido this month?","When did you last feel playful/creative?","Any shame/guilt themes recurring?"],
                    solar: ["Describe typical morning energy.","Do carbs help or crash you?","How do you handle conflict currently?","What's your biggest unfinished task?"],
                    heart: ["Who do you feel most connected to?","Do you experience chest tightness? When?","What restores your sense of hope?","How do you receive support from others?"],
                    throat: ["When do you struggle to speak up?","Any jaw clenching or bruxism at night?","Do you sing/hum daily?","Where is your phone during sleep?"],
                    thirdEye: ["How many hours of sleep before midnight?","Do you recall last night's dream?","Describe recent headaches, if any.","What long-form content did you read this week?"],
                    crown: ["What practices connect you to meaning?","Do you reflect on values weekly?","Describe a recent moment of awe.","How do you rest from striving?"],
                  };
                  const qs = [...bank[weakest[0]], ...bank[weakest[1]], ...bank[weakest[2]]].slice(0,10);
                  setFollowUps(qs);
                  setFollowUpAnswers(Array(qs.length).fill(""));
                  setShowFollowUps(true);
                }} className="w-full py-2.5 rounded-xl bg-slate-900 text-white hover:bg-black flex items-center justify-center gap-2"><Brain className="w-4 h-4"/>Continue → Tailored 10 follow‑ups</button>
              )}

              {showFollowUps && (
                <div className="space-y-3">
                  <div className="font-semibold text-slate-800">10 Tailored Questions</div>
                  {followUps.map((q, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-sm w-6 text-slate-500">{i + 1}.</span>
                      <input value={followUpAnswers[i] || ""} onChange={e => setFollowUpAnswers(prev => { const x = [...prev]; x[i] = e.target.value; return x; })} placeholder={q} className="flex-1 p-2 rounded-xl border border-slate-200"/>
                    {therapy && therapy.modules && !therapy.modules.includes("Psilocybin") && (<div className="text-xs text-slate-500">Note: Psilocybin module unavailable for your region ({geoCountry}).</div>)}
              </div>
                  ))}
                  <button onClick={async ()=>{
                    const payload = { mode:"questionnaire", answers, followUps, followUpAnswers };
                    const resp = await callBackend(payload);
                    if (resp) { setTherapy(resp); setShowFollowUps(false); return; }
                    const sc = scoreChakras(answers);
                    const primary = pickPrimaryChakras(sc, 2);
                    const f0 = f0ScoreFromChakras(sc);
                    const hz = hzPlan(primary);
                    const smiles = { label: "Glycine-derived bio-photonic candidate", smiles:"NCC(=O)O", record:`[F0 ${f0} | EM Calming | SMILES NCC(=O)O]`, note:"For simulation only." };
                    const diet = buildDiet(primary[0] || "root");
                    const supps = buildSupps(null);
                    setTherapy({ mode:"questionnaire", primaryChakras: primary, scores: sc, f0, hz, smiles, diet, supps, modules:["Nutrition","F0","EMDR","MP","Breath"], notes: safetyNotes(), followUpAnswers });
                    setShowFollowUps(false);
                  }} className="w-full py-2.5 rounded-xl bg-slate-900 text-white hover:bg-black flex items-center justify-center gap-2"><Heart className="w-4 h-4"/>Generate therapy</button>
                {therapy && therapy.modules && !therapy.modules.includes("Psilocybin") && (<div className="text-xs text-slate-500">Note: Psilocybin module unavailable for your region ({geoCountry}).</div>)}
              </div>
              )}
            </div>
          )}

          <div className="p-4 rounded-2xl border border-slate-200 bg-white">
            <div className="font-semibold mb-2 flex items-center gap-2"><ShieldCheck className="w-4 h-4"/>Nutrition & Lifestyle — Core Rules</div>
            <div className="text-sm text-slate-700">
              <div className="font-medium">Emphasize</div>
              <ul className="list-disc ml-5">
                <li>Carbs: {NUTRITION_POLICY.carbs.join(", ")}</li>
                <li>Proteins: {NUTRITION_POLICY.proteins.join(", ")}</li>
                <li>Fats: {NUTRITION_POLICY.fats.join(", ")}</li>
              </ul>
              <div className="font-medium mt-2">Avoid</div>
              <ul className="list-disc ml-5">
                {NUTRITION_POLICY.avoid.map((x, i) => <li key={i}>{x}</li>)}
              </ul>
              <div className="font-medium mt-2">Notes</div>
              <ul className="list-disc ml-5">
                {NUTRITION_POLICY.notes.map((x, i) => <li key={i}>{x}</li>)}
              </ul>
            </div>
          </div>
        </section>

        <section className="md:col-span-3">
          <div ref={outputRef} className="p-5 rounded-2xl border border-slate-300 bg-white shadow-sm">
            {!therapy ? (
              <div className="text-slate-500 text-sm">Generated therapy will appear here. Choose an option on the left and click <em>Generate therapy</em>.</div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><Zap className="w-5 h-5"/><h2 className="font-semibold text-lg">Therapy Summary</h2></div>
                    <div className="text-xs px-2 py-1 rounded-lg bg-slate-900 text-white">F₀ score: <span className="font-bold">{therapy.f0}</span></div>
                  {therapy && therapy.modules && !therapy.modules.includes("Psilocybin") && (<div className="text-xs text-slate-500">Note: Psilocybin module unavailable for your region ({geoCountry}).</div>)}
              </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-semibold">Mode:</span> {therapy.mode}</div>
                    <div><span className="font-semibold">Primary chakras:</span> {therapy.primaryChakras.map(k => CHAKRAS.find(c => c.key === k)?.name.split("—")[0].trim()).join(", ")}</div>
                    {therapy.guessedDisease && <div><span className="font-semibold">Guessed condition:</span> {therapy.guessedDisease}</div>}
                    {therapy.id && <div><span className="font-semibold">Saved ID:</span> {therapy.id}</div>}
                    {therapy.labs && Object.keys(therapy.labs).length > 0 && (
                      <div className="col-span-2"><span className="font-semibold">Parsed labs:</span> {Object.entries(therapy.labs).map(([k,v]) => `${k}: ${v}`).join("; ")}</div>
                    )}
                  {therapy && therapy.modules && !therapy.modules.includes("Psilocybin") && (<div className="text-xs text-slate-500">Note: Psilocybin module unavailable for your region ({geoCountry}).</div>)}
              </div>
                {therapy && therapy.modules && !therapy.modules.includes("Psilocybin") && (<div className="text-xs text-slate-500">Note: Psilocybin module unavailable for your region ({geoCountry}).</div>)}
              </div>

                <div>
                  <div className="flex items-center gap-2"><FlaskConical className="w-5 h-5"/><h3 className="font-semibold">Frequency Plan (beneath F₀ filter)</h3></div>
                  <ul className="list-disc ml-5 text-sm mt-1">
                    {therapy.hz.map(({ chakra, hz }) => (
                      <li key={chakra}><span className="font-semibold">{CHAKRAS.find(c=>c.key===chakra)?.name}</span>: {hz} Hz — 15–30 min/day via sound/light; calibrate to comfort & coherence.</li>
                    ))}
                  </ul>
                {therapy && therapy.modules && !therapy.modules.includes("Psilocybin") && (<div className="text-xs text-slate-500">Note: Psilocybin module unavailable for your region ({geoCountry}).</div>)}
              </div>

                <div>
                  <div className="flex items-center gap-2"><FileType2 className="w-5 h-5"/><h3 className="font-semibold">Bio‑photonic Molecule Candidate (for simulation)</h3></div>
                  <div className="text-sm mt-1">
                    <div><span className="font-semibold">Label:</span> {therapy.smiles.label}</div>
                    <div><span className="font-semibold">Record:</span> {therapy.smiles.record}</div>
                    <div className="text-xs text-slate-600 mt-1">{therapy.smiles.note}</div>
                  {therapy && therapy.modules && !therapy.modules.includes("Psilocybin") && (<div className="text-xs text-slate-500">Note: Psilocybin module unavailable for your region ({geoCountry}).</div>)}
              </div>
                {therapy && therapy.modules && !therapy.modules.includes("Psilocybin") && (<div className="text-xs text-slate-500">Note: Psilocybin module unavailable for your region ({geoCountry}).</div>)}
              </div>

                <div>
                  <div className="flex items-center gap-2"><Sparkles className="w-5 h-5"/><h3 className="font-semibold">Modules</h3></div>
                  <ul className="list-disc ml-5 text-sm mt-1">
                    {therapy.modules?.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                {therapy && therapy.modules && !therapy.modules.includes("Psilocybin") && (<div className="text-xs text-slate-500">Note: Psilocybin module unavailable for your region ({geoCountry}).</div>)}
              </div>

                <div>
                  <div className="flex items-center gap-2"><Heart className="w-5 h-5"/><h3 className="font-semibold">5‑Day Nutrition Plan (policy‑aligned)</h3></div>
                  <div className="mt-2 grid gap-3">
                    {therapy.diet.map((d, i) => (
                      <div key={i} className="border border-slate-200 rounded-xl p-3">
                        <div className="font-semibold">{d.title}</div>
                        <div className="text-sm text-slate-600">{d.focus}</div>
                        <ul className="list-disc ml-5 text-sm mt-1">
                          {d.meals.map((m, j) => (
                            <li key={j}><span className="font-semibold">{m.name}:</span> {m.items.join(", ")}</li>
                          ))}
                        </ul>
                      {therapy && therapy.modules && !therapy.modules.includes("Psilocybin") && (<div className="text-xs text-slate-500">Note: Psilocybin module unavailable for your region ({geoCountry}).</div>)}
              </div>
                    ))}
                  {therapy && therapy.modules && !therapy.modules.includes("Psilocybin") && (<div className="text-xs text-slate-500">Note: Psilocybin module unavailable for your region ({geoCountry}).</div>)}
              </div>
                  <div className="text-xs text-slate-600 mt-2">Policy reminders: avoid PUFA seed oils, nuts & seeds, oats, leafy/stem vegetables; prioritize animal foods, fruit, tubers, dairy.</div>
                {therapy && therapy.modules && !therapy.modules.includes("Psilocybin") && (<div className="text-xs text-slate-500">Note: Psilocybin module unavailable for your region ({geoCountry}).</div>)}
              </div>

                <div>
                  <div className="flex items-center gap-2"><Brain className="w-5 h-5"/><h3 className="font-semibold">Supplements (food‑first; no fish oil)</h3></div>
                  <ul className="list-disc ml-5 text-sm mt-1">
                    {therapy.supps.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                {therapy && therapy.modules && !therapy.modules.includes("Psilocybin") && (<div className="text-xs text-slate-500">Note: Psilocybin module unavailable for your region ({geoCountry}).</div>)}
              </div>

                <div>
                  <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5"/><h3 className="font-semibold">Safety & Ethics</h3></div>
                  <ul className="list-disc ml-5 text-sm mt-1">
                    {therapy.notes.map((n, i) => <li key={i}>{n}</li>)}
                  </ul>
                {therapy && therapy.modules && !therapy.modules.includes("Psilocybin") && (<div className="text-xs text-slate-500">Note: Psilocybin module unavailable for your region ({geoCountry}).</div>)}
              </div>

                {therapy.textEcho && (
                  <div>
                    <div className="flex items-center gap-2"><FileText className="w-5 h-5"/><h3 className="font-semibold">User Input</h3></div>
                    <pre className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 whitespace-pre-wrap">{therapy.textEcho}</pre>
                  {therapy && therapy.modules && !therapy.modules.includes("Psilocybin") && (<div className="text-xs text-slate-500">Note: Psilocybin module unavailable for your region ({geoCountry}).</div>)}
              </div>
                )}

                <div className="text-[11px] text-slate-500">
                  © {new Date().getFullYear()} Therapy Engine — Integrates F₀ filter, Nutrition & Lifestyle, EMDR/Psilocybin modules, MP, DNA reprogramming, and quantum‑sim validation scaffolds.
                {therapy && therapy.modules && !therapy.modules.includes("Psilocybin") && (<div className="text-xs text-slate-500">Note: Psilocybin module unavailable for your region ({geoCountry}).</div>)}
              </div>
              {therapy && therapy.modules && !therapy.modules.includes("Psilocybin") && (<div className="text-xs text-slate-500">Note: Psilocybin module unavailable for your region ({geoCountry}).</div>)}
              </div>
            )}
          </div>
        </section>
      
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-5 w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">{t(lang,'settings')}</div>
              <button onClick={()=>setShowSettings(false)} className="px-3 py-1.5 rounded-xl bg-slate-100 text-sm">Close</button>
            </div>
            <div className="space-y-2">
              <div className="font-medium">Theme</div>
              <div className="flex gap-2">
                <button onClick={()=>setTheme('light')} className={`px-3 py-1.5 rounded-xl text-sm ${theme==='light'?'bg-slate-900 text-white':'bg-slate-100'}`}>Light</button>
                <button onClick={()=>setTheme('dark')} className={`px-3 py-1.5 rounded-xl text-sm ${theme==='dark'?'bg-slate-900 text-white':'bg-slate-100'}`}>Dark</button>
                <button onClick={()=>setTheme('system')} className={`px-3 py-1.5 rounded-xl text-sm ${theme==='system'?'bg-slate-900 text-white':'bg-slate-100'}`}>System</button>
              {therapy && therapy.modules && !therapy.modules.includes("Psilocybin") && (<div className="text-xs text-slate-500">Note: Psilocybin module unavailable for your region ({geoCountry}).</div>)}
              </div>
            </div>
            <div className="space-y-2">
              <div className="font-medium">Accessibility</div>
              <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={highContrast} onChange={e=>setHighContrast(e.target.checked)} /> High contrast</label>
            </div>
            <div className="space-y-2">
              <div className="font-medium">Language</div>
              <div className="flex gap-2">
                <button onClick={()=>setLang('en')} className={`px-3 py-1.5 rounded-xl text-sm ${lang==='en'?'bg-slate-900 text-white':'bg-slate-100'}`}>EN</button>
                <button onClick={()=>setLang('hr')} className={`px-3 py-1.5 rounded-xl text-sm ${lang==='hr'?'bg-slate-900 text-white':'bg-slate-100'}`}>HR</button>
              {therapy && therapy.modules && !therapy.modules.includes("Psilocybin") && (<div className="text-xs text-slate-500">Note: Psilocybin module unavailable for your region ({geoCountry}).</div>)}
              </div>
            </div>
            <div className="space-y-2"><div className="font-medium">Privacy</div><label className="text-sm flex items-center gap-2"><input type="checkbox" checked={telemetry==="1"} onChange={e=>setTelemetry(e.target.checked? "1" : "0")} /> Send crash/performance reports (Sentry)</label><label className="text-sm flex items-center gap-2"><input type="checkbox" checked={analytics==="1"} onChange={e=>setAnalytics(e.target.checked? "1" : "0")} /> Allow anonymous usage analytics</label></div>
            {token && (
              <div className="space-y-2">
                <div className="font-medium">My Data</div>
                <div className="flex gap-2">
                  <button onClick={exportMyData} className="px-3 py-1.5 rounded-xl bg-slate-100 text-sm">{t(lang,'export')}</button>
                  <button onClick={deleteMyAccount} className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-sm">{t(lang,'deleteAccount')}</button>
                {therapy && therapy.modules && !therapy.modules.includes("Psilocybin") && (<div className="text-xs text-slate-500">Note: Psilocybin module unavailable for your region ({geoCountry}).</div>)}
              </div>
              {therapy && therapy.modules && !therapy.modules.includes("Psilocybin") && (<div className="text-xs text-slate-500">Note: Psilocybin module unavailable for your region ({geoCountry}).</div>)}
              </div>
            )}
          </div>
        </div>
      )}
    
      {showAdmin && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-5 w-full max-w-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">Admin</div>
              <button onClick={()=>setShowAdmin(false)} className="px-3 py-1.5 rounded-xl bg-slate-100 text-sm">Close</button>
            </div>
            <div className="flex gap-2">
              <button onClick={loadStats} className="px-3 py-1.5 rounded-xl bg-slate-100 text-sm">Load stats</button>
            </div>
            <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(stats,null,2)}</pre>
          </div>
        </div>
      )}
    
      {showOnboarding && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xl space-y-4">
            <div className="text-lg font-semibold">{t(lang,"welcome").replace("{brand}", brandName)}</div>
            {onStep===1 && (<div className="text-sm text-slate-700 space-y-2">
              <p>{t(lang,"onb_step1")}</p>
              <button onClick={()=>setOnStep(2)} className="px-4 py-2 rounded-xl bg-slate-900 text-white">{t(lang,"next")}</button>
            </div>)}
            {onStep===2 && (<div className="text-sm text-slate-700 space-y-2">
              <p>{t(lang,"onb_privacy_title")}: {t(lang,"onb_privacy_text")}</p>
              <p>Crash reports are optional and help us improve quality.</p>
              <div className="flex gap-2">
                <button onClick={()=>{ setTelemetry('1'); setOnStep(3); }} className="px-3 py-1.5 rounded-xl bg-slate-100">{t(lang,"enableTelemetry")}</button>
                <button onClick={()=>{ setTelemetry('0'); setOnStep(3); }} className="px-3 py-1.5 rounded-xl bg-slate-100">{t(lang,"skip")}</button>
              </div>
            </div>)}
            {onStep===3 && (<div className="text-sm text-slate-700 space-y-2">
              <p>{t(lang,"disclaimer")}</p>
              <div className="flex justify-end gap-2">
                <button onClick={finishOnboarding} className="px-4 py-2 rounded-xl bg-slate-900 text-white">{t(lang,"start")}</button>
              </div>
            </div>)}
          </div>
        </div>
      )}

    
      {showPushOpt && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md space-y-3">
            <div className="text-lg font-semibold">Enable notifications?</div>
            <div className="text-sm text-slate-600">We can remind you about your daily plan. You can change this anytime in Settings.</div>
            <div className="flex justify-end gap-2">
              <button onClick={()=>{ localStorage.setItem('pushOpt','0'); setShowPushOpt(false); }} className="px-3 py-1.5 rounded-xl bg-slate-100 text-sm">Not now</button>
              <button onClick={async()=>{ try{ await initPushRegistration(); localStorage.setItem('pushOpt','1'); }catch{} setShowPushOpt(false); }} className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-sm">Enable</button>
            </div>
          </div>
        </div>
      )}

    
      {showPaywall && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">Premium</div>
              <button onClick={()=>setShowPaywall(false)} className="px-3 py-1.5 rounded-xl bg-slate-100 text-sm">Close</button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><div className="font-medium">Free</div><ul className="list-disc pl-5"><li>Prompt & Questionnaire</li><li>5-day plan (PDF)</li><li>Reminders</li></ul></div>
              <div><div className="font-medium">Premium</div><ul className="list-disc pl-5"><li>Advanced frequency guide</li><li>PCT report (DOCX)</li><li>Priority reminders</li></ul></div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={goPremium} className="btn-brand">Upgrade (Stripe)</button>
              <button onClick={goPremiumIAP} className="px-3 py-1.5 rounded-xl bg-yellow-200 text-sm">Upgrade via Store</button>
            </div>
          </div>
        </div>
      )}
    </main>
    </div>
  );
}

export default TherapyEngineApp;
