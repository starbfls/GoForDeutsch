"""Bounded A1 writing checks: content and recognizable sentence structures."""
import re
from .answers import normalize
def sentences(answer):
    pieces=[part.strip() for part in re.split(r"[.!?。！？\n]+",answer) if part.strip()]
    cleaned=[]
    for part in pieces:
        sentence=normalize(part)
        if sentence in {"hallo","guten tag","guten morgen"}: continue
        cleaned.append(re.sub(r"^(hallo|guten tag|guten morgen)\s+","",sentence))
    return cleaned

def assess_writing(step,answer):
    rubric=step["rubric"]
    cleaned=sentences(answer)
    checks=[];recognized=set()
    for check in rubric["checks"]:
        matches={i for i,sentence in enumerate(cleaned) if any(re.fullmatch(pattern,sentence) for pattern in check["patterns"])}
        recognized.update(matches)
        checks.append({"id":check["id"],"label":check["label"],"met":bool(matches)})
    word_count=len(re.findall(r"[^\W_]+",answer,flags=re.UNICODE))
    issues=[]
    if len(cleaned)<rubric["min_sentences"]: issues.append(f"试着分成至少 {rubric['min_sentences']} 个完整句子。")
    if word_count>rubric["max_words"]: issues.append("这次先写短一点，围绕角色卡的信息即可。")
    if re.search(r"[\u4e00-\u9fff]",answer): issues.append("正文先用德语表达，提示或问题可以另外问 Mia。")
    if len(recognized)<len(cleaned): issues.append("有一句还没识别出完整表达。检查主语、动词和句子结构，再试一次。")
    if any(not item["met"] for item in checks): issues.append("对照下面的清单，把还缺的信息补上。")
    return {"correct":all(item["met"] for item in checks) and not issues,"assessment":{"kind":"writing","criteria":checks,"word_count":word_count,"sentence_count":len(cleaned),"issues":issues,"unrecognized_sentences":len(cleaned)-len(recognized)}}
