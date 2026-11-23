import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

const luhn = (n: string) => { let s = 0, d = false; for (let i = n.length - 1; i >= 0; i--) { let x = +n[i]; if (d) { x *= 2; if (x > 9) x -= 9; } s += x; d = !d; } return s % 10 === 0; };

@Component({
  selector: 'app-card-form', standalone: true, imports: [FormsModule],
  template: `
  <div class="f">
    <label>Քարտի համար<input [ngModel]="f.number" (ngModelChange)="num($event)" inputmode="numeric" placeholder="0000 0000 0000 0000" autocomplete="cc-number"></label>
    <label>Քարտապանի անուն<input [(ngModel)]="f.holder" autocomplete="cc-name"></label>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <label>Ժամկետ (ԱԱ/ՏՏ)<input [ngModel]="f.exp" (ngModelChange)="exp($event)" placeholder="12/28" autocomplete="cc-exp"></label>
      <label>CVV<input type="password" [(ngModel)]="f.cvv" inputmode="numeric" maxlength="4" autocomplete="cc-csc"></label>
    </div>
    <small style="color:var(--mu)">🔒 Լրիվ համարը և CVV-ն չեն պահվում։ Պահվում են միայն քարտի տեսակը, վերջին 4 թվանշանը և ժամկետը։</small>
    <div class="er">{{ err }}</div>
    <button class="btn" (click)="save()">Կապել քարտը</button>
  </div>`,
})
export class CardFormComponent {
  http = inject(HttpClient); @Output() saved = new EventEmitter<any[]>();
  f = { number: '', holder: '', exp: '', cvv: '' }; err = '';
  num(v: string) { this.f.number = v.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 '); }
  exp(v: string) { const d = v.replace(/\D/g, '').slice(0, 4); this.f.exp = d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d; }
  save() {
    const n = this.f.number.replace(/\s/g, '');
    if (n.length < 13 || !luhn(n)) return this.err = 'Քարտի համարը սխալ է';
    if (this.f.holder.trim().length < 2) return this.err = 'Մուտքագրեք քարտապանի անունը';
    if (!/^\d{2}\/\d{2}$/.test(this.f.exp)) return this.err = 'Ժամկետը մուտքագրեք ԱԱ/ՏՏ ձևաչափով';
    if (!/^\d{3,4}$/.test(this.f.cvv)) return this.err = 'CVV-ն սխալ է';
    this.http.post<any[]>('/api/cards', this.f).subscribe({
      next: r => { this.f = { number: '', holder: '', exp: '', cvv: '' }; this.err = ''; this.saved.emit(r); },
      error: e => this.err = e.error?.error || 'Սխալ',
    });
  }
}
