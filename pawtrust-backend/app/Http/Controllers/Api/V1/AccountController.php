<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\AccountDeletionService;
use App\Services\AccountExportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    public function __construct(
        private readonly AccountDeletionService $deletionService,
        private readonly AccountExportService $exportService,
    ) {
    }

    public function destroy(Request $request): JsonResponse
    {
        $this->deletionService->deleteAccount($request->user());

        return response()->json(['message' => __('errors.account_deleted')]);
    }

    public function export(Request $request): JsonResponse
    {
        return response()->json($this->exportService->export($request->user()));
    }
}
