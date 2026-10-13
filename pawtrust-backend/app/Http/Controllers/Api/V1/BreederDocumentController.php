<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\BreederDocumentResource;
use App\Models\BreederDocument;
use App\Models\BreederProfile;
use App\Services\BreederDocumentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BreederDocumentController extends Controller
{
    private const DOCUMENT_TYPES = [
        'kennel_cert', 'fci_papers', 'achr_papers',
        'vaccination_records', 'health_tests', 'other',
    ];

    public function __construct(private readonly BreederDocumentService $documentService) {}

    public function store(Request $request, int $breederId): JsonResponse
    {
        abort_if(
            $request->user()->breederProfile?->id !== $breederId,
            403,
            'Forbidden'
        );

        $request->validate([
            'file'          => ['required', 'file', 'max:10240'],
            'document_type' => ['required', 'string', 'max:100', 'in:' . implode(',', self::DOCUMENT_TYPES)],
        ]);

        $profile  = BreederProfile::findOrFail($breederId);
        $document = $this->documentService->upload(
            $profile,
            $request->file('file'),
            $request->input('document_type')
        );

        return response()->json(['data' => new BreederDocumentResource($document)], 201);
    }

    public function destroy(Request $request, int $breederId, int $docId): JsonResponse
    {
        abort_if(
            $request->user()->breederProfile?->id !== $breederId,
            403,
            'Forbidden'
        );

        $document = BreederDocument::where('breeder_profile_id', $breederId)
            ->findOrFail($docId);

        $this->documentService->softDelete($document);

        return response()->json(['message' => __('errors.document_deleted')]);
    }

    public function url(int $breederId, int $docId): JsonResponse
    {
        $document = BreederDocument::where('breeder_profile_id', $breederId)
            ->findOrFail($docId);

        $url = $this->documentService->getPresignedUrl($document);

        return response()->json([
            'data' => [
                'url'        => $url,
                'expires_at' => now()->addSeconds(900)->toIso8601String(),
            ],
        ]);
    }
}
