<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Engineer;
use Illuminate\Http\Request;

class EngineerController extends Controller
{
    // public function index(Request $request)
    // {
    //     $q = $request->q;

    //     return Engineer::when($q, function ($query) use ($q) {
    //         $query->where('first_name', 'like', "%$q%")
    //               ->orWhere('last_name', 'like', "%$q%")
    //               ->orWhere('national_id', 'like', "%$q%");
    //     })->get();
    // }

    // public function show($id)
    // {
    //     return Engineer::findOrFail($id);
    // }
}
