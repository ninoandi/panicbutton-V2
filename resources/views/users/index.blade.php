    @extends('layouts.user')

    @section('title', 'Dashboard - Panic Button')

    @section('page-title', 'Dashboard')


    @push('styles')

    <link
        rel="stylesheet"
        href="{{ asset('css/users/dashboard.css') }}"
    >

    @endpush


    @section('content')

    <div class="dashboard-page">


        {{-- Welcome --}}
        <section class="welcome-card">

            <div>

                <span>
                    Selamat datang
                </span>

                <h2>
                    {{ session('web_user_name', 'User') }}
                </h2>

                <p>
                    Gunakan Panic Button ketika membutuhkan bantuan.
                </p>

            </div>


            <a
                href="{{ route('user.panic') }}"
                class="btn-panic"
            >
            <i class="fa-solid fa-triangle-exclamation"></i>
                Kirim Panic
            </a>

        </section>



        {{-- Statistik --}}
        <section class="dashboard-stats">


            <div class="stat-card">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <div>

                    <span>
                        Laporan Aktif
                    </span>

                    <strong id="activeReportCount">
                        0
                    </strong>

                </div>

            </div>


            <div class="stat-card">

                <i class="fa-solid fa-clipboard-list"></i>

                <div>

                    <span>
                        Total Laporan
                    </span>

                    <strong id="totalReportCount">
                        0
                    </strong>

                </div>

            </div>


            <div class="stat-card">

                <i class="fa-solid fa-check-circle"></i>

                <div>

                    <span>
                        Selesai
                    </span>

                    <strong id="completedReportCount">
                        0
                    </strong>

                </div>

            </div>


        </section>



        {{-- Status Panic --}}
        <section class="dashboard-card">

            <div class="card-header">

                <div>

                    <h2>
                        Status Panic Button
                    </h2>

                    <p>
                        Status laporan Anda saat ini
                    </p>

                </div>


                <span
                    id="activeStatusBadge"
                    class="status-badge status-none"
                >
                    Tidak Ada
                </span>

            </div>


            <div id="activeReportContainer">

                <div class="empty-state">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                    <h3>
                        Tidak ada laporan aktif
                    </h3>

                    <p>
                        Saat ini tidak ada laporan Panic Button yang aktif.
                    </p>

                    <a
                        href="{{ route('user.panic') }}"
                        class="btn-primary"
                    >
                        Kirim Panic
                    </a>

                </div>

            </div>

        </section>



        {{-- Menu cepat --}}
        <section class="quick-menu">

            <a
                href="{{ route('user.panic') }}"
                class="quick-card"
            >

                <i class="fa-solid fa-triangle-exclamation"></i>

                <strong>
                    Panic Button
                </strong>

                <small>
                    Kirim laporan darurat
                </small>

            </a>


            <a
                href="{{ route('user.history') }}"
                class="quick-card"
            >

                <i class="fa-solid fa-clipboard-list"></i>

                <strong>
                    Riwayat Laporan
                </strong>

                <small>
                    Lihat laporan sebelumnya
                </small>

            </a>


            <a
                href="{{ route('user.profile') }}"
                class="quick-card"
            >

                <i class="fa-solid fa-user"></i>

                <strong>
                    Profil
                </strong>

                <small>
                    Kelola informasi akun
                </small>

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


    <script
        type="module"
        src="{{ asset('js/users/dashboard.js') }}"
    ></script>

    @endpush