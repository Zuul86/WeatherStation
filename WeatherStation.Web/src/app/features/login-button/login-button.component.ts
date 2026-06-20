import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-login-button',
  templateUrl: './login-button.component.html',
  styleUrls: ['./login-button.component.scss']
})
export class LoginButtonComponent implements OnInit {

  public isAuthenticated$!: Observable<boolean>;

  constructor() { }

  public ngOnInit(): void {
    this.isAuthenticated$ = of(false);
  }

  public async signIn(): Promise<void> {
    // No-op
  }

  public async signOut(): Promise<void> {
    // No-op
  }

}
