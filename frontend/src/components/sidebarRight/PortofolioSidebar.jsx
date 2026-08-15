export default function PortfolioSidebar() {
    return (
        <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-700">Portfolio Summary</h3>
                <div className="mt-4 h-20 rounded-xl bg-slate-50" />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-700">Performance</h3>
                <div className="mt-4 h-24 rounded-xl bg-slate-50" />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-700">Trading Statistics</h3>
                <div className="mt-4 h-24 rounded-xl bg-slate-50" />
            </div>
        </aside>
    );
}