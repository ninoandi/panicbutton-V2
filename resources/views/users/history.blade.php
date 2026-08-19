@extends('layouts.user')

@section('title', 'Riwayat Laporan - Panic Button')

@section('page-title', 'Riwayat Laporan')


@push('styles')

<link
    rel="stylesheet"
    href="{{ asset('css/users/history.css') }}"
>

@endpush


@section('content')

<div class="history-page">


    <section class="dashboard-card">

        <div class="card-header">

            <div>

                <h2>
                    Riwayat Laporan
                </h2>

                <p>
                    Daftar seluruh laporan Panic Button Anda.
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
    src="{{ asset('js/users/history.js') }}"
></script>

@endpush