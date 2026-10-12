@extends('emails.layout')

@section('subject')
  @lang('mail.inquiry.new_inquiry.subject', ['listing' => $listingTitle])
@endsection

@section('content')
  <h2 style="font-size: 18px; margin: 0 0 16px;">
    @lang('mail.inquiry.new_inquiry.title')
  </h2>

  <p style="margin: 0 0 8px; line-height: 1.6;">
    <strong>@lang('mail.inquiry.new_inquiry.listing_label'):</strong> {{ $listingTitle }}
  </p>
  <p style="margin: 0 0 8px; line-height: 1.6;">
    <strong>@lang('mail.inquiry.new_inquiry.buyer_label'):</strong> {{ $buyerName }}
  </p>

  <p style="margin: 16px 0 8px; line-height: 1.6;">
    <strong>@lang('mail.inquiry.new_inquiry.message_label'):</strong>
  </p>
  <p style="margin: 0 0 24px; line-height: 1.6; color: #374151;">
    {{ $message ?? __('mail.inquiry.new_inquiry.no_message') }}
  </p>

  <a href="{{ $dashboardUrl }}"
     style="display: inline-block; padding: 10px 20px; background-color: #16a34a; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">
    @lang('mail.inquiry.new_inquiry.cta')
  </a>
@endsection
