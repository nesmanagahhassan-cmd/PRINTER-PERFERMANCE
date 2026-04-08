// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.x.x/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.x.x/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.x.x/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBGo8FEi0-SN8zu203ZwnORE9s7d9CuBO0",
  authDomain: "printer-perfermance.firebaseapp.com",
  projectId: "printer-perfermance",
  storageBucket: "printer-perfermance.firebasestorage.app",
  messagingSenderId: "619398156190",
  appId: "1:619398156190:web:e5e8bab3787322870c508f",
  measurementId: "G-MYVY63DMZ4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);