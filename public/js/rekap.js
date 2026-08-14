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
    update,
    remove
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";


/* =========================================
   FIREBASE REFERENCE
========================================= */

const daftarRef = ref(db1, "daftar_perumahan");
const perumahanRef = ref(db1, "perumahan");


/* =========================================
   DOM
========================================= */

const tableBody =
    document.getElementById("perumahanTableBody");

const totalCount =
    document.getElementById("totalCount");

const searchInput =
    document.getElementById("searchInput");

const prevBtn =
    document.getElementById("prevBtn");

const nextBtn =
    document.getElementById("nextBtn");

const paginationInfo =
    document.getElementById("paginationInfo");

const cardContainer =
    document.getElementById("cardContainer");

const openAddModal =
    document.getElementById("openAddModal");


/* =========================================
   STATE
========================================= */

let allData = [];

let currentPage = 1;

const itemsPerPage = 5;

let daftarPerumahan = {};

let detailPerumahan = {};


/* =========================================
   HELPER
========================================= */

function toSlug(text) {

    return text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "_");

}


/* =========================================
   MERGE DATA FIREBASE
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

    const q = query
        .toLowerCase()
        .trim();

    return allData.filter(({ nama, info }) => {

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

        );

    });

}


/* =========================================
   RENDER TABLE
========================================= */

function renderTable(filteredData) {

    const totalItems = filteredData.length;

    totalCount.textContent = totalItems;


    const totalPages =
        Math.ceil(totalItems / itemsPerPage);


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
        (currentPage - 1) * itemsPerPage;


    const endIdx =
        Math.min(
            startIdx + itemsPerPage,
            totalItems
        );


    const paginatedData =
        filteredData.slice(
            startIdx,
            endIdx
        );


    tableBody.innerHTML = "";


    if (totalItems === 0) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="loading"
                >
                    <i class="fas fa-building"></i>
                    Tidak ada data ditemukan.
                </td>
            </tr>
        `;

    } else {

        paginatedData.forEach(
            ({ key, nama, info }, index) => {

                const row =
                    document.createElement("tr");


                row.innerHTML = `

                    <td>
                        ${startIdx + index + 1}
                    </td>

                    <td>
                        <strong>
                            ${escapeHtml(nama)}
                        </strong>
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

                        <button
                            class="btn-edit"
                            onclick="openEditModal(
                                '${escapeAttribute(key)}',
                                '${escapeAttribute(nama)}',
                                '${escapeAttribute(info.kontak || "")}',
                                '${escapeAttribute(info.lokasi || "")}'
                            )"
                        >
                            <i class="fas fa-edit"></i>
                            Edit
                        </button>

                        <button
                            class="btn-delete"
                            onclick="confirmDelete(
                                '${escapeAttribute(key)}',
                                '${escapeAttribute(nama)}'
                            )"
                        >
                            <i class="fas fa-trash"></i>
                            Hapus
                        </button>

                    </td>

                    <td>

                        <a
                            href="/detail-perumahan?key=${encodeURIComponent(key)}"
                            class="btn-detail"
                        >
                            <i class="fas fa-eye"></i>
                            Detail
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
   RENDER MOBILE CARD
========================================= */

function renderCards(data) {

    const totalItems = data.length;

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
        (currentPage - 1) * itemsPerPage;


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

                    <button
                        class="btn-edit"
                        onclick="openEditModal(
                            '${escapeAttribute(key)}',
                            '${escapeAttribute(nama)}',
                            '${escapeAttribute(info.kontak || "")}',
                            '${escapeAttribute(info.lokasi || "")}'
                        )"
                    >
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>

                    <button
                        class="btn-delete"
                        onclick="confirmDelete(
                            '${escapeAttribute(key)}',
                            '${escapeAttribute(nama)}'
                        )"
                    >
                        <i class="fas fa-trash"></i>
                        Hapus
                    </button>

                    <a
                        href="/detail-perumahan?key=${encodeURIComponent(key)}"
                        class="btn-detail"
                    >
                        <i class="fas fa-eye"></i>
                        Detail
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


function escapeAttribute(value) {

    return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, "&quot;");

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
                data.length / itemsPerPage
            );

        if (currentPage < totalPages) {

            currentPage++;

            renderTable(data);

        }

    }
);


/* =========================================
   FIREBASE - DAFTAR PERUMAHAN
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
   FIREBASE - DETAIL PERUMAHAN
========================================= */

onValue(
    perumahanRef,
    (snapshot) => {

        detailPerumahan =
            snapshot.val() || {};

        mergeData();

    }
);


/* =========================================
   TAMBAH PERUMAHAN
========================================= */

openAddModal.addEventListener(
    "click",
    () => {

        Swal.fire({

            title: "Tambah Perumahan",

            html: `

                <div class="swal-form">

                    <label>
                        Nama Perumahan
                    </label>

                    <input
                        id="swalNama"
                        class="swal2-input"
                        placeholder="Masukkan nama perumahan"
                    >


                    <label>
                        Kontak
                    </label>

                    <input
                        id="swalKontak"
                        class="swal2-input"
                        placeholder="Masukkan nomor kontak"
                    >


                    <label>
                        Lokasi
                    </label>

                    <input
                        id="swalLokasi"
                        class="swal2-input"
                        placeholder="Masukkan lokasi"
                    >

                </div>

            `,

            showCancelButton: true,

            confirmButtonText:
                "Simpan",

            cancelButtonText:
                "Batal",

            focusConfirm: false,

            preConfirm: () => {

                const nama =
                    document
                        .getElementById("swalNama")
                        .value
                        .trim();

                const kontak =
                    document
                        .getElementById("swalKontak")
                        .value
                        .trim();

                const lokasi =
                    document
                        .getElementById("swalLokasi")
                        .value
                        .trim();


                if (!nama || !kontak || !lokasi) {

                    Swal.showValidationMessage(
                        "Semua field harus diisi"
                    );

                    return false;

                }


                return {
                    nama,
                    kontak,
                    lokasi
                };

            }

        }).then(
            async (result) => {

                if (!result.isConfirmed) {
                    return;
                }


                const {
                    nama,
                    kontak,
                    lokasi
                } = result.value;


                const key =
                    toSlug(nama);


                const updates = {};


                updates[
                    `daftar_perumahan/${key}`
                ] = nama;


                updates[
                    `perumahan/${key}/info`
                ] = {

                    kontak,
                    lokasi,
                    nama

                };


                updates[
                    `perumahan/${key}/buzzers`
                ] = {

                    main: {
                        priority: "off",
                        state: "off"
                    },

                    buzzer_utama: {
                        priority: "off",
                        state: "off"
                    }

                };


                updates[
                    `perumahan/${key}/monitor`
                ] = {};


                updates[
                    `perumahan/${key}/users`
                ] = {};


                try {

                    await update(
                        ref(db1),
                        updates
                    );


                    Swal.fire(
                        "Berhasil",
                        "Data perumahan berhasil ditambahkan.",
                        "success"
                    );

                } catch (error) {

                    console.error(error);

                    Swal.fire(
                        "Gagal",
                        "Data gagal ditambahkan.",
                        "error"
                    );

                }

            }
        );

    }
);


/* =========================================
   EDIT PERUMAHAN
========================================= */

window.openEditModal =
    function (
        key,
        nama,
        kontak,
        lokasi
    ) {

        Swal.fire({

            title: "Edit Data Perumahan",

            html: `

                <div class="swal-form">

                    <label>
                        Nama Perumahan
                    </label>

                    <input
                        id="swalNama"
                        class="swal2-input"
                        value="${escapeHtml(nama)}"
                    >


                    <label>
                        Kontak
                    </label>

                    <input
                        id="swalKontak"
                        class="swal2-input"
                        value="${escapeHtml(kontak)}"
                    >


                    <label>
                        Lokasi
                    </label>

                    <input
                        id="swalLokasi"
                        class="swal2-input"
                        value="${escapeHtml(lokasi)}"
                    >

                </div>

            `,

            showCancelButton: true,

            confirmButtonText:
                "Simpan",

            cancelButtonText:
                "Batal",

            focusConfirm: false,

            preConfirm: () => {

                const namaBaru =
                    document
                        .getElementById("swalNama")
                        .value
                        .trim();

                const kontakBaru =
                    document
                        .getElementById("swalKontak")
                        .value
                        .trim();

                const lokasiBaru =
                    document
                        .getElementById("swalLokasi")
                        .value
                        .trim();


                if (
                    !namaBaru ||
                    !kontakBaru ||
                    !lokasiBaru
                ) {

                    Swal.showValidationMessage(
                        "Semua field harus diisi"
                    );

                    return false;

                }


                return {
                    namaBaru,
                    kontakBaru,
                    lokasiBaru
                };

            }

        }).then(
            async (result) => {

                if (!result.isConfirmed) {
                    return;
                }


                const {
                    namaBaru,
                    kontakBaru,
                    lokasiBaru
                } = result.value;


                const updates = {};


                updates[
                    `daftar_perumahan/${key}`
                ] = namaBaru;


                updates[
                    `perumahan/${key}/info`
                ] = {

                    kontak:
                        kontakBaru,

                    lokasi:
                        lokasiBaru,

                    nama:
                        namaBaru

                };


                try {

                    await update(
                        ref(db1),
                        updates
                    );


                    Swal.fire(
                        "Berhasil",
                        "Data berhasil diubah.",
                        "success"
                    );

                } catch (error) {

                    console.error(error);

                    Swal.fire(
                        "Gagal",
                        "Data gagal diubah.",
                        "error"
                    );

                }

            }
        );

    };


/* =========================================
   HAPUS PERUMAHAN
========================================= */

window.confirmDelete =
    function (key, nama) {

        Swal.fire({

            title: `Hapus ${nama}?`,

            text:
                "Data perumahan dan seluruh data terkait akan dihapus.",

            icon: "warning",

            showCancelButton: true,

            confirmButtonText:
                "Ya, hapus",

            cancelButtonText:
                "Batal"

        }).then(
            async (result) => {

                if (!result.isConfirmed) {
                    return;
                }


                const updates = {};


                updates[
                    `daftar_perumahan/${key}`
                ] = null;


                updates[
                    `perumahan/${key}`
                ] = null;


                try {

                    await update(
                        ref(db1),
                        updates
                    );


                    Swal.fire(
                        "Terhapus!",
                        "Data berhasil dihapus.",
                        "success"
                    );

                } catch (error) {

                    console.error(error);

                    Swal.fire(
                        "Gagal",
                        "Data gagal dihapus.",
                        "error"
                    );

                }

            }
        );

    };