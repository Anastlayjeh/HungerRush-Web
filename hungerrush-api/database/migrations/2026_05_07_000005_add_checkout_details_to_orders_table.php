<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $missing = fn (string $column): bool => !Schema::hasColumn('orders', $column);

        Schema::table('orders', function (Blueprint $table) use ($missing) {
            if ($missing('delivery_address')) {
                $table->json('delivery_address')->nullable();
            }
            if ($missing('delivery_address_label')) {
                $table->string('delivery_address_label', 1000)->nullable();
            }
            if ($missing('delivery_phone')) {
                $table->string('delivery_phone', 32)->nullable();
            }
            if ($missing('order_notes')) {
                $table->text('order_notes')->nullable();
            }
            if ($missing('payment_method')) {
                $table->string('payment_method', 64)->nullable();
            }
            if ($missing('delivery_mode')) {
                $table->string('delivery_mode', 32)->nullable();
            }
            if ($missing('scheduled_label')) {
                $table->string('scheduled_label')->nullable();
            }
            if ($missing('change_request')) {
                $table->string('change_request')->nullable();
            }
            if ($missing('use_loyalty')) {
                $table->boolean('use_loyalty')->default(false);
            }
            if ($missing('save_change_in_wallet')) {
                $table->boolean('save_change_in_wallet')->default(false);
            }
        });
    }

    public function down(): void
    {
        $columns = collect([
            'delivery_address',
            'delivery_address_label',
            'delivery_phone',
            'order_notes',
            'payment_method',
            'delivery_mode',
            'scheduled_label',
            'change_request',
            'use_loyalty',
            'save_change_in_wallet',
        ])->filter(fn (string $column): bool => Schema::hasColumn('orders', $column))->values()->all();

        if ($columns !== []) {
            Schema::table('orders', function (Blueprint $table) use ($columns) {
                $table->dropColumn($columns);
            });
        }
    }
};
