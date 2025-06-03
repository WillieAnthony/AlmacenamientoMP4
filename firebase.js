// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAuUUcQ3bn6bwtWYW2-1HusbNuJeDbLBI8",
  authDomain: "almacenamientomp4-3d400.firebaseapp.com",
  projectId: "almacenamientomp4-3d400",
  storageBucket: "almacenamientomp4-3d400.appspot.com",
  messagingSenderId: "458059651714",
  appId: "1:458059651714:web:40ba3230ca725db12f729b"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
