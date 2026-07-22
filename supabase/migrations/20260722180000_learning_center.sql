-- =====================================================
-- INTEGRITY FIX: "Users update own profile" allows UPDATE on the
-- whole row with no column restriction, and profiles was GRANTed
-- blanket UPDATE. Since every other privileged mutation in this
-- schema (approve_gadget, redeem_swap_item, ...) is deliberately an
-- atomic RPC specifically so points can't be set directly, this was
-- a wide-open back door: any authenticated user could PATCH their
-- own points/tier/co2_saved to anything via a raw REST call. Verified
-- no client code path needs broader column access (both profile-edit
-- screens only touch full_name/phone/location/bio/avatar_url).
-- =====================================================
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, phone, location, bio, avatar_url) ON public.profiles TO authenticated;

-- =====================================================
-- LEARNING CENTER: quiz data lives on the article itself (one quiz
-- per article, optional). quiz_questions shape:
-- [{ "question": "...", "options": ["...","...","...","..."], "correct": 0 }]
-- =====================================================
ALTER TABLE public.articles ADD COLUMN quiz_questions JSONB;
ALTER TABLE public.articles ADD COLUMN quiz_points INTEGER NOT NULL DEFAULT 20;

-- Streak + longest-streak tracking, scoped to learning activity specifically.
ALTER TABLE public.profiles ADD COLUMN current_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN longest_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN last_learning_date DATE;

CREATE TABLE public.learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  quiz_score INTEGER,
  quiz_passed BOOLEAN NOT NULL DEFAULT false,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, article_id)
);

ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;

-- Starting a module (marking it in-progress on open) is not a
-- privileged action — RLS ownership is enough, no RPC needed. Passing
-- the quiz and awarding points is privileged and goes through
-- submit_learning_quiz() below instead.
CREATE POLICY "Users view own learning progress" ON public.learning_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users start own learning progress" ON public.learning_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all learning progress" ON public.learning_progress FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT ON public.learning_progress TO authenticated;
GRANT ALL ON public.learning_progress TO service_role;

-- =====================================================
-- Quiz submission: computed and scored server-side (never trust a
-- client-reported score), awards points + updates the daily learning
-- streak atomically, and is idempotent — resubmitting an already-
-- passed quiz cannot be used to farm points twice.
-- =====================================================
CREATE OR REPLACE FUNCTION public.submit_learning_quiz(_article_id UUID, _answers INTEGER[])
RETURNS TABLE (score INTEGER, passed BOOLEAN, points_awarded INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _article RECORD;
  _total INTEGER;
  _correct INTEGER := 0;
  _score INTEGER;
  _passed BOOLEAN;
  _already_passed BOOLEAN;
  _points_to_award INTEGER := 0;
  _today DATE := CURRENT_DATE;
  _last_date DATE;
  _cur_streak INTEGER;
  _long_streak INTEGER;
  _new_streak INTEGER;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id, title, quiz_questions, quiz_points INTO _article FROM public.articles WHERE id = _article_id;
  IF _article.id IS NULL THEN
    RAISE EXCEPTION 'Article not found';
  END IF;
  IF _article.quiz_questions IS NULL OR jsonb_array_length(_article.quiz_questions) = 0 THEN
    RAISE EXCEPTION 'This article has no quiz';
  END IF;

  _total := jsonb_array_length(_article.quiz_questions);
  IF _answers IS NULL OR array_length(_answers, 1) IS DISTINCT FROM _total THEN
    RAISE EXCEPTION 'Expected % answers, got %', _total, COALESCE(array_length(_answers, 1), 0);
  END IF;

  FOR i IN 0.._total - 1 LOOP
    IF (_article.quiz_questions -> i ->> 'correct')::int = _answers[i + 1] THEN
      _correct := _correct + 1;
    END IF;
  END LOOP;

  _score := round(_correct * 100.0 / _total);
  _passed := _score >= 70;

  SELECT quiz_passed INTO _already_passed FROM public.learning_progress WHERE user_id = _uid AND article_id = _article_id;

  IF _passed AND NOT COALESCE(_already_passed, false) THEN
    _points_to_award := _article.quiz_points;
  END IF;

  INSERT INTO public.learning_progress (user_id, article_id, status, quiz_score, quiz_passed, points_awarded, completed_at, updated_at)
  VALUES (_uid, _article_id, CASE WHEN _passed THEN 'completed' ELSE 'in_progress' END, _score, _passed,
          CASE WHEN _points_to_award > 0 THEN _points_to_award ELSE 0 END,
          CASE WHEN _passed THEN now() ELSE NULL END, now())
  ON CONFLICT (user_id, article_id) DO UPDATE SET
    status = EXCLUDED.status,
    quiz_score = GREATEST(public.learning_progress.quiz_score, EXCLUDED.quiz_score),
    quiz_passed = public.learning_progress.quiz_passed OR EXCLUDED.quiz_passed,
    points_awarded = public.learning_progress.points_awarded + (CASE WHEN _points_to_award > 0 THEN _points_to_award ELSE 0 END),
    completed_at = COALESCE(public.learning_progress.completed_at, EXCLUDED.completed_at),
    updated_at = now();

  IF _points_to_award > 0 THEN
    UPDATE public.profiles SET points = points + _points_to_award WHERE id = _uid;

    SELECT last_learning_date, current_streak, longest_streak INTO _last_date, _cur_streak, _long_streak
    FROM public.profiles WHERE id = _uid;

    IF _last_date IS NULL OR _last_date < _today - 1 THEN
      _new_streak := 1;
    ELSIF _last_date = _today - 1 THEN
      _new_streak := _cur_streak + 1;
    ELSE
      _new_streak := _cur_streak;
    END IF;

    UPDATE public.profiles SET
      current_streak = _new_streak,
      longest_streak = GREATEST(longest_streak, _new_streak),
      last_learning_date = _today
    WHERE id = _uid;

    INSERT INTO public.transactions (user_id, type, amount, points, description, reference_id, status)
    VALUES (_uid, 'earning', 0, _points_to_award, 'Completed learning module: ' || _article.title, _article_id, 'completed');

    INSERT INTO public.notifications (user_id, title, body, type, link)
    VALUES (_uid, 'Learning module completed!', _article.title || ' — +' || _points_to_award || ' points earned.', 'success', '/dashboard/learning');
  END IF;

  RETURN QUERY SELECT _score, _passed, _points_to_award;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_learning_quiz(UUID, INTEGER[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_learning_quiz(UUID, INTEGER[]) TO authenticated, service_role;
