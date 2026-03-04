const WORK_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

function defaultState() {
  return { mode: 'work', isRunning: false, endTime: null, timeLeft: WORK_TIME };
}

async function getState() {
  const result = await chrome.storage.session.get(['mode', 'isRunning', 'endTime', 'timeLeft']);
  if (result.mode === undefined) return defaultState();
  return result;
}

async function setState(state) {
  await chrome.storage.session.set(state);
}

function calcTimeLeft(state) {
  if (state.isRunning && state.endTime) {
    return Math.max(0, Math.ceil((state.endTime - Date.now()) / 1000));
  }
  return state.timeLeft;
}

async function updateBadge(timeLeft, mode) {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const text = `${mins}:${secs.toString().padStart(2, '0')}`;
  const color = mode === 'work' ? '#e74c3c' : '#27ae60';
  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({ color });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'pomodoro-end') {
    const state = await getState();
    const newMode = state.mode === 'work' ? 'break' : 'work';
    const newTimeLeft = newMode === 'work' ? WORK_TIME : BREAK_TIME;
    await setState({ mode: newMode, isRunning: false, endTime: null, timeLeft: newTimeLeft });
    await chrome.action.setBadgeText({ text: '' });
    chrome.alarms.clear('pomodoro-tick');
  }

  if (alarm.name === 'pomodoro-tick') {
    const state = await getState();
    if (state.isRunning) {
      const timeLeft = calcTimeLeft(state);
      await updateBadge(timeLeft, state.mode);
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message).then(sendResponse).catch(e => sendResponse({ error: e.message }));
  return true;
});

async function handleMessage(message) {
  const state = await getState();

  switch (message.type) {
    case 'GET_STATE': {
      const timeLeft = calcTimeLeft(state);
      return { ...state, timeLeft };
    }

    case 'START': {
      if (state.isRunning) return { success: false };
      const endTime = Date.now() + state.timeLeft * 1000;
      await setState({ ...state, isRunning: true, endTime });
      chrome.alarms.create('pomodoro-end', { when: endTime });
      chrome.alarms.create('pomodoro-tick', { periodInMinutes: 1 / 60 });
      await updateBadge(state.timeLeft, state.mode);
      return { success: true };
    }

    case 'PAUSE': {
      if (!state.isRunning) return { success: false };
      const timeLeft = calcTimeLeft(state);
      await setState({ ...state, isRunning: false, endTime: null, timeLeft });
      chrome.alarms.clear('pomodoro-end');
      chrome.alarms.clear('pomodoro-tick');
      await chrome.action.setBadgeText({ text: '' });
      return { success: true };
    }

    case 'RESET': {
      const reset = defaultState();
      await setState(reset);
      chrome.alarms.clear('pomodoro-end');
      chrome.alarms.clear('pomodoro-tick');
      await chrome.action.setBadgeText({ text: '' });
      return { success: true };
    }

    case 'SET_MODE': {
      const timeLeft = message.mode === 'work' ? WORK_TIME : BREAK_TIME;
      await setState({ mode: message.mode, isRunning: false, endTime: null, timeLeft });
      chrome.alarms.clear('pomodoro-end');
      chrome.alarms.clear('pomodoro-tick');
      await chrome.action.setBadgeText({ text: '' });
      return { success: true };
    }
  }
}
