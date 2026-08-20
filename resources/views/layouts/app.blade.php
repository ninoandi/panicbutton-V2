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

        {{-- REUSABLE SIDEBAR COMPONENT (ADMIN) --}}
        <x-sidebar role="admin" />

        {{-- MAIN WRAPPER --}}
        <div class="app-main admin-main">

            {{-- REUSABLE NAVBAR COMPONENT (ADMIN) --}}
            <x-navbar role="admin" />

            {{-- CONTENT --}}
            <main class="app-content admin-content">
                @yield('content')
            </main>

        </div>

    </div>


    <script>
        window.currentUserId = @json(session('web_user_id'));
        window.currentUser = {
            id: @json(session('web_user_id')),
            name: @json(session('web_user_name')),
            email: @json(session('web_user_email')),
            phone: @json(session('web_user_phone')),
            role: @json(session('web_role'))
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