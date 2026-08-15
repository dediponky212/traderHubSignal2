const https = require("https");

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0",
            },
            timeout: 15000,
        }, (res) => {
            let raw = "";

            res.on("data", (chunk) => {
                raw += chunk;
            });

            res.on("end", () => {
                if (res.statusCode >= 400) {
                    reject(new Error(`Request failed with status ${res.statusCode}`));
                    return;
                }

                try {
                    resolve(JSON.parse(raw));
                } catch (error) {
                    reject(new Error(`Invalid JSON response: ${error.message}`));
                }
            });
        });

        req.on("timeout", () => {
            req.destroy(new Error("Request timeout"));
        });

        req.on("error", reject);
    });
}

function getYahooChart(symbol) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1m`;
    return fetchJson(url).then((payload) => {
        const result = payload?.chart?.result?.[0];
        const meta = result?.meta || {};
        const prices = result?.indicators?.quote?.[0]?.close || [];
        const latest = prices.filter((value) => Number.isFinite(value)).at(-1) ?? meta.regularMarketPrice ?? null;
        const previousClose = meta.chartPreviousClose ?? null;

        return {
            price: latest,
            change: previousClose && Number(previousClose) !== 0 && latest !== null
                ? ((Number(latest) - Number(previousClose)) / Number(previousClose)) * 100
                : 0,
        };
    });
}

function formatPrice(value, digits = 2) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return "—";
    }
    return Number(value).toFixed(digits);
}

async function getMarketTicker(req, res) {
    try {
        const [fxResult, btcResult, goldResult, nasdaqResult] = await Promise.allSettled([
            fetchJson("https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,JPY"),
            getYahooChart("BTC-USD"),
            getYahooChart("GC=F"),
            getYahooChart("^IXIC"),
        ]);

        const fxRates = fxResult.status === "fulfilled" ? fxResult.value?.rates || {} : {};
        const btc = btcResult.status === "fulfilled" ? btcResult.value : { price: null, change: 0 };
        const gold = goldResult.status === "fulfilled" ? goldResult.value : { price: null, change: 0 };
        const nasdaq = nasdaqResult.status === "fulfilled" ? nasdaqResult.value : { price: null, change: 0 };

        const eurUsd = fxRates.EUR ?? null;
        const gbpUsd = fxRates.GBP ?? null;
        const usdJpy = fxRates.JPY ?? null;

        const items = [
            {
                symbol: "BTCUSD",
                name: "Bitcoin",
                price: formatPrice(btc.price, 2),
                change: Number(btc.change || 0),
            },
            {
                symbol: "XAUUSD",
                name: "Gold",
                price: formatPrice(gold.price, 2),
                change: Number(gold.change || 0),
            },
            {
                symbol: "NAS100",
                name: "Nasdaq",
                price: formatPrice(nasdaq.price, 2),
                change: Number(nasdaq.change || 0),
            },
            {
                symbol: "EURUSD",
                name: "Euro",
                price: eurUsd ? formatPrice(eurUsd, 5) : "—",
                change: 0,
            },
            {
                symbol: "GBPUSD",
                name: "Pound",
                price: gbpUsd ? formatPrice(gbpUsd, 5) : "—",
                change: 0,
            },
            {
                symbol: "USDJPY",
                name: "Yen",
                price: usdJpy ? formatPrice(usdJpy, 2) : "—",
                change: 0,
            },
        ];

        res.json({ success: true, data: items });
    } catch (error) {
        console.error("Market ticker fetch error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to load market ticker data.",
            data: [],
        });
    }
}

module.exports = {
    getMarketTicker,
};
