<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\SubmitInquiryRequest;
use App\Http\Resources\InquiryResource;
use App\Models\Listing;
use App\Services\InquiryService;
use Illuminate\Http\JsonResponse;

class InquiryController extends Controller
{
    public function __construct(private readonly InquiryService $inquiryService) {}

    public function store(SubmitInquiryRequest $request, Listing $listing): JsonResponse
    {
        $inquiry = $this->inquiryService->submit(
            $request->user(),
            $listing,
            $request->validated('message'),
            $request->ip(),
        );

        return InquiryResource::make($inquiry)
            ->response()
            ->setStatusCode(201);
    }
}
