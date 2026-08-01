export default function SectionTitle({
    title,
    subtitle,
    center = true,
}) {
    return (
        <div
            className={`max-w-3xl ${
                center ? "mx-auto text-center" : ""
            }`}
        >
            <h2 className="text-4xl font-bold text-slate-900">
                {title}
            </h2>

            {subtitle && (
                <p className="mt-6 text-lg leading-8 text-slate-500">
                    {subtitle}
                </p>
            )}
        </div>
    );
}