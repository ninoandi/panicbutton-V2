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
// TOMBOL PANIC
// =====================================================

panicButton?.addEventListener(
    "click",
    async () => {


        // =================================================
        // KONFIRMASI
        // =================================================

        const result =
            await Swal.fire({

                icon:
                    "warning",

                title:
                    "Aktifkan Panic Button?",

                text:
                    "Laporan darurat akan dikirim dan perangkat IoT terdekat akan diaktifkan.",

                showCancelButton:
                    true,

                confirmButtonText:
                    "Ya, Aktifkan",

                cancelButtonText:
                    "Batal",

                reverseButtons:
                    true

            });


        if (
            !result.isConfirmed
        ) {

            return;

        }


        // =================================================
        // DISABLE BUTTON
        // =================================================

        panicButton.disabled =
            true;


        try {


            // =================================================
            // 1. AMBIL LOKASI USER
            // =================================================

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


            console.log(
                "================================="
            );

            console.log(
                "Lokasi User:",
                latitude,
                longitude
            );

            console.log(
                "================================="
            );


            // =================================================
            // VALIDASI LOKASI USER
            // =================================================

            if (
                !Number.isFinite(latitude) ||
                !Number.isFinite(longitude)
            ) {

                throw new Error(
                    "Koordinat lokasi user tidak valid."
                );

            }


            // =================================================
            // 2. AMBIL DATA USER
            // =================================================

            const currentUser =
                window.currentUser || {};


            console.log(
                "Current User:",
                currentUser
            );


            // =================================================
            // 3. CARI IOT TERDEKAT
            // =================================================
            // Kita cari DEVICE TERLEBIH DAHULU.
            //
            // Tujuannya:
            // jangan membuat public_panics jika ternyata
            // tidak ada IoT yang bisa menerima laporan.
            // =================================================
                Swal.fire({

                    title: "Mencari perangkat terdekat...",

                    text: "Sistem sedang mencari Panic Button IoT terdekat.",

                    allowOutsideClick: false,

                    allowEscapeKey: false,

                    didOpen: () => {

                        Swal.showLoading();

                    }

                });

            const nearestDevice =
                await findNearestDevice(
                    latitude,
                    longitude
                );


            console.log(
                "Device terpilih:",
                nearestDevice
            );


            // =================================================
            // 4. BUAT DATA PANIC
            // =================================================

            const panicData = {

                user_id:
                    currentUser.id ||
                    "guest",

                username:
                    currentUser.username ||
                    "",

                name:
                    currentUser.name ||
                    "",

                phone:
                    currentUser.phone ||
                    "",

                email:
                    currentUser.email ||
                    "",

                is_guest:
                    !currentUser.id,

                latitude:
                    latitude,

                longitude:
                    longitude,

                address:
                    `${latitude}, ${longitude}`,

                status:
                    "active",

                assigned_device:
                    nearestDevice.device,

                assigned_zone:
                    nearestDevice.zone,

                assigned_location:
                    nearestDevice.lokasi,

                device_distance:
                    Math.round(
                        nearestDevice.distance
                    ),

                created_at:
                    Date.now(),

                updated_at:
                    Date.now()

            };


            console.log(
                "Data Panic:",
                panicData
            );


            // =================================================
            // 5. SIMPAN public_panics
            // =================================================

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
                "================================="
            );

            console.log(
                "PANIC ID:",
                panicId
            );

            console.log(
                "================================="
            );


            // =================================================
            // 6. PATH IOT TERPILIH
            // =================================================

            const deviceRef =
                ref(
                    db2,
                    `panicChannels/${nearestDevice.zone}/${nearestDevice.deviceKey}`
                );


            // =================================================
            // 7. AKTIFKAN IOT
            // =================================================

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
                "================================="
            );

            console.log(
                "IOT BERHASIL DIAKTIFKAN"
            );

            console.log(
                "================================="
            );

            console.log(
                "Device:",
                nearestDevice.device
            );

            console.log(
                "Zona:",
                nearestDevice.zone
            );

            console.log(
                "Lokasi:",
                nearestDevice.lokasi
            );

            console.log(
                "Jarak:",
                Math.round(
                    nearestDevice.distance
                ),
                "meter"
            );


            // =================================================
            // 8. UPDATE public_panics
            // =================================================

            await update(
                ref(
                    db2,
                    `public_panics/${panicId}`
                ),
                {

                    assigned_device:
                        nearestDevice.device,

                    assigned_zone:
                        nearestDevice.zone,

                    assigned_location:
                        nearestDevice.lokasi,

                    device_distance:
                        Math.round(
                            nearestDevice.distance
                        ),

                    updated_at:
                        Date.now()

                }
            );


            // =================================================
            // 9. NOTIFIKASI BERHASIL
            // =================================================

            await Swal.fire({

                icon:
                    "success",

                title:
                    "Panic Button Aktif",

                html:
                    `
                    <p>
                        Laporan darurat berhasil dikirim.
                    </p>

                    <p>
                        <strong>
                            Perangkat terdekat:
                        </strong>
                        <br>
                        ${nearestDevice.device}
                    </p>

                    <p>
                        <strong>
                            Lokasi perangkat:
                        </strong>
                        <br>
                        ${nearestDevice.lokasi}
                    </p>

                    <p>
                        <strong>
                            Jarak:
                        </strong>
                        ${Math.round(
                            nearestDevice.distance
                        )}
                        meter
                    </p>
                    `,

                confirmButtonText:
                    "OK"

            });


            // =================================================
            // 10. SCROLL KE KEJADIAN
            // =================================================

            document
                .getElementById(
                    "kejadian"
                )
                ?.scrollIntoView({

                    behavior:
                        "smooth"

                });


        }

        catch (error) {


            // =================================================
            // ERROR
            // =================================================

            console.error(
                "================================="
            );

            console.error(
                "PANIC BUTTON ERROR"
            );

            console.error(
                error
            );

            console.error(
                "================================="
            );


            await Swal.fire({

                icon:
                    "error",

                title:
                    "Panic Button Gagal",

                text:
                    error.message ||
                    "Laporan Panic Button gagal dikirim."

            });

        }

        finally {


            // =================================================
            // ENABLE BUTTON KEMBALI
            // =================================================

            panicButton.disabled =
                false;

        }

    }
);