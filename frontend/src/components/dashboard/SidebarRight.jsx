
export default function SidebarRight() {
    return (
        <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="h-6 w-32 rounded bg-slate-100" />
                <div className="mt-4 space-y-3">
                    <div className="h-4 w-full rounded bg-slate-100" />
                    <div className="h-4 w-4/5 rounded bg-slate-100" />
            <div className="h-4 w-3/5 rounded bg-slate-100" />
            </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-6 w-28 rounded bg-slate-100" />
            <div className="mt-4 h-24 rounded-xl bg-slate-50" />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-6 w-36 rounded bg-slate-100" />
            <div className="mt-4 h-20 rounded-xl bg-slate-50" />
        </div>
    </aside>
    );
}