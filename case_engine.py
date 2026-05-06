"""
Case Engine - EMERGENCY FALLBACK ONLY.
Used when AI generation completely fails (rare).
Primary case source is ai_generator.py.
"""

import json
import os
import random

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "training_cases.json")


class CaseEngine:
    """Emergency fallback case provider"""

    def __init__(self):
        self.cases = self._load_cases()
        print(f"[CaseEngine] Loaded {len(self.cases)} fallback cases (emergency only)")

    def _load_cases(self):
        """Load training cases as fallback"""
        try:
            with open(DATA_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            return data.get("cases", [])
        except Exception as e:
            print(f"[CaseEngine] Load error: {e}")
            return []

    def get_emergency_case(self, exclude_ids=None):
        """
        Get an emergency fallback case.
        Only called when AI completely fails.
        """
        exclude_ids = exclude_ids or []
        available = [c for c in self.cases if c["id"] not in exclude_ids]

        if not available:
            available = self.cases

        if not available:
            return None

        case = dict(random.choice(available))  # Copy
        case["_source"] = "emergency_fallback"
        return case

    def get_all_cases(self):
        """Return all fallback cases (for inspection only)"""
        return self.cases

    def get_count(self):
        """Number of fallback cases"""
        return len(self.cases)