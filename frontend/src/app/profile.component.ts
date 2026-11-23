import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Store } from './store.service';
import { CardComponent } from './product.components';
import { CardFormComponent } from './card-form.component';

@Component({
  selector: 'app-profile', standalone: true, imports: [FormsModule, DatePipe, CardComponent, CardFormComponent],
  template: `
  @if (!s.user()) {
    <div class="em">Մուտք գործեք՝ անձնական էջը բացելու համար։<br><br><button class="btn" (click)="s.openAuth('in')">Մուտք</button></div>
  } @else {
    <h2>Անձնական էջ</h2>
    <div class="pn"><div class="f" style="max-width:420px">
      <label>Անուն<input [(ngModel)]="f.name"></label>
      <label>Հեռախոս<input [(ngModel)]="f.phone"></label>
      <label>Հասցե<input [(ngModel)]="f.addr"></label>
      <label>Նոր գաղտնաբառ (ըստ ցանկության)<input type="password" [(ngModel)]="f.pass"></label>
      <div class="er">{{ err }}</div>
      <button class="btn" (click)="save()">Պահպանել</button>
    </div></div>
    <h2>Իմ քարտերը</h2>
    <div class="pn">
      @for (c of cards(); track c.id) {
        <div class="ci"><div class="t">💳</div>
          <div class="i"><b>{{ c.brand }} •••• {{ c.last4 }}</b> @if (c.def) { <span class="bdg">հիմնական</span> }<br><small>{{ c.holder }} · {{ c.exp }}</small></div>
          @if (!c.def) { <button class="btn o s" (click)="defCard(c)">Հիմնական</button> }
          <button class="btn r s" (click)="delCard(c)">Ջնջել</button></div>
      } @empty { <div class="em" style="padding:10px">Կապված քարտեր չկան։</div> }
      <div style="max-width:420px;margin-top:14px"><b>Կապել նոր քարտ</b>
        <p style="color:var(--mu);margin:4px 0 10px;font-size:13px">Թեստային քարտ՝ 4242 4242 4242 4242 (բանկի կողմից մերժվող՝ 4000 0000 0000 0002), ցանկացած ապագա ժամկետ և CVV։</p>
        <app-card-form (saved)="cards.set($event)" /></div>
    </div>
    <h2>Իմ պատվերները</h2>
    @if (orders().length) {
      <div class="pn tw"><table>
        <tr><th>№</th><th>Ամսաթիվ</th><th>Ապրանքներ</th><th>Գումար</th><th>Կարգավիճակ</th></tr>
        @for (o of orders(); track o.id) {
          <tr><td>{{ o.id }}</td><td>{{ o.date | date:'dd.MM.yyyy' }}</td>
            <td>@for (i of o.items; track i.id) { {{ i.name }} ×{{ i.q }}<br> }</td>
            <td>{{ s.fmt(o.total) }}<br><small>{{ o.pay }}</small></td><td><span class="bdg">{{ o.status }}</span></td></tr>
        }
      </table></div>
    } @else { <div class="em">Պատվերներ դեռ չկան։</div> }
  }
  <h2>Ընտրյալներ</h2>
  @if (wl().length) { <div class="grid">@for (p of wl(); track p.id) { <app-card [p]="p" /> }</div> }
  @else { <div class="em">Սեղմեք 🤍 ապրանքի վրա՝ այն այստեղ պահելու համար։</div> }`,
})
export class ProfileComponent {
  s = inject(Store); http = inject(HttpClient);
  orders = signal<any[]>([]); cards = signal<any[]>([]); f = { name: '', phone: '', addr: '', pass: '' }; err = '';
  wl = computed(() => this.s.products().filter(p => this.s.wish().includes(p.id)));
  constructor() {
    effect(() => {
      const u = this.s.user();
      if (u) untracked(() => {
        this.f = { name: u.name, phone: u.phone || '', addr: u.addr || '', pass: '' };
        this.http.get<any[]>('/api/orders/mine').subscribe(o => this.orders.set(o));
        this.http.get<any[]>('/api/cards').subscribe(c => this.cards.set(c));
      });
    });
  }
  defCard(c: any) { this.http.put<any[]>('/api/cards/' + c.id + '/default', {}).subscribe(r => this.cards.set(r)); }
  delCard(c: any) { if (confirm('Ջնջե՞լ քարտը')) this.http.delete<any[]>('/api/cards/' + c.id).subscribe(r => this.cards.set(r)); }
  save() {
    this.http.put<any>('/api/me', this.f).subscribe({
      next: u => { this.s.user.set(u); this.f.pass = ''; this.err = ''; this.s.toast('Պրոֆիլը պահպանվեց'); },
      error: e => this.err = e.error?.error || 'Սխալ',
    });
  }
}
