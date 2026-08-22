export default function StatCard({ icon, title, value, color = "text-mauve-600",bg = "bg-white"}) {
    return (
        <div className={`${bg} rounded-md border border-slate-200 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}>
            <div className="flex justify-start">
                <div className={`${color} mb-4`}>{icon}</div>
                <p className={`${color} mb-4 text-md  pl-2.5`}>{title}</p>
            </div>
            <h3 className={`${color} text-2xl font-bold`}>{value}</h3>
        </div>
    );
}