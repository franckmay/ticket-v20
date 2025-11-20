import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { SessionStorageService } from './session/session-storage.service';

@Injectable({
  providedIn: 'root'
})


@Injectable()
export class LoginActivateGuard implements CanActivate {
  constructor(private authService: SessionStorageService, private router: Router) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    if (!this.authService.getUser().login) {
      this.router.navigate(['login']);
    }
    return true;
  }
}