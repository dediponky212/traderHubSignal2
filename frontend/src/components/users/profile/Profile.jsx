import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ShieldCheck, ShieldAlert, Radio, Pencil, KeyRound, Eye, EyeOff, Camera } from "lucide-react";

import PageHeader from "../../ui/PageHeader";
import Card from "../../ui/Card";
import MarketTicker from "../../dashboard/MarketTicker";
import DashboardFooter from "../../dashboard/DashboardFooter";
import SidebarRight from "../../layout/SidebarRight";
import { useAuth } from "../../../context/AuthContext";
import { getEAStatus } from "../../../services/eaService";
import {
    updateProfile,
    uploadAvatar,
    requestPasswordChange,
    confirmPasswordChange,
    requestEmailVerification,
    confirmEmailVerification,
} from "../../../services/authService";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:3000";

// `user.avatar` is a relative path like "/uploads/avatars/1-169....webp"
// (served by the backend, e.g. :3000) - resolve it against the API origin
// rather than the frontend's own origin (e.g. :5173), same pattern eaService
// already uses for its own base URL.
function resolveAvatarUrl(avatar) {
    if (!avatar) return null;
    return avatar.startsWith("http") ? avatar : `${API_URL}${avatar}`;
}

// "Complete" here just means "this piece of data exists" - it's a checklist
// of what's filled in, deliberately separate from `email_verified` (which
// means "we confirmed you own this address", a different, security-flavored
// signal). Mixing the two into one badge would make both harder to read.
function getProfileCompleteness(user) {
    const items = [
        { key: "fullname", label: "Full name", done: !!user?.fullname },
        { key: "username", label: "Username", done: !!user?.username },
        { key: "phone", label: "Phone number", done: !!user?.phone },
        { key: "address", label: "Address", done: !!user?.address },
        { key: "avatar", label: "Profile photo", done: !!user?.avatar },
        { key: "email_verified", label: "Verified email", done: !!user?.email_verified },
    ];
    const doneCount = items.filter((item) => item.done).length;
    return { items, percent: Math.round((doneCount / items.length) * 100) };
}

// The API returns SQLite's "YYYY-MM-DD HH:MM:SS" UTC timestamps without a
// timezone suffix. `new Date()` would parse that as local time, so normalize
// to ISO-8601 UTC before parsing (same fix used across the dashboard pages).
function toIsoUTC(value) {
    if (!value) return value;
    return value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
}

function formatDateTime(value) {
    if (!value) return "-";
    const date = new Date(toIsoUTC(value));
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
}

function getInitials(fullname) {
    const initials = (fullname || "")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
    return initials || "?";
}

function InfoRow({ label, value }) {
    return (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-0">
            <span className="text-sm text-slate-500">{label}</span>
            <span className="min-w-0 truncate text-right text-sm font-medium text-slate-700">{value ?? "-"}</span>
        </div>
    );
}

function FeedbackBanner({ feedback }) {
    if (!feedback?.message) return null;
    return (
        <div className={`mt-4 rounded-xl border px-3 py-2 text-sm ${
            feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
        }`}>
            {feedback.message}
        </div>
    );
}

// Collapses/expands its content smoothly with a slide, instead of the
// content just popping in/out - the content stays mounted (grid-rows 0fr/1fr
// is what animates), which is what makes the transition possible in plain
// CSS without a JS height measurement.
function Collapsible({ open, children }) {
    return (
        <div className={`grid transition-all duration-300 ease-in-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
            <div className="overflow-hidden">{children}</div>
        </div>
    );
}

function PasswordField({ label, value, onChange, placeholder }) {
    const [visible, setVisible] = useState(false);
    return (
        <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">{label}</label>
            <div className="relative">
                <input
                    value={value}
                    onChange={onChange}
                    type={visible ? "text" : "password"}
                    placeholder={placeholder}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-10 text-sm outline-none focus:border-blue-400"
                />
                <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 flex cursor-pointer items-center px-3 text-slate-400 hover:text-slate-600"
                >
                    {visible ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>
        </div>
    );
}

export default function Profile() {
    const { user, updateUser } = useAuth();
    const [eaStatus, setEaStatus] = useState(null);
    const [loadingEa, setLoadingEa] = useState(true);

    useEffect(() => {
        getEAStatus()
            .then(({ data }) => setEaStatus(data))
            .catch(() => setEaStatus(null))
            .finally(() => setLoadingEa(false));
    }, []);

    // Avatar upload - the actual resize/compress happens server-side
    // (sharp), this just picks the file and posts it.
    const avatarInputRef = useRef(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [avatarError, setAvatarError] = useState(null);

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = ""; // allow picking the same file again later
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setAvatarError("Please choose an image file.");
            return;
        }

        setAvatarError(null);
        setUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append("avatar", file);
            const { data } = await uploadAvatar(formData);
            updateUser(data);
        } catch (error) {
            setAvatarError(error?.response?.data?.message || "Failed to upload photo.");
        } finally {
            setUploadingAvatar(false);
        }
    };

    // Profile edit form
    const [editingProfile, setEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({ fullname: "", username: "", phone: "", address: "" });
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileFeedback, setProfileFeedback] = useState(null);

    const startEditingProfile = () => {
        // Seed the form from the current user right when editing starts,
        // rather than keeping it continuously synced via an effect - that
        // way an in-progress edit is never silently clobbered by an
        // unrelated `user` update elsewhere in the app.
        setProfileForm({
            fullname: user?.fullname || "",
            username: user?.username || "",
            phone: user?.phone || "",
            address: user?.address || "",
        });
        setProfileFeedback(null);
        setEditingProfile(true);
    };

    const submitProfile = async (e) => {
        e.preventDefault();
        if (!profileForm.fullname.trim()) {
            setProfileFeedback({ type: "error", message: "Fullname is required." });
            return;
        }

        setSavingProfile(true);
        setProfileFeedback(null);
        try {
            const { data } = await updateProfile(profileForm);
            updateUser(data);
            setProfileFeedback({ type: "success", message: "Profile updated. A confirmation email was sent to you." });
            setEditingProfile(false);
        } catch (error) {
            setProfileFeedback({ type: "error", message: error?.response?.data?.message || "Failed to update profile." });
        } finally {
            setSavingProfile(false);
        }
    };

    // Change password: "closed" -> "form" (current/new password) -> "code" (email confirmation)
    const [passwordStep, setPasswordStep] = useState("closed");
    const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [confirmCode, setConfirmCode] = useState("");
    const [savingPassword, setSavingPassword] = useState(false);
    const [passwordFeedback, setPasswordFeedback] = useState(null);

    const closePasswordForm = () => {
        setPasswordStep("closed");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setConfirmCode("");
        setPasswordFeedback(null);
    };

    const submitPasswordRequest = async (e) => {
        e.preventDefault();

        if (passwordForm.newPassword.length < 6) {
            setPasswordFeedback({ type: "error", message: "New password must be at least 6 characters." });
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordFeedback({ type: "error", message: "New password and confirmation do not match." });
            return;
        }

        setSavingPassword(true);
        setPasswordFeedback(null);
        try {
            const { data } = await requestPasswordChange({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            });
            setPasswordFeedback({ type: "success", message: data.message });
            setPasswordStep("code");
        } catch (error) {
            setPasswordFeedback({ type: "error", message: error?.response?.data?.message || "Failed to request password change." });
        } finally {
            setSavingPassword(false);
        }
    };

    const submitPasswordConfirm = async (e) => {
        e.preventDefault();
        if (!confirmCode.trim()) {
            setPasswordFeedback({ type: "error", message: "Please enter the code sent to your email." });
            return;
        }

        setSavingPassword(true);
        setPasswordFeedback(null);
        try {
            await confirmPasswordChange({ code: confirmCode.trim() });
            setPasswordFeedback({ type: "success", message: "Password updated successfully." });
            setPasswordStep("closed");
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setConfirmCode("");
        } catch (error) {
            setPasswordFeedback({ type: "error", message: error?.response?.data?.message || "Failed to confirm password change." });
        } finally {
            setSavingPassword(false);
        }
    };

    // Email verification: "closed" -> "code" (code just sent, waiting for entry)
    const [verifyStep, setVerifyStep] = useState("closed");
    const [verifyCode, setVerifyCode] = useState("");
    const [savingVerify, setSavingVerify] = useState(false);
    const [verifyFeedback, setVerifyFeedback] = useState(null);

    const startVerifyEmail = async () => {
        if (user?.email_verified || savingVerify) return;
        setSavingVerify(true);
        setVerifyFeedback(null);
        try {
            const { data } = await requestEmailVerification();
            setVerifyFeedback({ type: "success", message: data.message });
            setVerifyStep("code");
        } catch (error) {
            setVerifyFeedback({ type: "error", message: error?.response?.data?.message || "Failed to send verification code." });
        } finally {
            setSavingVerify(false);
        }
    };

    const closeVerifyEmail = () => {
        setVerifyStep("closed");
        setVerifyCode("");
        setVerifyFeedback(null);
    };

    const submitVerifyEmail = async (e) => {
        e.preventDefault();
        if (!verifyCode.trim()) {
            setVerifyFeedback({ type: "error", message: "Please enter the code sent to your email." });
            return;
        }

        setSavingVerify(true);
        setVerifyFeedback(null);
        try {
            const { data } = await confirmEmailVerification({ code: verifyCode.trim() });
            updateUser(data);
            setVerifyFeedback({ type: "success", message: "Email verified." });
            setVerifyStep("closed");
            setVerifyCode("");
        } catch (error) {
            setVerifyFeedback({ type: "error", message: error?.response?.data?.message || "Failed to confirm verification." });
        } finally {
            setSavingVerify(false);
        }
    };

    const account = eaStatus?.account;
    const completeness = getProfileCompleteness(user);
    const inputClass = "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400";
    const labelClass = "mb-1.5 block text-xs font-medium text-slate-600";
    const cancelClass = "cursor-pointer rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-100";

    return (
        <div className="min-h-full">
            <MarketTicker />

            <div className="p-4 md:p-6">
                <PageHeader title="Profile" subtitle="Your account details." />

                <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <main className="min-w-0 space-y-6">
                        {/* Identity */}
                        <Card className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
                            <div className="group relative h-20 w-20 shrink-0">
                                {user?.avatar ? (
                                    <img src={resolveAvatarUrl(user.avatar)} alt={user.fullname} className="h-20 w-20 rounded-full object-cover" />
                                ) : (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white">
                                        {getInitials(user?.fullname)}
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={() => avatarInputRef.current?.click()}
                                    disabled={uploadingAvatar}
                                    title="Change photo"
                                    className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-slate-900/0 text-transparent transition group-hover:bg-slate-900/40 group-hover:text-white disabled:cursor-not-allowed"
                                >
                                    <Camera size={20} />
                                </button>

                                <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />

                                {uploadingAvatar && (
                                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-900/40">
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    </div>
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <h2 className="text-xl font-bold text-slate-900">{user?.fullname || "-"}</h2>
                                <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-slate-500 sm:justify-start">
                                    <Mail size={14} />
                                    {user?.email || "-"}
                                </p>
                                {avatarError && <p className="mt-1 text-xs text-red-600">{avatarError}</p>}

                                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 capitalize">
                                        {user?.role || "user"}
                                    </span>
                                    <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${user?.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                                        {user?.status || "-"}
                                    </span>
                                    {user?.email_verified ? (
                                        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                                            <ShieldCheck size={14} />
                                            Verified
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={startVerifyEmail}
                                            disabled={savingVerify || verifyStep === "code"}
                                            className="flex cursor-pointer items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <ShieldAlert size={14} />
                                            {savingVerify ? "Sending..." : "Not verified · Click to verify"}
                                        </button>
                                    )}
                                </div>

                                <Collapsible open={verifyStep === "code"}>
                                    <form onSubmit={submitVerifyEmail} className="mt-3 flex flex-wrap items-end justify-center gap-2 sm:justify-start">
                                        <div>
                                            <label className={labelClass}>Verification Code</label>
                                            <input
                                                value={verifyCode}
                                                onChange={(e) => setVerifyCode(e.target.value)}
                                                inputMode="numeric"
                                                maxLength={6}
                                                placeholder="123456"
                                                className="w-32 rounded-xl border border-slate-200 px-3 py-2.5 text-center text-sm font-semibold tracking-[0.3em] outline-none focus:border-blue-400"
                                            />
                                        </div>
                                        <button type="submit" disabled={savingVerify} className="cursor-pointer rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                                            {savingVerify ? "Confirming..." : "Confirm"}
                                        </button>
                                        <button type="button" onClick={closeVerifyEmail} className={cancelClass}>
                                            Cancel
                                        </button>
                                    </form>
                                </Collapsible>

                                <FeedbackBanner feedback={verifyFeedback} />

                                {/* Profile completeness */}
                                <div className="mt-4">
                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        <span>Profile Completeness</span>
                                        <span className="font-semibold text-slate-700">{completeness.percent}%</span>
                                    </div>
                                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${completeness.percent === 100 ? "bg-emerald-500" : "bg-blue-600"}`}
                                            style={{ width: `${completeness.percent}%` }}
                                        />
                                    </div>
                                    {completeness.percent < 100 && (
                                        <p className="mt-1.5 text-xs text-slate-400">
                                            Missing: {completeness.items.filter((item) => !item.done).map((item) => item.label).join(", ")}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Account Details + Linked Trading Account, side by side on desktop */}
                        <Card>
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="text-lg font-semibold text-slate-800">Account &amp; Trading</h2>
                                {!editingProfile && (
                                    <button type="button" onClick={startEditingProfile} className="flex cursor-pointer items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-100">
                                        <Pencil size={16} />
                                        Edit Profile
                                    </button>
                                )}
                            </div>

                            <Collapsible open={editingProfile}>
                                <form onSubmit={submitProfile} className="mt-4 grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className={labelClass}>Fullname</label>
                                        <input value={profileForm.fullname} onChange={(e) => setProfileForm({ ...profileForm, fullname: e.target.value })} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Username</label>
                                        <input value={profileForm.username} onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Email <span className="text-slate-400 normal-case">(cannot be changed)</span></label>
                                        <input value={user?.email || ""} disabled className={`${inputClass} cursor-not-allowed bg-slate-50 text-slate-400`} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Phone Number</label>
                                        <input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} type="tel" placeholder="+62 812-3456-7890" className={inputClass} />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className={labelClass}>Address</label>
                                        <textarea value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} placeholder="Street, city, country" rows={3} className={`${inputClass} resize-none`} />
                                    </div>

                                    <div className="flex gap-2 sm:col-span-2">
                                        <button type="submit" disabled={savingProfile} className="cursor-pointer rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                                            {savingProfile ? "Saving..." : "Save Changes"}
                                        </button>
                                        <button type="button" onClick={() => setEditingProfile(false)} className={cancelClass}>
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </Collapsible>

                            <Collapsible open={!editingProfile}>
                                <div className="mt-3 grid gap-x-8 lg:grid-cols-2">
                                    <div>
                                        <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Account Details</p>
                                        <div className="mt-1">
                                            <InfoRow label="Username" value={user?.username} />
                                            <InfoRow label="Phone Number" value={user?.phone} />
                                            <InfoRow label="Address" value={user?.address} />
                                            <InfoRow label="Member Since" value={formatDateTime(user?.created_at)} />
                                            <InfoRow label="Last Login" value={formatDateTime(user?.last_login)} />
                                        </div>
                                    </div>

                                    <div className="mt-5 lg:mt-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Linked Trading Account</p>
                                            <Link to="/settings/remote-ea" className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline">
                                                <Radio size={13} />
                                                Remote EA
                                            </Link>
                                        </div>

                                        {loadingEa ? (
                                            <p className="mt-3 text-sm text-slate-400">Loading...</p>
                                        ) : account ? (
                                            <div className="mt-1">
                                                <InfoRow label="Account Number" value={account.account_number} />
                                                <InfoRow label="Broker" value={account.broker} />
                                                <InfoRow label="Server" value={account.server_name} />
                                                <InfoRow label="Platform" value={account.platform} />
                                                <InfoRow label="Role" value={eaStatus.role} />
                                                <InfoRow
                                                    label="Connection"
                                                    value={
                                                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${eaStatus.connected ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                                                            {eaStatus.connected ? "Connected" : "Disconnected"}
                                                        </span>
                                                    }
                                                />
                                            </div>
                                        ) : (
                                            <p className="mt-3 rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-400">
                                                No trading account linked yet.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </Collapsible>

                            <FeedbackBanner feedback={profileFeedback} />
                        </Card>

                        {/* Security */}
                        <Card>
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-800">Security</h2>
                                    <p className="mt-1 text-sm text-slate-500">Change your account password.</p>
                                </div>
                                {passwordStep === "closed" && (
                                    <button
                                        type="button"
                                        onClick={() => { setPasswordFeedback(null); setPasswordStep("form"); }}
                                        className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                                    >
                                        <KeyRound size={16} />
                                        Change Password
                                    </button>
                                )}
                            </div>

                            <Collapsible open={passwordStep === "form"}>
                                <form onSubmit={submitPasswordRequest} className="mt-4 grid gap-4 sm:grid-cols-3">
                                    <PasswordField label="Current Password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
                                    <PasswordField label="New Password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
                                    <PasswordField label="Confirm New Password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />

                                    <div className="flex gap-2 sm:col-span-3">
                                        <button type="submit" disabled={savingPassword} className="cursor-pointer rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                                            {savingPassword ? "Sending Code..." : "Send Confirmation Code"}
                                        </button>
                                        <button type="button" onClick={closePasswordForm} className={cancelClass}>
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </Collapsible>

                            <Collapsible open={passwordStep === "code"}>
                                <form onSubmit={submitPasswordConfirm} className="mt-4">
                                    <p className="text-sm text-slate-500">Enter the 6-digit code we sent to your email to confirm the new password.</p>
                                    <div className="mt-3 max-w-xs">
                                        <label className={labelClass}>Confirmation Code</label>
                                        <input
                                            value={confirmCode}
                                            onChange={(e) => setConfirmCode(e.target.value)}
                                            inputMode="numeric"
                                            maxLength={6}
                                            placeholder="123456"
                                            className={`${inputClass} text-center text-lg font-semibold tracking-[0.3em]`}
                                        />
                                    </div>

                                    <div className="mt-4 flex gap-2">
                                        <button type="submit" disabled={savingPassword} className="cursor-pointer rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                                            {savingPassword ? "Confirming..." : "Confirm"}
                                        </button>
                                        <button type="button" onClick={closePasswordForm} className={cancelClass}>
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </Collapsible>

                            <FeedbackBanner feedback={passwordFeedback} />
                        </Card>
                    </main>

                    <SidebarRight />
                </div>
            </div>

            <DashboardFooter />
        </div>
    );
}
