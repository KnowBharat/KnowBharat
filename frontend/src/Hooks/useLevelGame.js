// Hooks/useLevelGame.js
import { useState, useCallback } from 'react';

/**
 * Shared game logic for all 10 levels.
 * Supports:
 *   - Text-input quiz  (fields[] + getExpected)
 *   - Image/carousel quiz (carouselData + correct item name)
 */
export default function useLevelGame(fields = [], getExpected = () => '') {
  // ── Phase: 'learn' | 'quiz' ───────────────────────────────────────────────
  const [phase, setPhase] = useState('learn');

  // ── Text quiz state ────────────────────────────────────────────────────────
  const [userAnswers,   setUserAnswers]   = useState({});
  const [result,        setResult]        = useState(null);
  const [revealedHints, setRevealedHints] = useState([]);
  const [usedHints,     setUsedHints]     = useState([]);

  // ── Carousel quiz state ────────────────────────────────────────────────────
  const [carouselIdx,     setCarouselIdx]     = useState(0);
  const [carouselInput,   setCarouselInput]   = useState('');
  const [carouselResult,  setCarouselResult]  = useState(null); // null | 'correct' | 'wrong'
  const [carouselScore,   setCarouselScore]   = useState(0);
  const [carouselAnswered,setCarouselAnswered] = useState(new Set());

  // ── Global score / streak ─────────────────────────────────────────────────
  const [totalScore, setTotalScore] = useState(0);
  const [streak,     setStreak]     = useState(0);

  const MAX_HINTS = 3;

  // ─────────────────────────────────────────────────────────────────────────
  // TEXT QUIZ helpers
  // ─────────────────────────────────────────────────────────────────────────

  const handleAnswerChange = useCallback((field, value) => {
    setUserAnswers(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleHint = useCallback((stateInfo) => {
    if (!stateInfo || result || revealedHints.length >= MAX_HINTS) return;
    const unanswered = fields.filter(f =>
      !(userAnswers[f] || '').trim() &&
      !revealedHints.some(h => h.field === f)
    );
    if (!unanswered.length) return;
    const pick = unanswered[Math.floor(Math.random() * unanswered.length)];
    const val  = getExpected(pick, stateInfo);
    setRevealedHints(prev => [...prev, { field: pick, value: val }]);
    setUsedHints(prev    => [...prev, pick]);
  }, [fields, getExpected, userAnswers, revealedHints, result]);

  const handleCheck = useCallback((stateInfo) => {
    if (!stateInfo) return;
    const correct = {};
    let numCorrect = 0;
    fields.forEach(f => {
      const expected = String(getExpected(f, stateInfo)).toLowerCase().trim();
      const given    = String(userAnswers[f] || '').toLowerCase().trim();
      correct[f]     = expected === given;
      if (correct[f]) numCorrect++;
    });
    const hintPenalty = usedHints.length * 0.5;
    const score       = Math.max(0, numCorrect - hintPenalty);
    const allCorrect  = numCorrect === fields.length;
    const pts         = Math.round(score * 10);
    setTotalScore(s => s + pts);
    if (allCorrect) setStreak(s => s + 1); else setStreak(0);
    setResult({ correct, score, numCorrect, allCorrect, total: fields.length, pts });
  }, [fields, getExpected, userAnswers, usedHints]);

  // ─────────────────────────────────────────────────────────────────────────
  // CAROUSEL QUIZ helpers (levels 5, 6, 7)
  // ─────────────────────────────────────────────────────────────────────────

  const checkCarouselAnswer = useCallback((data) => {
    if (!data || !data[carouselIdx]) return;
    const expected = data[carouselIdx].name.toLowerCase().trim();
    const given    = carouselInput.toLowerCase().trim();
    const correct  = expected === given;
    setCarouselResult(correct ? 'correct' : 'wrong');
    if (correct && !carouselAnswered.has(carouselIdx)) {
      setCarouselScore(s => s + 10);
      setTotalScore(s => s + 10);
      setCarouselAnswered(prev => new Set([...prev, carouselIdx]));
      setStreak(s => s + 1);
    } else if (!correct) {
      setStreak(0);
    }
  }, [carouselIdx, carouselInput, carouselAnswered]);

  const nextCarouselItem = useCallback((data) => {
    if (!data) return;
    setCarouselIdx(i => (i + 1) % data.length);
    setCarouselInput('');
    setCarouselResult(null);
  }, []);

  const prevCarouselItem = useCallback((data) => {
    if (!data) return;
    setCarouselIdx(i => (i - 1 + data.length) % data.length);
    setCarouselInput('');
    setCarouselResult(null);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Reset
  // ─────────────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setPhase('learn');
    setUserAnswers({});
    setResult(null);
    setRevealedHints([]);
    setUsedHints([]);
    setCarouselIdx(0);
    setCarouselInput('');
    setCarouselResult(null);
    setCarouselAnswered(new Set());
  }, []);

  const playAgain = useCallback(() => {
    setUserAnswers({});
    setResult(null);
    setRevealedHints([]);
    setUsedHints([]);
  }, []);

  const goToQuiz = useCallback(() => {
    setPhase('quiz');
    setUserAnswers({});
    setResult(null);
    setRevealedHints([]);
    setUsedHints([]);
    setCarouselIdx(0);
    setCarouselInput('');
    setCarouselResult(null);
    setCarouselAnswered(new Set());
  }, []);

  const goToLearn = useCallback(() => {
    setPhase('learn');
    setResult(null);
    setCarouselResult(null);
  }, []);

  return {
    // phase
    phase, goToQuiz, goToLearn,
    // text quiz
    userAnswers, handleAnswerChange,
    result,
    revealedHints, usedHints,
    hintsLeft: MAX_HINTS - revealedHints.length,
    handleHint, handleCheck,
    reset, playAgain,
    // carousel quiz
    carouselIdx, carouselInput, setCarouselInput,
    carouselResult, carouselScore, carouselAnswered,
    checkCarouselAnswer, nextCarouselItem, prevCarouselItem,
    // global
    totalScore, streak,
  };
}