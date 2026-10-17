
const express = require("express");
const cors = require("cors");
const path = require("path");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

/* =========================
   MIDDLEWARE
========================= */

app.use(cors());
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({
    extended: true,
    limit: "20kb"
}));

/* =========================
   FRONTEND
========================= */

const frontendPath = path.join(
    __dirname,
    "..",
    "frontend"
);

app.use(express.static(frontendPath));

app.get("/", (req, res) => {
    res.sendFile(
        path.join(frontendPath, "index.html")
    );
});

/* =========================
   EMAIL CONFIGURATION
========================= */

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
});

/* =========================
   TEST EMAIL CONNECTION
========================= */

transporter.verify()
    .then(() => {
        console.log("Gmail SMTP connected successfully");
    })
    .catch((error) => {
        console.error(
            "Email connection failed:",
            error.message
        );
    });

/* =========================
   TEST API
========================= */

app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "Pratik Portfolio backend is working!"
    });
});

/* =========================
   CONTACT API
========================= */

app.post("/api/contact", async (req, res) => {
    try {
        const {
            name,
            email,
            subject,
            message
        } = req.body || {};

        // Validate required fields
        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof subject !== "string" ||
            typeof message !== "string" ||
            !name.trim() ||
            !email.trim() ||
            !subject.trim() ||
            !message.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        // Basic email validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email.trim())) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }

        // Limit input sizes
        if (
            name.length > 100 ||
            email.length > 254 ||
            subject.length > 200 ||
            message.length > 5000
        ) {
            return res.status(400).json({
                success: false,
                message: "One or more fields are too long."
            });
        }

        // Ensure email environment variables exist
        if (
            !process.env.EMAIL_USER ||
            !process.env.EMAIL_PASS
        ) {
            console.error("Email environment variables are missing.");

            return res.status(500).json({
                success: false,
                message: "Email service is not configured."
            });
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            replyTo: email.trim(),
            subject: `Portfolio Contact: ${subject.trim()}`,
            text: `New message from your portfolio

Name: ${name.trim()}
Email: ${email.trim()}
Subject: ${subject.trim()}

Message:
${message.trim()}`
        };

        // Attempt to send the email
        await transporter.sendMail(mailOptions);

        console.log("Contact email sent successfully.");

        return res.status(200).json({
            success: true,
            message: "Message sent successfully!"
        });

    } catch (error) {
        console.error(
            "Contact email error:",
            error.code || "",
            error.message
        );

        if (!res.headersSent) {
            return res.status(502).json({
                success: false,
                message: "Email could not be sent. Please try again later."
            });
        }
    }
});

/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {
    console.log("====================================");
    console.log("      PRATIK PORTFOLIO SERVER");
    console.log("====================================");
    console.log(`Website: http://localhost:${PORT}`);
    console.log(`Contact: http://localhost:${PORT}/contact.html`);
    console.log(`API: http://localhost:${PORT}/api/test`);
    console.log("====================================");
});
