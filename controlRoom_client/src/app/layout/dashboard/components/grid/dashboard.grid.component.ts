import { Component, OnInit, ViewChild } from '@angular/core';
import { GridsterComponent } from '../../../../shared/modules/gridster/gridster.component';
import { IGridsterOptions } from '../../../../shared/modules//gridster/IGridsterOptions';
import { IGridsterDraggableOptions } from '../../../../shared/modules/gridster/IGridsterDraggableOptions';

@Component({
    selector: 'dashboard-grid',
    templateUrl: './dashboard.grid.component.html',
    styleUrls: ['./dashboard.grid.component.scss']
})
export class DashboardGridComponent implements OnInit {

  @ViewChild(GridsterComponent) gridster: GridsterComponent;
  itemOptions = {
      maxWidth: 10,
      maxHeight: 10
  };
  
  public gridsterOptions: IGridsterOptions = {
    // core configuration is default one - for smallest view. It has hidden minWidth: 0.
    lanes: 2, // amount of lanes (cells) in the grid
    direction: 'vertical', // floating top - vertical, left - horizontal
    floating: true,
    dragAndDrop: true, // enable/disable drag and drop for all items in grid
    resizable: true, // enable/disable resizing by drag and drop for all items in grid
    resizeHandles: {
        s: true,
        e: true,
        se: true
    },
    widthHeightRatio: 1, // proportion between item width and height
    lines: {
      visible: true,
      color: '#afafaf',
      width: 2
    },
    shrink: true,
    useCSSTransforms: true,
    responsiveView: true, // turn on adopting items sizes on window resize and enable responsiveOptions
    responsiveDebounce: 500, // window resize debounce time
    // List of different gridster configurations for different breakpoints.
    // Each breakpoint is defined by name stored in "breakpoint" property. There is fixed set of breakpoints
    // available to use with default minWidth assign to each.
    // - sm: 576 - Small devices
    // - md: 768 - Medium devices
    // - lg: 992 - Large devices
    // - xl: 1200 - Extra large
    // MinWidth for each breakpoint can be overwritten like it's visible below.
    // ResponsiveOptions can overwrite default configuration with any option available.
    responsiveOptions: [
        {
            breakpoint: 'sm',
            // minWidth: 480,
            lanes: 3
        },
        {
            breakpoint: 'md',
            minWidth: 768,
            lanes: 10
        },
        {
            breakpoint: 'lg',
            minWidth: 1250,
            lanes: 10
        },
        {
            breakpoint: 'xl',
            minWidth: 1800,
            lanes: 10
        }
    ]
};

  public gridsterDraggableOptions: IGridsterDraggableOptions = {
      handlerClass: 'panel-heading'
  };

  //title = 'Angular2Gridster';
  public widgets: Array<any> = [
      {
          x: 0, y: 0,
          w: 10, h: 2,
          dragAndDrop: true,
          resizable: true,
          title: 'Basic form inputs 1'
      }
  ];

  static X_PROPERTY_MAP: any = {
      sm: 'xSm',
      md: 'xMd',
      lg: 'xLg',
      xl: 'xXl'
  };

  static Y_PROPERTY_MAP: any = {
      sm: 'ySm',
      md: 'yMd',
      lg: 'yLg',
      xl: 'yXl'
  };

  constructor() { 
  }
  ngOnInit() { 

  }


  public onReflow(event) {
    //console.log('onReflow', event);
  }

  public removeLine(gridster: GridsterComponent) {
      gridster.setOption('lanes', --this.gridsterOptions.lanes)
          .reload();
  }

  /*getTitle() {
      return this.title;
  }*/

  public addLine(gridster: GridsterComponent) {
      gridster.setOption('lanes', ++this.gridsterOptions.lanes)
          .reload();
  }

  public setWidth(widget: any, size: number, e: MouseEvent, gridster) {
      e.stopPropagation();
      e.preventDefault();
      if (size < 1) {
          size = 1;
      }
      widget.w = size;

      gridster.reload();

      return false;
  }

  public setHeight(widget: any, size: number, e: MouseEvent, gridster) {
      e.stopPropagation();
      e.preventDefault();
      if (size < 1) {
          size = 1;
      }
      widget.h = size;

      gridster.reload();

      return false;
  }

  public optionsChange(options: IGridsterOptions) {
      this.gridsterOptions = options;
      //console.log('options change:', options);
  }

  public swap() {
      this.widgets[0].x = 3;
      this.widgets[3].x = 0;
  }

  public addWidgetFromDrag(gridster: GridsterComponent, event: any) {
      const item = event.item;
      const breakpoint = gridster.options.breakpoint;
      const widget = {
          w: item.w, h: item.h,
          dragAndDrop: true,
          resizable: true,
          title: 'New widget'
      };

      widget[DashboardGridComponent.X_PROPERTY_MAP[breakpoint]] = item.x;
      widget[DashboardGridComponent.Y_PROPERTY_MAP[breakpoint]] = item.y;

      this.widgets.push(widget);

      //console.log('add widget from drag to:', gridster);
  }

  public over(event) {
      const size = event.item.calculateSize(event.gridster);

      event.item.itemPrototype.$element.querySelector('.gridster-item-inner').style.width = size.width + 'px';
      event.item.itemPrototype.$element.querySelector('.gridster-item-inner').style.height = size.height + 'px';
      event.item.itemPrototype.$element.classList.add('is-over');
  }

  public out(event) {
      event.item.itemPrototype.$element.querySelector('.gridster-item-inner').style.width = '';
      event.item.itemPrototype.$element.querySelector('.gridster-item-inner').style.height = '';
      event.item.itemPrototype.$element.classList.remove('is-over');
  }

  public addWidgetWithoutData() {
      this.widgets.push({
          title: 'New Widget',
          dragAndDrop: true,
          resizable: true,
          content: ''
      });
  }

  public addWidget(gridster: GridsterComponent) {
      this.widgets.push({
          x: 4, y: 0, w: 1, h: 1,
          dragAndDrop: true,
          resizable: true,
          title: 'Basic form inputs 5',
          content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et ' +
          'dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea ' +
          'commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla ' +
          'pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est ' +
          'laborum.'
      });
      //console.log('widget push', this.widgets[this.widgets.length - 1]);
  }

  public remove($event, index: number, gridster: GridsterComponent) {
      $event.preventDefault();
      this.widgets.splice(index, 1);
      //console.log('widget remove', index);
  }

  public removeAllWidgets() {
      this.widgets = [];
  }

  public itemChange($event: any, gridster) {
      //console.log('item change', $event);
  }
}
