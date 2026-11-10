export const SCENE_GUIDES = {
  bakery: {
    welcome:
      "Guten Tag! 这里是 Bäckerei。先看看柜台：你能找到 Brötchen 吗？准备好后，我们再练习点单。",
    observe:
      "Schau mal! 先分清整条 Brot、小圆面包 Brötchen 和打结的 Brezel。开始练习后，我会陪你一步步点单。",
    goal: "认识食物，练习礼貌点单",
  },
  park: {
    welcome:
      "Willkommen im Park! 看看树、长椅和水面。先找一个你认识的东西，再试着用德语描述它。",
    observe:
      "Ich sehe … 你可以从这句话开始。先观察颜色和位置，等你准备好再进入练习。",
    goal: "描述颜色、位置和活动",
  },
  school: {
    welcome:
      "Hallo! 我们到 Schule 了。今天用角色 Alex 的信息介绍自己，也认识课表和学习用品。",
    observe:
      "Ich heiße Mia. 轮到 Alex 时，可以怎样介绍？先想一句，开始练习后再试一试。",
    goal: "介绍角色，表达课程喜好",
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
