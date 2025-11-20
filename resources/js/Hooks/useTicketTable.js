import { useState, useRef, useEffect } from "react";
import { router } from "@inertiajs/react";

export default function useTicketingTable(initialProps) {
    const {
        pagination,
        filters: initialFilters = {},
        statusCounts = {},
    } = initialProps;

    const [loading, setLoading] = useState(false);
    const searchTimeoutRef = useRef(null);
    const [searchValue, setSearchValue] = useState("");
    const [activeFilter, setActiveFilter] = useState(
        initialFilters?.status || "all"
    );
    const [filters, setFilters] = useState(initialFilters || {});

    // Status mapping
    const statusMap = {
        all: "all",
        open: "open",
        resolved: 3,
        closed: 4,
        returned: "returned",
        critical: "critical",
    };

    const reverseStatusMap = {
        open: "open",
        3: "resolved",
        4: "closed",
        returned: "returned",
        critical: "critical",
    };

    // Function to determine if a ticket is critical
    const isTicketCritical = (ticket) => {
        if (ticket.STATUS !== 1) return false;

        const createdAt = new Date(ticket.CREATED_AT);
        const now = new Date();
        const minutesOpen = (now - createdAt) / (1000 * 60);

        return minutesOpen > 30;
    };

    // Handle status filter change
    const handleStatusFilter = (filterType) => {
        console.log("🔄 Changing filter to:", filterType);
        setActiveFilter(filterType);
        setLoading(true);

        const statusValue = statusMap[filterType];

        const params = {
            page: 1,
            pageSize: pagination?.per_page || 10,
            search: filters?.search || "",
            project: filters?.project || "",
            status: statusValue,
            sortField: filters?.sortField || "created_at",
            sortOrder: filters?.sortOrder || "desc",
        };

        console.log("📤 Sending params:", params);

        router.get(route("tickets.datatable"), params, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => {
                setLoading(false);
            },
        });
    };

    // Handle table changes (pagination, sorting)
    const handleTableChange = (paginationData, _, sorter) => {
        setLoading(true);

        const params = {
            page: paginationData.current,
            pageSize: paginationData.pageSize,
            search: filters?.search || "",
            project: filters?.project || "",
            status: activeFilter === "all" ? "all" : statusMap[activeFilter],
            sortField: sorter?.field || "created_at",
            sortOrder: sorter?.order === "ascend" ? "asc" : "desc",
        };

        router.get(route("tickets.datatable"), params, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setLoading(false),
        });
    };

    // Handle search with debounce
    const handleSearch = (value) => {
        setSearchValue(value);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            setLoading(true);

            const params = {
                page: 1,
                pageSize: pagination?.per_page || 10,
                search: value,
                project: filters?.project || "",
                status:
                    activeFilter === "all" ? "all" : statusMap[activeFilter],
                sortField: filters?.sortField || "created_at",
                sortOrder: filters?.sortOrder || "desc",
            };

            router.get(route("tickets.datatable"), params, {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setLoading(false),
            });
        }, 500);
    };

    // Sync with URL filters
    useEffect(() => {
        setSearchValue(filters?.search || "");
        if (filters?.status) {
            if (filters.status === "critical") {
                setActiveFilter("critical");
            } else if (filters.status !== "all") {
                setActiveFilter(reverseStatusMap[filters.status] || "all");
            } else {
                setActiveFilter("all");
            }
        }
    }, [filters?.search, filters?.status]);

    return {
        loading,
        searchValue,
        activeFilter,
        filters,
        statusMap,
        reverseStatusMap,
        handleStatusFilter,
        handleTableChange,
        handleSearch,
        isTicketCritical,
        setSearchValue,
        setActiveFilter,
        setFilters,
    };
}
