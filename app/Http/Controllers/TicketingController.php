<?php

namespace App\Http\Controllers;


use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class TicketingController extends Controller
{

    public function showTicketForm(): Response
    {
        return Inertia::render('Ticketing/Create');
    }
}
