const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const sharp = require("sharp");
const db = require("../config/database");
const { generateToken } = require("../utils/jwt");
const { sendWelcomeEmail, sendProfileUpdatedEmail, sendPasswordChangeCode, sendEmailVerificationCode } = require("../utils/mailer");
const User = require('../models/userModel');

const AVATAR_DIR = path.join(__dirname, "../uploads/avatars");
fs.mkdirSync(AVATAR_DIR, { recursive: true });

// Buffered in memory (not disk) because every upload gets re-encoded by
// sharp before it ever touches disk - there's no reason to write the raw
// original at all. 8MB is a generous cap on the *raw* upload; the file that
// actually lands in uploads/ is far smaller once compressed below.
const avatarUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("Only image files are allowed."));
        }
        cb(null, true);
    },
});

// multer's own errors (file too large, fileFilter rejection) surface via the
// callback, not a thrown exception - without this wrapper they'd fall
// through to Express's default handler instead of a clean JSON response.
function handleAvatarUpload(req, res, next) {
    avatarUpload.single("avatar")(req, res, (err) => {
        if (err) return res.status(400).json({ message: err.message });
        next();
    });
}

async function register(req, res) {
    const {
        fullname,
        username,
        email,
        password,
    } = req.body;

    if (!fullname || !email || !password) {
        return res.status(400).json({
            message: "Fullname, email and password are required",
        });
    }

    db.get(
        "SELECT id FROM users WHERE email = ?",
        [email],
        async (err, user) => {
            if (err) {
                return res.status(500).json(err);
            }
            if (user) {
                return res.status(409).json({
                    message: "Email already exists",
                });
            }
            const hash = await bcrypt.hash(password, 10);

            db.run(
                `INSERT INTO users
                (fullname, username, email, password)
                VALUES (?, ?, ?, ?)`,
                [
                    fullname,
                    username || null,
                    email,
                    hash,
                ],
                function (err) {

                    if (err) {
                        return res.status(500).json(err);
                    }

                    sendWelcomeEmail(email, fullname, username);
                    issueEmailVerificationCode(this.lastID, fullname, email)
                        .catch((codeErr) => console.error("Registration verification code failed:", codeErr.message));

                    res.status(201).json({
                        message: "User registered successfully",
                        id: this.lastID,
                    });

                }
            );

        }
    );

}

async function login(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password required",
        });
    }

    db.get(
        "SELECT * FROM users WHERE email = ?",
        [email],
        async (err, user) => {
            if (err) {
                return res.status(500).json(err);
            }
            if (!user) {
                return res.status(401).json({
                    message: "Invalid credentials",
                });
            }

            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return res.status(401).json({
                    message: "Invalid credentials",
                });
            }

            db.run(
                "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?",
                [user.id]
            );

            const token = generateToken(user);
            res.json({
                token,
                user: {
                    id: user.id,
                    fullname: user.fullname,
                    email: user.email,
                    role: user.role,
                },
            });

        }
    );
}

function me(req, res) {
    db.get(
        `SELECT
            id,
            fullname,
            username,
            email,
            phone,
            address,
            role,
            status,
            avatar,
            email_verified,
            last_login,
            created_at
        FROM users
        WHERE id = ?`,
        [req.user.id],
        (err, user) => {

            if (err) {
                return res.status(500).json(err);
            }

            if (!user) {
                return res.status(404).json({
                    message: "User not found",
                });
            }

            res.json(user);

        }
    );

}

function updateProfile(req, res) {
    const { fullname, username, phone, address } = req.body;

    if (!fullname || !fullname.trim()) {
        return res.status(400).json({ message: "Fullname is required." });
    }

    const finish = () => {
        db.run(
            `UPDATE users
             SET fullname = ?, username = ?, phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [fullname.trim(), username || null, phone || null, address || null, req.user.id],
            function (err) {
                if (err) return res.status(500).json({ message: err.message });

                // Best-effort security notice - doesn't block the response.
                if (req.user.email) {
                    sendProfileUpdatedEmail(req.user.email, fullname.trim(), [
                        { label: "Full Name", value: fullname.trim() },
                        { label: "Username", value: username },
                        { label: "Phone Number", value: phone },
                        { label: "Address", value: address },
                    ]).catch((emailErr) => console.error("Profile update email failed:", emailErr.message));
                }

                me(req, res);
            }
        );
    };

    if (!username) return finish();

    // Username has a UNIQUE constraint - check for a collision with another
    // account first so that case surfaces as a clean 409, not a raw SQLite
    // constraint-violation error.
    db.get(
        `SELECT id FROM users WHERE username = ? AND id != ?`,
        [username, req.user.id],
        (err, existing) => {
            if (err) return res.status(500).json({ message: err.message });
            if (existing) return res.status(409).json({ message: "Username is already taken." });
            finish();
        }
    );
}

// Resizes/re-encodes to WebP before it ever touches disk, so upload size and
// image format don't matter - a 6000x4000 15MB phone photo and a 512x512
// screenshot both land in uploads/avatars/ as the same small, consistent
// file (typically tens of KB, not MB).
async function uploadAvatar(req, res) {
    if (!req.file) {
        return res.status(400).json({ message: "No image file provided." });
    }

    let compressed;
    try {
        compressed = await sharp(req.file.buffer)
            .resize(512, 512, { fit: "cover" })
            .webp({ quality: 80 })
            .toBuffer();
    } catch (error) {
        return res.status(400).json({ message: "Could not process this image: " + error.message });
    }

    const filename = `${req.user.id}-${Date.now()}.webp`;
    const filePath = path.join(AVATAR_DIR, filename);
    const avatarUrl = `/uploads/avatars/${filename}`;

    db.get(`SELECT avatar FROM users WHERE id = ?`, [req.user.id], (err, current) => {
        if (err) return res.status(500).json({ message: err.message });

        fs.writeFile(filePath, compressed, (writeErr) => {
            if (writeErr) return res.status(500).json({ message: writeErr.message });

            db.run(
                `UPDATE users SET avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [avatarUrl, req.user.id],
                (updateErr) => {
                    if (updateErr) return res.status(500).json({ message: updateErr.message });

                    // Best-effort: remove the previous avatar file so
                    // uploads/avatars doesn't grow forever with orphans.
                    if (current?.avatar && current.avatar.startsWith("/uploads/avatars/")) {
                        fs.unlink(path.join(__dirname, "..", current.avatar), () => {});
                    }

                    me(req, res);
                }
            );
        });
    });
}

const CODE_TTL_MINUTES = 10;

// Shared by the password-change and email-verification flows below - both
// are "email a 6-digit code, confirm it before N minutes pass".
function generateSixDigitCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

function codeExpiryTimestamp() {
    return new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000)
        .toISOString().slice(0, 19).replace("T", " ");
}

// expires_at is "YYYY-MM-DD HH:MM:SS" UTC without a timezone suffix -
// new Date() would parse that as local time, so normalize to ISO-8601 UTC
// first (same fix used throughout this app's date handling).
function isCodeExpired(expiresAt) {
    const time = new Date(`${expiresAt.replace(" ", "T")}Z`).getTime();
    return !Number.isFinite(time) || Date.now() > time;
}

// Step 1: verify the current password, pre-hash the new one (so the
// plaintext never has to be stored or seen again), stash it behind a code,
// and email that code. Nothing in `users` changes yet.
async function requestPasswordChange(req, res) {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new password are required." });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters." });
    }

    db.get(`SELECT id, fullname, email, password FROM users WHERE id = ?`, [req.user.id], async (err, user) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!user) return res.status(404).json({ message: "User not found." });

        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) return res.status(401).json({ message: "Current password is incorrect." });

        const newHash = await bcrypt.hash(newPassword, 10);
        const code = generateSixDigitCode();
        const expiresAt = codeExpiryTimestamp();

        // One pending request per user at a time - a fresh request replaces
        // any earlier unconfirmed one instead of piling up.
        db.run(`DELETE FROM password_change_requests WHERE user_id = ?`, [user.id], (deleteErr) => {
            if (deleteErr) return res.status(500).json({ message: deleteErr.message });

            db.run(
                `INSERT INTO password_change_requests (user_id, new_password_hash, code, expires_at)
                 VALUES (?, ?, ?, ?)`,
                [user.id, newHash, code, expiresAt],
                (insertErr) => {
                    if (insertErr) return res.status(500).json({ message: insertErr.message });

                    sendPasswordChangeCode(user.email, user.fullname, code)
                        .catch((emailErr) => console.error("Password change code email failed:", emailErr.message));

                    res.json({ message: `A confirmation code was sent to ${user.email}.` });
                }
            );
        });
    });
}

// Step 2: the code proves the user controls the inbox on this account: copy
// the pre-hashed password over and consume the request.
function confirmPasswordChange(req, res) {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ message: "Confirmation code is required." });
    }

    db.get(
        `SELECT id, new_password_hash, expires_at
         FROM password_change_requests
         WHERE user_id = ? AND code = ?
         ORDER BY id DESC
         LIMIT 1`,
        [req.user.id, code],
        (err, request) => {
            if (err) return res.status(500).json({ message: err.message });
            if (!request) return res.status(400).json({ message: "Invalid confirmation code." });

            if (isCodeExpired(request.expires_at)) {
                db.run(`DELETE FROM password_change_requests WHERE id = ?`, [request.id]);
                return res.status(400).json({ message: "This code has expired. Please request a new one." });
            }

            db.run(
                `UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [request.new_password_hash, req.user.id],
                (updateErr) => {
                    if (updateErr) return res.status(500).json({ message: updateErr.message });

                    db.run(`DELETE FROM password_change_requests WHERE id = ?`, [request.id]);
                    res.json({ message: "Password updated successfully." });
                }
            );
        }
    );
}

// Sent right after registration and available again any time from the
// Profile page ("Verify Email" / "Resend code") while email_verified is 0.
// If a future Google-login flow lands, that path should just set
// email_verified=1 directly at account creation instead of going through
// this - Google has already confirmed the address.
//
// Also used straight from registration (see register() above), which is why
// this takes plain (userId, fullname, email) instead of (req, res) - there's
// no authenticated request yet at that point.
function issueEmailVerificationCode(userId, fullname, email) {
    return new Promise((resolve, reject) => {
        const code = generateSixDigitCode();
        const expiresAt = codeExpiryTimestamp();

        // One pending code per user - a fresh request replaces any earlier
        // unconfirmed one instead of piling up.
        db.run(`DELETE FROM email_verifications WHERE user_id = ?`, [userId], (deleteErr) => {
            if (deleteErr) return reject(deleteErr);

            db.run(
                `INSERT INTO email_verifications (user_id, code, expires_at) VALUES (?, ?, ?)`,
                [userId, code, expiresAt],
                (insertErr) => {
                    if (insertErr) return reject(insertErr);

                    sendEmailVerificationCode(email, fullname, code)
                        .catch((emailErr) => console.error("Email verification code failed:", emailErr.message));

                    resolve();
                }
            );
        });
    });
}

function requestEmailVerification(req, res) {
    db.get(`SELECT id, fullname, email, email_verified FROM users WHERE id = ?`, [req.user.id], async (err, user) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!user) return res.status(404).json({ message: "User not found." });
        if (user.email_verified) return res.status(400).json({ message: "This email is already verified." });

        try {
            await issueEmailVerificationCode(user.id, user.fullname, user.email);
            res.json({ message: `A verification code was sent to ${user.email}.` });
        } catch (codeErr) {
            res.status(500).json({ message: codeErr.message });
        }
    });
}

function confirmEmailVerification(req, res) {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ message: "Confirmation code is required." });
    }

    db.get(
        `SELECT id, expires_at
         FROM email_verifications
         WHERE user_id = ? AND code = ?
         ORDER BY id DESC
         LIMIT 1`,
        [req.user.id, code],
        (err, request) => {
            if (err) return res.status(500).json({ message: err.message });
            if (!request) return res.status(400).json({ message: "Invalid confirmation code." });

            if (isCodeExpired(request.expires_at)) {
                db.run(`DELETE FROM email_verifications WHERE id = ?`, [request.id]);
                return res.status(400).json({ message: "This code has expired. Please request a new one." });
            }

            db.run(
                `UPDATE users SET email_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [req.user.id],
                (updateErr) => {
                    if (updateErr) return res.status(500).json({ message: updateErr.message });

                    db.run(`DELETE FROM email_verifications WHERE id = ?`, [request.id]);
                    me(req, res);
                }
            );
        }
    );
}

module.exports = {
    register,
    login,
    me,
    updateProfile,
    handleAvatarUpload,
    uploadAvatar,
    requestPasswordChange,
    confirmPasswordChange,
    requestEmailVerification,
    confirmEmailVerification,
};

//Gemini
