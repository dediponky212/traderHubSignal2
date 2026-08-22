import { useEffect, useRef, useState } from "react";
import PageHeader from "../../ui/PageHeader";
import MarketTicker from "../../dashboard/MarketTicker";
import DashboardFooter from "../../dashboard/DashboardFooter";
import SidebarRight from "../../layout/SidebarRight";
import { getEADashboard } from "../../../services/eaService";
import { AlertTriangle,Power, X, Trash2, ArrowDownToLine, ArrowUpToLine, TrendingUp, TrendingDown, Layers, BarChart3, ArrowLeftRight, Wallet, LineChart, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { createEACommand } from "../../../services/eaService";

// The API returns SQLite's "YYYY-MM-DD HH:MM:SS" UTC timestamps without a
// timezone suffix. `new Date()` would parse that as local time, so normalize
// to ISO-8601 UTC before parsing (same fix as the backend's isHeartbeatFresh).
function toIsoUTC(value) {
    if (!value) return value;
    return value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
}

function formatDuration(openTime) {
    if (!openTime) return "—";
    const start = new Date(toIsoUTC(openTime)).getTime();
    if (Number.isNaN(start)) return "—";

    const diffMinutes = Math.max(0, Math.floor((Date.now() - start) / 60000));
    if (diffMinutes < 60) return `${diffMinutes}m`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ${diffMinutes % 60}m`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ${diffHours % 24}h`;
}

function formatProfit(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return "—";
    return `${num >= 0 ? "+" : ""}${num.toFixed(2)}`;
}

// Standard forex convention: on a 3- or 5-digit symbol the smallest quoted
// step is a "point", and a pip is 10 points; on a 2- or 4-digit symbol a
// point already IS a pip. This must come from the EA/broker (`point`,
// `digits`) - guessing it from a price's decimal count is not reliable
// across symbols (indices, gold, crypto CFDs all vary), so pip conversion
// stays disabled until the EA has actually reported these.
function getPipSize(point, digits) {
    const p = Number(point);
    const d = Number(digits);
    if (!Number.isFinite(p) || p <= 0 || !Number.isFinite(d)) return null;
    return d === 3 || d === 5 ? p * 10 : p;
}

// direction: "BUY" | "SELL", kind: "SL" | "TP". BUY's TP sits above entry
// and SL below it; SELL is the mirror image.
function pipsToPrice(basePrice, pips, pipSize, direction, kind) {
    const base = Number(basePrice);
    const n = Number(pips);
    if (!Number.isFinite(base) || !Number.isFinite(n) || !pipSize) return null;

    const goesUp = (direction === "BUY" && kind === "TP") || (direction === "SELL" && kind === "SL");
    return base + (goesUp ? 1 : -1) * n * pipSize;
}

// Card shell shared by Running Positions and Trading History rows: a subtle
// profit/loss-tinted background with a colored accent border, so the win/loss
// state reads at a glance instead of every row looking the same flat gray.
function plCardClass(isProfit) {
    return `rounded-2xl border border-l-4 p-5 transition-colors ${
        isProfit
            ? "border-emerald-100 border-l-emerald-400 bg-emerald-50/40"
            : "border-red-100 border-l-red-400 bg-red-50/40"
    }`;
}

// Shared by Running Positions and Trading History - both lists carry the
// same volume/action/profit/swap shape, so one reducer covers both.
function summarizeTrades(list) {
    return list.reduce(
        (acc, item) => {
            acc.total += 1;
            acc.volume += Number(item.volume || 0);
            if (item.action === "BUY") acc.buy += 1;
            else if (item.action === "SELL") acc.sell += 1;
            acc.profit += Number(item.profit || 0) + Number(item.swap || 0);
            return acc;
        },
        { total: 0, volume: 0, buy: 0, sell: 0, profit: 0 }
    );
}

function SummaryTile({ icon: Icon, label, value, tint }) {
    const tints = {
        indigo: "border-indigo-100 bg-indigo-50/70 text-indigo-500 [&_.tile-icon]:bg-indigo-100 [&_.tile-icon]:text-indigo-600 [&_.tile-value]:text-indigo-700",
        violet: "border-violet-100 bg-violet-50/70 text-violet-500 [&_.tile-icon]:bg-violet-100 [&_.tile-icon]:text-violet-600 [&_.tile-value]:text-violet-700",
        sky: "border-sky-100 bg-sky-50/70 text-sky-500 [&_.tile-icon]:bg-sky-100 [&_.tile-icon]:text-sky-600 [&_.tile-value]:text-slate-700",
        emerald: "border-emerald-100 bg-emerald-50/70 text-emerald-500 [&_.tile-icon]:bg-emerald-100 [&_.tile-icon]:text-emerald-600 [&_.tile-value]:text-emerald-700",
        red: "border-red-100 bg-red-50/70 text-red-500 [&_.tile-icon]:bg-red-100 [&_.tile-icon]:text-red-600 [&_.tile-value]:text-red-700",
    };

    return (
        <div className={`flex items-center gap-3 rounded-xl border p-4 ${tints[tint]}`}>
            <span className="tile-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                <Icon size={18} />
            </span>
            <div className="min-w-0">
                <p className="text-xs">{label}</p>
                <p className="tile-value mt-0.5 truncate font-semibold">{value}</p>
            </div>
        </div>
    );
}

function SummaryBar({ summary }) {
    const isProfit = summary.profit >= 0;

    return (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryTile icon={Layers} label="Total Positions" value={summary.total} tint="indigo" />
            <SummaryTile icon={BarChart3} label="Total Volume" value={summary.volume.toFixed(2)} tint="violet" />
            <SummaryTile
                icon={ArrowLeftRight}
                label="Buy / Sell"
                value={
                    <>
                        <span className="text-emerald-600">{summary.buy}</span>
                        <span className="text-slate-400"> / </span>
                        <span className="text-red-600">{summary.sell}</span>
                    </>
                }
                tint="sky"
            />
            <SummaryTile icon={Wallet} label="Total P/L" value={formatProfit(summary.profit)} tint={isProfit ? "emerald" : "red"} />
        </div>
    );
}

function PositionValue({ label, value }) {
    return (
        <div>
            <p className="text-xs text-slate-400">{label}</p>
            <p className="mt-1 text-sm font-medium text-slate-700">{value}</p>
        </div>
    );
}

function TradeStatusBadge({ status }) {
    const config = {
        RUNNING: "bg-blue-50 text-blue-600",
        CLOSED: "bg-slate-100 text-slate-500",
    };

    const className = config[status] || "bg-slate-100 text-slate-500";

    return (
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
            {status || "—"}
        </span>
    );
}

const COMMAND_STATUS_STYLE = {
    pending: { box: "bg-amber-50 border border-amber-200", text: "text-amber-600", label: "Pending" },
    sent: { box: "bg-blue-50 border border-blue-200", text: "text-blue-600", label: "Sent" },
    executed: { box: "bg-emerald-50 border border-emerald-200", text: "text-emerald-600", label: "Success" },
    failed: { box: "bg-red-50 border border-red-200", text: "text-red-600", label: "Failed" },
};

function StatusItem({ label, value, connected = null, status = null, flash = false }) {
    const commandStyle = status ? COMMAND_STATUS_STYLE[status] : null;

    const box = connected !== null
        ? connected ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"
        : commandStyle ? commandStyle.box
        : "bg-slate-50 border border-transparent";

    const color = connected !== null
        ? connected ? "text-emerald-600" : "text-red-600"
        : "text-slate-700";

    return (
        <div className={`rounded-xl p-3 transition-colors duration-500 ${box} ${flash ? "fh-heartbeat-flash" : ""}`}>
            <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-slate-400">{label}</p>
                {commandStyle && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${commandStyle.text}`}>
                        {commandStyle.label}
                    </span>
                )}
            </div>
            <p className={`mt-0.5 truncate text-sm font-semibold ${color}`}>{value}</p>
        </div>
    );
}

export default function RemoteEA() {
    const [confirmAction, setConfirmAction] = useState(null);
    const [sl, setSl] = useState("");
    const [tp, setTp] = useState("");
    const [openVolume, setOpenVolume] = useState("");
    const [openSl, setOpenSl] = useState("");
    const [openTp, setOpenTp] = useState("");
    const [openUnit, setOpenUnit] = useState("price"); // "price" | "pips"
    const [slPips, setSlPips] = useState("");
    const [tpPips, setTpPips] = useState("");
    const [symbolInfo, setSymbolInfo] = useState({ symbol: null, point: null, digits: null, bid: null, ask: null });
    const [accountId, setAccountId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionFeedback, setActionFeedback] = useState({ type: "idle", message: "" });
    const [lastSeen, setLastSeen] = useState(null);

    // Auto-dismiss the feedback banner after 4s instead of leaving it up
    // forever. Only ever touches state from inside the timeout callback, and
    // bails if a newer feedback message has already replaced this one.
    useEffect(() => {
        if (actionFeedback.type === "idle" || !actionFeedback.message) return undefined;

        const timer = setTimeout(() => {
            setActionFeedback((prev) => (prev.message === actionFeedback.message ? { type: "idle", message: "" } : prev));
        }, 4000);

        return () => clearTimeout(timer);
    }, [actionFeedback]);

    const pipSize = getPipSize(symbolInfo.point, symbolInfo.digits);
    const pipsAvailable = pipSize !== null;
    const priceDigits = Number.isFinite(Number(symbolInfo.digits)) ? Number(symbolInfo.digits) : 2;

    // In "pips" mode openSl/openTp hold a pip count, not a price - resolve
    // the actual order price here (BUY prices off the ask, SELL off the bid,
    // matching how the broker will actually fill the order).
    const resolveOpenLevel = (value, kind, direction) => {
        if (!value) return 0;
        if (openUnit === "price") return Number(value);
        const base = direction === "BUY" ? symbolInfo.ask : symbolInfo.bid;
        const price = pipsToPrice(base, value, pipSize, direction, kind);
        return price !== null ? price : 0;
    };

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
        CLOSE_PROFIT: {
            title: "Close Profit Positions",
            description: "All open positions currently in profit will be closed.",
            icon: TrendingUp
        },
        CLOSE_LOSS: {
            title: "Close Loss Positions",
            description: "All open positions currently in loss will be closed.",
            icon: TrendingDown
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
        DELETE_SL: {
            title: "Delete Stop Loss",
            description: "Removes the Stop Loss from all open positions on this EA account.",
            icon: Trash2
        },
        DELETE_TP: {
            title: "Delete Take Profit",
            description: "Removes the Take Profit from all open positions on this EA account.",
            icon: Trash2
        },
        OPEN_BUY: {
            title: "Open Buy Position",
            description: `Open a new BUY order, volume ${openVolume || "-"}${openSl ? `, SL ${resolveOpenLevel(openSl, "SL", "BUY").toFixed(priceDigits)}${openUnit === "pips" ? ` (${openSl} pips)` : ""}` : ""}${openTp ? `, TP ${resolveOpenLevel(openTp, "TP", "BUY").toFixed(priceDigits)}${openUnit === "pips" ? ` (${openTp} pips)` : ""}` : ""}.`,
            icon: ArrowUpCircle
        },
        OPEN_SELL: {
            title: "Open Sell Position",
            description: `Open a new SELL order, volume ${openVolume || "-"}${openSl ? `, SL ${resolveOpenLevel(openSl, "SL", "SELL").toFixed(priceDigits)}${openUnit === "pips" ? ` (${openSl} pips)` : ""}` : ""}${openTp ? `, TP ${resolveOpenLevel(openTp, "TP", "SELL").toFixed(priceDigits)}${openUnit === "pips" ? ` (${openTp} pips)` : ""}` : ""}.`,
            icon: ArrowDownCircle
        },
    };
    const requestAction = (command) => {
        if (command === "MODIFY_SL" && !sl) return;
        if (command === "MODIFY_TP" && !tp) return;
        if ((command === "OPEN_BUY" || command === "OPEN_SELL") && !openVolume) return;

        setActionFeedback({ type: "idle", message: "" });
        setConfirmAction(command);
    };

    const executeAction = async () => {
        if (!confirmAction || isSubmitting) return;

        const isOpenAction = confirmAction === "OPEN_BUY" || confirmAction === "OPEN_SELL";
        const openDirection = confirmAction === "OPEN_BUY" ? "BUY" : "SELL";

        if (isOpenAction) {
            const volume = Number(openVolume);
            if (!Number.isFinite(volume) || volume <= 0) {
                setActionFeedback({ type: "error", message: "Please provide a valid volume greater than 0." });
                return;
            }
            // SL/TP are optional, but if provided they must be valid numbers.
            if (openSl && !Number.isFinite(Number(openSl))) {
                setActionFeedback({ type: "error", message: "Stop Loss must be a valid number." });
                return;
            }
            if (openTp && !Number.isFinite(Number(openTp))) {
                setActionFeedback({ type: "error", message: "Take Profit must be a valid number." });
                return;
            }
            if (openUnit === "pips" && !pipsAvailable) {
                setActionFeedback({ type: "error", message: "Pip size isn't available yet - the EA hasn't reported its symbol info." });
                return;
            }
        }

        const commandPayload =
            confirmAction === "MODIFY_SL"
                ? { value: Number(sl) }
                : confirmAction === "MODIFY_TP"
                    ? { value: Number(tp) }
                    : isOpenAction
                        ? {
                            volume: Number(openVolume),
                            sl: resolveOpenLevel(openSl, "SL", openDirection),
                            tp: resolveOpenLevel(openTp, "TP", openDirection),
                        }
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
                await loadDashboard();
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
    const [todayHistory, setTodayHistory] = useState([]);
    const [activeCommand, setActiveCommand] = useState(null);
    const [positions, setPositions] = useState([]);
    const [heartbeatFlash, setHeartbeatFlash] = useState(false);
    const [showChart, setShowChart] = useState(false);
    const prevLastPingRef = useRef(null);

    // One request instead of three (status + positions + today's history
    // used to be polled separately) - at thousands of open dashboard tabs,
    // that's a 3x cut in request volume for data that's cheap to fetch
    // together on the backend anyway.
    const loadDashboard = async () => {
        try {
            const { data } = await getEADashboard();
            const lastPing = data.account?.last_ping || data.last_ping || null;
            // The backend already validates heartbeat freshness (UTC-aware);
            // trust `data.connected` instead of re-deriving it here.
            const isConnected = data.connected === true;

            // Flash the Heartbeat tile for 1s whenever a new ping actually lands.
            if (lastPing && prevLastPingRef.current && lastPing !== prevLastPingRef.current) {
                setHeartbeatFlash(true);
                setTimeout(() => setHeartbeatFlash(false), 1000);
            }
            prevLastPingRef.current = lastPing;

            setLastSeen(lastPing ? new Date(toIsoUTC(lastPing)).toLocaleString() : "Never");
            setEaConnected(isConnected);
            setEaActivated((data.activated === true) && isConnected);
            setEaRole(data.role || "MEMBER");
            setAccountId(data.account?.id ?? null);
            setAccountNumber(data.account?.account_number || "-");
            setHeartbeat(data.heartbeat || 5);
            setActiveCommand(data.command || null);
            setPositions(data.positions || []);
            setTodayHistory(data.trades || []);
            setSymbolInfo({
                symbol: data.account?.symbol ?? null,
                point: data.account?.point ?? null,
                digits: data.account?.digits ?? null,
                bid: data.account?.bid ?? null,
                ask: data.account?.ask ?? null,
            });
        } catch (error) {
            console.error("Failed to load EA dashboard:", error);
            setEaConnected(false);
            setEaActivated(false);
            setActiveCommand(null);
        }
    };

    // Pause polling while the tab is in the background and refresh
    // immediately when it's focused again, instead of hammering the API
    // every 5s for a dashboard nobody is looking at.
    useEffect(() => {
        loadDashboard();

        let timer = null;
        const start = () => {
            if (!timer) timer = setInterval(loadDashboard, 5000);
        };
        const stop = () => {
            if (timer) clearInterval(timer);
            timer = null;
        };

        const handleVisibility = () => {
            if (document.hidden) {
                stop();
            } else {
                loadDashboard();
                start();
            }
        };

        start();
        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            stop();
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, []);

    const latestPosition = positions[0] || null;

    // Modify Position's Pips inputs write straight into the existing Price
    // fields (sl/tp) - those stay the single source of truth that's actually
    // sent to the EA, the pips box is just a convenience for filling them in.
    const handleSlPipsChange = (value) => {
        setSlPips(value);
        if (!latestPosition || !pipsAvailable || value === "") return;
        const price = pipsToPrice(latestPosition.current_price ?? latestPosition.open_price, value, pipSize, latestPosition.action, "SL");
        if (price !== null) setSl(price.toFixed(priceDigits));
    };

    const handleTpPipsChange = (value) => {
        setTpPips(value);
        if (!latestPosition || !pipsAvailable || value === "") return;
        const price = pipsToPrice(latestPosition.current_price ?? latestPosition.open_price, value, pipSize, latestPosition.action, "TP");
        if (price !== null) setTp(price.toFixed(priceDigits));
    };

     return (
        <div className="min-h-full">
            <MarketTicker />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                <main className="min-w-0 space-y-6">
                    <PageHeader title="Remote EA" subtitle="Control your connected Expert Advisor." />
{/* Status EA */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-slate-800">EA Status</h2>
                                <p className="text-xs text-slate-500">TraderHub Expert Advisor</p>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${eaActivated ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                                    {eaActivated ? "Activated" : "Inactive"}
                                </span>
                                <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${eaConnected ? "bg-emerald-50 text-emerald-600 fh-connected-glow" : "bg-red-50 text-red-600"}`}>
                                    <span className={`h-2 w-2 rounded-full ${eaConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                                    {eaConnected ? "Connected" : "Disconnected"}
                                </div>
                            </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                            <StatusItem label="Command" value={activeCommand?.command || "No command"} status={activeCommand?.status}/>
                            <StatusItem label="Role" value={eaRole} />
                            <StatusItem label="Account" value={accountNumber} />
                            <StatusItem label="Heartbeat" value={`${heartbeat}s`} flash={heartbeatFlash} />
                        </div>

                        <div className={`mt-3 flex items-center justify-between rounded-full px-4 py-2 text-xs font-medium ${eaConnected ? "bg-white text-slate-700" : "bg-red-50 text-red-600"}`}>
                            <p className="text-center">{eaConnected ? "Heartbeat is active." : "The connection between the server and the EA has been lost."}</p>
                            <span className="opacity-80">Last seen: {lastSeen || "—"}</span>
                        </div>
                    </section>
{/* Live Chart (TradingView) */}
                    {showChart && (
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-800">Live Chart</h2>
                            <p className="mt-1 text-sm text-slate-500">Powered by TradingView.</p>

                            <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
                                <iframe
                                    title="TradingView Chart"
                                    src="https://www.tradingview.com/widgetembed/?symbol=OANDA%3AXAUUSD&interval=15&hidesidetoolbar=0&symboledit=1&saveimage=0&toolbarbg=f1f3f6&theme=light&style=1&timezone=Etc%2FUTC&withdateranges=1&studies=%5B%5D&locale=en"
                                    style={{ width: "100%", height: "560px", border: "none" }}
                                    allowFullScreen
                                />
                            </div>
                        </section>
                    )}
{/* Trading Control */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">Trading Control</h2>
                                <p className="mt-1 text-sm text-slate-500">Open, close, and modify positions directly on the connected EA.</p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowChart((v) => !v)}
                                className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                                    showChart
                                        ? "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100"
                                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                {showChart ? <X size={16} /> : <LineChart size={16} />}
                                {showChart ? "Hide Chart" : "Show Chart"}
                            </button>
                        </div>

                        {/* Close & Delete */}
                        <p className="mt-5 text-xs font-semibold tracking-wide text-slate-500 uppercase">Close &amp; Delete</p>
                        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
                            <button onClick={() => requestAction("CLOSE_ALL")} className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-red-600 bg-red-600 px-2 py-2.5 text-xs font-medium text-white transition hover:bg-red-700">
                                <Power size={16} />
                                Close All
                            </button>
                            <button onClick={() => requestAction("CLOSE_BUY")} className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-2 py-2.5 text-xs font-medium text-blue-600 transition hover:bg-blue-100">
                                <ArrowDownToLine size={16} />
                                Close Buy
                            </button>
                            <button onClick={() => requestAction("CLOSE_SELL")} className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-red-200 bg-red-50 px-2 py-2.5 text-xs font-medium text-red-600 transition hover:bg-red-100">
                                <ArrowUpToLine size={16} />
                                Close Sell
                            </button>
                            <button onClick={() => requestAction("CLOSE_PROFIT")} className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-2.5 text-xs font-medium text-emerald-600 transition hover:bg-emerald-100">
                                <TrendingUp size={16} />
                                Close Profit
                            </button>
                            <button onClick={() => requestAction("CLOSE_LOSS")} className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2 py-2.5 text-xs font-medium text-rose-600 transition hover:bg-rose-100">
                                <TrendingDown size={16} />
                                Close Loss
                            </button>
                            <button onClick={() => requestAction("DELETE_PENDING")} className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-violet-200 bg-violet-50 px-2 py-2.5 text-xs font-medium text-violet-600 transition hover:bg-violet-100">
                                <Trash2 size={16} />
                                Delete Pending
                            </button>
                        </div>

                        <div className="my-5 h-px bg-slate-100" />

                        {/* Open Position + Modify Position: side by side on desktop, stacked on mobile */}
                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
                            <div>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Open Position</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs text-slate-400">Symbol follows the EA's chart</p>
                                        <div className="flex rounded-lg border border-slate-200 p-0.5">
                                            <button type="button" onClick={() => setOpenUnit("price")} className={`cursor-pointer rounded-md px-2 py-1 text-xs font-medium transition ${openUnit === "price" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}>
                                                Price
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => pipsAvailable && setOpenUnit("pips")}
                                                disabled={!pipsAvailable}
                                                title={!pipsAvailable ? "Waiting for the EA to report symbol info" : undefined}
                                                className={`cursor-pointer rounded-md px-2 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${openUnit === "pips" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}
                                            >
                                                Pips
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-2 space-y-2">
                                    <div className="flex gap-2">
                                        <input value={openTp} onChange={(e) => setOpenTp(e.target.value)} type="number" step="0.01" placeholder={openUnit === "pips" ? "TP (pips)" : "TP (price)"} title="Take Profit (optional)" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                                        <input value={openSl} onChange={(e) => setOpenSl(e.target.value)} type="number" step="0.01" placeholder={openUnit === "pips" ? "SL (pips)" : "SL (price)"} title="Stop Loss (optional)" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                                    </div>

                                    {openUnit === "pips" && (
                                        <p className="text-xs text-slate-400">
                                            {pipsAvailable
                                                ? `Bid ${symbolInfo.bid ?? "-"} · Ask ${symbolInfo.ask ?? "-"} — exact SL/TP price is calculated when you confirm Buy or Sell.`
                                                : "Waiting for the EA to report bid/ask and pip size."}
                                        </p>
                                    )}

                                    <div className="flex gap-2">
                                        <input value={openVolume} onChange={(e) => setOpenVolume(e.target.value)} type="number" step="0.01" min="0.01" placeholder="Lot" title="Volume (Lot)" className="w-24 shrink-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />

                                        <div className="flex flex-1 gap-4">
                                            <button onClick={() => requestAction("OPEN_BUY")} disabled={!openVolume} className="flex-1 cursor-pointer rounded-xl border border-blue-200 bg-blue-50 py-3 text-base font-bold text-blue-600 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40">
                                                BUY
                                            </button>
                                            <button onClick={() => requestAction("OPEN_SELL")} disabled={!openVolume} className="flex-1 cursor-pointer rounded-xl border border-red-200 bg-red-50 py-3 text-base font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40">
                                                SELL
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Modify Position</p>
                                    <p className="text-xs text-slate-400">
                                        {!latestPosition
                                            ? "No running position to calculate pips from"
                                            : !pipsAvailable
                                                ? "Waiting for the EA to report pip size"
                                                : `Calculated from ${latestPosition.symbol} · ${latestPosition.action} · Ticket ${latestPosition.ticket}`}
                                    </p>
                                </div>
                                <div className="mt-2 space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                        <input value={slPips} onChange={(e) => handleSlPipsChange(e.target.value)} disabled={!latestPosition || !pipsAvailable} type="number" step="1" placeholder="Pips" title="Calculated from the latest running position" className="w-20 shrink-0 rounded-xl border border-slate-200 px-2 py-2.5 text-sm outline-none focus:border-blue-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300" />
                                        <input value={sl} onChange={(e) => setSl(e.target.value)} type="number" step="300.01" min="100.01" placeholder="Price SL" className="w-44 shrink-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                                        <button onClick={() => sl && requestAction("MODIFY_SL")} disabled={!sl} className="flex-1 cursor-pointer rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40">
                                            Set SL
                                        </button>
                                        <button onClick={() => requestAction("DELETE_SL")} className="shrink-0 cursor-pointer rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-rose-600 transition hover:bg-rose-100" title="Delete Stop Loss">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <input value={tpPips} onChange={(e) => handleTpPipsChange(e.target.value)} disabled={!latestPosition || !pipsAvailable} type="number" step="1" placeholder="Pips" title="Calculated from the latest running position" className="w-20 shrink-0 rounded-xl border border-slate-200 px-2 py-2.5 text-sm outline-none focus:border-blue-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300" />
                                        <input value={tp} onChange={(e) => setTp(e.target.value)} type="number" step="300.01" min="100.01" placeholder="Price TP" className="w-44 shrink-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                                        <button onClick={() => tp && requestAction("MODIFY_TP")} disabled={!tp} className="flex-1 cursor-pointer rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40">
                                            Set TP
                                        </button>
                                        <button onClick={() => requestAction("DELETE_TP")} className="shrink-0 cursor-pointer rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-rose-600 transition hover:bg-rose-100" title="Delete Take Profit">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {actionFeedback.type !== "idle" && actionFeedback.message && (
                            <div className={`mt-5 rounded-xl border px-3 py-2 text-sm transition-opacity duration-500 ${
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
{/* Running Positions */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">Running Positions</h2>
                                <p className="mt-1 text-sm text-slate-500">Currently open positions on the connected EA.</p>
                            </div>

                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                                {positions.length} Running
                            </span>
                        </div>

                        <SummaryBar summary={summarizeTrades(positions)} />

                        <div className="mt-5 space-y-3">
                            {positions.length === 0 && (
                                <p className="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-400">
                                    No open positions on this account.
                                </p>
                            )}

                            {positions.map((position) => {
                                const netProfit = Number(position.profit || 0) + Number(position.swap || 0);
                                const isProfit = netProfit >= 0;

                                return (
                                    <div
                                        key={position.ticket}
                                        className={plCardClass(isProfit)}
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-semibold text-slate-800">{position.symbol}</span>

                                                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${position.action === "SELL" ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}>
                                                        {position.action}
                                                    </span>

                                                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${isProfit ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
                                                        {formatProfit(netProfit)}
                                                    </span>
                                                </div>

                                                <p className="mt-1.5 text-xs text-slate-400">
                                                    Ticket {position.ticket}
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-xs text-slate-400">
                                                    {formatDuration(position.open_time)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                                            <PositionValue label="Volume" value={position.volume} />
                                            <PositionValue label="Open Price" value={position.open_price} />
                                            <PositionValue label="Current Price" value={position.current_price ?? "—"} />
                                            <PositionValue label="SL" value={position.sl || "—"} />
                                            <PositionValue label="TP" value={position.tp || "—"} />
                                            <PositionValue label="Open Time" value={position.open_time ? new Date(toIsoUTC(position.open_time)).toLocaleString() : "—"} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
{/* Trading History */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">Trading History</h2>
                                <p className="mt-1 text-sm text-slate-500">Trades opened or closed today.</p>
                            </div>

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                                {todayHistory.length} today
                            </span>
                        </div>

                        <SummaryBar summary={summarizeTrades(todayHistory)} />

                        <div className="no-scrollbar mt-4 max-h-80 space-y-3 overflow-y-auto p-0.5">
                            {todayHistory.length === 0 && (
                                <p className="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-400">
                                    No trades today.
                                </p>
                            )}

                            {todayHistory.map((trade) => {
                                const netProfit = Number(trade.profit || 0) + Number(trade.swap || 0);
                                const isProfit = netProfit >= 0;

                                return (
                                    <div key={trade.ticket} className={plCardClass(isProfit)}>
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-semibold text-slate-800">{trade.symbol}</span>
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${trade.action === "SELL" ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}>
                                                    {trade.action}
                                                </span>
                                                <TradeStatusBadge status={trade.status} />
                                            </div>

                                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${isProfit ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
                                                {formatProfit(netProfit)}
                                            </span>
                                        </div>

                                        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                                            <span>Ticket {trade.ticket}</span>
                                            <span>Vol {trade.volume}</span>
                                            <span>Open {trade.open_price}{trade.close_price ? ` → ${trade.close_price}` : ""}</span>
                                            <span>{trade.open_time ? new Date(toIsoUTC(trade.open_time)).toLocaleTimeString() : "—"}{trade.close_time ? ` - ${new Date(toIsoUTC(trade.close_time)).toLocaleTimeString()}` : ""}</span>
                                        </div>
                                    </div>
                                );
                            })}
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

                            <button onClick={() => setConfirmAction(null)} className="cursor-pointer text-slate-400 transition hover:text-slate-600">
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
                            <button onClick={() => setConfirmAction(null)} className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                                Cancel
                            </button>
                            <button onClick={executeAction} disabled={isSubmitting} className="cursor-pointer rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                                {isSubmitting ? "Sending..." : "Confirm Action"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}