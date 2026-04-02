<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\MenuCategory;
use App\Models\User;

class MenuCategoryPolicy
{
    public function view(User $user, MenuCategory $menuCategory): bool
    {
        return $this->canAccess($user, $menuCategory);
    }

    public function create(User $user): bool
    {
        return in_array($user->role?->value, [UserRole::RestaurantOwner->value, UserRole::RestaurantStaff->value], true);
    }

    public function update(User $user, MenuCategory $menuCategory): bool
    {
        return $this->canAccess($user, $menuCategory);
    }

    public function delete(User $user, MenuCategory $menuCategory): bool
    {
        return $this->canAccess($user, $menuCategory);
    }

    private function canAccess(User $user, MenuCategory $menuCategory): bool
    {
        return in_array($user->role?->value, [UserRole::RestaurantOwner->value, UserRole::RestaurantStaff->value], true)
            && $menuCategory->restaurant?->owner_user_id === $user->id;
    }
}
