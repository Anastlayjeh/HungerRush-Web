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
        Schema::table('videos', function (Blueprint $table) {
            if (! Schema::hasColumn('videos', 'moderation_status')) {
                $table->string('moderation_status')->nullable();
            }

            if (! Schema::hasColumn('videos', 'moderation_reason')) {
                $table->text('moderation_reason')->nullable();
            }

            if (! Schema::hasColumn('videos', 'moderation_confidence')) {
                $table->float('moderation_confidence')->nullable();
            }

            if (! Schema::hasColumn('videos', 'moderation_checked_at')) {
                $table->timestamp('moderation_checked_at')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $columns = array_values(array_filter([
            Schema::hasColumn('videos', 'moderation_status') ? 'moderation_status' : null,
            Schema::hasColumn('videos', 'moderation_reason') ? 'moderation_reason' : null,
            Schema::hasColumn('videos', 'moderation_confidence') ? 'moderation_confidence' : null,
            Schema::hasColumn('videos', 'moderation_checked_at') ? 'moderation_checked_at' : null,
        ]));

        if ($columns === []) {
            return;
        }

        Schema::table('videos', function (Blueprint $table) use ($columns) {
            $table->dropColumn($columns);
        });
    }
};
