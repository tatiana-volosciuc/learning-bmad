<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    private const SUPPORTED_LOCALES = ['ro', 'ru'];

    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()) {
            App::setLocale($this->resolve($request->user()->locale));
        } else {
            $accepted = $request->header('Accept-Language', '');
            $detected = collect(self::SUPPORTED_LOCALES)
                ->first(fn (string $locale) => str_contains($accepted, $locale));

            App::setLocale($this->resolve($detected));
        }

        return $next($request);
    }

    private function resolve(?string $locale): string
    {
        return in_array($locale, self::SUPPORTED_LOCALES, true) ? $locale : config('app.locale');
    }
}
