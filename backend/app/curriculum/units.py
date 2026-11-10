"""Units organize scenes; lesson and card identifiers remain stable."""
UNITS = [
    {"id":"kennenlernen","number":1,"title":"Kennenlernen","available":True,"scenes":["bakery","park","school"]},
    {"id":"einkaufen","number":2,"title":"Einkaufen","available":False,"scenes":[],"locations":["服装店","超市","餐厅"]},
]
CHAPTERS = [
    {"id":"bakery","unit_id":"kennenlernen","number":1,"title":"面包店","de":"Bäckerei","location":"面包店","description":"食物与点单","image":"/assets/bakery-unit1.png","expression":"smile","map":{"x":0.27,"y":0.58}},
    {"id":"park","unit_id":"kennenlernen","number":2,"title":"公园","de":"Park","location":"公园","description":"颜色与位置","image":"/assets/park-unit1.png","expression":"surprised","map":{"x":0.73,"y":0.61}},
    {"id":"school","unit_id":"kennenlernen","number":3,"title":"学校","de":"Schule","location":"学校","description":"校园交流","image":"/assets/school-unit1.png","expression":"wink","map":{"x":0.63,"y":0.24}},
]
LESSON_TITLES = {
 "bakery-first":"认识食物","bakery-picnic":"数量与点单","bakery-review":"独立点单",
 "park-discover":"颜色与物品","park-picnic":"位置与请求","park-finale":"天气与去向",
 "school-hello":"自我介绍","school-bag":"学习用品","school-day":"课程与喜好",
}

LESSON_INTROS = {
 "bakery-first":"先认识食物，再练习点单。","bakery-picnic":"看清数量，练习买不同的食物。","bakery-review":"这次独立完成点单。",
 "park-discover":"观察物品，用德语描述颜色。","park-picnic":"读懂位置线索，再练习请求。","park-finale":"描述天气和活动地点。",
 "school-hello":"使用角色 Alex 的信息练习介绍。","school-bag":"认识文具，练习表达“我有……”。","school-day":"看课表，表达课程喜好。",
}
