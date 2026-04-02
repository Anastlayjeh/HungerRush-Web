<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\MenuItem;
use App\Models\User;

class MenuItemPolicy
{
    public function view(User $user, MenuItem $menuItem): bool
    {
        return $this->canAccess($user, $menuItem);
    }

    public function create(User $user): bool
    {
        return in_array($user->role?->value, [UserRole::RestaurantOwner->value, UserRole::RestaurantStaff->value], true);
    }

    public function update(User $user, MenuItem $menuItem): bool
    {
        return $this->canAccess($user, $menuItem);
    }

    public function delete(User $user, MenuItem $menuItem): bool
    {
        return $this->canAccess($user, $menuItem);
    }

    private function canAccess(User $user, MenuItem $menuItem): bool
    {
        return in_array($user->role?->value, [UserRole::RestaurantOwner->value, UserRole::RestaurantStaff->value], true)
            && $menuItem->category?->restaurant?->owner_user_id === $user->id;
    }
}
