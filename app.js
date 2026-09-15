(function runQuizApp() {
  const { questions } = window.HanQuizData;
  const { calculateResult } = window.HanQuizScoring;
  const { createQuizState, chooseAnswer, goBack, restoreQuizState } = window.HanQuizState;
  const app = document.querySelector('#app');
  const STORAGE_KEY = 'han-workplace-quiz-state-v1';
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const resultPositions = {
    'wei-qing': ['67%', '71%'],
    'sima-qian': ['5%', '3%'],
    'salt-merchant': ['40%', '39%'],
    youxia: ['54%', '56%'],
    'western-merchant': ['50%', '53%'],
    'inner-court': ['18%', '18%'],
    southwest: ['87%', '89%'],
    'local-magnate': ['35%', '32%'],
    'vassal-prince': ['27%', '25%'],
    kunlun: ['96%', '94%'],
  };

  let state = restoreQuizState(localStorage.getItem(STORAGE_KEY), questions.length);
  let view = 'intro';

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function renderIntro() {
    const hasProgress = state.current > 0;
    app.innerHTML = `
      <section class="view intro">
        <div class="intro-inner">
          <div class="intro-mark"><span class="seal" aria-hidden="true">汉</span><span>太卜署 · 内部流出版</span></div>
          <h1>大汉职场<br>生存人格测试</h1>
          <p class="intro-copy">新来的，先烤块龟甲。七问之后，自有人替你决定该出塞、入朝、经商，还是上昆仑。</p>
          <div class="intro-actions">
            <button class="primary-button" id="start-quiz" type="button">
              ${hasProgress ? '接着烤' : '奉诏开测'}<span class="arrow" aria-hidden="true">→</span>
            </button>
            ${hasProgress ? '<button class="intro-reset" id="intro-reset" type="button">重开一卦</button>' : ''}
          </div>
        </div>
      </section>`;

    document.querySelector('#start-quiz').addEventListener('click', () => {
      view = state.complete ? 'result' : 'question';
      render();
    });

    document.querySelector('#intro-reset')?.addEventListener('click', () => {
      state = createQuizState(questions.length);
      localStorage.removeItem(STORAGE_KEY);
      render();
    });
  }

  function renderQuestion() {
    const question = questions[state.current];
    const selected = state.answers[state.current];
    const progress = ((state.current + 1) / questions.length) * 100;

    app.innerHTML = `
      <section class="view question-view">
        <aside class="question-aside" aria-hidden="true">
          <div class="aside-top"><span class="seal">汉</span><span>太卜署问策</span></div>
          <div class="question-number">${String(state.current + 1).padStart(2, '0')}<span>问命不影响录用<br>最终解释权归本署所有</span></div>
          <div class="aside-bottom">建元年间 · 长安<br>龟甲批次：${String(1047 + state.current * 83)}</div>
        </aside>
        <div class="question-main">
          <header class="question-header">
            <button class="icon-button" id="back-button" type="button" aria-label="返回上一页" title="返回">←</button>
            <div class="progress-track" aria-label="答题进度">
              <div class="progress-fill" style="transform: scaleX(${progress / 100})"></div>
            </div>
            <div class="progress-label">${state.current + 1} / ${questions.length}</div>
          </header>
          <div class="question-content">
            <p class="eyebrow">第 ${state.current + 1} 问</p>
            <h2>${question.prompt}</h2>
            <div class="options" role="radiogroup" aria-label="请选择一项">
              ${question.options.map((option, index) => `
                <button class="option${selected === index ? ' is-selected' : ''}" type="button" role="radio" aria-checked="${selected === index}" data-index="${index}">
                  <span class="option-letter">${letters[index]}</span>
                  <span class="option-copy">
                    <span class="option-main">${option.label}</span>
                    ${option.aside ? `<span class="option-aside">${option.aside}</span>` : ''}
                  </span>
                </button>`).join('')}
            </div>
          </div>
        </div>
      </section>`;

    document.querySelector('#back-button').addEventListener('click', () => {
      if (state.current === 0) {
        view = 'intro';
      } else {
        state = goBack(state);
        saveState();
      }
      render();
    });

    document.querySelectorAll('.option').forEach((button) => {
      button.addEventListener('click', () => selectOption(Number(button.dataset.index), button));
    });
  }

  function selectOption(optionIndex, button) {
    document.querySelectorAll('.option').forEach((option) => {
      option.disabled = true;
      option.classList.remove('is-selected');
    });
    button.classList.add('is-selected');
    window.setTimeout(() => {
      state = chooseAnswer(state, optionIndex);
      saveState();
      view = state.complete ? 'result' : 'question';
      render();
      window.scrollTo({ top: 0, behavior: 'instant' });
    }, 180);
  }

  function renderResult() {
    const result = calculateResult(state.answers);
    const [desktopPosition, mobilePosition] = resultPositions[result.id] || ['50%', '50%'];

    app.innerHTML = `
      <section class="view result-view" style="--result-position:${desktopPosition}; --result-position-mobile:${mobilePosition}">
        <div class="result-visual">
          <div class="result-topbar">
            <button class="icon-button" id="result-back" type="button" aria-label="返回最后一题" title="返回最后一题">←</button>
          </div>
        </div>
        <article class="result-body">
          <p class="result-kicker">太卜署最终批命</p>
          <div class="result-heading">
            <h1>${result.name}</h1>
            <span class="result-subtitle">${result.subtitle}</span>
          </div>
          <ul class="result-tags">${result.tags.map((tag) => `<li>${tag}</li>`).join('')}</ul>
          <p class="result-copy">${result.copy}</p>
          <div class="result-actions">
            <button class="primary-button" id="save-result" type="button">↓ 保存结果图</button>
            <button class="secondary-button" id="restart-quiz" type="button">↻ 重新测命</button>
          </div>
          <div class="save-status" id="save-status" role="status"></div>
        </article>
      </section>`;

    document.querySelector('#result-back').addEventListener('click', () => {
      state = goBack(state);
      saveState();
      view = 'question';
      render();
    });

    document.querySelector('#restart-quiz').addEventListener('click', () => {
      state = createQuizState(questions.length);
      localStorage.removeItem(STORAGE_KEY);
      view = 'intro';
      render();
    });

    document.querySelector('#save-result').addEventListener('click', () => saveResultCard(result));
  }

  function drawWrappedText(context, text, x, y, maxWidth, lineHeight, maxLines) {
    const characters = [...text];
    let line = '';
    let currentY = y;
    let lines = 0;

    characters.forEach((character, index) => {
      const testLine = line + character;
      if (context.measureText(testLine).width > maxWidth && line) {
        context.fillText(line, x, currentY);
        line = character;
        currentY += lineHeight;
        lines += 1;
      } else {
        line = testLine;
      }

      if (index === characters.length - 1 && lines < maxLines) context.fillText(line, x, currentY);
    });
  }

  async function saveResultCard(result) {
    const status = document.querySelector('#save-status');
    const button = document.querySelector('#save-result');
    button.disabled = true;
    status.textContent = '正在誊写你的列传……';

    try {
      await document.fonts.ready;
      const image = new Image();
      image.src = 'assets/han-world-panorama.png';
      await image.decode();

      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1440;
      const context = canvas.getContext('2d');

      context.fillStyle = '#f5edd9';
      context.fillRect(0, 0, canvas.width, canvas.height);
      const cropHeight = 470;
      const sourceWidth = image.width;
      const sourceHeight = sourceWidth * cropHeight / canvas.width;
      const sourceY = Math.max(0, (image.height - sourceHeight) / 2);
      context.drawImage(image, 0, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, cropHeight);
      context.fillStyle = 'rgba(26, 18, 14, 0.17)';
      context.fillRect(0, 0, canvas.width, cropHeight);

      context.fillStyle = '#992b22';
      context.fillRect(0, cropHeight, canvas.width, 12);
      context.fillStyle = '#992b22';
      context.font = '700 28px "Microsoft YaHei", sans-serif';
      context.fillText('大汉职场生存人格测试', 82, 555);

      context.fillStyle = '#211b17';
      context.font = '800 104px "Noto Serif SC", "Songti SC", serif';
      context.fillText(result.name, 78, 705);
      context.fillStyle = '#315f57';
      context.font = '700 32px "Microsoft YaHei", sans-serif';
      context.fillText(result.subtitle, 82, 765);

      let tagX = 82;
      context.font = '700 24px "Microsoft YaHei", sans-serif';
      result.tags.forEach((tag) => {
        const width = context.measureText(tag).width + 42;
        context.strokeStyle = 'rgba(49, 95, 87, 0.55)';
        context.strokeRect(tagX, 808, width, 48);
        context.fillStyle = '#315f57';
        context.fillText(tag, tagX + 21, 841);
        tagX += width + 14;
      });

      context.fillStyle = '#342b25';
      context.font = '32px "Noto Serif SC", "Songti SC", serif';
      drawWrappedText(context, result.copy, 82, 942, 916, 58, 7);

      context.fillStyle = '#7a6f64';
      context.font = '22px "Microsoft YaHei", sans-serif';
      context.fillText('太卜署 · 内部流出版', 82, 1370);

      const link = document.createElement('a');
      link.download = `大汉职场人格-${result.name}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      status.textContent = '列传已誊写，可以发给同僚了。';
    } catch (_error) {
      status.textContent = '誊写失败了，先截个图吧。';
    } finally {
      button.disabled = false;
    }
  }

  function render() {
    if (view === 'intro') renderIntro();
    else if (view === 'result') renderResult();
    else renderQuestion();
  }

  document.addEventListener('keydown', (event) => {
    if (view !== 'question' || event.altKey || event.ctrlKey || event.metaKey) return;
    const optionIndex = letters.indexOf(event.key.toUpperCase());
    const button = document.querySelector(`.option[data-index="${optionIndex}"]`);
    if (button && !button.disabled) selectOption(optionIndex, button);
  });

  render();
})();
