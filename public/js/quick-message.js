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
    apiKey: "AIzaSyDk2aeQR7Tmh-vwZnxvTT61fJjluojVRa0",
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
| Firebase Initialize
|--------------------------------------------------------------------------
|
| Menghindari error jika dashboard.js juga sudah
| melakukan initializeApp().
|
*/

const app = getApps().length
    ? getApp()
    : initializeApp(firebaseConfig);

const db = getDatabase(app);


/*
|--------------------------------------------------------------------------
| DOM
|--------------------------------------------------------------------------
*/

const quickMessageButton =
    document.getElementById("quick-message");


/*
|--------------------------------------------------------------------------
| Escape HTML
|--------------------------------------------------------------------------
*/

function escapeHtml(str = "") {

    return String(str)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");
}


/*
|--------------------------------------------------------------------------
| Quick Message
|--------------------------------------------------------------------------
*/

if (quickMessageButton) {

    quickMessageButton.addEventListener(
        "click",
        async function (e) {

            e.preventDefault();

            /*
            |--------------------------------------------------------------------------
            | Pastikan SweetAlert tersedia
            |--------------------------------------------------------------------------
            */

            if (typeof Swal === "undefined") {

                alert(
                    "SweetAlert2 belum dimuat."
                );

                return;
            }


            /*
            |--------------------------------------------------------------------------
            | Firebase Reference
            |--------------------------------------------------------------------------
            */

            const dbRef = ref(
                db,
                "global_quick_messages"
            );


            /*
            |--------------------------------------------------------------------------
            | Loading
            |--------------------------------------------------------------------------
            */

            Swal.fire({

                title: "Mohon tunggu...",

                html: "Mengambil data quick messages...",

                allowOutsideClick: false,

                didOpen: () => {

                    Swal.showLoading();

                }

            });


            /*
            |--------------------------------------------------------------------------
            | Get Messages
            |--------------------------------------------------------------------------
            */

            let msgs = {};

            try {

                const snapshot =
                    await get(dbRef);

                msgs =
                    snapshot.val() || {};

            }

            catch (error) {

                Swal.fire(
                    "Error",
                    "Gagal mengambil data: " +
                    error.message,
                    "error"
                );

                return;
            }


            /*
            |--------------------------------------------------------------------------
            | Modal HTML
            |--------------------------------------------------------------------------
            */

            const modalHTML = `

                <div class="quick-message-content">

                    <input
                        id="searchMsgInput"
                        type="text"
                        placeholder="Cari pesan..."
                        class="quick-message-search"
                    >


                    <div class="quick-message-table-wrapper">

                        <table class="quick-message-table">

                            <thead>

                                <tr>

                                    <th>
                                        Pesan
                                    </th>

                                    <th style="width:140px;">
                                        Aksi
                                    </th>

                                </tr>

                            </thead>


                            <tbody id="msgsTbody">

                                ${
                                    Object.keys(msgs)
                                        .map(key => `

                                            <tr
                                                data-id="${key}"
                                                data-text="${escapeHtml(msgs[key])}"
                                            >

                                                <td class="msg-text">

                                                    ${escapeHtml(msgs[key])}

                                                </td>


                                                <td style="text-align:center;">

                                                    <button
                                                        class="edit-btn"
                                                        data-id="${key}"
                                                    >
                                                        Edit
                                                    </button>


                                                    <button
                                                        class="delete-btn"
                                                        data-id="${key}"
                                                    >
                                                        Hapus
                                                    </button>

                                                </td>

                                            </tr>

                                        `)
                                        .join("")
                                }

                            </tbody>

                        </table>

                    </div>


                    <div class="quick-message-add">

                        <input
                            id="newMsgInput"
                            type="text"
                            placeholder="Tulis pesan baru..."
                            class="quick-message-input"
                        >


                        <button
                            id="addMsgBtn"
                            class="quick-message-add-btn"
                        >
                            Tambah
                        </button>

                    </div>

                </div>

            `;


            /*
            |--------------------------------------------------------------------------
            | Show Modal
            |--------------------------------------------------------------------------
            */

            Swal.fire({

                title: "Kelola Quick Messages",

                html: modalHTML,

                width: 650,

                showConfirmButton: false,

                showCloseButton: true,

                customClass: {

                    popup: "quick-message-swal-popup"

                },


                /*
                |--------------------------------------------------------------------------
                | Modal Open
                |--------------------------------------------------------------------------
                */

                didOpen: () => {

                    const container =
                        Swal.getHtmlContainer();


                    const tbody =
                        container.querySelector(
                            "#msgsTbody"
                        );


                    const searchInput =
                        container.querySelector(
                            "#searchMsgInput"
                        );


                    const newMsgInput =
                        container.querySelector(
                            "#newMsgInput"
                        );


                    const addBtn =
                        container.querySelector(
                            "#addMsgBtn"
                        );


                    /*
                    |--------------------------------------------------------------------------
                    | Search
                    |--------------------------------------------------------------------------
                    */

                    searchInput.addEventListener(
                        "input",
                        (ev) => {

                            const q =
                                (
                                    ev.target.value || ""
                                ).toLowerCase();


                            Array
                                .from(
                                    tbody.querySelectorAll(
                                        "tr"
                                    )
                                )
                                .forEach(tr => {

                                    const text =
                                        (
                                            tr.getAttribute(
                                                "data-text"
                                            ) || ""
                                        ).toLowerCase();


                                    tr.style.display =
                                        text.includes(q)
                                            ? ""
                                            : "none";

                                });

                        }
                    );


                    /*
                    |--------------------------------------------------------------------------
                    | Tambah
                    |--------------------------------------------------------------------------
                    */

                    addBtn.addEventListener(
                        "click",
                        async () => {

                            const value =
                                newMsgInput.value.trim();


                            if (!value) {

                                Swal.fire(
                                    "Error",
                                    "Pesan tidak boleh kosong",
                                    "error"
                                );

                                return;
                            }


                            addBtn.disabled = true;


                            try {

                                const newRef =
                                    push(dbRef);


                                await set(
                                    newRef,
                                    value
                                );


                                const key =
                                    newRef.key;


                                tbody.insertAdjacentHTML(
                                    "beforeend",
                                    `

                                    <tr
                                        data-id="${key}"
                                        data-text="${escapeHtml(value)}"
                                    >

                                        <td class="msg-text">
                                            ${escapeHtml(value)}
                                        </td>


                                        <td style="text-align:center;">

                                            <button
                                                class="edit-btn"
                                                data-id="${key}"
                                            >
                                                Edit
                                            </button>


                                            <button
                                                class="delete-btn"
                                                data-id="${key}"
                                            >
                                                Hapus
                                            </button>

                                        </td>

                                    </tr>

                                    `
                                );


                                newMsgInput.value = "";

                            }

                            catch (error) {

                                Swal.fire(
                                    "Error",
                                    error.message,
                                    "error"
                                );

                            }


                            addBtn.disabled = false;

                        }
                    );


                    /*
                    |--------------------------------------------------------------------------
                    | Edit / Delete
                    |--------------------------------------------------------------------------
                    */

                    tbody.addEventListener(
                        "click",
                        async (ev) => {

                            const tr =
                                ev.target.closest("tr");


                            if (!tr) {
                                return;
                            }


                            const id =
                                tr.getAttribute(
                                    "data-id"
                                );


                            if (!id) {
                                return;
                            }


                            /*
                            |--------------------------------------------------------------------------
                            | EDIT
                            |--------------------------------------------------------------------------
                            */

                            if (
                                ev.target.classList.contains(
                                    "edit-btn"
                                )
                            ) {

                                const tdText =
                                    tr.querySelector(
                                        ".msg-text"
                                    );


                                const oldText =
                                    tr.getAttribute(
                                        "data-text"
                                    );


                                tdText.innerHTML = `

                                    <input
                                        type="text"
                                        class="edit-input"
                                        value="${escapeHtml(oldText)}"
                                    >

                                `;


                                ev.target.textContent =
                                    "Simpan";


                                ev.target.classList.remove(
                                    "edit-btn"
                                );


                                ev.target.classList.add(
                                    "save-btn"
                                );


                                return;
                            }


                            /*
                            |--------------------------------------------------------------------------
                            | SAVE
                            |--------------------------------------------------------------------------
                            */

                            if (
                                ev.target.classList.contains(
                                    "save-btn"
                                )
                            ) {

                                const input =
                                    tr.querySelector(
                                        ".edit-input"
                                    );


                                const newVal =
                                    input.value.trim();


                                if (!newVal) {

                                    Swal.fire(
                                        "Error",
                                        "Pesan tidak boleh kosong",
                                        "error"
                                    );

                                    return;
                                }


                                try {

                                    await set(
                                        ref(
                                            db,
                                            `global_quick_messages/${id}`
                                        ),
                                        newVal
                                    );


                                    tr.setAttribute(
                                        "data-text",
                                        newVal
                                    );


                                    tr.querySelector(
                                        ".msg-text"
                                    ).textContent =
                                        newVal;


                                    ev.target.textContent =
                                        "Edit";


                                    ev.target.classList.remove(
                                        "save-btn"
                                    );


                                    ev.target.classList.add(
                                        "edit-btn"
                                    );

                                }

                                catch (error) {

                                    Swal.fire(
                                        "Error",
                                        error.message,
                                        "error"
                                    );

                                }

                                return;
                            }


                            /*
                            |--------------------------------------------------------------------------
                            | DELETE
                            |--------------------------------------------------------------------------
                            */

                            if (
                                ev.target.classList.contains(
                                    "delete-btn"
                                )
                            ) {

                                const confirmDelete =
                                    await Swal.fire({

                                        title:
                                            "Hapus pesan?",

                                        text:
                                            "Pesan ini akan dihapus.",

                                        icon:
                                            "warning",

                                        showCancelButton:
                                            true,

                                        confirmButtonText:
                                            "Hapus",

                                        cancelButtonText:
                                            "Batal"

                                    });


                                if (
                                    !confirmDelete.isConfirmed
                                ) {

                                    return;

                                }


                                try {

                                    await remove(
                                        ref(
                                            db,
                                            `global_quick_messages/${id}`
                                        )
                                    );


                                    tr.remove();

                                }

                                catch (error) {

                                    Swal.fire(
                                        "Error",
                                        error.message,
                                        "error"
                                    );

                                }

                            }

                        }
                    );

                }

            });

        }

    );

}


console.log(
    "quick-message.js berhasil dimuat"
);