/**
 * Briolet-style autumn forest - recursive branching + pointillist foliage.
 * Inspired by https://codepen.io/FredericBriolet/pen/PbwNgY
 */

interface BranchSeg {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    w: number;
}

interface FoliageDot {
    x: number;
    y: number;
    r: number;
    color: string;
}

interface FallingDot {
    x: number;
    y: number;
    r: number;
    color: string;
    vx: number;
    vy: number;
    rot: number;
    vr: number;
    life: number;
    maxLife: number;
    falling: boolean;
}

interface TreeSpec {
    xRatio: number;
    trunkLen: number;
    depth: number;
    spread: number;
    branchScale: number;
    lean: number;
    trunkWidth: number;
    leafColors: string[];
    leafMin: number;
    leafMax: number;
    density: number;
    seed: number;
}

const BRANCH = '#2b2118';

const TREE_SPECS: TreeSpec[] = [
    {
        xRatio: 0.03, trunkLen: 68, depth: 10, spread: 0.48, branchScale: 0.72, lean: -0.08,
        trunkWidth: 5.8, leafColors: ['#8B5E5A', '#A66B5B', '#C47A5A'], leafMin: 1.2, leafMax: 2.6, density: 1.05, seed: 11,
    },
    {
        xRatio: 0.09, trunkLen: 102, depth: 11, spread: 0.52, branchScale: 0.73, lean: 0.05,
        trunkWidth: 8.0, leafColors: ['#E07B39', '#C45C26', '#B85C38'], leafMin: 1.4, leafMax: 3.2, density: 1.2, seed: 29,
    },
    {
        xRatio: 0.16, trunkLen: 88, depth: 10, spread: 0.5, branchScale: 0.73, lean: -0.14,
        trunkWidth: 6.8, leafColors: ['#F2A65A', '#E8B84A', '#E07B39'], leafMin: 1.3, leafMax: 2.9, density: 1.1, seed: 47,
    },
    {
        xRatio: 0.23, trunkLen: 76, depth: 9, spread: 0.46, branchScale: 0.72, lean: 0.1,
        trunkWidth: 6.0, leafColors: ['#C45C26', '#E07B39', '#A66B5B'], leafMin: 1.2, leafMax: 2.7, density: 0.95, seed: 53,
    },
    {
        xRatio: 0.29, trunkLen: 58, depth: 8, spread: 0.44, branchScale: 0.71, lean: -0.06,
        trunkWidth: 4.8, leafColors: ['#B85C38', '#C9A66B', '#E8B84A'], leafMin: 1.0, leafMax: 2.3, density: 0.85, seed: 59,
    },
    {
        xRatio: 0.71, trunkLen: 62, depth: 8, spread: 0.45, branchScale: 0.71, lean: 0.07,
        trunkWidth: 5.0, leafColors: ['#E8B84A', '#D4A017', '#C9A66B'], leafMin: 1.0, leafMax: 2.4, density: 0.88, seed: 61,
    },
    {
        xRatio: 0.77, trunkLen: 94, depth: 10, spread: 0.5, branchScale: 0.73, lean: 0.12,
        trunkWidth: 7.4, leafColors: ['#E8B84A', '#F2A65A', '#D4A017'], leafMin: 1.3, leafMax: 3.0, density: 1.15, seed: 67,
    },
    {
        xRatio: 0.85, trunkLen: 120, depth: 12, spread: 0.56, branchScale: 0.74, lean: -0.04,
        trunkWidth: 9.2, leafColors: ['#E07B39', '#F2994A', '#C45C26', '#E8B84A'], leafMin: 1.5, leafMax: 3.4, density: 1.3, seed: 83,
    },
    {
        xRatio: 0.92, trunkLen: 86, depth: 10, spread: 0.48, branchScale: 0.72, lean: 0.09,
        trunkWidth: 6.4, leafColors: ['#C9A66B', '#E8B84A', '#F2A65A'], leafMin: 1.2, leafMax: 2.7, density: 1.05, seed: 101,
    },
    {
        xRatio: 0.97, trunkLen: 70, depth: 9, spread: 0.46, branchScale: 0.71, lean: -0.1,
        trunkWidth: 5.4, leafColors: ['#A66B5B', '#C45C26', '#E07B39'], leafMin: 1.1, leafMax: 2.5, density: 0.9, seed: 113,
    },
];

/** Deterministic PRNG (mulberry32). */
function makeRng(seed: number): () => number {
    let t = seed >>> 0;
    return () => {
        t += 0x6D2B79F5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
}

export class FallForestRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private branches: BranchSeg[] = [];
    private foliage: FoliageDot[] = [];
    private falling: FallingDot[] = [];
    private staticLayer: HTMLCanvasElement | null = null;
    private raf = 0;
    private running = false;
    private lastTs = 0;
    private spawnAcc = 0;
    private dpr = 1;
    private night = false;
    private reducedMotion = false;
    private resizeObs?: ResizeObserver;
    private cssW = 0;
    private cssH = 0;
    /** Highest foliage tip on the tall right tree - owl landing target. */
    private perchX = 0;
    private perchY = 0;

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
        this.rebuild();
        if (!this.reducedMotion) {
            this.running = true;
            this.lastTs = performance.now();
            this.raf = requestAnimationFrame((t) => this.tick(t));
        }
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObs = new ResizeObserver(() => this.rebuild());
            this.resizeObs.observe(this.canvas.parentElement || this.canvas);
        }
    }

    setNight(night: boolean): void {
        // Night dimming is applied via `.login-page--night .fall-forest-canvas` CSS.
        this.night = night;
    }

    /** Canopy tip of the tall right tree, in % of the scene box. */
    getOwlPerch(): { xPct: number; yPct: number } {
        if (!this.cssW || !this.cssH || !this.perchX) {
            return { xPct: 85, yPct: 24 };
        }
        return {
            xPct: (this.perchX / this.cssW) * 100,
            // Sit just below the tip so feet rest in the top foliage
            yPct: Math.max(10, (this.perchY / this.cssH) * 100 - 0.4),
        };
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

    destroy(): void {
        this.running = false;
        cancelAnimationFrame(this.raf);
        this.resizeObs?.disconnect();
        this.falling = [];
        this.branches = [];
        this.foliage = [];
        this.staticLayer = null;
    }

    private rebuild(): void {
        const parent = this.canvas.parentElement;
        this.cssW = parent?.clientWidth || window.innerWidth;
        this.cssH = parent?.clientHeight || window.innerHeight;
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = Math.floor(this.cssW * this.dpr);
        this.canvas.height = Math.floor(this.cssH * this.dpr);
        this.canvas.style.width = `${this.cssW}px`;
        this.canvas.style.height = `${this.cssH}px`;
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

        this.generateGeometry();
        this.paintStaticLayer();
        this.blit();
    }

    private generateGeometry(): void {
        this.branches = [];
        this.foliage = [];
        this.perchX = this.cssW * 0.85;
        this.perchY = this.cssH * 0.86;
        const groundY = this.cssH * 0.86;
        const scale = Math.min(1.2, Math.max(0.65, this.cssW / 1280));

        for (const spec of TREE_SPECS) {
            const rng = makeRng(spec.seed + Math.floor(this.cssW));
            this.grow(
                this.cssW * spec.xRatio,
                groundY,
                spec.trunkLen * scale,
                -Math.PI / 2 + spec.lean,
                spec.depth,
                spec.spread,
                spec.branchScale,
                spec.trunkWidth * scale,
                spec.leafColors,
                spec.leafMin * scale,
                spec.leafMax * scale,
                spec.density,
                rng,
                Math.abs(spec.xRatio - 0.85) < 0.02,
            );
        }
    }

    private grow(
        x: number,
        y: number,
        len: number,
        angle: number,
        depth: number,
        spread: number,
        branchScale: number,
        width: number,
        leafColors: string[],
        leafMin: number,
        leafMax: number,
        density: number,
        rng: () => number,
        trackPerch: boolean,
    ): void {
        if (depth <= 0 || len < 2.2) {
            this.addCluster(x, y, leafColors, leafMin, leafMax, density, rng, trackPerch);
            return;
        }

        const x2 = x + Math.cos(angle) * len;
        const y2 = y + Math.sin(angle) * len;
        this.branches.push({ x1: x, y1: y, x2, y2, w: Math.max(0.55, width) });

        if (depth > 3 && depth < 8 && rng() > 0.5) {
            const midX = (x + x2) / 2;
            const midY = (y + y2) / 2;
            const twigAngle = angle + (rng() > 0.5 ? 1 : -1) * (0.55 + rng() * 0.55);
            const twigLen = len * (0.26 + rng() * 0.2);
            const tx = midX + Math.cos(twigAngle) * twigLen;
            const ty = midY + Math.sin(twigAngle) * twigLen;
            this.branches.push({ x1: midX, y1: midY, x2: tx, y2: ty, w: Math.max(0.45, width * 0.42) });
            if (depth < 6) {
                this.addCluster(tx, ty, leafColors, leafMin * 0.7, leafMax * 0.7, density * 0.45, rng, trackPerch);
            }
        }

        const nextW = width * 0.68;
        const nextLen = len * branchScale;
        const jitter = (rng() - 0.5) * 0.12;
        this.grow(x2, y2, nextLen, angle - spread + jitter, depth - 1, spread * 0.96, branchScale, nextW, leafColors, leafMin, leafMax, density, rng, trackPerch);
        this.grow(x2, y2, nextLen * (0.9 + rng() * 0.12), angle + spread + jitter * 0.5, depth - 1, spread * 0.96, branchScale, nextW, leafColors, leafMin, leafMax, density, rng, trackPerch);

        if (depth > 6 && rng() > 0.32) {
            this.grow(
                x2, y2, nextLen * 0.76, angle + (rng() - 0.5) * 0.4, depth - 2,
                spread * 0.9, branchScale, nextW * 0.9, leafColors, leafMin, leafMax, density * 0.85, rng, trackPerch,
            );
        }
    }

    private addCluster(
        x: number,
        y: number,
        colors: string[],
        leafMin: number,
        leafMax: number,
        density: number,
        rng: () => number,
        trackPerch: boolean,
    ): void {
        const n = Math.floor((7 + rng() * 12) * density);
        for (let i = 0; i < n; i++) {
            const fx = x + (rng() - 0.5) * 18;
            const fy = y + (rng() - 0.5) * 16;
            this.foliage.push({
                x: fx,
                y: fy,
                r: leafMin + rng() * (leafMax - leafMin),
                color: colors[Math.floor(rng() * colors.length)],
            });
            if (trackPerch && fy < this.perchY) {
                this.perchY = fy;
                this.perchX = fx;
            }
        }
    }

    private paintStaticLayer(): void {
        if (!this.staticLayer) {
            this.staticLayer = document.createElement('canvas');
        }
        this.staticLayer.width = this.canvas.width;
        this.staticLayer.height = this.canvas.height;
        const sctx = this.staticLayer.getContext('2d');
        if (!sctx) {
            return;
        }
        sctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        sctx.clearRect(0, 0, this.cssW, this.cssH);

        sctx.strokeStyle = BRANCH;
        sctx.lineCap = 'round';
        for (const b of this.branches) {
            sctx.beginPath();
            sctx.lineWidth = b.w;
            sctx.moveTo(b.x1, b.y1);
            sctx.lineTo(b.x2, b.y2);
            sctx.stroke();
        }

        for (const d of this.foliage) {
            sctx.beginPath();
            sctx.fillStyle = d.color;
            sctx.globalAlpha = 0.88;
            sctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            sctx.fill();
        }
        sctx.globalAlpha = 1;
    }

    private blit(): void {
        this.ctx.clearRect(0, 0, this.cssW, this.cssH);
        if (this.staticLayer) {
            this.ctx.drawImage(this.staticLayer, 0, 0, this.cssW, this.cssH);
        }
        this.drawFalling();
    }

    private tick(ts: number): void {
        if (!this.running) {
            return;
        }
        const dt = Math.min(0.05, (ts - this.lastTs) / 1000);
        this.lastTs = ts;

        this.spawnAcc += dt;
        while (this.spawnAcc >= 0.07 && this.falling.length < 140) {
            this.spawnAcc -= 0.07;
            this.spawnLeaf();
        }

        for (const leaf of this.falling) {
            leaf.vy += 32 * dt;
            leaf.vx += Math.sin(ts / 380 + leaf.x * 0.012) * 10 * dt;
            leaf.x += leaf.vx * dt;
            leaf.y += leaf.vy * dt;
            leaf.rot += leaf.vr * dt;
            leaf.life += dt;
            if (leaf.y > this.cssH * 0.93 || leaf.life > leaf.maxLife) {
                leaf.falling = false;
            }
        }
        this.falling = this.falling.filter((l) => l.falling);

        this.blit();
        this.raf = requestAnimationFrame((t) => this.tick(t));
    }

    private spawnLeaf(): void {
        if (!this.foliage.length) {
            return;
        }
        const tip = this.foliage[Math.floor(Math.random() * this.foliage.length)];
        this.falling.push({
            x: tip.x,
            y: tip.y,
            r: tip.r * (0.9 + Math.random() * 0.35),
            color: tip.color,
            vx: (Math.random() - 0.5) * 26,
            vy: 8 + Math.random() * 16,
            rot: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 5,
            life: 0,
            maxLife: 4 + Math.random() * 5,
            falling: true,
        });
    }

    private drawFalling(): void {
        for (const leaf of this.falling) {
            const fade = Math.max(0, 1 - leaf.life / leaf.maxLife);
            this.ctx.save();
            this.ctx.translate(leaf.x, leaf.y);
            this.ctx.rotate(leaf.rot);
            this.ctx.globalAlpha = 0.3 + fade * 0.7;
            this.ctx.fillStyle = leaf.color;
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, leaf.r * 1.2, leaf.r * 0.72, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
        this.ctx.globalAlpha = 1;
    }
}
