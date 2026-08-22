import { useEffect, useState } from "react";

import Modal from "../../ui/Modal";
import Button from "../../ui/Button";
import { updateRobot } from "../../../services/robotService";
import useRobotForm from "./useRobotForm";
import RobotStrategyFields from "./RobotStrategyFields";
import { robotToFormState, validateStrategyForm } from "./robotFormConstants";

// Single-step settings editor - unlike RobotWizard this never touches
// billing (that's chosen once at creation/renewal, not here) and never
// re-runs the cost-estimate/confirmation ceremony, it just PATCHes the
// strategy fields straight through.
export default function RobotSettingsModal({ robot, onClose, onSaved }) {
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
    } = useRobotForm(robot ? robotToFormState(robot) : undefined);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    // `robot` only changes when a different card's Edit button is clicked
    // (the modal unmounts/hides in between via the `open` check below), so
    // this re-seeds the form for whichever robot was most recently opened.
    useEffect(() => {
        if (robot) resetForm(robotToFormState(robot));
    }, [robot, resetForm]);

    if (!robot) return null;

    const handleSave = async () => {
        const validationError = validateStrategyForm(form);
        if (validationError) {
            setError(validationError);
            return;
        }
        setError("");
        setSaving(true);
        try {
            const { data } = await updateRobot(robot.id, form);
            onSaved?.(data.robot);
            onClose();
        } catch (err) {
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err.response) {
                setError(`Failed to save changes (server responded with ${err.response.status}). Please try again.`);
            } else if (err.request) {
                setError("Failed to save changes: could not reach the server. Check your connection and try again.");
            } else {
                setError(`Failed to save changes: ${err.message}`);
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal open={!!robot} onClose={onClose} title={`Edit ${robot.nama_robot}`} size="lg">
            {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                    {error}
                </div>
            )}

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
                    <Button variant="dark" onClick={onClose} disabled={saving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
