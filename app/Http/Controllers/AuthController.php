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
     * Halaman Register
     */
    public function showRegister()
    {
        return view('auth.register');
    }


    /**
     * Proses Register
     */
    public function register(Request $request)
    {
        /*
        |--------------------------------------------------------------------------
        | Validasi
        |--------------------------------------------------------------------------
        */

        $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:100'],
            'phone' => ['nullable', 'string', 'max:20'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);


        $name = trim($request->name);
        $email = strtolower(trim($request->email));
        $phone = trim($request->phone ?? '');
        $password = $request->password;


        /*
        |--------------------------------------------------------------------------
        | Ambil user dari Firebase
        |--------------------------------------------------------------------------
        */

        $response = Http::get(
            $this->firebasePublicUrl . '/users.json'
        );


        /*
        |--------------------------------------------------------------------------
        | Firebase gagal diakses
        |--------------------------------------------------------------------------
        */

        if (!$response->successful()) {

            return back()
                ->withInput()
                ->with('error', 'Tidak dapat terhubung ke Firebase.');
        }


        $users = $response->json();


        /*
        |--------------------------------------------------------------------------
        | Cek email sudah digunakan atau belum
        |--------------------------------------------------------------------------
        */

        if (is_array($users)) {

            foreach ($users as $user) {

                if (!is_array($user)) {
                    continue;
                }

                if (
                    isset($user['email']) &&
                    strtolower(trim($user['email'])) === $email
                ) {

                    return back()
                        ->withInput()
                        ->with('error', 'Email sudah digunakan.');
                }
            }
        }


        /*
        |--------------------------------------------------------------------------
        | Data user baru
        |--------------------------------------------------------------------------
        */

        $newUser = [
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'password' => Hash::make($password),
            'role' => 'user',
        ];


        /*
        |--------------------------------------------------------------------------
        | Simpan ke Firebase
        |--------------------------------------------------------------------------
        */

        $firebaseResponse = Http::post(
            $this->firebasePublicUrl . '/users.json',
            $newUser
        );


        /*
        |--------------------------------------------------------------------------
        | Gagal menyimpan
        |--------------------------------------------------------------------------
        */

        if (!$firebaseResponse->successful()) {

            return back()
                ->withInput()
                ->with(
                    'error',
                    'Gagal membuat akun. Silakan coba lagi.'
                );
        }


        /*
        |--------------------------------------------------------------------------
        | Berhasil
        |--------------------------------------------------------------------------
        */

        return redirect()
            ->route('login')
            ->with(
                'success',
                'Registrasi berhasil. Silakan login.'
            );
    }


    /**
     * Proses Login
     */
    public function login(Request $request)
    {
        /*
        |--------------------------------------------------------------------------
        | Validasi
        |--------------------------------------------------------------------------
        */

        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);


        $email = strtolower(trim($request->email));
        $password = $request->password;


        /*
        |--------------------------------------------------------------------------
        | Ambil semua user dari Firebase
        |--------------------------------------------------------------------------
        */

        $response = Http::get(
            $this->firebasePublicUrl . '/users.json'
        );


        /*
        |--------------------------------------------------------------------------
        | Firebase gagal diakses
        |--------------------------------------------------------------------------
        */

        if (!$response->successful()) {

            return back()
                ->withInput($request->only('email'))
                ->with(
                    'error',
                    'Tidak dapat terhubung ke Firebase.'
                );
        }


        $users = $response->json();


        /*
        |--------------------------------------------------------------------------
        | Tidak ada data user
        |--------------------------------------------------------------------------
        */

        if (!is_array($users)) {

            return back()
                ->withInput($request->only('email'))
                ->with(
                    'error',
                    'Data pengguna tidak ditemukan.'
                );
        }


        /*
        |--------------------------------------------------------------------------
        | Cari berdasarkan email
        |--------------------------------------------------------------------------
        */

        $userFound = null;

        foreach ($users as $key => $user) {

            if (
                is_array($user) &&
                isset($user['email']) &&
                strtolower(trim($user['email'])) === $email
            ) {

                $userFound = $user;

                // Simpan Firebase key
                $userFound['_key'] = $key;

                break;
            }
        }


        /*
        |--------------------------------------------------------------------------
        | Email tidak ditemukan
        |--------------------------------------------------------------------------
        */

        if (!$userFound) {

            return back()
                ->withInput($request->only('email'))
                ->with(
                    'error',
                    'Email atau password salah.'
                );
        }


        /*
        |--------------------------------------------------------------------------
        | Cek password
        |--------------------------------------------------------------------------
        */

        if (
            !isset($userFound['password']) ||
            !Hash::check(
                $password,
                $userFound['password']
            )
        ) {

            return back()
                ->withInput($request->only('email'))
                ->with(
                    'error',
                    'Email atau password salah.'
                );
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
                ->withInput($request->only('email'))
                ->with(
                    'error',
                    'Akun tidak memiliki akses sebagai user.'
                );
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

            'web_user_name' => $userFound['name'] ?? '',

            'web_user_email' => $userFound['email'] ?? '',

            'web_user_phone' => $userFound['phone'] ?? '',
        ]);


        /*
        |--------------------------------------------------------------------------
        | Redirect
        |--------------------------------------------------------------------------
        */

        return redirect()->route('user.dashboard');
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