import { useEffect, useState } from "react";
import "../../styles/marketTicker.css";
import MarketTickerItem from "./MarketTickerItem";

export default function MarketTicker() {
    const [items, setItems] = useState([]);

    useEffect(() => {
        const loadTicker = async () => {
            try {
                const response = await fetch("http://localhost:3000/api/market/ticker");
                const result = await response.json();

                if (result?.success && Array.isArray(result.data)) {
                    setItems([...result.data, ...result.data]);
                }
            } catch (error) {
                console.error("Failed to load market ticker:", error);
            }
        };

        loadTicker();
        const timer = setInterval(loadTicker, 30000);

        return () => clearInterval(timer);
    }, []);

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