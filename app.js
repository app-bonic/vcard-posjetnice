'use strict';
const { $, $$, esc, obavijest, spremi, lokalno } = AB;
qrcode.stringToBytes = s => Array.from(new TextEncoder().encode(s));

const KLJUC = 'vcard-posjetnica';
const POLJA = ['ime', 'prezime', 'titula', 'tvrtka', 'mob', 'tel', 'email', 'web', 'ulica', 'pbr', 'grad', 'boja'];
const PRIMJER = { ime: 'Ana', prezime: 'Kovač', titula: 'Voditeljica projekata', tvrtka: 'Primjer d.o.o.', mob: '+385 91 234 5678', tel: '', email: 'ana.kovac@primjer.hr', web: 'www.primjer.hr', ulica: 'Ilica 1', pbr: '10000', grad: 'Zagreb', boja: '#3b5bfd' };
let S = { ...PRIMJER, predlozak: 'klasicna', logo: null, ...lokalno.uzmi(KLJUC, {}) };

// ---------------- vCard ----------------
const escV = s => String(s ?? '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
const tel = s => String(s ?? '').replace(/[^\d+]/g, '');
const url = u => { u = String(u ?? '').trim(); return u && !/^https?:/i.test(u) ? 'https://' + u : u; };
function vcard(nl = '\n') {
  const ime = [S.ime, S.prezime].map(x => (x || '').trim()).filter(Boolean).join(' ') || S.tvrtka || '';
  const L = ['BEGIN:VCARD', 'VERSION:3.0', `N:${escV(S.prezime)};${escV(S.ime)};;;`, 'FN:' + escV(ime)];
  if (S.tvrtka) L.push('ORG:' + escV(S.tvrtka));
  if (S.titula) L.push('TITLE:' + escV(S.titula));
  if (tel(S.mob)) L.push('TEL;TYPE=CELL:' + tel(S.mob));
  if (tel(S.tel)) L.push('TEL;TYPE=WORK,VOICE:' + tel(S.tel));
  if (S.email) L.push('EMAIL;TYPE=INTERNET:' + S.email.trim());
  if (S.web) L.push('URL:' + url(S.web));
  if (S.ulica || S.grad) L.push(`ADR;TYPE=WORK:;;${escV(S.ulica)};${escV(S.grad)};;${escV(S.pbr)};`);
  L.push('END:VCARD');
  return L.join(nl);
}

// ---------------- pomoćno za SVG (sve u mm) ----------------
const IKONE = {
  mob: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>',
  tel: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  email: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
  web: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  adresa: '<path d="M12 21s-7-6.3-7-12a7 7 0 0 1 14 0c0 5.7-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
};
const FONT = 'Arial, Helvetica, sans-serif';
const mjera = document.createElement('canvas').getContext('2d');
function sirinaTeksta(t, vel, deb = 400) { mjera.font = `${deb} 100px Arial, Helvetica, sans-serif`; return mjera.measureText(t).width / 100 * vel; }
function tekst(t, x, y, vel, { boja = '#111', deb = 400, maks = 80, sidro = 'start', razmak = 0 } = {}) {
  if (!t) return '';
  let v = vel;
  while (v > vel * .6 && sirinaTeksta(t, v, deb) > maks) v -= .05;
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${v.toFixed(2)}" font-weight="${deb}" fill="${boja}" text-anchor="${sidro}"${razmak ? ` letter-spacing="${razmak}"` : ''}>${esc(t)}</text>`;
}
function ikona(k, x, y, vel, boja) {
  const s = vel / 24;
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${boja}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${IKONE[k]}</g>`;
}
function qrSvg(x, y, vel, boja = '#111', pozadina = '#fff') {
  const qr = qrcode(0, 'M');
  qr.addData(vcard());
  qr.make();
  const n = qr.getModuleCount(), rub = 1.5, m = (vel - 2 * rub) / n;
  let p = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) p += `M${(x + rub + c * m).toFixed(3)} ${(y + rub + r * m).toFixed(3)}h${m.toFixed(3)}v${m.toFixed(3)}h${(-m).toFixed(3)}z`;
  return `<rect x="${x}" y="${y}" width="${vel}" height="${vel}" rx="1.2" fill="${pozadina}"/><path d="${p}" fill="${boja}" shape-rendering="crispEdges"/>`;
}
function logo(x, y, w, h, sidro = 'xMaxYMin') {
  return S.logo ? `<image x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="${sidro} meet" href="${S.logo}" xlink:href="${S.logo}"/>` : '';
}
function kontakti() {
  const adr = [S.ulica, [S.pbr, S.grad].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  return [['mob', S.mob], ['tel', S.tel], ['email', S.email], ['web', (S.web || '').replace(/^https?:\/\//, '')], ['adresa', adr]].filter(([, v]) => v && v.trim());
}
function kontaktiSvg(x, y, maks, { boja = '#333', ikonaBoja = S.boja, vel = 2.45, red = 4.1 } = {}) {
  return kontakti().slice(0, 5).map(([k, v], i) => ikona(k, x, y + i * red - 2.25, 2.7, ikonaBoja) + tekst(v, x + 4, y + i * red, vel, { boja, maks: maks - 4 })).join('');
}
const imePrezime = () => [S.ime, S.prezime].filter(Boolean).join(' ');

// ---------------- predlošci (85 × 55 mm) ----------------
const PREDLOSCI = {
  klasicna() {
    const n = kontakti().length, qy = 55 - 5 - 21;
    return `<rect width="85" height="55" fill="#fff"/>
      ${logo(56, 5, 24, 9)}
      ${tekst(imePrezime(), 6, 12.5, 5, { deb: 700, maks: S.logo ? 48 : 73 })}
      ${tekst(S.titula, 6, 17.3, 2.7, { boja: S.boja, deb: 600, maks: S.logo ? 48 : 73 })}
      ${tekst(S.tvrtka, 6, 21, 2.6, { boja: '#555', maks: 73 })}
      <rect x="6" y="23.6" width="12" height=".6" fill="${S.boja}"/>
      ${kontaktiSvg(6, 55 - 5.5 - (n - 1) * 4.1, 50)}
      ${qrSvg(59, qy, 21)}`;
  },
  traka() {
    const n = kontakti().length;
    return `<rect width="85" height="55" fill="#fff"/><rect width="5" height="55" fill="${S.boja}"/>
      ${logo(56, 5, 24, 9)}
      ${tekst(imePrezime(), 10, 12.5, 5, { deb: 700, maks: S.logo ? 44 : 70 })}
      ${tekst(S.titula, 10, 17.3, 2.7, { boja: S.boja, deb: 600, maks: 70 })}
      ${tekst(S.tvrtka, 10, 21, 2.6, { boja: '#555', maks: 70 })}
      ${kontaktiSvg(10, 55 - 5.5 - (n - 1) * 4.1, 47)}
      ${qrSvg(59, 29, 21)}`;
  },
  tamna() {
    const n = kontakti().length;
    return `<rect width="85" height="55" fill="#0f172a"/><rect x="0" y="0" width="85" height="1.4" fill="${S.boja}"/>
      ${logo(56, 5, 24, 9)}
      ${tekst(imePrezime(), 6, 12.5, 5, { boja: '#fff', deb: 700, maks: S.logo ? 48 : 73 })}
      ${tekst(S.titula, 6, 17.3, 2.7, { boja: S.boja, deb: 600, maks: 73 })}
      ${tekst(S.tvrtka, 6, 21, 2.6, { boja: '#cbd5e1', maks: 73 })}
      ${kontaktiSvg(6, 55 - 5.5 - (n - 1) * 4.1, 50, { boja: '#e2e8f0' })}
      ${qrSvg(59, 29, 21, '#0f172a', '#fff')}`;
  },
  sredina() {
    const n = kontakti().length, y0 = S.logo ? 17 : 12.5;
    return `<rect width="85" height="55" fill="#fff"/>
      ${logo(27.5, 3.5, 30, 8, 'xMidYMid')}
      ${tekst(imePrezime(), 42.5, y0, 4.8, { deb: 700, maks: 75, sidro: 'middle' })}
      ${tekst([S.titula, S.tvrtka].filter(Boolean).join(' · '), 42.5, y0 + 4.6, 2.6, { boja: S.boja, deb: 600, maks: 75, sidro: 'middle' })}
      <rect x="6" y="${y0 + 7.2}" width="73" height=".3" fill="#d4d4d8"/>
      ${qrSvg(6, 55 - 5 - 19, 19)}
      ${kontaktiSvg(29, 55 - 5.5 - (n - 1) * 4.1 + (n < 4 ? -2 : 0), 50)}`;
  },
};
function kartaSvg(w, h) {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 85 55" width="${w}" height="${h}">${(PREDLOSCI[S.predlozak] || PREDLOSCI.klasicna)()}</svg>`;
}
function arakSvg() {
  const unutra = (PREDLOSCI[S.predlozak] || PREDLOSCI.klasicna)();
  let t = '', rez = '';
  for (let r = 0; r < 5; r++) for (let s = 0; s < 2; s++) t += `<svg x="${20 + s * 85}" y="${11 + r * 55}" width="85" height="55" viewBox="0 0 85 55">${unutra}</svg>`;
  if ($('#rezne').checked) {
    const L = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#888" stroke-width=".15"/>`;
    for (const x of [20, 105, 190]) rez += L(x, 3, x, 9) + L(x, 288, x, 294);
    for (let r = 0; r <= 5; r++) { const y = 11 + r * 55; rez += L(4, y, 18, y) + L(192, y, 206, y); }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 210 297" width="210mm" height="297mm"><rect width="210" height="297" fill="#fff"/>${t}${rez}</svg>`;
}

// ---------------- crtanje i radnje ----------------
function nacrtaj() {
  lokalno.stavi(KLJUC, S);
  $('#prikaz').innerHTML = kartaSvg(850, 550);
  $$('#predlosci [data-predlozak]').forEach(b => b.setAttribute('aria-pressed', b.dataset.predlozak === S.predlozak));
  $('#logoMakni').hidden = !S.logo;
}
function postaviPolja() { $$('[data-p]').forEach(el => { el.value = S[el.dataset.p] ?? ''; }); }

document.addEventListener('input', e => { const k = e.target.dataset?.p; if (k) { S[k] = e.target.value; nacrtaj(); } });
$('#rezne').addEventListener('change', nacrtaj);
$('#predlosci').addEventListener('click', e => { const b = e.target.closest('[data-predlozak]'); if (b) { S.predlozak = b.dataset.predlozak; nacrtaj(); } });

const logoUlaz = document.createElement('input');
logoUlaz.type = 'file'; logoUlaz.accept = 'image/png,image/jpeg,image/svg+xml,image/webp';
logoUlaz.onchange = () => {
  const f = logoUlaz.files[0]; logoUlaz.value = '';
  if (!f) return;
  if (f.size > 3 * 1024 * 1024) return obavijest('Logo je veći od 3 MB.');
  const fr = new FileReader();
  fr.onload = () => {
    if (f.type === 'image/svg+xml') { S.logo = fr.result; return nacrtaj(); }
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 800 / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      S.logo = c.toDataURL('image/png'); nacrtaj();
    };
    img.src = fr.result;
  };
  fr.readAsDataURL(f);
};
$('#logoGumb').onclick = () => logoUlaz.click();
$('#logoMakni').onclick = () => { S.logo = null; nacrtaj(); };

const osnovnoIme = () => ([S.ime, S.prezime].filter(Boolean).join('-') || 'posjetnica').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/[^\w-]+/g, '-');
$('#svg').onclick = () => spremi(new Blob([kartaSvg('85mm', '55mm')], { type: 'image/svg+xml' }), osnovnoIme() + '-posjetnica.svg');
$('#vcf').onclick = () => spremi(new Blob([vcard('\r\n') + '\r\n'], { type: 'text/vcard;charset=utf-8' }), osnovnoIme() + '.vcf');
$('#png').onclick = () => {
  const w = Math.round(85 / 25.4 * 300), h = Math.round(55 / 25.4 * 300);
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d').drawImage(img, 0, 0, w, h);
    c.toBlob(b => spremi(b, osnovnoIme() + '-posjetnica.png'));
  };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(kartaSvg(w, h));
};
$('#ispisi').onclick = () => { $('#arak').innerHTML = arakSvg(); window.print(); };
window.addEventListener('afterprint', () => { $('#arak').innerHTML = ''; });

postaviPolja();
nacrtaj();
