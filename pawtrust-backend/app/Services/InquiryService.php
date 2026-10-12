<?php

namespace App\Services;

use App\Exceptions\DuplicateInquiryException;
use App\Mail\BreederNewInquiryMail;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Mail;

class InquiryService
{
    public function submit(User $buyer, Listing $listing, ?string $message): Inquiry
    {
        // Defensive second layer: route middleware already enforces role:buyer
        if ($buyer->hasRole('breeder') || $buyer->hasRole('admin')) {
            throw new HttpResponseException(
                response()->json(['message' => 'Only buyers may submit inquiries.'], 403)
            );
        }

        if ($listing->status !== 'active') {
            throw new HttpResponseException(
                response()->json(['message' => 'This listing is not available for inquiries.'], 422)
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
