import random

NOUNS = [
    "Katze", "Hund", "Apfel", "Brot", "Haus",
    "Baum", "Blume", "Vogel", "Fisch", "Buch",
    "Tisch", "Ball", "Stern", "Mond", "Sonne",
    "Regen", "Berg", "See", "Wind", "Lampe",
]

VERBS = [
    "Springt", "Rollt", "Fliegt", "Laeuft", "Schwimmt",
    "Singt", "Tanzt", "Lacht", "Isst", "Trinkt",
    "Liest", "Schreibt", "Malt", "Spielt", "Rennt",
    "Schlaeft", "Klettern", "Faehrt", "Sitzt", "Leuchtet",
]


def generate_username(taken: set[str], max_attempts: int = 100) -> str:
    for _ in range(max_attempts):
        candidate = random.choice(NOUNS) + random.choice(VERBS)
        if candidate not in taken:
            return candidate
    raise RuntimeError("Could not generate a unique username after many attempts")
