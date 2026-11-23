import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export const CATS: [string, string, string][] = [
  ['phone', 'Սմարթֆոններ', '📱'], ['laptop', 'Նոութբուքեր', '💻'], ['audio', 'Աուդիո', '🎧'],
  ['watch', 'Ժամացույցներ', '⌚'], ['game', 'Խաղեր', '🎮'], ['home', 'Խելացի տուն', '🏠'], ['photo', 'Լուսանկար և դրոններ', '📷'],
];
export const STATUSES = ['Նոր', 'Ուղարկված', 'Առաքված', 'Չեղարկված'];
const read = (k: string, d: any) => { try { return JSON.parse(localStorage.getItem(k) || '') ?? d; } catch { return d; } };

@Injectable({ providedIn: 'root' })
export class Store {
  http = inject(HttpClient);
  products = signal<any[]>([]);
  settings = signal<any>({ name: 'ԷլեկտրոՏուն', banner: '', free: 25000, ship: 1500 });
  user = signal<any>(null);
  cart = signal<{ id: number; q: number }[]>(read('cart', []));
  wish = signal<number[]>(read('wish', []));
  pct = signal(0);
  promo = signal('');
  q = signal('');
  cat = signal('all');
  drawer = signal(false);
  modal = signal<any>(null);
  toastMsg = signal('');

  lines = computed(() => this.cart().map(i => ({ p: this.products().find(x => x.id === i.id), q: i.q })).filter(l => l.p));
  count = computed(() => this.lines().reduce((s, l) => s + l.q, 0));
  sub = computed(() => this.lines().reduce((s, l) => s + l.p.price * l.q, 0));
  disc = computed(() => this.sub() * this.pct() / 100);
  ship = computed(() => { const s = this.sub() - this.disc(); return s > 0 && s < this.settings().free ? this.settings().ship : 0; });
  total = computed(() => this.sub() - this.disc() + this.ship());

  fmt = (n: number) => Math.round(n).toLocaleString('ru-RU') + ' ֏';
  catName = (k: string) => CATS.find(c => c[0] === k)?.[1] || 'Այլ';

  constructor() {
    this.refresh();
    if (localStorage.getItem('token')) {
      this.http.get('/api/me').subscribe({ next: u => this.user.set(u), error: () => localStorage.removeItem('token') });
    }
  }
  refresh() {
    this.http.get<any[]>('/api/products').subscribe(p => this.products.set(p));
    this.http.get('/api/settings').subscribe(s => this.settings.set(s));
  }
  toast(t: string) { this.toastMsg.set(t); setTimeout(() => this.toastMsg.set(''), 2200); }

  private put(c: { id: number; q: number }[]) { this.cart.set(c); localStorage.setItem('cart', JSON.stringify(c)); }
  add(id: number) {
    const p = this.products().find(x => x.id === id); if (!p || p.stock < 1) return;
    const c = this.cart().map(i => ({ ...i })), l = c.find(i => i.id === id);
    if (l) { if (l.q >= p.stock) return this.toast('Պահեստում ավելին չկա'); l.q++; } else c.push({ id, q: 1 });
    this.put(c); this.toast('Ավելացվեց զամբյուղ');
  }
  qty(id: number, d: number) {
    const p = this.products().find(x => x.id === id);
    this.put(this.cart().map(i => i.id === id ? { id, q: Math.min(i.q + d, p?.stock ?? 99) } : i).filter(i => i.q > 0));
  }
  toggleWish(id: number) {
    const w = this.wish().includes(id) ? this.wish().filter(x => x !== id) : [...this.wish(), id];
    this.wish.set(w); localStorage.setItem('wish', JSON.stringify(w));
  }
  applyPromo(code: string) {
    this.http.post<any>('/api/promo', { code }).subscribe({
      next: r => { this.pct.set(r.pct); this.promo.set(code); this.toast(`Պրոմոկոդը կիրառվեց՝ −${r.pct}%`); },
      error: e => { this.pct.set(0); this.promo.set(''); this.toast(e.error?.error || 'Սխալ'); },
    });
  }
  openAuth(mode: 'in' | 'reg', msg = '') { this.drawer.set(false); this.modal.set({ kind: 'auth', mode, msg }); }
  setAuth(r: any) {
    localStorage.setItem('token', r.token); this.user.set(r.user); this.modal.set(null);
    this.toast('Բարի գալուստ, ' + r.user.name.split(' ')[0] + '։');
  }
  logout() { localStorage.removeItem('token'); this.user.set(null); }
  async placeOrder(f: any) {
    const o = await firstValueFrom(this.http.post<any>('/api/orders', { ...f, promo: this.pct() ? this.promo() : '', items: this.cart() }));
    this.put([]); this.pct.set(0); this.promo.set(''); this.refresh();
    return o;
  }
}
