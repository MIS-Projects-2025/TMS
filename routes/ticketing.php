<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TicketingController;


$app_name = $app_name ?? env('APP_NAME', 'app');

Route::prefix($app_name)
    ->group(function () {

        // Ticket Routes
        Route::get('/tickets', [TicketingController::class, 'showTicketForm'])->name('tickets');
        // Route::post('/tickets', [TicketingController::class, 'store'])->name('tickets.store');
    });
