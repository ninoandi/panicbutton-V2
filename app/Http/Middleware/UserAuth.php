<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class UserAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!session('web_logged_in')) {

            return redirect()
                ->route('login')
                ->withErrors([
                    'email' => 'Silakan login terlebih dahulu.'
                ]);
        }

        return $next($request);
    }
}