<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class FirebaseAuthService
{
    private string $publicDatabaseUrl;

    public function __construct()
    {
        $this->publicDatabaseUrl = rtrim(
    config('services.firebase.public_url', ''),
    '/'
);
    }


    /*
    |--------------------------------------------------------------------------
    | Ambil semua user publik
    |--------------------------------------------------------------------------
    */

    public function getPublicUsers()
    {
        $response = Http::get(
            $this->publicDatabaseUrl . '/users.json'
        );

        if (!$response->successful()) {
            return [];
        }

        return $response->json() ?? [];
    }


    /*
    |--------------------------------------------------------------------------
    | Cari username
    |--------------------------------------------------------------------------
    */

    public function findPublicUserByUsername(
        string $username
    ) {
        $users = $this->getPublicUsers();

        foreach ($users as $id => $user) {

            if (
                isset($user['username']) &&
                $user['username'] === $username
            ) {

                $user['_id'] = $id;

                return $user;
            }
        }

        return null;
    }


    /*
    |--------------------------------------------------------------------------
    | Buat user publik
    |--------------------------------------------------------------------------
    */

    public function createPublicUser(
        string $name,
        string $username,
        string $password
    ) {

        $data = [

            'name' => $name,

            'username' => $username,

            'password' => $password,

            'role' => 'user',

            'created_at' => now()->timestamp,

        ];


        $response = Http::post(
            $this->publicDatabaseUrl . '/users.json',
            $data
        );


        if (!$response->successful()) {

            throw new \Exception(
                'Gagal menyimpan user ke Firebase.'
            );

        }


        return $response->json();
    }
}