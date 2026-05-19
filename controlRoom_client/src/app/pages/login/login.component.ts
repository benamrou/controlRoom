import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import gsap from 'gsap';
import { routerTransition } from '../../router.animations';
import { MessageService, Message } from 'primeng/api';
import { LogginService, UserService, LabelService, StructureService, ScreenService } from '../../shared/services/index';
import { MenuAccessService } from '../../shared/services/menu/menu-access.service';

interface SeaShark {
    id: number;
    x: number;
    y: number;
}

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    animations: [routerTransition()]
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {

    authentification: any = {};
    mess: string = '';

    userInfoGathered: boolean = false;
    environmentGathered: boolean = false;
    parameterGathered: boolean = false;
    labelsGathered: boolean = false;

    canConnect: boolean = false;
    connectionMessage: Message[] = [];
    divVersion: any;

    // Version visibility
    showVersion = false;

    // Winter elements
    footballs: number[] = Array(50).fill(0);
    snowflakes: number[] = Array(50).fill(0);

    @ViewChild('birdWrap') private birdWrapRef?: ElementRef<HTMLElement>;
    @ViewChild('backWing') private backWingRef?: ElementRef<SVGGElement>;
    @ViewChild('frontWing') private frontWingRef?: ElementRef<SVGGElement>;
    @ViewChild('sailboatWrap') private sailboatWrapRef?: ElementRef<HTMLElement>;
    @ViewChild('sailboatRig') private sailboatRigRef?: ElementRef<SVGGElement>;
    @ViewChild('sailboatWake') private sailboatWakeRef?: ElementRef<SVGEllipseElement>;
    @ViewChild('oceanEl') private oceanElRef?: ElementRef<HTMLElement>;

    sharks: SeaShark[] = [];
    reducedMotion = false;
    ballTapBounce = false;
    isNightMode = false;

    private sceneTweens: gsap.core.Animation[] = [];
    private sharkRemoveTimers: ReturnType<typeof setTimeout>[] = [];
    private seaClickCount = 0;
    private seaClickResetTimer?: ReturnType<typeof setTimeout>;
    private sharkIdSeq = 0;
    private static readonly SEA_CLICKS_FOR_SHARK = 5;
    private static readonly SEA_CLICK_RESET_MS = 2800;
    private static readonly MAX_SHARKS = 4;
    private static readonly SHARK_LIFETIME_MS = 45000;

    constructor(
        public router: Router,
        private _messageService: MessageService,
        private _logginService: LogginService,
        private _userService: UserService,
        private _labelService: LabelService,
        private _screenService: ScreenService,
        private _structureService: StructureService,
        private _menuAccess: MenuAccessService,
    ) {
        this.canConnect = false;
        this.authentification.username = '';
    }

    ngOnInit(): void {
        this.reducedMotion = this.prefersReducedMotion();
    }

    ngAfterViewInit(): void {
        if (this.reducedMotion) {
            return;
        }
        this.initBeachBirdAnimation();
        this.initSailboatAnimation();
    }

    ngOnDestroy(): void {
        if (this.seaClickResetTimer) {
            clearTimeout(this.seaClickResetTimer);
        }
        this.sharkRemoveTimers.forEach(t => clearTimeout(t));
        this.sharkRemoveTimers = [];
        this.sceneTweens.forEach(t => t.kill());
        this.sceneTweens = [];
    }

    trackShark(_index: number, shark: SeaShark): number {
        return shark.id;
    }

    toggleDayNight(event?: Event): void {
        event?.stopPropagation();
        event?.preventDefault();
        this.isNightMode = !this.isNightMode;
    }

    onBallClick(event: MouseEvent): void {
        event.stopPropagation();
        if (this.reducedMotion) {
            return;
        }
        this.ballTapBounce = false;
        requestAnimationFrame(() => {
            this.ballTapBounce = true;
        });
    }

    onBallHopAnimationEnd(event: AnimationEvent): void {
        if (event.animationName === 'beach-ball-tap-hop') {
            this.ballTapBounce = false;
        }
    }

    onSeaClick(event: MouseEvent): void {
        if (this.seaClickResetTimer) {
            clearTimeout(this.seaClickResetTimer);
        }
        this.seaClickCount++;
        this.seaClickResetTimer = setTimeout(() => {
            this.seaClickCount = 0;
        }, LoginComponent.SEA_CLICK_RESET_MS);

        if (this.seaClickCount < LoginComponent.SEA_CLICKS_FOR_SHARK) {
            return;
        }
        this.seaClickCount = 0;
        this.spawnSharkAtClick(event);
    }

    private spawnSharkAtClick(event: MouseEvent): void {
        const ocean = this.oceanElRef?.nativeElement;
        if (!ocean) {
            return;
        }
        const rect = ocean.getBoundingClientRect();
        const patrolW = Math.min(280, Math.max(180, rect.width * 0.38));
        const patrolH = Math.min(96, Math.max(64, rect.height * 0.52));
        const x = Math.max(patrolW / 2, Math.min(rect.width - patrolW / 2, event.clientX - rect.left));
        const y = Math.max(patrolH / 2, Math.min(rect.height - patrolH / 2, event.clientY - rect.top));
        const shark: SeaShark = { id: ++this.sharkIdSeq, x, y };
        this.sharks = [...this.sharks, shark].slice(-LoginComponent.MAX_SHARKS);
        const timer = setTimeout(() => this.removeShark(shark.id), LoginComponent.SHARK_LIFETIME_MS);
        this.sharkRemoveTimers.push(timer);
    }

    private removeShark(sharkId: number): void {
        this.sharks = this.sharks.filter(s => s.id !== sharkId);
    }

    private prefersReducedMotion(): boolean {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /**
     * Seagull — right to left across sky with glide bob; wings flap on shoulder pivots.
     */
    private initBeachBirdAnimation(): void {
        const wrap = this.birdWrapRef?.nativeElement;
        const backWing = this.backWingRef?.nativeElement;
        const frontWing = this.frontWingRef?.nativeElement;
        if (!wrap || !backWing || !frontWing) {
            return;
        }

        const startX = window.innerWidth + 80;
        const endX = -280;

        gsap.set(wrap, { x: startX, y: 0, force3D: true });
        gsap.set(backWing, {
            svgOrigin: '1579 189',
            transformOrigin: '1579px 189px',
            rotation: 0,
        });
        gsap.set(frontWing, {
            svgOrigin: '1568 178',
            transformOrigin: '1568px 178px',
            rotation: 0,
        });

        this.sceneTweens.push(
            gsap.fromTo(
                wrap,
                { x: startX },
                {
                    x: endX,
                    duration: 32,
                    ease: 'none',
                    repeat: -1,
                    immediateRender: false,
                },
            ),
        );

        const glide = gsap.timeline({
            repeat: -1,
            defaults: { ease: 'sine.inOut' },
        });
        glide
            .to(wrap, { y: -12, duration: 2.2 })
            .to(wrap, { y: -28, duration: 2.0 })
            .to(wrap, { y: -16, duration: 2.4 })
            .to(wrap, { y: -32, duration: 2.1 })
            .to(wrap, { y: -8, duration: 2.3 })
            .to(wrap, { y: 0, duration: 2.6 });
        this.sceneTweens.push(glide);

        this.sceneTweens.push(
            gsap.to(backWing, {
                rotation: 24,
                duration: 0.75,
                yoyo: true,
                repeat: -1,
                ease: 'sine.inOut',
            }),
            gsap.to(frontWing, {
                rotation: -20,
                duration: 0.75,
                yoyo: true,
                repeat: -1,
                ease: 'sine.inOut',
                delay: 0.38,
            }),
        );
    }

    /** Slow left-to-right passage with compound swell, roll, sail sway, and wake. */
    private initSailboatAnimation(): void {
        const wrap = this.sailboatWrapRef?.nativeElement;
        const rig = this.sailboatRigRef?.nativeElement;
        const wake = this.sailboatWakeRef?.nativeElement;
        if (!wrap) {
            return;
        }

        const travel = window.innerWidth * 1.16;

        gsap.set(wrap, {
            x: 0,
            y: 0,
            rotation: 0,
            force3D: true,
            transformOrigin: '50% 82%',
        });

        this.sceneTweens.push(
            gsap.to(wrap, {
                x: travel,
                duration: 58,
                ease: 'none',
                repeat: -1,
            }),
        );

        const swell = gsap.timeline({
            repeat: -1,
            defaults: { ease: 'sine.inOut' },
        });
        swell
            .to(wrap, { y: -5, rotation: 1.8, duration: 2.4 })
            .to(wrap, { y: -9, rotation: 2.8, duration: 2.0 })
            .to(wrap, { y: -6, rotation: -1.2, duration: 2.3 })
            .to(wrap, { y: -10, rotation: 1.4, duration: 2.6 })
            .to(wrap, { y: -3, rotation: -0.8, duration: 2.1 })
            .to(wrap, { y: 0, rotation: 0, duration: 2.8 });
        this.sceneTweens.push(swell);

        if (rig) {
            gsap.set(rig, {
                svgOrigin: '80 70',
                transformOrigin: '80px 70px',
            });
            this.sceneTweens.push(
                gsap.to(rig, {
                    rotation: 3.5,
                    duration: 5.2,
                    yoyo: true,
                    repeat: -1,
                    ease: 'sine.inOut',
                }),
            );
        }

        if (wake) {
            gsap.set(wake, { transformOrigin: '80px 90px', svgOrigin: '80 90' });
            this.sceneTweens.push(
                gsap.to(wake, {
                    scaleX: 1.2,
                    scaleY: 0.85,
                    opacity: 0.38,
                    duration: 2.6,
                    yoyo: true,
                    repeat: -1,
                    ease: 'sine.inOut',
                }),
            );
        }
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
        this.labelsGathered = true;

        const icrUser = localStorage.getItem('ICRUser')!;

        this._userService.getInfo(icrUser).subscribe({
            next: () => {
                this.userInfoGathered = true;
                this._userService.getEnvironment(icrUser).subscribe({
                    next: () => {
                        console.log('Environment data gathered', this._userService.userInfo);
                        this.environmentGathered = true;
                        // Menu LIBQUERY needs DATABASE_SID / LANGUAGE from userInfo (set in getEnvironment)
                        this._menuAccess.load(icrUser).subscribe({
                            next: () => this.completeLogin(),
                            error: () => this.completeLogin(),
                        });
                    },
                    error: () => {
                        this.environmentGathered = true;
                        this.completeLogin();
                    },
                });
            },
        });
    }

    private completeLogin(): void {
        localStorage.setItem('isLoggedin', 'true');
        this.router.navigate(['/dashboard']);
        this._structureService.getStructure();
        this._structureService.getNetwork();
    }

    showHideVersion(): void {
        this.showVersion = !this.showVersion;
    }
}
