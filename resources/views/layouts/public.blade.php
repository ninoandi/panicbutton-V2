<!DOCTYPE html>
<html lang="id">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>
        @yield('title', 'Panic Button - Public Safety System')
    </title>

    <link
        rel="icon"
        type="image/png"
        href="{{ asset('assets/images/lifemedia_logo.png') }}"
    >

    {{-- Font Awesome 6 --}}
    <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
    >

    {{-- Font Google --}}
    <link
        rel="preconnect"
        href="https://fonts.googleapis.com"
    >

    <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossorigin
    >

    <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
        rel="stylesheet"
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

    @yield('content')

    {{-- Shared Theme Script --}}
    <script
        src="{{ asset('js/shared/theme.js') }}"
    ></script>

    @stack('scripts')

</body>

</html>