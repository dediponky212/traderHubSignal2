import "../../styles/marketTicker.css";

import { marketTicker } from "../../data/marketTicker";
import MarketTickerItem from "./MarketTickerItem";

export default function MarketTicker() {
    const items = [...marketTicker, ...marketTicker];
    return (
        <section className="market-ticker mb-3">
            <div className="market-track">
                {items.map((item, index) => (
                    <MarketTickerItem
                        key={`${item.symbol}-${index}`}
                        item={item}
                    />
                ))}
            </div>
        </section>
    );
}