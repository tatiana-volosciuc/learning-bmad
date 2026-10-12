<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SitterSearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'service_area' => ['nullable', 'string', 'max:100'],
            'service'      => ['nullable', 'in:boarding,dog_walking,day_care,drop_in'],
            'page'         => ['nullable', 'integer', 'min:1'],
            'per_page'     => ['nullable', 'integer', 'in:10,20,50'],
        ];
    }
}
