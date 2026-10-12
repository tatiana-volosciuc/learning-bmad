<?php

namespace App\Mail;

use App\Models\Inquiry;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Lang;

class BreederNewInquiryMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $buyerName;
    public string $listingTitle;
    public ?string $message;
    public string $dashboardUrl;

    public function __construct(Inquiry $inquiry)
    {
        $this->buyerName    = $inquiry->buyer->name;
        $this->listingTitle = $inquiry->listing->title;
        $this->message      = $inquiry->message;
        $this->dashboardUrl = config('app.frontend_url', config('app.url')) . '/dashboard/breeder/inquiries';
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: Lang::get('mail.inquiry.new_inquiry.subject', [
                'listing' => $this->listingTitle,
            ], $this->locale ?? config('app.locale')),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.inquiry.breeder-new-inquiry',
        );
    }
}
