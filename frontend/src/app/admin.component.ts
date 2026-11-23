import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Store, CATS, STATUSES } from './store.service';

@Component({
  selector: 'app-admin', standalone: true, imports: [FormsModule, DatePipe],
  template: `
  @if (s.user()?.role !== 'admin') {
    <div class="em">Բաժինը հասանելի է միայն ադմինիստրատորին։<br><br><button class="btn" (click)="s.openAuth('in')">Մուտք</button></div>
  } @else {
    <h2>Ադմինիստրատորի վահանակ</h2>
    <div class="stat">
      <div><b>{{ s.fmt(revenue()) }}</b><small>Եկամուտ</small></div>
      <div><b>{{ orders().length }}</b><small>Պատվերներ ({{ fresh() }} նոր)</small></div>
      <div><b>{{ users().length }}</b><small>Օգտատերեր</small></div>
      <div><b>{{ s.products().length }}</b><small>Ապրանքներ ({{ low() }} վերջանում են)</small></div>
    </div>
    <div class="tabs">
      @for (t of tabs; track t[0]) { <button [class.on]="tab() === t[0]" (click)="tab.set(t[0])">{{ t[1] }}</button> }
    </div>

    @if (tab() === 'users') {
      <div class="pn tw"><table>
        <tr><th>Անուն</th><th>Էլ. հասցե</th><th>Դեր</th><th>Գրանցում</th><th></th></tr>
        @for (u of users(); track u.id) {
          <tr><td>{{ u.name }}</td><td>{{ u.email }}</td><td><span class="bdg">{{ u.role === 'admin' ? 'ադմին' : 'հաճախորդ' }}</span></td><td>{{ u.date | date:'dd.MM.yyyy' }}</td>
            <td>@if (u.id !== s.user().id) { <button class="btn o s" (click)="role(u)">Դերը փոխել</button> <button class="btn r s" (click)="delUser(u)">Ջնջել</button> }</td></tr>
        }
      </table></div>
    }

    @if (tab() === 'prod') {
      @if (ed) {
        <div class="pn"><div class="f" style="max-width:520px">
          <label>Անվանում<input [(ngModel)]="ed.name"></label>
          <label>Կատեգորիա<select [(ngModel)]="ed.cat">@for (c of cats; track c[0]) { <option [value]="c[0]">{{ c[1] }}</option> }</select></label>
          <label>Գին, ֏<input type="number" [(ngModel)]="ed.price"></label>
          <label>Հին գին (զեղչի համար), ֏<input type="number" [(ngModel)]="ed.old"></label>
          <label>Պահեստում, հատ<input type="number" [(ngModel)]="ed.stock"></label>
          <label>Էմոջի<input [(ngModel)]="ed.emoji"></label>
          <label>Նկար (ըստ ցանկության, մինչև 600 ԿԲ)<input type="file" accept="image/*" (change)="file($event)"></label>
          <label>Պիտակ (Հիթ, Նորույթ…)<input [(ngModel)]="ed.badge"></label>
          <label>Նկարագրություն<textarea rows="3" [(ngModel)]="ed.desc"></textarea></label>
          <div class="er">{{ err }}</div>
          <div style="display:flex;gap:8px"><button class="btn" (click)="saveProd()">Պահպանել</button><button class="btn o" (click)="ed = null">Չեղարկել</button></div>
        </div></div>
      } @else {
        <button class="btn" style="margin-bottom:12px" (click)="edit()">+ Ավելացնել ապրանք</button>
        <div class="pn tw"><table>
          <tr><th></th><th>Անվանում</th><th>Կատեգորիա</th><th>Գին</th><th>Պահեստ</th><th></th></tr>
          @for (p of s.products(); track p.id) {
            <tr><td style="font-size:26px">{{ p.img ? '🖼️' : p.emoji }}</td><td>{{ p.name }}</td><td>{{ s.catName(p.cat) }}</td><td>{{ s.fmt(p.price) }}</td><td>{{ p.stock }}</td>
              <td><button class="btn o s" (click)="edit(p)">Փոփոխել</button> <button class="btn r s" (click)="delProd(p)">Ջնջել</button></td></tr>
          }
        </table></div>
      }
    }

    @if (tab() === 'ord') {
      @if (orders().length) {
        <div class="pn tw"><table>
          <tr><th>№</th><th>Հաճախորդ</th><th>Կազմ</th><th>Գումար</th><th>Կարգավիճակ</th></tr>
          @for (o of orders(); track o.id) {
            <tr><td>{{ o.id }}<br><small>{{ o.date | date:'dd.MM.yyyy' }}</small></td>
              <td>{{ o.name }}<br><small>{{ o.phone }}<br>{{ o.addr }}</small></td>
              <td>@for (i of o.items; track i.id) { {{ i.name }} ×{{ i.q }}<br> }</td>
              <td>{{ s.fmt(o.total) }}<br><small>{{ o.pay }}</small></td>
              <td><select [ngModel]="o.status" (ngModelChange)="status(o, $event)">@for (t of sts; track t) { <option>{{ t }}</option> }</select></td></tr>
          }
        </table></div>
      } @else { <div class="em">Պատվերներ դեռ չկան։</div> }
    }

    @if (tab() === 'rev') {
      @if (reviews().length) {
        <div class="pn tw"><table>
          <tr><th>Ապրանք</th><th>Հեղինակ</th><th>Գնահատական</th><th>Կարծիք</th><th></th></tr>
          @for (r of reviews(); track r.id) {
            <tr><td>{{ r.product }}</td><td>{{ r.name }} @if (r.verified) { <span class="bdg">✓ Գնորդ</span> }</td><td class="st">{{ '★'.repeat(r.rating) }}</td>
              <td>{{ r.text }}<br><small>{{ r.date | date:'dd.MM.yyyy' }}</small></td><td><button class="btn r s" (click)="delRev(r)">Ջնջել</button></td></tr>
          }
        </table></div>
      } @else { <div class="em">Կարծիքներ դեռ չկան։</div> }
    }

    @if (tab() === 'mail') {
      <p style="color:var(--mu)">Վերջին 50 նամակները։ Իրական ուղարկման համար սերվերում նշեք SMTP_HOST, SMTP_USER, SMTP_PASS փոփոխականները։</p>
      @for (m of outbox(); track m.id) {
        <div class="pn"><b>{{ m.subject }}</b> <span class="bdg">{{ m.sent ? 'ուղարկվել է SMTP-ով' : 'միայն պահված (SMTP չկա)' }}</span><br>
          <small>{{ m.to }} · {{ m.date | date:'dd.MM.yyyy HH:mm' }}</small>
          <details><summary style="cursor:pointer;color:var(--ac)">Դիտել նամակը</summary><div [innerHTML]="m.html"></div></details></div>
      } @empty { <div class="em">Նամակներ դեռ չկան։</div> }
    }

    @if (tab() === 'set') {
      <div class="pn"><div class="f" style="max-width:460px">
        <label>Խանութի անվանում<input [(ngModel)]="set.name"></label>
        <label>Վերևի տող<input [(ngModel)]="set.banner"></label>
        <label>Պրոմոկոդ<input [(ngModel)]="set.promo"></label>
        <label>Զեղչ պրոմոկոդով, %<input type="number" [(ngModel)]="set.pct"></label>
        <label>Անվճար առաքում սկսած, ֏<input type="number" [(ngModel)]="set.free"></label>
        <label>Առաքման արժեք, ֏<input type="number" [(ngModel)]="set.ship"></label>
        <button class="btn" (click)="saveSet()">Պահպանել</button>
        <button class="btn r" (click)="reset()">Վերականգնել բոլոր տվյալները</button>
      </div></div>
    }
  }`,
})
export class AdminComponent {
  s = inject(Store); http = inject(HttpClient); cats = CATS; sts = STATUSES;
  tabs = [['users', 'Օգտատերեր'], ['prod', 'Ապրանքներ'], ['ord', 'Պատվերներ'], ['rev', 'Կարծիքներ'], ['mail', 'Նամակներ'], ['set', 'Կարգավորումներ']];
  tab = signal('users'); users = signal<any[]>([]); reviews = signal<any[]>([]); outbox = signal<any[]>([]); orders = signal<any[]>([]); set: any = {}; ed: any = null; err = '';
  revenue = computed(() => this.orders().filter(o => o.status !== 'Չեղարկված').reduce((a, o) => a + o.total, 0));
  fresh = computed(() => this.orders().filter(o => o.status === 'Նոր').length);
  low = computed(() => this.s.products().filter(p => p.stock < 5).length);
  constructor() { effect(() => { if (this.s.user()?.role === 'admin') untracked(() => this.load()); }); }
  load() {
    this.http.get<any[]>('/api/users').subscribe(u => this.users.set(u));
    this.http.get<any[]>('/api/orders').subscribe(o => this.orders.set(o));
    this.http.get<any[]>('/api/reviews').subscribe(r => this.reviews.set(r));
    this.http.get<any[]>('/api/outbox').subscribe(m => this.outbox.set(m));
    this.http.get('/api/settings/full').subscribe(x => this.set = x);
  }
  delRev(r: any) { if (confirm('Ջնջե՞լ կարծիքը')) this.http.delete('/api/reviews/' + r.id).subscribe(() => { this.load(); this.s.refresh(); }); }
  role(u: any) { this.http.put('/api/users/' + u.id + '/role', {}).subscribe(() => this.load()); }
  delUser(u: any) { if (confirm('Ջնջե՞լ օգտատիրոջը')) this.http.delete('/api/users/' + u.id).subscribe(() => this.load()); }
  status(o: any, st: string) { this.http.put('/api/orders/' + o.id, { status: st }).subscribe(() => { this.s.toast('Կարգավիճակը թարմացվեց'); this.load(); this.s.refresh(); }); }
  edit(p?: any) { this.err = ''; this.ed = p ? { ...p } : { name: '', cat: 'phone', price: null, old: null, stock: 10, emoji: '📦', badge: '', desc: '', img: '' }; }
  file(ev: any) {
    const f = ev.target.files[0]; if (!f) return;
    if (f.size > 600000) { ev.target.value = ''; this.err = 'Նկարը 600 ԿԲ-ից մեծ է'; return; }
    const r = new FileReader(); r.onload = () => this.ed.img = r.result as string; r.readAsDataURL(f);
  }
  saveProd() {
    const e = this.ed, req = e.id ? this.http.put('/api/products/' + e.id, e) : this.http.post('/api/products', e);
    req.subscribe({ next: () => { this.ed = null; this.s.refresh(); this.s.toast('Ապրանքը պահպանվեց'); }, error: x => this.err = x.error?.error || 'Սխալ' });
  }
  delProd(p: any) { if (confirm('Ջնջե՞լ ապրանքը')) this.http.delete('/api/products/' + p.id).subscribe(() => this.s.refresh()); }
  saveSet() { this.http.put('/api/settings', this.set).subscribe(() => { this.s.refresh(); this.s.toast('Կարգավորումները պահպանվեցին'); }); }
  reset() { if (confirm('Ջնջե՞լ բոլոր տվյալները և վերականգնել դեմո ապրանքները')) this.http.post('/api/admin/reset', {}).subscribe(() => { this.s.logout(); location.href = '/'; }); }
}
