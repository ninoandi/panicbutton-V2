<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('dashboard');
});

Route::get('/dashboard', function () {
    return view('dashboard.index');
})->name('dashboard');


Route::get('/perumahan', function () {
     return view('perumahan.index');
})->name('perumahan');

Route::get('/detail-perumahan', function () {
    $key = request()->query('key');
    return view('perumahan.detail', [
        'key' => $key
    ]);
})->name('perumahan.detail');

Route::get('/statistik', function () {
    return view('statistik.index');
})->name('statistik');

Route::get('/detail-grafik', function () {
    return view('statistik.detail');
})->name('detail-grafik');


Route::get('/manajemen-user', function () {
   return view('manajemen-user.index');
})->name('manajemen-user');

Route::get('/iot', function () {
    return view('iot.index');
})->name('monitoring-iot');