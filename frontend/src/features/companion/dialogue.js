export const SCENE_GUIDES = {
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
  const mission = game.data?.missions.find(
    (item) => item.id === game.progress.recommended,
  );
  return game.data?.chapters.find((item) => item.id === mission?.chapter_id);
}
export function mapGreeting(game) {
  const count = game.progress.completed.length;
  return count
    ? `Willkommen zurück! 你已经完成 ${count} 个练习。今天想先复习，还是去看看下一个地点？我陪你一起选。`
    : "Guten Tag! 欢迎来到第一单元 Kennenlernen。我是 Mia。我们先看看小镇，选好地点后再一起练德语。";
}
export function mapRecommendation(game) {
  if (game.progress.completed.length === game.data?.missions.length)
    return "Gut gemacht! 这九个练习你都完成过了。接下来可以复习单词，或者回到某个场景再独立试一次。";
  const destination = nextDestination(game);
  return `下一站可以去${destination?.location || "面包店"}。先看场景、和我聊一句，准备好再开始练习。Los geht’s!`;
}
export function completionDialogue(run) {
  const independent = run.evidence.filter((item) => item.independent).length;
  return `Gut gemacht! 这次有 ${independent}/${run.evidence.length} 步独立完成。${independent === run.evidence.length ? "换一个情境，还能用出刚才的表达吗？" : "下一次可以先自己试一试，需要时我再给线索。"}`;
}
