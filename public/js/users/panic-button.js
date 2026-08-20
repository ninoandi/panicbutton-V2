import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm";

import { db2 } from "../firebase-config.js";

import {
    ref,
    push,
    get,
    update
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";


// =====================================================
// ELEMENT
// =====================================================

const panicButton =
    document.getElementById("panicButton");

// =====================================================
// DURASI AKTIF PANIC BUTTON
// =====================================================

const PANIC_DURATION = 30 * 1000; // 30 detik


// =====================================================
// HITUNG JARAK
// =====================================================
// Menggunakan rumus Haversine.
// Hasil dalam meter.
// =====================================================

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const R = 6371000;

    const dLat =
        (lat2 - lat1) *
        Math.PI / 180;

    const dLon =
        (lon2 - lon1) *
        Math.PI / 180;


    const a =
        Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +

        Math.cos(
            lat1 * Math.PI / 180
        ) *

        Math.cos(
            lat2 * Math.PI / 180
        ) *

        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return R * c;
}


// =====================================================
// CARI PANIC BUTTON IOT TERDEKAT
// =====================================================

async function findNearestDevice(userLatitude, userLongitude) {

    console.log("=================================");
    console.log("MENCARI DEVICE IOT TERDEKAT");
    console.log("Lokasi User:", userLatitude, userLongitude);
    console.log("=================================");


    // =================================================
    // VALIDASI LOKASI USER
    // =================================================

    const userLat = Number(userLatitude);
    const userLon = Number(userLongitude);

    if (
        !Number.isFinite(userLat) ||
        !Number.isFinite(userLon)
    ) {
        throw new Error(
            "Koordinat lokasi user tidak valid."
        );
    }


    // =================================================
    // REFERENSI FIREBASE
    // =================================================

    const channelsRef = ref(
        db2,
        "panicChannels"
    );


    // =================================================
    // AMBIL DATA FIREBASE DENGAN TIMEOUT
    // =================================================

    let snapshot;

    try {

        snapshot = await Promise.race([

            get(channelsRef),

            new Promise((_, reject) => {

                setTimeout(() => {

                    reject(
                        new Error(
                            "Firebase terlalu lama merespons. Periksa koneksi atau Firebase Rules."
                        )
                    );

                }, 10000);

            })

        ]);

    } catch (error) {

        console.error(
            "Gagal membaca panicChannels:",
            error
        );

        throw error;
    }


    // =================================================
    // CEK DATA
    // =================================================

    if (!snapshot.exists()) {

        throw new Error(
            "Belum ada perangkat Panic Button IoT di Firebase."
        );

    }


    const data = snapshot.val();

    console.log(
        "DATA panicChannels:",
        data
    );


    const devices = [];


    // =================================================
    // LOOP ZONA
    // =================================================

    Object.entries(data).forEach(
        ([zoneName, zoneData]) => {

            if (
                !zoneData ||
                typeof zoneData !== "object"
            ) {
                return;
            }


            console.log(
                "Zona:",
                zoneName
            );


            // =================================================
            // LOOP DEVICE
            // =================================================

            Object.entries(zoneData).forEach(
                ([deviceKey, deviceData]) => {

                    if (
                        !deviceData ||
                        typeof deviceData !== "object"
                    ) {
                        return;
                    }


                    console.log(
                        "Cek device:",
                        deviceKey,
                        deviceData
                    );


                    // =================================================
                    // KOORDINAT
                    // =================================================

                    const deviceLatitude =
                        Number(
                            deviceData.latitude
                        );

                    const deviceLongitude =
                        Number(
                            deviceData.longitude
                        );


                    console.log(
                        "Koordinat:",
                        deviceLatitude,
                        deviceLongitude
                    );


                    // =================================================
                    // VALIDASI KOORDINAT
                    // =================================================

                    if (
                        !Number.isFinite(deviceLatitude) ||
                        !Number.isFinite(deviceLongitude)
                    ) {

                        console.warn(
                            "Device tidak memiliki koordinat:",
                            deviceKey
                        );

                        return;
                    }


                    // =================================================
                    // CEK ONLINE
                    // =================================================

                    if (
                        deviceData.online === false
                    ) {

                        console.warn(
                            "Device offline:",
                            deviceKey
                        );

                        return;
                    }


                    // =================================================
                    // CEK ACTIVE
                    // =================================================

                    if (
                        deviceData.active === true
                    ) {

                        console.warn(
                            "Device sedang PANIC:",
                            deviceKey
                        );

                        return;
                    }


                    // =================================================
                    // HITUNG JARAK
                    // =================================================

                    const distance =
                        calculateDistance(
                            userLat,
                            userLon,
                            deviceLatitude,
                            deviceLongitude
                        );


                    console.log(
                        "Device VALID:",
                        deviceKey
                    );

                    console.log(
                        "Jarak:",
                        Math.round(distance),
                        "meter"
                    );


                    // =================================================
                    // MASUKKAN KE DAFTAR
                    // =================================================

                    devices.push({

                        zone:
                            deviceData.zona ||
                            zoneName,

                        deviceKey:
                            deviceKey,

                        device:
                            deviceData.device ||
                            deviceKey,

                        lokasi:
                            deviceData.lokasi ||
                            "-",

                        latitude:
                            deviceLatitude,

                        longitude:
                            deviceLongitude,

                        online:
                            deviceData.online !== false,

                        active:
                            deviceData.active === true,

                        distance:
                            distance

                    });

                }
            );

        }
    );


    // =================================================
    // CEK HASIL
    // =================================================

    console.log(
        "Jumlah device valid:",
        devices.length
    );


    if (
        devices.length === 0
    ) {

        throw new Error(
            "Tidak ada Panic Button IoT yang tersedia."
        );

    }


    // =================================================
    // URUTKAN BERDASARKAN JARAK
    // =================================================

    devices.sort(
        (a, b) =>
            a.distance -
            b.distance
    );


    // =================================================
    // DEVICE TERDEKAT
    // =================================================

    const nearestDevice =
        devices[0];


    console.log(
        "================================="
    );

    console.log(
        "DEVICE TERDEKAT TERPILIH"
    );

    console.log(
        "================================="
    );

    console.log(
        nearestDevice
    );


    return nearestDevice;
}

// =====================================================
// GEOLOCATION USER
// =====================================================

function getCurrentLocation() {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            if (
                !navigator.geolocation
            ) {

                reject(
                    new Error(
                        "Browser tidak mendukung lokasi."
                    )
                );

                return;

            }


            navigator.geolocation.getCurrentPosition(

                resolve,

                error => {

                    console.error(
                        "Geolocation error:",
                        error
                    );


                    reject(
                        new Error(
                            "Lokasi tidak dapat diperoleh. Silakan izinkan akses lokasi."
                        )
                    );

                },

                {

                    enableHighAccuracy:
                        true,

                    timeout:
                        15000,

                    maximumAge:
                        0

                }

            );

        }
    );

}

// =====================================================
// MATIKAN IOT OTOMATIS
// =====================================================

async function autoTurnOffDevice(
    zone,
    deviceKey,
    panicId
) {

    console.log(
        "================================="
    );

    console.log(
        "AUTO-OFF TIMER DIMULAI"
    );

    console.log(
        "Device:",
        deviceKey
    );

    console.log(
        "Panic ID:",
        panicId
    );

    console.log(
        "Durasi: 30 detik"
    );

    console.log(
        "================================="
    );


    // Tunggu 30 detik
    await new Promise(resolve => {
        setTimeout(
            resolve,
            PANIC_DURATION
        );
    });


    try {

        const deviceRef = ref(
            db2,
            `panicChannels/${zone}/${deviceKey}`
        );


        // Baca kondisi terbaru terlebih dahulu
        const snapshot = await get(
            deviceRef
        );


        if (!snapshot.exists()) {

            console.warn(
                "Device tidak ditemukan saat auto-off:",
                deviceKey
            );

            return;
        }


        const deviceData =
            snapshot.val();


        // =================================================
        // PENTING
        // Jangan mematikan device jika sudah digunakan
        // untuk panic lain.
        // =================================================

        if (
            deviceData.assigned_panic_id &&
            deviceData.assigned_panic_id !== panicId
        ) {

            console.warn(
                "Auto-off dibatalkan karena device sudah digunakan oleh panic lain."
            );

            return;
        }


        // =================================================
        // MATIKAN IOT
        // =================================================

        await update(
            deviceRef,
            {

                active: false,

                assigned_panic_id: "",

                panic_latitude: null,

                panic_longitude: null,

                last_update: Date.now()

            }
        );


        // =================================================
        // UPDATE PUBLIC PANIC
        // =================================================

        const panicRef = ref(
            db2,
            `public_panics/${panicId}`
        );


        await update(
            panicRef,
            {

                status: "completed",

                updated_at: Date.now(),

                device_auto_off: true

            }
        );


        console.log(
            "================================="
        );

        console.log(
            "IOT OTOMATIS DIMATIKAN"
        );

        console.log(
            "Device:",
            deviceKey
        );

        console.log(
            "Panic ID:",
            panicId
        );

        console.log(
            "================================="
        );


    } catch (error) {

        console.error(
            "Gagal melakukan auto-off IoT:",
            error
        );

    }

}

// =====================================================
// REVERSE GEOCODING
// KOORDINAT → NAMA / ALAMAT LOKASI
// =====================================================

async function getAddressFromCoordinates(latitude, longitude) {

    try {

        const url =
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;

        const response = await fetch(url, {
            headers: {
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(
                "Gagal mendapatkan alamat lokasi."
            );
        }

        const data = await response.json();

        console.log(
            "Reverse geocoding:",
            data
        );

        return (
            data.display_name ||
            `${latitude}, ${longitude}`
        );

    } catch (error) {

        console.warn(
            "Reverse geocoding gagal:",
            error
        );

        // Jika gagal, tetap gunakan koordinat
        return `${latitude}, ${longitude}`;
    }
}

function escapeHtml(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// =====================================================
// TOMBOL PANIC DENGAN POPUP MODERN TEMA
// =====================================================

panicButton?.addEventListener(
    "click",
    async () => {

        // =================================================
        // 1. KONFIRMASI AKTIFKAN PANIC
        // =================================================

        const result = await Swal.fire({
            title: "Aktifkan Panic Button?",
            html: `
                <div class="panic-popup-body">
                    <div class="panic-popup-icon-wrap warning">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <p class="panic-popup-desc">
                        Laporan darurat akan dikirim seketika. Sistem akan mendeteksi lokasi GPS Anda dan mengaktifkan perangkat sirine IoT terdekat.
                    </p>
                    <div class="panic-popup-notice">
                        <i class="fa-solid fa-location-crosshairs"></i>
                        <span>Pastikan akses lokasi GPS telah diizinkan pada perangkat Anda.</span>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Ya, Aktifkan',
            cancelButtonText: 'Batal',
            reverseButtons: true,
            buttonsStyling: false,
            customClass: {
                popup: 'panic-swal-popup',
                title: 'panic-swal-title',
                htmlContainer: 'panic-swal-html',
                confirmButton: 'panic-swal-btn panic-swal-btn-danger',
                cancelButton: 'panic-swal-btn panic-swal-btn-cancel',
                actions: 'panic-swal-actions'
            }
        });

        if (!result.isConfirmed) {
            return;
        }

        // Disable button saat proses
        panicButton.disabled = true;

        try {

            // =================================================
            // 2. LOADING: MENDETEKSI LOKASI & IOT
            // =================================================

            Swal.fire({
                title: "Menghubungkan Sistem...",
                html: `
                    <div class="panic-popup-body">
                        <div class="panic-popup-loader">
                            <div class="panic-loader-radar"></div>
                            <i class="fa-solid fa-satellite-dish"></i>
                        </div>
                        <p class="panic-popup-desc">
                            Mendeteksi koordinat lokasi GPS dan mencari perangkat Panic Button IoT terdekat...
                        </p>
                    </div>
                `,
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                buttonsStyling: false,
                customClass: {
                    popup: 'panic-swal-popup panic-swal-loading',
                    title: 'panic-swal-title',
                    htmlContainer: 'panic-swal-html'
                }
            });

            // 1. AMBIL LOKASI USER
            const position = await getCurrentLocation();
            const latitude = Number(position.coords.latitude);
            const longitude = Number(position.coords.longitude);

            console.log("=================================");
            console.log("Lokasi User:", latitude, longitude);
            console.log("=================================");

            // VALIDASI LOKASI USER
            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
                throw new Error("Koordinat lokasi user tidak valid.");
            }

            // 2. AMBIL DATA USER
            const currentUser = window.currentUser || {};

            // 3. CARI IOT TERDEKAT
            const nearestDevice = await findNearestDevice(latitude, longitude);

            console.log("Device terpilih:", nearestDevice);

            // DAPATKAN ALAMAT LOKASI
            const address = await getAddressFromCoordinates(latitude, longitude);
            const locationUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

            // 4. BUAT DATA PANIC
            const createdAt = Date.now();
            const autoOffAt = createdAt + PANIC_DURATION;

            const panicData = {
                user_id: currentUser.id || "guest",
                username: currentUser.username || "",
                name: currentUser.name || "",
                phone: currentUser.phone || "",
                email: currentUser.email || "",
                is_guest: !currentUser.id,
                latitude: latitude,
                longitude: longitude,
                address: address,
                location_url: locationUrl,
                status: "active",
                assigned_device: nearestDevice.device,
                assigned_zone: nearestDevice.zone,
                assigned_location: nearestDevice.lokasi,
                device_distance: Math.round(nearestDevice.distance),
                created_at: createdAt,
                updated_at: createdAt,
                auto_off_at: autoOffAt
            };

            // 5. SIMPAN public_panics
            const reportsRef = ref(db2, "public_panics");
            const newReport = await push(reportsRef, panicData);
            const panicId = newReport.key;

            console.log("PANIC ID:", panicId);

            // 6. PATH IOT TERPILIH & AKTIFKAN IOT
            const deviceRef = ref(
                db2,
                `panicChannels/${nearestDevice.zone}/${nearestDevice.deviceKey}`
            );

            await update(deviceRef, {
                active: true,
                assigned_panic_id: panicId,
                panic_latitude: latitude,
                panic_longitude: longitude,
                last_update: Date.now()
            });

            // MULAI AUTO-OFF 30 DETIK
            autoTurnOffDevice(
                nearestDevice.zone,
                nearestDevice.deviceKey,
                panicId
            );

            console.log("IOT BERHASIL DIAKTIFKAN:", nearestDevice.device);

            // 7. UPDATE public_panics
            await update(ref(db2, `public_panics/${panicId}`), {
                assigned_device: nearestDevice.device,
                assigned_zone: nearestDevice.zone,
                assigned_location: nearestDevice.lokasi,
                device_distance: Math.round(nearestDevice.distance),
                updated_at: Date.now()
            });

            // =================================================
            // 8. NOTIFIKASI BERHASIL (SUCCESS POPUP)
            // =================================================

            await Swal.fire({
                title: "Panic Button Aktif",
                html: `
                    <div class="panic-popup-body">
                        <div class="panic-popup-icon-wrap success">
                            <i class="fa-solid fa-circle-check"></i>
                        </div>
                        <p class="panic-popup-desc">
                            Laporan darurat berhasil dikirim dan perangkat sirine terdekat telah diaktifkan.
                        </p>
                        <div class="panic-popup-device-card">
                            <div class="device-card-row">
                                <span class="device-card-label"><i class="fa-solid fa-microchip"></i> Perangkat</span>
                                <strong class="device-card-value">${escapeHtml(nearestDevice.device)}</strong>
                            </div>
                            <div class="device-card-row">
                                <span class="device-card-label"><i class="fa-solid fa-location-dot"></i> Lokasi</span>
                                <strong class="device-card-value">${escapeHtml(nearestDevice.lokasi)}</strong>
                            </div>
                            <div class="device-card-row">
                                <span class="device-card-label"><i class="fa-solid fa-ruler"></i> Estimasi Jarak</span>
                                <strong class="device-card-value">${Math.round(nearestDevice.distance)} meter</strong>
                            </div>
                        </div>
                    </div>
                `,
                confirmButtonText: '<i class="fa-solid fa-check"></i> Mengerti',
                buttonsStyling: false,
                customClass: {
                    popup: 'panic-swal-popup',
                    title: 'panic-swal-title',
                    htmlContainer: 'panic-swal-html',
                    confirmButton: 'panic-swal-btn panic-swal-btn-success',
                    actions: 'panic-swal-actions'
                }
            });

            // SCROLL KE KEJADIAN
            document.getElementById("kejadian")?.scrollIntoView({
                behavior: "smooth"
            });

        } catch (error) {

            console.error("PANIC BUTTON ERROR:", error);

            // =================================================
            // 9. NOTIFIKASI ERROR (ERROR POPUP)
            // =================================================

            await Swal.fire({
                title: "Gagal Mengirim Laporan",
                html: `
                    <div class="panic-popup-body">
                        <div class="panic-popup-icon-wrap error">
                            <i class="fa-solid fa-circle-xmark"></i>
                        </div>
                        <p class="panic-popup-desc">
                            ${escapeHtml(error.message || "Laporan Panic Button gagal diproses. Pastikan izin lokasi aktif dan koneksi internet stabil.")}
                        </p>
                    </div>
                `,
                confirmButtonText: 'Tutup',
                buttonsStyling: false,
                customClass: {
                    popup: 'panic-swal-popup',
                    title: 'panic-swal-title',
                    htmlContainer: 'panic-swal-html',
                    confirmButton: 'panic-swal-btn panic-swal-btn-cancel',
                    actions: 'panic-swal-actions'
                }
            });

        } finally {
            // Re-enable button
            panicButton.disabled = false;
        }

    }
);