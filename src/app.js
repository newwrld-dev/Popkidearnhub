import React, { useState, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, doc, getDoc, setDoc, updateDoc, 
  increment, arrayUnion, collection, query, where, getDocs 
} from "firebase/firestore";

// ─── FIREBASE SETUP ──────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAla-j5XiDE8Dfx0WRf5T-S2omYydrnEiM",
  authDomain: "earnhub-e3c63.firebaseapp.com",
  projectId: "earnhub-e3c63",
  storageBucket: "earnhub-e3c63.firebasestorage.app",
  messagingSenderId: "236965383629",
  appId: "1:236965383629:web:89fbfe37ad12ad3ef9c884"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── PALETTE & DESIGN TOKENS ──────────────────────────────────────────────────
const COLORS = {
  bg: "#0a0e1a",
  card: "#111827",
  cardBorder: "#1e2d45",
  accent: "#00d4aa",
  accentDark: "#00a882",
  gold: "#f5c518",
  red: "#ff4757",
  text: "#e8f0fe",
  muted: "#6b7a99",
  navBg: "#0d1424",
};

const ACTIVATION_FEE = 100; // Adjusted to your preferred rate
const REFERRAL_BONUS = 20;
const PAYMENT_LINK = "https://lipwa.link/7762";

// ─── STYLES (S) ──────────────────────────────────────────────────────────────
const S = {
  app: { minHeight: "100vh", background: COLORS.bg, fontFamily: "'Sora', sans-serif", color: COLORS.text, position: "relative", overflowX: "hidden" },
  nav: { background: COLORS.navBg, borderBottom: `1px solid ${COLORS.cardBorder}`, padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(12px)" },
  logo: { fontWeight: 800, fontSize: 22, background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.gold})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  navBtn: (active) => ({ padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: active ? COLORS.accent : "transparent", color: active ? "#000" : COLORS.muted }),
  hero: { background: `linear-gradient(135deg, #0f2027 0%, #203a43 50%, #0f2027 100%)`, padding: "40px 20px", textAlign: "center", borderBottom: `1px solid ${COLORS.cardBorder}` },
  heroTitle: { fontSize: 28, fontWeight: 800, margin: "0 0 8px", background: `linear-gradient(135deg, #fff, ${COLORS.accent})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  accentBtn: { background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDark})`, color: "#000", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: `0 4px 20px ${COLORS.accent}44` },
  page: { maxWidth: 480, margin: "0 auto", padding: "20px 16px 80px" },
  card: { background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 16, padding: "20px", marginBottom: 16 },
  input: { width: "100%", background: "#0d1424", border: `1px solid ${COLORS.cardBorder}`, borderRadius: 10, padding: "11px 14px", color: COLORS.text, fontSize: 14, marginBottom: 10 },
  label: { fontSize: 12, color: COLORS.muted, marginBottom: 4, display: "block", fontWeight: 600, textTransform: "uppercase" },
  statCard: { background: `linear-gradient(135deg, ${COLORS.card}, #162030)`, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 14, padding: "16px", textAlign: "center" },
  statValue: { fontSize: 24, fontWeight: 800, color: COLORS.accent, display: "block" },
  statLabel: { fontSize: 11, color: COLORS.muted, textTransform: "uppercase", marginTop: 4 },
  badge: (color) => ({ display: "inline-block", background: `${color}22`, color, border: `1px solid ${color}55`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }),
  toast: { position: "fixed", bottom: 30, left: "50%", transform: "translateX(-50%)", background: COLORS.accent, color: "#000", fontWeight: 700, padding: "10px 22px", borderRadius: 12, zIndex: 9999 },
  overlay: { position: "fixed", inset: 0, background: "#000a", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  modal: { background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 20, padding: 28, width: "100%", maxWidth: 420 },
  taskCard: { background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 14, padding: "16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 14 },
  chatBubble: (isUser) => ({ maxWidth: "78%", alignSelf: isUser ? "flex-end" : "flex-start", background: isUser ? COLORS.accent : "#162030", color: isUser ? "#000" : COLORS.text, borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "10px 14px", fontSize: 13.5, marginBottom: 4 }),
};

// ─── TOAST COMPONENT ──────────────────────────────────────────────────────────
function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2200); return () => clearTimeout(t); }, [onDone]);
  return <div style={S.toast}>{msg}</div>;
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({ onAuth, toast }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", phone: "", password: "", ref: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) { setForm(f => ({ ...f, ref })); setMode("register"); }
  }, []);

  const handle = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit() {
    setLoading(true);
    try {
      const userRef = doc(db, "users", form.phone);
      const userSnap = await getDoc(userRef);

      if (mode === "register") {
        if (userSnap.exists()) throw new Error("Phone already registered");
        const newUser = {
          name: form.name, phone: form.phone, password: form.password,
          refCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
          referredBy: form.ref || null, balance: 0, activated: false,
          tasksCompleted: 0, points: 0, referrals: 0, activity: []
        };
        await setDoc(userRef, newUser);
        onAuth(newUser);
      } else {
        if (!userSnap.exists() || userSnap.data().password !== form.password) throw new Error("Invalid credentials");
        onAuth(userSnap.data());
      }
    } catch (e) { toast(e.message); }
    setLoading(false);
  }

  return (
    <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ ...S.card, width: "100%", maxWidth: 400 }}>
        <div style={{ ...S.logo, fontSize: 30, textAlign: "center", marginBottom: 20 }}>💰 EarnHub</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <button style={S.navBtn(mode === "login")} onClick={() => setMode("login")}>Login</button>
            <button style={S.navBtn(mode === "register")} onClick={() => setMode("register")}>Register</button>
        </div>
        {mode === "register" && <><label style={S.label}>Name</label><input style={S.input} onChange={handle("name")} /></>}
        <label style={S.label}>Phone</label><input style={S.input} onChange={handle("phone")} />
        <label style={S.label}>Password</label><input style={S.input} type="password" onChange={handle("password")} />
        {mode === "register" && <><label style={S.label}>Ref Code</label><input style={S.input} value={form.ref} onChange={handle("ref")} /></>}
        <button style={{ ...S.accentBtn, width: "100%" }} onClick={submit}>{loading ? "Wait..." : mode.toUpperCase()}</button>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [showActivation, setShowActivation] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const toast = useCallback((msg) => setToastMsg(msg), []);

  const refreshUser = async () => {
    if (!user) return;
    const snap = await getDoc(doc(db, "users", user.phone));
    if (snap.exists()) setUser(snap.data());
  };

  const handleActivation = async (code) => {
    if (code.length < 5) return toast("Invalid Code");
    const userRef = doc(db, "users", user.phone);
    await updateDoc(userRef, { activated: true });
    
    if (user.referredBy) {
      const q = query(collection(db, "users"), where("refCode", "==", user.referredBy));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        await updateDoc(doc(db, "users", qSnap.docs[0].id), {
          balance: increment(REFERRAL_BONUS),
          referrals: increment(1),
          activity: arrayUnion({ text: `Referral bonus +KSH ${REFERRAL_BONUS} from ${user.name}`, at: Date.now() })
        });
      }
    }
    await refreshUser();
    setShowActivation(false);
    toast("Account Activated! 🎉");
  };

  if (!user) return <><AuthScreen onAuth={setUser} toast={toast} />{toastMsg && <Toast msg={toastMsg} onDone={() => setToastMsg(null)} />}</>;

  return (
    <div style={S.app}>
      <nav style={S.nav}>
        <div style={S.logo}>EarnHub</div>
        <div style={{ display: "flex", gap: 5 }}>
          <button style={S.navBtn(tab === "dashboard")} onClick={() => setTab("dashboard")}>Home</button>
          <button style={S.navBtn(tab === "tasks")} onClick={() => setTab("tasks")}>Tasks</button>
          <button style={S.navBtn(tab === "earnings")} onClick={() => setTab("earnings")}>Bank</button>
        </div>
      </nav>

      <div style={S.hero}>
        <div style={S.heroTitle}>KSH {user.balance.toFixed(2)}</div>
        <p style={{ color: COLORS.muted }}>Current Balance</p>
        {!user.activated && <button style={S.accentBtn} onClick={() => setShowActivation(true)}>ACTIVATE NOW</button>}
      </div>

      <div style={S.page}>
        {tab === "dashboard" && (
           <div style={S.card}>
             <div style={S.label}>Your Referral Link</div>
             <div style={{ background: "#0d1424", padding: 10, borderRadius: 10, fontSize: 12, wordBreak: "break-all" }}>
               {window.location.origin}?ref={user.refCode}
             </div>
             <button style={{ ...S.accentBtn, width: "100%", marginTop: 10 }} onClick={() => { navigator.clipboard.writeText(`${window.location.origin}?ref=${user.refCode}`); toast("Link Copied!"); }}>COPY LINK</button>
           </div>
        )}

        {tab === "tasks" && (
          <div>
            <div style={S.taskCard}>
              <div style={{ flex: 1 }}><b>Daily Check-in</b><br/><small>Earn KSH 5 daily</small></div>
              <button style={S.navBtn(true)} onClick={() => toast("Daily Check-in Coming Soon!")}>GO</button>
            </div>
          </div>
        )}

        {tab === "earnings" && (
          <div style={S.card}>
             <h3>Withdrawal</h3>
             <input style={S.input} placeholder="M-Pesa Number" />
             <input style={S.input} placeholder="Amount (Min 500)" />
             <button style={{ ...S.accentBtn, width: "100%" }} onClick={() => toast("Minimum KSH 500 required")}>WITHDRAW</button>
          </div>
        )}
      </div>

      {showActivation && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3>Verify Payment</h3>
            <p>1. Pay KSH {ACTIVATION_FEE} via the link.</p>
            <a href={PAYMENT_LINK} target="_blank" rel="noreferrer" style={{ display: "block", marginBottom: 20 }}>[ PAY VIA LIPWA ]</a>
            <input id="mc" style={S.input} placeholder="M-Pesa Code" />
            <button style={{ ...S.accentBtn, width: "100%" }} onClick={() => handleActivation(document.getElementById("mc").value)}>VERIFY ✓</button>
            <button style={{ background: "none", color: COLORS.muted, border: "none", marginTop: 10, width: "100%" }} onClick={() => setShowActivation(false)}>Cancel</button>
          </div>
        </div>
      )}

      {toastMsg && <Toast msg={toastMsg} onDone={() => setToastMsg(null)} />}
    </div>
  );
}
