<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Firebase 2 - Public User
     */
    private string $firebasePublicUrl =
        'https://panicbttn2-default-rtdb.asia-southeast1.firebasedatabase.app';


    /**
     * Halaman Login
     */
    public function showLogin()
    {
        return view('auth.login');
    }


    /**
     * Proses Login
     */
    public function login(Request $request)
    {
        /*
        |--------------------------------------------------------------------------
        | Validasi input
        |--------------------------------------------------------------------------
        */

        $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);


        $username = trim($request->username);
        $password = $request->password;


        /*
        |--------------------------------------------------------------------------
        | Ambil semua user dari Firebase 2
        |--------------------------------------------------------------------------
        */

        $response = Http::get(
            $this->firebasePublicUrl . '/.json'
        );


        /*
        |--------------------------------------------------------------------------
        | Firebase gagal diakses
        |--------------------------------------------------------------------------
        */

        if (!$response->successful()) {

            return back()
                ->withInput($request->only('username'))
                ->with('error', 'Tidak dapat terhubung ke Firebase.');
        }


        $users = $response->json();


        /*
        |--------------------------------------------------------------------------
        | Tidak ada data
        |--------------------------------------------------------------------------
        */

        if (!is_array($users)) {

            return back()
                ->withInput($request->only('username'))
                ->with('error', 'Data pengguna tidak ditemukan.');
        }


        /*
        |--------------------------------------------------------------------------
        | Cari username
        |--------------------------------------------------------------------------
        */

        $userFound = null;

        foreach ($users as $key => $user) {

            if (
                is_array($user) &&
                isset($user['username']) &&
                strtolower($user['username']) === strtolower($username)
            ) {

                $userFound = $user;

                // Simpan key Firebase
                $userFound['_key'] = $key;

                break;
            }
        }


        /*
        |--------------------------------------------------------------------------
        | Username tidak ditemukan
        |--------------------------------------------------------------------------
        */

        if (!$userFound) {

            return back()
                ->withInput($request->only('username'))
                ->with('error', 'Username atau password salah.');
        }


        /*
        |--------------------------------------------------------------------------
        | Cek password bcrypt
        |--------------------------------------------------------------------------
        */

        if (
            !isset($userFound['password']) ||
            !Hash::check($password, $userFound['password'])
        ) {

            return back()
                ->withInput($request->only('username'))
                ->with('error', 'Username atau password salah.');
        }


        /*
        |--------------------------------------------------------------------------
        | Pastikan role user
        |--------------------------------------------------------------------------
        */

        if (
            isset($userFound['role']) &&
            $userFound['role'] !== 'user'
        ) {

            return back()
                ->withInput($request->only('username'))
                ->with('error', 'Akun tidak memiliki akses sebagai user.');
        }


        /*
        |--------------------------------------------------------------------------
        | Login berhasil
        |--------------------------------------------------------------------------
        */

        $request->session()->regenerate();


        session([
            'web_logged_in' => true,

            'web_role' => 'user',

            'web_user_id' => $userFound['_key'],

            'web_username' => $userFound['username'],

            'web_user_name' => $userFound['name'] ?? '',

            'web_user_email' => $userFound['email'] ?? '',

            'web_user_phone' => $userFound['phone'] ?? '',
        ]);


        /*
        |--------------------------------------------------------------------------
        | Redirect
        |--------------------------------------------------------------------------
        */

        return redirect()->route('dashboard');
    }


    /**
     * Logout
     */
    public function logout(Request $request)
    {
        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}