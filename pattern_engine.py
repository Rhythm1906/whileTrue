"""
Pattern Engine - ML-based case pattern analyzer.

Learns from training cases to:
1. Identify effect patterns by category/difficulty
2. Validate AI-generated cases match learned patterns
3. Suggest theme combinations for AI prompts
4. Score case quality (moral dilemma strength)
"""

import json
import os
import pickle
import random
import re
from collections import Counter, defaultdict

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
TRAINING_PATH = os.path.join(DATA_DIR, "training_cases.json")
THEMES_PATH = os.path.join(DATA_DIR, "case_themes.json")
WEIGHTS_DIR = os.path.join(BASE_DIR, "ml_model", "model_weights")
MODEL_PATH = os.path.join(WEIGHTS_DIR, "pattern_model.pkl")


class PatternEngine:
    """ML-based pattern analyzer for case generation guidance"""

    def __init__(self):
        self.model = None
        self.themes = None
        self._load_themes()
        self._load_or_train_model()

    # ─── Load Resources ──────────────────────────────────────────────────────

    def _load_themes(self):
        """Load theme combinations for AI prompt enrichment"""
        try:
            with open(THEMES_PATH, "r", encoding="utf-8") as f:
                self.themes = json.load(f)
        except Exception as e:
            print(f"[PatternEngine] Theme load failed: {e}")
            self.themes = {}

    def _load_or_train_model(self):
        """Load trained model or train new one"""
        if os.path.exists(MODEL_PATH):
            try:
                with open(MODEL_PATH, "rb") as f:
                    self.model = pickle.load(f)
                print(f"[PatternEngine] Loaded model with {len(self.model.get('categories', []))} categories")
                return
            except Exception as e:
                print(f"[PatternEngine] Load failed, retraining: {e}")

        self.train()

    # ─── Training ────────────────────────────────────────────────────────────

    def train(self):
        """Train pattern model from training cases"""
        if not os.path.exists(TRAINING_PATH):
            print("[PatternEngine] No training data")
            return

        with open(TRAINING_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)

        cases = data.get("cases", [])
        if not cases:
            return

        # Extract patterns
        category_patterns = self._extract_category_patterns(cases)
        difficulty_patterns = self._extract_difficulty_patterns(cases)
        text_patterns = self._extract_text_patterns(cases)
        moral_axes = list(set(c.get("moral_axis", "general") for c in cases))

        self.model = {
            "category_patterns": category_patterns,
            "difficulty_patterns": difficulty_patterns,
            "text_patterns": text_patterns,
            "moral_axes": moral_axes,
            "categories": list(set(c.get("category", "general") for c in cases)),
            "trained_on": len(cases),
        }

        # Save
        os.makedirs(WEIGHTS_DIR, exist_ok=True)
        with open(MODEL_PATH, "wb") as f:
            pickle.dump(self.model, f)

        print(f"[PatternEngine] Trained on {len(cases)} cases")

    def _extract_category_patterns(self, cases):
        """Learn typical effect ranges per category"""
        patterns = defaultdict(lambda: {
            "trust": [], "economy": [], "chaos": [], "count": 0
        })

        for case in cases:
            cat = case.get("category", "general")
            patterns[cat]["count"] += 1
            for choice in case.get("choices", []):
                effects = choice.get("effects", {})
                patterns[cat]["trust"].append(effects.get("trust", 0))
                patterns[cat]["economy"].append(effects.get("economy", 0))
                patterns[cat]["chaos"].append(effects.get("chaos", 0))

        # Convert to ranges
        result = {}
        for cat, vals in patterns.items():
            result[cat] = {
                "trust_range": (min(vals["trust"], default=0), max(vals["trust"], default=0)),
                "economy_range": (min(vals["economy"], default=0), max(vals["economy"], default=0)),
                "chaos_range": (min(vals["chaos"], default=0), max(vals["chaos"], default=0)),
                "sample_count": vals["count"],
            }
        return result

    def _extract_difficulty_patterns(self, cases):
        """Learn impact magnitude per difficulty"""
        patterns = defaultdict(list)

        for case in cases:
            diff = case.get("difficulty", "medium")
            for choice in case.get("choices", []):
                effects = choice.get("effects", {})
                impact = sum(abs(v) for v in effects.values())
                patterns[diff].append(impact)

        result = {}
        for diff, impacts in patterns.items():
            if impacts:
                result[diff] = {
                    "avg_impact": sum(impacts) / len(impacts),
                    "max_impact": max(impacts),
                    "min_impact": min(impacts),
                }
        return result

    def _extract_text_patterns(self, cases):
        """Learn linguistic patterns from case text"""
        word_counts = Counter()
        char_lengths = []
        sentence_counts = []

        for case in cases:
            text = case.get("text", "")
            tokens = re.findall(r"[a-z]+", text.lower())
            word_counts.update(tokens)
            char_lengths.append(len(text))
            sentence_counts.append(text.count(".") + text.count("!"))

        common_words = [w for w, _ in word_counts.most_common(50)]

        return {
            "common_words": common_words,
            "avg_length": sum(char_lengths) / len(char_lengths) if char_lengths else 100,
            "avg_sentences": sum(sentence_counts) / len(sentence_counts) if sentence_counts else 2,
        }

    # ─── Pattern-Based Suggestions ───────────────────────────────────────────

    def suggest_theme_combination(self, used_characters=None):
        """
        Generate a fresh theme combo for AI prompt.
        Combines random elements for unique cases.
        """
        used_characters = used_characters or []

        if not self.themes:
            return {}

        # Pick fresh archetype not recently used
        archetypes = self.themes.get("character_archetypes", ["citizen"])
        fresh_archetypes = [
            a for a in archetypes
            if not any(a.lower() in c.lower() for c in used_characters)
        ]
        archetype = random.choice(fresh_archetypes if fresh_archetypes else archetypes)

        return {
            "setting": random.choice(self.themes.get("settings", ["kingdom"])),
            "archetype": archetype,
            "crime": random.choice(self.themes.get("crime_types", ["theft"])),
            "motivation": random.choice(self.themes.get("motivations", ["personal gain"])),
            "complication": random.choice(self.themes.get("complications", ["the case is unclear"])),
            "moral_dilemma": random.choice(self.themes.get("moral_dilemmas", ["law vs justice"])),
        }

    def get_difficulty_target(self, difficulty="medium"):
        """Get target impact range for difficulty"""
        if not self.model:
            return {"avg_impact": 30, "max_impact": 45}

        patterns = self.model.get("difficulty_patterns", {})
        return patterns.get(difficulty, {"avg_impact": 30, "max_impact": 45})

    def get_effect_constraints(self, category=None):
        """Get effect range constraints from learned patterns"""
        if not self.model or not category:
            return {"min": -15, "max": 15}

        patterns = self.model.get("category_patterns", {}).get(category)
        if not patterns:
            return {"min": -15, "max": 15}

        # Use learned ranges
        all_min = min(
            patterns["trust_range"][0],
            patterns["economy_range"][0],
            patterns["chaos_range"][0],
        )
        all_max = max(
            patterns["trust_range"][1],
            patterns["economy_range"][1],
            patterns["chaos_range"][1],
        )
        return {"min": all_min, "max": all_max}

    # ─── Case Validation & Scoring ───────────────────────────────────────────

    def validate_structure(self, case):
        """
        Strict structural validation.
        Returns (is_valid, error_message)
        """
        if not isinstance(case, dict):
            return False, "Not a dict"

        if not case.get("character") or not case.get("text"):
            return False, "Missing character or text"

        if not isinstance(case.get("character"), str) or len(case["character"]) > 60:
            return False, "Character must be string under 60 chars"

        if not isinstance(case.get("text"), str) or len(case["text"]) < 30:
            return False, "Text too short"

        choices = case.get("choices", [])
        if not isinstance(choices, list) or len(choices) != 2:
            return False, "Must have exactly 2 choices"

        for i, choice in enumerate(choices):
            if not choice.get("text") or not choice.get("effects"):
                return False, f"Choice {i} missing text/effects"

            effects = choice["effects"]
            try:
                trust = int(effects.get("trust", 0))
                economy = int(effects.get("economy", 0))
                chaos = int(effects.get("chaos", 0))
            except (TypeError, ValueError):
                return False, f"Choice {i} effects not integers"

            # Range check
            for stat, val in [("trust", trust), ("economy", economy), ("chaos", chaos)]:
                if abs(val) > 20:
                    return False, f"Choice {i} {stat} out of range"

            # Tradeoff check
            values = [trust, economy, chaos]
            if not (any(v > 0 for v in values) and any(v < 0 for v in values)):
                return False, f"Choice {i} has no tradeoff"

        return True, "Valid"

    def score_quality(self, case):
        """
        ML-based quality score (0-100) for AI-generated case.
        Higher = better moral dilemma.
        """
        score = 100

        # Check choice opposition (good cases have opposite effects)
        choices = case.get("choices", [])
        if len(choices) == 2:
            e1 = choices[0].get("effects", {})
            e2 = choices[1].get("effects", {})

            opposition_score = 0
            for stat in ["trust", "economy", "chaos"]:
                v1 = e1.get(stat, 0)
                v2 = e2.get(stat, 0)
                # Opposing signs = good dilemma
                if (v1 > 0 and v2 < 0) or (v1 < 0 and v2 > 0):
                    opposition_score += 1

            if opposition_score < 2:
                score -= 30  # Choices too similar

        # Check text richness
        text = case.get("text", "")
        if self.model:
            avg_length = self.model.get("text_patterns", {}).get("avg_length", 100)
            if len(text) < avg_length * 0.5:
                score -= 20  # Too short
            if len(text) > avg_length * 3:
                score -= 10  # Too long

        # Check for moral words
        moral_words = ["but", "however", "although", "while", "despite", "yet"]
        if not any(w in text.lower() for w in moral_words):
            score -= 15  # No clear dilemma framing

        return max(0, score)

    def is_high_quality(self, case, threshold=60):
        """Check if AI case meets quality threshold"""
        is_valid, _ = self.validate_structure(case)
        if not is_valid:
            return False
        return self.score_quality(case) >= threshold