export default function Table({
    columns = [],
    data = [],
    emptyText = "No data available",
}) {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

            <div className="overflow-x-auto">

                <table className="min-w-full">

                    <thead className="bg-slate-100">

                        <tr>

                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className="px-5 py-4 text-left text-sm font-semibold text-slate-700"
                                >
                                    {column.title}
                                </th>
                            ))}

                        </tr>

                    </thead>

                    <tbody>

                        {data.length === 0 && (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-5 py-10 text-center text-slate-500"
                                >
                                    {emptyText}
                                </td>
                            </tr>
                        )}

                        {data.map((row, index) => (
                            <tr
                                key={index}
                                className="border-t border-slate-200 hover:bg-slate-50"
                            >
                                {columns.map((column) => (
                                    <td
                                        key={column.key}
                                        className="px-5 py-4 text-sm text-slate-700"
                                    >
                                        {row[column.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}

                    </tbody>

                </table>

            </div>

        </div>
    );
}