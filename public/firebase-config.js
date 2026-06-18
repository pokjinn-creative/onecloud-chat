import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDQp75rBwlGv1PifcZszf98cWA7F_yE8i0",
  authDomain: "onechat-d8f00.firebaseapp.com",
  databaseURL: "https://onechat-d8f00-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "onechat-d8f00",
  storageBucket: "onechat-d8f00.firebasestorage.app",
  messagingSenderId: "238647754412",
  appId: "1:238647754412:web:db6a187b35be5d183aa909",
  measurementId: "G-YC6F6214FP"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };
