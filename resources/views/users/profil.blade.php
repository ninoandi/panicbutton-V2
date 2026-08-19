@extends('layouts.user')

@section('title', 'Profil - Panic Button')

@section('page-title', 'Profil')


@push('styles')

<link
    rel="stylesheet"
    href="{{ asset('css/users/profile.css') }}"
>

@endpush


@section('content')

<div class="profile-page">


    <section class="profile-card">

        <div class="profile-header">

            <div class="profile-avatar">

                {{ strtoupper(substr(session('web_user_name', 'U'), 0, 1)) }}

            </div>


            <div>

                <h2>
                    {{ session('web_user_name', '-') }}
                </h2>

                <span>
                    User Publik
                </span>

            </div>

        </div>


        <div class="profile-data">


            <div class="profile-item">

                <span>
                    Nama
                </span>

                <strong>
                    {{ session('web_user_name', '-') }}
                </strong>

            </div>


            <div class="profile-item">

                <span>
                    Email
                </span>

                <strong>
                    {{ session('web_user_email', '-') }}
                </strong>

            </div>


            <div class="profile-item">

                <span>
                    Nomor Telepon
                </span>

                <strong>
                    {{ session('web_user_phone', '-') }}
                </strong>

            </div>


        </div>

    </section>


</div>

@endsection