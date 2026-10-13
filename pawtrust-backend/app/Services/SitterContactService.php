<?php

namespace App\Services;

use App\Mail\SitterContactMail;
use App\Models\SitterContactSubmission;
use App\Models\SitterProfile;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;

class SitterContactService
{
    private const MAX_ATTEMPTS = 5;
    private const DECAY_SECONDS = 3600;

    public function submit(SitterProfile $profile, array $data, string $ip): SitterContactSubmission
    {
        $key = "sitter_contact:{$ip}";

        if (RateLimiter::tooManyAttempts($key, self::MAX_ATTEMPTS)) {
            throw new HttpResponseException(
                response()->json(['message' => 'Too many messages sent. Please try again later.'], 429)
            );
        }

        RateLimiter::hit($key, self::DECAY_SECONDS);

        $submission = $profile->contactSubmissions()->create([
            'sender_name'  => $data['name'],
            'sender_email' => $data['email'],
            'message'      => $data['message'],
            'sender_ip'    => $ip,
        ]);

        Mail::to($profile->user->email)->queue(new SitterContactMail($submission, $profile));

        return $submission;
    }
}
