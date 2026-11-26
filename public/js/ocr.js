/* Free, keyless photo fallback: on-device OCR (Tesseract.js) reads text printed on the product or box */
const OCR = {
  async load() {
    if (window.Tesseract) return;
    await new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js'; s.onload = ok; s.onerror = () => no(new Error('OCR engine unavailable')); setTimeout(() => no(new Error('OCR engine timed out')), 20000); document.head.appendChild(s); });
  },
  async guess(uri) {
    await OCR.load();
    const r = await window.Tesseract.recognize(uri, 'eng');
    const lines = r.data.text.split('\n').map(l => l.replace(/[^\w\s.\-+/&]/g, ' ').replace(/\s+/g, ' ').trim()).filter(l => l.length >= 4 && /[a-z]{3,}/i.test(l));
    const top = [...lines].sort((a, b) => b.length - a.length).slice(0, 3);
    return lines.filter(l => top.includes(l)).join(' ').slice(0, 100);
  }
};
