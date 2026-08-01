export default function StatCard({
    icon,
    title,
    value,
    color = "text-blue-600",
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

            <div className={`${color} mb-4`}>
                {icon}
            </div>

            <p className="text-sm text-slate-500">
                {title}
            </p>

            <h3 className="mt-2 text-3xl font-bold text-slate-900">
                {value}
            </h3>

        </div>
    );
}