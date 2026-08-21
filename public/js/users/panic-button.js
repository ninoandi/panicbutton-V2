import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm";

import { db2 } from "../firebase-config.js";

import {
    ref,
    push,
    get,
    update,
    set
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
// AMBIL DATA USER DARI DB2
// =====================================================

async function getUserFromDB2(userId) {
    try {
        const userRef = ref(db2, `users/${userId}`);
        const userSnapshot = await get(userRef);
        
        if (!userSnapshot.exists()) {
            throw new Error("User tidak ditemukan di database.");
        }
        
        const userData = userSnapshot.val();
        const deviceId = userData.assigned_device || userData.device_id;
        
        if (!deviceId) {
            throw new Error("User belum memiliki perangkat Panic Button yang terdaftar.");
        }
        
        return {
            userData: userData,
            deviceId: deviceId
        };
        
    } catch (error) {
        console.error("Error getUserFromDB2:", error);
        throw error;
    }
}


// =====================================================
// AMBIL PERANGKAT IOT DARI DB2
// =====================================================

async function getDeviceFromDB2(deviceId) {
    try {
        const channelsRef = ref(db2, "panicChannels");
        const channelsSnapshot = await get(channelsRef);
        
        if (!channelsSnapshot.exists()) {
            throw new Error("Belum ada perangkat Panic Button IoT di Firebase.");
        }
        
        const channelsData = channelsSnapshot.val();
        let foundDevice = null;
        let foundZone = null;
        let foundKey = null;
        
        Object.entries(channelsData).forEach(([zoneName, zoneData]) => {
            if (!zoneData || typeof zoneData !== "object") return;
            
            Object.entries(zoneData).forEach(([deviceKey, deviceData]) => {
                if (!deviceData || typeof deviceData !== "object") return;
                
                if (deviceData.device === deviceId || deviceKey === deviceId) {
                    foundDevice = deviceData;
                    foundZone = zoneName;
                    foundKey = deviceKey;
                }
            });
        });
        
        if (!foundDevice) {
            throw new Error(`Perangkat Panic Button "${deviceId}" tidak ditemukan di sistem.`);
        }
        
        if (foundDevice.online === false) {
            throw new Error(`Perangkat Panic Button "${deviceId}" sedang offline.`);
        }
        
        if (foundDevice.active === true) {
            throw new Error(`Perangkat Panic Button "${deviceId}" sedang dalam keadaan panic.`);
        }
        
        return {
            device: foundDevice,
            zone: foundZone,
            deviceKey: foundKey,
            deviceId: deviceId
        };
        
    } catch (error) {
        console.error("Error getDeviceFromDB2:", error);
        throw error;
    }
}


// =====================================================
// CEK APAKAH USER PUNYA PERANGKAT (DB2)
// =====================================================

async function checkUserHasDevice(userId) {
    try {
        const userRef = ref(db2, `users/${userId}`);
        const userSnapshot = await get(userRef);
        
        if (!userSnapshot.exists()) {
            return false;
        }
        
        const userData = userSnapshot.val();
        const deviceId = userData.assigned_device || userData.device_id;
        
        return !!deviceId;
    } catch (error) {
        console.error("Error checkUserHasDevice:", error);
        return false;
    }
}


// =====================================================
// CEK APAKAH USER LOGIN
// =====================================================

function isUserLoggedIn() {
    const currentUser = window.currentUser || {};
    const userId = currentUser.id || currentUser.userId || null;
    return !!userId;
}


// =====================================================
// GEOLOCATION USER
// =====================================================

function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Browser tidak mendukung lokasi."));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            resolve,
            error => {
                console.error("Geolocation error:", error);
                reject(new Error("Lokasi tidak dapat diperoleh. Silakan izinkan akses lokasi."));
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        );
    });
}


// =====================================================
// MATIKAN IOT OTOMATIS (DB2)
// =====================================================

async function autoTurnOffDevice(zone, deviceKey, panicId) {
    console.log("=================================");
    console.log("AUTO-OFF TIMER DIMULAI");
    console.log("Device:", deviceKey);
    console.log("Panic ID:", panicId);
    console.log("Durasi: 30 detik");
    console.log("=================================");

    await new Promise(resolve => {
        setTimeout(resolve, PANIC_DURATION);
    });

    try {
        const deviceRef = ref(db2, `panicChannels/${zone}/${deviceKey}`);

        const snapshot = await get(deviceRef);

        if (!snapshot.exists()) {
            console.warn("Device tidak ditemukan saat auto-off:", deviceKey);
            return;
        }

        const deviceData = snapshot.val();

        if (deviceData.assigned_panic_id && deviceData.assigned_panic_id !== panicId) {
            console.warn("Auto-off dibatalkan karena device sudah digunakan oleh panic lain.");
            return;
        }

        await update(deviceRef, {
            active: false,
            assigned_panic_id: "",
            panic_latitude: null,
            panic_longitude: null,
            last_update: Date.now()
        });

        const panicRef = ref(db2, `public_panics/${panicId}`);
        await update(panicRef, {
            status: "completed",
            updated_at: Date.now(),
            device_auto_off: true
        });

        console.log("=================================");
        console.log("IOT OTOMATIS DIMATIKAN");
        console.log("Device:", deviceKey);
        console.log("Panic ID:", panicId);
        console.log("=================================");

    } catch (error) {
        console.error("Gagal melakukan auto-off IoT:", error);
    }
}


// =====================================================
// REVERSE GEOCODING
// =====================================================

async function getAddressFromCoordinates(latitude, longitude) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;

        const response = await fetch(url, {
            headers: {
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Gagal mendapatkan alamat lokasi.");
        }

        const data = await response.json();
        return data.display_name || `${latitude}, ${longitude}`;

    } catch (error) {
        console.warn("Reverse geocoding gagal:", error);
        return `${latitude}, ${longitude}`;
    }
}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =====================================================
// TOMBOL PANIC (HANYA UNTUK USER LOGIN)
// =====================================================

panicButton?.addEventListener("click", async () => {

    // =================================================
    // 1. CEK USER LOGIN
    // =================================================

    const currentUser = window.currentUser || {};
    const userId = currentUser.id || currentUser.userId || null;

    // ❌ Jika user tidak login (guest), tampilkan error
    if (!userId) {
        await Swal.fire({
            title: "Akses Ditolak",
            html: `
                <div class="panic-popup-body">
                    <div class="panic-popup-icon-wrap error">
                        <i class="fa-solid fa-circle-xmark"></i>
                    </div>
                    <p class="panic-popup-desc">
                        Anda harus login terlebih dahulu untuk menggunakan fitur Panic Button.
                    </p>
                    <div class="panic-popup-notice" style="margin-top: 12px;">
                        <i class="fa-solid fa-circle-info"></i>
                        <span>Hanya user yang sudah memiliki perangkat terdaftar yang dapat mengirim sinyal darurat.</span>
                    </div>
                </div>
            `,
            confirmButtonText: '<i class="fa-solid fa-right-to-bracket"></i> Login Sekarang',
            buttonsStyling: false,
            customClass: {
                popup: 'panic-swal-popup',
                title: 'panic-swal-title',
                htmlContainer: 'panic-swal-html',
                confirmButton: 'panic-swal-btn panic-swal-btn-success',
                actions: 'panic-swal-actions'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = '/login';
            }
        });
        return;
    }

    // =================================================
    // 2. CEK APAKAH USER PUNYA PERANGKAT (DB2)
    // =================================================

    const hasDevice = await checkUserHasDevice(userId);
    
    if (!hasDevice) {
        await Swal.fire({
            title: "Belum Punya Perangkat",
            html: `
                <div class="panic-popup-body">
                    <div class="panic-popup-icon-wrap warning">
                        <i class="fa-solid fa-microchip-slash"></i>
                    </div>
                    <p class="panic-popup-desc">
                        Akun Anda belum memiliki perangkat Panic Button yang terdaftar.
                    </p>
                    <div class="panic-popup-notice" style="margin-top: 12px;">
                        <i class="fa-solid fa-circle-info"></i>
                        <span>Silakan hubungi admin untuk mendaftarkan perangkat Panic Button untuk akun Anda.</span>
                    </div>
                </div>
            `,
            confirmButtonText: 'Hubungi Admin',
            buttonsStyling: false,
            customClass: {
                popup: 'panic-swal-popup',
                title: 'panic-swal-title',
                htmlContainer: 'panic-swal-html',
                confirmButton: 'panic-swal-btn panic-swal-btn-cancel',
                actions: 'panic-swal-actions'
            }
        });
        return;
    }

    // =================================================
    // 3. KONFIRMASI AKTIFKAN PANIC
    // =================================================

    const result = await Swal.fire({
        title: "Aktifkan Panic Button?",
        html: `
            <div class="panic-popup-body">
                <div class="panic-popup-icon-wrap warning">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>
                <p class="panic-popup-desc">
                    Laporan darurat akan dikirim seketika. Sistem akan mengaktifkan perangkat Panic Button fisik yang sudah terdaftar untuk akun Anda.
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
        // 4. LOADING
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
                        Mendeteksi lokasi GPS dan menghubungkan perangkat Panic Button Anda...
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

        // =================================================
        // 5. AMBIL LOKASI USER
        // =================================================

        const position = await getCurrentLocation();
        const latitude = Number(position.coords.latitude);
        const longitude = Number(position.coords.longitude);

        console.log("=================================");
        console.log("Lokasi User:", latitude, longitude);
        console.log("=================================");

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            throw new Error("Koordinat lokasi user tidak valid.");
        }

        // =================================================
        // 6. AMBIL DATA USER DARI DB2
        // =================================================

        const userData = await getUserFromDB2(userId);
        const deviceId = userData.deviceId;

        console.log("Device ID user:", deviceId);

        // =================================================
        // 7. AMBIL PERANGKAT IOT DARI DB2
        // =================================================

        const userDevice = await getDeviceFromDB2(deviceId);

        console.log("Device user:", userDevice);

        // =================================================
        // 8. BUAT DATA PANIC
        // =================================================

        const createdAt = Date.now();
        const address = await getAddressFromCoordinates(latitude, longitude);
        const locationUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

        const panicData = {
            user_id: userId,
            username: currentUser.username || userData.userData.username || "",
            name: currentUser.name || userData.userData.name || "",
            phone: currentUser.phone || userData.userData.phone || "",
            email: currentUser.email || userData.userData.email || "",
            is_guest: false,
            latitude: latitude,
            longitude: longitude,
            address: address,
            location_url: locationUrl,
            status: "active",
            assigned_device: userDevice.device.device,
            assigned_zone: userDevice.zone,
            assigned_location: userDevice.device.lokasi || "-",
            device_id: userDevice.deviceId,
            created_at: createdAt,
            updated_at: createdAt
        };

        // =================================================
        // 9. SIMPAN public_panics (DB2)
        // =================================================

        const reportsRef = ref(db2, "public_panics");
        const newReport = await push(reportsRef, panicData);
        const panicId = newReport.key;

        console.log("PANIC ID:", panicId);

        // =================================================
        // 10. AKTIFKAN IOT (DB2)
        // =================================================

        const deviceRef = ref(db2, `panicChannels/${userDevice.zone}/${userDevice.deviceKey}`);

        await update(deviceRef, {
            active: true,
            assigned_panic_id: panicId,
            panic_latitude: latitude,
            panic_longitude: longitude,
            last_update: Date.now()
        });

        // MULAI AUTO-OFF 30 DETIK
        autoTurnOffDevice(
            userDevice.zone,
            userDevice.deviceKey,
            panicId
        );

        console.log("IOT BERHASIL DIAKTIFKAN:", userDevice.device.device);

        // =================================================
        // 11. UPDATE public_panics (DB2)
        // =================================================

        await update(ref(db2, `public_panics/${panicId}`), {
            updated_at: Date.now()
        });

        // =================================================
        // 12. NOTIFIKASI BERHASIL
        // =================================================

        await Swal.fire({
            title: "Panic Button Aktif!",
            html: `
                <div class="panic-popup-body">
                    <div class="panic-popup-icon-wrap success">
                        <i class="fa-solid fa-circle-check"></i>
                    </div>
                    <p class="panic-popup-desc">
                        Laporan darurat berhasil dikirim dan perangkat Panic Button fisik Anda telah diaktifkan.
                    </p>
                    <div class="panic-popup-device-card">
                        <div class="device-card-row">
                            <span class="device-card-label"><i class="fa-solid fa-microchip"></i> Perangkat</span>
                            <strong class="device-card-value">${escapeHtml(userDevice.device.device)}</strong>
                        </div>
                        <div class="device-card-row">
                            <span class="device-card-label"><i class="fa-solid fa-location-dot"></i> Lokasi Perangkat</span>
                            <strong class="device-card-value">${escapeHtml(userDevice.device.lokasi || "-")}</strong>
                        </div>
                        <div class="device-card-row">
                            <span class="device-card-label"><i class="fa-solid fa-location-crosshairs"></i> Lokasi Anda</span>
                            <strong class="device-card-value">${escapeHtml(address)}</strong>
                        </div>
                    </div>
                    <div class="panic-popup-notice" style="margin-top: 12px; background: var(--dash-success-bg); border-color: var(--dash-success-border); color: var(--dash-success);">
                        <i class="fa-solid fa-clock"></i>
                        <span>Sirine akan mati otomatis setelah 30 detik.</span>
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
        // 13. NOTIFIKASI ERROR
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
                    ${error.message && (error.message.includes('perangkat') || error.message.includes('device')) ? `
                        <div class="panic-popup-notice" style="margin-top: 12px; background: var(--dash-warning-bg); border-color: var(--dash-warning-border); color: var(--dash-warning);">
                            <i class="fa-solid fa-circle-info"></i>
                            <span>Silakan hubungi admin untuk mendaftarkan perangkat Panic Button untuk akun Anda.</span>
                        </div>
                    ` : ''}
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

});