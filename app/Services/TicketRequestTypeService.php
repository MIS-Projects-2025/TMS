<?php

namespace App\Services;

use App\Repositories\TicketRequestTypeRepository;

class TicketRequestTypeService
{
    protected TicketRequestTypeRepository $repository;

    public function __construct(TicketRequestTypeRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Get all request types grouped by category
     */
    public function getAllGrouped(): array
    {
        return $this->repository->getAllGrouped();
    }

    /**
     * Get MIS request types only
     */
    public function getMisRequestType(): array
    {
        return $this->repository->getMisRequestType();
    }

    /**
     * Get request types formatted for form
     */
    public function getRequestTypesForForm(array $userRoles): array
    {
        return $this->repository->getRequestTypesForForm($userRoles);
    }

    /**
     * Get all request types for table display (flat array)
     */
    public function getAllForTable()
    {
        return $this->repository->getAllForTable();
    }

    /**
     * Create a new request type
     */
    public function create(array $data)
    {
        return $this->repository->create($data);
    }

    /**
     * Update an existing request type
     */
    public function update(int $id, array $data)
    {
        return $this->repository->update($id, $data);
    }

    /**
     * Delete a request type
     */
    public function delete(int $id): bool
    {
        return $this->repository->delete($id);
    }

    /**
     * Find request type by ID
     */
    public function findById(int $id)
    {
        return $this->repository->findById($id);
    }
}
