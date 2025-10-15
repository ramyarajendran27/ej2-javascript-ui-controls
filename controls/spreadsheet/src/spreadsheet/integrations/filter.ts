import { Spreadsheet, locale, dialog, mouseDown, renderFilterCell, initiateFilterUI, FilterInfoArgs, getStartEvent, duplicateSheetOption, focus, getChartsIndexes, refreshChartCellModel, ExtendedSpreadsheet, readonlyAlert } from '../index';
import { reapplyFilter, filterCellKeyDown, DialogBeforeOpenEventArgs, ExtendedPredicateModel, refreshFilterRange, createNoteIndicator } from '../index';
import { getFilteredColumn, cMenuBeforeOpen, filterByCellValue, clearFilter, getFilterRange, applySort } from '../index';
import { SortOptions, SortDescriptor, LocaleNumericSettings, FilterPredicateOptions, applyPredicates, isHiddenRow, isReadOnlyCells, AutoDetectGeneralFormatArgs } from '../../workbook/index';
import { checkIsNumberAndGetNumber } from '../../workbook/common/internalization';
import { filterRangeAlert, setFilteredCollection, beforeDelete, sheetsDestroyed, initiateFilter, duplicateSheetFilterHandler, moveSheetHandler, updateSortCollection, checkNumberFormat } from '../../workbook/common/event';
import { FilterCollectionModel, getRangeIndexes, ColumnModel, beforeInsert, parseLocaleNumber, ChartModel } from '../../workbook/index';
import { getIndexesFromAddress, getSwapRange, getColumnHeaderText, CellModel, getDataRange, isCustomDateTime } from '../../workbook/index';
import { getData, Workbook, getTypeFromFormat, getCell, getCellIndexes, getRangeAddress, getSheet, inRange } from '../../workbook/index';
import { SheetModel, sortImport, clear, getColIndex, SortCollectionModel, setRow, ExtendedRowModel, hideShow } from '../../workbook/index';
import { beginAction, FilterOptions, BeforeFilterEventArgs, FilterEventArgs, ClearOptions, getValueFromFormat } from '../../workbook/index';
import { isFilterHidden, isNumber, DateFormatCheckArgs, checkDateFormat, isDateTime, dateToInt, getFormatFromType } from '../../workbook/index';
import { getComponent, EventHandler, isUndefined, isNullOrUndefined, Browser, KeyboardEventArgs, removeClass, IntlBase, cldrData, getNumberDependable, defaultCurrencyCode } from '@syncfusion/ej2-base';
import { L10n, detach, classList, getNumericObject } from '@syncfusion/ej2-base';
import { Internationalization } from '@syncfusion/ej2-base';
import { Dialog } from '../services';
import { refreshFilterCellsOnResize, ICellRenderer, updateWrapCell, isTouchStart } from '../common/index';
import { IFilterArgs, PredicateModel, ExcelFilterBase, beforeFltrcMenuOpen, CheckBoxFilterBase, getUid } from '@syncfusion/ej2-grids';
import { filterCmenuSelect, filterCboxValue, filterDialogCreated, filterDialogClose, createCboxWithWrap } from '@syncfusion/ej2-grids';
import { parentsUntil, toogleCheckbox, fltrPrevent, customFilterOpen } from '@syncfusion/ej2-grids';
import { Query, DataManager, Predicate, Deferred } from '@syncfusion/ej2-data';
import { SortOrder, MenuItemModel, NodeKeyPressEventArgs, NodeClickEventArgs, NodeCheckEventArgs } from '@syncfusion/ej2-navigations';
import { TreeView } from '@syncfusion/ej2-navigations';
import { BeforeOpenEventArgs } from '@syncfusion/ej2-popups';
import { TextBox } from '@syncfusion/ej2-inputs';
import { completeAction, contentLoaded, beforeCheckboxRender, FilterCheckboxArgs, refreshCheckbox } from '../../spreadsheet/index';

/**
 * `Filter` module is used to handle the filter action in Spreadsheet.
 */
export class Filter {
    private parent: Spreadsheet;
    private filterRange: Map<number, { useFilterRange: boolean, range: number[], allowHeaderFilter?: boolean }>;
    private filterCollection: Map<number, PredicateModel[]>;
    private filterBtn: HTMLElement;
    private treeViewObj: TreeView;
    private treeViewEle: HTMLElement;
    private cBox: HTMLInputElement;

    /**
     * Constructor for filter module.
     *
     * @param {Spreadsheet} parent - Specifies the Spreadsheet.
     */
    constructor(parent: Spreadsheet) {
        this.parent = parent;
        this.filterCollection = new Map();
        this.filterRange = new Map();
        this.filterBtn = parent.createElement('div', {
            className: 'e-filter-btn e-control e-btn e-lib e-filter-iconbtn e-icon-btn' + (this.parent.enableRtl ? ' e-rtl' : '')
        });
        this.filterBtn.appendChild(parent.createElement('span', { className: 'e-btn-icon e-icons e-filter-icon' }));
        this.addEventListener();
    }

    /**
     * To destroy the filter module.
     *
     * @returns {void} - To destroy the filter module.
     */
    protected destroy(): void {
        this.removeEventListener();
        if ((this.parent as unknown as { refreshing?: boolean }).refreshing && this.filterRange.size) {
            this.parent.filterCollection = [];
            this.filterRange.forEach(
                (_value: { useFilterRange: boolean, range: number[], enableColumnHeaderFiltering?: boolean }, sheetIdx: number): void => {
                    this.setFilteredCollection({ sheetIdx: sheetIdx, saveJson: { filterCollection: this.parent.filterCollection } });
                }
            );
        }
        this.filterRange = null;
        this.filterCollection = null;
        if (this.filterBtn) { this.filterBtn.remove(); } this.filterBtn = null;
        if (this.treeViewObj) { this.treeViewObj.destroy(); } this.treeViewObj = null;
        if (this.treeViewEle) { this.treeViewEle.remove(); } this.treeViewEle = null;
        if (this.cBox) { this.cBox.remove(); this.cBox = null; }
        const filterPopupElement: NodeListOf<Element> = document.querySelectorAll('.e-filter-popup');
        if (filterPopupElement) {
            filterPopupElement.forEach(function (element: Element): void {
                element.remove();
            });
        }
        this.parent = null;
    }

    private addEventListener(): void {
        this.parent.on(filterRangeAlert, this.filterRangeAlertHandler, this);
        this.parent.on(initiateFilterUI, this.initiateFilterUIHandler, this);
        this.parent.on(mouseDown, this.filterMouseDownHandler, this);
        this.parent.on(renderFilterCell, this.renderFilterCellHandler, this);
        this.parent.on(refreshFilterRange, this.refreshFilterRange, this);
        this.parent.on(updateSortCollection, this.updateSortCollectionHandler, this);
        this.parent.on(beforeFltrcMenuOpen, this.beforeFilterMenuOpenHandler, this);
        this.parent.on(filterCmenuSelect, this.closeDialog, this);
        this.parent.on(reapplyFilter, this.reapplyFilterHandler, this);
        this.parent.on(filterByCellValue, this.filterByCellValueHandler, this);
        this.parent.on(clearFilter, this.clearFilterHandler, this);
        this.parent.on(getFilteredColumn, this.getFilteredColumnHandler, this);
        this.parent.on(cMenuBeforeOpen, this.cMenuBeforeOpenHandler, this);
        this.parent.on(filterCboxValue, this.filterCboxValueHandler, this);
        this.parent.on(getFilterRange, this.getFilterRangeHandler, this);
        this.parent.on(filterCellKeyDown, this.filterCellKeyDownHandler, this);
        this.parent.on(setFilteredCollection, this.setFilteredCollection, this);
        this.parent.on(contentLoaded, this.updateFilter, this);
        this.parent.on(beforeInsert, this.beforeInsertHandler, this);
        this.parent.on(beforeDelete, this.beforeDeleteHandler, this);
        this.parent.on(sheetsDestroyed, this.deleteSheetHandler, this);
        this.parent.on(clear, this.clearHandler, this);
        this.parent.on(filterDialogCreated, this.filterDialogCreatedHandler, this);
        this.parent.on(filterDialogClose, this.removeFilterClass, this);
        this.parent.on(duplicateSheetFilterHandler, this.duplicateSheetFilterHandler, this);
        this.parent.on(fltrPrevent, this.beforeFilteringHandler, this);
        this.parent.on(customFilterOpen, this.customFilterOpen, this);
        this.parent.on(moveSheetHandler, this.moveSheetHandler, this);
        this.parent.on(refreshFilterCellsOnResize, this.refreshFilterCellsOnResize, this);
    }

    private removeEventListener(): void {
        if (!this.parent.isDestroyed) {
            this.parent.off(filterRangeAlert, this.filterRangeAlertHandler);
            this.parent.off(initiateFilterUI, this.initiateFilterUIHandler);
            this.parent.off(mouseDown, this.filterMouseDownHandler);
            this.parent.off(renderFilterCell, this.renderFilterCellHandler);
            this.parent.off(refreshFilterRange, this.refreshFilterRange);
            this.parent.off(updateSortCollection, this.updateSortCollectionHandler);
            this.parent.off(beforeFltrcMenuOpen, this.beforeFilterMenuOpenHandler);
            this.parent.off(filterCmenuSelect, this.closeDialog);
            this.parent.off(reapplyFilter, this.reapplyFilterHandler);
            this.parent.off(filterByCellValue, this.filterByCellValueHandler);
            this.parent.off(clearFilter, this.clearFilterHandler);
            this.parent.off(getFilteredColumn, this.getFilteredColumnHandler);
            this.parent.off(cMenuBeforeOpen, this.cMenuBeforeOpenHandler);
            this.parent.off(filterCboxValue, this.filterCboxValueHandler);
            this.parent.off(getFilterRange, this.getFilterRangeHandler);
            this.parent.off(filterCellKeyDown, this.filterCellKeyDownHandler);
            this.parent.off(setFilteredCollection, this.setFilteredCollection);
            this.parent.off(contentLoaded, this.updateFilter);
            this.parent.off(beforeInsert, this.beforeInsertHandler);
            this.parent.off(beforeDelete, this.beforeDeleteHandler);
            this.parent.off(sheetsDestroyed, this.deleteSheetHandler);
            this.parent.off(clear, this.clearHandler);
            this.parent.off(filterDialogCreated, this.filterDialogCreatedHandler);
            this.parent.off(filterDialogClose, this.removeFilterClass);
            this.parent.off(duplicateSheetFilterHandler, this.duplicateSheetFilterHandler);
            this.parent.off(fltrPrevent, this.beforeFilteringHandler);
            this.parent.off(customFilterOpen, this.customFilterOpen);
            this.parent.off(moveSheetHandler, this.moveSheetHandler);
            this.parent.off(refreshFilterCellsOnResize, this.refreshFilterCellsOnResize);
        }
    }

    /**
     * Gets the module name.
     *
     * @returns {string} - Gets the module name.
     */
    protected getModuleName(): string {
        return 'filter';
    }

    /**
     * Validates the range and returns false when invalid.
     *
     * @param {SheetModel} sheet - Specify the sheet.
     * @param {string} range - Specify the range.
     * @returns {void} - Validates the range and returns false when invalid.
     */
    private isInValidFilterRange(sheet: SheetModel, range?: string): boolean {
        const selectedRange: number[] = range ? getSwapRange(getIndexesFromAddress(range)) :
            getSwapRange(getIndexesFromAddress(sheet.selectedRange));
        let isEmptySheet: boolean = false;
        if (sheet.usedRange.colIndex === 0 && sheet.usedRange.rowIndex === 0 && isNullOrUndefined(sheet.rows[sheet.usedRange.rowIndex])) {
            isEmptySheet = true; // For Filtering Empty sheet's A1 cell.
        }
        return selectedRange[0] > sheet.usedRange.rowIndex || selectedRange[1] > sheet.usedRange.colIndex || isEmptySheet;
    }

    /**
     * Shows the range error alert dialog.
     *
     * @param {any} args - Specifies the args
     * @param {string} args.error - range error string.
     * @returns {void} - Shows the range error alert dialog.
     */
    private filterRangeAlertHandler(args: { error: string }): void {
        const dialogInst: Dialog = (this.parent.serviceLocator.getService(dialog) as Dialog);
        dialogInst.show({
            content: args.error, isModal: true,
            height: 180, width: 400, showCloseIcon: true,
            beforeOpen: (args: BeforeOpenEventArgs): void => {
                const dlgArgs: DialogBeforeOpenEventArgs = {
                    dialogName: 'FilterRangeDialog',
                    element: args.element, target: args.target, cancel: args.cancel
                };
                this.parent.trigger('dialogBeforeOpen', dlgArgs);
                if (dlgArgs.cancel) {
                    args.cancel = true;
                } else {
                    focus(this.parent.element);
                }
            }
        });
        this.parent.hideSpinner();
    }

    /**
     * Triggers before filter context menu opened and used to add sorting items.
     *
     * @param {any} args - Specifies the args
     * @param {HTMLElement} args.element - Specify the element
     * @returns {void} - Triggers before filter context menu opened and used to add sorting items.
     */
    private beforeFilterMenuOpenHandler(args: { element: HTMLElement }): void {
        const l10n: L10n = this.parent.serviceLocator.getService(locale);
        args.element.classList.add('e-spreadsheet-contextmenu'); // to show sort icons
        const ul: Element = args.element.querySelector('ul');
        this.addMenuItem(ul, l10n.getConstant('SortDescending'), 'e-filter-sortdesc', 'e-sort-desc');
        this.addMenuItem(ul, l10n.getConstant('SortAscending'), 'e-filter-sortasc', 'e-sort-asc');
        args.element.appendChild(ul);
    }

    /**
     * Creates new menu item element
     *
     * @param {Element} ul - Specify the element.
     * @param {string} text - Specify the text.
     * @param {string} className - Specify the className
     * @param {string} iconCss - Specify the iconCss
     * @returns {void} - Creates new menu item element
     */
    private addMenuItem(ul: Element, text: string, className?: string, iconCss?: string): void {
        const li: HTMLElement = this.parent.createElement('li', { className: className + ' e-menu-item' });
        if (!this.parent.allowSorting) {
            li.classList.add('e-disabled');
        }
        li.innerText = text;
        li.insertBefore(this.parent.createElement('span', { className: 'e-menu-icon e-icons ' + iconCss }), li.firstChild);
        ul.insertBefore(li, ul.firstChild);
    }

    /**
     * Initiates the filter UI for the selected range.
     *
     * @param {any} args - Specifies the args
     * @param {PredicateModel[]} args.predicates - Specify the predicates.
     * @param {number} args.range - Specify the range.
     * @param {Promise<FilterEventArgs>} args.promise - Spefify the promise.
     * @param {number} args.sIdx - Specify the sIdx
     * @param {boolean} args.isCut - Specify the bool value
     * @param {boolean} args.isUndoRedo - Specify the bool value
     * @param {boolean} args.isInternal - Specify the isInternal.
     * @param {boolean} args.useFilterRange - Specify the use Filter Range.
     * @param {boolean} args.isOpen - Specify the isOpen.
     * @param {boolean} args.allowHeaderFilter - Specify the allow header filter.
     * @returns {void} - Initiates the filter UI for the selected range.
     */
    private initiateFilterUIHandler(
        args: { predicates?: PredicateModel[], range?: string, promise?: Promise<FilterEventArgs>, sIdx?: number, isCut?: boolean,
            isInternal?: boolean, useFilterRange?: boolean, isOpen?: boolean, allowHeaderFilter?: boolean }): void {
        const predicates: PredicateModel[] = args ? args.predicates : null;
        let sheetIdx: number = args.sIdx;
        if (!sheetIdx && sheetIdx !== 0) {
            sheetIdx = args.isOpen ? 0 : this.parent.activeSheetIndex;
        }
        let deferred: Deferred;
        if (args.promise) {
            deferred = new Deferred(); args.promise = deferred.promise;
        }
        const resolveFn: Function = (): void => {
            if (deferred) {
                deferred.resolve();
            }
        };
        const isInternal: boolean = args.isInternal || args.isCut;
        if (this.filterRange.size > 0 && this.filterRange.has(sheetIdx) && !this.parent.isOpen && !predicates) { //disable filter
            this.removeFilter(sheetIdx, isInternal, false);
            resolveFn();
            return;
        }
        const sheet: SheetModel = getSheet(this.parent  as Workbook, sheetIdx);
        if (this.isInValidFilterRange(sheet, args.range)) {
            const l10n: L10n = this.parent.serviceLocator.getService(locale);
            this.filterRangeAlertHandler({ error: l10n.getConstant('FilterOutOfRangeError') });
            resolveFn();
            return;
        }
        let selectedRange: string = args.range || sheet.selectedRange;
        let eventArgs: { range: string, filterOptions?: FilterOptions, predicates?: PredicateModel[], previousPredicates?: PredicateModel[],
            cancel: boolean, useFilterRange?: boolean, sheetIndex: number, allowHeaderFilter?: boolean };
        let actionArgs: { [key: string]: Object };
        if (!isInternal) {
            eventArgs = { range: selectedRange, sheetIndex: sheetIdx, cancel: false, allowHeaderFilter: false };
            if (args.predicates) {
                eventArgs.predicates = args.predicates;
                eventArgs.previousPredicates = this.filterCollection.get(sheetIdx) && [].slice.call(this.filterCollection.get(sheetIdx));
            } else {
                eventArgs.filterOptions = { predicates: args.predicates as Predicate[] };
            }
            eventArgs.useFilterRange = false;
            actionArgs = { action: 'filter', eventArgs: eventArgs };
            this.parent.notify(beginAction, actionArgs);
            if (eventArgs.cancel) {
                resolveFn();
                return;
            }
            delete eventArgs.cancel;
            args.useFilterRange = eventArgs.useFilterRange;
            args.allowHeaderFilter = eventArgs.allowHeaderFilter;
        }
        if (!args.range && (isInternal || selectedRange === eventArgs.range)) {
            let rangeIdx: number[] = getRangeIndexes(selectedRange);
            if (rangeIdx[0] === rangeIdx[2] && rangeIdx[1] === rangeIdx[3]) {
                rangeIdx = getDataRange(rangeIdx[0], rangeIdx[1], sheet);
                selectedRange = getRangeAddress(rangeIdx);
                if (!isInternal) {
                    eventArgs.range = selectedRange;
                }
            }
        } else if (!isInternal) {
            selectedRange = eventArgs.range;
        }
        if (predicates) {
            if (predicates.length) {
                const filterRange: { useFilterRange: boolean, range: number[], allowHeaderFilter?: boolean } =
                    this.filterRange.get(sheetIdx);
                if (filterRange) {
                    args.useFilterRange = filterRange.useFilterRange;
                    args.allowHeaderFilter = filterRange.allowHeaderFilter;
                }
                this.processRange(sheet, sheetIdx, selectedRange, true, args.useFilterRange, args.allowHeaderFilter);
                const range: number[] = this.filterRange.get(sheetIdx).range.slice();
                if (!args.allowHeaderFilter) {
                    range[0] = range[0] + 1; // to skip first row.
                }
                if (!args.useFilterRange) {
                    range[2] = sheet.usedRange.rowIndex; //filter range should be till used range.
                }
                range[1] = range[3] = getColIndex(predicates[0].field);
                const addr: string = `${sheet.name}!${this.getPredicateRange(range, predicates.slice(1, predicates.length))}`;
                const fullAddr: string = getRangeAddress(range);
                getData(
                    this.parent, addr, true, true, null, true, null, null, false, fullAddr).then(
                    (jsonData: { [key: string]: CellModel }[]) => {
                        this.filterSuccessHandler(
                            new DataManager(jsonData),
                            { action: 'filtering', filterCollection: predicates, field: predicates[0].field, sIdx: args.sIdx,
                                isInternal: isInternal, isOpen: args.isOpen, prevPredicates: eventArgs && eventArgs.previousPredicates });
                        resolveFn();
                    });
                return;
            } else {
                this.clearFilterHandler({ sheetIndex: sheetIdx });
                resolveFn();
            }
        } else {
            this.processRange(sheet, sheetIdx, selectedRange, false, args.useFilterRange, args.allowHeaderFilter);
            resolveFn();
        }
        if (!isInternal) {
            this.parent.notify(completeAction, actionArgs);
            focus(this.parent.element);
        }
    }

    /**
     * Processes the range if no filter applied.
     *
     * @param {SheetModel} sheet - Specify the sheet.
     * @param {number} sheetIdx - Specify the sheet index.
     * @param {string} filterRange - Specify the filterRange.
     * @param {boolean} preventRefresh - To prevent refreshing the filter buttons.
     * @param {boolean} useFilterRange - Specifies whether to consider filtering range or used range during filering.
     * @param {boolean} allowHeaderFilter - Specifies whether to consider first row during filtering.
     * @returns {void} - Processes the range if no filter applied.
     */
    private processRange(
        sheet: SheetModel, sheetIdx: number, filterRange?: string, preventRefresh?: boolean, useFilterRange?: boolean,
        allowHeaderFilter?: boolean): void {
        const range: number[] = getSwapRange(getIndexesFromAddress(filterRange || sheet.selectedRange));
        if (range[0] === range[2] && range[1] === range[3]) { //if selected range is a single cell
            range[0] = 0; range[1] = 0; range[2] = sheet.usedRange.rowIndex; range[3] = sheet.usedRange.colIndex;
        } else if (range[3] > sheet.usedRange.colIndex) {
            range[3] = sheet.usedRange.colIndex;
        }
        const filterOption: { useFilterRange: boolean, range: number[], allowHeaderFilter?: boolean } = { useFilterRange: useFilterRange,
            range: range };
        if (allowHeaderFilter) {
            filterOption.allowHeaderFilter = allowHeaderFilter;
        }
        this.filterRange.set(sheetIdx, filterOption);
        this.filterCollection.set(sheetIdx, []);
        if (!preventRefresh) {
            this.refreshFilterRange(range, false, sheetIdx);
        }
    }

    /**
     * Removes all the filter related collections for the active sheet.
     *
     * @param {number} sheetIdx - Specify the sheet index.
     * @param {boolean} isCut - Specify the bool value.
     * @param {boolean} preventRefresh - Specify the preventRefresh.
     * @param {boolean} clearAction - Specify the current action is clear or not.
     * @returns {void} - Removes all the filter related collections for the active sheet.
     */
    private removeFilter(sheetIdx: number, isCut?: boolean, preventRefresh?: boolean, clearAction?: boolean): void {
        const filterOption: { range: number[], allowHeaderFilter?: boolean } = this.filterRange.get(sheetIdx);
        const range: number[] = filterOption.range.slice();
        const allowHeaderFilter: boolean = filterOption.allowHeaderFilter;
        const rangeAddr: string = getRangeAddress(range);
        let args: { [key: string]: Object };
        if (!isCut) {
            args = { action: 'filter', eventArgs: { range: rangeAddr, sheetIndex: sheetIdx, cancel: false }, isClearAction: clearAction };
            this.parent.notify(beginAction, args);
            if ((args.eventArgs as { cancel: boolean }).cancel) {
                return;
            }
            delete (args.eventArgs as { cancel: boolean }).cancel;
        }
        if (this.filterCollection.get(sheetIdx).length || preventRefresh) {
            if (this.filterCollection.get(sheetIdx).length && (clearAction && !isCut)) {
                const newArgs: { [key: string]: Object } = {
                    action: 'filter',
                    eventArgs: {
                        range: rangeAddr, sheetIndex: sheetIdx, predicates: [], previousPredicates: this.filterCollection.get(sheetIdx)
                    }, isClearAction: clearAction
                };
                this.parent.notify(completeAction, newArgs);
            }
            this.clearFilterHandler({ preventRefresh: preventRefresh, sheetIndex: sheetIdx });
        }
        this.filterRange.delete(sheetIdx);
        this.filterCollection.delete(sheetIdx);
        this.refreshFilterRange(range, true, sheetIdx, allowHeaderFilter);
        if (!isCut) {
            this.parent.notify(completeAction, args);
        }
    }
    /**
     * Handles filtering cell value based on context menu.
     *
     * @returns {void} - Handles filtering cell value based on context menu.
     */
    private filterByCellValueHandler(): void {
        const sheetIdx: number = this.parent.activeSheetIndex;
        const sheet: SheetModel = this.parent.getActiveSheet();
        if (this.isInValidFilterRange(sheet)) {
            const l10n: L10n = this.parent.serviceLocator.getService(locale);
            this.filterRangeAlertHandler({ error: l10n.getConstant('FilterOutOfRangeError') });
            return;
        }
        const cell: number[] = getRangeIndexes(sheet.activeCell); let isNotFilterRange: boolean;
        if (!this.isFilterRange(sheetIdx, cell[0], cell[1])) {
            isNotFilterRange = true;
            this.processRange(sheet, sheetIdx);
        }
        const filterOption: { range: number[], allowHeaderFilter?: boolean } = this.filterRange.get(sheetIdx);
        const range: number[] = filterOption.range.slice();
        const filterRange: string = getRangeAddress(range);
        range[0] = range[0] + 1; // to skip first row.
        range[2] = sheet.usedRange.rowIndex; //filter range should be till used range.
        range[1] = range[3] = cell[1];
        const field: string = getColumnHeaderText(cell[1] + 1);
        const selectedCell: CellModel = getCell(cell[0], cell[1], sheet);
        const cellVal: string | number | Date = getValueFromFormat(this.parent, selectedCell, cell[0], cell[1], sheetIdx);
        const predicates: ExtendedPredicateModel[] = [{ field: field, operator: 'equal', type: this.getColumnType(sheet, cell[1], cell).type,
            matchCase: false, value: cellVal }];
        let prevPredicates: PredicateModel[] = [].slice.call(this.filterCollection.get(sheetIdx));
        if (!prevPredicates.length) {
            prevPredicates = undefined;
        }
        const eventArgs: { range: string, predicates: PredicateModel[], previousPredicates: PredicateModel[], sheetIndex: number,
            cancel: boolean, allowHeaderFilter?: boolean } = { range: filterRange, predicates: predicates,
            previousPredicates: prevPredicates, sheetIndex: sheetIdx, cancel: false, allowHeaderFilter: false };
        this.parent.notify(beginAction, { action: 'filter', eventArgs: eventArgs });
        if (eventArgs.cancel) {
            if (isNotFilterRange) {
                this.removeFilter(sheetIdx, true);
            }
            return;
        }
        if (eventArgs.allowHeaderFilter) {
            filterOption.allowHeaderFilter = eventArgs.allowHeaderFilter;
            range[0]--;
        }
        const addr: string = `${sheet.name}!${this.getPredicateRange(range, this.filterCollection.get(sheetIdx))}`;
        const fullAddr: string = getRangeAddress(range);
        getData(this.parent, addr, true, true, null, true, null, null, false, fullAddr).then((jsonData: { [key: string]: CellModel }[]) => {
            this.filterSuccessHandler(
                new DataManager(jsonData), { action: 'filtering', filterCollection: predicates, field: field, isFilterByValue: true });
        });
    }

    /**
     * Creates filter buttons and renders the filter applied cells.
     *
     * @param { any} args - Specifies the args
     * @param { HTMLElement} args.td - specify the element
     * @param { number} args.rowIndex - specify the rowIndex
     * @param { number} args.colIndex - specify the colIndex
     * @param { number} args.sIdx - specify the sIdx
     * @param { boolean} args.isAction - specify the apply filter action.
     * @returns {void} - Creates filter buttons and renders the filter applied cells.
     */
    private renderFilterCellHandler(
        args: { td: HTMLElement, rowIndex: number, colIndex: number, sIdx?: number, isAction?: boolean }): void {
        const sheetIdx: number = !isNullOrUndefined(args.sIdx) ? args.sIdx : this.parent.activeSheetIndex;
        if (sheetIdx === this.parent.activeSheetIndex) {
            const option: { range?: number[], allowHeaderFilter?: boolean } = this.filterRange.get(sheetIdx) &&
                this.filterRange.get(sheetIdx);
            const range: number[] = option && option.range;
            if (range && (range[0] === args.rowIndex || option.allowHeaderFilter) && range[1] <= args.colIndex &&
                range[3] >= args.colIndex) {
                if (!args.td || args.td.classList.contains(option.allowHeaderFilter ? 'e-cell' : 'e-header-cell')) {
                    return;
                }
                let filterButton: HTMLElement = args.td.querySelector('.e-filter-icon');
                let filterSortCls: string = '';
                const sortCollection: SortCollectionModel[] = this.parent.sortCollection;
                const field: string = getColumnHeaderText(args.colIndex + 1);
                const predicates: { field?: string }[] = this.filterCollection.get(sheetIdx);
                for (let i: number = 0; i < predicates.length; i++) {
                    if (predicates[i as number].field === field) {
                        filterSortCls = ' e-filtered';
                        break;
                    }
                }
                if (sortCollection) {
                    for (let i: number = 0; i < sortCollection.length; i++) {
                        if (sortCollection[i as number].sheetIndex === sheetIdx &&
                            sortCollection[i as number].columnIndex === args.colIndex) {
                            filterSortCls += sortCollection[i as number].order === 'Ascending' ? ' e-sortasc-filter' : ' e-sortdesc-filter';
                            break;
                        }
                    }
                }
                if (filterButton) {
                    filterButton.className = `e-btn-icon e-icons e-filter-icon${filterSortCls}`;
                } else {
                    let isNoteAvailable: boolean = false;
                    filterButton = this.filterBtn.cloneNode(true) as HTMLElement;
                    if (args.td.children.length > 0 && args.td.children[args.td.childElementCount - 1].className.indexOf('e-addNoteIndicator') > -1) {
                        args.td.removeChild(args.td.children[args.td.childElementCount - 1]);
                        isNoteAvailable = true;
                    }
                    filterButton.firstElementChild.className = `e-btn-icon e-icons e-filter-icon${filterSortCls}`;
                    args.td.insertBefore(filterButton, args.td.firstChild);
                    if (args.isAction) {
                        const sheet: SheetModel = getSheet(this.parent, sheetIdx);
                        if (getCell(args.rowIndex, args.colIndex, sheet, false, true).wrap) {
                            this.parent.notify(
                                updateWrapCell, { rowIdx: args.rowIndex, colIdx: args.colIndex, sheet: sheet, ele: args.td });
                        }
                    }
                    if (isNoteAvailable) {
                        this.parent.notify(createNoteIndicator,
                                           {targetElement: args.td, rowIndex: args.rowIndex, columnIndex: args.colIndex});
                    }
                }
            }
        }
    }

    /**
     * Refreshes the filter header range.
     *
     * @param {number[]} filterRange - Specify the filterRange.
     * @param {boolean} remove - Specify the bool value
     * @param {number} sIdx - Specify the index.
     * @param {boolean} allowHeaderFilter - Specifies whether to consider first row during filtering.
     * @returns {void} - Refreshes the filter header range.
     */
    private refreshFilterRange(filterRange?: number[], remove?: boolean, sIdx?: number, allowHeaderFilter?: boolean): void {
        let sheetIdx: number = sIdx;
        if (!sheetIdx && sheetIdx !== 0) {
            sheetIdx = this.parent.activeSheetIndex;
        }
        const filterOption: { range: number[], allowHeaderFilter?: boolean } = this.filterRange && this.filterRange.get(sheetIdx);
        if (!filterOption) {
            if (!filterRange) {
                filterRange = [0, 0, 0, 0];
            }
        } else {
            filterRange = filterRange || filterOption.range.slice();
            allowHeaderFilter = filterOption.allowHeaderFilter;
        }
        const range: number[] = filterRange;
        let cell: HTMLElement;
        const sheet: SheetModel = getSheet(this.parent, sheetIdx);
        const frozenCol: number = this.parent.frozenColCount(sheet);
        for (let index: number = range[1]; index <= range[3]; index++) {
            if (allowHeaderFilter) {
                const table: HTMLTableElement = index < frozenCol ? this.parent.sheetModule.getSelectAllTable() :
                    this.parent.getColHeaderTable();
                const headerRow: HTMLTableRowElement = table && this.parent.getRow(0, table);
                cell = headerRow && this.parent.getCell(0, index, headerRow);
            } else {
                if (!isHiddenRow(sheet, range[0])) {
                    cell = this.parent.getCell(range[0], index);
                } else {
                    cell = null;
                }
            }
            if (remove) {
                if (cell) {
                    const filterBtn: Element = cell.querySelector('.e-filter-btn');
                    if (filterBtn) {
                        let isNoteAvailable: boolean = false;
                        if (cell.children.length > 0 && cell.children[cell.childElementCount - 1].className.indexOf('e-addNoteIndicator') > -1) {
                            cell.removeChild(cell.children[cell.childElementCount - 1]);
                            isNoteAvailable = true;
                        }
                        filterBtn.parentElement.removeChild(filterBtn);
                        if (isNoteAvailable) {
                            this.parent.notify(createNoteIndicator, {targetElement: cell, rowIndex: range[0], columnIndex: index});
                        }
                    }
                }
            } else {
                this.renderFilterCellHandler({ td: cell, rowIndex: range[0], colIndex: index, sIdx: sheetIdx, isAction: true });
            }
        }
        if (this.parent.sortCollection) {
            this.parent.notify(sortImport, null);
        }
    }

    /**
     * Checks whether the provided cell is a filter cell.
     *
     * @param {number} sheetIdx - Specify the sheet index.
     * @param {number} rowIndex - Specify the row index
     * @param {number} colIndex - Specify the col index.
     * @returns {boolean} - Checks whether the provided cell is a filter cell.
     */
    private isFilterCell(sheetIdx: number, rowIndex: number, colIndex: number): boolean {
        const range: number[] = this.filterRange.has(sheetIdx) && this.filterRange.get(sheetIdx).range;
        return (range && range[0] === rowIndex && range[1] <= colIndex && range[3] >= colIndex);
    }

    /**
     * Checks whether the provided cell is in a filter range
     *
     * @param {number} sheetIdx - Specify the sheet index.
     * @param {number} rowIndex - Specify the row index
     * @param {number} colIndex - Specify the col index.
     * @returns {boolean} - Checks whether the provided cell is in a filter range
     */
    private isFilterRange(sheetIdx: number, rowIndex: number, colIndex: number): boolean {
        const range: number[] = this.filterRange.get(sheetIdx) && this.filterRange.get(sheetIdx).range;
        return (range && range[0] <= rowIndex && range[2] >= rowIndex && range[1] <= colIndex && range[3] >= colIndex);
    }

    /**
     * Gets the filter information from active cell
     *
     * @param {any} args - Specifies the args
     * @param {string} args.field - Specify the field
     * @param {string} args.clearFilterText - Specify the clearFilterText
     * @param {boolean} args.isFiltered - Specify the isFiltered
     * @param {boolean} args.isClearAll - Specify the isClearAll
     * @param {number} args.sheetIndex - Specify the sheet index value.
     * @returns {void} - Triggers before context menu created to enable or disable items.
     */
    private getFilteredColumnHandler(args: {
        field?: string, clearFilterText?: string, isFiltered?: boolean, isClearAll?: boolean, sheetIndex?: number
    }): void {
        const sheetIdx: number = isUndefined(args.sheetIndex) ? this.parent.activeSheetIndex : args.sheetIndex;
        const l10n: L10n = this.parent.serviceLocator.getService(locale);
        args.clearFilterText = l10n.getConstant('ClearFilter');
        if (this.filterRange.has(sheetIdx)) {
            const filterCollection: PredicateModel[] = this.filterCollection.get(sheetIdx);
            if (args.isClearAll) {
                args.isFiltered = filterCollection && filterCollection.length > 0;
                return;
            }
            const range: number[] = this.filterRange.get(sheetIdx).range.slice();
            const sheet: SheetModel = getSheet(this.parent, sheetIdx);
            const cell: number[] = getCellIndexes(sheet.activeCell);
            if (this.isFilterRange(sheetIdx, cell[0], cell[1])) {
                args.field = getColumnHeaderText(cell[1] + 1);
                const headerCell: CellModel = getCell(range[0], cell[1], sheet);
                const cellValue: string = this.parent.getDisplayText(headerCell);
                args.clearFilterText = l10n.getConstant('ClearFilterFrom') + '"'
                + (cellValue ? cellValue.toString() : 'Column ' + args.field) + '"';
                filterCollection.some((value: PredicateModel) => {
                    args.isFiltered = value.field === args.field;
                    return args.isFiltered;
                });
            }
        }
    }

    /**
     * Triggers before context menu created to enable or disable items.
     *
     * @param {any} e - Specifies the args
     * @param {HTMLElement} e.element - Specify the element
     * @param {MenuItemModel[]} e.items - Specify the items
     * @param {MenuItemModel} e.parentItem - Specify the parentItem
     * @param {string} e.target - Specify the target
     * @returns {void} - Triggers before context menu created to enable or disable items.
     */
    private cMenuBeforeOpenHandler(e: { element: HTMLElement, items: MenuItemModel[], parentItem: MenuItemModel, target: string }): void {
        const id: string = this.parent.element.id + '_cmenu';
        if (e.parentItem && e.parentItem.id === id + '_filter' && e.target === '') {
            const args: { [key: string]: boolean } = { isFiltered: false };
            this.getFilteredColumnHandler(args);
            this.parent.enableContextMenuItems([id + '_clearfilter', id + '_reapplyfilter'], !!args.isFiltered, true);
        }
    }

    /**
     * Closes the filter popup.
     *
     * @returns {void} - Closes the filter popup.
     */
    private closeDialog(): void {
        const filterPopup: HTMLElement = document.querySelector('.e-filter-popup');
        if (filterPopup && filterPopup.id.includes(this.parent.element.id)) {
            const excelFilter: Dialog = getComponent(filterPopup, 'dialog');
            EventHandler.remove(filterPopup, getStartEvent(), this.filterMouseDownHandler);
            if (excelFilter) {
                excelFilter.hide();
            }
            this.parent.notify(filterDialogClose, null);
        }
    }

    private removeFilterClass(): void {
        if (this.parent.element.style.position === 'relative') {
            this.parent.element.style.position = '';
        }
        if (this.parent.element.classList.contains('e-filter-open')) {
            this.parent.element.classList.remove('e-filter-open');
        }
    }

    /**
     * Returns true if the filter popup is opened.
     *
     * @returns {boolean} - Returns true if the filter popup is opened.
     */
    private isPopupOpened(): boolean {
        const filterPopup: HTMLElement = document.getElementsByClassName('e-filter-popup')[0] as HTMLElement;
        return filterPopup && filterPopup.id.includes(this.parent.element.id) && filterPopup.style.display !== 'none';
    }

    private filterCellKeyDownHandler(args: { isFilterCell: boolean, closePopup?: boolean }): void {
        const sheet: SheetModel = this.parent.getActiveSheet();
        const indexes: number[] = getCellIndexes(sheet.activeCell);
        if (this.isFilterCell(this.parent.activeSheetIndex, indexes[0], indexes[1])) {
            if (args.closePopup) {
                this.closeDialog();
            } else {
                args.isFilterCell = true;
                if (!this.isPopupOpened()) {
                    const target: HTMLElement = this.parent.getCell(indexes[0], indexes[1]);
                    if (target) {
                        this.openDialog(target);
                    }
                }
            }
        }
    }

    private filterMouseDownHandler(e: MouseEvent & TouchEvent): void {
        if ((Browser.isDevice && e.type === 'mousedown') || this.parent.getActiveSheet().isProtected) {
            return;
        }
        const target: HTMLElement = e.target as HTMLElement;
        if (target.classList.contains('e-filter-icon') || target.classList.contains('e-filter-btn')) {
            if (Browser.isDevice && isTouchStart(e)) {
                e.preventDefault();
            }
            if (this.isPopupOpened()) {
                this.closeDialog();
            }
            this.openDialog((parentsUntil(target, 'e-cell') || parentsUntil(target, 'e-header-cell')) as HTMLElement);
        } else if (this.isPopupOpened()) {
            const offsetEle: Element = target.offsetParent;
            if (!target.classList.contains('e-searchinput') && !target.classList.contains('e-searchclear') && (offsetEle &&
                !offsetEle.classList.contains('e-filter-popup') && !offsetEle.classList.contains('e-text-content') &&
                !offsetEle.classList.contains('e-checkboxtree') && !offsetEle.classList.contains('e-checkbox-wrapper'))) {
                this.closeDialog();
            } else {
                this.selectSortItemHandler(target);
            }
        }
    }

    private cboxListSelected(
        args: FilterCheckboxArgs, selectedList: string[], listCount: number, e: MouseEvent, searched?: boolean): boolean {
        const wrapper: Element = parentsUntil(<Element>e.target, 'e-ftrchk');
        if (wrapper) {
            const addCurCbox: Element = searched && wrapper.querySelector('.e-add-current');
            if (addCurCbox) {
                if (addCurCbox.classList.contains('e-check')) {
                    classList(addCurCbox, ['e-uncheck'], ['e-check']);
                    if (!selectedList.length) {
                        (args.btnObj.element as HTMLButtonElement).disabled = true;
                    }
                    return false;
                } else {
                    classList(addCurCbox, ['e-check'], ['e-uncheck']);
                    (args.btnObj.element as HTMLButtonElement).disabled = false;
                    return true;
                }
            }
            let selectAll: Element = wrapper.querySelector('.e-selectall');
            if (selectAll) {
                (wrapper.querySelector('.e-chk-hidden') as HTMLInputElement).indeterminate = false;
                const uncheck: boolean = wrapper.querySelector('.e-frame').classList.contains('e-check');
                let checkBoxFrame: Element; let text: string;
                for (let idx: number = searched ? 2 : 1, len: number = args.element.childElementCount; idx < len; idx++) {
                    checkBoxFrame = args.element.children[idx as number].querySelector('.e-frame');
                    removeClass([checkBoxFrame], ['e-check', 'e-stop', 'e-uncheck']);
                    if (uncheck) {
                        (<HTMLInputElement>args.element.children[idx as number].querySelector('.e-chk-hidden')).checked = false;
                        checkBoxFrame.classList.add('e-uncheck');
                        selectedList.splice(0, 1);
                    } else {
                        (<HTMLInputElement>args.element.children[idx as number].querySelector('.e-chk-hidden')).checked = true;
                        checkBoxFrame.classList.add('e-check');
                        text = args.element.children[idx as number].querySelector('.e-checkboxfiltertext').textContent;
                        if (selectedList.indexOf(text) === -1) {
                            selectedList.push(text);
                        }
                    }
                }
            } else {
                const text: string = wrapper.querySelector('.e-checkboxfiltertext').textContent;
                if (wrapper.querySelector('.e-frame').classList.contains('e-check')) {
                    selectedList.splice(selectedList.indexOf(text), 1);
                } else {
                    selectedList.push(text);
                }
                toogleCheckbox(wrapper);
                selectAll = args.element.querySelector('.e-selectall');
            }
            this.updateState(
                args, selectAll, selectAll.parentElement.querySelector('.e-chk-hidden') as HTMLInputElement,
                selectedList.length !== listCount, selectedList.length);
        }
        return null;
    }

    private initCboxList(args: FilterCheckboxArgs, excelFilter: ExcelFilterBase, filterData: { [key: string]: Object }[]): void {
        const field: string = args.column.field;
        const sortedData: { [key: string]: string }[] = new DataManager(
            args.dataSource).executeLocal(new Query().sortBy(field + '_value', 'ascending')) as { [key: string]: string }[];
        const listData: string[] = [];
        const sheet: SheetModel = this.parent.getActiveSheet();
        const l10n: L10n = this.parent.serviceLocator.getService(locale);
        let cBoxFrag: DocumentFragment = document.createDocumentFragment();
        const selectAll: Element = this.createSelectAll(args, excelFilter);
        cBoxFrag.appendChild(selectAll);
        let idCol: { [key: string]: boolean } = {}; let hidden: boolean;
        let initSelectedList: string[] = [];
        let selectedList: string[] = []; let dataVal: string;
        sortedData.forEach((data: { [key: string]: string }): void => {
            if (data[field as string] === '') {
                if (!idCol['isBlank']) {
                    idCol['isBlank'] = true;
                    const blankObj: { [key: string]: string } = {};
                    blankObj[field as string] = l10n.getConstant('Blanks');
                    hidden = isFilterHidden(sheet, Number(data['__rowIndex']) - 1);
                    const blankCbox: Element = createCboxWithWrap(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        getUid('cbox'), (excelFilter as any).createCheckbox(blankObj[field as string], !hidden, blankObj), 'e-ftrchk');
                    if (cBoxFrag.childElementCount === 1) {
                        cBoxFrag.appendChild(blankCbox);
                    } else {
                        cBoxFrag.insertBefore(blankCbox, cBoxFrag.children[1]);
                    }
                    listData.splice(0, 0, blankObj[field as string]);
                    if (!hidden) {
                        initSelectedList.push(blankObj[field as string]);
                        selectedList.push(blankObj[field as string]);
                    }
                }
            } else if (!idCol[data[field as string]]) {
                idCol[data[field as string]] = true;
                hidden = isFilterHidden(sheet, Number(data['__rowIndex']) - 1);
                dataVal = data[field as string];
                cBoxFrag.appendChild(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    createCboxWithWrap(getUid('cbox'), (excelFilter as any).createCheckbox(dataVal, !hidden, data), 'e-ftrchk'));
                listData.push(dataVal);
                if (!hidden) {
                    initSelectedList.push(dataVal);
                    selectedList.push(dataVal);
                }
            }
        });
        args.element.appendChild(cBoxFrag);
        const cBoxFrame: Element = selectAll.querySelector('.e-frame');
        cBoxFrame.classList.add('e-selectall');
        const cBox: HTMLInputElement = selectAll.querySelector('.e-chk-hidden') as HTMLInputElement;
        this.updateState(args, cBoxFrame, cBox, selectedList.length !== listData.length, selectedList.length);
        const mainCboxList: Element[] = [].slice.call(args.element.childNodes);
        let searchedSelectedList: string[]; let searchedList: string[]; let addCurCboxSelected: boolean;
        args.element.addEventListener('click', (e: MouseEvent): void => {
            if (searchedSelectedList) {
                const isCurSelect: boolean = this.cboxListSelected(args, searchedSelectedList, args.element.childElementCount - 2, e, true);
                if (isCurSelect !== null) {
                    addCurCboxSelected = isCurSelect;
                }
            } else {
                this.cboxListSelected(args, selectedList, listData.length, e);
            }
        });
        let sortedFullData: { [key: string]: Object }[];
        let searchValue: string;
        const updateSearchedList: (val: string) => void = (val: string): void => {
            if (val.toLowerCase().includes(searchValue)) {
                const obj: { [key: string]: string } = {};
                obj[args.column.field] = val;
                cBoxFrag.appendChild(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    createCboxWithWrap(getUid('cbox'), (excelFilter as any).createCheckbox(val, true, obj), 'e-ftrchk'));
                searchedList.push(val);
                searchedSelectedList.push(val);
            }
        };
        let performSearchOnData: () => void;
        const filterDataCount: number = args.dataSource.length > 1000 ? args.dataSource.length : 1000;
        let fullListData: string[] = listData;
        if (filterData.length <= filterDataCount) {
            performSearchOnData = (): void => {
                listData.forEach((val: string): void => {
                    updateSearchedList(val);
                });
            };
        } else {
            performSearchOnData = (): void => {
                if (!sortedFullData) {
                    fullListData = []; initSelectedList = []; selectedList = [];
                    sortedFullData = new DataManager(
                        filterData).executeLocal(new Query().sortBy(field + '_value', 'ascending')) as { [key: string]: string }[];
                    idCol = {};
                    sortedFullData.forEach((data: { [key: string]: string }): void => {
                        if (data[field as string] === '') {
                            if (!idCol['isBlank']) {
                                idCol['isBlank'] = true;
                                dataVal = l10n.getConstant('Blanks');
                                fullListData.splice(0, 0, dataVal);
                                if (!isFilterHidden(sheet, Number(data['__rowIndex']) - 1)) {
                                    initSelectedList.push(dataVal);
                                    selectedList.push(dataVal);
                                }
                            }
                        } else if (!idCol[data[field as string]]) {
                            dataVal = data[field as string];
                            idCol[dataVal as string] = true;
                            fullListData.push(data[field as string]);
                            if (!isFilterHidden(sheet, Number(data['__rowIndex']) - 1)) {
                                selectedList.push(dataVal);
                                initSelectedList.push(dataVal);
                            }
                        }
                    });
                }
                for (let filterIdx: number = 0, len: number = fullListData.length; filterIdx < len; filterIdx++) {
                    if (searchedList.length < filterDataCount) {
                        updateSearchedList(fullListData[filterIdx as number]);
                    } else {
                        break;
                    }
                }
            };
        }
        const refreshCheckbox: Function = (e: { event: KeyboardEvent }): void => {
            if (e.event.type === 'keyup') {
                searchValue = (e.event.target as HTMLInputElement).value.toLowerCase();
            } else if ((e.event.target as Element).classList.contains('e-search-icon')) {
                return;
            }
            cBoxFrag = document.createDocumentFragment();
            cBoxFrag.appendChild(selectAll);
            if (searchValue) {
                searchedList = []; searchedSelectedList = [];
                performSearchOnData();
                if (searchedSelectedList.length) {
                    this.updateState(args, cBoxFrame, cBox, false, 0);
                    selectAll.classList.remove('e-hide');
                    const obj: { [key: string]: string } = {};
                    obj[field as string] = l10n.getConstant('AddCurrentSelection');
                    const addCurrentCbox: Element = createCboxWithWrap(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        getUid('cbox'), (excelFilter as any).createCheckbox(obj[field as string], false, obj), 'e-ftrchk');
                    cBoxFrag.insertBefore(addCurrentCbox, cBoxFrag.children[1]);
                    addCurrentCbox.querySelector('.e-frame').classList.add('e-add-current');
                } else {
                    selectAll.classList.add('e-hide');
                    const noRecordEle: Element = this.parent.createElement('div', { className: 'e-checkfltrnmdiv' });
                    const noRecordText: HTMLElement = this.parent.createElement('span');
                    noRecordText.innerText = l10n.getConstant('NoResult');
                    noRecordEle.appendChild(noRecordText);
                    cBoxFrag.appendChild(noRecordEle);
                    (args.btnObj.element as HTMLButtonElement).disabled = true;
                }
            } else if (mainCboxList) {
                searchedSelectedList = null; searchedList = null;
                this.updateState(args, cBoxFrame, cBox, selectedList.length !== listData.length, selectedList.length);
                selectAll.classList.remove('e-hide');
                mainCboxList.forEach((element: Element): void => {
                    cBoxFrag.appendChild(element);
                });
            }
            args.element.innerHTML = '';
            args.element.appendChild(cBoxFrag);
        };
        const applyBtnClickHandler: Function = (): void => {
            if (searchedList) {
                if (addCurCboxSelected) {
                    let text: string; let index: number;
                    selectedList = initSelectedList;
                    for (let idx: number = 0, len: number = searchedList.length; idx < len; idx++) {
                        text = searchedList[idx as number];
                        if (searchedList.length === searchedSelectedList.length || searchedSelectedList.indexOf(text) > -1) {
                            if (selectedList.indexOf(text) === -1) {
                                selectedList.push(text);
                            }
                        } else {
                            index = selectedList.indexOf(text);
                            if (index > -1) {
                                selectedList.splice(index, 1);
                            }
                        }
                    }
                } else {
                    selectedList = searchedSelectedList;
                }
            }
            const checkedLength: number = selectedList.length;
            if (checkedLength === listData.length && (!searchedSelectedList || filterData.length <= filterDataCount)) {
                this.filterSuccessHandler(new DataManager(args.dataSource), { action: 'clear-filter', field: args.column.field });
            } else {
                const predicates: PredicateModel[] = [];
                const model: ExtendedPredicateModel = { field: field, ignoreAccent: false, matchCase: false, isFilterByMenu: true };
                const localeObj: LocaleNumericSettings = getNumericObject(this.parent.locale) as LocaleNumericSettings;
                const updatePredicate: Function = (val: string): void => {
                    let type: string = args.type;
                    if (type === 'number') {
                        if (val === l10n.getConstant('Blanks')) {
                            val = ''; type = 'string';
                        } else if (!isNumber(parseLocaleNumber([val], this.parent, localeObj)[0])) {
                            type = 'string';
                        }
                    }
                    predicates.push(Object.assign({ value: val, type: type }, model));
                };
                if (checkedLength > fullListData.length / 2) {
                    model.operator = 'notequal'; model.predicate = 'and';
                    for (let idx: number = 0, len: number = fullListData.length; idx < len; idx++) {
                        if (selectedList.indexOf(fullListData[idx as number]) === -1) {
                            updatePredicate(fullListData[idx as number]);
                        }
                    }
                } else {
                    model.operator = 'equal'; model.predicate = 'or';
                    for (let idx: number = 0, len: number = checkedLength; idx < len; idx++) {
                        updatePredicate(selectedList[idx as number]);
                    }
                }
                excelFilter.initiateFilter(predicates);
            }
        };
        this.wireFilterEvents(args, applyBtnClickHandler, refreshCheckbox.bind(this));
    }

    private createSelectAll(args: FilterCheckboxArgs, excelFilter: ExcelFilterBase): Element {
        const selectAllObj: { [key: string]: Object } = {};
        selectAllObj[args.column.field] = this.parent.serviceLocator.getService<L10n>(locale).getConstant('SelectAll');
        const selectAll: Element = createCboxWithWrap(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            getUid('cbox'), (excelFilter as any).createCheckbox(selectAllObj[args.column.field], false, selectAllObj), 'e-ftrchk');
        return selectAll;
    }

    private updateState(
        args: FilterCheckboxArgs, cBoxFrame: Element, cBox: HTMLInputElement, indeterminate: boolean, checkedCount: number): void {
        removeClass([cBoxFrame], ['e-check', 'e-stop', 'e-uncheck']);
        if ((args.btnObj.element as HTMLButtonElement).disabled) {
            (args.btnObj.element as HTMLButtonElement).disabled = false;
        }
        if (indeterminate) {
            if (checkedCount) {
                cBoxFrame.classList.add('e-stop');
            } else {
                cBoxFrame.classList.add('e-uncheck');
                const addCurCbox: Element = args.element.querySelector('.e-add-current');
                (args.btnObj.element as HTMLButtonElement).disabled = !addCurCbox || !addCurCbox.classList.contains('e-check');
            }
        } else {
            cBoxFrame.classList.add('e-check');
        }
        cBox.indeterminate = indeterminate;
        cBox.checked = !indeterminate;
    }

    private beforeFilteringHandler(
        evt: { instance: { options: { type?: string, format?: string } }, arg3: number | string, arg8?: number | string,
            arg2: string, arg7?: string, isOpen?: boolean }): void {
        if (evt.instance && evt.instance.options) {
            if (evt.isOpen && evt.instance.options.type === 'string') {
                const localeObj: { decimal: string } = getNumericObject(this.parent.locale) as { decimal: string };
                if (localeObj.decimal !== '.') {
                    const valArr: string[] = evt.arg3.toString().split('.');
                    if (valArr.length === 2) {
                        const parsedNumVal: string = valArr.join(localeObj.decimal);
                        if (isNumber(new Internationalization(this.parent.locale).parseNumber(parsedNumVal, { format: 'n' }))) {
                            evt.arg3 = parsedNumVal;
                        }
                    }
                }
            }
            const parseValue: Function = (val?: string | number, operator?: string): string | number => {
                if (operator && (operator === 'notequal' || this.isCustomNumFilter(operator))) {
                    if (val) {
                        if (isNumber(val)) {
                            val = parseFloat(val.toString());
                        } else if (typeof val === 'string') {
                            const isInvalidMixedFraction: Function = (value: string): boolean => {
                                if (!value.includes('/')) {
                                    return true;
                                }
                                const parts: string[] = value.trim().split(' ');
                                if (parts.length !== 2 || !isNumber(parts[0])) {
                                    return true;
                                }
                                const fractionParts: string[] = parts[1].split('/');
                                if (fractionParts.length === 2 && isNumber(fractionParts[0]) &&
                                    isNumber(fractionParts[1]) && parseFloat(fractionParts[1]) !== 0) {
                                    val = parseFloat(parts[0]) + (parseFloat(fractionParts[0]) / parseFloat(fractionParts[1]));
                                    return false;
                                }
                                return true;
                            };
                            if (isInvalidMixedFraction(val)) {
                                const localeObj: LocaleNumericSettings = <LocaleNumericSettings>getNumericObject(this.parent.locale);
                                const intl: Internationalization = new Internationalization(this.parent.locale);
                                let numArgs: { isNumber?: boolean, value?: string } = {};
                                if (val.includes(localeObj.percentSign)) {
                                    const valArr: string[] = val.trim().split('%');
                                    if (valArr[0] !== '' && !valArr[1]) {
                                        numArgs = checkIsNumberAndGetNumber(
                                            { value: valArr[0] }, this.parent.locale, localeObj.group, localeObj.decimal);
                                    }
                                }
                                if (numArgs.isNumber) {
                                    val = Number(numArgs.value) / 100;
                                } else {
                                    const checkVal: string = val.trim();
                                    const options: AutoDetectGeneralFormatArgs = { args: { updateValue: true, cell: { value: checkVal },
                                        value: checkVal, curSymbol: getNumberDependable(this.parent.locale, defaultCurrencyCode),
                                        isEdit: true }, intl: intl, fResult: checkVal };
                                    this.parent.notify(checkNumberFormat, options);
                                    let updatedVal: string = options.args.cell.value;
                                    if (localeObj.decimal !== '.' && !isNumber(updatedVal) && updatedVal.includes(localeObj.decimal)) {
                                        updatedVal = updatedVal.replace(localeObj.decimal, '.');
                                    }
                                    if (isNumber(updatedVal)) {
                                        val = Number(updatedVal);
                                    } else {
                                        const dateEventArgs: DateFormatCheckArgs = { value: checkVal, cell: { value: checkVal } };
                                        this.parent.notify(checkDateFormat, dateEventArgs);
                                        if (dateEventArgs.isTime || dateEventArgs.isDate) {
                                            val = parseFloat(dateEventArgs.updatedVal);
                                        }
                                    }
                                }
                            }
                        }
                    } else if (operator === 'notequal' && val === null) {
                        val = '';
                    }
                } else if (operator === 'equal') {
                    if (isNumber(val)) {
                        val = val.toString();
                    } else if (typeof val === 'string' && isNumber(parseValue(val, 'notequal'))) {
                        val = val.trim();
                    } else if (val === null) {
                        val = '';
                    }
                }
                return val;
            };
            if (evt.instance.options.type !== 'date') {
                evt.arg3 = parseValue(evt.arg3, evt.arg2);
                evt.arg8 = parseValue(evt.arg8, evt.arg7);
            } else if (evt.instance.options.format === 'yMd') {
                const parseDateTime: Function = (val: Date | string | number, operator?: string): number => {
                    if (val) {
                        if (typeof val === 'string') {
                            const checkVal: string = val.trim();
                            const dateEventArgs: DateFormatCheckArgs = { value: checkVal, cell: { value: checkVal } };
                            this.parent.notify(checkDateFormat, dateEventArgs);
                            if (dateEventArgs.isDate) {
                                val = operator === 'equal' ? dateEventArgs.dateObj : parseFloat(dateEventArgs.updatedVal);
                            } else {
                                if (operator === 'equal' || operator === 'notequal') {
                                    const parsedNumVal: number = parseValue(val, 'notequal');
                                    if (isNumber(parsedNumVal)) {
                                        evt.instance.options.type = 'number';
                                        if (operator === 'notequal') {
                                            val = parsedNumVal;
                                        }
                                    } else {
                                        evt.instance.options.type = 'string';
                                    }
                                }
                            }
                        } else if (isDateTime(val) && operator !== 'equal') {
                            val = dateToInt(val, true);
                        }
                    }
                    return <number>val;
                };
                const filterDateInputs: NodeListOf<HTMLElement> = document.querySelectorAll('.e-xlfl-valuediv input.e-datepicker');
                if (filterDateInputs.length === 2) {
                    evt.arg3 = parseDateTime(evt.arg3 || (filterDateInputs[0] as HTMLInputElement).value, evt.arg2);
                    evt.arg8 = parseDateTime(evt.arg8 || (filterDateInputs[1] as HTMLInputElement).value, evt.arg7);
                } else if (evt.arg3) {
                    evt.arg3 = parseDateTime(evt.arg3, evt.arg2);
                }
            }
        }
    }

    private customFilterOpen(args: { column: string }): void {
        const filterOptDiv: NodeListOf<HTMLElement> = document.querySelectorAll('.e-xlfl-optrdiv input.e-dropdownlist');
        const criterias: string[] = [];
        for (let idx: number = 0; idx < filterOptDiv.length; idx++) {
            const dropDownList: { value: string } = getComponent(filterOptDiv[idx as number], 'dropdownlist');
            if (dropDownList) {
                criterias.push(dropDownList.value);
            }
        }
        const customFilterValues: string[] = [];
        if (criterias.length === 2) {
            const predicates: PredicateModel[] = this.filterCollection.get(this.parent.activeSheetIndex);
            let criteriaIdx: number;
            for (let idx: number = 0; idx < predicates.length; idx++) {
                if (predicates[idx as number].field === args.column && predicates[idx as number].value !== null) {
                    criteriaIdx = criterias.indexOf(predicates[idx as number].operator);
                    if (criteriaIdx > -1) {
                        if (predicates[idx as number].operator === 'equal' && isDateTime(predicates[idx as number].value)) {
                            customFilterValues[criteriaIdx as number] = dateToInt(predicates[idx as number].value, true).toString();
                        } else {
                            customFilterValues[criteriaIdx as number] = predicates[idx as number].value.toString();
                        }
                        criterias[criteriaIdx as number] = '';
                    }
                }
            }
        }
        const localeNumObj: LocaleNumericSettings = <LocaleNumericSettings>getNumericObject(this.parent.locale);
        const getParsedVal: Function = (val: string): string => {
            if (localeNumObj.decimal !== '.' && isNumber(val)) {
                const parsedVal: string = val.toString();
                if (parsedVal.includes('.')) {
                    return parsedVal.replace('.', localeNumObj.decimal);
                }
            }
            return val;
        };
        const filterValInputs: NodeListOf<HTMLElement> = document.querySelectorAll('.e-xlfl-valuediv input.e-ss-filter-input');
        if (filterValInputs.length) {
            for (let idx: number = 0; idx < filterValInputs.length; idx++) {
                const textObj: TextBox = new TextBox(
                    { placeholder: this.parent.serviceLocator.getService<L10n>(locale).getConstant('CustomFilterPlaceHolder') });
                if (customFilterValues[idx as number]) {
                    textObj.value = getParsedVal(customFilterValues[idx as number]);
                }
                textObj.appendTo(filterValInputs[idx as number]);
            }
        } else {
            const filterValInputs: NodeListOf<HTMLInputElement> = document.querySelectorAll('.e-xlfl-valuediv input.e-datepicker');
            let datePickerObj: { value: string }; let val: string;
            for (let idx: number = 0; idx < filterValInputs.length; idx++) {
                if (isNumber(customFilterValues[idx as number])) {
                    val = this.parent.getDisplayText(
                        { value: customFilterValues[idx as number], format: getFormatFromType('ShortDate') +
                        (customFilterValues[idx as number].includes('.') ? ` ${getFormatFromType('Time')}` : '') });
                } else {
                    val = getParsedVal(customFilterValues[idx as number]);
                }
                datePickerObj = getComponent(filterValInputs[idx as number], 'datepicker');
                if (datePickerObj) {
                    datePickerObj.value = val;
                    filterValInputs[idx as number].value = val;
                }
            }
        }
    }

    private wireFilterEvents(args: FilterCheckboxArgs, applyBtnClickHandler: Function, refreshCheckboxes: Function): void {
        args.btnObj.element.addEventListener('click', applyBtnClickHandler.bind(this));
        (args as { searchBox?: Element }).searchBox.addEventListener('keydown', (e: KeyboardEvent): void => {
            if (e.keyCode === 13) {
                applyBtnClickHandler();
            }
        });
        const filterDlgCloseHandler: Function = (): void => {
            this.parent.off(refreshCheckbox, refreshCheckboxes);
            this.parent.off(filterDialogClose, filterDlgCloseHandler);
            focus(this.parent.element);
        };
        this.parent.on(filterDialogClose, filterDlgCloseHandler, this);
        this.parent.on(refreshCheckbox, refreshCheckboxes, this);
    }

    private initTreeView(args: FilterCheckboxArgs, excelFilter: ExcelFilterBase): void {
        let checkedNodes: string[] = [];
        const allNodes: string[] = [];
        const idColl: { [key: string]: boolean } = {};
        let groupedYears: { [key: string]: Object }[] = [];
        let groupedMonths: { [key: string]: Object }[] = [];
        let groupedData: { [key: string]: Object }[] = [];
        let otherData: { [key: string]: Object }[] = [];
        let value: string; let month: string; let day: number; let date: Date; let mId: string; let dId: string; let monthNum: number;
        let months: string[] = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October',
            'November', 'December'];
        if (this.parent.locale !== 'en-US') {
            const formats: { months?: object } = IntlBase.getDependables(cldrData, this.parent.locale, null).dateObject;
            const monthObj: Object[] = formats.months['stand-alone'] ? formats.months['stand-alone'].wide : {};
            if (Object.keys(monthObj).length === 12) {
                months = Object.keys(monthObj).map(Number).map((key: number) => monthObj[key as number]) as string[];
            }
        }
        let grpObj: { [key: string]: Object };
        let indeterminate: boolean =  false;
        const sheet: SheetModel = this.parent.getActiveSheet();
        const addNodes: (data: { [key: string]: Object }) => void = (data: { [key: string]: Object }): void => {
            idColl[`${dId}`] = true;
            if (isFilterHidden(sheet, Number(data['__rowIndex']) - 1)) {
                indeterminate = true;
            } else {
                checkedNodes.push(dId);
            }
            allNodes.push(dId);
        };
        args.dataSource.forEach((data: { [key: string]: Object }): void => {
            date = data[args.column.field] as Date;
            if (typeof date === 'object' && !!Date.parse(date.toString())) {
                value = date.getFullYear().toString();
                if (!idColl[`${value}`]) {
                    grpObj = { __rowIndex: value, hasChild: true };
                    grpObj[args.column.field] = value;
                    groupedYears.push(grpObj);
                    idColl[`${value}`] = true;
                }
                monthNum = date.getMonth();
                month = months[monthNum as number];
                mId = value + ' ' + month;
                if (!idColl[`${mId}`]) {
                    grpObj = { __rowIndex: mId, pId: value, hasChild: true, month: monthNum };
                    grpObj[args.column.field] = month;
                    groupedMonths.push(grpObj);
                    idColl[`${mId}`] = true;
                }
                day = date.getDate();
                dId = mId + ' ' + day.toString();
                if (!idColl[`${dId}`]) {
                    grpObj = { __rowIndex: dId, pId: mId };
                    grpObj[args.column.field] = day;
                    groupedData.push(grpObj);
                    addNodes(data);
                }
            } else {
                if (!data[args.column.field] && data[args.column.field] !== 0) {
                    dId = 'blanks';
                    value = this.parent.serviceLocator.getService<L10n>(locale).getConstant('Blanks');
                } else {
                    dId = 'text ' + data[args.column.field].toString().toLowerCase();
                    value = <string>data[args.column.field];
                }
                if (!idColl[`${dId}`]) {
                    grpObj = { __rowIndex: dId };
                    grpObj[args.column.field] = value;
                    otherData.push(grpObj);
                    addNodes(data);
                }
            }
        });
        groupedYears = new DataManager(
            groupedYears).executeLocal(new Query().sortBy(args.column.field, 'decending')) as { [key: string]: Object }[];
        groupedMonths = new DataManager(
            groupedMonths).executeLocal(new Query().sortBy('month', 'ascending')) as { [key: string]: Object }[];
        groupedData = new DataManager(
            groupedData).executeLocal(new Query().sortBy(args.column.field, 'ascending')) as { [key: string]: Object }[];
        groupedData = groupedYears.concat(groupedMonths.concat(groupedData));
        if (otherData.length) {
            otherData = new DataManager(
                otherData).executeLocal(new Query().sortBy(args.column.field, 'ascending')) as { [key: string]: Object }[];
            groupedData = groupedData.concat(otherData);
        }
        const nodeClick: Function = (args: NodeKeyPressEventArgs | NodeClickEventArgs ): void => {
            const checkedNode: HTMLLIElement[] = [args.node];
            if ((args.event.target as Element).classList.contains('e-fullrow') || (args.event as KeyboardEventArgs).key === 'Enter') {
                const getNodeDetails: { [key: string]: Object } = treeViewObj.getNode(args.node);
                if (getNodeDetails.isChecked === 'true') {
                    treeViewObj.uncheckAll(checkedNode);
                } else {
                    treeViewObj.checkAll(checkedNode);
                }
            }
        };
        const selectAllClick: Function = (): void => {
            cBox.indeterminate = false;
            if (cBoxFrame.classList.contains('e-check')) {
                treeViewObj.uncheckAll();
                cBoxFrame.classList.add('e-uncheck');
                cBox.checked = false;
            } else {
                treeViewObj.checkAll();
                cBoxFrame.classList.add('e-check');
                cBox.checked = true;
            }
        };
        const selectAll: Element = this.createSelectAll(args, excelFilter);
        selectAll.addEventListener('click', selectAllClick.bind(this));
        selectAll.classList.add('e-spreadsheet-ftrchk');
        const cBoxFrame: Element = selectAll.querySelector('.e-frame');
        cBoxFrame.classList.add('e-selectall');
        args.element.appendChild(selectAll);
        const cBox: HTMLInputElement = selectAll.querySelector('.e-chk-hidden') as HTMLInputElement;
        const treeViewEle: HTMLElement = this.parent.createElement('div');
        const treeViewObj: TreeView = new TreeView({
            fields: { dataSource: groupedData, id: '__rowIndex', parentID: 'pId', text: args.column.field, hasChildren: 'hasChild' },
            enableRtl: this.parent.enableRtl, showCheckBox: true, cssClass: 'e-checkboxtree', checkedNodes: checkedNodes,
            nodeClicked: nodeClick.bind(this),
            keyPress: nodeClick.bind(this),
            nodeChecked: (e: NodeCheckEventArgs): void => {
                if (e.action !== 'indeterminate') {
                    indeterminate = treeViewObj.checkedNodes.length !== (treeViewObj.fields.dataSource as Object[]).length;
                    this.updateState(args, cBoxFrame, cBox, indeterminate, treeViewObj.checkedNodes.length);
                }
            }
        });
        treeViewObj.createElement = this.parent.createElement;
        treeViewObj.appendTo(treeViewEle);
        args.element.appendChild(treeViewEle);
        checkedNodes = treeViewObj.checkedNodes;
        this.updateState(args, cBoxFrame, cBox, indeterminate, treeViewObj.checkedNodes.length);
        const applyBtnClickHandler: Function = (): void => {
            if (treeViewObj.checkedNodes.length === groupedData.length) {
                this.filterSuccessHandler(new DataManager(args.dataSource), { action: 'clear-filter', field: args.column.field });
            } else {
                this.generatePredicate(
                    treeViewObj.checkedNodes, otherData.length ? 'string' : args.type, args.column.field, excelFilter, allNodes,
                    treeViewObj.checkedNodes.length > groupedData.length / 2);
            }
        };
        this.treeViewObj = treeViewObj;
        this.treeViewEle = treeViewEle;
        this.cBox = cBox;
        this.wireFilterEvents(args, applyBtnClickHandler, this.refreshCheckbox.bind(this, groupedData, treeViewObj, checkedNodes));
    }

    private generatePredicate(
        checkedNodes: string[], type: string, field: string, excelFilter: ExcelFilterBase, allNodes: string[], isNotEqual: boolean): void {
        const predicates: PredicateModel[] = [];
        let predicate: ExtendedPredicateModel;
        const months: { [key: string]: number } = { 'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5, 'July': 6,
            'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11 };
        let valArr: string[]; let date: Date; let val: string | number; let otherType: string;
        const updateOtherPredicate: Function = (): void => {
            if (valArr[0] === 'blanks') {
                predicates.push(Object.assign({ value: '', type: type }, predicate));
            } else if (valArr[0] === 'text') {
                valArr.splice(0, 1);
                val = valArr.join(' ');
                if (isNaN(Number(val))) {
                    otherType = 'string';
                } else {
                    val = Number(val);
                    otherType = 'number';
                }
                predicates.push(Object.assign({ value: val, type: otherType }, predicate));
            }
        };
        const setDate: () => void = (): void => {
            if (this.parent.locale !== 'en-US') {
                const dependables: { months?: object } = IntlBase.getDependables(cldrData, this.parent.locale, null).dateObject;
                if (dependables.months && dependables.months['stand-alone'] && dependables.months['stand-alone'].wide) {
                    const keys: string[] = Object.keys(dependables.months['stand-alone'].wide);
                    for (let i: number = 0; i < keys.length; i++) {
                        if (dependables.months['stand-alone'].wide[keys[i as number]] === valArr[1]) {
                            months[valArr[1]] = Number(keys[i as number]) - 1;
                            break;
                        }
                    }
                }
            }
            date = new Date(Number(valArr[0]), months[valArr[1]], Number(valArr[2]));
            if (date.getDate()) {
                predicates.push(Object.assign({ value: date, type: type }, predicate));
            } else {
                updateOtherPredicate();
            }
        };
        if (isNotEqual) {
            predicate = { field: field, ignoreAccent: false, matchCase: false, predicate: 'and', operator: 'notequal',
                isFilterByMenu: true };
            for (let i: number = 0, len: number = allNodes.length; i < len; i++) {
                if (checkedNodes.indexOf(allNodes[i as number]) === -1) {
                    valArr = allNodes[i as number].split(' ');
                    setDate();
                }
            }
        } else {
            predicate = { field: field, ignoreAccent: false, matchCase: false, predicate: 'or', operator: 'equal', isFilterByMenu: true };
            for (let i: number = 0, len: number = checkedNodes.length; i < len; i++) {
                valArr = checkedNodes[i as number].split(' ');
                if (valArr.length === 3) {
                    setDate();
                } else {
                    updateOtherPredicate();
                }
            }
        }
        excelFilter.initiateFilter(predicates);
    }

    private refreshCheckbox(
        groupedData: { [key: string]: Object }[], treeViewObj: TreeView, checkedNodes: string[], args: { event: KeyboardEvent }): void {
        let searchValue: string;
        if (args.event.type === 'keyup') {
            searchValue = (args.event.target as HTMLInputElement).value;
        } else if ((args.event.target as Element).classList.contains('e-search-icon')) {
            return;
        }
        let filteredList: Object[];
        const changeData: Function = (): void => {
            if (filteredList.length && !(treeViewObj.fields.dataSource as Object[]).length) {
                const wrapper: Element = treeViewObj.element.parentElement;
                wrapper.getElementsByClassName('e-spreadsheet-ftrchk')[0].classList.remove('e-hide');
                detach(wrapper.getElementsByClassName('e-checkfltrnmdiv')[0]);
            }
            treeViewObj.fields.dataSource = <{ [key: string]: Object }[]>filteredList;
            treeViewObj.dataBind();
        };
        if (searchValue) {
            filteredList = new DataManager(groupedData).executeLocal(new Query().where(
                new Predicate(treeViewObj.fields.text, 'contains', searchValue, true))
            );
            const filterId: { [key: string]: boolean } = {}; const predicates: Predicate[] = []; let key: string; let initList: Object[];
            const strFilter: boolean = isNaN(Number(searchValue));
            let expandId: string[]; let level: number;
            if (strFilter) {
                for (let i: number = 0; i < filteredList.length; i++) {
                    if (!filteredList[i as number]['hasChild']) {
                        continue;
                    }
                    predicates.push(new Predicate('pId', 'equal', filteredList[i as number]['__rowIndex'], false));
                    key = filteredList[i as number]['pId'];
                    if (!filterId[`${key}`]) {
                        predicates.push(new Predicate('__rowIndex', 'equal', key, false));
                        filterId[`${key}`] = true;
                    }
                }
                initList = filteredList;
                level = 1;
            } else {
                let year: string; const filterParentId: { [key: string]: boolean } = {}; expandId = [];
                for (let i: number = 0; i < filteredList.length; i++) {
                    key = filteredList[i as number]['pId'];
                    if (key) {
                        year = key.split(' ')[0];
                        if (!filterId[`${key}`]) {
                            predicates.push(new Predicate('__rowIndex', 'equal', key, false));
                            filterId[`${key}`] = true;
                            expandId.push(year);
                            expandId.push(key);
                        }
                        if (!filterParentId[`${year}`]) {
                            if (!filterId[`${year}`]) {
                                predicates.push(new Predicate('__rowIndex', 'equal', year, false));
                                filterId[`${year}`] = true;
                            }
                            predicates.push(new Predicate('__rowIndex', 'equal', filteredList[i as number]['__rowIndex'], false));
                        }
                    } else {
                        key = filteredList[i as number]['__rowIndex'];
                        if (!filterParentId[`${key}`]) {
                            predicates.push(new Predicate('__rowIndex', 'contains', key, false));
                            filterParentId[`${key}`] = true;
                        }
                    }
                }
                initList = [];
            }
            if (filteredList.length) {
                if (predicates.length) {
                    filteredList = initList.concat(new DataManager(groupedData).executeLocal(new Query().where(Predicate.or(predicates))));
                }
                changeData();
                treeViewObj.checkAll();
                const duration: number = treeViewObj.animation.expand.duration;
                treeViewObj.animation.expand.duration = 0;
                treeViewObj.expandAll(expandId, level);
                treeViewObj.animation.expand.duration = duration;
            } else if ((treeViewObj.fields.dataSource as Object[]).length) {
                changeData();
                const wrapper: Element = treeViewObj.element.parentElement;
                wrapper.getElementsByClassName('e-spreadsheet-ftrchk')[0].classList.add('e-hide');
                const noRecordEle: Element = this.parent.createElement('div', { className: 'e-checkfltrnmdiv' });
                const noRecordText: HTMLElement = this.parent.createElement('span');
                noRecordText.innerText = this.parent.serviceLocator.getService<L10n>(locale).getConstant('NoResult');
                noRecordEle.appendChild(noRecordText);
                wrapper.appendChild(noRecordEle);
            }
        } else {
            filteredList = groupedData;
            changeData();
            treeViewObj.checkedNodes = checkedNodes;
            treeViewObj.refresh();
        }
    }

    private openDialog(cell: HTMLElement): void {
        const colIndex: number = parseInt(cell.getAttribute('aria-colindex'), 10);
        const field: string = getColumnHeaderText(colIndex);
        this.parent.showSpinner();
        const sheetIdx: number = this.parent.activeSheetIndex;
        const filterRange: { useFilterRange: boolean, range: number[], allowHeaderFilter?: boolean } = this.filterRange.get(sheetIdx);
        const range: number[] = filterRange.range.slice();
        const sheet: SheetModel = this.parent.getActiveSheet();
        const filterCell: CellModel = getCell(range[0], colIndex - 1, sheet);
        const displayName: string = this.parent.getDisplayText(filterCell);
        if (!filterRange.allowHeaderFilter) {
            range[0] = range[0] + 1; // to skip first row.
        }
        if (!filterRange.useFilterRange) {
            range[2] = sheet.usedRange.rowIndex; //filter range should be till used range.
        }
        const fullRange: number[] = [range[0], colIndex - 1, range[2], colIndex - 1];
        const totalRange: { address: string, filteredCol: boolean, otherColPredicate: PredicateModel[], curPredicate: PredicateModel[] } =
            this.getPredicateRange(
                fullRange, this.filterCollection.get(sheetIdx), colIndex - 1) as { address: string, filteredCol: boolean,
                otherColPredicate: PredicateModel[], curPredicate: PredicateModel[] };
        const otherColPredicate: PredicateModel[] = totalRange.otherColPredicate;
        let curColPredicates: { [key: string]: PredicateModel[] };
        const curPredicate: PredicateModel[] = totalRange.curPredicate;
        if (curPredicate.length) {
            curColPredicates = {};
            curColPredicates[field as string] = curPredicate;
        }
        const addr: string = `${sheet.name}!${totalRange.address}`;
        const fullAddr: string = getRangeAddress(fullRange);
        const col: {
            type: string, isDateAvail: boolean, isMultiFormattedCol?: boolean
        } = this.getColumnType(sheet, colIndex - 1, range, true);
        const type: string = col.type;
        let templateColData: { [key: string]: Object }[];
        const isDateCol: boolean = type === 'date' || col.isDateAvail;
        const isNumCol: boolean = type === 'number';
        const templateFilter: boolean = isDateCol || isNumCol;
        const isMultiFormattedCol: boolean = col.isMultiFormattedCol;
        if (templateFilter && !totalRange.filteredCol) {
            templateColData = [];
        }
        getData(
            this.parent, addr, true, true, null, true, null, null, true, fullAddr, null, templateColData).then((
            jsonData: { [key: string]: CellModel }[]) => {
            let checkBoxData: DataManager;
            this.parent.element.style.position = 'relative';
            this.parent.element.classList.add('e-filter-open');
            let filterCollection: PredicateModel[];
            if (templateFilter) {
                if (templateColData || !otherColPredicate.length) {
                    checkBoxData = new DataManager(templateColData || jsonData);
                } else {
                    const options: FilterPredicateOptions = this.getPredicates(otherColPredicate);
                    const data: Object[] = applyPredicates(new DataManager(jsonData), options.predicates, options.equalOrPredicates);
                    checkBoxData = new DataManager(data);
                }
                const beforeCboxRender: Function = (args: FilterCheckboxArgs): void => {
                    this.parent.off(beforeCheckboxRender, beforeCboxRender);
                    args.isCheckboxFilterTemplate = true;
                    if (isDateCol) {
                        this.initTreeView(args, excelFilter);
                    } else {
                        this.initCboxList(args, excelFilter, jsonData);
                    }
                };
                this.parent.on(beforeCheckboxRender, beforeCboxRender, this);
                filterCollection = [];
            } else {
                if (otherColPredicate.length) {
                    const options: FilterPredicateOptions = this.getPredicates(otherColPredicate);
                    const data: Object[] = applyPredicates(new DataManager(jsonData), options.predicates, options.equalOrPredicates);
                    checkBoxData = new DataManager(data);
                } else {
                    checkBoxData = new DataManager(jsonData);
                }
                filterCollection = this.getClonedPredicates(curPredicate);
            }
            const target: HTMLElement = cell.querySelector('.e-filter-btn');
            const filterCol: { 'field': string, 'filter': object, filterTemplate?: string | Function, getFilterTemplate?: Function } = {
                field: field, filter: {} };
            if (isNumCol) {
                const parent: ExtendedSpreadsheet = this.parent;
                filterCol.filterTemplate = (element: HTMLElement): Element[] | void => {
                    if (parent.isReact && element) {
                        element.appendChild(parent.createElement('input', { className:  'e-ss-filter-input' }));
                    } else {
                        return [parent.createElement('input', { className:  'e-ss-filter-input' })];
                    }
                };
                const filterTemplateCallback: Function = (template: Function): Function => {
                    return (_data: object, _parent: object, _prop: string, _id: string, _isStringTemplate: boolean, _index: number,
                            element: Element): Element[] => {
                        return template(element);
                    };
                };
                filterCol.getFilterTemplate = () => filterTemplateCallback(filterCol.filterTemplate);
                if (parent.isReact && !parent.renderTemplates) {
                    parent.renderTemplates = (callback: Function) => callback();
                }
            }
            const options: { isFormatted?: boolean, isMultiFormattedCol?: boolean } | IFilterArgs = {
                type: type, field: field, format: (type === 'date' ? 'yMd' : null), displayName: displayName || 'Column ' + field,
                dataSource: checkBoxData || [], height: this.parent.element.classList.contains('e-bigger') ? 800 : 500, columns: [],
                hideSearchbox: false, filteredColumns: filterCollection, column: filterCol,
                handler: this.filterSuccessHandler.bind(this, new DataManager(jsonData)), target: target,
                position: { X: 0, Y: 0 }, localeObj: this.parent.serviceLocator.getService(locale), actualPredicate: curColPredicates,
                isFormatted: templateFilter && !isDateCol, isMultiFormattedCol: isMultiFormattedCol
            };
            const excelFilter: ExcelFilterBase = new ExcelFilterBase(this.parent, this.getLocalizedCustomOperators());
            excelFilter.openDialog(<IFilterArgs>options);
            const filterPopup: HTMLElement = document.querySelector('.e-filter-popup');
            if (filterPopup && filterPopup.id.includes(this.parent.element.id)) {
                EventHandler.add(filterPopup, getStartEvent(), this.filterMouseDownHandler, this);
                const parentOff: DOMRect = this.parent.element.getBoundingClientRect() as DOMRect;
                const cellOff: DOMRect = target.getBoundingClientRect() as DOMRect;
                const popupOff: DOMRect = filterPopup.getBoundingClientRect() as DOMRect;
                let left: number = (cellOff.right - parentOff.left) - popupOff.width;
                if (left < 0) { // Left collision wrt spreadsheet left
                    left = cellOff.left - parentOff.left;
                }
                if (Browser.isDevice) {
                    const overflow: number = (left + popupOff.width) - parentOff.width;
                    if (overflow > 0) {
                        left -= overflow;
                    }
                }
                filterPopup.style.left = `${left * this.parent.viewport.scaleX}px`;
                filterPopup.style.top = '0px';
                filterPopup.style.visibility = 'hidden';
                if (filterPopup.classList.contains('e-hide')) {
                    filterPopup.classList.remove('e-hide');
                }
                let top: number = cellOff.bottom - parentOff.top;
                if (popupOff.height - (parentOff.bottom - cellOff.bottom) > 0) { // Bottom collision wrt spreadsheet bottom
                    top -= popupOff.height - (parentOff.bottom - cellOff.bottom);
                    if (top < 0) {
                        top = 0;
                    }
                }
                filterPopup.style.top = `${top * this.parent.viewport.scaleY}px`;
                filterPopup.style.visibility = '';
            }
            this.parent.hideSpinner();
        });
    }

    private getPredicateRange(
        range: number[], predicates: PredicateModel[], col?: number):
        string | { address: string, filteredCol: boolean, otherColPredicate: PredicateModel[], curPredicate: PredicateModel[] } {
        let addr: string = getRangeAddress(range);
        let filteredCol: boolean;
        const otherColPredicate: PredicateModel[] = []; const curPredicate: PredicateModel[] = [];
        if (predicates && predicates.length) {
            let predicateRange: string; let colIdx: number;
            predicates.forEach((predicate: PredicateModel): void => {
                if (predicate.field) {
                    predicateRange = `${predicate.field}${range[0] + 1}:${predicate.field}${range[2] + 1}`;
                    colIdx = getColIndex(predicate.field);
                    if (!addr.includes(predicateRange)) {
                        addr += `,${predicateRange}`;
                        if (colIdx < range[1]) { range[1] = colIdx; }
                        if (colIdx > range[3]) { range[3] = colIdx; }
                    }
                    if (col !== undefined) {
                        if (colIdx === col) {
                            filteredCol = true;
                            curPredicate.push(predicate);
                        } else {
                            otherColPredicate.push(predicate);
                        }
                    }
                }
            });
        } else {
            filteredCol = true;
        }
        return col === undefined ? addr :
            { address: addr, filteredCol: filteredCol, otherColPredicate: otherColPredicate, curPredicate: curPredicate };
    }

    private filterDialogCreatedHandler(): void {
        const filterPopup: HTMLElement = document.querySelector('.e-filter-popup');
        if (filterPopup && filterPopup.id.includes(this.parent.element.id) && filterPopup.classList.contains('e-popup-close')) {
            filterPopup.classList.add('e-hide');
        }
    }

    /**
     * Formats cell value for listing it in filter popup.
     *
     * @param {any} args - Specifies the args
     * @param {string | number} args.value - Specify the value
     * @param {object} args.column - Specify the column
     * @param {object} args.data - Specify the data
     * @returns {void} - Formats cell value for listing it in filter popup.
     */
    private filterCboxValueHandler(args: { value: string | number, column: object, data: object }): void {
        if (args.column && args.data) {
            const field: string = (args.column as { field: string }).field;
            if (args.value) {
                const indexes: number[] = getCellIndexes(field + args.data['dataObj']['__rowIndex']);
                const cell: CellModel = getCell(indexes[0], indexes[1], this.parent.getActiveSheet());
                if (cell && cell.format) {
                    args.value = this.parent.getDisplayText(cell);
                }
            }
        }
    }

    /**
     * Triggers when sorting items are chosen on context menu of filter popup.
     *
     * @param {HTMLElement} target - Specify the element.
     * @returns {void} - Triggers when sorting items are chosen on context menu of filter popup.
     */
    private selectSortItemHandler(target: HTMLElement): void {
        const l10n: L10n = this.parent.serviceLocator.getService(locale);
        const sortOrder: SortOrder = target.classList.contains('e-filter-sortasc') ? 'Ascending'
            : target.classList.contains('e-filter-sortdesc') ? 'Descending' : null;
        if (sortOrder === 'Ascending') {
            target.setAttribute('aria-label', l10n.getConstant('SortAscending'));
        }
        else{
            target.setAttribute('aria-label', l10n.getConstant('SortDescending'));
        }
        if (!sortOrder) { return; }
        const sheet: SheetModel = this.parent.getActiveSheet();
        const sheetIdx: number = this.parent.activeSheetIndex;
        const filterRange: { useFilterRange: boolean, range: number[], allowHeaderFilter?: boolean } = this.filterRange.get(sheetIdx);
        const range: number[] = filterRange.range.slice();
        if (!filterRange.allowHeaderFilter) {
            range[0] = range[0] + 1; // to skip first row.
        }
        if (!filterRange.useFilterRange) {
            range[2] = sheet.usedRange.rowIndex; //filter range should be till used range.
        }
        if (isReadOnlyCells(this.parent, range)) {
            this.closeDialog();
            this.parent.notify(readonlyAlert, null);
            return;
        }
        this.parent.sortCollection = this.parent.sortCollection ? this.parent.sortCollection : [];
        const prevSort: SortCollectionModel[] = [];
        for (let i: number = this.parent.sortCollection.length - 1; i >= 0; i--) {
            if (this.parent.sortCollection[i as number] && this.parent.sortCollection[i as number].sheetIndex === sheetIdx) {
                prevSort.push(this.parent.sortCollection[i as number]);
                this.parent.sortCollection.splice(i, 1);
            }
        }
        this.parent.sortCollection.push(
            { sortRange: getRangeAddress(range), columnIndex: getIndexesFromAddress(sheet.activeCell)[1], order: sortOrder,
                sheetIndex: sheetIdx });
        this.parent.notify(
            applySort, { sortOptions: { sortDescriptors: { order: sortOrder }, containsHeader: false }, previousSort: prevSort, range:
            getRangeAddress(range) });
        this.refreshFilterRange();
        this.closeDialog();
    }

    /**
     * Triggers when OK button or clear filter item is selected
     *
     * @param {DataManager} dataSource - Specify the data source
     * @param {Object} args - Specify the data source
     * @param {string} args.action - Specify the action
     * @param {PredicateModel[]} args.filterCollection - Specify the filter collection.
     * @param {string} args.field - Specify the field.
     * @param {number} args.sIdx - Specify the index.
     * @param {boolean} args.isInternal - Specify the isInternal.
     * @param {boolean} args.isFilterByValue - Specify the isFilterByValue.
     * @param {PredicateModel[]} args.prevPredicates - Specify the prevPredicates.
     * @param {boolean} args.isOpen - Specify the filtering action is after importing.
     * @returns {void} - Triggers when OK button or clear filter item is selected
     */
    private filterSuccessHandler(
        dataSource: DataManager, args: { action: string, filterCollection?: PredicateModel[], field: string, sIdx?: number,
            isInternal?: boolean, isOpen?: boolean, isFilterByValue?: boolean, prevPredicates?: PredicateModel[] }): void {
        let sheetIdx: number = args.sIdx;
        if (!sheetIdx && sheetIdx !== 0) {
            sheetIdx = args.isOpen ? 0 : this.parent.activeSheetIndex;
        }
        let prevPredicates: PredicateModel[] = args.prevPredicates || [].slice.call(this.filterCollection.get(sheetIdx));
        if (args.isFilterByValue && !prevPredicates.length) { prevPredicates = undefined; }
        let predicates: PredicateModel[] = this.filterCollection.get(sheetIdx);
        this.updatePredicate(predicates, args.field);
        if (args.action === 'clear-filter' && predicates.length === prevPredicates.length) {
            return;
        }
        if (args.action === 'filtering') {
            const processWildcards: Function = (filterCollection: PredicateModel[]): PredicateModel[] => {
                return filterCollection.map((predicate: PredicateModel) => {
                    if (predicate && typeof predicate.value === 'string' && predicate.value.includes('*')) {
                        if (predicate.value.startsWith('*') && predicate.value.endsWith('*')) {
                            predicate.value = predicate.value.split('*').join('');
                            predicate.operator = 'contains';
                        } else if (predicate.value.endsWith('*')) {
                            predicate.value = predicate.value.split('*').join('');
                            predicate.operator = 'startswith';
                        } else if (predicate.value.startsWith('*')) {
                            predicate.value = predicate.value.split('*').join('');
                            predicate.operator = 'endswith';
                        }
                    }
                    return predicate;
                });
            };
            predicates = predicates.concat(processWildcards(args.filterCollection));
        }
        this.filterCollection.set(sheetIdx, predicates);
        const options: FilterPredicateOptions = this.getPredicates(predicates);
        const filterOptions: FilterOptions = { datasource: dataSource, predicates: options.predicates,
            equalOrPredicates: options.equalOrPredicates };
        const filterRange: { useFilterRange: boolean, range: number[] } = this.filterRange.get(sheetIdx);
        if (!filterRange.useFilterRange) {
            filterRange.range[2] = getSheet(this.parent as Workbook, sheetIdx).usedRange.rowIndex; //extend the range if filtered
        }
        this.applyFilter(
            filterOptions, getRangeAddress(filterRange.range), sheetIdx, prevPredicates, false, args.isInternal, args.isFilterByValue);
    }

    private isCustomNumFilter(operator: string): boolean {
        return operator.includes('greaterthan') || operator.includes('lessthan') || operator === 'between';
    }

    private getClonedPredicates(predicates: PredicateModel[], equalOrFields: string[] = []): PredicateModel[] {
        const predicateCol: PredicateModel[] = [];
        let predicate: ExtendedPredicateModel; let isNumCustomPredicate: boolean;
        for (let i: number = 0; i < predicates.length; i++) {
            predicate = predicates[i as number];
            if ((this.isCustomNumFilter(predicate.operator) || (!predicate.isFilterByMenu && predicate.operator === 'notequal')) &&
                isNumber(<string>predicate.value)) {
                predicateCol.push(Object.assign({}, predicate, { field: `${predicate.field}_value`, type: 'number' }));
                isNumCustomPredicate = true;
            } else {
                if (!predicate.isFilterByMenu && predicate.operator === 'equal' && predicate.predicate === 'or') {
                    equalOrFields.push(predicate.field);
                }
                predicateCol.push(predicate);
            }
        }
        if (!isNumCustomPredicate && equalOrFields.length) {
            equalOrFields.splice(0);
        }
        return predicateCol;
    }

    private updatePredicate(predicates: PredicateModel[], field: string): void {
        const dataManager: DataManager = new DataManager(predicates as JSON[]);
        const query: Query = new Query();
        const fields: { field: string }[] = dataManager.executeLocal(query.where('field', 'equal', field)) as { field: string }[];
        for (let index: number = 0; index < fields.length; index++) {
            let sameIndex: number = -1;
            for (let filterIndex: number = 0; filterIndex < predicates.length; filterIndex++) {
                if (predicates[filterIndex as number].field === fields[index as number].field) {
                    sameIndex = filterIndex;
                    break;
                }
            }
            if (sameIndex !== -1) {
                predicates.splice(sameIndex, 1);
            }
        }
    }

    /**
     * Triggers events for filtering and applies filter.
     *
     * @param {FilterOptions} filterOptions - Specify the filteroptions.
     * @param {string} range - Specify the range.
     * @param {number} sheetIdx - Specify the sheet index.
     * @param {PredicateModel[]} prevPredicates - Specify the predicates.
     * @param {boolean} refresh - Spefify the refresh.
     * @param {boolean} isInternal - Specify the isInternal.
     * @param {boolean} isFilterByValue - Specify the it is filter by value or not.
     * @returns {void} - Triggers events for filtering and applies filter.
     */
    private applyFilter(
        filterOptions: FilterOptions, range: string, sheetIdx: number, prevPredicates?: PredicateModel[], refresh?: boolean,
        isInternal?: boolean, isFilterByValue?: boolean): void {
        const eventArgs: { range: string, predicates: PredicateModel[], previousPredicates: PredicateModel[], sheetIndex: number,
            cancel: boolean } = { range: range, predicates: [].slice.call(this.filterCollection.get(sheetIdx)),
            previousPredicates: prevPredicates, sheetIndex: sheetIdx, cancel: false };
        if (!isInternal && !isFilterByValue) {
            this.parent.notify(beginAction, { action: 'filter', eventArgs: eventArgs });
            if (eventArgs.cancel) {
                return;
            }
        }
        if (range.indexOf('!') < 0) {
            range = this.parent.sheets[sheetIdx as number].name + '!' + range;
        }
        this.parent.showSpinner();
        const promise: Promise<FilterEventArgs> = new Promise((resolve: Function) => { resolve((() => { /** */ })()); });
        const filterArgs: { [key: string]: BeforeFilterEventArgs | Promise<FilterEventArgs> | boolean } = { args: { range: range,
            filterOptions: filterOptions }, promise: promise, refresh: refresh };
        const prevChartIndexes: { chart: ChartModel, chartRowIdx: number, chartColIdx: number }[] = getChartsIndexes(this.parent);
        this.parent.notify(initiateFilter, filterArgs);
        const currentChartIndexes: { chart: ChartModel, chartRowIdx: number, chartColIdx: number }[] = getChartsIndexes(this.parent);
        this.parent.notify(refreshChartCellModel, { prevChartIndexes, currentChartIndexes });
        (filterArgs.promise as Promise<FilterEventArgs>).then((args: FilterEventArgs) => {
            this.refreshFilterRange();
            this.parent.hideSpinner();
            if (!isInternal) {
                delete eventArgs.cancel;
                this.parent.notify(completeAction, { action: 'filter', eventArgs: eventArgs });
                if (document.activeElement.id !== `${this.parent.element.id}_SearchBox`) {
                    focus(this.parent.element);
                }
            }
            return Promise.resolve(args);
        }).catch((error: string) => {
            this.filterRangeAlertHandler({ error: error });
            return Promise.reject(error);
        });
    }

    /**
     * Gets the predicates for the sheet
     *
     * @param {PredicateModel[]} predicateModel - Specifies the predicate collection.
     * @returns {Predicate[]} - Gets the predicates for the sheet
     */
    private getPredicates(predicateModel: PredicateModel[]): FilterPredicateOptions {
        let equalOrPredicates: Predicate[][];
        const equalOrFields: string[] = [];
        const predicateCol: PredicateModel[] = this.getClonedPredicates(predicateModel, equalOrFields);
        if (equalOrFields.length) {
            let field: string; let predicate: ExtendedPredicateModel;
            const equalOrPredicatesModel: Map<string, PredicateModel[]> = new Map<string, PredicateModel[]>();
            for (let idx: number = 0; idx < predicateCol.length; idx++) {
                field = predicateCol[idx as number].field.replace('_value', '');
                if (equalOrFields.indexOf(field) > -1) {
                    predicate = predicateCol.splice(idx, 1)[0];
                    idx--;
                    if (equalOrPredicatesModel.has(field)) {
                        equalOrPredicatesModel.get(field).push(predicate);
                    } else {
                        equalOrPredicatesModel.set(field, [predicate]);
                    }
                }
            }
            equalOrPredicates = []; let predicateList: Predicate[];
            equalOrPredicatesModel.forEach((predicates: PredicateModel[]) => {
                predicateList = [];
                const excelPredicate: Predicate = CheckBoxFilterBase.getPredicate(predicates);
                for (const prop of Object.keys(excelPredicate)) {
                    predicateList.push(<Predicate>excelPredicate[`${prop}`]);
                }
                equalOrPredicates.push(predicateList);
            });
        }
        const predicateList: Predicate[] = [];
        const excelPredicate: Predicate = CheckBoxFilterBase.getPredicate(predicateCol);
        for (const prop of Object.keys(excelPredicate)) {
            predicateList.push(<Predicate>excelPredicate[`${prop}`]);
        }
        return { predicates: predicateList, equalOrPredicates: equalOrPredicates };
    }

    /**
     * Gets the column type to pass it into the excel filter options.
     *
     * @param {SheetModel} sheet - Specify the sheet.
     * @param {number} colIndex - Specify the colindex
     * @param {number[]} range - Specify the range.
     * @param {boolean} isFilterDialog - Indicates whether the filter dialog UI is open.
     * @returns {string} - Gets the column type to pass it into the excel filter options.
     */
    private getColumnType(
        sheet: SheetModel, colIndex: number, range: number[], isFilterDialog?: boolean
    ): { type: string, isDateAvail: boolean, isMultiFormattedCol: boolean } {
        let num: number = 0; let str: number = 0; let date: number = 0; const time: number = 0; let cell: CellModel;
        let formatOption: { type?: string }; let format: string; let isMultiFormattedCol: boolean;
        for (let i: number = range[0]; i <= range[2]; i++) {
            cell = getCell(i, colIndex, sheet);
            if (cell && !(isFilterDialog && !(cell.value || Number(cell.value) === 0))) {
                if (cell.format && cell.format !== 'General') {
                    const type: string = getTypeFromFormat(cell.format).toLowerCase();
                    switch (type) {
                    case 'number':
                    case 'currency':
                    case 'accounting':
                    case 'percentage':
                        num++;
                        break;
                    case 'shortdate':
                    case 'longdate':
                        date++;
                        break;
                    case 'time':
                        num++;
                        break;
                    case 'text':
                        str++;
                        break;
                    default:
                        formatOption = {};
                        if (isCustomDateTime(cell.format, true, formatOption)) {
                            if (formatOption.type === 'date') {
                                date++;
                            } else {
                                num++;
                            }
                        } else if (isNumber(cell.value)) {
                            num++;
                        } else if (cell.value) {
                            str++;
                        }
                        break;
                    }
                    if (!format) {
                        format = cell.format;
                    }
                } else if (isNumber(cell.value)) {
                    num++;
                } else if (cell.value) {
                    str++;
                }
                if (format && format !== cell.format) {
                    isMultiFormattedCol = true;
                }
            }
        }
        return { type: (num > str && num > date && num > time) ? 'number' : (str >= num && str >= date && str >= time) ? 'string'
            : (date > num && date > str && date > time) ? 'date' : 'datetime', isDateAvail: !!date, isMultiFormattedCol: isMultiFormattedCol };
    }

    /**
     * Clear filter from the field.
     *
     * @param {any} args - Specifies the args
     * @param {{ field: string }} args.field - Specify the args
     * @param {boolean} args.isAction - Specify the isAction.
     * @param {boolean} args.preventRefresh - Specify the preventRefresh.
     * @param {number} args.sheetIndex - Specify the sheet index value.
     * @returns {void} - Clear filter from the field.
     */
    private clearFilterHandler(args?: { field?: string, isAction?: boolean, preventRefresh?: boolean, sheetIndex?: number }): void {
        const sheetIndex: number = args && !isNullOrUndefined(args.sheetIndex) ? args.sheetIndex : this.parent.activeSheetIndex;
        if (args && args.field) {
            const predicates: PredicateModel[] = [].slice.call(this.filterCollection.get(sheetIndex));
            if (predicates && predicates.length) {
                this.updatePredicate(predicates, args.field);
                this.initiateFilterUIHandler(
                    { predicates: predicates, range: getRangeAddress(this.filterRange.get(sheetIndex).range), sIdx: sheetIndex });
            }
        } else {
            const isAction: boolean = args && args.isAction;
            const filterArgs: { [key: string]: boolean | number } = { isFiltered: false, isClearAll: true, sheetIndex: sheetIndex };
            this.getFilteredColumnHandler(filterArgs);
            if (filterArgs.isFiltered || (args && args.preventRefresh)) {
                let eventArgs: { range: string, predicates: PredicateModel[], previousPredicates: PredicateModel[], sheetIndex: number,
                    cancel: boolean };
                const sheet: SheetModel = getSheet(this.parent, sheetIndex);
                const filterRange: { useFilterRange: boolean, range: number[] } = this.filterRange.get(sheetIndex);
                const range: number[] = filterRange.range;
                if (isAction) {
                    eventArgs = { range: getRangeAddress(range), predicates: [], previousPredicates:
                        this.filterCollection.get(sheetIndex), sheetIndex: sheetIndex, cancel: false };
                    this.parent.notify(beginAction, { action: 'filter', eventArgs: eventArgs });
                    if (eventArgs.cancel) {
                        return;
                    }
                }
                this.filterCollection.set(sheetIndex, []);
                const len: number = filterRange.useFilterRange ? range[2] : sheet.usedRange.rowIndex;
                if (this.parent.scrollSettings.enableVirtualization && ((len - range[0]) + 1 > (this.parent.viewport.rowCount +
                    (this.parent.getThreshold('row') * 2)))) {
                    for (let i: number = 0; i <= len; i++) {
                        setRow(sheet, i, <ExtendedRowModel>{ hidden: false, isFiltered: false });
                    }
                    if (!args || !args.preventRefresh) {
                        this.parent.renderModule.refreshSheet(false, false, true);
                    }
                } else {
                    this.refreshFilterRange(null, null, sheetIndex);
                    const evtArgs: { [key: string]: number | boolean } = { startIndex: range[0], hide: false, isFiltering: true, refreshUI:
                        false, endIndex: filterRange.useFilterRange ? range[2] : sheet.usedRange.rowIndex, sheetIndex: sheetIndex };
                    this.parent.notify(hideShow, evtArgs);
                    if (evtArgs.refreshUI && (!args || !args.preventRefresh)) {
                        this.parent.renderModule.refreshSheet(false, false, true);
                    }
                }
                if (isAction) {
                    delete eventArgs.cancel;
                    this.parent.notify(completeAction, { action: 'filter', eventArgs: eventArgs });
                    focus(this.parent.element);
                }
            }
        }
    }

    /**
     * Reapplies the filter.
     *
     * @param {boolean} isInternal - Specifies the isInternal.
     * @param {boolean} refresh - Specifies the refresh.
     * @returns {void} - Reapplies the filter.
     */
    private reapplyFilterHandler(isInternal?: boolean, refresh?: boolean): void {
        const sheetIdx: number = this.parent.activeSheetIndex;
        if (this.filterRange.has(sheetIdx)) {
            const predicates: PredicateModel[] = this.filterCollection.get(sheetIdx);
            if (predicates && predicates.length) {
                const sheet: SheetModel = getSheet(this.parent, sheetIdx);
                const filterRange: { useFilterRange: boolean, range: number[], allowHeaderFilter?: boolean } =
                    this.filterRange.get(sheetIdx);
                const range: number[] = filterRange.range.slice();
                if (!filterRange.allowHeaderFilter) {
                    range[0] = range[0] + 1;
                }
                if (!filterRange.useFilterRange) {
                    range[2] = sheet.usedRange.rowIndex;
                }
                range[1] = range[3] = getColIndex(predicates[0].field);
                const addr: string = `${sheet.name}!${this.getPredicateRange(range, predicates.slice(1, predicates.length))}`;
                getData(
                    this.parent, addr, true, true, null, true, null, null, false, getRangeAddress(range)).then(
                    (jsonData: { [key: string]: CellModel }[]) => {
                        const options: FilterPredicateOptions = this.getPredicates(this.filterCollection.get(sheetIdx));
                        this.applyFilter(
                            { predicates: options.predicates, datasource: new DataManager(jsonData),
                                equalOrPredicates: options.equalOrPredicates },
                            getRangeAddress(filterRange.range), sheetIdx, [].slice.call(predicates), refresh, isInternal);
                    });
            }
        }
    }

    /**
     * Gets the filter information of the sheet.
     *
     * @param {FilterInfoArgs} args - Specify the args
     * @returns {void} - Gets the filter information of the sheet.
     */
    private getFilterRangeHandler(args: FilterInfoArgs): void {
        const sheetIdx: number = isNullOrUndefined(args.sheetIdx) ? this.parent.activeSheetIndex : args.sheetIdx;
        const filterOption: { range: number[], allowHeaderFilter?: boolean } = this.filterRange && this.filterRange.get(sheetIdx);
        if (filterOption) {
            args.hasFilter = true;
            args.filterRange = filterOption.range;
            args.allowHeaderFilter = filterOption.allowHeaderFilter;
            args.isFiltered = this.filterCollection && this.filterCollection.get(sheetIdx) &&
                this.filterCollection.get(sheetIdx).length > 0;
        } else {
            args.hasFilter = false;
            args.filterRange = null;
        }
    }

    /**
     * Returns the custom operators for filter items.
     *
     * @returns {Object} - Returns the custom operators for filter items.
     */
    private getLocalizedCustomOperators(): Object {
        const l10n: L10n = this.parent.serviceLocator.getService(locale);
        const numOptr: Object[] = [
            { value: 'equal', text: l10n.getConstant('Equal') },
            { value: 'greaterthan', text: l10n.getConstant('GreaterThan') },
            { value: 'greaterthanorequal', text: l10n.getConstant('GreaterThanOrEqual') },
            { value: 'lessthan', text: l10n.getConstant('LessThan') },
            { value: 'lessthanorequal', text: l10n.getConstant('LessThanOrEqual') },
            { value: 'notequal', text: l10n.getConstant('NotEqual') }
        ];
        const customOperators: Object = {
            stringOperator: [
                { value: 'startswith', text: l10n.getConstant('StartsWith') },
                { value: 'endswith', text: l10n.getConstant('EndsWith') },
                { value: 'contains', text: l10n.getConstant('Contains') },
                { value: 'equal', text: l10n.getConstant('Equal') },
                { value: 'isempty', text: l10n.getConstant('IsEmpty') },
                { value: 'doesnotstartwith', text: l10n.getConstant('NotStartsWith') },
                { value: 'doesnotendwith', text: l10n.getConstant('NotEndsWith') },
                { value: 'doesnotcontain', text: l10n.getConstant('NotContains') },
                { value: 'notequal', text: l10n.getConstant('NotEqual') },
                { value: 'isnotempty', text: l10n.getConstant('IsNotEmpty') }
            ],
            numberOperator: numOptr,
            dateOperator: numOptr,
            datetimeOperator: numOptr,
            booleanOperator: [
                { value: 'equal', text: l10n.getConstant('Equal') },
                { value: 'notequal', text: l10n.getConstant('NotEqual') }
            ]
        };
        return customOperators;
    }

    /**
     * To set the filtered range and predicates collections in the save JSON object.
     *
     * @param {any} args - Specifies the args
     * @param {number} args.sheetIdx - Specifies the sheet index value.
     * @param {boolean} args.isSaveAction - Specifies the Save action.
     * @param {any} args.saveJson - Specifies save as Json.
     * @param {FilterCollectionModel[]} args.saveJson.filterCollection - Specifies the filter collection values.
     * @returns {void}
     */
    private setFilteredCollection(
        args: { sheetIdx: number, isSaveAction?: boolean, saveJson: { filterCollection: FilterCollectionModel[] } }): void {
        const filterArgs: FilterInfoArgs = { sheetIdx: args.sheetIdx };
        this.getFilterRangeHandler(filterArgs);
        if (filterArgs.hasFilter) {
            const filterModel: FilterCollectionModel = { sheetIndex: args.sheetIdx, filterRange: getRangeAddress(filterArgs.filterRange),
                hasFilter: true, column: [], criteria: [], value: [], dataType: [], predicates: [] };
            args.saveJson.filterCollection.push(filterModel);
            const predicates: PredicateModel[] = this.filterCollection.get(args.sheetIdx);
            const predicateMap: Map<string, PredicateModel[]> = new Map<string, PredicateModel[]>();
            let predicate: ExtendedPredicateModel; let type: string;
            const getPredicateValue: Function = (val: string | Date): string => {
                if (isNullOrUndefined(val)) {
                    return '';
                } else if (args.isSaveAction && type === 'date') {
                    const dateVal: Date = <Date>val;
                    val = `${dateVal.getMonth() + 1}/${dateVal.getDate()}/${dateVal.getFullYear()} ${dateVal.getHours()}:${dateVal.getMinutes()}:${dateVal.getSeconds()}`;
                }
                return <string>val;
            };
            for (let idx: number = 0; idx < predicates.length; idx++) {
                predicate = predicates[idx as number];
                if (args.isSaveAction && predicate.operator === 'notequal' && predicate.isFilterByMenu) {
                    if (predicateMap.has(predicate.field)) {
                        predicateMap.get(predicate.field).push(predicate);
                    } else {
                        predicateMap.set(predicate.field, [predicate]);
                    }
                } else {
                    filterModel.column.push(getColIndex(predicate.field));
                    filterModel.criteria.push(predicate.operator);
                    if (args.isSaveAction) {
                        if (predicate.operator === 'equal') {
                            type = isDateTime(predicate.value) ? 'date' : 'string';
                            filterModel.value.push(getPredicateValue(predicate.value));
                            filterModel.dataType.push(type);
                        } else {
                            filterModel.value.push(<string | number>predicate.value);
                            filterModel.dataType.push('custom');
                        }
                    } else {
                        filterModel.value.push(<string | number>predicate.value);
                        filterModel.dataType.push(predicate.type);
                    }
                    filterModel.predicates.push(predicate.predicate);
                }
            }
            const colDataMap: Map<string, { [key: string]: string | Date }[]> = new Map<string, { [key: string]: string | Date }[]>();
            let colIdx: number;
            predicateMap.forEach((predicate: PredicateModel[], field: string) => {
                colIdx = getColIndex(field);
                if (!colDataMap.has(field)) {
                    colDataMap.set(field, this.getColData(colIdx, field, args.sheetIdx));
                }
                const colData: { [key: string]: string | Date }[] = colDataMap.get(field);
                const predicateCol: Predicate[] = this.getPredicates(predicate).predicates;
                const filteredData: { [key: string]: string | Date }[] = new DataManager(colData).executeLocal(
                    new Query().where(Predicate.and(predicateCol))) as { [key: string]: Date }[];
                for (let idx: number = 0; idx < filteredData.length; idx++) {
                    filterModel.column.push(colIdx);
                    filterModel.criteria.push('equal');
                    type = isDateTime(filteredData[idx as number][field as string]) ? 'date' : 'string';
                    filterModel.value.push(getPredicateValue(filteredData[idx as number][field as string]));
                    filterModel.dataType.push(type);
                    filterModel.predicates.push('or');
                }
            });
        }
    }

    private updateFilter(args?: { initLoad: boolean, isOpen: boolean }): void {
        if (this.parent.filterCollection && (args.initLoad || args.isOpen)) {
            let datePredicate: Predicate[]; let predicates: PredicateModel[]; let filterCol: FilterCollectionModel;
            const dateColData: { [key: string]: { [key: string]: Date | string }[] } = {}; let filteredData: { [key: string]: Date }[];
            let predicateCol: PredicateModel; let filterOption: { instance: { options: { type?: string, format?: string } },
                arg3: number | string, arg2: string, isOpen?: boolean };
            for (let i: number = 0; i < this.parent.filterCollection.length; i++) {
                filterCol = this.parent.filterCollection[i as number];
                let sIdx: number = filterCol.sheetIndex;
                if (i === 0 && !this.parent.isOpen && !args.isOpen) {
                    sIdx = 0;
                }
                predicates = [];
                if (filterCol.column) {
                    for (let j: number = 0; j < filterCol.column.length; j++) {
                        predicateCol = {
                            field: getColumnHeaderText(filterCol.column[j as number] + 1),
                            operator: this.getFilterOperator(filterCol.criteria[j as number]), value: typeof filterCol.value[j as number]
                            === 'string' ? (<string>filterCol.value[j as number]).split('*').join('') : filterCol.value[j as number],
                            predicate: filterCol.predicates && filterCol.predicates[j as number],
                            type: filterCol.dataType && filterCol.dataType[j as number]
                        };
                        if (['year', 'month', 'day'].indexOf(predicateCol.type) > -1) {
                            const dateEventArgs: DateFormatCheckArgs = { value: <string>predicateCol.value,
                                cell: { value: <string>predicateCol.value } };
                            this.parent.notify(checkDateFormat, dateEventArgs);
                            if (dateEventArgs.isDate) {
                                const predicateVal: Date = dateEventArgs.dateObj;
                                predicateCol.value = predicateVal;
                                if (predicateCol.type === 'day') {
                                    predicateCol.type = 'date';
                                    predicateCol.predicate = 'or';
                                    predicates.push(predicateCol);
                                } else {
                                    predicateCol.operator = 'greaterthanorequal';
                                    predicateCol.predicate = 'and';
                                    const type: string = predicateCol.type;
                                    predicateCol.type = 'date';
                                    datePredicate = this.getPredicates(
                                        [predicateCol, { field: predicateCol.field, operator: 'lessthanorequal', predicate: 'and',
                                            type: 'date', value: new Date(predicateVal.getFullYear(), type === 'year' ? 12 :
                                                predicateVal.getMonth() + 1, 0, 0, 0, 0) }]).predicates;
                                    if (!dateColData[predicateCol.field]) {
                                        dateColData[predicateCol.field] = this.getColData(
                                            filterCol.column[j as number], predicateCol.field, i);
                                    }
                                    filteredData = new DataManager(dateColData[predicateCol.field]).executeLocal(
                                        new Query().where(Predicate.and(datePredicate))) as { [key: string]: Date }[];
                                    for (let k: number = 0; k < filteredData.length; k++) {
                                        predicates.push(
                                            { field: predicateCol.field, operator: 'equal', predicate: 'or', type: 'date',
                                                value: filteredData[k as number][predicateCol.field] });
                                    }
                                }
                            }
                        } else {
                            filterOption = { isOpen: true, instance: { options: { type: predicateCol.type } },
                                arg3: <string>predicateCol.value, arg2: predicateCol.operator };
                            this.beforeFilteringHandler(filterOption);
                            predicateCol.value = filterOption.arg3;
                            if (predicateCol.type === 'string' || predicateCol.type === 'custom') {
                                if (this.isCustomNumFilter(predicateCol.operator) && isNumber(predicateCol.value)) {
                                    predicateCol.type = 'number';
                                }
                            } else if (predicateCol.type === 'date' && predicateCol.operator === 'equal' &&
                                typeof predicateCol.value === 'string' && predicateCol.value.includes('/') &&
                                predicateCol.value.includes(':')) {
                                const dateTimeStr: string[] = predicateCol.value.split(' ');
                                if (dateTimeStr.length === 2) {
                                    const dateArr: string[] = dateTimeStr[0].split('/');
                                    const timeArr: string[] = dateTimeStr[1].split(':');
                                    if (dateArr.length === 3 && timeArr.length === 3) {
                                        predicateCol.value = new Date(
                                            Number(dateArr[2]), Number(dateArr[0]) - 1, Number(dateArr[1]), Number(timeArr[0]),
                                            Number(timeArr[1]), Number(timeArr[2]));
                                    }
                                }
                            }
                            predicates.push(predicateCol);
                        }
                    }
                }
                if (!args.isOpen) {
                    for (let i: number = 0; i < predicates.length - 1; i++) {
                        if (predicates[i as number].field === predicates[i + 1].field) {
                            if (!predicates[i as number].predicate) {
                                predicates[i as number].predicate = 'or';
                            }
                            if (!predicates[i + 1].predicate) {
                                predicates[i + 1].predicate = 'or';
                            }
                        }
                    }
                }
                this.parent.notify(initiateFilterUI, { predicates: predicates.length ? predicates : undefined, range:
                    filterCol.filterRange, sIdx: sIdx, isInternal: true, isOpen: args.isOpen });
            }
            if (this.parent.sortCollection) {
                this.parent.notify(sortImport, null);
            }
            this.parent.setProperties({ filterCollection: null }, true);
        }
    }

    private getColData(colIdx: number, field: string, sheetIdx: number): { [key: string]: Date | string }[] {
        const sheet: SheetModel = getSheet(this.parent, sheetIdx);
        if (!sheet.rows || !sheet.rows.length) {
            return [];
        }
        const rows: { [key: string]: Date }[] = [];
        let row: { [key: string]: Date }; let cell: CellModel;
        for (let rowIdx: number = 1, rowLen: number = sheet.rows.length; rowIdx < rowLen; rowIdx++) {
            if (sheet.rows[rowIdx as number]) {
                cell = getCell(rowIdx, colIdx, sheet, false, true);
                if (cell && cell.value) {
                    row = {};
                    row[field as string] = <Date>getValueFromFormat(this.parent, cell, rowIdx, colIdx, sheetIdx);
                    rows.push(row);
                }
            }
        }
        return rows;
    }

    private getFilterOperator(value: string): string {
        switch (value) {
        case 'BeginsWith':
            value = 'startswith';
            break;
        case 'Less':
            value = 'lessthan';
            break;
        case 'EndsWith':
            value = 'endswith';
            break;
        case 'Equal':
            value = 'equal';
            break;
        case 'Notequal':
            value = 'notEqual';
            break;
        case 'Greater':
            value = 'greaterthan';
            break;
        case 'Contains':
            value = 'contains';
            break;
        case 'LessOrEqual':
            value = 'lessthanorequal';
            break;
        case 'GreaterOrEqual':
            value = 'greaterthanorequal';
            break;
        case 'NotContains':
            value = 'doesnotcontain';
            break;
        case 'NotBeginsWith':
            value = 'doesnotstartwith';
            break;
        case 'NotEndsWith':
            value = 'doesnotendwith';
            break;
        case 'Empty':
            value = 'isempty';
            break;
        case 'NotEmpty':
            value = 'isnotempty';
            break;
        }
        return value;
    }

    private beforeInsertHandler(args: { index: number, model: ColumnModel[], activeSheetIndex: number, modelType: string }): void {
        if (args.modelType === 'Column') {
            const sheetIdx: number = isUndefined(args.activeSheetIndex) ? this.parent.activeSheetIndex : args.activeSheetIndex;
            if (this.filterRange.size && this.filterRange.has(sheetIdx)) {
                const range: number[] = this.filterRange.get(sheetIdx).range;
                if (this.isFilterCell(sheetIdx, range[0], args.index) || args.index < range[1]) {
                    range[3] += args.model.length;
                    if (args.index <= range[1]) {
                        range[1] += args.model.length;
                    }
                    this.filterCollection.get(sheetIdx).forEach((predicate: PredicateModel) => {
                        const colIdx: number = getColIndex(predicate.field);
                        if (args.index <= colIdx) {
                            predicate.field = getColumnHeaderText(colIdx + args.model.length + 1);
                        }
                    });
                    if (this.parent.sortCollection) {
                        this.parent.sortCollection.forEach((sortCollection: SortCollectionModel) => {
                            if (sortCollection.sheetIndex === sheetIdx && args.index <= sortCollection.columnIndex) {
                                sortCollection.columnIndex += args.model.length;
                            }
                        });
                    }
                }
            }
        } else if (args.modelType === 'Sheet') {
            for (const key of Array.from(this.filterRange.keys()).sort().reverse()) {
                if (args.index <= key) {
                    this.filterRange.set(key + args.model.length, this.filterRange.get(key));
                    this.filterRange.delete(key);
                    this.filterCollection.set(key + args.model.length, this.filterCollection.get(key));
                    this.filterCollection.delete(key);
                }
            }
            if (this.parent.sortCollection) {
                this.parent.sortCollection.forEach((sortCollection: SortCollectionModel) => {
                    if (args.index <= sortCollection.sheetIndex) {
                        sortCollection.sheetIndex += args.model.length;
                    }
                });
            }
        }
    }

    private beforeDeleteHandler(args: { start: number, end: number, modelType: string, refreshSheet?: boolean }): void {
        if (args.modelType === 'Column') {
            const sheetIdx: number = this.parent.activeSheetIndex;
            if (this.filterRange.size && this.filterRange.has(sheetIdx)) {
                let isChanged: boolean = true;
                const range: number[] = this.filterRange.get(sheetIdx).range;
                if (args.start >= range[1] && args.end <= range[3]) { // in between
                    range[3] -= args.end - args.start + 1;
                }
                else if (args.start < range[1] && args.end < range[1]) { // before
                    range[1] -= args.end - args.start + 1;
                    range[3] -= args.end - args.start + 1;
                } else if (args.start < range[1] && args.end > range[1] && args.end < range[3]) { // from before to inbetween
                    range[1] = args.start;
                    range[3] -= args.end - args.start + 1;
                } else {
                    isChanged = false;
                }
                if (isChanged) {
                    const filterCollection: PredicateModel[] = this.filterCollection.get(sheetIdx);
                    let isPredicateRemoved: boolean;
                    for (let i: number = filterCollection.length - 1; i >= 0; i--) {
                        const colIdx: number = getColIndex(filterCollection[i as number].field);
                        if (args.end < colIdx) {
                            filterCollection[i as number].field = getColumnHeaderText(colIdx - (args.end - args.start + 1) + 1);
                        }
                        else if (args.start <= colIdx && args.end >= colIdx) {
                            isPredicateRemoved = true;
                            filterCollection.splice(i, 1);
                        }
                    }
                    const sortColl: SortCollectionModel[] = this.parent.sortCollection;
                    if (sortColl) {
                        for (let i: number = 0; i < sortColl.length; i++) {
                            if (sortColl[i as number].sheetIndex === sheetIdx) {
                                if (args.end < sortColl[i as number].columnIndex) {
                                    sortColl[i as number].columnIndex = sortColl[i as number].columnIndex - (args.end - args.start + 1);
                                    break;
                                }
                                else if (args.start <= sortColl[i as number].columnIndex && args.end >= sortColl[i as number].columnIndex) {
                                    sortColl.splice(i, 1);
                                    break;
                                }
                            }
                        }
                    }
                    if (range.some((value: number) => value < 0)) {
                        this.removeFilter(sheetIdx, true, true);
                        args.refreshSheet = true;
                    } else if (isPredicateRemoved) {
                        if (filterCollection && filterCollection.length) {
                            this.reapplyFilterHandler(true, true);
                            args.refreshSheet = false;
                        } else {
                            this.clearFilterHandler({ preventRefresh: true });
                            args.refreshSheet = true;
                        }
                    }
                }
            }
        }
    }

    private deleteSheetHandler(args: { sheetIndex: number }): void {
        if (!isUndefined(args.sheetIndex)) {
            for (const key of Array.from(this.filterRange.keys()).sort().reverse()) {
                if (args.sheetIndex === key) {
                    this.filterRange.delete(key);
                    this.filterCollection.delete(key);
                } else if (args.sheetIndex < key) {
                    this.filterRange.set(key - 1, this.filterRange.get(key));
                    this.filterRange.delete(key);
                    this.filterCollection.set(key - 1, this.filterCollection.get(key));
                    this.filterCollection.delete(key);
                }
            }
            const sortColl: SortCollectionModel[] = this.parent.sortCollection;
            if (sortColl) {
                for (let i: number = sortColl.length - 1; i >= 0; i--) {
                    if (args.sheetIndex === sortColl[i as number].sheetIndex) {
                        sortColl.splice(i, 1);
                    } else if (args.sheetIndex < sortColl[i as number].sheetIndex) {
                        sortColl[i as number].sheetIndex -= 1;
                    }
                }
            }
        } else if (this.filterRange.get(this.parent.activeSheetIndex)) {
            this.filterRange.delete(this.parent.activeSheetIndex);
            this.filterCollection.delete(this.parent.activeSheetIndex);
        }
    }

    private clearHandler(args: ClearOptions): void {
        const info: { sheetIndex: number, indices: number[] } = this.parent.getAddressInfo(args.range);
        if (this.filterRange.has(info.sheetIndex)) {
            const indexes: number[] = this.filterRange.get(info.sheetIndex).range.slice();
            if (inRange(info.indices, indexes[0], indexes[1]) && inRange(info.indices, indexes[0], indexes[3])) {
                this.removeFilter(info.sheetIndex, !(args as { isAction?: boolean }).isAction, null, true);
            }
        }
    }

    private duplicateSheetFilterHandler(args: duplicateSheetOption): void {
        for (const key of Array.from(this.filterRange.keys()).sort().reverse()) {
            if (args.newSheetIndex <= key) {
                this.filterRange.set(key + 1, this.filterRange.get(key));
                this.filterRange.delete(key);
                this.filterCollection.set(key + 1, this.filterCollection.get(key));
                this.filterCollection.delete(key);
            } else {
                break;
            }
        }
        if (this.filterCollection.has(args.sheetIndex)) {
            this.filterCollection.set(args.newSheetIndex, [...this.filterCollection.get(args.sheetIndex)]);
        }
        if (this.filterRange.has(args.sheetIndex)) {
            const filterRange: {
                useFilterRange: boolean; range: number[]; allowHeaderFilter?: boolean;
            } = this.filterRange.get(args.sheetIndex);
            this.filterRange.set(args.newSheetIndex, {
                useFilterRange: filterRange.useFilterRange, range: [...filterRange.range],
                allowHeaderFilter: filterRange.allowHeaderFilter
            });
        }
    }

    private updateSortCollectionHandler(args: {
        sortOptions?: SortOptions, isDuplicate?: boolean, curSheetIndex?: number, newSheetIndex?: number
    }): void {
        if (args.isDuplicate) {
            if (this.parent.sortCollection && this.parent.sortCollection.length > 0) {
                const newSortCollection: SortCollectionModel[] = [];
                for (let j: number = 0; j < this.parent.sortCollection.length; j++) {
                    const sortCol: SortCollectionModel = this.parent.sortCollection[j as number];
                    if (sortCol.sheetIndex === args.curSheetIndex) {
                        const updatedSortCol: SortCollectionModel = Object.assign({}, sortCol);
                        updatedSortCol.sheetIndex = args.newSheetIndex;
                        newSortCollection.push(updatedSortCol);
                    }
                }
                this.parent.sortCollection.push(...newSortCollection);
            }
            return;
        }
        const sheet: SheetModel = this.parent.getActiveSheet();
        const sheetIdx: number = this.parent.activeSheetIndex;
        const filterRange: { useFilterRange: boolean, range: number[], allowHeaderFilter?: boolean } = this.filterRange.get(sheetIdx);
        if (filterRange) {
            const range: number[] = filterRange.range.slice();
            if (!filterRange.allowHeaderFilter) {
                range[0] = range[0] + 1; // to skip first row.
            }
            if (!filterRange.useFilterRange) {
                range[2] = sheet.usedRange.rowIndex; //filter range should be till used range.
            }
            const sortDescriptors: SortDescriptor | SortDescriptor[] = args.sortOptions.sortDescriptors;
            this.parent.sortCollection = this.parent.sortCollection ? this.parent.sortCollection : [];
            if (Array.isArray(sortDescriptors)) {
                for (let i: number = 0; i < sortDescriptors.length; i++) {
                    this.parent.sortCollection.push({
                        sortRange: getRangeAddress(range), columnIndex: getColIndex(sortDescriptors[i as number].field),
                        order: sortDescriptors[i as number].order, sheetIndex: sheetIdx
                    });
                }
            } else {
                this.parent.sortCollection.push({
                    sortRange: getRangeAddress(range), columnIndex: getIndexesFromAddress(sheet.activeCell)[1],
                    order: sortDescriptors.order, sheetIndex: sheetIdx
                });
            }
        }
    }

    private moveSheetHandler(args: { prevIndex: number, currentIndex: number }): void {
        let prevSheetFilterRange: { useFilterRange: boolean, range: number[], allowHeaderFilter?: boolean } | undefined;
        let currentSheetFilterRange: { useFilterRange: boolean, range: number[], allowHeaderFilter?: boolean } | undefined;
        let prevSheetFilterCollection: PredicateModel[] | undefined;
        let currentSheetFilterCollection: PredicateModel[] | undefined;
        if (this.filterRange.has(args.prevIndex)) {
            prevSheetFilterRange = this.filterRange.get(args.prevIndex);
            prevSheetFilterCollection = this.filterCollection.get(args.prevIndex);
        }
        if (this.filterRange.has(args.currentIndex)) {
            currentSheetFilterRange = this.filterRange.get(args.currentIndex);
            currentSheetFilterCollection = this.filterCollection.get(args.currentIndex);
        }
        if (prevSheetFilterRange && currentSheetFilterRange) {
            this.filterRange.set(args.currentIndex, prevSheetFilterRange);
            this.filterRange.set(args.prevIndex, currentSheetFilterRange);
            this.filterCollection.set(args.currentIndex, prevSheetFilterCollection);
            this.filterCollection.set(args.prevIndex, currentSheetFilterCollection);
        } else if (prevSheetFilterRange) {
            this.filterRange.set(args.currentIndex, prevSheetFilterRange);
            this.filterRange.delete(args.prevIndex);
            this.filterCollection.set(args.currentIndex, prevSheetFilterCollection);
            this.filterCollection.delete(args.prevIndex);
        } else if (currentSheetFilterRange) {
            this.filterRange.set(args.prevIndex, currentSheetFilterRange);
            this.filterRange.delete(args.currentIndex);
            this.filterCollection.set(args.prevIndex, currentSheetFilterCollection);
            this.filterCollection.delete(args.currentIndex);
        }
    }

    private refreshFilterCellsOnResize(args: { rowIndex: number }): void {
        const range: number[] = this.filterRange.has(this.parent.activeSheetIndex) &&
            this.filterRange.get(this.parent.activeSheetIndex).range;
        if (range && range[0] === args.rowIndex) {
            const sheet: SheetModel = this.parent.getActiveSheet();
            for (let colIdx: number = range[1]; colIdx <= range[3]; colIdx++) {
                if (getCell(args.rowIndex, colIdx, sheet, false, true).notes) {
                    const cellEle: HTMLElement = this.parent.getCell(args.rowIndex, colIdx);
                    if (cellEle) {
                        this.parent.serviceLocator.getService<ICellRenderer>('cell').refresh(
                            args.rowIndex, colIdx, false, cellEle, false, false, true);
                    }
                }
            }
        }
    }
}
