<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\SitterSearchRequest;
use App\Http\Resources\SitterCardResource;
use App\Services\SitterDiscoveryService;
use Illuminate\Http\JsonResponse;

class SitterDiscoveryController extends Controller
{
    public function __construct(private readonly SitterDiscoveryService $discoveryService)
    {
    }

    public function index(SitterSearchRequest $request): JsonResponse
    {
        $paginator = $this->discoveryService->list($request->validated());

        return response()->json([
            'data' => SitterCardResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
            ],
        ]);
    }
}
