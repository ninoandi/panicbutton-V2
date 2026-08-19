@extends('layouts.auth')

@section('title', 'Login - Panic Button')


@push('styles')

    <link
        rel="stylesheet"
        href="{{ asset('css/auth/login.css') }}"
    >

@endpush


@section('content')

<main class="login-page">

    <div class="login-container">

        <div class="login-card">

            {{-- Logo --}}
            <div class="login-logo">

                <img
                    src="{{ asset('assets/images/lifemedia_logo.png') }}"
                    alt="Panic Button"
                >

            </div>


            {{-- Header --}}
            <div class="login-header">

                <h1>
                    Login
                </h1>

                <p>
                    Masuk ke sistem Panic Button
                </p>

            </div>


            {{-- Error Validasi --}}
            @if ($errors->any())

                <div class="login-alert login-alert-error">

                    {{ $errors->first() }}

                </div>

            @endif


            {{-- Error dari Controller --}}
            @if (session('error'))

                <div class="login-alert login-alert-error">

                    {{ session('error') }}

                </div>

            @endif


            {{-- Success --}}
            @if (session('success'))

                <div class="login-alert login-alert-success">

                    {{ session('success') }}

                </div>

            @endif


            {{-- Form Login --}}
            <form
                action="{{ route('login.process') }}"
                method="POST"
                class="login-form"
            >

                @csrf


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
                        autocomplete="email"
                        required
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
                        placeholder="Masukkan password"
                        autocomplete="current-password"
                        required
                    >

                </div>


                {{-- Login --}}
                <button
                    type="submit"
                    class="btn-login"
                >
                    Login
                </button>

            </form>


            {{-- Register --}}
            <div class="register-section">

                <span>
                    Belum memiliki akun?
                </span>

                <a href="{{ route('register') }}">
                    Daftar sebagai User Publik
                </a>

            </div>


            {{-- Kembali --}}
            <div class="back-section">

                <a href="{{ route('landing') }}">
                    ← Kembali ke Panic Publik
                </a>

            </div>

        </div>

    </div>

</main>

@endsection