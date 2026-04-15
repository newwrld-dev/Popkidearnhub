import React, { useState, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, doc, getDoc, setDoc, updateDoc, 
  increment, arrayUnion, collection, query, where, getDocs 
} from "firebase/firestore";

// ─── FIREBASE CONFIGURATION ──────────────────────────────────────────────────
// Ensure these details match your Firebase Console project settings
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

const ACTIVATION_FEE = 100; 
const REFERRAL_BONUS = 20;
const PAYMENT_LINK = "https://lipwa.link/7762";

const COLORS = {
  bg: "#0a0e1a",
  card: "#111827",
  cardBorder: "#1e2d45",
  accent: "#00d4aa",
  gold: "#f5c518",
  text: "#e8f0fe",
  muted: "#6b7a99",
};

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({ onAuth, toast }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", phone: "", password: "", ref: "" });
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!form.phone || !form.password) return toast("Fill all fields");
    setLoading(true);
    try {
      const userRef = doc(db, "users", form.phone);
      const userSnap = await getDoc(userRef);

      if (mode === "register") {
        if (userSnap.exists()) throw new Error("Phone already registered");
        const refCode = Math.random().toString(36).slice(2, 9).toUpperCase();
        const newUser = {
          name: form.name, phone: form.phone, password: form.password,
          refCode, referredBy: form.ref || null, balance: 0,
          isActivated: false, tasksCompleted: 0, points: 0, referrals: 0,
          activity: [{ text: "Joined EarnHub! 🚀", at: Date.now() }]
        };
        await setDoc(userRef, newUser);
        localStorage.setItem("userPhone", form.phone);
        onAuth(newUser);
      } else {
        if (!userSnap.exists() || userSnap.data().password !== form.password) throw new Error("Invalid login");
        localStorage.setItem("userPhone", form.phone);
        onAuth(userSnap.data());
      }
    } catch (e) { toast(e.message); }
    setLoading(false);
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, color: "#fff" }}>
      <div style={{ background: COLORS.card, padding: 30, borderRadius: 20, width: "100%", maxWidth: 400, border: `1px solid ${COLORS.cardBorder}` }}>
        <h2 style={{ textAlign: "center", color: COLORS.accent }}>💰 POPKID EARN</h2>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <button onClick={() => setMode("login")} style={{ flex: 1, padding: 10, background: mode === "login" ? COLORS.accent : "transparent", border: `1px solid ${COLORS.accent}`, borderRadius: 8, color: mode === "login" ? "#000" : "#fff" }}>Login</button>
          <button onClick={() => setMode("register")} style={{ flex: 1, padding: 10, background: mode === "register" ? COLORS.accent : "transparent", border: `1px solid ${COLORS.accent}`, borderRadius: 8, color: mode === "register" ? "#000" : "#fff" }}>Register</button>
        </div>
        {mode === "register" && <input placeholder="Full Name" style={{ width: "100%", padding: 12, marginBottom: 10, borderRadius: 8, background: "#000", border: `1px solid ${COLORS.cardBorder}`, color: "#fff" }} onChange={e => setForm({...form, name: e.target.value})} />}
        <input placeholder="Phone Number" style={{ width: "100%", padding: 12, marginBottom: 10, borderRadius: 8, background: "#000", border: `1px solid ${COLORS.cardBorder}`, color: "#fff" }} onChange={e => setForm({...form, phone: e.target.value})} />
        <input type="password" placeholder="Password" style={{ width: "100%", padding: 12, marginBottom: 10, borderRadius: 8, background: "#000", border: `1px solid ${COLORS.cardBorder}`, color: "#fff" }} onChange={e => setForm({...form, password: e.target.value})} />
        {mode === "register" && <input placeholder="Referral Code (Optional)" style={{ width: "100%", padding: 12, marginBottom: 15, borderRadius: 8, background: "#000", border: `1px solid ${COLORS.cardBorder}`, color: "#fff" }} onChange={e => setForm({...form, ref: e.target.value})} />}
        <button onClick={submit} style={{ width: "100%", padding: 12, background: COLORS.accent, border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}>{loading ? "Please wait..." : "PROCEED"}</button>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  const toast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  useEffect(() => {
    const savedPhone = localStorage.getItem("userPhone");
    if (savedPhone) {
      getDoc(doc(db, "users", savedPhone)).then(s => {
        if (s.exists()) setUser(s.data());
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const handleActivation = async (code) => {
    if (code.length < 5) return toast("Enter valid M-Pesa code");
    try {
      const userRef = doc(db, "users", user.phone);
      await updateDoc(userRef, { isActivated: true });
      
      // Referral Bonus logic
      if (user.referredBy) {
        const q = query(collection(db, "users"), where("refCode", "==", user.referredBy));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          await updateDoc(doc(db, "users", qSnap.docs[0].id), {
            balance: increment(REFERRAL_BONUS),
            activity: arrayUnion({ text: `Referral bonus from ${user.name}`, at: Date.now() })
          });
        }
      }
      window.location.reload();
    } catch (e) { toast("Error activating account"); }
  };

  if (loading) return <div style={{ background: COLORS.bg, color: "#fff", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Initializing Popkid Earn...</div>;
  if (!user) return <AuthScreen onAuth={setUser} toast={toast} />;

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", color: COLORS.text, fontFamily: "sans-serif" }}>
      
      {/* ACTIVATION GATEKEEPER */}
      {!user.isActivated && (
        <div style={{ position: "fixed", inset: 0, background: COLORS.bg, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: COLORS.card, padding: 30, borderRadius: 20, width: "100%", maxWidth: 400, border: `1px solid ${COLORS.gold}`, textAlign: "center" }}>
            <h2 style={{ color: COLORS.gold }}>🔒 Account Locked</h2>
            <p>Pay <b>KSH {ACTIVATION_FEE}</b> to unlock all tasks and withdrawals.</p>
            <div style={{ background: "#000", padding: 15, borderRadius: 10, margin: "20px 0", textAlign: "left", fontSize: 13 }}>
              1. Click the link: <a href={PAYMENT_LINK} target="_blank" style={{ color: COLORS.accent }}>{PAYMENT_LINK}</a><br/>
              2. Pay KSH {ACTIVATION_FEE}<br/>
              3. Enter M-Pesa Code below:
            </div>
            <input id="mp-code" placeholder="M-Pesa Transaction Code" style={{ width: "100%", padding: 12, marginBottom: 15, borderRadius: 8, background: "#000", border: `1px solid ${COLORS.cardBorder}`, color: "#fff" }} />
            <button onClick={() => handleActivation(document.getElementById("mp-code").value)} style={{ width: "100%", padding: 12, background: COLORS.gold, border: "none", borderRadius: 8, fontWeight: "bold" }}>ACTIVATE NOW</button>
          </div>
        </div>
      )}

      {/* DASHBOARD */}
      <nav style={{ padding: 20, borderBottom: `1px solid ${COLORS.cardBorder}`, display: "flex", justifyContent: "space-between" }}>
        <b style={{ color: COLORS.accent }}>POPKID EARN</b>
        <div style={{ background: COLORS.cardBorder, padding: "5px 15px", borderRadius: 20 }}>KSH {user.balance}</div>
      </nav>

      <div style={{ padding: 20, maxWidth: 500, margin: "0 auto" }}>
        <h3>Welcome, {user.name.split(" ")[0]}!</h3>
        <div style={{ background: COLORS.card, padding: 20, borderRadius: 15, border: `1px solid ${COLORS.cardBorder}` }}>
          <small style={{ color: COLORS.muted }}>Account Status</small>
          <div style={{ color: COLORS.accent, fontWeight: "bold" }}>ACTIVE & READY ✓</div>
        </div>

        <div style={{ marginTop: 20 }}>
          <h4>Available Tasks</h4>
          <div style={{ background: COLORS.card, padding: 15, borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div><b>Daily Reward</b><br/><small style={{ color: COLORS.accent }}>+ KSH 10</small></div>
            <button style={{ background: COLORS.accent, border: "none", padding: "8px 15px", borderRadius: 8, fontWeight: "bold" }}>Claim</button>
          </div>
          <div style={{ background: COLORS.card, padding: 15, borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><b>Invite Friends</b><br/><small style={{ color: COLORS.accent }}>+ KSH {REFERRAL_BONUS}</small></div>
            <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}?ref=${user.refCode}`); toast("Link Copied!"); }} style={{ background: COLORS.accent, border: "none", padding: "8px 15px", borderRadius: 8, fontWeight: "bold" }}>Invite</button>
          </div>
        </div>
      </div>

      {toastMsg && <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: COLORS.accent, color: "#000", padding: "10px 20px", borderRadius: 10, fontWeight: "bold", zIndex: 2000 }}>{toastMsg}</div>}
    </div>
  );
}
