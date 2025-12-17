<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    /**
     * Use the employees table and a different database connection
     */
    protected $connection = 'masterlist'; // 👈 your secondary DB connection name
    protected $table = 'employee_masterlist';
    protected $primaryKey = 'EMPLOYID';
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'EMPLOYID',
        'EMP_NAME',
        'DEPARTMENT',
        'JOB_TITLE',

    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Casts
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get unread notification count
     */
    public function getUnreadNotificationsCount()
    {
        return $this->notifications()
            ->whereNull('read_at')
            ->count();
    }
    // In User model
    public static function getApproversByProdline(string $prodline): array
    {
        // Get all APPROVER1 and APPROVER2 EMPLOYIDs in this PRODLINE
        $approverIds = self::where('PRODLINE', $prodline)
            ->whereNotNull('APPROVER1')
            ->orWhere(function ($q) use ($prodline) {
                $q->where('PRODLINE', $prodline)
                    ->whereNotNull('APPROVER2');
            })
            ->get(['APPROVER1', 'APPROVER2']);

        $listIds = [];
        foreach ($approverIds as $row) {
            if ($row->APPROVER1) $listIds[] = $row->APPROVER1;
            if ($row->APPROVER2) $listIds[] = $row->APPROVER2;
        }

        // Unique EMPLOYIDs
        $listIds = array_values(array_unique($listIds));

        if (empty($listIds)) {
            return [];
        }

        // Get EMPNAME for each EMPLOYID
        $approvers = self::whereIn('EMPLOYID', $listIds)
            ->get(['EMPLOYID', 'EMPNAME']);

        // Return as array suitable for select/options
        return $approvers->map(fn($a) => [
            'EMPLOYID' => $a->EMPLOYID,
            'EMPNAME' => $a->EMPNAME,
        ])->toArray();
    }
}
