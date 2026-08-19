<aside
    class="user-sidebar"
    id="userSidebar"
>

    {{-- LOGO --}}
    <div class="sidebar-logo">

        <img
            src="{{ asset('assets/images/lifemedia_logo.png') }}"
            alt="Panic Button"
        >

        <div class="sidebar-logo-text">

            <strong>
                Panic Button
            </strong>

            <span>
                Publik
            </span>

        </div>

    </div>


    {{-- MENU --}}
    <nav class="sidebar-menu">

        {{-- Dashboard --}}
        <a
            href="{{ route('user.dashboard') }}"
            class="sidebar-link {{ request()->routeIs('user.dashboard') ? 'active' : '' }}"
        >

            <i class="fa-solid fa-house"></i>

            <span>
                Dashboard
            </span>

        </a>


        {{-- Panic Button --}}
        <a
            href="{{ route('user.panic') }}"
            class="sidebar-link {{ request()->routeIs('user.panic') ? 'active' : '' }}"
        >

            <i class="fa-solid fa-triangle-exclamation"></i>

            <span>
                Panic Button
            </span>

        </a>


        {{-- Riwayat --}}
        <a
            href="{{ route('user.history') }}"
            class="sidebar-link {{ request()->routeIs('user.history') ? 'active' : '' }}"
        >

            <i class="fa-solid fa-clipboard-list"></i>

            <span>
                Riwayat Laporan
            </span>

        </a>


        {{-- Profil --}}
        <a
            href="{{ route('user.profile') }}"
            class="sidebar-link {{ request()->routeIs('user.profile') ? 'active' : '' }}"
        >

            <i class="fa-solid fa-user"></i>

            <span>
                Profil
            </span>

        </a>

    </nav>


    {{-- LOGOUT --}}
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

                <i class="fa-solid fa-right-from-bracket"></i>

                <span>
                    Logout
                </span>

            </button>

        </form>

    </div>

</aside>