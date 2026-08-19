/*
|--------------------------------------------------------------------------
| QUICK MESSAGE - DEDICATED MANAGEMENT PAGE
|--------------------------------------------------------------------------
*/

import {
    db1
} from "./firebase-config.js";

import {
    ref,
    onValue,
    push,
    set,
    remove
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";


/*
|--------------------------------------------------------------------------
| DOM ELEMENTS
|--------------------------------------------------------------------------
*/

const totalMsgCount = document.getElementById("totalMsgCount");
const syncStatusText = document.getElementById("syncStatusText");
const tableSyncStatus = document.getElementById("tableSyncStatus");
const searchMsgInput = document.getElementById("searchMsgInput");
const msgsTbody = document.getElementById("msgsTbody");

const openAddModalBtn = document.getElementById("openAddModalBtn");
const qmModal = document.getElementById("qmModal");
const qmModalTitle = document.getElementById("qmModalTitle");
const qmEditKey = document.getElementById("qmEditKey");
const qmMessageInput = document.getElementById("qmMessageInput");
const closeQmModal = document.getElementById("closeQmModal");
const btnCancelQm = document.getElementById("btnCancelQm");
const btnSaveQm = document.getElementById("btnSaveQm");


/*
|--------------------------------------------------------------------------
| FIREBASE REFERENCE
|--------------------------------------------------------------------------
*/

const dbRef = ref(db1, "global_quick_messages");


/*
|--------------------------------------------------------------------------
| LOCAL STATE
|--------------------------------------------------------------------------
*/

let quickMessages = [];


/*
|--------------------------------------------------------------------------
| HELPER: ESCAPE HTML
|--------------------------------------------------------------------------
*/

function escapeHtml(str = "") {
    if (str === null || str === undefined) {
        return "";
    }
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/*
|--------------------------------------------------------------------------
| RENDER TABLE
|--------------------------------------------------------------------------
*/

function renderTable() {
    if (!msgsTbody) return;

    const keyword = searchMsgInput ? searchMsgInput.value.trim().toLowerCase() : "";

    const filtered = quickMessages.filter(item => {
        return !keyword || item.text.toLowerCase().includes(keyword);
    });

    if (filtered.length === 0) {
        msgsTbody.innerHTML = `
            <tr>
                <td colspan="4" class="qm-empty">
                    <i class="fa-solid fa-comment-slash" style="font-size: 36px; margin-bottom: 10px; display: block; opacity: 0.6;"></i>
                    <strong style="font-size: 15px; display: block; margin-bottom: 4px; color: var(--dash-text-main);">Tidak ada data quick message.</strong>
                    <span style="font-size: 13px;">${keyword ? "Tidak ada pesan yang cocok dengan pencarian Anda." : "Belum ada template pesan darurat yang dibuat."}</span>
                </td>
            </tr>
        `;
        return;
    }

    msgsTbody.innerHTML = "";

    filtered.forEach((item, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td style="font-weight: 600; color: var(--dash-text-muted);">
                ${index + 1}
            </td>

            <td>
                <div class="msg-text-cell">
                    <div class="msg-icon-badge">
                        <i class="fa-solid fa-quote-left"></i>
                    </div>
                    <span>${escapeHtml(item.text)}</span>
                </div>
            </td>

            <td>
                <span class="char-badge">
                    <i class="fa-solid fa-font" style="font-size: 10px; margin-right: 4px; opacity: 0.7;"></i>
                    ${item.text.length} Karakter
                </span>
            </td>

            <td style="text-align: center;">
                <div class="action-buttons-group">
                    <button
                        type="button"
                        class="btn-action-edit"
                        data-key="${escapeHtml(item.key)}"
                        title="Edit Pesan"
                    >
                        <i class="fa-solid fa-pen-to-square"></i>
                        <span>Edit</span>
                    </button>

                    <button
                        type="button"
                        class="btn-action-delete"
                        data-key="${escapeHtml(item.key)}"
                        title="Hapus Pesan"
                    >
                        <i class="fa-solid fa-trash-can"></i>
                        <span>Hapus</span>
                    </button>
                </div>
            </td>
        `;

        msgsTbody.appendChild(row);
    });

    // Attach Action Listeners
    msgsTbody.querySelectorAll(".btn-action-edit").forEach(btn => {
        btn.addEventListener("click", () => {
            openEditModal(btn.dataset.key);
        });
    });

    msgsTbody.querySelectorAll(".btn-action-delete").forEach(btn => {
        btn.addEventListener("click", () => {
            confirmDelete(btn.dataset.key);
        });
    });
}


/*
|--------------------------------------------------------------------------
| MODAL HANDLERS
|--------------------------------------------------------------------------
*/

function openAddModal() {
    if (!qmModal) return;

    if (qmModalTitle) {
        qmModalTitle.innerHTML = `
            <i class="fa-solid fa-comment-medical"></i>
            <span>Tambah Pesan Baru</span>
        `;
    }

    if (qmEditKey) qmEditKey.value = "";
    if (qmMessageInput) {
        qmMessageInput.value = "";
        qmMessageInput.placeholder = "Contoh: Ada Maling / Butuh Ambulans / Kebakaran / Pohon Tumbang";
    }

    qmModal.style.display = "flex";
    setTimeout(() => {
        if (qmMessageInput) qmMessageInput.focus();
    }, 50);
}

function openEditModal(key) {
    if (!qmModal) return;

    const item = quickMessages.find(m => m.key === key);
    if (!item) return;

    if (qmModalTitle) {
        qmModalTitle.innerHTML = `
            <i class="fa-solid fa-pen-to-square"></i>
            <span>Edit Template Pesan</span>
        `;
    }

    if (qmEditKey) qmEditKey.value = item.key;
    if (qmMessageInput) qmMessageInput.value = item.text;

    qmModal.style.display = "flex";
    setTimeout(() => {
        if (qmMessageInput) qmMessageInput.focus();
    }, 50);
}

function closeModal() {
    if (qmModal) {
        qmModal.style.display = "none";
    }
    if (qmEditKey) qmEditKey.value = "";
    if (qmMessageInput) qmMessageInput.value = "";
}

if (openAddModalBtn) {
    openAddModalBtn.addEventListener("click", openAddModal);
}

if (closeQmModal) {
    closeQmModal.addEventListener("click", closeModal);
}

if (btnCancelQm) {
    btnCancelQm.addEventListener("click", closeModal);
}

if (qmModal) {
    qmModal.addEventListener("click", (e) => {
        if (e.target === qmModal) {
            closeModal();
        }
    });
}


/*
|--------------------------------------------------------------------------
| SAVE (ADD / EDIT) MESSAGE
|--------------------------------------------------------------------------
*/

if (btnSaveQm) {
    btnSaveQm.addEventListener("click", async () => {
        const text = qmMessageInput ? qmMessageInput.value.trim() : "";
        const editKey = qmEditKey ? qmEditKey.value.trim() : "";

        if (!text) {
            if (typeof Swal !== "undefined") {
                Swal.fire({
                    icon: "warning",
                    title: "Pesan Kosong",
                    text: "Silakan tuliskan isi template pesan terlebih dahulu.",
                    confirmButtonColor: "#173f70"
                });
            } else {
                alert("Pesan tidak boleh kosong!");
            }
            return;
        }

        btnSaveQm.disabled = true;

        try {
            if (editKey) {
                // EDIT EXISTING
                await set(ref(db1, `global_quick_messages/${editKey}`), text);

                if (typeof Swal !== "undefined") {
                    Swal.fire({
                        icon: "success",
                        title: "Pesan Diperbarui",
                        text: "Template quick message berhasil disimpan.",
                        timer: 1800,
                        showConfirmButton: false
                    });
                }
            } else {
                // ADD NEW
                const newRef = push(dbRef);
                await set(newRef, text);

                if (typeof Swal !== "undefined") {
                    Swal.fire({
                        icon: "success",
                        title: "Pesan Ditambahkan",
                        text: "Template quick message baru berhasil dibuat.",
                        timer: 1800,
                        showConfirmButton: false
                    });
                }
            }

            closeModal();
        } catch (error) {
            console.error("Gagal menyimpan quick message:", error);
            if (typeof Swal !== "undefined") {
                Swal.fire({
                    icon: "error",
                    title: "Gagal Menyimpan",
                    text: error.message,
                    confirmButtonColor: "#173f70"
                });
            } else {
                alert("Gagal menyimpan: " + error.message);
            }
        } finally {
            btnSaveQm.disabled = false;
        }
    });
}


/*
|--------------------------------------------------------------------------
| DELETE MESSAGE WITH CONFIRMATION
|--------------------------------------------------------------------------
*/

async function confirmDelete(key) {
    const item = quickMessages.find(m => m.key === key);
    if (!item) return;

    const performDelete = async () => {
        try {
            await remove(ref(db1, `global_quick_messages/${key}`));

            if (typeof Swal !== "undefined") {
                Swal.fire({
                    icon: "success",
                    title: "Terhapus",
                    text: "Template pesan berhasil dihapus.",
                    timer: 1800,
                    showConfirmButton: false
                });
            }
        } catch (error) {
            console.error("Gagal menghapus pesan:", error);
            if (typeof Swal !== "undefined") {
                Swal.fire({
                    icon: "error",
                    title: "Gagal Menghapus",
                    text: error.message,
                    confirmButtonColor: "#173f70"
                });
            } else {
                alert("Gagal menghapus pesan: " + error.message);
            }
        }
    };

    if (typeof Swal !== "undefined") {
        Swal.fire({
            title: "Hapus Quick Message?",
            text: `Anda yakin ingin menghapus template "${item.text.length > 50 ? item.text.substring(0, 50) + "..." : item.text}"?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Ya, Hapus",
            cancelButtonText: "Batal"
        }).then((result) => {
            if (result.isConfirmed) {
                performDelete();
            }
        });
    } else {
        if (confirm(`Hapus template pesan "${item.text}"?`)) {
            performDelete();
        }
    }
}


/*
|--------------------------------------------------------------------------
| SEARCH FILTER LISTENER
|--------------------------------------------------------------------------
*/

if (searchMsgInput) {
    searchMsgInput.addEventListener("input", renderTable);
}


/*
|--------------------------------------------------------------------------
| FIREBASE REALTIME LISTENER
|--------------------------------------------------------------------------
*/

onValue(
    dbRef,
    snapshot => {
        const data = snapshot.val();
        quickMessages = [];

        if (data && typeof data === "object") {
            Object.entries(data).forEach(([key, value]) => {
                if (typeof value === "string") {
                    quickMessages.push({
                        key,
                        text: value
                    });
                } else if (value && typeof value === "object" && value.text) {
                    quickMessages.push({
                        key,
                        text: value.text
                    });
                }
            });
        }

        if (totalMsgCount) {
            totalMsgCount.textContent = quickMessages.length.toLocaleString("id-ID");
        }

        if (syncStatusText) {
            syncStatusText.textContent = "Terhubung";
        }

        if (tableSyncStatus) {
            tableSyncStatus.textContent = "Realtime Aktif";
        }

        renderTable();
    },
    error => {
        console.error("Firebase Quick Message Error:", error);

        if (syncStatusText) {
            syncStatusText.textContent = "Terputus";
        }

        if (tableSyncStatus) {
            tableSyncStatus.textContent = "Error Koneksi";
        }

        if (msgsTbody) {
            msgsTbody.innerHTML = `
                <tr>
                    <td colspan="4" class="qm-empty" style="color: var(--dash-emergency) !important;">
                        <i class="fa-solid fa-triangle-exclamation" style="font-size: 36px; margin-bottom: 10px; display: block;"></i>
                        <strong>Gagal memuat data dari Firebase</strong>
                        <p style="font-size: 13px; margin: 4px 0 0;">${escapeHtml(error.message)}</p>
                    </td>
                </tr>
            `;
        }
    }
);

console.log("Quick Message management page initialized smoothly.");