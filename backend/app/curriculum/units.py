"""Unit and scene metadata for the three skill-based gates."""
UNITS=[
{"id":"kennenlernen","number":1,"title":"Kennenlernen","available":True,"scenes":["bakery","park","school"]},
{"id":"einkaufen","number":2,"title":"Einkaufen","available":False,"scenes":[],"locations":["服装店","超市","餐厅"]}]
CHAPTERS=[
{"id":"bakery","unit_id":"kennenlernen","number":1,"title":"面包店","de":"Bäckerei","location":"面包店","description":"阅读 · 回答店员","mode":"reading","mode_label":"阅读","image":"/assets/bakery-unit1.png","expression":"smile","map":{"x":0.33,"y":0.62}},
{"id":"park","unit_id":"kennenlernen","number":2,"title":"公园","de":"Park","location":"公园","description":"单词 · 线索猜词","mode":"vocabulary","mode_label":"猜词","image":"/assets/park-unit1.png","expression":"surprised","map":{"x":0.65,"y":0.73}},
{"id":"school","unit_id":"kennenlernen","number":3,"title":"学校","de":"Schule","location":"学校","description":"写作 · 校园表达","mode":"writing","mode_label":"写作","image":"/assets/school-unit1.png","expression":"wink","map":{"x":0.565,"y":0.34}}]
LESSON_TITLES={
"bakery-first":"读懂柜台信息","bakery-picnic":"按清单回答","bakery-review":"核对订单与价格",
"park-discover":"公园里有什么","park-picnic":"野餐物品猜词","park-finale":"天气与活动猜词",
"school-hello":"写一句得体的回应","school-bag":"把课堂需要写出来","school-day":"写一段自我介绍"}
LESSON_INTROS={
"bakery-first":"先读柜台信息，再回答店员。","bakery-picnic":"读清单，替大家回答食物、数量和打包问题。","bakery-review":"读小票，核对订单和总价。",
"park-discover":"读线索，猜公园里的德语单词。","park-picnic":"根据用途猜物品，逐步获取线索。","park-finale":"回忆天气、动作和颜色。",
"school-hello":"用角色 Alex 的信息写一句校园回应。","school-bag":"把有物品、借用品和说明位置写成句子。","school-day":"先写两句话，再完成角色自我介绍。"}
