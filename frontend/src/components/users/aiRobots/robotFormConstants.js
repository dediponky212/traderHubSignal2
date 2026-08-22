// Shared between RobotWizard (create) and RobotSettingsModal (edit) - both
// need the exact same field catalog/options, so it lives here once instead
// of being duplicated (and drifting) between the two.

export const TIMEFRAMES = ["M15", "M30", "H1", "H4", "D1"];

export const SESSIONS = [
    { value: "asia", label: "Asia" },
    { value: "london", label: "London" },
    { value: "usa", label: "USA" },
];

// Full set of MetaTrader's built-in indicators, grouped the same way as the
// MT4/MT5 Navigator (Trend / Oscillators / Volumes / Bill Williams). Each
// field is either a number input or a select (method/applied price, etc.) -
// see the `type` on each field below.
const METHOD_OPTIONS = ["SMA", "EMA", "SMMA", "LWMA"];
const APPLIED_PRICE_OPTIONS = ["Close", "Open", "High", "Low", "Median", "Typical", "Weighted"];

export const INDICATOR_CATALOG = {
    // --- Trend ---
    "MA": [
        { key: "period", label: "Period", type: "number", default: 14 },
        { key: "shift", label: "Shift", type: "number", default: 0 },
        { key: "method", label: "Method", type: "select", options: METHOD_OPTIONS, default: "SMA" },
        { key: "appliedPrice", label: "Applied Price", type: "select", options: APPLIED_PRICE_OPTIONS, default: "Close" },
    ],
    "ADX": [{ key: "period", label: "Period", type: "number", default: 14 }],
    "ADX Wilder": [{ key: "period", label: "Period", type: "number", default: 14 }],
    "Bollinger Bands": [
        { key: "period", label: "Period", type: "number", default: 20 },
        { key: "deviation", label: "Deviation", type: "number", default: 2 },
    ],
    "Envelopes": [
        { key: "period", label: "Period", type: "number", default: 14 },
        { key: "deviation", label: "Deviation %", type: "number", default: 0.1 },
    ],
    "Ichimoku": [
        { key: "tenkanSen", label: "Tenkan-sen", type: "number", default: 9 },
        { key: "kijunSen", label: "Kijun-sen", type: "number", default: 26 },
        { key: "senkouSpanB", label: "Senkou Span B", type: "number", default: 52 },
    ],
    "Parabolic SAR": [
        { key: "step", label: "Step", type: "number", default: 0.02 },
        { key: "maximum", label: "Maximum", type: "number", default: 0.2 },
    ],
    "Standard Deviation": [{ key: "period", label: "Period", type: "number", default: 20 }],

    // --- Oscillators ---
    "ATR": [{ key: "period", label: "Period", type: "number", default: 14 }],
    "Bears Power": [{ key: "period", label: "Period", type: "number", default: 13 }],
    "Bulls Power": [{ key: "period", label: "Period", type: "number", default: 13 }],
    "CCI": [{ key: "period", label: "Period", type: "number", default: 14 }],
    "DeMarker": [{ key: "period", label: "Period", type: "number", default: 14 }],
    "Force Index": [{ key: "period", label: "Period", type: "number", default: 13 }],
    "MACD": [
        { key: "fast", label: "Fast", type: "number", default: 12 },
        { key: "slow", label: "Slow", type: "number", default: 26 },
        { key: "signal", label: "Signal", type: "number", default: 9 },
    ],
    "Momentum": [{ key: "period", label: "Period", type: "number", default: 14 }],
    "OsMA": [
        { key: "fast", label: "Fast", type: "number", default: 12 },
        { key: "slow", label: "Slow", type: "number", default: 26 },
        { key: "signal", label: "Signal", type: "number", default: 9 },
    ],
    "RSI": [{ key: "period", label: "Period", type: "number", default: 14 }],
    "RVI": [{ key: "period", label: "Period", type: "number", default: 10 }],
    "Stochastic": [
        { key: "kPeriod", label: "%K", type: "number", default: 5 },
        { key: "dPeriod", label: "%D", type: "number", default: 3 },
        { key: "slowing", label: "Slowing", type: "number", default: 3 },
    ],
    "Williams %R": [{ key: "period", label: "Period", type: "number", default: 14 }],

    // --- Volumes ---
    "A/D": [],
    "MFI": [{ key: "period", label: "Period", type: "number", default: 14 }],
    "OBV": [],
    "Volumes": [],

    // --- Bill Williams ---
    "AC": [],
    "Alligator": [
        { key: "jawPeriod", label: "Jaw Period", type: "number", default: 13 },
        { key: "jawShift", label: "Jaw Shift", type: "number", default: 8 },
        { key: "teethPeriod", label: "Teeth Period", type: "number", default: 8 },
        { key: "teethShift", label: "Teeth Shift", type: "number", default: 5 },
        { key: "lipsPeriod", label: "Lips Period", type: "number", default: 5 },
        { key: "lipsShift", label: "Lips Shift", type: "number", default: 3 },
    ],
    "AO": [],
    "Fractals": [],
    "Gator Oscillator": [
        { key: "jawPeriod", label: "Jaw Period", type: "number", default: 13 },
        { key: "teethPeriod", label: "Teeth Period", type: "number", default: 8 },
        { key: "lipsPeriod", label: "Lips Period", type: "number", default: 5 },
    ],
    "BW MFI": [],
};

export const INDICATOR_GROUPS = [
    { label: "Trend", items: ["MA", "ADX", "ADX Wilder", "Bollinger Bands", "Envelopes", "Ichimoku", "Parabolic SAR", "Standard Deviation"] },
    { label: "Oscillators", items: ["ATR", "Bears Power", "Bulls Power", "CCI", "DeMarker", "Force Index", "MACD", "Momentum", "OsMA", "RSI", "RVI", "Stochastic", "Williams %R"] },
    { label: "Volumes", items: ["A/D", "MFI", "OBV", "Volumes"] },
    { label: "Bill Williams", items: ["AC", "Alligator", "AO", "Fractals", "Gator Oscillator", "BW MFI"] },
];

// Keeps a number input clearable: with a plain `Number(e.target.value)` an
// empty field becomes 0 and the input immediately shows "0" again the moment
// the last digit is deleted, so it can never actually be emptied out while
// typing a new value. Letting it hold "" in between fixes that; validation
// on submit still requires a real positive number, so "" just reads as
// missing rather than 0.
export const numOrEmpty = (raw) => (raw === "" ? "" : Number(raw));

export const emptyForm = () => ({
    nama_robot: "",
    symbol: "",
    timeFrame: "H1",
    news: false,
    indikator: [],
    jadwal_analisa: {
        mode: "auto",
        interval_menit: 60,
        sesi_market: ["asia", "london", "usa"],
        buffer_sebelum_menit: 0,
        buffer_sesudah_menit: 0,
        kondisi_market: "all",
    },
    max_risk_per_day_percent: 3,
    max_risk_per_month_percent: 10,
    max_open_posisi: 3,
    min_risk_reward: 1.5,
    prompt_mode: "auto",
    user_strategy_notes: "",
});

// Shared client-side validation used before both create (RobotWizard) and
// edit (RobotSettingsModal) submit - returns an error string, or null if the
// form is valid. The server re-validates independently either way (see
// server/services/robotService.js validateRobotInput) - this is just for
// fast feedback without a round-trip.
export function validateStrategyForm(form) {
    if (!form.nama_robot.trim() || !form.symbol.trim()) {
        return "Robot name and symbol are required.";
    }
    if (form.jadwal_analisa.mode === "auto" && Number(form.jadwal_analisa.interval_menit) < 15) {
        return "Analysis interval must be at least 15 minutes.";
    }
    if (form.prompt_mode === "manual" && !form.user_strategy_notes.trim()) {
        return "Strategy notes are required when using manual prompt mode.";
    }
    return null;
}

// Converts a robot row from the API (server/services/robotService.js shape -
// snake_case, sesi_market stored as a JSON string, indikator already
// attached as [{name, params}]) into the same form shape emptyForm() uses,
// for pre-filling the edit form.
export const robotToFormState = (robot) => ({
    nama_robot: robot.nama_robot,
    symbol: robot.symbol,
    timeFrame: robot.time_frame,
    news: !!robot.news,
    indikator: robot.indikator || [],
    jadwal_analisa: {
        mode: robot.jadwal_mode,
        interval_menit: robot.interval_menit ?? 60,
        sesi_market: robot.sesi_market ? JSON.parse(robot.sesi_market) : ["asia", "london", "usa"],
        buffer_sebelum_menit: robot.buffer_sebelum_menit ?? 0,
        buffer_sesudah_menit: robot.buffer_sesudah_menit ?? 0,
        kondisi_market: robot.kondisi_market || "all",
    },
    max_risk_per_day_percent: robot.max_risk_per_day_percent,
    max_risk_per_month_percent: robot.max_risk_per_month_percent,
    max_open_posisi: robot.max_open_posisi,
    min_risk_reward: robot.min_risk_reward,
    prompt_mode: robot.prompt_mode,
    user_strategy_notes: robot.user_strategy_notes || "",
});
