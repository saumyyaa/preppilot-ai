from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider
import os
from fastapi import Request
from fastapi.responses import JSONResponse

@app.options("/{path:path}")
async def preflight_handler(path: str, request: Request):
    return JSONResponse(content={"ok": True})

from dotenv import load_dotenv

load_dotenv(dotenv_path=".env")

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

app = FastAPI(title="PrepPilot Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://preppilot-ai.vercel.app",],  # allow frontend
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Request Schema ----------
class GenerateRequest(BaseModel):
    job_description: str = Field(..., min_length=30)
    resume_text: str = Field(default="")
    level: str = Field(default="Intern")

# ---------- Response Schema ----------
class TechQuestion(BaseModel):
    question: str
    answer_outline: str

class GenerateResponse(BaseModel):
    role_summary: str
    required_skills: list[str]
    tech_questions: list[TechQuestion]
    hr_questions: list[str]
    resume_improvements: list[str]
    study_plan: list[str]

# ---------- Model + Agent ----------
provider = OpenAIProvider(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)

model = OpenAIChatModel(
    "openai/gpt-4o-mini",  # ✅ IMPORTANT: no 'openrouter/' prefix here
    provider=provider,
)

agent = Agent(
    model,
    output_type=GenerateResponse,
    instructions=(
        "You are an expert interview coach. "
        "Given a job description and resume, generate a structured interview prep pack. "
        "Keep it concise, practical, and tailored."
    ),
)

@app.get("/")
def root():
    return {"status": "ok", "message": "PrepPilot backend is running"}

@app.post("/generate", response_model=GenerateResponse)
async def generate(payload: GenerateRequest):
    prompt = f"""
LEVEL: {payload.level}

JOB DESCRIPTION:
{payload.job_description}

RESUME:
{payload.resume_text if payload.resume_text else "Not provided"}

Return:
- role_summary
- required_skills
- tech_questions (10)
- hr_questions (5)
- resume_improvements
- 7-day study_plan
"""

    try:
        result = await agent.run(
            prompt,
            model_settings={"temperature": 0.4, "max_tokens": 1200},
        )
        return result.output
    except Exception:
        # fallback (more strict/short)
        result = await agent.run(
            prompt,
            model_settings={"temperature": 0.2, "max_tokens": 900},
        )
        return result.output
