<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('users') || !Schema::hasColumn('users', 'email')) {
            return;
        }

        $this->normalizeAndDeduplicateEmails();

        if (!$this->hasUniqueEmailIndex()) {
            Schema::table('users', function (Blueprint $table) {
                $table->unique('email', 'users_email_unique');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('users')) {
            return;
        }

        if ($this->hasNamedEmailIndex('users_email_unique')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropUnique('users_email_unique');
            });
        }
    }

    private function normalizeAndDeduplicateEmails(): void
    {
        $users = DB::table('users')
            ->select(['id', 'email'])
            ->whereNotNull('email')
            ->orderBy('id')
            ->get();

        $takenEmails = [];

        foreach ($users as $user) {
            $currentEmail = is_string($user->email) ? $user->email : null;

            if ($currentEmail === null) {
                continue;
            }

            $normalized = strtolower(trim($currentEmail));

            if ($normalized === '') {
                DB::table('users')->where('id', $user->id)->update(['email' => null]);
                continue;
            }

            $nextEmail = $normalized;

            if (isset($takenEmails[$nextEmail])) {
                $nextEmail = $this->buildDuplicateEmail($normalized, (int) $user->id, $takenEmails);
            }

            $takenEmails[$nextEmail] = true;

            if ($currentEmail !== $nextEmail) {
                DB::table('users')->where('id', $user->id)->update(['email' => $nextEmail]);
            }
        }
    }

    private function buildDuplicateEmail(string $normalizedEmail, int $userId, array $takenEmails): string
    {
        [$localPart, $domainPart] = array_pad(explode('@', $normalizedEmail, 2), 2, null);
        $localPart = $localPart !== null && $localPart !== '' ? $localPart : "user{$userId}";
        $domainPart = $domainPart !== null && $domainPart !== '' ? $domainPart : 'example.local';

        $counter = 0;

        do {
            $suffix = $counter === 0 ? "+dup{$userId}" : "+dup{$userId}_{$counter}";
            $maxLocalLength = 191 - strlen($domainPart) - 1 - strlen($suffix);
            $maxLocalLength = max($maxLocalLength, 1);
            $baseLocal = substr($localPart, 0, $maxLocalLength);
            $candidate = "{$baseLocal}{$suffix}@{$domainPart}";
            $counter++;
        } while (isset($takenEmails[$candidate]));

        return $candidate;
    }

    private function hasUniqueEmailIndex(): bool
    {
        $driver = DB::getDriverName();

        if ($driver !== 'mysql') {
            return $this->hasNamedEmailIndex('users_email_unique');
        }

        return DB::table('information_schema.statistics')
            ->where('table_schema', DB::getDatabaseName())
            ->where('table_name', 'users')
            ->where('column_name', 'email')
            ->where('non_unique', 0)
            ->exists();
    }

    private function hasNamedEmailIndex(string $indexName): bool
    {
        $driver = DB::getDriverName();

        if ($driver !== 'mysql') {
            return false;
        }

        return DB::table('information_schema.statistics')
            ->where('table_schema', DB::getDatabaseName())
            ->where('table_name', 'users')
            ->where('index_name', $indexName)
            ->exists();
    }
};
