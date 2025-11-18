import React, { use, useState, useEffect } from "react";
import { Form } from "antd";
import { usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useTicketForm } from "@/Hooks/useTicketForm";
import TicketForm from "@/Components/ticketing/TicketForm";
import EmployeeInfo from "@/Components/ticketing/EmployeeInfo";

const Create = () => {
    const [form] = Form.useForm();
    const {
        emp_data,
        request_types,
        selectedType,
        selectedOption,
        selectedItem,
        itemOptions,
        showItemSelect,
        showCustomInput,
        handleChange,
        getItemLabel,
    } = useTicketForm();

    const onFinish = (values) => {
        console.log("Form values:", values);
        // Handle form submission here
    };

    return (
        <AuthenticatedLayout>
            <div className="text-center px-6 mb-6">
                <div className="flex items-center justify-center gap-3 mb-1">
                    <h1 className="text-3xl font-bold">MIS Ticketing System</h1>
                </div>
                <p className="text-base-content/60 text-sm">
                    Generate a new ticket by filling out the form below.
                </p>
            </div>

            <div className="flex justify-center">
                <div className="card w-full max-w-7xl shadow-xl bg-base-200">
                    <div className="card-body p-6">
                        <EmployeeInfo emp_data={emp_data} />

                        <TicketForm
                            form={form}
                            request_types={request_types}
                            selectedType={selectedType}
                            selectedOption={selectedOption}
                            selectedItem={selectedItem}
                            itemOptions={itemOptions}
                            showItemSelect={showItemSelect}
                            showCustomInput={showCustomInput}
                            handleChange={handleChange}
                            getItemLabel={getItemLabel}
                            onFinish={onFinish}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Create;
