<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Restaurant;
use App\Models\User;

class RestaurantPolicy
{
    public function view(User $user, Restaurant $restaurant): bool
    {
        return $this->ownsRestaurant($user, $restaurant);
    }

    public function update(User $user, Restaurant $restaurant): bool
    {
        return $this->ownsRestaurant($user, $restaurant);
    }

    private function ownsRestaurant(User $user, Restaurant $restaurant): bool
    {
        return in_array($user->role?->value, [UserRole::RestaurantOwner->value, UserRole::RestaurantStaff->value], true)
            && $restaurant->owner_user_id === $user->id;
    }
}
