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


    {{-- Font Awesome --}}
    <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
    >


    {{-- Layout --}}
    <link
        rel="stylesheet"
        href="{{ asset('css/users/layout.css') }}"
    >


    {{-- Sidebar --}}
    <link
        rel="stylesheet"
        href="{{ asset('css/users/sidebar.css') }}"
    >


    {{-- Navbar --}}
    <link
        rel="stylesheet"
        href="{{ asset('css/users/navbar.css') }}"
    >


    @stack('styles')

</head>


<body>

<div class="user-layout">

    {{-- SIDEBAR --}}
    @include('layouts.users.sidebar')


    {{-- MAIN --}}
    <div class="user-main">

        {{-- NAVBAR --}}
        @include('layouts.users.navbar')


        {{-- CONTENT --}}
        <main class="user-content">

            @yield('content')

        </main>

    </div>

</div>


{{-- Sidebar JS --}}
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<script
    src="{{ asset('js/users/sidebar.js') }}"
></script>


@stack('scripts')

</body>

</html>