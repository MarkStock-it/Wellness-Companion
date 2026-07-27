export function getAiSettings() {
  try {
    const savedConsent = JSON.parse(localStorage.getItem('wc-ai-consent') || 'false');
    return {
      profile: JSON.parse(localStorage.getItem('wc-profile') || 'null'),
      consent: savedConsent?.accepted === true && savedConsent.version === 'prototype-2-multi-provider',
    };
  } catch {
    return { profile: null, consent: false };
  }
}

export function requestAiSetup() {
  window.dispatchEvent(new Event('wc-open-ai-setup'));
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function callAi(payload) {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'The AI service is unavailable right now.');
  return data;
}
