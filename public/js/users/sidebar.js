document.addEventListener('DOMContentLoaded', () => {

    const sidebarToggle = document.getElementById('sidebarToggle');
    const userLayout = document.querySelector('.user-layout');

    if (!sidebarToggle || !userLayout) {
        console.warn('Sidebar toggle atau user layout tidak ditemukan.');
        return;
    }

    const isMobile = window.innerWidth <= 768;
    const savedState = localStorage.getItem('user_sidebar_collapsed');

    // Terapkan state awal
    if (isMobile) {
        userLayout.classList.add('sidebar-collapsed');
        sidebarToggle.setAttribute('aria-expanded', 'false');
    } else if (savedState === 'true') {
        userLayout.classList.add('sidebar-collapsed');
        sidebarToggle.setAttribute('aria-expanded', 'false');
    } else {
        userLayout.classList.remove('sidebar-collapsed');
        sidebarToggle.setAttribute('aria-expanded', 'true');
    }

    sidebarToggle.addEventListener('click', (e) => {
        e.stopPropagation();

        const isCollapsed =
            userLayout.classList.toggle('sidebar-collapsed');

        sidebarToggle.setAttribute(
            'aria-expanded',
            String(!isCollapsed)
        );

        // Simpan preferensi pengguna ke localStorage (khusus tampilan desktop)
        if (window.innerWidth > 768) {
            localStorage.setItem('user_sidebar_collapsed', isCollapsed ? 'true' : 'false');
        }

    });

    // Close sidebar on mobile when clicking content area
    const userContent = document.querySelector('.user-content');
    if (userContent) {
        userContent.addEventListener('click', () => {
            if (window.innerWidth <= 768 && !userLayout.classList.contains('sidebar-collapsed')) {
                userLayout.classList.add('sidebar-collapsed');
                sidebarToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Sync profile alert dot
    const profileAlertDot = document.getElementById('profileAlertDot');
    if (profileAlertDot) {
        function updateDot(percentage) {
            if (percentage < 100) {
                profileAlertDot.style.display = 'block';
                profileAlertDot.setAttribute('title', `Informasi profil belum lengkap (${percentage}%)`);
            } else {
                profileAlertDot.style.display = 'none';
            }
        }

        const completeness = localStorage.getItem('profile_completeness');
        if (completeness !== null) {
            updateDot(parseInt(completeness, 10));
        } else if (window.currentUserId) {
            // Check Firebase in background if not cached yet
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
                        updateDot(pct);
                    } else {
                        updateDot(0);
                    }
                })
                .catch(() => {
                    updateDot(0);
                });
        } else {
            updateDot(0);
        }
    }

});