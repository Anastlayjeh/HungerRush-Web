<?php

namespace App\Enums;

enum PaymentStatus: string
{
    case Unpaid = 'unpaid';
    case Authorized = 'authorized';
    case Paid = 'paid';
    case Refunded = 'refunded';
    case Failed = 'failed';
}
