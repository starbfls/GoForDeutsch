import { useCallback, useEffect, useRef, useState } from "react";
import { flashcardApi } from "@/services/api";
import { friendlyError } from "../adventure/catalog";
export default function useFlashcards(notify) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chapter, setChapter] = useState("all");
  const [scope, setScope] = useState("due");
  const [queue, setQueue] = useState(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await flashcardApi.library();
      setCards(data.cards);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);
  const filtered = cards.filter(
    (card) =>
      (chapter === "all" || card.chapter_id === chapter) &&
      (scope === "all" ||
        (scope === "due" && card.due) ||
        (scope === "saved" && card.review.favorite)),
  );
  const begin = (id) => {
    const chosen = id ? [id] : filtered.slice(0, 5).map((card) => card.id);
    if (!chosen.length) return;
    setQueue(chosen);
    setIndex(0);
    setRevealed(false);
  };
  const update = (card) =>
    setCards((current) =>
      current.map((item) => (item.id === card.id ? card : item)),
    );
  const current = queue ? cards.find((card) => card.id === queue[index]) : null;
  const review = async (rating) => {
    if (!current || !revealed || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      const { data } = await flashcardApi.review(
        current.id,
        rating,
        crypto.randomUUID(),
      );
      update(data);
      setIndex((value) => value + 1);
      setRevealed(false);
    } catch (err) {
      notify(friendlyError(err));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const favorite = async (card) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      const { data } = await flashcardApi.favorite(
        card.id,
        !card.review.favorite,
      );
      update(data);
    } catch (err) {
      notify(friendlyError(err));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  return {
    cards,
    loading,
    error,
    chapter,
    setChapter,
    scope,
    setScope,
    queue,
    index,
    revealed,
    setRevealed,
    busy,
    filtered,
    begin,
    current,
    review,
    favorite,
    exit: () => setQueue(null),
    load,
    finished: Boolean(queue && index >= queue.length),
  };
}
