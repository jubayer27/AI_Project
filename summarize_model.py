# summarize_model.py
import os
import sys
import json
import logging

# 1. SILENCE WARNINGS
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0" 
logging.getLogger("transformers").setLevel(logging.ERROR)

try:
    from transformers import T5ForConditionalGeneration, T5Tokenizer
    from docx import Document
    import fitz  # PyMuPDF
except ImportError as e:
    print(json.dumps({"error": f"Missing library: {str(e)}"}))
    sys.exit(1)

def read_stdin():
    data = sys.stdin.read()
    if not data: return {}
    try: return json.loads(data)
    except: return {}

def extract_text_from_pdf(path):
    try:
        doc = fitz.open(path)
        text = ""
        for page in doc: text += page.get_text()
        return text
    except Exception as e: raise ValueError(f"PDF Error: {str(e)}")

def extract_text_from_docx(path):
    try:
        doc = Document(path)
        return "\n".join([p.text for p in doc.paragraphs])
    except Exception as e: raise ValueError(f"DOCX Error: {str(e)}")

def summarize_text(text, max_len=150, min_len=50):
    model_name = "t5-small"
    tokenizer = T5Tokenizer.from_pretrained(model_name, legacy=False)
    model = T5ForConditionalGeneration.from_pretrained(model_name)

    input_text = "summarize: " + text.strip()
    tokens = tokenizer(input_text, return_tensors="pt", truncation=True, padding="longest")

    summary_ids = model.generate(
        **tokens,
        max_length=max_len,
        min_length=min_len,
        num_beams=4,
        early_stopping=True,
        repetition_penalty=2.0,
        length_penalty=1.0
    )
    return tokenizer.decode(summary_ids[0], skip_special_tokens=True)

if __name__ == "__main__":
    try:
        data = read_stdin()
        text = ""
        max_len = int(data.get("max_length", 150))
        min_len = int(data.get("min_length", 50))

        if "text" in data:
            text = data["text"]
        elif "file_path" in data:
            file_path = data["file_path"]
            
            # ✅ CORRECT FILE DETECTION
            # Use original_name if provided, otherwise fallback to path
            original_name = data.get("original_name", "")
            check_name = original_name if original_name else file_path
            ext = os.path.splitext(check_name)[1].lower()
            
            if ext == ".pdf":
                text = extract_text_from_pdf(file_path)
            elif ext == ".docx":
                text = extract_text_from_docx(file_path)
            else:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    text = f.read()

        if not text or not text.strip():
            raise ValueError("No text could be extracted.")

        summary = summarize_text(text, max_len, min_len)
        print(json.dumps({"summary": summary}))

    except Exception as e:
        print(json.dumps({"error": str(e)}))