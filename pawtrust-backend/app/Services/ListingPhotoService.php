<?php

namespace App\Services;

use App\Models\Listing;
use App\Models\ListingPhoto;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ListingPhotoService
{
    private const MAX_PHOTOS = 10;

    private const ALLOWED_SIGNATURES = [
        'jpg'  => "\xFF\xD8\xFF",
        'png'  => "\x89\x50\x4E\x47",
        'webp' => 'RIFF',
    ];

    public function __construct(private readonly ImageConversionService $imageConversion)
    {
    }

    public function upload(Listing $listing, UploadedFile $file, string $photoType = 'listing'): ListingPhoto
    {
        $this->validateMagicBytes($file);

        $count = $listing->photos()->count();
        if ($count >= self::MAX_PHOTOS) {
            throw ValidationException::withMessages([
                'photo' => 'A listing may have a maximum of ' . self::MAX_PHOTOS . ' photos.',
            ]);
        }

        $key = "listing-photos/{$listing->id}/" . Str::uuid() . '.webp';

        Storage::disk('s3')->put($key, $this->imageConversion->toWebp($file), 'private');

        return $listing->photos()->create([
            's3_key'     => $key,
            'photo_type' => $photoType,
            'sort_order' => $count,
        ]);
    }

    public function delete(ListingPhoto $photo): void
    {
        Storage::disk('s3')->delete($photo->s3_key);
        $photo->delete();
    }

    public function validateMagicBytes(UploadedFile $file): void
    {
        $handle = fopen($file->getRealPath(), 'rb');
        $header = fread($handle, 12);
        fclose($handle);

        $isJpeg = str_starts_with($header, self::ALLOWED_SIGNATURES['jpg']);
        $isPng  = str_starts_with($header, self::ALLOWED_SIGNATURES['png']);
        $isWebp = str_starts_with($header, 'RIFF') && substr($header, 8, 4) === 'WEBP';

        if (!$isJpeg && !$isPng && !$isWebp) {
            throw ValidationException::withMessages([
                'photo' => 'File must be a valid JPEG, PNG, or WebP image.',
            ]);
        }
    }

    public function validateFileMagicBytes(UploadedFile $file, array $allowedTypes): void
    {
        $handle = fopen($file->getRealPath(), 'rb');
        $header = fread($handle, 12);
        fclose($handle);

        $valid = false;

        if (in_array('image', $allowedTypes)) {
            $isJpeg = str_starts_with($header, self::ALLOWED_SIGNATURES['jpg']);
            $isPng  = str_starts_with($header, self::ALLOWED_SIGNATURES['png']);
            $isWebp = str_starts_with($header, 'RIFF') && substr($header, 8, 4) === 'WEBP';
            if ($isJpeg || $isPng || $isWebp) {
                $valid = true;
            }
        }

        if (in_array('pdf', $allowedTypes) && str_starts_with($header, '%PDF')) {
            $valid = true;
        }

        if (!$valid) {
            throw ValidationException::withMessages([
                'certificate' => 'File must be a valid PDF or image.',
            ]);
        }
    }
}
