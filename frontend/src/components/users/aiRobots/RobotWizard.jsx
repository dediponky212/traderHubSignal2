import { useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";

import Modal from "../../ui/Modal";
import Button from "../../ui/Button";
import Input from "../../form/Input";
import { createRobot } from "../../../services/robotService";
import useRobotForm from "./useRobotForm";
import RobotStrategyFields from "./RobotStrategyFields";
import { emptyForm, validateStrategyForm } from "./robotFormConstants";

const PROCESSING_STAGES = [
    "Setting up your robot...",
    "Configuring strategy and indicators...",
    "Selecting specialist agent models...",
];

// TODO: replace with real cost from the LLM provider once one is chosen
// (docs/dataSkill/06-billing-tokens.md). tokens_per_signal / monthly price
// below follow the documented formula exactly - only `realCostIdr` is a
// placeholder, so swapping it for a real number later is a one-line change.
const BASE_COST_IDR = 150;
const PER_INDICATOR_COST_IDR = 30;
const NEWS_SURCHARGE_IDR = 40;

function estimateBilling(form) {
    const realCostIdr =
        BASE_COST_IDR +
        form.indikator.length * PER_INDICATOR_COST_IDR +
        (form.news ? NEWS_SURCHARGE_IDR : 0);
    const costWithMargin = realCostIdr * 1.5;
    const tokensPerSignal = Math.ceil(costWithMargin / 100);
    const intervalMenit = form.jadwal_analisa.mode === "auto" ? form.jadwal_analisa.interval_menit : 60;
    const signalsPerDayMax = Math.floor(1440 / intervalMenit);
    const monthlyPriceIdr = tokensPerSignal * 100 * signalsPerDayMax * 30;
    const maxSignalPerMonth = signalsPerDayMax * 30;
    return { tokensPerSignal, monthlyPriceIdr, maxSignalPerMonth };
}

const formatIdr = (n) => `Rp ${Number(n || 0).toLocaleString("id-ID")}`;

export default function RobotWizard({ open, onClose, onCreated, isFirstRobot }) {
    const [step, setStep] = useState(0); // 0 = strategy form, 1 = processing, 2 = confirm + billing
    const {
        form,
        reset: resetForm,
        newIndicatorType,
        setNewIndicatorType,
        updateField,
        updateJadwal,
        addIndicator,
        removeIndicator,
        updateIndicatorParam,
        toggleSession,
    } = useRobotForm();
    const [error, setError] = useState("");
    const [doneStages, setDoneStages] = useState(0);
    const [billing, setBilling] = useState(null);
    const [billingMode, setBillingMode] = useState("per_signal");
    const [maxSignalPerDay, setMaxSignalPerDay] = useState(10);
    // Not pre-checked even when eligible - opting into the trial is an
    // explicit choice, and leaving it unchecked by default means the pricing
    // section below is always visible instead of silently hidden behind it.
    const [useFreeTrial, setUseFreeTrial] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const resetAndClose = () => {
        setStep(0);
        resetForm(emptyForm());
        setError("");
        setDoneStages(0);
        setBilling(null);
        setUseFreeTrial(false);
        onClose();
    };

    const goToProcessing = () => {
        const validationError = validateStrategyForm(form);
        if (validationError) {
            setError(validationError);
            return;
        }
        setError("");

        setStep(1);
        setDoneStages(0);
        PROCESSING_STAGES.forEach((_, i) => {
            setTimeout(() => setDoneStages((d) => Math.max(d, i + 1)), (i + 1) * 700);
        });
        setTimeout(() => {
            setBilling(estimateBilling(form));
            setStep(2);
        }, PROCESSING_STAGES.length * 700 + 300);
    };

    const handleCreate = async () => {
        setSubmitting(true);
        setError("");
        try {
            const payload = {
                ...form,
                ...(useFreeTrial
                    ? { is_free_trial: true }
                    : billingMode === "per_signal"
                    ? {
                          billing_mode: "per_signal",
                          tokens_per_signal: billing.tokensPerSignal,
                          max_signal_per_day: maxSignalPerDay,
                      }
                    : {
                          billing_mode: "monthly",
                          tokens_per_signal: billing.tokensPerSignal,
                          monthly_price_idr: billing.monthlyPriceIdr,
                          max_signal_per_month: billing.maxSignalPerMonth,
                      }),
            };
            const { data } = await createRobot(payload);
            onCreated?.(data.robot);
            resetAndClose();
        } catch (err) {
            // A JSON `message` from the API is the normal case (validation
            // errors, etc). Anything else (server unreachable, a non-JSON
            // error page, ...) gets a status-aware fallback instead of the
            // same unhelpful "Failed to create robot." every time.
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err.response) {
                setError(`Failed to create robot (server responded with ${err.response.status}). Please try again or contact support.`);
            } else if (err.request) {
                setError("Failed to create robot: could not reach the server. Check your connection and try again.");
            } else {
                setError(`Failed to create robot: ${err.message}`);
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal open={open} onClose={resetAndClose} title="Create Robot" size="lg">
            {/* Step indicator */}
            <div className="mb-6 flex items-center gap-2 text-xs font-medium text-slate-400">
                {["Strategy", "Processing", "Confirm"].map((label, i) => (
                    <div key={label} className="flex items-center gap-2">
                        <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full ${
                                i <= step ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                            }`}
                        >
                            {i + 1}
                        </span>
                        <span className={i <= step ? "text-slate-700" : ""}>{label}</span>
                        {i < 2 && <span className="mx-1 h-px w-6 bg-slate-200" />}
                    </div>
                ))}
            </div>

            {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                    {error}
                </div>
            )}

            {step === 0 && (
                <div className="max-h-[65vh] space-y-6 overflow-y-auto pr-1">
                    <RobotStrategyFields
                        form={form}
                        newIndicatorType={newIndicatorType}
                        setNewIndicatorType={setNewIndicatorType}
                        updateField={updateField}
                        updateJadwal={updateJadwal}
                        addIndicator={addIndicator}
                        removeIndicator={removeIndicator}
                        updateIndicatorParam={updateIndicatorParam}
                        toggleSession={toggleSession}
                    />

                    <div className="mt-4 flex justify-end gap-3 border-t border-slate-100 pt-5 pb-1">
                        <Button variant="dark" onClick={resetAndClose}>Cancel</Button>
                        <Button onClick={goToProcessing}>Next</Button>
                    </div>
                </div>
            )}

            {step === 1 && (
                <div className="flex flex-col items-center gap-6 py-10">
                    <Sparkles size={32} className="text-blue-600" />
                    <div className="w-full max-w-sm space-y-3">
                        {PROCESSING_STAGES.map((label, i) => (
                            <div key={label} className="flex items-center gap-3 text-sm">
                                {doneStages > i ? (
                                    <Check size={18} className="text-emerald-500" />
                                ) : (
                                    <Loader2 size={18} className="animate-spin text-slate-400" />
                                )}
                                <span className={doneStages > i ? "text-slate-700" : "text-slate-400"}>{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {step === 2 && billing && (
                <div className="max-h-[65vh] space-y-6 overflow-y-auto pr-1">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-800">Review</h3>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-600 sm:grid-cols-3">
                            <p><span className="text-slate-400">Name:</span> {form.nama_robot}</p>
                            <p><span className="text-slate-400">Symbol:</span> {form.symbol}</p>
                            <p><span className="text-slate-400">Timeframe:</span> {form.timeFrame}</p>
                            <p><span className="text-slate-400">Indicators:</span> {form.indikator.length}</p>
                            <p><span className="text-slate-400">News filter:</span> {form.news ? "On" : "Off"}</p>
                            <p><span className="text-slate-400">Schedule:</span> {form.jadwal_analisa.mode}</p>
                        </div>
                    </div>

                    {isFirstRobot && (
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                            <input
                                type="checkbox"
                                checked={useFreeTrial}
                                onChange={(e) => setUseFreeTrial(e.target.checked)}
                                className="mt-1"
                            />
                            <span className="text-sm text-emerald-700">
                                <strong>Free trial available</strong> — 1 week free, up to 3 analyses/day. Only for your first robot.
                            </span>
                        </label>
                    )}

                    <div>
                        <p className="mb-2 text-xs font-medium text-amber-600">
                            Pricing below is an estimate — final pricing after the AI provider is connected.
                        </p>
                        {useFreeTrial && (
                            <p className="mb-2 text-xs text-emerald-600">
                                You're using the free trial now — the plan below applies automatically once the 7-day trial ends.
                            </p>
                        )}
                        <div className="flex gap-3">
                            {["per_signal", "monthly"].map((mode) => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setBillingMode(mode)}
                                    className={`flex-1 cursor-pointer rounded-xl border px-4 py-3 text-left text-sm ${
                                        billingMode === mode ? "border-blue-600 bg-blue-50" : "border-slate-200"
                                    }`}
                                >
                                    {mode === "per_signal" ? "Per-signal" : "Monthly"}
                                </button>
                            ))}
                        </div>

                        {billingMode === "per_signal" ? (
                            <div className="mt-3 space-y-3">
                                <p className="text-sm text-slate-600">
                                    <strong>{billing.tokensPerSignal} tokens</strong> per signal
                                </p>
                                <Input
                                    label="Max signals per day"
                                    type="number"
                                    min={1}
                                    value={maxSignalPerDay}
                                    onChange={(e) => setMaxSignalPerDay(e.target.value === "" ? "" : Number(e.target.value))}
                                />
                            </div>
                        ) : (
                            <p className="mt-3 text-sm text-slate-600">
                                <strong>{formatIdr(billing.monthlyPriceIdr)}/month</strong> — up to {billing.maxSignalPerMonth} signals
                            </p>
                        )}
                    </div>

                    <div className="mt-4 flex justify-end gap-3 border-t border-slate-100 pt-5 pb-1">
                        <Button variant="dark" onClick={() => setStep(0)} disabled={submitting}>Back</Button>
                        <Button onClick={handleCreate} disabled={submitting}>
                            {submitting ? "Creating..." : "Create Bot"}
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
}
