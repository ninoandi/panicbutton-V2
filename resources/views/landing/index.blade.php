@extends('layouts.public')

@section('title', 'Panic Button')

@push('styles')

<link
    rel="stylesheet"
    href="{{ asset('css/landing.css') }}"
>

@endpush


@section('content')

<div class="landing-page">

    {{-- =====================================================
         NAVBAR
    ====================================================== --}}

    <header class="landing-navbar">

        <div class="landing-logo">

            <!-- <div class="logo-icon">
                !
            </div> -->
            <img
            src="{{ asset('assets/images/lifemedia_logo.png') }}"
            alt="Life Media"
            class="logo-icon-img"
            >

            <div class="logo-text">

                <strong>
                    Panic Button
                </strong>

                <span>
                    Public Safety System
                </span>

            </div>

        </div>


        <nav class="landing-nav">

            <a href="#beranda">
                Beranda
            </a>

            <a href="#kejadian">
                Kejadian
            </a>

            <a href="#tentang">
                Tentang
            </a>

            <a
                href="{{ route('login') }}"
                class="nav-login"
            >
                Login
            </a>

        </nav>

    </header>



    {{-- =====================================================
         HERO
    ====================================================== --}}

    <main>

        <section
            id="beranda"
            class="hero-section"
        >

            <div class="hero-content">

                <span class="hero-badge">
                    SISTEM KEAMANAN PUBLIK
                </span>

                <h1>
                    Panic Button
                    <span>
                        untuk Keamanan Bersama
                    </span>
                </h1>

                <p>
                    Pantau kejadian darurat secara langsung
                    dan dapatkan informasi keamanan di sekitar
                    Anda melalui sistem Panic Button.
                </p>


                <div class="hero-actions">

                    <a
                        href="#kejadian"
                        class="btn-primary"
                    >
                        Lihat Kejadian
                    </a>

                    <a
                        href="{{ route('login') }}"
                        class="btn-secondary"
                    >
                        Login
                    </a>

                </div>

            </div>


            {{-- Panic Button Visual --}}

            <div class="panic-container">

                <div class="panic-ring ring-1"></div>

                <div class="panic-ring ring-2"></div>

                <div class="panic-ring ring-3"></div>


                <button
                    type="button"
                    class="panic-button"
                    id="panicButton"
                >

                    <div class="panic-symbol">
                        !
                    </div>

                    <strong>
                        PANIC
                    </strong>

                    <span>
                        PUBLIC
                    </span>

                </button>

            </div>

        </section>



        {{-- =====================================================
             STATUS SISTEM
        ====================================================== --}}

        <section class="status-section">

            <div class="section-header">

                <span>
                    STATUS SISTEM
                </span>

                <h2>
                    Sistem Keamanan
                </h2>

                <p>
                    Informasi kondisi sistem Panic Button
                    secara realtime.
                </p>

            </div>


            <div class="status-grid">

                <div class="status-card">

                    <div class="status-icon green">
                        ✓
                    </div>

                    <div>

                        <span>
                            Status Sistem
                        </span>

                        <strong>
                            Sistem Siaga
                        </strong>

                    </div>

                </div>


                <div class="status-card">

                    <div class="status-icon red">
                        🚨
                    </div>

                    <div>

                        <span>
                            Panic Aktif
                        </span>

                        <strong id="publicPanicCount">
                            0 Kejadian
                        </strong>

                    </div>

                </div>


                <div class="status-card">

                    <div class="status-icon blue">
                        ●
                    </div>

                    <div>

                        <span>
                            Monitoring
                        </span>

                        <strong>
                            Aktif 24 Jam
                        </strong>

                    </div>

                </div>

            </div>

        </section>



        {{-- =====================================================
             KEJADIAN PANIC PUBLIK
        ====================================================== --}}

        <section
            id="kejadian"
            class="incident-section"
        >

            <div class="section-header">

                <span>
                    MONITORING PUBLIK
                </span>

                <h2>
                    Panic Publik Aktif
                </h2>

                <p>
                    Kejadian panic button yang sedang
                    berlangsung akan muncul di sini.
                </p>

            </div>


            <div
                id="publicPanicAlert"
                class="live-box"
            >

                <div class="live-empty">

                    <div class="empty-icon">
                        🚨
                    </div>

                    <strong>
                        Tidak ada panic publik aktif
                    </strong>

                    <span>
                        Sistem sedang memantau kondisi secara realtime.
                    </span>

                </div>

            </div>

        </section>



        {{-- =====================================================
             INFORMASI
        ====================================================== --}}

        <section
            id="tentang"
            class="info-section"
        >

            <div class="info-card">

                <div class="info-content">

                    <span>
                        TENTANG SISTEM
                    </span>

                    <h2>
                        Satu sistem untuk
                        keamanan yang lebih cepat.
                    </h2>

                    <p>
                        Panic Button merupakan sistem monitoring
                        keamanan yang membantu menyampaikan
                        informasi kejadian darurat secara cepat
                        kepada pihak yang bertanggung jawab.
                    </p>

                </div>


                <div class="info-features">

                    <div>
                        <strong>
                            01
                        </strong>

                        <span>
                            Laporan Darurat
                        </span>
                    </div>


                    <div>
                        <strong>
                            02
                        </strong>

                        <span>
                            Monitoring Realtime
                        </span>
                    </div>


                    <div>
                        <strong>
                            03
                        </strong>

                        <span>
                            Riwayat Kejadian
                        </span>
                    </div>

                </div>

            </div>

        </section>

    </main>



    {{-- =====================================================
         FOOTER
    ====================================================== --}}

    <footer class="landing-footer">

        <div>

            <strong>
                Panic Button
            </strong>

            <span>
                Public Safety Monitoring System
            </span>

        </div>


        <div>

            © {{ date('Y') }} Panic Button

        </div>

    </footer>

</div>

@endsection

@push('scripts')

<script
    type="module"
    src="{{ asset('js/users/panic-button.js') }}"
></script>
{{-- Monitoring Panic Publik --}}
<script
    type="module"
    src="{{ asset('js/users/public-monitoring.js') }}"
></script>

@endpush