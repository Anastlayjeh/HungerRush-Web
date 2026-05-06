<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loyalty_points', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('points_balance')->default(0);
            $table->unsignedInteger('total_earned')->default(0);
            $table->unsignedInteger('total_redeemed')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'restaurant_id']);
            $table->index(['restaurant_id', 'points_balance']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loyalty_points');
    }
};
