"""Writing: short classroom messages leading to a role self-introduction."""
from .builders import mission, text_step
ROLE={"title":"角色卡 · Alex","facts":["名字：Alex","年龄：14 岁","喜欢的课程：Deutsch","喜欢的活动：Fußball spielen"]}
SCHEDULE={"title":"Alex 的星期一","facts":["Montag：Deutsch","喜欢德语课","用两句话介绍课表和喜好"]}
NAME={"id":"name","label":"介绍名字","patterns":[r"ich heisse alex",r"mein name ist alex",r"ich bin alex",r"alex ist mein name"]}
AGE={"id":"age","label":"介绍年龄","patterns":[r"ich bin (erst |schon )?(14|vierzehn)( jahre( alt)?)?",r"(14|vierzehn) jahre alt bin ich"]}
SUBJECT={"id":"subject","label":"表达课程喜好","patterns":[r"ich (mag|liebe) deutsch( sehr| besonders| sehr gerne?| gerne?)?",r"deutsch mag ich( sehr| besonders| sehr gerne?| gerne?)?",r"ich lerne (sehr )?gerne? deutsch",r"deutsch lerne ich (sehr )?gerne?",r"mein lieblingsfach ist deutsch",r"deutsch ist mein lieblingsfach"]}
HOBBY={"id":"hobby","label":"表达活动喜好","patterns":[r"ich spiele (sehr )?gerne? fussball",r"ich spiele fussball (sehr )?gerne?",r"fussball spiele ich (sehr )?gerne?",r"am liebsten spiele ich fussball",r"ich mag fussball( spielen)?",r"mein hobby ist fussball( spielen)?",r"fussball( spielen)? ist mein hobby",r"mein lieblingssport ist fussball"]}
MONDAY={"id":"schedule","label":"说明星期一有德语课","patterns":[r"am montag (habe ich|haben wir) deutsch(unterricht)?",r"(ich habe|wir haben) am montag deutsch(unterricht)?",r"montags (habe ich|haben wir) deutsch(unterricht)?",r"(ich habe|wir haben) montags deutsch(unterricht)?"]}
def write(sid,prompt,german,example,hints,explanation,**options):
    options.setdefault("brief",ROLE)
    return text_step(sid,prompt,german,example,hints,explanation,max_length=1000,**options)
MISSIONS=[
mission("school-hello","写一句得体的回应",50,"writing","使用角色 Alex 的信息练习，不需要填写真实个人资料。",[
write("greeting","早上遇到老师，写一句合适的问候。","Du triffst deine Lehrerin am Morgen.","Guten Morgen!",
["先考虑时间：这是早上。","Morgen 是早晨，可以和 Guten 搭配。"],"Guten Morgen! 适合早上的问候。",answers=["Guten Morgen","Guten Morgen Frau Müller","Guten Morgen Herr Müller","Guten Morgen Mia"]),
write("name","同学问名字。写一句话介绍角色 Alex。","Wie heißt du?","Ich heiße Alex.",
["用 Ich 开头，选择介绍名字的动词。","也可以用 Mein Name ist …。"],"你用完整句子介绍了角色名字。",answers=["Ich heiße Alex","Mein Name ist Alex","Ich bin Alex"]),
write("age","介绍 Alex 的年龄，用数字或德语数词都可以。","Wie alt bist du?","Ich bin 14 Jahre alt.",
["这里需要 Ich bin，不是 Ich habe。","年龄后可以加 Jahre alt。"],"Ich bin 14 Jahre alt. 用 sein 表达年龄。",answers=["Ich bin 14 Jahre alt","Ich bin vierzehn Jahre alt","Ich bin 14","Ich bin vierzehn"])]),
mission("school-bag","把课堂需要写出来",50,"writing","写清自己有什么、礼貌借笔，再说明物品位置。",[
write("pencil-choice","打开笔袋，写一句“我有一支铅笔”。","Was hast du in deinem Mäppchen?","Ich habe einen Bleistift.",
["用 Ich habe 开始；Bleistift 是阳性名词。","这个句子里，用 einen Bleistift。"],"你用 habe 和 einen Bleistift 说明物品。",answers=["Ich habe einen Bleistift","In meinem Mäppchen habe ich einen Bleistift"]),
write("have-pen","你忘带笔了。写一句话，礼貌地向同桌借一支笔。","Du brauchst einen Stift. Frag höflich.","Kann ich bitte einen Stift haben?",
["用 Kann ich … haben? 表达请求。","把 bitte 放进句子，笔用 einen Stift。"],"这是可以实际使用的课堂请求。",answers=["Kann ich bitte einen Stift haben","Kann ich einen Stift haben bitte","Kannst du mir bitte einen Stift geben","Ich möchte einen Stift bitte","Ich möchte bitte einen Stift"]),
write("bag-location","告诉同学：我的书在背包里。","Wo ist dein Buch?","Mein Buch ist im Rucksack.",
["先写 Mein Buch ist，再补地点。","已经在里面，用 im Rucksack。"],"你说明了物品所在的位置。",answers=["Mein Buch ist im Rucksack","Im Rucksack ist mein Buch","Mein Buch ist in dem Rucksack"])]),
mission("school-day","写一段自我介绍",60,"writing","从两句话过渡到一段文字。先写清信息，再根据反馈修改。",[
write("day-choice","用两句话说明：星期一有德语课，而且你喜欢德语。","Erzähl von deinem Montag.","Am Montag habe ich Deutsch. Ich mag Deutsch.",
["第一句写课表，第二句表达喜好。","检查 Montag、Deutsch 和课程喜好是否都出现了。"],"两句话分别承担课表和喜好信息。",brief=SCHEDULE,rubric={"checks":[MONDAY,SUBJECT],"min_sentences":2,"max_words":60}),
write("like-sport","回答新同桌的两个问题：喜欢什么课，喜欢做什么活动？写两句话。","Was magst du? Was spielst du gern?","Ich mag Deutsch. Ich spiele gern Fußball.",
["一条信息一句话：先课程，再活动。","可以用 Ich mag … 和 Ich spiele gern …。"],"你写出了课程和活动喜好。",rubric={"checks":[SUBJECT,HOBBY],"min_sentences":2,"max_words":60}),
write("like-german","写一段 4—5 句的角色自我介绍，包含名字、年龄、课程和活动喜好。","Stell dich als Alex vor.","Hallo! Ich heiße Alex. Ich bin 14 Jahre alt. Ich mag Deutsch. Ich spiele gern Fußball.",
["对照角色卡，检查四条信息有没有写全。","每条信息用一句话；检查 bin 和 habe 的搭配。"],"你把角色信息写成了一段自我介绍。",rubric={"checks":[NAME,AGE,SUBJECT,HOBBY],"min_sentences":4,"max_words":80})])]
