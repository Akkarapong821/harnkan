import { calculate } from './calculator.js';
import { setupDiscountPad } from './discount-pad.js';
const $ = id => document.getElementById(id);
const storageKey = 'harnkan-bill-v1';
const newBill = () => ({ people: [{ name: '', amount: '' }, { name: '', amount: '' }], delivery: '', discount: '' });
let state = newBill();
try { const saved = JSON.parse(localStorage.getItem(storageKey)); if (saved && saved.sample !== true && Array.isArray(saved.people) && saved.people.length > 0 && saved.people.length <= 100 && saved.people.every(p => typeof p.name === 'string' && typeof p.amount === 'string') && typeof saved.delivery === 'string' && typeof saved.discount === 'string') state = { people: saved.people, delivery: saved.delivery, discount: saved.discount }; } catch {}
let latest;
const money = cents => (cents / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nameOf = i => state.people[i].name.trim() || `คนที่ ${i + 1}`;
function persist() { try { localStorage.setItem(storageKey, JSON.stringify(state)); $('save-status').textContent = 'บันทึกในเครื่องนี้อัตโนมัติ'; } catch { $('save-status').textContent = 'เครื่องนี้ไม่อนุญาตให้บันทึกบิล'; } }
function make(tag, className, text) { const node = document.createElement(tag); node.className = className; if (text !== undefined) node.textContent = text; return node; }
function renderPeople() {
  $('people').replaceChildren();
  state.people.forEach((person, i) => {
    const row = make('div', 'person-row');
    row.append(make('span', 'avatar', String(i + 1)));
    const name = make('input', 'person-name'); name.value = person.name; name.placeholder = `คนที่ ${i + 1}`; name.maxLength = 40; name.setAttribute('aria-label', `ชื่อคนที่ ${i + 1}`); name.autocomplete = 'off';
    name.addEventListener('input', () => { person.name = name.value; changed(); });
    const amountWrap = make('div', 'money-input'); const amount = make('input', 'person-amount'); amount.value = person.amount; amount.inputMode = 'decimal'; amount.placeholder = '0.00'; amount.maxLength = 12; amount.setAttribute('aria-label', `ราคาสินค้าคนที่ ${i + 1}`); amount.autocomplete = 'off';
    amount.addEventListener('input', () => { person.amount = amount.value; changed(); }); amountWrap.append(amount, make('span', '', '฿'));
    const remove = make('button', 'remove', '×'); remove.type = 'button'; remove.setAttribute('aria-label', `ลบคนที่ ${i + 1}`); remove.disabled = state.people.length === 1;
    remove.addEventListener('click', () => { state.people.splice(i, 1); renderPeople(); update(); persist(); const names = document.querySelectorAll('.person-name'); names[Math.min(i, names.length - 1)]?.focus(); });
    row.append(name, amountWrap, remove); $('people').append(row);
  });
  $('count').textContent = `${state.people.length} คน`; $('add').disabled = state.people.length >= 100;
}
function changed() { update(); persist(); }
function update() {
  const empty = state.people.every(person => !person.amount.trim()) && !state.delivery.trim() && !state.discount.trim();
  $('empty-state').hidden = !empty;
  if (empty) { latest = null; $('error').hidden = true; $('result').hidden = true; $('copy').disabled = true; return; }
  try {
    latest = calculate(state.people, state.delivery, state.discount);
    $('error').hidden = true; $('result').hidden = false; $('copy').disabled = false;
    $('total').textContent = money(latest.total); $('total-people').textContent = `สำหรับ ${state.people.length} คน`;
    $('subtotal').textContent = `${money(latest.subtotal)} ฿`; $('shipping-total').textContent = `+${money(latest.shipping)} ฿`; $('discount-total').textContent = `−${money(latest.savings)} ฿`; $('check-total').textContent = `${money(latest.total)} ฿`;
    $('shares').replaceChildren();
    latest.shares.forEach((share, i) => {
      const row = make('div', 'share-row'); const identity = make('div', 'share-person'); identity.append(make('strong', '', nameOf(i)), make('small', '', `สั่ง ${money(share.amount)} ฿ · ${(share.amount / latest.subtotal * 100).toFixed(1)}% ของบิล`));
      const pay = make('div', 'share-pay', money(share.payable)); pay.append(make('small', '', '฿'));
      row.append(make('span', 'avatar', Array.from(nameOf(i))[0].toUpperCase()), identity, pay); $('shares').append(row);
    });
  } catch (error) { latest = null; $('error').textContent = error.message; $('error').hidden = false; $('result').hidden = true; $('copy').disabled = true; }
}
function render() { renderPeople(); $('delivery').value = state.delivery; $('discount').value = state.discount; update(); }
['delivery', 'discount'].forEach(id => $(id).addEventListener('input', () => { state[id] = $(id).value; changed(); }));
$('add').addEventListener('click', () => { if (state.people.length >= 100) return; state.people.push({ name: '', amount: '' }); renderPeople(); update(); persist(); $('people').lastElementChild.querySelector('input').focus(); });
let pendingAction;
function confirmReplace(title, action) { $('dialog-title').textContent = title; pendingAction = action; $('confirm').showModal(); }
$('confirm').addEventListener('close', () => { if ($('confirm').returnValue === 'confirm') pendingAction?.(); pendingAction = null; });
$('reset').addEventListener('click', () => confirmReplace('เริ่มบิลใหม่?', () => { state = newBill(); resetDiscountPad(); render(); persist(); $('people').querySelector('input').focus(); }));
let toastTimer;
function toast(text) { $('toast').textContent = text; $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').hidden = true, 3000); }
$('copy').addEventListener('click', async () => {
  if (!latest) return;
  const text = ['สรุปบิล · หารกัน', ...latest.shares.map((share, i) => `${nameOf(i)}: ${money(share.payable)} บาท`), `รวม: ${money(latest.total)} บาท`, '', `ค่าสินค้า ${money(latest.subtotal)} + ค่าส่ง ${money(latest.shipping)} − ส่วนลด ${money(latest.savings)} บาท`, 'แบ่งยอดสุทธิตามสัดส่วนราคาสินค้าของแต่ละคน'].join('\n');
  try { await navigator.clipboard.writeText(text); toast('คัดลอกแล้ว ส่งในกลุ่มได้เลย'); } catch { $('copy-text').value = text; $('copy-dialog').showModal(); $('copy-text').focus(); $('copy-text').select(); }
});
const resetDiscountPad = setupDiscountPad(value => {
  state.discount = value;
  $('discount').value = value;
  changed();
  toast(`ใช้ส่วนลด ${money(Math.round(Number(value) * 100))} บาทแล้ว`);
});
render();
