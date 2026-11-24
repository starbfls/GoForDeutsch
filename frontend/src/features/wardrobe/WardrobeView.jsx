import { ArrowRight, LockKeyhole, Shirt } from "lucide-react";
import { useWardrobe } from "@/context/WardrobeContext";
import OutfitCard from "./OutfitCard";
import "./wardrobe.css";

export default function WardrobeView({ game, shop = false }) {
  const { inventory, busy, error, equip, purchase, refresh } = useWardrobe();
  const items = inventory.catalog.filter((item) => shop ? item.source !== "default" : item.owned);
  const act = async (id) => {
    const success = await (shop ? purchase(id) : equip(id));
    if (success) {
      game.setToast(shop ? "服装已放入背包。" : "Mia 服装已更换。");
      if (shop) await game.load();
    }
  };
  return <div className="wardrobe-view">
    {error && <div className="connection-error" role="alert"><span>{error}</span><button onClick={refresh}>重试</button></div>}
    {shop && !inventory.shop_unlocked ? <section className="shop-locked">
      <LockKeyhole size={32} /><h2>完成服装店，开启商店</h2>
      <p>服装店 {inventory.unlock_completed}/{inventory.unlock_total} · 通关获得粉格常服</p>
      <button className="primary-button" onClick={() => game.selectUnit("einkaufen")}>去服装店看看 <ArrowRight size={20} /></button>
    </section> : <>
      <div className="wardrobe-heading"><p><Shirt size={21} />{shop ? "用学习获得的金币，为 Mia 挑选服装。" : "选择服装，为 Mia 换装。"}</p>
      <button className="text-button" onClick={() => game.navigate(shop ? "backpack" : "shop")}>{shop ? "打开背包" : "逛逛商店"}<ArrowRight size={18} /></button></div>
      {inventory.catalog.length === 0 && !error && <p role="status">正在打开背包…</p>}
      <div className="outfit-grid">{items.map((item) => <OutfitCard key={item.id} item={item} equipped={inventory.equipped === item.id} busy={busy} shop={shop} onAction={act} />)}</div>
    </>}
  </div>;
}
