<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;


class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if admin user already exists
        $admin = User::where('username', 'admin')->first();
        
        if ($admin) {
            $this->command->info('Admin user already exists. Updating password...');
            $admin->update([
                'password' => Hash::make('Admin.IDAP2025'),
                'is_admin' => true,
                'is_active' => true,
            ]);
        } else {
            User::create([
                'username' => 'admin',
                'name' => 'System Admin',
                'password' => Hash::make('Admin.IDAP2025'),
                'is_admin' => true,
                'is_active' => true,
            ]);
            $this->command->info('Admin user created successfully!');
        }
    }
}
