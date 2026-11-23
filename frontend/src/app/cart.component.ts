import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Store } from './store.service';
import { PimgComponent } from './product.components';
import { CardFormComponent } from './card-form.component';

@Component({
  selector: 'app-cart', standalone: true, imports: [FormsModule, PimgComponent, CardFormComponent],
  template: `
  <div class="ov dr" (click)="$event.target === $event.currentTarget && s.drawer.set(false)"><div class="md">
    <button class="x" (click)="s.drawer.set(false)" aria-label="Փակել">✕</button>
    <h3>Զամբյուղ</h3>
    @if (s.lines().length) {
      @for (l of s.lines(); track l.p.id) {
        <div class="ci"><div class="t"><app-pimg [p]="l.p" /></div>
          <div class="i">{{ l.p.name }}<br><b>{{ s.fmt(l.p.price * l.q) }}</b></div>
          <div class="q"><button (click)="s.qty(l.p.id, -1)">−</button>{{ l.q }}<button (click)="s.qty(l.p.id, 1)">+</button></div>
        </div>
      }
      <div style="display:flex;gap:8px;margin:14px 0">
        <input [(ngModel)]="code" placeholder="Պրոմոկոդ"><button class="btn o" (click)="s.applyPromo(code)">Կիրառել</button>
      </div>
      <div class="tot"><span>Ապրանքներ</span><span>{{ s.fmt(s.sub()) }}</span></div>
      @if (s.disc()) { <div class="tot"><span>Զեղչ</span><span>−{{ s.fmt(s.disc()) }}</span></div> }
      <div class="tot"><span>Առաքում</span><span>{{ s.ship() ? s.fmt(s.ship()) : 'անվճար' }}</span></div>
      <div class="tot g"><span>Ընդամենը</span><span>{{ s.fmt(s.total()) }}</span></div>
      <div class="f" style="margin-top:12px">
        <label>Անուն<input [(ngModel)]="o.name"></label>
        <label>Հեռախոս<input [(ngModel)]="o.phone" placeholder="+374 …"></label>
        <label>Առաքման հասցե<input [(ngModel)]="o.addr"></label>
        <label>Վճարում<select [(ngModel)]="o.pay"><option value="card">Բանկային քարտով առցանց</option><option value="cash">Ստացման ժամանակ</option></select></label>
        @if (o.pay === 'card') {
          @if (!s.user()) { <small style="color:var(--mu)">Քարտ ընտրելու համար մուտք գործեք։</small> }
          @else {
            @for (c of cards(); track c.id) {
              <label style="display:flex;gap:8px;align-items:center;color:var(--tx)"><input type="radio" style="width:auto" name="card" [value]="c.id" [(ngModel)]="o.cardId"> {{ c.brand }} •••• {{ c.last4 }} · {{ c.exp }}</label>
            }
            @if (!cards().length || addNew) { <app-card-form (saved)="cardsSaved($event)" /> }
            @else { <button class="btn o s" (click)="addNew = true">+ Նոր քարտ</button> }
          }
        }
        <div class="er">{{ err }}</div>
        <button class="btn" (click)="order()">Պատվիրել</button>
      </div>
    } @else { <div class="em">Զամբյուղը դատարկ է։ Ավելացրեք ապրանքներ կատալոգից։</div> }
  </div></div>`,
})
export class CartComponent implements OnInit {
  s = inject(Store); http = inject(HttpClient); code = this.s.promo(); err = '';
  cards = signal<any[]>([]); addNew = false;
  o = { name: this.s.user()?.name || '', phone: this.s.user()?.phone || '', addr: this.s.user()?.addr || '', pay: 'card', cardId: '' };
  ngOnInit() {
    if (this.s.user()) this.http.get<any[]>('/api/cards').subscribe(c => { this.cards.set(c); this.o.cardId = (c.find(x => x.def) || c[0])?.id || ''; });
  }
  cardsSaved(list: any[]) { this.cards.set(list); this.o.cardId = list[list.length - 1].id; this.addNew = false; }
  async order() {
    if (!this.s.user()) return this.s.openAuth('in', 'Մուտք գործեք պատվերը ձևակերպելու համար');
    if (!this.o.name.trim() || this.o.phone.trim().length < 6 || this.o.addr.trim().length < 5) return this.err = 'Լրացրեք անունը, հեռախոսը և հասցեն';
    if (this.o.pay === 'card' && !this.o.cardId) return this.err = 'Ընտրեք կամ ավելացրեք քարտ';
    try { const r = await this.s.placeOrder(this.o); this.s.drawer.set(false); this.s.modal.set({ kind: 'done', order: r }); }
    catch (e: any) { this.err = e.error?.error || 'Սխալ'; }
  }
}
