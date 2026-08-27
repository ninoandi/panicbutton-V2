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


/*
|--------------------------------------------------------------------------
| API HASH PASSWORD (BCRYPT)
|--------------------------------------------------------------------------
*/
Route::post('/api/hash-password', function (\Illuminate\Http\Request $request) {
    if (!session('web_logged_in')) {
        return response()->json([
            'status' => 'error',
            'message' => 'Sesi tidak valid atau telah berakhir. Silakan login kembali.'
        ], 401);
    }

    $request->validate([
        'password' => ['required', 'string', 'min:6']
    ]);

    return response()->json([
        'status' => 'success',
        'hash' => \Illuminate\Support\Facades\Hash::make($request->password)
    ]);
});



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

Route::middleware(['role:admin'])->group(function () {


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
    | MANAJEMEN ADMIN
    |--------------------------------------------------------------------------
    */

    Route::get('/manajemen-admin', function () {

        return view('manajemen-admin.index');

    })->name('manajemen-admin');



    /*
    |--------------------------------------------------------------------------
    | MANAJEMEN PETUGAS
    |--------------------------------------------------------------------------
    */

    Route::get('/manajemen-petugas', function () {

        return view('manajemen-petugas.index');

    })->name('manajemen-petugas');



    /*
    |--------------------------------------------------------------------------
    | IOT
    |--------------------------------------------------------------------------
    */

    Route::get('/iot', function () {

        return view('iot.index');

    })->name('monitoring-iot');



    /*
    |--------------------------------------------------------------------------
    | QUICK MESSAGE
    |--------------------------------------------------------------------------
    */

    Route::get('/quick-message', function () {

        return view('quick-message.index');

    })->name('quick-message');



    /*
    |--------------------------------------------------------------------------
    | RECAP DATA PUBLIC
    |--------------------------------------------------------------------------
    */

    Route::get('/recap-public', function () {

        return view('recap-public.index');

    })->name('recap-public');

      /*
  |--------------------------------------------------------------------------
    | MANAJEMEN USER PUBLIK (DB2) - TANPA CONTROLLER
    |--------------------------------------------------------------------------
    */
    Route::get('/manajemen-user-publik', function () {
        return view('manajemen-user-public.index');
    })->name('manajemen-user-publik');

});



/*
|--------------------------------------------------------------------------
| USER PUBLIK
|--------------------------------------------------------------------------
|
| Hanya role = user yang boleh masuk.
|
*/

Route::middleware(['role:user'])
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



/*
|--------------------------------------------------------------------------
| PETUGAS LAPANGAN (PERUMAHAN & PUBLIK)
|--------------------------------------------------------------------------
|
| Hanya role = petugas yang boleh masuk.
|
*/
Route::middleware(['role:petugas'])
    ->prefix('petugas')
    ->name('petugas.')
    ->group(function () {

        Route::view('/dashboard', 'petugas.dashboard.index')->name('dashboard');
        Route::view('/riwayat-laporan', 'petugas.history.index')->name('history');
        Route::view('/profil', 'petugas.profile.index')->name('profile');

    });