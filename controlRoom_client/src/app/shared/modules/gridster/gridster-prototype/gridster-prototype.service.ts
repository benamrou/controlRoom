import { Injectable } from '@angular/core';
import { filter, Observable, tap, map, merge, scan, share, switchMap, takeUntil } from 'rxjs';
import { Subject } from 'rxjs';

import { GridsterService } from '../gridster.service';
import { GridsterItemPrototypeDirective } from './gridster-item-prototype.directive';
import { utils } from '../utils/utils';
import {DraggableEvent} from '../utils/DraggableEvent';

@Injectable()
export class GridsterPrototypeService {

    private isDragging = false;

    private dragSubject = new Subject<any>();

    private dragStartSubject = new Subject<any>();

    private dragStopSubject = new Subject<any>();

    constructor() {}

    observeDropOver (gridster: GridsterService) {
        return this.dragStopSubject.asObservable()
            .pipe(filter((data) => this.isOverGridster(data.item, gridster, data.event)))
            .pipe(tap((data) => {
                // TODO: what we should provide as a param?
                // prototype.drop.emit({item: prototype.item});
                data.item.onDrop(gridster);
            }));
    }

    observeDropOut (gridster: GridsterService) {
        return this.dragStopSubject.asObservable()
            .pipe(filter((data) => !this.isOverGridster(data.item, gridster, data.event)))
            .pipe(tap((data) => {
                // TODO: what we should provide as a param?
                data.item.onCancel();
            }));
    }

    observeDragOver(gridster: GridsterService): {
        dragOver: Observable<GridsterItemPrototypeDirective>,
        dragEnter: Observable<GridsterItemPrototypeDirective>,
        dragOut: Observable<GridsterItemPrototypeDirective>
    } {
        const over = this.dragSubject.asObservable()
            .pipe(map((data) => ({
                item: data.item,
                event: data.event,
                isOver: this.isOverGridster(data.item, gridster, data.event),
                isDrop: false
            })));

        const drop = this.dragStopSubject.asObservable()
            .pipe(map((data) => ({
                item: data.item,
                event: data.event,
                isOver: this.isOverGridster(data.item, gridster, data.event),
                isDrop: true
            })));

        const dragExt = merge(
                // dragStartSubject is connected in case when item prototype is placed above gridster
                // and drag enter is not fired
                this.dragStartSubject.pipe(map(() => ({ item: null, isOver: false, isDrop: false }))),
                over,
                drop
            )
            .pipe(scan((prev: any, next: any) => {

                return {
                    item: next.item,
                    event: next.event,
                    isOver: next.isOver,
                    isEnter: prev.isOver === false && next.isOver === true,
                    isOut: prev.isOver === true && next.isOver === false && !prev.isDrop,
                    isDrop: next.isDrop
                };
            }))
            .pipe(filter((data: any) => {
                return !data.isDrop;
            })).pipe(share());

        const dragEnter = this.createDragEnterObservable(dragExt, gridster);
        const dragOut = this.createDragOutObservable(dragExt, gridster);
        const dragOver = dragEnter.pipe(switchMap(() => {
                return this.dragSubject.asObservable()
                    .pipe(takeUntil(dragOut));
            }))
            .pipe(map(data => data.item));

        return { dragEnter, dragOut, dragOver };
    }

    dragItemStart(item: GridsterItemPrototypeDirective, event: DraggableEvent) {
        this.isDragging = true;
        this.dragStartSubject.next({ item, event });
    }

    dragItemStop(item: GridsterItemPrototypeDirective, event: DraggableEvent) {
        this.isDragging = false;
        this.dragStopSubject.next({ item, event });
    }

    updatePrototypePosition(item: GridsterItemPrototypeDirective, event: DraggableEvent) {
        this.dragSubject.next({ item, event });
    }

    /**
     * Creates observable that is fired on dragging over gridster container.
     * @param dragIsOver Observable that returns information true/false whether prototype item
     * is over gridster container
     * @returns {Observable}
     */
    private createDragOverObservable (
        dragIsOver: Observable<{item: GridsterItemPrototypeDirective, isOver: boolean}>,
        gridster: GridsterService
    ) {
        return dragIsOver
            .pipe(filter((data: any) => {
                return data.isOver && !data.isEnter && !data.isOut;
            }))
            .pipe(map((data: any): GridsterItemPrototypeDirective => {
                return data.item;
            }))
            .pipe(tap((item) => {
                item.onOver(gridster);
            }));
    }
    /**
     * Creates observable that is fired on drag enter gridster container.
     * @param dragIsOver Observable that returns information true/false whether prototype item
     * is over gridster container
     * @returns {Observable}
     */
    private createDragEnterObservable (
        dragIsOver: Observable<{item: GridsterItemPrototypeDirective, isOver: boolean}>,
        gridster: GridsterService
    ) {
        return dragIsOver
            .pipe(filter((data: any) => {
                return data.isEnter;
            }))
            .pipe(map((data: any): GridsterItemPrototypeDirective => {
                return data.item;
            }))
            .pipe(tap((item) => {
                item.onEnter(gridster);
            }));
    }
    /**
     * Creates observable that is fired on drag out gridster container.
     * @param dragIsOver Observable that returns information true/false whether prototype item
     * is over gridster container
     * @returns {Observable}
     */
    private createDragOutObservable (
        dragIsOver: Observable<{item: GridsterItemPrototypeDirective,
        isOver: boolean}>,
        gridster: GridsterService
    ) {
        return dragIsOver
            .pipe(filter((data: any) => {
                return data.isOut;
            }))
            .pipe(map((data: any): GridsterItemPrototypeDirective => {
                return data.item;
            }))
            .pipe(tap((item) => {
                item.onOut(gridster);
            }));
    }

    /**
     * Checks whether "element" position fits inside "containerEl" position.
     * It checks if "element" is totally covered by "containerEl" area.
     * @param element Dragged element
     * @param containerEl Element above which "element" is dragged
     * @param event DraggableEvent
     * @returns {boolean}
     */
    private isOverGridster(item: GridsterItemPrototypeDirective, gridster: GridsterService, event): boolean {
        const el = item.$element;
        const elContainer = gridster.gridsterComponent.$element;
        const tolerance = gridster.options.tolerance;

        switch (tolerance) {
            case 'fit':
                return utils.isElementFitContainer(el, elContainer);
            case 'intersect':
                return utils.isElementIntersectContainer(el, elContainer);
            case 'touch':
                return utils.isElementTouchContainer(el, elContainer);
            default:
                return utils.isCursorAboveElement(event, elContainer);
        }
    }
}
