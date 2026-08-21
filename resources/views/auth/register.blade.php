@extends('layouts.auth')

@section('title', 'Register - Panic Button')


@push('styles')

<link
    rel="stylesheet"
    href="{{ asset('css/auth/register.css') }}"
>

@endpush


@section('content')

<main class="register-page">

    <div class="register-container">

        <div class="register-card">

            <div class="register-header">

                <h1>
                    Daftar
                </h1>

                <p>
                    Buat akun Panic Button Publik
                </p>

            </div>


            {{-- Error --}}
            @if ($errors->any())

                <div class="register-alert register-alert-error">

                    {{ $errors->first() }}

                </div>

            @endif


            {{-- Success --}}
            @if (session('success'))

                <div class="register-alert register-alert-success">

                    {{ session('success') }}

                </div>

            @endif


            <form
                action="{{ route('register.process') }}"
                method="POST"
                class="register-form"
            >

                @csrf


                {{-- Nama --}}
                <div class="form-group">

                    <label for="name">
                        Nama
                    </label>

                    <input
                        type="text"
                        id="name"
                        name="name"
                        value="{{ old('name') }}"
                        placeholder="Masukkan nama"
                        required
                        autocomplete="name"
                    >

                </div>


                {{-- Email --}}
                <div class="form-group">

                    <label for="email">
                        Email
                    </label>

                    <input
                        type="email"
                        id="email"
                        name="email"
                        value="{{ old('email') }}"
                        placeholder="Masukkan email"
                        required
                        autocomplete="email"
                    >

                </div>


                {{-- Nomor HP --}}
                <div class="form-group">

                    <label for="phone">
                        Nomor HP
                    </label>

                    <input
                        type="text"
                        id="phone"
                        name="phone"
                        value="{{ old('phone') }}"
                        placeholder="Masukkan nomor HP"
                        autocomplete="tel"
                    >

                </div>


                {{-- Password --}}
                <div class="form-group">

                    <label for="password">
                        Password
                    </label>

                    <input
                        type="password"
                        id="password"
                        name="password"
                        placeholder="Minimal 6 karakter"
                        required
                        autocomplete="new-password"
                    >

                </div>


                {{-- Konfirmasi Password --}}
                <div class="form-group">

                    <label for="password_confirmation">
                        Konfirmasi Password
                    </label>

                    <input
                        type="password"
                        id="password_confirmation"
                        name="password_confirmation"
                        placeholder="Ulangi password"
                        required
                        autocomplete="new-password"
                    >

                </div>


                {{-- Tombol Register --}}
                <button
                    type="submit"
                    class="btn-register"
                >
                    Daftar
                </button>

            </form>


            {{-- Login --}}
            <div class="login-section">

                <span>
                    Sudah memiliki akun?
                </span>

                <a href="{{ route('login') }}">
                    Login
                </a>

            </div>


            {{-- Kembali --}}
            <div class="back-section">

                <a href="{{ route('landing') }}">
                    ← Kembali ke Beranda
                </a>

            </div>

        </div>

    </div>

</main>

@endsection