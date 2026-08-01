export default function Badge({
    children,
}) {
    return (
        <span
            className="
            inline-flex
            rounded-full
            bg-blue-50
            px-4
            py-2
            text-sm
            font-medium
            text-blue-700
        "
        >
            {children}
        </span>
    );
}