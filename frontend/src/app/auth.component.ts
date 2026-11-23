import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Store } from './store.service';

@Component({
  selector: 'app-auth', standalone: true, imports: [FormsModule],
  template: `
  <div class="ov" (click)="$event.target === $event.currentTarget && s.modal.set(null)"><div class="md">
    <button class="x" (click)="s.modal.set(null)" aria-label="Փակել">✕</button>
    <h3>{{ reg ? 'Գրանցում' : 'Մուտք' }}</h3>
    <div class="tabs">
      <button [class.on]="!reg" (click)="mode('in')">Մուտք</button>
      <button [class.on]="reg" (click)="mode('reg')">Գրանցում</button>
    </div>
    @if (s.modal().msg) { <p class="er">{{ s.modal().msg }}</p> }
    <div class="f">
      @if (reg) { <label>Անուն<input [(ngModel)]="f.name" autocomplete="name"></label> }
      <label>Էլ. հասցե<input type="email" [(ngModel)]="f.email" autocomplete="email"></label>
      <label>Գաղտնաբառ{{ reg ? ' (առնվազն 6 նիշ)' : '' }}<input type="password" [(ngModel)]="f.pass" autocomplete="current-password"></label>
      @if (reg) { <label>Կրկնեք գաղտնաբառը<input type="password" [(ngModel)]="f.pass2"></label> }
      <div class="er">{{ err }}</div>
      <button class="btn" (click)="submit()">{{ reg ? 'Ստեղծել հաշիվ' : 'Մուտք գործել' }}</button>
      @if (!reg) { <small style="color:var(--mu)">Ադմին՝ admin&#64;shop.local / admin123։ Փոխեք գաղտնաբառը անձնական էջում։</small> }
    </div>
  </div></div>`,
})
export class AuthComponent {
  s = inject(Store); http = inject(HttpClient);
  f = { name: '', email: '', pass: '', pass2: '' }; err = '';
  get reg() { return this.s.modal().mode === 'reg'; }
  mode(m: 'in' | 'reg') { this.err = ''; this.s.modal.set({ kind: 'auth', mode: m }); }
  submit() {
    const f = this.f;
    if (this.reg) {
      if (f.name.trim().length < 2) return this.err = 'Մուտքագրեք անունը';
      if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) return this.err = 'Մուտքագրեք ճիշտ էլ. հասցե';
      if (f.pass.length < 6) return this.err = 'Գաղտնաբառը շատ կարճ է (առնվազն 6 նիշ)';
      if (f.pass !== f.pass2) return this.err = 'Գաղտնաբառերը չեն համընկնում';
    }
    this.http.post<any>('/api/auth/' + (this.reg ? 'register' : 'login'), { name: f.name, email: f.email, pass: f.pass })
      .subscribe({ next: r => this.s.setAuth(r), error: e => this.err = e.error?.error || 'Սխալ' });
  }
}
