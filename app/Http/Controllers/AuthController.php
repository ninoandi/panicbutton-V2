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

    private string $firebaseHousingUrl =
        'https://panicbuttonrtdb-eccd1-default-rtdb.firebaseio.com';


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
     */
    public function register(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:100'],
            'phone' => ['nullable', 'string', 'max:20'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        $email = strtolower(trim($request->email));

        // 1. Cek duplikasi email di Firebase DB2
        $response = Http::get($this->firebasePublicUrl . '/users.json');

        if ($response->successful()) {
            $users = $response->json();
            if (is_array($users)) {
                foreach ($users as $user) {
                    if (
                        is_array($user) &&
                        isset($user['email']) &&
                        strtolower(trim($user['email'])) === $email
                    ) {
                        return back()
                            ->withInput()
                            ->with('error', 'Email sudah terdaftar. Silakan gunakan email lain.');
                    }
                }
            }
        }

        // 2. Hash password & siapkan payload
        $userData = [
            'name' => $request->name,
            'email' => $email,
            'phone' => $request->phone ?? '',
            'password' => Hash::make($request->password),
            'role' => 'user',
            'created_at' => now()->toIso8601String(),
        ];

        // 3. Simpan ke Firebase DB2
        $storeResponse = Http::post($this->firebasePublicUrl . '/users.json', $userData);

        if (!$storeResponse->successful()) {
            return back()
                ->withInput()
                ->with('error', 'Gagal membuat akun. Silakan coba lagi.');
        }

        return redirect()
            ->route('login')
            ->with('success', 'Registrasi berhasil. Silakan login.');
    }


    /**
     * LOGIN DUAL-DATABASE (DB2 Public & DB1 Perumahan)
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $email = strtolower(trim($request->email));
        $password = $request->password;

        $userFound = null;
        $petugasType = 'public';
        $perumahanKey = null;

        /*
        |--------------------------------------------------------------------------
        | 1. Periksa Firebase DB2 (Public / Admin / Petugas Public)
        |--------------------------------------------------------------------------
        */
        try {
            $response = Http::get($this->firebasePublicUrl . '/users.json');
            if ($response->successful()) {
                $users = $response->json();
                if (is_array($users)) {
                    foreach ($users as $key => $user) {
                        if (
                            is_array($user) &&
                            isset($user['email']) &&
                            strtolower(trim($user['email'])) === $email
                        ) {
                            // Cek password hash atau plain fallback
                            if (isset($user['password']) && (Hash::check($password, $user['password']) || $password === $user['password'])) {
                                $userFound = $user;
                                $userFound['_key'] = $key;
                                $petugasType = 'public';
                                break;
                            }
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            // Lanjut ke pengecekan DB1
        }

        /*
        |--------------------------------------------------------------------------
        | 2. Jika belum ditemukan, Periksa Firebase DB1 (Petugas Perumahan / Satpam)
        |--------------------------------------------------------------------------
        */
        if (!$userFound) {
            try {
                $housingResponse = Http::get($this->firebaseHousingUrl . '/perumahan.json');
                if ($housingResponse->successful()) {
                    $perumahanList = $housingResponse->json();
                    if (is_array($perumahanList)) {
                        foreach ($perumahanList as $pKey => $pData) {
                            if (isset($pData['users']) && is_array($pData['users'])) {
                                foreach ($pData['users'] as $uKey => $uData) {
                                    if (
                                        is_array($uData) &&
                                        isset($uData['email']) &&
                                        strtolower(trim($uData['email'])) === $email
                                    ) {
                                        if (
                                            isset($uData['password']) &&
                                            (Hash::check($password, $uData['password']) || $password === $uData['password'])
                                        ) {
                                            $userFound = $uData;
                                            $userFound['_key'] = $uKey;
                                            
                                            $userRole = strtolower($uData['role'] ?? '');
                                            if ($userRole === 'satpam' || $userRole === 'admin' || $userRole === 'petugas' || $userRole === 'security') {
                                                $userFound['role'] = 'petugas';
                                                $petugasType = 'perumahan';
                                            } else {
                                                $userFound['role'] = 'user';
                                                $petugasType = 'perumahan';
                                            }
                                            $perumahanKey = $pKey;
                                            break 2;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (\Exception $e) {
                // Ignore and proceed
            }
        }

        // Jika akun tidak ditemukan atau password salah
        if (!$userFound) {
            return back()
                ->withInput($request->only('email'))
                ->with('error', 'Email atau password salah.');
        }

        /*
        |--------------------------------------------------------------------------
        | Tentukan Role & Buat Session
        |--------------------------------------------------------------------------
        */
        $role = $userFound['role'] ?? 'user';

        $request->session()->regenerate();

        session([
            'web_logged_in' => true,
            'web_role' => $role,
            'web_petugas_type' => $petugasType,
            'web_perumahan_key' => $perumahanKey,
            'web_user_id' => $userFound['_key'],
            'web_user_name' => $userFound['name'] ?? '',
            'web_user_email' => $userFound['email'] ?? $email,
            'web_user_phone' => $userFound['phone'] ?? $userFound['phoneNumber'] ?? '',
        ]);

        /*
        |--------------------------------------------------------------------------
        | REDIRECT BERDASARKAN ROLE
        |--------------------------------------------------------------------------
        */
        if ($role === 'admin') {
            return redirect()->route('dashboard');
        }

        if ($role === 'petugas') {
            return redirect()->route('petugas.dashboard');
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