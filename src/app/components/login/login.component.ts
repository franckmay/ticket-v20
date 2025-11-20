import { Component, ElementRef, HostListener, OnInit, AfterViewInit, OnDestroy, QueryList, ViewChildren, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { interval, Subscription } from 'rxjs';

// Vos imports réels
import { SessionStorageService } from '../../services/session/session-storage.service';
import { AuthService } from '../../services/auth/_services/auth.service';
import { User } from '../../class/user';
import { UserRegister } from '../../class/dto/user-register';

// Déclaration pour Matter.js (chargement dynamique)
declare const Matter: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {

  // --- Données ---
  user = new User();
  utilisateur = new User();
  userRegister = new UserRegister();
  
  form: any = {
    username: null,
    password: null,
  };

  // --- États ---
  stepIndex = 1; // 1: Login, 2: OTP
  loading = false;
  loadingText = 'loading';
  waiter = false;
  vuec = false; // Visibilité mot de passe
  isLoginFailed = false;
  isSessionExpired = false;
  errorMessage = '';

  // --- OTP ---
  otpDigits: string[] = new Array(6).fill('');
  @ViewChildren('otpInput') inputs!: QueryList<ElementRef>;
  otpRes = ''; 
  modeVerif = 1; // 1: Email, 2: SMS
  
  // --- Timer ---
  timer: number = 300;
  timerDisplay: string = '05:00';
  timerSubscription: Subscription | null = null;

  // --- Animation ---
  private engine: any;
  private render: any;
  private runner: any;
  private animationFrameId: number | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public translate: TranslateService,
    private ts: SessionStorageService,
    private api: AuthService,
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

    // Chargement de la physique uniquement côté navigateur
    if (isPlatformBrowser(this.platformId)) {
        this.loadMatterJs();
    }
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    this.stopTimer();
    this.stopPhysics();
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
  }

  // --------------------------------------------------------------------------------
  // ÉTAPE 1 : LOGIN
  // --------------------------------------------------------------------------------

  onSubmit(): void {
    if (!this.form.username || !this.form.password) return;

    this.loading = true;
    this.loadingText = 'Vérification des informations';
    this.isLoginFailed = false;

    this.api.login({ ...this.user, login: this.form.username, password: this.form.password }).subscribe({
      next: (data: any) => {
        // Mise à jour des données utilisateur
        this.user = data.user;
        this.otpRes = data.otpCode;
        
        if (data.utilisateur) {
             this.utilisateur = data.utilisateur;
        }

        // Passage à l'étape OTP
        this.stepIndex = 2;
        this.startTimer();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Erreur login:', error);
        if (error.status === 404 || error.statusText === 'Unknown Error') {
          this.errorMessage = 'Impossible de joindre le serveur';
        } else {
          this.errorMessage = 'Identifiants incorrects';
        }
        this.isLoginFailed = true;
        this.loading = false;
      }
    });
  }

  togglePasswordVisibilityCon() {
    this.vuec = !this.vuec;
  }

  // --------------------------------------------------------------------------------
  // ÉTAPE 2 : OTP
  // --------------------------------------------------------------------------------

  get otpValue(): string {
    return this.otpDigits.join('');
  }

  set otpValue(value: string) {
    this.otpDigits = value.split('').slice(0, 6);
    while (this.otpDigits.length < 6) this.otpDigits.push('');
  }

  onInput(event: any, index: number) {
    const value = event.target.value;
    // Focus automatique sur le champ suivant
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

    // Vérification préliminaire si le code est disponible en front
    if (this.otpRes && this.otpRes !== this.otpValue) {
         alert(this.translate.instant('code incorrect'));
         return;
    }

    this.loading = true;
    this.api.confirmCode({ login: this.form.username, otpCode: this.otpValue }).subscribe({
      next: (data: any) => {
        this.saveToken(data);
      },
      error: (error: any) => {
        console.error(error);
        alert(this.translate.instant('erreur verification'));
        this.loading = false;
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
    } else {
      this.loading = false;
    }
  }

  renvoyerCode() {
    if(this.timer > 0) return;
    
    this.loading = true;
    const payload = { ...this.userRegister, methode: this.modeVerif };
    
    this.api.sendCode(payload).subscribe({
      next: (data: any) => {
        this.startTimer();
        this.otpValue = ''; 
        this.loading = false;
      },
      error: (error: any) => {
        console.error(error);
        alert(this.translate.instant('erreur'));
        this.loading = false;
      }
    });
  }

  // --------------------------------------------------------------------------------
  // TIMER
  // --------------------------------------------------------------------------------

  startTimer(): void {
    this.stopTimer();
    this.timer = 300;
    this.timerDisplay = '05:00';
    this.timerSubscription = interval(1000).subscribe(() => {
      this.timer--;
      this.timerDisplay = this.formatTimer(this.timer);
      if (this.timer <= 0) this.stopTimer();
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
    setTimeout(() => {
      this.waiter = false;
      this.loading = false;
      this.router.navigate(['/accueil']);
    }, 1500);
  }

  // --------------------------------------------------------------------------------
  // ANIMATIONS (MATTER.JS)
  // --------------------------------------------------------------------------------

  loadMatterJs() {
    // Si Matter est déjà chargé via package.json ou script global
    if (typeof Matter !== 'undefined') {
      this.initPhysics();
      this.initBackgroundParticles();
      return;
    }
    
    // Chargement dynamique si nécessaire
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

    // Murs
    const w = container.clientWidth, h = container.clientHeight, t = 100;
    const ground = Bodies.rectangle(w/2, h + t/2, w + 200, t, { isStatic: true, render: { visible: false } });
    const left = Bodies.rectangle(-t/2, h/2, t, h * 2, { isStatic: true, render: { visible: false } });
    const right = Bodies.rectangle(w + t/2, h/2, t, h * 2, { isStatic: true, render: { visible: false } });
    const ceil = Bodies.rectangle(w/2, -t*2, w + 200, t, { isStatic: true, render: { visible: false } });
    
    // Cartes
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

    // Souris
    const mouse = Mouse.create(this.render.canvas);
    const mc = MouseConstraint.create(this.engine, {
        mouse: mouse, constraint: { stiffness: 0.1, render: { visible: false } }
    });
    (mc as any).mouse.element.removeEventListener("mousewheel", (mc as any).mouse.mousewheel);
    (mc as any).mouse.element.removeEventListener("DOMMouseScroll", (mc as any).mouse.mousewheel);
    World.add(this.engine.world, mc);

    // Boucle de synchronisation
    const update = () => {
        bodies.forEach(b => {
            const el = (b as any).domElement;
            if(el) el.style.transform = `translate(${b.position.x - cardSize/2}px, ${b.position.y - cardSize/2}px) rotate(${b.angle}rad)`;
        });
        this.animationFrameId = requestAnimationFrame(update);
    };
    update();

    const runner = Runner.create();
    this.runner = runner;
    Runner.run(runner, this.engine);

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
          requestAnimationFrame(animate);
      };
      animate();
  }
}