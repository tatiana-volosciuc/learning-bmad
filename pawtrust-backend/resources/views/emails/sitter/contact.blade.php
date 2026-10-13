@extends('emails.layout')

@section('subject')
  @lang('mail.sitter.contact.subject')
@endsection

@section('content')
  <h2 style="font-size: 18px; margin: 0 0 16px;">
    @lang('mail.sitter.contact.title')
  </h2>

  <p style="margin: 0 0 8px; line-height: 1.6;">
    <strong>@lang('mail.sitter.contact.from'):</strong> {{ $senderName }}
  </p>

  <p style="margin: 16px 0 8px; line-height: 1.6;">
    <strong>@lang('mail.sitter.contact.message'):</strong>
  </p>
  <p style="margin: 0 0 24px; line-height: 1.6; color: #374151;">
    {{ $contactMessage }}
  </p>

  <a href="{{ $dashboardUrl }}"
     style="display: inline-block; padding: 10px 20px; background-color: #16a34a; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">
    @lang('mail.sitter.contact.cta')
  </a>
@endsection
