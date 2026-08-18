import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm";

import { db2 } from "../firebase-config.js";

import {
    ref,
    push
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";


const panicButton = document.getElementById("panicButton");


// =====================================================
// TOMBOL PANIC
// =====================================================

panicButton?.addEventListener("click", async () => {

    const result = await Swal.fire({
        icon: "warning",
        title: "Aktifkan Panic Button?",
        text: "Laporan darurat akan dikirim ke sistem keamanan.",
        showCancelButton: true,
        confirmButtonText: "Ya, Aktifkan",
        cancelButtonText: "Batal",
        reverseButtons: true
    });

    if (!result.isConfirmed) {
        return;
    }


    panicButton.disabled = true;


    try {

        // ==============================================
        // AMBIL LOKASI
        // ==============================================

        const position = await getCurrentLocation();

        const latitude =
            position.coords.latitude;

        const longitude =
            position.coords.longitude;


        // ==============================================
        // DATA USER
        // ==============================================

        const currentUser =
            window.currentUser || {};


        // ==============================================
        // DATA PANIC
        // ==============================================

     const panicData = {
    user_id: currentUser.id || "guest",

    username: currentUser.username || "",

    name: currentUser.name || "",

    phone: currentUser.phone || "",

    email: currentUser.email || "",

    is_guest: !currentUser.id,

    latitude: latitude,

    longitude: longitude,

    address: `${latitude}, ${longitude}`,

    status: "active",

    created_at: Date.now(),

    updated_at: Date.now()
};


        console.log(
            "Data panic:",
            panicData
        );


        // ==============================================
        // SIMPAN FIREBASE
        // ==============================================

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


        console.log(
            "Panic berhasil dikirim:",
            newReport.key
        );


        await Swal.fire({
            icon: "success",
            title: "Panic Button Aktif",
            text: "Laporan darurat berhasil dikirim.",
            confirmButtonText: "OK"
        });


        // arahkan ke bagian kejadian
        document
            .getElementById("kejadian")
            ?.scrollIntoView({
                behavior: "smooth"
            });


    } catch (error) {

        console.error(
            "Gagal mengirim Panic Button:",
            error
        );


        Swal.fire({
            icon: "error",
            title: "Gagal",
            text:
                error.message ||
                "Laporan Panic Button gagal dikirim."
        });

    } finally {

        panicButton.disabled = false;

    }

});


// =====================================================
// GEOLOCATION
// =====================================================

function getCurrentLocation() {

    return new Promise((resolve, reject) => {

        if (!navigator.geolocation) {

            reject(
                new Error(
                    "Browser tidak mendukung lokasi."
                )
            );

            return;
        }


        navigator.geolocation.getCurrentPosition(

            resolve,

            () => {

                reject(
                    new Error(
                        "Lokasi tidak dapat diperoleh. Silakan izinkan akses lokasi."
                    )
                );

            },

            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }

        );

    });

}