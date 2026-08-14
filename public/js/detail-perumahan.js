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


const app = getApps().length
    ? getApp()
    : initializeApp(firebaseConfig);

const db = getDatabase(app);


/* =========================================
   DATA KEY DARI LARAVEL
========================================= */

const key = window.monitorKey;


/* =========================================
   DOM
========================================= */

const titleElement =
    document.getElementById("title");

const tableBody =
    document.getElementById("monitorTableBody");

const clearAllBtn =
    document.getElementById("clearAllBtn");

const searchInput =
    document.getElementById("search");

const statusFilter =
    document.getElementById("statusFilter");

const priorityFilter =
    document.getElementById("priorityFilter");

const sortOrder =
    document.getElementById("sortOrder");

const pagination =
    document.getElementById("pagination");


/* =========================================
   STATE
========================================= */

let allData = [];

let currentPage = 1;

const itemsPerPage = 10;


/* =========================================
   CEK ELEMENT
========================================= */

if (!tableBody) {
    console.error(
        "Element monitorTableBody tidak ditemukan."
    );
}


/* =========================================
   CEK KEY
========================================= */

if (!key) {

    console.error(
        "Key perumahan tidak ditemukan."
    );

    if (titleElement) {
        titleElement.textContent =
            "Detail Perumahan";
    }

    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="empty-state"
                >
                    Key perumahan tidak ditemukan.
                </td>
            </tr>
        `;
    }

} else {

    loadHousingName();

    loadMonitorData();

}


/* =========================================
   AMBIL NAMA PERUMAHAN
========================================= */

async function loadHousingName() {

    try {

        const namaPerumahanRef =
            ref(
                db,
                `daftar_perumahan/${key}`
            );


        const snapshot =
            await get(
                namaPerumahanRef
            );


        if (snapshot.exists()) {

            titleElement.textContent =
                `Detail Perumahan: ${snapshot.val()}`;

        } else {

            titleElement.textContent =
                `Detail Perumahan: ${key}`;

        }

    } catch (error) {

        console.error(
            "Gagal mengambil nama perumahan:",
            error
        );

        titleElement.textContent =
            `Detail Monitor: ${key}`;

    }

}


/* =========================================
   PARSE TIMESTAMP
========================================= */

function parseTimestamp(timeStr) {

    if (
        !timeStr ||
        typeof timeStr !== "string"
    ) {

        return new Date(0);

    }


    const match =
        timeStr.match(
            /^(\d{4}-\d{2}-\d{2}) waktu (\d{2}:\d{2})$/
        );


    if (!match) {

        return new Date(0);

    }


    return new Date(
        `${match[1]}T${match[2]}:00`
    );

}


/* =========================================
   LOAD MONITOR DATA
========================================= */

async function loadMonitorData() {

    try {

        const monitorRef =
            ref(
                db,
                `perumahan/${key}/monitor`
            );


        const snapshot =
            await get(
                monitorRef
            );


        /*
        |-----------------------------------------
        | Tidak ada data
        |-----------------------------------------
        */

        if (!snapshot.exists()) {

            allData = [];

            renderTable();

            return;

        }


        /*
        |-----------------------------------------
        | Firebase Object → Array
        |-----------------------------------------
        */

        allData =
            Object.values(
                snapshot.val()
            ).map(item => ({

                name:
                    item.name || "-",

                houseNumber:
                    item.houseNumber || "-",

                message:
                    item.message || "-",

                priority:
                    item.priority || "-",

                status:
                    item.status || "-",

                time:
                    item.time || "-",

                timestamp:
                    parseTimestamp(
                        item.time || "-"
                    ),

                latitude:
                    item.latitude || 0,

                longitude:
                    item.longitude || 0

            }));


        renderTable();


    } catch (error) {

        console.error(
            "Gagal mengambil data monitor:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="empty-state"
                >
                    Gagal mengambil data monitor.
                </td>
            </tr>
        `;


        pagination.innerHTML = "";

    }

}


/* =========================================
   FILTER + SEARCH + SORT
========================================= */

function getFilteredData() {

    let filtered = [
        ...allData
    ];


    /* -----------------------------------------
       SEARCH
    ----------------------------------------- */

    const searchValue =
        searchInput.value
            .toLowerCase()
            .trim();


    if (searchValue) {

        filtered =
            filtered.filter(item => {

                return Object.values(item)
                    .some(value =>

                        String(value)
                            .toLowerCase()
                            .includes(searchValue)

                    );

            });

    }


    /* -----------------------------------------
       STATUS
    ----------------------------------------- */

    if (statusFilter.value) {

        filtered =
            filtered.filter(
                item =>
                    item.status ===
                    statusFilter.value
            );

    }


    /* -----------------------------------------
       PRIORITY
    ----------------------------------------- */

    if (priorityFilter.value) {

        filtered =
            filtered.filter(
                item =>
                    item.priority ===
                    priorityFilter.value
            );

    }


    /* -----------------------------------------
       SORT
    ----------------------------------------- */

    filtered.sort(
        (a, b) => {

            if (
                sortOrder.value === "asc"
            ) {

                return (
                    a.timestamp -
                    b.timestamp
                );

            }


            return (
                b.timestamp -
                a.timestamp
            );

        }
    );


    return filtered;

}


/* =========================================
   RENDER TABLE
========================================= */

function renderTable() {

    const filtered =
        getFilteredData();


    const totalItems =
        filtered.length;


    const totalPages =
        Math.ceil(
            totalItems /
            itemsPerPage
        );


    /*
    |-----------------------------------------
    | Current Page
    |-----------------------------------------
    */

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


    /*
    |-----------------------------------------
    | Pagination Index
    |-----------------------------------------
    */

    const startIdx =
        (currentPage - 1) *
        itemsPerPage;


    const endIdx =
        Math.min(
            startIdx +
            itemsPerPage,
            totalItems
        );


    const paginatedData =
        filtered.slice(
            startIdx,
            endIdx
        );


    /*
    |-----------------------------------------
    | Empty
    |-----------------------------------------
    */

    if (
        paginatedData.length === 0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="empty-state"
                >
                    Tidak ada data monitor ditemukan.
                </td>
            </tr>
        `;

    } else {

        /*
        |-----------------------------------------
        | Render Rows
        |-----------------------------------------
        */

        tableBody.innerHTML =
            paginatedData
                .map(item => {

                    const priorityColor =
                        getPriorityColor(
                            item.priority
                        );


                    const textColor =
                        getTextColor(
                            item.priority
                        );


                    const statusColor =
                        item.status === "Selesai"

                            ? "#4CAF50"

                            : "#FFC107";


                    /*
                    |---------------------------------
                    | Location
                    |---------------------------------
                    */

                    const locationHtml =
                        item.latitude &&
                        item.longitude

                            ?

                            `
                            <a
                                href="https://www.google.com/maps?q=${encodeURIComponent(item.latitude)},${encodeURIComponent(item.longitude)}"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="location-link"
                            >
                                📍 Lihat Lokasi
                            </a>
                            `

                            :

                            `
                            <span
                                style="color:#aaa;"
                            >
                                -
                            </span>
                            `;


                    return `

                        <tr>

                            <td data-label="Nama">
                                ${escapeHtml(
                                    item.name
                                )}
                            </td>


                            <td data-label="No Rumah">
                                ${escapeHtml(
                                    item.houseNumber
                                )}
                            </td>


                            <td data-label="Pesan">
                                ${escapeHtml(
                                    item.message
                                )}
                            </td>


                            <td data-label="Prioritas">

                                <span
                                    class="monitor-badge"
                                    style="
                                        background:${priorityColor};
                                        color:${textColor};
                                    "
                                >
                                    ${escapeHtml(
                                        item.priority
                                    )}
                                </span>

                            </td>


                            <td data-label="Status">

                                <span
                                    class="monitor-badge"
                                    style="
                                        background:${statusColor};
                                        color:#fff;
                                    "
                                >
                                    ${escapeHtml(
                                        item.status
                                    )}
                                </span>

                            </td>


                            <td data-label="Waktu">
                                ${escapeHtml(
                                    item.time
                                )}
                            </td>


                            <td data-label="Lokasi">
                                ${locationHtml}
                            </td>

                        </tr>

                    `;

                })
                .join("");

    }


    /*
    |-----------------------------------------
    | Pagination
    |-----------------------------------------
    */

    renderPagination(
        totalItems,
        totalPages,
        startIdx,
        endIdx
    );

}


/* =========================================
   RENDER PAGINATION
========================================= */

function renderPagination(
    totalItems,
    totalPages,
    startIdx,
    endIdx
) {

    if (totalItems === 0) {

        pagination.innerHTML = "";

        return;

    }


    pagination.innerHTML = `

        <div class="pagination-container">

            <span class="pagination-info">

                Menampilkan
                ${startIdx + 1}
                -
                ${endIdx}
                dari
                ${totalItems}
                data

            </span>


            <div class="pagination-buttons">

                <button
                    id="prevBtn"
                    ${currentPage === 1 ? "disabled" : ""}
                >
                    ← Sebelumnya
                </button>


                <button
                    id="nextBtn"
                    ${
                        currentPage >= totalPages
                            ? "disabled"
                            : ""
                    }
                >
                    Berikutnya →
                </button>

            </div>

        </div>

    `;


    /*
    |-----------------------------------------
    | Previous
    |-----------------------------------------
    */

    document
        .getElementById("prevBtn")
        ?.addEventListener(
            "click",
            () => {

                if (currentPage > 1) {

                    currentPage--;

                    renderTable();

                }

            }
        );


    /*
    |-----------------------------------------
    | Next
    |-----------------------------------------
    */

    document
        .getElementById("nextBtn")
        ?.addEventListener(
            "click",
            () => {

                if (
                    currentPage <
                    totalPages
                ) {

                    currentPage++;

                    renderTable();

                }

            }
        );

}


/* =========================================
   PRIORITY COLOR
========================================= */

function getPriorityColor(priority) {

    switch (priority) {

        case "Darurat":
            return "#F44336";

        case "Penting":
            return "#FFEB3B";

        case "Biasa":
            return "#4CAF50";

        default:
            return "#9E9E9E";

    }

}


/* =========================================
   PRIORITY TEXT COLOR
========================================= */

function getTextColor(priority) {

    return priority === "Penting"
        ? "#000"
        : "#fff";

}


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHtml(value) {

    return String(value)
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


/* =========================================
   FILTER EVENT
========================================= */

[
    searchInput,
    statusFilter,
    priorityFilter,
    sortOrder

].forEach(element => {

    element?.addEventListener(
        "input",
        () => {

            currentPage = 1;

            renderTable();

        }
    );

});


/* =========================================
   HAPUS SEMUA MONITOR
========================================= */

clearAllBtn?.addEventListener(
    "click",
    async () => {

        const result =
            await Swal.fire({

                title:
                    "Apakah kamu yakin?",

                text:
                    "Semua data monitor akan dihapus permanen!",

                icon:
                    "warning",

                showCancelButton:
                    true,

                confirmButtonColor:
                    "#d33",

                cancelButtonColor:
                    "#3085d6",

                confirmButtonText:
                    "Ya, hapus semua",

                cancelButtonText:
                    "Batal"

            });


        /*
        |-----------------------------------------
        | Batal
        |-----------------------------------------
        */

        if (
            !result.isConfirmed
        ) {

            return;

        }


        try {

            const monitorRef =
                ref(
                    db,
                    `perumahan/${key}/monitor`
                );


            await remove(
                monitorRef
            );


            /*
            |-----------------------------------------
            | Reset
            |-----------------------------------------
            */

            allData = [];

            currentPage = 1;


            renderTable();


            await Swal.fire({

                title:
                    "Terhapus!",

                text:
                    "Semua data monitor berhasil dihapus.",

                icon:
                    "success",

                confirmButtonColor:
                    "#3085d6"

            });


        } catch (error) {

            console.error(
                error
            );


            Swal.fire({

                title:
                    "Gagal",

                text:
                    "Terjadi kesalahan: " +
                    error.message,

                icon:
                    "error"

            });

        }

    }
);