<?php

namespace App\Exceptions;

use RuntimeException;

class DuplicateInquiryException extends RuntimeException
{
    public function __construct()
    {
        parent::__construct(__('errors.duplicate_inquiry'));
    }
}
