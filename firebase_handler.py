"""
FirebaseHandler placeholder class.
Provides a minimal, safe interface used by `GameEngine` and the Flask API.
Replace with real Firebase initialization when ready.
"""

import os
import time

FIREBASE_CRED = os.getenv("FIREBASE_CRED_JSON")


class FirebaseHandler:
    def __init__(self):
        self.enabled = bool(FIREBASE_CRED)
        self._connected = False
        if self.enabled:
            # In a real implementation, initialize firebase_admin here
            self._connected = True
            print("[FirebaseHandler] Initialized (stub)")
        else:
            print("[FirebaseHandler] Disabled (no credentials)")

    def create_user(self, uid, username, profile_picture=None):
        return {"uid": uid, "username": username, "created_at": int(time.time())}

    def save_game_state(self, uid, stats, score, cases_decided):
        # Stubbed save
        return True

    def update_high_score(self, uid, score):
        # Stubbed update
        return {"updated": True, "uid": uid, "score": score}

    def get_user(self, uid):
        return {"uid": uid, "username": "Anonymous", "joined": None}

    def get_leaderboard(self, limit=10):
        return []

    def save_case(self, case):
        return True

