import { useEffect, useState } from "react";
import {
    BrainCircuit,
    TrendingUp,
    ShieldAlert,
    CheckCircle2,
    Plus,
    Trash2,
    Pencil,
} from "lucide-react";

import PageHeader from "../../ui/PageHeader";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import StatCard from "../../ui/StartCard";
import MarketTicker from "../../dashboard/MarketTicker";
import DashboardFooter from "../../dashboard/DashboardFooter";
import SidebarRight from "../../layout/SidebarRight";
import RobotWizard from "./RobotWizard";
import RobotSettingsModal from "./RobotSettingsModal";
import { listRobots, deleteRobot as deleteRobotApi } from "../../../services/robotService";
import { useAuth } from "../../../context/AuthContext";

const SIGNAL_STYLES = {
    BUY: "bg-emerald-50 text-emerald-700",
    SELL: "bg-red-50 text-red-700",
    WAIT: "bg-slate-100 text-slate-600",
};

function DailyStat({ label, value }) {
    return (
        <div className="rounded-xl border border-slate-200 px-3 py-2">
            <p className="text-xs text-slate-400">{label}</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-800">{value ?? "–"}</p>
        </div>
    );
}

function RobotDailyCard({ robot, canDelete, onEdit, onDeleted }) {
    // TODO: robot.todaySignal doesn't exist yet - the analysis pipeline
    // (docs/dataSkill/04-decision-executor.md) isn't wired up, so this
    // always renders the WAIT/empty placeholder state for now.
    const signal = robot.todaySignal?.signal ?? "WAIT";
    const [confirming, setConfirming] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteRobotApi(robot.id);
            onDeleted(robot.id);
        } catch (err) {
            console.error("Failed to delete robot:", err);
            setDeleting(false);
            setConfirming(false);
        }
    };

    return (
        <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-base font-semibold text-slate-900">{robot.nama_robot}</h3>
                    <p className="text-sm text-slate-500">{robot.symbol} · {robot.time_frame}</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${SIGNAL_STYLES[signal]}`}>
                        {signal}
                    </span>

                    {confirming ? (
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-500">Delete this robot?</span>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleting}
                                className="cursor-pointer rounded-lg bg-red-600 px-2.5 py-1 font-medium text-white hover:bg-red-700 disabled:opacity-60"
                            >
                                {deleting ? "Deleting..." : "Yes"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirming(false)}
                                disabled={deleting}
                                className="cursor-pointer rounded-lg border border-slate-300 px-2.5 py-1 font-medium text-slate-600 hover:bg-slate-50"
                            >
                                No
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Every account can edit settings - only the admin
                                account also gets a delete option, per policy. */}
                            <button
                                type="button"
                                title="Edit settings"
                                onClick={() => onEdit(robot)}
                                className="cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <Pencil size={16} />
                            </button>
                            {canDelete && (
                                <button
                                    type="button"
                                    title="Delete robot"
                                    onClick={() => setConfirming(true)}
                                    className="cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                <DailyStat label="Entry" value={robot.todaySignal?.entryZone} />
                <DailyStat label="SL" value={robot.todaySignal?.stopLoss} />
                <DailyStat label="TP1" value={robot.todaySignal?.tp1} />
                <DailyStat label="TP2" value={robot.todaySignal?.tp2} />
                <DailyStat label="TP3" value={robot.todaySignal?.tp3} />
            </div>

            <p className="mt-3 text-xs text-slate-400">
                Updated {robot.todaySignal?.updatedAt ?? "–"}
            </p>
        </Card>
    );
}

export default function AiRobot() {
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";
    const [showWizard, setShowWizard] = useState(false);
    const [editingRobot, setEditingRobot] = useState(null);
    const [robots, setRobots] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadRobots = async () => {
        try {
            const { data } = await listRobots();
            setRobots(data.robots || []);
        } catch (err) {
            console.error("Failed to load robots:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRobots();
    }, []);

    const handleDeleted = (robotId) => {
        setRobots((prev) => prev.filter((r) => r.id !== robotId));
    };

    const handleSaved = (updatedRobot) => {
        setRobots((prev) => prev.map((r) => (r.id === updatedRobot.id ? updatedRobot : r)));
    };

    const activeCount = robots.filter((r) => r.status === "active").length;

    return (
        <div className="min-h-full">
            <MarketTicker />

            <div className="p-4 md:p-6">
                <PageHeader
                    title="AI Robots"
                    subtitle="Bangun asisten trading AI-mu sendiri — dari analisa pasar hingga sinyal, sepenuhnya otomatis."
                    actions={
                        <Button onClick={() => setShowWizard(true)}>
                            <Plus size={18} className="mr-2" />
                            Create Robot
                        </Button>
                    }
                />

                <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <main className="min-w-0 space-y-6">
                        {/* Summary tiles */}
                        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                            <StatCard icon={<BrainCircuit size={20} />} title="Total Robot" value={String(robots.length)} />
                            <StatCard icon={<CheckCircle2 size={20} />} title="Robot Aktif" value={String(activeCount)} />
                            <StatCard icon={<TrendingUp size={20} />} title="Sinyal Bulan Ini" value="0" />
                            <StatCard icon={<ShieldAlert size={20} />} title="Win Rate" value="–" />
                        </div>

                        {loading ? (
                            <div className="h-48 animate-pulse rounded-3xl bg-slate-100" />
                        ) : robots.length === 0 ? (
                            /* Empty state */
                            <Card className="flex flex-col items-center gap-4 py-14 text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                    <BrainCircuit size={32} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">Belum ada AI Robot</h3>
                                    <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                                        Buat robot pertamamu untuk mulai menjalankan analisa otomatis di atas — pilih symbol, indikator, dan aturan risikonya sendiri.
                                    </p>
                                </div>
                                <Button onClick={() => setShowWizard(true)}>
                                    <Plus size={18} className="mr-2" />
                                    Create Robot
                                </Button>
                            </Card>
                        ) : (
                            /* Hasil analisa robot hari ini */
                            <div className="space-y-4">
                                {robots.map((robot) => (
                                    <RobotDailyCard
                                        key={robot.id}
                                        robot={robot}
                                        canDelete={isAdmin}
                                        onEdit={setEditingRobot}
                                        onDeleted={handleDeleted}
                                    />
                                ))}
                            </div>
                        )}
                    </main>

                    <SidebarRight />
                </div>
            </div>

            <RobotWizard
                open={showWizard}
                onClose={() => setShowWizard(false)}
                onCreated={() => loadRobots()}
                isFirstRobot={robots.length === 0}
            />

            <RobotSettingsModal
                robot={editingRobot}
                onClose={() => setEditingRobot(null)}
                onSaved={handleSaved}
            />

            <DashboardFooter />
        </div>
    );
}
