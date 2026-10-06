import { animate, query, style, transition, trigger } from '@angular/animations';

/** Default page enter — soft fall leaf-gust feel (~600ms). */
export function routerTransition() {
    return leafGust();
}

export function leafGust() {
    return trigger('routerTransition', [
        transition(':enter', [
            style({
                opacity: 0,
                transform: 'translateX(-18px) scale(0.992)',
                filter: 'blur(1px)',
            }),
            animate(
                '620ms cubic-bezier(0.22, 1, 0.36, 1)',
                style({
                    opacity: 1,
                    transform: 'translateX(0) scale(1)',
                    filter: 'blur(0)',
                }),
            ),
        ]),
        transition(':leave', [
            animate(
                '420ms ease-out',
                style({
                    opacity: 0,
                    transform: 'translateX(28px)',
                }),
            ),
        ]),
    ]);
}

export function slideToRight() {
    return leafGust();
}

export function slideToLeft() {
    return leafGust();
}

export function slideToBottom() {
    return leafGust();
}

export function slideToTop() {
    return leafGust();
}

/** Optional route container helper (unused by default). */
export function fallRouteFade() {
    return trigger('fallRouteFade', [
        transition('* <=> *', [
            query(
                ':enter',
                [
                    style({ opacity: 0 }),
                    animate('600ms ease-out', style({ opacity: 1 })),
                ],
                { optional: true },
            ),
        ]),
    ]);
}
