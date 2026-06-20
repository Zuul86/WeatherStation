import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  public name$!: Observable<string>;

  constructor() { }

  ngOnInit(): void {
    this.name$ = of('Weather Nerd');
  }

}
