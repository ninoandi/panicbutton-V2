import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
    getDatabase,
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";


/* =========================================
   FIREBASE CONFIG
========================================= */

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


/* =========================================
   FIREBASE
========================================= */

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);


/* =========================================
   REFERENCE
========================================= */

const daftarRef =
    ref(db, "daftar_perumahan");

const perumahanRef =
    ref(db, "perumahan");


/* =========================================
   DOM
========================================= */

const tableBody =
    document.getElementById("perumahanTableBody");

const searchInput =
    document.getElementById("searchInput");

const prevBtn =
    document.getElementById("prevBtn");

const nextBtn =
    document.getElementById("nextBtn");

const paginationInfo =
    document.getElementById("paginationInfo");

const cardContainer =
    document.querySelector(".card-container");


/* =========================================
   STATE
========================================= */

let allData = [];

let currentPage = 1;

const itemsPerPage = 5;

let daftarPerumahan = {};

let detailPerumahan = {};


/* =========================================
   MERGE DATA
========================================= */

function mergeData() {

    allData = [];

    for (const key in daftarPerumahan) {

        allData.push({

            key: key,

            nama: daftarPerumahan[key],

            info:
                detailPerumahan[key]?.info || {}

        });

    }

    currentPage = 1;

    renderTable(
        filterData(searchInput.value)
    );

}


/* =========================================
   FILTER
========================================= */

function filterData(query) {

    const q =
        query.toLowerCase().trim();

    return allData.filter(
        ({ nama, info }) => {

            return (

                nama
                    .toLowerCase()
                    .includes(q)

                ||

                (info.kontak || "")
                    .toLowerCase()
                    .includes(q)

                ||

                (info.lokasi || "")
                    .toLowerCase()
                    .includes(q)

                ||

                (info.nama || "")
                    .toLowerCase()
                    .includes(q)

            );

        }
    );

}


/* =========================================
   RENDER TABLE
========================================= */

function renderTable(filteredData) {

    const totalItems =
        filteredData.length;


    const totalPages =
        Math.ceil(
            totalItems / itemsPerPage
        );


    if (totalPages === 0) {

        currentPage = 1;

    } else {

        currentPage =
            Math.max(
                1,
                Math.min(
                    currentPage,
                    totalPages
                )
            );

    }


    const startIdx =
        (currentPage - 1) *
        itemsPerPage;


    const endIdx =
        Math.min(
            startIdx + itemsPerPage,
            totalItems
        );


    tableBody.innerHTML = "";


    if (totalItems === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    Tidak ada data ditemukan.
                </td>
            </tr>
        `;

    } else {

        const paginatedData =
            filteredData.slice(
                startIdx,
                endIdx
            );


        paginatedData.forEach(
            ({ key, nama, info }, index) => {

                const row =
                    document.createElement("tr");


                row.innerHTML = `

                    <td>
                        ${startIdx + index + 1}
                    </td>

                    <td>
                        ${escapeHtml(nama)}
                    </td>

                    <td>
                        ${escapeHtml(
                            info.kontak || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            info.lokasi || "-"
                        )}
                    </td>

                    <td>

                        <a
                            href="/detail-grafik?perumahan=${encodeURIComponent(key)}"
                            class="btn btn-detail"
                        >
                            Lihat Grafik
                        </a>

                    </td>

                `;


                tableBody.appendChild(row);

            }
        );

    }


    if (totalItems === 0) {

        paginationInfo.textContent =
            "Menampilkan 0 - 0 dari 0 data";

    } else {

        paginationInfo.textContent =
            `Menampilkan ${startIdx + 1} - ${endIdx} dari ${totalItems} data`;

    }


    prevBtn.disabled =
        currentPage === 1;

    nextBtn.disabled =
        totalPages === 0 ||
        currentPage >= totalPages;


    renderCards(filteredData);

}


/* =========================================
   MOBILE CARD
========================================= */

function renderCards(data) {

    const totalItems =
        data.length;


    const totalPages =
        Math.ceil(
            totalItems / itemsPerPage
        );


    if (totalPages === 0) {

        cardContainer.innerHTML = `
            <div class="perumahan-card">

                <div class="card-title">
                    Tidak ada data
                </div>

            </div>
        `;

        return;

    }


    const startIdx =
        (currentPage - 1) *
        itemsPerPage;


    const endIdx =
        Math.min(
            startIdx + itemsPerPage,
            totalItems
        );


    const paginatedData =
        data.slice(
            startIdx,
            endIdx
        );


    cardContainer.innerHTML = "";


    paginatedData.forEach(
        ({ key, nama, info }) => {

            const card =
                document.createElement("div");


            card.className =
                "perumahan-card";


            card.innerHTML = `

                <div class="card-title">
                    ${escapeHtml(nama)}
                </div>

                <div class="card-info">

                    <strong>Kontak:</strong>

                    <span>
                        ${escapeHtml(
                            info.kontak || "-"
                        )}
                    </span>

                </div>

                <div class="card-info">

                    <strong>Lokasi:</strong>

                    <span>
                        ${escapeHtml(
                            info.lokasi || "-"
                        )}
                    </span>

                </div>

                <div class="card-actions">

                   <a href="/detail-grafik?perumahan=${encodeURIComponent(key)}" class="btn btn-detail">
                    Lihat Grafik
                </a>

                </div>
            `;


            cardContainer.appendChild(card);

        }
    );

}


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHtml(value) {

    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}


/* =========================================
   SEARCH
========================================= */

searchInput.addEventListener(
    "input",
    () => {

        currentPage = 1;

        renderTable(
            filterData(
                searchInput.value
            )
        );

    }
);


/* =========================================
   PAGINATION
========================================= */

prevBtn.addEventListener(
    "click",
    () => {

        if (currentPage > 1) {

            currentPage--;

            renderTable(
                filterData(
                    searchInput.value
                )
            );

        }

    }
);


nextBtn.addEventListener(
    "click",
    () => {

        const data =
            filterData(
                searchInput.value
            );

        const totalPages =
            Math.ceil(
                data.length /
                itemsPerPage
            );


        if (currentPage < totalPages) {

            currentPage++;

            renderTable(data);

        }

    }
);


/* =========================================
   RESPONSIVE
========================================= */

window.addEventListener(
    "resize",
    () => {

        renderTable(
            filterData(
                searchInput.value
            )
        );

    }
);


/* =========================================
   FIREBASE DAFTAR
========================================= */

onValue(
    daftarRef,
    (snapshot) => {

        daftarPerumahan =
            snapshot.val() || {};

        mergeData();

    }
);


/* =========================================
   FIREBASE DETAIL
========================================= */

onValue(
    perumahanRef,
    (snapshot) => {

        detailPerumahan =
            snapshot.val() || {};

        mergeData();

    }
);