<?php

namespace App\Http\Controllers\Api\V1\Breeder;

use App\Http\Controllers\Controller;
use App\Http\Resources\Breeder\BreederInquiryResource;
use App\Models\Inquiry;
use Illuminate\Http\Request;

class BreederInquiryController extends Controller
{
    public function index(Request $request)
    {
        $profileId = $request->user()->breederProfile()->value('id');

        $inquiries = Inquiry::whereHas('listing', fn ($q) => $q->where('breeder_profile_id', $profileId))
            ->with(['buyer', 'listing'])
            ->latest()
            ->paginate(20);

        return BreederInquiryResource::collection($inquiries);
    }

    public function unreadCount(Request $request)
    {
        $profileId = $request->user()->breederProfile()->value('id');

        $count = Inquiry::whereHas('listing', fn ($q) => $q->where('breeder_profile_id', $profileId))
            ->whereNull('read_at')
            ->count();

        return response()->json(['data' => ['unread_count' => $count]]);
    }
}
