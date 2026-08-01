import PageHeader from "../../components/ui/PageHeader";

export default function DashboardPage() {
    return (
        <>
            <PageHeader
                title="Dashboard"
                subtitle="Welcome back to Forex Hub."
            />

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

                <div className="h-40 rounded-2xl border border-slate-200 bg-white"></div>
                <div className="h-40 rounded-2xl border border-slate-200 bg-white"></div>
                <div className="h-40 rounded-2xl border border-slate-200 bg-white"></div>
                <div className="h-40 rounded-2xl border border-slate-200 bg-white"></div>

            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-3">

                <div className="h-[450px] rounded-2xl border border-slate-200 bg-white xl:col-span-2"></div>

                <div className="h-[450px] rounded-2xl border border-slate-200 bg-white"></div>

            </div>

        </>
    );
}