"""Reviewed A1 tasks. Public payloads deliberately exclude answer keys."""
import re
import unicodedata

MISSIONS = [
    {
        "id": "bakery-first", "title": "面包店的初次见面", "subtitle": "认识食物 · 礼貌点单",
        "duration": "约 5 分钟", "xp": 40, "skill": "购买表达", "icon": "🥐",
        "intro": "今天要和 Mia 一起准备野餐。先去面包店，试着买一个小面包吧！",
        "steps": [
            {"id": "roll", "type": "choice", "prompt": "Mia 想要一个 Brötchen。你会选哪一种？", "german": "Ein Brötchen, bitte!", "skill": "食物词汇", "options": [
                {"id": "bread", "emoji": "🍞", "de": "das Brot", "zh": "面包"},
                {"id": "roll", "emoji": "🥖", "de": "das Brötchen", "zh": "小面包"},
                {"id": "pretzel", "emoji": "🥨", "de": "die Brezel", "zh": "碱水结"}],
             "answer": "roll", "hints": ["看看词尾：Brötchen 指小面包，和 Brot 有点不一样。", "选择写着 das Brötchen 的那一项。"], "explanation": "Brot 是面包，Brötchen 是小面包。小面包的冠词是 das。"},
            {"id": "order", "type": "tiles", "prompt": "把词块排好，告诉店员：我想要一个小面包。", "german": "Was möchtest du?", "skill": "购买表达", "tiles": ["bitte", "Brötchen,", "Ich", "ein", "möchte"],
             "answers": ["Ich möchte ein Brötchen bitte", "Ich möchte bitte ein Brötchen"], "example": "Ich möchte ein Brötchen, bitte.",
             "hints": ["先说 Ich möchte（我想要），再接想买的东西。", "可以这样开头：Ich möchte ein …"], "explanation": "Ich möchte … 表示“我想要……”。das Brötchen 在这个句子中用 ein Brötchen。"},
            {"id": "independent", "type": "text", "prompt": "轮到你自己点单了！用德语买一个小面包，记得说“请”。", "german": "Guten Tag! Was möchtest du?", "skill": "独立表达", "placeholder": "试着输入你的德语点单句…", "target": "roll", "example": "Ein Brötchen, bitte.",
             "hints": ["你可以用刚学的 Ich möchte …，也可以直接说商品名称＋bitte。", "小面包是 ein Brötchen，“请”是 bitte。"], "explanation": "Ein Brötchen, bitte. 和 Ich möchte ein Brötchen, bitte. 都能完成这次点单。"},
        ],
    },
    {
        "id": "bakery-picnic", "title": "Mia 的野餐清单", "subtitle": "数量与词汇 · 换一种点单", "duration": "约 5 分钟", "xp": 50, "skill": "数量与点单", "icon": "🧺",
        "intro": "我们还需要两个小面包和一个碱水结。一起看清清单，再向店员点单吧。",
        "steps": [
            {"id": "number", "type": "choice", "prompt": "清单写着 zwei Brötchen。应该买几个小面包？", "german": "Wir brauchen zwei Brötchen.", "skill": "数量词", "options": [
                {"id": "one", "emoji": "①", "de": "eins", "zh": "一个"}, {"id": "two", "emoji": "②", "de": "zwei", "zh": "两个"}, {"id": "three", "emoji": "③", "de": "drei", "zh": "三个"}], "answer": "two", "hints": ["eins、zwei、drei 分别是 1、2、3。", "zwei 表示两个。"], "explanation": "zwei 是 2。Brötchen 的单数和复数形式相同：ein Brötchen、zwei Brötchen。"},
            {"id": "pretzel", "type": "tiles", "prompt": "换一种食物：我想要一个碱水结，请。", "german": "Eine Brezel? Sehr gern!", "skill": "冠词与表达", "tiles": ["eine", "bitte", "möchte", "Brezel,", "Ich"], "answers": ["Ich möchte eine Brezel bitte", "Ich möchte bitte eine Brezel"], "example": "Ich möchte eine Brezel, bitte.", "hints": ["Brezel 的冠词是 die，这里要用 eine。", "Ich möchte eine …"], "explanation": "die Brezel 在这个点单句中用 eine Brezel。不同食物的冠词需要一起记。"},
            {"id": "own-pretzel", "type": "text", "prompt": "不用词块，独立向店员买一个碱水结，并说“请”。", "german": "Was möchtest du noch?", "skill": "独立表达", "placeholder": "用德语写出你的点单句…", "target": "pretzel", "example": "Eine Brezel, bitte.", "hints": ["可以用 Eine Brezel, … 这样简短的说法。", "补上礼貌用语 bitte。"], "explanation": "Eine Brezel, bitte. 是自然、简短的点单表达。"},
        ],
    },
    {
        "id": "bakery-review", "title": "独立采购小挑战", "subtitle": "换个情境 · 检查是否记住", "duration": "约 4 分钟", "xp": 60, "skill": "迁移与复习", "icon": "🌟",
        "intro": "Mia 在公园等你。这一次你自己去买东西，看看还能记住哪些表达！",
        "steps": [
            {"id": "article", "type": "choice", "prompt": "小面包前面应该用哪个冠词？", "german": "___ Brötchen", "skill": "名词冠词", "options": [
                {"id": "der", "emoji": "🔵", "de": "der", "zh": "阳性"}, {"id": "die", "emoji": "🟠", "de": "die", "zh": "阴性"}, {"id": "das", "emoji": "🟢", "de": "das", "zh": "中性"}], "answer": "das", "hints": ["回想一下：ein Brötchen。它是中性名词。", "正确搭配是 das Brötchen。"], "explanation": "把冠词和名词一起记：das Brötchen、die Brezel、das Brot。"},
            {"id": "two-rolls", "type": "text", "prompt": "现在要买两个小面包。用德语点单，并说“请”。", "german": "Für dich und Mia!", "skill": "数量与表达", "target": "two-rolls", "placeholder": "注意：这次要两个…", "example": "Zwei Brötchen, bitte.", "hints": ["“两个”是 zwei；Brötchen 的复数形式不变。", "可以说 Zwei Brötchen, …"], "explanation": "Zwei Brötchen, bitte. 把学过的购买表达换成数量，就能提出新的需求。"},
            {"id": "bread-transfer", "type": "text", "prompt": "最后换一种商品：买一个面包 Brot，并说“请”。", "german": "Und für das Picknick?", "skill": "迁移表达", "target": "bread", "placeholder": "试着把句子中的食物换成 Brot…", "example": "Ein Brot, bitte.", "hints": ["Brot 和 Brötchen 都是中性名词，可以用 ein。", "试试 Ein Brot, …"], "explanation": "Ein Brot, bitte. 你已经能把同一种表达用到不同商品上了。"},
        ],
    },
]

VOCABULARY = [
    {"de": "das Brötchen", "zh": "小面包", "emoji": "🥖", "example": "Ein Brötchen, bitte."},
    {"de": "die Brezel", "zh": "碱水结", "emoji": "🥨", "example": "Ich möchte eine Brezel."},
    {"de": "das Brot", "zh": "面包", "emoji": "🍞", "example": "Ein Brot, bitte."},
    {"de": "ich möchte", "zh": "我想要", "emoji": "💬", "example": "Ich möchte zwei Brötchen."},
    {"de": "bitte", "zh": "请；不客气", "emoji": "🌷", "example": "Eine Brezel, bitte."},
    {"de": "zwei", "zh": "二；两个", "emoji": "✌️", "example": "Zwei Brötchen, bitte."},
]


def normalize(text):
    text = unicodedata.normalize("NFKC", text).lower().replace("ö", "oe").replace("ü", "ue").replace("ä", "ae").replace("ß", "ss")
    return " ".join(re.sub(r"[^a-z0-9\s]", " ", text).split())


def check_answer(step, answer):
    value = normalize(answer)
    if step["type"] == "choice":
        return value == step["answer"]
    if step["type"] == "tiles":
        return value in {normalize(a) for a in step["answers"]}
    products = {"roll": "ein broetchen", "pretzel": "eine brezel", "two-rolls": "zwei broetchen", "bread": "ein brot"}
    noun = products[step["target"]]
    # Accept reviewed natural alternatives, not substring matches that accept negatives.
    variants = [f"{noun} bitte", f"bitte {noun}"]
    for prefix in ["ich moechte", "ich haette gern", "ich haette gerne", "ich nehme"]:
        variants.extend([f"{prefix} {noun} bitte", f"{prefix} bitte {noun}"])
    for greeting in ["", "guten tag ", "hallo "]:
        if value in {greeting + v for v in variants}:
            return True
    return False


def mission_by_id(mission_id):
    return next((m for m in MISSIONS if m["id"] == mission_id), None)


def public_step(step):
    private = {"answer", "answers", "target", "hints", "example", "explanation"}
    return {k: v for k, v in step.items() if k not in private}


def public_missions():
    return [{**{k: v for k, v in m.items() if k != "steps"}, "steps_count": len(m["steps"])} for m in MISSIONS]
