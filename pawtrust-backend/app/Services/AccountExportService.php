<?php

namespace App\Services;

use App\Models\User;

class AccountExportService
{
    public function export(User $user): array
    {
        $user->loadMissing([
            'breederProfile.listings',
            'sitterProfile',
            'inquiries.listing',
            'reviews.listing',
            'breederReviews.breederProfile',
            'savedListings',
        ]);

        return [
            'exported_at' => now()->toISOString(),
            'user'        => [
                'id'         => $user->id,
                'name'       => $user->name,
                'email'      => $user->email,
                'locale'     => $user->locale,
                'role'       => $user->role,
                'created_at' => $user->created_at,
            ],
            'breeder_profile' => $user->breederProfile ? [
                'kennel_name'  => $user->breederProfile->kennel_name,
                'display_name' => $user->breederProfile->display_name,
                'description'  => $user->breederProfile->description,
                'location'     => $user->breederProfile->location,
                'phone'        => $user->breederProfile->phone,
                'website'      => $user->breederProfile->website,
                'years_active' => $user->breederProfile->years_active,
                'verified_at'  => $user->breederProfile->verified_at,
            ] : null,
            'listings' => $user->breederProfile
                ? $user->breederProfile->listings->map(fn ($l) => [
                    'id'       => $l->id,
                    'title'    => $l->title,
                    'status'   => $l->status,
                    'price'    => $l->price,
                    'currency' => $l->currency,
                ])->values()->toArray()
                : [],
            'inquiries' => $user->inquiries->map(fn ($i) => [
                'id'         => $i->id,
                'listing'    => $i->listing?->title,
                'message'    => $i->message,
                'status'     => $i->status,
                'created_at' => $i->created_at,
            ])->values()->toArray(),
            'reviews' => $user->reviews->map(fn ($r) => [
                'id'         => $r->id,
                'listing'    => $r->listing?->title,
                'rating'     => $r->rating,
                'comment'    => $r->comment,
                'created_at' => $r->created_at,
            ])->values()->toArray(),
            'breeder_reviews' => $user->breederReviews->map(fn ($r) => [
                'id'         => $r->id,
                'breeder'    => $r->breederProfile?->kennel_name,
                'rating'     => $r->rating,
                'text'       => $r->text,
                'created_at' => $r->created_at,
            ])->values()->toArray(),
            'saved_listings' => $user->savedListings->map(fn ($l) => [
                'id'    => $l->id,
                'title' => $l->title,
            ])->values()->toArray(),
            'sitter_profile' => $user->sitterProfile ? [
                'full_name'        => $user->sitterProfile->full_name,
                'bio'              => $user->sitterProfile->bio,
                'service_areas'    => $user->sitterProfile->service_areas,
                'services'         => $user->sitterProfile->services,
                'experience_years' => $user->sitterProfile->experience_years,
                'languages'        => $user->sitterProfile->languages,
            ] : null,
        ];
    }
}
