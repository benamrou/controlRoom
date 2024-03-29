import {
    Component, OnInit, AfterContentInit, OnDestroy, ElementRef, ViewChild, NgZone,
    Input, Output, EventEmitter, ChangeDetectionStrategy, HostBinding
} from '@angular/core';
import { connect, ConnectableObservable, debounceTime, filter, interval, multicast, publish, tap } from 'rxjs';
import { Subscription } from 'rxjs';
import { fromEvent } from "rxjs";
import { utils } from './utils/utils';
import { GridsterService } from './gridster.service';
import { IGridsterOptions } from './IGridsterOptions';
import { IGridsterDraggableOptions } from './IGridsterDraggableOptions';
import { GridsterPrototypeService } from './gridster-prototype/gridster-prototype.service';
import { GridsterItemPrototypeDirective } from './gridster-prototype/gridster-item-prototype.directive';
import { GridListItem } from './gridList/GridListItem';
import { GridsterOptions } from './GridsterOptions';


@Component({
    selector: 'gridster',
    template: `<div class="gridster-container">
      <ng-content></ng-content>
      <div class="position-highlight" style="display:none;" #positionHighlight>
        <div class="inner"></div>
      </div>
    </div>`,
    styles: [`
    :host {
        position: relative;
        display: block;
        left: 0;
        width: 100%;
    }

    :host.gridster--dragging {
        -moz-user-select: none;
        -khtml-user-select: none;
        -webkit-user-select: none;
        -ms-user-select: none;
        user-select: none;
    }

    .gridster-container {
        position: relative;
        width: 100%;
        list-style: none;
        -webkit-transition: width 0.2s, height 0.2s;
        transition: width 0.2s, height 0.2s;
    }

    .position-highlight {
        display: block;
        position: absolute;
        z-index: 1;
    }
    `],
    providers: [GridsterService],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GridsterComponent implements OnInit, AfterContentInit, OnDestroy {
    @Input() options: IGridsterOptions;
    @Output() optionsChange = new EventEmitter<any>();
    @Output() ready = new EventEmitter<any>();
    @Output() reflow = new EventEmitter<any>();
    @Input() draggableOptions: IGridsterDraggableOptions;
    @ViewChild('positionHighlight', {static: true}) $positionHighlight;

    @HostBinding('class.gridster--dragging') isDragging = false;
    @HostBinding('class.gridster--resizing') isResizing = false;
    @HostBinding('class.gridster--ready') isReady = false;

    gridster: GridsterService;
    $element: HTMLElement;


    gridsterOptions: GridsterOptions;
    private subscription = new Subscription();

    constructor(private zone: NgZone,
                elementRef: ElementRef, gridster: GridsterService,
                private gridsterPrototype: GridsterPrototypeService) {

        this.gridster = gridster;
        this.$element = elementRef.nativeElement;
    }

    ngOnInit() {
        this.gridsterOptions = new GridsterOptions(this.options);

        if (this.options.useCSSTransforms) {
            this.$element.classList.add('css-transform');
        }

        const changeSub = this.gridsterOptions.change
            .pipe(tap((options) => {
                this.gridster.options = options;
                if (this.gridster.gridList) {
                    this.gridster.gridList.options = options;
                }
            }))
            .pipe(tap((options) => {
                this.optionsChange.emit(options);
            }))
            .subscribe();
        this.subscription.add(changeSub);

        this.gridster.init(this.gridster.options, this.draggableOptions, this);

        const resizeSub = fromEvent(window, 'resize')
            .pipe(debounceTime(this.gridster.options.responsiveDebounce || 0))
            .pipe(filter(() => this.gridster.options.responsiveView))
            .subscribe(() => {
                this.reload();
            });
        this.subscription.add(resizeSub);

        this.zone.runOutsideAngular(() => {
            //const scrollSub = fromEvent(document, 'scroll', true)
            const scrollSub = fromEvent(document, 'scroll')
                .subscribe(() => this.updateGridsterElementData());
            this.subscription.add(scrollSub);
        });
    }

    ngAfterContentInit() {
        this.gridster.start();

        this.updateGridsterElementData();

        this.connectGridsterPrototype();

        this.gridster.$positionHighlight = this.$positionHighlight.nativeElement;
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    /**
     * Change gridster config option and rebuild
     * @param {string} name
     * @param {any} value
     * @return {GridsterComponent}
     */
    setOption(name: string, value: any) {
        if (name === 'dragAndDrop') {
            if (value) {
                this.enableDraggable();
            } else {
                this.disableDraggable();
            }
        }
        if (name === 'resizable') {
            if (value) {
                this.enableResizable();
            } else {
                this.disableResizable();
            }
        }
        if (name === 'lanes') {
            this.gridster.options.lanes = value;

            this.gridster.gridList.fixItemsPositions(this.gridster.options);
            this.reflowGridster();
        }
        if (name === 'direction') {
            this.gridster.options.direction = value;
            this.gridster.gridList.pullItemsToLeft();
        }
        if (name === 'widthHeightRatio') {
            this.gridster.options.widthHeightRatio = parseFloat(value || 1);
        }
        if (name === 'responsiveView') {
            this.gridster.options.responsiveView = !!value;
        }
        this.gridster.gridList.setOption(name, value);

        return this;
    }

    reload() {
        setTimeout(() => {
            this.gridster.fixItemsPositions();
            this.reflowGridster();
        });

        return this;
    }

    reflowGridster(isInit = false) {
        this.gridster.reflow();
        this.reflow.emit({
            isInit: isInit,
            gridsterComponent: this
        });
    }

    updateGridsterElementData() {
        this.gridster.gridsterScrollData = this.getScrollPositionFromParents(this.$element);
        this.gridster.gridsterRect = this.$element.getBoundingClientRect();
    }

    setReady() {
        setTimeout(() => this.isReady = true);
        this.ready.emit();
    }

    adjustItemsHeightToContent(scrollableItemElementSelector: string = '.gridster-item-inner') {
        this.gridster.items
            // convert each item to object with information about content height and scroll height
            .map((item: GridListItem) => {
                const scrollEl = item.$element.querySelector(scrollableItemElementSelector);
                const contentEl = scrollEl.lastElementChild;
                const scrollElDistance = utils.getRelativeCoordinates(scrollEl, item.$element);
                const scrollElRect = scrollEl.getBoundingClientRect();
                const contentRect = contentEl.getBoundingClientRect();

                return {
                    item,
                    contentHeight: contentRect.bottom - scrollElRect.top,
                    scrollElDistance
                };
            })
            // calculate required height in lanes amount and update item "h"
            .forEach((data) => {
                data.item.h = Math.ceil(
                    <any>((data.contentHeight) / (this.gridster.cellHeight - data.scrollElDistance.top))
                );
            });

        this.gridster.fixItemsPositions();
        this.gridster.reflow();
    }

    private getScrollPositionFromParents(element: Element, data = { scrollTop: 0, scrollLeft: 0 })
        : { scrollTop: number, scrollLeft: number } {

        if (element.parentElement && element.parentElement !== document.body) {
            data.scrollTop += element.parentElement.scrollTop;
            data.scrollLeft += element.parentElement.scrollLeft;

            return this.getScrollPositionFromParents(element.parentElement, data);
        }

        return {
            scrollTop: data.scrollTop,
            scrollLeft: data.scrollLeft
        };
    }

    /**
     * Connect gridster prototype item to gridster dragging hooks (onStart, onDrag, onStop).
     */
    private connectGridsterPrototype() {
        let isEntered = false;

        this.gridsterPrototype.observeDropOut(this.gridster)
            .subscribe();

        const dropOverObservable = this.gridsterPrototype.observeDropOver(this.gridster)
            .pipe(publish());

        const dragObservable = this.gridsterPrototype.observeDragOver(this.gridster);

        dragObservable.dragOver
            .subscribe((prototype: GridsterItemPrototypeDirective) => {
                if (!isEntered) {
                    return;
                }
                this.gridster.onDrag(prototype.item);
            });

        dragObservable.dragEnter
            .subscribe((prototype: GridsterItemPrototypeDirective) => {
                isEntered = true;

                this.gridster.items.push(prototype.item);
                this.gridster.onStart(prototype.item);
            });

        dragObservable.dragOut
            .subscribe((prototype: GridsterItemPrototypeDirective) => {
                if (!isEntered) {
                    return;
                }
                this.gridster.onDragOut(prototype.item);
                isEntered = false;
            });

        dropOverObservable
            .subscribe((data) => {
                if (!isEntered) {
                    return;
                }
                this.gridster.onStop(data.item.item);

                this.gridster.removeItem(data.item.item);

                isEntered = false;
            });

        //dropOverObservable.pipe(connect());
        (dropOverObservable as ConnectableObservable<number>).connect();
    }

    private enableDraggable() {
        this.gridster.options.dragAndDrop = true;

        this.gridster.items
            .filter(item => item.itemComponent && item.itemComponent.dragAndDrop)
            .forEach((item: GridListItem) => item.itemComponent.enableDragDrop());
    }

    private disableDraggable() {
        this.gridster.options.dragAndDrop = false;

        this.gridster.items
            .filter(item => item.itemComponent)
            .forEach((item: GridListItem) => item.itemComponent.disableDraggable());
    }

    private enableResizable() {
        this.gridster.options.resizable = true;

        this.gridster.items
            .filter(item => item.itemComponent && item.itemComponent.resizable)
            .forEach((item: GridListItem) => item.itemComponent.enableResizable());
    }

    private disableResizable() {
        this.gridster.options.resizable = false;

        this.gridster.items.forEach((item: GridListItem) => item.itemComponent.disableResizable());
    }
}
