@props([
    'role' => session('web_role', 'user'),
    'items' => null
])

@php
    // If custom items are not provided, generate role-based menu items
    if (!isset($items) || !is_array($items)) {
        if ($role === 'admin') {
            $items = [
                [
                    'label' => 'Dashboard',
                    'route' => 'dashboard',
                    'url' => route('dashboard'),
                    'icon' => 'fa-solid fa-house',
                    'active' => request()->routeIs('dashboard')
                ],
                [
                    'label' => 'Monitoring Device',
                    'route' => 'monitoring-iot',
                    'url' => route('monitoring-iot'),
                    'icon' => 'fa-solid fa-microchip',
                    'active' => request()->routeIs('monitoring-iot')
                ],
                [
                    'label' => 'User Perumahan',
                    'route' => 'manajemen-user',
                    'url' => route('manajemen-user'),
                    'icon' => 'fa-solid fa-users',
                    'active' => request()->routeIs('manajemen-user')
                ],
                [
                    'label' => 'User Public',
                    'route' => 'manajemen-user-publik',
                    'url' => route('manajemen-user-publik'),
                    'icon' => 'fa-solid fa-users-gear',
                    'active' => request()->routeIs('manajemen-user-publik')
                ],

                [
                    'label' => 'Kelola Admin',
                    'route' => 'manajemen-admin',
                    'url' => route('manajemen-admin'),
                    'icon' => 'fa-solid fa-user-shield',
                    'active' => request()->routeIs('manajemen-admin*')
                ],
                [
                    'label' => 'Kelola Petugas',
                    'route' => 'manajemen-petugas',
                    'url' => route('manajemen-petugas'),
                    'icon' => 'fa-solid fa-user-nurse',
                    'active' => request()->routeIs('manajemen-petugas*')
                ],
                [
                    'label' => 'Quick Message',
                    'route' => 'quick-message',
                    'url' => route('quick-message'),
                    'icon' => 'fa-solid fa-comment-dots',
                    'active' => request()->routeIs('quick-message')
                ],
                [
                    'label' => 'Rekap Data',
                    'route' => 'perumahan',
                    'url' => route('perumahan'),
                    'icon' => 'fa-solid fa-folder-open',
                    'active' => request()->routeIs('perumahan*')
                ],
                [
                    'label' => 'Recap Data Public',
                    'route' => 'recap-public',
                    'url' => route('recap-public'),
                    'icon' => 'fa-solid fa-bullhorn',
                    'active' => request()->routeIs('recap-public*')
                ],
                [
                    'label' => 'Statistik',
                    'route' => 'statistik',
                    'url' => route('statistik'),
                    'icon' => 'fa-solid fa-chart-pie',
                    'active' => request()->routeIs('statistik*') || request()->routeIs('detail-grafik*')
                ],
                [
                    'label' => 'Profil',
                    'route' => 'profil',
                    'url' => route('profil'),
                    'icon' => 'fa-solid fa-circle-user',
                    'active' => request()->routeIs('profil*')
                ],
            ];
        } elseif ($role === 'petugas') {
            // Petugas Role Menu
            $items = [
                [
                    'label' => 'Dashboard',
                    'route' => 'petugas.dashboard',
                    'url' => route('petugas.dashboard'),
                    'icon' => 'fa-solid fa-house',
                    'active' => request()->routeIs('petugas.dashboard*')
                ],
                [
                    'label' => 'Riwayat Laporan',
                    'route' => 'petugas.history',
                    'url' => route('petugas.history'),
                    'icon' => 'fa-solid fa-clock-rotate-left',
                    'active' => request()->routeIs('petugas.history*')
                ],
                [
                    'label' => 'Profil',
                    'route' => 'petugas.profile',
                    'url' => route('petugas.profile'),
                    'icon' => 'fa-solid fa-circle-user',
                    'active' => request()->routeIs('petugas.profile*')
                ],
            ];
        } else {
            // User Role Menu
            $items = [
                [
                    'label' => 'Dashboard',
                    'route' => 'user.dashboard',
                    'url' => route('user.dashboard'),
                    'icon' => 'fa-solid fa-house',
                    'active' => request()->routeIs('user.dashboard')
                ],
                [
                    'label' => 'Panic Button',
                    'route' => 'user.panic',
                    'url' => route('user.panic'),
                    'icon' => 'fa-solid fa-triangle-exclamation',
                    'active' => request()->routeIs('user.panic')
                ],
                [
                    'label' => 'Riwayat Laporan',
                    'route' => 'user.history',
                    'url' => route('user.history'),
                    'icon' => 'fa-solid fa-clock-rotate-left',
                    'active' => request()->routeIs('user.history')
                ],
                [
                    'label' => 'Profil',
                    'route' => 'user.profile',
                    'url' => route('user.profile'),
                    'icon' => 'fa-solid fa-user-shield',
                    'active' => request()->routeIs('user.profile'),
                    'hasAlert' => true
                ],
            ];
        }
    }

    $subtitle = ($role === 'admin') ? 'Admin Panel' : (($role === 'petugas') ? 'Petugas' : 'Publik');
@endphp

<aside class="app-sidebar" id="appSidebar">

    {{-- LOGO --}}
    <div class="sidebar-logo">
        <img
            src="{{ asset('assets/images/lifemedia_logo.png') }}"
            alt="Panic Button"
        >

        <div class="sidebar-logo-text">
            <strong>Panic Button</strong>
            <span>{{ $subtitle }}</span>
        </div>
    </div>

    {{-- MENU --}}
    <nav class="sidebar-menu">
        @foreach ($items as $item)
            <a
                href="{{ $item['url'] }}"
                class="sidebar-link {{ !empty($item['active']) ? 'active' : '' }}"
                @if(!empty($item['id'])) id="{{ $item['id'] }}" @endif
                @if(!empty($item['hasAlert'])) id="sidebarProfileLink" @endif
            >
                <div class="sidebar-icon-wrapper">
                    <i class="{{ $item['icon'] }}"></i>
                    @if(!empty($item['hasAlert']))
                        <span id="profileAlertDot" class="profile-alert-dot" style="display: none;" title="Informasi profil belum lengkap (100%)"></span>
                    @endif
                </div>

                <span>{{ $item['label'] }}</span>
            </a>
        @endforeach
    </nav>

    {{-- LOGOUT --}}
    <div class="sidebar-bottom">
        <form
            action="{{ route('logout') }}"
            method="POST"
            id="logoutForm"
        >
            @csrf
            <button
                type="submit"
                class="sidebar-logout"
                id="logoutButton"
            >
                <i class="fa-solid fa-right-from-bracket"></i>
                <span>Logout</span>
            </button>
        </form>
    </div>

</aside>
