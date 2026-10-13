<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SitterProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'full_name'        => ['required', 'string', 'max:150'],
            'bio'              => ['nullable', 'string', 'max:500'],
            'service_areas'    => ['required', 'array', 'min:1', 'max:3'],
            'service_areas.*'  => ['required', 'string', 'max:100'],
            'services'         => ['required', 'array', 'min:1'],
            'services.*'       => ['required', 'in:boarding,dog_walking,day_care,drop_in'],
            'rates'            => ['nullable', 'string', 'max:200'],
            'experience_years' => ['nullable', 'integer', 'min:0', 'max:50'],
            'languages'        => ['nullable', 'array'],
            'languages.*'      => ['required', 'string', 'max:10'],
        ];
    }
}
