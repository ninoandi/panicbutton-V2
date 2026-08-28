/*
|--------------------------------------------------------------------------
| FIREBASE IoT - MULTI DEVICE
|--------------------------------------------------------------------------
*/

import {
    db2
} from "./firebase-config.js";

import {
    ref,
    onValue,
    update
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";


/*
|--------------------------------------------------------------------------
| FIREBASE REFERENCE
|--------------------------------------------------------------------------
*/

const devicesRef = ref(
    db2,
    "panicChannels"
);


/*
|--------------------------------------------------------------------------
| DOM ELEMENTS
|--------------------------------------------------------------------------
*/

const totalDevice =
    document.getElementById("totalDevice");

const totalNormal =
    document.getElementById("totalNormal");

const totalPanic =
    document.getElementById("totalPanic");

const tableBody =
    document.getElementById("iotTableBody");

const searchDevice =
    document.getElementById("searchDevice");

const filterZone =
    document.getElementById("filterZone");

const filterStatus =
    document.getElementById("filterStatus");

const firebaseConnection =
    document.getElementById("firebaseConnection");

const connectionText =
    document.getElementById("connectionText");

const iotMessage =
    document.getElementById("iotMessage");


/*
|--------------------------------------------------------------------------
| MODAL ELEMENTS
|--------------------------------------------------------------------------
*/

const detailModal =
    document.getElementById("iotDetailModal");

const closeDetail =
    document.getElementById("closeDetail");

const detailDevice =
    document.getElementById("detailDevice");

const detailZone =
    document.getElementById("detailZone");

const detailDeviceId =
    document.getElementById("detailDeviceId");

const detailZona =
    document.getElementById("detailZona");

const detailLokasi =
    document.getElementById("detailLokasi");

const detailStatus =
    document.getElementById("detailStatus");

const detailActive =
    document.getElementById("detailActive");

const detailLastUpdate =
    document.getElementById("detailLastUpdate");

const btnDetailPanic =
    document.getElementById("btnDetailPanic");

const btnDetailReset =
    document.getElementById("btnDetailReset");


/*
|--------------------------------------------------------------------------
| LOCAL STATE
|--------------------------------------------------------------------------
*/

let devices = [];

let selectedDevice = null;

let stopModalPanicListener = null;


/*
|--------------------------------------------------------------------------
| HELPER: Escape HTML
|--------------------------------------------------------------------------
*/

function escapeHtml(value) {
    if (value === null || value === undefined) {
        return "";
    }
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/*
|--------------------------------------------------------------------------
| HELPER: Format Time
|--------------------------------------------------------------------------
*/

function formatDate(timestamp) {
    if (!timestamp) {
        return "-";
    }
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
        return "-";
    }
    return date.toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}


/*
|--------------------------------------------------------------------------
| UPDATE SUMMARY COUNTERS
|--------------------------------------------------------------------------
*/

function updateSummary() {
    const total = devices.length;
    const panic = devices.filter(
        device => device.active === true
    ).length;
    const normal = total - panic;

    if (totalDevice) totalDevice.textContent = total.toLocaleString("id-ID");
    if (totalNormal) totalNormal.textContent = normal.toLocaleString("id-ID");
    if (totalPanic) totalPanic.textContent = panic.toLocaleString("id-ID");
}


/*
|--------------------------------------------------------------------------
| UPDATE ZONE FILTER DROPDOWN
|--------------------------------------------------------------------------
*/

function updateZoneFilter() {
    if (!filterZone) return;

    const selected = filterZone.value;
    const zones = [
        ...new Set(
            devices.map(device => device.zona).filter(Boolean)
        )
    ];

    zones.sort();

    filterZone.innerHTML = `
        <option value="">Semua Zona</option>
    `;

    zones.forEach(zone => {
        const option = document.createElement("option");
        option.value = zone;
        option.textContent = `${zone}`;
        filterZone.appendChild(option);
    });

    if (zones.includes(selected)) {
        filterZone.value = selected;
    }
}


/*
|--------------------------------------------------------------------------
| FILTER DEVICES
|--------------------------------------------------------------------------
*/

function getFilteredDevices() {
    const keyword = searchDevice ? searchDevice.value.trim().toLowerCase() : "";
    const zone = filterZone ? filterZone.value : "";
    const status = filterStatus ? filterStatus.value : "";

    return devices.filter(device => {
        const matchesSearch =
            !keyword ||
            device.device.toLowerCase().includes(keyword) ||
            device.zona.toLowerCase().includes(keyword) ||
            device.lokasi.toLowerCase().includes(keyword);

        const matchesZone =
            !zone || device.zona === zone;

        const matchesStatus =
            !status ||
            (status === "panic" && device.active === true) ||
            (status === "normal" && device.active !== true);

        return matchesSearch && matchesZone && matchesStatus;
    });
}


/*
|--------------------------------------------------------------------------
| RENDER TABLE
|--------------------------------------------------------------------------
*/

function renderTable() {
    if (!tableBody) return;

    const filtered = getFilteredDevices();

    if (filtered.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="iot-empty">
                    <i class="fa-solid fa-magnifying-glass" style="font-size:24px; margin-bottom:8px; display:block;"></i>
                    Tidak ada perangkat IoT yang sesuai filter.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = "";

    filtered.forEach((device, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td style="font-weight: 600; color: var(--dash-text-muted);">
                ${index + 1}
            </td>

            <td>
                <div class="table-device-cell">
                    <div class="table-device-icon">
                        <i class="fa-solid fa-microchip"></i>
                    </div>
                    <span>${escapeHtml(device.device)}</span>
                </div>
            </td>

            <td>
                <span class="zone-pill">
                    <i class="fa-solid fa-location-dot" style="font-size:10px; margin-right:4px; color:var(--dash-primary);"></i>
                    ${escapeHtml(device.zona)}
                </span>
            </td>

            <td style="color: var(--dash-text-muted);">
                ${escapeHtml(device.lokasi)}
            </td>

            <td>
                ${device.active
                ? `<span class="status-pill status-pill-panic">
                               <span class="pulse-dot-red"></span>
                               <span>PANIC AKTIF</span>
                           </span>`
                : `<span class="status-pill status-pill-normal">
                               <span class="pulse-dot"></span>
                               <span>NORMAL</span>
                           </span>`
            }
            </td>

            <td style="text-align: center;">
                <button
                    type="button"
                    class="btn-table-detail btn-detail"
                    data-zone="${escapeHtml(device.zona)}"
                    data-device="${escapeHtml(device.device)}"
                >
                    <span>Detail</span>
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });

    // Event listener untuk tombol detail
    tableBody.querySelectorAll(".btn-detail").forEach(button => {
        button.addEventListener("click", () => {
            openDetail(
                button.dataset.zone,
                button.dataset.device
            );
        });
    });
}


/*
|--------------------------------------------------------------------------
| OPEN DETAIL MODAL
|--------------------------------------------------------------------------
*/

function openDetail(zone, deviceId) {
    const device = devices.find(
        item => item.zona === zone && item.device === deviceId
    );

    if (!device) {
        console.error("Device tidak ditemukan:", zone, deviceId);
        return;
    }

    selectedDevice = device;

    if (detailDevice) detailDevice.textContent = device.device;
    if (detailZone) detailZone.textContent = device.zona;
    if (detailDeviceId) detailDeviceId.textContent = device.device;
    if (detailZona) detailZona.textContent = device.zona;
    if (detailLokasi) detailLokasi.textContent = device.lokasi || "-";

    if (detailStatus) {
        detailStatus.textContent = device.active ? "PANIC AKTIF" : "NORMAL";
        detailStatus.className = `iot-detail-value iot-value ${device.active ? "panic" : "normal"}`;
    }

    if (detailActive) {
        detailActive.textContent = device.active ? "Alarm Aktif" : "Standby (Normal)";
        detailActive.className = `iot-detail-value iot-value ${device.active ? "panic" : "normal"}`;
    }

    if (detailLastUpdate) {
        detailLastUpdate.textContent = formatDate(device.last_update);
    }

    // Button states
    if (btnDetailPanic) {
        btnDetailPanic.disabled = device.active === true;
    }
    if (btnDetailReset) {
        btnDetailReset.disabled = device.active !== true;
    }

    if (detailModal) {
        detailModal.style.display = "flex";
    }

    listenModalPanic();
}


/*
|--------------------------------------------------------------------------
| CLOSE DETAIL MODAL
|--------------------------------------------------------------------------
*/

function closeModal() {
    if (detailModal) {
        detailModal.style.display = "none";
    }

    if (stopModalPanicListener) {
        stopModalPanicListener();
        stopModalPanicListener = null;
    }

    selectedDevice = null;
}

if (closeDetail) {
    closeDetail.addEventListener("click", closeModal);
}

if (detailModal) {
    detailModal.addEventListener("click", event => {
        if (event.target === detailModal) {
            closeModal();
        }
    });
}


/*
|--------------------------------------------------------------------------
| CHECK ACTIVE PANIC IN ZONE
|--------------------------------------------------------------------------
*/

function getActivePanicInZone(zone, exceptDevice = null) {
    return devices.find(
        device =>
            device.zona === zone &&
            device.device !== exceptDevice &&
            device.active === true
    );
}


/*
|--------------------------------------------------------------------------
| REALTIME LISTENER FOR MODAL POPUP
|--------------------------------------------------------------------------
*/

function listenModalPanic() {
    if (stopModalPanicListener) {
        stopModalPanicListener();
        stopModalPanicListener = null;
    }

    if (!selectedDevice) return;

    const zone = selectedDevice.zona;
    const deviceId = selectedDevice.device;

    const deviceRef = ref(
        db2,
        `panicChannels/${zone}/${deviceId}`
    );

    stopModalPanicListener = onValue(
        deviceRef,
        snapshot => {
            const data = snapshot.val();
            if (!data) return;

            const active = data.active === true;

            // FIX: Ganti detailSpanitatus menjadi detailStatus
            if (detailStatus) {
                detailStatus.textContent = active ? "PANIC AKTIF" : "NORMAL";
                detailStatus.className = `iot-detail-value iot-value ${active ? "panic" : "normal"}`;
            }

            if (detailActive) {
                detailActive.textContent = active ? "Alarm Aktif" : "Standby (Normal)";
                detailActive.className = `iot-detail-value iot-value ${active ? "panic" : "normal"}`;
            }

            if (detailLastUpdate) {
                detailLastUpdate.textContent = formatDate(data.last_update);
            }

            if (btnDetailPanic) {
                btnDetailPanic.disabled = active;
            }

            if (btnDetailReset) {
                btnDetailReset.disabled = !active;
            }

            if (iotMessage) {
                if (active) {
                    iotMessage.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color:var(--dash-emergency);"></i> <span><strong>${escapeHtml(deviceId)}</strong> di Zona ${escapeHtml(zone)} sedang dalam kondisi <strong>PANIC</strong>.</span>`;
                } else {
                    iotMessage.innerHTML = `<i class="fa-solid fa-circle-check" style="color:var(--dash-success);"></i> <span><strong>${escapeHtml(deviceId)}</strong> dalam kondisi normal.</span>`;
                }
            }
        }
    );
}


/*
|--------------------------------------------------------------------------
| SEND PANIC
|--------------------------------------------------------------------------
*/

async function sendPanic() {
    if (!selectedDevice) return;

    const zone = selectedDevice.zona;
    const deviceId = selectedDevice.device;

    const existingPanic = getActivePanicInZone(zone, deviceId);
    if (existingPanic) {
        if (iotMessage) {
            iotMessage.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color:var(--dash-warning);"></i> <span>Zona ${escapeHtml(zone)} sedang panic dari device <strong>${escapeHtml(existingPanic.device)}</strong>.</span>`;
        }

        if (typeof Swal !== "undefined") {
            Swal.fire({
                icon: "warning",
                title: "Peringatan Zona",
                text: `Zona ${zone} sedang mengalami panic dari device ${existingPanic.device}.`,
                confirmButtonColor: "#173f70"
            });
        } else {
            alert(`Zona ${zone} sedang mengalami panic dari device ${existingPanic.device}.`);
        }
        return;
    }

    const deviceRef = ref(
        db2,
        `panicChannels/${zone}/${deviceId}`
    );

    try {
        await update(deviceRef, {
            active: true,
            device: deviceId,
            lokasi: selectedDevice.lokasi,
            zona: zone,
            last_update: Date.now()
        });

        if (iotMessage) {
            iotMessage.innerHTML = `<i class="fa-solid fa-circle-check" style="color:var(--dash-success);"></i> <span>Panic berhasil dipicu untuk <strong>${escapeHtml(deviceId)}</strong>.</span>`;
        }

        if (typeof Swal !== "undefined") {
            Swal.fire({
                icon: "success",
                title: "Panic Terkirim",
                text: `Sinyal panic berhasil dikirim ke perangkat ${deviceId}`,
                timer: 2000,
                showConfirmButton: false
            });
        }
    } catch (error) {
        console.error("Gagal mengirim panic:", error);
        if (iotMessage) {
            iotMessage.innerHTML = `<i class="fa-solid fa-circle-xmark" style="color:var(--dash-emergency);"></i> <span>Gagal mengirim panic: ${escapeHtml(error.message)}</span>`;
        }
    }
}


/*
|--------------------------------------------------------------------------
| RESET PANIC
|--------------------------------------------------------------------------
*/

async function resetPanic() {
    if (!selectedDevice) return;

    const zone = selectedDevice.zona;
    const deviceId = selectedDevice.device;

    const deviceRef = ref(
        db2,
        `panicChannels/${zone}/${deviceId}`
    );

    try {
        await update(deviceRef, {
            active: false,
            last_update: Date.now()
        });

        if (iotMessage) {
            iotMessage.innerHTML = `<i class="fa-solid fa-circle-check" style="color:var(--dash-success);"></i> <span>Panic <strong>${escapeHtml(deviceId)}</strong> berhasil di-reset ke normal.</span>`;
        }

        if (typeof Swal !== "undefined") {
            Swal.fire({
                icon: "success",
                title: "Reset Berhasil",
                text: `Status panic ${deviceId} berhasil dinetralkan`,
                timer: 2000,
                showConfirmButton: false
            });
        }
    } catch (error) {
        console.error("Gagal reset panic:", error);
        if (iotMessage) {
            iotMessage.innerHTML = `<i class="fa-solid fa-circle-xmark" style="color:var(--dash-emergency);"></i> <span>Gagal reset panic: ${escapeHtml(error.message)}</span>`;
        }
    }
}


/*
|--------------------------------------------------------------------------
| EVENT LISTENERS
|--------------------------------------------------------------------------
*/

if (btnDetailPanic) {
    btnDetailPanic.addEventListener("click", sendPanic);
}

if (btnDetailReset) {
    btnDetailReset.addEventListener("click", resetPanic);
}

if (searchDevice) {
    searchDevice.addEventListener("input", renderTable);
}

if (filterZone) {
    filterZone.addEventListener("change", renderTable);
}

if (filterStatus) {
    filterStatus.addEventListener("change", renderTable);
}


/*
|--------------------------------------------------------------------------
| FIREBASE REALTIME LISTENER (MAIN)
|--------------------------------------------------------------------------
*/

onValue(
    devicesRef,
    snapshot => {
        const data = snapshot.val();
        devices = [];

        if (!data) {
            updateSummary();
            updateZoneFilter();
            renderTable();

            if (firebaseConnection) {
                firebaseConnection.className = "connection-badge";
            }
            if (connectionText) {
                connectionText.textContent = "Terhubung";
            }
            if (iotMessage) {
                iotMessage.innerHTML = `<i class="fa-solid fa-circle-info"></i> <span>Belum ada perangkat IoT terdata di Firebase.</span>`;
            }
            return;
        }

        // Loop Zona
        Object.entries(data).forEach(([zoneName, zoneData]) => {
            if (!zoneData || typeof zoneData !== "object") return;

            // Loop Device
            Object.entries(zoneData).forEach(([deviceKey, deviceData]) => {
                if (!deviceData || typeof deviceData !== "object") return;

                devices.push({
                    device: deviceData.device || deviceKey,
                    zona: deviceData.zona || zoneName,
                    lokasi: deviceData.lokasi || "-",
                    active: deviceData.active === true,
                    last_update: deviceData.last_update || null
                });
            });
        });

        // Sort device by name
        devices.sort((a, b) => a.device.localeCompare(b.device));

        updateSummary();
        updateZoneFilter();
        renderTable();

        if (firebaseConnection) {
            firebaseConnection.className = "connection-badge";
        }
        const dot = firebaseConnection?.querySelector(".connection-dot");
        if (dot) dot.className = "connection-dot";

        if (connectionText) {
            connectionText.textContent = "Realtime Terhubung";
        }

        if (iotMessage) {
            iotMessage.innerHTML = `<i class="fa-solid fa-circle-check" style="color:var(--dash-success);"></i> <span>${devices.length} perangkat IoT berhasil disinkronkan secara realtime.</span>`;
        }
    },
    error => {
        console.error("Firebase IoT Error:", error);

        if (firebaseConnection) {
            firebaseConnection.className = "connection-badge error";
        }
        const dot = firebaseConnection?.querySelector(".connection-dot");
        if (dot) dot.className = "connection-dot error";

        if (connectionText) {
            connectionText.textContent = "Terputus";
        }

        if (iotMessage) {
            iotMessage.innerHTML = `<i class="fa-solid fa-circle-xmark" style="color:var(--dash-emergency);"></i> <span>Gagal membaca data Firebase: ${escapeHtml(error.message)}</span>`;
        }
    }
);

console.log("IoT Monitoring initialized smoothly.");
