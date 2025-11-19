<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TicketingController;
use App\Http\Middleware\AuthMiddleware;


$app_name = $app_name ?? env('APP_NAME', 'app');
// dd($app_name);
Route::prefix($app_name)
    ->middleware(AuthMiddleware::class)
    ->group(function () {

        // Ticket Routes
        Route::get('/tickets', [TicketingController::class, 'showTicketForm'])->name('tickets');
        Route::post('/tickets', [TicketingController::class, 'storeTicket'])->name('tickets.store');
    });
