"""Reading: locate text evidence, then answer the bakery clerk."""
from .builders import mission, text_step
COUNTER={"title":"柜台上的信息","lines":[
"Mia: Ich möchte ein Brötchen für mich.",
"Ein Brötchen kostet 1 Euro. Eine Brezel kostet 2 Euro.",
"Auf Mias Liste stehen zwei Brötchen: eins für Mia, eins für Alex.",
"Die Bäckerei ist heute bis 16 Uhr geöffnet."]}
SHOPPING={"title":"野餐清单","lines":[
"Mia und Alex kaufen für ein Picknick ein.",
"Auf der Liste stehen eine Brezel und zwei Brötchen.",
"Die Brezel kostet 2 Euro. Zwei Brötchen kosten zusammen 2 Euro.",
"Sie nehmen alles mit. Sie essen später im Park."]}
RECEIPT={"title":"核对小票","lines":[
"Bestellung: zwei Brötchen und eine Brezel.",
"Das Essen kostet zusammen 4 Euro.",
"Eine Flasche Wasser kostet 1 Euro.",
"Mit Wasser kostet die Bestellung insgesamt 5 Euro."]}
def reading(sid,prompt,german,example,hints,explanation,passage,line,**options):
    return text_step(sid,prompt,german,example,hints,explanation,passage=passage,
                     evidence_line=line,speaker="店员",max_length=300,**options)
MISSIONS=[
mission("bakery-first","读懂柜台信息",40,"reading","先读柜台信息，再回答店员。价格和数量可以用数字。",[
reading("roll","按 Mia 的想法回答店员，记得礼貌点单。","Was möchtest du?","Ein Brötchen, bitte.",
["先看第 1 行：Mia 想买哪一种食物？","用食物名称点单，句末加 bitte。"],"第 1 行写着 ein Brötchen。你读懂了 Mia 的选择。",COUNTER,1,target="roll"),
reading("order","读价格牌，回答一个小面包多少钱。","Wie viel kostet ein Brötchen?","Ein Euro.",
["回到第 2 行，找 Brötchen 后面的价格。","只写数字和 Euro 也可以。"],"第 2 行的证据是“1 Euro”。",COUNTER,2,
answers=["Ein Euro","1 Euro","Einen Euro","Es kostet einen Euro","Ein Brötchen kostet einen Euro"]),
reading("independent","根据清单回答店员需要几个小面包。","Wie viele Brötchen braucht Mia?","Zwei Brötchen.",
["数量在第 3 行，先找 Brötchen 前面的词。","Wie viele 问的是数量。"],"第 3 行写着 zwei Brötchen。价格和数量是不同信息。",COUNTER,3,
answers=["Zwei","2","Zwei Brötchen","2 Brötchen","Mia braucht zwei Brötchen","Wir brauchen zwei Brötchen"])]),
mission("bakery-picnic","按清单回答",50,"reading","读清单，替大家回答食物、数量和打包问题。",[
reading("number","除了小面包，清单上还要什么？礼貌回答。","Was möchtest du noch?","Eine Brezel, bitte.",
["看第 2 行，还有一种打结的面包。","用清单上的食物名称，再加 bitte。"],"清单里还有 eine Brezel。",SHOPPING,2,target="pretzel"),
reading("pretzel","店员确认数量。按清单回答，不要改成一个。","Ein oder zwei Brötchen?","Zwei Brötchen, bitte.",
["第 2 行写着数量，先找到 Brötchen。","ein 是一个，zwei 是两个。"],"清单的数量是 zwei Brötchen。",SHOPPING,2,target="two-rolls"),
reading("own-pretzel","店员问要打包还是堂食。根据最后一行回答。","Zum Mitnehmen oder hier essen?","Zum Mitnehmen, bitte.",
["第 4 行说，他们之后会在公园吃。","Zum Mitnehmen 用于打包带走。"],"第 4 行的“nehmen alles mit”说明要打包。",SHOPPING,4,
answers=["Zum Mitnehmen","Zum Mitnehmen bitte","Mitnehmen bitte","Wir nehmen alles mit","Wir möchten alles mitnehmen"])]),
mission("bakery-review","核对订单与价格",60,"reading","读小票，核对食物和总价。Mia 陪你找证据，由你回答。",[
reading("article","读小票，告诉店员买了哪两种食物。","Was steht auf der Bestellung?","Zwei Brötchen und eine Brezel.",
["第 1 行有两种食物，用 und 连起来。","注意每种食物前的数量。"],"第 1 行写着 zwei Brötchen und eine Brezel。",RECEIPT,1,
answers=["Zwei Brötchen und eine Brezel","Eine Brezel und zwei Brötchen","2 Brötchen und 1 Brezel"]),
reading("two-rolls","只算食物，不含水。读小票回答。","Was kostet das Essen zusammen?","Vier Euro.",
["问题说 das Essen，先看第 2 行。","第 4 行是含水总价，不是这题问的价格。"],"第 2 行是食物价格：4 Euro。",RECEIPT,2,
answers=["Vier Euro","4 Euro","Das Essen kostet vier Euro","Es kostet vier Euro","Zusammen vier Euro"]),
reading("bread-transfer","现在把一瓶水也算进去，回答最终总价。","Was kostet alles mit Wasser?","Fünf Euro.",
["这次包含 mit Wasser，要读第 4 行。","把第 2 行和第 3 行的金额相加检查。"],"第 4 行的 insgesamt 表示总计：5 Euro。",RECEIPT,4,
answers=["Fünf Euro","5 Euro","Es kostet fünf Euro","Alles kostet fünf Euro","Insgesamt fünf Euro","Zusammen fünf Euro"])])]
