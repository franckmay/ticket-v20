import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from '../../config.service';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  urlserveur: string = ''
  auth: string = ''
  urlLogin: string = ''
  urlRegister: string = ''
  urlUserDetails: string = ''
  urlUserBasicDetails: string = ''
  urlLogin2FA: string = ''
  urlRegisterCode: string = ''
  urlVerifyResetCode: string = ''
  urlResetPassword: string = ''


  constructor(private http: HttpClient, private appConfigService: ConfigService) {
    this.urlserveur = this.appConfigService.getConfig().serverIP;
    const urlserveur = this.appConfigService.getConfig().serverIP;
    this.urlLogin = urlserveur + 'authentication/login';
    this.urlRegister = urlserveur + 'authentication/register';
    this.urlUserDetails = urlserveur + 'authentication/details';
    this.urlLogin2FA = urlserveur + 'authentication/confirmCode';
    this.urlRegisterCode = urlserveur + 'authentication/details';
    this.urlUserBasicDetails = urlserveur + 'authentication/basicDetails';
    this.urlVerifyResetCode = urlserveur + 'authentication/verifyResetCode';
    this.urlResetPassword = urlserveur + 'authentication/resetPassword';
  }


  login(user: any) { return this.http.post(this.urlLogin, user); }

  register(user: any) { return this.http.post(this.urlLogin, user); }

  userDetails(login: string) { console.log(login); return this.http.post(this.urlUserDetails, login); }
  utilisateurBasicDetail(login: string) { return this.http.post(this.urlUserBasicDetails, login); }


  confirmCode(entity: any): Observable<any> { return this.http.post(this.urlLogin2FA, entity); }
  verifyResetCode(entity: any): Observable<any> { return this.http.post(this.urlVerifyResetCode, entity); }
  sendCode(userRegister: any) { return this.http.post(this.urlRegisterCode, userRegister); }
  resetPassword(userRegister: any) { return this.http.post(this.urlResetPassword, userRegister); }
}
