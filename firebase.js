import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD5iFrQ4uprmeVeJCyKMiTDXk2T_k1sv4I",
  authDomain: "ltc-website-8a884.firebaseapp.com",
  projectId: "ltc-website-8a884",
  storageBucket: "ltc-website-8a884.appspot.com",
  messagingSenderId: "1059988013295",
  appId: "1:1059988013295:web:505d59225c70675247db1a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, getDocs };
