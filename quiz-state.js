(function exposeQuizState(root) {
  function createQuizState(totalQuestions) {
    return {
      current: 0,
      answers: Array(totalQuestions).fill(null),
      complete: false,
    };
  }

  function chooseAnswer(state, optionIndex) {
    if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex > 5) {
      throw new Error('Invalid option');
    }
    if (state.current >= state.answers.length) return state;

    const answers = [...state.answers];
    answers[state.current] = optionIndex;
    const current = Math.min(state.current + 1, answers.length);
    return { current, answers, complete: current === answers.length };
  }

  function goBack(state) {
    const current = Math.max(0, state.current - 1);
    return { ...state, current, complete: false };
  }

  function restoreQuizState(raw, totalQuestions) {
    const fresh = createQuizState(totalQuestions);
    try {
      const saved = JSON.parse(raw);
      const validAnswers = Array.isArray(saved.answers)
        && saved.answers.length === totalQuestions
        && saved.answers.every((answer) => answer === null || (Number.isInteger(answer) && answer >= 0 && answer <= 5));
      const validCurrent = Number.isInteger(saved.current) && saved.current >= 0 && saved.current <= totalQuestions;
      if (!validAnswers || !validCurrent) return fresh;
      return {
        current: saved.current,
        answers: saved.answers,
        complete: saved.current === totalQuestions && saved.answers.every((answer) => answer !== null),
      };
    } catch (_error) {
      return fresh;
    }
  }

  const api = { createQuizState, chooseAnswer, goBack, restoreQuizState };
  root.HanQuizState = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
