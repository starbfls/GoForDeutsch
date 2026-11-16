"""Reviewed unit 2 vocabulary and mnemonic material."""
DATA=[
("clothes-blouse","clothing","die Bluse","衬衫","Mia möchte eine rosa Bluse.","Bluse 联想到轻薄的女士衬衫，记住 die Bluse。","Mia 想要一件粉色衬衫。"),
("clothes-skirt","clothing","der Rock","裙子","Der Rock ist blau.","Rock 在这里是裙子；把白色腰带和蓝裙联系起来。","这条裙子是蓝色的。"),
("clothes-size","clothing","die Größe","尺码","Ich brauche Größe M.","groß 是大，Größe 表示大小或尺码。","我需要 M 码。"),
("clothes-jacket","clothing","die Jacke","夹克","Die Jacke ist blau.","想到出门穿上的夹克：die Jacke。","夹克是蓝色的。"),
("clothes-pink","clothing","rosa","粉色的","Die Bluse ist rosa.","把 rosa 和这次获得的粉格便服联系起来。","衬衫是粉色的。"),
("clothes-right","clothing","rechts","在右边","Die Umkleide ist rechts.","把 rechts 和试衣间右侧的方向联系起来。","试衣间在右边。"),
("tech-phone","electronics","das Handy","手机","Mein Handy ist hier.","能握在手里的手机：das Handy。","我的手机在这里。"),
("tech-headphones","electronics","die Kopfhörer","耳机","Die Kopfhörer sind blau.","Kopf 是头，hören 是听；把耳机戴在头上。","耳机是蓝色的。"),
("tech-laptop","electronics","der Laptop","笔记本电脑","Der Laptop ist klein.","想到可以合上再带走的电脑。","笔记本电脑很小。"),
("tech-keyboard","electronics","die Tastatur","键盘","Ich schreibe mit der Tastatur.","Taste 是按键，许多按键组成 Tastatur。","我用键盘打字。"),
("tech-mouse","electronics","die Maus","鼠标","Die Maus liegt auf dem Tisch.","Maus 也指老鼠；这里记住电脑桌上的鼠标。","鼠标在桌上。"),
("tech-screen","electronics","der Bildschirm","屏幕","Auf dem Bildschirm ist ein Bild.","Bild 是图像，屏幕用来显示图像。","屏幕上有一张图。"),
("tech-camera","electronics","die Kamera","相机","Ich mache Fotos mit der Kamera.","把 Kamera 与拍照片的动作联系起来。","我用相机拍照。"),
("tech-cable","electronics","das Ladekabel","充电线","Ich brauche ein Ladekabel.","laden 是充电，Kabel 是线。","我需要一根充电线。"),
("tech-speaker","electronics","der Lautsprecher","扬声器","Der Lautsprecher spielt Musik.","laut 是大声，sprechen 是说话；设备把声音放出来。","扬声器在播放音乐。"),
("food-menu","restaurant","die Speisekarte","菜单","Die Speisekarte, bitte.","Speise 是食物，Karte 是卡或单；合起来是菜单。","请给我菜单。"),
("food-pizza","restaurant","die Pizza","披萨","Ich möchte eine Pizza.","把 Pizza 和盘子里的披萨联系起来。","我想要一份披萨。"),
("food-table","restaurant","der Tisch","桌子","Einen Tisch für zwei, bitte.","想象给两位客人准备好的餐桌。","请给一张两人桌。"),
("food-meat","restaurant","das Fleisch","肉","Eine Pizza ohne Fleisch, bitte.","把 ohne Fleisch 和不加肉的餐食要求联系起来。","请给一份不加肉的披萨。"),
("food-bill","restaurant","die Rechnung","账单","Die Rechnung, bitte.","rechnen 是计算，Rechnung 是计算后给出的账单。","请结账。"),
("food-pay","restaurant","bezahlen","付钱；结账","Ich möchte bezahlen.","在餐厅结束用餐时使用 bezahlen。","我想结账。")]
VOCABULARY=[{"id":cid,"chapter_id":chapter,"de":de,"zh":zh,"example":example,"mnemonic":memory,"example_zh":translation,"emoji":""} for cid,chapter,de,zh,example,memory,translation in DATA]
