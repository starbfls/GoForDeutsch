"""Chapter three: observation, a picnic and expressions used outside school."""
MISSIONS = [
    {"id":"park-discover","title":"公园里的颜色侦探","subtitle":"自然词汇 · 颜色描述","duration":"约 5 分钟","xp":50,"skill":"观察描述","icon":"🌳",
     "intro":"到公园啦！和 Mia 一起看看树、花和小球，试着用德语描述眼前的东西。",
     "steps":[
        {"id":"tree","type":"choice","prompt":"Mia 的观察清单写着 Baum。应该寻找什么？","german":"Ich sehe einen Baum.","skill":"自然词汇","options":[{"id":"tree","emoji":"🌳","de":"der Baum","zh":"树"},{"id":"flower","emoji":"🌼","de":"die Blume","zh":"花"},{"id":"ball","emoji":"⚽","de":"der Ball","zh":"球"}],"answer":"tree",
         "hints":["Baum 有树干、树枝和树叶。","找到 der Baum，也就是树。"],"explanation":"der Baum 是树，die Blume 是花。观察时可以说 Ich sehe …（我看见……）。"},
        {"id":"red-ball","type":"tiles","prompt":"线索卡上画着一个红色球。排好词块描述它。","german":"🔴 der Ball","skill":"颜色描述","tiles":["rot.","ist","Ball","Der"],"answers":["Der Ball ist rot"],"example":"Der Ball ist rot.",
         "hints":["“这个球是……”用 Der Ball ist …","先放 Der Ball，再放 ist，最后放颜色。"],"explanation":"Der Ball ist rot. 表示“球是红色的”。ist 后面的颜色词在这里不需要加词尾。"},
        {"id":"blue-ball","type":"text","prompt":"新的线索卡变成蓝色球。用德语说“球是蓝色的”。","german":"🔵 blau · 蓝色","skill":"独立描述","placeholder":"Der Ball …","answers":["Der Ball ist blau","Blau ist der Ball"],"example":"Der Ball ist blau.",
         "hints":["保留刚才的 Der Ball ist …，换掉颜色就可以。","把 rot 换成 blau。"],"explanation":"Der Ball ist blau. 你可以把物品和颜色组合起来，描述新的线索。"}
     ]},
    {"id":"park-picnic","title":"找到野餐的好位置","subtitle":"位置线索 · 礼貌请求","duration":"约 5 分钟","xp":50,"skill":"公园交流","icon":"🧺",
     "intro":"野餐前先读懂一张位置线索卡，再向 Mia 要一点水。还记得面包店里的礼貌表达吗？",
     "steps":[
        {"id":"under-bench","type":"choice","prompt":"读这张线索卡：球在哪里？不需要在背景图中找球。","german":"Der Ball liegt unter der Bank.","skill":"理解位置","options":[{"id":"under","emoji":"⬇️","de":"unter der Bank","zh":"在长椅下面"},{"id":"on","emoji":"⬆️","de":"auf der Bank","zh":"在长椅上面"},{"id":"next","emoji":"↔️","de":"neben der Bank","zh":"在长椅旁边"}],"answer":"under",
         "hints":["unter 表示“在……下面”。Bank 在这里是公园长椅。","整句的线索是 unter der Bank。"],"explanation":"unter der Bank 表示“在长椅下面”。这里 Bank 指长椅，不是银行。"},
        {"id":"water","type":"tiles","prompt":"排好词块，礼貌地说“我想要水，请”。","german":"Möchtest du etwas trinken?","skill":"礼貌请求","tiles":["bitte.","Wasser,","möchte","Ich"],"answers":["Ich möchte Wasser bitte","Ich möchte bitte Wasser"],"example":"Ich möchte Wasser, bitte.",
         "hints":["还记得面包店的 Ich möchte … 吗？这次把商品换成 Wasser。","先排 Ich möchte，再放 Wasser，最后说 bitte。"],"explanation":"Ich möchte Wasser, bitte. 可以用在野餐时请求水。这里不需要 ein。"},
        {"id":"play-football","type":"text","prompt":"角色卡喜欢踢足球。用德语说“我喜欢踢足球”。","german":"gern · 喜欢这样做 / Fußball spielen · 踢足球","skill":"表达活动喜好","placeholder":"Ich spiele …","answers":["Ich spiele gern Fußball","Ich spiele gerne Fußball","Ich spiele Fußball gern","Ich spiele Fußball gerne"],"example":"Ich spiele gern Fußball.",
         "hints":["动作“踢足球”是 Fußball spielen。用 Ich 开头时，spielen 变成 spiele。","可以按照 Ich spiele gern … 来表达。"],"explanation":"Ich spiele gern Fußball. 中，gern 表示喜欢做这件事；也可以用 gerne。"}
     ]},
    {"id":"park-finale","title":"阳光小镇的好朋友","subtitle":"天气 · 去向 · 独立表达","duration":"约 5 分钟","xp":70,"skill":"情境迁移","icon":"☀️",
     "intro":"今天的最后一段冒险：读懂天气、一起去公园，再写下一句关于大家活动的话。",
     "steps":[
        {"id":"sunny","type":"choice","prompt":"哪一句表示“太阳照耀着”，适合晴天出门？","german":"Wie ist das Wetter?","skill":"天气表达","options":[{"id":"sun","emoji":"☀️","de":"Die Sonne scheint.","zh":"太阳照耀着"},{"id":"rain","emoji":"🌧️","de":"Es regnet.","zh":"下雨了"},{"id":"snow","emoji":"🌨️","de":"Es schneit.","zh":"下雪了"}],"answer":"sun",
         "hints":["太阳是 die Sonne，scheint 表示照耀。","找包含 Sonne 的句子。"],"explanation":"Die Sonne scheint. 是描述晴天的常用句。Es regnet. 表示下雨。"},
        {"id":"go-park","type":"tiles","prompt":"排好词块，说“我们去公园”。","german":"Zusammen in den Park!","skill":"表达去向","tiles":["Park.","gehen","den","Wir","in"],"answers":["Wir gehen in den Park"],"example":"Wir gehen in den Park.",
         "hints":["“我们去”是 Wir gehen。去公园用 in den Park。","先放 Wir gehen，再接 in den Park。"],"explanation":"Wir gehen in den Park. 表示朝公园这个目的地去，使用 in den Park。"},
        {"id":"in-park","type":"text","prompt":"现在已经在公园里了。用德语说“我们在公园里玩”。","german":"wir spielen · 我们玩 / im Park · 在公园里","skill":"独立迁移","placeholder":"Wir spielen …","answers":["Wir spielen im Park","Im Park spielen wir","Wir spielen in dem Park"],"example":"Wir spielen im Park.",
         "hints":["“在公园里”是 im Park，和刚才表示去向的 in den Park 不同。","把 Wir spielen 和 im Park 组合起来。"],"explanation":"Wir spielen im Park. 表示活动发生的地点。公园练习完成，接下来可以去学校。"}
     ]}
]
