<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Order;
use App\Models\Report;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SampleReportsSeeder extends Seeder
{
    public function run(): void
    {
        Model::unguarded(function (): void {
            DB::transaction(function (): void {
                $restaurants = Restaurant::query()->orderBy('id')->get();
                if ($restaurants->isEmpty()) {
                    return;
                }

                $reporters = User::query()
                    ->where('role', UserRole::Customer->value)
                    ->orderBy('id')
                    ->get();

                $fallbackReporter = User::query()->orderBy('id')->first();
                $admin = User::query()->where('role', UserRole::Admin->value)->orderBy('id')->first();

                $templates = [
                    [
                        'subject' => 'Late delivery report',
                        'message' => 'Order arrived much later than expected and food temperature was lower than expected.',
                        'status' => 'open',
                        'resolution' => null,
                    ],
                    [
                        'subject' => 'Incorrect menu item delivered',
                        'message' => 'Received a different item than what was listed in the order confirmation.',
                        'status' => 'reviewing',
                        'resolution' => null,
                    ],
                    [
                        'subject' => 'Menu photo mismatch',
                        'message' => 'The dish looked significantly different from the menu media shown in the app.',
                        'status' => 'resolved',
                        'resolution' => 'Restaurant updated menu media and confirmed the corrected item details.',
                    ],
                    [
                        'subject' => 'Packaging quality issue',
                        'message' => 'Packaging leaked during delivery and part of the order was damaged.',
                        'status' => 'open',
                        'resolution' => null,
                    ],
                    [
                        'subject' => 'Repeated cancellation concern',
                        'message' => 'Orders from this restaurant were cancelled repeatedly without clear explanation.',
                        'status' => 'dismissed',
                        'resolution' => 'Review found no policy violation after checking order logs and communication history.',
                    ],
                    [
                        'subject' => 'Support follow-up request',
                        'message' => 'Customer requested a moderation follow-up regarding a previous unresolved complaint.',
                        'status' => 'reviewing',
                        'resolution' => null,
                    ],
                ];

                foreach ($templates as $index => $template) {
                    $restaurant = $restaurants[$index % $restaurants->count()];
                    $reporter = $reporters->isNotEmpty()
                        ? $reporters[$index % $reporters->count()]
                        : $fallbackReporter;

                    $order = null;
                    if ($reporter) {
                        $order = Order::query()
                            ->where('restaurant_id', $restaurant->id)
                            ->where('customer_id', $reporter->id)
                            ->latest('id')
                            ->first();
                    }

                    if (!$order) {
                        $order = Order::query()
                            ->where('restaurant_id', $restaurant->id)
                            ->latest('id')
                            ->first();
                    }

                    $isResolvedState = in_array($template['status'], ['resolved', 'dismissed'], true);

                    Report::query()->updateOrCreate(
                        [
                            'restaurant_id' => $restaurant->id,
                            'reporter_user_id' => $reporter?->id,
                            'subject' => $template['subject'],
                        ],
                        [
                            'order_id' => $order?->id,
                            'message' => $template['message'],
                            'status' => $template['status'],
                            'resolution' => $isResolvedState ? $template['resolution'] : null,
                            'resolved_by' => $isResolvedState ? $admin?->id : null,
                            'resolved_at' => $isResolvedState ? now()->subDays($index + 1) : null,
                        ]
                    );
                }
            });
        });
    }
}
