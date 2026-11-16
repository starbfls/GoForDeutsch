"""Shared constructors for authored reading, vocabulary and writing tasks."""
def text_step(sid, prompt, german, example, hints, explanation, *, answers=None, target=None, **extra):
    step = {"id":sid,"type":"text","prompt":prompt,"german":german,"example":example,"hints":hints,
            "explanation":explanation,"placeholder":"用德语写下你的回答",**extra}
    if answers is not None: step["answers"]=answers
    if target is not None: step["target"]=target
    return step

def mission(mid,title,coins,mode,intro,steps):
    for step in steps:
        step.setdefault("mode",mode)
        step.setdefault("skill",{"reading":"阅读理解","vocabulary":"词汇回忆","writing":"书面表达"}[mode])
    return {"id":mid,"title":title,"reward_coins":coins,"xp":coins,"mode":mode,"duration":"约 5 分钟",
            "skill":steps[0]["skill"],"intro":intro,"steps":steps}
