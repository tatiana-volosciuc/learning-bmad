<?php

namespace Tests\Feature\Inquiry;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use App\Models\User;
use App\Models\BreederProfile;
use App\Models\Listing;
use App\Models\Inquiry;
use App\Mail\BreederNewInquiryMail;

class BreederInquiryNotificationTest extends TestCase
{
    use RefreshDatabase;

    private User $buyer;
    private User $breeder;
    private Listing $listing;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();

        $this->buyer = User::factory()->create(['role' => 'buyer']);
        $this->buyer->assignRole('buyer');

        $this->breeder = User::factory()->create(['role' => 'breeder', 'locale' => 'ro']);
        $this->breeder->assignRole('breeder');
        $profile = BreederProfile::factory()->create(['user_id' => $this->breeder->id]);
        $this->listing = Listing::factory()->create([
            'breeder_profile_id' => $profile->id,
            'status'             => 'active',
        ]);
    }

    public function test_breeder_receives_email_notification_on_inquiry_submission(): void
    {
        $this->actingAs($this->buyer, 'sanctum')
            ->postJson("/api/v1/listings/{$this->listing->id}/inquire", [
                'message' => 'Very interested!',
            ])
            ->assertStatus(201);

        Mail::assertQueued(BreederNewInquiryMail::class, function ($mail) {
            return $mail->hasTo($this->breeder->email);
        });
    }

    public function test_notification_email_contains_buyer_name_and_listing_title(): void
    {
        $this->actingAs($this->buyer, 'sanctum')
            ->postJson("/api/v1/listings/{$this->listing->id}/inquire", [
                'message' => 'Interested!',
            ]);

        Mail::assertQueued(BreederNewInquiryMail::class, function ($mail) {
            return $mail->buyerName    === $this->buyer->name
                && $mail->listingTitle === $this->listing->title;
        });
    }

    public function test_notification_email_sent_in_breeder_locale_ro(): void
    {
        $this->actingAs($this->buyer, 'sanctum')
            ->postJson("/api/v1/listings/{$this->listing->id}/inquire");

        Mail::assertQueued(BreederNewInquiryMail::class, fn ($mail) => $mail->locale === 'ro');
    }

    public function test_notification_email_sent_in_breeder_locale_ru(): void
    {
        $this->breeder->update(['locale' => 'ru']);

        $this->actingAs($this->buyer, 'sanctum')
            ->postJson("/api/v1/listings/{$this->listing->id}/inquire");

        Mail::assertQueued(BreederNewInquiryMail::class, fn ($mail) => $mail->locale === 'ru');
    }

    public function test_no_message_fallback_sent_when_inquiry_message_is_null(): void
    {
        $this->actingAs($this->buyer, 'sanctum')
            ->postJson("/api/v1/listings/{$this->listing->id}/inquire", []);

        Mail::assertQueued(BreederNewInquiryMail::class, fn ($mail) => $mail->message === null);
    }
}
