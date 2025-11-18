<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_request_types', function (Blueprint $table) {
            $table->id();
            $table->string('category');      // e.g., Hardware, Printer, Promis
            $table->string('name');          // e.g., Desktop, Promis Terminal
            $table->boolean('has_data')->default(false); // true if DB fetch is needed
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_request_types');
    }
};
