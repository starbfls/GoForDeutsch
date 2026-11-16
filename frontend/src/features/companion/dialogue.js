export const SCENE_GUIDES = {
  clothing: {
    welcome: "Willkommen! 来到服装店了。先读商品与对话，帮我找尺码和价格。完成这里的三个练习，还能获得新服装。",
    observe: "Welche Größe? 留意颜色、尺码和价格。先找原文的证据，再回答店员。",
    goal: "阅读 · 颜色、尺码与价格",
  },
  electronics: {
    welcome: "Hallo! 这家店里有 Handy、Laptop，还有不少熟悉的东西。读用途线索，猜猜它们的德语名字。",
    observe: "从功能想物品，再想德语名称。猜对之后，可以选择把这个词加入单词卡。",
    goal: "单词 · 电子产品猜词",
  },
  restaurant: {
    welcome: "Guten Appetit! 我们来餐厅歇一歇。用 Alex 的设定练习订位、点餐和结账，再把它们写成一段话。",
    observe: "Ich möchte … 从一句简单的点餐开始，把人数、食物、饮料和结账串起来。",
    goal: "写作 · 从点餐到完整对话",
  },
  bakery: {
    welcome:
      "Guten Tag! 这里是 Bäckerei。今天先读柜台信息，再回答店员。答案的证据就在原文里。",
    observe:
      "Schau mal! 先找问题中的关键词，再回到原文找价格、数量或去向。我给线索，你来回答店员。",
    goal: "阅读 · 读材料，回答店员",
  },
  park: {
    welcome:
      "Willkommen im Park! 看看树、长椅和水面。读线索猜单词，想不起来时再要一条线索。",
    observe:
      "根据用途或特征回忆德语单词。需要时点“再给一条线索”，不会扣金币。",
    goal: "单词 · 根据线索猜词",
  },
  school: {
    welcome:
      "Hallo! 我们到 Schule 了。今天用角色 Alex 的信息练习写话，最后完成一段自我介绍。",
    observe:
      "Ich heiße Mia. 先写一句，再写两句，最后把名字、年龄、课程和活动喜好连成一段。",
    goal: "写作 · 从一句话到自我介绍",
  },
};
export function sceneGuide(id) {
  return SCENE_GUIDES[id] || SCENE_GUIDES.bakery;
}
export function nextDestination(game) {
  const missions = game.unitMissions || [];
  const mission = missions.find((item) => !game.progress.completed.includes(item.id))
    || game.data?.missions.find((item) => item.id === game.progress.recommended);
  return game.data?.chapters.find((item) => item.id === mission?.chapter_id);
}
export function mapGreeting(game) {
  const count = game.unitCompleted;
  if (count) return "Willkommen zurück! 这个单元已完成 " + count + "/9 个练习。今天先复习，还是去下一个地点？我陪你一起选。";
  return game.activeUnit?.id === "einkaufen"
    ? "Hallo! 欢迎来到第二单元 Einkaufen。我们一起逛商场：服装店读信息，电器店猜单词，最后去餐厅写一段话。先去哪儿看看？"
    : "Guten Tag! 欢迎来到第一单元 Kennenlernen。我是 Mia。我们先看看小镇，选好地点后再一起练德语。";
}
export function mapRecommendation(game) {
  if (game.progress.completed.length === game.data?.missions.length)
    return "Gut gemacht! 两个单元都完成了。接下来可以复习单词，或者回到某个场景再独立试一次。";
  const destination = nextDestination(game);
  return "下一站可以去" + (destination?.location || "面包店") + "。先看场景，准备好再开始练习。Los geht’s!";
}
export function completionDialogue(run) {
  const independent = run.evidence.filter((item) => item.independent).length;
  return `Gut gemacht! 这次有 ${independent}/${run.evidence.length} 步独立完成。${independent === run.evidence.length ? "换一个情境，还能用出刚才的表达吗？" : "下一次可以先自己试一试，需要时我再给线索。"}`;
}
