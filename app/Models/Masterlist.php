<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Masterlist extends Model
{
    protected $connection = 'masterlist';
    protected $table = 'employee_masterlist';
    protected $primaryKey = 'empid';
    public $timestamps = false;

    protected $fillable = [
        'empid',
        'emp_name',

    ];
}
