/* =========================================================
   RIWAYAT LAPORAN PETUGAS (3-AREA KANBAN CONTROLLER)
   Firebase Realtime Database (DB1 Perumahan & DB2 Public)
========================================================= */

import { db1, db2 } from "../firebase-config.js";
import {
    ref,
    onValue,
    update
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

document.addEventListener("DOMContentLoaded", () => {
    // Containers
    const waitingCardsContainer = document.getElementById("waitingCardsContainer");
    const processCardsContainer = document.getElementById("processCardsContainer");
    const doneCardsContainer = document.getElementById("doneCardsContainer");

    // Counters
    const countWaiting = document.getElementById("countWaiting");
    const countProcess = document.getElementById("countProcess");
    const countDone = document.getElementById("countDone");

    // Search & Filter
    const searchReportsInput = document.getElementById("searchReportsInput");
    const categoryFilter = document.getElementById("categoryFilter");
    const btnRefreshHistory = document.getElementById("btnRefreshHistory");

    // Modal Detail & Status Update
    const detailReportModal = document.getElementById("detailReportModal");
    const btnCloseDetailModal = document.getElementById("btnCloseDetailModal");
    const btnCancelDetailModal = document.getElementById("btnCancelDetailModal");
    const btnSaveStatusChange = document.getElementById("btnSaveStatusChange");
    const modalReportId = document.getElementById("modalReportId");
    const modalReportSource = document.getElementById("modalReportSource");
    const modalReportPerumahanKey = document.getElementById("modalReportPerumahanKey");
    const modalDetailContent = document.getElementById("modalDetailContent");
    const officerResponseNote = document.getElementById("officerResponseNote");
    const radioStatusCards = document.querySelectorAll(".status-radio-card");

    // Close Modal Handlers
    if (btnCloseDetailModal) {
        btnCloseDetailModal.addEventListener("click", closeModal);
    }
    if (btnCancelDetailModal) {
        btnCancelDetailModal.addEventListener("click", closeModal);
    }
    if (detailReportModal) {
        detailReportModal.addEventListener("click", (e) => {
            if (e.target === detailReportModal) closeModal();
        });
    }

    function closeModal() {
        if (detailReportModal) detailReportModal.style.display = "none";
    }

    // Radio Status Card Selection
    radioStatusCards.forEach(card => {
        card.addEventListener("click", () => {
            const radio = card.querySelector("input[type='radio']");
            if (radio) radio.checked = true;
            radioStatusCards.forEach(c => c.classList.remove("active-selected"));
            card.classList.add("active-selected");
        });
    });

    function setModalStatusRadio(statusVal) {
        const normalized = normalizeStatus(statusVal);
        radioStatusCards.forEach(card => {
            const val = card.getAttribute("data-val");
            const radio = card.querySelector("input[type='radio']");
            if (val === normalized) {
                if (radio) radio.checked = true;
                card.classList.add("active-selected");
            } else {
                if (radio) radio.checked = false;
                card.classList.remove("active-selected");
            }
        });
    }

    function getSelectedRadioStatus() {
        const checked = document.querySelector("input[name='radioStatus']:checked");
        return checked ? checked.value : "Menunggu";
    }

    // State Variables
    let allReports = [];
    let rawHousingReports = [];
    let rawPublicReports = [];
    let rawPublicPanics = [];

    /* =========================================================
       1. REALTIME FIREBASE LISTENERS (DB1 & DB2)
    ========================================================= */

    // DB1: Perumahan Reports
    const perumahanRef = ref(db1, "perumahan");
    onValue(perumahanRef, (snapshot) => {
        const data = snapshot.val() || {};
        rawHousingReports = [];

        Object.entries(data).forEach(([pKey, pVal]) => {
            if (!pVal || typeof pVal !== "object" || pKey === "buzzers") return;
            const pName = pVal.info?.nama || pVal.nama || pKey;

            if (pVal.reports) {
                Object.entries(pVal.reports).forEach(([rId, rVal]) => {
                    if (!rVal) return;
                    rawHousingReports.push({
                        id: rId,
                        source: "perumahan",
                        perumahanKey: pKey,
                        perumahanName: pName,
                        userName: rVal.userName || rVal.nama_warga || rVal.nama || "Warga Perumahan",
                        userPhone: rVal.phoneNumber || rVal.phone || rVal.telepon || "-",
                        location: rVal.houseNumber ? `Rumah No. ${rVal.houseNumber} (${pName})` : pName,
                        houseNumber: rVal.houseNumber || "-",
                        time: rVal.timestamp || rVal.time || rVal.created_at || Date.now(),
                        status: normalizeStatus(rVal.status),
                        note: rVal.note || rVal.keterangan || rVal.catatan || "-",
                        device: rVal.device || rVal.buzzer_name || "Buzzer Perumahan",
                        latitude: rVal.latitude || null,
                        longitude: rVal.longitude || null
                    });
                });
            }
        });

        mergeAndRenderReports();
    }, (err) => {
        console.error("DB1 load reports error:", err);
    });

    // DB2: Public Panics
    const publicPanicsRef = ref(db2, "public_panics");
    onValue(publicPanicsRef, (snapshot) => {
        const data = snapshot.val() || {};
        rawPublicPanics = Object.entries(data).map(([rId, rVal]) => ({
            id: rId,
            source: "public",
            dbTable: "public_panics",
            perumahanKey: "",
            perumahanName: "Area Publik",
            userName: rVal.senderName || rVal.name || rVal.user_name || "Warga Publik",
            userPhone: rVal.phone || rVal.telepon || "-",
            location: rVal.address || rVal.lokasi || (rVal.latitude && rVal.longitude ? `${rVal.latitude}, ${rVal.longitude}` : "Area Publik"),
            houseNumber: "-",
            time: rVal.created_at || rVal.timestamp || Date.now(),
            status: normalizeStatus(rVal.status),
            note: rVal.description || rVal.note || rVal.keterangan || "-",
            device: rVal.assigned_device || rVal.device || "IoT Panic Device",
            latitude: rVal.latitude || null,
            longitude: rVal.longitude || null,
            locationUrl: rVal.locationUrl || null
        }));

        mergeAndRenderReports();
    }, (err) => {
        console.error("DB2 load public_panics error:", err);
    });

    // DB2: Public Reports
    const publicReportsRef = ref(db2, "reports");
    onValue(publicReportsRef, (snapshot) => {
        const data = snapshot.val() || {};
        rawPublicReports = Object.entries(data).map(([rId, rVal]) => ({
            id: rId,
            source: "public",
            dbTable: "reports",
            perumahanKey: "",
            perumahanName: "Area Publik",
            userName: rVal.user_name || rVal.name || "Pengguna Publik",
            userPhone: rVal.phone || rVal.telepon || "-",
            location: rVal.location || rVal.address || "Area Publik",
            houseNumber: "-",
            time: rVal.timestamp || rVal.created_at || Date.now(),
            status: normalizeStatus(rVal.status),
            note: rVal.description || rVal.note || rVal.keterangan || "-",
            device: rVal.device || "Aplikasi Publik",
            latitude: rVal.latitude || null,
            longitude: rVal.longitude || null,
            locationUrl: rVal.locationUrl || null
        }));

        mergeAndRenderReports();
    }, (err) => {
        console.error("DB2 load reports error:", err);
    });

    /* =========================================================
       2. NORMALISASI STATUS & MERGE
    ========================================================= */

    function normalizeStatus(status) {
        if (!status) return "Menunggu";
        const s = String(status).toLowerCase().trim();
        if (s === "selesai" || s === "completed" || s === "done") return "Selesai";
        if (s === "diproses" || s === "proses" || s === "process" || s === "handling") return "Diproses";
        return "Menunggu"; // Default 1-kata term
    }

    function mergeAndRenderReports() {
        // Gabungkan semua laporan
        allReports = [...rawHousingReports, ...rawPublicPanics, ...rawPublicReports];

        // Sort desc berdasarkan waktu (terbaru di atas)
        allReports.sort((a, b) => {
            const timeA = typeof a.time === "number" ? a.time : new Date(a.time).getTime() || 0;
            const timeB = typeof b.time === "number" ? b.time : new Date(b.time).getTime() || 0;
            return timeB - timeA;
        });

        filterAndRenderBoard();
    }

    /* =========================================================
       3. FILTER & RENDER KANBAN BOARD
    ========================================================= */

    function filterAndRenderBoard() {
        const keyword = (searchReportsInput ? searchReportsInput.value : "").trim().toLowerCase();
        const category = categoryFilter ? categoryFilter.value : "all";

        const waitingList = [];
        const processList = [];
        const doneList = [];

        allReports.forEach(report => {
            // Filter Kategori
            if (category !== "all" && report.source !== category) {
                return;
            }

            // Filter Kata Kunci
            if (keyword) {
                const matchUser = (report.userName || "").toLowerCase().includes(keyword);
                const matchLoc = (report.location || "").toLowerCase().includes(keyword);
                const matchNote = (report.note || "").toLowerCase().includes(keyword);
                const matchPName = (report.perumahanName || "").toLowerCase().includes(keyword);
                if (!matchUser && !matchLoc && !matchNote && !matchPName) {
                    return;
                }
            }

            // Pisahkan ke 3 area
            if (report.status === "Menunggu") {
                waitingList.push(report);
            } else if (report.status === "Diproses") {
                processList.push(report);
            } else if (report.status === "Selesai") {
                doneList.push(report);
            }
        });

        // Update Counter Badges
        if (countWaiting) countWaiting.textContent = waitingList.length;
        if (countProcess) countProcess.textContent = processList.length;
        if (countDone) countDone.textContent = doneList.length;

        // Render Area 1: Menunggu
        renderColumn(waitingCardsContainer, waitingList, "Menunggu");

        // Render Area 2: Diproses
        renderColumn(processCardsContainer, processList, "Diproses");

        // Render Area 3: Selesai
        renderColumn(doneCardsContainer, doneList, "Selesai");
    }

    function renderColumn(container, items, columnStatus) {
        if (!container) return;

        if (items.length === 0) {
            let emptyMsg = "Tidak ada laporan dalam status ini.";
            let iconClass = "fa-clipboard-check";
            if (columnStatus === "Menunggu") {
                emptyMsg = "Tidak ada laporan yang menunggu respon.";
                iconClass = "fa-hourglass";
            } else if (columnStatus === "Diproses") {
                emptyMsg = "Tidak ada laporan yang sedang diproses.";
                iconClass = "fa-person-circle-check";
            } else if (columnStatus === "Selesai") {
                emptyMsg = "Belum ada riwayat laporan selesai.";
                iconClass = "fa-box-archive";
            }

            container.innerHTML = `
                <div class="board-empty-state">
                    <i class="fa-solid ${iconClass}"></i>
                    <p>${emptyMsg}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = items.map(report => {
            const formattedTime = formatReportTime(report.time);
            const isUrgent = columnStatus === "Menunggu";

            // Tombol Aksi Cepat
            let advanceButtonHtml = "";
            if (columnStatus === "Menunggu") {
                advanceButtonHtml = `
                    <button type="button" class="btn-card-advance btn-advance-process" onclick="window.quickChangeStatus('${escapeHtml(report.id)}', '${escapeHtml(report.source)}', '${escapeHtml(report.perumahanKey || '')}', 'Diproses', '${escapeHtml(report.dbTable || '')}')">
                        <i class="fa-solid fa-person-running"></i>
                        <span>Proses Sekarang</span>
                    </button>
                `;
            } else if (columnStatus === "Diproses") {
                advanceButtonHtml = `
                    <button type="button" class="btn-card-advance btn-advance-done" onclick="window.quickChangeStatus('${escapeHtml(report.id)}', '${escapeHtml(report.source)}', '${escapeHtml(report.perumahanKey || '')}', 'Selesai', '${escapeHtml(report.dbTable || '')}')">
                        <i class="fa-solid fa-check-double"></i>
                        <span>Selesaikan</span>
                    </button>
                `;
            }

            return `
                <div class="report-card-item ${isUrgent ? 'is-urgent' : ''}" id="report_card_${escapeHtml(report.id)}">
                    <div class="report-card-header">
                        <span class="category-tag ${report.source === 'perumahan' ? 'perumahan' : 'public'}">
                            <i class="${report.source === 'perumahan' ? 'fa-solid fa-building-shield' : 'fa-solid fa-tower-cell'}"></i>
                            ${report.source === 'perumahan' ? 'Perumahan' : 'Public'}
                        </span>
                        <span class="report-card-time">
                            <i class="fa-regular fa-clock"></i> ${formattedTime}
                        </span>
                    </div>

                    <div class="report-card-body">
                        <strong class="report-user-name">
                            <i class="fa-regular fa-user"></i> ${escapeHtml(report.userName)}
                        </strong>
                        <span class="report-location-info">
                            <i class="fa-solid fa-location-dot"></i> ${escapeHtml(report.location)}
                        </span>
                        ${report.note && report.note !== '-' ? `
                            <div class="report-note-box">
                                <i class="fa-regular fa-comment-dots"></i> ${escapeHtml(report.note)}
                            </div>
                        ` : ''}
                    </div>

                    <div class="report-card-actions">
                        <button type="button" class="btn-card-detail" onclick="window.openDetailReportModal('${escapeHtml(report.id)}')">
                            <i class="fa-solid fa-circle-info"></i>
                            <span>Detail</span>
                        </button>
                        ${advanceButtonHtml}
                    </div>
                </div>
            `;
        }).join("");
    }

    function formatReportTime(time) {
        if (!time) return "-";
        const numeric = Number(time);
        const date = Number.isFinite(numeric) ? new Date(numeric) : new Date(time);
        if (isNaN(date.getTime())) return String(time);

        return date.toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    /* =========================================================
       4. DETAIL MODAL & UBAH STATUS
    ========================================================= */

    window.openDetailReportModal = function (reportId) {
        const report = allReports.find(r => r.id === reportId);
        if (!report || !detailReportModal || !modalDetailContent) return;

        if (modalReportId) modalReportId.value = report.id;
        if (modalReportSource) modalReportSource.value = report.source;
        if (modalReportPerumahanKey) modalReportPerumahanKey.value = report.perumahanKey || "";
        if (officerResponseNote) officerResponseNote.value = "";

        setModalStatusRadio(report.status);

        // Google Maps Link
        let mapLinkHtml = "-";
        if (report.locationUrl) {
            mapLinkHtml = `<a href="${report.locationUrl}" target="_blank" rel="noopener noreferrer" style="color:#2563eb; text-decoration:underline; font-weight:600;"><i class="fa-solid fa-map-location-dot"></i> Buka Google Maps</a>`;
        } else if (report.latitude && report.longitude) {
            mapLinkHtml = `<a href="https://www.google.com/maps?q=${report.latitude},${report.longitude}" target="_blank" rel="noopener noreferrer" style="color:#2563eb; text-decoration:underline; font-weight:600;"><i class="fa-solid fa-map-location-dot"></i> Buka Google Maps (${report.latitude}, ${report.longitude})</a>`;
        }

        modalDetailContent.innerHTML = `
            <div class="detail-row-item">
                <span class="detail-row-label"><i class="fa-solid fa-tag"></i> Kategori Laporan</span>
                <span class="detail-row-value">
                    <span class="category-tag ${report.source === 'perumahan' ? 'perumahan' : 'public'}">
                        ${report.source === 'perumahan' ? 'Perumahan' : 'Public'}
                    </span>
                </span>
            </div>
            <div class="detail-row-item">
                <span class="detail-row-label"><i class="fa-solid fa-user"></i> Nama Pelapor</span>
                <strong class="detail-row-value">${escapeHtml(report.userName)}</strong>
            </div>
            <div class="detail-row-item">
                <span class="detail-row-label"><i class="fa-solid fa-phone"></i> Kontak / WhatsApp</span>
                <span class="detail-row-value">${escapeHtml(report.userPhone)}</span>
            </div>
            <div class="detail-row-item">
                <span class="detail-row-label"><i class="fa-solid fa-location-dot"></i> Lokasi / Alamat</span>
                <span class="detail-row-value">${escapeHtml(report.location)}</span>
            </div>
            <div class="detail-row-item">
                <span class="detail-row-label"><i class="fa-solid fa-map-pin"></i> Peta Lokasi</span>
                <span class="detail-row-value">${mapLinkHtml}</span>
            </div>
            <div class="detail-row-item">
                <span class="detail-row-label"><i class="fa-solid fa-microchip"></i> Posko / Perangkat</span>
                <span class="detail-row-value">${escapeHtml(report.device)}</span>
            </div>
            <div class="detail-row-item">
                <span class="detail-row-label"><i class="fa-regular fa-clock"></i> Waktu Kejadian</span>
                <span class="detail-row-value">${formatReportTime(report.time)}</span>
            </div>
            <div class="detail-row-item">
                <span class="detail-row-label"><i class="fa-regular fa-message"></i> Keterangan Insiden</span>
                <span class="detail-row-value" style="text-align:right; font-style:italic;">${escapeHtml(report.note)}</span>
            </div>
        `;

        detailReportModal.style.display = "flex";
    };

    // Simpan Perubahan Status dari Modal
    if (btnSaveStatusChange) {
        btnSaveStatusChange.addEventListener("click", async () => {
            const reportId = modalReportId.value;
            const source = modalReportSource.value;
            const perumahanKey = modalReportPerumahanKey.value;
            const newStatus = getSelectedRadioStatus();
            const noteText = (officerResponseNote ? officerResponseNote.value : "").trim();

            const report = allReports.find(r => r.id === reportId);
            const dbTable = report ? report.dbTable : "public_panics";

            await executeStatusUpdate(reportId, source, perumahanKey, newStatus, dbTable, noteText);
            closeModal();
        });
    }

    // Quick Action Langsung dari Kartu
    window.quickChangeStatus = async function (reportId, source, perumahanKey, targetStatus, dbTable) {
        const confirmColor = targetStatus === "Selesai" ? "#10b981" : "#f59e0b";
        const result = await Swal.fire({
            title: `Ubah Status ke "${targetStatus}"?`,
            text: targetStatus === "Selesai" 
                ? "Laporan ini akan ditandai telah tuntas ditangani oleh petugas." 
                : "Laporan ini akan dialihkan ke status sedang ditangani petugas.",
            icon: targetStatus === "Selesai" ? "success" : "info",
            showCancelButton: true,
            confirmButtonColor: confirmColor,
            cancelButtonColor: "#64748b",
            confirmButtonText: `Ya, Jadikan ${targetStatus}`,
            cancelButtonText: "Batal",
            reverseButtons: true
        });

        if (result.isConfirmed) {
            await executeStatusUpdate(reportId, source, perumahanKey, targetStatus, dbTable);
        }
    };

    // Eksekusi Update ke Firebase DB1 / DB2
    async function executeStatusUpdate(reportId, source, perumahanKey, newStatus, dbTable = "public_panics", note = "") {
        try {
            const updatePayload = {
                status: newStatus,
                updated_at: Date.now()
            };
            if (note) {
                updatePayload.officer_note = note;
                updatePayload.response_note = note;
            }

            if (source === "perumahan") {
                if (!perumahanKey) throw new Error("Perumahan Key tidak ditemukan.");
                await update(ref(db1, `perumahan/${perumahanKey}/reports/${reportId}`), updatePayload);
            } else {
                // Public DB2
                const tableTarget = dbTable || "public_panics";
                await update(ref(db2, `${tableTarget}/${reportId}`), updatePayload);
            }

            // Update state lokal untuk transisi mulus
            const foundReport = allReports.find(r => r.id === reportId);
            if (foundReport) {
                foundReport.status = newStatus;
                if (note) foundReport.officer_note = note;
            }

            filterAndRenderBoard();

            Swal.fire({
                icon: "success",
                title: "Status Berhasil Diperbarui",
                text: `Laporan berhasil dipindahkan ke area "${newStatus}".`,
                timer: 1800,
                showConfirmButton: false
            });

        } catch (err) {
            console.error("Gagal update status laporan:", err);
            Swal.fire({
                icon: "error",
                title: "Gagal Memperbarui",
                text: "Terjadi kesalahan: " + err.message,
                confirmButtonColor: "#dc2626"
            });
        }
    }

    /* =========================================================
       5. EVENT LISTENERS FILTER
    ========================================================= */

    if (searchReportsInput) {
        searchReportsInput.addEventListener("input", () => {
            filterAndRenderBoard();
        });
    }

    if (categoryFilter) {
        categoryFilter.addEventListener("change", () => {
            filterAndRenderBoard();
        });
    }

    if (btnRefreshHistory) {
        btnRefreshHistory.addEventListener("click", () => {
            btnRefreshHistory.querySelector("i").classList.add("fa-spin");
            setTimeout(() => {
                btnRefreshHistory.querySelector("i").classList.remove("fa-spin");
                filterAndRenderBoard();
            }, 600);
        });
    }

    function escapeHtml(text) {
        if (!text) return "";
        return String(text).replace(/[&<>"']/g, (m) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[m]);
    }
});
