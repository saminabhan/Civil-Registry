<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Citizen extends Model
{
    protected $fillable = [
        'national_id',
        'first_name',
        'father_name',
        'grandfather_name',
        'last_name',
        'mother_name',
        'dob',
        'gender',
        'address',
    ];

    protected $casts = [
        'dob' => 'date',
    ];
}


