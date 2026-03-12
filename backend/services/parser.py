import pdfplumber
from docx import Document
from io import BytesIO

def extract_text_from_pdf(file_bytes: bytes) -> list[tuple[int, str]]:
    """Returns list of (page_number, text) tuples"""
    pages = []
    with pdfplumber.open(BytesIO(file_bytes)) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text() or ""
            pages.append((i + 1, text))
    return pages

def extract_text_from_docx(file_bytes: bytes) -> list[tuple[int, str]]:
    """Returns list of (page_number, text) tuples"""
    doc = Document(BytesIO(file_bytes))
    full_text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
    return [(1, full_text)]

def extract_text(file_bytes: bytes, filename: str) -> list[tuple[int, str]]:
    if filename.lower().endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    elif filename.lower().endswith(".docx"):
        return extract_text_from_docx(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: {filename}")