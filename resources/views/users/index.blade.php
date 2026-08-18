@extends('layouts.auth')

@section('title', 'Dashboard User - Panic Button')


@push('styles')

    <link
        rel="stylesheet"
        href="{{ asset('css/users/dashboard.css') }}"
    >

@endpush


@section('content')

<div class="user-dashboard">


    {{-- =========================================================
        HEADER
    ========================================================== --}}

    <header class="dashboard-header">

        <div class="header-info">

            <h1>
                Dashboard
            </h1>

            <p>
                Selamat datang,
                <strong>
                    {{ session('web_user_name', session('web_username', 'User')) }}
                </strong>
            </p>

        </div>


        <form
            action="{{ route('logout') }}"
            method="POST"
        >

            @csrf

            <button
                type="submit"
                class="btn-logout"
            >
                Logout
            </button>

        </form>

    </header>



    {{-- =========================================================
        DATA AKUN
    ========================================================== --}}

    <section class="dashboard-card account-card">

        <div class="card-header">

            <div>

                <h2>
                    Data Akun
                </h2>

                <p>
                    Informasi akun Anda
                </p>

            </div>

        </div>


        <div class="account-grid">


            <div class="account-item">

                <span class="account-label">
                    Nama
                </span>

                <strong id="userName">
                    {{ session('web_user_name', '-') }}
                </strong>

            </div>


            <div class="account-item">

                <span class="account-label">
                    Username
                </span>

                <strong id="userUsername">
                    {{ session('web_username', '-') }}
                </strong>

            </div>


            <div class="account-item">

                <span class="account-label">
                    Email
                </span>

                <strong id="userEmail">
                    {{ session('web_user_email', '-') }}
                </strong>

            </div>


            <div class="account-item">

                <span class="account-label">
                    No. Telepon
                </span>

                <strong id="userPhone">
                    {{ session('web_user_phone', '-') }}
                </strong>

            </div>


        </div>

    </section>



    {{-- =========================================================
        STATUS LAPORAN AKTIF
    ========================================================== --}}

    <section class="dashboard-card active-report-card">

        <div class="card-header">

            <div>

                <h2>
                    Status Laporan Aktif
                </h2>

                <p>
                    Status Panic Button Anda saat ini
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

                <div class="empty-icon">
                    🚨
                </div>

                <h3>
                    Tidak ada laporan aktif
                </h3>

                <p>
                    Belum ada laporan Panic Button yang sedang diproses.
                </p>

            </div>

        </div>

    </section>



    {{-- =========================================================
        RIWAYAT LAPORAN
    ========================================================== --}}

    <section class="dashboard-card history-card">

        <div class="card-header">

            <div>

                <h2>
                    Riwayat Laporan
                </h2>

                <p>
                    Daftar laporan Panic Button Anda
                </p>

            </div>

        </div>


        <div
            id="historyContainer"
            class="history-container"
        >

            <div class="loading-state">
                Memuat riwayat laporan...
            </div>

        </div>

    </section>


</div>

@endsection



{{-- =========================================================
    JAVASCRIPT
========================================================== --}}

@push('scripts')

<script>

    window.currentUser = {

        id: @json(session('web_user_id')),

        username: @json(session('web_username')),

        name: @json(session('web_user_name')),

        email: @json(session('web_user_email')),

        phone: @json(session('web_user_phone'))

    };

    console.log(
        "Current User:",
        window.currentUser
    );

</script>


<script
    type="module"
    src="{{ asset('js/users/dashboard.js') }}"
></script>

@endpush