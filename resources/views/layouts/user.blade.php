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
        rel="stylesheet"
        href="{{ asset('css/users/layout.css') }}"
    >

    @stack('styles')

</head>

<body>

<div class="user-layout">


    {{-- =====================================================
        SIDEBAR
    ====================================================== --}}

    <aside
        class="user-sidebar"
        id="userSidebar"
    >

        <div class="sidebar-logo">

            <img
                src="{{ asset('assets/images/lifemedia_logo.png') }}"
                alt="Panic Button"
            >

            <div>

                <strong>
                    Panic Button
                </strong>

                <span>
                    Publik
                </span>

            </div>

        </div>


        <nav class="sidebar-menu">


            {{-- Dashboard --}}
            <a
                href="{{ route('user.dashboard') }}"
                class="sidebar-link {{ request()->routeIs('user.dashboard') ? 'active' : '' }}"
            >

                <span class="menu-icon">
                    🏠
                </span>

                <span>
                    Dashboard
                </span>

            </a>


            {{-- Panic Button --}}
            <a
                href="{{ route('user.panic') }}"
                class="sidebar-link {{ request()->routeIs('user.panic') ? 'active' : '' }}"
            >

                <span class="menu-icon">
                    🚨
                </span>

                <span>
                    Panic Button
                </span>

            </a>


            {{-- Riwayat --}}
            <a
                href="{{ route('user.history') }}"
                class="sidebar-link {{ request()->routeIs('user.history') ? 'active' : '' }}"
            >

                <span class="menu-icon">
                    📋
                </span>

                <span>
                    Riwayat Laporan
                </span>

            </a>


            {{-- Profil --}}
            <a
                href="{{ route('user.profile') }}"
                class="sidebar-link {{ request()->routeIs('user.profile') ? 'active' : '' }}"
            >

                <span class="menu-icon">
                    👤
                </span>

                <span>
                    Profil
                </span>

            </a>

        </nav>


        <div class="sidebar-bottom">

            <form
                action="{{ route('logout') }}"
                method="POST"
            >

                @csrf

                <button
                    type="submit"
                    class="sidebar-logout"
                >

                    <span>
                        🚪
                    </span>

                    Logout

                </button>

            </form>

        </div>

    </aside>



    {{-- =====================================================
        MAIN
    ====================================================== --}}

    <div class="user-main">


        {{-- Navbar --}}
        <header class="user-navbar">

            <button
                type="button"
                class="sidebar-toggle"
                id="sidebarToggle"
            >
                ☰
            </button>


            <div class="navbar-title">

                <h1>
                    @yield('page-title', 'Dashboard')
                </h1>

            </div>


            <div class="navbar-user">

                <div class="navbar-avatar">
                    {{ strtoupper(substr(session('web_user_name', 'U'), 0, 1)) }}
                </div>

                <div class="navbar-user-info">

                    <strong>
                        {{ session('web_user_name', 'User') }}
                    </strong>

                    <span>
                        User Publik
                    </span>

                </div>

            </div>

        </header>


        {{-- Content --}}
        <main class="user-content">

            @yield('content')

        </main>

    </div>

</div>


<script src="{{ asset('js/users/layout.js') }}"></script>

@stack('scripts')

</body>

</html>