
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCicNixJ3zN9u7sqJhzS0vW10SA2lpNZps",
  authDomain: "registro-animal-mx.firebaseapp.com",
  databaseURL: "https://registro-animal-mx-default-rtdb.firebaseio.com",
  projectId: "registro-animal-mx",
  storageBucket: "registro-animal-mx.appspot.com",
  messagingSenderId: "520878195963",
  appId: "1:520878195963:web:b795bc0efb665b7a9b1c5e",
  measurementId: "G-5NGXPZJWM7"
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
