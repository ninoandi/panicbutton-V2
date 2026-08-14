<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>@yield('title', 'Panic Button Admin')</title>

    <link rel="stylesheet" href="{{ asset('css/app.css') }}">

    @stack('styles')
</head>

<body>

    <div class="admin-layout">

        {{-- Sidebar --}}
        @include('layouts.sidebar')

        <div class="main-wrapper">

            {{-- Navbar --}}
            @include('layouts.navbar')

           {{-- Isi halaman --}}
            @yield('content')

        </div>

    </div>

    <script src="{{ asset('js/app.js') }}"></script>

    @stack('scripts')

</body>
</html>