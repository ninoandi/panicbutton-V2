/*
|--------------------------------------------------------------------------
| Firebase SDK
|--------------------------------------------------------------------------
*/

import {
    initializeApp,
    getApps,
    getApp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
    getDatabase,
    ref,
    onValue,
    get,
    push,
    set,
    update,
    remove
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";


/*
|--------------------------------------------------------------------------
| FIREBASE 1
|--------------------------------------------------------------------------
| Firebase utama yang sekarang digunakan aplikasi Laravel
*/

const firebaseConfig1 = {
    apiKey: "AIzaSyDk2aeQR7T7mh-vwZnxvTT61fJjluojVRa0",
    authDomain: "panicbuttonrtdb-eccd1.firebaseapp.com",
    databaseURL: "https://panicbuttonrtdb-eccd1-default-rtdb.firebaseio.com",
    projectId: "panicbuttonrtdb-eccd1",
    storageBucket: "panicbuttonrtdb-eccd1.firebasestorage.app",
    messagingSenderId: "415344446237",
    appId: "1:415344446237:web:5a73d6177529e4286e2ff4",
    measurementId: "G-1YCQETHDC5"
};


/*
|--------------------------------------------------------------------------
| FIREBASE 2
|--------------------------------------------------------------------------
| Firebase untuk sistem Transmitter / Receiver
|
| DATA DIAMBIL DARI:
| Firebase Console
| Project Settings
| General
| Your apps
|
*/

const firebaseConfig2 = {
  apiKey: "AIzaSyClLPCMp3YzYczGun9_jXUl5bPuLBeWIdA",
  authDomain: "panicbttn2.firebaseapp.com",
  databaseURL: "https://panicbttn2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "panicbttn2",
  storageBucket: "panicbttn2.firebasestorage.app",
  messagingSenderId: "719018654648",
  appId: "1:719018654648:web:073ed3dffeda134975ed4d"
};


/*
|--------------------------------------------------------------------------
| Initialize Firebase 1
|--------------------------------------------------------------------------
*/

const app1 = getApps().find(
    app => app.name === "firebase1"
)
    || initializeApp(
        firebaseConfig1,
        "firebase1"
    );


/*
|--------------------------------------------------------------------------
| Initialize Firebase 2
|--------------------------------------------------------------------------
*/

const app2 = getApps().find(
    app => app.name === "firebase2"
)
    || initializeApp(
        firebaseConfig2,
        "firebase2"
    );


/*
|--------------------------------------------------------------------------
| Database
|--------------------------------------------------------------------------
*/

const db1 = getDatabase(app1);

const db2 = getDatabase(app2);


/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

export {
    app1,
    app2,
    db1,
    db2
};