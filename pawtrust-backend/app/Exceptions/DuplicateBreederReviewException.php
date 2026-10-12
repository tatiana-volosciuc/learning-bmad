<?php

namespace App\Exceptions;

use RuntimeException;

class DuplicateBreederReviewException extends RuntimeException
{
    public function __construct()
    {
        parent::__construct('You have already reviewed this breeder.');
    }
}
