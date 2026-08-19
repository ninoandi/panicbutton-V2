<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Firebase Realtime Database
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
     * Register USER PUBLIK
     *
     * Semua akun yang daftar melalui halaman register
     * otomatis mempunyai role = user.
     */
    public function register(Request $request)
    {
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
        | Ambil users dari Firebase
        |--------------------------------------------------------------------------
        */

        $response = Http::get(
            $this->firebasePublicUrl . '/users.json'
        );


        if (!$response->successful()) {

            return back()
                ->withInput()
                ->with(
                    'error',
                    'Tidak dapat terhubung ke Firebase.'
                );
        }


        $users = $response->json();


        /*
        |--------------------------------------------------------------------------
        | Cek email
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
                        ->with(
                            'error',
                            'Email sudah digunakan.'
                        );
                }
            }
        }


        /*
        |--------------------------------------------------------------------------
        | Data USER baru
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
        | Simpan Firebase
        |--------------------------------------------------------------------------
        */

        $firebaseResponse = Http::post(
            $this->firebasePublicUrl . '/users.json',
            $newUser
        );


        if (!$firebaseResponse->successful()) {

            return back()
                ->withInput()
                ->with(
                    'error',
                    'Gagal membuat akun. Silakan coba lagi.'
                );
        }


        return redirect()
            ->route('login')
            ->with(
                'success',
                'Registrasi berhasil. Silakan login.'
            );
    }


    /**
     * LOGIN
     */
    public function login(Request $request)
    {
        /*
        |--------------------------------------------------------------------------
        | Validasi
        |--------------------------------------------------------------------------
        */

        $request->validate([

            'email' => [
                'required',
                'email'
            ],

            'password' => [
                'required',
                'string'
            ],

        ]);


        $email = strtolower(trim($request->email));

        $password = $request->password;


        /*
        |--------------------------------------------------------------------------
        | Ambil users dari Firebase
        |--------------------------------------------------------------------------
        */

        $response = Http::get(
            $this->firebasePublicUrl . '/users.json'
        );


        if (!$response->successful()) {

            return back()
                ->withInput(
                    $request->only('email')
                )
                ->with(
                    'error',
                    'Tidak dapat terhubung ke Firebase.'
                );
        }


        $users = $response->json();


        if (!is_array($users)) {

            return back()
                ->withInput(
                    $request->only('email')
                )
                ->with(
                    'error',
                    'Data pengguna tidak ditemukan.'
                );
        }


        /*
        |--------------------------------------------------------------------------
        | Cari user berdasarkan email
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

                /*
                | Firebase key
                */

                $userFound['_key'] = $key;

                break;
            }
        }


        /*
        |--------------------------------------------------------------------------
        | User tidak ditemukan
        |--------------------------------------------------------------------------
        */

        if (!$userFound) {

            return back()
                ->withInput(
                    $request->only('email')
                )
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
                ->withInput(
                    $request->only('email')
                )
                ->with(
                    'error',
                    'Email atau password salah.'
                );
        }


        /*
        |--------------------------------------------------------------------------
        | Tentukan ROLE
        |--------------------------------------------------------------------------
        */

        $role = $userFound['role'] ?? 'user';


        /*
        |--------------------------------------------------------------------------
        | Login berhasil
        |--------------------------------------------------------------------------
        */

        $request->session()->regenerate();


        session([

            'web_logged_in' => true,

            'web_role' => $role,

            'web_user_id' => $userFound['_key'],

            'web_user_name' =>
                $userFound['name'] ?? '',

            'web_user_email' =>
                $userFound['email'] ?? '',

            'web_user_phone' =>
                $userFound['phone'] ?? '',

        ]);


        /*
        |--------------------------------------------------------------------------
        | REDIRECT BERDASARKAN ROLE
        |--------------------------------------------------------------------------
        */

        if ($role === 'admin') {

            return redirect()->route('dashboard');

        }


        return redirect()->route('user.dashboard');
    }


    /**
     * LOGOUT
     */
    public function logout(Request $request)
    {
        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}   