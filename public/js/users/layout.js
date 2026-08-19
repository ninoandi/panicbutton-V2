document.addEventListener("DOMContentLoaded", () => {

    const sidebar = document.getElementById("userSidebar");
    const toggle = document.getElementById("sidebarToggle");

    if (!sidebar || !toggle) {
        return;
    }


    /*
    |--------------------------------------------------------------------------
    | Overlay
    |--------------------------------------------------------------------------
    */

    let overlay = document.getElementById("sidebarOverlay");

    if (!overlay) {

        overlay = document.createElement("div");

        overlay.id = "sidebarOverlay";
        overlay.className = "sidebar-overlay";

        document.body.appendChild(overlay);
    }


    /*
    |--------------------------------------------------------------------------
    | Buka / tutup sidebar
    |--------------------------------------------------------------------------
    */

    function toggleSidebar() {

        sidebar.classList.toggle("active");
        overlay.classList.toggle("active");

    }


    /*
    |--------------------------------------------------------------------------
    | Tombol hamburger
    |--------------------------------------------------------------------------
    */

    toggle.addEventListener("click", toggleSidebar);


    /*
    |--------------------------------------------------------------------------
    | Klik overlay
    |--------------------------------------------------------------------------
    */

    overlay.addEventListener("click", () => {

        sidebar.classList.remove("active");
        overlay.classList.remove("active");

    });


    /*
    |--------------------------------------------------------------------------
    | Klik menu pada mobile
    |--------------------------------------------------------------------------
    */

    const sidebarLinks =
        document.querySelectorAll(".sidebar-link");

    sidebarLinks.forEach((link) => {

        link.addEventListener("click", () => {

            if (window.innerWidth <= 768) {

                sidebar.classList.remove("active");

                overlay.classList.remove("active");

            }

        });

    });


    /*
    |--------------------------------------------------------------------------
    | Resize
    |--------------------------------------------------------------------------
    */

    window.addEventListener("resize", () => {

        if (window.innerWidth > 768) {

            sidebar.classList.remove("active");

            overlay.classList.remove("active");

        }

    });

});