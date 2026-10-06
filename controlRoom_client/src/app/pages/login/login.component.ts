import { AfterViewInit, Component, ElementRef, HostListener, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { routerTransition } from '../../router.animations';
import { MessageService, Message } from 'primeng/api';
import { LogginService, UserService, LabelService, StructureService, ScreenService, NewsBulletinService } from '../../shared/services/index';
import { MenuAccessService } from '../../shared/services/menu/menu-access.service';
import { catchError, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { FallForestRenderer } from './login-fall-forest';

interface FallLeaf {
    id: number;
    x: number;
    y?: number;
    delay: number;
    duration: number;
    size: number;
    tone: number;
    glyph: string;
}

type CatPhase = 'idle' | 'chase' | 'catch';

interface FallWolf {
    id: number;
    leftPct: number;
    bottomPct: number;
    scale: number;
    speed: number;
    walkDir: 1 | -1;
    facingLeft: boolean;
    turning: boolean;
    turnUntil: number;
    howling: boolean;
}

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    animations: [routerTransition()]
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild('fallForest') fallForestCanvas?: ElementRef<HTMLCanvasElement>;
    @ViewChild('catStage') catStageRef?: ElementRef<HTMLDivElement>;
    @ViewChild('owlStage') owlStageRef?: ElementRef<HTMLDivElement>;

    authentification: any = {};
    mess: string = '';

    userInfoGathered: boolean = false;
    environmentGathered: boolean = false;
    parameterGathered: boolean = false;
    labelsGathered: boolean = false;

    canConnect: boolean = false;
    connectionMessage: Message[] = [];
    divVersion: any;
    showVersion = false;

    footballs: number[] = Array(50).fill(0);
    snowflakes: number[] = Array(50).fill(0);

    leaves: FallLeaf[] = [];
    reducedMotion = false;
    animationsPaused = false;
    isNightMode = false;
    catPhase: CatPhase = 'idle';
    catFacingLeft = true;
    catIsTurning = false;
    wolves: FallWolf[] = [];
    owlPerched = false;
    owlFacingLeft = false;

    private forest?: FallForestRenderer;
    private chaseTimer?: ReturnType<typeof setTimeout>;
    private catRaf = 0;
    private wolfRaf = 0;
    private wolfLastTs = 0;
    private owlRaf = 0;
    private owlX = -8;
    private owlY = 28;
    private owlPath: { x: number; y: number; duration: number; perch?: boolean }[] = [];
    private owlSeg = 0;
    private owlSegT0 = 0;
    private owlSegFromX = 0;
    private owlSegFromY = 0;
    private catLeftPct = 18;
    private catHopPx = 0;
    /** +1 walk right, -1 walk left - always matches facing after a U-turn. */
    private catWalkDir: 1 | -1 = 1;
    private catTurnUntil = 0;
    private catLastTs = 0;
    private leafIdSeq = 0;
    private wolfIdSeq = 0;
    private static readonly LEAF_GLYPHS = ['🍂', '🍁', '🍃'];
    private static readonly CAT_WALK_SPEED = 3.2; // % of scene width per second
    private static readonly CAT_TURN_MS = 480;
    private static readonly CAT_MIN_PCT = 6;
    private static readonly CAT_MAX_PCT = 52;
    private static readonly WOLF_MAX = 4;
    private static readonly WOLF_TURN_MS = 520;
    private static readonly WOLF_MIN_PCT = 4;
    private static readonly WOLF_MAX_PCT = 88;

    constructor(
        public router: Router,
        private _messageService: MessageService,
        private _logginService: LogginService,
        private _userService: UserService,
        private _labelService: LabelService,
        private _screenService: ScreenService,
        private _structureService: StructureService,
        private _menuAccess: MenuAccessService,
        private ngZone: NgZone,
    ) {
        this.canConnect = false;
        this.authentification.username = '';
    }

    ngOnInit(): void {
        this.reducedMotion = this.prefersReducedMotion();
        this.animationsPaused = document.hidden;
        this.leaves = this.buildLeaves(this.reducedMotion ? 8 : 18);
    }

    ngAfterViewInit(): void {
        const canvas = this.fallForestCanvas?.nativeElement;
        if (canvas) {
            this.forest = new FallForestRenderer(canvas);
            this.forest.start({ reducedMotion: this.reducedMotion, night: this.isNightMode });
            if (this.animationsPaused) {
                this.forest.setPaused(true);
            }
        }
        if (!this.reducedMotion && !this.animationsPaused) {
            this.applyCatPose();
            this.startCatIdle();
            this.scheduleCatChase();
        } else {
            this.applyCatPose();
        }
    }

    ngOnDestroy(): void {
        this.stopCatMotion();
        this.stopWolfMotion();
        this.stopOwlMotion();
        this.forest?.destroy();
        this.forest = undefined;
    }

    @HostListener('document:visibilitychange')
    onVisibilityChange(): void {
        this.animationsPaused = document.hidden;
        this.forest?.setPaused(document.hidden);
        if (document.hidden) {
            this.stopCatMotion();
            this.stopWolfMotion();
            this.stopOwlMotion();
            this.catPhase = 'idle';
            this.catHopPx = 0;
            this.catIsTurning = false;
        } else if (!this.reducedMotion) {
            this.startCatIdle();
            this.scheduleCatChase();
            this.ensureWolfLoop();
            if (this.isNightMode) {
                this.startOwlFlight();
            }
        }
    }

    trackLeaf(_index: number, leaf: FallLeaf): number {
        return leaf.id;
    }

    trackWolf(_index: number, wolf: FallWolf): number {
        return wolf.id;
    }

    onPageClick(event: MouseEvent): void {
        const target = event.target as HTMLElement | null;
        if (!target) {
            return;
        }
        if (target.closest('.main-content, .fall-sun, .fall-toast, .p-toast, button, input, a, label')) {
            return;
        }
        this.spawnWolf(event);
    }

    private spawnWolf(event: MouseEvent): void {
        if (this.wolves.length >= LoginComponent.WOLF_MAX) {
            return;
        }
        const page = (event.currentTarget as HTMLElement) || document.documentElement;
        const rect = page.getBoundingClientRect();
        const clickPct = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 100;
        const walkDir: 1 | -1 = Math.random() > 0.5 ? 1 : -1;
        const wolf: FallWolf = {
            id: ++this.wolfIdSeq,
            leftPct: Math.min(LoginComponent.WOLF_MAX_PCT, Math.max(LoginComponent.WOLF_MIN_PCT, clickPct)),
            bottomPct: 8.5 + Math.random() * 4,
            scale: 0.88 + Math.random() * 0.28,
            speed: 2.4 + Math.random() * 1.6,
            walkDir,
            facingLeft: walkDir > 0,
            turning: false,
            turnUntil: 0,
            howling: false,
        };
        this.wolves = [...this.wolves, wolf];
        setTimeout(() => {
            const w = this.wolves.find((x) => x.id === wolf.id);
            if (w) {
                w.howling = true;
                setTimeout(() => { w.howling = false; }, 700);
            }
        }, 80);
        // Wait one frame so *ngFor has created the node, then start motion
        requestAnimationFrame(() => {
            this.applyAllWolfPoses();
            this.ensureWolfLoop();
        });
    }

    private ensureWolfLoop(): void {
        if (this.wolfRaf || !this.wolves.length || this.animationsPaused || this.reducedMotion) {
            if (this.wolves.length && !this.reducedMotion) {
                this.applyAllWolfPoses();
            }
            return;
        }
        this.wolfLastTs = performance.now();
        this.ngZone.runOutsideAngular(() => {
            const tick = (now: number) => {
                if (this.animationsPaused || !this.wolves.length) {
                    this.wolfRaf = 0;
                    return;
                }
                const dt = Math.min(0.05, (now - this.wolfLastTs) / 1000);
                this.wolfLastTs = now;
                let facingChanged = false;

                for (const wolf of this.wolves) {
                    if (now < wolf.turnUntil) {
                        if (!wolf.turning) {
                            wolf.turning = true;
                            facingChanged = true;
                        }
                        continue;
                    }
                    if (wolf.turning) {
                        wolf.turning = false;
                        facingChanged = true;
                    }
                    const next = wolf.leftPct + wolf.walkDir * wolf.speed * dt;
                    const hitRight = wolf.walkDir > 0 && next >= LoginComponent.WOLF_MAX_PCT;
                    const hitLeft = wolf.walkDir < 0 && next <= LoginComponent.WOLF_MIN_PCT;
                    if (hitRight || hitLeft) {
                        wolf.leftPct = hitRight ? LoginComponent.WOLF_MAX_PCT : LoginComponent.WOLF_MIN_PCT;
                        wolf.walkDir = wolf.walkDir > 0 ? -1 : 1;
                        wolf.turnUntil = now + LoginComponent.WOLF_TURN_MS;
                        wolf.turning = true;
                        wolf.facingLeft = wolf.walkDir > 0;
                        facingChanged = true;
                    } else {
                        wolf.leftPct = next;
                    }
                }

                this.applyAllWolfPoses();
                if (facingChanged) {
                    this.ngZone.run(() => { /* refresh flip / walk classes */ });
                }
                this.wolfRaf = requestAnimationFrame(tick);
            };
            this.wolfRaf = requestAnimationFrame(tick);
        });
    }

    private applyAllWolfPoses(): void {
        const root = this.fallForestCanvas?.nativeElement?.parentElement
            || document.querySelector('.fall-scene');
        if (!root) {
            return;
        }
        for (const wolf of this.wolves) {
            const el = root.querySelector(`[data-wolf-id="${wolf.id}"]`) as HTMLElement | null;
            if (el) {
                el.style.left = `${wolf.leftPct}%`;
            }
        }
    }

    private stopWolfMotion(): void {
        cancelAnimationFrame(this.wolfRaf);
        this.wolfRaf = 0;
    }

    toggleDayNight(event?: Event): void {
        event?.stopPropagation();
        event?.preventDefault();
        this.isNightMode = !this.isNightMode;
        this.forest?.setNight(this.isNightMode);
        if (this.isNightMode) {
            // Let *ngIf create the owl node, then start flight
            setTimeout(() => this.startOwlFlight(), 0);
        } else {
            this.stopOwlMotion();
            this.owlPerched = false;
        }
    }

    private startOwlFlight(): void {
        if (!this.isNightMode || this.animationsPaused) {
            return;
        }
        this.stopOwlMotion();
        const perch = this.forest?.getOwlPerch() ?? { xPct: 85, yPct: 24 };
        this.owlPath = [
            { x: -10, y: 30, duration: 0 },
            { x: 18, y: 16, duration: 2800 },
            { x: 42, y: 22, duration: 2600 },
            { x: 62, y: 14, duration: 2400 },
            { x: perch.xPct - 6, y: Math.max(8, perch.yPct - 8), duration: 2200 },
            { x: perch.xPct, y: perch.yPct, duration: 1600, perch: true },
            { x: perch.xPct, y: perch.yPct, duration: 5200, perch: true }, // hold on tip
            { x: perch.xPct - 4, y: Math.max(6, perch.yPct - 10), duration: 900 },
            { x: 48, y: 12, duration: 2800 },
            { x: 12, y: 20, duration: 2600 },
            { x: -12, y: 28, duration: 2200 },
        ];
        this.owlSeg = 1;
        this.owlX = this.owlPath[0].x;
        this.owlY = this.owlPath[0].y;
        this.owlSegFromX = this.owlX;
        this.owlSegFromY = this.owlY;
        this.owlSegT0 = performance.now();
        this.owlPerched = false;
        this.owlFacingLeft = false;
        this.applyOwlPose();

        if (this.reducedMotion) {
            this.owlX = perch.xPct;
            this.owlY = perch.yPct;
            this.owlPerched = true;
            this.applyOwlPose();
            return;
        }

        this.ngZone.runOutsideAngular(() => {
            const tick = (now: number) => {
                if (!this.isNightMode || this.animationsPaused) {
                    this.owlRaf = 0;
                    return;
                }
                const seg = this.owlPath[this.owlSeg];
                if (!seg) {
                    // Restart circuit with fresh perch (resize-safe)
                    this.ngZone.run(() => this.startOwlFlight());
                    return;
                }
                const dur = Math.max(1, seg.duration);
                const p = Math.min(1, (now - this.owlSegT0) / dur);
                const e = this.easeInOut(p);
                const prevX = this.owlX;
                this.owlX = this.owlSegFromX + (seg.x - this.owlSegFromX) * e;
                this.owlY = this.owlSegFromY + (seg.y - this.owlSegFromY) * e;

                const moving = Math.abs(seg.x - this.owlSegFromX) > 0.2;
                if (moving) {
                    const faceLeft = this.owlX > prevX + 0.02
                        ? true
                        : this.owlX < prevX - 0.02
                            ? false
                            : this.owlFacingLeft;
                    if (faceLeft !== this.owlFacingLeft) {
                        this.ngZone.run(() => { this.owlFacingLeft = faceLeft; });
                    }
                }

                const shouldPerch = !!seg.perch && p > 0.85;
                if (shouldPerch !== this.owlPerched) {
                    this.ngZone.run(() => { this.owlPerched = shouldPerch; });
                }

                this.applyOwlPose();

                if (p >= 1) {
                    this.owlX = seg.x;
                    this.owlY = seg.y;
                    this.owlSegFromX = seg.x;
                    this.owlSegFromY = seg.y;
                    this.owlSeg += 1;
                    this.owlSegT0 = now;
                    if (this.owlSeg >= this.owlPath.length) {
                        this.ngZone.run(() => this.startOwlFlight());
                        return;
                    }
                }
                this.owlRaf = requestAnimationFrame(tick);
            };
            this.owlRaf = requestAnimationFrame(tick);
        });
    }

    private applyOwlPose(): void {
        const el = this.owlStageRef?.nativeElement
            || document.querySelector('.fall-owl-stage') as HTMLElement | null;
        if (!el) {
            return;
        }
        el.style.left = `${this.owlX}%`;
        el.style.top = `${this.owlY}%`;
    }

    private stopOwlMotion(): void {
        cancelAnimationFrame(this.owlRaf);
        this.owlRaf = 0;
    }

    private buildLeaves(count: number): FallLeaf[] {
        const leaves: FallLeaf[] = [];
        const glyphs = LoginComponent.LEAF_GLYPHS;
        for (let i = 0; i < count; i++) {
            leaves.push({
                id: ++this.leafIdSeq,
                x: 2 + Math.random() * 96,
                delay: Math.random() * 14,
                duration: 9 + Math.random() * 10,
                size: 0.7 + Math.random() * 0.65,
                tone: 1 + Math.floor(Math.random() * 3),
                glyph: glyphs[Math.floor(Math.random() * glyphs.length)],
            });
        }
        return leaves;
    }

    private scheduleCatChase(): void {
        if (this.chaseTimer) {
            clearTimeout(this.chaseTimer);
            this.chaseTimer = undefined;
        }
        if (this.animationsPaused || this.reducedMotion) {
            return;
        }
        const waitMs = 7000 + Math.random() * 5000;
        this.chaseTimer = setTimeout(() => this.runCatChase(), waitMs);
    }

    private startCatIdle(): void {
        if (this.animationsPaused || this.reducedMotion) {
            return;
        }
        this.setCatPhase('idle');
        this.catHopPx = 0;
        this.catTurnUntil = 0;
        this.catIsTurning = false;
        this.syncFacingToWalkDir();
        this.applyCatPose();
        cancelAnimationFrame(this.catRaf);
        this.catLastTs = performance.now();

        this.ngZone.runOutsideAngular(() => {
            const tick = (now: number) => {
                if (this.catPhase !== 'idle' || this.animationsPaused) {
                    return;
                }
                const dt = Math.min(0.05, (now - this.catLastTs) / 1000);
                this.catLastTs = now;

                if (now < this.catTurnUntil) {
                    // U-turn pause - face already flipped, hold position
                    if (!this.catIsTurning) {
                        this.ngZone.run(() => { this.catIsTurning = true; });
                    }
                    this.catHopPx = 0;
                    this.applyCatPose();
                    this.catRaf = requestAnimationFrame(tick);
                    return;
                }
                if (this.catIsTurning) {
                    this.ngZone.run(() => { this.catIsTurning = false; });
                }

                const next = this.catLeftPct + this.catWalkDir * LoginComponent.CAT_WALK_SPEED * dt;
                const hitRight = this.catWalkDir > 0 && next >= LoginComponent.CAT_MAX_PCT;
                const hitLeft = this.catWalkDir < 0 && next <= LoginComponent.CAT_MIN_PCT;

                if (hitRight || hitLeft) {
                    this.catLeftPct = hitRight ? LoginComponent.CAT_MAX_PCT : LoginComponent.CAT_MIN_PCT;
                    this.beginUTurn();
                } else {
                    this.catLeftPct = next;
                }
                this.catHopPx = 0;
                this.applyCatPose();
                this.catRaf = requestAnimationFrame(tick);
            };
            this.catRaf = requestAnimationFrame(tick);
        });
    }

    private beginUTurn(): void {
        this.catWalkDir = this.catWalkDir > 0 ? -1 : 1;
        this.catTurnUntil = performance.now() + LoginComponent.CAT_TURN_MS;
        this.ngZone.run(() => {
            this.catIsTurning = true;
            this.catFacingLeft = this.catWalkDir > 0;
        });
    }

    /** Sprite faces right when unflipped; flip (scaleX -1) when walking left. */
    private syncFacingToWalkDir(): void {
        const facingLeft = this.catWalkDir > 0;
        if (facingLeft !== this.catFacingLeft) {
            this.ngZone.run(() => { this.catFacingLeft = facingLeft; });
        }
    }

    private runCatChase(): void {
        if (this.animationsPaused || this.reducedMotion) {
            return;
        }
        cancelAnimationFrame(this.catRaf);
        this.catRaf = 0;

        const startX = this.catLeftPct;
        const roomRight = LoginComponent.CAT_MAX_PCT - startX;
        const roomLeft = startX - LoginComponent.CAT_MIN_PCT;
        // Prefer continuing forward; only reverse if little room ahead
        let goRight = this.catWalkDir > 0;
        if (goRight && roomRight < 8) {
            goRight = false;
        } else if (!goRight && roomLeft < 8) {
            goRight = true;
        } else if (Math.random() > 0.72) {
            // Occasional reverse chase, but only with enough runway
            if (goRight && roomLeft >= 12) {
                goRight = false;
            } else if (!goRight && roomRight >= 12) {
                goRight = true;
            }
        }

        const travel = 12 + Math.random() * 10;
        const endX = this.clampCatX(goRight ? startX + travel : startX - travel);
        const chaseDir: 1 | -1 = goRight ? 1 : -1;
        this.catWalkDir = chaseDir;

        const needsTurn = (chaseDir > 0) !== this.catFacingLeft;
        const turnMs = needsTurn ? LoginComponent.CAT_TURN_MS : 0;
        const chaseMs = 2200;
        const catchMs = 1200;
        const t0 = performance.now();

        this.ngZone.run(() => {
            if (needsTurn) {
                this.catFacingLeft = chaseDir > 0;
                this.catIsTurning = true;
            }
            this.catPhase = 'chase';
        });

        this.ngZone.runOutsideAngular(() => {
            const tick = (now: number) => {
                if (this.animationsPaused) {
                    return;
                }
                const elapsed = now - t0;

                // Face new direction first, then sprint forward only
                if (elapsed < turnMs) {
                    this.catHopPx = 0;
                    this.applyCatPose();
                    this.catRaf = requestAnimationFrame(tick);
                    return;
                }
                if (this.catIsTurning) {
                    this.ngZone.run(() => { this.catIsTurning = false; });
                }

                const chaseElapsed = elapsed - turnMs;
                if (chaseElapsed < chaseMs) {
                    const p = this.easeInOut(chaseElapsed / chaseMs);
                    this.catLeftPct = startX + (endX - startX) * p;
                    const hop = Math.sin(p * Math.PI * 2);
                    this.catHopPx = -Math.max(0, hop) * 12;
                    this.applyCatPose();
                    this.catRaf = requestAnimationFrame(tick);
                    return;
                }
                if (chaseElapsed < chaseMs + catchMs) {
                    if (this.catPhase !== 'catch') {
                        this.ngZone.run(() => { this.catPhase = 'catch'; });
                        this.catLeftPct = endX;
                    }
                    const cp = (chaseElapsed - chaseMs) / catchMs;
                    this.catHopPx = cp < 0.35 ? -8 * Math.sin((cp / 0.35) * Math.PI) : 0;
                    this.applyCatPose();
                    this.catRaf = requestAnimationFrame(tick);
                    return;
                }
                this.catHopPx = 0;
                this.catLeftPct = endX;
                this.catWalkDir = chaseDir;
                this.applyCatPose();
                this.ngZone.run(() => {
                    this.startCatIdle();
                    this.scheduleCatChase();
                });
            };
            this.catRaf = requestAnimationFrame(tick);
        });
    }

    private setCatPhase(phase: CatPhase): void {
        if (this.catPhase !== phase) {
            this.catPhase = phase;
        }
    }

    private applyCatPose(): void {
        const el = this.catStageRef?.nativeElement;
        if (!el) {
            return;
        }
        el.style.left = `${this.catLeftPct}%`;
        el.style.transform = `translate3d(0, ${this.catHopPx}px, 0)`;
    }

    private stopCatMotion(): void {
        if (this.chaseTimer) {
            clearTimeout(this.chaseTimer);
            this.chaseTimer = undefined;
        }
        cancelAnimationFrame(this.catRaf);
        this.catRaf = 0;
    }

    private clampCatX(x: number): number {
        return Math.min(LoginComponent.CAT_MAX_PCT, Math.max(LoginComponent.CAT_MIN_PCT, x));
    }

    private easeInOut(t: number): number {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    private prefersReducedMotion(): boolean {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    onLoggedin() {
        if (!this.authentification.password) {
            this.showInvalidCredential();
        } else {
            this._logginService.login(this.authentification.username, this.authentification.password)
                .subscribe(result => {
                    this.canConnect = result;
                    if (this.canConnect) {
                        this.fetchUserConfiguration();
                    } else {
                        this.showInvalidCredential();
                    }
                });
        }
    }

    showInvalidCredential() {
        this.connectionMessage = [];
        this._messageService.add({
            key: 'top',
            sticky: true,
            severity: 'error',
            summary: 'Invalid credentials',
            detail: 'Use your GOLD user/password or contact HelpDesk'
        });
    }

    async fetchUserConfiguration() {
        console.log('LOGIN : Fetching user configuration');
        this.parameterGathered = true;
        const icrUser = localStorage.getItem('ICRUser')!;

        this._userService.getInfo(icrUser).subscribe({
            next: () => {
                this.userInfoGathered = true;
                this._userService.getEnvironment(icrUser).subscribe({
                    next: () => {
                        console.log('Environment data gathered', this._userService.userInfo);
                        this.environmentGathered = true;
                        this._labelService.loadForLanguage().pipe(
                            catchError(() => of(undefined)),
                            switchMap(() => this._menuAccess.load(icrUser)),
                        ).subscribe({
                            next: () => {
                                this.labelsGathered = true;
                                this.completeLogin();
                            },
                            error: () => {
                                this.labelsGathered = true;
                                this.completeLogin();
                            },
                        });
                    },
                    error: () => {
                        this.environmentGathered = true;
                        this.labelsGathered = true;
                        this.completeLogin();
                    },
                });
            },
        });
    }

    private completeLogin(): void {
        localStorage.setItem('isLoggedin', 'true');
        NewsBulletinService.markLoginBannerPending();
        this.router.navigate(['/dashboard']);
        this._structureService.getStructure();
        this._structureService.getNetwork();
    }

    showHideVersion(): void {
        this.showVersion = !this.showVersion;
    }
}
