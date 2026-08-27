<!DOCTYPE html>
<html lang="id">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>
        @yield('title', 'Panic Button Admin')
    </title>

    {{-- Favicon --}}
    <link rel="icon" type="image/png" href="{{ asset('assets/images/lifemedia_logo.png') }}">

    {{-- Font Awesome 6 --}}
    <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
    >

    {{-- Shared Layout & Tokens --}}
    <link
        rel="stylesheet"
        href="{{ asset('css/shared/layout.css') }}"
    >

    {{-- Shared Sidebar --}}
    <link
        rel="stylesheet"
        href="{{ asset('css/shared/sidebar.css') }}"
    >

    {{-- Shared Navbar --}}
    <link
        rel="stylesheet"
        href="{{ asset('css/shared/navbar.css') }}"
    >

    {{-- App CSS (for cards, tables, modals) --}}
    <link
        rel="stylesheet"
        href="{{ asset('css/app.css') }}"
    >

    {{-- Early Theme Init --}}
    <script>
        (function () {
            try {
                var savedTheme = localStorage.getItem('app_theme') || localStorage.getItem('user_theme');
                if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                    document.documentElement.setAttribute('data-theme', 'light');
                }
            } catch (e) {}
        })();
    </script>

    @stack('styles')

</head>


<body>

    <div class="app-layout admin-layout" id="adminLayout">

        {{-- Zero-Flicker Pre-render Script --}}
        <script>
            (function () {
                try {
                    if (window.innerWidth <= 768 || localStorage.getItem('app_sidebar_collapsed') === 'true' || localStorage.getItem('admin_sidebar_collapsed') === 'true') {
                        document.getElementById('adminLayout').classList.add('sidebar-collapsed');
                    }
                } catch (e) {}
            })();
        </script>

        {{-- REUSABLE SIDEBAR COMPONENT --}}
        <x-sidebar :role="session('web_role', 'admin')" />

        {{-- MAIN WRAPPER --}}
        <div class="app-main admin-main">

            {{-- REUSABLE NAVBAR COMPONENT --}}
            <x-navbar :role="session('web_role', 'admin')" />

            {{-- CONTENT --}}
            <main class="app-content admin-content">
                @yield('content')
            </main>

        </div>

    </div>


    <script>
        window.csrfToken = @json(csrf_token());
        window.currentUserId = @json(session('web_user_id'));
        window.currentUserPetugasType = @json(session('web_petugas_type'));
        window.currentUserPerumahanKey = @json(session('web_perumahan_key'));
        window.currentUser = {
            id: @json(session('web_user_id')),
            name: @json(session('web_user_name')),
            email: @json(session('web_user_email')),
            phone: @json(session('web_user_phone')),
            role: @json(session('web_role')),
            petugasType: @json(session('web_petugas_type')),
            perumahanKey: @json(session('web_perumahan_key'))
        };

        // Global Helper: Hash Password using Laravel native Bcrypt
        window.hashPassword = async function (plainPassword) {
            if (!plainPassword) return "";
            try {
                const response = await fetch("{{ url('/api/hash-password') }}", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "X-CSRF-TOKEN": window.csrfToken || document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ""
                    },
                    body: JSON.stringify({ password: plainPassword })
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.message || `Gagal mengenkripsi password (Status: ${response.status})`);
                }

                const data = await response.json();
                return data.hash;
            } catch (err) {
                console.error("Hash password error:", err);
                throw err;
            }
        };
    </script>

    {{-- SweetAlert2 --}}
    <script
        src="https://cdn.jsdelivr.net/npm/sweetalert2@11"
    ></script>

    {{-- Shared Theme JS --}}
    <script
        src="{{ asset('js/shared/theme.js') }}"
    ></script>

    {{-- Shared Sidebar JS --}}
    <script
        src="{{ asset('js/shared/sidebar.js') }}"
    ></script>

    @stack('scripts')

</body>

</html>