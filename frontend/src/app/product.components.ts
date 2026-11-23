import { Component, Input, effect, inject, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Store } from './store.service';

@Component({
  selector: 'app-pimg', standalone: true,
  template: `@if (p.img) { <img [src]="p.img" alt=""> } @else { <span>{{ p.emoji }}</span> }`,
})
export class PimgComponent { @Input() p: any; }

@Component({
  selector: 'app-card', standalone: true, imports: [PimgComponent],
  template: `
  <div class="card" (click)="s.modal.set({kind:'product', id:p.id})">
    <div class="im"><app-pimg [p]="p" />
      <div class="tags">@if (p.badge) { <i>{{ p.badge }}</i> } @if (disc) { <i class="s">−{{ disc }}%</i> }</div>
      <button class="hb" aria-label="Ընտրյալներ" (click)="$event.stopPropagation(); s.toggleWish(p.id)">{{ s.wish().includes(p.id) ? '❤️' : '🤍' }}</button>
    </div>
    <small>{{ s.catName(p.cat) }}</small>
    <h4>{{ p.name }}</h4>
    <div class="st">{{ stars }} <em>{{ p.rate }} ({{ p.rc || 0 }})</em></div>
    <div class="pr"><b>{{ s.fmt(p.price) }}</b> @if (p.old) { <s>{{ s.fmt(p.old) }}</s> }</div>
    <button class="btn" [disabled]="p.stock < 1" (click)="$event.stopPropagation(); s.add(p.id)">{{ p.stock < 1 ? 'Պահեստում չկա' : 'Ավելացնել զամբյուղ' }}</button>
  </div>`,
})
export class CardComponent {
  @Input() p: any; s = inject(Store);
  get disc() { return this.p.old ? Math.round(100 - this.p.price / this.p.old * 100) : 0; }
  get stars() { const r = Math.round(this.p.rate); return '★'.repeat(r) + '☆'.repeat(5 - r); }
}

@Component({
  selector: 'app-product-modal', standalone: true, imports: [PimgComponent, FormsModule, DatePipe],
  template: `
  <div class="ov" (click)="$event.target === $event.currentTarget && s.modal.set(null)"><div class="md l">
    <button class="x" (click)="s.modal.set(null)" aria-label="Փակել">✕</button>
    @if (p) {
      <div style="display:flex;gap:18px;flex-wrap:wrap">
        <div class="im" style="height:220px;font-size:110px;flex:1;min-width:220px"><app-pimg [p]="p" /></div>
        <div style="flex:1;min-width:240px">
          <small style="color:var(--mu)">{{ s.catName(p.cat) }}</small>
          <h3 style="margin:2px 0 6px">{{ p.name }}</h3>
          <div class="st">{{ '★'.repeat(Math.round(p.rate)) }} <em>{{ p.rate }} ({{ p.rc || 0 }})</em></div>
          <p style="color:var(--mu)">{{ p.desc }}</p>
          <div class="pr" style="margin-bottom:6px"><b style="font-size:26px">{{ s.fmt(p.price) }}</b> @if (p.old) { <s>{{ s.fmt(p.old) }}</s> }</div>
          <p style="margin:0 0 14px">@if (p.stock > 0) { <span class="bdg">Առկա է՝ {{ p.stock }} հատ</span> } @else { <span class="bdg" style="color:var(--rd)">Պահեստում չկա</span> }</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn" style="flex:1" [disabled]="p.stock < 1" (click)="s.add(p.id); s.modal.set(null)">Ավելացնել զամբյուղ</button>
            <button class="btn o" (click)="s.toggleWish(p.id)">{{ s.wish().includes(p.id) ? '❤️ Ընտրյալներում' : '🤍 Ընտրյալներ' }}</button>
          </div>
        </div>
      </div>
      <h3 style="margin:22px 0 6px">Կարծիքներ ({{ reviews().length }})</h3>
      @for (r of reviews(); track r.id) {
        <div class="ci" style="align-items:flex-start">
          <div class="i"><b>{{ r.name }}</b> <span class="st">{{ '★'.repeat(r.rating) }}{{ '☆'.repeat(5 - r.rating) }}</span>
            @if (r.verified) { <span class="bdg">✓ Գնորդ</span> }<br>{{ r.text }}<br><small style="color:var(--mu)">{{ r.date | date:'dd.MM.yyyy' }}</small></div>
          @if (s.user() && (s.user().id === r.uid || s.user().role === 'admin')) { <button class="btn r s" (click)="del(r)">Ջնջել</button> }
        </div>
      } @empty { <div class="em" style="padding:14px">Կարծիքներ դեռ չկան։ Եղեք առաջինը։</div> }
      @if (s.user()) {
        <div class="f" style="margin-top:12px"><b>Ձեր կարծիքը</b>
          <div class="st" style="font-size:26px">@for (n of [1,2,3,4,5]; track n) { <span style="cursor:pointer" (click)="rating = n">{{ n <= rating ? '★' : '☆' }}</span> }</div>
          <textarea rows="3" [(ngModel)]="text" placeholder="Գրեք Ձեր տպավորությունները"></textarea>
          <div class="er">{{ err }}</div>
          <button class="btn" (click)="send()">Հրապարակել</button>
        </div>
      } @else { <button class="btn o" style="margin-top:12px" (click)="s.openAuth('in', 'Մուտք գործեք՝ կարծիք թողնելու համար')">Մուտք՝ կարծիք թողնելու համար</button> }
    }
  </div></div>`,
})
export class ProductModalComponent {
  s = inject(Store); http = inject(HttpClient); Math = Math;
  reviews = signal<any[]>([]); rating = 5; text = ''; err = '';
  get p() { return this.s.products().find(x => x.id === this.s.modal()?.id); }
  constructor() { effect(() => { const id = this.s.modal()?.id; if (id) untracked(() => this.load(id)); }); }
  load(id: number) {
    this.http.get<any[]>(`/api/products/${id}/reviews`).subscribe(r => {
      this.reviews.set(r);
      const mine = r.find(x => x.uid === this.s.user()?.id);
      if (mine) { this.rating = mine.rating; this.text = mine.text; }
    });
  }
  send() {
    this.http.post(`/api/products/${this.p.id}/reviews`, { rating: this.rating, text: this.text }).subscribe({
      next: () => { this.err = ''; this.load(this.p.id); this.s.refresh(); this.s.toast('Շնորհակալություն կարծիքի համար'); },
      error: e => this.err = e.error?.error || 'Սխալ',
    });
  }
  del(r: any) { this.http.delete('/api/reviews/' + r.id).subscribe(() => { this.load(this.p.id); this.s.refresh(); }); }
}
