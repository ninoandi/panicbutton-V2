import {
    db1,
    db2
} from "./firebase-config.js";

import {
    ref,
    onValue,
    get,
    push,
    set,
    remove
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";


/* =========================================
   PERUMAHAN ID
========================================= */

const perumahanId = window.perumahanId;

if (!perumahanId) {

    document.getElementById(
        'loadingOverlay'
    ).style.display = 'none';

    document.querySelector(
        '.detail-grafik-page'
    ).innerHTML = `

        <div style="
            text-align:center;
            padding:50px;
        ">

            <h1>Error</h1>

            <p>
                Perumahan ID tidak ditemukan.
            </p>

            <a
                href="/statistik"
                class="back-button"
            >
                Kembali
            </a>

        </div>

    `;

    throw new Error(
        'Perumahan ID tidak ditemukan'
    );
}


/* =========================================
   FIREBASE REFERENCES
========================================= */

const daftarPerumahanRef =
    ref(
        db1,
        `daftar_perumahan/${perumahanId}`
    );

const monitorRef =
    ref(
        db1,
        `perumahan/${perumahanId}/monitor`
    );


/* =========================================
   CHART VARIABLES
========================================= */

let barChart = null;
let pieChart = null;
let lineChart = null;


/* =========================================
   DATA AWAL
========================================= */

function createInitialData() {

    return {

        darurat: 0,

        penting: 0,

        biasa: 0,

        statusSelesai: 0,

        statusProses: 0,

        usersData: {}

    };

}


/* =========================================
   MONITOR DATA
========================================= */

async function getMonitorData() {

    const snapshot =
        await get(monitorRef);

    return snapshot.val();

}


/* =========================================
   NAMA PERUMAHAN
========================================= */

get(daftarPerumahanRef)

    .then(snapshot => {

        const perumahanName =
            snapshot.val() ||
            `ID: ${perumahanId}`;

        const h1 =
            document.querySelector(
                '.detail-grafik-page h1'
            );

        h1.innerHTML += `

            <span style="
                color:#888;
                font-size:1rem;
                display:block;
                margin-bottom:-15px;
                margin-top:18px;
            ">
                PERUMAHAN:
            </span>

            <strong style="
                color:#2c2c2c;
                text-transform:uppercase;
                font-size:1rem;
                font-weight:500;
            ">
                ${perumahanName}
            </strong>

        `;

    })

    .catch(error => {

        console.error(
            "Gagal mengambil nama perumahan:",
            error
        );

    });


/* =========================================
   UPDATE CHART
========================================= */

function updateCharts(data) {


    /* =====================================
       BAR CHART
    ===================================== */

    const barData = {

        labels: [
            'Darurat',
            'Penting',
            'Biasa'
        ],

        datasets: [{

            label: 'Jumlah Peringatan',

            data: [
                data.darurat,
                data.penting,
                data.biasa
            ],

            backgroundColor: [
                '#F44336',
                '#FFC107',
                '#4CAF50'
            ],

            borderRadius: 5

        }]

    };


    if (barChart) {

        barChart.destroy();

    }


    barChart = new Chart(

        document.getElementById(
            'barChart'
        ),

        {

            type: 'bar',

            data: barData,

            options: {

                responsive: true,

                aspectRatio:
                    window.innerWidth < 600
                        ? 1.2
                        : 2,

                plugins: {

                    legend: {
                        display: false
                    }

                },

                scales: {

                    y: {
                        beginAtZero: true
                    }

                },

                onClick:
                    handlePriorityClick

            }

        }

    );


    /* =====================================
       PIE CHART
    ===================================== */

    const total =
        data.statusSelesai +
        data.statusProses || 1;

    const selesaiPercent =
        (
            data.statusSelesai /
            total *
            100
        ).toFixed(1);

    const prosesPercent =
        (
            data.statusProses /
            total *
            100
        ).toFixed(1);


    const pieData = {

        labels: [

            `Proses ${prosesPercent}%`,

            `Selesai ${selesaiPercent}%`

        ],

        datasets: [{

            data: [

                data.statusProses,

                data.statusSelesai

            ],

            backgroundColor: [
                '#FA1AE7',
                '#1AE7FA'
            ],

            hoverOffset: 20

        }]

    };


    if (pieChart) {

        pieChart.destroy();

    }


    pieChart = new Chart(

        document.getElementById(
            'pieChart'
        ),

        {

            type: 'pie',

            data: pieData,

            options: {

                responsive: true,

                aspectRatio:
                    window.innerWidth < 600
                        ? 1
                        : 1.6,

                onClick:
                    handleStatusClick

            }

        }

    );


    /* =====================================
       RANKING
    ===================================== */

    const ranking =

        Object.entries(
            data.usersData
        )

        .map(
            ([name, userData]) => ({

                name,

                total:
                    userData.timestamps.length

            })
        )

        .sort(
            (a, b) =>
                b.total - a.total
        );


    const labels =
        ranking.map(
            item => item.name
        );

    const totals =
        ranking.map(
            item => item.total
        );


    const rankingData = {

        labels,

        datasets: [{

            label:
                'Jumlah Tekan Tombol',

            data: totals,

            backgroundColor:
                '#673AB7',

            borderRadius: 5

        }]

    };


    if (lineChart) {

        lineChart.destroy();

    }


    lineChart = new Chart(

        document.getElementById(
            'rankingChart'
        ),

        {

            type: 'bar',

            data: rankingData,

            options: {

                indexAxis: 'y',

                responsive: true,

                aspectRatio:
                    window.innerWidth < 600
                        ? 1.5
                        : 2.2,

                plugins: {

                    legend: {
                        display: false
                    }

                },

                onClick:
                    handleRankingClick,

                scales: {

                    x: {

                        beginAtZero: true,

                        title: {

                            display: true,

                            text:
                                'Jumlah Tekan Tombol'

                        },

                        ticks: {

                            precision: 0

                        }

                    },

                    y: {

                        title: {

                            display: true,

                            text:
                                'Nama Pengguna'

                        }

                    }

                }

            }

        }

    );

}


/* =========================================
   PRIORITY CLICK
========================================= */

async function handlePriorityClick(
    evt,
    elements
) {

    if (!elements.length) return;

    const index =
        elements[0].index;

    const selectedPriority =
        [
            'darurat',
            'penting',
            'biasa'
        ][index];


    const raw =
        await getMonitorData();

    const filtered = {};


    if (raw) {

        Object.values(raw)
            .forEach(item => {

                const priority =
                    (
                        item.priority ||
                        ""
                    ).toLowerCase();

                const name =
                    item.name ||
                    "Unknown";


                if (
                    priority ===
                    selectedPriority
                ) {

                    if (
                        !filtered[name]
                    ) {

                        filtered[name] = 0;

                    }

                    filtered[name]++;

                }

            });

    }


    const sortedEntries =

        Object.entries(filtered)

        .sort(
            (a, b) =>
                b[1] - a[1]
        );


    let html = `

        <p>
            <strong>
                Seberapa sering orang-orang ini
                menekan panic button dengan
                prioritas ${selectedPriority}
            </strong>
        </p>

        <table class="modal-table">

            <thead>

                <tr>
                    <th>Nama</th>
                    <th>Jumlah</th>
                </tr>

            </thead>

            <tbody>

    `;


    for (
        const [name, count]
        of sortedEntries
    ) {

        html += `

            <tr>

                <td>${name}</td>

                <td>${count}</td>

            </tr>

        `;

    }


    html += `

            </tbody>

        </table>

    `;


    openModal(
        `Prioritas: ${selectedPriority}`,
        html
    );

}


/* =========================================
   STATUS CLICK
========================================= */

async function handleStatusClick(
    evt,
    elements
) {

    if (!elements.length) return;


    const index =
        elements[0].index;

    const selectedStatus =
        index === 1
            ? 'selesai'
            : 'proses';


    const raw =
        await getMonitorData();

    const filtered = {};


    if (raw) {

        Object.values(raw)
            .forEach(item => {

                const status =
                    (
                        item.status ||
                        ""
                    ).toLowerCase();

                const name =
                    item.name ||
                    "Unknown";


                if (
                    status ===
                    selectedStatus
                ) {

                    if (
                        !filtered[name]
                    ) {

                        filtered[name] = 0;

                    }

                    filtered[name]++;

                }

            });

    }


    const sortedEntries =

        Object.entries(filtered)

        .sort(
            (a, b) =>
                b[1] - a[1]
        );


    let html = `

        <p>
            Berikut orang-orang dengan
            Status Laporan:
            <strong>
                ${selectedStatus}
            </strong>
        </p>

        <table class="modal-table">

            <thead>

                <tr>
                    <th>Nama</th>
                    <th>Jumlah</th>
                </tr>

            </thead>

            <tbody>

    `;


    for (
        const [name, count]
        of sortedEntries
    ) {

        html += `

            <tr>

                <td>${name}</td>

                <td>${count}</td>

            </tr>

        `;

    }


    html += `

            </tbody>

        </table>

    `;


    openModal(
        `Status: ${selectedStatus}`,
        html
    );

}


/* =========================================
   COMPARISON
========================================= */

document
    .getElementById(
        'lihatPerbandinganBtn'
    )
    .addEventListener(
        'click',
        async () => {

            const raw =
                await getMonitorData();

            const userStats = {};


            if (raw) {

                Object.values(raw)
                    .forEach(item => {

                        const name =
                            item.name ||
                            "Unknown";

                        const status =
                            (
                                item.status ||
                                ""
                            ).toLowerCase();


                        if (
                            !userStats[name]
                        ) {

                            userStats[name] = {

                                selesai: 0,

                                proses: 0

                            };

                        }


                        if (
                            status ===
                            "selesai"
                        ) {

                            userStats[name]
                                .selesai++;

                        }

                        else if (
                            status ===
                            "proses"
                        ) {

                            userStats[name]
                                .proses++;

                        }

                    });

            }


            const sortedEntries =

                Object.entries(userStats)

                .sort(
                    (a, b) => {

                        const totalA =
                            a[1].selesai +
                            a[1].proses;

                        const totalB =
                            b[1].selesai +
                            b[1].proses;

                        return totalB - totalA;

                    }
                );


            let html = `

                <table class="modal-table">

                    <thead>

                        <tr>

                            <th>No</th>

                            <th>Nama</th>

                            <th>Selesai</th>

                            <th>Proses</th>

                            <th>%</th>

                        </tr>

                    </thead>

                    <tbody>

            `;


            let i = 1;


            for (
                const [name, stat]
                of sortedEntries
            ) {

                const total =
                    stat.selesai +
                    stat.proses;

                const percentage =
                    total > 0
                        ? (
                            stat.selesai /
                            total *
                            100
                        ).toFixed(1)
                        : "0.0";


                html += `

                    <tr>

                        <td>${i++}</td>

                        <td>${name}</td>

                        <td>${stat.selesai}</td>

                        <td>${stat.proses}</td>

                        <td>${percentage}%</td>

                    </tr>

                `;

            }


            html += `

                    </tbody>

                </table>

            `;


            openModal(
                "Perbandingan Status Peringatan",
                html
            );

        }
    );


/* =========================================
   RANKING CLICK
========================================= */

async function handleRankingClick(
    evt,
    elements
) {

    if (!elements.length) return;


    const index =
        elements[0].index;


    const userName =
        lineChart.data.labels[index];


    const raw =
        await getMonitorData();


    const counts = {

        darurat: 0,

        penting: 0,

        biasa: 0

    };


    if (raw) {

        Object.values(raw)
            .forEach(item => {

                if (
                    (
                        item.name ||
                        ''
                    ).toLowerCase()
                    ===
                    userName.toLowerCase()
                ) {

                    const priority =
                        (
                            item.priority ||
                            ''
                        ).toLowerCase();


                    if (
                        priority ===
                        'darurat'
                    ) {

                        counts.darurat++;

                    }

                    else if (
                        priority ===
                        'penting'
                    ) {

                        counts.penting++;

                    }

                    else {

                        counts.biasa++;

                    }

                }

            });

    }


    const html = `

        <table class="modal-table">

            <thead>

                <tr>

                    <th>Status</th>

                    <th>Jumlah</th>

                </tr>

            </thead>

            <tbody>

                <tr>
                    <td>Darurat</td>
                    <td>${counts.darurat}</td>
                </tr>

                <tr>
                    <td>Penting</td>
                    <td>${counts.penting}</td>
                </tr>

                <tr>
                    <td>Biasa</td>
                    <td>${counts.biasa}</td>
                </tr>

            </tbody>

        </table>

    `;


    openModal(
        `Detail Pengguna: ${userName}`,
        html
    );

}


/* =========================================
   FIREBASE REALTIME
========================================= */

onValue(
    monitorRef,
    snapshot => {

        const raw =
            snapshot.val();

        const data =
            createInitialData();


        if (raw) {

            Object.values(raw)
                .forEach(item => {

                    if (!item) return;


                    /* PRIORITY */

                    const priority =
                        (
                            item.priority ||
                            ""
                        ).toLowerCase();


                    if (
                        priority ===
                        "darurat"
                    ) {

                        data.darurat++;

                    }

                    else if (
                        priority ===
                        "penting"
                    ) {

                        data.penting++;

                    }

                    else {

                        data.biasa++;

                    }


                    /* STATUS */

                    const status =
                        (
                            item.status ||
                            ""
                        ).toLowerCase();


                    if (
                        status ===
                        "selesai"
                    ) {

                        data.statusSelesai++;

                    }

                    else {

                        data.statusProses++;

                    }


                    /* USER */

                    const name =
                        item.name ||
                        "Unknown";


                    if (
                        !data.usersData[name]
                    ) {

                        data.usersData[name] = {

                            timestamps: []

                        };

                    }


                    data.usersData[name]
                        .timestamps
                        .push({

                            date:
                                item.time
                                    ?.split(" ")[0]
                                ||
                                "???"

                        });

                });

        }


        updateCharts(data);


        document.getElementById(
            'loadingOverlay'
        ).style.display = 'none';

    }
);


/* =========================================
   MODAL
========================================= */

function openModal(
    title,
    content
) {

    document.getElementById(
        'modalTitle'
    ).innerHTML = title;

    document.getElementById(
        'modalContent'
    ).innerHTML = content;

    document.getElementById(
        'customModal'
    ).style.display = 'flex';

}


window.closeModal =
    function () {

        document.getElementById(
            'customModal'
        ).style.display = 'none';

    };


window.addEventListener(
    'click',
    function (e) {

        const modal =
            document.getElementById(
                'customModal'
            );

        const modalBox =
            modal.querySelector(
                '.modal'
            );


        if (
            e.target === modal &&
            !modalBox.contains(
                e.target
            )
        ) {

            closeModal();

        }

    }
);


window.addEventListener(
    'keydown',
    function (e) {

        if (e.key === 'Escape') {

            closeModal();

        }

    }
);