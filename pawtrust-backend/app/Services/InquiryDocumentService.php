<?php

namespace App\Services;

use App\Models\BreederDocument;
use App\Models\Inquiry;
use Illuminate\Support\Collection;

class InquiryDocumentService
{
    public function __construct(private readonly S3Service $s3Service)
    {
    }

    public function getDocumentsForInquiry(Inquiry $inquiry): Collection
    {
        $documents = BreederDocument::where('breeder_profile_id', $inquiry->listing->breeder_profile_id)
            ->get();

        return $documents->map(fn (BreederDocument $doc) => [
            'id'            => $doc->id,
            'document_type' => $doc->document_type,
            'filename'      => $doc->original_filename,
            'url'           => $this->s3Service->presignedUrl($doc->s3_key, 3600),
            'expires_at'    => now()->addHour()->toIso8601String(),
        ]);
    }
}
