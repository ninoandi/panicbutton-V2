@extends('layouts.auth')

@section('title', 'Login - Panic Button')

@push('styles')

<link
    rel="stylesheet"
    href="{{ asset('css/auth.css') }}"
>

@endpush


@section('content')

<div class="auth-page">

    <div class="auth-card">

        {{-- Logo --}}
        <div class="auth-header">

            <img
                src="{{ asset('assets/images/lifemedia_logo.png') }}"
                alt="Life Media"
                class="auth-logo"
            >

            <h1>
                Panic Button
            </h1>

            <p>
                Web Monitoring
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


        {{-- Login Form --}}
        <form
            action="{{ route('login.process') }}"
            method="POST"
        >

            @csrf


            {{-- Username --}}
            <div class="form-group">

                <label for="username">
                    Username / Email
                </label>

                <input
                    type="text"
                    id="username"
                    name="username"
                    value="{{ old('username') }}"
                    placeholder="Masukkan username atau email"
                    autocomplete="username"
                    required
                    autofocus
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


            {{-- Button --}}
            <button
                type="submit"
                class="btn-auth"
            >

                Masuk

            </button>

        </form>


        {{-- Register --}}
        <div class="auth-footer">

            <span>
                Belum memiliki akun?
            </span>

            <a href="{{ route('register') }}">
                Daftar User Publik
            </a>

        </div>

    </div>

</div>

@endsection