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


            @if ($errors->any())

                <div class="register-alert register-alert-error">

                    {{ $errors->first() }}

                </div>

            @endif


            <form
                action="{{ route('register.process') }}"
                method="POST"
                class="register-form"
            >

                @csrf


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
                    >

                </div>


                <div class="form-group">

                    <label for="username">
                        Username
                    </label>

                    <input
                        type="text"
                        id="username"
                        name="username"
                        value="{{ old('username') }}"
                        placeholder="Masukkan username"
                        required
                    >

                </div>


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
                    >

                </div>


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
                    >

                </div>


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
                    >

                </div>


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
                    >

                </div>


                <button
                    type="submit"
                    class="btn-register"
                >
                    Daftar
                </button>

            </form>


            <div class="login-section">

                <span>
                    Sudah memiliki akun?
                </span>

                <a href="{{ route('login') }}">
                    Login
                </a>

            </div>


            <div class="back-section">

                <a href="{{ route('landing') }}">
                    ← Kembali ke Panic Publik
                </a>

            </div>

        </div>

    </div>

</main>

@endsection