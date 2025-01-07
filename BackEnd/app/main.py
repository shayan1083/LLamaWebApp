from fastapi import FastAPI, Query, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import requests
from pydantic import BaseModel
import json
import asyncio
import uuid
import os
import datetime
from PyPDF2 import PdfReader

app = FastAPI()

class GenerateRequest(BaseModel):
    model: str = 'llama3:latest'
    prompt: str
    stream: bool = False


@app.post("/testquestion")
def answerquestion():
    return "received question"


uploaded_files = {}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        temp_file_path = f'/tmp/{file.filename}'
        content = await file.read()

        with open(temp_file_path, 'wb') as f:
            f.write(content)
        
        if os.path.exists(temp_file_path):
            with open(temp_file_path, 'rb') as f:
                reader = PdfReader(f)
                text = ""
                for page in reader.pages:
                    text += page.extract_text()
            print("obtained text")
            uploaded_files[file.filename] = {
            'content': text,
            'timestamp': datetime.datetime.now()
            }
            print("added text to uploaded_files")
        else:
            print("File not found")
        print("File uploaded successfully")
        os.remove(temp_file_path)
        return {
            "message": "File uploaded successfully",
            "filename": file.filename,
            "chars": len(text)
        }
    except Exception as e:
        print(f"Error uploading file: {str(e)}")
        return {"error": str(e)}


conversation_history = {}

@app.get("/generate_formatted")
async def generate_formatted(
    prompt: str,
    session_id: str = Query(default=None),
    file_name: str = Query(default=None),
    model: str = 'llama3:latest',
    stream: bool = True
):
    url = 'http://localhost:11434/api/generate'
    headers = {'Content-Type': 'application/json'}

    if not session_id:
        session_id = str(uuid.uuid4())
        conversation_history[session_id] = []

    history = conversation_history.get(session_id, [])

    if file_name and file_name in uploaded_files:
        context = f"Context from document '{file_name}':\n{uploaded_files[file_name]['content']}\n\n"
        full_prompt = (
           f"{context}\n" 
            f"Based on the above context, please answer the following:\n"
            f"User: {prompt}"
        )
    else:
        if file_name:
            return {"error": f"File '{file_name}' not found in uploaded files."}
        full_prompt = f"User: {prompt}"

    history.append(full_prompt)
    
    data = {
        "model": model,
        "prompt": "\n".join(history),
        "stream": stream
    }
    
    async def response_stream():
        response = requests.post(url, headers=headers, json=data, stream=True)
        for line in response.iter_lines():
            if line:
                try:
                    json_line = json.loads(line.decode('utf-8'))
                    if "response" in json_line:
                        model_response = json_line["response"]
                        history.append(f"Ollama: {model_response}")
                        conversation_history[session_id] = history

                        response_data = json.dumps({
                            "response": model_response,
                            "session_id": session_id,
                            "file_context": bool(file_name and file_name in uploaded_files)
                        })
                        yield f'data: {response_data}\n\n'
                        await asyncio.sleep(0.1)
                except json.JSONDecodeError:
                    continue
    
    return StreamingResponse(
        response_stream(),
        media_type="text/event-stream",
    )


    

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)