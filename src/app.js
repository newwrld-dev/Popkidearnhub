import React, { useState, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, doc, getDoc, setDoc, updateDoc, 
  increment, arrayUnion, collection, query, where, getDocs 
} from "firebase/firestore";

// ─── FIREBASE CONFIGURATION ──────────────────────────────────────────────────
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

// ─── Palette & Design Tokens ──────────────────────────────────────────────────
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

const ACTIVATION_FEE = 500;
const REFERRAL_BONUS = 20;
const PAYMENT_LINK = "https://lipwa.link/7762";

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  app: { minHeight: "100vh", background: COLORS.bg, fontFamily: "'Sora', sans-serif", color: COLORS.text, position: "relative", overflowX: "hidden" },
  nav: { background: COLORS.navBg, borderBottom: `1px solid ${COLORS.cardBorder}`, padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(12px)" },
  logo: { fontWeight: 800, fontSize: 22, background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.gold})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: -0.5 },
  navLinks: { display: "flex", gap: 8 },
  navBtn: (active) => ({ padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: active ? COLORS.accent : "transparent", color: active ? "#000" : COLORS.muted, transition: "all 0.2s" },
  hero: { background: `linear-gradient(135deg, #0f2027 0%, #203a43 50%, #0f2027 100%)`, borderBottom: `1px solid ${COLORS.cardBorder}`, padding: "40px 20px", textAlign: "center", position: "relative" },
  heroTitle: { fontSize: 28, fontWeight: 800, margin: "0 0 8px", background: `linear-gradient(135deg, #fff, ${COLORS.accent})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  accentBtn: { background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDark})`, color: "#000", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: `0 4px 20px ${COLORS.accent}44` },
  dangerBtn: { background: COLORS.red, color: "#fff", border: "none", borderRadius: 12, padding: "10px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  ghostBtn: { background: "transparent", border: `1px solid ${COLORS.cardBorder}`, color: COLORS.text, borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  page: { maxWidth: 480, margin: "0 auto", padding: "20px 16px 80px" },
  card: { background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 16, padding: "20px", marginBottom: 16 },
  statGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 },
  statCard: { background: `linear-gradient(135deg, ${COLORS.card}, #162030)`, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 14, padding: "16px", textAlign: "center" },
  statValue: { fontSize: 24, fontWeight: 800, color: COLORS.accent, display: "block" },
  statLabel: { fontSize: 11, color: COLORS.muted, textTransform: "uppercase", marginTop: 4 },
  input: { width: "100%", background: "#0d1424", border: `1px solid ${COLORS.cardBorder}`, borderRadius: 10, padding: "11px 14px", color: COLORS.text, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 10 },
  label: { fontSize: 12, color: COLORS.muted, marginBottom: 4, display: "block", fontWeight: 600, textTransform: "uppercase" },
  badge: (color) => ({ display: "inline-block", background: `${color}22`, color, border: `1px solid ${color}55`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }),
  taskCard: { background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 14, padding: "16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 14 },
  taskIcon: { width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 },
  chatBubble: (isUser) => ({ maxWidth: "78%", alignSelf: isUser ? "flex-end" : "flex-start", background: isUser ? COLORS.accent : "#162030", color: isUser ? "#000" : COLORS.text, borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "10px 14px", fontSize: 13.5, marginBottom: 4, border: isUser ? "none" : `1px solid ${COLORS.cardBorder}` }),
  toast: { position: "fixed", bottom: 30, left: "50%", transform: "translateX(-50%)", background: COLORS.accent, color: "#000", fontWeight: 700, padding: "10px 22px", borderRadius: 12, zIndex: 9999 },
  overlay: { position: "fixed", inset: 0, background: "#000a", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  modal: { background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 20, padding: 28, width: "100%", maxWidth: 420 },
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2200); return () => clearTimeout(t); }, [onDone]);
  return <div style={S.toast}>{msg}</div>;
}

// ─── Auth Screen ──────────────────────────────────────────────────────────────
function AuthScreen({ onAuth, toast }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", phone: "", password: "", ref: "" });
  const [loading, setLoading] = useState(false);

  const handle = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit() {
    if (!form.phone || !form.password) return toast("Fill all fields");
    setLoading(true);
    try {
      const userRef = doc(db, "users", form.phone);
      const userSnap = await getDoc(userRef);

      if (mode === "register") {
        if (userSnap.exists()) throw new Error("Phone already exists");
        const refCode = Math.random().toString(36).slice(2, 9).toUpperCase();
        const newUser = {
          name: form.name, phone: form.phone, password: form.password,
          refCode, referredBy: form.ref || null, balance: 0,
          activated: false, tasksCompleted: 0, points: 0, referrals: 0,
          activity: [{ text: "Account created! 🎉", at: Date.now() }]
        };
        await setDoc(userRef, newUser);
        onAuth(newUser);
      } else {
        if (!userSnap.exists() || userSnap.data().password !== form.password) throw new Error("Wrong details");
        onAuth(userSnap.data());
      }
    } catch (e) { toast(e.message); }
    setLoading(false);
  }

  return (
    <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ ...S.card, width: "100%", maxWidth: 400 }}>
        <div style={{ ...S.logo, fontSize: 34, textAlign: "center", marginBottom: 20 }}>💰 EarnHub</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {["login", "register"].map(m => (
            <button key={m} style={{ ...S.navBtn(mode === m), flex: 1 }} onClick={() => setMode(m)}>
              {m.toUpperCase()}
            </button>
          ))}
        </div>
        {mode === "register" && <><label style={S.label}>Full Name</label><input style={S.input} onChange={handle("name")} /></>}
        <label style={S.label}>Phone Number</label><input style={S.input} onChange={handle("phone")} />
        <label style={S.label}>Password</label><input style={S.input} type="password" onChange={handle("password")} />
        {mode === "register" && <><label style={S.label}>Ref Code (Optional)</label><input style={S.input} onChange={handle("ref")} /></>}
        <button style={{ ...S.accentBtn, width: "100%", marginTop: 10 }} onClick={submit} disabled={loading}>
          {loading ? "Processing..." : mode.toUpperCase()}
        </button>
      </div>
    </div>
  );
}

// ─── Main App Component ────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [showActivation, setShowActivation] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [activeTask, setActiveTask] = useState(null);

  const toast = useCallback((msg) => setToastMsg(msg), []);

  const refreshUser = async () => {
    if (!user) return;
    const snap = await getDoc(doc(db, "users", user.phone));
    if (snap.exists()) setUser(snap.data());
  };

  const updateBalance = async (amt, reason) => {
    const userRef = doc(db, "users", user.phone);
    await updateDoc(userRef, {
      balance: increment(amt),
      tasksCompleted: increment(1),
      points: increment(amt),
      activity: arrayUnion({ text: `${reason} +KSH ${amt}`, at: Date.now() })
    });
    refreshUser();
  };

  const handleActivation = async (code) => {
    if (code.length < 5) return toast("Invalid M-Pesa Code");
    const userRef = doc(db, "users", user.phone);
    await updateDoc(userRef, { activated: true });
    
    if (user.referredBy) {
      const q = query(collection(db, "users"), where("refCode", "==", user.referredBy));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        await updateDoc(doc(db, "users", qSnap.docs[0].id), {
          balance: increment(REFERRAL_BONUS),
          referrals: increment(1),
          activity: arrayUnion({ text: `Referral bonus from ${user.name}`, at: Date.now() })
        });
      }
    }
    await refreshUser();
    setShowActivation(false);
    toast("Activated! 🚀");
  };

  if (!user) return <><AuthScreen onAuth={setUser} toast={toast} />{toastMsg && <Toast msg={toastMsg} onDone={() => setToastMsg(null)} />}</>;

  return (
    <div style={S.app}>
      <nav style={S.nav}>
        <div style={S.logo}>💰 EarnHub</div>
        <div style={S.navLinks}>
          <button style={S.navBtn(tab === "dashboard")} onClick={() => setTab("dashboard")}>Home</button>
          <button style={S.navBtn(tab === "tasks")} onClick={() => setTab("tasks")}>Tasks</button>
          <button style={S.navBtn(tab === "earnings")} onClick={() => setTab("earnings")}>Bank</button>
        </div>
      </nav>

      <div style={S.hero}>
        <div style={S.heroTitle}>KSH {user.balance.toFixed(2)}</div>
        <div style={{ color: COLORS.muted, marginBottom: 15 }}>Available Balance</div>
        {!user.activated && <button style={S.accentBtn} onClick={() => setShowActivation(true)}>ACTIVATE ACCOUNT</button>}
      </div>

      <div style={S.page}>
        {tab === "dashboard" && (
          <>
            <div style={S.statGrid}>
                <div style={S.statCard}><span style={S.statValue}>{user.referrals}</span><span style={S.statLabel}>Referrals</span></div>
                <div style={S.statCard}><span style={S.statValue}>{user.tasksCompleted}</span><span style={S.statLabel}>Tasks</span></div>
            </div>
            <div style={S.card}>
              <div style={S.label}>Referral Link</div>
              <div style={{ background: "#0d1424", padding: 12, borderRadius: 10, fontSize: 13, wordBreak: "break-all" }}>
                {window.location.origin}?ref={user.refCode}
              </div>
              <button style={{ ...S.accentBtn, width: "100%", marginTop: 10 }} onClick={() => { navigator.clipboard.writeText(`${window.location.origin}?ref=${user.refCode}`); toast("Copied!"); }}>COPY LINK</button>
            </div>
          </>
        )}

        {tab === "tasks" && (
          <div>
            {[
              { id: "checkin", icon: "📅", name: "Daily Check-in", reward: 5 },
              { id: "quiz", icon: "🧠", name: "Trivia Quiz", reward: 15 },
              { id: "chat", icon: "💬", name: "Chat to Earn", reward: 10 }
            ].map((t) => (
              <div key={t.id} style={S.taskCard}>
                <div style={{ ...S.taskIcon, background: `${COLORS.accent}22` }}>{t.icon}</div>
                <div style={{ flex: 1 }}><b>{t.name}</b><br/><small>Earn KSH {t.reward}</small></div>
                <button style={S.navBtn(true)} onClick={() => { if(!user.activated) return toast("Activate First!"); updateBalance(t.reward, t.name); toast("Claimed!"); }}>Claim</button>
              </div>
            ))}
          </div>
        )}

        {tab === "earnings" && (
          <div style={S.card}>
            <h3>Withdraw Earnings</h3>
            <label style={S.label}>Phone Number</label><input style={S.input} value={user.phone} />
            <label style={S.label}>Amount (Min 500)</label><input style={S.input} placeholder="500" />
            <button style={{ ...S.accentBtn, width: "100%" }} onClick={() => toast("Minimum withdrawal is KSH 500")}>Withdraw to M-Pesa</button>
          </div>
        )}
      </div>

      {showActivation && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={{ margin: 0 }}>🔓 Activate Account</h3>
            <p style={{ color: COLORS.muted, fontSize: 13 }}>Pay KSH {ACTIVATION_FEE} to start earning.</p>
            <div style={{ background: "#0d1424", padding: 15, borderRadius: 10, marginBottom: 15 }}>
              <small>Pay to Lipwa Link:</small><br/>
              <a href={PAYMENT_LINK} target="_blank" rel="noreferrer" style={{ color: COLORS.accent }}>{PAYMENT_LINK}</a>
            </div>
            <label style={S.label}>M-Pesa Code</label>
            <input id="mpcode" style={S.input} placeholder="e.g. RHF7S..." />
            <button style={{ ...S.accentBtn, width: "100%" }} onClick={() => handleActivation(document.getElementById("mpcode").value)}>VERIFY ✓</button>
            <button style={{ ...S.ghostBtn, width: "100%", marginTop: 10 }} onClick={() => setShowActivation(false)}>Cancel</button>
          </div>
        </div>
      )}

      {toastMsg && <Toast msg={toastMsg} onDone={() => setToastMsg(null)} />}
    </div>
  );
}
