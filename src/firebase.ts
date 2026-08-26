import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "infinite-binder-39brs",
  appId: "1:395583522729:web:7484066b1ff1f4f8fbe6b8",
  apiKey: "AIzaSyBpMz-RgCwGNXuqwXfIdELtMyR1dtRAxc4",
  authDomain: "infinite-binder-39brs.firebaseapp.com",
  storageBucket: "infinite-binder-39brs.firebasestorage.app",
  messagingSenderId: "395583522729",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-bd6c1e07-3640-42c6-a9af-9b2e4e4e47f6");
