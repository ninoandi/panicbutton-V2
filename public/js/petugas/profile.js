/* =========================================================
   PROFIL PETUGAS - CONTROLLER JAVASCRIPT
   Dual Database (DB1 Perumahan & DB2 Public) + Cropper.js + Flatpickr
========================================================= */

import { db1, db2 } from "../firebase-config.js";
import {
    ref,
    onValue,
    update
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

document.addEventListener("DOMContentLoaded", () => {
    const currentUser = window.currentUser || {};
    const userId = currentUser.id ? String(currentUser.id) : null;
    const petugasType = window.currentUserPetugasType || currentUser.petugasType || "public";
    const perumahanKey = window.currentUserPerumahanKey || currentUser.perumahanKey || null;

    console.log("Petugas Profile JS Initialized. User:", currentUser, "Type:", petugasType, "Key:", perumahanKey);

    // DOM Elements - Header & Display
    const avatarInput = document.getElementById("profilePhotoInput");
    const avatarImage = document.getElementById("avatarImage");
    const avatarFallback = document.getElementById("avatarFallback");
    const headerPetugasName = document.getElementById("headerPetugasName");
    const headerPetugasEmail = document.getElementById("headerPetugasEmail");
    const headerPetugasPhone = document.getElementById("headerPetugasPhone");
    const profileStatusBadge = document.getElementById("profileStatusBadge");

    const display_name = document.getElementById("display_name");
    const display_email = document.getElementById("display_email");
    const display_phone = document.getElementById("display_phone");
    const display_birth_date = document.getElementById("display_birth_date");
    const display_gender = document.getElementById("display_gender");
    const display_type = document.getElementById("display_type");
    const display_area = document.getElementById("display_area");
    const display_address = document.getElementById("display_address");

    // DOM Elements - Form & Toggle
    const toggleEditFormBtn = document.getElementById("toggleEditFormBtn");
    const closeFormTopBtn = document.getElementById("closeFormTopBtn");
    const cancelFormBtn = document.getElementById("cancelFormBtn");
    const saveProfileBtn = document.getElementById("saveProfileBtn");
    const profileFormSection = document.getElementById("profileFormSection");
    const profileDisplayView = document.getElementById("profileDisplayView");

    // Form Inputs
    const input_name = document.getElementById("input_name");
    const input_phone = document.getElementById("input_phone");
    const input_birth_date = document.getElementById("input_birth_date");
    const input_gender = document.getElementById("input_gender");
    const input_email = document.getElementById("input_email");
    const input_address = document.getElementById("input_address");
    const input_new_password = document.getElementById("input_new_password");
    const input_confirm_password = document.getElementById("input_confirm_password");
    const toggleNewPassBtn = document.getElementById("toggleNewPassBtn");
    const toggleConfirmPassBtn = document.getElementById("toggleConfirmPassBtn");

    // Cropper Modal Elements
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
    if (input_birth_date && window.flatpickr) {
        datepickerInstance = flatpickr(input_birth_date, {
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
       1. TOGGLE PASSWORD VISIBILITY
    ---------------------------------------------------- */
    function setupPasswordToggle(btn, input) {
        if (!btn || !input) return;
        btn.addEventListener("click", () => {
            const isPassword = input.type === "password";
            input.type = isPassword ? "text" : "password";
            const icon = btn.querySelector("i");
            if (icon) {
                icon.className = isPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye";
            }
        });
    }
    setupPasswordToggle(toggleNewPassBtn, input_new_password);
    setupPasswordToggle(toggleConfirmPassBtn, input_confirm_password);

    /* ----------------------------------------------------
       2. TOGGLE EDIT FORM VIEW
    ---------------------------------------------------- */
    function openEditForm() {
        if (profileFormSection) profileFormSection.style.display = "block";
        if (toggleEditFormBtn) toggleEditFormBtn.style.display = "none";
        profileFormSection.scrollIntoView({ behavior: "smooth" });
    }

    function closeEditForm() {
        if (profileFormSection) profileFormSection.style.display = "none";
        if (toggleEditFormBtn) toggleEditFormBtn.style.display = "inline-flex";
    }

    if (toggleEditFormBtn) toggleEditFormBtn.addEventListener("click", openEditForm);
    if (closeFormTopBtn) closeFormTopBtn.addEventListener("click", closeEditForm);
    if (cancelFormBtn) cancelFormBtn.addEventListener("click", closeEditForm);

    /* ----------------------------------------------------
       3. LOAD PETUGAS PROFILE (FIREBASE DB1 OR DB2)
    ---------------------------------------------------- */
    if (userId) {
        loadPetugasProfile();
    } else {
        renderFallbackSession();
    }

    function loadPetugasProfile() {
        const userRef = (petugasType === "perumahan" && perumahanKey)
            ? ref(db1, `perumahan/${perumahanKey}/users/${userId}`)
            : ref(db2, `users/${userId}`);

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
        const fallbackData = {
            name: currentUser.name || "Petugas Lapangan",
            email: currentUser.email || "-",
            phone: currentUser.phone || "-",
            phoneNumber: currentUser.phone || "-",
            address: "-",
            birth_date: "-",
            gender: "-"
        };
        renderProfileDisplay(fallbackData);
        populateFormInputs(fallbackData);
    }

    function renderProfileDisplay(data) {
        const name = data.name || currentUser.name || "Petugas Lapangan";
        const email = data.email || currentUser.email || "-";
        const phone = data.phone || data.phoneNumber || currentUser.phone || "-";
        const birthDate = data.birth_date || data.birthDate || "-";
        const gender = data.gender || "-";
        const address = data.address || data.alamat || data.houseNumber || "-";
        const photoUrl = data.photo_url || data.photoUrl || data.avatar || localStorage.getItem("petugas_user_photo") || "";

        // Avatar
        if (photoUrl) {
            if (avatarImage) {
                avatarImage.src = photoUrl;
                avatarImage.style.display = "block";
            }
            if (avatarFallback) avatarFallback.style.display = "none";
        } else {
            if (avatarImage) avatarImage.style.display = "none";
            if (avatarFallback) {
                avatarFallback.textContent = (name.charAt(0) || "P").toUpperCase();
                avatarFallback.style.display = "block";
            }
        }

        // Header
        if (headerPetugasName) headerPetugasName.textContent = name;
        if (headerPetugasEmail) headerPetugasEmail.innerHTML = `<i class="fa-solid fa-envelope"></i> ${escapeHtml(email)}`;
        if (headerPetugasPhone) headerPetugasPhone.innerHTML = `<i class="fa-solid fa-phone"></i> ${escapeHtml(phone)}`;

        // Display Fields
        if (display_name) display_name.textContent = name;
        if (display_email) display_email.textContent = email;
        if (display_phone) display_phone.textContent = phone;
        if (display_birth_date) display_birth_date.textContent = formatBirthDate(birthDate);
        if (display_gender) display_gender.textContent = gender;
        if (display_address) display_address.textContent = address;

        // Calculate Completeness
        calculateCompleteness(data);
    }

    function populateFormInputs(data) {
        if (input_name) input_name.value = data.name || currentUser.name || "";
        if (input_phone) input_phone.value = data.phone || data.phoneNumber || currentUser.phone || "";
        if (input_email) input_email.value = data.email || currentUser.email || "";
        if (input_gender) input_gender.value = data.gender || "";
        if (input_address) input_address.value = data.address || data.alamat || "";

        const bDate = data.birth_date || data.birthDate || "";
        if (input_birth_date) {
            if (datepickerInstance) {
                datepickerInstance.setDate(bDate || null);
            } else {
                input_birth_date.value = bDate;
            }
        }
    }

    function formatBirthDate(dateStr) {
        if (!dateStr || dateStr === "-") return "-";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }

    function calculateCompleteness(data) {
        const requiredFields = [
            data.name || currentUser.name,
            data.email || currentUser.email,
            data.phone || data.phoneNumber || currentUser.phone,
            data.birth_date || data.birthDate,
            data.gender,
            data.address || data.alamat
        ];

        const filledCount = requiredFields.filter(f => f && String(f).trim() !== "" && String(f).trim() !== "-").length;
        const totalCount = requiredFields.length;
        const percentage = Math.round((filledCount / totalCount) * 100);

        if (profileStatusBadge) {
            if (percentage === 100) {
                profileStatusBadge.className = "profile-completeness-badge badge-success";
                profileStatusBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> Profil Lengkap (100%)`;
            } else if (percentage >= 50) {
                profileStatusBadge.className = "profile-completeness-badge badge-warning";
                profileStatusBadge.innerHTML = `<i class="fa-solid fa-clock"></i> Belum Lengkap (${percentage}%)`;
            } else {
                profileStatusBadge.className = "profile-completeness-badge badge-danger";
                profileStatusBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Perlu Dilengkapi (${percentage}%)`;
            }
        }
    }

    /* ----------------------------------------------------
       4. SIMPAN PERUBAHAN PROFIL
    ---------------------------------------------------- */
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener("click", async () => {
            const name = (input_name ? input_name.value : "").trim();
            const phone = (input_phone ? input_phone.value : "").trim();
            const birthDate = input_birth_date ? input_birth_date.value : "";
            const gender = input_gender ? input_gender.value : "";
            const address = (input_address ? input_address.value : "").trim();
            const newPassword = input_new_password ? input_new_password.value : "";
            const confirmPassword = input_confirm_password ? input_confirm_password.value : "";

            if (!name) {
                Swal.fire({ icon: "warning", title: "Nama Lengkap Kosong", text: "Silakan isi nama lengkap Anda." });
                return;
            }

            if (!phone) {
                Swal.fire({ icon: "warning", title: "Nomor Telepon Kosong", text: "Silakan isi nomor telepon / WhatsApp aktif." });
                return;
            }

            if (newPassword) {
                if (newPassword.length < 6) {
                    Swal.fire({ icon: "warning", title: "Password Terlalu Pendek", text: "Kata sandi baru minimal 6 karakter." });
                    return;
                }
                if (newPassword !== confirmPassword) {
                    Swal.fire({ icon: "warning", title: "Konfirmasi Password Salah", text: "Konfirmasi kata sandi baru tidak cocok." });
                    return;
                }
            }

            saveProfileBtn.disabled = true;
            saveProfileBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Menyimpan...`;

            try {
                let hashedPassword = null;
                if (newPassword && typeof window.hashPassword === "function") {
                    hashedPassword = await window.hashPassword(newPassword);
                }

                const updatePayload = {
                    name,
                    phone,
                    phoneNumber: phone,
                    birth_date: birthDate,
                    gender,
                    address,
                    alamat: address,
                    updated_at: Date.now()
                };

                if (hashedPassword) {
                    updatePayload.password = hashedPassword;
                }

                if (petugasType === "perumahan" && perumahanKey) {
                    await update(ref(db1, `perumahan/${perumahanKey}/users/${userId}`), updatePayload);
                } else if (userId) {
                    await update(ref(db2, `users/${userId}`), updatePayload);
                }

                // Update session state in navbar pill
                const navbarAdminName = document.getElementById("navbarAdminName");
                if (navbarAdminName) navbarAdminName.textContent = name;

                closeEditForm();
                if (input_new_password) input_new_password.value = "";
                if (input_confirm_password) input_confirm_password.value = "";

                Swal.fire({
                    icon: "success",
                    title: "Profil Berhasil Diperbarui",
                    text: "Data diri dan pengaturan akun Anda telah tersimpan.",
                    timer: 2000,
                    showConfirmButton: false
                });

            } catch (err) {
                console.error("Gagal menyimpan profil petugas:", err);
                Swal.fire({
                    icon: "error",
                    title: "Gagal Menyimpan",
                    text: "Terjadi kesalahan: " + err.message,
                    confirmButtonColor: "#dc2626"
                });
            } finally {
                saveProfileBtn.disabled = false;
                saveProfileBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> <span>Simpan Perubahan</span>`;
            }
        });
    }

    /* ----------------------------------------------------
       5. CROPPER JS & FOTO PROFIL
    ---------------------------------------------------- */
    if (avatarInput) {
        avatarInput.addEventListener("change", (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            if (!file.type.startsWith("image/")) {
                Swal.fire({ icon: "error", title: "Format Salah", text: "Harap pilih file gambar (JPG, PNG, WEBP)." });
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                Swal.fire({ icon: "warning", title: "Ukuran Terlalu Besar", text: "Ukuran gambar maksimal 5MB." });
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                if (cropperSourceImage) {
                    cropperSourceImage.src = event.target.result;
                    openCropperModal();
                }
            };
            reader.readAsDataURL(file);
            avatarInput.value = "";
        });
    }

    function openCropperModal() {
        if (!cropperModal) return;
        cropperModal.style.display = "flex";

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
        cropperModal.style.display = "none";
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

            // Update navbar avatar
            const navbarAdminAvatar = document.getElementById("navbarAdminAvatar");
            if (navbarAdminAvatar) {
                navbarAdminAvatar.innerHTML = `<img src="${base64Image}" alt="Avatar" style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block;">`;
            }
            localStorage.setItem("petugas_user_photo", base64Image);

            closeCropperModal();

            if (userId) {
                try {
                    const updatePayload = {
                        photo_url: base64Image,
                        photoUrl: base64Image,
                        updated_at: Date.now()
                    };

                    if (petugasType === "perumahan" && perumahanKey) {
                        await update(ref(db1, `perumahan/${perumahanKey}/users/${userId}`), updatePayload);
                    } else {
                        await update(ref(db2, `users/${userId}`), updatePayload);
                    }

                    Swal.fire({
                        icon: "success",
                        title: "Foto Profil Diperbarui",
                        text: "Foto profil berhasil disimpan ke server.",
                        timer: 1800,
                        showConfirmButton: false
                    });
                } catch (err) {
                    console.error("Gagal simpan foto petugas:", err);
                }
            }
        });
    }

    function escapeHtml(str) {
        if (!str) return "";
        return String(str).replace(/[&<>"']/g, (m) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[m]);
    }
});
