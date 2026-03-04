const CIRCUMFERENCE = 2 * Math.PI * 52; // matches r=52 in SVG
const WORK_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

const timerEl = document.getElementById('timer');
const ringEl = document.getElementById('ring');
const startPauseBtn = document.getElementById('start-pause');
const resetBtn = document.getElementById('reset');
const statusEl = document.getElementById('status');
const modeBtns = document.querySelectorAll('.mode-btn');

let tickInterval = null;
let currentState = null;

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function setProgress(timeLeft, totalTime) {
  const progress = timeLeft / totalTime;
  ringEl.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);
}

function getTotalTime(mode) {
  return mode === 'work' ? WORK_TIME : BREAK_TIME;
}

function render(state) {
  const timeLeft = state.isRunning
    ? Math.max(0, Math.ceil((state.endTime - Date.now()) / 1000))
    : state.timeLeft;

  timerEl.textContent = formatTime(timeLeft);
  setProgress(timeLeft, getTotalTime(state.mode));

  startPauseBtn.textContent = state.isRunning ? 'Pause' : 'Start';

  document.body.classList.toggle('break-mode', state.mode === 'break');

  modeBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === state.mode);
    btn.disabled = state.isRunning;
    btn.style.cursor = state.isRunning ? 'not-allowed' : 'pointer';
  });

  if (state.isRunning) {
    statusEl.textContent = state.mode === 'work' ? 'Stay focused!' : 'Take a breather...';
  } else if (timeLeft === getTotalTime(state.mode)) {
    statusEl.textContent = 'Ready to focus';
  } else {
    statusEl.textContent = 'Paused';
  }
}

function startTick() {
  stopTick();
  tickInterval = setInterval(async () => {
    const state = await sendMessage({ type: 'GET_STATE' });
    currentState = state;
    render(state);
    if (!state.isRunning) stopTick();
  }, 500);
}

function stopTick() {
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
}

function sendMessage(msg) {
  return chrome.runtime.sendMessage(msg);
}

async function init() {
  currentState = await sendMessage({ type: 'GET_STATE' });
  render(currentState);
  if (currentState.isRunning) startTick();
}

startPauseBtn.addEventListener('click', async () => {
  if (currentState.isRunning) {
    currentState = await sendMessage({ type: 'PAUSE' });
    currentState = await sendMessage({ type: 'GET_STATE' });
    stopTick();
  } else {
    await sendMessage({ type: 'START' });
    currentState = await sendMessage({ type: 'GET_STATE' });
    startTick();
  }
  render(currentState);
});

resetBtn.addEventListener('click', async () => {
  await sendMessage({ type: 'RESET' });
  stopTick();
  currentState = await sendMessage({ type: 'GET_STATE' });
  render(currentState);
});

modeBtns.forEach(btn => {
  btn.addEventListener('click', async () => {
    if (currentState.isRunning) return;
    await sendMessage({ type: 'SET_MODE', mode: btn.dataset.mode });
    currentState = await sendMessage({ type: 'GET_STATE' });
    render(currentState);
  });
});

init();
