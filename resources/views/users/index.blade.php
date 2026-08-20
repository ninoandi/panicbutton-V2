@extends('layouts.user')

@section('title', 'Dashboard - Panic Button')

@section('page-title', 'Dashboard')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/users/dashboard.css') }}">
@endpush

@section('content')
<div class="dashboard-page">

    {{-- Welcome Banner --}}
    <section class="welcome-card">
        <div class="welcome-text">
            <div class="welcome-badge">
                <span class="pulse-dot"></span>
                <span>Sistem Siaga Publik Aktif</span>
            </div>
            <h2>Selamat Datang, {{ session('web_user_name', 'User') }}!</h2>
            <p>Akses cepat tombol darurat dan pantau riwayat penanganan laporan Anda di sini.</p>
        </div>
        <div class="welcome-action">
            <a href="{{ route('user.panic') }}" class="btn-panic-hero">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <span>Kirim Panic Sekarang</span>
            </a>
        </div>
    </section>

    {{-- STATISTIK UTAMA (3 CARDS) --}}
    <section class="dashboard-stats">

        {{-- 1. Card Laporan Aktif --}}
        <div class="stat-card stat-card-active">
            <div class="stat-card-header">
                <div class="stat-icon stat-icon-active">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>
                <span class="stat-badge stat-badge-active">
                    <span class="pulse-dot-red"></span> Aktif
                </span>
            </div>
            <div class="stat-card-body">
                <span class="stat-label">Laporan Aktif</span>
                <strong class="stat-count" id="activeReportCount">0</strong>
                <span class="stat-desc">Laporan darurat sedang diproses</span>
            </div>
        </div>

        {{-- 2. Card Total Laporan --}}
        <div class="stat-card stat-card-total">
            <div class="stat-card-header">
                <div class="stat-icon stat-icon-total">
                    <i class="fa-solid fa-clipboard-list"></i>
                </div>
                <span class="stat-badge stat-badge-total">
                    Riwayat
                </span>
            </div>
            <div class="stat-card-body">
                <span class="stat-label">Total Laporan</span>
                <strong class="stat-count" id="totalReportCount">0</strong>
                <span class="stat-desc">Keseluruhan laporan yang pernah dikirim</span>
            </div>
        </div>

        {{-- 3. Card Selesai --}}
        <div class="stat-card stat-card-completed">
            <div class="stat-card-header">
                <div class="stat-icon stat-icon-completed">
                    <i class="fa-solid fa-circle-check"></i>
                </div>
                <span class="stat-badge stat-badge-completed">
                    Selesai
                </span>
            </div>
            <div class="stat-card-body">
                <span class="stat-label">Laporan Selesai</span>
                <strong class="stat-count" id="completedReportCount">0</strong>
                <span class="stat-desc">Laporan yang telah berhasil ditangani</span>
            </div>
        </div>

    </section>

    {{-- STATUS PANIC BUTTON (LIVE MONITOR) --}}
    <section class="dashboard-card status-panic-section">
        <div class="card-header">
            <div class="card-header-title">
                <div class="card-header-icon">
                    <i class="fa-solid fa-tower-broadcast"></i>
                </div>
                <div>
                    <h2>Status Panic Button Realtime</h2>
                    <p>Pantau laporan darurat terbaru yang sedang berlangsung</p>
                </div>
            </div>
            <span id="activeStatusBadge" class="status-badge status-none">
                Tidak Ada
            </span>
        </div>

        <div id="activeReportContainer" class="active-report-wrapper">
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fa-solid fa-shield-heart"></i>
                </div>
                <h3>Tidak Ada Laporan Aktif</h3>
                <p>Saat ini lingkungan Anda dalam kondisi aman. Tekan tombol Panic jika sewaktu-waktu membutuhkan pertolongan.</p>
                <a href="{{ route('user.panic') }}" class="btn-primary">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <span>Kirim Panic</span>
                </a>
            </div>
        </div>
    </section>

    {{-- QUICK ACTION MENU (3 CARDS) --}}
    <section class="quick-menu">

        {{-- 4. Card Panic Button --}}
        <a href="{{ route('user.panic') }}" class="quick-card quick-card-panic">
            <div class="quick-card-top">
                <div class="quick-icon-wrapper quick-icon-panic">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>
                <span class="quick-badge quick-badge-panic">Darurat</span>
            </div>
            <div class="quick-card-content">
                <strong>Panic Button</strong>
                <p>Kirim sinyal darurat instan ke posko keamanan dan pihak berwenang.</p>
            </div>
            <div class="quick-card-footer">
                <span class="quick-link-text">Kirim Bantuan</span>
                <div class="quick-arrow">
                    <i class="fa-solid fa-arrow-right"></i>
                </div>
            </div>
        </a>

        {{-- 5. Card Riwayat Laporan --}}
        <a href="{{ route('user.history') }}" class="quick-card quick-card-history">
            <div class="quick-card-top">
                <div class="quick-icon-wrapper quick-icon-history">
                    <i class="fa-solid fa-clock-rotate-left"></i>
                </div>
                <span class="quick-badge quick-badge-history">Log SOS</span>
            </div>
            <div class="quick-card-content">
                <strong>Riwayat Laporan</strong>
                <p>Pantau rekaman laporan, status respon petugas, serta catatan riwayat.</p>
            </div>
            <div class="quick-card-footer">
                <span class="quick-link-text">Lihat Riwayat</span>
                <div class="quick-arrow">
                    <i class="fa-solid fa-arrow-right"></i>
                </div>
            </div>
        </a>

        {{-- 6. Card Profil --}}
        <a href="{{ route('user.profile') }}" class="quick-card quick-card-profile">
            <div class="quick-card-top">
                <div class="quick-icon-wrapper quick-icon-profile">
                    <i class="fa-solid fa-user-shield"></i>
                </div>
                <span class="quick-badge quick-badge-profile">Akun</span>
            </div>
            <div class="quick-card-content">
                <strong>Profil Pengguna</strong>
                <p>Kelola data identitas, informasi rumah, dan kontak darurat Anda.</p>
            </div>
            <div class="quick-card-footer">
                <span class="quick-link-text">Kelola Profil</span>
                <div class="quick-arrow">
                    <i class="fa-solid fa-arrow-right"></i>
                </div>
            </div>
        </a>

    </section>

</div>
@endsection

@push('scripts')
<script>
    window.currentUser = {
        id: @json(session('web_user_id')),
        name: @json(session('web_user_name')),
        email: @json(session('web_user_email')),
        phone: @json(session('web_user_phone'))
    };
</script>
<script type="module" src="{{ asset('js/users/dashboard.js') }}"></script>
@endpush