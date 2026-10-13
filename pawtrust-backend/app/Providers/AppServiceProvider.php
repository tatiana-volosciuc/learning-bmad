<?php

namespace App\Providers;

use Aws\S3\S3Client;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(S3Client::class, function () {
            return new S3Client([
                'version'     => 'latest',
                'region'      => config('filesystems.disks.s3.region', 'us-east-1'),
                'credentials' => [
                    'key'    => config('filesystems.disks.s3.key', ''),
                    'secret' => config('filesystems.disks.s3.secret', ''),
                ],
            ]);
        });
    }

    public function boot(): void
    {
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }
    }
}
