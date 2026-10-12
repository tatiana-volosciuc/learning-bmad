<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ContactSitterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'    => ['required', 'string', 'max:150'],
            // rfc-only (no :dns) - a DNS-lookup validator would make this request network-dependent
            // and flaky in CI/offline environments, unlike every other email rule in this codebase.
            'email'   => ['required', 'email:rfc', 'max:255'],
            'message' => ['required', 'string', 'min:10', 'max:1000'],
        ];
    }
}
