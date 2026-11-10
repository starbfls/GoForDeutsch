"""Chapter two: greetings, school supplies and a simple school day."""
MISSIONS = [
    {"id":"school-hello","title":"新同学的第一天","subtitle":"打招呼 · 介绍角色","duration":"约 5 分钟","xp":50,"skill":"自我介绍","icon":"👋",
     "intro":"欢迎来到学校！今天用角色卡上的名字 Alex 练习介绍，不需要填写你自己的真实姓名。",
     "steps":[
        {"id":"greeting","type":"choice","prompt":"早上见到老师，可以怎样打招呼？","german":"Es ist Morgen. Guten …!","skill":"日常问候",
         "options":[{"id":"morning","emoji":"🌤️","de":"Guten Morgen!","zh":"早上好"},{"id":"night","emoji":"🌙","de":"Gute Nacht!","zh":"晚安"},{"id":"bye","emoji":"👋","de":"Auf Wiedersehen!","zh":"再见"}],"answer":"morning",
         "hints":["Morgen 是早晨。想一想，哪句是在早上见面时说的？","早上可以说 Guten Morgen!"],"explanation":"Guten Morgen! 是早上见面时的问候；Gute Nacht! 通常用于睡前道晚安。"},
        {"id":"name-tiles","type":"tiles","prompt":"角色卡的名字是 Alex。排好词块，介绍这个角色。","german":"Wie heißt du?","skill":"介绍名字","tiles":["Alex.","heiße","Ich"],"answers":["Ich heiße Alex"],"example":"Ich heiße Alex.",
         "hints":["Ich 是“我”，heiße 在这里表示“叫作”。","先放 Ich，再放 heiße，最后是角色名字。"],"explanation":"Ich heiße Alex. 表示“我叫 Alex”。Mein Name ist Alex. 也是自然的说法。"},
        {"id":"age","type":"text","prompt":"角色卡写着“12 岁”。用德语介绍角色年龄。可以使用数字 12。","german":"Alex · 12 Jahre","skill":"介绍年龄","placeholder":"Ich bin …","answers":["Ich bin zwölf Jahre alt","Ich bin 12 Jahre alt","Ich bin zwölf","Ich bin 12"],"example":"Ich bin zwölf Jahre alt.",
         "hints":["年龄用 Ich bin … Jahre alt.，这里的“12”是 zwölf。","把 12 放入 Ich bin … Jahre alt. 中。"],"explanation":"Ich bin zwölf Jahre alt. 表示“我十二岁”。德语用 bin（是）表达年龄，不用 habe（有）。"}
     ]},
    {"id":"school-bag","title":"帮 Mia 整理书包","subtitle":"文具词汇 · 我有……","duration":"约 5 分钟","xp":50,"skill":"学习用品","icon":"🎒",
     "intro":"Mia 正在找上课要用的东西。一起认识铅笔、书和笔，再练习说“我有……”。",
     "steps":[
        {"id":"pencil","type":"choice","prompt":"Mia 要找一支 Bleistift。你会递给她什么？","german":"Wo ist mein Bleistift?","skill":"文具词汇","options":[{"id":"book","emoji":"📘","de":"das Buch","zh":"书"},{"id":"pencil","emoji":"✏️","de":"der Bleistift","zh":"铅笔"},{"id":"bag","emoji":"🎒","de":"der Rucksack","zh":"背包"}],"answer":"pencil",
         "hints":["Bleistift 是可以写字、也可以用橡皮擦掉的文具。","找到写着 der Bleistift 的那一项。"],"explanation":"der Bleistift 是铅笔。记单词时，把冠词 der 一起记住。"},
        {"id":"book-sentence","type":"tiles","prompt":"排好词块，说“我有一本书”。","german":"Was hast du?","skill":"表达拥有","tiles":["Buch.","ein","habe","Ich"],"answers":["Ich habe ein Buch"],"example":"Ich habe ein Buch.",
         "hints":["“我有”是 Ich habe。Buch 是中性名词。","先放 Ich habe，再放 ein Buch。"],"explanation":"Ich habe ein Buch. 表示“我有一本书”。das Buch 在这里搭配 ein。"},
        {"id":"pen-transfer","type":"text","prompt":"换成一支笔 Stift，用德语说“我有一支笔”。","german":"der Stift · 一支笔","skill":"冠词迁移","placeholder":"Ich habe …","answers":["Ich habe einen Stift","Einen Stift habe ich"],"example":"Ich habe einen Stift.",
         "hints":["Stift 是阳性名词。放在 habe 后面表示“有一支笔”时，ein 要变成 einen。","句子开头是 Ich habe einen …"],"explanation":"Ich habe einen Stift. 中，阳性名词 Stift 作宾语，所以用 einen。和 ein Buch 比较着记。"}
     ]},
    {"id":"school-day","title":"看懂今天的课表","subtitle":"星期 · 课程 · 喜好","duration":"约 5 分钟","xp":60,"skill":"校园表达","icon":"📅",
     "intro":"教室里贴着新课表。先认出星期和课程，再告诉 Mia 你喜欢的课程。",
     "steps":[
        {"id":"monday","type":"choice","prompt":"课表上的 Montag 是星期几？","german":"Montag: Deutsch und Sport","skill":"星期词汇","options":[{"id":"monday","emoji":"①","de":"Montag","zh":"星期一"},{"id":"friday","emoji":"⑤","de":"Freitag","zh":"星期五"},{"id":"sunday","emoji":"⑦","de":"Sonntag","zh":"星期日"}],"answer":"monday",
         "hints":["Montag 是一周工作日的开始。","Montag 对应星期一。"],"explanation":"Montag 是星期一。课表里 Deutsch 是德语课，Sport 是体育课。"},
        {"id":"like-sport","type":"tiles","prompt":"排好词块，说“我喜欢体育”。","german":"Was magst du?","skill":"表达喜好","tiles":["Sport.","mag","Ich"],"answers":["Ich mag Sport"],"example":"Ich mag Sport.",
         "hints":["“我喜欢”是 Ich mag。","按照“我—喜欢—体育”的顺序来排。"],"explanation":"Ich mag Sport. 表示“我喜欢体育”。把 Sport 换成 Deutsch，也可以表达喜欢德语。"},
        {"id":"like-german","type":"text","prompt":"换一门课，用德语说“我喜欢德语”。","german":"Deutsch · 德语","skill":"独立迁移","placeholder":"用刚才的句型试一试…","answers":["Ich mag Deutsch","Deutsch mag ich","Ich lerne gern Deutsch","Ich lerne gerne Deutsch"],"example":"Ich mag Deutsch.",
         "hints":["仍然可以用 Ich mag …，只需要换成 Deutsch。","把 Ich mag Sport. 里的 Sport 换成 Deutsch。"],"explanation":"Ich mag Deutsch. 把同一个表达换到新的课程上，就能说出自己的喜好。学校练习完成，可以去单词卡继续复习。"}
     ]}
]
