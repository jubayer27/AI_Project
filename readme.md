# 📝 AI Text Summarizer

A powerful web application that uses advanced Machine Learning (T5 Transformer) to generate concise summaries from long articles, text, PDFs, and Word documents. Built with a Node.js backend and a Python AI engine.

![Project Preview](https://via.placeholder.com/800x400?text=AI+Text+Summarizer+Preview)

## 🚀 Features

-   **📄 Smart Text Summarization:** Paste any long article or essay to get a quick summary.
-   **📁 Document Support:** Upload **PDF** (`.pdf`) and **Word** (`.docx`) files directly.
-   **🎚️ Custom Summary Length:** Use the adjustable slider to control summary depth (Short vs. Detailed).
-   **⚡ Efficient AI Model:** Utilizes the Hugging Face `t5-small` model for fast, accurate generation.
-   **🎨 Modern UI:** Clean, responsive interface designed with Tailwind CSS.

---

## 🛠️ Tech Stack

**Frontend:**
-   HTML5, JavaScript (Vanilla)
-   Tailwind CSS (via CDN)

**Backend:**
-   Node.js & Express.js
-   Multer (File Handling)

**AI & Machine Learning:**
-   Python 3
-   Hugging Face Transformers (T5 Model)
-   PyTorch
-   PyMuPDF (PDF Extraction)
-   python-docx (Word Extraction)

---

## ⚙️ Installation & Setup

Follow these steps to run the project locally.

Install Node.js Dependencies - npm install
Set Up Python Environment
This project requires specific AI libraries. It is best to run them in a virtual environment.
Mac/Linux:
  # Create virtual environment
python3 -m venv venv

# Install required Python libraries
./venv/bin/pip install transformers torch sentencepiece pymupdf python-docx protobuf


windows:
# Create virtual environment
python -m venv venv

# Install required Python libraries
.\venv\Scripts\pip install transformers torch sentencepiece pymupdf python-docx protobuf

create upload folders: node app.js

▶️ How to Run
Start the Server:

Bash

node app.js
Open in Browser: Go to http://localhost:3000

Use the App:

Paste text OR upload a file.

Adjust the length slider.

Click Summarize.


👨‍💻 About the Developer
Md Jubayer Islam Bachelor's Student | Universiti Teknologi Malaysia (UTM) From Bangladesh

I am a passionate software engineering student specializing in full-stack development and AI integration. This project demonstrates my ability to bridge web technologies (Node.js) with powerful machine learning models (Python).

### 1. Clone the Repository
