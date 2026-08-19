<header class="user-navbar">

    {{-- TOGGLE SIDEBAR --}}
    <button
        type="button"
        class="sidebar-toggle"
        id="sidebarToggle"
        aria-label="Buka atau tutup sidebar"
        aria-expanded="true"
    >

        <i class="fa-solid fa-bars"></i>

    </button>


    {{-- TITLE --}}
    <div class="navbar-title">

        <h1>
            @yield('page-title', 'Dashboard')
        </h1>

    </div>


    {{-- USER --}}
    <div class="navbar-user">

        <div class="navbar-avatar">

            {{ strtoupper(
                substr(
                    session('web_user_name', 'U'),
                    0,
                    1
                )
            ) }}

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