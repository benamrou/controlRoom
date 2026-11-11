/**
 * Wavy rising ghosts inspired by https://codepen.io/ste-vg/pen/gwyGpm
 * Pure canvas + rAF — no Snap.svg / GSAP.
 * Ghosts float up along a sine guide with a scalloped skirt body.
 */

interface GhostGuidePoint {
    x: number;
    y: number;
}

interface GhostInstance {
    id: number;
    guide: GhostGuidePoint[];
    /** Progress along guide (0 → guide.length). */
    progress: number;
    /** Drawn body height in px (grows as ghost rises). */
    height: number;
    endHeight: number;
    startThickness: number;
    endThickness: number;
    durationMs: number;
    bornAt: number;
    opacity: number;
    /** Prefer left or right third so the login card stays clear. */
    side: 'left' | 'right';
}

export class HalloweenGhostRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private ghosts: GhostInstance[] = [];
    private raf = 0;
    private running = false;
    private lastTs = 0;
    private spawnAcc = 0;
    private nextSpawnMs = 1800;
    private dpr = 1;
    private cssW = 0;
    private cssH = 0;
    private idSeq = 0;
    private night = false;
    private reducedMotion = false;
    private resizeObs?: ResizeObserver;

    private static readonly MAX_GHOSTS = 5;
    private static readonly BODY_FILL = 'rgba(238, 238, 238, 0.78)';
    private static readonly FACE_FILL = 'rgba(17, 17, 17, 0.88)';
    private static readonly BODY_FILL_NIGHT = 'rgba(245, 240, 255, 0.72)';

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('2d context unavailable');
        }
        this.ctx = ctx;
    }

    start(opts: { reducedMotion?: boolean; night?: boolean } = {}): void {
        this.reducedMotion = !!opts.reducedMotion;
        this.night = !!opts.night;
        this.resize();
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObs = new ResizeObserver(() => this.resize());
            this.resizeObs.observe(this.canvas.parentElement || this.canvas);
        }
        if (this.reducedMotion) {
            this.paintStaticPreview();
            return;
        }
        this.running = true;
        this.lastTs = performance.now();
        this.spawnAcc = 0;
        this.nextSpawnMs = 600;
        this.raf = requestAnimationFrame((t) => this.tick(t));
    }

    setNight(night: boolean): void {
        this.night = night;
        if (this.reducedMotion) {
            this.paintStaticPreview();
        }
    }

    setPaused(paused: boolean): void {
        if (this.reducedMotion) {
            return;
        }
        if (paused) {
            this.running = false;
            cancelAnimationFrame(this.raf);
        } else if (!this.running) {
            this.running = true;
            this.lastTs = performance.now();
            this.raf = requestAnimationFrame((t) => this.tick(t));
        }
    }

    /** Burst of ghosts for night scare event. */
    scareBurst(): void {
        if (this.reducedMotion || !this.running) {
            return;
        }
        const n = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < n; i++) {
            if (this.ghosts.length >= HalloweenGhostRenderer.MAX_GHOSTS) {
                break;
            }
            this.spawnGhost(true);
        }
    }

    destroy(): void {
        this.running = false;
        cancelAnimationFrame(this.raf);
        this.resizeObs?.disconnect();
        this.ghosts = [];
        this.ctx.clearRect(0, 0, this.cssW, this.cssH);
    }

    private resize(): void {
        const parent = this.canvas.parentElement;
        this.cssW = parent?.clientWidth || window.innerWidth;
        this.cssH = parent?.clientHeight || window.innerHeight;
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = Math.floor(this.cssW * this.dpr);
        this.canvas.height = Math.floor(this.cssH * this.dpr);
        this.canvas.style.width = `${this.cssW}px`;
        this.canvas.style.height = `${this.cssH}px`;
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        if (this.reducedMotion) {
            this.paintStaticPreview();
        }
    }

    private tick(now: number): void {
        if (!this.running) {
            return;
        }
        const dt = Math.min(48, now - this.lastTs);
        this.lastTs = now;

        this.spawnAcc += dt;
        if (this.spawnAcc >= this.nextSpawnMs && this.ghosts.length < HalloweenGhostRenderer.MAX_GHOSTS) {
            this.spawnAcc = 0;
            this.nextSpawnMs = this.night
                ? 1600 + Math.random() * 2200
                : 2400 + Math.random() * 2800;
            this.spawnGhost(false);
        }

        for (const g of this.ghosts) {
            const t = Math.min(1, (now - g.bornAt) / g.durationMs);
            // Ease similar to SlowMo: slow middle float
            const eased = this.slowMo(t);
            g.progress = eased * (g.guide.length - 1);
            g.height = g.endHeight * Math.min(1, eased * 1.35);
            g.opacity = t < 0.08 ? t / 0.08 : t > 0.85 ? (1 - t) / 0.15 : 1;
        }
        this.ghosts = this.ghosts.filter((g) => (now - g.bornAt) < g.durationMs);

        this.draw();
        this.raf = requestAnimationFrame((t) => this.tick(t));
    }

    /** Approximate GSAP SlowMo — linger in the middle of the rise. */
    private slowMo(t: number): number {
        const linear = t;
        const sine = 0.5 - 0.5 * Math.cos(Math.PI * t);
        return linear * 0.35 + sine * 0.65;
    }

    private spawnGhost(burst: boolean): void {
        const side: 'left' | 'right' = Math.random() > 0.5 ? 'left' : 'right';
        // Keep clear of the centered login card (~middle 36% of width)
        const startX = side === 'left'
            ? this.cssW * (0.06 + Math.random() * 0.18)
            : this.cssW * (0.76 + Math.random() * 0.18);
        const endX = startX + (Math.random() - 0.5) * this.cssW * 0.18;
        const startY = this.cssH * (0.88 + Math.random() * 0.08);
        const endY = this.cssH * (0.08 + Math.random() * 0.22);

        const frequency = 0.012 + Math.random() * 0.012;
        const amplitude = 18 + Math.random() * 36;
        const guidePosition = Math.random() * 1000;
        const guide = this.buildGuide(startX, startY, endX, endY, frequency, amplitude, guidePosition);

        this.ghosts.push({
            id: ++this.idSeq,
            guide,
            progress: 0,
            height: 0,
            endHeight: (burst ? 90 : 70) + Math.round(Math.random() * (burst ? 50 : 40)),
            startThickness: 0,
            endThickness: 70 + Math.round(Math.random() * 45),
            durationMs: (burst ? 3200 : 4800) + Math.random() * 2200,
            bornAt: performance.now(),
            opacity: 0,
            side,
        });
    }

    private buildGuide(
        x0: number, y0: number, x1: number, y1: number,
        frequency: number, amplitude: number, guidePosition: number,
    ): GhostGuidePoint[] {
        const guide: GhostGuidePoint[] = [];
        const height = y0 - y1;
        if (height <= 1) {
            return [{ x: x0, y: y0 }, { x: x1, y: y1 }];
        }
        const widthChange = x0 - x1;
        for (let y = Math.round(y0); y >= Math.round(y1); y--) {
            const along = (y0 - y) / height;
            const x = x0 - widthChange * along;
            const wave = Math.sin(y * frequency + guidePosition);
            guide.push({
                y,
                x: x + (wave * amplitude / 2 + amplitude / 2) * (along > 0.05 ? 1 : along / 0.05),
            });
        }
        return guide;
    }

    private getPointAlongGuide(g: GhostInstance, yIndex: number, offsetXPct: number): { x: number; y: number } {
        const guide = g.guide;
        if (!guide.length) {
            return { x: 0, y: 0 };
        }
        let yi = Math.round(yIndex);
        if (yi >= guide.length) { yi = guide.length - 1; }
        if (yi < 0) { yi = 0; }

        const thicknessDiff = g.endThickness - g.startThickness;
        const pct = (yi / Math.max(1, guide.length - 1)) * 100;
        const thickness = g.startThickness + (thicknessDiff / 100) * pct;
        const xOffset = ((thickness / 2) / 100) * offsetXPct;
        return { x: guide[yi].x + xOffset, y: guide[yi].y };
    }

    private draw(): void {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.cssW, this.cssH);
        const bodyFill = this.night
            ? HalloweenGhostRenderer.BODY_FILL_NIGHT
            : HalloweenGhostRenderer.BODY_FILL;

        for (const g of this.ghosts) {
            if (g.height < 4 || g.opacity <= 0.02) {
                continue;
            }
            this.drawGhost(g, bodyFill);
        }
    }

    private drawGhost(g: GhostInstance, bodyFill: string): void {
        const ctx = this.ctx;
        const y = Math.round(g.progress);
        const height = Math.round(g.height);
        const hc = height / 6;

        // Body path — same topology as ste-vg (head at progress tip, scalloped skirt trailing down)
        const topSkirt = [
            85, y - hc * 3,
            90, y - hc * 4,
            95, y - hc * 5,
            100, y - hc * 6,
            75, y - hc * 5,
            50, y - hc * 6,
            25, y - hc * 5,
            0, y - hc * 6,
            -25, y - hc * 5,
            -50, y - hc * 6,
            -75, y - hc * 5,
            -100, y - hc * 6,
            -95, y - hc * 5,
            -90, y - hc * 4,
            -85, y - hc * 3,
            -80, y - hc * 2,
        ];

        ctx.save();
        ctx.globalAlpha = g.opacity * (this.night ? 0.92 : 0.82);
        ctx.beginPath();

        const p0 = this.getPointAlongGuide(g, y, 10);
        ctx.moveTo(p0.x, p0.y);

        const qCtrl = this.getPointAlongGuide(g, y, 75);
        const qEnd = this.getPointAlongGuide(g, y - hc * 2, 80);
        ctx.quadraticCurveTo(qCtrl.x, qCtrl.y, qEnd.x, qEnd.y);

        for (let i = 0; i < topSkirt.length; i += 2) {
            const pt = this.getPointAlongGuide(g, topSkirt[i + 1], topSkirt[i]);
            ctx.lineTo(pt.x, pt.y);
        }

        const qCtrl2 = this.getPointAlongGuide(g, y, -75);
        ctx.quadraticCurveTo(qCtrl2.x, qCtrl2.y, p0.x, p0.y);
        ctx.closePath();

        ctx.fillStyle = bodyFill;
        ctx.shadowColor = this.night ? 'rgba(255, 240, 201, 0.35)' : 'rgba(255, 255, 255, 0.25)';
        ctx.shadowBlur = this.night ? 16 : 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Eyes + mouth
        ctx.fillStyle = HalloweenGhostRenderer.FACE_FILL;
        this.fillOvalAlong(g, -40, y - hc * 2.5, 9, 7);
        this.fillOvalAlong(g, 40, y - hc * 2.5, 9, 7);
        this.fillOvalAlong(g, 0, y - hc * 3.7, 14, 9);

        ctx.restore();
    }

    private fillOvalAlong(g: GhostInstance, offsetXPct: number, yIndex: number, rx: number, ry: number): void {
        const p = this.getPointAlongGuide(g, yIndex, offsetXPct);
        this.ctx.beginPath();
        this.ctx.ellipse(p.x, p.y, rx * (g.endThickness / 140), ry * (g.endHeight / 120), 0, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /** Two faint parked ghosts when motion is reduced. */
    private paintStaticPreview(): void {
        this.ctx.clearRect(0, 0, this.cssW, this.cssH);
        this.ghosts = [];
        const sideXs = [this.cssW * 0.14, this.cssW * 0.84];
        for (const x of sideXs) {
            const y = this.cssH * 0.55;
            const h = 56;
            this.ctx.save();
            this.ctx.globalAlpha = 0.4;
            this.ctx.fillStyle = HalloweenGhostRenderer.BODY_FILL;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.quadraticCurveTo(x + 28, y - 10, x + 22, y - h * 0.35);
            this.ctx.lineTo(x + 18, y - h * 0.55);
            this.ctx.lineTo(x + 8, y - h * 0.7);
            this.ctx.lineTo(x, y - h * 0.55);
            this.ctx.lineTo(x - 8, y - h * 0.7);
            this.ctx.lineTo(x - 18, y - h * 0.55);
            this.ctx.lineTo(x - 22, y - h * 0.35);
            this.ctx.quadraticCurveTo(x - 28, y - 10, x, y);
            this.ctx.fill();
            this.ctx.fillStyle = HalloweenGhostRenderer.FACE_FILL;
            this.ctx.beginPath();
            this.ctx.ellipse(x - 7, y - h * 0.38, 3, 3.5, 0, 0, Math.PI * 2);
            this.ctx.ellipse(x + 7, y - h * 0.38, 3, 3.5, 0, 0, Math.PI * 2);
            this.ctx.ellipse(x, y - h * 0.28, 5, 3.5, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }
}
