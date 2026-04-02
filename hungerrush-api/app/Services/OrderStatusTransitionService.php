<?php

namespace App\Services;

use App\Enums\OrderStatus;

class OrderStatusTransitionService
{
    /**
     * @var array<string, array<int, string>>
     */
    private array $allowedTransitions = [
        'pending' => ['accepted', 'rejected', 'cancelled'],
        'accepted' => ['preparing', 'cancelled'],
        'preparing' => ['ready_for_pickup', 'cancelled'],
        'ready_for_pickup' => ['picked_up', 'cancelled'],
        'picked_up' => ['on_the_way'],
        'on_the_way' => ['delivered'],
        'rejected' => [],
        'delivered' => [],
        'cancelled' => [],
    ];

    public function canTransition(OrderStatus $from, OrderStatus $to): bool
    {
        return in_array($to->value, $this->allowedTransitions[$from->value] ?? [], true);
    }
}
