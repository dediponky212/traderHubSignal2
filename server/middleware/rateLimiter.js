// Minimal in-memory fixed-window rate limiter - no new dependency needed for
// a single Node process. The public EA endpoints (connect/heartbeat/trade/
// command/ack/signal/ack) have no auth token check *before* body parsing and
// aren't behind authMiddleware (the EA can't do a browser-style JWT login),
// so without this, one misbehaving or malicious client can hammer them at
// unlimited rate. Keyed per account/IP so one bad actor can't starve others.
//
// Caveat: this state lives in process memory, so it resets on restart and
// isn't shared across multiple server instances. That's fine for a single
// Node process; if this app ever runs behind a load balancer with several
// instances, the counters need to move to a shared store (e.g. Redis)
// instead of each instance tracking its own - same "don't worry about it
// during dev" category as the database engine itself.
function createRateLimiter({ windowMs, max, keyFn }) {
    const hits = new Map(); // key -> { count, resetAt }

    const cleanup = setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of hits) {
            if (entry.resetAt <= now) hits.delete(key);
        }
    }, windowMs);
    cleanup.unref?.();

    return (req, res, next) => {
        const key = keyFn(req) || req.ip;
        const now = Date.now();
        let entry = hits.get(key);

        if (!entry || entry.resetAt <= now) {
            entry = { count: 0, resetAt: now + windowMs };
            hits.set(key, entry);
        }

        entry.count += 1;

        if (entry.count > max) {
            return res.status(429).json({
                success: false,
                message: "Too many requests. Slow down.",
            });
        }

        next();
    };
}

// account_number-scoped limiter for endpoints that carry it in the body.
// Heartbeat is expected roughly every `Heartbeat` seconds (default 5s) per
// account, so 40/min gives generous headroom for retries without letting a
// single account flood the server.
const perAccountLimiter = (max, windowMs = 60_000) =>
    createRateLimiter({
        windowMs,
        max,
        keyFn: (req) => req.body?.account_number,
    });

// IP-scoped limiter for /connect, which happens before we know whether the
// account_number in the body is even valid.
const perIpLimiter = (max, windowMs = 60_000) =>
    createRateLimiter({
        windowMs,
        max,
        keyFn: (req) => req.ip,
    });

module.exports = { createRateLimiter, perAccountLimiter, perIpLimiter };
