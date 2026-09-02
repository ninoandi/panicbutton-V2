/* =====================================================
   REALTIME EMERGENCY NOTIFICATIONS SYSTEM (ADMIN & PETUGAS)
   - Realtime listeners for DB1 (Perumahan) & DB2 (Public / IoT)
   - 12 Seconds Auto-close with Progress Bar & Hover Pause
   - Close Button, Sound Alert & Persistent across all pages
===================================================== */

import { db1, db2 } from "../firebase-config.js";
import {
    ref,
    onValue,
    query,
    limitToLast
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

(function () {
    // 1. Verify Role: Only Admin and Petugas should receive these alerts
    const currentUser = window.currentUser || {};
    const role = (currentUser.role || "").toLowerCase().trim() ||
        (window.location.pathname.includes("/petugas") ? "petugas" :
        (window.location.pathname.includes("/dashboard") || window.location.pathname.includes("/perumahan") || window.location.pathname.includes("/manajemen") || window.location.pathname.includes("/iot") || window.location.pathname.includes("/recap-public") || window.location.pathname.includes("/quick-message") || window.location.pathname.includes("/statistik") || window.location.pathname.includes("/profil") ? "admin" : ""));

    if (role !== "admin" && role !== "petugas") {
        return;
    }

    // 2. Initialize Container
    let container = document.getElementById("emergencyToastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "emergencyToastContainer";
        document.body.appendChild(container);
    }

    // 3. Audio Chime Synthesizer using Web Audio API
    let audioCtx = null;
    function playEmergencyChime() {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return;
            if (!audioCtx) {
                audioCtx = new AudioContextClass();
            }
            if (audioCtx.state === "suspended") {
                audioCtx.resume();
            }

            const now = audioCtx.currentTime;

            // Tone 1
            const osc1 = audioCtx.createOscillator();
            const gain1 = audioCtx.createGain();
            osc1.type = "sine";
            osc1.frequency.setValueAtTime(880, now); // A5
            gain1.gain.setValueAtTime(0.18, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
            osc1.connect(gain1);
            gain1.connect(audioCtx.destination);
            osc1.start(now);
            osc1.stop(now + 0.22);

            // Tone 2 (higher, urgent)
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.type = "sine";
            osc2.frequency.setValueAtTime(1174.66, now + 0.18); // D6
            gain2.gain.setValueAtTime(0.22, now + 0.18);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            osc2.start(now + 0.18);
            osc2.stop(now + 0.55);
        } catch (e) {
            console.warn("Audio chime error:", e);
        }
    }

    // 4. Session Storage & Deduplication Management
    const STORAGE_KEY = "panic_seen_alerts_ids";
    function getSeenAlertIds() {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            return raw ? new Set(JSON.parse(raw)) : new Set();
        } catch (e) {
            return new Set();
        }
    }

    function markAlertAsSeen(id) {
        try {
            const seen = getSeenAlertIds();
            seen.add(id);
            // Cap at last 200 items to keep session storage clean
            const arr = Array.from(seen).slice(-200);
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
        } catch (e) { }
    }

    const seenAlertIds = getSeenAlertIds();
    const pageStartTime = Date.now();
    // Allow notifications for reports created up to 20 seconds before page load
    const freshThreshold = pageStartTime - 20000;

    // Helper: Parse Timestamp
    function parseTimestamp(rawTime, item = {}) {
        if (item.timestamp && typeof item.timestamp === "number" && item.timestamp > 0) {
            return item.timestamp < 10000000000 ? item.timestamp * 1000 : item.timestamp;
        }
        if (item.created_at && typeof item.created_at === "number" && item.created_at > 0) {
            return item.created_at < 10000000000 ? item.created_at * 1000 : item.created_at;
        }
        if (!rawTime || rawTime === "-") return Date.now();
        if (typeof rawTime === "number" && rawTime > 0) {
            return rawTime < 10000000000 ? rawTime * 1000 : rawTime;
        }
        const str = String(rawTime).trim();
        if (/^\d+$/.test(str)) {
            const num = parseInt(str, 10);
            return num < 10000000000 ? num * 1000 : num;
        }
        const matchWaktu = str.match(/^(\d{4}-\d{2}-\d{2})\s+waktu\s+(\d{2}:\d{2}(?::\d{2})?)$/i);
        if (matchWaktu) {
            const d = new Date(`${matchWaktu[1]}T${matchWaktu[2]}`);
            if (!isNaN(d.getTime())) return d.getTime();
        }
        const matchIso = str.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}(?::\d{2})?)$/);
        if (matchIso) {
            const d = new Date(`${matchIso[1]}T${matchIso[2]}`);
            if (!isNaN(d.getTime())) return d.getTime();
        }
        const parsed = new Date(str);
        if (!isNaN(parsed.getTime())) return parsed.getTime();
        return Date.now();
    }

    function escapeHtml(str) {
        if (str === null || str === undefined) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // 5. Toast Rendering & Timer (12 Seconds with Pause on Hover)
    function showEmergencyToast(data) {
        const toastId = "toast_" + (data.id || Math.random().toString(36).substring(2, 9));

        // Prevent duplicate DOM cards
        if (document.getElementById(toastId)) return;

        const card = document.createElement("div");
        card.id = toastId;
        card.className = "emergency-toast-card";

        const sourceLabel = data.source === "perumahan" ? "Darurat Perumahan" : "Darurat Publik";
        const sourceBadgeClass = data.source === "perumahan" ? "badge-source-perumahan" : "badge-source-public";
        const typeLabel = data.type || (data.source === "perumahan" ? "Perumahan" : "Publik");

        const targetUrl = data.targetUrl || (role === "petugas" ? (window.appUrls?.petugasDashboard || "/petugas/dashboard") : (window.appUrls?.dashboard || "/dashboard"));

        let timeDisplay = "Baru saja";
        if (data.time) {
            const d = new Date(data.time);
            if (!isNaN(d.getTime())) {
                const hours = String(d.getHours()).padStart(2, "0");
                const minutes = String(d.getMinutes()).padStart(2, "0");
                timeDisplay = `${hours}:${minutes}`;
            }
        }

        let infoItemsHtml = "";
        if (data.phone && data.phone !== "-") {
            infoItemsHtml += `
                <div class="emergency-toast-info-item">
                    <i class="fa-solid fa-phone"></i>
                    <span>${escapeHtml(data.phone)}</span>
                </div>
            `;
        }
        if (data.location && data.location !== "-") {
            infoItemsHtml += `
                <div class="emergency-toast-info-item">
                    <i class="fa-solid fa-location-dot"></i>
                    <span>${escapeHtml(data.location)}</span>
                </div>
            `;
        }
        if (data.note && data.note !== "-") {
            infoItemsHtml += `
                <div class="emergency-toast-info-item item-note">
                    <i class="fa-solid fa-comment-dots"></i>
                    <span>"${escapeHtml(data.note)}"</span>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="emergency-toast-header">
                <div class="emergency-toast-badge-group">
                    <span class="emergency-toast-badge ${sourceBadgeClass}">
                        <span class="emergency-pulse-icon"></span>
                        ${escapeHtml(sourceLabel)}
                    </span>
                    <span class="emergency-toast-badge badge-type">
                        ${escapeHtml(typeLabel)}
                    </span>
                </div>
                <button type="button" class="emergency-toast-close" title="Tutup Notifikasi" aria-label="Tutup">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="emergency-toast-body">
                <div class="emergency-toast-title-row">
                    <span class="emergency-toast-sender" title="${escapeHtml(data.senderName || 'Warga')}">
                        <i class="fa-solid fa-triangle-exclamation" style="color: #ef4444; font-size: 13px;"></i>
                        ${escapeHtml(data.senderName || 'Warga')}
                    </span>
                    <span class="emergency-toast-time">${escapeHtml(timeDisplay)}</span>
                </div>
                <div class="emergency-toast-info-list">
                    ${infoItemsHtml}
                </div>
                <div class="emergency-toast-actions">
                    <a href="${targetUrl}" class="emergency-toast-btn-view">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i>
                        <span>Lihat Laporan</span>
                    </a>
                </div>
            </div>
            <div class="emergency-toast-progress-wrap">
                <div class="emergency-toast-progress-bar"></div>
            </div>
        `;

        container.prepend(card);
        playEmergencyChime();

        // 12 Seconds Timer with Hover Pause
        const TOTAL_DURATION = 12000;
        let startTime = Date.now();
        let remainingTime = TOTAL_DURATION;
        let timer = null;

        function closeCard() {
            if (timer) clearTimeout(timer);
            card.classList.add("toast-closing");
            setTimeout(() => {
                if (card.parentNode) card.parentNode.removeChild(card);
            }, 320);
        }

        function startTimer() {
            startTime = Date.now();
            timer = setTimeout(closeCard, remainingTime);
        }

        function pauseTimer() {
            clearTimeout(timer);
            remainingTime -= (Date.now() - startTime);
            if (remainingTime < 500) remainingTime = 500;
        }

        startTimer();

        // Hover events
        card.addEventListener("mouseenter", pauseTimer);
        card.addEventListener("mouseleave", startTimer);

        // Close button click
        const btnClose = card.querySelector(".emergency-toast-close");
        if (btnClose) {
            btnClose.addEventListener("click", (e) => {
                e.stopPropagation();
                closeCard();
            });
        }
    }

    // 6. Realtime Listener: DB1 (Perumahan Monitor)
    const activePerumahanListeners = new Set();
    const daftarRef = ref(db1, "daftar_perumahan");

    onValue(daftarRef, (snapshot) => {
        const daftar = snapshot.val() || {};
        Object.entries(daftar).forEach(([pKey, pName]) => {
            if (activePerumahanListeners.has(pKey)) return;
            activePerumahanListeners.add(pKey);

            const clusterName = typeof pName === "string" ? pName : pKey;
            const monitorQuery = query(ref(db1, `perumahan/${pKey}/monitor`), limitToLast(15));

            onValue(monitorQuery, (mSnap) => {
                const monitorData = mSnap.val() || {};
                Object.entries(monitorData).forEach(([mId, mVal]) => {
                    if (!mVal || typeof mVal !== "object") return;
                    const reportKey = `p_${pKey}_${mId}`;
                    const rawTime = mVal.time || mVal.waktu || mVal.timestamp || mVal.created_at;
                    const ts = parseTimestamp(rawTime, mVal);
                    const status = String(mVal.status || "").toLowerCase().trim();

                    // If report already completed/resolved, don't show as a new active emergency toast
                    if (status === "selesai" || status === "completed" || status === "done" || status === "tuntas") {
                        seenAlertIds.add(reportKey);
                        markAlertAsSeen(reportKey);
                        return;
                    }

                    // Check if it's already seen
                    if (seenAlertIds.has(reportKey)) return;

                    // If report is old (created before freshThreshold), mark as seen and don't trigger toast
                    if (ts < freshThreshold) {
                        seenAlertIds.add(reportKey);
                        markAlertAsSeen(reportKey);
                        return;
                    }

                    // It's a fresh emergency report!
                    seenAlertIds.add(reportKey);
                    markAlertAsSeen(reportKey);

                    const houseNo = mVal.houseNumber || mVal.no_rumah || mVal.house_number;
                    const location = houseNo ? `Rumah No. ${houseNo} (${clusterName})` : clusterName;
                    const isIoT = mVal.device && !mVal.device.toLowerCase().includes("web");
                    const type = isIoT ? "Tombol IoT Perumahan" : "Aplikasi Web Warga";

                    showEmergencyToast({
                        id: reportKey,
                        source: "perumahan",
                        type: type,
                        senderName: mVal.name || mVal.nama || mVal.username || "Warga Perumahan",
                        phone: mVal.phone || mVal.phoneNumber || mVal.telepon || "-",
                        location: location,
                        note: mVal.message || mVal.pesan || mVal.keterangan || mVal.note || "-",
                        time: ts,
                        targetUrl: role === "petugas" ? (window.appUrls?.petugasDashboard || "/petugas/dashboard") : (window.appUrls?.dashboard || "/dashboard")
                    });
                });
            }, (err) => {
                console.warn(`Perumahan ${pKey} notification monitor error:`, err);
            });
        });
    }, (err) => {
        console.warn("daftar_perumahan notification listener error:", err);
    });

    // 7. Realtime Listener: DB2 (public_panics)
    const publicPanicsQuery = query(ref(db2, "public_panics"), limitToLast(20));
    onValue(publicPanicsQuery, (snapshot) => {
        const panicsData = snapshot.val() || {};
        Object.entries(panicsData).forEach(([pId, pVal]) => {
            if (!pVal || typeof pVal !== "object") return;
            const reportKey = `pub_panic_${pId}`;
            const rawTime = pVal.created_at || pVal.timestamp;
            const ts = parseTimestamp(rawTime, pVal);
            const status = String(pVal.status || "").toLowerCase().trim();

            if (status === "selesai" || status === "completed" || status === "done") {
                seenAlertIds.add(reportKey);
                markAlertAsSeen(reportKey);
                return;
            }

            if (seenAlertIds.has(reportKey)) return;

            if (ts < freshThreshold) {
                seenAlertIds.add(reportKey);
                markAlertAsSeen(reportKey);
                return;
            }

            seenAlertIds.add(reportKey);
            markAlertAsSeen(reportKey);

            const isIoT = Boolean(pVal.assigned_device || pVal.assigned_zone);
            const type = isIoT ? `Tombol IoT (${pVal.assigned_device || pVal.assigned_zone || 'Zona'})` : "Aplikasi Web Publik";

            showEmergencyToast({
                id: reportKey,
                source: "public",
                type: type,
                senderName: pVal.senderName || pVal.name || pVal.user_name || "Pengguna Publik",
                phone: pVal.phone || pVal.telepon || "-",
                location: pVal.address || pVal.lokasi || (pVal.latitude ? `${pVal.latitude}, ${pVal.longitude}` : "Area Publik"),
                note: pVal.description || pVal.note || pVal.keterangan || "-",
                time: ts,
                targetUrl: role === "petugas" ? (window.appUrls?.petugasDashboard || "/petugas/dashboard") : (window.appUrls?.recapPublic || "/recap-public")
            });
        });
    }, (err) => {
        console.warn("public_panics notification listener error:", err);
    });

    // 8. Realtime Listener: DB2 (reports)
    const publicReportsQuery = query(ref(db2, "reports"), limitToLast(20));
    onValue(publicReportsQuery, (snapshot) => {
        const reportsData = snapshot.val() || {};
        Object.entries(reportsData).forEach(([rId, rVal]) => {
            if (!rVal || typeof rVal !== "object") return;
            const reportKey = `pub_rep_${rId}`;
            const rawTime = rVal.timestamp || rVal.created_at;
            const ts = parseTimestamp(rawTime, rVal);
            const status = String(rVal.status || "").toLowerCase().trim();

            if (status === "selesai" || status === "completed" || status === "done") {
                seenAlertIds.add(reportKey);
                markAlertAsSeen(reportKey);
                return;
            }

            if (seenAlertIds.has(reportKey)) return;

            if (ts < freshThreshold) {
                seenAlertIds.add(reportKey);
                markAlertAsSeen(reportKey);
                return;
            }

            seenAlertIds.add(reportKey);
            markAlertAsSeen(reportKey);

            showEmergencyToast({
                id: reportKey,
                source: "public",
                type: rVal.device || "Laporan Publik",
                senderName: rVal.user_name || rVal.name || "Pengguna Publik",
                phone: rVal.phone || rVal.telepon || "-",
                location: rVal.location || rVal.address || "Area Publik",
                note: rVal.description || rVal.note || rVal.keterangan || "-",
                time: ts,
                targetUrl: role === "petugas" ? (window.appUrls?.petugasDashboard || "/petugas/dashboard") : (window.appUrls?.recapPublic || "/recap-public")
            });
        });
    }, (err) => {
        console.warn("reports notification listener error:", err);
    });

    // 9. Realtime Listener: DB2 (panicChannels IoT hardware direct triggers)
    const channelsRef = ref(db2, "panicChannels");
    onValue(channelsRef, (snapshot) => {
        const channelsData = snapshot.val() || {};
        Object.entries(channelsData).forEach(([zoneName, zoneData]) => {
            if (!zoneData || typeof zoneData !== "object") return;
            Object.entries(zoneData).forEach(([devKey, devVal]) => {
                if (!devVal || typeof devVal !== "object") return;
                if (devVal.active !== true) return;

                const assignedPanicId = devVal.assigned_panic_id || "";
                // If paired with a panic report, public_panics listener will handle the rich info
                if (assignedPanicId) return;

                const channelKey = `hw_${zoneName}_${devKey}_${devVal.last_update || "act"}`;
                const ts = devVal.last_update || Date.now();

                if (seenAlertIds.has(channelKey)) return;

                if (ts < freshThreshold) {
                    seenAlertIds.add(channelKey);
                    markAlertAsSeen(channelKey);
                    return;
                }

                seenAlertIds.add(channelKey);
                markAlertAsSeen(channelKey);

                showEmergencyToast({
                    id: channelKey,
                    source: "public",
                    type: `Tombol Fisik IoT (${zoneName})`,
                    senderName: devVal.device || "Tombol Hardware IoT",
                    phone: "-",
                    location: devVal.lokasi || zoneName,
                    note: "Tombol darurat fisik IoT diaktifkan langsung",
                    time: ts,
                    targetUrl: role === "petugas" ? (window.appUrls?.petugasDashboard || "/petugas/dashboard") : (window.appUrls?.dashboard || "/dashboard")
                });
            });
        });
    }, (err) => {
        console.warn("panicChannels notification listener error:", err);
    });

})();
