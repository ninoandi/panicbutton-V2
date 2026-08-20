@props([
    'title' => null,
    'role' => session('web_role', 'user')
])

@php
    $userName = session('web_user_name', ($role === 'admin' ? 'Admin' : 'User'));
    $roleLabel = ($role === 'admin') ? 'Administrator' : 'User Publik';
    $userInitial = strtoupper(substr($userName, 0, 1));
@endphp

<header class="app-navbar">

    {{-- LEFT: TOGGLE SIDEBAR + TITLE --}}
    <div class="navbar-left">

        <button
            type="button"
            class="sidebar-toggle"
            id="sidebarToggle"
            aria-label="Buka atau tutup sidebar"
            aria-expanded="true"
        >
            <i class="fa-solid fa-bars"></i>
        </button>

        <div class="navbar-title">
            <h1>{{ $title ?? $__env->yieldContent('page-title', $__env->yieldContent('title', 'Dashboard')) }}</h1>
        </div>

    </div>

    {{-- RIGHT: THEME TOGGLE & USER/ADMIN PROFILE --}}
    <div class="navbar-right">

        {{-- THEME TOGGLE BUTTON --}}
        <button
            type="button"
            id="themeToggle"
            class="theme-toggle"
            title="Ganti Tema (Light / Dark Mode)"
            aria-label="Ganti Tema"
        >
            <i class="fa-solid fa-sun theme-icon-sun"></i>
            <i class="fa-solid fa-moon theme-icon-moon"></i>
        </button>

        {{-- USER / ADMIN PROFILE PILL --}}
        @if ($role === 'user')
            <a
                href="{{ route('user.profile') }}"
                class="navbar-user"
                title="Lihat Profil"
            >
                <div class="navbar-avatar">
                    {{ $userInitial }}
                </div>

                <div class="navbar-user-info">
                    <strong>{{ $userName }}</strong>
                    <span>{{ $roleLabel }}</span>
                </div>
            </a>
        @else
            <a
                href="{{ route('profil') }}"
                class="navbar-user navbar-admin"
                id="navbarAdminPill"
                title="Lihat Profil Administrator"
            >
                <div class="navbar-avatar navbar-avatar-admin" id="navbarAdminAvatar">
                    {{ $userInitial ?: 'A' }}
                </div>

                <div class="navbar-user-info">
                    <strong id="navbarAdminName">{{ $userName }}</strong>
                    <span>{{ $roleLabel }}</span>
                </div>
            </a>
        @endif

    </div>

</header>
