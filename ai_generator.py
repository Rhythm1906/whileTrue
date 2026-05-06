"""
AI Case Generator - Primary case source.
Uses Gemini API with ML-enhanced prompts for unique, varied cases.
Every case is freshly generated based on theme combinations.
"""

import json
import os
import re
import requests
from dotenv import load_dotenv

from pattern_engine import PatternEngine

load_dotenv()

GEMINI_API_KEY = os.getenv("AIzaSyDg6Hi5ATR5y7jnieLxK-K91hlMzXi0GW8")
GEMINI_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/"
    f"gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
)

AI_TEMPERATURE = float(os.getenv("AI_TEMPERATURE", 0.95))
AI_MAX_RETRIES = int(os.getenv("AI_MAX_RETRIES", 2))
AI_TIMEOUT = int(os.getenv("AI_TIMEOUT", 12))


class AIGenerator:
    """
    AI-powered case generator using Gemini.
    Uses ML pattern engine to:
    - Suggest fresh theme combinations
    - Validate output quality
    - Ensure variety across sessions
    """

    def __init__(self):
        self.enabled = bool(
            GEMINI_API_KEY
            and GEMINI_API_KEY != "your_gemini_api_key_here"
        )
        self.pattern_engine = PatternEngine()

        if not self.enabled:
            print("[AIGenerator] WARNING: No Gemini API key configured")
        else:
            print("[AIGenerator] Ready - AI-first case generation enabled")

    # ─── Prompt Building ─────────────────────────────────────────────────────

    def _build_prompt(self, case_number, used_characters=None, difficulty="medium"):
        """
        Build a smart prompt using ML-suggested themes.
        Each call creates a UNIQUE case combination.
        """
        used_characters = used_characters or []

        # Get ML-suggested fresh theme combination
        theme = self.pattern_engine.suggest_theme_combination(used_characters)

        # Get difficulty target from learned patterns
        diff_target = self.pattern_engine.get_difficulty_target(difficulty)
        target_impact = int(diff_target.get("avg_impact", 30))

        # Build avoid list
        avoid_str = ", ".join(used_characters[-10:]) if used_characters else "none yet"

        prompt = f"""You are a creative writer for an AI courtroom game called "Judge's Court" (similar to "Sort the Court").

Generate ONE completely UNIQUE courtroom case. Every case must be original and creative.

THEME INSPIRATION (use these to create a fresh case):
- Setting: {theme.get('setting', 'kingdom')}
- Character archetype: {theme.get('archetype', 'citizen')}
- Crime type: {theme.get('crime', 'unspecified')}
- Motivation: {theme.get('motivation', 'unclear')}
- Complication: {theme.get('complication', 'none')}
- Moral dilemma: {theme.get('moral_dilemma', 'right vs wrong')}

VARIETY REQUIREMENT:
- Avoid these recently used character types: {avoid_str}
- Create a character not similar to any above
- The case must be FRESH and UNIQUE - not a generic farmer/thief case

OUTPUT FORMAT (return ONLY this JSON, no markdown, no explanation):
{{
  "id": "ai_case_{case_number}",
  "character": "Creative character title (3-5 words)",
  "text": "The accused presents their case to the judge. Include WHAT they did, WHY they did it, and what makes it morally complex. 2-3 sentences. Should make the judge genuinely conflicted.",
  "category": "Choose ONE: corruption, survival_crime, vigilante_justice, environmental_crime, whistleblowing, civil_disobedience, fraud, treason, blasphemy",
  "difficulty": "{difficulty}",
  "choices": [
    {{
      "text": "Punish",
      "effects": {{
        "trust": <integer -15 to 15>,
        "economy": <integer -15 to 15>,
        "chaos": <integer -15 to 15>
      }}
    }},
    {{
      "text": "Forgive",
      "effects": {{
        "trust": <integer -15 to 15>,
        "economy": <integer -15 to 15>,
        "chaos": <integer -15 to 15>
      }}
    }}
  ]
}}

CRITICAL RULES:
1. EACH choice must improve at least 1 stat AND worsen at least 1 other stat (NEVER all positive or all negative)
2. Punish and Forgive must have OPPOSITE effects on most stats
3. Total impact magnitude per choice should be approximately {target_impact} (sum of absolute values)
4. The case must present a REAL moral dilemma - no obvious "correct" answer
5. Be creative - use the theme inspiration to invent something unique
6. Character name should be descriptive but not clichéd

Generate the case now:"""

        return prompt

    # ─── JSON Extraction ─────────────────────────────────────────────────────

    def _extract_json(self, text):
        """Robust JSON extraction from AI response"""
        if not text:
            return None

        # Strategy 1: Direct parse
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Strategy 2: Strip markdown code blocks
        cleaned = re.sub(r"```(?:json)?\s*", "", text)
        cleaned = re.sub(r"\s*```", "", cleaned)
        try:
            return json.loads(cleaned.strip())
        except json.JSONDecodeError:
            pass

        # Strategy 3: Find first {...} block
        match = re.search(r"\{[\s\S]*\}", text)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass

        return None

    # ─── API Call ────────────────────────────────────────────────────────────

    def _call_gemini(self, prompt):
        """Make Gemini API call with error handling"""
        try:
            response = requests.post(
                GEMINI_URL,
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "temperature": AI_TEMPERATURE,
                        "maxOutputTokens": 800,
                        "topP": 0.95,
                        "topK": 40,
                    },
                    "safetySettings": [
                        {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_ONLY_HIGH"},
                        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_ONLY_HIGH"},
                        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_ONLY_HIGH"},
                    ],
                },
                timeout=AI_TIMEOUT,
            )

            if response.status_code != 200:
                print(f"[AIGenerator] HTTP {response.status_code}: {response.text[:200]}")
                return None

            data = response.json()
            candidates = data.get("candidates", [])
            if not candidates:
                print("[AIGenerator] No candidates in response")
                return None

            return (
                candidates[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "")
            )

        except requests.Timeout:
            print("[AIGenerator] Request timed out")
            return None
        except Exception as e:
            print(f"[AIGenerator] API error: {e}")
            return None

    # ─── Main Generation Function ────────────────────────────────────────────

    def generate_case(self, case_number=1, used_characters=None, difficulty="medium"):
        """
        Generate a fresh case using AI.
        Retries on failure or low quality.

        Returns: case dict or None
        """
        if not self.enabled:
            return None

        for attempt in range(AI_MAX_RETRIES + 1):
            prompt = self._build_prompt(case_number, used_characters, difficulty)
            raw_text = self._call_gemini(prompt)

            if not raw_text:
                print(f"[AIGenerator] Attempt {attempt + 1}: Empty response")
                continue

            parsed = self._extract_json(raw_text)
            if not parsed:
                print(f"[AIGenerator] Attempt {attempt + 1}: JSON parse failed")
                continue

            # Structural validation
            is_valid, error = self.pattern_engine.validate_structure(parsed)
            if not is_valid:
                print(f"[AIGenerator] Attempt {attempt + 1}: {error}")
                continue

            # Quality check (ML-based)
            quality = self.pattern_engine.score_quality(parsed)
            if quality < 50:
                print(f"[AIGenerator] Attempt {attempt + 1}: Low quality ({quality})")
                if attempt < AI_MAX_RETRIES:
                    continue

            # Success!
            print(f"[AIGenerator] Generated case (quality: {quality})")

            # Ensure unique ID
            parsed["id"] = f"ai_case_{case_number}_{random.randint(1000, 9999)}"
            parsed["_quality"] = quality
            parsed["_source"] = "ai_generated"

            return parsed

        print(f"[AIGenerator] All {AI_MAX_RETRIES + 1} attempts failed")
        return None


# Import here to avoid circular issues at module load time
import random