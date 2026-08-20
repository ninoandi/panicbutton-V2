/* =====================================================
   PROFIL USER - CONTROLLER & FIREBASE SYNC + CROPPER + FLATPICKR
===================================================== */

import { db2 } from "../firebase-config.js";
import {
    ref,
    onValue,
    get,
    update
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

document.addEventListener("DOMContentLoaded", () => {

    const currentUser = window.currentUser || {};
    const userId = currentUser.id ? String(currentUser.id) : null;

    console.log("Profile JS loaded. User:", currentUser, "ID:", userId);

    /* Elements */
    const avatarInput = document.getElementById("profilePhotoInput");
    const avatarImage = document.getElementById("avatarImage");
    const avatarFallback = document.getElementById("avatarFallback");
    const toggleEditFormBtn = document.getElementById("toggleEditFormBtn");
    const closeFormTopBtn = document.getElementById("closeFormTopBtn");
    const cancelFormBtn = document.getElementById("cancelFormBtn");
    const saveProfileBtn = document.getElementById("saveProfileBtn");
    const profileFormSection = document.getElementById("profileFormSection");
    const profileDisplayView = document.getElementById("profileDisplayView");
    const profileStatusBadge = document.getElementById("profileStatusBadge");

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
            theme: "material_blue",
            onOpen: function(selectedDates, dateStr, instance) {
                // Ensure calendar matches current theme
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
        loadUserProfile();
    } else {
        renderFallbackSession();
    }

    function loadUserProfile() {
        const userRef = ref(db2, `users/${userId}`);

        onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                currentProfileData = data;
                renderProfileDisplay(data);
                populateFormInputs(data);
            } else {
                renderFallbackSession();
            }
        }, (error) => {
            console.error("Firebase load profile error:", error);
            renderFallbackSession();
        });
    }

    function renderFallbackSession() {
        currentProfileData = {
            name: currentUser.name || "User",
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
        // Header
        const nameVal = data.name || currentUser.name || "-";
        const emailVal = data.email || currentUser.email || "-";
        const phoneVal = data.phone || currentUser.phone || "-";

        document.getElementById("headerUserName").textContent = nameVal;
        document.getElementById("headerUserEmail").innerHTML = `<i class="fa-solid fa-envelope"></i> ${emailVal}`;
        document.getElementById("headerUserPhone").innerHTML = `<i class="fa-solid fa-phone"></i> ${phoneVal}`;

        // Section 1: Pribadi
        document.getElementById("display_name").textContent = nameVal;
        document.getElementById("display_email").textContent = emailVal;
        document.getElementById("display_phone").textContent = phoneVal;
        document.getElementById("display_birth_date").textContent = formatDate(data.birth_date);
        document.getElementById("display_gender").textContent = data.gender || "-";

        // Section 2: Alamat
        document.getElementById("display_province").textContent = data.province || "-";
        document.getElementById("display_city").textContent = data.city || "-";
        document.getElementById("display_district").textContent = data.district || "-";
        document.getElementById("display_subdistrict").textContent = data.subdistrict || "-";
        document.getElementById("display_full_address").textContent = data.full_address || "-";
        document.getElementById("display_postal_code").textContent = data.postal_code || "-";

        // Section 3: Kontak Darurat
        document.getElementById("display_emergency_name_1").textContent = data.emergency_name_1 || "-";
        document.getElementById("display_emergency_relation_1").textContent = data.emergency_relation_1 || "-";
        document.getElementById("display_emergency_phone_1").textContent = data.emergency_phone_1 || "-";

        const call1 = document.getElementById("call_emergency_1");
        if (data.emergency_phone_1 && data.emergency_phone_1.trim() !== "") {
            call1.href = `tel:${data.emergency_phone_1.replace(/\s+/g, '')}`;
            call1.style.display = "inline-flex";
        } else {
            call1.style.display = "none";
        }

        document.getElementById("display_emergency_name_2").textContent = data.emergency_name_2 || "-";
        document.getElementById("display_emergency_relation_2").textContent = data.emergency_relation_2 || "-";
        document.getElementById("display_emergency_phone_2").textContent = data.emergency_phone_2 || "-";

        const call2 = document.getElementById("call_emergency_2");
        if (data.emergency_phone_2 && data.emergency_phone_2.trim() !== "") {
            call2.href = `tel:${data.emergency_phone_2.replace(/\s+/g, '')}`;
            call2.style.display = "inline-flex";
        } else {
            call2.style.display = "none";
        }

        // Section 4: Kesehatan
        const bloodBadge = document.getElementById("display_blood_type_badge");
        if (data.blood_type && data.blood_type !== "") {
            bloodBadge.textContent = data.blood_type;
            bloodBadge.className = "blood-type-badge blood-filled";
        } else {
            bloodBadge.textContent = "Belum Diisi";
            bloodBadge.className = "blood-type-badge blood-empty";
        }

        const allergiesEl = document.getElementById("display_allergies_condition");
        if (data.allergies_condition && data.allergies_condition.trim() !== "") {
            allergiesEl.textContent = data.allergies_condition;
            allergiesEl.className = "medical-condition-box has-condition";
        } else {
            allergiesEl.textContent = "Tidak ada riwayat alergi atau kondisi medis khusus yang dicatat.";
            allergiesEl.className = "medical-condition-box no-condition";
        }

        // Avatar Photo
        renderPhoto(data.photo);

        // Check completeness & update sidebar alert
        updateCompletenessBadge(data);
    }

    function renderPhoto(photoData) {
        if (photoData && photoData.startsWith("data:image")) {
            avatarImage.src = photoData;
            avatarImage.style.display = "block";
            avatarFallback.style.display = "none";

            try {
                localStorage.setItem("user_photo", photoData);
            } catch (e) {}

            // Also synchronize navbar avatar if photo exists
            const navbarAvatar = document.querySelector(".navbar-avatar");
            if (navbarAvatar) {
                navbarAvatar.innerHTML = `<img src="${photoData}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
            }
        } else {
            avatarImage.src = "";
            avatarImage.style.display = "none";
            avatarFallback.style.display = "flex";
        }
    }

    function updateCompletenessBadge(data) {
        // Complete checklist of requested profile fields:
        // 1. Pribadi: birth_date, gender
        // 2. Alamat: province, city, district, subdistrict, full_address, postal_code
        // 3. Kontak Darurat 1: emergency_name_1, emergency_relation_1, emergency_phone_1
        // 4. Kontak Darurat 2: emergency_name_2, emergency_relation_2, emergency_phone_2
        // 5. Kesehatan: blood_type
        const checkFields = [
            data.birth_date,
            data.gender,
            data.province,
            data.city,
            data.district,
            data.subdistrict,
            data.full_address,
            data.postal_code,
            data.emergency_name_1,
            data.emergency_relation_1,
            data.emergency_phone_1,
            data.emergency_name_2,
            data.emergency_relation_2,
            data.emergency_phone_2,
            data.blood_type
        ];

        const filledCount = checkFields.filter(f => f && String(f).trim() !== "").length;
        const total = checkFields.length;
        const percentage = Math.round((filledCount / total) * 100);

        try {
            localStorage.setItem("profile_completeness", percentage);
        } catch (e) {}

        // Update badge
        if (profileStatusBadge) {
            if (percentage >= 100) {
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

        // Sync sidebar alert dot: Visible if < 100%, Hidden if 100%
        syncSidebarAlertDot(percentage);
    }

    function syncSidebarAlertDot(percentage) {
        const dot = document.getElementById("profileAlertDot");
        if (dot) {
            if (percentage < 100) {
                dot.style.display = "block";
                dot.setAttribute("title", `Informasi profil belum lengkap (${percentage}%)`);
            } else {
                dot.style.display = "none";
            }
        }
    }

    function formatDate(dateStr) {
        if (!dateStr) return "-";
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric"
            });
        } catch (e) {
            return dateStr;
        }
    }

    /* ----------------------------------------------------
       3. POPULATE FORM INPUTS
    ---------------------------------------------------- */
    function populateFormInputs(data) {
        setValue("input_name", data.name || currentUser.name || "");
        setValue("input_email", data.email || currentUser.email || "");
        setValue("input_phone", data.phone || currentUser.phone || "");
        
        if (datepickerInstance) {
            datepickerInstance.setDate(data.birth_date || "", true);
        } else {
            setValue("input_birth_date", data.birth_date || "");
        }
        
        setValue("input_gender", data.gender || "");
        setValue("input_province", data.province || "");
        setValue("input_city", data.city || "");
        setValue("input_district", data.district || "");
        setValue("input_subdistrict", data.subdistrict || "");
        setValue("input_full_address", data.full_address || "");
        setValue("input_postal_code", data.postal_code || "");

        setValue("input_emergency_name_1", data.emergency_name_1 || "");
        setValue("input_emergency_relation_1", data.emergency_relation_1 || "");
        setValue("input_emergency_phone_1", data.emergency_phone_1 || "");

        setValue("input_emergency_name_2", data.emergency_name_2 || "");
        setValue("input_emergency_relation_2", data.emergency_relation_2 || "");
        setValue("input_emergency_phone_2", data.emergency_phone_2 || "");

        setValue("input_blood_type", data.blood_type || "");
        setValue("input_allergies_condition", data.allergies_condition || "");
    }

    function setValue(id, val) {
        const el = document.getElementById(id);
        if (el) el.value = val;
    }

    function getValue(id) {
        const el = document.getElementById(id);
        return el ? el.value.trim() : "";
    }

    /* ----------------------------------------------------
       4. PHOTO UPLOAD & INTERACTIVE CROPPER MODAL
    ---------------------------------------------------- */
    if (avatarInput) {
        avatarInput.addEventListener("change", function (e) {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.type.startsWith("image/")) {
                showToast("error", "Harap pilih berkas gambar yang valid!");
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                showToast("warning", "Ukuran foto maksimal 5MB.");
                return;
            }

            const reader = new FileReader();
            reader.onload = function (event) {
                openCropperModal(event.target.result);
            };
            reader.readAsDataURL(file);

            // Reset input so re-selecting same file triggers change
            avatarInput.value = "";
        });
    }

    function openCropperModal(imageSrc) {
        if (!cropperModal || !cropperSourceImage) return;

        cropperSourceImage.src = imageSrc;
        cropperModal.style.display = "flex";

        if (cropperInstance) {
            cropperInstance.destroy();
        }

        // Initialize Cropper.js with 1:1 circular aspect ratio
        cropperInstance = new Cropper(cropperSourceImage, {
            aspectRatio: 1,
            viewMode: 1,
            dragMode: "move",
            autoCropArea: 0.85,
            restore: false,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false,
            minCropBoxWidth: 120,
            minCropBoxHeight: 120,
            ready: function () {
                console.log("Cropper ready.");
            }
        });
    }

    function closeCropperModal() {
        if (cropperModal) cropperModal.style.display = "none";
        if (cropperInstance) {
            cropperInstance.destroy();
            cropperInstance = null;
        }
    }

    if (closeCropperModalBtn) closeCropperModalBtn.addEventListener("click", closeCropperModal);
    if (cancelCropperBtn) cancelCropperBtn.addEventListener("click", closeCropperModal);

    // Cropper Toolbar buttons
    if (cropZoomInBtn) {
        cropZoomInBtn.addEventListener("click", () => {
            if (cropperInstance) cropperInstance.zoom(0.1);
        });
    }
    if (cropZoomOutBtn) {
        cropZoomOutBtn.addEventListener("click", () => {
            if (cropperInstance) cropperInstance.zoom(-0.1);
        });
    }
    if (cropRotateLeftBtn) {
        cropRotateLeftBtn.addEventListener("click", () => {
            if (cropperInstance) cropperInstance.rotate(-90);
        });
    }
    if (cropRotateRightBtn) {
        cropRotateRightBtn.addEventListener("click", () => {
            if (cropperInstance) cropperInstance.rotate(90);
        });
    }
    if (cropResetBtn) {
        cropResetBtn.addEventListener("click", () => {
            if (cropperInstance) cropperInstance.reset();
        });
    }

    // Apply Crop & Save to Firebase
    if (applyCropBtn) {
        applyCropBtn.addEventListener("click", async () => {
            if (!cropperInstance) return;

            applyCropBtn.disabled = true;
            applyCropBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...`;

            try {
                const canvas = cropperInstance.getCroppedCanvas({
                    width: 360,
                    height: 360,
                    imageSmoothingEnabled: true,
                    imageSmoothingQuality: "high"
                });

                const croppedBase64 = canvas.toDataURL("image/jpeg", 0.92);
                renderPhoto(croppedBase64);

                if (userId) {
                    const userRef = ref(db2, `users/${userId}`);
                    await update(userRef, { photo: croppedBase64 });
                }

                closeCropperModal();

                if (window.Swal) {
                    Swal.fire({
                        icon: "success",
                        title: "Foto Profil Diperbarui!",
                        text: "Foto profil Anda berhasil disesuaikan dan disimpan.",
                        showCloseButton: true,
                        showConfirmButton: true,
                        confirmButtonText: "Tutup",
                        confirmButtonColor: "#173f70",
                        timer: 3500,
                        timerProgressBar: true
                    });
                } else {
                    showToast("success", "Foto profil berhasil diperbarui!");
                }
            } catch (err) {
                console.error("Gagal simpan cropped foto:", err);
                showToast("error", "Gagal menyimpan foto.");
            } finally {
                applyCropBtn.disabled = false;
                applyCropBtn.innerHTML = `<i class="fa-solid fa-check"></i> <span>Terapkan & Simpan Foto</span>`;
            }
        });
    }

    /* ----------------------------------------------------
       5. TOGGLE FORM VISIBILITY
    ---------------------------------------------------- */
    function openForm() {
        profileFormSection.style.display = "block";
        populateFormInputs(currentProfileData);
        profileFormSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function closeForm() {
        profileFormSection.style.display = "none";
        profileDisplayView.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (toggleEditFormBtn) {
        toggleEditFormBtn.addEventListener("click", () => {
            if (profileFormSection.style.display === "none" || profileFormSection.style.display === "") {
                openForm();
            } else {
                closeForm();
            }
        });
    }

    if (closeFormTopBtn) closeFormTopBtn.addEventListener("click", closeForm);
    if (cancelFormBtn) cancelFormBtn.addEventListener("click", closeForm);

    /* ----------------------------------------------------
       6. SAVE PROFILE DATA WITH SWEETALERT2 CLOSE BUTTON
    ---------------------------------------------------- */
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener("click", async () => {
            const name = getValue("input_name");
            const phone = getValue("input_phone");

            if (!name) {
                showToast("warning", "Nama lengkap wajib diisi.");
                document.getElementById("input_name")?.focus();
                return;
            }

            if (!phone) {
                showToast("warning", "Nomor telepon wajib diisi.");
                document.getElementById("input_phone")?.focus();
                return;
            }

            const payload = {
                name: name,
                phone: phone,
                birth_date: getValue("input_birth_date"),
                gender: getValue("input_gender"),
                province: getValue("input_province"),
                city: getValue("input_city"),
                district: getValue("input_district"),
                subdistrict: getValue("input_subdistrict"),
                full_address: getValue("input_full_address"),
                postal_code: getValue("input_postal_code"),
                emergency_name_1: getValue("input_emergency_name_1"),
                emergency_relation_1: getValue("input_emergency_relation_1"),
                emergency_phone_1: getValue("input_emergency_phone_1"),
                emergency_name_2: getValue("input_emergency_name_2"),
                emergency_relation_2: getValue("input_emergency_relation_2"),
                emergency_phone_2: getValue("input_emergency_phone_2"),
                blood_type: getValue("input_blood_type"),
                allergies_condition: getValue("input_allergies_condition"),
                updated_at: Date.now()
            };

            // Loading state
            saveProfileBtn.disabled = true;
            saveProfileBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...`;

            try {
                if (userId) {
                    const userRef = ref(db2, `users/${userId}`);
                    await update(userRef, payload);
                }

                currentProfileData = { ...currentProfileData, ...payload };
                renderProfileDisplay(currentProfileData);

                if (window.Swal) {
                    Swal.fire({
                        icon: "success",
                        title: "Profil Berhasil Diperbarui!",
                        text: "Seluruh informasi data profil Anda telah tersimpan dengan aman.",
                        showCloseButton: true,
                        showConfirmButton: true,
                        confirmButtonText: "Tutup",
                        confirmButtonColor: "#173f70",
                        timer: 4000,
                        timerProgressBar: true
                    });
                } else {
                    showToast("success", "Data profil berhasil disimpan!");
                }

                closeForm();
            } catch (err) {
                console.error("Gagal simpan data profil:", err);
                if (window.Swal) {
                    Swal.fire({
                        icon: "error",
                        title: "Gagal Menyimpan",
                        text: "Terjadi kendala saat menyimpan data ke database. Silakan coba lagi.",
                        showCloseButton: true,
                        showConfirmButton: true,
                        confirmButtonText: "Tutup"
                    });
                } else {
                    showToast("error", "Gagal menyimpan data.");
                }
            } finally {
                saveProfileBtn.disabled = false;
                saveProfileBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> <span>Simpan Perubahan</span>`;
            }
        });
    }

    /* Helper Toast */
    function showToast(icon, message) {
        if (window.Swal) {
            const Toast = Swal.mixin({
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
            Toast.fire({
                icon: icon,
                title: message
            });
        } else {
            alert(message);
        }
    }

});
