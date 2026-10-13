<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;

class ImageConversionService
{
    private const QUALITY = 85;

    public function toWebp(UploadedFile $file): string
    {
        $manager = new ImageManager(new Driver());

        return (string) $manager->read($file->getRealPath())->toWebp(self::QUALITY);
    }
}
