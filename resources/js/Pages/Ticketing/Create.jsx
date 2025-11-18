import React from "react";
import { usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

const Create = () => {
    const { emp_data } = usePage().props;

    return (
        <AuthenticatedLayout>
            <div>Hello World {emp_data?.emp_id}</div>
        </AuthenticatedLayout>
    );
};

export default Create;
