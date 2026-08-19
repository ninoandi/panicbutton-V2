@extends('layouts.user')

@section('title', 'Panic Button - Panic Button')

@section('page-title', 'Panic Button')


@push('styles')

<link
    rel="stylesheet"
    href="{{ asset('css/users/panic.css') }}"
>

@endpush


@section('content')

<div class="panic-page">


    <section class="panic-card">

        <div class="panic-header">

            <span class="panic-icon">
                🚨
            </span>

            <h2>
                Panic Button
            </h2>

            <p>
                Gunakan tombol ini jika Anda membutuhkan bantuan darurat.
            </p>

        </div>


        <div class="panic-warning">

            <strong>
                ⚠️ Perhatian
            </strong>

            <p>
                Pastikan Anda benar-benar membutuhkan bantuan sebelum
                mengirim laporan Panic Button.
            </p>

        </div>


        <div class="panic-location">

            <label for="location">
                Lokasi Anda
            </label>

            <input
                type="text"
                id="location"
                placeholder="Mendeteksi lokasi..."
                readonly
            >

            <input
                type="hidden"
                id="latitude"
            >

            <input
                type="hidden"
                id="longitude"
            >

        </div>


        <button
            type="button"
            id="panicButton"
            class="panic-button"
        >

            <span>
                🚨
            </span>

            <strong>
                KIRIM PANIC
            </strong>

            <small>
                Tekan untuk mengirim laporan
            </small>

        </button>


        <div
            id="panicStatus"
            class="panic-status"
        >
            Belum ada laporan aktif.
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
    src="{{ asset('js/users/panic-button.js') }}"
></script>

@endpush