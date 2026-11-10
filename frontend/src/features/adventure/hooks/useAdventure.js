import { useCallback, useEffect, useRef, useState } from "react";
import { learningApi } from "@/services/api";
import { sceneGuide, completionDialogue } from "@/features/companion/dialogue";
import { EMPTY_PROGRESS, friendlyError } from "../catalog";

const GREETING = "选择一个地点开始练习。";
const pause = (duration) =>
  new Promise((resolve) => setTimeout(resolve, duration));

export default function useAdventure(user) {
  const [page, setPage] = useState("town");
  const [data, setData] = useState(null);
  const [progress, setProgress] = useState(EMPTY_PROGRESS);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(false);
  const [motion, setMotion] = useState(
    () => localStorage.getItem("gfd-motion") !== "off",
  );
  const [run, setRun] = useState(null);
  const [mission, setMission] = useState(null);
  const [selected, setSelected] = useState("");
  const [tiles, setTiles] = useState([]);
  const [text, setText] = useState("");
  const [question, setQuestion] = useState("");
  const [askOpen, setAskOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [pending, setPending] = useState(null);
  const [speech, setSpeech] = useState(GREETING);
  const [expression, setExpression] = useState("smile");
  const [toast, setToast] = useState("");
  const [scene, setScene] = useState(null);
  const [travel, setTravel] = useState(null);
  const inflight = useRef(false);
  const loadVersion = useRef(0);
  const load = useCallback(async () => {
    const version = ++loadVersion.current;
    setLoading(true);
    setError("");
    try {
      const { data: result } = await learningApi.bootstrap();
      if (version !== loadVersion.current) return;
      setData(result);
      setProgress(result.progress);
    } catch (err) {
      if (version === loadVersion.current) setError(friendlyError(err));
    } finally {
      if (version === loadVersion.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load, user]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  const resetInputs = () => {
    setSelected("");
    setTiles([]);
    setText("");
    setQuestion("");
    setFeedback(null);
    setAskOpen(false);
  };
  const start = async (chosen) => {
    if (inflight.current || !chosen) return;
    const destination = data.chapters.find(
      (item) => item.id === chosen.chapter_id,
    );
    if (!destination) return;
    inflight.current = true;
    setBusy(true);
    try {
      const { data: result } = await learningApi.start(chosen.id);
      setRun(result);
      setMission(chosen);
      setScene(destination);
      setPending(null);
      resetInputs();
      setSpeech(result.message);
      setExpression(destination.expression);
      setPage("lesson");
    } catch (err) {
      setToast(friendlyError(err));
    } finally {
      inflight.current = false;
      setBusy(false);
    }
  };
  const enterScene = async (destination) => {
    if (inflight.current || !destination) return;
    inflight.current = true;
    setBusy(true);
    const fromMap = page === "town";
    const animate =
      motion && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (fromMap) setTravel(destination);
    const image = new Image();
    image.src = destination.image;
    try {
      if (fromMap && animate) await pause(950);
      setRun(null);
      setMission(null);
      setScene(destination);
      setPending(null);
      resetInputs();
      setSpeech(sceneGuide(destination.id).welcome);
      setExpression("smile");
      setPage("lesson");
    } finally {
      inflight.current = false;
      setBusy(false);
      setTravel(null);
    }
  };
  const turn = async (action) => {
    if (!run || inflight.current || pending) return;
    inflight.current = true;
    setBusy(true);
    setFeedback(null);
    const answer =
      run.step.type === "choice"
        ? selected
        : run.step.type === "tiles"
          ? tiles.map((i) => run.step.tiles[i]).join(" ")
          : text;
    try {
      const { data: result } = await learningApi.turn({
        run_id: run.run_id,
        revision: run.revision,
        action,
        answer,
        question,
      });
      setSpeech(result.tutor.message);
      setExpression(result.tutor.expression);
      setProgress(result.progress);
      if (result.tutor.notice) setToast(result.tutor.notice);
      setFeedback({
        correct: result.correct,
        action,
        source: result.tutor.source,
        strategy: result.tutor.strategy,
      });
      if (result.correct) setPending(result);
      else setRun(result);
      setQuestion("");
    } catch (err) {
      setToast(friendlyError(err));
    } finally {
      inflight.current = false;
      setBusy(false);
    }
  };
  const advance = () => {
    if (!pending) return;
    const next = pending;
    setPending(null);
    setRun(next);
    resetInputs();
    if (next.completed) {
      setExpression("proud");
      setSpeech(completionDialogue(next));
    } else {
      setExpression(next.index === 1 ? "ponder" : "smile");
      setSpeech(next.step.prompt);
    }
  };
  const navigate = (target) => {
    if (busy) return;
    setPage(target);
    setRun(null);
    setScene(null);
    setTravel(null);
    setPending(null);
    resetInputs();
    setExpression("smile");
    setSpeech(GREETING);
  };
  return {
    page,
    data,
    progress,
    error,
    loading,
    settings,
    setSettings,
    motion,
    setMotion,
    run,
    mission,
    selected,
    setSelected,
    tiles,
    setTiles,
    text,
    setText,
    question,
    setQuestion,
    askOpen,
    setAskOpen,
    busy,
    feedback,
    pending,
    speech,
    expression,
    toast,
    setToast,
    scene,
    travel,
    enterScene,
    load,
    start,
    turn,
    advance,
    navigate,
  };
}
