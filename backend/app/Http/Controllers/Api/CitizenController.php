<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Citizen;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CitizenController extends Controller
{
    public function search(Request $request)
    {
        $query = Citizen::query();

        // Search by national ID (exact match)
        if ($request->has('nationalId') && $request->nationalId) {
            $query->where('national_id', $request->nationalId);
        }

        // Search by names (LIKE search)
        if ($request->has('firstName') && $request->firstName) {
            $query->where('first_name', 'like', '%' . $request->firstName . '%');
        }

        if ($request->has('fatherName') && $request->fatherName) {
            $query->where('father_name', 'like', '%' . $request->fatherName . '%');
        }

        if ($request->has('grandfatherName') && $request->grandfatherName) {
            $query->where('grandfather_name', 'like', '%' . $request->grandfatherName . '%');
        }

        if ($request->has('lastName') && $request->lastName) {
            $query->where('last_name', 'like', '%' . $request->lastName . '%');
        }

        // Don't return all citizens if no search params
        if (!$request->has('nationalId') && 
            !$request->has('firstName') && 
            !$request->has('fatherName') && 
            !$request->has('grandfatherName') && 
            !$request->has('lastName')) {
            return response()->json([]);
        }

        $results = $query->get();

        // Transform to camelCase for frontend compatibility
        $transformedResults = $results->map(function ($citizen) {
            return [
                'id' => $citizen->id,
                'nationalId' => $citizen->national_id,
                'firstName' => $citizen->first_name,
                'fatherName' => $citizen->father_name,
                'grandfatherName' => $citizen->grandfather_name,
                'lastName' => $citizen->last_name,
                'motherName' => $citizen->mother_name,
                'dob' => $citizen->dob,
                'gender' => $citizen->gender,
                'address' => $citizen->address,
            ];
        });

        // Log the search action
        $user = $request->user();
        if ($user) {
            $searchParams = $request->only(['nationalId', 'firstName', 'fatherName', 'grandfatherName', 'lastName']);
            $queryDetails = json_encode(array_filter($searchParams));
            
            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'SEARCH',
                'details' => "Searched citizens: {$queryDetails}",
            ]);
        }

        return response()->json($transformedResults);
    }
}

