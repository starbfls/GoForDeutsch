"""Current learner's inventory and server-priced wardrobe purchases."""
from fastapi import APIRouter,Depends
from pydantic import BaseModel,Field,ConfigDict
from app.dependencies import learner
from app.learning_store import store
from app.repositories.wardrobe import WardrobeRepository

router=APIRouter(prefix="/wardrobe",tags=["wardrobe"])
class OutfitRequest(BaseModel):
    model_config=ConfigDict(extra="forbid")
    outfit_id:str=Field(min_length=1,max_length=80)

@router.get("")
def inventory(who:str=Depends(learner)):
    return WardrobeRepository(store).snapshot(who)
@router.post("/equip")
def equip(body:OutfitRequest,who:str=Depends(learner)):
    return WardrobeRepository(store).equip(who,body.outfit_id)
@router.post("/purchase")
def purchase(body:OutfitRequest,who:str=Depends(learner)):
    return WardrobeRepository(store).purchase(who,body.outfit_id)
