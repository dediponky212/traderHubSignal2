import { Plus, Trash2 } from "lucide-react";

import Button from "../../ui/Button";
import Input from "../../form/Input";
import Select from "../../form/Select";
import Checkbox from "../../form/Checkbox";
import Textarea from "../../form/Textarea";
import { TIMEFRAMES, SESSIONS, INDICATOR_CATALOG, INDICATOR_GROUPS, numOrEmpty } from "./robotFormConstants";

// The full robot strategy form (name/symbol/timeframe, indicators, schedule,
// risk settings, prompt mode) - shared as-is between RobotWizard (create)
// and RobotSettingsModal (edit) via the useRobotForm hook's state/mutators.
// Doesn't render its own footer buttons - those differ between the two
// callers (Next vs Save Changes) so they stay with the parent.
export default function RobotStrategyFields({
    form,
    newIndicatorType,
    setNewIndicatorType,
    updateField,
    updateJadwal,
    addIndicator,
    removeIndicator,
    updateIndicatorParam,
    toggleSession,
}) {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
                <Input
                    label="Robot Name"
                    required
                    value={form.nama_robot}
                    onChange={(e) => updateField("nama_robot", e.target.value)}
                    placeholder="e.g. Gold Scalper"
                />
                <Input
                    label="Symbol"
                    required
                    value={form.symbol}
                    onChange={(e) => updateField("symbol", e.target.value)}
                    placeholder="e.g. XAUUSD"
                />
                <Select
                    label="Timeframe"
                    value={form.timeFrame}
                    onChange={(e) => updateField("timeFrame", e.target.value)}
                    options={TIMEFRAMES.map((t) => ({ value: t, label: t }))}
                />
                <div className="flex items-end pb-3">
                    <Checkbox
                        label="Enable news filter"
                        checked={form.news}
                        onChange={(e) => updateField("news", e.target.checked)}
                    />
                </div>
            </div>

            {/* Indicators */}
            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Indicators</label>
                <div className="space-y-2">
                    {form.indikator.map((ind, i) => (
                        <div key={i} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 p-3">
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                {ind.name}
                            </span>
                            {INDICATOR_CATALOG[ind.name].map((f) =>
                                f.type === "select" ? (
                                    <select
                                        key={f.key}
                                        value={ind.params[f.key]}
                                        onChange={(e) => updateIndicatorParam(i, f.key, e.target.value, false)}
                                        title={f.label}
                                        className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-400"
                                    >
                                        {f.options.map((opt) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        key={f.key}
                                        type="number"
                                        value={ind.params[f.key]}
                                        onChange={(e) => updateIndicatorParam(i, f.key, e.target.value)}
                                        title={f.label}
                                        className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-400"
                                    />
                                )
                            )}
                            <button
                                type="button"
                                onClick={() => removeIndicator(i)}
                                className="ml-auto cursor-pointer text-slate-400 hover:text-red-500"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="mt-3 flex gap-2">
                    <select
                        value={newIndicatorType}
                        onChange={(e) => setNewIndicatorType(e.target.value)}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-400"
                    >
                        {INDICATOR_GROUPS.map((group) => (
                            <optgroup key={group.label} label={group.label}>
                                {group.items.map((name) => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                    <Button variant="violet" size="sm" onClick={addIndicator}>
                        <Plus size={16} className="mr-1" />
                        Add Indicator
                    </Button>
                </div>
            </div>

            {/* Schedule */}
            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Analysis Schedule</label>
                <div className="flex gap-4">
                    {["auto", "manual"].map((mode) => (
                        <label key={mode} className="flex cursor-pointer items-center gap-2 text-sm">
                            <input
                                type="radio"
                                checked={form.jadwal_analisa.mode === mode}
                                onChange={() => updateJadwal("mode", mode)}
                            />
                            {mode === "auto" ? "Auto" : "Manual"}
                        </label>
                    ))}
                </div>

                {form.jadwal_analisa.mode === "auto" && (
                    <div className="mt-3 space-y-3 rounded-xl border border-slate-200 p-4">
                        <Input
                            label="Interval (minutes, min. 15)"
                            hint="How often the robot checks the market and runs a new analysis."
                            type="number"
                            min={15}
                            value={form.jadwal_analisa.interval_menit}
                            onChange={(e) => updateJadwal("interval_menit", numOrEmpty(e.target.value))}
                        />
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-600">Market Sessions</label>
                            <div className="flex gap-4">
                                {SESSIONS.map((s) => (
                                    <Checkbox
                                        key={s.value}
                                        label={s.label}
                                        checked={form.jadwal_analisa.sesi_market.includes(s.value)}
                                        onChange={() => toggleSession(s.value)}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                label="Buffer before session (min)"
                                hint="Also skip analysis this many minutes before an unchecked session starts."
                                type="number"
                                min={0}
                                value={form.jadwal_analisa.buffer_sebelum_menit}
                                onChange={(e) => updateJadwal("buffer_sebelum_menit", numOrEmpty(e.target.value))}
                            />
                            <Input
                                label="Buffer after session (min)"
                                hint="Also skip analysis this many minutes after an unchecked session ends."
                                type="number"
                                min={0}
                                value={form.jadwal_analisa.buffer_sesudah_menit}
                                onChange={(e) => updateJadwal("buffer_sesudah_menit", numOrEmpty(e.target.value))}
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-600">Market Condition</label>
                            <div className="flex gap-4">
                                {[["all", "All conditions"], ["trend", "Trend only"]].map(([value, label]) => (
                                    <label key={value} className="flex cursor-pointer items-center gap-2 text-sm">
                                        <input
                                            type="radio"
                                            checked={form.jadwal_analisa.kondisi_market === value}
                                            onChange={() => updateJadwal("kondisi_market", value)}
                                        />
                                        {label}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Risk settings */}
            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Risk Settings</label>
                <div className="grid grid-cols-2 gap-3">
                    <Input
                        label="Max risk / day (%)"
                        hint="% of your account balance. The robot stops taking new signals for the day once this loss is reached."
                        type="number"
                        value={form.max_risk_per_day_percent}
                        onChange={(e) => updateField("max_risk_per_day_percent", numOrEmpty(e.target.value))}
                    />
                    <Input
                        label="Max risk / month (%)"
                        hint="% of your account balance. Same as above, but resets at the start of each month."
                        type="number"
                        value={form.max_risk_per_month_percent}
                        onChange={(e) => updateField("max_risk_per_month_percent", numOrEmpty(e.target.value))}
                    />
                    <Input
                        label="Max open positions"
                        hint="How many positions this robot may have open at the same time."
                        type="number"
                        value={form.max_open_posisi}
                        onChange={(e) => updateField("max_open_posisi", numOrEmpty(e.target.value))}
                    />
                    <Input
                        label="Min risk reward (sets TP1)"
                        hint="Minimum reward-to-risk ratio, e.g. 1.5 means TP1 is 1.5x further than your stop loss."
                        type="number"
                        step="0.1"
                        value={form.min_risk_reward}
                        onChange={(e) => updateField("min_risk_reward", numOrEmpty(e.target.value))}
                    />
                </div>
            </div>

            {/* Prompt mode */}
            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Prompt Mode</label>
                <div className="flex gap-4">
                    {["auto", "manual"].map((mode) => (
                        <label key={mode} className="flex cursor-pointer items-center gap-2 text-sm">
                            <input
                                type="radio"
                                checked={form.prompt_mode === mode}
                                onChange={() => updateField("prompt_mode", mode)}
                            />
                            {mode === "auto" ? "Auto (use built-in skills)" : "Manual"}
                        </label>
                    ))}
                </div>
                {form.prompt_mode === "manual" && (
                    <Textarea
                        className="mt-3"
                        placeholder="Extra strategy notes for the AI to consider (this never overrides the built-in rules and limits)"
                        value={form.user_strategy_notes}
                        onChange={(e) => updateField("user_strategy_notes", e.target.value)}
                    />
                )}
            </div>
        </div>
    );
}
