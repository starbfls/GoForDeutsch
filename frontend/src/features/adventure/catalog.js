export const EMPTY_PROGRESS = {
  completed: [],
  xp: 0,
  evidence: [],
  recommended: "bakery-first",
  results: {},
};
export const friendlyError = (error) =>
  typeof error.response?.data?.detail === "string"
    ? error.response.data.detail
    : "暂时没有连接到学习服务。请确认启动窗口仍在运行，再重新连接。";
export const unlocked = (mission, progress) =>
  progress.available?.includes(mission.id) ||
  progress.completed.includes(mission.id) ||
  !mission.requires ||
  progress.completed.includes(mission.requires);
export const chapterMissions = (missions, chapterId) =>
  missions.filter((mission) => mission.chapter_id === chapterId);
export const nextInChapter = (missions, progress, chapterId) =>
  chapterMissions(missions, chapterId).find(
    (mission) => !progress.completed.includes(mission.id),
  ) || chapterMissions(missions, chapterId)[0];
