import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage } from "@inertiajs/react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    LineChart,
    Line,
} from "recharts";
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-base-100 p-2 rounded shadow text-base-content/60">
                <p className="font-semibold">{label}</p>
                <p>{`${payload[0].name || payload[0].dataKey}: ${
                    payload[0].value
                }`}</p>
            </div>
        );
    }
    return null;
};

export default function Dashboard() {
    const { dashboard } = usePage().props;

    const handledData = dashboard.ticketsHandled.map((item) => ({
        name: item.emp_name,
        total: item.total,
    }));

    const avgTimeData = dashboard.avgHandlingTime.map((item) => ({
        name: item.emp_name,
        minutes: parseFloat(item.avg_minutes),
    }));

    const dailyData = dashboard.ticketsPerDay.map((item) => ({
        day: item.day,
        total: item.total,
    }));

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

            {/* Most Tickets Handled */}
            <div className="mb-8 p-4 rounded shadow">
                <h2 className="font-semibold text-base-content/60 mb-2">
                    Most Tickets Handled
                </h2>
                <BarChart width={600} height={300} data={handledData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />

                    <Bar dataKey="total" fill="#8884d8" />
                </BarChart>
            </div>

            {/* Average Handling Time */}
            <div className="mb-8 p-4 rounded shadow">
                <h2 className="font-semibold text-base-content/60 mb-2">
                    Fastest Handling Time (Minutes)
                </h2>
                <BarChart width={600} height={300} data={avgTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />

                    <Bar dataKey="minutes" fill="#82ca9d" />
                </BarChart>
            </div>

            {/* Tickets Per Day */}
            <div className="p-4 rounded shadow">
                <h2 className="font-semibold text-base-content/60 mb-2">
                    Tickets Per Day
                </h2>
                <LineChart width={600} height={300} data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />

                    <Line type="monotone" dataKey="total" stroke="#8884d8" />
                </LineChart>
            </div>
        </AuthenticatedLayout>
    );
}
