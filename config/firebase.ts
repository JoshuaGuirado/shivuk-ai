import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAFRyyJiA4ejD7MRCz-YFL3JIQE7rx2WZw",
  authDomain: "shivuk-2bff0.firebaseapp.com",
  projectId: "shivuk-2bff0",
  storageBucket: "shivuk-2bff0.firebasestorage.app",
  messagingSenderId: "901048991772",
  appId: "1:901048991772:web:037802b0f3cb3862cf1fd9",
  measurementId: "G-QHYZQJ7BD0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth & Firestore
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize Analytics (Safe Mode)
// Wrap in try-catch because getAnalytics can fail if the component isn't registered correctly 
// due to version mismatches or if ad-blockers block the call.
let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (error) {
  console.warn("Firebase Analytics failed to initialize:", error);
}

export { app, auth, db, storage, analytics };