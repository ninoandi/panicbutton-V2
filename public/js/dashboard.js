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
    remove
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";


/*
|--------------------------------------------------------------------------
| Firebase Configuration
|--------------------------------------------------------------------------
*/

const firebaseConfig = {
    apiKey: "AIzaSyDk2aeQR7Tmh-vwZnxvTT61fFjluojVRa0",
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
| Initialize Firebase
|--------------------------------------------------------------------------
*/

const app = getApps().length
    ? getApp()
    : initializeApp(firebaseConfig);

const db = getDatabase(app);


/*
|--------------------------------------------------------------------------
| DOM Elements
|--------------------------------------------------------------------------
*/

const loadingOverlay =
    document.getElementById("loadingOverlay");

const totalPerumahan =
    document.getElementById("totalPerumahan");

const totalUsers =
    document.getElementById("totalUsers");

const statusText =
    document.getElementById("statusText");

const statusCard =
    document.getElementById("statusCard");

const liveAlertBox =
    document.getElementById("liveAlert");

const sidebar =
    document.getElementById("sidebar");

const overlay =
    document.getElementById("sidebarOverlay");

const mainContent =
    document.getElementById("mainContent");


/*
|--------------------------------------------------------------------------
| Loading
|--------------------------------------------------------------------------
*/

let firebaseLoaded = false;

function hideLoading() {

    if (firebaseLoaded && loadingOverlay) {

        setTimeout(() => {

            loadingOverlay.style.opacity = "0";

            setTimeout(() => {

                loadingOverlay.style.display = "none";

            }, 400);

        }, 300);

    }
}


/*
|--------------------------------------------------------------------------
| Sidebar
|--------------------------------------------------------------------------
*/

function toggleSidebar() {

    if (!sidebar || !overlay || !mainContent) {
        return;
    }

    sidebar.classList.toggle("open");

    overlay.classList.toggle("show");

    if (window.innerWidth > 800) {

        mainContent.classList.toggle("sidebar-open");

    }

}


function closeSidebar() {

    if (!sidebar || !overlay || !mainContent) {
        return;
    }

    sidebar.classList.remove("open");

    overlay.classList.remove("show");

    mainContent.classList.remove("sidebar-open");

}


/*
|--------------------------------------------------------------------------
| Global Sidebar Function
|--------------------------------------------------------------------------
|
| Supaya onclick="toggleSidebar()" pada Blade tetap bisa digunakan.
|--------------------------------------------------------------------------
*/

window.toggleSidebar = toggleSidebar;

window.closeSidebar = closeSidebar;


window.addEventListener("resize", () => {

    if (!sidebar || !overlay || !mainContent) {
        return;
    }

    if (
        window.innerWidth > 800 &&
        sidebar.classList.contains("open")
    ) {

        mainContent.classList.add("sidebar-open");

    }
    else {

        mainContent.classList.remove("sidebar-open");

    }

});


/*
|--------------------------------------------------------------------------
| Firebase Reference
|--------------------------------------------------------------------------
*/

const perumahanRef =
    ref(db, "perumahan");


/*
|--------------------------------------------------------------------------
| Firebase Listener
|--------------------------------------------------------------------------
*/

onValue(
    perumahanRef,

    (snapshot) => {

        try {

            const perumahanData =
                snapshot.val() || {};


            let totalUserCount = 0;

            let latestMonitor = null;

            let latestKey = "";

            let latestPerumahan = null;


            /*
            |--------------------------------------------------------------------------
            | Loop Perumahan
            |--------------------------------------------------------------------------
            */

            for (
                const id in perumahanData
            ) {

                const p =
                    perumahanData[id] || {};


                /*
                |--------------------------------------------------------------------------
                | Monitor
                |--------------------------------------------------------------------------
                */

                const monitor =
                    p.monitor || {};


                for (
                    const key in monitor
                ) {

                    const entry =
                        monitor[key];


                    if (
                        key > latestKey
                    ) {

                        latestKey =
                            key;

                        latestMonitor =
                            entry;

                        latestPerumahan =
                            p;

                    }

                }


                /*
                |--------------------------------------------------------------------------
                | Users
                |--------------------------------------------------------------------------
                */

                const users =
                    p.users || {};


                totalUserCount +=
                    Object.keys(users).length;

            }


            /*
            |--------------------------------------------------------------------------
            | Total Perumahan
            |--------------------------------------------------------------------------
            */

            if (totalPerumahan) {

                totalPerumahan.textContent =
                    Object.keys(perumahanData).length;

            }


            /*
            |--------------------------------------------------------------------------
            | Total Users
            |--------------------------------------------------------------------------
            */

            if (totalUsers) {

                totalUsers.textContent =
                    totalUserCount;

            }


            /*
            |--------------------------------------------------------------------------
            | Status Button
            |--------------------------------------------------------------------------
            */

            const mainState =
                (
                    latestPerumahan
                        ?.buzzers
                        ?.main
                        ?.state
                    || "off"
                ).toLowerCase();


            const priority =
                (
                    latestMonitor
                        ?.priority
                    || "off"
                ).toLowerCase();


            if (statusCard) {

                statusCard.className =
                    "card-status";

                statusCard.style.backgroundColor =
                    "";

                statusCard.style.color =
                    "";

            }


            if (
                mainState === "on"
            ) {

                if (statusText) {

                    statusText.textContent =
                        "ON";

                }


                if (
                    priority === "darurat"
                ) {

                    statusCard?.classList.add(
                        "darurat"
                    );

                }
                else if (
                    priority === "penting"
                ) {

                    statusCard?.classList.add(
                        "penting"
                    );

                }
                else if (
                    priority === "biasa"
                ) {

                    statusCard?.classList.add(
                        "biasa"
                    );

                }
                else {

                    if (statusCard) {

                        statusCard.style.backgroundColor =
                            "#ccc";

                        statusCard.style.color =
                            "#000";

                    }

                }

            }
            else {

                if (statusText) {

                    statusText.textContent =
                        "OFF";

                }


                if (statusCard) {

                    statusCard.style.backgroundColor =
                        "#f4f4f4";

                    statusCard.style.color =
                        "#000";

                }

            }


            /*
            |--------------------------------------------------------------------------
            | Live Alert
            |--------------------------------------------------------------------------
            */

            if (
                latestMonitor &&
                latestPerumahan &&
                mainState === "on"
            ) {

                const {

                    latitude,

                    longitude,

                    message = "-",

                    houseNumber =
                        "Tidak Diketahui",

                    time = "-",

                    name =
                        "Tidak Diketahui"

                } = latestMonitor;


                const {

                    info: {

                        nama:
                            perumahanNama =
                                "Tidak Diketahui",

                        lokasi:
                            perumahanLokasi =
                                "Tidak Diketahui"

                    } = {}

                } = latestPerumahan;


                const lat =
                    parseFloat(latitude);


                const lon =
                    parseFloat(longitude);


                /*
                |--------------------------------------------------------------------------
                | Google Maps
                |--------------------------------------------------------------------------
                */

                let mapsLink =
                    '<span style="color:#999;">Tidak tersedia</span>';


                if (
                    !isNaN(lat) &&
                    !isNaN(lon)
                ) {

                    mapsLink = `

                        <a
                            href="https://www.google.com/maps?q=${lat},${lon}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="location-link"
                        >

                            📍 Buka Lokasi

                        </a>

                    `;

                }


                /*
                |--------------------------------------------------------------------------
                | Priority
                |--------------------------------------------------------------------------
                */

                let priorityClass =
                    "priority-biasa";


                if (
                    priority === "darurat"
                ) {

                    priorityClass =
                        "priority-darurat";


                    if (liveAlertBox) {

                        liveAlertBox.style.borderLeftColor =
                            "red";

                    }

                }
                else if (
                    priority === "penting"
                ) {

                    priorityClass =
                        "priority-penting";


                    if (liveAlertBox) {

                        liveAlertBox.style.borderLeftColor =
                            "orange";

                    }

                }
                else {

                    if (liveAlertBox) {

                        liveAlertBox.style.borderLeftColor =
                            "green";

                    }

                }


                /*
                |--------------------------------------------------------------------------
                | Time
                |--------------------------------------------------------------------------
                */

                let formattedTime =
                    time;


                const timeParts =
                    time.split(" waktu ");


                if (
                    timeParts.length === 2
                ) {

                    const [
                        dateStr,
                        timeStr
                    ] = timeParts;


                    const [
                        year,
                        month,
                        day
                    ] = dateStr.split("-");


                    formattedTime =
                        `${day}-${month}-${year} pukul ${timeStr}`;

                }


                /*
                |--------------------------------------------------------------------------
                | Render Live Alert
                |--------------------------------------------------------------------------
                */

                if (liveAlertBox) {

                    liveAlertBox.innerHTML = `

                        <div class="live-box-content">

                            <h1>

                                Nomor Rumah:

                                <strong>
                                    ${houseNumber}
                                </strong>

                                Terdaftar untuk:

                                <strong>
                                    ${name}
                                </strong>

                            </h1>


                            <hr>


                            <h5>

                                <strong>
                                    Perumahan:
                                </strong>

                                ${perumahanNama}

                            </h5>


                            <h5>

                                <strong>
                                    Lokasi Perumahan:
                                </strong>

                                ${perumahanLokasi}

                            </h5>


                            <h6>

                                <strong>
                                    Waktu:
                                </strong>

                                ${formattedTime}

                            </h6>


                            <p style="font-size:18px;">

                                Lokasi:

                                ${mapsLink}

                            </p>


                            <p style="font-size:18px;">

                                Prioritas:

                                <span
                                    class="priority-box ${priorityClass}"
                                >
                                    ${priority}
                                </span>

                            </p>


                            <p class="live-box-message">

                                <strong>
                                    Pesan:
                                </strong>

                                ${message}

                            </p>

                        </div>

                    `;

                }

            }
            else {

                if (liveAlertBox) {

                    liveAlertBox.innerHTML = `

                        <div class="live-empty">

                            🚨 Peringatan Darurat Akan Tampil Disini

                        </div>

                    `;

                    liveAlertBox.style.borderLeftColor =
                        "#999";

                }

            }


            /*
            |--------------------------------------------------------------------------
            | Loading selesai
            |--------------------------------------------------------------------------
            */

            firebaseLoaded = true;

            hideLoading();

        }
        catch (error) {

            console.error(
                "Error memproses data Firebase:",
                error
            );

            showFirebaseError(
                error.message
            );

        }

    },

    (error) => {

        console.error(
            "Firebase error:",
            error
        );

        showFirebaseError(
            error.message
        );

    }

);


/*
|--------------------------------------------------------------------------
| Firebase Error
|--------------------------------------------------------------------------
*/

function showFirebaseError(message) {

    console.error(
        "Firebase gagal:",
        message
    );


    if (loadingOverlay) {

        loadingOverlay.innerHTML = `

            <div
                style="
                    text-align:center;
                    padding:30px;
                    max-width:500px;
                "
            >

                <div
                    style="
                        font-size:50px;
                        margin-bottom:15px;
                    "
                >
                    ⚠️
                </div>


                <h2>
                    Gagal Memuat Dashboard
                </h2>


                <p>
                    Tidak dapat terhubung ke Firebase.
                </p>


                <p
                    style="
                        color:#777;
                        font-size:14px;
                    "
                >
                    ${message}
                </p>


                <button
                    onclick="location.reload()"
                    style="
                        padding:10px 20px;
                        border:none;
                        border-radius:8px;
                        background:#006400;
                        color:white;
                        cursor:pointer;
                    "
                >
                    Coba Lagi
                </button>

            </div>

        `;

        loadingOverlay.style.opacity =
            "1";

        loadingOverlay.style.display =
            "flex";

    }

}


/*
|--------------------------------------------------------------------------
| Escape HTML
|--------------------------------------------------------------------------
*/

function escapeHtml(str = "") {

    return String(str)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}




/*
|--------------------------------------------------------------------------
| Debug
|--------------------------------------------------------------------------
*/

console.log(
    "dashboard.js berhasil dimuat"
);

console.log(
    "Firebase berhasil diinisialisasi"
);