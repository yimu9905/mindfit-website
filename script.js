const practiceData = {
  reset: {
    eyebrow: 'A SMALL RESET / 01', title: 'A Small Reset', description: 'Three gentle steps to make a little space in your day.',
    intro: 'Take a moment for yourself', introCopy: 'No right answer, no rush. Follow three small prompts and choose what feels comfortable.', art: '✳',
    steps: [
      { label: 'PAUSE', title: 'Arrive in this moment.', prompt: 'Take a second to settle. When you are ready, choose one small way to begin.', choices: ['Set my feet down', 'Relax my shoulders', 'Look up from the screen'], feedback: 'That is enough to begin.' },
      { label: 'NOTICE', title: 'What can you notice?', prompt: 'Pick one ordinary thing to pay attention to for a moment.', choices: ['The light around me', 'Where my hands are resting', 'The sounds nearby'], feedback: 'A small observation can be a pause.' },
      { label: 'REST', title: 'Choose a little rest.', prompt: 'Which simple action could fit into your day right now?', choices: ['Stretch for a moment', 'Take a sip of water', 'Look into the distance'], feedback: 'You can take that with you when you leave.' }
    ],
    done: 'A moment to carry with you', doneCopy: 'You made a little space to pause. Take the rest of your day at your own pace.'
  },
  notice: {
    eyebrow: 'NOTICE AROUND YOU / 03', title: 'Notice Around You', description: 'A small sensory check-in with the space you are in.',
    intro: 'Let the room come into focus', introCopy: 'Move through sight, sound, and touch. Simply choose what you can notice; nothing is saved.', art: '✦',
    steps: [
      { label: 'SEE', title: 'Look around you.', prompt: 'Choose something you can see, or imagine looking for it.', choices: ['A shape or edge', 'A color nearby', 'A patch of light or shadow'], feedback: 'You found a place to rest your eyes.' },
      { label: 'HEAR', title: 'Listen for a moment.', prompt: 'What kind of sound can you notice? Quiet counts too.', choices: ['A sound close by', 'A sound further away', 'A moment of quiet'], feedback: 'Let that sound be there, just as it is.' },
      { label: 'FEEL', title: 'Notice a point of contact.', prompt: 'Choose one simple sensation you can pay attention to.', choices: ['My feet on the floor', 'Fabric against my skin', 'Air touching my hands'], feedback: 'You can return to this sense of place anytime.' }
    ],
    done: 'Here, in this moment', doneCopy: 'You noticed a few ordinary things around you. You can return to them whenever you like.'
  },
  breathe: {
    eyebrow: 'BREATHE WITH A SHAPE / 02', title: 'Breathe with a Shape', description: 'A gentle visual guide you can follow at your own comfortable pace.',
    intro: 'Follow the shape, if you like', introCopy: 'It grows and softens with a gentle rhythm. Breathe naturally; you can pause or finish at any time.', art: '◌',
    done: 'Take this moment with you', doneCopy: 'Your pause can be as short or as long as you need. Come back whenever you like.'
  }
};

const homeView = document.querySelector('#home-view');
const practiceView = document.querySelector('#practice-view');
const practiceContent = document.querySelector('#practice-content');
const menu = document.querySelector('#primary-nav');
const menuToggle = document.querySelector('#menu-toggle');
let currentPractice = null;
let stage = 'intro';
let stepIndex = 0;
let selected = -1;
let breathInterval = null;
let breathSeconds = 0;

document.querySelector('#year').textContent = new Date().getFullYear();

function closeMenu(returnFocus = false) {
  const wasOpen = menu.classList.contains('open');
  menu.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open menu');
  if (returnFocus && wasOpen) menuToggle.focus();
}
menuToggle.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(true); });
document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));

function stopBreathTimer() {
  if (breathInterval) clearInterval(breathInterval);
  breathInterval = null;
}
function startBreathTimer() {
  stopBreathTimer();
  breathInterval = setInterval(() => {
    breathSeconds += 1;
    const status = document.querySelector('#breath-status');
    if (status) status.textContent = breathSeconds % 8 < 4 ? 'Breathe in gently' : 'Breathe out softly';
  }, 1000);
}
function heading(data) {
  return `<div class="practice-header"><p class="eyebrow">${data.eyebrow}</p><h1 id="practice-title" tabindex="-1">${data.title}</h1><p>${data.description}</p></div>`;
}
function introMarkup(data) {
  return `<div class="session-card intro-card"><div class="session-art ${currentPractice === 'notice' ? 'coral' : currentPractice === 'breathe' ? 'blue' : ''}" aria-hidden="true">${data.art}</div><h2>${data.intro}</h2><p>${data.introCopy}</p><button class="button button-primary" data-action="start">Begin practice <span aria-hidden="true">→</span></button><p class="session-note">You can leave whenever you need to.</p></div>`;
}
function progressMarkup() {
  return `<div class="step-progress" aria-label="Step ${stepIndex + 1} of 3">${[0,1,2].map(i => `<span class="progress-segment ${i <= stepIndex ? 'done' : ''}"></span>`).join('')}<span class="progress-text">${stepIndex + 1} / 3</span></div>`;
}
function stepMarkup(data) {
  const step = data.steps[stepIndex];
  return `${progressMarkup()}<div class="session-card"><p class="step-kicker">STEP ${stepIndex + 1} / ${step.label}</p><h2>${step.title}</h2><p class="step-prompt">${step.prompt}</p><div class="choice-list" role="group" aria-label="Choose one observation or action">${step.choices.map((choice, index) => `<button type="button" class="choice ${selected === index ? 'selected' : ''}" data-choice="${index}" aria-pressed="${selected === index}"><span class="choice-symbol" aria-hidden="true">${selected === index ? '✓' : '○'}</span>${choice}</button>`).join('')}</div><p class="step-feedback" aria-live="polite">${selected >= 0 ? step.feedback : 'Choose one to continue.'}</p><div class="step-actions"><button class="button-plain" data-action="exit">Leave practice</button><button class="button button-primary" data-action="next" ${selected < 0 ? 'disabled' : ''}>${stepIndex === 2 ? 'Finish practice' : 'Next step'} <span aria-hidden="true">→</span></button></div></div>`;
}
function breathMarkup() {
  const paused = stage === 'paused';
  const status = paused ? 'Paused' : (breathSeconds % 8 < 4 ? 'Breathe in gently' : 'Breathe out softly');
  return `<div class="session-card breathe-card"><div class="breath-stage" aria-hidden="true"><div class="breath-ring"><div class="breath-shape ${paused ? 'running paused' : 'running'}" style="animation-delay:-${breathSeconds}s"></div></div></div><p class="breath-status" id="breath-status" role="status">${status}</p><p class="breath-subtitle">Use the shape as a guide, or follow your own comfortable rhythm. No need to hold your breath.</p><div class="breath-controls"><button class="button button-primary" data-action="${paused ? 'resume' : 'pause'}">${paused ? 'Continue' : 'Pause'} <span aria-hidden="true">${paused ? '→' : '||'}</span></button><button class="button button-quiet" data-action="finish">Finish for now</button></div><p class="breath-reduced">Shape animation is off. Follow the words at your own pace.</p></div>`;
}
function completeMarkup(data) {
  return `<div class="session-card complete-card"><div class="session-art" aria-hidden="true">✳</div><p class="step-kicker">PRACTICE COMPLETE</p><h2>${data.done}</h2><p>${data.doneCopy}</p><div class="complete-actions"><button class="button button-primary" data-action="again">Try again <span aria-hidden="true">→</span></button><a class="button button-quiet" href="#home">Back to home <span aria-hidden="true">→</span></a></div></div>`;
}
function render(focusHeading = false) {
  const data = practiceData[currentPractice];
  if (!data) return;
  practiceContent.innerHTML = heading(data) + (stage === 'intro' ? introMarkup(data) : stage === 'done' ? completeMarkup(data) : currentPractice === 'breathe' ? breathMarkup() : stepMarkup(data));
  if (focusHeading) document.querySelector('#practice-title').focus({ preventScroll: true });
}
function resetPractice(id) {
  stopBreathTimer();
  currentPractice = id;
  stage = 'intro';
  stepIndex = 0;
  selected = -1;
  breathSeconds = 0;
  render(true);
}
function route() {
  const hash = location.hash.slice(1);
  closeMenu();
  if (practiceData[hash]) {
    homeView.hidden = true;
    practiceView.hidden = false;
    if (currentPractice !== hash) resetPractice(hash);
    window.scrollTo(0, 0);
  } else {
    stopBreathTimer();
    currentPractice = null;
    practiceView.hidden = true;
    homeView.hidden = false;
    requestAnimationFrame(() => {
      const target = document.getElementById(hash);
      if (target) target.scrollIntoView();
      else window.scrollTo(0, 0);
    });
  }
}
window.addEventListener('hashchange', route);
route();

practiceContent.addEventListener('click', event => {
  const choice = event.target.closest('[data-choice]');
  if (choice) {
    selected = Number(choice.dataset.choice);
    render();
    document.querySelector(`[data-choice="${selected}"]`).focus();
    return;
  }
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!action) return;
  if (action === 'start') {
    stage = 'active';
    if (currentPractice === 'breathe') startBreathTimer();
  } else if (action === 'next' && selected >= 0) {
    if (stepIndex === 2) stage = 'done';
    else { stepIndex += 1; selected = -1; }
  } else if (action === 'pause') {
    stage = 'paused'; stopBreathTimer();
  } else if (action === 'resume') {
    stage = 'active'; startBreathTimer();
  } else if (action === 'finish') {
    stage = 'done'; stopBreathTimer();
  } else if (action === 'again') {
    resetPractice(currentPractice); return;
  } else if (action === 'exit') {
    location.hash = '#home'; return;
  }
  render();
  const nextFocus = practiceContent.querySelector('.choice, [data-action="pause"], [data-action="resume"], [data-action="again"]');
  nextFocus?.focus({ preventScroll: true });
});
