<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->repairBrokenTable('restaurant_registrations', fn () => $this->createRestaurantRegistrationsTable());
        $this->repairBrokenTable('support_requests', fn () => $this->createSupportRequestsTable());
        $this->repairBrokenTable('reports', fn () => $this->createReportsTable());
    }

    public function down(): void
    {
        // Intentionally no-op. This migration only repairs broken local table
        // shells where MySQL reports a table without a storage engine.
    }

    private function repairBrokenTable(string $table, callable $create): void
    {
        if (!$this->needsRepair($table)) {
            return;
        }

        $this->discardTablespace($table);
        DB::statement("DROP TABLE IF EXISTS `{$table}`");
        $this->removeOrphanTablespaceFile($table);
        $create();
    }

    private function discardTablespace(string $table): void
    {
        try {
            DB::statement("ALTER TABLE `{$table}` DISCARD TABLESPACE");
        } catch (Throwable) {
            // Some broken tables are too damaged for ALTER TABLE. Dropping the
            // shell and recreating the table is still safe to attempt.
        }
    }

    private function needsRepair(string $table): bool
    {
        $driver = DB::connection()->getDriverName();
        if ($driver !== 'mysql') {
            return !Schema::hasTable($table);
        }

        $status = DB::selectOne('SHOW TABLE STATUS WHERE Name = ?', [$table]);
        if ($status === null) {
            return true;
        }

        return empty($status->Engine);
    }

    private function removeOrphanTablespaceFile(string $table): void
    {
        try {
            $dataDir = DB::selectOne('SELECT @@datadir AS data_dir')?->data_dir;
            $database = DB::selectOne('SELECT DATABASE() AS database_name')?->database_name;
            if (!is_string($dataDir) || !is_string($database) || $dataDir === '' || $database === '') {
                return;
            }

            $databaseDir = rtrim($dataDir, "\\/") . DIRECTORY_SEPARATOR . $database;
            $file = $databaseDir . DIRECTORY_SEPARATOR . "{$table}.ibd";
            $realDatabaseDir = realpath($databaseDir);
            if ($realDatabaseDir === false || !is_file($file)) {
                return;
            }

            $realFile = realpath($file);
            if ($realFile === false || !str_starts_with($realFile, $realDatabaseDir . DIRECTORY_SEPARATOR)) {
                return;
            }

            @unlink($realFile);
        } catch (Throwable) {
            // If the database service blocks file cleanup, the CREATE statement
            // below will fail clearly and the operator can remove the orphan.
        }
    }

    private function createRestaurantRegistrationsTable(): void
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

    private function createSupportRequestsTable(): void
    {
        Schema::create('support_requests', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('channel')->default('app');
            $table->string('subject');
            $table->text('message');
            $table->enum('status', ['open', 'in_progress', 'resolved', 'closed'])->default('open');
            $table->text('response')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index(['status', 'created_at']);
        });
    }

    private function createReportsTable(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('reporter_user_id')->nullable();
            $table->unsignedBigInteger('restaurant_id')->nullable();
            $table->unsignedBigInteger('order_id')->nullable();
            $table->string('subject');
            $table->text('message');
            $table->enum('status', ['open', 'reviewing', 'resolved', 'dismissed'])->default('open');
            $table->text('resolution')->nullable();
            $table->unsignedBigInteger('resolved_by')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['reporter_user_id', 'created_at']);
            $table->index(['restaurant_id', 'created_at']);
            $table->index(['status', 'created_at']);
            $table->index('order_id');
        });
    }
};
