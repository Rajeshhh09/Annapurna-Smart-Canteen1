// frontend/src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBJc2PhBBPJLRNTbo8g-py58VP5VtvO5i8",
  authDomain: "oversize-tshirt.firebaseapp.com",
  projectId: "oversize-tshirt",
  storageBucket: "oversize-tshirt.firebasestorage.app",
  messagingSenderId: "576646479260",
  appId: "1:576646479260:web:38c71f519fb06a8178dc59"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);