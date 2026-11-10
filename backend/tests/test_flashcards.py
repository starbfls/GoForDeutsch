"""Review scheduling, persistence, identity isolation and task compatibility."""
import tempfile
import unittest
import uuid
from datetime import datetime,timedelta,timezone
from pathlib import Path
from unittest.mock import patch
from fastapi import HTTPException
from app.curriculum import CHAPTERS,MISSIONS,VOCABULARY,check_answer
from app.learning_store import LearningStore
from app.repositories.flashcards import FlashcardRepository
from app.routers import flashcards,learning
from app.schemas import FavoriteRequest,ReviewRequest
from app.services.review_schedule import initial_state,schedule
from app import tutor


class ReviewTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parent)
        self.store=LearningStore(Path(self.temp.name)/'reviews.sqlite3')
        self.repository=FlashcardRepository(self.store)
        self.now=datetime(2026,11,10,12,tzinfo=timezone.utc)

    def tearDown(self):
        assert Path(self.temp.name).resolve().is_relative_to(Path(__file__).resolve().parent)
        self.temp.cleanup()

    def test_first_review_intervals(self):
        for rating,delta in [('again',timedelta(minutes=10)),('hard',timedelta(days=1)),('good',timedelta(days=3)),('easy',timedelta(days=7))]:
            with self.subTest(rating=rating):
                state=schedule(initial_state(self.now),rating,self.now)
                self.assertEqual(datetime.fromisoformat(state['due_at']),self.now+delta)
                self.assertEqual(state['reviews'],1)

    def test_idempotent_retry_does_not_count_review_twice(self):
        event=str(uuid.uuid4())
        first=self.repository.review('guest:a','bakery-1','good',event,self.now)
        second=self.repository.review('guest:a','bakery-1','good',event,self.now)
        self.assertEqual(first,second)
        self.assertEqual(second['reviews'],1)
        with self.assertRaises(HTTPException):
            self.repository.review('guest:a','bakery-2','good',event,self.now)

    def test_favorites_survive_reviews_and_reopening(self):
        self.repository.favorite('guest:a','school-book',True)
        self.repository.review('guest:a','school-book','good',str(uuid.uuid4()),self.now)
        reopened=FlashcardRepository(LearningStore(self.store.path))
        self.assertTrue(reopened.states('guest:a')['school-book']['favorite'])
        self.assertEqual(reopened.states('guest:a')['school-book']['reviews'],1)

    def test_same_event_id_is_isolated_by_learner(self):
        event=str(uuid.uuid4())
        self.repository.review('guest:a','bakery-1','easy',event,self.now)
        self.assertEqual(self.repository.states('guest:b'),{})
        other=self.repository.review('guest:b','bakery-2','again',event,self.now)
        self.assertEqual(other['lapses'],1)

    def test_route_validates_unknown_card_and_limits_rating(self):
        with patch.object(flashcards,'store',self.store):
            with self.assertRaises(HTTPException) as caught:
                flashcards.favorite(FavoriteRequest(card_id='not-a-card',favorite=True),'guest:a')
            self.assertEqual(caught.exception.status_code,404)
            response=flashcards.library('guest:a')
            self.assertEqual(len(response['cards']),len(VOCABULARY))
            self.assertEqual(response['due_count'],len(VOCABULARY))
            result=flashcards.review(ReviewRequest(card_id='bakery-1',rating='good',review_id=uuid.uuid4()),'guest:a')
            self.assertFalse(result['due'])
            self.assertEqual(flashcards.library('guest:a')['reviewed_count'],1)

    def test_old_bakery_records_unlock_park_without_reset(self):
        with patch.object(learning,'store',self.store),patch.object(tutor,'AI_ENABLED',False):
            for mission in MISSIONS[:3]:
                run_id,state=self.store.start('guest:legacy',mission['id'])
                state.update(index=3,completed=True,evidence=[{'step_id':step['id'],'skill':step['skill'],'independent':True,'attempts':1,'hints':0} for step in mission['steps']])
                self.store.save(run_id,'guest:legacy',mission['id'],state,0)
            progress=learning.progress_data('guest:legacy')
            self.assertEqual(progress['xp'],150)
            self.assertEqual(progress['recommended'],'park-discover')
            started=learning.start(learning.StartRequest(mission_id='park-discover'),'guest:legacy')
            self.assertEqual(started['chapter_id'],'park')

    def test_started_school_task_is_not_locked_by_new_scene_order(self):
        run_id,state=self.store.start('guest:legacy','school-hello')
        state['index']=1
        self.store.save(run_id,'guest:legacy','school-hello',state,0)
        with patch.object(learning,'store',self.store):
            resumed=learning.start(learning.StartRequest(mission_id='school-hello'),'guest:legacy')
            self.assertEqual(resumed['run_id'],run_id)
            self.assertEqual(resumed['index'],1)
            self.assertIn('school-hello',learning.progress_data('guest:legacy')['available'])

    def test_memory_links_have_examples_without_changing_card_identifiers(self):
        for word in VOCABULARY:
            self.assertTrue(word['mnemonic'])
            self.assertTrue(word['example_zh'])
            self.assertEqual(word['unit_id'],'kennenlernen')

    def test_all_catalog_identifiers_are_unique_and_prerequisites_ordered(self):
        self.assertEqual(len(CHAPTERS),3)
        self.assertEqual(len({m['id'] for m in MISSIONS}),len(MISSIONS))
        self.assertEqual(len({w['id'] for w in VOCABULARY}),len(VOCABULARY))
        for index,mission in enumerate(MISSIONS):
            self.assertEqual(mission['requires'],MISSIONS[index-1]['id'] if index else None)
            for step in mission['steps']:
                if step['type']=='text':
                    self.assertTrue(check_answer(step,step['example']))
        wrong=MISSIONS[4]['steps'][2]
        self.assertFalse(check_answer(wrong,'Ich habe ein Stift.'))
        self.assertFalse(check_answer(wrong,'Ich habe keinen Stift.'))


if __name__=='__main__':unittest.main()
