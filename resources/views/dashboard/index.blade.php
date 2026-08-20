@extends('layouts.app')

@section('title', 'Dashboard Admin - Panic Button')

@section('page-title', 'Dashboard')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/admin/dashboard.css') }}">
@endpush

@section('content')
<div class="dashboard-page">

    {{-- 1. WELCOME HERO BANNER --}}
    <section class="welcome-card">
        <div class="welcome-text">
            <div class="welcome-badge">
                <span class="pulse-dot"></span>
                <span>Posko Monitoring & Admin Siaga</span>
            </div>
            <h2>Selamat Datang, {{ session('web_user_name', 'Administrator') }}!</h2>
            <p>Pantau status perangkat darurat, data perumahan, sinyal alarm, dan riwayat laporan secara realtime.</p>
        </div>
        <div class="welcome-actions">
            <a href="{{ route('monitoring-iot') }}" class="btn-hero-action">
                <i class="fa-solid fa-microchip"></i>
                <span>Monitoring Device</span>
            </a>
        </div>
    </section>

    {{-- 2. STATISTIK UTAMA (TOP 3 STAT CARDS) --}}
    <section class="dashboard-stats">

        {{-- Card 1: Status Panic Buzzer --}}
        <div class="stat-card stat-card-buzzer" id="statusCard">
            <div class="stat-card-header">
                <div class="stat-icon stat-icon-buzzer" id="statusIcon">
                    <i class="fa-solid fa-bell"></i>
                </div>
                <span class="stat-badge-buzzer" id="statusBadge">
                    <span class="pulse-dot" id="statusPulseDot"></span>
                    <span id="statusBadgeText">Standby</span>
                </span>
            </div>
            <div class="stat-card-body">
                <span class="stat-label">Status Panic Buzzer</span>
                <strong class="stat-count" id="statusText">OFF</strong>
                <span class="stat-desc" id="statusSubText">Sistem sirine dalam mode normal</span>
            </div>
        </div>

        {{-- Card 2: Total Perumahan --}}
        <div class="stat-card stat-card-perumahan">
            <div class="stat-card-header">
                <div class="stat-icon stat-icon-perumahan">
                    <i class="fa-solid fa-building-shield"></i>
                </div>
                <span class="stat-badge-perumahan">
                    Terdata
                </span>
            </div>
            <div class="stat-card-body">
                <span class="stat-label">Total Perumahan</span>
                <strong class="stat-count" id="totalPerumahan">0</strong>
                <span class="stat-desc">Area cluster perumahan terintegrasi</span>
            </div>
        </div>

        {{-- Card 3: Total Pengguna --}}
        <div class="stat-card stat-card-users">
            <div class="stat-card-header">
                <div class="stat-icon stat-icon-users">
                    <i class="fa-solid fa-users"></i>
                </div>
                <span class="stat-badge-users">
                    Terdata
                </span>
            </div>
            <div class="stat-card-body">
                <span class="stat-label">Total Pengguna</span>
                <strong class="stat-count" id="totalUsers">0</strong>
                <span class="stat-desc">Keseluruhan akun user perumahan & publik</span>
            </div>
        </div>

    </section>

    {{-- 3. LIVE MONITOR SECTIONS --}}
    
    {{-- A. Peringatan Darurat Perumahan --}}
    <section class="dashboard-card status-panic-section">
        <div class="card-header">
            <div class="card-header-title">
                <div class="card-header-icon emergency">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>
                <div>
                    <h2>Peringatan Darurat Perumahan (Realtime)</h2>
                    <p>Pantau laporan tombol darurat warga perumahan yang sedang aktif</p>
                </div>
            </div>
            <span id="activeStatusBadge" class="status-badge status-none">
                Tidak Ada
            </span>
        </div>

        <div id="liveAlert" class="live-alert-container">
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fa-solid fa-shield-heart"></i>
                </div>
                <h3>Tidak Ada Peringatan Darurat</h3>
                <p>Seluruh area perumahan dalam kondisi aman dan siaga.</p>
            </div>
        </div>
    </section>

    {{-- B. Sinyal Panic Button Publik (IoT Zona) --}}
    <section class="dashboard-card status-panic-section">
        <div class="card-header">
            <div class="card-header-title">
                <div class="card-header-icon public">
                    <i class="fa-solid fa-tower-cell"></i>
                </div>
                <div>
                    <h2>Sinyal Panic Button Publik (IoT)</h2>
                    <p>Pantau alarm darurat perangkat publik di titik-titik zona siaga</p>
                </div>
            </div>
            <span id="publicPanicCountBadge" class="status-badge status-none">
                0 Perangkat
            </span>
        </div>

        <div id="publicPanicAlert" class="public-panic-container">
            <div class="empty-state">
                <div class="empty-state-icon public-idle">
                    <i class="fa-solid fa-satellite-dish"></i>
                </div>
                <h3>Tidak Ada Alarm Publik Aktif</h3>
                <p>Perangkat IoT panic publik berada dalam kondisi standby dan terpantau aktif.</p>
            </div>
        </div>
    </section>

    {{-- 4. QUICK ACTION MENU (4 CARDS) --}}
    <section class="quick-menu">

        {{-- Quick Card 1: Rekap Perumahan --}}
        <a href="{{ route('perumahan') }}" class="quick-card quick-card-rekap">
            <div class="quick-card-top">
                <div class="quick-icon-wrapper quick-icon-rekap">
                    <i class="fa-solid fa-folder-open"></i>
                </div>
                <span class="quick-badge quick-badge-rekap">Master Data</span>
            </div>
            <div class="quick-card-content">
                <strong>Rekap Perumahan</strong>
                <p>Kelola data perumahan, cluster, penanggung jawab, dan data warga terdaftar.</p>
            </div>
            <div class="quick-card-footer">
                <span class="quick-link-text">Buka Rekap Data</span>
                <div class="quick-arrow">
                    <i class="fa-solid fa-arrow-right"></i>
                </div>
            </div>
        </a>

        {{-- Quick Card 2: Manajemen User --}}
        <a href="{{ route('manajemen-user') }}" class="quick-card quick-card-users">
            <div class="quick-card-top">
                <div class="quick-icon-wrapper quick-icon-users">
                    <i class="fa-solid fa-users-gear"></i>
                </div>
                <span class="quick-badge quick-badge-users">Pengguna</span>
            </div>
            <div class="quick-card-content">
                <strong>Manajemen Pengguna</strong>
                <p>Kelola verifikasi identitas akun warga, nomor rumah, dan hak akses sistem.</p>
            </div>
            <div class="quick-card-footer">
                <span class="quick-link-text">Kelola Pengguna</span>
                <div class="quick-arrow">
                    <i class="fa-solid fa-arrow-right"></i>
                </div>
            </div>
        </a>

        {{-- Quick Card 3: Monitoring IoT --}}
        <a href="{{ route('monitoring-iot') }}" class="quick-card quick-card-iot">
            <div class="quick-card-top">
                <div class="quick-icon-wrapper quick-icon-iot">
                    <i class="fa-solid fa-microchip"></i>
                </div>
                <span class="quick-badge quick-badge-iot">Hardware</span>
            </div>
            <div class="quick-card-content">
                <strong>Monitoring Device IoT</strong>
                <p>Pantau status perangkat keras ESP32, sensor panic button, dan kondisi buzzer.</p>
            </div>
            <div class="quick-card-footer">
                <span class="quick-link-text">Pantau Device</span>
                <div class="quick-arrow">
                    <i class="fa-solid fa-arrow-right"></i>
                </div>
            </div>
        </a>

        {{-- Quick Card 4: Statistik & Grafik --}}
        <a href="{{ route('statistik') }}" class="quick-card quick-card-stats">
            <div class="quick-card-top">
                <div class="quick-icon-wrapper quick-icon-stats">
                    <i class="fa-solid fa-chart-pie"></i>
                </div>
                <span class="quick-badge quick-badge-stats">Analitik</span>
            </div>
            <div class="quick-card-content">
                <strong>Statistik & Grafik</strong>
                <p>Analisis visual grafik tren insiden darurat, rekapitulasi, dan evaluasi respon.</p>
            </div>
            <div class="quick-card-footer">
                <span class="quick-link-text">Lihat Statistik</span>
                <div class="quick-arrow">
                    <i class="fa-solid fa-arrow-right"></i>
                </div>
            </div>
        </a>

    </section>

</div>
@endsection

<script>
    window.currentUser = {
        userId: @json(session('web_user_id')),
        username: @json(session('web_user_username')),
        name: @json(session('web_user_name')),
        email: @json(session('web_user_email')),
        phone: @json(session('web_user_phone')),
        perumahanId: @json(session('web_user_perumahan_id')),
        perumahan: @json(session('web_user_perumahan'))
    };

    console.log("====================================");
    console.log("CURRENT USER DARI BLADE:");
    console.log(window.currentUser);
    console.log("====================================");
</script>

@push('scripts')
<script type="module" src="{{ asset('js/dashboard.js') }}"></script>
@endpush