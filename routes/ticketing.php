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
        Route::get('/tickets/datatable', [TicketingController::class, 'getTicketsDataTable'])->name('tickets.datatable');


        //action
        Route::post('/tickets/action', [TicketingController::class, 'ticketAction'])->name('tickets.action');

        Route::get('/tickets/{ticketId}/details', [TicketingController::class, 'getTicketDetails'])
            ->name('tickets.details');
        Route::get('/tickets/{ticketId}/logs', [TicketingController::class, 'logs'])
            ->name('tickets.logs');
    });
