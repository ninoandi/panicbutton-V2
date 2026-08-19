<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(
        Request $request,
        Closure $next,
        string $role
    ): Response {

        /*
        |--------------------------------------------------------------------------
        | Belum login
        |--------------------------------------------------------------------------
        */

        if (!session('web_logged_in')) {

            return redirect()
                ->route('login')
                ->withErrors([
                    'email' => 'Silakan login terlebih dahulu.'
                ]);
        }


        /*
        |--------------------------------------------------------------------------
        | Role tidak sesuai
        |--------------------------------------------------------------------------
        */

        if (session('web_role') !== $role) {

            if (session('web_role') === 'admin') {

                return redirect()
                    ->route('dashboard');
            }


            return redirect()
                ->route('user.dashboard');
        }


        return $next($request);
    }
}