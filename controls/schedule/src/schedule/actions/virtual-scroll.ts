/* eslint-disable @typescript-eslint/no-explicit-any */
import { append, addClass, remove, isNullOrUndefined, setStyleAttribute, createElement, prepend, removeClass } from '@syncfusion/ej2-base';
import { TdData, ScrollEventArgs } from '../base/interface';
import { Schedule } from '../base/schedule';
import * as events from '../base/constant';
import * as cls from '../base/css-constant';
import * as util from '../base/util';

/**
 * Virtual Scroll
 */
export class VirtualScroll {
    private parent: Schedule;
    private translateY: number = 0;
    private itemSize: number = 60;
    public bufferCount: number;
    private renderedLength: number = 0;
    private averageRowHeight: number = 0;
    private timeValue: number;
    private focusedEle: Element;
    private isResourceCell: boolean;
    public isHorizontalScroll: boolean;
    public isRemoteRefresh: boolean;
    private startIndex: number = 0;
    public existingDataCollection: TdData[] = [];
    public enableTransition: boolean = true;

    constructor(parent: Schedule) {
        this.parent = parent;
        this.bufferCount = parent.activeViewOptions.overscanCount < 3 ? 3 : parent.activeViewOptions.overscanCount;
        this.addEventListener();
    }

    private addEventListener(): void {
        if (!this.parent || this.parent && this.parent.isDestroyed) { return; }
        this.parent.on(events.virtualScroll, this.virtualScrolling, this);
    }

    private removeEventListener(): void {
        if (!this.parent || this.parent && this.parent.isDestroyed) { return; }
        this.parent.off(events.virtualScroll, this.virtualScrolling);
    }

    public getRenderedCount(): number {
        this.setItemSize();
        const containerSize: number = this.isHorizontalScroll ? this.parent.element.clientWidth : this.parent.element.clientHeight;
        this.renderedLength = Math.ceil(containerSize / this.itemSize) + this.bufferCount;
        return this.renderedLength;
    }

    public renderVirtualTrack(contentWrap: Element): void {
        const wrap: HTMLElement = createElement('div', { className: cls.VIRTUAL_TRACK_CLASS }) as HTMLElement;
        if (this.isHorizontalScroll) {
            const colCount: number = this.parent.activeView.colLevels[this.parent.activeView.colLevels.length - 1].length;
            wrap.style.width = (colCount * this.itemSize) + 'px';
        } else {
            wrap.style.height = (this.parent.resourceBase.expandedResources.length * this.itemSize) + 'px';
        }
        contentWrap.appendChild(wrap);
    }

    public updateVirtualScrollHeight(): void {
        const virtual: HTMLElement = this.parent.element.querySelector('.' + cls.VIRTUAL_TRACK_CLASS) as HTMLElement;
        const lastResourceIndex: number =
            this.parent.resourceBase.expandedResources[this.parent.resourceBase.expandedResources.length - 1].groupIndex;
        const lastRenderIndex: number =
            this.parent.resourceBase.renderedResources[this.parent.resourceBase.renderedResources.length - 1].groupIndex;
        if (lastRenderIndex !== lastResourceIndex) {
            const conTable: HTMLElement = this.parent.element.querySelector('.' + cls.CONTENT_TABLE_CLASS) as HTMLElement;
            this.renderedLength = conTable.querySelector('tbody').children.length;
            virtual.style.height = (conTable.offsetHeight + (this.parent.resourceBase.expandedResources.length - (this.renderedLength)) *
                conTable.offsetHeight / this.renderedLength) + 'px';
            const conWrap: HTMLElement = this.parent.element.querySelector('.' + cls.CONTENT_WRAP_CLASS) as HTMLElement;
            if (this.bufferCount === 3 && (conWrap.scrollHeight - conWrap.scrollTop) < conWrap.offsetHeight * this.bufferCount) {
                virtual.style.height = parseInt(virtual.style.height, 10) + (conWrap.offsetHeight * this.bufferCount) + 'px';
            }
        } else {
            virtual.style.height = '';
        }
        this.averageRowHeight = virtual.offsetHeight / this.parent.resourceBase.expandedResources.length;
    }

    public updateVirtualTrackHeight(wrap: HTMLElement): void {
        const resourceCount: number = this.parent.resourceBase.renderedResources.length;
        if (resourceCount !== this.getRenderedCount()) {
            wrap.style.height = (this.parent.element.querySelector('.e-content-wrap') as HTMLElement).clientHeight + 'px';
            const resWrap: HTMLElement = this.parent.element.querySelector('.' + cls.RESOURCE_COLUMN_WRAP_CLASS) as HTMLElement;
            const conWrap: HTMLElement = this.parent.element.querySelector('.' + cls.CONTENT_WRAP_CLASS) as HTMLElement;
            const eventWrap: HTMLElement = this.parent.element.querySelector('.' + cls.EVENT_TABLE_CLASS) as HTMLElement;
            this.translateY = 0;
            this.setTranslate(resWrap, conWrap, eventWrap);
        } else {
            const lastRenderIndex: number = this.parent.resourceBase.renderedResources[resourceCount - 1].groupIndex;
            const lastCollIndex: number =
                this.parent.resourceBase.expandedResources[this.parent.resourceBase.expandedResources.length - 1].groupIndex;
            let renderedResCount: number = resourceCount + (lastCollIndex - lastRenderIndex);
            renderedResCount = (renderedResCount > this.parent.resourceBase.expandedResources.length) ?
                this.parent.resourceBase.expandedResources.length : renderedResCount;
            wrap.style.height = (renderedResCount * this.itemSize) + 'px';
        }
    }

    public setItemSize(): void {
        if (this.isHorizontalScroll) {
            if (this.parent.group.byDate) {
                const colElement: HTMLTableColElement = this.parent.element.querySelector('.' + cls.DATE_HEADER_WRAP_CLASS + ' table col');
                this.itemSize = colElement ? util.getElementWidth(colElement, this.parent.uiStateValues.isTransformed) : this.itemSize;
            }
            else {
                this.itemSize = util.getElementWidthFromClass(this.parent.activeView.element, cls.WORK_CELLS_CLASS,
                                                              this.parent.uiStateValues.isTransformed) || this.itemSize;
            }
        } else {
            this.itemSize = this.parent.getElementHeightFromClass(this.parent.activeView.element, cls.WORK_CELLS_CLASS) || this.itemSize;
        }
    }

    public refreshLayout(): void {
        const initialHeight: number = this.parent.uiStateValues.scheduleHeight;
        this.parent.uiStateValues.scheduleHeight = this.parent.element.offsetHeight;
        const preRenderedLength: number = this.renderedLength;
        if (this.parent.uiStateValues.scheduleHeight !== initialHeight) {
            if (preRenderedLength < this.getRenderedCount()) {
                this.isRemoteRefresh = true;
            }
            const resWrap: HTMLElement = this.parent.element.querySelector('.' + cls.RESOURCE_COLUMN_WRAP_CLASS) as HTMLElement;
            const conWrap: HTMLElement = this.parent.element.querySelector('.' + cls.CONTENT_WRAP_CLASS) as HTMLElement;
            const eventWrap: HTMLElement = this.parent.element.querySelector('.' + cls.EVENT_TABLE_CLASS) as HTMLElement;
            if (!this.parent.rowAutoHeight) {
                this.enableTransition = false;
                removeClass([conWrap, resWrap], 'e-transition');
            }
            let firstTDIndex: number = parseInt(resWrap.querySelector('tbody td').getAttribute('data-group-index'), 10);
            const endIndex: number = (firstTDIndex + this.renderedLength);
            firstTDIndex = (endIndex > this.parent.resourceBase.expandedResources.length) ?
                (this.parent.resourceBase.expandedResources.length - this.renderedLength) : firstTDIndex;
            firstTDIndex = firstTDIndex < 0 ? 0 : firstTDIndex;
            this.existingDataCollection = this.parent.resourceBase.renderedResources;
            this.parent.resourceBase.renderedResources = this.parent.resourceBase.expandedResources.slice(firstTDIndex, endIndex);
            if (this.parent.resourceBase.renderedResources.length > 0) {
                this.updateContent(resWrap, conWrap, eventWrap, this.parent.resourceBase.renderedResources);
            }
        }
    }

    private renderEvents(): void {
        this.setTabIndex();
        const dynamicData: Record<string, any>[] = this.triggerScrollEvent(events.virtualScrollStop);
        if (this.parent.activeViewOptions && this.parent.activeViewOptions.enableLazyLoading && this.parent.crudModule) {
            if (dynamicData.length > 0) {
                this.parent.crudModule.refreshProcessedData(true, dynamicData);
                this.parent.hideSpinner();
                return;
            }
            this.parent.crudModule.refreshDataManager();
            return;
        }
        if (this.parent.crudModule) {
            this.parent.crudModule.refreshProcessedData(true);
        }
        if (this.parent.currentView !== 'Month') {
            this.parent.notify(events.contentReady, {});
        }
        this.parent.hideSpinner();
    }

    public virtualScrolling(): void {
        if (this.parent.quickPopup) {
            this.parent.quickPopup.quickPopupHide();
            this.parent.quickPopup.morePopup.hide();
        }
        const conWrap: HTMLElement = this.parent.element.querySelector('.' + cls.CONTENT_WRAP_CLASS) as HTMLElement;
        if (this.isHorizontalScroll) {
            this.horizontalScrolling(conWrap);
        } else {
            const resWrap: HTMLElement = this.parent.element.querySelector('.' + cls.RESOURCE_COLUMN_WRAP_CLASS) as HTMLElement;
            const eventWrap: HTMLElement = this.parent.element.querySelector('.' + cls.EVENT_TABLE_CLASS) as HTMLElement;
            const timeIndicator: HTMLElement = this.parent.element.querySelector('.' + cls.CURRENT_TIMELINE_CLASS) as HTMLElement;
            const conTable: HTMLElement = this.parent.element.querySelector('.' + cls.CONTENT_TABLE_CLASS) as HTMLElement;
            if (!this.parent.rowAutoHeight) {
                addClass([conWrap, resWrap], 'e-transition');
            }
            this.renderedLength = resWrap.querySelector('tbody').children.length;
            const firstTDIndex: number = parseInt(resWrap.querySelector('tbody td').getAttribute('data-group-index'), 10);
            const scrollHeight: number = this.parent.rowAutoHeight ?
                (conTable.offsetHeight - conWrap.offsetHeight) : this.bufferCount * this.itemSize;
            let resCollection: TdData[] = [];
            this.existingDataCollection = this.parent.resourceBase.renderedResources;
            if ((conWrap.scrollTop) - this.translateY < 0) {
                resCollection = this.upScroll(conWrap, firstTDIndex);
            } else if ((conWrap.scrollTop + conWrap.clientHeight >= conWrap.scrollHeight - this.itemSize) ||
                (conWrap.scrollTop > (this.translateY + scrollHeight))) {
                resCollection = this.downScroll(conWrap, firstTDIndex);
            }
            if (!isNullOrUndefined(resCollection) && resCollection.length > 0) {
                this.triggerScrollEvent(events.virtualScrollStart);
                const selectedEle: Element[] = this.parent.getSelectedCells();
                this.focusedEle = selectedEle[selectedEle.length - 1] || this.focusedEle;
                this.updateContent(resWrap, conWrap, eventWrap, resCollection);
                this.setTranslate(resWrap, conWrap, eventWrap, timeIndicator);
                if (this.parent.dragAndDropModule && this.parent.dragAndDropModule.actionObj.action === 'drag') {
                    this.parent.dragAndDropModule.navigationWrapper();
                }
                window.clearTimeout(this.timeValue);
                this.timeValue = window.setTimeout(() => { this.renderEvents(); }, 250);
            }
        }
    }

    private horizontalScrolling(conWrap: HTMLElement): void {
        let resCollection: TdData[] = [];
        const scrollWidth: number = this.bufferCount * this.itemSize;
        if (Math.abs(conWrap.scrollLeft) - Math.abs(this.translateY) < 0) {
            resCollection = this.leftScroll(conWrap);
        } else if (Math.abs(conWrap.scrollLeft) - Math.abs(this.translateY) > scrollWidth) {
            resCollection = this.rightScroll(conWrap);
        }
        if (!isNullOrUndefined(resCollection) && resCollection.length > 0) {
            if (this.parent.resourceBase.expandedResources.length !== resCollection.length ||
                this.parent.resourceBase.expandedResources[0] !== resCollection[0] ||
                this.parent.resourceBase.expandedResources[this.parent.resourceBase.expandedResources.length - 1] !==
                    resCollection[resCollection.length - 1]) {
                this.triggerScrollEvent(events.virtualScrollStart);
                const colLevels: TdData[][] = this.parent.activeView.colLevels.slice(0);
                this.updateHorizontalContent(conWrap, resCollection);
                setStyleAttribute(conWrap.querySelector('table') as HTMLElement, { transform: `translateX(${this.translateY}px)` });
                this.parent.activeView.colLevels = colLevels;
                if (this.parent.dragAndDropModule && this.parent.dragAndDropModule.actionObj.action === 'drag') {
                    this.parent.dragAndDropModule.navigationWrapper();
                }
            }
            window.clearTimeout(this.timeValue);
            this.timeValue = window.setTimeout(() => { this.renderEvents(); }, 250);
        }
    }

    private triggerScrollEvent(action: string): Record<string, any>[] {
        let dynamicData: Record<string, any>[] = [];
        if (!this.parent.activeView){
            return dynamicData;
        }
        const eventArgs: ScrollEventArgs = {
            startDate: this.parent.activeView.startDate(),
            endDate: this.parent.activeView.endDate(),
            startIndex: this.parent.resourceBase.renderedResources[0].groupIndex,
            endIndex: this.parent.resourceBase.renderedResources[this.parent.resourceBase.renderedResources.length - 1].groupIndex,
            resourceData: this.parent.resourceBase.renderedResources.map((x: TdData) => x.resourceData),
            name: action
        };
        this.parent.trigger(action, eventArgs, (args: ScrollEventArgs) => {
            if (action === events.virtualScrollStart) {
                this.parent.showSpinner();
            }
            else if (action === events.virtualScrollStop && !isNullOrUndefined(args.eventData) && args.eventData.length > 0) {
                dynamicData = args.eventData;
            }
        });
        return dynamicData;
    }

    private upScroll(conWrap: HTMLElement, firstTDIndex: number): TdData[] {
        let index: number = 0;
        index = (~~(conWrap.scrollTop / this.itemSize) + Math.ceil(conWrap.clientHeight / this.itemSize)) - this.renderedLength;

        if (this.parent.rowAutoHeight) {
            index = (index > firstTDIndex) ? firstTDIndex - this.bufferCount : index;
        }
        index = (index > 0) ? index : 0;
        let prevSetCollection: TdData[] = this.getBufferCollection(index, index + this.renderedLength);
        this.parent.resourceBase.renderedResources = prevSetCollection;
        if (firstTDIndex === 0) {
            this.translateY = conWrap.scrollTop;
        } else {
            let height: number = (this.parent.rowAutoHeight) ? this.averageRowHeight : this.itemSize;
            height = (height > 0) ? height : this.itemSize;
            this.translateY = (conWrap.scrollTop - (this.bufferCount * height) > 0) ?
                conWrap.scrollTop - (this.bufferCount * height) : 0;
            if (this.parent.rowAutoHeight && this.translateY === 0 && index !== 0) {
                prevSetCollection = this.getBufferCollection(0, this.renderedLength);
                this.parent.resourceBase.renderedResources = prevSetCollection;
            }
        }
        return prevSetCollection;
    }

    private downScroll(conWrap: HTMLElement, firstTDIndex: number): TdData[] {
        const lastResource: number = this.parent.resourceBase.
            renderedResources[this.parent.resourceBase.renderedResources.length - 1].groupIndex;
        const lastResourceIndex: number =
            this.parent.resourceBase.expandedResources[this.parent.resourceBase.expandedResources.length - 1].groupIndex;
        if (lastResource === lastResourceIndex) {
            return null;
        }
        let nextSetResIndex: number = 0;
        nextSetResIndex = ~~(conWrap.scrollTop / this.itemSize);
        if (this.parent.rowAutoHeight) {
            nextSetResIndex = ~~((conWrap.scrollTop - this.translateY) / this.averageRowHeight) + firstTDIndex;
            nextSetResIndex = (nextSetResIndex > firstTDIndex + this.bufferCount) ? nextSetResIndex : firstTDIndex + this.bufferCount;
        }
        let lastIndex: number = nextSetResIndex + this.renderedLength;
        lastIndex = (lastIndex > this.parent.resourceBase.expandedResources.length) ?
            nextSetResIndex + (this.parent.resourceBase.expandedResources.length - nextSetResIndex) : lastIndex;
        const nextSetCollection: TdData[] = this.getBufferCollection(lastIndex - this.renderedLength, lastIndex);
        this.translateY = conWrap.scrollTop;
        return nextSetCollection;
    }

    private leftScroll(conWrap: HTMLElement): TdData[] {
        let index: number = 0;
        index = (~~(Math.abs(conWrap.scrollLeft) / this.itemSize) + Math.ceil(conWrap.clientWidth / this.itemSize)) - this.renderedLength;
        index = (index > 0) ? index : 0;
        return this.getCollection(index, index + this.renderedLength);
    }

    private rightScroll(conWrap: HTMLElement): TdData[] {
        const lastLevel: TdData[] = this.parent.activeView.colLevels[this.parent.activeView.colLevels.length - 1];
        let nextSetIndex: number = 0;
        nextSetIndex = ~~(Math.abs(conWrap.scrollLeft) / this.itemSize);
        let lastIndex: number = nextSetIndex + this.renderedLength;
        lastIndex = (lastIndex > lastLevel.length - 1 ) ? lastLevel.length - 1 : lastIndex;
        return this.getCollection(lastIndex - this.renderedLength, lastIndex);
    }

    private getCollection(startIndex: number, endIndex: number): TdData[] {
        this.translateY = startIndex * this.itemSize;
        startIndex = (startIndex < 0) ? 0 : startIndex;
        const lastLevel: TdData[] = this.getResCollection(startIndex, endIndex);
        if (this.parent.enableRtl) {
            this.translateY = - this.translateY;
        }
        return lastLevel;
    }

    private getResCollection(startIndex: number, endIndex: number): TdData[] {
        const lastLevel: TdData[] = this.parent.activeView.colLevels[this.parent.activeView.colLevels.length - 1];
        endIndex = endIndex > lastLevel.length ? lastLevel.length - 1 : endIndex;
        let resCollection: TdData[] = [];
        const index: Record<string, number> = { startIndex: 0, endIndex: 0 };
        if (this.parent.activeViewOptions.group.byDate) {
            if (lastLevel[parseInt(startIndex.toString(), 10)].date.getTime() ===
              this.parent.resourceBase.expandedResources[0].date.getTime() &&
                lastLevel[parseInt(endIndex.toString(), 10)].date.getTime() ===
                this.parent.resourceBase.expandedResources[this.parent.resourceBase.expandedResources.length - 1].date.getTime()) {
                return this.parent.resourceBase.expandedResources;
            }
            resCollection =
                this.getByDateCollection(lastLevel[parseInt(startIndex.toString(), 10)],
                                         lastLevel[parseInt(endIndex.toString(), 10)], index);
            this.setRenderedDates(resCollection);
        } else {
            if (lastLevel[parseInt(startIndex.toString(), 10)].groupIndex === this.parent.resourceBase.expandedResources[0].groupIndex &&
                lastLevel[parseInt(endIndex.toString(), 10)].groupIndex ===
                    this.parent.resourceBase.expandedResources[this.parent.resourceBase.expandedResources.length - 1].groupIndex) {
                return this.parent.resourceBase.expandedResources;
            }
            resCollection =
            this.getByIdCollection(lastLevel[parseInt(startIndex.toString(), 10)], lastLevel[parseInt(endIndex.toString(), 10)], index);
        }
        if (this.parent.currentView !== 'Month') {
            this.startIndex = index.startIndex;
            resCollection = lastLevel.slice(index.startIndex, index.endIndex);
        }
        this.translateY = index.startIndex * this.itemSize;
        return resCollection;
    }

    private getByDateCollection(firstItem: TdData, lastItem: TdData, index: Record<string, number>): TdData[] {
        const resCollection: TdData[] = this.parent.activeView.colLevels[0].filter((data: TdData) =>
            firstItem.date.getTime() <= data.date.getTime() &&
            data.date.getTime() <= lastItem.date.getTime());
        this.setStartEndIndex(this.parent.activeView.colLevels[0], resCollection[0], resCollection[resCollection.length - 1], index);
        return resCollection;
    }

    private getByIdCollection(firstItem: TdData, lastItem: TdData, index: Record<string, number>): TdData[] {
        const resCollection: TdData[] = this.parent.resourceBase.lastResourceLevel.filter((data: TdData) =>
            firstItem.groupIndex <= data.groupIndex && data.groupIndex <= lastItem.groupIndex);
        this.parent.resourceBase.renderedResources = resCollection;
        this.setStartEndIndex(this.parent.resourceBase.lastResourceLevel, resCollection[0], resCollection[resCollection.length - 1], index);
        return resCollection;
    }

    private setStartEndIndex(data: TdData[], firstItem: TdData, lastItem: TdData, colIndex: Record<string, number>): void {
        let index: number = 0;
        data.filter((data: TdData) => {
            if (firstItem === data) {
                colIndex.startIndex = index;
            } else if (lastItem === data) {
                colIndex.endIndex = index + data.colSpan;
            }
            index += data.colSpan;
        });
        if (firstItem === lastItem) {
            colIndex.endIndex = colIndex.startIndex + lastItem.colSpan;
        }
    }

    public updateContent(resWrap: HTMLElement, conWrap: HTMLElement, eventWrap: HTMLElement, resCollection: TdData[]): void {
        const renderedLength: number = resWrap.querySelector('tbody').children.length;
        if (document.activeElement && document.activeElement.classList.contains(cls.RESOURCE_CELLS_CLASS)) {
            this.isResourceCell = true;
            this.parent.element.focus();
        }
        for (let i: number = 0; i < renderedLength; i++) {
            remove(eventWrap.querySelector('div'));
        }
        this.parent.resourceBase.renderedResources = resCollection;
        const currentGroupIndices: number[] = this.parent.activeView.getGroupIndices(resCollection);
        const previousGroupIndices: number[] = this.parent.activeView.getGroupIndices(this.existingDataCollection);
        const newGroupIndices: number[] = currentGroupIndices.filter((index: number) => previousGroupIndices.indexOf(index) < 0);
        const resWrapRows: HTMLElement[] = Array.from(resWrap.querySelectorAll('tbody tr'));
        const conWrapRows: HTMLElement[] = Array.from(conWrap.querySelectorAll('tbody tr'));
        const resWrapBody: HTMLElement = resWrap.querySelector('tbody');
        const conWrapBody: HTMLElement = conWrap.querySelector('tbody');
        this.removeObsoleteRows(resWrapRows, currentGroupIndices);
        this.removeObsoleteRows(conWrapRows, currentGroupIndices);
        const resourceRows: Element[] = this.parent.resourceBase.getContentRows(resCollection, true);
        if (this.parent.isReact) {
            this.parent.renderTemplates();
        }
        const contentRows: Element[] = this.parent.activeView.getContentRows();
        const eventRows: Element[] = this.parent.activeView.getEventRows(resCollection.length);
        for (let i: number = 0; i < newGroupIndices.length; i++) {
            const index: number = currentGroupIndices.indexOf(newGroupIndices[parseInt(i.toString(), 10)]);
            if (index === 0) {
                prepend([resourceRows[parseInt(i.toString(), 10)]], resWrapBody);
                prepend([contentRows[parseInt(i.toString(), 10)]], conWrapBody);
            } else if (resWrapBody && conWrapBody && resWrapBody.children[parseInt(index.toString(), 10)] &&
                conWrapBody.children[parseInt(index.toString(), 10)]) {
                resWrapBody.insertBefore(resourceRows[parseInt(i.toString(), 10)], resWrapBody.children[parseInt(index.toString(), 10)]);
                conWrapBody.insertBefore(contentRows[parseInt(i.toString(), 10)], conWrapBody.children[parseInt(index.toString(), 10)]);
            }
            else {
                append([resourceRows[parseInt(i.toString(), 10)]], resWrapBody);
                append([contentRows[parseInt(i.toString(), 10)]], conWrapBody);
            }
        }
        append(eventRows, eventWrap);
    }

    private removeObsoleteRows(elements: HTMLElement[], currentGroupIndices: number[]): void {
        elements.forEach((element: HTMLElement) => {
            const groupIndex: number = parseInt(element.firstElementChild.getAttribute('data-group-index'), 10);
            if (currentGroupIndices.indexOf(groupIndex) < 0) {
                remove(element);
            }
        });
    }

    private updateHorizontalContent(conWrap: HTMLElement, resCollection: TdData[]): void {
        this.existingDataCollection = this.parent.resourceBase.expandedResources;
        this.parent.resourceBase.expandedResources = resCollection;
        const selectedEle: Element[] = this.parent.getSelectedCells();
        this.focusedEle = selectedEle[selectedEle.length - 1] || this.focusedEle;

        const tbody: Element = conWrap.querySelector('tbody');
        const renderedRows: HTMLTableRowElement[] = Array.from(tbody.querySelectorAll('tr'));

        if (this.parent.currentView === 'Month') {
            this.updateMonthViewContent(conWrap, resCollection);
        } else {
            this.updateOtherViewContent(conWrap, resCollection, renderedRows);
        }
    }

    private updateMonthViewContent(conWrap: HTMLElement, resCollection: TdData[]): void {
        const renderedLength: number = conWrap.querySelectorAll(' tr').length;
        for (let i: number = 0; i < renderedLength; i++) {
            remove(conWrap.querySelector('tbody tr'));
        }

        if (this.parent.activeViewOptions.group.byDate) {
            this.parent.activeView.colLevels[0] = resCollection;
        } else {
            this.parent.activeView.colLevels[this.parent.activeView.colLevels.length - 2] = resCollection;
        }

        const contentRows: Element[] = this.parent.activeView.getContentRows();
        append(contentRows, conWrap.querySelector('tbody'));
    }

    private updateOtherViewContent(conWrap: HTMLElement, resCollection: TdData[], renderedRows: Element[]): void {
        const tbody: Element = conWrap.querySelector('tbody');
        const colGroup: Element = conWrap.querySelector('colgroup');
        const thead: Element = conWrap.querySelector('thead');
        const table: Element = conWrap.querySelector('table');
        this.parent.activeView.colLevels[this.parent.activeView.colLevels.length - 1] = resCollection;
        const newIndices: Set<number> = this.parent.activeViewOptions.group.byDate
            ? new Set(resCollection.map((data: TdData) => data.date.getTime()))
            : new Set(resCollection.map((data: TdData) => data.groupIndex));
        renderedRows.forEach((row: Element) => {
            const tdElements: HTMLTableCellElement[] = Array.from(row.querySelectorAll('td'));
            tdElements.forEach((td: HTMLTableCellElement) => {
                if (!newIndices.has(this.getIdentifier(td))) {
                    td.remove();
                }
            });
        });
        const col: Element[] = [].slice.call(conWrap.querySelector('colgroup').children);
        for (let i: number = 0; i < col.length; i++) {
            remove(col[parseInt(i.toString(), 10)]);
        }
        resCollection.forEach(() => colGroup.appendChild(createElement('col')));
        const tHead: Element[] = [].slice.call(conWrap.querySelector('thead').children);
        for (let i: number = 0; i < tHead.length; i++) {
            remove(tHead[parseInt(i.toString(), 10)]);
        }
        thead.appendChild(this.parent.eventBase.createEventWrapper('', this.startIndex > 0 ? this.startIndex : 0));
        if (this.parent.activeViewOptions.timeScale.enable) {
            thead.appendChild(this.parent.eventBase.createEventWrapper('timeIndicator'));
        }
        prepend([thead], table);
        const contentRows: Element[] = this.parent.activeView.getContentRows();
        this.mergeNewTdData(tbody, contentRows);
    }

    private getIdentifier(td: HTMLTableCellElement): number {
        if (this.parent.activeViewOptions.group.byDate) {
            const date: Date = new Date(parseInt(td.getAttribute('data-date'), 10));
            return util.resetTime(date).getTime();
        }
        return parseInt(td.getAttribute('data-group-index'), 10);
    }

    private mergeNewTdData(tbody: Element, contentRows: Element[]): void {
        const existingRows: HTMLTableRowElement[] = Array.from(tbody.querySelectorAll<HTMLTableRowElement>('tr'));

        existingRows.forEach((existingRow: HTMLTableRowElement, rowIndex: number) => {
            if (rowIndex < contentRows.length) {
                const newRow: Element = contentRows[parseInt(rowIndex.toString(), 10)];
                const existingTds: HTMLTableCellElement[] = Array.from(existingRow.querySelectorAll<HTMLTableCellElement>('td'));
                const newTds: HTMLTableCellElement[] = Array.from(newRow.querySelectorAll<HTMLTableCellElement>('td'));

                newTds.forEach((newTd: HTMLTableCellElement) => {
                    let inserted: boolean = false;

                    for (const existingTd of existingTds) {
                        if (this.getIdentifier(newTd) < this.getIdentifier(existingTd)) {
                            existingRow.insertBefore(newTd, existingTd);
                            inserted = true;
                            break;
                        }
                    }

                    if (!inserted) {
                        existingRow.appendChild(newTd);
                    }
                });
            }
        });
    }

    private getBufferCollection(startIndex: number, endIndex: number): TdData[] {
        return this.parent.resourceBase.expandedResources.slice(startIndex, endIndex);
    }

    private setTranslate(resWrap: HTMLElement, conWrap: HTMLElement, eventWrap: HTMLElement, timeIndicator?: HTMLElement): void {
        setStyleAttribute(resWrap.querySelector('table') as HTMLElement, { transform: `translateY(${this.translateY}px)` });
        setStyleAttribute(conWrap.querySelector('table') as HTMLElement, { transform: `translateY(${this.translateY}px)` });
        setStyleAttribute(eventWrap, { transform: `translateY(${this.translateY}px)` });
        if (!isNullOrUndefined(timeIndicator)) {
            setStyleAttribute(timeIndicator, { transform: `translateY(${this.translateY}px)` });
        }
    }

    public updateFocusedWorkCell(): void {
        if (this.focusedEle) {
            const date: number = parseInt(this.focusedEle.getAttribute('data-date'), 10);
            const groupIndex: number = parseInt(this.focusedEle.getAttribute('data-group-index'), 10);
            const ele: HTMLTableCellElement =
                this.parent.element.querySelector(`.${cls.WORK_CELLS_CLASS}[data-date="${date}"][data-group-index="${groupIndex}"]`);
            if (ele) {
                this.parent.addSelectedClass([ele], ele, true);
            }
            this.focusedEle = null;
        }
    }

    public setRenderedDates(resCollection: TdData[]): void {
        if (this.parent.currentView !== 'Month') {
            const dateCol: Date[] = resCollection.map((x: TdData) => x.date);
            this.parent.resourceBase.renderedResources.forEach((x: TdData) => x.renderDates = dateCol);
        } else {
            const dateCol: number[] = resCollection.map((x: TdData) => x.date.getDay());
            const renderDates: Date[] = this.parent.activeView.renderDates.filter((x: Date) => dateCol.indexOf(x.getDay()) >= 0);
            this.parent.resourceBase.renderedResources.forEach((x: TdData) => x.renderDates = renderDates);
        }
    }

    private setTabIndex(): void {
        const resColWrap: HTMLElement = this.parent.element.querySelector('.' + cls.RESOURCE_COLUMN_WRAP_CLASS);
        const resCells: HTMLElement[] = [].slice.call(this.parent.element.querySelectorAll('.' + cls.RESOURCE_CELLS_CLASS));
        if (resCells && resColWrap) {
            resCells.forEach((element: HTMLElement) => {
                if (element.getBoundingClientRect().top >= resColWrap.getBoundingClientRect().top) {
                    element.setAttribute('tabindex', '0');
                }
            });
        }
        const focusResCell: HTMLElement = this.parent.element.querySelector(`.${cls.RESOURCE_CELLS_CLASS}[tabindex="${0}"]`);
        if (this.isResourceCell && focusResCell) {
            focusResCell.focus();
            this.isResourceCell = false;
        }
    }

    public destroy(): void {
        this.removeEventListener();
        this.focusedEle = null;
    }

}
