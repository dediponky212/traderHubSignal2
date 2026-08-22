// Data layer for AI Robots (docs/dataSkill/00-form-schema.md). Pure CRUD over
// `robots` + `robot_indicators` - no LLM/pipeline logic lives here (that
// belongs to a future robotPipelineService once the LLM provider is wired
// up). Billing fields (billing_mode, tokens_per_signal, ...) are accepted as
// optional/nullable for now since the actual cost-calculation step depends
// on that still-undecided LLM provider - see docs/dataSkill/06-billing-tokens.md.
const db = require("../config/database");

function runAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) return reject(err);
            resolve(this);
        });
    });
}

function allAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows || []);
        });
    });
}

function getAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) return reject(err);
            resolve(row || null);
        });
    });
}

const JADWAL_MODES = ["auto", "manual"];
const SESI_MARKET_VALUES = ["asia", "london", "usa"];
const KONDISI_MARKET_VALUES = ["all", "trend"];
const PROMPT_MODES = ["auto", "manual"];
const BILLING_MODES = ["per_signal", "monthly"];

function badRequest(message) {
    const err = new Error(message);
    err.status = 400;
    return err;
}

function notFound(message = "Robot not found.") {
    const err = new Error(message);
    err.status = 404;
    return err;
}

// Validates + normalizes the raw request body against the schema in
// docs/dataSkill/00-form-schema.md. Throws (status 400) on anything invalid.
// `partial` relaxes "required" checks for PATCH (only validates fields that
// are actually present).
function validateRobotInput(body, { partial = false } = {}) {
    const out = {};
    const has = (key) => Object.prototype.hasOwnProperty.call(body, key);
    const require_ = (key) => !partial || has(key);

    if (require_("nama_robot")) {
        if (typeof body.nama_robot !== "string" || !body.nama_robot.trim()) {
            throw badRequest("nama_robot is required.");
        }
        out.nama_robot = body.nama_robot.trim();
    }

    if (require_("symbol")) {
        if (typeof body.symbol !== "string" || !body.symbol.trim()) {
            throw badRequest("symbol is required and must be a single symbol.");
        }
        out.symbol = body.symbol.trim().toUpperCase();
    }

    if (require_("timeFrame")) {
        if (typeof body.timeFrame !== "string" || !body.timeFrame.trim()) {
            throw badRequest("timeFrame is required.");
        }
        out.time_frame = body.timeFrame.trim();
    }

    if (require_("news")) {
        out.news = body.news ? 1 : 0;
    }

    if (require_("jadwal_analisa")) {
        const jadwal = body.jadwal_analisa || {};
        if (!JADWAL_MODES.includes(jadwal.mode)) {
            throw badRequest(`jadwal_analisa.mode must be one of: ${JADWAL_MODES.join(", ")}.`);
        }
        out.jadwal_mode = jadwal.mode;

        if (jadwal.mode === "auto") {
            const interval = Number(jadwal.interval_menit);
            if (!Number.isFinite(interval) || interval < 15) {
                throw badRequest("jadwal_analisa.interval_menit is required and must be >= 15 when mode is 'auto'.");
            }
            out.interval_menit = interval;

            const sesi = Array.isArray(jadwal.sesi_market) ? jadwal.sesi_market : [];
            if (!sesi.every((s) => SESI_MARKET_VALUES.includes(s))) {
                throw badRequest(`jadwal_analisa.sesi_market values must be from: ${SESI_MARKET_VALUES.join(", ")}.`);
            }
            out.sesi_market = JSON.stringify(sesi);

            const before = Number(jadwal.buffer_sebelum_menit ?? 0);
            const after = Number(jadwal.buffer_sesudah_menit ?? 0);
            if (!Number.isFinite(before) || before < 0 || !Number.isFinite(after) || after < 0) {
                throw badRequest("jadwal_analisa.buffer_sebelum_menit/buffer_sesudah_menit must be >= 0.");
            }
            out.buffer_sebelum_menit = before;
            out.buffer_sesudah_menit = after;

            if (!KONDISI_MARKET_VALUES.includes(jadwal.kondisi_market)) {
                throw badRequest(`jadwal_analisa.kondisi_market must be one of: ${KONDISI_MARKET_VALUES.join(", ")}.`);
            }
            out.kondisi_market = jadwal.kondisi_market;
        } else {
            // manual mode - scheduling fields don't apply, store as null/defaults
            out.interval_menit = null;
            out.sesi_market = null;
            out.buffer_sebelum_menit = 0;
            out.buffer_sesudah_menit = 0;
            out.kondisi_market = "all";
        }
    }

    if (require_("indikator")) {
        if (!Array.isArray(body.indikator)) {
            throw badRequest("indikator must be an array.");
        }
        body.indikator.forEach((ind, i) => {
            if (!ind || typeof ind.name !== "string" || !ind.name.trim()) {
                throw badRequest(`indikator[${i}].name is required.`);
            }
            if (ind.params !== undefined && (typeof ind.params !== "object" || ind.params === null || Array.isArray(ind.params))) {
                throw badRequest(`indikator[${i}].params must be an object.`);
            }
        });
        out.indikator = body.indikator.map((ind) => ({
            name: ind.name.trim(),
            params: ind.params || {},
        }));
    }

    ["max_risk_per_day_percent", "max_risk_per_month_percent", "min_risk_reward"].forEach((key) => {
        if (require_(key)) {
            const val = Number(body[key]);
            if (!Number.isFinite(val) || val <= 0) {
                throw badRequest(`${key} is required and must be a positive number.`);
            }
            out[key] = val;
        }
    });

    if (require_("max_open_posisi")) {
        const val = Number(body.max_open_posisi);
        if (!Number.isInteger(val) || val <= 0) {
            throw badRequest("max_open_posisi is required and must be a positive integer.");
        }
        out.max_open_posisi = val;
    }

    if (require_("prompt_mode")) {
        if (!PROMPT_MODES.includes(body.prompt_mode)) {
            throw badRequest(`prompt_mode must be one of: ${PROMPT_MODES.join(", ")}.`);
        }
        out.prompt_mode = body.prompt_mode;
        if (body.prompt_mode === "manual") {
            if (typeof body.user_strategy_notes !== "string" || !body.user_strategy_notes.trim()) {
                throw badRequest("user_strategy_notes is required (textarea) when prompt_mode is 'manual'.");
            }
            out.user_strategy_notes = body.user_strategy_notes.trim();
        } else {
            out.user_strategy_notes = null;
        }
    }

    // Billing (docs/dataSkill/06-billing-tokens.md). All optional at this
    // layer - the wizard sends these once it has computed them at the
    // confirmation step; a robot can also be created/updated without them
    // and have billing set later. Real cost calculation (tokens_per_signal,
    // monthly_price_idr) is not implemented yet pending the LLM provider
    // decision, so the numbers passed in here are trusted as-is for now -
    // only shape/enum is validated, not that they were derived correctly.
    if (has("is_free_trial") && body.is_free_trial) {
        out.is_free_trial = 1;
        out.billing_mode = null;
        out.tokens_per_signal = null;
        out.max_signal_per_day = null;
        out.monthly_price_idr = null;
        out.max_signal_per_month = null;
    } else if (has("billing_mode") && body.billing_mode != null) {
        if (!BILLING_MODES.includes(body.billing_mode)) {
            throw badRequest(`billing_mode must be one of: ${BILLING_MODES.join(", ")}.`);
        }
        out.billing_mode = body.billing_mode;
        out.is_free_trial = 0;

        if (has("tokens_per_signal")) {
            const tokens = Number(body.tokens_per_signal);
            if (!Number.isInteger(tokens) || tokens <= 0) {
                throw badRequest("tokens_per_signal must be a positive integer.");
            }
            out.tokens_per_signal = tokens;
        }

        if (body.billing_mode === "per_signal") {
            const maxPerDay = Number(body.max_signal_per_day);
            if (!Number.isInteger(maxPerDay) || maxPerDay <= 0) {
                throw badRequest("max_signal_per_day is required and must be a positive integer for billing_mode 'per_signal'.");
            }
            out.max_signal_per_day = maxPerDay;
            out.monthly_price_idr = null;
            out.max_signal_per_month = null;
        } else {
            const price = Number(body.monthly_price_idr);
            const maxPerMonth = Number(body.max_signal_per_month);
            if (!Number.isFinite(price) || price <= 0) {
                throw badRequest("monthly_price_idr is required and must be positive for billing_mode 'monthly'.");
            }
            if (!Number.isInteger(maxPerMonth) || maxPerMonth <= 0) {
                throw badRequest("max_signal_per_month is required and must be a positive integer for billing_mode 'monthly'.");
            }
            out.monthly_price_idr = price;
            out.max_signal_per_month = maxPerMonth;
            out.max_signal_per_day = null;
        }
    }

    return out;
}

async function replaceIndicators(robotId, indikator) {
    await runAsync(`DELETE FROM robot_indicators WHERE robot_id = ?`, [robotId]);
    for (const ind of indikator) {
        await runAsync(
            `INSERT INTO robot_indicators (robot_id, indicator_name, params) VALUES (?, ?, ?)`,
            [robotId, ind.name, JSON.stringify(ind.params)]
        );
    }
}

async function attachIndicators(robots) {
    if (robots.length === 0) return robots;
    const ids = robots.map((r) => r.id);
    const placeholders = ids.map(() => "?").join(",");
    const rows = await allAsync(
        `SELECT robot_id, indicator_name, params FROM robot_indicators WHERE robot_id IN (${placeholders})`,
        ids
    );
    const byRobot = new Map();
    rows.forEach((row) => {
        const list = byRobot.get(row.robot_id) || [];
        list.push({ name: row.indicator_name, params: JSON.parse(row.params) });
        byRobot.set(row.robot_id, list);
    });
    return robots.map((r) => ({ ...r, indikator: byRobot.get(r.id) || [] }));
}

async function createRobot(userId, body) {
    const data = validateRobotInput(body, { partial: false });

    // Free trial (06-billing-tokens.md): only for a user who has never
    // created a robot before, ever - checked server-side against the real
    // count, never trusted from the client. Trial dates come from SQLite's
    // own datetime() rather than JS Date math, matching this codebase's
    // established UTC-timestamp convention.
    let trialDatesSql = "NULL, NULL";
    if (data.is_free_trial) {
        const { count } = await getAsync(
            `SELECT COUNT(*) AS count FROM robots WHERE owner_user_id = ?`,
            [userId]
        );
        if (count > 0) {
            throw badRequest("Free trial is only available for users who have never created a robot before.");
        }
        trialDatesSql = "datetime('now'), datetime('now', '+7 days')";
    }

    const result = await runAsync(
        `INSERT INTO robots (
            owner_user_id, nama_robot, symbol, time_frame, news,
            jadwal_mode, interval_menit, sesi_market, buffer_sebelum_menit, buffer_sesudah_menit, kondisi_market,
            max_risk_per_day_percent, max_risk_per_month_percent, max_open_posisi, min_risk_reward,
            prompt_mode, user_strategy_notes,
            billing_mode, tokens_per_signal, max_signal_per_day, monthly_price_idr, max_signal_per_month,
            is_free_trial, trial_started_at, trial_ends_at,
            status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${trialDatesSql}, 'active')`,
        [
            userId, data.nama_robot, data.symbol, data.time_frame, data.news,
            data.jadwal_mode, data.interval_menit, data.sesi_market, data.buffer_sebelum_menit, data.buffer_sesudah_menit, data.kondisi_market,
            data.max_risk_per_day_percent, data.max_risk_per_month_percent, data.max_open_posisi, data.min_risk_reward,
            data.prompt_mode, data.user_strategy_notes,
            data.billing_mode ?? null, data.tokens_per_signal ?? null, data.max_signal_per_day ?? null,
            data.monthly_price_idr ?? null, data.max_signal_per_month ?? null,
            data.is_free_trial ?? 0,
        ]
    );

    await replaceIndicators(result.lastID, data.indikator);
    return getRobot(userId, result.lastID);
}

async function listRobots(userId) {
    const rows = await allAsync(
        `SELECT * FROM robots WHERE owner_user_id = ? ORDER BY created_at DESC`,
        [userId]
    );
    return attachIndicators(rows);
}

async function getRobot(userId, robotId) {
    const row = await getAsync(
        `SELECT * FROM robots WHERE id = ? AND owner_user_id = ?`,
        [robotId, userId]
    );
    if (!row) throw notFound();
    const [withIndicators] = await attachIndicators([row]);
    return withIndicators;
}

async function updateRobot(userId, robotId, body) {
    const existing = await getAsync(
        `SELECT id FROM robots WHERE id = ? AND owner_user_id = ?`,
        [robotId, userId]
    );
    if (!existing) throw notFound();

    const data = validateRobotInput(body, { partial: true });
    const { indikator, ...columns } = data;

    const keys = Object.keys(columns);
    if (keys.length > 0) {
        const setClause = keys.map((k) => `${k} = ?`).join(", ");
        await runAsync(
            `UPDATE robots SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [...keys.map((k) => columns[k]), robotId]
        );
    }

    if (indikator) {
        await replaceIndicators(robotId, indikator);
    }

    return getRobot(userId, robotId);
}

// Deleting a robot is restricted to admin accounts (currently just the
// platform's own master admin) - everyone else can edit their robot's
// settings via updateRobot but can never delete it outright. `role` comes
// from the caller's JWT (req.user.role), never trusted from the request body.
function forbidden(message) {
    const err = new Error(message);
    err.status = 403;
    return err;
}

async function deleteRobot(userId, robotId, role) {
    if (role !== "admin") {
        throw forbidden("Only an admin account can delete a robot. Other accounts can edit robot settings instead.");
    }

    const existing = await getAsync(
        `SELECT id FROM robots WHERE id = ? AND owner_user_id = ?`,
        [robotId, userId]
    );
    if (!existing) throw notFound();

    await runAsync(`DELETE FROM robot_indicators WHERE robot_id = ?`, [robotId]);
    await runAsync(`DELETE FROM robots WHERE id = ?`, [robotId]);
}

module.exports = {
    createRobot,
    listRobots,
    getRobot,
    updateRobot,
    deleteRobot,
    validateRobotInput,
};
