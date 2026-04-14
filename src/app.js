import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, doc, getDoc, setDoc, updateDoc, 
  increment, arrayUnion 
} from "firebase/firestore";

// ─── CONFIGURATION ────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "earnhub-e3c63.firebaseapp.com",
  projectId: "earnhub-e3c63",
  storageBucket: "earnhub-e3c63.firebasestorage.app",
  messagingSenderId: "236965383629",
  appId: "1:236965383629:web:89fbfe37ad12ad3ef9c884"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ACTIVATION_FEE = 100; // Updated to 100 KSH
const REWARD_DAILY = 10;
const REWARD_QUIZ = 20;

const COLORS = {
  bg: "#050810",
  card: "#0f172a",
  accent: "#10b981",
  gold: "#fbbf24",
  text: "#f8fafc",
  muted: "#94a3b8",
  border: "#1e293b"
};

// ─── SHARED UI COMPONENTS ─────────────────────────────────────────────────────
const Card = ({ children, style }) => (
  <div style={{ background: COLORS.card, borderRadius: 16, border: `1px solid ${COLORS.border}`, padding: 20, marginBottom: 15, ...style }}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", disabled }) => (
  <button 
    disabled={disabled}
    onClick={onClick}
    style={{
      width: "100%",
      padding: "12px",
      borderRadius: 12,
      border: "none",
      fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer",
      background: variant === "primary" ? COLORS.accent : COLORS.border,
      color: variant === "primary" ? "#000" : COLORS.text,
      opacity: disabled ? 0.6 : 1,
      transition: "0.2s"
    }}
  >
    {children}
  </button>
);

// ─── ACTIVATION WALL ──────────────────────────────────────────────────────────
const ActivationWall = ({ user, onComplete }) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (code.length < 6) return alert("Please enter a valid M-Pesa code.");
    setLoading(true);
    try {
      // Logic: Update user status in Firebase
      const userRef = doc(db, "users", user.phone);
      await updateDoc(userRef, { isActivated: true });
      onComplete();
    } catch (e) { alert("Error verifying payment. Try again."); }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: COLORS.bg, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
        <h1 style={{ color: COLORS.gold }}>🔒 Account Locked</h1>
        <p style={{ color: COLORS.muted }}>To unlock tasks and start earning, a one-time activation fee of <b>KSH {ACTIVATION_FEE}</b> is required.</p>
        
        <Card style={{ textAlign: "left" }}>
          <h4 style={{ margin: "0 0 10px 0" }}>How to Pay:</h4>
          <ol style={{ fontSize: 13, color: COLORS.muted, paddingLeft: 20 }}>
            <li>Go to M-Pesa -> Lipa na M-Pesa.</li>
            <li>Use Paybill <b>776262</b> (Sample) or your Link.</li>
            <li>Pay <b>KSH 100</b>.</li>
            <li>Enter the Transaction Code below.</li>
          </ol>
          <input 
            placeholder="M-Pesa Code (e.g. RHF7S...)" 
            style={{ width: "100%", padding: 12, borderRadius: 8, background: "#000", border: `1px solid ${COLORS.border}`, color: "#fff", marginBottom: 10 }}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button onClick={handleVerify} disabled={loading}>{loading ? "Verifying..." : "Unlock My Account"}</Button>
        </Card>
      </div>
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function EarnHub() {
  const [user, setUser] = useState(null); // Set after login
  const [activeTab, setActiveTab] = useState("tasks");

  // Mock Login for demonstration - Replace with your AuthScreen
  useEffect(() => {
    const savedPhone = localStorage.getItem("userPhone");
    if (savedPhone) {
      getDoc(doc(db, "users", savedPhone)).then(s => s.exists() && setUser(s.data()));
    }
  }, []);

  const handleTaskClaim = async (reward, taskName) => {
    const userRef = doc(db, "users", user.phone);
    await updateDoc(userRef, {
      balance: increment(reward),
      activity: arrayUnion({ text: `${taskName} completed`, amount: reward, at: Date.now() })
    });
    // Refresh local state
    const snap = await getDoc(userRef);
    setUser(snap.data());
    alert(`Success! KSH ${reward} added to your balance.`);
  };

  if (!user) return <div style={{ background: COLORS.bg, color: "#fff", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading EarnHub...</div>;

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", color: COLORS.text, fontFamily: "sans-serif" }}>
      {/* 1. SECURE GATEKEEPER */}
      {!user.isActivated && (
        <ActivationWall user={user} onComplete={() => window.location.reload()} />
      )}

      {/* 2. NAVIGATION */}
      <nav style={{ padding: "15px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", sticky: "top" }}>
        <b style={{ fontSize: 20, color: COLORS.accent }}>POPKID EARN</b>
        <div style={{ background: COLORS.border, padding: "5px 12px", borderRadius: 20, fontSize: 14 }}>
          💰 KSH {user.balance || 0}
        </div>
      </nav>

      {/* 3. CONTENT */}
      <div style={{ padding: 20, maxWidth: 500, margin: "0 auto" }}>
        
        {/* Welcome Header */}
        <div style={{ marginBottom: 25 }}>
          <h2 style={{ margin: 0 }}>Hello, {user.name}! 👋</h2>
          <p style={{ color: COLORS.muted, fontSize: 14 }}>You have {user.isActivated ? "Full Access" : "Limited Access"}</p>
        </div>

        {/* Task Section */}
        <section>
          <h3 style={{ marginBottom: 15 }}>Available Tasks</h3>
          
          <Card style={{ display: "flex", alignItems: "center", gap: 15 }}>
            <div style={{ fontSize: 30 }}>📅</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>Daily Check-in</div>
              <div style={{ color: COLORS.accent, fontSize: 12 }}>+ KSH {REWARD_DAILY}</div>
            </div>
            <div style={{ width: 100 }}>
              <Button onClick={() => handleTaskClaim(REWARD_DAILY, "Daily Check-in")}>Claim</Button>
            </div>
          </Card>

          <Card style={{ display: "flex", alignItems: "center", gap: 15 }}>
            <div style={{ fontSize: 30 }}>🧠</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>Quick Trivia</div>
              <div style={{ color: COLORS.accent, fontSize: 12 }}>+ KSH {REWARD_QUIZ}</div>
            </div>
            <div style={{ width: 100 }}>
              <Button onClick={() => handleTaskClaim(REWARD_QUIZ, "Trivia Quiz")}>Start</Button>
            </div>
          </Card>
        </section>

        {/* Referral Section */}
        <Card style={{ marginTop: 20, background: `linear-gradient(to right, #064e3b, ${COLORS.card})` }}>
          <h4 style={{ margin: 0 }}>Invite & Earn</h4>
          <p style={{ fontSize: 12, color: COLORS.muted }}>Earn KSH 20 for every activated referral.</p>
          <div style={{ background: "#000", padding: 10, borderRadius: 8, fontSize: 12, border: "1px dashed #334155" }}>
            {window.location.origin}/join?ref={user.refCode}
          </div>
        </Card>

      </div>

      {/* Bottom Bar */}
      <div style={{ position: "fixed", bottom: 0, width: "100%", background: COLORS.card, display: "flex", justifyContent: "space-around", padding: "12px 0", borderTop: `1px solid ${COLORS.border}` }}>
        <span onClick={() => setActiveTab("tasks")} style={{ color: activeTab === "tasks" ? COLORS.accent : COLORS.muted, cursor: "pointer" }}>Tasks</span>
        <span onClick={() => setActiveTab("wallet")} style={{ color: activeTab === "wallet" ? COLORS.accent : COLORS.muted, cursor: "pointer" }}>Wallet</span>
        <span onClick={() => setActiveTab("profile")} style={{ color: activeTab === "profile" ? COLORS.accent : COLORS.muted, cursor: "pointer" }}>Profile</span>
      </div>
    </div>
  );
}
