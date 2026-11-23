const express = require('express'), cors = require('cors'), bcrypt = require('bcryptjs'),
  jwt = require('jsonwebtoken'), fs = require('fs'), path = require('path');
const SECRET = process.env.JWT_SECRET || 'change-this-secret', PORT = process.env.PORT || 3000;
const FILE = path.join(__dirname, 'db.json');
const ST = ['Նոր', 'Ուղարկված', 'Առաքված', 'Չեղարկված'];
const CATS = ['phone', 'laptop', 'audio', 'watch', 'game', 'home', 'photo'];

function seed() {
  const P = [
    ['Սմարթֆոն Nova X Pro 256 ԳԲ', 'phone', 389000, 449000, '📱', 'Հիթ', 'Եռակի տեսախցիկ 50 ՄՊ, OLED էկրան 120 Հց, արագ լիցքավորում 80 Վտ։', 4.8, 12],
    ['Սմարթֆոն Lite 5G 128 ԳԲ', 'phone', 124000, 0, '📲', 'Նորույթ', '5G, 5000 մԱժ մարտկոց, 6,6 դյույմանոց էկրան։', 4.4, 30],
    ['Նոութբուք AirBook 14 M2', 'laptop', 549000, 619000, '💻', 'Հիթ', 'Թեթև ալյումինե կորպուս, 16 ԳԲ հիշողություն, մինչև 18 ժամ աշխատանք։', 4.9, 8],
    ['Խաղային նոութբուք Forge 16', 'laptop', 699000, 0, '🖥️', '', 'RTX գրաֆիկա, 165 Հց էկրան, 32 ԳԲ օպերատիվ հիշողություն։', 4.7, 5],
    ['Ականջակալներ Silence ANC', 'audio', 89000, 114000, '🎧', 'Հիթ', 'Ակտիվ աղմուկի ճնշում, 40 ժամ ձայն։', 4.8, 25],
    ['Անլար ականջակալներ Pods', 'audio', 39000, 0, '🎵', 'Նորույթ', 'Լիցքավորվող պատյան, IPX4 ջրակայունություն։', 4.5, 40],
    ['Դյուրակիր բարձրախոս Boom', 'audio', 29000, 37000, '🔊', '', '360° ձայն, ջրակայուն, 20 ժամ աշխատանք։', 4.6, 18],
    ['Խելացի ժամացույց Pulse 9', 'watch', 109000, 0, '⌚', 'Նորույթ', 'Սրտազարկ, ԷՍԳ, GPS, շափյուղայե ապակի։', 4.7, 14],
    ['Ֆիթնես-ապարանջան Band 8', 'watch', 19000, 25000, '📿', '', 'Քուն, քայլեր, ծանուցումներ, 14 օր աշխատանք։', 4.3, 50],
    ['Խաղային ղեկ Pro Wireless', 'game', 27000, 0, '🎮', '', 'Թրթռում, 30 ժամ, Bluetooth և USB։', 4.6, 22],
    ['VR-սաղավարտ Vision 128 ԳԲ', 'game', 174000, 199000, '🥽', 'Նորույթ', 'Ավտոնոմ սաղավարտ, 4K էկրան, 2 կառավարիչ։', 4.5, 7],
    ['Խաղային կոնսոլ Station', 'game', 249000, 0, '🕹️', 'Հիթ', '4K, 1 ՏԲ հիշողություն, կոմպլեկտում՝ ղեկ։', 4.9, 6],
    ['Խելացի տեսախցիկ Home Cam', 'home', 17000, 21000, '📹', '', 'Full HD, գիշերային տեսողություն, շարժման սենսոր։', 4.4, 35],
    ['Խելացի լամպ Glow RGB', 'home', 6500, 0, '💡', '', '16 մլն գույն, ձայնային կառավարում։', 4.5, 60],
    ['Լուսանկարչական ապարատ Snap', 'photo', 274000, 0, '📷', '', '26 ՄՊ մատրիցա, 4K տեսանյութ, Wi-Fi։', 4.8, 4],
    ['Դրոն SkyEye Mini 4K', 'photo', 224000, 249000, '🚁', 'Հիթ', 'Թռիչք՝ 34 րոպե, 4K տեսախցիկ, խոչընդոտների սենսորներ։', 4.7, 0],
  ];
  return {
    settings: { name: 'ԷլեկտրոՏուն', banner: 'Անվճար առաքում 25 000 ֏-ից · Վերադարձ 30 օրվա ընթացքում', promo: 'SALE10', pct: 10, free: 25000, ship: 1500 },
    users: [{ id: 1, name: 'Ադմինիստրատոր', email: 'admin@shop.local', pass: bcrypt.hashSync('admin123', 10), role: 'admin', date: Date.now() }],
    orders: [], subs: [],
    products: P.map((a, i) => ({ id: i + 1, name: a[0], cat: a[1], price: a[2], old: a[3], emoji: a[4], img: '', badge: a[5], desc: a[6], rate: a[7], stock: a[8], sold: Math.floor(Math.random() * 80) })),
  };
}
let db;
try { db = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { db = seed(); save(); }
function save() { fs.writeFileSync(FILE, JSON.stringify(db, null, 1)); }
db.outbox = db.outbox || []; db.reviews = db.reviews || []; db.users.forEach(u => u.cards = u.cards || []);

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const pub = u => ({ id: u.id, name: u.name, email: u.email, role: u.role, phone: u.phone || '', addr: u.addr || '', date: u.date });
const sign = u => jwt.sign({ id: u.id }, SECRET, { expiresIn: '7d' });
const auth = (req, res, next) => {
  try {
    const { id } = jwt.verify((req.headers.authorization || '').slice(7), SECRET);
    const u = db.users.find(x => x.id === id);
    if (!u) throw 0;
    req.user = u; next();
  } catch { res.status(401).json({ error: 'Մուտք գործեք համակարգ' }); }
};
const admin = (req, res, next) => req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Մուտքը մերժված է' });
const bad = (res, error) => res.status(400).json({ error });

// ---- Email (set SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / MAIL_FROM to send real emails;
// without SMTP_HOST emails are only saved to the outbox, visible in the admin panel)
const nodemailer = require('nodemailer');
const MAIL = { host: process.env.SMTP_HOST, port: +process.env.SMTP_PORT || 587, user: process.env.SMTP_USER, pass: process.env.SMTP_PASS,
  from: process.env.MAIL_FROM || 'ԷլեկտրոՏուն <no-reply@electrotun.local>' };
const tr = MAIL.host ? nodemailer.createTransport({ host: MAIL.host, port: MAIL.port, secure: MAIL.port === 465, auth: MAIL.user ? { user: MAIL.user, pass: MAIL.pass } : undefined }) : null;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const money = n => Math.round(n).toLocaleString('ru-RU') + ' ֏';
const wrap = (t, body) => `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h2 style="color:#2456e8">⚡ ${esc(db.settings.name)}</h2><h3>${t}</h3>${body}<hr><small>${esc(db.settings.name)} · Աջակցություն 24/7</small></div>`;
const orderMail = o => wrap(`Պատվեր №${o.id}`, `<p>Շնորհակալություն պատվերի համար, ${esc(o.name)}։</p><ul>${o.items.map(i => `<li>${esc(i.name)} ×${i.q} — ${money(i.price * i.q)}</li>`).join('')}</ul><p><b>Ընդամենը՝ ${money(o.total)}</b><br>Վճարում՝ ${esc(o.pay)}${o.paid ? ' (վճարված է)' : ''}<br>Հասցե՝ ${esc(o.addr)}</p>`);
async function mail(to, subject, html) {
  db.outbox.push({ id: Date.now(), to, subject, html, date: Date.now(), sent: !!tr });
  db.outbox = db.outbox.slice(-50); save();
  if (!tr) return console.log('[mail-dev]', to, '-', subject);
  try { await tr.sendMail({ from: MAIL.from, to, subject, html }); } catch (e) { console.error('Mail error:', e.message); }
}

// ---- Cards & payments
const luhn = n => { let s = 0, d = false; for (let i = n.length - 1; i >= 0; i--) { let x = +n[i]; if (d) { x *= 2; if (x > 9) x -= 9; } s += x; d = !d; } return s % 10 === 0; };
const brand = n => n[0] === '4' ? 'Visa' : /^(5[1-5]|2[2-7])/.test(n) ? 'Mastercard' : n.startsWith('9051') ? 'ArCa' : 'Քարտ';
// DEMO payment provider. In production replace with a real gateway (Idram, Ameriabank vPOS, Stripe...) and
// let the gateway collect card data: never process raw card numbers on your own server.
function charge(card, amount) {
  if (card.last4 === '0002') return { ok: false, error: 'Քարտը մերժվեց բանկի կողմից' };
  return { ok: true, ref: 'PAY-' + Date.now().toString(36).toUpperCase() };
}

// ---- Auth
app.post('/api/auth/register', (req, res) => {
  const { name = '', email = '', pass = '' } = req.body, em = String(email).trim().toLowerCase();
  if (String(name).trim().length < 2) return bad(res, 'Մուտքագրեք անունը');
  if (!/^\S+@\S+\.\S+$/.test(em)) return bad(res, 'Մուտքագրեք ճիշտ էլ. հասցե');
  if (String(pass).length < 6) return bad(res, 'Գաղտնաբառը շատ կարճ է (առնվազն 6 նիշ)');
  if (db.users.some(u => u.email === em)) return bad(res, 'Այս էլ. հասցեն արդեն գրանցված է');
  const u = { id: Math.max(...db.users.map(x => x.id)) + 1, name: String(name).trim(), email: em, pass: bcrypt.hashSync(String(pass), 10), role: 'user', date: Date.now() };
  db.users.push(u); save();
  mail(u.email, 'Բարի գալուստ ' + db.settings.name, wrap('Բարի գալուստ, ' + esc(u.name), '<p>Ձեր հաշիվը ստեղծված է։ Հաճելի գնումներ։</p>'));
  res.json({ token: sign(u), user: pub(u) });
});
app.post('/api/auth/login', (req, res) => {
  const u = db.users.find(x => x.email === String(req.body.email || '').trim().toLowerCase());
  if (!u || !bcrypt.compareSync(String(req.body.pass || ''), u.pass)) return bad(res, 'Սխալ էլ. հասցե կամ գաղտնաբառ');
  res.json({ token: sign(u), user: pub(u) });
});
app.get('/api/me', auth, (req, res) => res.json(pub(req.user)));
app.put('/api/me', auth, (req, res) => {
  const b = req.body, u = req.user;
  if (String(b.name || '').trim().length < 2) return bad(res, 'Մուտքագրեք անունը');
  if (b.pass && String(b.pass).length < 6) return bad(res, 'Գաղտնաբառը շատ կարճ է (առնվազն 6 նիշ)');
  u.name = String(b.name).trim(); u.phone = String(b.phone || '').trim(); u.addr = String(b.addr || '').trim();
  if (b.pass) u.pass = bcrypt.hashSync(String(b.pass), 10);
  save(); res.json(pub(u));
});

// ---- Public
const pubSet = () => { const { name, banner, free, ship } = db.settings; return { name, banner, free, ship }; };
app.get('/api/settings', (req, res) => res.json(pubSet()));
app.get('/api/products', (req, res) => res.json(db.products));
app.post('/api/promo', (req, res) => {
  const c = String(req.body.code || '').trim().toUpperCase();
  if (c && c === db.settings.promo.toUpperCase()) return res.json({ pct: db.settings.pct });
  bad(res, 'Պրոմոկոդը չի գտնվել');
});
app.post('/api/subscribe', (req, res) => {
  const e = String(req.body.email || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(e)) return bad(res, 'Մուտքագրեք ճիշտ էլ. հասցե');
  if (!db.subs.includes(e)) { db.subs.push(e); save(); mail(e, 'Բաժանորդագրությունը հաստատված է', wrap('Շնորհակալություն', '<p>Դուք կստանաք տեղեկություններ զեղչերի և նորույթների մասին։</p>')); }
  res.json({ ok: true });
});

// ---- Orders
app.post('/api/orders', auth, (req, res) => {
  const b = req.body, items = []; let sub = 0;
  if (!Array.isArray(b.items) || !b.items.length) return bad(res, 'Զամբյուղը դատարկ է');
  if (!String(b.name || '').trim() || String(b.phone || '').trim().length < 6 || String(b.addr || '').trim().length < 5) return bad(res, 'Լրացրեք անունը, հեռախոսը և հասցեն');
  for (const i of b.items) {
    const p = db.products.find(x => x.id === i.id), q = Math.floor(+i.q);
    if (!p || q < 1 || q > p.stock) return bad(res, `«${p ? p.name : 'Ապրանք'}» ապրանքը բավարար քանակով չկա`);
    items.push({ id: p.id, name: p.name, price: p.price, q }); sub += p.price * q;
  }
  const S = db.settings, pct = b.promo && String(b.promo).toUpperCase() === S.promo.toUpperCase() ? S.pct : 0;
  const disc = sub * pct / 100, ship = sub - disc < S.free ? S.ship : 0, total = Math.round(sub - disc + ship);
  let pay = 'Ստացման ժամանակ', paid = false, payRef = '';
  if (b.pay === 'card') {
    const c = req.user.cards.find(x => x.id === b.cardId);
    if (!c) return bad(res, 'Ընտրեք քարտը վճարման համար');
    const r = charge(c, total);
    if (!r.ok) return res.status(402).json({ error: r.error });
    pay = 'Բանկային քարտ ' + c.brand + ' •••• ' + c.last4; paid = true; payRef = r.ref;
  }
  items.forEach(i => { const p = db.products.find(x => x.id === i.id); p.stock -= i.q; p.sold = (p.sold || 0) + i.q; });
  const o = { id: Math.max(1000, ...db.orders.map(x => x.id)) + 1, uid: req.user.id, name: String(b.name).trim(), phone: String(b.phone).trim(), addr: String(b.addr).trim(),
    pay, paid, payRef, items, total, status: ST[0], date: Date.now() };
  req.user.phone = o.phone; req.user.addr = o.addr;
  db.orders.push(o); save();
  mail(req.user.email, `Պատվեր №${o.id} ընդունված է`, orderMail(o));
  res.json(o);
});
app.get('/api/orders/mine', auth, (req, res) => res.json(db.orders.filter(o => o.uid === req.user.id).sort((a, b) => b.date - a.date)));
app.get('/api/orders', auth, admin, (req, res) => res.json([...db.orders].reverse()));
app.put('/api/orders/:id', auth, admin, (req, res) => {
  const o = db.orders.find(x => x.id === +req.params.id), s = req.body.status;
  if (!o || !ST.includes(s)) return bad(res, 'Սխալ տվյալներ');
  if (s === ST[3] && o.status !== ST[3]) o.items.forEach(i => { const p = db.products.find(x => x.id === i.id); if (p) p.stock += i.q; });
  const changed = o.status !== s; o.status = s; save();
  const ou = db.users.find(x => x.id === o.uid);
  if (changed && ou) mail(ou.email, `Պատվեր №${o.id}՝ ${s}`, wrap(`Պատվեր №${o.id}`, `<p>Ձեր պատվերի նոր կարգավիճակը՝ <b>${esc(s)}</b>։</p>${s === ST[3] && o.paid ? '<p>Վճարված գումարը կվերադարձվի Ձեր քարտին։</p>' : ''}`));
  res.json(o);
});

// ---- Admin: products
const prod = b => ({ name: String(b.name || '').trim().slice(0, 120), cat: CATS.includes(b.cat) ? b.cat : 'phone', price: Math.max(0, +b.price || 0), old: Math.max(0, +b.old || 0),
  stock: Math.max(0, Math.floor(+b.stock || 0)), emoji: String(b.emoji || '📦').slice(0, 8), badge: String(b.badge || '').slice(0, 20), desc: String(b.desc || '').slice(0, 500),
  img: typeof b.img === 'string' && b.img.startsWith('data:image/') ? b.img : '' });
app.post('/api/products', auth, admin, (req, res) => {
  const d = prod(req.body); if (!d.name || d.price <= 0) return bad(res, 'Նշեք անվանումը և գինը');
  const p = { ...d, id: Math.max(0, ...db.products.map(x => x.id)) + 1, rate: 4.5, sold: 0 };
  db.products.push(p); save(); res.json(p);
});
app.put('/api/products/:id', auth, admin, (req, res) => {
  const p = db.products.find(x => x.id === +req.params.id), d = prod(req.body);
  if (!p) return res.status(404).json({ error: 'Չի գտնվել' });
  if (!d.name || d.price <= 0) return bad(res, 'Նշեք անվանումը և գինը');
  Object.assign(p, d); save(); res.json(p);
});
app.delete('/api/products/:id', auth, admin, (req, res) => { db.products = db.products.filter(x => x.id !== +req.params.id); save(); res.json({ ok: true }); });

// ---- Admin: users, settings
app.get('/api/users', auth, admin, (req, res) => res.json(db.users.map(pub)));
app.put('/api/users/:id/role', auth, admin, (req, res) => {
  const u = db.users.find(x => x.id === +req.params.id);
  if (!u || u.id === req.user.id) return bad(res, 'Սխալ տվյալներ');
  u.role = u.role === 'admin' ? 'user' : 'admin'; save(); res.json(pub(u));
});
app.delete('/api/users/:id', auth, admin, (req, res) => {
  if (+req.params.id === req.user.id) return bad(res, 'Չեք կարող ջնջել ինքներդ ձեզ');
  db.users = db.users.filter(x => x.id !== +req.params.id); save(); res.json({ ok: true });
});
app.get('/api/settings/full', auth, admin, (req, res) => res.json(db.settings));
app.put('/api/settings', auth, admin, (req, res) => {
  const b = req.body;
  db.settings = { name: String(b.name || '').trim() || 'ԷլեկտրոՏուն', banner: String(b.banner || ''), promo: String(b.promo || '').trim() || 'SALE10',
    pct: Math.min(90, Math.max(0, +b.pct || 0)), free: Math.max(0, +b.free || 0), ship: Math.max(0, +b.ship || 0) };
  save(); res.json(db.settings);
});
app.post('/api/admin/reset', auth, admin, (req, res) => { db = seed(); save(); res.json({ ok: true }); });

// ---- Cards (only brand, last 4 digits, expiry and holder are stored; number and CVV are never saved)
app.get('/api/cards', auth, (req, res) => res.json(req.user.cards));
app.post('/api/cards', auth, (req, res) => {
  const b = req.body, num = String(b.number || '').replace(/\s+/g, ''), holder = String(b.holder || '').trim(), exp = String(b.exp || '').trim(), cvv = String(b.cvv || '');
  if (!/^\d{13,19}$/.test(num) || !luhn(num)) return bad(res, 'Քարտի համարը սխալ է');
  const m = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(exp);
  if (!m) return bad(res, 'Ժամկետը մուտքագրեք ԱԱ/ՏՏ ձևաչափով');
  if (new Date(2000 + +m[2], +m[1], 1) <= new Date()) return bad(res, 'Քարտի ժամկետը լրացել է');
  if (!/^\d{3,4}$/.test(cvv)) return bad(res, 'CVV-ն սխալ է');
  if (holder.length < 2) return bad(res, 'Մուտքագրեք քարտապանի անունը');
  if (req.user.cards.length >= 5) return bad(res, 'Կարելի է պահել առավելագույնը 5 քարտ');
  const last4 = num.slice(-4);
  if (req.user.cards.some(c => c.last4 === last4 && c.exp === exp)) return bad(res, 'Այս քարտն արդեն ավելացված է');
  req.user.cards.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), brand: brand(num), last4, exp, holder: holder.toUpperCase().slice(0, 40), def: !req.user.cards.length });
  save(); res.json(req.user.cards);
});
app.put('/api/cards/:id/default', auth, (req, res) => { req.user.cards.forEach(c => c.def = c.id === req.params.id); save(); res.json(req.user.cards); });
app.delete('/api/cards/:id', auth, (req, res) => {
  req.user.cards = req.user.cards.filter(c => c.id !== req.params.id);
  if (req.user.cards.length && !req.user.cards.some(c => c.def)) req.user.cards[0].def = true;
  save(); res.json(req.user.cards);
});

// ---- Reviews
const recalc = pid => {
  const p = db.products.find(x => x.id === pid); if (!p) return;
  const r = db.reviews.filter(x => x.pid === pid); p.rc = r.length;
  if (r.length) p.rate = Math.round(r.reduce((s, x) => s + x.rating, 0) / r.length * 10) / 10;
};
app.get('/api/products/:id/reviews', (req, res) => res.json(db.reviews.filter(r => r.pid === +req.params.id).sort((a, b) => b.date - a.date)));
app.post('/api/products/:id/reviews', auth, (req, res) => {
  const pid = +req.params.id, rating = Math.round(+req.body.rating), text = String(req.body.text || '').trim();
  if (!db.products.some(p => p.id === pid)) return res.status(404).json({ error: 'Չի գտնվել' });
  if (!(rating >= 1 && rating <= 5)) return bad(res, 'Նշեք գնահատականը (1–5)');
  if (text.length < 3 || text.length > 1000) return bad(res, 'Կարծիքը պետք է լինի 3–1000 նիշ');
  const verified = db.orders.some(o => o.uid === req.user.id && o.status !== ST[3] && o.items.some(i => i.id === pid));
  let r = db.reviews.find(x => x.pid === pid && x.uid === req.user.id);
  if (r) Object.assign(r, { rating, text, verified, date: Date.now() });
  else { r = { id: Math.max(0, ...db.reviews.map(x => x.id)) + 1, pid, uid: req.user.id, name: req.user.name.split(' ')[0], rating, text, verified, date: Date.now() }; db.reviews.push(r); }
  recalc(pid); save(); res.json(r);
});
app.delete('/api/reviews/:id', auth, (req, res) => {
  const r = db.reviews.find(x => x.id === +req.params.id);
  if (!r) return res.status(404).json({ error: 'Չի գտնվել' });
  if (r.uid !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Մուտքը մերժված է' });
  db.reviews = db.reviews.filter(x => x !== r); recalc(r.pid); save(); res.json({ ok: true });
});
app.get('/api/reviews', auth, admin, (req, res) => res.json(db.reviews.map(r => ({ ...r, product: (db.products.find(p => p.id === r.pid) || {}).name })).sort((a, b) => b.date - a.date)));
app.get('/api/outbox', auth, admin, (req, res) => res.json([...db.outbox].reverse()));

// ---- Production: serve built Angular app
const DIST = path.join(__dirname, '../frontend/dist/shop/browser');
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get(/^(?!\/api).*/, (q, r) => r.sendFile(path.join(DIST, 'index.html')));
}
app.listen(PORT, () => console.log('API: http://localhost:' + PORT));
