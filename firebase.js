import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, onValue, push, remove, update }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAp6VtAg7H7nOXCa2zP3xXySqGafBNOhfY",
  authDomain: "propdesk-1918e.firebaseapp.com",
  databaseURL: "https://propdesk-1918e-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "propdesk-1918e",
  storageBucket: "propdesk-1918e.firebasestorage.app",
  messagingSenderId: "852316628804",
  appId: "1:852316628804:web:d857446367be63f2ff5911"
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// ── helpers ──────────────────────────────────────────────────────────────────
export const listenTo   = (path, cb) => onValue(ref(db, path), snap => cb(snap.val()));
export const setData    = (path, data) => set(ref(db, path), data);
export const pushData   = (path, data) => push(ref(db, path), data);
export const removeData = (path) => remove(ref(db, path));
export const updateData = (path, data) => update(ref(db, path), data);
