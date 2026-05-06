"""
Flask API server for Judge's Court.
AI-first courtroom game backend.
"""

import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

from game_engine import GameEngine
from case_engine import CaseEngine

load_dotenv()

app = Flask(__name__)
CORS(app)

game_engine = GameEngine()
case_engine = CaseEngine()


# ═══════════════════════════════════════════════════════════════════════════
# INFO
# ═══════════════════════════════════════════════════════════════════════════

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "service": "Judge's Court API",
        "version": "2.0.0",
        "scoring": "Sort the Court style",
        "case_generation": "AI-first (Gemini) with ML-enhanced prompts",
        "endpoints": {
            "POST /api/user/create": "Create user profile",
            "GET  /api/user/<uid>": "Get user profile",
            "POST /api/game/start/<uid>": "Start new game",
            "POST /api/game/difficulty/<uid>": "Set difficulty",
            "GET  /api/game/state/<uid>": "Get game state",
            "GET  /api/game/case/<uid>": "Get next AI case",
            "POST /api/game/decide/<uid>": "Make decision",
            "POST /api/game/reset/<uid>": "Reset game",
            "GET  /api/game/ai-stats/<uid>": "AI generation stats",
            "GET  /api/leaderboard": "Top players",
            "POST /api/admin/retrain": "Retrain pattern model",
        },
    })


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "ai_enabled": game_engine.ai_generator.enabled,
        "firebase_enabled": game_engine.firebase.enabled,
        "fallback_cases": case_engine.get_count(),
        "pattern_model_loaded": game_engine.ai_generator.pattern_engine.model is not None,
    })


# ═══════════════════════════════════════════════════════════════════════════
# USER PROFILE
# ═══════════════════════════════════════════════════════════════════════════

@app.route("/api/user/create", methods=["POST"])
def create_user():
    data = request.get_json() or {}
    uid = data.get("uid")
    username = data.get("username", "Anonymous Judge")
    profile_picture = data.get("profile_picture")

    if not uid:
        return jsonify({"error": "uid is required"}), 400

    result = game_engine.firebase.create_user(uid, username, profile_picture)
    return jsonify(result)


@app.route("/api/user/<uid>", methods=["GET"])
def get_user(uid):
    result = game_engine.get_user_profile(uid)
    if "error" in result:
        return jsonify(result), 404
    return jsonify(result)


# ═══════════════════════════════════════════════════════════════════════════
# GAME ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

@app.route("/api/game/start/<uid>", methods=["POST"])
def start_game(uid):
    data = request.get_json() or {}
    difficulty = data.get("difficulty", "medium")

    state = game_engine.start_session(uid, difficulty)
    return jsonify({
        "message": "Game started - cases will be AI generated",
        "state": state,
    })


@app.route("/api/game/difficulty/<uid>", methods=["POST"])
def set_difficulty(uid):
    data = request.get_json() or {}
    difficulty = data.get("difficulty")

    if not difficulty:
        return jsonify({"error": "difficulty required (easy/medium/hard)"}), 400

    result = game_engine.set_difficulty(uid, difficulty)
    if "error" in result:
        return jsonify(result), 400
    return jsonify(result)


@app.route("/api/game/state/<uid>", methods=["GET"])
def get_state(uid):
    state = game_engine.get_session_state(uid)
    return jsonify(state)


@app.route("/api/game/case/<uid>", methods=["GET"])
def get_case(uid):
    """Generate next case using AI"""
    result = game_engine.get_next_case(uid)

    if result.get("error"):
        return jsonify(result), 404

    return jsonify(result)


@app.route("/api/game/decide/<uid>", methods=["POST"])
def decide(uid):
    """Submit decision: {choice_index: 0 or 1}"""
    data = request.get_json() or {}
    choice_index = data.get("choice_index")

    if choice_index is None:
        return jsonify({"error": "choice_index required"}), 400

    try:
        choice_index = int(choice_index)
    except (TypeError, ValueError):
        return jsonify({"error": "choice_index must be integer"}), 400

    result = game_engine.process_decision(uid, choice_index)

    if "error" in result:
        return jsonify(result), 400

    return jsonify(result)


@app.route("/api/game/reset/<uid>", methods=["POST"])
def reset_game(uid):
    state = game_engine.reset_session(uid)
    return jsonify({
        "message": "Game reset. High score saved.",
        "state": state,
    })


@app.route("/api/game/ai-stats/<uid>", methods=["GET"])
def ai_stats(uid):
    """Get AI generation stats for the session"""
    return jsonify(game_engine.get_ai_stats(uid))


# ═══════════════════════════════════════════════════════════════════════════
# LEADERBOARD
# ═══════════════════════════════════════════════════════════════════════════

@app.route("/api/leaderboard", methods=["GET"])
def leaderboard():
    limit = request.args.get("limit", 10, type=int)
    result = game_engine.get_leaderboard(limit)
    return jsonify(result)


# ═══════════════════════════════════════════════════════════════════════════
# ADMIN
# ═══════════════════════════════════════════════════════════════════════════

@app.route("/api/admin/retrain", methods=["POST"])
def retrain():
    """Retrain pattern model (call after updating training_cases.json)"""
    try:
        game_engine.ai_generator.pattern_engine.train()
        return jsonify({
            "success": True,
            "message": "Pattern model retrained",
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════════════════════
# ERROR HANDLERS
# ═══════════════════════════════════════════════════════════════════════════

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500


# ═══════════════════════════════════════════════════════════════════════════
# RUN
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("=" * 60)
    print("   JUDGE'S COURT - AI-First Backend")
    print("=" * 60)
    print(f"   AI Generator:   {'ENABLED' if game_engine.ai_generator.enabled else 'DISABLED'}")
    print(f"   Pattern Model:  {'LOADED' if game_engine.ai_generator.pattern_engine.model else 'NOT LOADED'}")
    print(f"   Firebase:       {'ENABLED' if game_engine.firebase.enabled else 'DISABLED'}")
    print(f"   Fallback Cases: {case_engine.get_count()} (emergency only)")
    print("=" * 60)
    print("   AI generates EVERY case dynamically")
    print("   Local cases used only if AI completely fails")
    print("=" * 60)
    print("   Server: http://localhost:5000")
    print("=" * 60)

    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)