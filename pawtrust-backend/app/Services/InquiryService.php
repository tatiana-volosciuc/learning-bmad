<?php

namespace App\Services;

use App\Exceptions\DuplicateInquiryException;
use App\Mail\BreederNewInquiryMail;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;

class InquiryService
{
    private const MAX_ATTEMPTS = 5;
    private const DECAY_SECONDS = 3600;

    public function submit(User $buyer, Listing $listing, ?string $message, string $ip): Inquiry
    {
        $key = "inquiry_submit:{$ip}";

        if (RateLimiter::tooManyAttempts($key, self::MAX_ATTEMPTS)) {
            throw new HttpResponseException(
                response()->json(['message' => __('errors.too_many_messages')], 429)
                    ->header('Retry-After', (string) RateLimiter::availableIn($key))
            );
        }

        RateLimiter::hit($key, self::DECAY_SECONDS);

        // Defensive second layer: route middleware already enforces role:buyer
        if ($buyer->hasRole('breeder') || $buyer->hasRole('admin')) {
            throw new HttpResponseException(
                response()->json(['message' => __('errors.buyers_only')], 403)
            );
        }

        if ($listing->status !== 'active') {
            throw new HttpResponseException(
                response()->json(['message' => __('errors.listing_not_available_for_inquiries')], 422)
            );
        }

        $duplicate = Inquiry::where('listing_id', $listing->id)
            ->where('buyer_id', $buyer->id)
            ->exists();

        if ($duplicate) {
            throw new DuplicateInquiryException();
        }

        $inquiry = Inquiry::create([
            'listing_id' => $listing->id,
            'buyer_id'   => $buyer->id,
            'message'    => $message,
            'status'     => 'contact_revealed',
        ]);

        // Eager load for InquiryResource (avoids N+1)
        $inquiry->load('listing.breederProfile.user');

        // Dispatch notification email outside any DB transaction — async via queue
        $breeder = $listing->breederProfile->user;
        Mail::to($breeder->email)
            ->locale($breeder->locale)
            ->queue(new BreederNewInquiryMail($inquiry->load(['buyer', 'listing'])));

        return $inquiry;
    }
}
