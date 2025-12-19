import React, { useState, useEffect } from "react";
import { Drawer, Tag, Select, message, Tooltip } from "antd";
import dayjs from "dayjs";
import {
    UserOutlined,
    TagsOutlined,
    FieldTimeOutlined,
    AppstoreOutlined,
    ApartmentOutlined,
    CheckCircleOutlined,
    RollbackOutlined,
    StopOutlined,
    HistoryOutlined,
    StarOutlined,
    UserAddOutlined,
    InfoCircleOutlined,
} from "@ant-design/icons";
import { TicketIcon } from "lucide-react";
import TicketLogsModal from "./TicketLogsModal";

const TicketDetailsDrawer = ({
    open,
    ticket,
    onClose,
    handleButtonClick,
    action,
    ticketLogs = [],
    loadingHistory = false,
    assignedApprovers = [],
}) => {
    const [remarks, setRemarks] = useState("");
    const [currentAction, setCurrentAction] = useState("");
    const [rating, setRating] = useState(0);
    const [logsModalOpen, setLogsModalOpen] = useState(false);
    const [assignedEmployee, setAssignedEmployee] = useState(null);

    useEffect(() => {
        if (ticket) {
            setRemarks(ticket.remarks || "");
            setRating(ticket.rating || 0);
            setAssignedEmployee(ticket.assigned_to || null);
            setCurrentAction("");
        }
    }, [ticket]);

    if (!ticket) return null;

    const calcDuration = () => {
        const created = new Date(ticket.created_at.replace(" ", "T"));
        const endTime = ticket.closed_at
            ? new Date(ticket.closed_at.replace(" ", "T"))
            : ticket.handled_at
            ? new Date(ticket.handled_at.replace(" ", "T"))
            : new Date();

        const mins = Math.floor((endTime - created) / 60000);
        const hours = Math.floor(mins / 60);
        const m = mins % 60;

        return hours > 0 ? `${hours}h ${m}m` : `${mins}m`;
    };

    const handleCloseDrawer = () => {
        setRemarks("");
        setRating(0);
        setCurrentAction("");
        setAssignedEmployee(null);
        onClose();
    };

    const handleActionClick = (ticketId, actionType) => {
        const actionLower = actionType.toLowerCase();
        if (
            (actionLower === "assign" || actionLower === "resolve") &&
            assignedEmployee
        ) {
            handleButtonClick(
                ticketId,
                actionType,
                remarks,
                rating,
                assignedEmployee
            );
        } else {
            handleButtonClick(ticketId, actionType, remarks, rating);
        }

        // Reset assignment after action
        setAssignedEmployee(null);
    };

    const hasExistingRating = ticket.rating > 0;
    const actionStr =
        Array.isArray(action?.actions) && action.actions.length > 0
            ? action.actions[0].toLowerCase()
            : "";
    const isViewAction = actionStr === "view";

    const showEmployeeAssignment =
        ["assign", "resolve"].includes(actionStr) ||
        ["RESOLVED", "ONGOING"].includes(ticket.STATUS);
    const readEmployeeAssignment = !showEmployeeAssignment;
    return (
        <Drawer
            title={
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-4">
                        <TicketIcon className="w-6 h-6 text-blue-500" />
                        <span className="font-semibold text-lg">
                            {ticket.ticket_id}
                        </span>

                        {ticketLogs.length > 0 && (
                            <button
                                className="flex items-center gap-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full hover:bg-blue-200 transition-colors duration-150"
                                onClick={() => setLogsModalOpen(true)}
                            >
                                <HistoryOutlined className="w-4 h-4" />
                                {ticketLogs.length}
                            </button>
                        )}
                    </div>

                    {hasExistingRating && (
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-base-800 flex items-center gap-2">
                                Requestor Rating:
                            </span>
                            <div className="rating rating-xs rating-disabled">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <input
                                        key={star}
                                        type="radio"
                                        name="rating-display"
                                        className="mask mask-star-2 bg-orange-400"
                                        checked={ticket.rating === star}
                                        readOnly
                                    />
                                ))}
                            </div>
                            <span className="text-base-600 font-medium">
                                ({ticket.rating}/5)
                            </span>
                        </div>
                    )}

                    <div className="flex gap-2">
                        {currentAction.toLowerCase() !== "close" &&
                            Array.isArray(action?.actions) &&
                            action.actions
                                .filter((a) => a.toLowerCase() !== "view")
                                .map((a) => {
                                    const type = a.toLowerCase();
                                    const colorClasses = {
                                        close: "bg-green-500 hover:bg-green-600",
                                        return: "bg-yellow-500 hover:bg-yellow-600",
                                        resolve:
                                            "bg-green-500 hover:bg-green-600",
                                        ongoing:
                                            "bg-yellow-500 hover:bg-yellow-600",
                                        cancel: "bg-red-500 hover:bg-red-600",
                                    };
                                    const btnColor =
                                        colorClasses[type] ||
                                        "bg-blue-500 hover:bg-blue-600";

                                    const icons = {
                                        close: (
                                            <CheckCircleOutlined className="w-4 h-4" />
                                        ),
                                        return: (
                                            <RollbackOutlined className="w-4 h-4" />
                                        ),
                                        resolve: (
                                            <CheckCircleOutlined className="w-4 h-4" />
                                        ),
                                        ongoing: (
                                            <CheckCircleOutlined className="w-4 h-4" />
                                        ),
                                        cancel: (
                                            <StopOutlined className="w-4 h-4" />
                                        ),
                                    };

                                    return (
                                        <button
                                            key={a}
                                            className={`flex items-center gap-1 px-3 py-1 text-white rounded-lg text-sm shadow-sm ${btnColor} transition-colors duration-150`}
                                            onClick={() => {
                                                if (type === "close") {
                                                    setCurrentAction("close");
                                                } else if (type === "ongoing") {
                                                    setCurrentAction(type);
                                                } else {
                                                    // Resolve, Return, Cancel work directly
                                                    handleActionClick(
                                                        ticket.ticket_id,
                                                        a
                                                    );
                                                }
                                            }}
                                        >
                                            {icons[type] || (
                                                <CheckCircleOutlined className="w-4 h-4" />
                                            )}
                                            {a}
                                        </button>
                                    );
                                })}

                        {currentAction.toLowerCase() === "close" && (
                            <button
                                className={`flex items-center gap-1 px-3 py-1 text-white rounded-lg text-sm shadow-sm ${
                                    rating <= 0
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-green-500 hover:bg-green-600"
                                } transition-colors duration-150`}
                                disabled={rating <= 0}
                                onClick={() => {
                                    if (rating <= 0) return;
                                    handleButtonClick(
                                        ticket.ticket_id,
                                        "Close",
                                        remarks,
                                        rating
                                    );
                                    setCurrentAction("");
                                    setRemarks(ticket.remarks || "");
                                    setRating(0);
                                }}
                            >
                                <CheckCircleOutlined className="w-4 h-4" />
                                Confirm Close
                            </button>
                        )}

                        {currentAction.toLowerCase() === "ongoing" && (
                            <button
                                className={`flex items-center gap-1 px-3 py-1 text-white rounded-lg text-sm shadow-sm bg-green-500 hover:bg-green-600 transition-colors duration-150`}
                                onClick={() => {
                                    handleActionClick(
                                        ticket.ticket_id,
                                        currentAction.charAt(0).toUpperCase() +
                                            currentAction.slice(1)
                                    );
                                    setCurrentAction("");
                                    setRemarks(ticket.remarks || "");
                                }}
                            >
                                <CheckCircleOutlined className="w-4 h-4" />
                                Confirm{" "}
                                {currentAction.charAt(0).toUpperCase() +
                                    currentAction.slice(1)}
                            </button>
                        )}
                    </div>
                </div>
            }
            open={open}
            onClose={handleCloseDrawer}
            width={800}
            styles={{ body: { padding: 0 } }}
        >
            {/* Ticket Tags */}
            <div className="flex flex-wrap gap-4 mt-4 ml-4">
                <Tag color={ticket.status_color || "default"}>
                    {ticket.status_label || "-"}
                </Tag>
                <Tag color={ticket.status_color || "default"}>
                    Created At:{" "}
                    {dayjs(ticket.created_at).format("MMM DD, YYYY - hh:mm A")}
                </Tag>
                <Tag color={ticket.status_color || "default"}>
                    <FieldTimeOutlined /> {calcDuration()}
                </Tag>
            </div>

            <div className="p-5 space-y-6">
                {/* Employee Details */}
                <div>
                    <h3 className="font-semibold text-base-700 mb-3">
                        Employee Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-2">
                        <div>
                            <div className="text-base-500 text-md flex items-center gap-2">
                                <UserOutlined /> Requestor
                            </div>
                            <div className="font-semibold text-base-800">
                                {ticket.employid} - {ticket.empname}
                            </div>
                        </div>
                        <div>
                            <div className="text-base-500 text-md flex items-center gap-2">
                                <ApartmentOutlined /> Department
                            </div>
                            <div className="font-semibold text-base-800">
                                {ticket.department || "-"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Ticket Details */}
                <div>
                    <h3 className="font-semibold text-base-700 mb-3">
                        Ticket Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-2">
                        <div>
                            <div className="text-base-500 text-md flex items-center gap-2">
                                <TagsOutlined /> Request Type
                            </div>
                            <div className="font-semibold text-base-800">
                                {ticket.type_of_request}
                            </div>
                        </div>
                        <div>
                            <div className="text-base-500 text-md flex items-center gap-2">
                                <AppstoreOutlined /> Request Option
                            </div>
                            <div className="font-semibold text-base-800">
                                {ticket.request_option}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Assign Employee */}
                {showEmployeeAssignment && (
                    <div className="mt-4">
                        <label className="block">
                            <span className="font-semibold text-base-700 flex items-center gap-2 mb-1">
                                <UserAddOutlined />
                                {ticket.assigned_to
                                    ? "Reassign Ticket to Another Employee"
                                    : "Assign Ticket to an Employee (Optional)"}
                                <Tooltip title="If no employee is assigned, the requestor will be responsible for closing the ticket.">
                                    <InfoCircleOutlined className="text-gray-400 ml-1" />
                                </Tooltip>
                            </span>
                        </label>
                        <Select
                            showSearch
                            placeholder="Select an employee"
                            className="w-full"
                            value={assignedEmployee}
                            onChange={setAssignedEmployee}
                            allowClear
                            options={assignedApprovers.map((emp) => ({
                                value: emp.EMPLOYID,
                                label: `${emp.EMPLOYID} - ${emp.EMPNAME}`,
                            }))}
                        />
                    </div>
                )}
                {readEmployeeAssignment && ticket.assigned_to && (
                    <div className="mt-4">
                        <h3 className="font-semibold text-base-700 mb-3 flex items-center gap-2">
                            <UserAddOutlined />
                            Assigned To
                        </h3>
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="font-semibold text-base-800">
                                {ticket.assigned_to} -{" "}
                                {ticket.assigned_to_name || "N/A"}
                            </div>
                        </div>
                    </div>
                )}
                {/* Remarks */}
                {!isViewAction && (
                    <div>
                        <h3 className="font-semibold text-base-700 mt-2">
                            Remarks
                        </h3>
                        <textarea
                            className="textarea textarea-bordered w-full rounded-lg text-sm resize-y mt-2"
                            rows={4}
                            placeholder="Enter remarks..."
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                        ></textarea>

                        {/* Rating only on close */}
                        {currentAction === "close" && !hasExistingRating && (
                            <div className="mt-4">
                                <label className="block font-semibold text-base-700 flex items-center gap-2">
                                    <StarOutlined /> Rate your experience
                                    (Required)
                                </label>
                                <div className="rating rating-lg mt-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <input
                                            key={star}
                                            type="radio"
                                            name="rating"
                                            className="mask mask-star-2 bg-orange-400"
                                            checked={rating === star}
                                            onChange={() => setRating(star)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Logs Modal */}
                <TicketLogsModal
                    visible={logsModalOpen}
                    onClose={() => setLogsModalOpen(false)}
                    history={ticketLogs}
                    loading={loadingHistory}
                />
            </div>
        </Drawer>
    );
};

export default TicketDetailsDrawer;
