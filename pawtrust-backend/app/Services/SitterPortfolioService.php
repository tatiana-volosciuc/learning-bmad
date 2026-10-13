<?php

namespace App\Services;

use App\Models\SitterPortfolioPhoto;
use App\Models\SitterProfile;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SitterPortfolioService
{
    private const MAX_PHOTOS = 6;

    public function __construct(private readonly ImageConversionService $imageConversion)
    {
    }

    public function upload(SitterProfile $profile, UploadedFile $file): SitterPortfolioPhoto
    {
        $this->validateMagicBytes($file);

        $count = $profile->portfolioPhotos()->count();
        if ($count >= self::MAX_PHOTOS) {
            throw ValidationException::withMessages([
                'photo' => 'A sitter profile may have a maximum of ' . self::MAX_PHOTOS . ' portfolio photos.',
            ]);
        }

        $key = "sitters/{$profile->id}/portfolio/" . Str::uuid() . '.webp';

        Storage::disk('s3')->put($key, $this->imageConversion->toWebp($file), 'private');

        return $profile->portfolioPhotos()->create([
            's3_key'     => $key,
            'sort_order' => $count,
        ]);
    }

    public function delete(SitterPortfolioPhoto $photo): void
    {
        Storage::disk('s3')->delete($photo->s3_key);
        $photo->delete();
    }

    private function validateMagicBytes(UploadedFile $file): void
    {
        $handle = fopen($file->getRealPath(), 'rb');
        $header = fread($handle, 12);
        fclose($handle);

        $isJpeg = str_starts_with($header, "\xFF\xD8\xFF");
        $isPng  = str_starts_with($header, "\x89\x50\x4E\x47");
        $isWebp = str_starts_with($header, 'RIFF') && substr($header, 8, 4) === 'WEBP';

        if (!$isJpeg && !$isPng && !$isWebp) {
            throw ValidationException::withMessages([
                'photo' => 'File must be a valid JPEG, PNG, or WebP image.',
            ]);
        }
    }
}
