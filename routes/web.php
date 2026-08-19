<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;


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
|
| Login dan register digunakan oleh user publik.
| Admin juga login melalui halaman login yang sama.
|
*/

Route::get('/login', [
    AuthController::class,
    'showLogin'
])->name('login');


Route::post('/login', [
    AuthController::class,
    'login'
])->name('login.process');


Route::get('/register', [
    AuthController::class,
    'showRegister'
])->name('register');


Route::post('/register', [
    AuthController::class,
    'register'
])->name('register.process');


Route::post('/logout', [
    AuthController::class,
    'logout'
])->name('logout');



/*
|--------------------------------------------------------------------------
| DASHBOARD ADMIN
|--------------------------------------------------------------------------
|
| Hanya role = admin yang boleh masuk.
|
*/

Route::middleware(['user.auth', 'role:admin'])->group(function () {


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
    | RIWAYAT
    |--------------------------------------------------------------------------
    */

    Route::get('/riwayat', function () {

        return view('riwayat.index');

    })->name('riwayat');



    /*
    |--------------------------------------------------------------------------
    | PROFIL
    |--------------------------------------------------------------------------
    */

    Route::get('/profil', function () {

        return view('profil.index');

    })->name('profil');



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
    | IOT
    |--------------------------------------------------------------------------
    */

    Route::get('/iot', function () {

        return view('iot.index');

    })->name('monitoring-iot');

});



/*
|--------------------------------------------------------------------------
| USER PUBLIK
|--------------------------------------------------------------------------
|
| Hanya role = user yang boleh masuk.
|
*/

Route::middleware(['user.auth', 'role:user'])
    ->prefix('user')
    ->name('user.')
    ->group(function () {


        /*
        |--------------------------------------------------------------------------
        | DASHBOARD USER
        |--------------------------------------------------------------------------
        */

        Route::view(
            '/dashboard',
            'users.index'
        )->name('dashboard');



        /*
        |--------------------------------------------------------------------------
        | PANIC BUTTON
        |--------------------------------------------------------------------------
        */

        Route::view(
            '/panic',
            'users.panic'
        )->name('panic');



        /*
        |--------------------------------------------------------------------------
        | RIWAYAT LAPORAN
        |--------------------------------------------------------------------------
        */

        Route::view(
            '/history',
            'users.history'
        )->name('history');



        /*
        |--------------------------------------------------------------------------
        | PROFIL USER
        |--------------------------------------------------------------------------
        */

        Route::view(
            '/profile',
            'users.profil'
        )->name('profile');

    });