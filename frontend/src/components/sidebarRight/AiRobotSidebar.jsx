import { PieChart, Activity, Lightbulb } from "lucide-react";

export default function AiRobotSidebar() {
    return (
        <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <PieChart size={16} className="text-blue-600" />
                    Ringkasan Robot
                </div>
                <p className="mt-3 text-sm text-slate-500">
                    Buat robot pertamamu untuk melihat ringkasan performa, symbol, dan status aktifnya di sini.
                </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Activity size={16} className="text-blue-600" />
                    Status Analisa
                </div>
                <div className="mt-3 flex items-center gap-2.5 text-sm text-slate-500">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-slate-300" />
                    Idle — belum ada robot yang berjalan.
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Lightbulb size={16} className="text-amber-500" />
                    Tips Cepat
                </div>
                <p className="mt-3 text-sm text-slate-500">
                    Set Max Risk per Trade dan Max Open Posisi secara realistis sebelum mengaktifkan robot — sinyal apapun yang melewati batas ini akan otomatis ditolak.
                </p>
            </div>
        </aside>
    );
}
