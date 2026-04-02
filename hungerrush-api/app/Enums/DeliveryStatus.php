<?php

namespace App\Enums;

enum DeliveryStatus: string
{
    case Unassigned = 'unassigned';
    case Assigned = 'assigned';
    case Accepted = 'accepted';
    case PickedUp = 'picked_up';
    case Delivered = 'delivered';
    case Failed = 'failed';
}
