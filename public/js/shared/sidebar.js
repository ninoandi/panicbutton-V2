/* =====================================================
   SHARED REUSABLE SIDEBAR CONTROLLER (USER & ADMIN)
===================================================== */

document.addEventListener('DOMContentLoaded', () => {

    const sidebarToggle = document.getElementById('sidebarToggle');
    const layout = document.querySelector('.app-layout') ||
                   document.querySelector('.user-layout') ||
                   document.getElementById('adminLayout') ||
                   document.querySelector('.admin-layout');

    if (sidebarToggle && layout) {
        const isMobile = window.innerWidth <= 768;
        const savedState = localStorage.getItem('app_sidebar_collapsed') ||
                           localStorage.getItem('user_sidebar_collapsed') ||
                           localStorage.getItem('admin_sidebar_collapsed');

        // Apply initial state
        if (isMobile) {
            layout.classList.add('sidebar-collapsed');
            sidebarToggle.setAttribute('aria-expanded', 'false');
        } else if (savedState === 'true') {
            layout.classList.add('sidebar-collapsed');
            sidebarToggle.setAttribute('aria-expanded', 'false');
        } else {
            layout.classList.remove('sidebar-collapsed');
            sidebarToggle.setAttribute('aria-expanded', 'true');
        }

        // Toggle click event
        sidebarToggle.addEventListener('click', (e) => {
            e.stopPropagation();

            const isCollapsed = layout.classList.toggle('sidebar-collapsed');
            sidebarToggle.setAttribute('aria-expanded', String(!isCollapsed));

            // Save preference to localStorage
            if (window.innerWidth > 768) {
                const val = isCollapsed ? 'true' : 'false';
                localStorage.setItem('app_sidebar_collapsed', val);
                localStorage.setItem('user_sidebar_collapsed', val);
                localStorage.setItem('admin_sidebar_collapsed', val);
            }
        });

        // Close sidebar on mobile when clicking content area
        const contentArea = document.querySelector('.app-content') ||
                            document.querySelector('.user-content') ||
                            document.querySelector('.admin-content');
        if (contentArea) {
            contentArea.addEventListener('click', () => {
                if (window.innerWidth <= 768 && !layout.classList.contains('sidebar-collapsed')) {
                    layout.classList.add('sidebar-collapsed');
                    sidebarToggle.setAttribute('aria-expanded', 'false');
                }
            });
        }
    }

    /* ----------------------------------------------------
       1. PROFILE ALERT DOT SYNC (USER ROLE)
    ---------------------------------------------------- */
    const profileAlertDot = document.getElementById('profileAlertDot');
    if (profileAlertDot) {
        function updateProfileDot(percentage) {
            if (percentage < 100) {
                profileAlertDot.style.display = 'block';
                profileAlertDot.setAttribute('title', `Informasi profil belum lengkap (${percentage}%)`);
            } else {
                profileAlertDot.style.display = 'none';
            }
        }

        const completeness = localStorage.getItem('profile_completeness');
        if (completeness !== null) {
            updateProfileDot(parseInt(completeness, 10));
        } else if (window.currentUserId) {
            // Query Firebase in background if not cached
            fetch(`https://panicbttn2-default-rtdb.asia-southeast1.firebasedatabase.app/users/${window.currentUserId}.json`)
                .then(r => r.json())
                .then(data => {
                    if (data) {
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
                        const filled = checkFields.filter(f => f && String(f).trim() !== '').length;
                        const pct = Math.round((filled / checkFields.length) * 100);
                        localStorage.setItem('profile_completeness', pct);
                        updateProfileDot(pct);
                    } else {
                        updateProfileDot(0);
                    }
                })
                .catch(() => updateProfileDot(0));
        } else {
            updateProfileDot(0);
        }
    }

    /* ----------------------------------------------------
       2. QUICK MESSAGE TRIGGER (ADMIN ROLE)
    ---------------------------------------------------- */
    const quickMessageBtn = document.getElementById('quick-message');
    if (quickMessageBtn) {
        quickMessageBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const modal = document.getElementById('quickMessageModal');
            if (modal) {
                modal.style.display = 'flex';
            }
        });
    }

    /* ----------------------------------------------------
       3. LOGOUT CONFIRMATION (SWEETALERT2 MODERN ACCESSIBLE MODAL)
    ---------------------------------------------------- */
    const logoutBtn = document.getElementById('logoutButton') || document.getElementById('adminLogoutButton');
    const logoutForm = document.getElementById('logoutForm') || document.getElementById('adminLogoutForm');

    if (logoutBtn && logoutForm) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();

            if (window.Swal) {
                Swal.fire({
                    html: `
                        <div class="logout-icon-glow-wrapper">
                            <div class="logout-icon-glow">
                                <div class="logout-icon-inner">
                                    <i class="fa-solid fa-arrow-right-from-bracket"></i>
                                </div>
                            </div>
                        </div>
                        <h2 class="logout-content-title">Konfirmasi Keluar</h2>
                        <p class="logout-content-desc">
                            Apakah Anda yakin ingin mengakhiri sesi ini? Anda harus memasukkan kredensial lagi untuk masuk.
                        </p>
                    `,
                    showCancelButton: true,
                    confirmButtonText: '<i class="fa-solid fa-arrow-right-from-bracket"></i> <span>Ya, Keluar</span>',
                    cancelButtonText: '<i class="fa-solid fa-xmark"></i> <span>Batal</span>',
                    buttonsStyling: false,
                    reverseButtons: true,
                    focusCancel: true,
                    allowEnterKey: true,
                    customClass: {
                        container: 'custom-swal-logout-backdrop',
                        popup: 'custom-swal-logout-popup',
                        actions: 'custom-swal-logout-actions',
                        confirmButton: 'btn-swal-logout-confirm',
                        cancelButton: 'btn-swal-logout-cancel'
                    },
                    showClass: {
                        popup: 'swal-logout-animate-in'
                    },
                    hideClass: {
                        popup: 'swal-logout-animate-out'
                    },
                    didOpen: (popup) => {
                        const cancelBtn = popup.querySelector('.btn-swal-logout-cancel');
                        const confirmBtn = popup.querySelector('.btn-swal-logout-confirm');

                        if (cancelBtn) {
                            cancelBtn.setAttribute('tabindex', '1');
                            cancelBtn.focus();
                        }
                        if (confirmBtn) {
                            confirmBtn.setAttribute('tabindex', '2');
                        }

                        // Tab key cycling trap
                        popup.addEventListener('keydown', (event) => {
                            if (event.key === 'Tab') {
                                if (event.shiftKey) {
                                    if (document.activeElement === cancelBtn) {
                                        event.preventDefault();
                                        if (confirmBtn) confirmBtn.focus();
                                    }
                                } else {
                                    if (document.activeElement === confirmBtn) {
                                        event.preventDefault();
                                        if (cancelBtn) cancelBtn.focus();
                                    }
                                }
                            }
                        });
                    }
                }).then((result) => {
                    if (result.isConfirmed) {
                        logoutForm.submit();
                    }
                });
            } else {
                if (confirm('Apakah Anda yakin ingin keluar?')) {
                    logoutForm.submit();
                }
            }
        });
    }

    /* ----------------------------------------------------
       4. NAVBAR ADMIN REAL-TIME NAME & AVATAR SYNC
    ---------------------------------------------------- */
    const navbarAdminName = document.getElementById('navbarAdminName');
    const navbarAdminAvatar = document.getElementById('navbarAdminAvatar');

    function applyNavbarProfile(name, photoUrl) {
        if (name && navbarAdminName) {
            navbarAdminName.textContent = name;
        }
        if (navbarAdminAvatar) {
            if (photoUrl && String(photoUrl).trim() !== '') {
                navbarAdminAvatar.innerHTML = `<img src="${photoUrl}" alt="Avatar" style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block;">`;
            } else if (name) {
                const initial = name.trim().charAt(0).toUpperCase() || 'A';
                navbarAdminAvatar.textContent = initial;
            }
        }
    }

    // 1. Fast apply from localStorage
    const cachedName = localStorage.getItem('admin_user_name');
    const cachedPhoto = localStorage.getItem('admin_user_photo');
    if (cachedName || cachedPhoto) {
        applyNavbarProfile(cachedName, cachedPhoto);
    }

    // 2. Background sync from Firebase if logged in as admin
    const userId = window.currentUserId;
    if (userId && (navbarAdminName || navbarAdminAvatar)) {
        fetch(`https://panicbttn2-default-rtdb.asia-southeast1.firebasedatabase.app/users/${userId}.json`)
            .then(r => r.json())
            .then(data => {
                if (data && typeof data === 'object') {
                    const name = data.name || cachedName;
                    const photo = data.photo_url || cachedPhoto;
                    if (name) localStorage.setItem('admin_user_name', name);
                    if (photo) localStorage.setItem('admin_user_photo', photo);
                    applyNavbarProfile(name, photo);
                }
            })
            .catch(() => {});
    }

});
