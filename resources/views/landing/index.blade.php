@extends('layouts.public')

@section('title', 'Panic Button - Public Safety System')

@push('styles')
<link
    rel="stylesheet"
    href="{{ asset('css/landing.css') }}"
>

<link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
/>
@endpush

@section('content')
<div class="landing-page">

    {{-- =====================================================
         NAVBAR
    ====================================================== --}}
    <header class="landing-navbar" id="landingNavbar">
        <div class="navbar-container">
            
            {{-- BRAND LOGO (Matches Sidebar Style) --}}
            <a href="#beranda" class="landing-brand">
                <img
                    src="{{ asset('assets/images/lifemedia_logo.png') }}"
                    alt="Panic Button Logo"
                    class="brand-logo-img"
                >
                <div class="brand-logo-text">
                    <strong>Panic Button</strong>
                    <span>Public Safety System</span>
                </div>
            </a>


            {{-- DESKTOP NAVIGATION --}}
            <nav class="landing-nav" id="desktopNav">
                <a href="#beranda" class="nav-link active">
                    <i class="fa-solid fa-house"></i>
                    <span>Beranda</span>
                </a>
                <a href="#status" class="nav-link">
                    <i class="fa-solid fa-chart-simple"></i>
                    <span>Status</span>
                </a>
                <a href="#kejadian" class="nav-link">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <span>Kejadian</span>
                </a>

                <a href="#instansi-terdekat" class="nav-link">
                    <i class="fa-solid fa-map-location-dot"></i>
                    <span>Instansi Terdekat</span>
                </a>
                <a href="#tentang" class="nav-link">
                    <i class="fa-solid fa-shield-halved"></i>
                    <span>Tentang</span>
                </a>
            </nav>

            {{-- NAVBAR ACTIONS (Theme Toggle & Login) --}}
            <div class="navbar-actions">
                {{-- ANIMATED THEME TOGGLE --}}
                <button
                    type="button"
                    id="themeToggle"
                    class="theme-toggle landing-theme-toggle"
                    title="Ganti Tema (Light / Dark Mode)"
                    aria-label="Ganti Tema"
                >
                    <i class="fa-solid fa-sun theme-icon-sun"></i>
                    <i class="fa-solid fa-moon theme-icon-moon"></i>
                </button>


                {{-- LOGIN CTA --}}
                <a
                    href="{{ route('login') }}"
                    class="btn-nav-login"
                >
                    <i class="fa-solid fa-right-to-bracket"></i>
                    <span>Login</span>
                </a>

                {{-- MOBILE HAMBURGER TOGGLE --}}
                <button
                    type="button"
                    class="mobile-menu-toggle"
                    id="mobileMenuToggle"
                    aria-label="Buka Menu Navigasi"
                >
                    <i class="fa-solid fa-bars"></i>
                </button>
            </div>

        </div>

        {{-- MOBILE DROPDOWN MENU --}}
        <div class="mobile-nav-drawer" id="mobileNavDrawer">
            <a href="#beranda" class="mobile-nav-link">
                <i class="fa-solid fa-house"></i>
                <span>Beranda</span>
            </a>
            <a href="#status" class="mobile-nav-link">
                <i class="fa-solid fa-chart-simple"></i>
                <span>Status Sistem</span>
            </a>
            <a href="#kejadian" class="mobile-nav-link">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <span>Kejadian Aktif</span>
            </a>
            <a href="#tentang" class="mobile-nav-link">
                <i class="fa-solid fa-shield-halved"></i>
                <span>Tentang Sistem</span>
            </a>
            <a href="{{ route('login') }}" class="mobile-nav-link mobile-login-link">
                <i class="fa-solid fa-right-to-bracket"></i>
                <span>Masuk ke Akun</span>
            </a>
        </div>
    </header>

    <main>
        {{-- =====================================================
             HERO SECTION
        ====================================================== --}}
        <section id="beranda" class="hero-section">
            {{-- Ambient Glow Backdrops --}}
            <div class="hero-glow hero-glow-primary"></div>
            <div class="hero-glow hero-glow-secondary"></div>

            <div class="hero-container">
                
                {{-- HERO TEXT CONTENT --}}
                <div class="hero-content">
                    <div class="hero-badge">
                        <span class="live-dot-pulse"></span>
                        <span>SISTEM SIAGA KEAMANAN PUBLIK</span>
                    </div>

                    <h1 class="hero-title">
                        Respon Cepat Darurat <br>
                        <span class="gradient-text">Panic Button</span> untuk Keamanan Bersama
                    </h1>

                    <p class="hero-description">
                        Pantau kejadian darurat secara langsung dan kirimkan sinyal bantuan darurat seketika melalui integrasi sistem IoT dan jaringan pemantauan realtime.
                    </p>

                    <div class="hero-actions">
                        <a href="#kejadian" class="btn-hero-primary">
                            <i class="fa-solid fa-tower-broadcast"></i>
                            <span>Pantau Kejadian</span>
                        </a>

                        <a href="{{ route('login') }}" class="btn-hero-secondary">
                            <i class="fa-solid fa-user-shield"></i>
                            <span>Login</span>
                        </a>
                    </div>

                    {{-- Quick Stats Bar --}}
                    <div class="hero-quick-stats">
                        <div class="quick-stat-item">
                            <i class="fa-solid fa-bolt-lightning"></i>
                            <div>
                                <strong>Realtime Sinyal</strong>
                                <span>IoT Terhubung</span>
                            </div>
                        </div>
                        <div class="quick-stat-divider"></div>
                        <div class="quick-stat-item">
                            <i class="fa-solid fa-location-crosshairs"></i>
                            <div>
                                <strong>Geolokasi Presisi</strong>
                                <span>Akurasi Tinggi</span>
                            </div>
                        </div>
                    </div>
                </div>

                {{-- ALIVE 3D PANIC BUTTON VISUAL --}}
                <div class="panic-visual-wrapper">
                    <div class="panic-ambient-aura"></div>

                    <div class="panic-container">
                        {{-- Expanding Sonar/Radar Rings --}}
                        <div class="panic-ring ring-1"></div>
                        <div class="panic-ring ring-2"></div>
                        <div class="panic-ring ring-3"></div>
                        <div class="panic-ring ring-4"></div>

                        {{-- Main Interactive Panic Button --}}
                        <button
                            type="button"
                            class="panic-button"
                            id="panicButton"
                            title="Klik untuk mengirim sinyal darurat"
                        >
                            <div class="panic-button-inner">
                                <div class="panic-symbol-wrapper">
                                    <div class="panic-symbol-pulse"></div>
                                    <div class="panic-symbol">
                                        <i class="fa-solid fa-triangle-exclamation"></i>
                                    </div>
                                </div>

                                <strong class="panic-label">PANIC</strong>
                                <span class="panic-sublabel">PUBLIC SOS</span>
                                <small class="panic-hint">TEKAN UNTUK BANTUAN</small>
                            </div>
                        </button>
                    </div>

                    <div class="panic-helper-badge">
                        <i class="fa-solid fa-fingerprint"></i>
                        <span>Klik tombol untuk memicu sinyal darurat</span>
                    </div>
                </div>

            </div>
        </section>

        {{-- =====================================================
             STATUS SISTEM
        ====================================================== --}}
        <section id="status" class="status-section">
            <div class="section-container">
                <div class="section-header">
                    <span class="section-tag">
                        <i class="fa-solid fa-wave-square"></i> STATUS SISTEM
                    </span>
                    <h2>Kondisi Jaringan & Pemantauan</h2>
                    <p>Informasi status konektivitas perangkat IoT dan kesiapan sistem Panic Button secara realtime.</p>
                </div>

                <div class="status-grid">
                    {{-- Status 1: System Readiness --}}
                    <div class="status-card status-card-green">
                        <div class="status-icon-box">
                            <i class="fa-solid fa-circle-check"></i>
                        </div>
                        <div class="status-info">
                            <span class="status-label">Status Sistem</span>
                            <strong class="status-value">Sistem Siaga Aktif</strong>
                            <span class="status-meta">Seluruh modul online</span>
                        </div>
                        <div class="status-card-glow"></div>
                    </div>

                    {{-- Status 2: Active Panic Incidents --}}
                    <div class="status-card status-card-red">
                        <div class="status-icon-box">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                        </div>
                        <div class="status-info">
                            <span class="status-label">Panic Publik Aktif</span>
                            <strong class="status-value" id="publicPanicCount">0 Kejadian</strong>
                            <span class="status-meta">24 jam terakhir</span>
                        </div>
                        <div class="status-card-glow"></div>
                    </div>

                    {{-- Status 3: 24/7 Monitoring --}}
                    <div class="status-card status-card-blue">
                        <div class="status-icon-box">
                            <i class="fa-solid fa-tower-broadcast"></i>
                        </div>
                        <div class="status-info">
                            <span class="status-label">Layanan Pemantauan</span>
                            <strong class="status-value">Aktif 24 Jam</strong>
                            <span class="status-meta">Respon terpusat</span>
                        </div>
                        <div class="status-card-glow"></div>
                    </div>
                </div>
            </div>
        </section>

        {{-- =====================================================
             KEJADIAN PANIC PUBLIK
        ====================================================== --}}
        <section id="kejadian" class="incident-section">
            <div class="section-container">
                <div class="section-header">
                    <span class="section-tag section-tag-alert">
                        <i class="fa-solid fa-satellite-dish"></i> MONITORING PUBLIK
                    </span>
                    <h2>Kejadian Panic Button Aktif</h2>
                    <p>Daftar laporan darurat yang sedang berlangsung dan terdeteksi oleh jaringan Panic Button.</p>
                </div>

                <div class="live-incident-card">
                    <div class="incident-card-header">
                        <div class="incident-live-badge">
                            <span class="live-dot-pulse"></span>
                            <span>LIVE STREAMING KEJADIAN</span>
                        </div>
                        <span class="incident-badge-sub">Auto-sync Realtime</span>
                    </div>

                    <div id="publicPanicAlert" class="live-box">
                        <div class="live-empty">
                            <div class="empty-icon-wrap">
                                <i class="fa-solid fa-shield-heart"></i>
                            </div>
                            <strong>Tidak Ada Panic Publik Aktif</strong>
                            <span>Kondisi lingkungan terpantau aman dan terkendali. Sistem tetap siaga memantau 24/7.</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

       {{-- =====================================================
                INSTANSI DARURAT TERDEKAT
            ===================================================== --}}

            <section
                id="instansi-terdekat"
                class="emergency-map-section"
            >

                <div class="section-container">

                    <div class="section-header">

                        <span class="section-tag">
                            <i class="fa-solid fa-location-dot"></i>
                            INSTANSI DARURAT
                        </span>

                        <h2>Instansi Darurat Terdekat</h2>

                        <p>
                            Temukan rumah sakit, kantor polisi,
                            pemadam kebakaran, dan klinik terdekat
                            berdasarkan lokasi Anda.
                        </p>

                    </div>


                    <div class="emergency-map-wrapper">

                        <div class="map-filter">

                            <button
                                class="map-filter-btn active"
                                data-type="all"
                            >
                                <i class="fa-solid fa-layer-group"></i>
                                Semua
                            </button>

                            <button
                                class="map-filter-btn"
                                data-type="hospital"
                            >
                                <i class="fa-solid fa-hospital"></i>
                                Rumah Sakit
                            </button>

                            <button
                                class="map-filter-btn"
                                data-type="police"
                            >
                                <i class="fa-solid fa-shield-halved"></i>
                                Polisi
                            </button>

                            <button
                                class="map-filter-btn"
                                data-type="fire_station"
                            >
                                <i class="fa-solid fa-fire"></i>
                                Damkar
                            </button>

                            <button
                                class="map-filter-btn"
                                data-type="clinic"
                            >
                                <i class="fa-solid fa-kit-medical"></i>
                                Klinik
                            </button>

                        </div>


                        <div id="emergencyMap"></div>


                        <div id="mapLoading">

                            <i class="fa-solid fa-location-crosshairs"></i>

                            <span>
                                Mendeteksi lokasi dan instansi terdekat...
                            </span>

                        </div>

                    </div>

                </div>

            </section>

        {{-- =====================================================
             INFORMASI SISTEM
        ====================================================== --}}
        <section id="tentang" class="info-section">
            <div class="section-container">
                <div class="info-card">
                    <div class="info-content">
                        <span class="section-tag">
                            <i class="fa-solid fa-lightbulb"></i> TENTANG SISTEM
                        </span>
                        <h2>Satu Ekosistem untuk Penyelamatan yang Lebih Cepat</h2>
                        <p>
                            Panic Button dirancang sebagai platform terintegrasi untuk mendeteksi, menghubungkan, dan mempercepat tindakan tanggap darurat antara warga publik, perangkat IoT sirine lingkungan, dan tim pengelola keamanan.
                        </p>

                        <div class="info-points">
                            <div class="info-point-item">
                                <i class="fa-solid fa-check"></i>
                                <span>Aktivasi tombol darurat sekali klik dengan verifikasi geolokasi.</span>
                            </div>
                            <div class="info-point-item">
                                <i class="fa-solid fa-check"></i>
                                <span>Integrasi sinyal otomatis ke perangkat sirine IoT terdekat.</span>
                            </div>
                            <div class="info-point-item">
                                <i class="fa-solid fa-check"></i>
                                <span>Pencatatan riwayat laporan terenkripsi dan transparan.</span>
                            </div>
                        </div>
                    </div>

                    <div class="info-features-grid">
                        <div class="feature-item">
                            <div class="feature-number">01</div>
                            <div class="feature-text">
                                <strong>Laporan Darurat Cepat</strong>
                                <span>Sinyal SOS dikirim dalam hitungan detik tanpa jeda birokrasi.</span>
                            </div>
                        </div>

                        <div class="feature-item">
                            <div class="feature-number">02</div>
                            <div class="feature-text">
                                <strong>Monitoring Realtime</strong>
                                <span>Dashboard terpusat untuk visualisasi lokasi dan status sirene.</span>
                            </div>
                        </div>

                        <div class="feature-item">
                            <div class="feature-number">03</div>
                            <div class="feature-text">
                                <strong>Multi-Perangkat & IoT</strong>
                                <span>Mendukung integrasi sensor IoT, ESP32, dan perangkat pintar.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </main>

    {{-- =====================================================
         FOOTER
    ====================================================== --}}
    <footer class="landing-footer">
        <div class="footer-container">
            <div class="footer-brand">
                <div class="footer-logo">
                    <img
                        src="{{ asset('assets/images/lifemedia_logo.png') }}"
                        alt="Panic Button Logo"
                    >
                    <div>
                        <strong>Panic Button</strong>
                        <span>Public Safety System</span>
                    </div>
                </div>
                <p class="footer-desc">
                    Solusi teknologi keamanan publik terintegrasi berbasis IoT dan pemantauan realtime.
                </p>
            </div>

            <div class="footer-links">
                <strong>Navigasi</strong>
                <a href="#beranda">Beranda</a>
                <a href="#status">Status Sistem</a>
                <a href="#kejadian">Kejadian Aktif</a>
                <a href="#tentang">Tentang Sistem</a>
            </div>

            <div class="footer-links">
                <strong>Akses Sistem</strong>
                <a href="{{ route('login') }}">Login</a>
                <a href="{{ route('register') }}">Registrasi</a>
                <a href="#beranda" class="btn-scroll-top">
                    <i class="fa-solid fa-arrow-up"></i> Kembali ke Atas
                </a>
            </div>
        </div>

        <div class="footer-bottom">
            <p>© {{ date('Y') }} Panic Button System. All rights reserved.</p>
            <div class="footer-status-pill">
                <span class="live-dot-pulse"></span>
                <span>All Systems Operational</span>
            </div>
        </div>
    </footer>

</div>
@endsection

@push('scripts')
<script>
    // Smooth scroll & mobile menu toggling
    document.addEventListener('DOMContentLoaded', () => {
        const mobileToggle = document.getElementById('mobileMenuToggle');
        const mobileDrawer = document.getElementById('mobileNavDrawer');
        const mobileLinks = document.querySelectorAll('.mobile-nav-link');

        if (mobileToggle && mobileDrawer) {
            mobileToggle.addEventListener('click', () => {
                mobileDrawer.classList.toggle('open');
                const isOpen = mobileDrawer.classList.contains('open');
                mobileToggle.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
            });

            mobileLinks.forEach(link => {
                link.addEventListener('click', () => {
                    mobileDrawer.classList.remove('open');
                    mobileToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
                });
            });
        }

        // Active link highlighting on scroll
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.landing-nav .nav-link');

        function highlightNav() {
            const scrollY = window.pageYOffset + 120;
            sections.forEach(current => {
                const sectionHeight = current.offsetHeight;
                const sectionTop = current.offsetTop;
                const sectionId = current.getAttribute('id');

                if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${sectionId}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }

        window.addEventListener('scroll', highlightNav, { passive: true });
    });
</script>

{{-- Panic Button Handler --}}
<script
    type="module"
    src="{{ asset('js/users/panic-button.js') }}"
></script>

{{-- Monitoring Panic Publik --}}
<script
    type="module"
    src="{{ asset('js/users/public-monitoring.js') }}"
></script>

<script
    src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
></script>

<script
    src="{{ asset('js/emergency-maps.js') }}"
></script>
@endpush