<?php

namespace App\Http\Controllers;

use App\Models\BreederProfile;
use App\Models\Listing;
use App\Models\SitterProfile;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;

class SitemapController extends Controller
{
    private const STATIC_ROUTES = ['/', '/search', '/sitters', '/privacy', '/terms'];

    public function index(): Response
    {
        $xml = Cache::remember('sitemap', 3600, fn () => $this->buildXml());

        return response($xml, 200)->header('Content-Type', 'application/xml');
    }

    private function buildXml(): string
    {
        $base = rtrim(config('app.frontend_url', config('app.url')), '/');
        $urls = [];

        foreach (self::STATIC_ROUTES as $route) {
            $urls[] = ['loc' => $base . $route];
        }

        Listing::query()
            ->where('status', 'active')
            ->select('id', 'updated_at')
            ->each(function (Listing $listing) use (&$urls, $base) {
                $urls[] = [
                    'loc'     => "{$base}/listings/{$listing->id}",
                    'lastmod' => $listing->updated_at?->toAtomString(),
                ];
            });

        BreederProfile::query()
            ->whereNotNull('verified_at')
            ->select('user_id', 'updated_at')
            ->each(function (BreederProfile $profile) use (&$urls, $base) {
                $urls[] = [
                    'loc'     => "{$base}/breeders/{$profile->user_id}",
                    'lastmod' => $profile->updated_at?->toAtomString(),
                ];
            });

        SitterProfile::query()
            ->select('user_id', 'updated_at')
            ->each(function (SitterProfile $profile) use (&$urls, $base) {
                $urls[] = [
                    'loc'     => "{$base}/sitters/{$profile->user_id}",
                    'lastmod' => $profile->updated_at?->toAtomString(),
                ];
            });

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

        foreach ($urls as $url) {
            $xml .= '  <url>' . "\n";
            $xml .= '    <loc>' . e($url['loc']) . '</loc>' . "\n";
            if (!empty($url['lastmod'])) {
                $xml .= '    <lastmod>' . e($url['lastmod']) . '</lastmod>' . "\n";
            }
            $xml .= '  </url>' . "\n";
        }

        $xml .= '</urlset>';

        return $xml;
    }
}
