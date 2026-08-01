export default function PageHeader({
    title,
    subtitle,
    actions,
}) {
    return (
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

                <h1 className="text-3xl font-bold text-slate-900">
                    {title}
                </h1>

                {subtitle && (
                    <p className="mt-2 text-slate-500">
                        {subtitle}
                    </p>
                )}

            </div>

            {actions && (
                <div className="flex items-center gap-3">
                    {actions}
                </div>
            )}

        </div>
    );
}