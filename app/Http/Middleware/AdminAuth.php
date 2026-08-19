<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminAuth
{
    public function handle(
        Request $request,
        Closure $next
    ): Response {

        if (
            !session('web_logged_in') ||
            session('web_role') !== 'admin'
        ) {

            return redirect()
                ->route('login')
                ->with(
                    'error',
                    'Anda tidak memiliki akses admin.'
                );

        }

        return $next($request);
    }
}