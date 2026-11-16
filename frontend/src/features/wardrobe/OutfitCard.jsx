import { Check, Coins } from "lucide-react";
import Mia from "@/components/Mia";
export default function OutfitCard({ item, equipped, busy, shop = false, onAction }) {
  const buying = shop && !item.owned;
  return <article className={`outfit-card ${equipped ? "is-equipped" : ""}`} data-outfit-card={item.id}>
    <div className="outfit-preview"><Mia outfit={item.id} expression="smile" /></div>
    <div className="outfit-card-body">
      <h2>{item.name}</h2>
      <p>{equipped ? <><Check size={18} /> 正在穿着</> : item.owned ? "已获得" : <><Coins size={18} /> {item.price} 金币</>}</p>
      <button className={buying ? "primary-button" : "secondary-button"} disabled={busy || equipped || (shop && item.owned)} onClick={() => onAction(item.id)}>
        {buying ? "购买服装" : equipped ? "已穿着" : shop ? "已拥有" : "换上这套"}
      </button>
    </div>
  </article>;
}
