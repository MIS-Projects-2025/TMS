<?php

namespace App\Services;

use App\Repositories\ApproverRepository;

class ApproverService
{
    protected ApproverRepository $approverRepository;

    public function __construct(ApproverRepository $approverRepository)
    {
        $this->approverRepository = $approverRepository;
    }
    public function approverTable()
    {
        return $this->approverRepository->approverTable();
    }
    public function getApproversOptions()
    {
        return $this->approverRepository->getApproversOptions();
    }
    public function create(array $data)
    {
        return $this->approverRepository->create($data);
    }
    public function findById(int $id)
    {
        return $this->approverRepository->findById($id);
    }
    public function delete(int $id): bool
    {
        return $this->approverRepository->delete($id);
    }
}
