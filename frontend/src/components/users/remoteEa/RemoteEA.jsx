import { useEffect, useState } from "react";
import PageHeader from "../../ui/PageHeader";
import MarketTicker from "../../dashboard/MarketTicker";
import DashboardFooter from "../../dashboard/DashboardFooter";
import SidebarRight from "../../dashboard/SidebarRight";
import { getEAStatus, getLastEACommand } from "../../../services/eaService";
import { AlertTriangle,Power, X, Trash2, ArrowDownToLine, ArrowUpToLine } from "lucide-react";
import { createEACommand } from "../../../services/eaService";

function PositionValue({ label, value }) {
    return (
        <div>
            <p className="text-xs text-slate-400">{label}</p>
            <p className="mt-1 text-sm font-medium text-slate-700">{value}</p>
        </div>
    );
}

function CommandStatus({ status }) {
    const config = {
        pending: "bg-amber-50 text-amber-600",
        sent: "bg-blue-50 text-blue-600",
        executed: "bg-emerald-50 text-emerald-600",
        failed: "bg-red-50 text-red-600",
    };

    const className = config[status] || "bg-slate-100 text-slate-500";

    return (
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${className}`}>
            {status || "—"}
        </span>
    );
}

function StatusItem({ label, value, connected = null, status = null }) {
    const color = connected !== null
        ? connected ? "text-emerald-600" : "text-red-600"
        : status === "pending" ? "text-amber-600"
        : status === "sent" ? "text-blue-600"
        : status === "executed" ? "text-emerald-600"
        : status === "failed" ? "text-red-600"
        : "text-slate-700";

    return (
        <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-400">{label}</p>
            <p className={`mt-1 font-semibold ${color}`}>{value}</p>
        </div>
    );
}

export default function RemoteEA() {
    const [confirmAction, setConfirmAction] = useState(null);
    const [sl, setSl] = useState("");
    const [tp, setTp] = useState("");
    const [accountId, setAccountId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionFeedback, setActionFeedback] = useState({ type: "idle", message: "" });
    const [lastSeen, setLastSeen] = useState(null);

    const actions = {
        CLOSE_ALL: {
            title: "Close All Positions",
            description: "All open positions on this EA account will be closed.",
            icon: Power
            },
        CLOSE_BUY: {
            title: "Close Buy Positions",
            description: "All BUY positions on this EA account will be closed.",
            icon: ArrowDownToLine
        },
        CLOSE_SELL: {
            title: "Close Sell Positions",
            description: "All SELL positions on this EA account will be closed.",
            icon: ArrowUpToLine
        },
        DELETE_PENDING: {
            title: "Delete Pending Orders",
            description: "All pending orders on this EA account will be deleted.",
            icon: Trash2
        },
        MODIFY_SL: {
            title: "Modify Stop Loss",
            description: `Set Stop Loss to ${sl}.`,
            icon: ArrowDownToLine
        },
        MODIFY_TP: {
            title: "Modify Take Profit",
            description: `Set Take Profit to ${tp}.`,
            icon: ArrowUpToLine
        },
    };
    const requestAction = (command) => {
        if (command === "MODIFY_SL" && !sl) return;
        if (command === "MODIFY_TP" && !tp) return;

        setActionFeedback({ type: "idle", message: "" });
        setConfirmAction(command);
    };

    const executeAction = async () => {
        if (!confirmAction || isSubmitting) return;

        const commandPayload =
            confirmAction === "MODIFY_SL"
                ? { value: Number(sl) }
                : confirmAction === "MODIFY_TP"
                    ? { value: Number(tp) }
                    : null;

        if (confirmAction === "MODIFY_SL" || confirmAction === "MODIFY_TP") {
            const parsedValue = Number(confirmAction === "MODIFY_SL" ? sl : tp);
            if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
                setActionFeedback({ type: "error", message: "Please provide a valid value greater than 0." });
                return;
            }
        }

        if (!accountId) {
            setActionFeedback({ type: "error", message: "EA account is not available yet." });
            return;
        }

        setIsSubmitting(true);
        setActionFeedback({ type: "pending", message: "Sending command to the EA..." });

        try {
            const payload = commandPayload ? JSON.stringify(commandPayload) : null;
            const response = await createEACommand({
                account_id: accountId,
                command: confirmAction,
                payload,
            });

            if (response?.data?.success) {
                setActionFeedback({ type: "success", message: `${confirmAction.replace(/_/g, " ")} command sent successfully.` });
                setConfirmAction(null);
                await loadEA();
                return;
            }

            const errorMessage = response?.data?.message || "The command could not be processed.";
            setActionFeedback({ type: "error", message: errorMessage });
        } catch (error) {
            const errorMessage = error?.response?.data?.message || error.message || "Failed to send command.";
            setActionFeedback({ type: "error", message: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    };
    const action = confirmAction ? actions[confirmAction] : null;

    const [eaConnected, setEaConnected] = useState(false);
    const [eaActivated, setEaActivated] = useState(false);
    const [eaRole, setEaRole] = useState("MEMBER");
    const [accountNumber, setAccountNumber] = useState("-");
    const [heartbeat, setHeartbeat] = useState(5);
    const [lastCommand, setLastCommand] = useState(null);
    const [activeCommand, setActiveCommand] = useState(null);

    const loadEA = async () => {
        try {
            const { data } = await getEAStatus();
            const lastPing = data.account?.last_ping || data.last_ping || null;
            const hasFreshHeartbeat = lastPing
                ? Date.now() - new Date(lastPing).getTime() <= 30000
                : false;
            const isConnected = data.connected === true && hasFreshHeartbeat;

            setLastSeen(lastPing ? new Date(lastPing).toLocaleString() : "Never");
            setEaConnected(isConnected);
            setEaActivated((data.activated === true) && isConnected);
            setEaRole(data.role || "MEMBER");
            setAccountId(data.account?.id ?? null);
            setAccountNumber(data.account?.account_number || "-");
            setHeartbeat(data.heartbeat || 5);
            setActiveCommand(data.command || null);

            const commandRes = await getLastEACommand();
            setLastCommand(commandRes.data.command || null);
        } catch (error) {
            console.error("Failed to load EA status:", error);
            setEaConnected(false);
            setEaActivated(false);
            setActiveCommand(null);
        }
    };

    useEffect(() => {
        loadEA();
        const timer = setInterval(loadEA, 5000);
        return () => clearInterval(timer);
    }, []);

     return (
        <div className="min-h-full">
            <MarketTicker />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                <main className="min-w-0 space-y-6">
                    <PageHeader title="Remote EA" subtitle="Control your connected Expert Advisor." />
{/* Status EA */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">EA Status</h2>
                                <p className="mt-1 text-sm text-slate-500">ForexHub Expert Advisor</p>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${eaActivated ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                                    {eaActivated ? "Activated" : "Inactive"}
                                </span>
                                <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${eaConnected ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                                    <span className={`h-2 w-2 rounded-full ${eaConnected ? "bg-emerald-500" : "bg-red-500"}`} />
                                    {eaConnected ? "Connected" : "Disconnected"}
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                            <StatusItem label="Command" value={activeCommand?.command || "No  command"} status={activeCommand?.status}/>
                            <StatusItem label="Role" value={eaRole} />
                            <StatusItem label="Account" value={accountNumber} />
                            <StatusItem label="Heartbeat" value={`${heartbeat}s`} />
                        </div>

                        <div className={`mt-5 flex items-center justify-between rounded-full px-3 py-1.5 text-sm font-medium ${eaConnected ? "bg-white text-slate-700" : "bg-red-50 text-red-600"}`}>
                            <p className="text-center">{eaConnected ? "Heartbeat is active." : "The connection between the server and the EA has been lost."}</p>
                            <span className="text-xs opacity-80">Last seen: {lastSeen || "—"}</span>
                        </div>
                    </section>
{/* Trading Control */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-800">Trading Control</h2>
                        <p className="mt-1 text-sm text-slate-500">Actions are sent directly to the connected EA.</p>

                        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                            <button onClick={() => requestAction("CLOSE_ALL")} className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-100">
                                Close All
                            </button>
                            <button onClick={() => requestAction("CLOSE_BUY")} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                                Close Buy
                            </button>
                            <button onClick={() => requestAction("CLOSE_SELL")} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                                Close Sell
                            </button>
                            <button onClick={() => requestAction("DELETE_PENDING")} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 transition hover:bg-amber-100">
                                Delete Pending
                            </button>
                        </div>

                        {actionFeedback.message && (
                            <div className={`mt-4 rounded-xl border px-3 py-2 text-sm ${
                                actionFeedback.type === "success"
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : actionFeedback.type === "error"
                                        ? "border-red-200 bg-red-50 text-red-700"
                                        : "border-blue-200 bg-blue-50 text-blue-700"
                            }`}>
                                {actionFeedback.message}
                            </div>
                        )}
                    </section>
{/* Modify Position */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-800">Modify Position</h2>
                        <p className="mt-1 text-sm text-slate-500">Apply the same SL or TP to open positions.</p>

                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-600">Stop Loss</label>
                                <div className="flex gap-2">
                                    <input value={sl} onChange={(e) => setSl(e.target.value)} type="number" step="300.01" min="100.01" placeholder="00.50" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400" />
                                    <button onClick={() => sl && requestAction("MODIFY_SL")} disabled={!sl} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40">
                                        Modify SL
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-600">Take Profit</label>
                                <div className="flex gap-2">
                                    <input value={tp} onChange={(e) => setTp(e.target.value)} type="number" step="300.01" min="100.01" placeholder="00.50" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400" />
                                    <button onClick={() => tp && requestAction("MODIFY_TP")} disabled={!tp} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40">
                                        Modify TP
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
{/* Running Positions */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">Running Positions</h2>
                                <p className="mt-1 text-sm text-slate-500">Currently open positions on the connected EA.</p>
                            </div>

                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                                2 Running
                            </span>
                        </div>

                        <div className="mt-5 space-y-3">
                            {[
                                {
                                    ticket: "323373896",
                                    symbol: "XAUUSDs",
                                    type: "SELL",
                                    volume: "0.01",
                                    openPrice: "4046.14",
                                    currentPrice: "4043.80",
                                    sl: "4055.00",
                                    tp: "4030.00",
                                    profit: "+2.34",
                                    openTime: "12:54:22",
                                    duration: "18m",
                                },
                                {
                                    ticket: "323373447",
                                    symbol: "XAUUSDs",
                                    type: "SELL",
                                    volume: "0.01",
                                    openPrice: "4045.58",
                                    currentPrice: "4043.80",
                                    sl: "4055.00",
                                    tp: "4030.00",
                                    profit: "+1.78",
                                    openTime: "12:54:04",
                                    duration: "18m",
                                },
                            ].map((position) => (
                                <div
                                    key={position.ticket}
                                    className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-semibold text-slate-800">{position.symbol}</span>

                                                <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                                                    {position.type}
                                                </span>
                                            </div>

                                            <p className="mt-1 text-xs text-slate-400">
                                                Ticket {position.ticket}
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <p className={`text-sm font-semibold ${position.profit.startsWith("+") ? "text-emerald-600" : "text-red-600"}`}>
                                                {position.profit}
                                            </p>

                                            <p className="mt-1 text-xs text-slate-400">
                                                {position.duration}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                                        <PositionValue label="Volume" value={position.volume} />
                                        <PositionValue label="Open Price" value={position.openPrice} />
                                        <PositionValue label="Current Price" value={position.currentPrice} />
                                        <PositionValue label="SL" value={position.sl} />
                                        <PositionValue label="TP" value={position.tp} />
                                        <PositionValue label="Open Time" value={position.openTime} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
{/* Last Command */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800">Last Command</h2>
                            <p className="mt-1 text-sm text-slate-500">Most recent remote EA action.</p>
                        </div>

                        <div className="mt-4 rounded-xl bg-slate-50 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">{lastCommand?.command || "No command"}</p>
                                    <p className="mt-1 text-xs text-slate-400">{lastCommand?.timestamp || "—"}</p>
                                </div>

                                <CommandStatus status={lastCommand?.status} />
                            </div>
                        </div>
                    </section>
                                
                </main>


                <SidebarRight />
            </div>

            <DashboardFooter />
{/* Confirm Action */}
            {confirmAction && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-start gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                                <AlertTriangle size={22} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <h3 className="text-lg font-semibold text-slate-800">{action?.title}</h3>
                                <p className="mt-2 text-sm leading-6 text-slate-500">{action?.description}</p>
                            </div>

                            <button onClick={() => setConfirmAction(null)} className="text-slate-400 transition hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        {actionFeedback.message && actionFeedback.type !== "idle" && (
                            <div className={`mt-4 rounded-xl border px-3 py-2 text-sm ${
                                actionFeedback.type === "success"
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : actionFeedback.type === "error"
                                        ? "border-red-200 bg-red-50 text-red-700"
                                        : "border-blue-200 bg-blue-50 text-blue-700"
                            }`}>
                                {actionFeedback.message}
                            </div>
                        )}

                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setConfirmAction(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                                Cancel
                            </button>
                            <button onClick={executeAction} disabled={isSubmitting} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                                {isSubmitting ? "Sending..." : "Confirm Action"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}