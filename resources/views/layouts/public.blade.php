<!DOCTYPE html>
<html lang="id">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>
        @yield('title', 'Panic Button')
    </title>

    <link
        rel="icon"
        type="image/png"
        href="{{ asset('assets/images/lifemedia_logo.png') }}"
    >

    {{-- Font --}}
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
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
    >

    @stack('styles')

</head>

<body>

    @yield('content')

    @stack('scripts')

</body>

</html>