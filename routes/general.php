<?php

use App\Http\Controllers\General\AdminController;
use App\Http\Controllers\General\ProfileController;

use App\Http\Middleware\AuthMiddleware;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Middleware\SupportMiddleware;

$app_name = env('APP_NAME', '');

Route::redirect('/', "/$app_name");

Route::prefix($app_name)->middleware(AuthMiddleware::class)->group(function () {


  Route::middleware(SupportMiddleware::class)->group(function () {
    Route::get("/", [DashboardController::class, 'index'])->name('dashboard');
  });
  Route::get("/profile", [ProfileController::class, 'index'])->name('profile.index');
  Route::post("/change-password", [ProfileController::class, 'changePassword'])->name('changePassword');
});
