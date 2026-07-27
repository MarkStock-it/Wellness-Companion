export async function extractTextLocally(image, onProgress = () => {}) {
  const { createWorker, PSM } = await import('tesseract.js');
  const worker = await createWorker('eng', undefined, {
    logger(message) {
      if (message.status === 'recognizing text') onProgress(Math.round((message.progress || 0) * 100));
    },
  });
  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SPARSE_TEXT,
      preserve_interword_spaces: '1',
      user_defined_dpi: '300',
    });
    const result = await worker.recognize(image);
    return normalizeLabSymbols(result.data.text)
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  } finally {
    await worker.terminate();
  }
}

function normalizeLabSymbols(text) {
  return String(text)
    .replace(/[⁄∕]/g, '/')
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/\b(g|mg|mcg|µg|mmol|mol|mEq)\s*[|Il\\]\s*(L|l)\b/g, '$1/$2')
    .replace(/\b(g|mg)\s*[|Il\\]\s*(dL|dl)\b/g, '$1/$2')
    .replace(/\b(10)\s*[xX*]\s*([369])\s*\/\s*L\b/g, '$1^$2/L')
    .replace(/\b([0-9])\s*,\s*([0-9])\b/g, '$1.$2')
    .replace(/[ \t]{2,}/g, ' ');
}
