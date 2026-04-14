import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCcVzqXTPUPMI6LJvp4sBebUax2_pP4wT0",
  authDomain: "pay-adbc1.firebaseapp.com",
  projectId: "pay-adbc1",
  storageBucket: "pay-adbc1.firebasestorage.app",
  messagingSenderId: "1038888380824",
  appId: "1:1038888380824:web:33de535a36fe54e4dd63ed"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();