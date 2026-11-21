import { evaluateDiscount } from './discount-math.js';
import { toSatang } from './calculator.js';

export function setupDiscountPad(onApply) {
  const input = document.getElementById('calc-expression');
  const output = document.getElementById('calc-result');
  const message = document.getElementById('calc-message');
  const apply = document.getElementById('calc-apply');
  let answer = null;
  function refresh(showError = false) {
    answer = null;
    apply.disabled = true;
    message.textContent = '';
    input.removeAttribute('aria-invalid');
    try {
      const result = evaluateDiscount(input.value);
      output.textContent = result.length < 22 ? Number(result).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : result;
      if (result.startsWith('-')) { message.textContent = 'ส่วนลดต้องไม่น้อยกว่า 0 บาท'; return; }
      toSatang(result);
      answer = result;
      apply.disabled = false;
    } catch (error) {
      output.textContent = '—';
      if (showError || input.value.trim()) message.textContent = error.message;
      if (showError) input.setAttribute('aria-invalid', 'true');
    }
  }
  input.addEventListener('input', () => refresh());
  input.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === '=') { event.preventDefault(); refresh(true); } });
  const keypad = document.getElementById('calc-keys');
  // Keep the text selection while tapping a key, without opening the phone keyboard.
  keypad.addEventListener('pointerdown', event => { if (event.target.closest('button')) event.preventDefault(); });
  keypad.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    const key = button.dataset.key;
    if (key === 'clear') { input.value = ''; refresh(); return; }
    if (key === '=') { refresh(true); return; }
    let start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    if (key === 'backspace') { if (start === end) start = Math.max(0, start - 1); input.setRangeText('', start, end, 'end'); }
    else if (input.value.length - (end - start) + key.length <= input.maxLength) input.setRangeText(key, start, end, 'end');
    refresh();
  });
  apply.addEventListener('click', () => { if (answer !== null) onApply(answer); });
  refresh();
  return () => { input.value = ''; refresh(); };
}
