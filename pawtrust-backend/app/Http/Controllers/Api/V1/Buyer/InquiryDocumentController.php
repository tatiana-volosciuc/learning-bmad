<?php

namespace App\Http\Controllers\Api\V1\Buyer;

use App\Http\Controllers\Controller;
use App\Models\Inquiry;
use App\Services\InquiryDocumentService;
use Illuminate\Http\Request;

class InquiryDocumentController extends Controller
{
    public function __construct(private readonly InquiryDocumentService $documentService)
    {
    }

    public function index(Request $request, Inquiry $inquiry)
    {
        abort_if($inquiry->buyer_id !== $request->user()->id, 403, 'Forbidden.');

        $documents = $this->documentService->getDocumentsForInquiry($inquiry);

        return response()->json(['data' => $documents]);
    }
}
