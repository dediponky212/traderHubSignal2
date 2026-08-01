export default function MarketTickerItem({ item }) {

    const up = item.change >= 0;

    return (

        <div
            className="
                flex
                items-center
                gap-3
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                py-2
                shadow-sm
                whitespace-nowrap
            "
        >

            <div
                className={`h-2 w-2 rounded-full ${
                    up
                        ? "bg-emerald-500"
                        : "bg-red-500"
                }`}
            />

            <div>

                <div className="text-xs font-semibold text-slate-900">
                    {item.symbol}
                </div>

                <div className="text-[11px] text-slate-500">
                    {item.price}
                </div>

            </div>

            <div
                className={`text-sm font-semibold ${
                    up
                        ? "text-emerald-600"
                        : "text-red-600"
                }`}
            >
                {up ? "+" : ""}
                {item.change}%
            </div>

        </div>

    );
}