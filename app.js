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
        return JSON.parse(output);
    } catch (e) {
        // Fallback: Find JSON if there is noise
        const jsonStart = output.indexOf('{');
        const jsonEnd = output.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
            try {
                return JSON.parse(output.substring(jsonStart, jsonEnd + 1));
            } catch (innerErr) { }
        }
        throw new Error("Invalid response from AI model.");
    }
}

// Wrapper to run Python Script
const runPythonSummarizer = (payload, res, cleanupFile = null) => {
    // Point to the Python inside the venv
    const pythonPath = path.join(__dirname, "venv/bin/python");
    const scriptPath = path.join(__dirname, "summarize_model.py");

    const python = spawn(pythonPath, [scriptPath]);

    let output = "";
    let errorOutput = "";

    python.stdin.write(JSON.stringify(payload));
    python.stdin.end();

    python.stdout.on("data", (data) => { output += data.toString(); });
    python.stderr.on("data", (data) => { errorOutput += data.toString(); });

    python.on("close", (code) => {
        // Cleanup uploaded file if it exists
        if (cleanupFile) {
            try { fs.unlinkSync(cleanupFile); } catch (e) { console.error("Cleanup error:", e); }
        }

        if (code !== 0) {
            console.error("❌ Python Crash:", errorOutput);
            return res.status(500).json({ error: "Model process failed. Check server logs." });
        }

        try {
            const result = parsePythonOutput(output);
            if (result.error) return res.status(500).json({ error: result.error });
            res.json({ summary: result.summary });
        } catch (err) {
            console.error("❌ Parse Error:", err.message);
            console.error("🔹 Raw Output:", output);
            res.status(500).json({ error: "Failed to parse AI response. (Is the PDF readable?)" });
        }
    });
};

// ---------- ROUTES ----------

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Summarize Text
app.post("/summarize", (req, res) => {
    const { text, max_length = 150, min_length = 50 } = req.body;
    if (!text || text.trim().length === 0) return res.status(400).json({ error: "No text provided." });

    runPythonSummarizer({
        text,
        max_length: parseInt(max_length),
        min_length: parseInt(min_length)
    }, res);
});

// Summarize File
app.post("/summarize-file", upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });

    const filePath = path.join(__dirname, req.file.path);
    const { max_length = 150, min_length = 50 } = req.body;

    runPythonSummarizer({
        file_path: filePath,
        original_name: req.file.originalname, // <--- ✅ ADDED: Sends original name (e.g., "doc.pdf")
        max_length: parseInt(max_length),
        min_length: parseInt(min_length)
    }, res, filePath);
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});