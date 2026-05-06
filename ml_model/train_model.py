"""
Train pattern model for AI-guided case generation.
Run: python ml_model/train_model.py
"""

import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pattern_engine import PatternEngine


def main():
    print("=" * 60)
    print("   Training Pattern Engine for Judge's Court")
    print("=" * 60)

    engine = PatternEngine()
    engine.train()

    if engine.model:
        print("\nLearned patterns:")
        print(f"  Categories: {engine.model['categories']}")
        print(f"  Moral axes: {engine.model['moral_axes']}")
        print(f"  Trained on: {engine.model['trained_on']} cases")

        print("\nDifficulty patterns:")
        for diff, stats in engine.model.get("difficulty_patterns", {}).items():
            print(f"  {diff}: avg impact = {stats['avg_impact']:.1f}")

        print("\nSample theme suggestion:")
        suggestion = engine.suggest_theme_combination()
        for key, val in suggestion.items():
            print(f"  {key}: {val}")

    print("\nModel saved successfully!")


if __name__ == "__main__":
    main()