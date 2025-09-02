
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC8LiFq-T9h22G4D1ZuH-qS3g_6f6cqB1k",
  authDomain: "mediscribe-assist-k6tzk.firebaseapp.com",
  projectId: "mediscribe-assist-k6tzk",
  storageBucket: "mediscribe-assist-k6tzk.appspot.com",
  messagingSenderId: "105330976065",
  appId: "1:105330976065:web:774540bdf8b83ab31dadc0"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Analytics can be initialized here if needed, but it's often better to check if window is defined.
if (typeof window !== 'undefined') {
    try {
        const analytics = getAnalytics(app);
    } catch (error) {
        console.log("Could not initialize Analytics", error)
    }
}


export { app };
