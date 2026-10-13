<?php

namespace App\Exceptions;

use RuntimeException;

class DuplicateBreederReviewException extends RuntimeException
{
    public function __construct()
    {
        parent::__construct(__('errors.duplicate_review'));
    }
}
