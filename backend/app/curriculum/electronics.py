"""Unit 2 vocabulary: recall electronics from purposes and clues."""
from .builders import mission, text_step
def guess(sid,word,article,clues):
    example=f"{article} {word}"
    return text_step(sid,"读线索，猜一个电子产品单词。","Welches Gerät passt?",example,
        clues[1:]+["把用途和字母线索合起来，需要时查看例词。"],f"这是 {example}，再把单词和用途联系起来。",
        answers=[word,example],clues=clues,max_length=80,placeholder="输入德语单词，可带正确冠词")
MISSIONS=[
mission("electronics-devices","日常电子产品",50,"vocabulary","从用途回忆单词，不需要认识品牌。",[
guess("phone","Handy","das",["Du kannst damit telefonieren und Nachrichten schreiben.","你可以把它放进口袋里。","5 个字母，H 开头。"]),
guess("headphones","Kopfhörer","die",["Du trägst sie an den Ohren und hörst Musik.","它们让你独自听声音。","9 个字母，K 开头，含 ö。"]),
guess("laptop","Laptop","der",["Du kannst ihn aufklappen und darauf schreiben.","可以带着走的电脑。","6 个字母，L 开头。"])]),
mission("electronics-desk","电脑桌上有什么",60,"vocabulary","根据操作方式猜电脑用品。",[
guess("keyboard","Tastatur","die",["Du schreibst damit Buchstaben am Computer.","上面有许多按键。","8 个字母，T 开头。"]),
guess("mouse","Maus","die",["Du bewegst sie auf dem Tisch und klickst damit.","这里是一种电脑用品，不是动物。","4 个字母，M 开头。"]),
guess("screen","Bildschirm","der",["Du siehst darauf Bilder und Texte.","电脑上显示内容的部分。","10 个字母，B 开头。"])]),
mission("electronics-accessories","配件与用途",70,"vocabulary","把单词放回拍照、充电和播放的情境。",[
guess("camera","Kamera","die",["Du machst damit Fotos.","你会对准想拍的东西。","6 个字母，K 开头。"]),
guess("cable","Ladekabel","das",["Du verbindest damit dein Handy mit Strom.","手机电量不足时会用到这根线。","9 个字母，L 开头。"]),
guess("speaker","Lautsprecher","der",["Musik kommt laut aus diesem Gerät.","把声音放出来给周围的人听的设备。","12 个字母，L 开头。"])])]
