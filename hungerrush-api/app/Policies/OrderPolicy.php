<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    public function view(User $user, Order $order): bool
    {
        return $this->canAccess($user, $order);
    }

    public function update(User $user, Order $order): bool
    {
        return $this->canAccess($user, $order);
    }

    private function canAccess(User $user, Order $order): bool
    {
        return in_array($user->role?->value, [UserRole::RestaurantOwner->value, UserRole::RestaurantStaff->value], true)
            && $order->restaurant?->owner_user_id === $user->id;
    }
}
