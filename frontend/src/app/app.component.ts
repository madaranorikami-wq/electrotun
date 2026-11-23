import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store, CATS } from './store.service';
import { AuthComponent } from './auth.component';
import { CartComponent } from './cart.component';
import { ProductModalComponent } from './product.components';

@Component({
  selector: 'app-root', standalone: true,
  imports: [RouterOutlet, RouterLink, FormsModule, AuthComponent, CartComponent, ProductModalComponent],
  template: `
  <div class="top">{{ s.settings().banner }}</div>
  <header>
    <div class="wrap bar">
      <a class="logo" routerLink="/">⚡{{ s.settings().name.slice(0, -4) }}<b>{{ s.settings().name.slice(-4) }}</b></a>
      <div class="search"><input [ngModel]="s.q()" (ngModelChange)="search($event)" placeholder="Ի՞նչ եք փնտրում" aria-label="Որոնում"><span>Որոնել</span></div>
      <div class="acts">
        <button class="ib" routerLink="/profile" title="Ընտրյալներ">🤍<i>{{ s.wish().length }}</i></button>
        <button class="ib" (click)="s.drawer.set(true)">🛒<i>{{ s.count() }}</i> {{ s.fmt(s.sub()) }}</button>
        @if (s.user(); as u) {
          @if (u.role === 'admin') { <button class="ib" routerLink="/admin">⚙️ Ադմին</button> }
          <button class="ib" routerLink="/profile">👤 {{ u.name.split(' ')[0] }}</button>
          <button class="ib" (click)="out()">Դուրս գալ</button>
        } @else { <button class="ib" (click)="s.openAuth('in')">Մուտք</button> }
        <button class="ib" (click)="theme()" title="Թեմա">🌓</button>
      </div>
    </div>
    <div class="wrap cats">
      <button [class.on]="s.cat() === 'all'" (click)="setCat('all')">Բոլոր ապրանքները</button>
      @for (c of cats; track c[0]) { <button [class.on]="s.cat() === c[0]" (click)="setCat(c[0])">{{ c[2] }} {{ c[1] }}</button> }
    </div>
  </header>
  <main class="wrap"><router-outlet /></main>
  <footer><div class="wrap">© {{ s.settings().name }} · Երաշխիք ողջ տեխնիկայի համար · Աջակցություն 24/7</div></footer>

  @if (s.drawer()) { <app-cart /> }
  @if (s.modal(); as m) {
    @if (m.kind === 'auth') { <app-auth /> }
    @if (m.kind === 'product') { <app-product-modal /> }
    @if (m.kind === 'done') {
      <div class="ov" (click)="$event.target === $event.currentTarget && s.modal.set(null)"><div class="md">
        <button class="x" (click)="s.modal.set(null)" aria-label="Փակել">✕</button>
        <h3>Պատվեր №{{ m.order.id }} ձևակերպված է ✅</h3>
        <p>Գումարը՝ <b>{{ s.fmt(m.order.total) }}</b><br>{{ m.order.pay }}@if (m.order.paid) { · վճարված է ✅ }</p><p>Հաստատման նամակը ուղարկվել է Ձեր էլ. հասցեին։ Պատվերի կարգավիճակին կարող եք հետևել անձնական էջում։</p>
        <button class="btn" routerLink="/profile" (click)="s.modal.set(null)">Իմ պատվերները</button>
      </div></div>
    }
  }
  @if (s.toastMsg()) { <div id="toast" style="display:block">{{ s.toastMsg() }}</div> }`,
})
export class AppComponent {
  s = inject(Store); r = inject(Router); cats = CATS;
  search(q: string) { this.s.q.set(q); this.r.navigateByUrl('/'); }
  setCat(c: string) { this.s.cat.set(c); this.r.navigateByUrl('/').then(() => setTimeout(() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }), 50)); }
  out() { this.s.logout(); this.r.navigateByUrl('/'); }
  theme() {
    const d = document.documentElement, dark = d.dataset['theme'] ? d.dataset['theme'] === 'dark' : matchMedia('(prefers-color-scheme:dark)').matches;
    d.dataset['theme'] = dark ? 'light' : 'dark';
  }
}
