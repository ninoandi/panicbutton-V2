@extends('layouts.auth')

@section('title', 'Daftar Akun - Panic Button')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/auth/register.css') }}">
@endpush

@section('content')
<main class="register-page">

    <div class="register-container">

        <div class="register-card">

            {{-- Logo Brand --}}
            <div class="register-logo-wrapper">
                <div class="register-logo-circle">
                    <img
                        src="{{ asset('assets/images/lifemedia_logo.png') }}"
                        alt="Panic Button Logo"
                    >
                </div>
            </div>

            {{-- Header Title --}}
            <div class="register-header">
                <span class="register-badge">
                    Panic Button System
                </span>
                <h1>Buat Akun Baru</h1>
                <p>Daftar akun publik untuk mengakses layanan pemantauan & tombol darurat</p>
            </div>

            {{-- Alert Error Validasi --}}
            @if ($errors->any())
                <div class="register-alert register-alert-error">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    <span>{{ $errors->first() }}</span>
                </div>
            @endif

            {{-- Alert Error dari Controller --}}
            @if (session('error'))
                <div class="register-alert register-alert-error">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    <span>{{ session('error') }}</span>
                </div>
            @endif

            {{-- Alert Success --}}
            @if (session('success'))
                <div class="register-alert register-alert-success">
                    <i class="fa-solid fa-circle-check"></i>
                    <span>{{ session('success') }}</span>
                </div>
            @endif

            {{-- Form Register --}}
            <form
                action="{{ route('register.process') }}"
                method="POST"
                class="register-form"
                id="registerForm"
                novalidate
            >
                @csrf

                {{-- Nama Lengkap --}}
                <div class="form-group">
                    <label for="name">
                        <span>Nama Lengkap</span>
                        <span class="required-star">*</span>
                    </label>
                    <div class="input-icon-wrapper">
                        <i class="fa-solid fa-user input-leading-icon"></i>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            class="form-input no-trailing-icon"
                            value="{{ old('name') }}"
                            placeholder="Masukkan nama lengkap Anda"
                            autocomplete="name"
                            required
                        >
                    </div>
                </div>

                {{-- Alamat Email --}}
                <div class="form-group">
                    <label for="email">
                        <span>Alamat Email</span>
                        <span class="required-star">*</span>
                    </label>
                    <div class="input-icon-wrapper">
                        <i class="fa-solid fa-envelope input-leading-icon"></i>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            class="form-input no-trailing-icon"
                            value="{{ old('email') }}"
                            placeholder="nama@gmail.com"
                            autocomplete="email"
                            required
                        >
                    </div>
                </div>

                {{-- Nomor HP / WhatsApp --}}
                <div class="form-group">
                    <label for="phone">
                        <span>Nomor HP (WhatsApp)</span>
                        <span class="required-star">*</span>
                    </label>
                    <div class="input-icon-wrapper">
                        <i class="fa-solid fa-phone input-leading-icon"></i>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            class="form-input no-trailing-icon"
                            value="{{ old('phone') }}"
                            placeholder="08xxxxxxxxxx (10-13 digit angka)"
                            maxlength="13"
                            autocomplete="tel"
                            required
                        >
                    </div>
                    <span class="input-hint" id="phoneHint">Format: 10 hingga 13 digit angka</span>
                </div>

                {{-- Password Input --}}
                <div class="form-group">
                    <label for="password">
                        <span>Kata Sandi</span>
                        <span class="required-star">*</span>
                    </label>
                    <div class="input-icon-wrapper">
                        <i class="fa-solid fa-lock input-leading-icon"></i>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            class="form-input"
                            placeholder="Minimal 6 karakter, 1 huruf besar & 1 angka"
                            autocomplete="new-password"
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

                    {{-- Password Rules Checklist --}}
                    <div class="password-rules-box">
                        <span class="rule-badge" id="ruleLength">
                            <i class="fa-solid fa-circle-notch"></i> Min. 6 Karakter
                        </span>
                        <span class="rule-badge" id="ruleUppercase">
                            <i class="fa-solid fa-circle-notch"></i> 1 Huruf Besar (A-Z)
                        </span>
                        <span class="rule-badge" id="ruleNumber">
                            <i class="fa-solid fa-circle-notch"></i> 1 Angka (0-9)
                        </span>
                    </div>
                </div>

                {{-- Konfirmasi Password --}}
                <div class="form-group">
                    <label for="password_confirmation">
                        <span>Konfirmasi Kata Sandi</span>
                        <span class="required-star">*</span>
                    </label>
                    <div class="input-icon-wrapper">
                        <i class="fa-solid fa-shield-halved input-leading-icon"></i>
                        <input
                            type="password"
                            id="password_confirmation"
                            name="password_confirmation"
                            class="form-input"
                            placeholder="Ulangi kata sandi Anda"
                            autocomplete="new-password"
                            required
                        >
                        <button
                            type="button"
                            class="btn-toggle-password"
                            id="toggleConfirmPasswordBtn"
                            title="Tampilkan / Sembunyikan Konfirmasi Kata Sandi"
                            aria-label="Tampilkan atau sembunyikan konfirmasi kata sandi"
                        >
                            <i class="fa-solid fa-eye" id="toggleConfirmPasswordIcon"></i>
                        </button>
                    </div>
                </div>

                {{-- Submit Button --}}
                <button
                    type="submit"
                    class="btn-register"
                    id="btnSubmitRegister"
                >
                    <span>Daftar Sekarang</span>
                </button>
            </form>

            {{-- Login Section --}}
            <div class="login-section">
                <span>Sudah memiliki akun?</span>
                <a href="{{ route('login') }}" class="login-link">
                    <span>Login di Sini</span>
                </a>
            </div>

            {{-- Kembali ke Beranda Publik --}}
            <div class="back-section">
                <a href="{{ route('landing') }}" class="back-link">
                    <span>Kembali ke Beranda</span>
                </a>
            </div>

        </div>

    </div>

</main>
@endsection

@push('scripts')
<script>
    document.addEventListener('DOMContentLoaded', function () {
        // 1. Toggle Password Visibility
        const togglePasswordBtn = document.getElementById('togglePasswordBtn');
        const passwordInput = document.getElementById('password');
        const togglePasswordIcon = document.getElementById('togglePasswordIcon');

        if (togglePasswordBtn && passwordInput && togglePasswordIcon) {
            togglePasswordBtn.addEventListener('click', function () {
                const isPassword = passwordInput.getAttribute('type') === 'password';
                passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
                
                if (isPassword) {
                    togglePasswordIcon.classList.remove('fa-eye');
                    togglePasswordIcon.classList.add('fa-eye-slash');
                } else {
                    togglePasswordIcon.classList.remove('fa-eye-slash');
                    togglePasswordIcon.classList.add('fa-eye');
                }
            });
        }

        // 2. Toggle Confirm Password Visibility
        const toggleConfirmBtn = document.getElementById('toggleConfirmPasswordBtn');
        const confirmPasswordInput = document.getElementById('password_confirmation');
        const toggleConfirmIcon = document.getElementById('toggleConfirmPasswordIcon');

        if (toggleConfirmBtn && confirmPasswordInput && toggleConfirmIcon) {
            toggleConfirmBtn.addEventListener('click', function () {
                const isPassword = confirmPasswordInput.getAttribute('type') === 'password';
                confirmPasswordInput.setAttribute('type', isPassword ? 'text' : 'password');
                
                if (isPassword) {
                    toggleConfirmIcon.classList.remove('fa-eye');
                    toggleConfirmIcon.classList.add('fa-eye-slash');
                } else {
                    toggleConfirmIcon.classList.remove('fa-eye-slash');
                    toggleConfirmIcon.classList.add('fa-eye');
                }
            });
        }

        // 3. Sanitasi Nomor HP: Hanya Angka & Batas 13 Karakter
        const phoneInput = document.getElementById('phone');
        const phoneHint = document.getElementById('phoneHint');

        if (phoneInput) {
            phoneInput.addEventListener('input', function () {
                // Hapus karakter selain angka
                let cleaned = this.value.replace(/\D/g, '');
                if (cleaned.length > 13) {
                    cleaned = cleaned.substring(0, 13);
                }
                this.value = cleaned;

                // Live Validation Hint
                if (cleaned.length > 0 && cleaned.length < 10) {
                    phoneHint.textContent = `Nomor HP masih kurang (${cleaned.length}/10-13 digit)`;
                    phoneHint.style.color = '#dc2626';
                } else if (cleaned.length >= 10 && cleaned.length <= 13) {
                    phoneHint.textContent = `Nomor HP valid (${cleaned.length} digit)`;
                    phoneHint.style.color = '#10b981';
                } else {
                    phoneHint.textContent = 'Format: 10 hingga 13 digit angka';
                    phoneHint.style.color = 'var(--auth-text-muted)';
                }
            });
        }

        // 4. Realtime Password Requirements Checklist
        const ruleLength = document.getElementById('ruleLength');
        const ruleUppercase = document.getElementById('ruleUppercase');
        const ruleNumber = document.getElementById('ruleNumber');

        if (passwordInput && ruleLength && ruleUppercase && ruleNumber) {
            passwordInput.addEventListener('input', function () {
                const val = this.value;

                // Rule 1: Min 6 Karakter
                if (val.length >= 6) {
                    ruleLength.className = 'rule-badge valid';
                    ruleLength.innerHTML = '<i class="fa-solid fa-check"></i> Min. 6 Karakter';
                } else {
                    ruleLength.className = 'rule-badge';
                    ruleLength.innerHTML = '<i class="fa-solid fa-circle-notch"></i> Min. 6 Karakter';
                }

                // Rule 2: 1 Huruf Besar
                if (/[A-Z]/.test(val)) {
                    ruleUppercase.className = 'rule-badge valid';
                    ruleUppercase.innerHTML = '<i class="fa-solid fa-check"></i> 1 Huruf Besar (A-Z)';
                } else {
                    ruleUppercase.className = 'rule-badge';
                    ruleUppercase.innerHTML = '<i class="fa-solid fa-circle-notch"></i> 1 Huruf Besar (A-Z)';
                }

                // Rule 3: 1 Angka
                if (/[0-9]/.test(val)) {
                    ruleNumber.className = 'rule-badge valid';
                    ruleNumber.innerHTML = '<i class="fa-solid fa-check"></i> 1 Angka (0-9)';
                } else {
                    ruleNumber.className = 'rule-badge';
                    ruleNumber.innerHTML = '<i class="fa-solid fa-circle-notch"></i> 1 Angka (0-9)';
                }
            });
        }

        // 5. Client Form Submit Pre-Validation Check
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', function (e) {
                const emailInput = document.getElementById('email');
                const emailVal = (emailInput ? emailInput.value : '').trim();
                const phoneVal = (phoneInput ? phoneInput.value : '').trim();
                const passVal = (passwordInput ? passwordInput.value : '');
                const confirmVal = (confirmPasswordInput ? confirmPasswordInput.value : '');

                // Simple Email Regex check
                const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                if (!emailRegex.test(emailVal)) {
                    e.preventDefault();
                    Swal.fire({
                        icon: 'warning',
                        title: 'Format Email Tidak Valid',
                        text: 'Pastikan memasukkan alamat email yang valid (contoh: user@gmail.com).',
                        confirmButtonColor: '#2563eb'
                    });
                    return;
                }

                // Phone Length Check
                if (phoneVal.length < 10 || phoneVal.length > 13) {
                    e.preventDefault();
                    Swal.fire({
                        icon: 'warning',
                        title: 'Nomor HP Tidak Valid',
                        text: 'Nomor HP harus berupa angka dengan panjang antara 10 sampai 13 digit.',
                        confirmButtonColor: '#2563eb'
                    });
                    return;
                }

                // Password Check
                if (passVal.length < 6 || !/[A-Z]/.test(passVal) || !/[0-9]/.test(passVal)) {
                    e.preventDefault();
                    Swal.fire({
                        icon: 'warning',
                        title: 'Kata Sandi Belum Memenuhi Syarat',
                        text: 'Kata sandi harus memiliki minimal 6 karakter, mengandung minimal 1 huruf besar (A-Z), dan 1 angka (0-9).',
                        confirmButtonColor: '#2563eb'
                    });
                    return;
                }

                // Password Confirmation Match
                if (passVal !== confirmVal) {
                    e.preventDefault();
                    Swal.fire({
                        icon: 'warning',
                        title: 'Konfirmasi Kata Sandi Berbeda',
                        text: 'Konfirmasi kata sandi tidak cocok dengan kata sandi yang Anda masukkan.',
                        confirmButtonColor: '#2563eb'
                    });
                    return;
                }
            });
        }
    });
</script>
@endpush