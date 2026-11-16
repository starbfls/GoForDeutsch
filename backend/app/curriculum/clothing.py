"""Unit 2 reading: understand labels, fitting information and a receipt."""
from .builders import mission, text_step
LABELS={"title":"服装标签","lines":["Mia sucht eine rosa Bluse.","Die Bluse ist in Größe M da.","Die Bluse kostet 24 Euro.","Ein blauer Rock kostet 26 Euro."]}
FITTING={"title":"试衣信息","lines":["Alex sucht eine blaue Jacke.","Alex braucht Größe S.","Die blaue Jacke in Größe S kostet 35 Euro.","Die Umkleide ist rechts."]}
RECEIPT={"title":"Mia 的购物小票","lines":["Mia kauft eine rosa Bluse und einen blauen Rock.","Die Bluse kostet 24 Euro.","Der Rock kostet 26 Euro.","Zusammen kostet alles 50 Euro."]}
def read(sid,prompt,question,example,answers,passage,line,hints):
    return text_step(sid,prompt,question,example,hints,f"信息在第 {line} 行，核对物品、尺码和价格。",answers=answers,passage=passage,evidence_line=line,speaker="店员",max_length=300)
MISSIONS=[
mission("clothing-labels","读懂服装标签",50,"reading","先读标签，再替 Mia 回答。",[
read("item","Mia 想买什么？","Was sucht Mia?","Eine rosa Bluse.",["Eine rosa Bluse","Eine Bluse","Mia sucht eine rosa Bluse","Sie sucht eine Bluse"],LABELS,1,["第 1 行描述 Mia 的选择。","Bluse 是衬衫，rosa 是粉色。"]),
read("size","这件衬衫有什么尺码？","Welche Größe ist da?","Größe M.",["M","Größe M","Die Bluse ist in Größe M da"],LABELS,2,["找 Größe 后面的字母。","尺码可以直接用字母回答。"]),
read("price","衬衫多少钱？","Wie viel kostet die Bluse?","24 Euro.",["24 Euro","Vierundzwanzig Euro","Die Bluse kostet 24 Euro","Sie kostet 24 Euro"],LABELS,3,["第 3 行是 Bluse 的价格。","别把 Rock 的价格当作 Bluse。"])]),
mission("clothing-fitting","找到合适尺码",60,"reading","读懂 Alex 的需求，再找到试衣间。",[
read("color","Alex 要什么颜色的夹克？","Welche Farbe möchte Alex?","Blau.",["Blau","Eine blaue Jacke","Alex möchte eine blaue Jacke","Die Jacke ist blau"],FITTING,1,["看第 1 行的颜色。","这里 blau 会变成 blaue。"]),
read("size","Alex 需要哪个尺码？","Welche Größe braucht Alex?","Größe S.",["S","Größe S","Alex braucht Größe S"],FITTING,2,["第 2 行给出尺码。","S 和 M 是不同尺码。"]),
read("fitting-room","试衣间在哪里？","Wo ist die Umkleide?","Rechts.",["Rechts","Die Umkleide ist rechts","Sie ist rechts"],FITTING,4,["最后一行是方向。","rechts 表示右边。"])]),
mission("clothing-checkout","核对小票，获得新服装",70,"reading","核对 Mia 的服装。完成服装店三个练习后获得粉格便服并解锁商店。",[
read("items","Mia 买了哪两件衣服？","Was kauft Mia?","Eine Bluse und einen Rock.",["Eine Bluse und einen Rock","Eine Bluse und ein Rock","Mia kauft eine Bluse und einen Rock","Eine rosa Bluse und einen blauen Rock"],RECEIPT,1,["第 1 行有两件衣服。","用 und 把 Bluse 与 Rock 连起来。"]),
read("skirt-price","裙子多少钱？","Wie viel kostet der Rock?","26 Euro.",["26 Euro","Sechsundzwanzig Euro","Der Rock kostet 26 Euro"],RECEIPT,3,["只看 Rock 的一行。","第 4 行是总价。"]),
read("total","两件衣服一共多少钱？","Wie viel kostet alles zusammen?","50 Euro.",["50 Euro","Fünfzig Euro","Alles kostet 50 Euro","Zusammen 50 Euro"],RECEIPT,4,["zusammen 表示合计。","24 加 26，核对最后一行。"])])]
