"""Vocabulary: uncover clues and recall the German word."""
from .builders import mission, text_step
def riddle(sid,word,article,clues,example):
    return text_step(sid,"读线索，猜一个德语单词。","Welches Wort passt?",example,
        clues[1:]+["把线索合起来再试一次；需要时可以查看例词。"],
        f"答案是 {example}。把它和场景联系起来再记一次。",
        answers=[word]+([article+" "+word] if article else []),clues=clues,
        placeholder="输入德语单词，可带正确冠词",max_length=80)
MISSIONS=[
mission("park-discover","公园里有什么",50,"vocabulary","先读一条线索猜词。答错或请求提示会增加线索，不扣金币。",[
riddle("tree","Baum","der",["Ich bin groß. Ich habe einen Stamm und viele Blätter.","我有树干、树枝和树叶。","4 个字母，B 开头。"],"der Baum"),
riddle("red-ball","Blume","die",["Ich wachse im Garten und habe bunte Blüten.","我会开花，也可能有香味。","5 个字母，B 开头，e 结尾。"],"die Blume"),
riddle("blue-ball","Bank","die",["Du kannst auf mir sitzen und dich ausruhen.","我在公园里供人坐下休息。","4 个字母，B 开头，k 结尾。"],"die Bank")]),
mission("park-picnic","野餐物品猜词",50,"vocabulary","把物品和用途联系起来。可以只写单词，也可以带冠词。",[
riddle("under-bench","Ball","der",["Ich bin rund. Du kannst mit mir spielen.","踢、扔、接，都可以用到我。","4 个字母，B 开头，ll 结尾。"],"der Ball"),
riddle("water","Wasser","das",["Du trinkst mich, wenn du Durst hast.","我没有颜色，野餐时可以带一瓶。","6 个字母，W 开头，中间有 ss。"],"das Wasser"),
riddle("play-football","Rucksack","der",["Du trägst mich auf dem Rücken. In mir sind deine Sachen.","书和水瓶可以放在我里面。","8 个字母，R 开头。"],"der Rucksack")]),
mission("park-finale","天气与活动猜词",70,"vocabulary","把名词、动作和颜色放回情境。Mia 给线索，你负责回忆。",[
riddle("sunny","Sonne","die",["Ich scheine am Himmel und mache den Tag hell.","晴天时，天空中会看到我。","5 个字母，S 开头，中间有 nn。"],"die Sonne"),
riddle("go-park","spielen","",["Mit einem Ball oder einem Spiel: Kinder und Freunde machen das gern.","这是一个动作，意思是玩或进行游戏。","7 个字母，s 开头，en 结尾。"],"spielen"),
riddle("in-park","blau","",["Der Himmel hat an einem klaren Tag oft diese Farbe.","这是一种颜色，也常用于描述水。","4 个字母，b 开头，au 结尾。"],"blau")])]
