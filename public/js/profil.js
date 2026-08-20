/* =========================================================
   PROFIL ADMIN - CONTROLLER JAVASCRIPT
   Firebase Realtime Database + Cropper.js + Flatpickr
========================================================= */

import { db2 } from "./firebase-config.js";
import {
    ref,
    onValue,
    update
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

document.addEventListener("DOMContentLoaded", () => {
    const currentUser = window.currentUser || {};
    const userId = currentUser.id ? String(currentUser.id) : null;

    console.log("Admin Profile JS Initialized. User:", currentUser, "ID:", userId);

    /* DOM Elements */
    const avatarInput = document.getElementById("profilePhotoInput");
    const avatarImage = document.getElementById("avatarImage");
    const avatarFallback = document.getElementById("avatarFallback");
    const toggleEditFormBtn = document.getElementById("toggleEditFormBtn");
    const closeFormTopBtn = document.getElementById("closeFormTopBtn");
    const cancelFormBtn = document.getElementById("cancelFormBtn");
    const saveProfileBtn = document.getElementById("saveProfileBtn");
    const profileFormSection = document.getElementById("profileFormSection");
    const profileDisplayView = document.getElementById("profileDisplayView");

    /* Cropper Modal Elements */
    const cropperModal = document.getElementById("cropperModal");
    const cropperSourceImage = document.getElementById("cropperSourceImage");
    const closeCropperModalBtn = document.getElementById("closeCropperModalBtn");
    const cancelCropperBtn = document.getElementById("cancelCropperBtn");
    const applyCropBtn = document.getElementById("applyCropBtn");
    const cropZoomInBtn = document.getElementById("cropZoomInBtn");
    const cropZoomOutBtn = document.getElementById("cropZoomOutBtn");
    const cropRotateLeftBtn = document.getElementById("cropRotateLeftBtn");
    const cropRotateRightBtn = document.getElementById("cropRotateRightBtn");
    const cropResetBtn = document.getElementById("cropResetBtn");

    let cropperInstance = null;
    let currentProfileData = {};
    let datepickerInstance = null;

    /* ----------------------------------------------------
       0. INITIALIZE FLATPICKR DATEPICKER
    ---------------------------------------------------- */
    const birthDateInput = document.getElementById("input_birth_date");
    if (birthDateInput && window.flatpickr) {
        datepickerInstance = flatpickr(birthDateInput, {
            dateFormat: "Y-m-d",
            altInput: true,
            altFormat: "j F Y",
            maxDate: "today",
            locale: "id",
            disableMobile: "true",
            onOpen: function (selectedDates, dateStr, instance) {
                const isDark = document.documentElement.getAttribute("data-theme") === "dark";
                if (instance.calendarContainer) {
                    if (isDark) {
                        instance.calendarContainer.classList.add("flatpickr-dark");
                    } else {
                        instance.calendarContainer.classList.remove("flatpickr-dark");
                    }
                }
            }
        });
    }

    /* ----------------------------------------------------
       1. INITIAL LOAD & FIREBASE LISTENER
    ---------------------------------------------------- */
    if (userId) {
        loadAdminProfile();
    } else {
        renderFallbackSession();
    }

    function loadAdminProfile() {
        const userRef = ref(db2, `users/${userId}`);

        onValue(
            userRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    currentProfileData = data;
                    renderProfileDisplay(data);
                    populateFormInputs(data);
                } else {
                    renderFallbackSession();
                }
            },
            (error) => {
                console.error("Firebase load profile error:", error);
                renderFallbackSession();
            }
        );
    }

    function renderFallbackSession() {
        currentProfileData = {
            name: currentUser.name || "Administrator",
            email: currentUser.email || "-",
            phone: currentUser.phone || "-"
        };
        renderProfileDisplay(currentProfileData);
        populateFormInputs(currentProfileData);
    }

    /* ----------------------------------------------------
       2. RENDER DISPLAY VIEW
    ---------------------------------------------------- */
    function renderProfileDisplay(data) {
        const nameVal = data.name || currentUser.name || "Administrator";
        const emailVal = data.email || currentUser.email || "-";
        const phoneVal = data.phone || currentUser.phone || "-";

        // Header Page
        const headerName = document.getElementById("headerUserName");
        const headerEmail = document.getElementById("headerUserEmail");
        const headerPhone = document.getElementById("headerUserPhone");

        if (headerName) headerName.textContent = nameVal;
        if (headerEmail) headerEmail.innerHTML = `<i class="fa-solid fa-envelope"></i> ${emailVal}`;
        if (headerPhone) headerPhone.innerHTML = `<i class="fa-solid fa-phone"></i> ${phoneVal}`;

        // Navbar Header Realtime Sync
        const navbarAdminName = document.getElementById("navbarAdminName");
        const navbarAdminAvatar = document.getElementById("navbarAdminAvatar");

        if (navbarAdminName) {
            navbarAdminName.textContent = nameVal;
        }
        localStorage.setItem("admin_user_name", nameVal);

        if (data.photo_url && data.photo_url.trim() !== "") {
            localStorage.setItem("admin_user_photo", data.photo_url);
            if (navbarAdminAvatar) {
                navbarAdminAvatar.innerHTML = `<img src="${data.photo_url}" alt="Avatar" style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block;">`;
            }
        } else {
            localStorage.removeItem("admin_user_photo");
            if (navbarAdminAvatar) {
                navbarAdminAvatar.textContent = (nameVal.charAt(0) || "A").toUpperCase();
            }
        }

        // Section 1: Informasi Pribadi
        setElText("display_name", nameVal);
        setElText("display_email", emailVal);
        setElText("display_phone", phoneVal);
        setElText("display_birth_date", formatDate(data.birth_date));
        setElText("display_gender", data.gender || "-");

        // Section 2: Informasi Alamat
        setElText("display_province", data.province || "-");
        setElText("display_city", data.city || "-");
        setElText("display_district", data.district || "-");
        setElText("display_subdistrict", data.subdistrict || "-");
        setElText("display_full_address", data.full_address || "-");
        setElText("display_postal_code", data.postal_code || "-");

        // Photo Avatar
        if (data.photo_url && data.photo_url.trim() !== "") {
            if (avatarImage) {
                avatarImage.src = data.photo_url;
                avatarImage.style.display = "block";
            }
            if (avatarFallback) avatarFallback.style.display = "none";
        } else {
            if (avatarImage) avatarImage.style.display = "none";
            if (avatarFallback) {
                avatarFallback.textContent = (nameVal.charAt(0) || "A").toUpperCase();
                avatarFallback.style.display = "flex";
            }
        }
    }

    function setElText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value && String(value).trim() !== "" ? value : "-";
    }

    function formatDate(val) {
        if (!val || val === "-") return "-";
        const d = new Date(val);
        if (isNaN(d.getTime())) return val;
        return d.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }

    /* ----------------------------------------------------
       3. POPULATE FORM INPUTS
    ---------------------------------------------------- */
    function populateFormInputs(data) {
        setVal("input_name", data.name || currentUser.name || "");
        setVal("input_email", data.email || currentUser.email || "");
        setVal("input_phone", data.phone || currentUser.phone || "");

        if (datepickerInstance && data.birth_date) {
            datepickerInstance.setDate(data.birth_date, true);
        } else {
            setVal("input_birth_date", data.birth_date || "");
        }

        setVal("input_gender", data.gender || "");
        setVal("input_province", data.province || "");
        setVal("input_city", data.city || "");
        setVal("input_district", data.district || "");
        setVal("input_subdistrict", data.subdistrict || "");
        setVal("input_full_address", data.full_address || "");
        setVal("input_postal_code", data.postal_code || "");
    }

    function setVal(id, val) {
        const el = document.getElementById(id);
        if (el) el.value = val;
    }

    /* ----------------------------------------------------
       4. TOGGLE FORM EDIT / DISPLAY
    ---------------------------------------------------- */
    function showEditForm() {
        if (profileFormSection) profileFormSection.style.display = "flex";
        if (profileDisplayView) profileDisplayView.style.display = "none";
        if (toggleEditFormBtn) toggleEditFormBtn.style.display = "none";

        profileFormSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function hideEditForm() {
        if (profileFormSection) profileFormSection.style.display = "none";
        if (profileDisplayView) profileDisplayView.style.display = "flex";
        if (toggleEditFormBtn) toggleEditFormBtn.style.display = "inline-flex";

        profileDisplayView.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (toggleEditFormBtn) toggleEditFormBtn.addEventListener("click", showEditForm);
    if (closeFormTopBtn) closeFormTopBtn.addEventListener("click", hideEditForm);
    if (cancelFormBtn) cancelFormBtn.addEventListener("click", hideEditForm);

    /* ----------------------------------------------------
       5. SIMPAN PERUBAHAN PROFIL
    ---------------------------------------------------- */
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener("click", async () => {
            const name = (document.getElementById("input_name")?.value || "").trim();
            const phone = (document.getElementById("input_phone")?.value || "").trim();
            const email = (document.getElementById("input_email")?.value || "").trim().toLowerCase();

            if (!name) {
                Swal.fire({
                    icon: "warning",
                    title: "Nama Wajib Diisi",
                    text: "Silakan masukkan nama lengkap Anda."
                });
                return;
            }

            if (!phone) {
                Swal.fire({
                    icon: "warning",
                    title: "Nomor Telepon Wajib Diisi",
                    text: "Silakan masukkan nomor telepon aktif Anda."
                });
                return;
            }

            const updatedData = {
                name,
                phone,
                email: email || "-",
                birth_date: document.getElementById("input_birth_date")?.value || "",
                gender: document.getElementById("input_gender")?.value || "",
                province: (document.getElementById("input_province")?.value || "").trim(),
                city: (document.getElementById("input_city")?.value || "").trim(),
                district: (document.getElementById("input_district")?.value || "").trim(),
                subdistrict: (document.getElementById("input_subdistrict")?.value || "").trim(),
                full_address: (document.getElementById("input_full_address")?.value || "").trim(),
                postal_code: (document.getElementById("input_postal_code")?.value || "").trim(),
                updated_at: Date.now()
            };

            saveProfileBtn.disabled = true;
            saveProfileBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> <span>Menyimpan...</span>`;

            try {
                if (userId) {
                    await update(ref(db2, `users/${userId}`), updatedData);
                }

                currentProfileData = { ...currentProfileData, ...updatedData };
                renderProfileDisplay(currentProfileData);
                hideEditForm();

                Swal.fire({
                    icon: "success",
                    title: "Profil Berhasil Disimpan",
                    text: "Data profil administrator telah berhasil diperbarui.",
                    timer: 2000,
                    showConfirmButton: false
                });
            } catch (err) {
                console.error("Gagal menyimpan profil admin:", err);
                Swal.fire({
                    icon: "error",
                    title: "Gagal Menyimpan",
                    text: "Terjadi kesalahan: " + err.message
                });
            } finally {
                saveProfileBtn.disabled = false;
                saveProfileBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> <span>Simpan Perubahan</span>`;
            }
        });
    }

    /* ----------------------------------------------------
       6. CROPPER.JS FOTO PROFIL
    ---------------------------------------------------- */
    if (avatarInput) {
        avatarInput.addEventListener("change", function (e) {
            const files = e.target.files;
            if (files && files.length > 0) {
                const file = files[0];
                if (!file.type.startsWith("image/")) {
                    Swal.fire({
                        icon: "error",
                        title: "Format Tidak Didukung",
                        text: "Harap pilih file gambar (JPG, PNG, atau WebP)."
                    });
                    return;
                }

                const reader = new FileReader();
                reader.onload = function (event) {
                    if (cropperSourceImage) {
                        cropperSourceImage.src = event.target.result;
                        openCropperModal();
                    }
                };
                reader.readAsDataURL(file);
            }
            avatarInput.value = "";
        });
    }

    function openCropperModal() {
        if (!cropperModal) return;
        cropperModal.classList.add("active");

        if (cropperInstance) {
            cropperInstance.destroy();
        }

        if (window.Cropper && cropperSourceImage) {
            cropperInstance = new Cropper(cropperSourceImage, {
                aspectRatio: 1,
                viewMode: 1,
                dragMode: "move",
                autoCropArea: 0.9,
                restore: false,
                guides: true,
                center: true,
                highlight: false,
                cropBoxMovable: true,
                cropBoxResizable: true,
                toggleDragModeOnDblclick: false
            });
        }
    }

    function closeCropperModal() {
        if (!cropperModal) return;
        cropperModal.classList.remove("active");
        if (cropperInstance) {
            cropperInstance.destroy();
            cropperInstance = null;
        }
    }

    if (closeCropperModalBtn) closeCropperModalBtn.addEventListener("click", closeCropperModal);
    if (cancelCropperBtn) cancelCropperBtn.addEventListener("click", closeCropperModal);

    if (cropZoomInBtn) cropZoomInBtn.addEventListener("click", () => cropperInstance?.zoom(0.1));
    if (cropZoomOutBtn) cropZoomOutBtn.addEventListener("click", () => cropperInstance?.zoom(-0.1));
    if (cropRotateLeftBtn) cropRotateLeftBtn.addEventListener("click", () => cropperInstance?.rotate(-90));
    if (cropRotateRightBtn) cropRotateRightBtn.addEventListener("click", () => cropperInstance?.rotate(90));
    if (cropResetBtn) cropResetBtn.addEventListener("click", () => cropperInstance?.reset());

    if (applyCropBtn) {
        applyCropBtn.addEventListener("click", async () => {
            if (!cropperInstance) return;

            const canvas = cropperInstance.getCroppedCanvas({
                width: 320,
                height: 320,
                imageSmoothingEnabled: true,
                imageSmoothingQuality: "high"
            });

            const base64Image = canvas.toDataURL("image/jpeg", 0.85);

            if (avatarImage) {
                avatarImage.src = base64Image;
                avatarImage.style.display = "block";
            }
            if (avatarFallback) avatarFallback.style.display = "none";

            // Realtime update navbar avatar & localStorage
            const navbarAdminAvatar = document.getElementById("navbarAdminAvatar");
            if (navbarAdminAvatar) {
                navbarAdminAvatar.innerHTML = `<img src="${base64Image}" alt="Avatar" style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block;">`;
            }
            localStorage.setItem("admin_user_photo", base64Image);

            closeCropperModal();

            if (userId) {
                try {
                    await update(ref(db2, `users/${userId}`), {
                        photo_url: base64Image,
                        updated_at: Date.now()
                    });

                    Swal.fire({
                        icon: "success",
                        title: "Foto Profil Diperbarui",
                        text: "Foto profil berhasil disimpan ke server.",
                        timer: 2000,
                        showConfirmButton: false
                    });
                } catch (err) {
                    console.error("Gagal simpan foto:", err);
                }
            }
        });
    }
});
