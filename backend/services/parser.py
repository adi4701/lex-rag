import fitz  # PyMuPDF
from docx import Document
from io import BytesIO

def parse_pdf(file_bytes: bytes) -> list[tuple[int, str]]:
    pdf = fitz.open(stream=file_bytes, filetype="pdf")
    pages = [(i+1, page.get_text()) for i, page in enumerate(pdf)]
    return pages

def parse_docx(file_bytes: bytes) -> list[tuple[int, str]]:
    d = Document(BytesIO(file_bytes))
    text = "\n".join([p.text for p in d.paragraphs])
    return [(1, text)]
