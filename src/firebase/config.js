import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyA3C6br5CrVpGVNC5O4VywVFVjVIVpl03o",
    authDomain: "e-commerce-a9c8a.firebaseapp.com",
    projectId: "e-commerce-a9c8a",
    storageBucket: "e-commerce-a9c8a.firebasestorage.app",
    messagingSenderId: "200715522039",
    appId: "1:200715522039:web:531269e18b25a0f22868f2",
    measurementId: "G-D9G04TJB6S"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);export const db = getFirestore(app);
