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
|
| Struktur:
|
| panicChannels/
|     ├── TESTER/
|     │   ├── PB_prototyp/
|     │   ├── PB_001/
|     │   └── PB_002/
|
|--------------------------------------------------------------------------
*/

const devicesRef = ref(
    db2,
    "panicChannels"
);


/*
|--------------------------------------------------------------------------
| ELEMENT
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

const connectionText =
    document.getElementById("connectionText");

const iotMessage =
    document.getElementById("iotMessage");


/*
|--------------------------------------------------------------------------
| MODAL ELEMENT
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
| DATA
|--------------------------------------------------------------------------
*/

let devices = [];

let selectedDevice = null;


/*
|--------------------------------------------------------------------------
| HELPER
|--------------------------------------------------------------------------
*/

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
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
| FORMAT TIME
|--------------------------------------------------------------------------
*/

function formatDate(timestamp) {

    if (!timestamp) {
        return "-";
    }

    const date =
        new Date(timestamp);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "-";
    }

    return date.toLocaleString(
        "id-ID"
    );

}


/*
|--------------------------------------------------------------------------
| UPDATE SUMMARY
|--------------------------------------------------------------------------
*/

function updateSummary() {

    const total =
        devices.length;

    const panic =
        devices.filter(
            device =>
                device.active === true
        ).length;

    const normal =
        total - panic;


    totalDevice.textContent =
        total;

    totalNormal.textContent =
        normal;

    totalPanic.textContent =
        panic;

}


/*
|--------------------------------------------------------------------------
| UPDATE ZONE FILTER
|--------------------------------------------------------------------------
*/

function updateZoneFilter() {

    const selected =
        filterZone.value;


    const zones = [
        ...new Set(
            devices.map(
                device =>
                    device.zona
            )
        )
    ];


    zones.sort();


    filterZone.innerHTML = `
        <option value="">
            Semua Zona
        </option>
    `;


    zones.forEach(
        zone => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                zone;

            option.textContent =
                zone;

            filterZone.appendChild(
                option
            );

        }
    );


    if (
        zones.includes(selected)
    ) {

        filterZone.value =
            selected;

    }

}


/*
|--------------------------------------------------------------------------
| FILTER DEVICE
|--------------------------------------------------------------------------
*/

function getFilteredDevices() {

    const keyword =
        searchDevice.value
            .trim()
            .toLowerCase();


    const zone =
        filterZone.value;


    const status =
        filterStatus.value;


    return devices.filter(
        device => {

            const matchesSearch =

                !keyword ||

                device.device
                    .toLowerCase()
                    .includes(keyword) ||

                device.zona
                    .toLowerCase()
                    .includes(keyword) ||

                device.lokasi
                    .toLowerCase()
                    .includes(keyword);


            const matchesZone =

                !zone ||

                device.zona === zone;


            const matchesStatus =

                !status ||

                (
                    status === "panic" &&
                    device.active === true
                ) ||

                (
                    status === "normal" &&
                    device.active !== true
                );


            return (
                matchesSearch &&
                matchesZone &&
                matchesStatus
            );

        }
    );

}


/*
|--------------------------------------------------------------------------
| RENDER TABLE
|--------------------------------------------------------------------------
*/

function renderTable() {

    const filtered =
        getFilteredDevices();


    if (
        filtered.length === 0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="iot-loading"
                >
                    Tidak ada perangkat.
                </td>
            </tr>
        `;

        return;

    }


    tableBody.innerHTML = "";


    filtered.forEach(
        (device, index) => {

            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>


                <td>
                    <strong>
                        ${escapeHtml(
                            device.device
                        )}
                    </strong>
                </td>


                <td>
                    ${escapeHtml(
                        device.zona
                    )}
                </td>


                <td>
                    ${escapeHtml(
                        device.lokasi
                    )}
                </td>


                <td>

                    <span
                        class="iot-status ${
                            device.active
                                ? "panic"
                                : "normal"
                        }"
                    >

                        ${
                            device.active
                                ? "🚨 PANIC"
                                : "🟢 NORMAL"
                        }

                    </span>

                </td>


                <td>

                    <button
                        type="button"
                        class="iot-btn iot-btn-primary btn-detail"
                        data-zone="${escapeHtml(
                            device.zona
                        )}"
                        data-device="${escapeHtml(
                            device.device
                        )}"
                    >
                        Detail
                    </button>

                </td>

            `;


            tableBody.appendChild(row);

        }
    );


    /*
    |--------------------------------------------------------------------------
    | DETAIL BUTTON
    |--------------------------------------------------------------------------
    */

    tableBody
        .querySelectorAll(
            ".btn-detail"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openDetail(
                            button.dataset.zone,
                            button.dataset.device
                        );

                    }
                );

            }
        );

}


/*
|--------------------------------------------------------------------------
| OPEN DETAIL
|--------------------------------------------------------------------------
*/

function openDetail(
    zone,
    deviceId
) {

    const device =
        devices.find(
            item =>

                item.zona === zone &&

                item.device === deviceId
        );


    if (!device) {

        console.error(
            "Device tidak ditemukan:",
            zone,
            deviceId
        );

        return;

    }


    selectedDevice =
        device;


    /*
    |--------------------------------------------------------------------------
    | DEVICE
    |--------------------------------------------------------------------------
    */

    detailDevice.textContent =
        device.device;

    detailZone.textContent =
        device.zona;

    detailDeviceId.textContent =
        device.device;

    detailZona.textContent =
        device.zona;

    detailLokasi.textContent =
        device.lokasi || "-";


    /*
    |--------------------------------------------------------------------------
    | STATUS PANIC
    |--------------------------------------------------------------------------
    */

    if (
        device.active === true
    ) {

        detailStatus.textContent =
            "PANIC";

        detailStatus.className =
            "iot-value panic";


        detailActive.textContent =
            "Aktif";

        detailActive.className =
            "iot-value panic";

    }

    else {

        detailStatus.textContent =
            "NORMAL";

        detailStatus.className =
            "iot-value normal";


        detailActive.textContent =
            "Tidak Aktif";

        detailActive.className =
            "iot-value normal";

    }


    /*
    |--------------------------------------------------------------------------
    | LAST UPDATE
    |--------------------------------------------------------------------------
    */

    detailLastUpdate.textContent =
        formatDate(
            device.last_update
        );


    /*
    |--------------------------------------------------------------------------
    | BUTTON STATE
    |--------------------------------------------------------------------------
    */

    if (
        device.active === true
    ) {

        btnDetailPanic.style.display =
            "none";

        btnDetailReset.style.display =
            "inline-flex";

    }

    else {

        btnDetailPanic.style.display =
            "inline-flex";

        btnDetailReset.style.display =
            "inline-flex";

    }


    /*
    |--------------------------------------------------------------------------
    | SHOW MODAL
    |--------------------------------------------------------------------------
    */

 detailModal.style.display = 
    "flex";

listenModalPanic();
}


/*
|--------------------------------------------------------------------------
| CLOSE MODAL
|--------------------------------------------------------------------------
*/

function closeModal() {

    detailModal.style.display =
        "none";


    /*
    |--------------------------------------------------------------------------
    | STOP REALTIME LISTENER
    |--------------------------------------------------------------------------
    */

    if (stopModalPanicListener) {

        stopModalPanicListener();

        stopModalPanicListener =
            null;

    }


    selectedDevice =
        null;
}

closeDetail.addEventListener(
    "click",
    closeModal
);


detailModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            detailModal
        ) {

            closeModal();

        }

    }
);


/*
|--------------------------------------------------------------------------
| CEK PANIC DALAM ZONA
|--------------------------------------------------------------------------
|
| Tidak boleh ada lebih dari satu device
| panic dalam zona yang sama.
|
|--------------------------------------------------------------------------
*/

function getActivePanicInZone(
    zone,
    exceptDevice = null
) {

    return devices.find(
        device =>

            device.zona === zone &&

            device.device !== exceptDevice &&

            device.active === true
    );

}

/*
|--------------------------------------------------------------------------
| REALTIME STATUS PANIC MODAL
|--------------------------------------------------------------------------
*/

let stopModalPanicListener = null;

function listenModalPanic() {

    // Hentikan listener sebelumnya
    if (stopModalPanicListener) {
        stopModalPanicListener();
        stopModalPanicListener = null;
    }

    if (!selectedDevice) {
        return;
    }

    const zone =
        selectedDevice.zona;

    const deviceId =
        selectedDevice.device;

    const deviceRef =
        ref(
            db2,
            `panicChannels/${zone}/${deviceId}`
        );


    stopModalPanicListener = onValue(
        deviceRef,
        snapshot => {

            const data =
                snapshot.val();

            if (!data) {
                return;
            }


            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */

            const active =
                data.active === true;


      /*
|--------------------------------------------------------------------------
| UPDATE STATUS DI MODAL
|--------------------------------------------------------------------------
*/

if (detailStatus) {

    detailStatus.textContent =
        active
            ? "PANIC"
            : "NORMAL";

    detailStatus.className =
        active
            ? "iot-value panic"
            : "iot-value normal";
}


/*
|--------------------------------------------------------------------------
| UPDATE PANIC BUTTON STATUS
|--------------------------------------------------------------------------
*/

if (detailActive) {

    detailActive.textContent =
        active
            ? "Aktif"
            : "Tidak Aktif";

    detailActive.className =
        active
            ? "iot-value panic"
            : "iot-value normal";
}


/*
|--------------------------------------------------------------------------
| UPDATE LAST UPDATE
|--------------------------------------------------------------------------
*/

if (detailLastUpdate) {

    detailLastUpdate.textContent =
        formatDate(data.last_update);
}


            /*
            |--------------------------------------------------------------------------
            | UPDATE TOMBOL PANIC
            |--------------------------------------------------------------------------
            */

            if (btnDetailPanic) {

                btnDetailPanic.disabled =
                    active;

                btnDetailPanic.textContent =
                    active
                        ? "Panic Aktif"
                        : "Kirim Panic";

            }


            /*
            |--------------------------------------------------------------------------
            | UPDATE TOMBOL RESET
            |--------------------------------------------------------------------------
            */

            if (btnDetailReset) {

                btnDetailReset.disabled =
                    !active;

            }


            /*
            |--------------------------------------------------------------------------
            | PESAN
            |--------------------------------------------------------------------------
            */

            if (iotMessage) {

                if (active) {

                    iotMessage.textContent =
                        `🚨 ${deviceId} sedang dalam kondisi PANIC.`;

                } else {

                    iotMessage.textContent =
                        `✅ ${deviceId} dalam kondisi normal.`;

                }

            }

        }
    );

}

/*
|--------------------------------------------------------------------------
| KIRIM PANIC
|--------------------------------------------------------------------------
*/

async function sendPanic() {

    if (!selectedDevice) {

        return;

    }


    const zone =
        selectedDevice.zona;

    const deviceId =
        selectedDevice.device;


    /*
    |--------------------------------------------------------------------------
    | CEK DEVICE LAIN DALAM ZONA
    |--------------------------------------------------------------------------
    */

    const existingPanic =
        getActivePanicInZone(
            zone,
            deviceId
        );


    if (existingPanic) {

        iotMessage.textContent =
            `⚠️ Zona ${zone} sedang panic dari ${existingPanic.device}.`;

        alert(
            `Zona ${zone} sedang mengalami panic dari device ${existingPanic.device}.`
        );

        return;

    }


    /*
    |--------------------------------------------------------------------------
    | FIREBASE PATH
    |--------------------------------------------------------------------------
    */

    const deviceRef =
        ref(
            db2,
            `panicChannels/${zone}/${deviceId}`
        );


    try {

        await update(
            deviceRef,
            {

                active: true,

                device:
                    deviceId,

                lokasi:
                    selectedDevice.lokasi,

                zona:
                    zone,

                last_update:
                    Date.now()

            }
        );


        iotMessage.textContent =
            `🚨 Panic berhasil dikirim untuk ${deviceId}.`;


        console.log(
            "PANIC WEB:",
            {
                device: deviceId,
                zona: zone,
                lokasi: selectedDevice.lokasi
            }
        );


    }

    catch (error) {

        console.error(
            "Gagal mengirim panic:",
            error
        );


        iotMessage.textContent =
            "❌ Gagal mengirim panic: " +
            error.message;

    }

}


/*
|--------------------------------------------------------------------------
| RESET PANIC
|--------------------------------------------------------------------------
*/

async function resetPanic() {

    if (!selectedDevice) {

        return;

    }


    const zone =
        selectedDevice.zona;

    const deviceId =
        selectedDevice.device;


    const deviceRef =
        ref(
            db2,
            `panicChannels/${zone}/${deviceId}`
        );


    try {

        await update(
            deviceRef,
            {

                active: false,

                last_update:
                    Date.now()

            }
        );


        iotMessage.textContent =
            `✅ Panic ${deviceId} berhasil di-reset.`;


        console.log(
            "RESET PANIC:",
            deviceId
        );


    }

    catch (error) {

        console.error(
            "Gagal reset panic:",
            error
        );


        iotMessage.textContent =
            "❌ Gagal reset panic: " +
            error.message;

    }

}


/*
|--------------------------------------------------------------------------
| BUTTON
|--------------------------------------------------------------------------
*/

btnDetailPanic.addEventListener(
    "click",
    sendPanic
);


btnDetailReset.addEventListener(
    "click",
    resetPanic
);


/*
|--------------------------------------------------------------------------
| SEARCH
|--------------------------------------------------------------------------
*/

searchDevice.addEventListener(
    "input",
    renderTable
);


filterZone.addEventListener(
    "change",
    renderTable
);


filterStatus.addEventListener(
    "change",
    renderTable
);


/*
|--------------------------------------------------------------------------
| FIREBASE REALTIME LISTENER
|--------------------------------------------------------------------------
*/

onValue(

    devicesRef,

    snapshot => {

        const data =
            snapshot.val();


        devices = [];


        /*
        |--------------------------------------------------------------------------
        | DATA KOSONG
        |--------------------------------------------------------------------------
        */

        if (!data) {

            updateSummary();

            updateZoneFilter();

            renderTable();


            connectionText.textContent =
                "Terhubung";


            iotMessage.textContent =
                "Belum ada perangkat IoT.";

            return;

        }


        /*
        |--------------------------------------------------------------------------
        | LOOP ZONA
        |--------------------------------------------------------------------------
        */

        Object.entries(data)
            .forEach(
                ([zoneName, zoneData]) => {

                    if (
                        !zoneData ||
                        typeof zoneData !==
                        "object"
                    ) {

                        return;

                    }


                    /*
                    |--------------------------------------------------------------------------
                    | LOOP DEVICE
                    |--------------------------------------------------------------------------
                    */

                    Object.entries(zoneData)
                        .forEach(
                            ([deviceKey, deviceData]) => {

                                if (
                                    !deviceData ||
                                    typeof deviceData !==
                                    "object"
                                ) {

                                    return;

                                }


                                /*
                                |--------------------------------------------------------------------------
                                | DEVICE
                                |--------------------------------------------------------------------------
                                */

                                devices.push({

                                    device:
                                        deviceData.device ||
                                        deviceKey,

                                    zona:
                                        deviceData.zona ||
                                        zoneName,

                                    lokasi:
                                        deviceData.lokasi ||
                                        "-",

                                    active:
                                        deviceData.active ===
                                        true,

                                    last_update:
                                        deviceData.last_update ||
                                        null

                                });

                            }
                        );

                }
            );


        /*
        |--------------------------------------------------------------------------
        | SORT DEVICE
        |--------------------------------------------------------------------------
        */

        devices.sort(
            (a, b) =>
                a.device.localeCompare(
                    b.device
                )
        );


        /*
        |--------------------------------------------------------------------------
        | UPDATE UI
        |--------------------------------------------------------------------------
        */

        updateSummary();

        updateZoneFilter();

        renderTable();


        /*
        |--------------------------------------------------------------------------
        | CONNECTION
        |--------------------------------------------------------------------------
        */

        connectionText.textContent =
            "Terhubung";


        iotMessage.textContent =
            `${devices.length} device berhasil dimuat.`;


        console.log(
            "================================"
        );

        console.log(
            "DATA IoT"
        );

        console.log(
            "================================"
        );

        console.log(
            devices
        );

    },


    error => {

        console.error(
            "Firebase IoT Error:",
            error
        );


        connectionText.textContent =
            "Terputus";


        iotMessage.textContent =
            "❌ Gagal membaca Firebase: " +
            error.message;

    }

);
