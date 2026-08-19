document.addEventListener('DOMContentLoaded', () => {

    /* =====================================================
       SIDEBAR TOGGLE
    ===================================================== */

    const sidebarToggle =
        document.getElementById('sidebarToggle');

    const userLayout =
        document.querySelector('.user-layout');


    if (sidebarToggle && userLayout) {

        sidebarToggle.addEventListener('click', () => {

            const isCollapsed =
                userLayout.classList.toggle(
                    'sidebar-collapsed'
                );


            sidebarToggle.setAttribute(
                'aria-expanded',
                String(!isCollapsed)
            );

        });

    }


    /* =====================================================
       LOGOUT CONFIRMATION
    ===================================================== */

    const logoutButton =
        document.getElementById('userLogoutButton');

    const logoutForm =
        document.getElementById('userLogoutForm');


    if (logoutButton && logoutForm) {

        logoutButton.addEventListener('click', () => {

            Swal.fire({

                title: 'Keluar dari akun?',

                text: 'Apakah Anda yakin ingin keluar dari akun ini?',

                icon: 'warning',

                showCancelButton: true,

                confirmButtonText: 'Ya, Logout',

                cancelButtonText: 'Batal',

                reverseButtons: true,

                buttonsStyling: false,

                customClass: {

                    confirmButton: 'swal-confirm',

                    cancelButton: 'swal-cancel'

                }

            }).then((result) => {

                if (result.isConfirmed) {

                    logoutForm.submit();

                }

            });

        });

    }

});