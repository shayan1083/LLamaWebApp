from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import requests
from pydantic import BaseModel
import json
import asyncio

app = FastAPI()

class GenerateRequest(BaseModel):
    model: str = 'llama3:latest'
    prompt: str
    stream: bool = False


@app.post("/testquestion")
def answerquestion():
    return "received question"


# https://github.com/darcyg32/Ollama-FastAPI-Integration-Demo/blob/main/app.py
@app.post("/generate")
async def generate_full(request: GenerateRequest):
    url = 'http://localhost:11434/api/generate'
    headers = {'Content-Type': 'application/json'}
    data = {
        "model": request.model,
        "prompt": request.prompt,
        "stream": request.stream
    }

    response = requests.post(url, headers=headers, json=data, stream=True)

    raw_response = ""
    for line in response.iter_lines():
        if line: 
            raw_response += line.decode('utf-8') + '\n'
    return raw_response

@app.get("/generate_formatted")
async def generate_formatted(
    prompt: str,
    model: str = 'llama3:latest',
    stream: bool = True
):
    print("generate function called")
    url = 'http://localhost:11434/api/generate'
    headers = {'Content-Type': 'application/json'}
    data = {
        "model": model,
        "prompt": prompt,
        "stream": stream
    }
    
    async def response_stream():
        response = requests.post(url, headers=headers, json=data, stream=True)
        for line in response.iter_lines():
            if line:
                try:
                    json_line = json.loads(line.decode('utf-8'))
                    if "response" in json_line:
                        response_data = json.dumps({
                            "response": json_line["response"]
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