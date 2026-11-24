"""Reviewed sentence families. Each regex covers a task meaning, not a word substring."""

# All inputs are normalized by answers.normalize; patterns must match the WHOLE answer.
PATTERNS = {
    ("bakery-first", "roll"): [
        r"(mia|sie) (moechte|nimmt|kauft) (bitte )?ein (frisches )?broetchen( bitte)?",
        r"ich haette (bitte )?gerne? ein (frisches )?broetchen( bitte)?",
    ],
    ("bakery-first", "independent"): [
        r"(mia|sie|alex und mia|mia und alex) (braucht|brauchen|moechte|moechten|kauft|kaufen) (zwei|2) broetchen",
        r"(es sind )?(zwei|2)( broetchen)?",
    ],
    ("bakery-picnic", "number"): [
        r"(ich|wir) (moechte|moechten|nehme|nehmen|haette|haetten) (bitte )?(gerne? )?(noch )?eine brezel( bitte)?",
    ],
    ("bakery-picnic", "pretzel"): [
        r"(zwei|2)( broetchen)?( bitte)?",
        r"(ich|wir) (moechte|moechten|nehme|nehmen|brauche|brauchen) (bitte )?(zwei|2) broetchen( bitte)?",
    ],
    ("bakery-picnic", "own-pretzel"): [
        r"(alles )?zum mitnehmen( bitte)?",
        r"(ich|wir) (moechte|moechten|nehme|nehmen) (das|alles|die bestellung)( bitte)? mit( bitte)?",
        r"(ich|wir) (moechte|moechten) (das|alles|die bestellung)( bitte)? mitnehmen( bitte)?",
    ],
    ("bakery-review", "article"): [
        r"(?:(?:auf (der|meiner) bestellung stehen |(?:ich|wir) (?:nehme|nehmen|moechte|moechten|habe|haben) (?:gerne? )?))?((zwei|2) broetchen und (eine|1) brezel|(eine|1) brezel und (zwei|2) broetchen)( bitte)?",
    ],
    ("clothing-labels", "item"): [
        r"((mia|sie) (sucht|moechte|kauft|nimmt)|ich (suche|moechte|nehme)) (eine|die) (rosa )?bluse",
        r"(eine|die) (rosa )?bluse( bitte)?",
    ],
    ("clothing-labels", "size"): [
        r"(die (rosa )?bluse|sie|die groesse) (ist|hat) (in )?(der )?(groesse )?m( da| vorhanden)?",
        r"(in )?(der )?groesse m",
    ],
    ("clothing-fitting", "color"): [
        r"((alex|er|sie) (sucht|moechte|kauft|nimmt)|ich (suche|moechte)) (eine|die) blaue jacke",
        r"(die|seine|ihre) jacke ist blau",
        r"(eine|die) blaue jacke",
    ],
    ("clothing-fitting", "size"): [
        r"(alex|er|sie|ich) (braucht|brauche|moechte|suche|sucht) (die )?groesse s",
        r"(die )?groesse s",
    ],
    ("clothing-fitting", "fitting-room"): [
        r"(die umkleide(kabine)?|sie) (ist|liegt|befindet sich) (auf der rechten seite|rechts)",
        r"(auf der rechten seite|rechts)( bitte)?",
        r"(rechts|auf der rechten seite) ist die umkleide(kabine)?",
    ],
    ("clothing-checkout", "items"): [
        r"(?:(mia|sie) (kauft|moechte|nimmt)|ich (kaufe|moechte|nehme))? ?((eine|die) (rosa )?bluse und (einen|den) (blauen )?rock|(einen|den) (blauen )?rock und (eine|die) (rosa )?bluse)",
    ],
    ("school-hello", "greeting"): [
        r"(hallo )?guten morgen( (frau|herr) [a-z]+)?",
        r"(hallo )?(frau|herr) [a-z]+ guten morgen",
    ],
    ("school-hello", "name"): [
        r"(hallo )?(ich heisse|mein name ist|ich bin) alex",
        r"(hallo )?alex ist mein name",
    ],
    ("school-hello", "age"): [
        r"(ich bin )?(14|vierzehn)( jahre( alt)?)?",
        r"(14|vierzehn) jahre alt bin ich",
    ],
    ("school-bag", "pencil-choice"): [
        r"ich habe (einen|meinen) bleistift( in (meinem|dem) maeppchen)?",
        r"in (meinem|dem) maeppchen (habe ich einen|ist ein|liegt ein) bleistift",
        r"(ein|mein) bleistift (ist|liegt) in (meinem|dem) maeppchen",
    ],
    ("school-bag", "have-pen"): [
        r"(kann|darf|koennte|duerfte) ich( mir)?( bitte)? (einen|deinen) stift (haben|bekommen|ausleihen)( bitte)?",
        r"(kannst|koenntest|wuerdest) du mir( bitte)? (einen|deinen) stift (geben|leihen|borgen)( bitte)?",
        r"leih(st du)? mir( bitte)? (einen|deinen) stift( bitte)?",
        r"ich (moechte|haette gerne?) (bitte )?einen stift( bitte)?",
    ],
    ("school-bag", "bag-location"): [
        r"(mein|das) buch (ist|liegt|befindet sich) (im|in dem|in meinem) rucksack",
        r"(im|in dem|in meinem) rucksack (ist|liegt|befindet sich) (mein|das) buch",
        r"ich habe mein buch (im|in dem|in meinem) rucksack",
    ],
    ("restaurant-order", "menu"): [
        r"(die|eine) speisekarte( bitte)?",
        r"ich (moechte|haette gerne?) (bitte )?(die|eine) speisekarte( bitte)?",
        r"(kann|koennte|darf) ich( bitte)? (die|eine) speisekarte (haben|bekommen)( bitte)?",
        r"(koennen|koennten) sie mir( bitte)? (die|eine) speisekarte (bringen|geben)( bitte)?",
    ],
    ("restaurant-order", "pizza"): [
        r"ich (moechte|nehme|bestelle|haette gerne?) (bitte )?eine pizza( bitte)?",
        r"(fuer mich )?eine pizza( bitte)?",
    ],
    ("restaurant-order", "water"): [
        r"ich (moechte|nehme|bestelle|haette gerne?) (bitte )?(ein |ein glas )?wasser( bitte)?",
        r"(ein |ein glas )?wasser( bitte)?",
        r"ich trinke( gerne?)? wasser",
    ],
    ("restaurant-requests", "table"): [
        r"(einen|ein) tisch fuer (zwei|2)( personen)?( bitte)?",
        r"(wir moechten|wir haetten gerne?|ich moechte|ich haette gerne?) (bitte )?einen tisch fuer (zwei|2)( personen)?( bitte)?",
        r"wir sind (zu zweit|zwei personen|2 personen)",
        r"(haben sie|gibt es) (einen )?tisch fuer (zwei|2)( personen)?",
    ],
    ("restaurant-requests", "without-meat"): [
        r"(ich (moechte|nehme|bestelle|haette gerne?) (bitte )?)?eine (pizza ohne fleisch|vegetarische pizza)( bitte)?",
    ],
    ("restaurant-requests", "bill"): [
        r"die rechnung( bitte)?",
        r"(ich|wir) (moechte|moechten|wuerde gerne?|wuerden gerne?) (bitte )?(be)?zahlen( bitte)?",
        r"(kann|koennte|darf) ich( bitte)? die rechnung (haben|bekommen)( bitte)?",
        r"(koennen|koennten) sie (mir|uns)( bitte)? die rechnung bringen( bitte)?",
    ],
}

# Correct noun gender variants and familiar synonyms; never fuzzy-match spelling.
VOCABULARY_VARIANTS = {
    ("electronics-devices", "phone"): ["Smartphone", "das Smartphone", "Mobiltelefon", "das Mobiltelefon"],
    ("electronics-devices", "laptop"): ["das Laptop", "Notebook", "das Notebook"],
    ("electronics-accessories", "cable"): ["Aufladekabel", "das Aufladekabel"],
}

def enrich(mission_id, step):
    patterns = PATTERNS.get((mission_id, step["id"]))
    if patterns:
        step["accepted_patterns"] = patterns
    if step.get("mode") == "vocabulary":
        step.setdefault("answers", []).extend(VOCABULARY_VARIANTS.get((mission_id, step["id"]), []))
