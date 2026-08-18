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

    <link
        rel="stylesheet"
        href="{{ asset('css/app.css') }}"
    >

    @stack('styles')

</head>


<body>

    <div class="admin-layout">

        {{-- Sidebar --}}
        @include('layouts.sidebar')


        <div class="main-wrapper">

            {{-- Navbar --}}
            @include('layouts.navbar')


            {{-- Content --}}
            @yield('content')

        </div>

    </div>


    {{-- SweetAlert2 --}}
    <script
        src="https://cdn.jsdelivr.net/npm/sweetalert2@11"
    ></script>


    {{-- App --}}
    <script
        src="{{ asset('js/app.js') }}"
    ></script>


    {{-- Sidebar --}}
    <script
        src="{{ asset('js/sidebar.js') }}"
    ></script>


    {{-- Quick Message --}}
    <script
        type="module"
        src="{{ asset('js/quick-message.js') }}"
    ></script>


    @stack('scripts')

</body>

</html>