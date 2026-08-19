<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class WebAuth
{
    public function handle(
        Request $request,
        Closure $next
    ): Response {

        if (!session('web_logged_in')) {

            return redirect()
                ->route('login')
                ->withErrors([
                    'username' => 'Silakan login terlebih dahulu.'
                ]);
        }

        if (session('web_role') !== 'user') {

            return redirect()
                ->route('login')
                ->withErrors([
                    'username' => 'Akses tidak diizinkan.'
                ]);
        }

        return $next($request);
    }
}