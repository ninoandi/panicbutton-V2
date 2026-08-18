<?php

use Illuminate\Support\Facades\Route;


/*
|--------------------------------------------------------------------------
| LANDING PAGE
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return view('landing.index');
})->name('landing');


/*
|--------------------------------------------------------------------------
| AUTH
|--------------------------------------------------------------------------
| Sementara menuju halaman login.
| Nanti kita ganti menggunakan AuthController.
|--------------------------------------------------------------------------
*/

Route::get('/login', function () {
    return view('auth.login');
})->name('login');

Route::get('/register', function () {
    return view('auth.register');
})->name('register');


/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
*/

Route::get('/dashboard', function () {
    return view('dashboard.index');
})->name('dashboard');


/*
|--------------------------------------------------------------------------
| PERUMAHAN
|--------------------------------------------------------------------------
*/

Route::get('/perumahan', function () {
    return view('perumahan.index');
})->name('perumahan');


Route::get('/detail-perumahan', function () {

    $key = request()->query('key');

    return view('perumahan.detail', [
        'key' => $key
    ]);

})->name('perumahan.detail');


/*
|--------------------------------------------------------------------------
| STATISTIK
|--------------------------------------------------------------------------
*/

Route::get('/statistik', function () {
    return view('statistik.index');
})->name('statistik');


Route::get('/detail-grafik', function () {
    return view('statistik.detail');
})->name('detail-grafik');


/*
|--------------------------------------------------------------------------
| MANAJEMEN USER
|--------------------------------------------------------------------------
*/

Route::get('/manajemen-user', function () {
    return view('manajemen-user.index');
})->name('manajemen-user');


/*
|--------------------------------------------------------------------------
| IOT / MONITORING
|--------------------------------------------------------------------------
*/

Route::get('/iot', function () {
    return view('iot.index');
})->name('monitoring-iot');