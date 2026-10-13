<?php

namespace App\Jobs;

use App\Models\BreederDocument;
use App\Models\SitterPortfolioPhoto;
use App\Models\User;
use App\Services\S3Service;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class DeleteUserS3DocumentsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(public readonly int $userId)
    {
    }

    public function handle(S3Service $s3): void
    {
        $user = User::withTrashed()->find($this->userId);

        if (!$user) {
            return;
        }

        $documents = BreederDocument::withTrashed()
            ->whereHas('breederProfile', fn ($q) => $q->where('user_id', $this->userId))
            ->get();

        foreach ($documents as $document) {
            $s3->delete($document->s3_key);
            $document->forceDelete();
        }

        $photos = SitterPortfolioPhoto::whereHas('sitterProfile', fn ($q) => $q->where('user_id', $this->userId))
            ->get();

        foreach ($photos as $photo) {
            $s3->delete($photo->s3_key);
            $photo->delete();
        }

        Log::info("S3 documents deleted for user {$this->userId}");
    }
}
