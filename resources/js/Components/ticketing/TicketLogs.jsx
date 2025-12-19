import React, { useState, useEffect, useRef } from "react";
import { Timeline, Tag, Spin } from "antd";
import {
    FileTextOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    StopOutlined,
    RollbackOutlined,
    HistoryOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const TicketLogs = ({ history = [], loading = false }) => {
    const [displayedItems, setDisplayedItems] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const scrollContainerRef = useRef(null);
    const ITEMS_PER_PAGE = 5;
    console.log(history);

    // Initialize first page
    useEffect(() => {
        if (history.length > 0) {
            const initialItems = history.slice(0, ITEMS_PER_PAGE);
            setDisplayedItems(initialItems);
            setCurrentPage(1);
            setHasMore(history.length > ITEMS_PER_PAGE);
        } else {
            setDisplayedItems([]);
            setCurrentPage(1);
            setHasMore(false);
        }
    }, [history]);

    // Load more items
    const loadMore = () => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);

        setTimeout(() => {
            const nextPage = currentPage + 1;
            const startIndex = currentPage * ITEMS_PER_PAGE;
            const endIndex = startIndex + ITEMS_PER_PAGE;
            const newItems = history.slice(startIndex, endIndex);

            if (newItems.length > 0) {
                setDisplayedItems((prev) => [...prev, ...newItems]);
                setCurrentPage(nextPage);
                setHasMore(endIndex < history.length);
            } else {
                setHasMore(false);
            }
            setIsLoadingMore(false);
        }, 300);
    };

    // Scroll handler
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (
            (scrollTop + clientHeight) / scrollHeight > 0.8 &&
            hasMore &&
            !isLoadingMore
        ) {
            loadMore();
        }
    };

    const getActionColor = (actionType) => {
        const colors = {
            CREATED: "blue",
            ONGOING: "orange",
            RESOLVE: "green",
            CLOSE: "purple",
            CANCEL: "red",
            RETURN: "yellow",
            ASSIGN: "cyan",
        };
        return colors[actionType] || "default";
    };

    const getActionIcon = (actionType) => {
        const icons = {
            CREATED: <FileTextOutlined />,
            ONGOING: <ClockCircleOutlined />,
            RESOLVE: <CheckCircleOutlined />,
            CLOSE: <CheckCircleOutlined />,
            CANCEL: <StopOutlined />,
            RETURN: <RollbackOutlined />,
            ASSIGN: <HistoryOutlined />,
        };
        return icons[actionType] || <FileTextOutlined />;
    };

    if (loading) {
        return (
            <div className="py-20 text-center text-gray-500">
                <Spin size="large" />
                <div className="mt-4">Loading history...</div>
            </div>
        );
    }

    if (!history.length) {
        return (
            <div className="py-4 text-center text-gray-500">
                No history available.
            </div>
        );
    }

    return (
        <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            style={{
                maxHeight: "500px",
                overflowY: "auto",
                paddingRight: "8px",
            }}
            className="custom-scrollbar"
        >
            <Timeline
                className="ml-4"
                items={displayedItems.map((item, index) => {
                    const dotColor =
                        item.NEW_STATUS_COLOR ||
                        getActionColor(item.ACTION_TYPE);

                    // Dynamic field changes
                    // Dynamic field changes
                    const changes = [];
                    if (item.OLD_VALUES && item.NEW_VALUES) {
                        Object.keys(item.NEW_VALUES).forEach((key) => {
                            let oldVal = item.OLD_VALUES[key] ?? "";
                            let newVal = item.NEW_VALUES[key] ?? "—";

                            // Determine if this field should be treated as a date
                            const isDateField =
                                key.toLowerCase().endsWith("_at") ||
                                key.toLowerCase().includes("date");

                            if (isDateField) {
                                const oldDate = dayjs(oldVal);
                                const newDate = dayjs(newVal);
                                if (oldDate.isValid())
                                    oldVal = oldDate.format(
                                        "MMM DD, YYYY - hh:mm A"
                                    );
                                if (newDate.isValid())
                                    newVal = newDate.format(
                                        "MMM DD, YYYY - hh:mm A"
                                    );
                            }

                            // Only push changes if values actually differ
                            if (oldVal !== newVal) {
                                changes.push({ key, oldVal, newVal });
                            }
                        });
                    }

                    return {
                        color: dotColor,
                        dot: getActionIcon(item.ACTION_TYPE),
                        children: (
                            <div className="pb-4" key={index}>
                                {/* Action Tag & Timestamp */}
                                <div className="flex items-center gap-2 mt-4">
                                    <Tag color={dotColor}>
                                        {item.ACTION_TYPE || "Remark"}
                                    </Tag>
                                    <span className="text-xs text-base-500">
                                        {item.ACTION_AT
                                            ? dayjs(item.ACTION_AT).format(
                                                  "MMM DD, YYYY - hh:mm A"
                                              )
                                            : "—"}
                                    </span>
                                </div>
                                {/* Dynamic Changes */}
                                {changes.length > 0 && (
                                    <div className="mt-2 flex flex-col text-sm gap-1">
                                        {/* Header Row */}
                                        <div className="grid grid-cols-3 gap-2 font-semibold text-gray-500">
                                            <span>Field</span>
                                            <span>Old Value</span>
                                            <span>New Value</span>
                                        </div>

                                        {/* Divider */}
                                        <div className="border-b border-gray-200"></div>

                                        {/* Values */}
                                        {changes.map((c, i) => (
                                            <div
                                                key={i}
                                                className="grid grid-cols-3 gap-2 items-center"
                                            >
                                                {/* Label column */}
                                                <Tag
                                                    color="blue"
                                                    className="truncate"
                                                >
                                                    {c.key
                                                        .replace(/_/g, " ")
                                                        .toUpperCase()}
                                                </Tag>

                                                {/* Old Value column */}
                                                <span className="truncate">
                                                    {c.oldVal || "—"}
                                                </span>

                                                {/* New Value column */}
                                                <span className="truncate">
                                                    {c.newVal || "—"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Remarks */}
                                {item.REMARKS && (
                                    <div className="mt-2 text-sm text-gray-600">
                                        {item.REMARKS}
                                    </div>
                                )}

                                {/* Action By */}
                                {item.ACTION_BY && (
                                    <div className="text-xs text-base-500 mt-1">
                                        By: {item.ACTION_BY}
                                    </div>
                                )}
                            </div>
                        ),
                    };
                })}
            />

            {/* Loading More */}
            {isLoadingMore && (
                <div className="text-center py-4">
                    <Spin size="small" />
                    <span className="ml-2 text-sm text-gray-500">
                        Loading more...
                    </span>
                </div>
            )}

            {/* End of List */}
            {!hasMore && displayedItems.length > 0 && (
                <div className="text-center py-4 text-xs text-gray-400 border-t border-gray-200">
                    No more history to load
                </div>
            )}

            {/* Showing count */}
            <div className="text-center py-2 text-xs text-gray-400">
                Showing {displayedItems.length} of {history.length} items
            </div>
        </div>
    );
};

export default TicketLogs;
