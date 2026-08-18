@extends('layouts.auth')

@section('title', 'Register - Panic Button Publik')

@push('styles')

<link
    rel="stylesheet"
    href="{{ asset('css/auth.css') }}"
>

@endpush


@section('content')

<div class="auth-page">

    <div class="auth-card">

        <div class="auth-header">

            <img
                src="{{ asset('assets/images/lifemedia_logo.png') }}"
                alt="Life Media"
                class="auth-logo"
            >

            <h1>
                Daftar
            </h1>

            <p>
                Akun Panic Button Publik
            </p>

        </div>


        {{-- Error --}}
        @if(session('error'))

            <div class="auth-alert auth-alert-error">

                {{ session('error') }}

            </div>

        @endif


        @if($errors->any())

            <div class="auth-alert auth-alert-error">

                {{ $errors->first() }}

            </div>

        @endif


        {{-- Register Form --}}
        <form
            action="{{ route('register.process') }}"
            method="POST"
        >

            @csrf


            {{-- Nama --}}
            <div class="form-group">

                <label for="nama">
                    Nama
                </label>

                <input
                    type="text"
                    id="nama"
                    name="nama"
                    value="{{ old('nama') }}"
                    placeholder="Masukkan nama"
                    required
                >

            </div>


            {{-- Username --}}
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
                >

            </div>


            <button
                type="submit"
                class="btn-auth"
            >

                Daftar

            </button>

        </form>


        <div class="auth-footer">

            <span>
                Sudah memiliki akun?
            </span>

            <a href="{{ route('login') }}">
                Login
            </a>

        </div>

    </div>

</div>

@endsection