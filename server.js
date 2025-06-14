// server.js
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const multer = require("multer");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// CORS setup – change this to your Netlify frontend URL
app.use(cors({
  origin: "https://capitalcompassioncare.netlify.app", // ✅ replace with your real frontend URL
}));

app.use(express.json());

// Multer config for resume upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});
const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Only .pdf, .doc, or .docx files are allowed"));
  }
};
const upload = multer({ storage, fileFilter });

// ---------- CONTACT FORM ----------
app.post("/api/contact", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: email,
    to: process.env.EMAIL_USER,
    subject: "New Contact Form Submission",
    html: `<p><strong>Name:</strong> ${name}</p>
           <p><strong>Email:</strong> ${email}</p>
           <p><strong>Message:</strong> ${message}</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ message: "Message sent successfully" });
  } catch (err) {
    console.error("Contact form error:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// ---------- CAREERS FORM ----------
app.post("/api/careers", upload.single("resume"), async (req, res) => {
  const { fullName, email, message } = req.body;
  const resume = req.file;

  if (!fullName || !email || !resume) {
    return res.status(400).json({ error: "Full name, email, and resume are required" });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: email,
    to: process.env.EMAIL_USER,
    subject: "New Career Application",
    html: `<p><strong>Name:</strong> ${fullName}</p>
           <p><strong>Email:</strong> ${email}</p>
           <p><strong>Message:</strong> ${message || "N/A"}</p>`,
    attachments: [
      {
        filename: resume.originalname,
        path: resume.path,
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ message: "Application submitted successfully" });
  } catch (err) {
    console.error("Career form error:", err);
    res.status(500).json({ error: "Failed to send application" });
  }
});

// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
