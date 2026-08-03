const mode = document.querySelector('#mode');
const fixation = document.querySelector('#fixation');
const fixationValue = document.querySelector('#fixationValue');
const openReader = document.querySelector('#openReader');
const status = document.querySelector('#status');

const profiles = {
  default: { fixation: 0.5 },
  adhd: { fixation: 0.6 },
  dyslexia: { fixation: 0.4 },
  focus: { fixation: 0.3 },
};

function updateFixation(value) {
  fixation.value = value;
  fixationValue.textContent = `${Math.round(Number(value) * 100)}%`;
}

chrome.storage.local.get({ mode: 'default', fixation: 0.5 }, settings => {
  mode.value = settings.mode;
  updateFixation(settings.fixation);
});

mode.addEventListener('change', () => {
  updateFixation(profiles[mode.value].fixation);
});

fixation.addEventListener('input', () => updateFixation(fixation.value));

openReader.addEventListener('click', async () => {
  status.textContent = 'Reading this page…';
  openReader.disabled = true;

  const settings = {
    mode: mode.value,
    fixation: Number(fixation.value),
  };
  await chrome.storage.local.set(settings);

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_ARTICLE' });

    if (!response?.text) throw new Error('No readable article found on this page.');
    await chrome.tabs.sendMessage(tab.id, {
      type: 'OPEN_READER',
      title: response.title,
      text: response.text,
      settings,
    });
    status.textContent = 'NeuroLens is open on this page.';
  } catch (error) {
    status.textContent = error.message || 'This page could not be transformed.';
  } finally {
    openReader.disabled = false;
  }
});
