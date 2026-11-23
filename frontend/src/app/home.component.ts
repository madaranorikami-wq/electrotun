import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Store, CATS } from './store.service';
import { CardComponent } from './product.components';

@Component({
  selector: 'app-home', standalone: true, imports: [FormsModule, CardComponent],
  template: `
  <div class="hero" [style.background]="slides[i()][0]">
    <div><h1>{{ slides[i()][1] }}</h1><p>{{ slides[i()][2] }}</p><button class="btn w" (click)="go(slides[i()][3])">Դիտել ապրանքները</button></div>
    <div class="big">{{ slides[i()][4] }}</div>
  </div>
  <div class="dots">@for (d of slides; track $index) { <i [class.on]="$index === i()" (click)="i.set($index)"></i> }</div>
  <div class="feat">
    <div><span>🚚</span><p style="margin:0"><b>Անվճար առաքում</b><small>{{ s.fmt(s.settings().free) }}-ից</small></p></div>
    <div><span>🛡️</span><p style="margin:0"><b>Երաշխիք</b><small>պաշտոնական, 1 տարի</small></p></div>
    <div><span>↩️</span><p style="margin:0"><b>Վերադարձ 30 օր</b><small>առանց բացատրության</small></p></div>
    <div><span>💳</span><p style="margin:0"><b>Անվտանգ վճարում</b><small>քարտով կամ ստացման ժամանակ</small></p></div>
  </div>
  <h2>Հանրահայտ կատեգորիաներ</h2>
  <div class="cg">@for (c of cats; track c[0]) { <button (click)="go(c[0])"><span>{{ c[2] }}</span>{{ c[1] }}</button> }</div>
  <h2 id="shop">Կատալոգ <small style="font-size:14px;color:var(--mu);font-weight:500">({{ list().length }})</small></h2>
  <div class="tb">
    <select [ngModel]="sort()" (ngModelChange)="sort.set($event)" aria-label="Դասավորություն">
      <option value="pop">Սկզբում՝ հայտնիները</option><option value="cheap">Սկզբում՝ էժանները</option><option value="exp">Սկզբում՝ թանկերը</option>
      <option value="rate">Ըստ վարկանիշի</option><option value="new">Նորույթներ</option>
    </select>
    <select [ngModel]="max()" (ngModelChange)="max.set($event)" aria-label="Գին">
      <option [ngValue]="0">Ցանկացած գին</option><option [ngValue]="50000">մինչև 50 000 ֏</option><option [ngValue]="150000">մինչև 150 000 ֏</option><option [ngValue]="400000">մինչև 400 000 ֏</option>
    </select>
    <button class="btn o s" (click)="reset()">Զրոյացնել</button>
  </div>
  <div class="grid">
    @for (p of list(); track p.id) { <app-card [p]="p" /> } @empty { <div class="em" style="grid-column:1/-1">Ոչինչ չի գտնվել։ Փոխեք որոնումը կամ զրոյացրեք ֆիլտրերը։</div> }
  </div>
  <div class="sale">
    <div><h2 style="margin:0 0 6px;color:#fff">Օրվա զեղչեր մինչև −30%</h2><span style="opacity:.85">Շտապեք. առաջարկը գործում է մինչև օրվա վերջ։ Պրոմոկոդով՝ լրացուցիչ զեղչ։</span></div>
    <div class="cd">@for (t of cd(); track $index) { <div>{{ t[0] }}<small>{{ t[1] }}</small></div> }</div>
  </div>
  <div class="nl">
    <div><b style="font-size:18px">Իմացեք զեղչերի մասին առաջինը</b><div style="color:var(--mu)">Շաբաթը մեկ անգամ, առանց սպամի։</div></div>
    <div style="display:flex;gap:8px;flex:1;min-width:260px;max-width:420px"><input type="email" [(ngModel)]="email" placeholder="Ձեր էլ. հասցեն"><button class="btn" (click)="sub()">Բաժանորդագրվել</button></div>
  </div>`,
})
export class HomeComponent implements OnInit, OnDestroy {
  s = inject(Store); http = inject(HttpClient); cats = CATS; email = '';
  i = signal(0); sort = signal('pop'); max = signal(0); cd = signal<string[][]>([]); t1: any; t2: any;
  slides = [
    ['linear-gradient(120deg,#1736b8,#4f7dff)', 'Նոր դրոշակակիրներ արդեն այստեղ', 'Սմարթֆոններ պրոֆեսիոնալ տեսախցիկով և 120 Հց էկրանով։', 'phone', '📱'],
    ['linear-gradient(120deg,#1b1f3a,#5b3fd6)', 'Ձայն՝ առանց փոխզիջումների', 'Աղմուկը ճնշող ականջակալներ՝ 29 000 ֏-ից։', 'audio', '🎧'],
    ['linear-gradient(120deg,#0d6b57,#19b48a)', 'Խելացի տուն՝ մեկ երեկոյում', 'Տեսախցիկներ, լամպեր և սենսորներ։ Տեղադրում՝ 5 րոպեում։', 'home', '🏠'],
  ];
  list = computed(() => {
    const q = this.s.q().toLowerCase(), c = this.s.cat(), mx = this.max();
    const a = this.s.products().filter(p => (c === 'all' || p.cat === c) && (!q || (p.name + p.desc).toLowerCase().includes(q)) && (!mx || p.price <= mx));
    const so: any = { pop: (x: any, y: any) => y.sold - x.sold, cheap: (x: any, y: any) => x.price - y.price, exp: (x: any, y: any) => y.price - x.price, rate: (x: any, y: any) => y.rate - x.rate, new: (x: any, y: any) => y.id - x.id };
    return a.sort(so[this.sort()]);
  });
  ngOnInit() {
    this.t1 = setInterval(() => this.i.set((this.i() + 1) % this.slides.length), 5500);
    const tick = () => {
      const n = new Date(), t = new Date(n); t.setHours(23, 59, 59, 999);
      const s = Math.floor((t.getTime() - n.getTime()) / 1000), p = (x: number) => String(x).padStart(2, '0');
      this.cd.set([[p(Math.floor(s / 3600)), 'ժամ'], [p(Math.floor(s % 3600 / 60)), 'րոպե'], [p(s % 60), 'վայրկյան']]);
    };
    tick(); this.t2 = setInterval(tick, 1000);
  }
  ngOnDestroy() { clearInterval(this.t1); clearInterval(this.t2); }
  go(c: string) { this.s.cat.set(c); document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }); }
  reset() { this.s.q.set(''); this.s.cat.set('all'); this.max.set(0); }
  sub() {
    this.http.post('/api/subscribe', { email: this.email }).subscribe({
      next: () => { this.s.toast('Շնորհակալություն։ Դուք բաժանորդագրվեցիք։'); this.email = ''; },
      error: e => this.s.toast(e.error?.error || 'Սխալ'),
    });
  }
}
