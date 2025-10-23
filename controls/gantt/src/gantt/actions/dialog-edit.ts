import { remove, extend, isNullOrUndefined, createElement, L10n, getValue, setValue, closest, SanitizeHtmlHelper } from '@syncfusion/ej2-base';
import { DataManager, DataUtil } from '@syncfusion/ej2-data';
import { Dialog, PositionDataModel, DialogModel } from '@syncfusion/ej2-popups';
import { Tab, TabModel, TabItemModel, SelectEventArgs, ItemModel } from '@syncfusion/ej2-navigations';
import {
    Grid, Edit, Toolbar as GridToolbar, Page, GridModel, GridActionEventArgs, getObject, ActionEventArgs, Sort, RowDD, Group, Aggregate,
    ColumnChooser, ContextMenu, ColumnMenu, Resize, Reorder, DetailRow, Search, Print, ToolbarItem, PdfExport, ExcelExport, Filter,
    ColumnModel, Column
} from '@syncfusion/ej2-grids';
import {
    ColumnModel as GridColumnModel, ForeignKey,
    getActualProperties, RowSelectEventArgs
} from '@syncfusion/ej2-grids';
import { Gantt } from '../base/gantt';
import {
    RichTextEditor, Toolbar as RTEToolbar, Link, HtmlEditor, QuickToolbar,
    RichTextEditorModel,
    Count,
    Image,
    Table,
    EmojiPicker,
    FileManager,
    FormatPainter,
    MarkdownEditor} from '@syncfusion/ej2-richtexteditor';
import { AddDialogFieldSettingsModel, EditDialogFieldSettingsModel, TaskFieldsModel, ResourceFieldsModel, AddDialogFieldSettings } from '../models/models';
import { CObject, ConstraintType, DialogFieldType } from '../base/enum';
import { ColumnModel as GanttColumnModel } from '../models/column';
import { TextBox, NumericTextBox, NumericTextBoxModel, MaskedTextBox, TextBoxModel, FormValidatorModel, FormValidator } from '@syncfusion/ej2-inputs';
import {
    IGanttData, ITaskData, ITaskSegment, IDependencyEditData, IPredecessor, ITaskbarEditedEventArgs, ActionBeginArgs
} from '../base/interface';
import { CheckBox, CheckBoxModel } from '@syncfusion/ej2-buttons';
import { DatePicker, DateTimePicker, DatePickerModel } from '@syncfusion/ej2-calendars';
import { DropDownList, ComboBox, ComboBoxModel, ChangeEventArgs, DropDownListModel } from '@syncfusion/ej2-dropdowns';
import { isScheduledTask } from '../base/utils';
import {
    TreeGridModel, ColumnModel as TreeGridColumnModel,
    TreeGrid, Selection as TreeGridSelection, Filter as TreeGridFilter, Edit as TreeGridEdit, VirtualScroll, Sort as TreeGridSort,
    Page as TreeGridPage, Aggregate as TreeGridAggregate, Reorder as TreeGridReorder, Resize  as TreeGridResize, Toolbar as TreeGridToolbar,
    RowDD  as TreeGridRowDD, ToolbarItem as TreeGridToolbarItem
} from '@syncfusion/ej2-treegrid';
import { getUid } from '../base/utils';
import { IToolbarItems } from '@syncfusion/ej2-richtexteditor/src/common/interface';
interface EJ2Instance extends HTMLElement {
    // eslint-disable-next-line
    ej2_instances: Object[];
}

/**
 *
 * @hidden
 */
export class DialogEdit {
    //Internal variables
    //Module declarations
    private isEdit: boolean;
    /**
     * @private
     */
    public dialog: HTMLElement;
    public isAddNewResource: boolean;
    /**
     * @private
     */
    public dialogObj: Dialog;
    private preTableCollection: IDependencyEditData[];
    private preTaskIds: string[];
    private localeObj: L10n;
    private parent: Gantt;
    private rowIndex: number;
    private isFromDialogPredecessor: boolean = false;
    private isTriggered: boolean = false;
    /* eslint-disable-next-line */
    private formObj: any;
    /* eslint-disable-next-line */
    private CustomformObj: any;
    private taskFieldColumn: Array<ColumnModel> = [];
    private customFieldColumn: Array<ColumnModel> = [];
    private isFromAddDialog: boolean;
    private isFromEditDialog: boolean;
    public processedId: { id: string, value: IPredecessor[] }[] = [];
    private storeColumn: Column[];
    private taskfields: TaskFieldsModel;
    /* eslint-disable-next-line */
    private storeValidTab: any;
    private storeDependencyTab: HTMLElement;
    private storeResourceTab: HTMLElement;
    private firstOccuringTab: string;
    private numericOrString: string;
    private types: IDependencyEditData[];
    private editedRecord: IGanttData;
    private rowData: IGanttData;
    private beforeOpenArgs: CObject;
    private inputs: Object;
    private dialogConstraintValue: number;
    private idCollection: IDependencyEditData[];
    private disableUndo: boolean;
    private dialogConstraintDate: Date;
    private currentResources: Object[];
    /**
     * @private
     */
    public updatedEditFields: EditDialogFieldSettingsModel[] = null;
    private updatedAddFields: AddDialogFieldSettingsModel[] = null;
    private addedRecord: Record<string, unknown> = null;
    private dialogEditValidationFlag: boolean = false;
    private tabObj: Tab;
    private selectedSegment: ITaskSegment;
    public ganttResources: Object[] = [];
    private isValidData: boolean = true;
    private isResourceTabUpdated: boolean = false;
    /**
     * @private
     */
    public previousResource: Object[] = [];
    /**
     * @private
     */
    public isResourceUpdate: boolean = false;
    /**
     * Constructor for render module
     *
     * @param {Gantt} parent .
     * @returns {void} .
     */
    constructor(parent: Gantt) {
        this.parent = parent;
        this.localeObj = this.parent.localeObj;
        this.beforeOpenArgs = { cancel: false };
        this.types = this.getPredecessorType();
        this.rowData = {};
        this.editedRecord = {};
        this.inputs = {
            booleanedit: CheckBox,
            dropdownedit: DropDownList,
            datepickeredit: DatePicker,
            datetimepickeredit: DateTimePicker,
            maskededit: MaskedTextBox,
            numericedit: NumericTextBox,
            stringedit: TextBox,
            defaultedit: TextBox
        };
        this.processDialogFields();
        this.wireEvents();
    }

    private wireEvents(): void {
        this.parent.on('chartDblClick', this.dblClickHandler, this);
    }

    private dblClickHandler(e: PointerEvent): void {
        const ganttData: IGanttData = this.parent.ganttChartModule.getRecordByTarget(e);
        if (!isNullOrUndefined(ganttData) && this.parent.editModule && this.parent.editSettings.allowEditing) {
            this.openEditDialog(ganttData);
        }
    }

    /**
     * Method to validate add and edit dialog fields property.
     *
     * @returns {void} .
     * @private
     */
    public processDialogFields(): void {
        if (isNullOrUndefined(this.parent.editDialogFields) ||
            this.parent.editDialogFields && this.parent.editDialogFields.length === 0) {
            this.updatedEditFields = this.getDefaultDialogFields();
            this.updatedEditFields = this.validateDialogFields(this.updatedEditFields);
        } else {
            this.updatedEditFields = this.validateDialogFields(this.parent.editDialogFields);
        }
        if (isNullOrUndefined(this.parent.addDialogFields) ||
            this.parent.addDialogFields && this.parent.addDialogFields.length === 0) {
            this.updatedAddFields = this.getDefaultDialogFields();
            this.updatedAddFields = this.validateDialogFields(this.updatedAddFields);
        } else {
            this.updatedAddFields = this.validateDialogFields(this.parent.addDialogFields);
        }
    }

    private validateDialogFields(dialogFields: AddDialogFieldSettingsModel[]): AddDialogFieldSettingsModel[] {
        const newDialogFields: AddDialogFieldSettingsModel[] = [];
        let emptyCustomColumn: number = 0;
        for (let i: number = 0; i < dialogFields.length; i++) {
            const fieldItem: AddDialogFieldSettingsModel = getActualProperties(dialogFields[i as number]);
            if (fieldItem.type === 'General' && (isNullOrUndefined(fieldItem.fields) || fieldItem.fields.length === 0)) {
                fieldItem.fields = this.getGeneralColumnFields();
            }
            if (fieldItem.type === 'Advanced' && (isNullOrUndefined(fieldItem.fields) || fieldItem.fields.length === 0)) {
                fieldItem.fields = this.getAdvancedColumnFields(); // Assuming this method exists
            }
            if (fieldItem.type === 'Dependency' && isNullOrUndefined(this.parent.taskFields.dependency)
                || fieldItem.type === 'Resources' && isNullOrUndefined(this.parent.taskFields.resourceInfo)
                || fieldItem.type === 'Notes' && isNullOrUndefined(this.parent.taskFields.notes)) {
                continue;
            }
            if (fieldItem.type === 'Custom' && (isNullOrUndefined(fieldItem.fields) || fieldItem.fields.length === 0)) {
                emptyCustomColumn += 1;
                fieldItem.fields = this.getCustomColumnFields();
            }
            if (emptyCustomColumn > 1) {
                continue;
            }
            newDialogFields.push(fieldItem);
        }
        return newDialogFields;
    }
    /**
     * Method to get general column fields
     *
     * @returns {string[]} .
     */
    private getGeneralColumnFields(): string[] {
        const fields: string[] = [];
        for (const key of Object.keys(this.parent.columnMapping)) {
            if (key === 'dependency' || key === 'resourceInfo' || key === 'notes' ||
                key === 'constraintType' || key === 'constraintDate'
            ) {
                continue;
            }
            fields.push(this.parent.columnMapping[key as string]);
        }
        return fields;
    }
    private getAdvancedColumnFields(): string[] {
        const fields: string[] = [];
        if (this.parent.columnMapping.constraintType) {
            fields.push(this.parent.columnMapping.constraintType);
        }
        if (this.parent.columnMapping.constraintDate) {
            fields.push(this.parent.columnMapping.constraintDate);
        }
        return fields;
    }

    /**
     * Method to get custom column fields
     *
     * @returns {void} .
     */
    private getCustomColumnFields(): string[] {
        const fields: string[] = [];
        for (let i: number = 0; i < this.parent.customColumns.length; i++) {
            fields.push(this.parent.customColumns[i as number]);
        }
        return fields;
    }

    /**
     * Get default dialog fields when fields are not defined for add and edit dialogs
     *
     * @returns {AddDialogFieldSettings} .
     */
    private getDefaultDialogFields(): AddDialogFieldSettingsModel[] {
        const dialogFields: AddDialogFieldSettingsModel[] = [];
        let fieldItem: AddDialogFieldSettingsModel = {};
        const taskFields: TaskFieldsModel = this.parent.taskFields;
        const columnMapping: { [key: string]: string; } = this.parent.columnMapping;
        if (Object.keys(columnMapping).length !== 0) {
            fieldItem.type = 'General';
            dialogFields.push(fieldItem);
        }
        if (!isNullOrUndefined(getValue('dependency', columnMapping))) {
            fieldItem = {};
            if (this.parent.columnByField[columnMapping.dependency.valueOf()].visible !== false) {
                fieldItem.type = 'Dependency';
            }
            dialogFields.push(fieldItem);
        }
        if (!isNullOrUndefined(getValue('resourceInfo', columnMapping))) {
            fieldItem = {};
            if (this.parent.columnByField[columnMapping.resourceInfo.valueOf()].visible !== false) {
                fieldItem.type = 'Resources';
            }
            dialogFields.push(fieldItem);
        }
        if (!isNullOrUndefined(getValue('constraintType', columnMapping)) && !isNullOrUndefined(getValue('constraintDate', columnMapping))) {
            fieldItem = {};
            fieldItem.type = 'Advanced';
            dialogFields.push(fieldItem);
        }
        if (!isNullOrUndefined(getValue('notes', columnMapping))) {
            fieldItem = {};
            if (this.parent.columnByField[columnMapping.notes.valueOf()].visible !== false) {
                fieldItem.type = 'Notes';
            }
            dialogFields.push(fieldItem);
        }
        if (!isNullOrUndefined(getValue('segments', taskFields))) {
            fieldItem = {};
            fieldItem.type = 'Segments';
            dialogFields.push(fieldItem);
        }
        if (this.parent.customColumns.length > 0) {
            fieldItem = {};
            fieldItem.type = 'Custom';
            dialogFields.push(fieldItem);
        }
        return dialogFields;
    }
    /**
     * @returns {void} .
     * @private
     */
    public openAddDialog(): void {
        this.isEdit = false;
        this.editedRecord = this.composeAddRecord();
        this.isFromAddDialog = true;
        this.createDialog();
    }
    /**
     *
     * @returns {Date} .
     * @private
     */
    public getMinimumStartDate(): Date {
        let minDate: Date = DataUtil.aggregates.min(this.parent.flatData, 'ganttProperties.startDate');
        if (!isNullOrUndefined(minDate)) {
            minDate = new Date(minDate.getTime());
        } else {
            minDate = new Date(this.parent.timelineModule.timelineStartDate.getTime());
        }
        minDate = this.parent.dateValidationModule.checkStartDate(minDate);
        return new Date(minDate.getTime());
    }

    /**
     * @returns {IGanttData} .
     * @private
     */
    public composeAddRecord(): IGanttData {
        const tempData: IGanttData = {};
        tempData.ganttProperties = {};
        const columns: GanttColumnModel[] = this.parent.ganttColumns;
        const taskSettings: TaskFieldsModel = this.parent.taskFields;
        const id: number | string = this.parent.editModule.getNewTaskId();
        for (let i: number = 0; i < columns.length; i++) {
            const field: string = columns[i as number].field;
            if (field === taskSettings.id) {
                tempData[field as string] = id;
                tempData.ganttProperties.rowUniqueID = tempData[field as string];
            } else if (columns[i as number].field === taskSettings.startDate) {
                if (isNullOrUndefined(tempData[taskSettings.endDate])) {
                    tempData[field as string] = this.getMinimumStartDate();
                } else {
                    tempData[field as string] = new Date(tempData[taskSettings.endDate]);
                }
                if (this.parent.timezone) {
                    tempData[field as string] = this.parent.dateValidationModule.remove(tempData[field as string], this.parent.timezone);
                }
                tempData.ganttProperties.startDate = new Date(tempData[field as string]);
            } else if (columns[i as number].field === taskSettings.endDate) {
                if (isNullOrUndefined(tempData[taskSettings.startDate])) {
                    tempData[field as string] = this.getMinimumStartDate();
                } else {
                    tempData[field as string] = new Date(tempData[taskSettings.startDate]);
                }
                if (this.parent.timezone) {
                    tempData[field as string] = this.parent.dateValidationModule.remove(tempData[field as string], this.parent.timezone);
                }
                tempData.ganttProperties.endDate = new Date(tempData[field as string]);
            } else if (columns[i as number].field === taskSettings.duration) {
                tempData[field as string] = 1;
                tempData.ganttProperties.duration = tempData[field as string];
                tempData.ganttProperties.durationUnit = this.parent.durationUnit.toLocaleLowerCase();
            } else if (columns[i as number].field === taskSettings.name) {
                tempData[field as string] = this.localeObj.getConstant('addDialogTitle') + ' ' + id;
                tempData.ganttProperties.taskName = tempData[field as string];
            } else if (columns[i as number].field === taskSettings.progress) {
                tempData[field as string] = 0;
                tempData.ganttProperties.progress = tempData[field as string];
            } else if (columns[i as number].field === taskSettings.work) {
                tempData[field as string] = 0;
                tempData.ganttProperties.work = tempData[field as string];
            } else if (columns[i as number].field === taskSettings.type) {
                tempData[field as string] = this.parent.taskType;
                tempData.ganttProperties.taskType = tempData[field as string];
            } else {
                tempData[this.parent.ganttColumns[i as number].field] = '';
            }
        }
        tempData.ganttProperties.isAutoSchedule = (this.parent.taskMode === 'Auto') ? true :
            (this.parent.taskMode === 'Manual') ? false :
                tempData[taskSettings.manual] === true ? false : true;
        return tempData;
    }
    /**
     * @returns {void} .
     * @private
     */
    public openToolbarEditDialog(): void {
        const gObj: Gantt = this.parent;
        if (gObj.editModule && gObj.editSettings.allowEditing) {
            if (gObj.selectionModule && this.parent.ganttChartModule.focusedRowIndex > -1) {
                gObj.selectionModule.selectRow(this.parent.ganttChartModule.focusedRowIndex, false, false);
            }
            const selectedRowId: number | string = gObj.selectionModule ?
                (gObj.selectionSettings.mode === 'Row' || gObj.selectionSettings.mode === 'Both') &&
                    gObj.selectionModule.selectedRowIndexes.length === 1 ?
                    gObj.updatedRecords[gObj.selectionModule.selectedRowIndexes[0]].ganttProperties.rowUniqueID :
                    gObj.selectionSettings.mode === 'Cell' &&
                        gObj.selectionModule.getSelectedRowCellIndexes().length === 1 ?
                        gObj.updatedRecords[gObj.selectionModule.getSelectedRowCellIndexes()[0].rowIndex].ganttProperties.rowUniqueID :
                        null : null;
            if (!isNullOrUndefined(selectedRowId)) {
                this.openEditDialog(selectedRowId);
            }
        }
    }
    /**
     * @param { number | string | object} taskId .
     * @returns {void} .
     * @private
     */
    public openEditDialog(taskId: number | string | object): void {
        const ganttObj: Gantt = this.parent;
        if (!isNullOrUndefined(taskId)) {
            if (!isNullOrUndefined(taskId['ganttProperties'])) {
                if (typeof taskId['ganttProperties']['taskId'] === 'string') {
                    this.numericOrString = 'stringedit';
                } else {
                    this.numericOrString = 'numericedit';
                }
            }
            if (isNullOrUndefined(taskId['ganttProperties']) && !isNullOrUndefined(taskId)) {
                if (isNaN(Number(taskId)) || this.parent.columnByField[this.parent.taskFields.id].editType === 'stringedit') {
                    this.numericOrString = 'stringedit';
                } else {
                    this.numericOrString = 'numericedit';
                }
            }
        }
        if (typeof taskId === 'object' && !isNullOrUndefined(taskId)) {
            this.rowIndex = this.parent.currentViewData.indexOf(taskId);
            if (this.rowIndex > -1) {
                this.rowData = taskId;
            }
        } else if (!isNullOrUndefined(taskId)) {
            this.rowIndex = ganttObj.ids.indexOf(taskId.toString());
            if (this.rowIndex > -1) {
                this.rowData = ganttObj.flatData[this.rowIndex];
            }
        } else if (ganttObj.selectedRowIndex > -1) {
            this.rowData = ganttObj.currentViewData[ganttObj.selectedRowIndex];
            this.rowIndex = ganttObj.selectedRowIndex;
        }
        this.isEdit = true;
        if (Object.keys(this.rowData).length !== 0) {
            this.editedRecord = extend({}, {}, this.rowData, true);
            this.isFromEditDialog = true;
            this.createDialog();
        }
    }

    private createDialog(): void {
        const ganttObj: Gantt = this.parent;
        const dialogModel: DialogModel = {};
        this.beforeOpenArgs.dialogModel = dialogModel;
        this.beforeOpenArgs.rowData = this.editedRecord;
        this.beforeOpenArgs.rowIndex = this.rowIndex;
        const dialogMaxWidth: string = this.parent.isAdaptive ? '' : '600px';
        const dialog: HTMLElement = this.parent.createElement(
            'div', { id: ganttObj.element.id + '_dialog', styles: 'max-width:' + dialogMaxWidth });
        dialog.classList.add('e-gantt-dialog');
        ganttObj.element.appendChild(dialog);
        dialogModel.animationSettings = { effect: 'None' };
        dialogModel.header = this.localeObj.getConstant(this.isEdit ? 'editDialogTitle' : 'addDialogTitle');
        dialogModel.isModal = true;
        dialogModel.enableRtl = this.parent.enableRtl;
        dialogModel.allowDragging = (this.parent.isAdaptive || this.parent.enableAdaptiveUI) ? false : true;
        dialogModel.showCloseIcon = true;
        const position: PositionDataModel = this.parent.isAdaptive ? { X: 'top', Y: 'left' } : { X: 'center', Y: 'center' };
        dialogModel.position = position;
        //dialogModel.width = '750px';
        dialogModel.height = this.parent.isAdaptive ? '100%' : 'auto';
        dialogModel.target = document.body;
        dialogModel.close = this.dialogClose.bind(this);
        dialogModel.closeOnEscape = true;
        /* eslint-disable-next-line */
        dialogModel.beforeClose = function (args: any): void {
            if (args.closedBy === 'escape') {
                if (args.event.name === 'key-pressed' && args.event.target.nodeName === 'INPUT') {
                    args.cancel = true;
                }
            }
        };
        dialogModel.open = (args: Record<string, unknown>) => {
            const dialogElement: HTMLElement = getValue('element', args);
            const generalTabElement: HTMLElement = dialogElement.querySelector('#' + this.parent.element.id + 'GeneralTabContainer');
            if (generalTabElement && generalTabElement.scrollHeight > generalTabElement.offsetHeight) {
                generalTabElement.classList.add('e-scroll');
            }
            if (this.tabObj.selectedItem === 0) {
                this.tabObj.select(0);
            }
            if (this.parent.isAdaptive) {
                dialogElement.style.maxHeight = 'none';
            }
            if (this.parent.focusModule) {
                this.parent.focusModule.setActiveElement(dialogElement);
            }
        };
        dialogModel.locale = this.parent.locale;
        dialogModel.buttons = [{
            buttonModel: {
                content: this.localeObj.getConstant('saveButton'), cssClass: 'e-primary'
            },
            click: this.buttonClick.bind(this)
        }, {
            buttonModel: { cssClass: 'e-flat', content: this.localeObj.getConstant('cancel') },
            click: this.buttonClick.bind(this)
        }];
        this.createTab(dialogModel, dialog);
    }

    private buttonClick(e: MouseEvent): void {
        const target: HTMLElement = e.target as HTMLElement;
        target.style.pointerEvents = 'none';
        if ((this.localeObj.getConstant('cancel')).toLowerCase() === (e.target as HTMLInputElement).innerText.trim().toLowerCase()) {
            if (this.dialog && !this.dialogObj.isDestroyed) {
                this.CustomformObj = null;
                this.formObj = null;
                this.storeValidTab = null;
                this.customFieldColumn = [];
                this.taskFieldColumn = [];
                this.dialogObj.hide();
                this.dialogClose();
            }
        } else {
            if (this.CustomformObj) {
                if (!this.CustomformObj.validate()) {
                    target.style.pointerEvents = '';
                    return;
                }
            }
            if (this.formObj) {
                /* eslint-disable-next-line */
                const formValid: any = this.formObj.validate();
                if (!formValid) {
                    target.style.pointerEvents = '';
                    return;
                }
            }
            if (this.storeDependencyTab || this.firstOccuringTab === 'Dependency') {
                /* eslint-disable-next-line */
                let dependencyTab: any;
                if (this.firstOccuringTab === 'Dependency') {
                    const element: Element = (e.target as Element).closest('#' + this.parent.element.id + '_dialog');
                    dependencyTab = element.querySelector('.e-gridform');
                } else {
                    dependencyTab = this.storeDependencyTab.querySelector('.e-gridform');
                }
                if (dependencyTab) {
                    const dependencyTabValid: boolean = dependencyTab['ej2_instances'][0].validate();
                    if (!dependencyTabValid) {
                        target.style.pointerEvents = '';
                        return;
                    }
                }
            }
            if (this.storeResourceTab || this.firstOccuringTab === 'Resources') {
                /* eslint-disable-next-line */
                let resourceTab: any;
                if (this.firstOccuringTab === 'Resources') {
                    const element: Element = (e.target as Element).closest('#' + this.parent.element.id + '_dialog');
                    resourceTab = element.querySelector('.e-gridform');
                } else {
                    resourceTab = this.storeResourceTab.querySelector('.e-gridform');
                }

                if (resourceTab) {
                    const resourceTabValid: boolean = resourceTab['ej2_instances'][0].validate();
                    if (!resourceTabValid) {
                        target.style.pointerEvents = '';
                        return;
                    }
                }
            }
            this.initiateDialogSave();
            this.parent['updateDuration'] = false;
            this.CustomformObj = null;
            this.formObj = null;
            this.storeValidTab = null;
            this.customFieldColumn = [];
            this.taskFieldColumn = [];
            target.style.pointerEvents = 'auto';
        }
    }
    /**
     * @returns {void} .
     * @private
     */
    public dialogClose(): void {
        if (this.dialog) {
            this.resetValues();
        }
        if (!isNullOrUndefined(this.parent.focusModule) &&
            !isNullOrUndefined(this.parent.focusModule.getActiveElement(true))) {
            this.parent.focusModule.getActiveElement(true).focus();
        }
    }

    private resetValues(): void {
        this.isEdit = false;
        this.isAddNewResource = false;
        this.editedRecord = {};
        this.parent['triggeredColumnName'] = '';
        this.rowData = {};
        this.rowIndex = -1;
        this.addedRecord = null;
        this.ganttResources = [];
        this.dialogEditValidationFlag = false;
        this.isFromAddDialog = false;
        this.isFromEditDialog = false;
        this.dialogConstraintDate = null;
        if (this.dialog && !this.dialogObj.isDestroyed) {
            this.destroyDialogInnerElements();
            this.dialogObj.destroy();
            remove(this.dialog);
        }
    }

    private destroyDialogInnerElements(): void {
        const ganttObj: Gantt = this.parent;
        const tabModel: TabModel = this.beforeOpenArgs.tabModel;
        const items: TabItemModel[] = tabModel.items;
        for (let i: number = 0; i < items.length; i++) {
            const element: HTMLElement = items[i as number].content as HTMLElement;
            let id: string = element.getAttribute('id');
            if (!isNullOrUndefined(id) || id !== '') {
                id = id.replace(ganttObj.element.id, '');
                id = id.replace('TabContainer', '');
                if (id === 'General') {
                    this.destroyCustomField(element);
                } else if (id === 'Dependency') {
                    const gridObj: Grid = <Grid>(<EJ2Instance>element).ej2_instances[0];
                    gridObj.destroy();
                } else if (id === 'Notes') {
                    const rte: RichTextEditor = <RichTextEditor>(<EJ2Instance>element).ej2_instances[0];
                    rte.destroy();
                } else if (id === 'Resources') {
                    const treeGridObj: TreeGrid = <TreeGrid>(<EJ2Instance>element).ej2_instances[0];
                    treeGridObj.destroy();
                } else if (id.indexOf('Custom') !== -1) {
                    this.destroyCustomField(element);
                }
            }
        }
    }

    private destroyCustomField(element: HTMLElement): void {
        const childNodes: NodeList = element.childNodes;
        const ganttObj: Gantt = this.parent;
        for (let i: number = 0; i < childNodes.length; i++) {
            const div: HTMLElement = childNodes[i as  number] as HTMLElement;
            const inputElement: HTMLInputElement = div.querySelector('input[id^="' + ganttObj.element.id + '"]');
            if (inputElement) {
                const fieldName: string = inputElement.id.replace(ganttObj.element.id, '');
                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                const controlObj: any = <any>(<EJ2Instance>div.querySelector('#' + ganttObj.element.id + fieldName)).ej2_instances[0];
                if (!isNullOrUndefined(controlObj)) {
                    const column: GanttColumnModel = ganttObj.columnByField[fieldName as string];
                    if (!isNullOrUndefined(column) && !isNullOrUndefined(column.edit) && !isNullOrUndefined(column.edit.destroy) &&
                    isNullOrUndefined(column.edit.params)) {
                        let destroy: Function = column.edit.destroy as Function;
                        if (typeof destroy === 'string') {
                            destroy = getObject(destroy, window);
                            destroy();
                        } else {
                            (column.edit.destroy as () => void)();
                        }
                    } else {
                        controlObj.destroy();
                    }
                }
            }
        }
    }
    /**
     * @returns {void} .
     * @private
     */
    public destroy(): void {
        this.resetValues();
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.off('chartDblClick', this.dblClickHandler);
        this.parent.editModule.dialogModule = undefined;
    }
    /**
     * Method to get current edit dialog fields value
     *
     * @returns {AddDialogFieldSettings} .
     */
    private getEditFields(): AddDialogFieldSettingsModel[] {
        if (this.isEdit) {
            return this.updatedEditFields;
        } else {
            return this.updatedAddFields;

        }
    }
    private createTab(dialogModel: DialogModel, dialog: HTMLElement): void {
        const ganttObj: Gantt = this.parent;
        const tabModel: TabModel = {}; const tabItems: TabItemModel[] = [];
        let dialogSettings: AddDialogFieldSettingsModel[] = this.getEditFields();
        if (this.isEdit === true && ganttObj.viewType === 'ResourceView' && this.rowData.hasChildRecords) {
            // Filter to only keep the General tab
            dialogSettings = dialogSettings.filter(function(tab: AddDialogFieldSettingsModel): boolean {
                return tab.type === 'General';
            });
        }
        let tabElement: HTMLElement;
        const tasks: TaskFieldsModel = ganttObj.taskFields;
        const length: number = dialogSettings.length;
        tabModel.items = tabItems;
        tabModel.locale = this.parent.locale;
        tabModel.enableRtl = this.parent.enableRtl;
        this.beforeOpenArgs.tabModel = tabModel;
        let count: number = 0; let index: number = 0;
        if (length > 0) {
            for (let i: number = 0; i < length; i++) {
                const dialogField: AddDialogFieldSettingsModel = dialogSettings[i as number];
                const tabItem: TabItemModel = {};
                if (dialogField.type === 'General') {
                    if (Object.keys(ganttObj.columnMapping).length === 0) {
                        continue;
                    }
                    if (isNullOrUndefined(dialogField.headerText)) {
                        dialogField.headerText = this.localeObj.getConstant('generalTab');
                    }
                    tabItem.content = 'General';
                    this.beforeOpenArgs[tabItem.content] = this.getFieldsModel(dialogField.fields);
                } else if (dialogField.type === 'Segments') {
                    if (isNullOrUndefined(tasks.segments)) {
                        continue;
                    }
                    if (isNullOrUndefined(dialogField.headerText)) {
                        dialogField.headerText = this.localeObj.getConstant('segments');
                    }
                    tabItem.content = 'Segments';
                    this.beforeOpenArgs[tabItem.content] = this.getSegmentsModel(dialogField.fields);
                } else if (dialogField.type === 'Dependency') {
                    if (isNullOrUndefined(tasks.dependency)) {
                        continue;
                    }
                    if (isNullOrUndefined(dialogField.headerText)) {
                        dialogField.headerText = this.localeObj.getConstant('dependency');
                    }
                    tabItem.content = 'Dependency';
                    this.beforeOpenArgs[tabItem.content] = this.getPredecessorModel(dialogField.fields);
                } else if (dialogField.type === 'Resources') {
                    if (isNullOrUndefined(tasks.resourceInfo)) {
                        continue;
                    }
                    if (isNullOrUndefined(dialogField.headerText)) {
                        dialogField.headerText = this.localeObj.getConstant('resourceName');
                    }
                    tabItem.content = 'Resources';
                    this.beforeOpenArgs[tabItem.content] = this.getResourcesModel(dialogField.fields);
                } else if (dialogField.type === 'Notes') {
                    if (isNullOrUndefined(tasks.notes)) {
                        continue;
                    }
                    if (isNullOrUndefined(dialogField.headerText)) {
                        dialogField.headerText = this.localeObj.getConstant('notes');
                    }
                    tabItem.content = 'Notes';
                    this.beforeOpenArgs[tabItem.content] = this.getNotesModel(dialogField.fields);
                } else if (dialogField.type === 'Advanced') {
                    if (isNullOrUndefined(dialogField.headerText)) {
                        dialogField.headerText = this.localeObj.getConstant('advancedTab');
                    }
                    tabItem.content = 'Advanced';
                    this.beforeOpenArgs[tabItem.content] = this.getFieldsModel(dialogField.fields);
                } else {
                    if (isNullOrUndefined(dialogField.fields) || dialogField.fields.length === 0) {
                        continue;
                    }
                    if (isNullOrUndefined(dialogField.headerText)) {
                        dialogField.headerText = this.localeObj.getConstant('customTab');   // eslint-disable-next-line
                        count++;
                    }
                    tabItem.content = 'Custom' + '' + index++;
                    this.beforeOpenArgs[tabItem.content] = this.getFieldsModel(dialogField.fields);
                }
                tabItem.header = { text: dialogField.headerText };
                tabItems.push(tabItem);
            }
        }
        this.beforeOpenArgs.requestType = this.isEdit ? 'beforeOpenEditDialog' : 'beforeOpenAddDialog';
        this.parent.trigger('actionBegin', this.beforeOpenArgs, (arg: ActionBeginArgs | CObject) => {
            if (!arg.cancel) {
                this.parent['showLoadingIndicator']();
                this.renderTabItems();
                tabModel.selected = this.tabSelectedEvent.bind(this);
                tabModel.height = this.parent.isAdaptive ? '100%' : 'auto';
                tabModel.overflowMode = 'Scrollable';
                this.tabObj = new Tab(tabModel);
                this.tabObj.isStringTemplate = true;
                tabElement = this.parent.createElement('div', { id: ganttObj.element.id + '_Tab' });
                this.tabObj.appendTo(tabElement);
                dialogModel.content = tabElement;
                this.dialog = dialog;
                this.dialogObj = new Dialog(dialogModel);
                this.dialogObj.isStringTemplate = true;
                this.dialogObj.appendTo(this.dialog);
                const actionCompleteArgs: CObject = {
                    action: 'OpenDialog',
                    requestType: this.isEdit ? 'openEditDialog' : 'openAddDialog',
                    data: this.beforeOpenArgs.rowData,
                    element: this.dialog,
                    cancel: false
                };
                const columns: ColumnModel[] = this.parent.treeGrid.grid.getColumns();
                /* eslint-disable-next-line */
                const isValidateColumn: boolean = columns.some((obj: any) => obj.validationRules);
                if (isValidateColumn) {
                    this.CustomformObj = null;
                    this.formObj = null;
                    this.storeValidTab = null;
                    this.customFieldColumn = [];
                    this.taskFieldColumn = [];
                    this.changeFormObj(actionCompleteArgs.element);
                }
                this.parent.trigger('actionComplete', actionCompleteArgs, (actionCompleteArg: CObject) => {
                    this.parent['hideLoadingIndicator']();
                    if (actionCompleteArg.cancel) {
                        this.resetValues();
                    }
                });
            }
            else {
                arg.cancel = false;
                this.parent['hideLoadingIndicator']();
            }
        });
    }
    /* eslint-disable-next-line */
    private changeFormObj(actionCompleteArgs: any): void {
        if (!this.storeColumn) {
            this.storeColumn = this.parent.treeGrid.grid.getColumns();
        }
        if (!this.taskfields) {
            this.taskfields = this.parent.taskFields['properties'];
        }
        if (!this.storeValidTab) {
            this.storeValidTab = this.getFilteredDialogFields();
        }
        if (this.customFieldColumn.length === 0 || this.taskFieldColumn.length === 0) {
            this.validateColumn(this.storeColumn, this.taskfields, this.storeValidTab);
        }

        if (this.isFromAddDialog && this.parent.addDialogFields && this.parent.addDialogFields.length > 0) {
            const firstFieldType: DialogFieldType = this.parent.addDialogFields[0].type;
            if (firstFieldType === 'Resources' || firstFieldType === 'Dependency') {
                this.firstOccuringTab = firstFieldType;
            }
        } else if (this.isFromEditDialog && this.parent.editDialogFields && this.parent.editDialogFields.length > 0) {
            const firstFieldType: DialogFieldType = this.parent.editDialogFields[0].type;
            if (firstFieldType === 'Resources' || firstFieldType === 'Dependency') {
                this.firstOccuringTab = firstFieldType;
            }
        }
        if (!this.CustomformObj || !this.formObj) {
            const customFieldColumns: ColumnModel[] = this.customFieldColumn;
            const taskFieldColumns: ColumnModel[] = this.taskFieldColumn;
            if (!this.CustomformObj && customFieldColumns && customFieldColumns.length > 0) {
                /* eslint-disable-next-line */
                const validationRulesArray: { [key: string]: { [rule: string]: any } } = {};
                for (let i: number = 0; i < customFieldColumns.length; i++) {
                    const customColumn: ColumnModel = customFieldColumns[i as number]; // Rename the variable
                    if (customColumn.visible && customColumn.validationRules) {
                        validationRulesArray[customColumn.field] = customColumn.validationRules;
                    }
                }
                if (Object.keys(validationRulesArray).length > 0) {
                    this.CustomformObj = actionCompleteArgs.querySelector('#' + this.parent.element.id + 'Custom0TabContainer') as HTMLElement;
                    if (this.CustomformObj) {
                        this.CustomformObj = this.createFormObj(this.CustomformObj, validationRulesArray);
                    }
                }
            }
            if (!this.formObj && taskFieldColumns && taskFieldColumns.length > 0) {
                /* eslint-disable-next-line */
                const validationRulesArray: { [key: string]: { [rule: string]: any } } = {};
                for (let i: number = 0; i < taskFieldColumns.length; i++) {
                    const taskColumn: ColumnModel = taskFieldColumns[i as number]; // Rename the variable
                    if (taskColumn.visible && taskColumn.validationRules) {
                        validationRulesArray[taskColumn.field] = taskColumn.validationRules;
                    }
                }
                if (Object.keys(validationRulesArray).length > 0) {
                    this.formObj = actionCompleteArgs.querySelector('#' + this.parent.element.id + 'GeneralTabContainer') as HTMLElement;
                    if (this.formObj) {
                        this.formObj = this.createFormObj(this.formObj, validationRulesArray);
                    }
                }
            }
        }
        this.isFromAddDialog = false;
        this.isFromEditDialog = false;
    }

    private getFilteredDialogFields(): AddDialogFieldSettingsModel[] | EditDialogFieldSettingsModel[] | null {
        const dialogFields: EditDialogFieldSettingsModel[] = this.isFromAddDialog
            ? this.parent.addDialogFields
            : this.parent.editDialogFields;

        if (dialogFields.length !== 0) {
            return dialogFields.filter((obj: EditDialogFieldSettingsModel) => obj.type === 'General' || obj.type === 'Custom');
        }
        return null;
    }
    /* eslint-disable-next-line */
    private validateColumn(storeColumn: any, taskfields: any, storeValidTab: AddDialogFieldSettingsModel[] | EditDialogFieldSettingsModel[]): void {
        if (storeValidTab) {
            storeValidTab.forEach((element: AddDialogFieldSettingsModel | EditDialogFieldSettingsModel) => {
                /* eslint-disable-next-line */
                const targetArray: any[] = element.type === 'General' ? this.taskFieldColumn : this.customFieldColumn;
                element.fields.forEach((field: string) => {
                    const columnValue: GanttColumnModel = this.parent.getColumnByField(field, storeColumn);
                    if (columnValue !== null) {
                        targetArray.push(columnValue);
                    } else {
                        targetArray.push(this.parent.columnByField[field as string]);
                    }
                });
            });
        } else {
            /* eslint-disable-next-line */
            storeColumn.forEach((column: { field: any }) => {
                if (this.parent.customColumns.indexOf(column.field) !== -1) {
                    this.customFieldColumn.push(column);
                } else {
                    this.taskFieldColumn.push(column);
                }
            });
        }
    }
    private createFormObj(form: HTMLFormElement, rules: { [name: string]: { [rule: string]: Object } }): FormValidator {
        return new FormValidator(form, {
            rules: rules,
            locale: this.parent.locale,
            validationComplete: (args: { status: string, inputName: string, element: HTMLElement, message: string }) => {
                this.validationComplete(args);
            },
            customPlacement: (inputElement: HTMLElement, error: HTMLElement) => {
                const nameAttribute: string = inputElement.getAttribute('name');
                if (nameAttribute) {
                    const columnName: string = nameAttribute;
                    this.valErrorPlacement(inputElement, error, columnName);
                }
            }
        });
    }

    private valErrorPlacement(inputElement: HTMLElement, error: HTMLElement, columnName: string): void {
        const id: string = `${columnName}-tooltip`;
        const elem: HTMLElement | null = this.getElemTable(inputElement);
        if (!elem) {
            this.createTooltip(inputElement, error, id);
        } else {
            const tooltipContent: Element = elem.querySelector('.e-tip-content');
            if (tooltipContent) {
                tooltipContent.innerHTML = error.outerHTML;
            }
        }
    }

    private createTooltip(inputElement: HTMLElement, errorMessage: HTMLElement, id: string, display: string = 'block'): void {
        const existingTooltip: HTMLElement = document.getElementById(id);
        if (existingTooltip) {
            existingTooltip.remove();
        }

        const parentElement: HTMLElement = inputElement.parentElement;
        if (parentElement) {
            parentElement.style.position = 'relative';
        }

        const tooltipContainer: HTMLDivElement = document.createElement('div');
        tooltipContainer.className = 'e-tooltip-wrap e-lib e-control e-popup e-griderror';
        tooltipContainer.style.display = display;
        tooltipContainer.style.zIndex = '1000';

        const labelId: string = `${id}-label`;
        const tooltipLabel: HTMLDivElement = document.createElement('div');
        tooltipLabel.id = labelId;
        tooltipLabel.className = 'sr-only';

        const tooltipContent: HTMLDivElement = document.createElement('div');
        tooltipContent.className = 'e-tip-content';

        const errorMessageElement: HTMLDivElement = document.createElement('div');
        errorMessageElement.className = 'error-message';
        errorMessageElement.appendChild(errorMessage.cloneNode(true));

        const arrow: HTMLDivElement = document.createElement('div');
        arrow.className = 'e-arrow-tip e-tip-top';
        arrow.appendChild(document.createElement('div')).className = 'e-arrow-tip-outer e-tip-top';
        arrow.appendChild(document.createElement('div')).className = 'e-arrow-tip-inner e-tip-top';

        tooltipContainer.setAttribute('aria-labelledby', labelId);

        tooltipContent.appendChild(errorMessageElement);
        tooltipContainer.appendChild(tooltipContent);
        tooltipContainer.appendChild(arrow);
        tooltipContainer.style.top = '125%';
        tooltipContainer.style.left = '50%';
        tooltipContainer.style.transform = 'translateX(-50%)';

        if (parentElement) {
            parentElement.appendChild(tooltipLabel);
            parentElement.appendChild(tooltipContainer);
        }
    }

    private getElemTable(inputElement: Element): HTMLElement | null {
        const parentElement: HTMLElement = inputElement.parentElement;
        if (parentElement) {
            return parentElement.querySelector('.e-tooltip-wrap') as HTMLElement | null;
        }
        return null;
    }

    private validationComplete(args: { status: string, inputName: string, element: HTMLElement, message: string }): void {
        const elem: HTMLElement | null = this.getElemTable(args.element);
        if (elem) {
            if (args.status === 'failure') {
                elem.style.display = '';
            } else {
                elem.style.display = 'none';
            }
        }
    }

    private tabSelectedEvent(args: SelectEventArgs): void {
        const ganttObj: Gantt = this.parent;
        const id: string = (args.selectedContent.childNodes[0] as HTMLElement).id;
        const dialogModule: DialogEdit = this.parent.editModule.dialogModule;
        const dialog: HTMLElement = dialogModule.dialog;
        const hasEditedBatchCell: boolean = dialog.getElementsByClassName('e-editedbatchcell').length > 0;
        const hasEditedOrAddedRow: boolean = dialog.getElementsByClassName('e-editedrow').length > 0 ||
            dialog.getElementsByClassName('e-addedrow').length > 0;

        if (dialogModule.storeResourceTab && hasEditedBatchCell) {
            (document.querySelector('#' + ganttObj.element.id + '' + 'Resources' +
                'TabContainer_gridcontrol') as any).ej2_instances[0].saveCell();
        }
        else if (dialogModule.storeDependencyTab && hasEditedOrAddedRow) {
            (document.querySelector('#' + ganttObj.element.id + '' + 'Dependency' +
                'TabContainer') as any).ej2_instances[0].editModule.batchSave();
        }
        if (id === ganttObj.element.id + 'DependencyTabContainer') {
            this.storeDependencyTab = args.selectedContent;
        }
        if (id === ganttObj.element.id + 'ResourcesTabContainer') {
            this.storeResourceTab = args.selectedContent;
        }
        if (id === ganttObj.element.id + 'Custom0TabContainer') {
            const columns: ColumnModel[] = this.parent.treeGrid.grid.getColumns();
            /* eslint-disable-next-line */
            const isValidateColumn: boolean = columns.some((obj: any) => obj.validationRules);
            if (isValidateColumn) {
                this.changeFormObj(args.selectedContent);
            }
        }
        if (id === ganttObj.element.id + 'GeneralTabContainer') {
            const columns: ColumnModel[] = this.parent.treeGrid.grid.getColumns();
            /* eslint-disable-next-line */
            const isValidateColumn: boolean = columns.some((obj: any) => obj.validationRules);
            if (isValidateColumn) {
                this.changeFormObj(args.selectedContent);
            }
        }
        if (this.parent.isAdaptive || this.parent.enableAdaptiveUI) {
            this.responsiveTabContent(id, ganttObj);
        }
        if (id === ganttObj.element.id + 'ResourcesTabContainer') {
            this.resourceSelection(id);
        } else if (id === ganttObj.element.id + 'NotesTabContainer') {
            ((<EJ2Instance>document.getElementById(id)).ej2_instances[0] as RichTextEditor).refresh();
            // const notesTabElement: HTMLElement = document.querySelector('#' + this.parent.element.id + 'NotesTabContainer') as HTMLInputElement;
        } else if (id === ganttObj.element.id + 'SegmentsTabContainer') {
            if (isNullOrUndefined((this.beforeOpenArgs.rowData as IGanttData).ganttProperties.startDate)) {
                ((<EJ2Instance>document.getElementById(id)).ej2_instances[0] as Grid)
                    .enableToolbarItems([this.parent.element.id + 'SegmentsTabContainer' + '_add'], false);
            } else {
                ((<EJ2Instance>document.getElementById(id)).ej2_instances[0] as Grid)
                    .enableToolbarItems([this.parent.element.id + 'SegmentsTabContainer' + '_add'], true);
            }

        }
    }

    private responsiveTabContent(id: string, ganttObj: Gantt): void {
        const dialogContent: HTMLElement = document.getElementById(ganttObj.element.id + '_dialog_dialog-content');
        let dialogContentHeight: number = dialogContent.clientHeight;
        dialogContentHeight -= (dialogContent.querySelector('.e-tab-header') as HTMLElement).offsetHeight;
        const grid: HTMLElement = document.querySelector('#' + id);
        if (grid.classList.contains('e-grid')) {
            dialogContentHeight -= (((grid as EJ2Instance).ej2_instances[0] as Grid).getHeaderContent() as HTMLElement).offsetHeight;
            const toolbar: HTMLElement = grid.querySelector('.e-toolbar');
            if (toolbar) {
                dialogContentHeight -= toolbar.offsetHeight;
            }
        }
        grid.parentElement.style.height = dialogContentHeight + 'px';
    }

    private getFieldsModel(fields: string[]): Record<string, unknown> {
        const fieldsModel: Record<string, unknown> = {};
        const columnByField: Object = this.parent.columnByField;
        for (let i: number = 0; i < fields.length; i++) {
            if (fields[i as number] === this.parent.taskFields.dependency ||
                fields[i as number] === this.parent.taskFields.resourceInfo ||
                fields[i as number] === this.parent.taskFields.notes) {
                continue;
            }
            if (!isNullOrUndefined(columnByField[fields[i as number]])) {
                const fieldName: string = fields[i as number];
                this.createInputModel(columnByField[fieldName as string], fieldsModel);
            }
        }
        return fieldsModel;
    }

    private processAndValidateScheduleDates(ganttObj: Gantt, taskSettings: TaskFieldsModel): void {
        const constraintDate: Element = ganttObj.editModule.dialogModule.dialog.querySelector('#' + ganttObj.element.id + taskSettings.constraintDate);
        const constraintType: Element = ganttObj.editModule.dialogModule.dialog.querySelector('#' + ganttObj.element.id + taskSettings.constraintType);
        const startDateElement: Element = this.dialog.querySelector('#' + ganttObj.element.id + taskSettings.startDate);
        const endDateElement: Element = this.dialog.querySelector('#' + ganttObj.element.id + taskSettings.endDate);
        this.alignDateWithConstraint(constraintDate, constraintType, startDateElement, endDateElement);
    }
    private createInputModel(column: GanttColumnModel, fieldsModel: object): object {
        const ganttObj: Gantt = this.parent;
        const locale: string = this.parent.locale;
        const taskSettings: TaskFieldsModel = this.parent.taskFields;
        const common: Object = {
            placeholder: column.headerText,
            floatLabelType: 'Auto'
        };
        if (!isNullOrUndefined(this.parent.taskFields.id) && !isNullOrUndefined(this.parent.columnMapping.id)
        && !isNullOrUndefined(this.numericOrString) ) {
            if (taskSettings.id === column.field) {
                column.editType = this.numericOrString;
            }
        }
        if (column['editTemplate']) {
            const index: number = this.parent.currentViewData.indexOf(this.rowData);
            const templateCompiler: Function = this.parent.chartRowsModule.templateCompiler(column['editTemplate']);
            const template: NodeList = templateCompiler(
                extend({ index: index }, this.editedRecord), this.parent, 'EditTemplate',
                this.parent.chartRowsModule.getTemplateID('EditTemplate'), false, undefined, null, this.parent.treeGrid['root']);
            fieldsModel[column.field] = template;
        }
        else {
            switch (column.editType) {
            case 'booleanedit':
            {
                const checkboxModel: CheckBoxModel = {
                    label: column.headerText,
                    locale: locale,
                    enableRtl: this.parent.enableRtl
                };
                fieldsModel[column.field] = checkboxModel;
                break;
            }
            case 'defaultedit':
            case 'stringedit':
            {
                const textBox: TextBox = common as TextBox;
                textBox.enableRtl = this.parent.enableRtl;
                if (column.field === ganttObj.columnMapping.duration ||
                    column.field === ganttObj.columnMapping.id || column.field === ganttObj.columnMapping.startDate ||
                    column.field === ganttObj.columnMapping.endDate || column.field === ganttObj.columnMapping.baselineDuration) {
                    textBox.change = (args: CObject): void => {
                        if (!this.isTriggered) {
                            if ((column.field === this.parent.taskFields.duration ||
                                column.field === this.parent.taskFields.work ||
                                column.field === this.parent.taskFields.baselineDuration) && !this.isTriggered) {
                                this.isTriggered = true;
                                this.parent['triggeredColumnName'] = column.field;
                            }
                            this.validateScheduleFields(args, column, ganttObj);
                        }
                        else {
                            this.parent['triggeredColumnName'] = '';
                        }
                    };
                }
                fieldsModel[column.field] = common;
                break;
            }
            case 'numericedit':
            {
                const numeric: NumericTextBoxModel = <NumericTextBoxModel>common;
                numeric.enableRtl = this.parent.enableRtl;
                if (taskSettings.progress === column.field) {
                    numeric.min = 0;
                    numeric.max = 100;
                    const hasDecimalEdit: boolean = this.parent.dataOperation['isDecimalProgress'](column.field);
                    if (hasDecimalEdit) {
                        numeric.decimals = (column.edit.params as NumericTextBoxModel).decimals ?
                            (column.edit.params as NumericTextBoxModel).decimals : 0;
                        if (column.format && typeof column.format === 'string' && column.format.match(/^n(\d+)$/)) {
                            numeric.format = column.format;
                        }
                    }
                    else {
                        numeric.decimals = 0;
                        numeric.format = 'n0';
                        numeric.validateDecimalOnType = true;
                    }
                }
                numeric.change = (args: CObject): void => {
                    if (!this.isTriggered) {
                        if ((column.field === this.parent.taskFields.duration ||
                            column.field === this.parent.taskFields.work) && !this.isTriggered) {
                            this.isTriggered = true;
                            this.parent['triggeredColumnName'] = column.field;
                        }
                        this.validateScheduleFields(args, column, ganttObj);
                    }
                    else {
                        this.parent['triggeredColumnName'] = '';
                    }
                };
                fieldsModel[column.field] = numeric;
                break;
            }
            case 'datepickeredit':
            {
                const datePickerObj: DatePickerModel = common as DatePickerModel;
                datePickerObj.format = this.parent.getDateFormat();
                datePickerObj.enableRtl = this.parent.enableRtl;
                datePickerObj.strictMode = true;
                datePickerObj.firstDayOfWeek = ganttObj.timelineModule.customTimelineSettings.weekStartDay;
                if (column.field === ganttObj.columnMapping.startDate ||
                    column.field === ganttObj.columnMapping.endDate ||
                    column.field === ganttObj.columnMapping.constraintDate ||
                    column.field === ganttObj.columnMapping.baselineStartDate ||
                    column.field === ganttObj.columnMapping.baselineEndDate) {
                    const isBaseline: boolean = column.field === ganttObj.columnMapping.baselineStartDate ||
                        column.field === ganttObj.columnMapping.baselineEndDate;
                    if (!isBaseline) {
                        datePickerObj.renderDayCell = this.parent.renderWorkingDayCell.bind(this.parent);
                    }
                    datePickerObj.change = (args: CObject): void => {
                        if (column.field !== taskSettings.constraintDate) {
                            this.validateScheduleFields(args, column, ganttObj);
                        } else {
                            this.processAndValidateScheduleDates(ganttObj, taskSettings);
                        }
                    };
                }
                fieldsModel[column.field] = datePickerObj;
                break;
            }
            case 'datetimepickeredit':
            {
                const dateTimePickerObj: DatePickerModel = common as DatePickerModel;
                dateTimePickerObj.format = this.parent.getDateFormat();
                dateTimePickerObj.enableRtl = this.parent.enableRtl;
                dateTimePickerObj.strictMode = true;
                dateTimePickerObj.firstDayOfWeek = ganttObj.timelineModule.customTimelineSettings.weekStartDay;
                if (column.field === ganttObj.columnMapping.startDate ||
                    column.field === ganttObj.columnMapping.endDate ||
                    column.field === ganttObj.columnMapping.baselineStartDate ||
                    column.field === ganttObj.columnMapping.baselineEndDate) {
                    const isBaseline: boolean = column.field === ganttObj.columnMapping.baselineStartDate ||
                        column.field === ganttObj.columnMapping.baselineEndDate;
                    if (!isBaseline) {
                        dateTimePickerObj.renderDayCell = this.parent.renderWorkingDayCell.bind(this.parent);
                    }
                    dateTimePickerObj.change = (args: CObject): void => {
                        if (column.field !== taskSettings.constraintDate) {
                            this.validateScheduleFields(args, column, ganttObj);
                        } else {
                            this.processAndValidateScheduleDates(ganttObj, taskSettings);
                        }
                    };
                }
                fieldsModel[column.field] = dateTimePickerObj;
                break;
            }
            case 'dropdownedit':
                if (column.field === ganttObj.columnMapping.type || column.field === ganttObj.columnMapping.manual ||
                    column.field === ganttObj.columnMapping.constraintType) {
                    const dataKey: string = 'dataSource';
                    const fieldsKey: string = 'fields';
                    const types: Record<string, unknown>[] = [
                        { 'ID': 1, 'Value': 'FixedUnit' }, { 'ID': 2, 'Value': 'FixedWork' }, { 'ID': 3, 'Value': 'FixedDuration' }];
                    common[dataKey as string] = types;
                    common[fieldsKey as string] = { value: 'Value' };
                    const dropDownListObj: DropDownListModel = common as DropDownListModel;
                    dropDownListObj.enableRtl = this.parent.enableRtl;
                    dropDownListObj.change = (args: CObject | ChangeEventArgs): void => {
                        if (column.field === taskSettings.manual) {
                            this.editedRecord.ganttProperties.isAutoSchedule = !args.value;
                        }
                        if (column.field !== taskSettings.constraintType) {
                            this.validateScheduleFields(args as CObject, column, ganttObj);
                        } else {
                            this.dialogConstraintValue = Number(args.value);
                            this.processAndValidateScheduleDates(ganttObj, taskSettings);
                        }
                    };
                }
                fieldsModel[column.field] = common;
                break;
            case 'maskededit':
                fieldsModel[column.field] = common;
                break;
            }
        }
        if (!isNullOrUndefined(column.edit) && !isNullOrUndefined(column.edit.params)) {
            extend(fieldsModel[column.field], column.edit.params);
        }
        return fieldsModel;
    }
    private setConstraintDateBasedOnType(
        currentDate: Date | undefined,
        constraintType: number,
        constraintDateElement: HTMLElement | null,
        startDate: Date,
        endDate: Date
    ): void {
        if (!currentDate && constraintDateElement) {
            switch (constraintType) {
            case ConstraintType.StartNoEarlierThan:
            case ConstraintType.StartNoLaterThan:
            case ConstraintType.MustStartOn:
                constraintDateElement['value'] = new Date(startDate);
                break;
            case ConstraintType.FinishNoEarlierThan:
            case ConstraintType.FinishNoLaterThan:
            case ConstraintType.MustFinishOn:
                constraintDateElement['value'] = new Date(endDate);
                break;
            }
        }
    }
    private alignDateWithConstraint(
        constraintDate: Element | null,
        constraintType: Element | null,
        startDateElement: Element | null,
        endDateElement: Element | null
    ): void {
        let dateValue: Date = constraintDate
            ? (constraintDate as HTMLInputElement)['ej2_instances'][0].value
            : this.editedRecord.ganttProperties.constraintDate;

        const typeValue: number = constraintType
            ? (constraintType as HTMLInputElement)['ej2_instances'][0].value
            : this.editedRecord.ganttProperties.constraintType;

        const startDateValue: Date = startDateElement
            ? (startDateElement as HTMLInputElement)['ej2_instances'][0].value
            : this.editedRecord.ganttProperties.startDate;

        const endDateValue: Date = endDateElement
            ? (endDateElement as HTMLInputElement)['ej2_instances'][0].value
            : this.editedRecord.ganttProperties.endDate;
        if (
            !dateValue &&
            typeValue !== ConstraintType.AsSoonAsPossible &&
            typeValue !== ConstraintType.AsLateAsPossible &&
            (constraintDate as HTMLInputElement)
        ) {
            this.setConstraintDateBasedOnType(dateValue, typeValue, (constraintDate as HTMLInputElement)['ej2_instances'][0], startDateValue, endDateValue);
        }
        // Convert to Date objects for comparison
        const start: Date = new Date(startDateValue);
        const end: Date = new Date(endDateValue);
        let constraint: Date = this.parent['assignTimeToDate'](dateValue, this.parent['getCurrentDayStartTime'](dateValue));
        const isValidPredecessor: IPredecessor[] = this.parent.predecessorModule['filterPredecessorsByTarget'](
            this.editedRecord.ganttProperties.predecessor,
            this.editedRecord,
            this.parent.viewType
        );
        // Handle different constraint types
        switch (typeValue) {
        case ConstraintType.MustStartOn: // 2
            constraint = dateValue = this.parent.dateValidationModule.checkStartDate(new Date(constraint));
            if (start.getTime() !== constraint.getTime()) {
                if (startDateElement) {
                    (startDateElement as HTMLInputElement)['ej2_instances'][0].value = dateValue;
                }
            }
            break;
        case ConstraintType.MustFinishOn:
            constraint.setDate(constraint.getDate() + 1);
            constraint = dateValue = this.parent.dateValidationModule.checkEndDate(new Date(constraint));
            if (end.getTime() !== constraint.getTime()) {
                dateValue = this.parent.dateValidationModule.getStartDate(
                    dateValue,
                    this.editedRecord.ganttProperties.duration,
                    this.editedRecord.ganttProperties.durationUnit,
                    this.editedRecord.ganttProperties
                );
                if (startDateElement) {
                    (startDateElement as HTMLInputElement)['ej2_instances'][0].value = dateValue;
                }
            }
            break;
        case ConstraintType.StartNoEarlierThan:
            constraint = dateValue = this.parent.dateValidationModule.checkStartDate(new Date(constraint));
            if (startDateElement) {
                (startDateElement as HTMLInputElement)['ej2_instances'][0].value = dateValue;
            }
            break;
        case ConstraintType.StartNoLaterThan: // 5
            if (
                this.editedRecord.ganttProperties.predecessor &&
                this.editedRecord.ganttProperties.predecessor.length > 0 &&
                isValidPredecessor.length !== 0
            ) {
                this.dialogConstraintDate = new Date(constraint);
                const dependencyValidationResult: {
                    isValid: boolean;
                    maxDate?: Date;
                } = this.parent.editModule.taskbarEditModule['isValidDependency'](this.editedRecord);
                if (startDateElement) {
                    (startDateElement as HTMLInputElement)['ej2_instances'][0].value = dependencyValidationResult.maxDate;
                }
            } else if (this.editedRecord.parentItem) {
                if (startDateElement) {
                    (startDateElement as HTMLInputElement)['ej2_instances'][0].value = this.parent.getRecordByID(this.editedRecord.parentItem.taskId).ganttProperties.startDate;
                }
            } else {
                if (startDateElement) {
                    (startDateElement as HTMLInputElement)['ej2_instances'][0].value = this.parent.dateValidationModule.checkStartDate(new Date(this.parent.projectStartDate));
                }
            }
            break;
        case ConstraintType.FinishNoEarlierThan: // 6
            constraint.setDate(constraint.getDate() + 1);
            constraint = dateValue = this.parent.dateValidationModule.checkEndDate(new Date(constraint));
            if (end.getTime() !== constraint.getTime()) {
                dateValue = this.parent.dateValidationModule.getStartDate(
                    dateValue,
                    this.editedRecord.ganttProperties.duration,
                    this.editedRecord.ganttProperties.durationUnit,
                    this.editedRecord.ganttProperties
                );
                if (startDateElement) {
                    (startDateElement as HTMLInputElement)['ej2_instances'][0].value = dateValue;
                }
            }
            break;
        case ConstraintType.FinishNoLaterThan: // 7
            if (
                this.editedRecord.ganttProperties.predecessor &&
                this.editedRecord.ganttProperties.predecessor.length > 0 &&
                isValidPredecessor.length !== 0
            ) {
                this.dialogConstraintDate = new Date(constraint);
                const dependencyValidationResult: {
                    isValid: boolean;
                    maxDate?: Date;
                } = this.parent.editModule.taskbarEditModule['isValidDependency'](this.editedRecord);
                if (startDateElement) {
                    (startDateElement as HTMLInputElement)['ej2_instances'][0].value = dependencyValidationResult.maxDate;
                }
            } else if (this.editedRecord.parentItem) {
                if (startDateElement) {
                    (startDateElement as HTMLInputElement)['ej2_instances'][0].value = this.parent.getRecordByID(this.editedRecord.parentItem.taskId).ganttProperties.startDate;
                }
            } else {
                if (startDateElement) {
                    (startDateElement as HTMLInputElement)['ej2_instances'][0].value = this.parent.dateValidationModule.checkStartDate(new Date(this.parent.projectStartDate));
                }
            }
            break;
        case ConstraintType.AsSoonAsPossible: // 0
            if (
                this.editedRecord.ganttProperties.predecessor &&
                this.editedRecord.ganttProperties.predecessor.length > 0 &&
                isValidPredecessor.length !== 0
            ) {
                const dependencyValidationResult: {
                    isValid: boolean;
                    maxDate?: Date;
                } = this.parent.editModule.taskbarEditModule['isValidDependency'](this.editedRecord);
                if (dependencyValidationResult.maxDate && startDateElement) {
                    (startDateElement as HTMLInputElement)['ej2_instances'][0].value = dependencyValidationResult.maxDate;
                }
            } else if (this.editedRecord.parentItem) {
                if (startDateElement) {
                    (startDateElement as HTMLInputElement)['ej2_instances'][0].value = this.parent.getRecordByID(this.editedRecord.parentItem.taskId).ganttProperties.startDate;
                }
            } else {
                if (startDateElement) {
                    (startDateElement as HTMLInputElement)['ej2_instances'][0].value = this.parent.dateValidationModule.checkStartDate(new Date(this.parent.projectStartDate));
                }
            }
            if ((constraintDate as HTMLInputElement)) {
                (constraintDate as HTMLInputElement)['ej2_instances'][0].value = null;
            }
            break;
        case ConstraintType.AsLateAsPossible: // 1
            if ((this.editedRecord as IGanttData)['parentItem']) {
                const checkedEnd: Date = this.parent.dateValidationModule.checkEndDate(
                    this.parent.getRecordByID(
                        (this.editedRecord as IGanttData).parentItem.taskId
                    ).ganttProperties.endDate
                );
                const start: Date = this.parent.dateValidationModule.getStartDate(
                    checkedEnd,
                    this.editedRecord.ganttProperties.duration,
                    this.editedRecord.ganttProperties.durationUnit,
                    this.editedRecord.ganttProperties
                );
                if ((startDateElement as HTMLInputElement)) {
                    (startDateElement as HTMLInputElement)['ej2_instances'][0].value = start;
                }
            } else {
                const checkedEnd: Date = this.parent.dateValidationModule.checkEndDate(new Date(this.parent.projectEndDate));
                const start: Date = this.parent.dateValidationModule.getStartDate(
                    checkedEnd,
                    this.editedRecord.ganttProperties.duration,
                    this.editedRecord.ganttProperties.durationUnit,
                    this.editedRecord.ganttProperties
                );
                if ((startDateElement as HTMLInputElement)) {
                    (startDateElement as HTMLInputElement)['ej2_instances'][0].value = start;
                }
            }
            if ((constraintDate as HTMLInputElement)) {
                (constraintDate as HTMLInputElement)['ej2_instances'][0].value = null;
            }
            break;
        }
    }
    /* eslint-disable */
    private validateScheduleFields(args: CObject, column: GanttColumnModel, ganttObj: Gantt): boolean {
        let dialog: HTMLElement;
        if (!isNullOrUndefined(ganttObj.editModule.dialogModule.dialog)) {
            dialog = ganttObj.editModule.dialogModule.dialog;
        }
        let targetId: string = null; let inputElement: HTMLInputElement;
        const currentData: IGanttData = ganttObj.editModule.dialogModule.editedRecord;
        let cellValue: string = null;
        let colName: string = null;
        let formObject: FormValidator;
        const ids: string[] = this.parent.viewType === 'ResourceView' ? this.parent.getTaskIds() : this.parent.ids;
        const strViewType: string = this.parent.viewType;
        if (!isNullOrUndefined(args.element)) {
            inputElement = args.element as HTMLInputElement;
            targetId = inputElement.getAttribute('id');
        } else if (!isNullOrUndefined(args.container)) {
            inputElement = args.container as HTMLInputElement;
            targetId = inputElement.querySelector('input').getAttribute('id');
            inputElement = inputElement.querySelector('#' + targetId);
        } else if (!isNullOrUndefined(args.event) && !isNullOrUndefined((args.event as CObject).path) &&
            !isNullOrUndefined((args.event as CObject).path)[1]) {
            inputElement = (args.event as CObject).path[1] as HTMLInputElement;
            targetId = inputElement.querySelector('input').getAttribute('id');
            inputElement = inputElement.querySelector('#' + targetId);
        }
        if (isNullOrUndefined(inputElement)) {
            cellValue = args.value as string;
            colName = column.field;
        } else {
            if (column.editType === 'datetimepickeredit') {
                cellValue = args.value as string;
            }
            else {
                cellValue = inputElement.value;
            }
            colName = targetId.replace(ganttObj.element.id, '');
            if (this.parent.columnByField[this.parent.taskFields.id].editType === 'stringedit') {
                const customFn: (args: { [key: string]: string }) => boolean = (args: { [key: string]: string }) => {
                    if (strViewType === 'ResourceView') {
                        return ids.indexOf('T' + args['value']) === -1 && ids.indexOf('R' + args['value']) === -1;
                    } else {
                        return ids.indexOf(args['value']) === -1;
                    }
                };
                const options: FormValidatorModel = {
                    rules: {
                        [this.parent.taskFields.id]: { required: true, minLength: [customFn, 'ID is already present, please enter new value'] }
                    }
                };
                /* eslint-disable-next-line */
                formObject = new FormValidator('#' + this.parent.element.id + 'GeneralTabContainer', options);
            }
        }
        if (colName.search('Segments') === 0) {
            colName = colName.replace('SegmentsTabContainer', '');
            this.validateSegmentFields(ganttObj, colName, cellValue, args);
            this.isTriggered = false;
            return true;
        } else {
            let isBaseline: boolean = false;
            if (this.parent.taskFields.baselineDuration === colName ||
                this.parent.taskFields.baselineStartDate === colName ||
                this.parent.taskFields.baselineEndDate === colName) {
                isBaseline = true;
            }
            this.validateScheduleValuesByCurrentField(colName, cellValue, this.editedRecord, isBaseline);
            const ganttProp: ITaskData = currentData.ganttProperties;
            const { startdateField, enddateField, durationField } = this.parent.dateValidationModule.getFieldMappings(isBaseline);
            const tasks: TaskFieldsModel = ganttObj.taskFields;
            if (!isNullOrUndefined(tasks.startDate || !isNullOrUndefined(tasks.baselineStartDate)) && tasks[startdateField] !== colName) {
                this.updateScheduleFields(dialog, ganttProp, startdateField);
            }
            if (tasks[enddateField] === colName && !isNullOrUndefined(ganttProp[startdateField]) && !isNullOrUndefined(args.value) &&
                ganttProp[startdateField].getTime() > args.value) {
                this.updateScheduleFields(dialog, ganttProp, enddateField);
            }
            if (!isNullOrUndefined(tasks[enddateField]) && tasks[enddateField] !== colName) {
                this.updateScheduleFields(dialog, ganttProp, enddateField);
                if (this.parent.taskFields.constraintType) {
                    this.updateScheduleFields(dialog, ganttProp, 'constraintDate');
                }
            }
            if (!isNullOrUndefined(tasks[durationField]) && tasks[durationField] !== colName || ganttProp[durationField] >= 0) {
                this.updateScheduleFields(dialog, ganttProp, durationField);
            }
            if (!isNullOrUndefined(tasks.work) && (tasks.work !== colName || ganttProp.taskType !== 'FixedWork')) {
                this.updateScheduleFields(dialog, ganttProp, 'work');
            }
            this.dialogEditValidationFlag = false;
            this.isTriggered = false;
            isBaseline = false;
            return true;
        }
    }
    private getConstraintDateElement(ganttId: string, columnName: string, taskField: TaskFieldsModel): Element | null {
        if (columnName === taskField.constraintDate) {
            for (const item of this.beforeOpenArgs.tabModel['items']) {
                if (item.header.text === 'Advanced') {
                    return item.content.querySelector('#' + ganttId + columnName);
                }
            }
        }
        return null;
    }

    private updateScheduleFields(dialog: HTMLElement, ganttProp: ITaskData, ganttField: string): void {
        const ganttObj: Gantt = this.parent;
        const ganttId: string = ganttObj.element.id;
        const columnName: string = getValue(ganttField, ganttObj.columnMapping);
        const col: GanttColumnModel = ganttObj.columnByField[columnName as string];
        let tempValue: string | Date | number;
        const taskField: TaskFieldsModel = this.parent.taskFields;
        if (col) {
            let element: Element = dialog.querySelector('#' + ganttId + columnName);
            if (col.editType === 'stringedit') {
                if (element) {
                    const textBox: TextBox = <TextBox>(<EJ2Instance>element).ej2_instances[0];
                    if (textBox) {
                        tempValue = !isNullOrUndefined(col.edit) && !isNullOrUndefined(col.edit.read) ? (col.edit.read as () => void)() :
                            !isNullOrUndefined(col.valueAccessor) ?
                                (col.valueAccessor as Function)(columnName, ganttObj.editModule.dialogModule.editedRecord, col) :
                                this.parent.dataOperation.getDurationString(ganttProp[ganttField], ganttProp.durationUnit);
                        if (textBox.value !== tempValue.toString() && taskField[ganttField] === columnName) {
                            textBox.value = tempValue as string;
                            textBox.dataBind();
                        } else if (taskField.startDate === columnName || taskField.endDate === columnName ||
                            taskField.baselineStartDate === columnName || taskField.baselineEndDate === columnName) {
                            if (taskField.startDate === columnName) {
                                textBox.value = ganttProp.startDate.toString();
                            }
                            else if (taskField.endDate === columnName) {
                                textBox.value = ganttProp.endDate.toString();
                            }
                            else if (taskField.baselineStartDate === columnName) {
                                textBox.value = ganttProp.baselineStartDate.toString();
                            }
                            else if (taskField.baselineEndDate === columnName) {
                                textBox.value = ganttProp.baselineEndDate.toString();
                            }
                            textBox.dataBind();
                        }
                    }
                }
            } else if (col.editType === 'datepickeredit' || col.editType === 'datetimepickeredit') {
                if (!element) {
                    element = this.getConstraintDateElement(ganttId, columnName, taskField);
                }
                if (element) {
                    const picker: DatePicker = col.editType === 'datepickeredit' ?
                        (<DatePicker>(<EJ2Instance>element).ej2_instances[0]) :
                        (<DateTimePicker>(<EJ2Instance>element).ej2_instances[0]);
                    if (picker) {
                        tempValue = ganttProp[ganttField as string];
                        if (((isNullOrUndefined(picker.value)) && !isNullOrUndefined(tempValue)) ||
                            (isNullOrUndefined(tempValue) && !isNullOrUndefined(picker.value)) ||
                            (picker.value !== tempValue && !isNullOrUndefined(picker.value) && !isNullOrUndefined(tempValue)
                                && picker.value.toString() !== tempValue.toString())) {
                            picker.value = tempValue as Date;
                            picker.dataBind();
                        }
                    }
                }
            }
            else if (col.editType === 'numericedit' && element) {
                const numericTextBox: NumericTextBox = <NumericTextBox>(
                    <EJ2Instance>element).ej2_instances[0];
                tempValue = ganttProp[ganttField as string];
                if (!isNullOrUndefined(tempValue) && numericTextBox.value !== tempValue) {
                    numericTextBox.value = tempValue as number;
                    numericTextBox.dataBind();
                }
            }
        }
    }

    /**
     * @param {IGanttData} ganttData .
     * @param {boolean} isBaseline - Indicates whether the calculation is specific to baseline dates.
     * @returns {void} .
     * @private
     */

    public validateDuration(ganttData: IGanttData, isBaseline?: boolean): void {
        const ganttProp: ITaskData = ganttData.ganttProperties;
        if (!this.dialogEditValidationFlag) {
            if (!isBaseline && !isNullOrUndefined(ganttProp.startDate) && !isScheduledTask(ganttProp) &&
                isNullOrUndefined(ganttProp.duration)) {
                this.parent.setRecordValue('endDate', null, ganttProp, true);
                this.parent.setRecordValue('isMilestone', false, ganttProp, true);
            } else if (!isBaseline && (isScheduledTask(ganttProp) || !isNullOrUndefined(ganttProp.startDate))) {
                if (ganttData.ganttProperties.isMilestone && ganttData.ganttProperties.duration !== 0) {
                    const updatedStartDate: Date = this.parent.dateValidationModule.checkStartDate(ganttProp.startDate);
                    this.parent.setRecordValue('startDate', updatedStartDate, ganttProp, true);
                    if (this.parent.taskFields.startDate) {
                        this.parent.dataOperation.updateMappingData(ganttData, 'startDate');
                    }
                }
                this.parent.dateValidationModule.calculateEndDate(ganttData);
            }

            else if (isBaseline && !isNullOrUndefined(ganttProp.baselineStartDate)) {
                if (ganttData.ganttProperties.baselineDuration !== 0) {
                    const updatedStartDate: Date = this.parent.dateValidationModule.checkStartDate(ganttProp.baselineStartDate,
                        undefined, undefined, undefined, true);
                    this.parent.setRecordValue('baselineStartDate', updatedStartDate, ganttProp, true);
                    if (this.parent.taskFields.baselineStartDate) {
                        this.parent.dataOperation.updateMappingData(ganttData, 'baselineStartDate');
                    }
                }
                this.parent.dateValidationModule.calculateEndDate(ganttData, isBaseline);
            } else if (!isScheduledTask(ganttProp) && !isNullOrUndefined(ganttProp.endDate)) {
                this.parent.dateValidationModule.calculateStartDate(ganttData, isBaseline);
            }
            else if (!isNullOrUndefined(ganttProp.endDate)) {
                this.parent.dateValidationModule.calculateStartDate(ganttData, isBaseline);
            }
            else if (isNullOrUndefined(ganttProp.baselineEndDate)) {
                this.parent.dateValidationModule.calculateStartDate(ganttData, isBaseline);
            }
            if (!isBaseline) {
                const milestone: boolean = ganttProp.duration === 0 ? true : false;
                this.parent.setRecordValue('isMilestone', milestone, ganttProp, true);
            }
            this.dialogEditValidationFlag = true;
        }
    }

    private validateStartDate(ganttData: IGanttData, isBaseline?: boolean): void {
        const ganttProp: ITaskData = ganttData.ganttProperties;
        const tasks: TaskFieldsModel = this.parent.taskFields;
        const { startdateField, enddateField, durationField } = this.parent.dateValidationModule.getFieldMappings(isBaseline);
        if (!this.dialogEditValidationFlag) {
            if (isNullOrUndefined(ganttProp[startdateField])) {
                this.parent.setRecordValue(durationField, null, ganttProp, true);
                if (!isBaseline) {
                    this.parent.setRecordValue('isMilestone', false, ganttProp, true);
                    if (this.parent.allowUnscheduledTasks && isNullOrUndefined(tasks.endDate)) {
                        this.parent.setRecordValue('endDate', null, ganttProp, true);
                    }
                }
            } else if (isScheduledTask(ganttProp) || isBaseline) {
                if (isNullOrUndefined(tasks[durationField])) {
                    this.parent.dateValidationModule.calculateDuration(ganttData, isBaseline);
                } else if (isNullOrUndefined(tasks[enddateField])) {
                    this.parent.dateValidationModule.calculateEndDate(ganttData, isBaseline);
                } else {
                    this.parent.dateValidationModule.calculateEndDate(ganttData, isBaseline);
                }
            }
            else {
                if (!isNullOrUndefined(ganttProp.endDate)) {
                    this.parent.dateValidationModule.calculateDuration(ganttData);
                } else if (!isNullOrUndefined(ganttProp.duration)) {
                    this.parent.dateValidationModule.calculateEndDate(ganttData);
                }
            }
            this.dialogEditValidationFlag = true;
        }
    }

    private validateEndDate(ganttData: IGanttData, isBaseline?: boolean): void {
        const ganttProp: ITaskData = ganttData.ganttProperties;
        const tasks: TaskFieldsModel = this.parent.taskFields;
        if (!this.dialogEditValidationFlag) {
            const { startdateField, enddateField, durationField } = this.parent.dateValidationModule.getFieldMappings(isBaseline);
            if (isNullOrUndefined(ganttProp[enddateField])) {
                this.parent.setRecordValue(durationField, null, ganttProp, true);
                if (!isBaseline) {
                    this.parent.setRecordValue('isMilestone', false, ganttProp, true);
                }
            } else if (isScheduledTask(ganttProp) || isBaseline) {
                if (isNullOrUndefined(tasks[durationField])) {
                    this.parent.dateValidationModule.calculateDuration(ganttData, isBaseline);
                } else if (isNullOrUndefined(ganttProp[startdateField])) {
                    this.parent.dateValidationModule.calculateStartDate(ganttData, isBaseline);
                } else {
                    if (!isBaseline) {
                        if (!isNullOrUndefined(ganttProp.segments) && ganttProp.segments.length > 0 && this.parent.editModule
                        && this.parent.editModule.cellEditModule) {
                            ganttProp.segments = this.parent.editModule.cellEditModule.validateEndDateWithSegments(ganttProp);
                        }
                    }
                    this.parent.dateValidationModule.calculateDuration(ganttData, isBaseline);
                }
            } else {
                if (!isNullOrUndefined(ganttProp[durationField])) {
                    this.parent.dateValidationModule.calculateStartDate(ganttData, isBaseline);
                } else if (!isNullOrUndefined(ganttProp[startdateField])) {
                    this.parent.dateValidationModule.calculateDuration(ganttData, isBaseline);
                }
            }
            this.dialogEditValidationFlag = true;
        }
    }
    private updateConstraintDate(ganttProp: ITaskData, currentData: IGanttData): void {
        const constraintType: ConstraintType = ganttProp.constraintType;
        if (
            constraintType === ConstraintType.StartNoEarlierThan ||
            constraintType === ConstraintType.StartNoLaterThan
        ) {
            this.parent.setRecordValue('constraintDate', ganttProp.startDate, ganttProp, true);
        } else if (
            constraintType === ConstraintType.FinishNoEarlierThan ||
            constraintType === ConstraintType.FinishNoLaterThan
        ) {
            this.parent.setRecordValue('constraintDate', ganttProp.endDate, ganttProp, true);
        }
        this.parent.dataOperation.updateMappingData(currentData, 'constraintDate');
    }
    /**
     *
     * @param {string} columnName .
     * @param {string} value .
     * @param {IGanttData} currentData .
     * @param {boolean} isBaseline - Indicates whether the calculation is specific to baseline dates.
     * @returns {boolean} .
     * @private
     */
    public validateScheduleValuesByCurrentField(columnName: string, value: string, currentData: IGanttData, isBaseline?: boolean): boolean {
        const ganttObj: Gantt = this.parent;
        const ganttProp: ITaskData = currentData.ganttProperties;
        const taskSettings: TaskFieldsModel = ganttObj.taskFields;
        if (taskSettings.duration === columnName || taskSettings.baselineDuration === columnName) {
            const isValidValue: boolean = !isNullOrUndefined(value) && value !== '' && (parseFloat(value) >= 0);
            const isInvalidFormat: boolean = /^[^\d.-]+$/.test(value);
            const isEmpty: boolean = value === '';
            const durationMapping: string = isBaseline ? taskSettings.baselineDuration : taskSettings.duration;
            const { startdateField, enddateField, durationField } = this.parent.dateValidationModule.getFieldMappings(isBaseline);
            if (isValidValue) {
                ganttObj.dataOperation.updateDurationValue(value, ganttProp, isBaseline);
                this.parent.setRecordValue(durationMapping, value, currentData);
                this.parent.setRecordValue(`taskData.${durationMapping}`, ganttProp[durationField], currentData);

                if (!isBaseline && ganttProp.isMilestone && !isNullOrUndefined(this.parent.editModule.cellEditModule)) {
                    const editedArgs: ITaskbarEditedEventArgs = {};
                    editedArgs.data = currentData;
                    this.parent.editModule.cellEditModule['updateDates'](editedArgs);
                }
                this.validateDuration(currentData, isBaseline);
            } else {
                if ((isBaseline && isValidValue) || ganttObj.allowUnscheduledTasks) {
                    if ((ganttProp[startdateField] && ganttProp[enddateField] && ganttProp[startdateField].getTime() > ganttProp[enddateField].getTime()) || value.indexOf('-') !== -1) {
                        this.parent.setRecordValue(durationField, 0, ganttProp, true);
                        if (ganttProp[enddateField]) {
                            this.parent.setRecordValue(startdateField, ganttProp[enddateField], ganttProp, true);
                        }
                    } else if (isEmpty) {
                        this.parent.setRecordValue(durationField, null, ganttProp, true);
                        if (ganttProp[startdateField] && ganttProp[startdateField]) {
                            this.parent.setRecordValue(enddateField, null, ganttProp, true);
                        }
                    } else {
                        if (isInvalidFormat) {
                            const field: string = isBaseline ? taskSettings.baselineDuration : taskSettings.duration;
                            const err: string = `The provided value for the ${field} field is invalid. Please ensure it contains only valid numeric values.`;
                            this.parent.trigger('actionFailure', { error: err });
                        }
                        this.parent.setRecordValue(durationField, ganttProp[durationField], ganttProp, true);
                    }
                }
            }
            if (!isBaseline) {
                this.parent.editModule.updateResourceRelatedFields(currentData, 'duration');
            }
        }
        if (taskSettings.startDate === columnName || taskSettings.baselineStartDate === columnName) {
            if (value !== '') {
                const startField: string = isBaseline ? 'baselineStartDate' : 'startDate';
                let startDate: Date = this.parent.dateValidationModule.getDateFromFormat(value);
                startDate = this.parent.dateValidationModule.checkStartDate(startDate, ganttProp, undefined, undefined, isBaseline);
                this.parent.setRecordValue(startField, startDate, ganttProp, true);
                this.validateStartDate(currentData, isBaseline);
                if (this.parent.taskFields.constraintType) {
                    this.updateConstraintDate(ganttProp, currentData);
                }
            } else {
                if (!isBaseline && ganttObj.allowUnscheduledTasks && !(currentData.hasChildRecords)) {
                    this.parent.setRecordValue('startDate', null, ganttProp, true);
                    this.parent.setRecordValue('duration', null, ganttProp, true);
                    this.parent.setRecordValue('isMilestone', false, ganttProp, true);
                }
            }
        }
        if (taskSettings.endDate === columnName || taskSettings.baselineEndDate === columnName) {
            const { startdateField, enddateField, durationField } = this.parent.dateValidationModule.getFieldMappings(isBaseline);
            if (value !== '') {
                let endDate: Date = this.parent.dateValidationModule.getDateFromFormat(value);
                const dayEndTime: number = this.parent['getCurrentDayEndTime'](endDate);
                if (endDate.getHours() === 0 && dayEndTime !== 86400) {
                    this.parent.dateValidationModule.setTime(dayEndTime, endDate);
                }
                if (!isNullOrUndefined(ganttProp[startdateField]) && !isNullOrUndefined(ganttProp[enddateField]) &&
                    !isNullOrUndefined(endDate) &&
                    ganttProp[startdateField].getTime() > endDate.getTime()) {
                    endDate = ganttProp[enddateField];
                }
                endDate = this.parent.dateValidationModule.checkEndDate(endDate, ganttProp, undefined, isBaseline);
                if (isNullOrUndefined(ganttProp[startdateField]) || endDate.getTime() >= (ganttProp[startdateField]).getTime()) {
                    this.parent.setRecordValue(enddateField, endDate, ganttProp, true);
                }
                this.validateEndDate(currentData, isBaseline);
                if (!isBaseline && ganttProp.isMilestone && !isNullOrUndefined(this.parent.editModule.cellEditModule)) {
                    const editedArgs: ITaskbarEditedEventArgs = {};
                    editedArgs.data = currentData;
                    this.parent.editModule.cellEditModule['updateDates'](editedArgs);
                }
            } else {
                if (ganttObj.allowUnscheduledTasks && !isBaseline) {
                    this.parent.setRecordValue(enddateField, null, ganttProp, true);
                    this.parent.setRecordValue(durationField, null, ganttProp, true);
                    if (!isBaseline) {
                        this.parent.setRecordValue('isMilestone', false, ganttProp, true);
                    }
                }
            }
        }
        if (taskSettings.work === columnName) {
            if (!isNullOrUndefined(value) && value !== '') {
                this.parent.setRecordValue('work', value, ganttProp, true);
                this.parent.editModule.updateResourceRelatedFields(currentData, 'work');
                this.validateDuration(currentData);
            }
        }
        if (columnName === taskSettings.type) {
            this.parent.setRecordValue('taskType', value, ganttProp, true);
            // To validate the work column as well, if duartion column value is 0, when FixedDuration type
            if (value && value === 'FixedDuration' && ganttProp.duration === 0) {
                this.parent.editModule.updateResourceRelatedFields(currentData, 'work');
            }
        }
        if (taskSettings.manual === columnName) {
            this.parent.editModule.updateTaskScheduleModes(currentData);
        }
        return true;
    }
    
    private getSegmentsModel(fields: string[]): Object {
        const taskSettings: TaskFieldsModel = this.parent.taskFields;
        if (isNullOrUndefined(fields) || fields.length === 0) {
            fields = [];
            if (!isNullOrUndefined(taskSettings.startDate)) {
                fields.push(this.parent.taskFields.startDate);
            }
            if (!isNullOrUndefined(taskSettings.endDate)) {
                fields.push(this.parent.taskFields.endDate);
            }
            if (!isNullOrUndefined(taskSettings.duration)) {
                fields.push(this.parent.taskFields.duration);
            }
            if (!isNullOrUndefined(taskSettings.id)) {
                fields.push(this.parent.taskFields.id);
            }
        }
        const segmentInputModel: GridModel = {};
        segmentInputModel.editSettings = {
            allowEditing: true, allowAdding: true, allowDeleting: true, mode: 'Normal', newRowPosition: 'Bottom'
        };
        segmentInputModel.locale = this.parent.locale;
        segmentInputModel.dataSource = [];
        segmentInputModel.rowHeight = this.parent.isAdaptive ? 48 : null;
        segmentInputModel.toolbar = [
            {
                id: this.parent.element.id + 'SegmentsTabContainer' + '_add', prefixIcon: 'e-add',
                tooltipText: this.localeObj.getConstant('add'), align: 'Right',
                text: this.parent.isAdaptive ? '' : this.localeObj.getConstant('add')
            },
            {
                id: this.parent.element.id + 'SegmentsTabContainer' + '_delete', prefixIcon: 'e-delete',
                tooltipText: this.localeObj.getConstant('delete'), align: 'Right',
                text: this.parent.isAdaptive ? '' : this.localeObj.getConstant('delete')
            }
        ];
        const gridColumns: GridColumnModel[] = [];
        for (let i: number = 0; i < fields.length; i++) {
            let gridColumn: GridColumnModel = {};
            const generalTabString: string = 'General';
            switch (fields[i as number]) {
            case this.parent.taskFields.id:
                gridColumn = {
                    field: fields[i as number], visible: false, isPrimaryKey: true
                };
                gridColumns.push(gridColumn);
                break;
            case this.parent.taskFields.startDate:
            case this.parent.taskFields.endDate:
                gridColumn = {
                    field: fields[i as number], headerText: this.localeObj.getConstant((fields[i as number] === this.parent.taskFields.startDate ) ? 'startDate' : 'endDate'), editType: 'stringedit', width: '200px',
                    edit: {
                        write: (args: CObject): void => {
                            let datePickerModel: object;
                            if (!isNullOrUndefined(this.beforeOpenArgs[generalTabString as string]) &&
                                !isNullOrUndefined(this.beforeOpenArgs[generalTabString as string][fields[i as number]])) {
                                datePickerModel = this.beforeOpenArgs[generalTabString as string][fields[i as number]];
                            } else {
                                const columnFields: string[] = this.getGeneralColumnFields();
                                const columnModel: object = this.getFieldsModel(columnFields);
                                datePickerModel = columnModel[fields[i as number]];
                            }
                            const value: string = args.rowData[(args.column as GridColumnModel).field];
                            setValue('value', value, datePickerModel);
                            const datePicker: DatePicker =
                            new this.inputs[this.parent.columnByField[fields[i as number]].editType](datePickerModel);
                            datePicker.appendTo(args.element as HTMLElement);
                        },
                        read: (args: HTMLElement): Date => {
                            const ej2Instance: DatePickerModel =
                                    <CObject>(<EJ2Instance>args).ej2_instances[0];
                            return ej2Instance.value as Date;
                        }

                    },
                    format: this.parent.getDateFormat()
                };
                if (fields[i as number] === this.parent.taskFields.startDate) {
                    gridColumn.validationRules = { required: true };
                }
                gridColumns.push(gridColumn);
                break;
            case this.parent.taskFields.duration:
                gridColumn = {
                    field: fields[i as number], headerText: this.localeObj.getConstant(fields[i as number].toLocaleLowerCase()), editType: 'stringedit',
                    width: '100px', edit: {
                        write: (args: CObject): void => {
                            let inputTextModel: object;
                            if (!isNullOrUndefined(this.beforeOpenArgs[generalTabString as string]) &&
                                !isNullOrUndefined(this.beforeOpenArgs[generalTabString as string][fields[i as number]])) {
                                inputTextModel = this.beforeOpenArgs[generalTabString as string][fields[i as number]];
                            } else {
                                const columnFields: string[] = this.getGeneralColumnFields();
                                const columnModel: object = this.getFieldsModel(columnFields);
                                inputTextModel = columnModel[fields[i as number]];
                            }
                            (inputTextModel as TextBox).floatLabelType = 'Never';
                            const value: string = args.rowData[(args.column as GridColumnModel).field];
                            if (!isNullOrUndefined(value)) {
                                setValue('value', value, inputTextModel);
                            } else {
                                setValue('value', null, inputTextModel);
                            }
                            setValue('value', value, inputTextModel);
                            const inputModel: TextBox = new TextBox(inputTextModel);
                            inputModel.appendTo(args.element as HTMLElement);
                        },
                        read: (args: HTMLElement): string => {
                            const ej2Instance: TextBoxModel =
                                <CObject>(<EJ2Instance>args).ej2_instances[0];
                            return ej2Instance.value.toString();
                        }
                    }
                };
                gridColumns.push(gridColumn);
                break;
            }
        }
        segmentInputModel.columns = gridColumns;
        segmentInputModel.height = (this.parent.isAdaptive || this.parent.enableAdaptiveUI) ? '100%' : '153px';
        return segmentInputModel;
    }
    /* eslint-enable */
    private getGridColumnByField(fieldName: string, columns: GridColumnModel[]): GridColumnModel {
        let column: GridColumnModel;
        for (let i: number = 0; i < columns.length; i++) {
            if (columns[i as number].field === fieldName) {
                column = columns[i as number];
            }
        }
        return column;
    }
    private updateSegmentField(columnName: string, args: CObject, segment: ITaskSegment): void {
        const dialog: HTMLElement = this.parent.editModule.dialogModule.dialog;
        const gridModel: GridModel = getValue('Segments', this.beforeOpenArgs) as GridModel;
        const col: GridColumnModel = this.getGridColumnByField(columnName, gridModel.columns as GridColumnModel[]);
        const ganttId: string = this.parent.element.id;
        const tempValue: string | Date | number = segment[columnName as string];
        let inputValue: TextBox | DatePicker;

        if (col.editType === 'stringedit') {
            inputValue = <TextBox>(<EJ2Instance>dialog.querySelector('#' + ganttId + 'SegmentsTabContainer' + columnName))
                .ej2_instances[0] as TextBox;
        } else if (col.editType === 'datepickeredit') {
            inputValue = <DatePicker>(<EJ2Instance>dialog.querySelector('#' + ganttId + 'SegmentsTabContainer' + columnName))
                .ej2_instances[0] as DatePicker;
        }
        if ((!isNullOrUndefined(inputValue.value)) && (!isNullOrUndefined(tempValue)) &&
        (inputValue.value.toString() !== tempValue.toString())) {
            inputValue.value = tempValue as string;
            inputValue.dataBind();
        }
    }
    private validateSegmentFields(ganttObj: Gantt, columnName: string, cellValue: string, args: CObject): void {
        const taskSettings: TaskFieldsModel = this.parent.taskFields;
        if (!isNullOrUndefined(taskSettings.duration) && taskSettings.duration.toLowerCase() === columnName.toLowerCase()) {
            if (!isNullOrUndefined(cellValue) && cellValue !== '') {
                this.selectedSegment[taskSettings.duration] = Number(cellValue);
                let endDate: Date = ganttObj.dataOperation.getEndDate(
                    this.selectedSegment[taskSettings.startDate], Number(cellValue), this.editedRecord.ganttProperties.durationUnit,
                    this.editedRecord.ganttProperties, false
                );
                endDate = ganttObj.dataOperation.checkEndDate(endDate, this.editedRecord.ganttProperties, false);
                this.selectedSegment[taskSettings.endDate] = endDate;
            }
        }
        if (!isNullOrUndefined(taskSettings.startDate) && taskSettings.startDate.toLowerCase() === columnName.toLowerCase()) {
            if (cellValue !== '') {
                let startDate: Date = this.parent.dateValidationModule.getDateFromFormat(cellValue);
                startDate = this.parent.dateValidationModule.checkStartDate(startDate);
                this.selectedSegment[taskSettings.startDate] = startDate;

                if (!isNullOrUndefined(taskSettings.endDate)) {
                    this.selectedSegment.endDate = this.parent.dataOperation.getEndDate(
                        startDate, this.selectedSegment[taskSettings.duration], this.editedRecord.ganttProperties.durationUnit,
                        this.editedRecord.ganttProperties, false
                    );
                }
            }
        }
        if (!isNullOrUndefined(taskSettings.endDate) && taskSettings.endDate.toLowerCase() === columnName.toLowerCase()) {
            if (cellValue !== '') {
                let endDate: Date = this.parent.dateValidationModule.getDateFromFormat(cellValue);
                const dayEndTime: number = this.parent['getCurrentDayEndTime'](endDate);
                if (endDate.getHours() === 0 && dayEndTime !== 86400) {
                    this.parent.dateValidationModule.setTime(dayEndTime, endDate);
                }
                endDate = this.parent.dateValidationModule.checkEndDate(endDate, this.editedRecord.ganttProperties);
                this.selectedSegment[taskSettings.endDate] = endDate;
                this.selectedSegment[taskSettings.duration] = this.parent.dataOperation.getDuration(
                    this.selectedSegment[taskSettings.startDate], this.selectedSegment[taskSettings.endDate],
                    this.editedRecord.ganttProperties.durationUnit,
                    true, false, true
                );
            }
        }
        if (!isNullOrUndefined(taskSettings.startDate)) {
            this.updateSegmentField(taskSettings.startDate, args, this.selectedSegment);
        }
        if (!isNullOrUndefined(taskSettings.endDate)) {
            this.updateSegmentField(taskSettings.endDate, args, this.selectedSegment);
        }
        if (!isNullOrUndefined(taskSettings.duration)) {
            this.updateSegmentField(taskSettings.duration, args, this.selectedSegment);
        }
    }
    private getPredecessorModel(fields: string[]): Object {
        if (isNullOrUndefined(fields) || fields.length === 0) {
            fields = ['ID', 'Name', 'Type', 'Offset', 'UniqueId'];
        }
        const inputModel: GridModel = {};
        inputModel.editSettings = { allowEditing: true, allowAdding: true, allowDeleting: true, mode: 'Normal' };
        inputModel.locale = this.parent.locale;
        inputModel.dataSource = [];
        inputModel.rowHeight = this.parent.isAdaptive ? 48 : null;
        inputModel.toolbar = [
            {
                id: this.parent.element.id + 'DependencyTabContainer' + '_add', prefixIcon: 'e-add',
                tooltipText: this.localeObj.getConstant('add'), align: 'Right',
                text: this.parent.isAdaptive ? '' : this.localeObj.getConstant('add')
            },
            {
                id: this.parent.element.id + 'DependencyTabContainer' + '_delete', prefixIcon: 'e-delete',
                tooltipText: this.localeObj.getConstant('delete'), align: 'Right',
                text: this.parent.isAdaptive ? '' : this.localeObj.getConstant('delete')
            }
        ];
        const columns: GridColumnModel[] = [];
        for (let i: number = 0; i < fields.length; i++) {
            let column: GridColumnModel = {};
            if (fields[i as number].toLowerCase() === 'id') {
                column = {
                    field: 'id', headerText: this.localeObj.getConstant('id'), allowEditing: false, width: '70px'
                };
                columns.push(column);
            } else if (fields[i as number].toLowerCase() === 'name') {
                column = {
                    field: 'name', headerText: this.localeObj.getConstant('name'), editType: 'stringedit', width: '250px',
                    validationRules: { required: true }
                };
                columns.push(column);
            } else if (fields[i as number].toLowerCase() === 'type') {
                column = {
                    field: 'type', headerText: this.localeObj.getConstant('type'), editType: 'dropdownedit',
                    dataSource: this.types, foreignKeyField: 'id', foreignKeyValue: 'text',
                    defaultValue: 'FS', validationRules: { required: true }, width: '150px'
                };
                columns.push(column);
            } else if (fields[i as number].toLowerCase() === 'offset') {
                column = {
                    field: 'offset', headerText: this.localeObj.getConstant('offset'), editType: 'stringedit',
                    defaultValue: this.parent.dataOperation.getDurationString(
                        0, (this.beforeOpenArgs.rowData as IGanttData).ganttProperties.durationUnit),
                    validationRules: { required: true }, width: '100px'
                };
                columns.push(column);
            } else if (fields[i as number].toLowerCase() === 'uniqueid') {
                column = {
                    field: 'uniqueId', isPrimaryKey: true, visible: false, defaultValue: getUid().toString()
                };
                columns.push(column);
            }
        }
        inputModel.columns = columns;
        inputModel.height = (this.parent.isAdaptive || this.parent.enableAdaptiveUI) ? '100%' : '153px';
        return inputModel;
    }
    private getResourcesModel(fields: string[]): Object {
        const ganttObj: Gantt = this.parent;
        const resourceSettings: ResourceFieldsModel = ganttObj.resourceFields;
        if (isNullOrUndefined(fields) || fields.length === 0) {
            fields = [resourceSettings.id, resourceSettings.name, resourceSettings.unit, resourceSettings.group];
        }

        const inputModel: TreeGridModel = {
            allowFiltering: true,
            treeColumnIndex: -1,
            childMapping: '',
            editSettings: { allowEditing: true, mode: 'Cell' },
            locale: this.parent.locale,
            allowSelection: true,
            rowHeight: this.parent.isAdaptive ? 48 : null,
            filterSettings: { type: 'Menu' },
            selectionSettings: { checkboxOnly: true, checkboxMode: 'Default', persistSelection: true, type: 'Multiple' }
        };
        const columns: TreeGridColumnModel[] = [
            { type: 'checkbox', allowEditing: false, allowSorting: false, allowFiltering: false, width: 60 }
        ];
        for (let i: number = 0; i < fields.length; i++) {
            let column: TreeGridColumnModel = {};
            if (fields[i as number] === resourceSettings.id) {
                column = {
                    field: resourceSettings.id,
                    headerText: this.localeObj.getConstant('id'), isPrimaryKey: true, width: '100px',
                    allowEditing: false
                };
                columns.push(column);
            } else if (fields[i as number] === resourceSettings.name) {
                column = {
                    field: resourceSettings.name, headerText: this.localeObj.getConstant('name'),
                    allowEditing: false
                };
                columns.push(column);
            } else if (fields[i as number] === resourceSettings.unit) {
                column = {
                    field: resourceSettings.unit,
                    headerText: this.localeObj.getConstant('unit'),
                    editType: 'numericedit',
                    edit: { params: { min: 0 } }
                };
                columns.push(column);
            } else if (fields[i as number] === resourceSettings.group && !isNullOrUndefined(resourceSettings.group)) {
                column = {
                    field: resourceSettings.group,
                    headerText: this.localeObj.getConstant('group'),
                    allowEditing: false
                };
                columns.push(column);
            }
        }
        inputModel.columns = columns;
        inputModel.height = (this.parent.isAdaptive || this.parent.enableAdaptiveUI) ? '100%' : '196px';
        return inputModel;
    }

    private getNotesModel(fields: string[]): Object {
        if (isNullOrUndefined(fields) || fields.length === 0) {
            fields = ['Bold', 'Italic', 'Underline', 'StrikeThrough',
                'FontName', 'FontSize', 'FontColor', 'BackgroundColor',
                'LowerCase', 'UpperCase', '|',
                'Alignments', 'OrderedList', 'UnorderedList',
                'Outdent', 'Indent', '|', 'CreateTable',
                'CreateLink', '|', 'ClearFormat', 'Print',
                '|', 'Undo', 'Redo'];
        }
        const inputModel: RichTextEditorModel = {
            placeholder: this.localeObj.getConstant('writeNotes'),
            toolbarSettings: {
                items: fields
            },
            height: (this.parent.isAdaptive || this.parent.enableAdaptiveUI) ? '100%' : 'auto',
            locale: this.parent.locale
        };
        return inputModel;
    }

    private createDivElement(className?: string, id?: string): HTMLElement {
        return createElement('div', { className: className, id: id });
    }
    private createFormElement(className?: string, id?: string): HTMLElement {
        return createElement('form', { className: className, id: id });
    }
    private createInputElement(className: string, id: string, fieldName: string, type?: string): HTMLElement {
        return createElement(type || 'input', {
            className: className, attrs: {
                type: 'text', id: id, name: fieldName,
                title: fieldName
            }
        });
    }
    private renderTabItems(): void {
        const tabModel: TabModel = this.beforeOpenArgs.tabModel;
        let isCustomTab: boolean = false;
        const items: TabItemModel[] = tabModel.items;
        let index: number = 0;
        for (let i: number = 0; i < items.length; i++) {
            const item: TabItemModel = items[i as number];
            if (item.content instanceof HTMLElement) {
                continue;
            } else if (item.content === 'General') {
                item.content = this.renderGeneralTab(item.content);
            } else if (item.content === 'Advanced') {
                item.content = this.renderAdvancedTab(item.content); // Assuming this method exists
            } else if (item.content === 'Dependency') {
                if (this.editedRecord.hasChildRecords && !this.parent.allowParentDependency) {
                    item.disabled = true;
                }
                item.content = this.renderPredecessorTab(item.content);
            } else if (item.content === 'Resources') {
                item.content = this.renderResourceTab(item.content);
            } else if (item.content === ('Custom' + '' + index)) {
                isCustomTab = true;
                item.content = this.renderCustomTab(item.content, isCustomTab);
                index++;
            } else if (item.content === 'Notes') {
                item.content = this.renderNotesTab(item.content);
            } else if (item.content === 'Segments') {
                if (this.editedRecord.hasChildRecords) {
                    item.disabled = true;
                }
                item.content = this.renderSegmentsTab(item.content);
            }
        }
    }
    private segmentGridActionBegin(args: ActionEventArgs): void {
        const taskFields: TaskFieldsModel = this.parent.taskFields;
        const itemName: string = 'Segments';
        const gridModel: GridModel = this.beforeOpenArgs[itemName as string] as GridModel;
        if (args.requestType === 'add' || args.requestType === 'beginEdit' || args.requestType === 'save') {
            const gridData: Record<string, unknown>[] = gridModel.dataSource as Record<string, unknown>[];
            const selectedItem: Record<string, unknown> = getValue('rowData', args);
            const startDate: Date = (this.beforeOpenArgs.rowData as IGanttData).ganttProperties.startDate;
            if (!isNullOrUndefined(startDate)) {
                if (args.requestType === 'add') {
                    let arg: Record<string, unknown> = {};
                    let sDate: Date = getValue(this.parent.taskFields.startDate, selectedItem);
                    let eDate: Date = this.parent.taskFields.endDate ? getValue(this.parent.taskFields.endDate, selectedItem) : null;
                    let duration: number;
                    if (!isNullOrUndefined(this.parent.taskFields.duration)) {
                        duration = getValue(this.parent.taskFields.duration, selectedItem);
                    }
                    const startDate: Date = !isNullOrUndefined(gridData) && gridData.length > 0 ?
                        (!isNullOrUndefined(taskFields.endDate) && !isNullOrUndefined(gridData[0][taskFields.endDate] as Date)) ?
                            new Date((getValue(taskFields.endDate, gridData[0]) as Date).getTime()) :
                            new Date((getValue(taskFields.startDate, gridData[0]) as Date).getTime()) :
                        !isNullOrUndefined((this.beforeOpenArgs.rowData as IGanttData).ganttProperties.startDate) &&
                        new Date((this.beforeOpenArgs.rowData as IGanttData).ganttProperties.startDate.getTime());
                    startDate.setHours(0, 0, 0, 0);
                    if (!isNullOrUndefined(gridData) && gridData.length > 0) {
                        startDate.setDate(startDate.getDate() + 2);
                    }
                    sDate = this.parent.dataOperation.checkStartDate(startDate);
                    eDate = this.parent.dateValidationModule.getDateFromFormat(sDate);
                    const dayEndTime: number = this.parent['getCurrentDayEndTime'](eDate);
                    if (dayEndTime !== 86400 && eDate.getHours() === 0) {
                        this.parent.dateValidationModule.setTime(dayEndTime, eDate);
                    }
                    eDate = !isNullOrUndefined(taskFields.endDate) && !isNullOrUndefined(gridData) && gridData.length <= 0 ?
                        (this.beforeOpenArgs.rowData as IGanttData).ganttProperties.endDate : eDate;
                    const rowData: ITaskData = (this.beforeOpenArgs.rowData as IGanttData).ganttProperties;
                    if (sDate.getTime() === eDate.getTime()) {
                        duration = 1;
                    }
                    else {
                        duration = this.parent.dataOperation.getDuration(sDate, eDate,
                                                                         rowData.durationUnit, true, false, true);
                    }
                    if (!isNullOrUndefined(taskFields['duration'])) {
                        arg = {
                            [taskFields['startDate']]: sDate,
                            [taskFields['endDate']]: eDate,
                            [taskFields['duration']]: duration
                        };
                    }
                    else {
                        arg = {
                            [taskFields['startDate']]: sDate,
                            [taskFields['endDate']]: eDate
                        };
                    }
                    args.rowData = arg;
                }
            }
            if (args.requestType === 'save') {
                const dataSource: Object[] = gridModel.dataSource as Object[];
                const taskIdField: string = this.parent.taskFields.id as string;
                let newId: number = dataSource.length;
                while (dataSource.some((item: Object) => item[taskIdField as string] === newId)) {
                    newId++;
                }
                if (isNullOrUndefined(args.data[taskIdField as string])) {
                    args.data[taskIdField as string] = newId;
                    args.rowData[taskIdField as string] = newId;
                }
            }
            this.selectedSegment = args.rowData;
            // if (args.requestType === 'save') {
            //     // let duration: string = 'duration';
            //     // let tempDuration: Object = this.parent.dataOperation.getDurationValue(args.data[duration]);
            //     // args.data[duration] = getValue('duration', tempDuration);
            //     this.selectedSegment = !isNullOrUndefined(this.editedRecord.ganttProperties.segments[args.rowIndex]) ?
            //         this.editedRecord.ganttProperties.segments[args.rowIndex] : !isNullOrUndefined(gridData[args.rowIndex]) ?
            //             gridData[args.rowIndex] : gridData;
            // }
        }
    }
    public getDialogTabIndex(tabName: DialogFieldType): number {
        let indexValue: number;
        if (!this.isEdit) {
            this.parent.addDialogFields.map((item: AddDialogFieldSettingsModel, index: number) => {
                if (item.type === tabName) {
                    indexValue = index;
                }
            });
        }
        else {
            this.parent.editDialogFields.map((item: EditDialogFieldSettingsModel, index: number) => {
                if (item.type === tabName) {
                    indexValue = index;
                }
            });
        }
        return indexValue;
    }
    /* eslint-disable-next-line */
    private setInjected(dialogField: any, allProperty: any, Grid: any, toolbar: (string | ItemModel | ToolbarItem)[], toolbarCollection: (string | ItemModel | ToolbarItem)[], gridModel: GridModel,columnCollection:any): void {
        if (!isNullOrUndefined(dialogField) && !isNullOrUndefined(dialogField.additionalParams)) {
            allProperty = (dialogField.additionalParams) as GridModel;
            for (const i in allProperty) {
                if (Object.prototype.hasOwnProperty.call(allProperty, i)) {
                    switch (i) {
                    case 'allowFiltering':
                        Grid.Inject(Filter);
                        break;
                    case 'allowSorting':
                        Grid.Inject(Sort);
                        break;
                    case 'allowPaging':
                        Grid.Inject(Page);
                        break;
                    case 'allowGrouping':
                        Grid.Inject(Group);
                        break;
                    case 'editSettings':
                        Grid.Inject(Edit);
                        break;
                    case 'aggregates':
                        Grid.Inject(Aggregate);
                        break;
                    case 'showColumnChooser':
                        Grid.Inject(ColumnChooser);
                        break;
                    case 'showColumnMenu':
                        Grid.Inject(ColumnMenu);
                        break;
                    case 'contextMenuItems':
                        Grid.Inject(ContextMenu);
                        break;
                    case 'allowResizing':
                        Grid.Inject(Resize);
                        break;
                    case 'allowReordering':
                        Grid.Inject(Reorder);
                        break;
                    case 'detailTemplate':
                        Grid.Inject(DetailRow);
                        break;
                    case 'allowRowDragAndDrop':
                        Grid.Inject(RowDD);
                        break;
                    case 'searchSettings':
                        Grid.Inject(Search);
                        break;
                    case 'selectionSettings':
                        Grid.Inject(Selection);
                        break;
                    case 'enableVirtualization':
                        Grid.Inject(VirtualScroll);
                        break;
                    case 'toolbar':
                        toolbar = allProperty['toolbar'] as (string | ItemModel | ToolbarItem)[];
                        toolbar.map((item: string | ItemModel | ToolbarItem) => {
                            switch (item) {
                            case 'Search':
                                Grid.Inject(Search);
                                break;
                            case 'Print':
                                Grid.Inject(Print);
                                break;
                            case 'PdfExport':
                                Grid.Inject(PdfExport);
                                break;
                            case 'ExcelExport':
                                Grid.Inject(ExcelExport);
                                break;
                            default:
                                break;
                            }
                        });
                        toolbarCollection = gridModel.toolbar;
                        Grid.Inject(GridToolbar);
                        break;
                    case 'columns':
                        columnCollection = gridModel.columns;
                        break;
                    default:
                        break;
                    }
                }
            }
        }

    }

    private renderSegmentsTab(itemName: string): HTMLElement {
        const ganttObj: Gantt = this.parent;
        let gridModel: GridModel = this.beforeOpenArgs[itemName as string];
        gridModel.enableAdaptiveUI = this.parent.enableAdaptiveUI;
        const ganttData: IGanttData = this.beforeOpenArgs.rowData;
        let preData: ITaskSegment[] = [];
        if (this.isEdit) {
            preData = isNullOrUndefined(ganttData.taskData[this.parent.taskFields['segments']]) ? [] : ganttData.taskData[this.parent.taskFields['segments']];
        }
        /* eslint-disable-next-line */
        preData.map((item: any, index: number) => {
            if (isNullOrUndefined(item[this.parent.taskFields['id']])) {
                item[this.parent.taskFields['id']] = index;
            }
        });
        gridModel.dataSource = preData;
        gridModel.actionBegin = this.segmentGridActionBegin.bind(this);
        const tabIndex: number = this.getDialogTabIndex('Segments');
        let dialogField: AddDialogFieldSettingsModel;
        if (!this.isEdit) {
            dialogField = this.parent.addDialogFields[tabIndex as number];
        } else if (this.isEdit) {
            dialogField = this.parent.editDialogFields[tabIndex as number];
        }
        let allProperty: GridModel;
        const toolbarCollection: (string | ItemModel | ToolbarItem)[] = [];
        /* eslint-disable-next-line */
        let columnCollection: any = [];
        let toolbar: (string | ItemModel | ToolbarItem)[];
        if (!isNullOrUndefined(dialogField) && !isNullOrUndefined(dialogField.additionalParams)) {
            allProperty = (dialogField.additionalParams) as GridModel;
        }
        this.setInjected(dialogField, allProperty, Grid, toolbar, toolbarCollection, gridModel, columnCollection);
        Grid.Inject(Edit, Page, GridToolbar, ForeignKey);
        gridModel = { ...gridModel, ...allProperty };
        gridModel.toolbar = [...toolbarCollection, ...gridModel.toolbar];
        const columnCollections: Column[] | string[] | ColumnModel[] = this.updateColumns(columnCollection, gridModel.columns as Column[]);
        gridModel.columns = columnCollections;
        const gridObj: Grid = new Grid(gridModel);
        const divElement: HTMLElement = this.createDivElement('', ganttObj.element.id + '' + itemName + 'TabContainer');
        gridObj.appendTo(divElement);
        return divElement;
    }
    private renderGeneralTab(itemName: string, isCustomTab?: boolean): HTMLElement {
        const ganttObj: Gantt = this.parent;
        /* eslint-disable-next-line */
        const addFields: any = [];
        let divElement: HTMLElement;
        const itemModel: Object = this.beforeOpenArgs[itemName as string];
        if (isCustomTab) {
            divElement = this.createDivElement('e-edit-form-row', ganttObj.element.id
            + '' + itemName + 'TabContainer');
        }
        else {
            divElement = this.createFormElement('e-edit-form-row', ganttObj.element.id
            + '' + itemName + 'TabContainer');
        }
        let table: HTMLElement;
        let tbody: HTMLElement;
        if (this.parent.enableAdaptiveUI) {
            divElement.style.height = '100%';
            table = createElement('table', { className: 'e-table' });
            table.style.width = '100%';
            tbody = createElement('tbody');
        }
        const getId: string = divElement.id;
        for (const key of Object.keys(itemModel)) {
            if (this.parent.columnByField[key as string].visible === false || key === 'WBSCode' || key === 'WBSPredecessor') {
                continue;
            }
            const column: GanttColumnModel = this.parent.columnByField[key as string];
            const inputModel: any = itemModel[key as string];
            let inputElements: HTMLElement;
            if (column['editTemplate']) {
                const childElement: HTMLElement = this.createDivElement('e-edit-form-column');
                inputModel.forEach((el : any)  => childElement.appendChild(el));
                inputElements = childElement;
            }
            else {
                inputElements = this.renderInputElements(inputModel, column);
            }
            if (this.parent.enableAdaptiveUI) {
                tbody.appendChild(inputElements);
            }
            else {
                divElement.appendChild(inputElements);
            }
            addFields.push(key);
        }
        if (this.parent.enableAdaptiveUI) {
            table.appendChild(tbody);
            divElement.appendChild(table);
        }
        if (getId !== divElement.id) {
            divElement.id = getId;
        }
        const tabIndex: number = this.getDialogTabIndex('General');
        let fields: string[] = [];
        if (!this.isEdit && !isNullOrUndefined(this.parent.addDialogFields[tabIndex as number]) &&
        !isNullOrUndefined(this.parent.addDialogFields[tabIndex as number].fields)) {
            fields = this.parent.addDialogFields[tabIndex as number].fields;
        }
        else if (this.isEdit && !isNullOrUndefined(this.parent.editDialogFields[tabIndex as number]) &&
        !isNullOrUndefined(this.parent.editDialogFields[tabIndex as number].fields)) {
            fields = this.parent.editDialogFields[tabIndex as number].fields;
        }
        if (!isNullOrUndefined(fields)) {
            const templateFields: string[] = fields.filter((item: string) => !addFields.includes(item));
            if (!isNullOrUndefined(templateFields)) {
                const template: string[] = templateFields;
                for (let i: number = 0; i <= template.length - 1; i++) {
                    const scriptElement: HTMLScriptElement | null = document.getElementById(template[i as number]) as HTMLScriptElement;
                    if (!isNullOrUndefined(scriptElement)) {
                        const templateContent: string = scriptElement.innerHTML;
                        const div: Element = createElement('div');
                        div.innerHTML = templateContent;
                        divElement.appendChild(div.children[0]);
                    }
                }
            }
        }
        return divElement;
    }
    private renderAdvancedTab(itemName: string, isCustomTab?: boolean): HTMLElement {
        const ganttObj: Gantt = this.parent;
        const addFields: any = [];
        let divElement: HTMLElement;
        const itemModel: Object = this.beforeOpenArgs[itemName as string];
        if (isCustomTab) {
            divElement = this.createDivElement('e-edit-form-row', ganttObj.element.id
                + '' + itemName + 'TabContainer');
        } else {
            divElement = this.createFormElement('e-edit-form-row', ganttObj.element.id
                + '' + itemName + 'TabContainer');
        }
        let table: HTMLElement;
        let tbody: HTMLElement;
        if (this.parent.enableAdaptiveUI) {
            divElement.style.height = '100%';
            table = createElement('table', { className: 'e-table' });
            table.style.width = '100%';
            tbody = createElement('tbody');
        }
        const getId: string = divElement.id;
        for (const key of Object.keys(itemModel)) {
            if (this.parent.columnByField[key as string].visible === false) {
                continue;
            }
            const column: GanttColumnModel = this.parent.columnByField[key as string];
            const inputModel: any = itemModel[key as string];
            let inputElements: HTMLElement;
            if (column['editTemplate']) {
                const childElement: HTMLElement = this.createDivElement('e-edit-form-column');
                inputModel.forEach((el: any) => childElement.appendChild(el));
                inputElements = childElement;
            } else {
                inputElements = this.renderInputElements(inputModel, column);
            }
            if (this.parent.enableAdaptiveUI) {
                tbody.appendChild(inputElements);
            } else {
                divElement.appendChild(inputElements);
            }
            addFields.push(key);
        }
        if (this.parent.enableAdaptiveUI) {
            table.appendChild(tbody);
            divElement.appendChild(table);
        }
        if (getId !== divElement.id) {
            divElement.id = getId;
        }
        const tabIndex: number = this.getDialogTabIndex('Advanced');
        let fields: string[] = [];
        if (!this.isEdit && !isNullOrUndefined(this.parent.addDialogFields[tabIndex as number]) &&
            !isNullOrUndefined(this.parent.addDialogFields[tabIndex as number].fields)) {
            fields = this.parent.addDialogFields[tabIndex as number].fields;
        } else if (this.isEdit && !isNullOrUndefined(this.parent.editDialogFields[tabIndex as number]) &&
            !isNullOrUndefined(this.parent.editDialogFields[tabIndex as number].fields)) {
            fields = this.parent.editDialogFields[tabIndex as number].fields;
        }
        if (!isNullOrUndefined(fields)) {
            const templateFields: string[] = fields.filter((item: string) => !addFields.includes(item));
            if (!isNullOrUndefined(templateFields)) {
                const template: string[] = templateFields;
                for (let i: number = 0; i <= template.length - 1; i++) {
                    const scriptElement: HTMLScriptElement | null = document.getElementById(template[i as number]) as HTMLScriptElement;
                    if (!isNullOrUndefined(scriptElement)) {
                        const templateContent: string = scriptElement.innerHTML;
                        const div: Element = createElement('div');
                        div.innerHTML = templateContent;
                        divElement.appendChild(div.children[0]);
                    }
                }
            }
        }
        return divElement;
    }

    private isCheckIsDisabled(column: GanttColumnModel): boolean {
        let disabled: boolean = false;
        let stringOrNumber: number | string;
        if (column.allowEditing === false || column.isPrimaryKey || this.parent.readOnly) {
            if (this.parent.customColumns.indexOf(column.field) !== -1) {
                disabled = true;
            } else {
                if (column.field === this.parent.taskFields.baselineStartDate || column.field === this.parent.taskFields.baselineEndDate ||
                    column.field === this.parent.taskFields.work || column.field === this.parent.taskFields.type ||
                    column.field === this.parent.taskFields.id || column.field === this.parent.taskFields.name ||
                    column.field === this.parent.taskFields.duration || column.field === this.parent.taskFields.progress ||
                    column.field === this.parent.taskFields.startDate || column.field === this.parent.taskFields.endDate ||
                    column.field === this.parent.taskFields.constraintDate || column.field === this.parent.taskFields.constraintType) {
                    for (let i: number = 0; i < this.parent.currentViewData['length']; i++) {
                        if (!isNullOrUndefined(this.parent.currentViewData[i as number].ganttProperties.taskId)) {
                            stringOrNumber = this.parent.currentViewData[i as number].ganttProperties.taskId;
                            break;
                        }
                    }
                    if (typeof(stringOrNumber) === 'string' && !this.parent.readOnly) {
                        disabled = false;
                    } else {
                        disabled = true;
                    }
                }
            }
        }
        if (this.isEdit) {
            if (column.field === this.parent.taskFields.id || (this.parent.viewType === 'ResourceView' && this.rowData.hasChildRecords)) {
                disabled = true;
            }
            if (this.editedRecord.hasChildRecords) {
                if ((column.field === this.parent.taskFields.endDate &&
                    ((!isNullOrUndefined(this.editedRecord[this.parent.taskFields.manual]) &&
                    this.editedRecord[this.parent.taskFields.manual] === false) ||
                    this.parent.taskMode === 'Auto')) || column.field === this.parent.taskFields.duration ||
                    column.field === this.parent.taskFields.progress || column.field === this.parent.taskFields.work ||
                    column.field === this.parent.taskFields.type) {
                    disabled = true;
                }
            }
        }
        if (!this.editedRecord.ganttProperties.isAutoSchedule) {
            const { constraintDate, constraintType } = this.parent.taskFields;
            if ([constraintDate, constraintType].indexOf(column.field) !== -1) {
                disabled = true;
            }
        }
        return disabled;
    }

    private isParentValid(data: IGanttData[]): boolean {
        if (data.length > 0) {
            for (let i: number = 0; i < data.length; i++) {
                if (data[i as number].uniqueID === this.beforeOpenArgs.rowData['uniqueID']) {
                    this.isValidData = false;
                    break;
                }
                if (data[i as number].hasChildRecords) {
                    this.isParentValid(data[i as number].childRecords);
                }
                if (!this.isValidData) {
                    break;
                }
            }
        }
        return this.isValidData;
    }

    private renderPredecessorTab(itemName: string): HTMLElement {
        const ganttObj: Gantt = this.parent;
        let gridModel: GridModel = this.beforeOpenArgs[itemName as string];
        const dependencyColumn: GanttColumnModel = this.parent.columnByField[this.parent.taskFields.dependency];
        if (dependencyColumn.allowEditing === false || dependencyColumn.isPrimaryKey || this.parent.readOnly) {
            gridModel.editSettings.allowEditing = false;
            gridModel.editSettings.allowAdding = false;
            gridModel.editSettings.allowDeleting = false;
        }
        const ganttData: IGanttData = this.beforeOpenArgs.rowData;
        let preData: IPreData[] = [];
        this.taskNameCollection();
        if (this.isEdit) {
            preData = this.predecessorEditCollection(ganttData);
            this.updatePredecessorDropDownData(ganttData);
        }
        let predecessorLength: number;
        if (ganttData[this.parent.taskFields.dependency]) {
            predecessorLength = ganttData[this.parent.taskFields.dependency].split(',').length;
        }
        if (this.preTableCollection.length === 0 || this.preTableCollection.length === predecessorLength) {
            gridModel.editSettings.allowAdding = false;
        }
        gridModel.actionComplete = this.gridActionComplete.bind(this);
        gridModel.dataSource = preData;
        gridModel.enableAdaptiveUI = this.parent.enableAdaptiveUI;
        gridModel.enableRtl = this.parent.enableRtl;
        gridModel.locale = this.parent.locale;
        gridModel.actionBegin = this.gridActionBegin.bind(this);
        const columns: GridColumnModel[] = <GridColumnModel[]>gridModel.columns;
        columns[1].edit = {
            write: (args: CObject): void => {
                if (getValue('requestType', args) === 'add') {
                    setValue('rowData.uniqueId', getUid(), args);
                }
                const field: string = 'name';
                const autoObj: ComboBox = new ComboBox({
                    dataSource: new DataManager(this.idCollection),
                    popupHeight: '180px',
                    allowCustom: false,
                    enableRtl: this.parent.enableRtl,
                    fields: { value: 'text' },
                    value: args.rowData[field as string],
                    change: (arg: ChangeEventArgs) => {
                        const tr: HTMLElement = closest(arg.element, 'tr') as HTMLElement;
                        const idInput: HTMLInputElement = tr.querySelector('#' + this.parent.element.id + 'DependencyTabContainerid');
                        if (idInput) {
                            if (!isNullOrUndefined(arg.itemData) && !isNullOrUndefined(arg.item)) {
                                idInput.value = (arg.itemData as IPreData).id;
                            } else {
                                idInput.value = '';
                            }
                        }
                    },
                    autofill: true
                });
                autoObj.appendTo(args.element as HTMLElement);
            },
            read: (args: HTMLElement): string => {
                const ej2Instance: ComboBoxModel =
                    <CObject>(<EJ2Instance>args).ej2_instances[0];
                return ej2Instance.value as string;
            }
        };
        const tabIndex: number = this.getDialogTabIndex('Dependency');
        let dialogField: AddDialogFieldSettingsModel;
        if (!this.isEdit) {
            dialogField = this.parent.addDialogFields[tabIndex as number];
        } else if (this.isEdit) {
            dialogField = this.parent.editDialogFields[tabIndex as number];
        }
        const toolbarCollection: (string | ItemModel | ToolbarItem)[] = [];
        let allProperty: GridModel;
        const columnCollection: any = [];
        let toolbar: (string | ItemModel | ToolbarItem)[];
        if (!isNullOrUndefined(dialogField) && !isNullOrUndefined(dialogField.additionalParams)) {
            allProperty = dialogField.additionalParams as GridModel;
        }
        this.setInjected(dialogField, allProperty, Grid, toolbar, toolbarCollection, gridModel, columnCollection);
        Grid.Inject(Edit, Page, GridToolbar, ForeignKey);
        gridModel = { ...gridModel, ...allProperty };
        gridModel.toolbar = [...gridModel.toolbar, ...toolbarCollection];
        const columnCollections: Column[] | string[] | ColumnModel[] = this.updateColumns(columnCollection, gridModel.columns as Column[]);
        gridModel.columns = columnCollections;
        const gridObj: Grid = new Grid(gridModel);
        const divElement: HTMLElement = this.createDivElement('e-dependent-div', ganttObj.element.id + '' + itemName + 'TabContainer');
        gridObj.appendTo(divElement);
        return divElement;
    }
    private updateColumns(existingColumns: Column[], newColumns: Column[]): Column[] | string[] | ColumnModel[] {
        const columnMap: { [key: string]: Column | string | ColumnModel } = {};
        existingColumns.forEach((column: any) => {
            if (typeof column === 'object') {
                columnMap[(column as Column | ColumnModel).field] = column as Column | ColumnModel;
            }
        });
        newColumns.forEach((newColumn: any) => {
            if (typeof newColumn === 'object') {
                const field: string = (newColumn as Column).field;
                if (columnMap[field as string]) {
                    Object.assign(columnMap[field as string], newColumn);
                } else {
                    existingColumns.push(newColumn);
                }
            }
        });
        return existingColumns;
    }
    private gridActionBegin(args: GridActionEventArgs): void {
        const itemName: string = 'Dependency';
        const gridModel: GridModel = this.beforeOpenArgs[itemName as string] as GridModel;
        if (args.requestType === 'add' || args.requestType === 'beginEdit') {
            const isEdit: boolean = args.requestType === 'add' ? false : true;
            this.idCollection = extend([], [], this.preTableCollection, true) as IDependencyEditData[];
            const gridData: Record<string, unknown>[] = gridModel.dataSource as Record<string, unknown>[];
            for (let i: number = 0; i <= gridData.length; i++) {
                // eslint-disable-next-line
                this.idCollection.forEach((data: IDependencyEditData, index: number): void => {
                    if (data.id === getValue('id', gridData[i as number])) {
                        const selectedItem: object = getValue('rowData', args);
                        if (isEdit && getValue('id', selectedItem) === data.id) {
                            return;
                        }
                        this.idCollection.splice(this.idCollection.indexOf(data), 1);
                    }
                });
            }
        }
    }
    private gridActionComplete(args: GridActionEventArgs): void {
        if (args.requestType === 'save') {
            const dialogElement: HTMLElement = this.parent.editModule.dialogModule.dialog.querySelector('#' + this.parent.element.id + 'DependencyTabContainer');
            if (!isNullOrUndefined(dialogElement)) {
                if (!isNullOrUndefined(args['rows']) && args['rows'].length === this.preTableCollection.length) {
                    /* eslint-disable-next-line */
                    const gridObj: any = dialogElement['ej2_instances'][0];
                    if (gridObj) {
                        gridObj.editSettings.allowAdding = false;
                    }
                }
            }
        }
    }
    private updateResourceCollection(args: RowSelectEventArgs, resourceTreeGridId: string): void {
        if (!isNullOrUndefined(args.data) && Object.keys(args.data).length) {
            const treeGridId: HTMLElement = document.querySelector('#' + resourceTreeGridId);
            const resourceTreeGrid: TreeGrid = <TreeGrid>(<EJ2Instance>treeGridId).ej2_instances[0];
            if (!isNullOrUndefined(resourceTreeGrid) && resourceTreeGrid.getSelectedRecords().length > 0) {
                const tempRecords: CObject[] = <CObject[]>resourceTreeGrid.getSelectedRecords();
                let index: number;
                const selectedItems: CObject[] = [];
                for (index = 0; index < tempRecords.length; index++) {
                    const record: CObject = tempRecords[index as number];
                    if (!isNullOrUndefined(record.taskData) &&
                        !isNullOrUndefined(record.taskData[this.parent.resourceFields.unit]) &&
                        !isNullOrUndefined(args.data[this.parent.resourceFields.unit]) &&
                        (record.taskData[this.parent.resourceFields.id] === args.data[this.parent.resourceFields.id])) {
                        record.taskData[this.parent.resourceFields.unit] = args.data[this.parent.resourceFields.unit];
                    }
                    selectedItems.push(<CObject>tempRecords[index as number].taskData);
                }
                this.ganttResources = <Record<string, unknown>[]>extend([], selectedItems);
            } else {
                this.ganttResources = [];
            }
        } else {
            this.ganttResources = [];
        }
    }

    private renderResourceTab(itemName: string): HTMLElement {
        const ganttObj: Gantt = this.parent;
        const resourceSettings: ResourceFieldsModel = ganttObj.resourceFields;
        const ganttData: IGanttData = this.beforeOpenArgs.rowData;
        if (((this.beforeOpenArgs.requestType === 'beforeOpenEditDialog' && !isNullOrUndefined(this.editedRecord[this.parent.taskFields.resourceInfo])) || (this.beforeOpenArgs.requestType === 'beforeOpenAddDialog' && !isNullOrUndefined(this.editedRecord[this.parent.taskFields.resourceInfo]))) &&
        (typeof (this.editedRecord[this.parent.taskFields.resourceInfo]) === 'object')) {
            this.parent.setRecordValue('resourceInfo', this.parent.dataOperation.setResourceInfo(this.editedRecord), ganttData.ganttProperties, true);
        }
        const rowResource: Object[] = ganttData.ganttProperties.resourceInfo;
        let inputModel: TreeGridModel = this.beforeOpenArgs[itemName as string];
        inputModel.enableAdaptiveUI = this.parent.enableAdaptiveUI;
        inputModel.enableRtl = this.parent.enableRtl;
        inputModel.locale = this.parent.locale;
        const resourceTreeGridId: string = ganttObj.element.id + '' + itemName + 'TabContainer';
        let resourceData: Object[] = [];
        resourceData = extend([], [], ganttObj.resources, true) as Object[];
        this.parent.dataOperation.updateResourceUnit(resourceData);
        if (!isNullOrUndefined(rowResource)) {
            let count: number;
            const rowResourceLength: number = rowResource.length;
            let index: number;
            const resourceDataLength: number = resourceData.length;
            for (count = 0; count < rowResourceLength; count++) {
                for (index = 0; index < resourceDataLength; index++) {
                    if (rowResource[count as number][resourceSettings.id] === resourceData[index as number][resourceSettings.id]) {
                        resourceData[index as number][resourceSettings.unit] = rowResource[count as number][resourceSettings.unit];
                    }
                }
            }
        }
        inputModel.dataSource = resourceData;
        const resourceInfo: Object[] = ganttData.ganttProperties.resourceInfo;
        if (this.isEdit && !isNullOrUndefined(resourceInfo)) {
            for (let i: number = 0; i < resourceInfo.length; i++) {
                this.ganttResources.push(resourceInfo[i as number]);
            }
        } else if (!this.isEdit && !isNullOrUndefined(resourceInfo)) {
            for (let i: number = 0; i < resourceInfo.length; i++) {
                this.ganttResources.push(resourceInfo[i as number]);
            }
        }
        /* eslint-disable-next-line */
        inputModel.actionBegin = (args: any): void => {
            if (args.rowData && args.columnName === this.parent.resourceFields.unit && this.editedRecord.ganttProperties.resourceInfo) {
                for (let i: number = 0; i < this.editedRecord.ganttProperties.resourceInfo.length; i++) {
                    if (this.editedRecord.ganttProperties.resourceInfo[i as number][this.parent.resourceFields.id] ===
                        args.rowData[this.parent.resourceFields.id]) {
                        this.editedRecord.ganttProperties.resourceInfo[i as number][this.parent.resourceFields.unit] = args.value;
                    }
                }
            }
        };
        inputModel.rowSelected = (args: RowSelectEventArgs): void => {
            this.updateResourceCollection(args, resourceTreeGridId);
            this.currentResources = this.ganttResources;
        };
        inputModel.rowDeselected = (args: RowSelectEventArgs): void => {
            this.updateResourceCollection(args, resourceTreeGridId);
            this.currentResources = this.ganttResources;
        };

        const divElement: HTMLElement = this.createDivElement('e-resource-div', resourceTreeGridId);
        const tabIndex: number = this.getDialogTabIndex('Resources');
        let dialogField: AddDialogFieldSettingsModel;
        if (!this.isEdit) {
            dialogField = this.parent.addDialogFields[tabIndex as number];
        } else if (this.isEdit) {
            dialogField = this.parent.editDialogFields[tabIndex as number];
        }
        let allProperty: TreeGridModel;
        /* eslint-disable-next-line */
        let columnCollection: any = [];
        let toolbars: (string | ItemModel | TreeGridToolbarItem)[];
        if (!isNullOrUndefined(dialogField) && !isNullOrUndefined(dialogField.additionalParams)) {
            allProperty = (dialogField.additionalParams) as TreeGridModel;
            for (const i in allProperty) {
                if (Object.prototype.hasOwnProperty.call(allProperty, i)) {
                    switch (i) {
                    case 'allowFiltering':
                        TreeGrid.Inject(TreeGridFilter);
                        break;
                    case 'allowSorting':
                        TreeGrid.Inject(TreeGridSort);
                        break;
                    case 'allowPaging':
                        TreeGrid.Inject(TreeGridPage);
                        break;
                    case 'editSettings':
                        TreeGrid.Inject(TreeGridEdit);
                        break;
                    case 'aggregates':
                        TreeGrid.Inject(TreeGridAggregate);
                        break;
                    case 'showColumnChooser':
                        TreeGrid.Inject(TreeGridAggregate);
                        break;
                    case 'showColumnMenu':
                        TreeGrid.Inject(ColumnMenu);
                        break;
                    case 'contextMenuItems':
                        TreeGrid.Inject(ContextMenu);
                        break;
                    case 'allowResizing':
                        TreeGrid.Inject(TreeGridResize);
                        break;
                    case 'allowReordering':
                        TreeGrid.Inject(TreeGridReorder);
                        break;
                    case 'detailTemplate':
                        TreeGrid.Inject(DetailRow);
                        break;
                    case 'allowRowDragAndDrop':
                        TreeGrid.Inject(TreeGridRowDD);
                        break;
                    case 'searchSettings':
                        TreeGrid.Inject(Search);
                        break;
                    case 'selectionSettings':
                        TreeGrid.Inject(TreeGridSelection);
                        break;
                    case 'toolbar':
                        toolbars = allProperty['toolbar'] as (string | ItemModel | TreeGridToolbarItem)[];
                        toolbars.map((item: string | ItemModel | TreeGridToolbarItem) => {
                            switch (item) {
                            case 'Search':
                                TreeGrid.Inject(Search);
                                break;
                            case 'Print':
                                TreeGrid.Inject(Print);
                                break;
                            case 'PdfExport':
                                TreeGrid.Inject(PdfExport);
                                break;
                            case 'ExcelExport':
                                TreeGrid.Inject(ExcelExport);
                                break;
                            default:
                                break;
                            }
                        });
                        if (!isNullOrUndefined(toolbars)) {
                            inputModel.toolbar = [];
                            inputModel.toolbar = [...inputModel.toolbar, ...toolbars];
                        }
                        TreeGrid.Inject(TreeGridToolbar);
                        break;
                    case 'enableVirtualization':
                        TreeGrid.Inject(VirtualScroll);
                        break;
                    case 'columns':
                        columnCollection = inputModel.columns;
                        break;
                    default:
                        break;
                    }
                }
            }
        }
        TreeGrid.Inject(TreeGridSelection, TreeGridFilter, TreeGridEdit, VirtualScroll, TreeGridToolbar);
        inputModel = { ...inputModel, ...allProperty };
        const columnCollections: Column[] | string[] | ColumnModel[] = this.updateColumns(columnCollection, inputModel.columns as Column[]);
        inputModel.columns = columnCollections as TreeGridColumnModel[];
        let isColumnMenu: boolean = false;
        if (inputModel.showColumnMenu) {
            isColumnMenu = inputModel.showColumnMenu;
            inputModel.showColumnMenu = false;
        }
        const treeGridObj: TreeGrid = new TreeGrid(inputModel);
        const resourceColumn: GanttColumnModel = this.parent.columnByField[this.parent.taskFields.resourceInfo];
        if (resourceColumn.allowEditing === false || resourceColumn.isPrimaryKey || this.parent.readOnly) {
            treeGridObj.allowSelection = false;
            treeGridObj.allowFiltering = false;
            treeGridObj.editSettings.allowEditing = false;
        }
        treeGridObj.dataBound = () => {
            if (isColumnMenu) {
                treeGridObj.showColumnMenu = true;
            }
            if (this.parent.editDialogFields.length >= 1 && this.parent.editDialogFields[0].type === 'Resources') {
                const id: string = this.parent.element.id + 'ResourcesTabContainer';
                this.resourceSelection(id);
            }
        };
        treeGridObj.appendTo(divElement);
        return divElement;
    }
    private resourceSelection(id: string): void {
        const resourceTreeGrid: TreeGrid = <TreeGrid>(<EJ2Instance>document.querySelector('#' + id)).ej2_instances[0];
        this.parent['triggeredColumnName'] = '';
        const currentViewData: Object[] = resourceTreeGrid.getCurrentViewRecords();
        const resources: Object[] = this.ganttResources;
        if (resources && resources.length > 0) {
            currentViewData.forEach((data: CObject, index: number): void => {
                for (let i: number = 0; i < resources.length; i++) {
                    if (data.taskData[this.parent.resourceFields.id] === resources[i as number][this.parent.resourceFields.id] &&
                        !isNullOrUndefined(resourceTreeGrid.selectionModule) &&
                        resourceTreeGrid.getSelectedRowIndexes().indexOf(index) === -1) {
                        resourceTreeGrid.selectRow(index);
                    }
                }
            });
        }
    }
    private renderCustomTab(itemName: string, isCustomTab: boolean): HTMLElement {
        return this.renderGeneralTab(itemName, isCustomTab);
    }
    private renderNotesTab(itemName: string): HTMLElement {
        const ganttObj: Gantt = this.parent;
        let inputModel: RichTextEditorModel = this.beforeOpenArgs[itemName as string];
        inputModel.enableHtmlSanitizer = this.parent.enableHtmlSanitizer;
        const ganttProp: ITaskData = this.editedRecord.ganttProperties;
        const divElement: HTMLElement = this.createDivElement('', ganttObj.element.id + '' + itemName + 'TabContainer');
        const tabIndex: number = this.getDialogTabIndex('Notes');
        let dialogField: AddDialogFieldSettingsModel;
        let toolbarCollection: (string | IToolbarItems)[] = [];
        if (!this.isEdit) {
            dialogField = this.parent.addDialogFields[tabIndex as number];
        } else if (this.isEdit) {
            dialogField = this.parent.editDialogFields[tabIndex as number];
        }
        let allProperty: RichTextEditorModel;
        if (!isNullOrUndefined(dialogField) && !isNullOrUndefined(dialogField.additionalParams)) {
            allProperty = dialogField.additionalParams;
            for (const i in allProperty) {
                if (Object.prototype.hasOwnProperty.call(allProperty, i)) {
                    switch (i) {
                    case 'toolbarSettings':
                        for (let j: number = 0; j < allProperty['toolbarSettings'].items.length; j++) {
                            /* eslint-disable-next-line */
                            const key: any = allProperty['toolbarSettings'].items[j as number];
                            if (key) {
                                switch (key) {
                                case 'Image':
                                    RichTextEditor.Inject(Image);
                                    break;
                                case 'CreateTable':
                                    RichTextEditor.Inject(Table);
                                    break;
                                case 'EmojiPicker':
                                    RichTextEditor.Inject(EmojiPicker);
                                    break;
                                case 'FileManager':
                                    RichTextEditor.Inject(FileManager);
                                    break;
                                case 'FormatPainter':
                                    RichTextEditor.Inject(FormatPainter);
                                    break;
                                default:
                                    break;
                                }
                            }
                        }
                        if (!isNullOrUndefined(allProperty['toolbarSettings'].items)) {
                            toolbarCollection = inputModel.toolbarSettings.items;
                        }
                        RichTextEditor.Inject(RTEToolbar);
                        break;
                    case 'editorMode':
                        RichTextEditor.Inject(MarkdownEditor);
                        break;
                    default:
                        break;
                    }
                }
            }

        }
        RichTextEditor.Inject(RTEToolbar, Link, HtmlEditor, QuickToolbar, Count, Table);
        inputModel.value = ganttProp.notes;
        const notesColumn: GanttColumnModel = this.parent.columnByField[this.parent.taskFields.notes];
        if (notesColumn.allowEditing === false || notesColumn.isPrimaryKey || this.parent.readOnly) {
            inputModel.enabled = false;
        }
        inputModel = { ...inputModel, ...allProperty };
        inputModel.toolbarSettings.items = [...toolbarCollection, ...inputModel.toolbarSettings.items];
        const rteObj: RichTextEditor = new RichTextEditor(inputModel);
        rteObj.appendTo(divElement);
        return divElement;
    }
    private renderInputElements(inputModel: CObject, column: GanttColumnModel): HTMLElement {
        const ganttId: string = this.parent.element.id;
        const ganttData: IGanttData = this.editedRecord;
        const divElement: HTMLElement = this.createDivElement('e-edit-form-column');
        let inputElement: HTMLElement;
        let tr: HTMLElement;
        let td: HTMLElement;
        if (this.parent.enableAdaptiveUI) {
            tr = createElement('tr');
            td = createElement('td');
            divElement.style.width = '100%';
        }
        const editArgs: Record<string, unknown> = { column: column, data: ganttData };
        if (!isNullOrUndefined(column.edit) && Object.prototype.hasOwnProperty.call(column.edit, 'create') &&
        !Object.prototype.hasOwnProperty.call(column.edit, 'params')) {
            let create: Function = column.edit.create as Function;
            if (typeof create === 'string') {
                create = getObject(create, window);
                inputElement = create(editArgs);
            } else {
                inputElement = (column.edit.create as Function)(editArgs);
            }
            inputElement.className = '';
            inputElement.setAttribute('type', 'text');
            inputElement.setAttribute('id', ganttId + '' + column.field);
            inputElement.setAttribute('name', column.field);
            inputElement.setAttribute('title', column.field);
            divElement.appendChild(inputElement);
        } else {
            inputElement = this.createInputElement('', ganttId + '' + column.field, column.field);
            divElement.appendChild(inputElement);
        }
        inputModel.enabled = !isNullOrUndefined(inputModel.enabled) ? inputModel.enabled : !this.isCheckIsDisabled(column);
        if (column.field === this.parent.taskFields.constraintType && ganttData.hasChildRecords) {
            const asSoonAsPossibleText: string = this.parent.treeGridModule['getLocalizedConstraintTypeText']('AsSoonAsPossible');
            const startNoEarlierThanText: string = this.parent.treeGridModule['getLocalizedConstraintTypeText']('StartNoEarlierThan');
            const finishNoLaterThanText: string = this.parent.treeGridModule['getLocalizedConstraintTypeText']('FinishNoLaterThan');
            inputModel.dataSource = (inputModel.dataSource as any[]).filter(({ text }: { text: string }) =>
                text === asSoonAsPossibleText ||
                text === startNoEarlierThanText ||
                text === finishNoLaterThanText
            );
        }
        if (column.field === this.parent.taskFields.duration) {
            if (!isNullOrUndefined(column.valueAccessor)) {
                if (typeof column.valueAccessor === 'string') {
                    const valueAccessor: Function = getObject(column.valueAccessor, window);
                    inputModel.value = valueAccessor(column.field, ganttData, column);
                }
                else if (column.editType === 'numericedit') {
                    inputModel.value = ganttData.ganttProperties.duration;
                }
                else {
                    inputModel.value = (column.valueAccessor as Function)(column.field, ganttData, column);
                }
            } else if (isNullOrUndefined(column.edit)) {
                const ganttProp: ITaskData = ganttData.ganttProperties;
                inputModel.value = this.parent.dataOperation.getDurationString(ganttProp.duration, ganttProp.durationUnit);
            }
        }
        else if (column.field === this.parent.taskFields.baselineDuration) {
            if (!isNullOrUndefined(column.valueAccessor)) {
                if (typeof column.valueAccessor === 'string') {
                    const valueAccessor: Function = getObject(column.valueAccessor, window);
                    inputModel.value = valueAccessor(column.field, ganttData, column);
                } else {
                    inputModel.value = (column.valueAccessor as Function)(column.field, ganttData, column);
                }
            } else if (isNullOrUndefined(column.edit)) {
                const ganttProp: ITaskData = ganttData.ganttProperties;
                inputModel.value = this.parent.dataOperation.getDurationString(ganttProp.baselineDuration, ganttProp.durationUnit);
            }
        } else {
            if (column.editType === 'booleanedit') {
                if (ganttData[column.field] === true) {
                    inputModel.checked = true;
                } else {
                    inputModel.checked = false;
                }
            } else {
                if (!this.parent.taskFields[column.field] && column.editType === 'numericedit' && (ganttData[column.field] === '' || ganttData[column.field] === 0)) {
                    inputModel.value = 0;
                }
                else {
                    inputModel.value = ganttData[column.field];
                    if (column.field === this.parent.taskFields.progress) {
                        const hasDecimalEdit: boolean = this.parent.dataOperation['isDecimalProgress'](column.field);
                        inputModel.value = hasDecimalEdit ? Number(ganttData[column.field]) : Math.floor(ganttData[column.field]);
                    }
                }
            }
        }
        if (!isNullOrUndefined(column.edit) && Object.prototype.hasOwnProperty.call(column.edit, 'write') &&
        !Object.prototype.hasOwnProperty.call(column.edit, 'params')) {
            let write: Function = column.edit.write as Function;
            let inputObj: Inputs;
            if (typeof write === 'string') {
                write = getObject(write, window);
                inputObj = write({
                    column: column, rowData: ganttData, element: inputElement
                });
            } else {
                inputObj = (column.edit.write as Function)({
                    column: column, rowData: ganttData, element: inputElement
                });
            }
            if (column.field === this.parent.taskFields.duration) {
                inputObj.change = (args: CObject): void => {
                    this.validateScheduleFields(args, column, this.parent);
                };
            }
        } else {
            const inputObj: Inputs = new this.inputs[column.editType](inputModel);
            inputObj.appendTo(inputElement);
        }
        if (this.parent.enableAdaptiveUI) {
            td.appendChild(divElement);
            tr.appendChild(td);
            return tr;
        }
        else {
            return divElement;
        }
    }

    private taskNameCollection(): void {
        const flatData: IGanttData[] = this.parent.flatData;
        this.preTaskIds = [];
        this.preTableCollection = [];
        for (let i: number = 0; i < flatData.length; i++) {
            const data: IGanttData = flatData[i as number];
            if (this.parent.allowParentDependency) {
                let currentFlatData: IGanttData = data;
                if (data.parentUniqueID === this.beforeOpenArgs.rowData['uniqueID']) {
                    this.isValidData = false;
                }
                else {
                    do {
                        if (currentFlatData.parentItem) {
                            currentFlatData = this.parent.flatData[this.parent.ids.indexOf(currentFlatData.parentItem.taskId)];
                            if (currentFlatData.uniqueID === this.beforeOpenArgs.rowData['uniqueID']) {
                                this.isValidData = false;
                                break;
                            }
                        }
                    }
                    while (currentFlatData.parentItem);
                }
                if (data.hasChildRecords && this.isValidData) {
                    this.isValidData = this.isParentValid(data.childRecords);
                }
                if (!this.isValidData) {
                    this.isValidData = true;
                    continue;
                }
            }
            else {
                if (data.hasChildRecords) {
                    continue;
                }
            }
            const taskId: string = this.parent.viewType === 'ResourceView' ? data.ganttProperties.taskId.toString()
                : data.ganttProperties.rowUniqueID.toString();
            const tempObject: IDependencyEditData = {
                id: taskId,
                text: (taskId + '-' + data.ganttProperties.taskName),
                value: taskId
            };
            this.preTaskIds.push(tempObject.id);
            this.preTableCollection.push(tempObject);
        }
    }

    private predecessorEditCollection(ganttData: IGanttData): IPreData[] {
        const preDataCollection: IPreData[] = [];
        const ganttProp: ITaskData = ganttData.ganttProperties;
        if (this.isEdit && !isNullOrUndefined(this.parent.taskFields.dependency) && !isNullOrUndefined(ganttData) &&
            !isNullOrUndefined(ganttProp.predecessor)) {
            const predecessor: IPredecessor[] = ganttProp.predecessor;
            const idCollection: IDependencyEditData[] = this.preTableCollection;
            for (let i: number = 0; i < predecessor.length; i++) {
                const from: string = predecessor[i as number].from.toString();
                const preData: IPreData = {};
                const taskID: string = this.parent.viewType === 'ResourceView' ? ganttProp.taskId : ganttProp.rowUniqueID;
                if (taskID.toString() !== from) {
                    preData.id = from;
                    for (let index: number = 0; index < idCollection.length; index++) {
                        if (idCollection[index as number].value === from) {
                            preData.name = idCollection[index as number].text;
                            break;
                        }
                    }
                    preData.type = predecessor[i as number].type;
                    const offset: number = predecessor[i as number].offset;
                    const offsetUnit: string = predecessor[i as number].offsetUnit;
                    preData.offset = this.parent.dataOperation.getDurationString(offset, offsetUnit);
                    preData.uniqueId = getUid();
                    preDataCollection.push(preData);
                }
            }
        }
        return preDataCollection;
    }

    private updatePredecessorDropDownData(ganttData: IGanttData): void {
        this.processedId.length = 0;
        let index: number = -1;
        const id: string = this.parent.viewType === 'ResourceView' ? ganttData.ganttProperties.taskId.toString()
            : ganttData.ganttProperties.rowUniqueID.toString();
        index = this.preTaskIds.indexOf(id);
        this.preTableCollection.splice(index, 1);
        this.preTaskIds.splice(index, 1);
        this.validSuccessorTasks(ganttData, this.preTaskIds, this.preTableCollection);
    }

    private validSuccessorTasks(data: IGanttData, ids: string[], idCollection: IDependencyEditData[]): void {
        const ganttProp: ITaskData = data.ganttProperties;
        if (ganttProp.predecessor && ganttProp.predecessor.length > 0) {
            const predecessor: IPredecessor[] = ganttProp.predecessor;
            const fromId: string = this.parent.viewType === 'ResourceView' ? ganttProp.taskId.toString() : ganttProp.rowUniqueID.toString();
            predecessor.forEach((item: IPredecessor) => {
                if (item.from.toString() === fromId) {
                    const toId: string = item.to; let idIndex: number = -1;
                    idIndex = ids.indexOf(toId);
                    if (idIndex > -1) {
                        ids.splice(idIndex, 1);
                        idCollection.splice(idIndex, 1);
                    }
                    const ganttData: IGanttData = this.parent.connectorLineModule.getRecordByID(toId);
                    let isIdInclude: boolean = true;
                    for (const item of this.processedId) {
                        if (item.id === ganttData.ganttProperties.taskId) {
                            if (Array.isArray(item.value) && Array.isArray(ganttData.ganttProperties.predecessor)) {
                                if (item.value.length === ganttData.ganttProperties.predecessor.length) {
                                    let arraysMatch: boolean = true;
                                    for (let i: number = 0; i < item.value.length; i++) {
                                        if (item.value[i as number] !== ganttData.ganttProperties.predecessor[i as number]) {
                                            arraysMatch = false;
                                            break;
                                        }
                                    }
                                    if (arraysMatch) {
                                        isIdInclude = false;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    if (isIdInclude) {
                        this.processedId.push({ id: ganttData.ganttProperties.taskId, value: ganttData.ganttProperties.predecessor });
                        this.validSuccessorTasks(ganttData, ids, idCollection);
                    }
                }
            });
        }
    }

    private getPredecessorType(): IDependencyEditData[] {
        const typeText: string[] = [this.parent.getPredecessorTextValue('SS'), this.parent.getPredecessorTextValue('SF'),
            this.parent.getPredecessorTextValue('FS'), this.parent.getPredecessorTextValue('FF')];
        const types: IDependencyEditData[] = [
            { id: 'FS', text: typeText[2], value: typeText[2] },
            { id: 'FF', text: typeText[3], value: typeText[3] },
            { id: 'SS', text: typeText[0], value: typeText[0] },
            { id: 'SF', text: typeText[1], value: typeText[1] }
        ];
        return types;
    }
    private initiateDialogSave(): boolean {
        if (this.isEdit) {
            this.parent.initiateEditAction(true);
        } else {
            this.addedRecord = {};
        }
        if (this.currentResources) {
            this.currentResources = null;
        }
        if (this.parent.undoRedoModule && this.parent['isUndoRedoItemPresent']('Edit')) {
            if (this.parent.undoRedoModule['redoEnabled']) {
                this.parent.undoRedoModule['disableRedo']();
            }
            if (this.isEdit) {
                this.parent.undoRedoModule['createUndoCollection']();
                const action: Object = {};
                action['action'] = 'DialogEdit';
                action['modifiedRecords'] = [];
                this.parent.undoRedoModule['getUndoCollection'][this.parent.undoRedoModule['getUndoCollection'].length - 1] = action;
                if (this.parent.viewType === 'ResourceView') {
                    let isValid: boolean = false;
                    if (!this.rowData.ganttProperties.resourceInfo) {
                        if (this.ganttResources.length > 0) {
                            isValid = true;
                        }
                    }
                    else if (this.ganttResources.length !== this.rowData.ganttProperties.resourceInfo.length) {
                        isValid = true;
                    }
                    else {
                        for (let i: number = 0; i < this.rowData.ganttProperties.resourceInfo.length; i++) {
                            if (this.ganttResources[i as number][this.parent.resourceFields.id] !==
                                this.rowData.ganttProperties.resourceInfo[i as number][this.parent.resourceFields.id]) {
                                isValid = true;
                                break;
                            }
                        }
                    }
                    if (isValid) {
                        const indexes: Object = {};
                        indexes['deletedIndexes'] = [];
                        const id: string = 'T' + this.rowData.ganttProperties.taskId;
                        const rowItems: IGanttData[] = [];
                        this.parent.taskIds.reduce(function (e: string, i: string): void {
                            if (i === id) {
                                if (this.ganttResources.length === 0) {
                                    rowItems.push(this.parent.flatData[this.parent.taskIds.indexOf(i)]);
                                }
                                else {
                                    const parent: IGanttData = this.parent.getTaskByUniqueID(
                                        this.parent.flatData[this.parent.taskIds.indexOf(i)].parentUniqueID);
                                    for (let j: number = 0; j < this.ganttResources.length; j++) {
                                        if (parent.ganttProperties.taskId !==
                                            this.ganttResources[j as number][this.parent.resourceFields.id] &&
                                            rowItems.indexOf(this.parent.flatData[this.parent.taskIds.indexOf(i)]) === -1) {
                                            rowItems.push(this.parent.flatData[this.parent.taskIds.indexOf(i)]);
                                        }
                                    }
                                }
                            }
                        }.bind(this), []);
                        this.parent.undoRedoModule['findPosition'](extend([], [], rowItems, true) as IGanttData[], indexes, 'deletedIndexes');
                        if (this['indexes']) {
                            this['indexes']['deletedIndexes'][this['indexes']['deletedIndexes'].length] = indexes['deletedIndexes'][0];
                        }
                        else {
                            this['indexes'] = indexes;
                        }
                    }
                }
            }
        }
        this.parent['updateDuration'] = true;
        const ganttObj: Gantt = this.parent;
        const tabModel: TabModel = this.beforeOpenArgs.tabModel;
        const items: TabItemModel[] = tabModel.items;
        for (let i: number = 0; i < items.length; i++) {
            const element: HTMLElement = items[i as number].content as HTMLElement;
            let id: string = element.getAttribute('id');
            if (!isNullOrUndefined(id) || id !== '') {
                id = id.replace(ganttObj.element.id, '');
                id = id.replace('TabContainer', '');
                if (id === 'General') {
                    this.updateGeneralTab(element, false);
                } else if (id === 'Advanced') {
                    this.updateAdvancedTab(element);
                } else if (id === 'Dependency') {
                    this.isFromDialogPredecessor = true;
                    this.updatePredecessorTab(element);
                    this.isFromDialogPredecessor = false;
                } else if (id === 'Notes') {
                    this.updateNotesTab(element);
                } else if (id === 'Resources') {
                    this.updateResourceTab(element);
                    this.dialogEditValidationFlag = false;
                } else if (id.indexOf('Custom') !== -1) {
                    this.updateCustomTab(element);
                } else if (id === 'Segments') {
                    this.updateSegmentsData(element);
                }
            }
        }
        if (!this.disableUndo && this.parent.undoRedoModule) {
            this.parent.undoRedoModule['getUndoCollection'].splice(this.parent.undoRedoModule['getUndoCollection'].length - 1, 1);
            if (this.parent.toolbarModule && this.parent.undoRedoModule['getUndoCollection'].length === 0) {
                this.parent.toolbarModule.enableItems([this.parent.controlId + '_undo'], false);
            }
            this.parent['totalUndoAction']--;
        }
        if (this.isEdit) {
            /**
             * If any update on edited task do it here
             */
            this.parent.editModule['editedRecord'] = this.rowData;
            this.parent.dataOperation.updateWidthLeft(this.rowData);
            const editArgs: ITaskbarEditedEventArgs = {
                data: this.rowData,
                action: 'DialogEditing'
            };
            this.parent.editModule.initiateUpdateAction(editArgs);
        } else {
            this.parent.editModule['editedRecord'] = this.addedRecord;
            if (this.parent.viewType === 'ResourceView') {
                const newRecords: Object = extend({}, this.addedRecord, true);
                if (newRecords[this.parent.taskFields.resourceInfo].length) {
                    for (let i: number = 0; i < newRecords[this.parent.taskFields.resourceInfo].length; i++) {
                        const id: string = newRecords[this.parent.taskFields.resourceInfo][i as number].toString();
                        const parentRecordIndex: number = this.parent.getTaskIds().indexOf('R' + id.toString());
                        if (parentRecordIndex !== -1) {
                            this.parent.editModule.addRecord(this.addedRecord, 'Child', parentRecordIndex);
                            break;
                        }
                    }
                } else {
                    this.parent.editModule.addRecord(this.addedRecord, 'Bottom');
                }
            } else {
                this.parent.editModule.addRecord(this.addedRecord, this.parent.editSettings.newRowPosition, this.parent.selectedRowIndex);
            }
        }
        return true;
    }

    private compareObjects(prevSegments: ITaskSegment[], currentSegments: ITaskSegment[]): boolean {
        if (!isNullOrUndefined(prevSegments)) {
            return prevSegments.every((obj1: ITaskSegment, index: number) => {
                const obj2: ITaskSegment = currentSegments[index as number];
                const key: string[] = Object.keys(obj1);
                if (!isNullOrUndefined(obj1) && !isNullOrUndefined(obj2)) {
                    for (let i: number = 0; i < key.length; i++) {
                        if (key[i as number] === 'startDate' || key[i as number] === 'endDate') {
                            if (obj1[key[i as number]].getTime() !== obj2[key[i as number]].getTime()) {
                                return true;
                            }
                        }
                        else if (key[i as number] === 'duration' && obj1[key[i as number]] !== obj2[key[i as number]]) {
                            return true;
                        }
                    }
                }
                return false;
            });
        }
        return false;
    }

    private updateSegmentTaskData(dataSource: ITaskSegment[]): void {
        const taskSettings: TaskFieldsModel = this.parent.taskFields;
        if (!this.isEdit) {
            this.addedRecord[taskSettings.segments] = dataSource;
        } else {
            const prevSegments: ITaskSegment[] = this.rowData.ganttProperties.segments;
            this.parent.setRecordValue(
                'taskData.' + this.parent.taskFields.segments,
                dataSource,
                this.rowData);
            const currentSegments: ITaskSegment[] = this.parent.dataOperation.setSegmentsInfo(this.rowData, true);
            if (this.parent.enableUndoRedo && (prevSegments && currentSegments && (prevSegments.length !== currentSegments.length)) ||
                (!prevSegments && currentSegments) || ((prevSegments && !currentSegments)) ||
                this.compareObjects(prevSegments, currentSegments)) {
                this.disableUndo = true;
            }
            this.parent.setRecordValue('segments', currentSegments, this.rowData.ganttProperties, true);
            this.parent.setRecordValue(
                'segments', this.parent.dataOperation.setSegmentsInfo(this.rowData, false), this.rowData.ganttProperties, true
            );
            if (dataSource.length <= 0) {
                this.validateDuration(this.rowData);
            }
        }
    }
    private updateSegmentsData(segmentForm: HTMLElement): void {
        const gridObj: Grid = <Grid>(<EJ2Instance>segmentForm).ej2_instances[0];
        const isEdit: boolean = gridObj.isEdit;
        let dataSource: ITaskSegment[];
        if (gridObj.isEdit) {
            gridObj.endEdit();
        }
        if (isEdit && gridObj.currentViewData.length !== gridObj.dataSource['length']) {
            dataSource = <ITaskSegment[]>gridObj.dataSource;
        } else {
            dataSource = <ITaskSegment[]>gridObj.currentViewData;
        }
        this.updateSegmentTaskData(dataSource);
    }

    private updateGeneralTab(generalForm: HTMLElement, isCustom: boolean): void {
        const ganttObj: Gantt = this.parent;
        const childNodes: NodeList = generalForm.childNodes;
        let tasksData: Record<string, unknown> = {};
        if (!this.isEdit) {
            tasksData = this.addedRecord;
        }
        for (let i: number = 0; i < childNodes.length; i++) {
            const div: HTMLElement = childNodes[i as number] as HTMLElement;
            let inputElement: HTMLInputElement | HTMLTextAreaElement = div.querySelector('input[id^="' + ganttObj.element.id + '"]') || div.querySelector('textarea[id^="' + ganttObj.element.id + '"]');
            const editorChild: HTMLInputElement | HTMLTextAreaElement = Array.from(div.children).find(
                (child: Element) => child.classList.contains('e-richtexteditor')
            ) as HTMLInputElement | HTMLTextAreaElement | undefined;
            if (editorChild) {
                inputElement = editorChild;
            }
            if (inputElement) {
                const fieldName: string = inputElement.id.replace(ganttObj.element.id, '');
                const controlObj: CObject = <CObject>(<EJ2Instance>div.querySelector('#' + ganttObj.element.id + fieldName)).ej2_instances[0];
                if (this.parent.columnByField[this.parent.taskFields.id].editType === 'stringedit' && fieldName === this.parent.taskFields.id) {
                    const valueString: string = controlObj.value.toString();
                    controlObj.value = valueString;
                }
                const column: GanttColumnModel = ganttObj.columnByField[fieldName as string];
                if (fieldName === this.parent.taskFields.duration || this.parent.taskFields.baselineDuration ?
                    parseInt(this.rowData[fieldName as string], 10) !== parseInt(controlObj.value as string, 10) :
                    this.rowData[fieldName as string] !== controlObj.value) {
                    this.disableUndo = true;
                }
                if (!isNullOrUndefined(column) && !isNullOrUndefined(column.edit) && !isNullOrUndefined(column.edit.read) &&
                isNullOrUndefined(column.edit.params)) {
                    let read: Function = column.edit.read as Function;
                    if (typeof read === 'string') {
                        read = getObject(read, window);
                        tasksData[fieldName as string] = read(inputElement, controlObj.value);
                    } else {
                        tasksData[fieldName as string] = (column.edit.read as Function)(inputElement, controlObj.value);
                    }
                } else if (!isNullOrUndefined(column) && column.editType === 'booleanedit') {
                    if (inputElement instanceof HTMLInputElement && inputElement.checked === true) {
                        tasksData[fieldName as string] = true;
                    } else {
                        tasksData[fieldName as string] = false;
                    }
                } else {
                    if (fieldName === this.parent.taskFields.duration || fieldName === this.parent.taskFields.baselineDuration) {
                        const numericValue: number = parseFloat(String(controlObj.value));
                        tasksData[fieldName as string] = numericValue;
                    }
                    else {
                        if (this.parent.weekWorkingTime.length > 0 && controlObj.value && (fieldName === this.parent.taskFields.startDate ||
                            fieldName === this.parent.taskFields.baselineStartDate)) {
                            const sDate: Date = fieldName === this.parent.taskFields.startDate ? this.beforeOpenArgs.rowData['ganttProperties'].startDate : this.beforeOpenArgs.rowData['ganttProperties'].baselineStartDate;
                            const prevDay: number = this.parent['getStartTime'](sDate);
                            if (prevDay / 3600 === sDate.getHours()) {
                                const dayStartTime: number = this.parent['getStartTime'](controlObj.value as Date);
                                this.parent.dataOperation.setTime(dayStartTime, controlObj.value as Date);
                                tasksData[fieldName as string] = controlObj.value;
                            }
                            else {
                                tasksData[fieldName as string] = controlObj.value;
                            }
                        }
                        else {
                            tasksData[fieldName as string] = controlObj.value;
                        }
                    }
                    if (this.parent.enableHtmlSanitizer && typeof (controlObj.value) === 'string') {
                        controlObj.value = SanitizeHtmlHelper.sanitize(controlObj.value);
                        tasksData[fieldName as string] = controlObj.value;
                    }
                }
            }
        }
        if (this.isEdit) {
            if (!isCustom) {
                this.updateScheduleProperties(this.editedRecord, this.rowData);
            }
            ganttObj.editModule.validateUpdateValues(tasksData, this.rowData, true);
        }
    }
    private updateAdvancedTab(advancedForm: HTMLElement): void {
        const ganttObj: Gantt = this.parent;
        const childNodes: NodeList = advancedForm.childNodes;
        const tasksData: Record<string, unknown> = this.isEdit
            ? this.rowData as Record<string, unknown>
            : this.addedRecord as Record<string, unknown>;
        for (let i: number = 0; i < childNodes.length; i++) {
            const div: HTMLElement = childNodes[i as number] as HTMLElement;
            // Get input or textarea element
            let inputElement: HTMLInputElement | HTMLTextAreaElement =
                div.querySelector(`input[id^="${ganttObj.element.id}"]`);

            // Check if RichTextEditor is present
            const editorChild: HTMLInputElement | HTMLTextAreaElement = Array.from(div.children).find((child: Element) =>
                child.classList.contains('e-richtexteditor')
            ) as HTMLInputElement | HTMLTextAreaElement | undefined;

            if (editorChild) {
                inputElement = editorChild;
            }

            if (inputElement) {
                const fieldName: string = inputElement.id.replace(ganttObj.element.id, '');
                const controlObj: CObject = (<EJ2Instance>(
                    div.querySelector(`#${ganttObj.element.id}${fieldName}`)
                )).ej2_instances[0] as CObject;
                const column: GanttColumnModel = ganttObj.columnByField[fieldName as string];

                // Disable undo if value has changed
                if (
                    (this.rowData[fieldName as string] !== controlObj.value)
                ) {
                    this.disableUndo = true;
                }
                if (column && column.edit && !column.edit.params) {
                    let read: Function = column.edit.read as Function;
                    if (typeof read === 'string') {
                        read = getObject(read, window);
                    }
                    tasksData[fieldName as string] = read(inputElement, controlObj.value);
                } else {
                    tasksData[fieldName as string] = (inputElement as HTMLInputElement)['ej2_instances'][0].value;
                }
            }
        }
        if (this.isEdit) {
            ganttObj.editModule.validateUpdateValues(tasksData, this.rowData, true);
        }
    }
    private updateScheduleProperties(fromRecord: IGanttData, toRecord: IGanttData): void {
        this.parent.setRecordValue('startDate', fromRecord.ganttProperties.startDate, toRecord.ganttProperties, true);
        this.parent.setRecordValue('endDate', fromRecord.ganttProperties.endDate, toRecord.ganttProperties, true);
        this.parent.setRecordValue('duration', fromRecord.ganttProperties.duration, toRecord.ganttProperties, true);
        this.parent.setRecordValue('baselineDuration', fromRecord.ganttProperties.baselineDuration, toRecord.ganttProperties, true);
        this.parent.setRecordValue('baselineStartDate', fromRecord.ganttProperties.baselineStartDate, toRecord.ganttProperties, true);
        this.parent.setRecordValue('baselineEndDate', fromRecord.ganttProperties.baselineEndDate, toRecord.ganttProperties, true);
        this.parent.setRecordValue('durationUnit', fromRecord.ganttProperties.durationUnit, toRecord.ganttProperties, true);
        this.parent.setRecordValue('work', fromRecord.ganttProperties.work, toRecord.ganttProperties, true);
        this.parent.setRecordValue('type', fromRecord.ganttProperties.taskType, toRecord.ganttProperties, true);
        this.parent.setRecordValue('taskType', fromRecord.ganttProperties.taskType, toRecord.ganttProperties, true);
        this.parent.setRecordValue('resourceNames', fromRecord.ganttProperties.resourceNames, toRecord.ganttProperties, true);
        this.parent.setRecordValue('resourceInfo', fromRecord.ganttProperties.resourceInfo, toRecord.ganttProperties, true);
        if (!isNullOrUndefined(this.parent.taskFields.startDate)) {
            this.parent.dataOperation.updateMappingData(toRecord, 'startDate');
        }
        if (!isNullOrUndefined(this.parent.taskFields.endDate)) {
            this.parent.dataOperation.updateMappingData(toRecord, 'endDate');
        }
        if (!isNullOrUndefined(this.parent.taskFields.duration)) {
            this.parent.dataOperation.updateMappingData(toRecord, 'duration');
            this.parent.setRecordValue('durationUnit', fromRecord.ganttProperties.durationUnit, this.rowData, true);
            if (this.rowData.ganttProperties.duration === 0) {
                this.parent.setRecordValue('isMilestone', true, toRecord.ganttProperties, true);
            } else {
                this.parent.setRecordValue('isMilestone', false, this.rowData.ganttProperties, true);
            }
        }
        if (!isNullOrUndefined(this.parent.taskFields.baselineDuration)) {
            this.parent.dataOperation.updateMappingData(toRecord, 'baselineDuration');
        }
        if (!isNullOrUndefined(this.parent.taskFields.work)) {
            this.parent.dataOperation.updateMappingData(this.rowData, 'work');
        }
        if (!isNullOrUndefined(this.parent.taskFields.manual)) {
            this.parent.dataOperation.updateMappingData(this.rowData, 'manual');
        }
        if (!isNullOrUndefined(this.parent.taskFields.type)) {
            this.parent.dataOperation.updateMappingData(this.rowData, 'type');
        }
        if (!isNullOrUndefined(this.parent.taskFields.resourceInfo)) {
            this.parent.dataOperation.updateMappingData(this.rowData, 'resourceInfo');
        }
    }
    private getMatchingPrefix(preData: IPreData, idArray: string[]): string[] {
        const parts: string[] = preData.name.split('-');
        let current: string = '';
        for (let i: number = 0; i < parts.length; i++) {
            current = current === '' ? parts[i as number] : current + '-' + parts[i as number];
            if (idArray.indexOf(current) !== -1) {
                return [current];
            }
        }
        return [];
    }
    private updatePredecessorTab(preElement: HTMLElement): void {
        const gridObj: Grid = <Grid>(<EJ2Instance>preElement).ej2_instances[0];
        if (gridObj.isEdit) {
            gridObj.endEdit();
        }
        const dataSource: IPreData[] = <IPreData[]>gridObj.dataSource;
        const predecessorName: string[] = [];
        let newValues: IPredecessor[] = [];
        let predecessorString: string = '';
        const ids: string[] = [];
        const parentRecord: IGanttData[] = [];
        for (let i: number = 0; i < dataSource.length; i++) {
            const preData: IPreData = dataSource[i as number];
            const splitString: string[] = this.getMatchingPrefix(preData, this.parent.ids);
            if (isNullOrUndefined(preData.id) || (!isNullOrUndefined(splitString[0]) && preData.id !== splitString[0])) {
                preData.id = splitString[0];
            }
            if (ids.indexOf(preData.id) === -1) {
                if (this.parent.viewType === 'ProjectView') {
                    const currentRecord: IGanttData = this.parent.flatData[(this.parent.ids.indexOf(preData.id))];
                    if (currentRecord.hasChildRecords && parentRecord.indexOf(currentRecord) === -1) {
                        parentRecord.push(currentRecord);
                    }
                }
                let name: string = preData.id + preData.type;
                if (preData.offset && preData.offset.indexOf('-') !== -1) {
                    name += preData.offset;
                } else {
                    name += ('+' + preData.offset);
                }
                predecessorName.push(name);
                ids.push(preData.id);
            }
        }
        if (this.isEdit) {
            if (predecessorName.length > 0) {
                const maxLimits: number = this.parent.treeGridModule.maxLimits(this.parent.durationUnit);
                const fieldName: string = this.parent.taskFields.dependency;
                const predecessorStringValue: string = this.parent.treeGridModule.updatePredecessorLimits(predecessorName,
                                                                                                          this.rowData[fieldName as string],
                                                                                                          maxLimits);
                newValues = this.parent.predecessorModule.calculatePredecessor(predecessorStringValue, this.rowData);
                this.parent.setRecordValue('predecessor', newValues, this.rowData.ganttProperties, true);
                predecessorString = this.parent.predecessorModule.getPredecessorStringValue(this.rowData);
            } else {
                newValues = [];
                this.parent.setRecordValue('predecessor', newValues, this.rowData.ganttProperties, true);
                predecessorString = '';
            }
            if (this.parent.undoRedoModule && this.parent.undoRedoModule['getUndoCollection'].length > 0) {
                this.parent.undoRedoModule['getUndoCollection'][this.parent.undoRedoModule['getUndoCollection'].length - 1]['connectedRecords'] = parentRecord;
                if (predecessorString !== '' || (!isNullOrUndefined(this.rowData.ganttProperties.predecessorsName) && this.rowData.ganttProperties.predecessorsName !== predecessorString) && !this.disableUndo) {
                    this.disableUndo = true;
                }
            }
            this.parent.setRecordValue('predecessorsName', predecessorString, this.rowData.ganttProperties, true);
            this.parent.setRecordValue(
                'taskData.' + this.parent.taskFields.dependency,
                predecessorString,
                this.rowData);
            this.parent.setRecordValue(
                this.parent.taskFields.dependency,
                predecessorString,
                this.rowData);
            this.parent.predecessorModule.updateUnscheduledDependency(this.rowData);
        } else {
            this.addedRecord[this.parent.taskFields.dependency] = predecessorName.length > 0 ? predecessorName.join(',') : '';
        }
    }
    private updateResourceTab(resourceElement: HTMLElement): void {
        const treeGridObj: TreeGrid = <TreeGrid>(<EJ2Instance>resourceElement).ej2_instances[0];
        if (treeGridObj) {
            treeGridObj.grid.endEdit();
        }
        const selectedItems: CObject[] = <CObject[]>this.ganttResources;
        selectedItems.forEach((item: CObject) => {
            if (item[this.parent.resourceFields.unit] === null) {
                item[this.parent.resourceFields.unit] = 0;
            }
        });
        if (this.parent.viewType === 'ResourceView' && !isNullOrUndefined(this.rowData.ganttProperties)) {
            if (JSON.stringify(this.ganttResources) !== JSON.stringify(this.rowData.ganttProperties.resourceInfo)) {
                this.isResourceUpdate = true;
                this.previousResource = !isNullOrUndefined(this.rowData.ganttProperties.resourceInfo) ?
                    [...this.rowData.ganttProperties.resourceInfo] : [];
            } else {
                this.isResourceUpdate = false;
            }
        }
        const idArray: object[] = [];
        if (this.isEdit) {
            if ((this.rowData.ganttProperties.resourceInfo && selectedItems.length !== this.rowData.ganttProperties.resourceInfo.length) ||
            (isNullOrUndefined(this.rowData.ganttProperties.resourceInfo) && selectedItems.length > 0)) {
                this.disableUndo = true;
            }
            if (!this.disableUndo) {
                for (let i: number = 0; i < selectedItems.length; i++) {
                    if (JSON.stringify(selectedItems[i as number]) !==
                    JSON.stringify(this.rowData.ganttProperties.resourceInfo[i as number])) {
                        this.disableUndo = true;
                        break;
                    }
                }
            }
            this.parent.setRecordValue('resourceInfo', selectedItems, this.editedRecord.ganttProperties, true);
            this.parent.dataOperation.updateMappingData(this.editedRecord, 'resourceInfo');
            this.parent.editModule.updateResourceRelatedFields(this.editedRecord, 'resource');
            this.validateDuration(this.editedRecord);
            this.updateScheduleProperties(this.editedRecord, this.rowData);
        } else {
            for (let i: number = 0; i < selectedItems.length; i++) {
                idArray.push(selectedItems[i as number][this.parent.resourceFields.id]);
                this.isAddNewResource = true;
            }
            this.addedRecord[this.parent.taskFields.resourceInfo] = idArray;
        }
    }
    private updateNotesTab(notesElement: HTMLElement): void {
        const ganttObj: Gantt = this.parent;
        const rte: RichTextEditor = <RichTextEditor>(<EJ2Instance>notesElement).ej2_instances[0];
        if (this.isEdit) {
            if (!ganttObj.columnByField[ganttObj.taskFields.notes].disableHtmlEncode) {
                if (this.rowData.ganttProperties.notes !== rte.getHtml() && (this.rowData.ganttProperties.notes !== null || rte.getHtml() !== '<p><br></p>') && !this.disableUndo) {
                    this.disableUndo = true;
                }
                this.parent.setRecordValue('notes', rte.getHtml(), this.rowData.ganttProperties, true);
            } else {
                if (this.rowData.ganttProperties.notes !== rte.getText() && (this.rowData.ganttProperties.notes !== null || rte.getText() !== '') && !this.disableUndo) {
                    this.disableUndo = true;
                }
                if (rte.getHtml().includes('href')) {
                    this.parent.setRecordValue('notes', rte.getHtml(), this.rowData.ganttProperties, true);
                }
                else {
                    this.parent.setRecordValue('notes', rte.getText(), this.rowData.ganttProperties, true);
                }
            }
            ganttObj.dataOperation.updateMappingData(this.rowData, 'notes');
        } else {
            if (!ganttObj.columnByField[ganttObj.taskFields.notes].disableHtmlEncode) {
                this.addedRecord[this.parent.taskFields.notes] = rte.getHtml();
            }
            else {
                this.addedRecord[this.parent.taskFields.notes] = rte.getText();
            }
        }
    }
    private updateCustomTab(customElement: HTMLElement): void {
        this.updateGeneralTab(customElement, true);
    }
}

/**
 * @hidden
 */
export type Inputs =
    CheckBox |
    DropDownList |
    TextBox |
    NumericTextBox |
    DatePicker |
    DateTimePicker |
    MaskedTextBox;

/**
 * @hidden
 */
export interface IPreData {
    id?: string;
    name?: string;
    type?: string;
    offset?: string;
    uniqueId?: number;
}
