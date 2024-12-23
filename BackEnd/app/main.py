from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
import json

app = FastAPI()

class Query():
    prompt: str
    model: str = 'llama3:latest'



@app.post("/testquestion")
def answerquestion():
    return "received question"

@app.post("/generate")
def askllama(query):
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={"model": query.model, "prompt": query.prompt}
        )
        response.raise_for_status()
        return {"generated_text": response.json()["results"]}
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)