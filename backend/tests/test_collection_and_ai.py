"""Explicit collection and provider-backed reading assessment regressions."""
import json
import tempfile
import unittest
import uuid
import urllib.error
from pathlib import Path
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from app import tutor
from app.curriculum import MISSIONS, check_answer
from app.learning_store import LearningStore
from app.routers import learning, flashcards
from app.schemas import CollectCardsRequest, ReviewRequest
from app.services.card_collection import collect, candidates

class CollectionAndAITests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parent)
        self.store = LearningStore(Path(self.temp.name)/"study.sqlite3")
        self.who = "user:collection-test"
        self.patches = [patch.object(learning,"store",self.store),patch.object(flashcards,"store",self.store),
                        patch.object(tutor,"store",self.store),patch.object(tutor,"AI_ENABLED",False)]
        for item in self.patches: item.start()
        learning._requests.clear()

    def tearDown(self):
        for item in reversed(self.patches): item.stop()
        self.temp.cleanup()

    def start(self, index=0):
        mission=MISSIONS[index]
        run_id,state=self.store.start(self.who,mission["id"])
        from app.services.learning import run_payload
        return run_payload(run_id,mission,state)

    def answer(self, run, answer):
        return learning.turn(learning.TurnRequest(run_id=run["run_id"],revision=run["revision"],action="answer",answer=answer),self.who)

    def finish(self, index=0):
        run=self.start(index)
        for step in MISSIONS[index]["steps"]:
            run=self.answer(run,step["example"])
            self.assertTrue(run["correct"])
        return run

    def response(self, content):
        response=MagicMock()
        response.__enter__.return_value.read.return_value=json.dumps({"choices":[{"finish_reason":"stop","message":{"content":json.dumps(content)}}]}).encode()
        return response

    def ai(self):
        return [patch.object(tutor,"AI_ENABLED",True),patch.object(tutor,"AI_PROVIDER","deepseek"),
                patch.object(tutor,"DEEPSEEK_API_KEY","test-not-a-real-key"),patch.object(tutor,"AI_DAILY_LIMIT",100)]

    def test_fresh_library_and_old_review_rows_are_not_auto_collected(self):
        self.assertEqual(flashcards.library(self.who)["cards"],[])
        with self.store.connection() as db:
            db.execute("INSERT INTO flashcards VALUES (?,?,?)",(self.who,"bakery-1",'{"reviews":4,"favorite":true}'))
        self.assertEqual(flashcards.library(self.who)["cards"],[])

    def test_correct_guess_offers_word_without_auto_saving_it(self):
        run=self.answer(self.start(3),"Baum")
        self.assertEqual([card["id"] for card in run["collection_offer"]],["park-tree"])
        self.assertEqual(flashcards.library(self.who)["cards"],[])
        result=collect(self.store,self.who,["park-tree","park-tree"])
        self.assertEqual(result["added_count"],1)
        self.assertEqual(collect(self.store,self.who,["park-tree"])["added_count"],0)
        self.assertEqual([card["id"] for card in flashcards.library(self.who)["cards"]],["park-tree"])

    def test_incorrect_word_is_not_eligible(self):
        run=self.answer(self.start(3),"Katze")
        self.assertEqual(run["collection_offer"],[])
        with self.assertRaises(HTTPException) as caught: collect(self.store,self.who,["park-tree"])
        self.assertEqual(caught.exception.status_code,403)

    def test_completed_reading_offers_choices_and_only_chosen_cards_appear(self):
        run=self.finish()
        self.assertEqual(len(run["collection_candidates"]),4)
        self.assertEqual(flashcards.library(self.who)["cards"],[])
        flashcards.collect_cards(CollectCardsRequest(card_ids=["bakery-1"]),self.who)
        self.assertEqual(len(flashcards.library(self.who)["cards"]),1)

    def test_collection_is_isolated_and_batch_is_atomic(self):
        self.finish()
        with self.assertRaises(HTTPException): collect(self.store,self.who,["bakery-1","park-tree"])
        self.assertEqual(flashcards.library(self.who)["cards"],[])
        collect(self.store,self.who,["bakery-1"])
        self.assertEqual(flashcards.library("user:other")["cards"],[])
        with self.assertRaises(HTTPException): collect(self.store,"user:other",["bakery-1"])

    def test_review_cannot_implicitly_collect_a_card(self):
        self.finish()
        with self.assertRaises(HTTPException):
            flashcards.review(ReviewRequest(card_id="bakery-1",rating="good",review_id=uuid.uuid4()),self.who)
        self.assertEqual(flashcards.library(self.who)["cards"],[])

    def test_collection_and_review_survive_reopening(self):
        self.finish()
        collect(self.store,self.who,["bakery-1"])
        flashcards.review(ReviewRequest(card_id="bakery-1",rating="good",review_id=uuid.uuid4()),self.who)
        with patch.object(flashcards,"store",LearningStore(self.store.path)):
            self.assertEqual(flashcards.library(self.who)["cards"][0]["review"]["reviews"],1)

    def test_same_backpack_card_is_used_in_both_scenes(self):
        run=self.start(4)
        for step in MISSIONS[4]["steps"]: run=self.answer(run,step["example"])
        cards=candidates(self.store,self.who,"park-picnic")
        bag=next(card for card in cards if card["id"]=="school-bag")
        self.assertEqual(bag["chapter_ids"],["park","school"])

    def test_reading_does_not_require_bitte_or_umlaut_keyboard(self):
        step=MISSIONS[0]["steps"][0]
        for answer in ["ein Broetchen","Ein Brötchen","Ich möchte ein Brötchen","Guten Tag! Ein Brötchen."]:
            self.assertTrue(check_answer(step,answer),answer)
        for answer in ["kein Brötchen","zwei Brötchen","eine Brötchen"]:
            self.assertFalse(check_answer(step,answer),answer)

    def test_semantic_reading_uses_one_deepseek_call_and_persists_result(self):
        run=self.start()
        patches=self.ai()
        for item in patches:item.start()
        try:
            reply={"correct":True,"evidence_line":1,"message":"你读懂了想买的食物，表达清楚。","expression":"proud","strategy":"transfer"}
            with patch("app.ai.client.urllib.request.urlopen",return_value=self.response(reply)) as request:
                result=self.answer(run,"Für mich bitte ein knuspriges Brötchen.")
            self.assertTrue(result["correct"])
            self.assertEqual(result["assessment"]["judge"],"deepseek")
            self.assertEqual(request.call_count,1)
            payload=json.loads(request.call_args.args[0].data)
            self.assertEqual(payload["response_format"],{"type":"json_object"})
            self.assertEqual(payload["thinking"],{"type":"disabled"})
            self.assertIn("api.deepseek.com",request.call_args.args[0].full_url)
            self.assertEqual(result["progress"]["coins"],0)
            with self.store.connection() as db:
                self.assertIn("knuspriges",db.execute("SELECT answer FROM learning_events").fetchone()[0])
        finally:
            for item in reversed(patches):item.stop()

    def test_known_answer_needs_no_network_even_during_outage(self):
        patches=self.ai()
        for item in patches:item.start()
        try:
            with patch("app.ai.client.urllib.request.urlopen",side_effect=urllib.error.URLError("offline")) as request:
                result=self.answer(self.start(),"ein Broetchen")
            self.assertTrue(result["correct"])
            self.assertEqual(result["tutor"]["source"],"local")
            self.assertIsNone(result["tutor"]["notice"])
            request.assert_not_called()
        finally:
            for item in reversed(patches):item.stop()

    def test_invalid_judgement_boolean_or_evidence_cannot_override_local_result(self):
        patches=self.ai()
        for item in patches:item.start()
        try:
            for value,line in [("false",1),(True,99)]:
                reply={"correct":value,"evidence_line":line,"message":"继续。","expression":"smile","strategy":"transfer"}
                with patch("app.ai.client.urllib.request.urlopen",return_value=self.response(reply)):
                    result=self.answer(self.start(),"Zwei Brötchen")
                self.assertFalse(result["correct"])
                self.assertEqual(result["index"],0)
                self.assertEqual(result["tutor"]["source"],"local")
        finally:
            for item in reversed(patches):item.stop()

    def test_daily_budget_applies_to_reading_judgement(self):
        patches=self.ai()
        for item in patches:item.start()
        try:
            with patch.object(tutor,"AI_DAILY_LIMIT",0),patch("app.ai.client.urllib.request.urlopen") as request:
                result=self.answer(self.start(),"Ein Brötchen")
            request.assert_not_called()
            self.assertTrue(result["correct"])
            self.assertIsNone(result["tutor"]["notice"])
        finally:
            for item in reversed(patches):item.stop()

    def test_reading_price_answers_accept_short_and_full_sentences(self):
        step=MISSIONS[0]["steps"][1]
        for answer in ["1", "1 Euro", "Das kostet 1 Euro.", "Es sind ein Euro.", "Einen Euro bitte"]:
            self.assertTrue(check_answer(step,answer),answer)
        for answer in ["2 Euro", "kein Euro", "1 Cent", "Das kostet nicht 1 Euro"]:
            self.assertFalse(check_answer(step,answer),answer)

    def test_deepseek_hints_use_the_selected_provider(self):
        patches=self.ai()
        for item in patches:item.start()
        try:
            step=MISSIONS[0]["steps"][0]
            _,state=self.store.start(self.who,"bakery-first")
            reply={"message":"回到第一行，先找表示食物的词。","expression":"ponder","strategy":"hint"}
            with patch("app.ai.client.urllib.request.urlopen",return_value=self.response(reply)) as request:
                result=tutor.respond(step,state,"hint")
            self.assertEqual(result["source"],"deepseek")
            self.assertEqual(request.call_count,1)
            self.assertNotIn("test-not-a-real-key",json.dumps(result))
        finally:
            for item in reversed(patches):item.stop()

    def test_truncated_or_blank_deepseek_output_falls_back(self):
        patches=self.ai()
        for item in patches:item.start()
        try:
            for reason,content in [("length","{}"),("stop","   ")]:
                self.who = "user:provider-fallback-" + reason
                response=MagicMock()
                response.__enter__.return_value.read.return_value=json.dumps({"choices":[{"finish_reason":reason,"message":{"content":content}}]}).encode()
                with patch("app.ai.client.urllib.request.urlopen",return_value=response):
                    result=self.answer(self.start(),"Für mich bitte ein knuspriges Brötchen.")
                self.assertFalse(result["correct"])
                self.assertEqual(result["assessment"]["status"],"unconfirmed")
                self.assertEqual(result["assessment"]["judge"],"local")
                self.assertTrue(result["tutor"]["notice"])
        finally:
            for item in reversed(patches):item.stop()

if __name__=="__main__":unittest.main()
