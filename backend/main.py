from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from pydantic import BaseModel, Field
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider

import os
import logging
from dotenv import load_dotenv

# -------------------- Logging --------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("preppilot-backend")

# -------------------- Env --------------------
load_dotenv(dotenv_path=".env")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

if not OPENROUTER_API_KEY:
    logger.warning(
        "OPENROUTER_API_KEY is missing. Add it in Render Environment Variables or backend/.env locally."
    )

# -------------------- App --------------------
app = FastAPI(title="PrepPilot Backend", version="1.0.0")

# -------------------- CORS --------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://preppilot-ai.vercel.app",
    ],
    allow_credentials=False,  # ✅ you are not using cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Preflight handler (must be AFTER app is defined)
@app.options("/{path:path}")
async def preflight_handler(path: str, request: Request):
    return JSONResponse(content={"ok": True})


# -------------------- Schemas --------------------
class GenerateRequest(BaseModel):
    job_description: str = Field(..., min_length=30)
    resume_text: str = Field(default="")
    level: str = Field(default="Intern")


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


# -------------------- Model + Agent --------------------
# ✅ OpenRouter is OpenAI-compatible; just set base_url + api_key
provider = OpenAIProvider(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)

model = OpenAIChatModel(
    "openai/gpt-4o-mini",
    provider=provider,
)

agent = Agent(
    model,
    output_type=GenerateResponse,
    instructions=(
        "You are an expert interview coach. "
        "Given a job description and resume, generate a structured interview prep pack. "
        "Return concise, practical, tailored output.\n\n"
        "Rules:\n"
        "- required_skills: 8-12 bullet skills from JD\n"
        "- tech_questions: 10 questions, each with a short answer outline\n"
        "- hr_questions: 5 items\n"
        "- resume_improvements: 6-10 items\n"
        "- study_plan: exactly 7 items (Day 1..Day 7)\n"
        "Return valid JSON only."
    ),
)


# -------------------- Routes --------------------
@app.get("/")
def root():
    return {"status": "ok", "message": "PrepPilot backend is running"}


@app.post("/generate", response_model=GenerateResponse)
async def generate(payload: GenerateRequest):
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY missing on server")

    prompt = f"""
LEVEL: {payload.level}

JOB DESCRIPTION:
{payload.job_description}

RESUME:
{payload.resume_text if payload.resume_text else "Not provided"}

Return strictly valid JSON in this format:
role_summary
required_skills
tech_questions (10)
hr_questions (5)
resume_improvements
study_plan (7 days)
"""

    try:
        logger.info("Generating prep pack (temperature=0.4)")
        result = await agent.run(
            prompt,
            model_settings={"temperature": 0.4, "max_tokens": 1200},
        )
        return result.output

    except Exception as e:
        logger.warning(f"Primary attempt failed: {str(e)}. Retrying with stricter settings...")

        try:
            result = await agent.run(
                prompt,
                model_settings={"temperature": 0.2, "max_tokens": 900},
            )
            return result.output
        except Exception as e2:
            logger.error(f"Fallback also failed: {str(e2)}")
            raise HTTPException(status_code=500, detail="Failed to generate response from model")
