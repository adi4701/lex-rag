from langchain.text_splitter import RecursiveCharacterTextSplitter

def get_text_chunks(full_text: str) -> list[str]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=150,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    return splitter.split_text(full_text)
