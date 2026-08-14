import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
    getDatabase,
    ref,
    onValue
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


const app = initializeApp(firebaseConfig);

const db = getDatabase(app);


/*
|--------------------------------------------------------------------------
| Element
|--------------------------------------------------------------------------
*/

const loadingOverlay =
    document.getElementById('loadingOverlay');

const totalPerumahan =
    document.getElementById('totalPerumahan');

const totalUsers =
    document.getElementById('totalUsers');

const statusText =
    document.getElementById('statusText');

const statusCard =
    document.getElementById('statusCard');

const liveAlertBox =
    document.getElementById('liveAlert');


/*
|--------------------------------------------------------------------------
| Firebase Reference
|--------------------------------------------------------------------------
*/

const perumahanRef =
    ref(db, 'perumahan');


/*
|--------------------------------------------------------------------------
| Firebase Listener
|--------------------------------------------------------------------------
*/

onValue(perumahanRef, (snapshot) => {

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
            perumahanData[id];


        /*
        | Monitor
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

                latestKey = key;

                latestMonitor =
                    entry;

                latestPerumahan =
                    p;

            }

        }


        /*
        | Users
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

    totalPerumahan.textContent =
        Object.keys(perumahanData).length;


    /*
    |--------------------------------------------------------------------------
    | Total Users
    |--------------------------------------------------------------------------
    */

    totalUsers.textContent =
        totalUserCount;


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
            || 'off'
        ).toLowerCase();


    const priority =
        (
            latestMonitor
                ?.priority
            || 'off'
        ).toLowerCase();


    statusCard.className =
        'card-status';


    if (
        mainState === 'on'
    ) {

        statusText.textContent =
            'ON';


        if (
            priority === 'darurat'
        ) {

            statusCard.classList.add(
                'darurat'
            );

        }
        else if (
            priority === 'penting'
        ) {

            statusCard.classList.add(
                'penting'
            );

        }
        else if (
            priority === 'biasa'
        ) {

            statusCard.classList.add(
                'biasa'
            );

        }

    }
    else {

        statusText.textContent =
            'OFF';

        statusCard.style.backgroundColor =
            '#f4f4f4';

        statusCard.style.color =
            '#000';

    }


    /*
    |--------------------------------------------------------------------------
    | Live Alert
    |--------------------------------------------------------------------------
    */

    if (
        latestMonitor &&
        latestPerumahan &&
        mainState === 'on'
    ) {

        const {
            latitude,
            longitude,
            message = '-',
            houseNumber = 'Tidak Diketahui',
            time = '-',
            name = 'Tidak Diketahui'

        } = latestMonitor;


        const {
            info: {

                nama:
                    perumahanNama =
                        'Tidak Diketahui',

                lokasi:
                    perumahanLokasi =
                        'Tidak Diketahui'

            } = {}

        } = latestPerumahan;


        const lat =
            parseFloat(latitude);

        const lon =
            parseFloat(longitude);


        /*
        | Google Maps
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
        | Priority
        */

        let priorityClass =
            'priority-biasa';


        if (
            priority === 'darurat'
        ) {

            priorityClass =
                'priority-darurat';

            liveAlertBox.style.borderLeftColor =
                'red';

        }
        else if (
            priority === 'penting'
        ) {

            priorityClass =
                'priority-penting';

            liveAlertBox.style.borderLeftColor =
                'orange';

        }
        else {

            liveAlertBox.style.borderLeftColor =
                'green';

        }


        /*
        | Time
        */

        let formattedTime =
            time;


        const timeParts =
            time.split(' waktu ');


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
            ] = dateStr.split('-');


            formattedTime =
                `${day}-${month}-${year} pukul ${timeStr}`;

        }


        /*
        | Render Alert
        */

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
    else {

        liveAlertBox.innerHTML = `

            <div class="live-empty">

                🚨 Peringatan Darurat Akan Tampil Disini

            </div>

        `;

        liveAlertBox.style.borderLeftColor =
            '#999';

    }


    /*
    |--------------------------------------------------------------------------
    | Remove Loading
    |--------------------------------------------------------------------------
    */

    setTimeout(() => {

        loadingOverlay.style.opacity =
            '0';

        setTimeout(() => {

            loadingOverlay.style.display =
                'none';

        }, 400);

    }, 300);

});