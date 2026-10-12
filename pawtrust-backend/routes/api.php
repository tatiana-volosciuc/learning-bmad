<?php

use App\Http\Controllers\Api\V1\Admin\AdminVerificationController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BreedController;
use App\Http\Controllers\Api\V1\Breeder\BreederInquiryController;
use App\Http\Controllers\Api\V1\BreederDocumentController;
use App\Http\Controllers\Api\V1\BreederProfileController;
use App\Http\Controllers\Api\V1\BreederReviewController;
use App\Http\Controllers\Api\V1\Buyer\BuyerInquiryController;
use App\Http\Controllers\Api\V1\Buyer\BuyerReviewController;
use App\Http\Controllers\Api\V1\Buyer\InquiryDocumentController;
use App\Http\Controllers\Api\V1\Buyer\SavedListingController;
use App\Http\Controllers\Api\V1\HealthCertificateController;
use App\Http\Controllers\Api\V1\InquiryController;
use App\Http\Controllers\Api\V1\ListingController;
use App\Http\Controllers\Api\V1\ListingPhotoController;
use App\Http\Controllers\Api\V1\ReviewController;
use App\Http\Controllers\Api\V1\Sitter\SitterDashboardController;
use App\Http\Controllers\Api\V1\Sitter\SitterPortfolioController;
use App\Http\Controllers\Api\V1\Sitter\SitterProfileController as SitterProfileApiController;
use App\Http\Controllers\Api\V1\SitterContactController;
use App\Http\Controllers\Api\V1\VerificationRequestController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::get('/v1/health', fn () => response()->json(['status' => 'ok']));

Route::prefix('v1')->group(function () {
    // Public auth routes
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::middleware('throttle:10,1')->post('/auth/login', [AuthController::class, 'login']);

    // Protected auth routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me',      [AuthController::class, 'me']);
    });

    // Public breeder/breed routes
    Route::get('/breeders/{id}', [BreederProfileController::class, 'show']);
    Route::get('/breeds',        [BreedController::class, 'index']);

    // Public sitter routes
    Route::get('/sitters/{id}',          [SitterProfileApiController::class, 'show']);
    Route::post('/sitters/{id}/contact', [SitterContactController::class, 'contact']);

    // Public listing routes
    Route::get('/listings',               [ListingController::class, 'index']);
    Route::get('/listings/{id}',          [ListingController::class, 'show']);
    Route::get('/listings/{id}/reviews',  [ReviewController::class, 'index']);

    // Buyer inquiry route
    Route::post('/listings/{listing}/inquire', [InquiryController::class, 'store'])
        ->middleware(['auth:sanctum', 'role:buyer']);

    // Post-inquiry document access — ownership enforced in controller, not role-gated
    Route::get('/inquiries/{inquiry}/documents', [InquiryDocumentController::class, 'index'])
        ->middleware('auth:sanctum');

    // Breeder review submission (public breeder, buyer-only writer)
    Route::post('/breeders/{id}/reviews', [BreederReviewController::class, 'store'])
        ->middleware(['auth:sanctum', 'role:buyer']);

    // Buyer-facing buyer dashboard: inquiries, reviews, saved listings
    Route::prefix('buyer')->middleware(['auth:sanctum', 'role:buyer'])->group(function () {
        Route::get('/inquiry-exists', [BuyerInquiryController::class, 'inquiryExists']);
        Route::get('/review-exists',  [BuyerInquiryController::class, 'reviewExists']);
        Route::get('/inquiries',              [BuyerInquiryController::class, 'index']);
        Route::get('/inquiries/{inquiry}',    [BuyerInquiryController::class, 'show']);
        Route::get('/reviews',                [BuyerReviewController::class, 'index']);
        Route::get('/saved-listings',                   [SavedListingController::class, 'index']);
        Route::post('/saved-listings/{listing}/save',   [SavedListingController::class, 'store']);
        Route::delete('/saved-listings/{listing}/save', [SavedListingController::class, 'destroy']);
    });

    // Authenticated breeder routes
    Route::middleware(['auth:sanctum', 'role:breeder'])->group(function () {
        Route::post('/breeder/profile',       [BreederProfileController::class, 'store']);
        Route::put('/breeder/profile',        [BreederProfileController::class, 'update']);
        Route::get('/breeder/profile',        [BreederProfileController::class, 'myProfile']);
        Route::post('/breeder/profile/photo', [BreederProfileController::class, 'uploadPhoto']);

        // Listings
        Route::post('/listings',                                    [ListingController::class, 'store']);
        Route::put('/listings/{listing}',                           [ListingController::class, 'update']);
        Route::delete('/listings/{listing}',                        [ListingController::class, 'destroy']);
        Route::get('/breeder/listings',                             [ListingController::class, 'myListings']);
        Route::post('/listings/{listing}/photos',                   [ListingPhotoController::class, 'store']);
        Route::delete('/listings/{listing}/photos/{photo}',         [ListingPhotoController::class, 'destroy']);
        Route::post('/listings/{listing}/health-certificate',       [HealthCertificateController::class, 'store']);

        // Breeder inquiry management
        Route::prefix('breeder')->group(function () {
            Route::get('/inquiries',              [BreederInquiryController::class, 'index']);
            Route::get('/inquiries/unread-count', [BreederInquiryController::class, 'unreadCount']);
            Route::get('/inquiries/{inquiry}',    [BreederInquiryController::class, 'show']);
        });

        // Breeder documents
        Route::post('/breeders/{breederId}/documents',              [BreederDocumentController::class, 'store']);
        Route::delete('/breeders/{breederId}/documents/{docId}',   [BreederDocumentController::class, 'destroy']);

        // Verification requests
        Route::post('/verification-requests',        [VerificationRequestController::class, 'store']);
        Route::get('/verification-requests/status',  [VerificationRequestController::class, 'status']);
    });

    // Authenticated sitter routes
    Route::prefix('sitter')->middleware(['auth:sanctum', 'role:sitter'])->group(function () {
        Route::post('/profile',                  [SitterProfileApiController::class, 'store']);
        Route::put('/profile',                   [SitterProfileApiController::class, 'update']);
        Route::get('/profile',                   [SitterProfileApiController::class, 'myProfile']);
        Route::post('/profile/photos',           [SitterPortfolioController::class, 'store']);
        Route::delete('/profile/photos/{photo}', [SitterPortfolioController::class, 'destroy']);
        Route::get('/contact-submissions',       [SitterDashboardController::class, 'contactSubmissions']);
    });

    // Admin: document pre-signed URL access
    Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
        Route::get('/breeders/{breederId}/documents/{docId}/url',  [BreederDocumentController::class, 'url']);

        Route::prefix('admin')->group(function () {
            Route::get('/verification-requests',                                      [AdminVerificationController::class, 'index']);
            Route::put('/verification-requests/{verificationRequest}/review',         [AdminVerificationController::class, 'review']);
            Route::get('/documents/{document}/preview',                               [AdminVerificationController::class, 'documentPreview']);
        });
    });
});
