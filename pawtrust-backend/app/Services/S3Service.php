<?php

namespace App\Services;

use Aws\S3\S3Client;

class S3Service
{
    public function __construct(private readonly S3Client $s3Client)
    {
    }

    public function presignedUrl(string $s3Key, int $ttlSeconds = 86400): string
    {
        $cmd = $this->s3Client->getCommand('GetObject', [
            'Bucket' => config('filesystems.disks.s3.bucket'),
            'Key'    => $s3Key,
        ]);

        return (string) $this->s3Client->createPresignedRequest($cmd, "+{$ttlSeconds} seconds")->getUri();
    }

    public function delete(string $s3Key): void
    {
        $this->s3Client->deleteObject([
            'Bucket' => config('filesystems.disks.s3.bucket'),
            'Key'    => $s3Key,
        ]);
    }
}
