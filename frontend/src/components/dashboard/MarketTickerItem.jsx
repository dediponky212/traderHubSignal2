export default function MarketTickerItem({ item }) {
    const up = item.change >= 0;

    // Format harga menjadi mata uang USD
    const formatPrice = (price) => {
        if (price === "—" || !price) return "—";
        const numPrice = parseFloat(price);
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 5,
        }).format(numPrice);
    };

    // Format persentase dengan 2 digit di belakang koma
    const formatChange = (change) => {
        return parseFloat(change).toFixed(2);
    };

    return (
        <div className="
                flex
                items-center
                gap-3
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                py-1
                shadow-sm
                whitespace-nowrap
            ">
            {/* <div className={`h-3 w-3 rounded-full ${up ? "bg-emerald-500" : "bg-red-500"}`}/> */}
            <div>
                <div className="text-xs font-semibold text-slate-900">{item.symbol}</div>
                <div className={`text-sm font-semibold ${up ? "text-emerald-600" : "text-red-600"}`} >{formatPrice(item.price)}</div>
            </div>
            <div className={`text-sm font-semibold ${up ? "text-emerald-600" : "text-red-600"}`} >
                {up ? "+" : ""}
                {formatChange(item.change)}%
            </div>
        </div>
    );
}