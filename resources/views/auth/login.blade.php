@extends('layouts.auth')

@section('title', 'Login - Panic Button')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/auth/login.css') }}">
@endpush

@section('content')
<main class="login-page">

    <div class="login-container">

        <div class="login-card">

            {{-- Logo Brand --}}
            <div class="login-logo-wrapper">
                <div class="login-logo-circle">
                    <img
                        src="{{ asset('assets/images/lifemedia_logo.png') }}"
                        alt="Panic Button Logo"
                    >
                </div>
            </div>

            {{-- Header Title --}}
            <div class="login-header">
                <span class="login-badge">
                    <i class="fa-solid fa-shield-halved"></i> Panic Button System
                </span>
                <h1>Selamat Datang</h1>
                <p>Masuk ke akun Anda untuk mengakses sistem pemantauan & respon darurat</p>
            </div>

            {{-- Alert Error Validasi --}}
            @if ($errors->any())
                <div class="login-alert login-alert-error">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    <span>{{ $errors->first() }}</span>
                </div>
            @endif

            {{-- Alert Error dari Controller --}}
            @if (session('error'))
                <div class="login-alert login-alert-error">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    <span>{{ session('error') }}</span>
                </div>
            @endif

            {{-- Alert Success --}}
            @if (session('success'))
                <div class="login-alert login-alert-success">
                    <i class="fa-solid fa-circle-check"></i>
                    <span>{{ session('success') }}</span>
                </div>
            @endif

            {{-- Form Login --}}
            <form
                action="{{ route('login.process') }}"
                method="POST"
                class="login-form"
            >
                @csrf

                {{-- Email Input --}}
                <div class="form-group">
                    <label for="email">
                        Alamat Email
                    </label>
                    <div class="input-icon-wrapper">
                        <i class="fa-solid fa-envelope input-leading-icon"></i>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            class="form-input"
                            value="{{ old('email') }}"
                            placeholder="nama@email.com"
                            autocomplete="email"
                            required
                        >
                    </div>
                </div>

                {{-- Password Input --}}
                <div class="form-group">
                    <label for="password">
                        Kata Sandi
                    </label>
                    <div class="input-icon-wrapper">
                        <i class="fa-solid fa-lock input-leading-icon"></i>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            class="form-input"
                            placeholder="Masukkan kata sandi Anda"
                            autocomplete="current-password"
                            required
                        >
                        <button
                            type="button"
                            class="btn-toggle-password"
                            id="togglePasswordBtn"
                            title="Tampilkan / Sembunyikan Kata Sandi"
                            aria-label="Tampilkan atau sembunyikan kata sandi"
                        >
                            <i class="fa-solid fa-eye" id="togglePasswordIcon"></i>
                        </button>
                    </div>
                </div>

                {{-- Submit Button --}}
                <button
                    type="submit"
                    class="btn-login"
                >
                    <i class="fa-solid fa-right-to-bracket"></i>
                    <span>Masuk ke Akun</span>
                </button>
            </form>

            {{-- Register Section --}}
            <div class="register-section">
                <span>Belum memiliki akun?</span>
                <a href="{{ route('register') }}" class="register-link">
                    <span>Daftar sebagai User Publik</span>
                    <i class="fa-solid fa-arrow-right"></i>
                </a>
            </div>

            {{-- Kembali ke Beranda Publik --}}
            <div class="back-section">
                <a href="{{ route('landing') }}" class="back-link">
                    <i class="fa-solid fa-arrow-left"></i>
                    <span>Kembali ke Halaman Publik</span>
                </a>
            </div>

        </div>

    </div>

</main>
@endsection

@push('scripts')
<script>
    document.addEventListener('DOMContentLoaded', function () {
        const toggleBtn = document.getElementById('togglePasswordBtn');
        const passwordInput = document.getElementById('password');
        const toggleIcon = document.getElementById('togglePasswordIcon');

        if (toggleBtn && passwordInput && toggleIcon) {
            toggleBtn.addEventListener('click', function () {
                const isPassword = passwordInput.getAttribute('type') === 'password';
                passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
                
                if (isPassword) {
                    toggleIcon.classList.remove('fa-eye');
                    toggleIcon.classList.add('fa-eye-slash');
                } else {
                    toggleIcon.classList.remove('fa-eye-slash');
                    toggleIcon.classList.add('fa-eye');
                }
            });
        }
    });
</script>
@endpush