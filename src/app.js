import React, { useState, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, doc, getDoc, setDoc, updateDoc, 
  increment, arrayUnion, collection, query, where, getDocs 
} from "firebase/firestore";

// ─── CONFIGURATION ────────────────────────────────────────────────────────────
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
const PAYMENT_URL = "https://lipwa.link/7762"; // Your payment portal

const COLORS = {
  bg: "#05070a",
  card: "#0f172a",
  accent: "#10b981",
  gold: "#fbbf24",
  text: "#f8fafc",
  muted: "#64748b",
  border: "#1e293b"
};

// ─── MAIN APP COMPONENT ───────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    const savedPhone = localStorage.getItem("userPhone");
    if (savedPhone) {
      const userRef = doc(db, "users", savedPhone);
      getDoc(userRef).then(s => {
        if (s.exists()) setUser(s.data());
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  // ─── SECURE PAYMENT HANDLER ────────────────────────────────────────────────
  const triggerPayment = async () => {
    setIsPaying(true);
    
    // 1. Open the payment window
    window.open(PAYMENT_URL, "_blank");

    // 2. Start Polling the database for payment confirmation
    // In production, your M-Pesa Callback URL updates the 'isActivated' field
    const checkPayment = setInterval(async () => {
      const userRef = doc(db, "users", user.phone);
      const snap = await getDoc(userRef);
      
      if (snap.data().isActivated) {
        clearInterval(checkPayment);
        setUser(snap.data());
        setIsPaying(false);
        alert("Payment Confirmed! Welcome to Popkid Earn.");
      }
    }, 3000); // Checks every 3 seconds

    // Timeout after 2 minutes if no payment is detected
    setTimeout(() => {
      clearInterval(checkPayment);
      setIsPaying(false);
    }, 120000);
  };

  if (loading) return <div style={styles.center}>Loading...</div>;
  if (!user) return <AuthScreen onAuth={setUser} />;

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", color: COLORS.text, fontFamily: "sans-serif" }}>
      
      {/* HEADER */}
      <nav style={styles.nav}>
        <b style={{ color: COLORS.accent }}>POPKID EARN</b>
        <div style={styles.balance}>KSH {user.balance || 0}</div>
      </nav>

      <div style={{ padding: 20, maxWidth: 500, margin: "0 auto" }}>
        
        {/* ACTIVATION OVERLAY (Show tasks but block participation) */}
        {!user.isActivated && (
          <div style={styles.activationCard}>
            <h3 style={{ margin: 0, color: COLORS.gold }}>⚠️ Account Inactive</h3>
            <p style={{ fontSize: 13, color: "#cbd5e1" }}>You can view tasks, but you must activate your account to earn and withdraw.</p>
            <button 
              onClick={triggerPayment} 
              disabled={isPaying}
              style={styles.payButton}
            >
              {isPaying ? "WAITING FOR PAYMENT..." : `PAY KSH ${ACTIVATION_FEE} TO ACTIVATE`}
            </button>
            {isPaying && <p style={styles.timerText}>Processing... Please complete the payment in the new tab.</p>}
          </div>
        )}

        {/* TASK SECTION */}
        <div style={{ opacity: user.isActivated ? 1 : 0.5, pointerEvents: user.isActivated ? "auto" : "none" }}>
          <h3 style={{ marginBottom: 15 }}>Premium Tasks</h3>
          
          <div style={styles.taskCard}>
            <div>
              <div style={{ fontWeight: 700 }}>YouTube Watch Task</div>
              <div style={{ color: COLORS.accent, fontSize: 12 }}>Earn KSH 15.00</div>
            </div>
            <button style={styles.actionBtn}>Watch</button>
          </div>

          <div style={styles.taskCard}>
            <div>
              <div style={{ fontWeight: 700 }}>Instagram Follow</div>
              <div style={{ color: COLORS.accent, fontSize: 12 }}>Earn KSH 10.00</div>
            </div>
            <button style={styles.actionBtn}>Follow</button>
          </div>

          <div style={styles.taskCard}>
            <div>
              <div style={{ fontWeight: 700 }}>Daily Login Bonus</div>
              <div style={{ color: COLORS.accent, fontSize: 12 }}>Earn KSH 5.00</div>
            </div>
            <button style={styles.actionBtn}>Claim</button>
          </div>
        </div>

        {/* REFERRAL BOX */}
        <div style={styles.referralBox}>
          <div style={{ fontSize: 12, color: COLORS.muted }}>YOUR REFERRAL LINK</div>
          <div style={{ fontSize: 13, fontWeight: "bold", marginTop: 5 }}>
            {window.location.origin}/join?ref={user.refCode}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = {
  center: { height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.bg, color: "#fff" },
  nav: { padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${COLORS.border}`, position: "sticky", top: 0, background: COLORS.bg },
  balance: { background: COLORS.card, padding: "5px 15px", borderRadius: 20, border: `1px solid ${COLORS.border}`, fontSize: 14 },
  activationCard: { background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", padding: 25, borderRadius: 20, border: `1px solid ${COLORS.gold}`, marginBottom: 25, textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" },
  payButton: { width: "100%", padding: 15, marginTop: 15, borderRadius: 12, border: "none", background: COLORS.gold, color: "#000", fontWeight: "bold", cursor: "pointer", fontSize: 14 },
  taskCard: { background: COLORS.card, padding: 20, borderRadius: 16, border: `1px solid ${COLORS.border}`, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" },
  actionBtn: { background: COLORS.accent, border: "none", padding: "8px 20px", borderRadius: 8, color: "#000", fontWeight: "bold", cursor: "pointer" },
  referralBox: { marginTop: 30, padding: 15, background: "#000", borderRadius: 12, border: `1px solid ${COLORS.border}`, textAlign: "center" },
  timerText: { fontSize: 11, marginTop: 10, color: COLORS.accent, letterSpacing: 1 }
};

// ─── AUTH SCREEN COMPONENT (Simplified) ───────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [form, setForm] = useState({ phone: "", pass: "" });
  const handleLogin = () => {
    // Basic verification logic for demo
    const userObj = { name: "User", phone: form.phone, isActivated: false, balance: 0, refCode: "POPKID" };
    localStorage.setItem("userPhone", form.phone);
    onAuth(userObj);
  };

  return (
    <div style={styles.center}>
      <div style={{ width: 300, textAlign: "center" }}>
        <h2 style={{ color: COLORS.accent }}>POPKID EARN</h2>
        <input placeholder="Phone" style={{ width: "100%", padding: 12, marginBottom: 10, borderRadius: 8, background: "#111", border: "1px solid #333", color: "#fff" }} onChange={e => setForm({...form, phone: e.target.value})} />
        <input type="password" placeholder="Password" style={{ width: "100%", padding: 12, marginBottom: 20, borderRadius: 8, background: "#111", border: "1px solid #333", color: "#fff" }} onChange={e => setForm({...form, pass: e.target.value})} />
        <button onClick={handleLogin} style={{ width: "100%", padding: 12, background: COLORS.accent, border: "none", borderRadius: 8, fontWeight: "bold" }}>GET STARTED</button>
      </div>
    </div>
  );
}
