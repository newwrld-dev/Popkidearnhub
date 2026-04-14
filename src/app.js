import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, arrayUnion, collection, query, where, getDocs } from "firebase/firestore";

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

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("login");
  const [form, setForm] = useState({ name: "", phone: "", password: "", ref: "" });

  const TASKS = [
    { id: 1, title: "Daily Check-ins", desc: "Complete your daily check-in to track progress and earn rewards." },
    { id: 2, title: "Trivia Quiz", desc: "Test your knowledge with fun trivia questions and earn points." },
    { id: 3, title: "Chat to Earn", desc: "Engage in conversations and earn rewards for participation." },
    { id: 4, title: "Watch Videos to Earn", desc: "Watch educational videos and earn points while learning." },
    { id: 5, title: "Test App", desc: "Try out new features and provide feedback." },
    { id: 6, title: "More", desc: "Explore more tasks and activities." }
  ];

  const handleAuth = async () => {
    try {
      const userRef = doc(db, "users", form.phone);
      const userSnap = await getDoc(userRef);
      if (view === "register") {
        if (userSnap.exists()) return alert("Exists!");
        const newUser = { ...form, balance: 0, activated: false, refCode: Math.random().toString(36).substring(7).toUpperCase() };
        await setDoc(userRef, newUser);
        setUser(newUser);
      } else {
        if (userSnap.exists() && userSnap.data().password === form.password) setUser(userSnap.data());
        else alert("Wrong details");
      }
    } catch (e) { console.error(e); }
  };

  if (!user) return (
    <div className="auth-container">
      <div className="card">
        <h2>{view === "login" ? "Login" : "Register"}</h2>
        {view === "register" && <input className="input" placeholder="Name" onChange={e => setForm({...form, name: e.target.value})} />}
        <input className="input" placeholder="Phone" onChange={e => setForm({...form, phone: e.target.value})} />
        <input className="input" type="password" placeholder="Password" onChange={e => setForm({...form, password: e.target.value})} />
        <button className="btn" onClick={handleAuth}>{view === "login" ? "Login" : "Join Now"}</button>
        <p onClick={() => setView(view === "login" ? "register" : "login")}>Switch to {view === "login" ? "Register" : "Login"}</p>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      <nav className="navbar">
        <span className="brand">TaskBucks</span>
        <div className="nav-btns">
          <button className="nav-link active">Dashboard</button>
          <button className="nav-link">Tasks</button>
          <button className="nav-link">Earnings</button>
          <button className="nav-link logout">Logout</button>
        </div>
      </nav>

      <div className="main-content">
        <h1>Your Tasks</h1>
        <p className="subtitle">Complete tasks to earn rewards and level up</p>
        <div className="task-grid">
          {TASKS.map(t => (
            <div key={t.id} className="task-card">
              <h3>{t.title}</h3>
              <p>{t.desc}</p>
              <button className="task-btn">Activate account to do this task</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
