export function formatNumber(value) {
    if (value === null || value === undefined || value === "") return "-";
    return Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function formatDateTime(value) {
    if (!value) return "-";
    return new Date(value.replace(" ", "T")).toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}
