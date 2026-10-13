<?php

use App\Http\Controllers\SitemapController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/sitemap.xml', [SitemapController::class, 'index']);

// Static public/robots.txt is normally served directly by the web server;
// this route is a fallback so it also resolves when requests do go through Laravel.
Route::get('/robots.txt', fn () => response(file_get_contents(public_path('robots.txt')), 200)
    ->header('Content-Type', 'text/plain'));
