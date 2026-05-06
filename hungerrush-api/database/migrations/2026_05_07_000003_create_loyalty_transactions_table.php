<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('loyalty_transactions')) {
            return;
        }

        Schema::create('loyalty_transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('restaurant_id');
            $table->unsignedBigInteger('order_id')->nullable();
            $table->unsignedBigInteger('offer_id')->nullable();
            $table->unsignedInteger('points');
            $table->enum('type', ['earned', 'redeemed']);
            $table->string('description', 255)->nullable();
            $table->timestamps();

            $table->index(['user_id', 'restaurant_id', 'created_at']);
            $table->index(['restaurant_id', 'type']);
            $table->index('order_id');
            $table->index('offer_id');
            $table->unique(['order_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loyalty_transactions');
    }
};
