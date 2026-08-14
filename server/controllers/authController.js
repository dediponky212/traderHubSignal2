const bcrypt = require("bcrypt");
const db = require("../config/database");
const { generateToken } = require("../utils/jwt");
const { sendWelcomeEmail } = require("../utils/mailer");
const User = require('../models/userModel');

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

module.exports = {
    register,
    login,
    me,
};

//Gemini
