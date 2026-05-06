"""
Judge stats system - Sort the Court style scoring.

Stats:
- Trust:   0-100 | Game over at 0
- Economy: 0-100 | Game over at 0
- Chaos:   0-100 | Game over at 100

Game ends when ANY stat reaches its critical value.
Score = number of cases survived.
"""


class JudgeStats:
    """Manages judge stats with Sort the Court style scoring"""

    DEFAULT_STATS = {"trust": 50, "economy": 50, "chaos": 50}
    MIN_VALUE = 0
    MAX_VALUE = 100

    GAME_OVER_RULES = {
        "trust": {"low": 0, "high": None},
        "economy": {"low": 0, "high": None},
        "chaos": {"low": None, "high": 100},
    }

    def __init__(self, initial_stats=None):
        self.stats = initial_stats or dict(self.DEFAULT_STATS)
        self.cases_decided = 0
        self.score = 0

    @staticmethod
    def clamp(value):
        return max(JudgeStats.MIN_VALUE, min(JudgeStats.MAX_VALUE, value))

    def apply_effects(self, effects):
        """Apply choice effects and update score"""
        for stat, change in effects.items():
            if stat in self.stats:
                self.stats[stat] = self.clamp(self.stats[stat] + change)

        self.cases_decided += 1
        self.score += 1

        return self.get_full_state()

    def get_stats(self):
        return dict(self.stats)

    def reset(self):
        self.stats = dict(self.DEFAULT_STATS)
        self.cases_decided = 0
        self.score = 0
        return self.get_full_state()

    def is_game_over(self):
        for stat, rules in self.GAME_OVER_RULES.items():
            value = self.stats[stat]
            if rules["low"] is not None and value <= rules["low"]:
                return True
            if rules["high"] is not None and value >= rules["high"]:
                return True
        return False

    def get_game_over_reason(self):
        if not self.is_game_over():
            return None

        if self.stats["trust"] <= 0:
            return "The citizens have revolted! Your trust hit zero."
        if self.stats["economy"] <= 0:
            return "The kingdom is bankrupt! Economy collapsed."
        if self.stats["chaos"] >= 100:
            return "The kingdom descended into chaos! Order has been lost."
        return "Game over."

    def get_status(self):
        if self.is_game_over():
            return "Dethroned Judge"

        avg = sum(self.stats.values()) / len(self.stats)
        if avg >= 75:
            return "Legendary Judge"
        elif avg >= 60:
            return "Respected Judge"
        elif avg >= 40:
            return "Fair Judge"
        elif avg >= 25:
            return "Struggling Judge"
        else:
            return "Failing Judge"

    def get_full_state(self):
        return {
            "stats": self.get_stats(),
            "score": self.score,
            "cases_decided": self.cases_decided,
            "game_over": self.is_game_over(),
            "game_over_reason": self.get_game_over_reason(),
            "status": self.get_status(),
        }

    def to_dict(self):
        return {
            "stats": self.stats,
            "cases_decided": self.cases_decided,
            "score": self.score,
        }

    @classmethod
    def from_dict(cls, data):
        instance = cls(initial_stats=data.get("stats"))
        instance.cases_decided = data.get("cases_decided", 0)
        instance.score = data.get("score", 0)
        return instance