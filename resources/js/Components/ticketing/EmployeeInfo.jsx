import React from "react";

const EmployeeInfo = ({ emp_data }) => {
    return (
        <div className="bg-base-100 border border-base-300 rounded-lg p-4 flex justify-between text-sm mb-6">
            <div className="flex flex-col">
                <span className="text-xs text-base-content/50 uppercase">
                    Employee ID
                </span>
                <span className="font-semibold">{emp_data.emp_id}</span>
            </div>
            <div className="flex flex-col">
                <span className="text-xs text-base-content/50 uppercase">
                    Name
                </span>
                <span className="font-semibold">{emp_data.emp_name}</span>
            </div>
            <div className="flex flex-col">
                <span className="text-xs text-base-content/50 uppercase">
                    Department
                </span>
                <span className="font-semibold">{emp_data.emp_dept}</span>
            </div>
            <div className="flex flex-col">
                <span className="text-xs text-base-content/50 uppercase">
                    Product Line
                </span>
                <span className="font-semibold">{emp_data.emp_prodline}</span>
            </div>
            <div className="flex flex-col">
                <span className="text-xs text-base-content/50 uppercase">
                    Station
                </span>
                <span className="font-semibold">{emp_data.emp_station}</span>
            </div>
        </div>
    );
};

export default EmployeeInfo;
