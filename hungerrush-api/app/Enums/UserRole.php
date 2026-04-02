<?php

namespace App\Enums;

enum UserRole: string
{
    case Customer = 'customer';
    case RestaurantOwner = 'restaurant_owner';
    case RestaurantStaff = 'restaurant_staff';
    case Driver = 'driver';
    case Admin = 'admin';
}
