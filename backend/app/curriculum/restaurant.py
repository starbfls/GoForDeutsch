"""Unit 2 writing: short restaurant requests to a four-part dining exchange."""
from .builders import mission,text_step
BRIEF={"title":"餐厅任务卡","facts":["Alex 和 Mia 两人用餐","餐食：不加肉的 Pizza","饮料：Wasser","从入座到结账，写清自己的需要"]}
def write(sid,prompt,question,example,hints,answers=None,rubric=None):
    extra={"brief":BRIEF,"max_length":1000}
    if rubric:extra["rubric"]=rubric
    return text_step(sid,prompt,question,example,hints,"表达清楚了自己的用餐需要，再试着换个场景使用。",answers=answers,**extra)
TABLE={"id":"table","label":"说明两人用餐","patterns":[r"wir sind (zu zweit|zwei personen|2 personen)",r"einen tisch fuer (zwei|2)( personen)?( bitte)?",r"(wir moechten|wir haetten gerne?|ich moechte|ich haette gerne?) (bitte )?einen tisch fuer (zwei|2)( personen)?( bitte)?"]}
PIZZA={"id":"food","label":"点一份披萨","patterns":[r"ich (moechte|nehme|bestelle|haette gerne?) (bitte )?eine (pizza( ohne fleisch)?|vegetarische pizza)( bitte)?",r"eine (pizza( ohne fleisch)?|vegetarische pizza)( bitte)?"]}
VEGGIE={"id":"vegetarian","label":"说明不要加肉","patterns":[r"(ich (moechte|nehme|bestelle|haette gerne?) (bitte )?)?eine (pizza ohne fleisch|vegetarische pizza)( bitte)?"]}
WATER={"id":"drink","label":"点水","patterns":[r"ich trinke( gerne?)? wasser",r"ich (moechte|nehme|bestelle|haette gerne?) (bitte )?(ein |ein glas )?wasser( bitte)?",r"(ein |ein glas )?wasser( bitte)?"]}
BILL={"id":"bill","label":"请求结账","patterns":[r"die rechnung( bitte)?",r"ich moechte( bitte)? (be)?zahlen",r"(kann|koennte|darf) ich( bitte)? die rechnung (haben|bekommen)( bitte)?",r"(koennen|koennten) sie (mir|uns)( bitte)? die rechnung bringen( bitte)?"]}
MISSIONS=[
mission("restaurant-order","写一句点餐回应",50,"writing","先用短句表达，礼貌用语可以灵活放置。",[
write("menu","向服务员要菜单。","Du möchtest die Speisekarte.","Die Speisekarte, bitte.",["先找到菜单的德语单词。","可以直接说名词，也可以用 Ich möchte …。"],["Die Speisekarte bitte","Ich möchte die Speisekarte","Kann ich bitte die Speisekarte haben"]),
write("pizza","写一句话点一份披萨。","Was möchtest du essen?","Ich möchte eine Pizza.",["用 Ich möchte 表达想要。","Pizza 前可以用 eine。"],["Ich möchte eine Pizza","Eine Pizza bitte","Ich nehme eine Pizza","Ich hätte gern eine Pizza"]),
write("water","写一句话点水。","Was möchtest du trinken?","Ein Wasser, bitte.",["喝的东西是 Wasser。","也可以用 Ich möchte …。"],["Ein Wasser bitte","Wasser bitte","Ich möchte Wasser","Ich möchte ein Wasser","Ich nehme ein Wasser"])]),
mission("restaurant-requests","把用餐需要写清楚",60,"writing","写明人数、餐食要求和结账请求。",[
write("table","你和 Mia 两人用餐，请求一张两人桌。","Ihr seid zwei Personen.","Einen Tisch für zwei Personen, bitte.",["先写 Tisch，再补人数。","für zwei Personen 表示供两人使用。"],["Einen Tisch für zwei Personen bitte","Einen Tisch für zwei bitte","Wir möchten einen Tisch für zwei Personen","Wir sind zu zweit"]),
write("without-meat","点一份不要加肉的披萨。","Du möchtest eine Pizza ohne Fleisch.","Eine Pizza ohne Fleisch, bitte.",["ohne 表示没有、不加。","说明 Pizza 和 ohne Fleisch。"],["Eine Pizza ohne Fleisch bitte","Ich möchte eine Pizza ohne Fleisch","Ich nehme eine Pizza ohne Fleisch"]),
write("bill","吃完后，写一句话请求结账。","Ihr möchtet bezahlen.","Die Rechnung, bitte.",["Rechnung 是账单。","也可以用 bezahlen 表达结账。"],["Die Rechnung bitte","Ich möchte bezahlen","Ich möchte bitte bezahlen","Kann ich bitte die Rechnung haben"])]),
mission("restaurant-conversation","写一段餐厅对话",70,"writing","从两句点餐过渡到从入座到结账的完整表达。",[
write("two-lines","用两句话点披萨和水。","Bestell Essen und ein Getränk.","Ich möchte eine Pizza. Ich trinke Wasser.",["一句说餐食，一句说饮料。","检查 Pizza 和 Wasser 都有没有表达。"],rubric={"checks":[PIZZA,WATER],"min_sentences":2,"max_words":60}),
write("three-lines","用三句话说明人数、不要加肉的披萨和饮料。","Erkläre eure Bestellung.","Wir sind zu zweit. Ich möchte eine Pizza ohne Fleisch. Ich trinke Wasser.",["先人数，再餐食要求，最后饮料。","不要加肉用 ohne Fleisch。"],rubric={"checks":[TABLE,VEGGIE,WATER],"min_sentences":3,"max_words":75}),
write("dining","写四句话：从两人入座、点餐和饮料，到最后请求结账。","Schreib eure Sätze vom Ankommen bis zum Bezahlen.","Wir sind zu zweit. Ich möchte eine Pizza ohne Fleisch. Ich trinke Wasser. Die Rechnung, bitte.",["按用餐顺序写四句话。","对照任务卡，检查人数、餐食、饮料和结账。"],rubric={"checks":[TABLE,VEGGIE,WATER,BILL],"min_sentences":4,"max_words":90})])]
