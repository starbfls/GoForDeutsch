"""Server-owned outfit catalogue. Cosmetic ownership never changes teaching abilities."""
DEFAULT_OUTFIT = "school-uniform"
REWARD_OUTFIT = "pink-gingham"
REWARD_MISSIONS = ("clothing-labels", "clothing-fitting", "clothing-checkout")
OUTFITS = [
 {"id":DEFAULT_OUTFIT,"name":"默认校服","description":"最初与你一起学习的服装","price":0,"source":"default"},
 {"id":REWARD_OUTFIT,"name":"粉格便服","description":"完成服装店三个练习自动获得","price":0,"source":"clothing_reward"},
 {"id":"blue-gingham","name":"蓝格便服","description":"蓝白格纹与深蓝蝴蝶结","price":240,"source":"shop"},
 {"id":"casual-hoodie","name":"连帽常服","description":"白色连帽外套、红格内搭与波点发结","price":240,"source":"shop"},
 {"id":"pink-cardigan","name":"粉色开衫","description":"粉色针织开衫、黄色滚边与格纹裙","price":240,"source":"shop"},
]
def outfit_by_id(outfit_id):
    return next((item for item in OUTFITS if item["id"]==outfit_id),None)
