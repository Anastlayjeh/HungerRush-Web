<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('restaurant_registrations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('owner_user_id');
            $table->string('restaurant_name');
            $table->text('description')->nullable();
            $table->string('contact_email', 191)->nullable();
            $table->string('contact_phone', 32)->nullable();
            $table->json('payload')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->unsignedBigInteger('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_note')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index(['owner_user_id', 'status']);
            $table->index(['reviewed_by', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('restaurant_registrations');
    }
};
