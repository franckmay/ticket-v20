import { Component, ElementRef, HostListener, OnInit, AfterViewInit, OnDestroy, QueryList, ViewChildren, Inject, PLATFORM_ID, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { interval, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

// Vos imports réels
import { SessionStorageService } from '../../services/session/session-storage.service';
import { AuthService } from '../../services/auth/_services/auth.service';
import { User } from '../../class/user';
import { UserRegister } from '../../class/dto/user-register';
import { UserManagementService } from '../../services/user-management.service';

declare const Matter: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {

  user = new User();
  utilisateur = new User();
  
  userRegister: any = { 
    login: 'admin', 
    nom: '', 
    prenom: '', 
    email: '', 
    telephone: '', 
    password: '',
    passwordConfirm: ''
  };
  
  form: any = { username: null, password: null };

  stepIndex = 1; 
  loading = false;
  loadingText = 'loading';
  waiter = false;
  vuec = false;
  vuecCreate = false;
  isLoginFailed = false;
  isSessionExpired = false;
  errorMessage = '';

  otpDigits: string[] = new Array(6).fill('');
  @ViewChildren('otpInput') inputs!: QueryList<ElementRef>;
  otpRes = ''; 
  modeVerif = 1;
  
  timer: number = 300;
  timerDisplay: string = '05:00';
  timerSubscription: Subscription | null = null;

  private engine: any;
  private render: any;
  private runner: any;
  private animationFrameId: number | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public translate: TranslateService,
    private ts: SessionStorageService,
    private authService: AuthService,
    private userService: UserManagementService,
    private ngZone: NgZone,             // Injection pour gérer l'exécution hors zone
    private cd: ChangeDetectorRef,      // Injection pour forcer la mise à jour UI
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.translate.setDefaultLang('fr');
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      if (params.get('session')) {
        this.isSessionExpired = true;
      }
    });

    this.checkSystemStatus();

    if (isPlatformBrowser(this.platformId)) {
        // On lance MatterJS en dehors de la détection de changement Angular pour éviter les lenteurs
        this.ngZone.runOutsideAngular(() => {
            this.loadMatterJs();
        });
    }
  }

  // NOUVEAU : Forcer la détection de changement à la fin des requêtes
  private stopLoading() {
    this.loading = false;
    this.waiter = false;
    this.cd.detectChanges(); // Force la mise à jour de la vue immédiatement
  }

  checkSystemStatus() {
    this.waiter = true;
    this.userService.checkAdminExists().pipe(
        finalize(() => this.stopLoading())
    ).subscribe({
        next: (res: any) => {
            // On met à jour les variables, puis on force la détection
            if (res && res.exists === false) {
                this.stepIndex = 0;
            } else {
                this.stepIndex = 1;
            }
            this.cd.detectChanges();
        },
        error: (err) => {
            console.error('Erreur vérification système', err);
        }
    });
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    this.stopTimer();
    this.stopPhysics();
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
  }

  // --- CREATION ADMIN (Step 0) ---
  
  onSubmitAdminCreation() {
      if (this.userRegister.password !== this.userRegister.passwordConfirm) {
          this.errorMessage = "Les mots de passe ne correspondent pas.";
          this.isLoginFailed = true;
          return;
      }

      this.loading = true;
      this.loadingText = "Initialisation du système...";
      
      const payload = {
          ...this.userRegister,
          login: 'admin',
          fonction: 'Super Administrateur',
          service: 'Général',
          organisationID: 1,
          actif: 1,
          user_update: 'INSTALLER'
      };

      this.userService.insert(payload).pipe(
          finalize(() => this.stopLoading())
      ).subscribe({
          next: (res) => {
              alert("Administrateur créé avec succès. Vous pouvez maintenant vous connecter.");
              this.stepIndex = 1;
              this.form.username = 'admin';
              this.isLoginFailed = false;
              this.cd.detectChanges();
          },
          error: (err) => {
              console.error(err);
              this.errorMessage = "Erreur lors de la création de l'administrateur.";
              this.isLoginFailed = true;
              this.cd.detectChanges();
          }
      });
  }

  togglePasswordVisibilityCreate() {
      this.vuecCreate = !this.vuecCreate;
  }

  // --- LOGIN (Step 1) ---

  onSubmit(): void {
    if (!this.form.username || !this.form.password) return;

    this.loading = true;
    this.loadingText = 'Vérification des informations';
    this.isLoginFailed = false;

    this.authService.login({ ...this.user, login: this.form.username, password: this.form.password })
      .pipe(finalize(() => this.stopLoading()))
      .subscribe({
        next: (data: any) => {
          this.user = data.user;
          this.otpRes = data.otpCode;
          if (data.utilisateur) this.utilisateur = data.utilisateur;

          this.stepIndex = 2;
          this.startTimer();
          this.cd.detectChanges();
        },
        error: (error: any) => {
          console.error('Erreur login:', error);
          if (error.status === 404 || error.statusText === 'Unknown Error') {
            this.errorMessage = 'Impossible de joindre le serveur';
          } else {
            this.errorMessage = 'Identifiants incorrects';
          }
          this.isLoginFailed = true;
          this.cd.detectChanges();
        }
      });
  }

  togglePasswordVisibilityCon() {
    this.vuec = !this.vuec;
  }

  // --- OTP (Step 2) ---

  get otpValue(): string {
    return this.otpDigits.join('');
  }

  set otpValue(value: string) {
    this.otpDigits = value.split('').slice(0, 6);
    while (this.otpDigits.length < 6) this.otpDigits.push('');
  }

  onInput(event: any, index: number) {
    const value = event.target.value;
    if (value.length === 1 && index < 5) {
      this.inputs.toArray()[index + 1].nativeElement.focus();
    }
  }

  onBackspace(index: number) {
    if (!this.otpDigits[index] && index > 0) {
      this.inputs.toArray()[index - 1].nativeElement.focus();
    }
  }

  @HostListener('document:paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    if(this.stepIndex !== 2) return;
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text')?.replace(/\D/g, '').slice(0, 6);
    
    if (pastedData) {
      pastedData.split('').forEach((char, i) => {
        if (i < 6) this.otpDigits[i] = char;
      });
      setTimeout(() => this.inputs.last.nativeElement.focus(), 0);
    }
  }

  verifierCode() {
    if (this.otpValue.length < 6) return;

    if (this.otpRes && this.otpRes != this.otpValue) {
         alert(this.translate.instant('code incorrect'));
         console.error
         (this.otpRes+ " --- " +  this.otpValue);
         return;
    }

    this.loading = true;
    this.authService.confirmCode({ login: this.form.username, otpCode: this.otpValue })
      .pipe(finalize(() => this.stopLoading()))
      .subscribe({
        next: (data: any) => {
          this.saveToken(data);
        },
        error: (error: any) => {
          console.error(error);
          alert(this.translate.instant('erreur verification'));
        }
      });
  }

  saveToken(data: any): void {
    if (data && data.utilisateur) {
      this.isLoginFailed = false;
      this.ts.saveRole(data.roles);
      this.ts.saveOrganisation(data.utilisateur.organisationID);
      this.ts.saveUser(data.utilisateur);
      this.goHome();
    }
  }

  renvoyerCode() {
    if(this.timer > 0) return;
    
    this.loading = true;
    const payload = { ...this.userRegister, methode: this.modeVerif };
    
    this.authService.sendCode(payload)
      .pipe(finalize(() => this.stopLoading()))
      .subscribe({
        next: (data: any) => {
          this.startTimer();
          this.otpValue = ''; 
          this.cd.detectChanges();
        },
        error: (error: any) => {
          console.error(error);
          alert(this.translate.instant('erreur'));
        }
      });
  }

  // --- TIMER ---

  startTimer(): void {
    this.stopTimer();
    this.timer = 300;
    this.timerDisplay = '05:00';
    this.timerSubscription = interval(1000).subscribe(() => {
      this.timer--;
      this.timerDisplay = this.formatTimer(this.timer);
      if (this.timer <= 0) this.stopTimer();
      // Pas besoin de detectChanges ici car interval tourne dans la zone, mais par sécurité :
      this.cd.markForCheck();
    });
  }

  stopTimer(): void {
    if (this.timerSubscription) this.timerSubscription.unsubscribe();
  }

  formatTimer(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  goHome() {
    this.waiter = true;
    this.cd.detectChanges();
    setTimeout(() => {
      this.waiter = false;
      this.loading = false;
      this.router.navigate(['/accueil']);
    }, 1500);
  }

  // --- ANIMATIONS ---

  loadMatterJs() {
    if (typeof Matter !== 'undefined') {
      this.initPhysics();
      this.initBackgroundParticles();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js';
    script.onload = () => {
      this.initPhysics();
      this.initBackgroundParticles();
    };
    document.body.appendChild(script);
  }

  initPhysics() {
    const container = document.getElementById('visual-container');
    if (!container || !Matter) return;

    const Engine = Matter.Engine, Render = Matter.Render, World = Matter.World, Bodies = Matter.Bodies, Mouse = Matter.Mouse, MouseConstraint = Matter.MouseConstraint, Runner = Matter.Runner;

    this.engine = Engine.create();
    this.engine.world.gravity.y = 0.15;

    this.render = Render.create({
        element: container,
        engine: this.engine,
        canvas: document.getElementById('physics-canvas') as HTMLCanvasElement,
        options: {
            width: container.clientWidth, height: container.clientHeight,
            background: 'transparent', wireframes: false, showAngleIndicator: false
        }
    });

    const w = container.clientWidth, h = container.clientHeight, t = 100;
    const ground = Bodies.rectangle(w/2, h + t/2, w + 200, t, { isStatic: true, render: { visible: false } });
    const left = Bodies.rectangle(-t/2, h/2, t, h * 2, { isStatic: true, render: { visible: false } });
    const right = Bodies.rectangle(w + t/2, h/2, t, h * 2, { isStatic: true, render: { visible: false } });
    const ceil = Bodies.rectangle(w/2, -t*2, w + 200, t, { isStatic: true, render: { visible: false } });
    
    const cardSize = 160;
    const bodies: any[] = [];
    const domElements = [document.getElementById('card-1'), document.getElementById('card-2'), document.getElementById('card-3')];
    
    domElements.forEach(el => {
        if(!el) return;
        const x = Math.random() * (w - cardSize) + cardSize/2;
        const y = Math.random() * (h/2) + 50;
        const body = Bodies.rectangle(x, y, cardSize, cardSize, {
            chamfer: { radius: 24 }, restitution: 0.6, frictionAir: 0.02, render: { visible: false }
        });
        (body as any).domElement = el;
        bodies.push(body);
    });

    World.add(this.engine.world, [ground, left, right, ceil, ...bodies]);

    const mouse = Mouse.create(this.render.canvas);
    const mc = MouseConstraint.create(this.engine, {
        mouse: mouse, constraint: { stiffness: 0.1, render: { visible: false } }
    });
    // Désactiver le zoom molette
    (mc as any).mouse.element.removeEventListener("mousewheel", (mc as any).mouse.mousewheel);
    (mc as any).mouse.element.removeEventListener("DOMMouseScroll", (mc as any).mouse.mousewheel);
    World.add(this.engine.world, mc);

    const update = () => {
        bodies.forEach(b => {
            const el = (b as any).domElement;
            if(el) el.style.transform = `translate(${b.position.x - cardSize/2}px, ${b.position.y - cardSize/2}px) rotate(${b.angle}rad)`;
        });
        this.animationFrameId = requestAnimationFrame(update);
    };
    
    // IMPORTANT: Lancer la boucle d'animation hors d'Angular pour ne pas spammer la Change Detection
    this.ngZone.runOutsideAngular(() => {
        update();
        const runner = Runner.create();
        this.runner = runner;
        Runner.run(runner, this.engine);
    });

    container.addEventListener('click', (e: any) => {
        if(e.target.id === 'bg-animation' || e.target.id === 'physics-canvas') {
            bodies.forEach(b => Matter.Body.applyForce(b, b.position, { x: (Math.random() - 0.5) * 0.03, y: -0.04 }));
        }
    });
  }

  stopPhysics() {
    if(this.runner) Matter.Runner.stop(this.runner);
    if(this.render) Matter.Render.stop(this.render);
    if(this.engine) Matter.World.clear(this.engine.world, false);
  }

  initBackgroundParticles() {
      const canvas = document.getElementById('bg-animation') as HTMLCanvasElement;
      if(!canvas) return;
      const ctx = canvas.getContext('2d');
      if(!ctx) return;

      let w = canvas.parentElement?.clientWidth || window.innerWidth;
      let h = canvas.parentElement?.clientHeight || window.innerHeight;
      canvas.width = w; canvas.height = h;

      const particles: any[] = [];
      for(let i=0; i<50; i++) {
          particles.push({
              x: Math.random()*w, y: Math.random()*h,
              vx: (Math.random()-0.5)*0.5, vy: (Math.random()-0.5)*0.5,
              size: Math.random()*2+1, alpha: Math.random()*0.5+0.2
          });
      }

      const animate = () => {
          if(!this.engine) return;
          ctx.clearRect(0,0,w,h);
          const grad = ctx.createRadialGradient(w*0.2, h*0.2, 0, w*0.5, h*0.5, w);
          grad.addColorStop(0, 'rgba(17, 24, 39, 1)');
          grad.addColorStop(0.4, 'rgba(6, 78, 59, 0.2)');
          grad.addColorStop(1, 'rgba(5, 5, 5, 0)');
          ctx.fillStyle = grad;
          ctx.fillRect(0,0,w,h);

          ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
          
          particles.forEach((p, i) => {
              p.x += p.vx; p.y += p.vy;
              if(p.x < 0 || p.x > w) p.vx *= -1;
              if(p.y < 0 || p.y > h) p.vy *= -1;
              ctx.globalAlpha = p.alpha;
              ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();

              for(let j=i+1; j<particles.length; j++) {
                  const p2 = particles[j];
                  const d = Math.hypot(p.x-p2.x, p.y-p2.y);
                  if(d < 150) {
                      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
                  }
              }
          });
          
          // IMPORTANT: Animation loop hors zone Angular
          this.ngZone.runOutsideAngular(() => {
              requestAnimationFrame(animate);
          });
      };
      
      this.ngZone.runOutsideAngular(() => {
          animate();
      });
  }
}