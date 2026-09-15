(function exposeScoring(root) {
  const data = typeof module !== 'undefined' && module.exports
    ? require('./data.js')
    : root.HanQuizData;

  const PRIMARY_WEIGHT = 2;
  const SECONDARY_WEIGHT = 0.7;
  const SECONDARY_AFFINITY = 0.35;

  function scoreAnswers(answers) {
    const traits = {};
    const pairs = {};

    answers.forEach((optionIndex, questionIndex) => {
      const option = data.questions[questionIndex] && data.questions[questionIndex].options[optionIndex];
      if (!option) throw new Error(`Invalid answer at question ${questionIndex + 1}`);

      traits[option.style] = (traits[option.style] || 0) + PRIMARY_WEIGHT;
      traits[option.need] = (traits[option.need] || 0) + PRIMARY_WEIGHT;
      if (option.secondary) traits[option.secondary] = (traits[option.secondary] || 0) + SECONDARY_WEIGHT;

      const pairKey = `${option.style}|${option.need}`;
      pairs[pairKey] = (pairs[pairKey] || 0) + 1;
    });

    return { traits, pairs };
  }

  function resultScore(result, scored) {
    const primary = (scored.traits[result.style] || 0) + (scored.traits[result.need] || 0);
    const secondary = result.secondary.reduce((sum, trait) => sum + (scored.traits[trait] || 0), 0);
    return primary + secondary * SECONDARY_AFFINITY;
  }

  function calculateResult(answers) {
    if (!Array.isArray(answers) || answers.length !== data.questions.length) {
      throw new Error('Exactly seven answers are required');
    }

    const scored = scoreAnswers(answers);
    return data.results
      .map((result, order) => ({ ...result, score: resultScore(result, scored), order }))
      .sort((a, b) => b.score - a.score || a.order - b.order)[0];
  }

  const api = { calculateResult, scoreAnswers };
  root.HanQuizScoring = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
