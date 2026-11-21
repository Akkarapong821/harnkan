// Parse arithmetic directly; never execute user input as JavaScript.
// Rational arithmetic keeps decimal amounts exact until the final satang rounding.
export function evaluateDiscount(expression) {
  if (!expression.trim()) throw new Error('ใส่ตัวเลขเพื่อเริ่มคำนวณ');
  if (expression.length > 160) throw new Error('สูตรยาวเกินไป กรุณาแบ่งคำนวณ');
  const source = expression.replaceAll('×', '*').replaceAll('÷', '/').replaceAll('−', '-');
  const tokens = source.match(/\d+(?:\.\d*)?|\.\d+|[()+\-*/%]|\S/g) || [];
  let position = 0;
  const peek = () => tokens[position];
  const fraction = (n, d = 1n) => {
    if (d === 0n) throw new Error('หารด้วยศูนย์ไม่ได้');
    if (d < 0n) { n = -n; d = -d; }
    let a = n < 0n ? -n : n, b = d;
    while (b) [a, b] = [b, a % b];
    return { n: n / a, d: d / a };
  };
  function primary() {
    let value;
    if (peek() === '(') {
      position++;
      value = sum();
      if (tokens[position++] !== ')') throw new Error('ใส่วงเล็บให้ครบ');
    } else {
      const token = tokens[position++];
      if (!token || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(token)) throw new Error('ใส่สูตรให้ครบ เช่น ตัวเลขตามด้วยเครื่องหมายและตัวเลข');
      const [whole, decimal = ''] = token.split('.');
      value = fraction(BigInt((whole || '0') + decimal), 10n ** BigInt(decimal.length));
    }
    while (peek() === '%') { position++; value = fraction(value.n, value.d * 100n); }
    return value;
  }
  function unary() {
    if (peek() === '+' || peek() === '-') { const sign = tokens[position++]; const value = unary(); return sign === '-' ? { n: -value.n, d: value.d } : value; }
    return primary();
  }
  function product() {
    let a = unary();
    while (peek() === '*' || peek() === '/') {
      const operator = tokens[position++], b = unary();
      a = operator === '*' ? fraction(a.n * b.n, a.d * b.d) : fraction(a.n * b.d, a.d * b.n);
    }
    return a;
  }
  function sum() {
    let a = product();
    while (peek() === '+' || peek() === '-') {
      const operator = tokens[position++], b = product();
      a = fraction(a.n * b.d + (operator === '+' ? 1n : -1n) * b.n * a.d, a.d * b.d);
    }
    return a;
  }
  const value = sum();
  if (position !== tokens.length) throw new Error('ตรวจสอบตัวเลขและเครื่องหมายในสูตร');
  const magnitude = value.n < 0n ? -value.n : value.n;
  const cents = (magnitude * 200n + value.d) / (value.d * 2n);
  const sign = value.n < 0n && cents !== 0n ? '-' : '';
  return `${sign}${cents / 100n}.${String(cents % 100n).padStart(2, '0')}`;
}
