import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function MonthlyPerformanceChart({ data = [] }) {
    const labels = data.map((item) => item.label);
    const values = data.map((item) => Number(item.value) || 0);

    const chartData = {
        labels,
        datasets: [
            {
                label: "Profit / Loss",
                data: values,
                backgroundColor: values.map((value) => value > 0 ? "rgba(16, 185, 129, 0.75)" : value < 0 ? "rgba(239, 68, 68, 0.75)" : "rgba(148, 163, 184, 0.5)"),
                borderRadius: 6,
                borderSkipped: false,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context) => `Profit/Loss: ${Number(context.raw).toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
                },
            },
        },
        scales: {
            x: {
                grid: { display: false },
                border: { display: false },
            },
            y: {
                beginAtZero: true,
                border: { display: false },
                grid: { color: "rgba(148, 163, 184, 0.15)" },
                ticks: {
                    callback: (value) => Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 }),
                },
            },
        },
    };

    if (!data.length) {
        return <div className="flex h-64 items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-400">No monthly data.</div>;
    }

    return (
        <div className="h-64 w-full min-w-0 max-w-full overflow-hidden">
            <Bar data={chartData} options={options} />
        </div>
    );
}