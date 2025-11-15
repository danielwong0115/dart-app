// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCNPZ7y8g2rNNoXW6AEJnHVHezRBiJZNfQ",
  authDomain: "dart-app-755c2.firebaseapp.com",
  projectId: "dart-app-755c2",
  storageBucket: "dart-app-755c2.firebasestorage.app",
  messagingSenderId: "180623810826",
  appId: "1:180623810826:web:cead9821563605b9c5daf3"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Firestore Database
export const db = getFirestore(app);