// All calculations use integer satang; largest remainders receive the spare satang.
export function toSatang(value) {
  const text = String(value).trim();
  if (!/^\d+(\.\d{0,2})?$/.test(text)) throw new Error('กรอกจำนวนเงินตั้งแต่ 0 และทศนิยมไม่เกิน 2 ตำแหน่ง');
  const [whole, fraction = ''] = text.split('.');
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(amount) || amount > 100000000) throw new Error('จำนวนเงินต้องไม่เกิน 1,000,000 บาท');
  return amount;
}

export function calculate(people, delivery, discount) {
  if (!people.length) throw new Error('เพิ่มคนอย่างน้อย 1 คน');
  const amounts = people.map(person => toSatang(person.amount || '0'));
  const subtotal = amounts.reduce((sum, amount) => sum + amount, 0);
  const shipping = toSatang(delivery || '0');
  const savings = toSatang(discount || '0');
  if (savings > subtotal + shipping) throw new Error('ส่วนลดต้องไม่เกินค่าสินค้ารวมกับค่าส่ง');
  if (!subtotal) throw new Error('ใส่ราคาสินค้าอย่างน้อย 1 คน เพื่อเริ่มคำนวณ');
  const total = subtotal + shipping - savings;
  const shares = amounts.map((amount, index) => {
    const numerator = BigInt(total) * BigInt(amount);
    return { index, amount, payable: Number(numerator / BigInt(subtotal)), remainder: numerator % BigInt(subtotal) };
  });
  let spare = total - shares.reduce((sum, share) => sum + share.payable, 0);
  const ranked = [...shares].sort((a, b) => a.remainder === b.remainder ? a.index - b.index : a.remainder > b.remainder ? -1 : 1);
  for (let i = 0; i < spare; i++) ranked[i].payable++;
  return { subtotal, shipping, savings, total, shares };
}
