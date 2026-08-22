import { useCallback, useState } from "react";
import { INDICATOR_CATALOG, emptyForm, numOrEmpty } from "./robotFormConstants";

// All the form state + mutators shared by RobotWizard (create) and
// RobotSettingsModal (edit) - `initial` seeds it for edit mode, omit it for
// a blank create form. Everything returned here is wrapped in useCallback so
// consumers can safely put e.g. `reset` in a useEffect dependency array
// without it re-firing every render.
export default function useRobotForm(initial) {
    const [form, setForm] = useState(initial || emptyForm);
    const [newIndicatorType, setNewIndicatorType] = useState("RSI");

    const reset = useCallback((next) => setForm(next || emptyForm()), []);

    const updateField = useCallback(
        (key, value) => setForm((f) => ({ ...f, [key]: value })),
        []
    );
    const updateJadwal = useCallback(
        (key, value) => setForm((f) => ({ ...f, jadwal_analisa: { ...f.jadwal_analisa, [key]: value } })),
        []
    );

    const addIndicator = useCallback(() => {
        const fields = INDICATOR_CATALOG[newIndicatorType];
        const params = {};
        fields.forEach((f) => {
            params[f.key] = f.default;
        });
        setForm((f) => ({ ...f, indikator: [...f.indikator, { name: newIndicatorType, params }] }));
    }, [newIndicatorType]);

    const removeIndicator = useCallback(
        (index) => setForm((f) => ({ ...f, indikator: f.indikator.filter((_, i) => i !== index) })),
        []
    );

    const updateIndicatorParam = useCallback(
        (index, key, value, isNumber = true) =>
            setForm((f) => {
                const indikator = [...f.indikator];
                indikator[index] = {
                    ...indikator[index],
                    params: { ...indikator[index].params, [key]: isNumber ? numOrEmpty(value) : value },
                };
                return { ...f, indikator };
            }),
        []
    );

    const toggleSession = useCallback(
        (value) =>
            setForm((f) => {
                const sesi = f.jadwal_analisa.sesi_market.includes(value)
                    ? f.jadwal_analisa.sesi_market.filter((s) => s !== value)
                    : [...f.jadwal_analisa.sesi_market, value];
                return { ...f, jadwal_analisa: { ...f.jadwal_analisa, sesi_market: sesi } };
            }),
        []
    );

    return {
        form,
        setForm,
        reset,
        newIndicatorType,
        setNewIndicatorType,
        updateField,
        updateJadwal,
        addIndicator,
        removeIndicator,
        updateIndicatorParam,
        toggleSession,
    };
}
