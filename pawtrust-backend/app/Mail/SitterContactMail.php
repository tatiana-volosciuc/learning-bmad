<?php

namespace App\Mail;

use App\Models\SitterContactSubmission;
use App\Models\SitterProfile;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Lang;

class SitterContactMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $senderName;
    // Named contactMessage (not message) - Laravel injects its own $message (Illuminate\Mail\Message) into every mail view.
    public string $contactMessage;
    public string $dashboardUrl;

    public function __construct(SitterContactSubmission $submission, SitterProfile $profile)
    {
        $this->senderName     = $submission->sender_name;
        $this->contactMessage = $submission->message;
        $this->dashboardUrl   = config('app.frontend_url', config('app.url')) . '/sitter/dashboard';
        $this->locale         = $profile->user->locale ?? config('app.locale');
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: Lang::get('mail.sitter.contact.subject', [], $this->locale),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.sitter.contact',
        );
    }
}
