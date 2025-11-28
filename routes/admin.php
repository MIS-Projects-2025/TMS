<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TicketRequestTypeController;
use App\Http\Middleware\SupportMiddleware;

$app_name = $app_name ?? env('APP_NAME', 'app');

Route::prefix($app_name)
    ->middleware(SupportMiddleware::class)
    ->group(function () {

        // Request Type Routes
        Route::get('/requestTypes', [TicketRequestTypeController::class, 'index'])->name('request.type');
        Route::post('/requestTypes', [TicketRequestTypeController::class, 'store'])->name('request-types.store');
        Route::put('/requestTypes/{id}', [TicketRequestTypeController::class, 'update'])->name('request-types.update');
    });
