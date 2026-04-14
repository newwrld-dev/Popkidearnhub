import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, doc, getDoc, setDoc, updateDoc, 
  increment, arrayUnion, collection, query, where, getDocs 
} from "firebase/firestore";

// Your Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAla-j5XiDE8Dfx0WRf5T-S2omYydrnEiM",
  authDomain: "earnhub-e3c63.firebaseapp.com",
  projectId: "earnhub-e3c63",
  storageBucket: "earnhub-e3c63.firebasestorage.app",
  messagingSenderId: "236965383629",
  appId: "1:236965383629:web:89fbfe37ad12ad3ef9c884",
  measurementId: "G-9T6EHPKQ16"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("login");
  const [form, setForm] = useState({ name: "", phone: "", password: "", ref: "" });
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) { setForm(f => ({ ...f, ref })); setView("register"); }
  }, []);

  const handleAuth = async () => {
    if (!form.phone || !form.password) return showToast("Fill all fields!");
    try {
      const userRef = doc(db, "users", form.phone);
      const userSnap = await getDoc(userRef);

      if (view === "register") {
        if (userSnap.exists()) throw new Error("User exists!");
        const newUser = {
          name: form.name,
          phone: form.phone,
          password: form.password,
          balance: 0,
          activated: false,
          refCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
          referredBy: form.ref || null,
          activity: [{ msg: "Account Created", at: new Date().toISOString() }]
        };
        await setDoc(userRef, newUser);
        setUser(newUser);
      } else {
        if (!userSnap.exists() || userSnap.data().password !== form.password) throw new Error("Invalid login!");
        setUser(userSnap.data());
      }
    } catch (e) { showToast(e.message); }
  };

  const verifyPayment = async (code) => {
    if (code.length < 5) return showToast("Invalid M-Pesa Code");
    try {
      const userRef = doc(db, "users", user.phone);
      await updateDoc(userRef, { activated: true });

      if (user.referredBy) {
        const q = query(collection(db, "users"), where("refCode", "==", user.referredBy));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          await updateDoc(doc(db, "users", qSnap.docs[0].id), {
            balance: increment(20),
            activity: arrayUnion({ msg: `Referral bonus +20 from ${user.name}`, at: new Date().toISOString() })
          });
        }
      }
      setUser((await getDoc(userRef)).data());
      showToast("Activated! Bonus paid to referrer.");
    } catch (e) { showToast("Error during activation"); }
  };

  if (!user) return (
    <div className="auth-screen">
      <div className="card">
        <h1 style={{ color: '#00d4aa' }}>EarnHub</h1>
        {view === "register" && <input className="input" placeholder="Name" onChange={e => setForm({...form, name: e.target.value})} />}
        <input className="input" placeholder="Phone" onChange={e => setForm({...form, phone: e.target.value})} />
        <input className="input" type="password" placeholder="Password" onChange={e => setForm({...form, password: e.target.value})} />
        {view === "register" && <input className="input" placeholder="Referral (Optional)" value={form.ref} onChange={e => setForm({...form, ref: e.target.value})} />}
        <button className="btn" onClick={handleAuth}>{view === "login" ? "Login" : "Register"}</button>
        <p onClick={() => setView(view === "login" ? "register" : "login")} style={{ cursor: 'pointer', textAlign: 'center', marginTop: '10px' }}>
          {view === "login" ? "Create Account" : "Back to Login"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="dash">
      <nav className="nav">
        <b>EARNHUB</b>
        <span style={{ color: '#00d4aa' }}>KSH {user.balance}</span>
      </nav>
      <div style={{ padding: '20px' }}>
        {!user.activated ? (
          <div className="card activation">
            <h3>Account Inactive</h3>
            <p>Pay 100/- to start earning.</p>
            <a href="https://lipwa.link/7762" target="_blank" className="btn" style={{ textDecoration: 'none', display: 'block', marginBottom: '10px' }}>PAY 100/-</a>
            <input id="mc" className="input" placeholder="M-Pesa Code" />
            <button className="btn" onClick={() => verifyPayment(document.getElementById('mc').value)}>Verify</button>
          </div>
        ) : (
          <div className="card">
            <h3>Refer & Earn</h3>
            <p>Your Link: <code>{window.location.origin}?ref={user.refCode}</code></p>
            <button className="btn" onClick={() => {navigator.clipboard.writeText(`${window.location.origin}?ref=${user.refCode}`); showToast("Copied!")}}>Copy Link</button>
          </div>
        )}
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
