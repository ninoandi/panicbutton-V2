<header class="navbar">

    <div class="navbar-left">

        {{-- Tombol Sidebar --}}
            <button
        type="button"
        id="sidebarToggle"
        class="sidebar-toggle"
        aria-label="Toggle Sidebar"
    >
        <span></span>
        <span></span>
        <span></span>
    </button>
        {{-- Logo --}}
        <img
            src="http://103.255.15.227/images/lifemedia_logo.png"
            alt="Life Media"
            class="navbar-logo"
        >

        {{-- Judul --}}
        <h1 class="navbar-title">
            {{ $__env->yieldContent('title', 'Dashboard') }}
            <span>Panic Button</span>
        </h1>

        {{-- Role --}}
        <span class="navbar-role">
            ADMIN
        </span>

    </div>

</header>