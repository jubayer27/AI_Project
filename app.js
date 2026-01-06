// app.js
import express from "express";
import path from "path";
import { spawn } from "child_process";
import multer from "multer";
import cors from "cors";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.resolve();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Set up Multer for file uploads
const upload = multer({ dest: "uploads/" });

// Helper to reliably parse Python output
function parsePythonOutput(output) {
    try {
        // 1. Try parsing directly
        return JSON.parse(output);
    } catch (e) {
        // 2. If that fails, try to find the JSON object inside the string
        // (This fixes cases where PyMuPDF prints warnings like "mupdf: warning...")
        const jsonStart = output.indexOf('{');
        const jsonEnd = output.lastIndexOf('}');

        if (jsonStart !== -1 && jsonEnd !== -1) {
            const jsonString = output.substring(jsonStart, jsonEnd + 1);
            try {
                return JSON.parse(jsonString);
            } catch (innerErr) {
                throw new Error("Found JSON brackets but content was invalid.");
            }
        }
        throw new Error("No JSON object found in Python output.");
    }
}

// ---------- ROUTES ----------

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Summarize Text
app.post("/summarize", (req, res) => {
    const { text, max_length = 150, min_length = 50 } = req.body;
    if (!text || text.trim().length === 0) return res.status(400).json({ error: "No text provided." });

    // USE VENV PYTHON
    const python = spawn(path.join(__dirname, "venv/bin/python"), [path.join(__dirname, "summarize_model.py")]);
    let output = "";
    let errorOutput = "";

    python.stdin.write(JSON.stringify({ text, max_length: parseInt(max_length), min_length: parseInt(min_length) }));
    python.stdin.end();

    python.stdout.on("data", (data) => { output += data.toString(); });
    python.stderr.on("data", (data) => { errorOutput += data.toString(); });

    python.on("close", (code) => {
        if (code !== 0) {
            console.error("Python Crash:", errorOutput);
            return res.status(500).json({ error: "Model crashed. Check terminal logs." });
        }
        try {
            const result = parsePythonOutput(output);
            if (result.error) return res.status(500).json({ error: result.error });
            res.json({ summary: result.summary });
        } catch (err) {
            console.error("Parse Error:", err.message);
            console.error("Raw Output was:", output);
            console.error("Raw Error was:", errorOutput);
            res.status(500).json({ error: "Failed to read model response. Is the PDF scanned?" });
        }
    });
});

// Summarize File
app.post("/summarize-file", upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });

    const { max_length = 150, min_length = 50 } = req.body;
    const filePath = path.join(__dirname, req.file.path);

    // USE VENV PYTHON
    const python = spawn(path.join(__dirname, "venv/bin/python"), [path.join(__dirname, "summarize_model.py")]);
    let output = "";
    let errorOutput = "";

    python.stdin.write(JSON.stringify({ file_path: filePath, max_length: parseInt(max_length), min_length: parseInt(min_length) }));
    python.stdin.end();

    python.stdout.on("data", (data) => { output += data.toString(); });
    python.stderr.on("data", (data) => { errorOutput += data.toString(); });

    python.on("close", (code) => {
        fs.unlinkSync(filePath); // Cleanup

        // Check for Python crash
        if (code !== 0) {
            console.error("❌ Python Crash Log:", errorOutput);
            return res.status(500).json({ error: "Processing failed. Check server terminal for details." });
        }

        try {
            const result = parsePythonOutput(output);
            if (result.error) return res.status(500).json({ error: result.error });
            res.json({ summary: result.summary });
        } catch (err) {
            console.error("❌ Parse Error:", err.message);
            console.error("🔹 Raw Output:", output);
            console.error("🔹 Python Errors:", errorOutput);
            res.status(500).json({ error: "Could not summarize this PDF. It might be scanned (images only) or encrypted." });
        }
    });
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});