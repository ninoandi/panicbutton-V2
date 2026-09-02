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
// DURASI PANIC
// =====================================================

const PANIC_DURATION = 15 * 1000;


// =====================================================
// STATUS LAPORAN
// =====================================================

const STATUS = {

    ACTIVE: "active",
    MENUNGGU: "menunggu",
    DIPROSES: "diproses",
    SELESAI: "completed"

};


// =====================================================
// NORMALISASI STATUS
// =====================================================

function normalizeStatus(status = "") {

    const value =
        String(status)
            .toLowerCase()
            .trim();

    const statusMap = {
        'active': STATUS.ACTIVE,
        'menunggu': STATUS.MENUNGGU,
        'waiting': STATUS.MENUNGGU,
        'pending': STATUS.MENUNGGU,
        'diproses': STATUS.DIPROSES,
        'proses': STATUS.DIPROSES,
        'processing': STATUS.DIPROSES,
        'process': STATUS.DIPROSES,
        'selesai': STATUS.SELESAI,
        'completed': STATUS.SELESAI,
        'complete': STATUS.SELESAI,
        'done': STATUS.SELESAI
    };

    return statusMap[value] || value;

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
// GET USER ID DENGAN BENAR
// =====================================================

function getValidUserId() {

    const currentUser = window.currentUser || {};

    console.log("🔍 Current User:", currentUser);

    let userId = null;

    if (currentUser.id && currentUser.id !== "" && currentUser.id !== "null") {
        userId = String(currentUser.id);
    } else if (currentUser.userId && currentUser.userId !== "" && currentUser.userId !== "null") {
        userId = String(currentUser.userId);
    } else if (currentUser.uid && currentUser.uid !== "" && currentUser.uid !== "null") {
        userId = String(currentUser.uid);
    } else if (currentUser.user && currentUser.user.id) {
        userId = String(currentUser.user.id);
    }

    console.log("✅ User ID ditemukan:", userId);

    return userId;

}


// =====================================================
// AMBIL DATA USER DARI FIREBASE
// =====================================================

async function getUserFromDB2(userId) {

    try {

        const userRef =
            ref(db2, `users/${userId}`);

        const userSnapshot =
            await get(userRef);


        if (!userSnapshot.exists()) {

            throw new Error(
                "User tidak ditemukan di database."
            );

        }


        const userData =
            userSnapshot.val();


        const deviceId =
            userData.assigned_device ||
            userData.device_id ||
            userData.deviceId;


        if (!deviceId) {

            throw new Error(
                "User belum memiliki perangkat Panic Button yang terdaftar."
            );

        }


        return {

            userData,

            deviceId

        };

    } catch (error) {

        console.error(
            "Error getUserFromDB2:",
            error
        );

        throw error;

    }

}


// =====================================================
// CEK USER MEMILIKI PERANGKAT
// =====================================================

async function checkUserHasDevice(userId) {

    try {

        const userRef =
            ref(db2, `users/${userId}`);

        const userSnapshot =
            await get(userRef);


        if (!userSnapshot.exists()) {

            console.log("❌ User tidak ditemukan di database");
            return false;

        }


        const userData =
            userSnapshot.val();


        const deviceId =
            userData.assigned_device ||
            userData.device_id ||
            userData.deviceId;

        console.log("🔍 Device ID dari user:", deviceId);

        if (!deviceId || deviceId === "" || deviceId === "null") {
            console.log("❌ User tidak memiliki device ID");
            return false;
        }

        try {
            
            const deviceInfo = await getDeviceFromDB2(deviceId);
            
            if (deviceInfo && deviceInfo.device) {
                console.log("✅ Device ditemukan dan valid:", deviceId);
                return true;
            }
            
        } catch (deviceError) {
            
            console.log("❌ Device tidak valid:", deviceError.message);
            return false;
            
        }

        return true;

    } catch (error) {

        console.error(
            "Error checkUserHasDevice:",
            error
        );

        return false;

    }

}


// =====================================================
// AMBIL LOKASI USER
// =====================================================

function getCurrentLocation() {

    return new Promise(
        (resolve, reject) => {

            if (!navigator.geolocation) {

                reject(
                    new Error(
                        "Browser tidak mendukung fitur lokasi."
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
// REVERSE GEOCODING
// =====================================================

async function getAddressFromCoordinates(
    latitude,
    longitude
) {

    try {

        const url =
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;


        const response =
            await fetch(
                url,
                {

                    headers: {

                        Accept:
                            "application/json"

                    }

                }
            );


        if (!response.ok) {

            throw new Error(
                "Gagal mendapatkan alamat lokasi."
            );

        }


        const data =
            await response.json();


        return (
            data.display_name ||
            `${latitude}, ${longitude}`
        );

    } catch (error) {

        console.warn(
            "Reverse geocoding gagal:",
            error
        );


        return `${latitude}, ${longitude}`;

    }

}


async function resetStalePanicDevice(deviceRef, deviceData, deviceId) {
    const panicId = deviceData.assigned_panic_id;

    if (!panicId) {
        console.warn("Device active tetapi tidak memiliki panic ID.");
        await update(deviceRef, {
            active: false,
            assigned_panic_id: "",
            panic_latitude: null,
            panic_longitude: null,
            last_update: Date.now()
        });
        return true;
    }

    const panicRef = ref(db2, `public_panics/${panicId}`);
    const panicSnapshot = await get(panicRef);

    if (!panicSnapshot.exists()) {
        console.warn("Data panic tidak ditemukan. Reset device.");
        await update(deviceRef, {
            active: false,
            assigned_panic_id: "",
            panic_latitude: null,
            panic_longitude: null,
            last_update: Date.now()
        });
        return true;
    }

    const panicData = panicSnapshot.val();
    const panicStatus = normalizeStatus(panicData.status);
    const createdAt = Number(panicData.created_at || 0);
    const now = Date.now();
    const elapsed = now - createdAt;

    // =============================================
    // 🔥 CEK: Apakah sudah diproses petugas?
    // =============================================
    if (panicData.officer_processed === true) {
        console.log(`🛑 Reset dibatalkan! Laporan sudah diproses petugas.`);
        // Matikan device saja
        await update(deviceRef, {
            active: false,
            assigned_panic_id: "",
            panic_latitude: null,
            panic_longitude: null,
            last_update: Date.now()
        });
        return true;
    }

    // =============================================
    // 🔥 CEK: Jika status sudah selesai, reset device
    // =============================================
    const finishedStatuses = [STATUS.MENUNGGU, STATUS.DIPROSES, STATUS.SELESAI];
    if (finishedStatuses.includes(panicStatus)) {
        console.warn(`Panic lama berstatus "${panicStatus}". Reset device.`);
        await update(deviceRef, {
            active: false,
            assigned_panic_id: "",
            panic_latitude: null,
            panic_longitude: null,
            last_update: Date.now()
        });
        return true;
    }

    // =============================================
    // 🔥 CEK: Jika panic sudah lebih dari 15 detik
    // =============================================
    if (createdAt > 0 && elapsed >= PANIC_DURATION) {
        console.warn(`Panic lama melebihi ${PANIC_DURATION/1000} detik. Reset device.`);

        // =============================================
        // 🔥 MATIKAN DEVICE (BUZZER OFF)
        // =============================================
        await update(deviceRef, {
            active: false,
            assigned_panic_id: "",
            panic_latitude: null,
            panic_longitude: null,
            last_update: now
        });

        // =============================================
        // 🔥 JANGAN UBAH STATUS LAPORAN!
        // =============================================
        await update(panicRef, {
            device_auto_off: true,
            device_off_at: now
            // ⚠️ STATUS TIDAK DIUBAH!
        });

        console.log("✅ Device dimatikan (expired), status laporan TETAP:", panicStatus);

        return true;
    }

    return false;
}

// =====================================================
// AMBIL DEVICE DARI FIREBASE
// =====================================================

async function getDeviceFromDB2(deviceId) {

    try {

        const channelsRef =
            ref(
                db2,
                "panicChannels"
            );


        const channelsSnapshot =
            await get(channelsRef);


        if (!channelsSnapshot.exists()) {

            throw new Error(
                "Belum ada perangkat Panic Button IoT di Firebase."
            );

        }


        const channelsData =
            channelsSnapshot.val();


        let foundDevice =
            null;

        let foundZone =
            null;

        let foundKey =
            null;


        Object.entries(
            channelsData
        ).forEach(
            ([zoneName, zoneData]) => {

                if (
                    !zoneData ||
                    typeof zoneData !== "object"
                ) {

                    return;

                }


                Object.entries(
                    zoneData
                ).forEach(
                    ([deviceKey, deviceData]) => {

                        if (
                            !deviceData ||
                            typeof deviceData !== "object"
                        ) {

                            return;

                        }


                        if (
                            deviceData.device === deviceId ||
                            deviceKey === deviceId
                        ) {

                            foundDevice =
                                deviceData;

                            foundZone =
                                zoneName;

                            foundKey =
                                deviceKey;

                        }

                    }
                );

            }
        );


        if (!foundDevice) {

            throw new Error(
                `Perangkat Panic Button "${deviceId}" tidak ditemukan di sistem.`
            );

        }


        if (
            foundDevice.online === false
        ) {

            throw new Error(
                `Perangkat Panic Button "${deviceId}" sedang offline.`
            );

        }


        if (
            foundDevice.active === true
        ) {

            console.warn(
                "Device masih active. Memeriksa panic lama..."
            );


            const deviceRef =
                ref(
                    db2,
                    `panicChannels/${foundZone}/${foundKey}`
                );


            const wasReset =
                await resetStalePanicDevice(
                    deviceRef,
                    foundDevice,
                    deviceId
                );


            if (wasReset) {

                foundDevice.active =
                    false;

                foundDevice.assigned_panic_id =
                    "";

            } else {

                throw new Error(
                    `Perangkat Panic Button "${deviceId}" sedang dalam keadaan panic. Tunggu hingga panic sebelumnya selesai.`
                );

            }

        }


        return {

            device:
                foundDevice,

            zone:
                foundZone,

            deviceKey:
                foundKey,

            deviceId:
                deviceId

        };

    } catch (error) {

        console.error(
            "Error getDeviceFromDB2:",
            error
        );

        throw error;

    }

}


// =====================================================
// 🔥 AUTO TURN OFF DEVICE - HANYA MATIKAN DEVICE
// =====================================================

async function autoTurnOffDevice(zone, deviceKey, panicId) {
    console.log("=================================");
    console.log("⏱️ AUTO-OFF TIMER DIMULAI");
    console.log("Device:", deviceKey);
    console.log("Panic ID:", panicId);
    console.log("Durasi: 15 DETIK");
    console.log("=================================");

    // =============================================
    // 🔥 TUNGGU 15 DETIK
    // =============================================
    await new Promise(resolve => setTimeout(resolve, PANIC_DURATION));

    console.log("⏱️ 15 detik telah berlalu, mematikan IoT...");

    try {
        const deviceRef = ref(db2, `panicChannels/${zone}/${deviceKey}`);
        const deviceSnapshot = await get(deviceRef);

        if (!deviceSnapshot.exists()) {
            console.warn("⚠️ Device tidak ditemukan saat auto-off.");
            return;
        }

        const deviceData = deviceSnapshot.val();

        // 🔥 CEK: Jika device sudah tidak aktif, skip
        if (deviceData.active !== true) {
            console.log("ℹ️ Device sudah mati, skip auto-off");
            return;
        }

        // 🔥 CEK: Jika device sudah digunakan panic lain, jangan reset
        if (deviceData.assigned_panic_id && deviceData.assigned_panic_id !== panicId) {
            console.warn("⏭️ Auto-off dibatalkan karena device sudah digunakan panic lain.");
            return;
        }

        // =============================================
        // 🔥 MATIKAN DEVICE (BUZZER OFF)
        // =============================================
        await update(deviceRef, {
            active: false,
            assigned_panic_id: "",
            panic_latitude: null,
            panic_longitude: null,
            last_update: Date.now()
        });

        console.log("✅ BUZZER DIMATIKAN (15 detik)");

        // =============================================
        // 🔥 CATAT DI LAPORAN BAHWA DEVICE SUDAH OFF
        // =============================================
        const panicRef = ref(db2, `public_panics/${panicId}`);
        const panicSnapshot = await get(panicRef);

        if (panicSnapshot.exists()) {
            await update(panicRef, {
                device_auto_off: true,
                device_off_at: Date.now()
                // ⚠️ STATUS LAPORAN TIDAK DIUBAH!
            });
            console.log("📝 Dicatat: device auto-off selesai, status laporan TETAP:", panicSnapshot.val().status);
        }

        console.log("=================================");
        console.log("✅ AUTO-OFF SELESAI (BUZZER MATI, STATUS TETAP)");
        console.log("=================================");

    } catch (error) {
        console.error("❌ Gagal melakukan auto-off:", error);
    }
}


// =====================================================
// CUSTOM SWEETALERT CLASS
// =====================================================

function panicSwalClass(type = "default") {

    const classes = {

        popup:
            "panic-swal-popup",

        title:
            "panic-swal-title",

        htmlContainer:
            "panic-swal-html",

        actions:
            "panic-swal-actions"

    };


    if (type === "danger") {

        classes.confirmButton =
            "panic-swal-btn panic-swal-btn-danger";

        classes.cancelButton =
            "panic-swal-btn panic-swal-btn-cancel";

    }


    if (type === "success") {

        classes.confirmButton =
            "panic-swal-btn panic-swal-btn-success";

    }


    if (type === "default") {

        classes.confirmButton =
            "panic-swal-btn panic-swal-btn-cancel";

    }


    return classes;

}


// =====================================================
// 🔥 TOMBOL PANIC
// =====================================================

panicButton?.addEventListener(
    "click",
    async () => {

        console.log("=================================");
        console.log("🔴 PANIC BUTTON DIKLIK");
        console.log("=================================");

        // =================================================
        // 1. CEK USER LOGIN
        // =================================================

        const userId = getValidUserId();

        console.log("🔍 User ID:", userId);

        if (!userId || userId === "null" || userId === "undefined") {

            console.log("❌ User belum login");

            const loginResult =
                await Swal.fire({

                    title:
                        "Akses Ditolak",

                    html: `

                        <div class="panic-popup-body">

                            <div class="panic-popup-icon-wrap error">

                                <i class="fa-solid fa-circle-xmark"></i>

                            </div>


                            <p class="panic-popup-desc">

                                Anda harus login terlebih dahulu
                                untuk menggunakan fitur Panic Button.

                            </p>


                            <div class="panic-popup-notice">

                                <i class="fa-solid fa-circle-info"></i>

                                <span>

                                    Hanya pengguna yang sudah memiliki
                                    perangkat terdaftar yang dapat
                                    mengirim sinyal darurat.

                                </span>

                            </div>

                        </div>

                    `,

                    confirmButtonText:
                        '<i class="fa-solid fa-right-to-bracket"></i> Login Sekarang',

                    buttonsStyling:
                        false,

                    customClass:
                        panicSwalClass("success")

                });


            if (loginResult.isConfirmed) {

                window.location.href =
                    "/login";

            }


            return;

        }


        // =================================================
        // 2. CEK PERANGKAT USER
        // =================================================

        console.log("🔍 Mengecek perangkat user:", userId);

        const hasDevice =
            await checkUserHasDevice(
                userId
            );

        console.log("🔍 Hasil check device:", hasDevice);


        if (!hasDevice) {

            await Swal.fire({

                title:
                    "Belum Punya Perangkat",

                html: `

                    <div class="panic-popup-body">

                        <div class="panic-popup-icon-wrap warning">

                            <i class="fa-solid fa-microchip"></i>

                        </div>


                        <p class="panic-popup-desc">

                            Akun Anda belum memiliki perangkat
                            Panic Button yang terdaftar.

                        </p>


                        <div class="panic-popup-notice">

                            <i class="fa-solid fa-circle-info"></i>

                            <span>

                                Silakan hubungi administrator untuk
                                mendaftarkan perangkat Panic Button.

                            </span>

                        </div>

                    </div>

                `,

                confirmButtonText:
                    "Mengerti",

                buttonsStyling:
                    false,

                customClass:
                    panicSwalClass()

            });


            return;

        }


        // =================================================
        // 3. KONFIRMASI PANIC
        // =================================================

        const result =
            await Swal.fire({

                title:
                    "Aktifkan Panic Button?",

                html: `

                    <div class="panic-popup-body">

                        <div class="panic-popup-icon-wrap warning">

                            <i class="fa-solid fa-triangle-exclamation"></i>

                        </div>


                        <p class="panic-popup-desc">

                            Laporan darurat akan dikirim ke sistem
                            dan perangkat Panic Button akan
                            diaktifkan.

                        </p>


                        <div class="panic-popup-notice">

                            <i class="fa-solid fa-location-crosshairs"></i>

                            <span>

                                Pastikan akses lokasi GPS telah
                                diizinkan pada perangkat Anda.

                            </span>

                        </div>

                    </div>

                `,

                showCancelButton:
                    true,

                confirmButtonText:
                    "Ya, Aktifkan",

                cancelButtonText:
                    "Batal",

                reverseButtons:
                    true,

                buttonsStyling:
                    false,

                customClass:
                    panicSwalClass("danger")

            });


        if (!result.isConfirmed) {

            return;

        }


        // =================================================
        // NONAKTIFKAN BUTTON SELAMA PROSES
        // =================================================

        panicButton.disabled =
            true;


        try {

            // =============================================
            // 4. LOADING
            // =============================================

            Swal.fire({

                title:
                    "Menghubungkan Sistem...",

                html: `

                    <div class="panic-popup-body">

                        <div class="panic-popup-loader">

                            <div class="panic-loader-radar"></div>

                            <i class="fa-solid fa-satellite-dish"></i>

                        </div>


                        <p class="panic-popup-desc">

                            Mendeteksi lokasi GPS dan menghubungkan
                            perangkat Panic Button Anda...

                        </p>

                    </div>

                `,

                allowOutsideClick:
                    false,

                allowEscapeKey:
                    false,

                showConfirmButton:
                    false,

                buttonsStyling:
                    false,

                customClass: {

                    popup:
                        "panic-swal-popup panic-swal-loading",

                    title:
                        "panic-swal-title",

                    htmlContainer:
                        "panic-swal-html"

                }

            });


            // =============================================
            // 5. AMBIL LOKASI
            // =============================================

            const position =
                await getCurrentLocation();


            const latitude =
                Number(
                    position.coords.latitude
                );


            const longitude =
                Number(
                    position.coords.longitude
                );


            if (
                !Number.isFinite(latitude) ||
                !Number.isFinite(longitude)
            ) {

                throw new Error(
                    "Koordinat lokasi user tidak valid."
                );

            }


            // =============================================
            // 6. AMBIL USER
            // =============================================

            const userData =
                await getUserFromDB2(
                    userId
                );


            const deviceId =
                userData.deviceId;


            // =============================================
            // 7. AMBIL DEVICE
            // =============================================

            const userDevice =
                await getDeviceFromDB2(
                    deviceId
                );


            // =============================================
            // 8. BUAT LAPORAN PANIC
            // =============================================

            const createdAt =
                Date.now();


            const address =
                await getAddressFromCoordinates(
                    latitude,
                    longitude
                );


            const locationUrl =
                `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;


            const panicData = {

                user_id:
                    userId,

                username:
                    currentUser?.username ||
                    userData.userData.username ||
                    "",

                name:
                    currentUser?.name ||
                    userData.userData.name ||
                    "",

                phone:
                    currentUser?.phone ||
                    userData.userData.phone ||
                    "",

                email:
                    currentUser?.email ||
                    userData.userData.email ||
                    "",

                is_guest:
                    false,

                latitude,

                longitude,

                address,

                location_url:
                    locationUrl,

                status:
                    "active",

                assigned_device:
                    userDevice.device.device,

                assigned_zone:
                    userDevice.zone,

                assigned_location:
                    userDevice.device.lokasi ||
                    "-",

                device_id:
                    userDevice.deviceId,

                created_at:
                    createdAt,

                updated_at:
                    createdAt,

                device_auto_off:
                    false,

                officer_processed:
                    false

            };


            // =============================================
            // 9. SIMPAN LAPORAN KE PUBLIC_PANICS
            // =============================================

            const reportsRef =
                ref(
                    db2,
                    "public_panics"
                );


            const newReport =
                await push(
                    reportsRef,
                    panicData
                );


            const panicId =
                newReport.key;


            console.log(
                "✅ PANIC ID:",
                panicId
            );


            // =============================================
            // 10. AKTIFKAN DEVICE
            // =============================================

            const deviceRef =
                ref(
                    db2,
                    `panicChannels/${userDevice.zone}/${userDevice.deviceKey}`
                );


            await update(
                deviceRef,
                {

                    active:
                        true,

                    assigned_panic_id:
                        panicId,

                    panic_latitude:
                        latitude,

                    panic_longitude:
                        longitude,

                    last_update:
                        Date.now()

                }
            );


            console.log(
                "✅ IOT BERHASIL DIAKTIFKAN:",
                userDevice.device.device
            );


            // =============================================
            // 11. MULAI AUTO OFF 30 DETIK
            // =============================================

            autoTurnOffDevice(
                userDevice.zone,
                userDevice.deviceKey,
                panicId
            ).catch(error => {
                console.error("❌ Auto-off gagal:", error);
            });

            console.log("✅ Auto-off timer dimulai untuk device:", userDevice.device.device);


            // =============================================
            // 12. NOTIFIKASI BERHASIL (DIPERBAIKI)
            // =============================================

            await Swal.fire({

                title:
                    "Panic Button Aktif!",

                html: `

                    <div class="panic-popup-body">

                        <div class="panic-popup-icon-wrap success">

                            <i class="fa-solid fa-circle-check"></i>

                        </div>

                        <p class="panic-popup-desc">

                            Laporan darurat berhasil dikirim
                            dan perangkat Panic Button telah
                            diaktifkan.

                        </p>

                        <div class="panic-popup-device-card">

                            <div class="device-card-row">

                                <span class="device-card-label">

                                    <i class="fa-solid fa-microchip"></i>

                                    Perangkat

                                </span>

                                <strong class="device-card-value">

                                    ${escapeHtml(
                                        userDevice.device.device || "-"
                                    )}

                                </strong>

                            </div>

                            <div class="device-card-row">

                                <span class="device-card-label">

                                    <i class="fa-solid fa-location-dot"></i>

                                    Lokasi Perangkat

                                </span>

                                <strong class="device-card-value">

                                    ${escapeHtml(
                                        userDevice.device.lokasi || "-"
                                    )}

                                </strong>

                            </div>

                            <div class="device-card-row">

                                <span class="device-card-label">

                                    <i class="fa-solid fa-clock"></i>

                                    Durasi Panic

                                </span>

                                <strong class="device-card-value">

                                    30 Detik

                                </strong>

                            </div>

                        </div>

                        <!-- 🔥 NOTIFIKASI YANG BENAR -->
                        <div class="panic-popup-notice" style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 8px; margin-top: 16px;">

                            <div style="display: flex; align-items: flex-start; gap: 10px;">

                                <i class="fa-solid fa-circle-info" style="color: #d97706; font-size: 18px; margin-top: 2px;"></i>

                                <div>

                                    <strong style="color: #92400e; display: block; margin-bottom: 4px;">Informasi Penting:</strong>

                                    <span style="color: #78350f; font-size: 14px; line-height: 1.5;">

                                        Perangkat akan <strong>otomatis mati</strong> setelah 30 detik.
                                        <br>
                                        Status laporan akan diubah oleh <strong>petugas</strong> yang bertugas
                                        (Menunggu → Diproses → Selesai).

                                    </span>

                                </div>

                            </div>

                        </div>

                    </div>

                `,

                confirmButtonText:
                    '<i class="fa-solid fa-check"></i> Mengerti',

                buttonsStyling:
                    false,

                customClass:
                    panicSwalClass("success")

            });


            // =============================================
            // SCROLL KE KEJADIAN
            // =============================================

            document
                .getElementById("kejadian")
                ?.scrollIntoView({

                    behavior:
                        "smooth"

                });


        } catch (error) {

            console.error(
                "❌ PANIC BUTTON ERROR:",
                error
            );


            Swal.close();


            await Swal.fire({

                title:
                    "Gagal Mengirim Laporan",

                html: `

                    <div class="panic-popup-body">

                        <div class="panic-popup-icon-wrap error">

                            <i class="fa-solid fa-circle-xmark"></i>

                        </div>

                        <p class="panic-popup-desc">

                            ${escapeHtml(
                                error.message ||
                                "Laporan Panic Button gagal diproses."
                            )}

                        </p>

                        <div class="panic-popup-notice">

                            <i class="fa-solid fa-circle-info"></i>

                            <span>

                                Pastikan lokasi aktif,
                                koneksi internet tersedia,
                                dan perangkat Panic Button
                                dalam keadaan online.

                            </span>

                        </div>

                    </div>

                `,

                confirmButtonText:
                    "Tutup",

                buttonsStyling:
                    false,

                customClass:
                    panicSwalClass()

            });


        } finally {

            panicButton.disabled =
                false;

        }

    }
);