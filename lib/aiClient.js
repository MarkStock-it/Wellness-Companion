export function getAiSettings() {
  try {
    const savedConsent = JSON.parse(localStorage.getItem('wc-ai-consent') || 'false');
    return {
      profile: JSON.parse(localStorage.getItem('wc-profile') || 'null'),
      consent: savedConsent?.accepted === true && savedConsent.version === 'prototype-2-multi-provider',
      config: JSON.parse(sessionStorage.getItem('wc-ai-session-config') || 'null'),
    };
  } catch {
    return { profile: null, consent: false, config: null };
  }
}

export function requestAiSetup() {
  window.dispatchEvent(new Event('wc-open-ai-setup'));
}

function rawDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function readFileAsDataUrl(file) {
  const original = await rawDataUrl(file);
  try {
    const image = new Image();
    const loaded = new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });
    image.src = original;
    await loaded;
    const maxSide = 1600;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext('2d', { alpha: false });
    context.fillStyle = '#ffffff'; context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.82);
  } catch {
    return original;
  }
}

export async function callAi(payload) {
  const config = getAiSettings().config;
  if (!config?.provider || !config?.apiKey) {
    requestAiSetup();
    throw new Error('Choose an AI provider and enter an API key first.');
  }
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, aiConfig: config }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const reference = data.requestId ? ` Reference: ${data.requestId}.` : '';
    throw new Error(`${data.error || 'The AI service is unavailable right now.'}${reference}`);
  }
  return data;
}
