/**
 * Dropdownlist spec document
 */
import { EmitType, Browser, createElement, isNullOrUndefined, setCulture, L10n } from '@syncfusion/ej2-base';
import { DropDownBase, FilteringEventArgs, dropDownBaseClasses, PopupEventArgs, SelectEventArgs } from '../../src/drop-down-base/drop-down-base';
import { DropDownList } from '../../src/drop-down-list/drop-down-list';
import { DataManager, ODataV4Adaptor, Query, WebApiAdaptor } from '@syncfusion/ej2-data';
import { isCollide } from '@syncfusion/ej2-popups';
import '../../node_modules/es6-promise/dist/es6-promise';
import  {profile , inMB, getMemoryProfile} from '../common/common.spec';


L10n.load({
    'fr': {
        'dropdowns': {
            noRecordsTemplate: "Pas de modèle d'enregistrement"
        }
    },
    'es': {
        'drop-down-list': {
            noRecordsTemplate: "Pas de",
            actionFailureTemplate:  "Pas de"
        }
    }
});

let datasource: { [key: string]: Object }[] = [{ id: 'list1', text: 'JAVA', icon: 'icon' }, { id: 'list2', text: 'C#' },
{ id: 'list3', text: 'C++' }, { id: 'list4', text: '.NET', icon: 'icon' }, { id: 'list5', text: 'Oracle' }];

let datasource1: { [key: string]: Object }[]=[];
for (let i = 1; i <= 150; i++) {
    let item: { [key: string]: Object } = {};
    item.id = 'id' + i;
    item.text = `Item ${i}`;

    // Generate a random number between 1 and 4 to determine the group
    const randomGroup = Math.floor(Math.random() * 4) + 1;
    switch (randomGroup) {
        case 1:
            item.group = 'Group A';
            break;
        case 2:
            item.group = 'Group B';
            break;
        case 3:
            item.group = 'Group C';
            break;
        case 4:
            item.group = 'Group D';
            break;
        default:
            break;
    }
    datasource1.push(item);
}

let datasource2: { [key: string]: Object }[] = [{ id: 'id2', text: 'PHP' }, { id: 'id1', text: 'HTML' }, { id: 'id3', text: 'PERL' },
{ id: 'list1', text: 'JAVA' }, { id: 'list2', text: 'Phython' }, { id: 'list5', text: 'Oracle' }];
describe('DDList', () => {
    beforeAll(() => {
        const isDef = (o: any) => o !== undefined && o !== null;
        if (!isDef(window.performance)) {
            console.log("Unsupported environment, window.performance.memory is unavailable");
            this.skip(); //Skips test (in Chai)
            return;
        }
    });
    let css: string = ".e-spinner-pane::after { content: 'Material'; display: none;} ";
    let style: HTMLStyleElement = document.createElement('style'); style.type = 'text/css';
    let styleNode: Node = style.appendChild(document.createTextNode(css));
    document.getElementsByTagName('head')[0].appendChild(style);
    //Local data bindng with default values
    describe('Local data binding with default values', () => {
        let listObj: any;
        let popupObj: any;
        let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
        beforeAll(() => {
            document.body.appendChild(element);
            listObj = new DropDownList({ dataSource: datasource2 });
            listObj.appendTo(element);
        });
        afterAll(() => {
            if (element) {
                element.remove();
                document.body.innerHTML = '';
            }
        });
        /**
         * initialize
         */
        it('Default initialize', () => {
            expect(listObj.element.classList.contains('e-dropdownlist')).not.toBe(0);
        });
        /**
         * Width
         */
        it('Width validation', () => {
            expect(listObj.width).toEqual('100%');
        });
        /**
         * tabIndex
         */
        it('tab index of focus element', () => {
            expect(listObj.inputWrapper.container.getAttribute('tabindex') === '0').toBe(true);
        });
        /**
         * Template properties
         */
        it('Default null value propertes', () => {
            expect(listObj.headerTemplate).toBe(null);
            expect(listObj.footerTemplate).toBe(null);
            expect(listObj.element.getAttribute('placeholder')).toEqual(null);
            expect(listObj.text).toBe(null);
            expect(listObj.value).toBe(null);
            expect(listObj.index).toEqual(null);
        });
        /**
         * document click before open popup
         */
        it('document click before open popup', (done) => {
            listObj.showPopup();
            let mouseEventArgs: any = { preventDefault: function () { }, target: null };
            mouseEventArgs.target = document.body;
            listObj.onDocumentClick(mouseEventArgs);
            expect(document.body.contains(listObj.popupObj.element)).toBe(false);
            setTimeout(() => {
                expect(isNullOrUndefined(listObj.isPopupOpen)).toBe(false);
                done();
            }, 500);
        });
        it('Popup height & width', () => {
            listObj.showPopup();
            popupObj = document.getElementById('popupWrapper');
            expect(listObj.popupWidth).toEqual('100%');
            expect(listObj.popupHeight).toEqual('300px');
            listObj.hidePopup();
        });
        it('string header template property', (done) => {
            listObj.headerTemplate = 'header';
            listObj.dataBind();
            listObj.open = function (){
                expect(listObj.headerTemplate).toEqual(listObj.popupObj.element.firstChild.innerText);
                listObj.hidePopup();
                listObj.open = null;
                done();
            };
            listObj.showPopup();
        });
        it('string footer template property', (done) => {
            listObj.footerTemplate = 'header';
            listObj.dataBind();
            listObj.open = function (){
                expect(listObj.footerTemplate).toEqual(listObj.popupObj.element.lastChild.innerText);
                listObj.hidePopup();
                listObj.open = null;
                done();
            };
            listObj.showPopup();
        });
        it('value template', (done) => {
            listObj.valueTemplate = "<div class='ename'> ${id} </div>";
            listObj.change = function (){
                let valueEle: HTMLElement = listObj.element.parentElement.querySelector('.e-input-value');
                expect(valueEle.innerHTML).toEqual('<div class="ename"> list1 </div>');
                expect(listObj.element.parentElement.childNodes[1].classList.contains('e-input-value')).toBe(true);
                expect(listObj.element.style.display).toBe('none');
                listObj.change = null;
                done();
            };
            listObj.index = 3;
            listObj.dataBind();
        });
    });
    describe('Local data binding with Disable Item', () => {
        let listObj: any;
        let popupObj: any;
        let e: any = { preventDefault: function () { } };
        let localData: { [key: string]: Object }[] = [{ id: 'id2', text: 'PHP',
         htmlAttributes: { class: 'e-disabled', title: 'PHP' } },
         { id: 'id1', text: 'HTML' }, 
         { id: 'id3', text: 'PERL' },
        { id: 'list1', text: 'JAVA' }, 
        { id: 'list2', text: 'Phython', htmlAttributes: { class: 'e-disabled', title: 'Phython' }}, 
        { id: 'list5', text: 'Oracle' }];
        let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
        element.setAttribute('data-required', 'name');
        beforeAll(() => {
            document.body.appendChild(element);
            listObj = new DropDownList({
                    dataSource: localData,
                    fields: { value: 'id', text: 'HTML', htmlAttributes : 'htmlAttributes'},
                    htmlAttributes: {'data-msg-container-id':'msgid'}
                 });
            listObj.appendTo(element);
        });
        it('choose disabled item', (done) => {
            listObj.select = function (args : any){
                if(args.item.classList.contains('e-disabled')){
                args.cancel = true;
                }
                expect(listObj.value).toEqual(null);
                listObj.select = null;
                done();
            };
            listObj.showPopup();
            let items: HTMLElement[] = listObj.popupObj.element.querySelectorAll('li');
            listObj.setSelection(items[0], e);
        });
        it('check data attribute', () => {
            expect(listObj.hiddenElement.getAttribute('data-msg-container-id')).not.toBeNull();
            expect(listObj.hiddenElement.getAttribute('data-required')).toBe('name');
            expect(listObj.htmlAttributes['data-required']).toBe('name');
         });

        afterAll(() => {
            if (element) {
                element.remove();
                document.body.innerHTML = '';
            }
        });
    });

    describe('Floating label', () => {
        let listObj: any;
        let popupObj: any;
        let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
        let mouseEventArgs: any = { preventDefault: function () { }, target: null };
        beforeAll(() => {
            document.body.appendChild(element);
            listObj = new DropDownList({ dataSource: datasource2, floatLabelType: 'Auto' });
            listObj.appendTo(element);
        });
        afterAll(() => {
            if (element) {
                element.remove();
                document.body.innerHTML = '';
            }
        });
        it('floating-Auto: check floating to top', () => {
            mouseEventArgs.target = listObj.inputWrapper.container;
            let floatElement = listObj.inputWrapper.container.querySelector('.e-float-text')
            listObj.dropDownClick(mouseEventArgs);
            expect(floatElement.classList.contains('e-label-top')).toBe(true);
        });
        it('floating-Auto: check floating to bottom', () => {
            mouseEventArgs.target = document.body;
            let floatElement = listObj.inputWrapper.container.querySelector('.e-float-text')
            listObj.onDocumentClick(mouseEventArgs);
            expect(floatElement.classList.contains('e-label-bottom')).toBe(true);
        });

        it('floating-Always: check floating to top when document click', () => {
            listObj.floatLabelType = 'Always';
            listObj.dataBind();
            mouseEventArgs.target = document.body;
            let floatElement = listObj.inputWrapper.container.querySelector('.e-float-text')
            listObj.onDocumentClick(mouseEventArgs);
            expect(floatElement.classList.contains('e-label-top')).toBe(true);
        });
    });
    // collision
    describe('DropDownList collision checking', () => {
        let listObj: any;
        let parentElement: HTMLElement = document.createElement('div');
        parentElement.style.marginTop = '500px';
        let data: string[] = ['Cricket', '', 'Tennis', 'VolleyBall', 'Badminton', 'Basketball', 'Footballs', 'Rugby', 'Bags', 'Tenni', 'Sweet', 'Hot'];
        beforeEach(() => {
            let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'DropDownList' });
            parentElement.appendChild(element)
            document.body.appendChild(parentElement);
            listObj = new DropDownList({ dataSource: data });
            listObj.appendTo(element);
        });
        /**
         * set the search key value in text
         */
        it('Collision at bottom', () => {
            listObj.showPopup();
            expect(isCollide(listObj.popupObj.element)[0]).toBe("bottom");
        });
        it('empty string value selection', () => {
            listObj.index = 1;
            listObj.dataBind();
            expect(listObj.value).not.toBe(null);
            expect(listObj.value).toBe('');
            expect(listObj.text).not.toBe(null);
            expect(listObj.text).toBe('');
        });
        afterEach(() => {
            if (parentElement) {
                parentElement.remove();
                document.body.innerHTML = '';
            }
        });
    })
    //clear button
    describe('Clear button', () => {
        let listObj: any;
        let listObj1: any;
        let popupObj: any;
        let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
        let element1: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'ddlelement' });
        let mouseEventArgs: any = { preventDefault: function () { }, target: null };
        beforeAll(() => {
            document.body.appendChild(element);
            listObj = new DropDownList({ dataSource: datasource2, index: 2, popupHeight: 'auto', fields: { text: 'text', value: 'id' }, showClearButton: true });
            listObj.appendTo(element);
        });
        afterAll((done) => {
            if (element) {
                element.remove();
                listObj.destroy();
                document.body.innerHTML = '';
                done();
            }
        });

        it('clear icon', () => {
            expect(listObj.inputWrapper.clearButton.classList.contains('e-clear-icon')).toBe(true);
        });

        it('click on clear button', () => {
            listObj.resetHandler(mouseEventArgs);
            expect(listObj.inputWrapper.clearButton.classList.contains('e-clear-icon-hide')).toBe(true);
        });
        it('show clear icon when key navigation', (done) => {
            let keyEventArgs: any = { preventDefault: (): void => { /** NO Code */ }, action: 'down' };
            listObj.showPopup()
            setTimeout(() => {
                expect(listObj.inputWrapper.clearButton.classList.contains('e-clear-icon-hide')).toBe(true);
                listObj.keyActionHandler(keyEventArgs);
                expect(listObj.inputWrapper.clearButton.classList.contains('e-clear-icon-hide')).toBe(false);
                done();
            }, 450);
        });
        it('show clear icon with allowFiltering', (done) => {
            document.body.appendChild(element1);
            listObj1 = new DropDownList({ dataSource: datasource2, allowFiltering: true, fields: { text: 'text', value: 'id' }, index: 2, showClearButton: true, debounceDelay: 0 });
            listObj1.appendTo(element1);
            listObj1.showPopup();
            setTimeout(() => {
                expect(listObj1.inputWrapper.clearButton.classList.contains('e-clear-icon-hide')).toBe(true);
                done();
            }, 450);
        });
        it('click on clear button', () => {
            listObj1.clear();
            expect(listObj1.list.querySelectorAll('li').length == 6).toBe(true);
            listObj1.resetValueHandler();
        });
    });
    describe('large data Template support', () => {
        let keyEventArgs: any = { preventDefault: (): void => { /** NO Code */ }, action: 'down' };
        let dropObj: any;
        let ele: HTMLElement;
        beforeAll(() => {
            ele = createElement('input', { id: 'DropDownList' });
            document.body.appendChild(ele);
            dropObj = new DropDownList({
                dataSource: datasource1, popupHeight: '200px', allowFiltering: true, debounceDelay: 0, fields: { text: 'text', value: 'id' }, itemTemplate: '<div class="ename"> ${text} </div></div>', valueTemplate: '<div class="tempName"> ${text} </div>',
            });
            dropObj.appendTo(ele);
        });
        afterAll(() => {
            ele.remove();
            dropObj.destroy();
            document.body.innerHTML = '';
        });
        it('item template and value template', (done) => {
            dropObj.showPopup();
            dropObj.isPreventScrollAction = false
            dropObj.list.scrollTop = 1068;
            setTimeout(() => {
                let li: Element[] = dropObj.list.querySelectorAll('li:not(.e-virtual-list)');
                expect((li[0] as Element).classList.contains('e-item-focus')).toBe(true);
                dropObj.noRecordsTemplate = "No data";
                dropObj.l10nUpdate(true);
                done();
            }, 500);
        });
    });

    describe('actionFailure event', () => {
        let listObj: any;
        let popupObj: any;
        let mouseEventArgs: any = {
            preventDefault: (): void => { /** NO Code */ },
            target: null
        };
        let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
        let remoteData: DataManager = new DataManager({ url: '/api/Employee', adaptor: new ODataV4Adaptor });
        beforeEach(() => {
            document.body.appendChild(element);
        });
        afterEach(() => {
            if (element) {
                element.remove();
                document.body.innerHTML = '';
            }
        });
        it('no data text when ajax failure', (done) => {
            listObj = new DropDownList({ dataSource: remoteData, value: 1004, fields: { value: 'EmployeeID', text: 'FirstName' } });
            listObj.appendTo(element);
            listObj.showPopup()
            setTimeout(() => {
                expect(listObj.list.classList.contains('e-nodata')).toBe(true);
                done();
            }, 800);
        });
        it('mouse click on noRecords template', () => {
            mouseEventArgs.target = listObj.list;
            listObj.onMouseClick(mouseEventArgs);
            expect(listObj.value === 1004).toBe(true);
            expect(listObj.beforePopupOpen).toBe(true);
        });
    });
    describe('noRecords template while empty dataSource', () => {
        let listObj: any;
        let popupObj: any;
        let mouseEventArgs: any = {
            preventDefault: (): void => { /** NO Code */ },
            target: null
        };
        let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
        beforeEach(() => {
            document.body.appendChild(element);
            listObj = new DropDownList({ dataSource: [] });
            listObj.appendTo(element);
        });
        afterEach(() => {
            if (element) {
                element.remove();
                document.body.innerHTML = '';
            }
        });
        it('popup hidden state - press down key in records template ', () => {
            let keyEventArgs: any = {
                preventDefault: (): void => { /** NO Code */ },
                keyCode: 74,
                action: 'down',
                type: 'keydown'
            };
            listObj.keyActionHandler(keyEventArgs);
            expect(listObj.inputElement.value === '').toBe(true);
        });
        it('open the noRecords template popup by alt+down key ', (done) => {
            let keyEventArgs: any = {
                preventDefault: (): void => { /** NO Code */ },
                keyCode: 74,
                action: 'open',
                type: 'keydown'
            };
            listObj.keyActionHandler(keyEventArgs);
            setTimeout(() => {
                expect(listObj.isPopupOpen).toBe(true);
                done();
            }, 450);
        });
        it('popup open state - press down key in records template ', () => {
            let keyEventArgs: any = {
                preventDefault: (): void => { /** NO Code */ },
                keyCode: 74,
                action: 'down',
                type: 'keydown'
            };
            listObj.keyActionHandler(keyEventArgs);
            expect(listObj.inputElement.value === '').toBe(true);
        });

        it('close the noRecords template popup by escape key ', (done) => {
            let keyEventArgs: any = {
                preventDefault: (): void => { /** NO Code */ },
                keyCode: 74,
                action: 'escape',
                type: 'keydown'
            };
            listObj.keyActionHandler(keyEventArgs);
            setTimeout(() => {
                expect(listObj.isPopupOpen).toBe(false);
                done();
            }, 450);
        });
    });

    describe('noRecords template while empty dataSource in mobile layout', () => {
        let listObj: any;
        let popupObj: any;
        let mouseEventArgs: any = {
            preventDefault: (): void => { /** NO Code */ },
            target: null
        };
        let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
        beforeEach(() => {
            document.body.appendChild(element);
            let androidPhoneUa: string = 'Mozilla/5.0 (Linux; Android 4.3; Nexus 7 Build/JWR66Y) ' +
                'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.92 Safari/537.36';
            Browser.userAgent = androidPhoneUa;
            listObj = new DropDownList({ dataSource: [] });
            listObj.appendTo(element);
        });
        afterEach(() => {
            if (element) {
                element.remove();
                document.body.innerHTML = '';
            }
        });
        it('show noRecord template', (done) => {
            listObj.showPopup();
            setTimeout(() => {
                expect(listObj.isPopupOpen).toBe(true);
                expect(listObj.list.classList.contains('e-nodata')).toBe(true);
                Browser.userAgent = navigator.userAgent;
                done();
            }, 450);
        });
    });
    describe('actionFailure template while wrong data dataSource in mobile layout', () => {
        let listObj: any;
        let popupObj: any;
        let mouseEventArgs: any = {
            preventDefault: (): void => { /** NO Code */ },
            target: null
        };
        let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
        let remoteData: DataManager = new DataManager({ url: '/api/Employee', adaptor: new ODataV4Adaptor });
        beforeEach(() => {
            document.body.appendChild(element);
            let androidPhoneUa: string = 'Mozilla/5.0 (Linux; Android 4.3; Nexus 7 Build/JWR66Y) ' +
                'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.92 Safari/537.36';
            Browser.userAgent = androidPhoneUa;
            listObj = new DropDownList({ dataSource: remoteData });
            listObj.appendTo(element);
        });
        afterEach(() => {
            if (element) {
                element.remove();
                document.body.innerHTML = '';
            }
        });
        it('show actionFailure template', (done) => {
            listObj.showPopup();
            setTimeout(() => {
                expect(listObj.isPopupOpen).toBe(true);
                expect(listObj.list.classList.contains('e-nodata')).toBe(true);
                Browser.userAgent = navigator.userAgent;
                done();
            }, 800);
        });
    });
    describe('Remote data binding', () => {
        let listObj: any;
        let popupObj: any;
        let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
        let remoteData: DataManager = new DataManager({ 
            url: 'https://services.syncfusion.com/js/production/api/Employees',
            adaptor: new WebApiAdaptor,
            crossDomain: true
         });
        beforeEach(() => {
            document.body.appendChild(element);
        });
        afterEach(() => {
            if (element) {
                element.remove();
                document.body.innerHTML = '';
            }
        });
        /**
         * remoteData binding with index
         */
        it('index at initialize time ', (done) => {
            listObj = new DropDownList({ dataSource: remoteData, query: new Query().take(9), index: 2, fields: { value: 'EmployeeID', text: 'FirstName' } });
            listObj.appendTo(element);
            setTimeout(() => {
                // expect(listObj.index).toBe(2);
                // expect(listObj.text).toBe('Janet Leverling');
                // expect(listObj.value).toBe(3);
                // expect(isNullOrUndefined(listObj.popupObj)).toBe(true);
                done();
            }, 800);
        });
        /**
         * remoteData binding with text
         */
        it('value at initialize time ', (done) => {
            listObj = new DropDownList({ dataSource: remoteData, query: new Query().take(9), value: 5, fields: { value: 'EmployeeID', text: 'FirstName' } });
            listObj.appendTo(element);
            setTimeout(() => {
                // expect(listObj.value).toBe(5);
                // expect(listObj.index).toBe(4);
                // expect(listObj.text).toBe('Margaret Peacock');
                // expect(isNullOrUndefined(listObj.popupObj)).toBe(true);
                done();
            }, 800);
        });
        /**
         * remoteData binding with value
         */
        it('text at initialize time ', (done) => {
            listObj = new DropDownList({ dataSource: remoteData, query: new Query().take(9), text: 'Robert King', fields: { value: 'EmployeeID', text: 'FirstName' } });
            listObj.appendTo(element);
            setTimeout(() => {
                // expect(listObj.text).toBe('Robert King');
                // expect(listObj.value).toBe(8);
                // expect(listObj.index).toBe(7);
                // expect(isNullOrUndefined(listObj.popupObj)).toBe(true);
                done();
            }, 800);
        });
        /**
         * remoteData binding
         */
        it('index at dynamic changes ', (done) => {
            listObj = new DropDownList({ dataSource: remoteData, query: new Query().take(9), fields: { value: 'EmployeeID', text: 'FirstName' } });
            listObj.appendTo(element);
            listObj.index = 4;
            listObj.dataBind();
            setTimeout(() => {
                // expect(listObj.index).toBe(4);
                // expect(listObj.text).toBe('Margaret Peacock');
                // expect(listObj.value).toBe(5);
                // expect(isNullOrUndefined(listObj.popupObj)).toBe(true);
                done();
            }, 800);
        });
        /**
         * remoteData binding with text
         */
        it('text at dynamic changes ', (done) => {
            listObj = new DropDownList({ dataSource: remoteData, query: new Query().take(9), fields: { value: 'EmployeeID', text: 'FirstName' } });
            listObj.appendTo(element);
            listObj.text = 'Andrew Fuller';
            listObj.dataBind();
            setTimeout(() => {
                // expect(listObj.index).toBe(0);
                // expect(listObj.text).toBe('Andrew Fuller');
                // expect(listObj.value).toBe(1);
                // expect(isNullOrUndefined(listObj.popupObj)).toBe(true);
                done();
            }, 800);
        });
        /**
         * remoteData binding with value
         */
        it('value at dynamic changes ', (done) => {
            listObj = new DropDownList({ dataSource: remoteData,query: new Query().take(9), fields: { value: 'EmployeeID', text: 'FirstName' } });
            listObj.appendTo(element);
            listObj.value = 3;
            listObj.dataBind();
            setTimeout(() => {
                // expect(listObj.value).toBe(3);
                // expect(listObj.text).toBe('Janet Leverling');
                // expect(listObj.index).toBe(2);
                // expect(isNullOrUndefined(listObj.popupObj)).toBe(true);
                done();
            }, 800);
        });
        it('value at dynamic changes with allowObjectBinding', (done) => {
            listObj = new DropDownList({ dataSource: datasource2, fields: { text: 'text', value: 'id' }, allowObjectBinding: true });
            listObj.appendTo(element);
            listObj.value = { id: 'id1', text: 'HTML' };
            listObj.dataBind();
            setTimeout(() => { 
                //expect(listObj.isObjectInArray({ id: "id1", text: "HTML" }, [listObj.value])).toBe(true)
                listObj.value = { id: 'list2', text: 'Phython' };
                setTimeout(() => {
                    //expect(listObj.isObjectInArray({ id: 'list2', text: 'Phython' }, [listObj.value])).toBe(true)
                    //expect(isNullOrUndefined(listObj.popupObj)).toBe(true);
                    done();
                }, 800);
            }, 800);
        });
    });

    //Multiple cssClass
    describe('Add multiple cssClass', () => {
        let listObj: any;
        let popupObj: any;
        let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
        beforeAll(() => {
            document.body.appendChild(element);
        });
        afterAll(() => {
            if (element) {
                element.remove();
                document.body.innerHTML = '';
            }
        });
        it('Dynamically change multiple cssClass', () => {
            listObj = new DropDownList({ dataSource: datasource2, cssClass: 'sample' });
            listObj.appendTo(element);
            listObj.showPopup();
            expect(listObj.element.parentElement.classList.contains('sample')).toBe(true);
            expect(listObj.popupObj.element.classList.contains('sample')).toEqual(true);
            listObj.cssClass = 'test highlight';
            listObj.dataBind();
            expect(listObj.element.parentElement.classList.contains('test')).toBe(true);
            expect(listObj.element.parentElement.classList.contains('highlight')).toBe(true);
            expect(listObj.popupObj.element.classList.contains('test')).toEqual(true);
            expect(listObj.popupObj.element.classList.contains('highlight')).toEqual(true);
        });
        it('Initially render multiple cssClass', () => {
            listObj = new DropDownList({ dataSource: datasource2, cssClass: 'sample highlight' });
            listObj.appendTo(element);
            listObj.showPopup();
            expect(listObj.element.parentElement.classList.contains('sample')).toBe(true);
            expect(listObj.element.parentElement.classList.contains('highlight')).toBe(true);
            expect(listObj.popupObj.element.classList.contains('sample')).toEqual(true);
            expect(listObj.popupObj.element.classList.contains('highlight')).toEqual(true);
            listObj.cssClass = 'test';
            listObj.dataBind();
            expect(listObj.element.parentElement.classList.contains('test')).toBe(true);
            expect(listObj.popupObj.element.classList.contains('test')).toEqual(true);
        });
        it('Dynamically change cssClass as null', () => {
            listObj = new DropDownList({ dataSource: datasource2, cssClass: 'test highlight' });
            listObj.appendTo(element);
            listObj.showPopup();
            expect(listObj.element.parentElement.classList.contains('test')).toBe(true);
            expect(listObj.element.parentElement.classList.contains('highlight')).toBe(true);
            expect(listObj.popupObj.element.classList.contains('test')).toEqual(true);
            expect(listObj.popupObj.element.classList.contains('highlight')).toEqual(true);
            listObj.cssClass = null;
            listObj.dataBind();
            expect(listObj.element.parentElement.classList.contains('test')).toBe(false);
            expect(listObj.element.parentElement.classList.contains('highlight')).toBe(false);
            expect(listObj.popupObj.element.classList.contains('test')).toEqual(false);
            expect(listObj.popupObj.element.classList.contains('highlight')).toEqual(false);
        });
        it('Dynamically change cssClass as empty', () => {
            listObj = new DropDownList({ dataSource: datasource2, cssClass: 'test highlight' });
            listObj.appendTo(element);
            listObj.showPopup();
            expect(listObj.element.parentElement.classList.contains('test')).toBe(true);
            expect(listObj.element.parentElement.classList.contains('highlight')).toBe(true);
            expect(listObj.popupObj.element.classList.contains('test')).toEqual(true);
            expect(listObj.popupObj.element.classList.contains('highlight')).toEqual(true);
            listObj.cssClass = '';
            listObj.dataBind();
            expect(listObj.element.parentElement.classList.contains('test')).toBe(false);
            expect(listObj.element.parentElement.classList.contains('highlight')).toBe(false);
            expect(listObj.popupObj.element.classList.contains('test')).toEqual(false);
            expect(listObj.popupObj.element.classList.contains('highlight')).toEqual(false);
        });
    });

    // dynamic property changes
    describe('Dynamic property changes', () => {
        let listObj: any;
        let popupObj: any;
        let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
        beforeAll(() => {
            document.body.appendChild(element);
            listObj = new DropDownList({ enabled: false, dataSource: datasource2, fields: { text: 'text', value: 'id' } });
            listObj.appendTo(element);
        });
        afterAll(() => {
            if (element) {
                element.remove();
                document.body.innerHTML = '';
            }
        });
        /**
         * tab index in disable state
         */
        it('tab index of focus element in disable state ', () => {
            expect(listObj.inputWrapper.container.tabIndex === -1).toBe(true);
            listObj.enabled = true;
            listObj.dataBind();
        });
        /**
       * locale
       */
        it('locale property called through setCulture method while dataSource items exist', (done) => {
            setCulture('fr');
            listObj.showPopup();
            setTimeout(() => {
                expect(listObj.isPopupOpen).toBe(true);
                listObj.hidePopup();
                setTimeout(() => {
                    expect(listObj.isPopupOpen).toBe(false);
                    done();
                }, 400)
            }, 600);
        });
        /**
         * read only property
         */
        it('readonly ', () => {
            listObj.readonly = false;
            listObj.dataBind();
            //expect(listObj.element.getAttribute('readonly')).toEqual(null);
            listObj.readonly = true;
            listObj.dataBind();
            expect(listObj.element.hasAttribute('readonly')).toEqual(true);
            let keyEventArgs: any = { preventDefault: (): void => { /** NO Code */ }, action: 'down' };
            let mouseEventArgs: any = { preventDefault: function () { }, target: null };
            mouseEventArgs.target = listObj.inputWrapper.container;
            listObj.dropDownClick(mouseEventArgs);
            expect(listObj.beforePopupOpen).toEqual(false);
            listObj.keyActionHandler(keyEventArgs);
            expect(listObj.index).toBe(null);
            listObj.readonly = false;
            listObj.dataBind();
        });
        /**
         * cssClass property while popup closed.
         */
        it('cssClass ', () => {
            listObj.cssClass = 'closeState';
            listObj.dataBind();
            expect(listObj.element.parentElement.classList.contains('closeState')).toBe(true);
        });
        /**
         * Width, popupHeight & popupWidth properties in string
         */
        it('Width ', () => {
            listObj.width = '400px';
            listObj.popupWidth = '300px';
            listObj.popupHeight = '300px';
            listObj.dataBind();
            listObj.showPopup();
            expect(listObj.element.parentElement.style.width).toEqual('400px');
            expect(listObj.popupObj.element.style.width).toEqual('300px');
            expect(listObj.popupObj.element.style.maxHeight).toEqual('300px');
        });
        /**
         * Width, popupHeight & popupWidth properties in integer.
         */
        it('Width ', () => {
            listObj.width = 400;
            listObj.popupWidth = 300;
            listObj.popupHeight = 300;
            listObj.dataBind();
            listObj.showPopup();
            expect(listObj.element.parentElement.style.width).toEqual('400px');
            expect(listObj.popupObj.element.style.width).toEqual('300px');
            expect(listObj.popupObj.element.style.maxHeight).toEqual('300px');
        });
        /**
         * text
         */
        it('text based selection', () => {
            listObj.text = 'JAVA';
            listObj.dataBind();
            let ele: Element = listObj.popupObj.element;
            let li: Element[] & NodeListOf<HTMLLIElement> = <Element[] & NodeListOf<HTMLLIElement>>ele.querySelectorAll('li');
            expect(li[3].classList.contains('e-active')).toBe(true);
            listObj.text = 'JUICE';
            listObj.dataBind();
            expect(li[3].classList.contains('e-active')).toBe(true);
            expect(listObj.text).toBe('JAVA');
            listObj.text = null;
            listObj.dataBind();
            expect(isNullOrUndefined(listObj.value)).toBe(true);
        });
        /**
         * value
         */
        it('value based selection', () => {
            listObj.value = 'id3';
            listObj.dataBind();
            let ele: Element = listObj.popupObj.element;
            let li: Element[] & NodeListOf<HTMLLIElement> = <Element[] & NodeListOf<HTMLLIElement>>ele.querySelectorAll('li');
            expect(li[2].classList.contains('e-active')).toBe(true);
            listObj.value = 'id332312';
            listObj.dataBind();
            expect(li[2].classList.contains('e-active')).toBe(true);
            expect(listObj.value).toBe('id3');
            listObj.value = null;
            listObj.dataBind();
            expect(listObj.value == null).toBe(true);
            expect(listObj.text == null).toBe(true);
        });
        /**
         * Index
         */
        it('Index based selection', () => {
            listObj.index = 1;
            listObj.dataBind();
            let ele: Element = listObj.popupObj.element;
            let li: Element[] & NodeListOf<HTMLLIElement> = <Element[] & NodeListOf<HTMLLIElement>>ele.querySelectorAll('li');
            expect(li[1].classList.contains('e-active')).toBe(true);
            listObj.index = 10;
            listObj.dataBind();
            expect(li[1].classList.contains('e-active')).toBe(true);
            expect(listObj.index).toBe(1);
        });
        /**
         * place holder property 
         */
        it('placeholder ', () => {
            listObj.placeholder = 'Enter text';
            listObj.dataBind();
            expect(listObj.element.getAttribute('placeholder')).toEqual('Enter text');
        });
        /**
         * cssClass property
         */
        it('cssClass ', () => {
            listObj.showPopup();
            listObj.cssClass = 'temp';
            listObj.dataBind();
            expect(listObj.element.parentElement.classList.contains('temp')).toEqual(true);
            expect(listObj.popupObj.element.classList.contains('temp')).toEqual(true);
        });
        /**
         * enabled property
         */
        it('enabled ', () => {
            listObj.enabled = false;
            listObj.dataBind();
            expect(listObj.element.classList.contains('e-disabled')).toEqual(true);
            expect(listObj.inputWrapper.container.classList.contains('e-disabled')).toEqual(true);
            expect(listObj.element.getAttribute('aria-disabled')).toEqual('true');
            expect(listObj.element.getAttribute('disabled')).toEqual('');
            listObj.enabled = true;
            listObj.dataBind();
            expect(listObj.element.classList.contains('e-disabled')).toEqual(false);
            expect(listObj.inputWrapper.container.classList.contains('e-disabled')).toEqual(false);
            expect(listObj.element.getAttribute('aria-disabled')).toEqual('false');
            expect(listObj.element.getAttribute('disabled')).toEqual(null);
        });
        /**
         * enableRtl
         */
        it('enableRtl ', () => {
            listObj.enableRtl = true;
            listObj.dataBind();
            listObj.showPopup();
            expect(listObj.element.parentElement.classList.contains('e-rtl')).toEqual(true);
            expect(listObj.popupObj.element.classList.contains('e-rtl')).toBe(true);
            expect(listObj.popupObj.enableRtl).toEqual(true);
            listObj.hidePopup();
            listObj.enableRtl = false;
            listObj.dataBind();
            listObj.showPopup();
            expect(listObj.element.parentElement.classList.contains('e-rtl')).toEqual(false);
            expect(listObj.popupObj.element.classList.contains('e-rtl')).toBe(false);
            expect(listObj.popupObj.enableRtl).toEqual(false);
            document.body.innerHTML = '';
        });
        /**
         * htmlAttributes
         */
        it('htmlAttributes', () => {
            listObj.htmlAttributes = { name: 'dropdown', required: "true", class: 'e-ddl-list', disabled: 'disabled', readonly: 'readonly', style: 'margin: 0', role: 'listbox', placeholder: 'new text' };
            listObj.dataBind();
            expect(listObj.hiddenElement.getAttribute('name')).toBe('dropdown');
            expect(listObj.hiddenElement.getAttribute('required')).toBe('true');
            expect(listObj.element.parentElement.classList.contains('e-ddl-list')).toBe(true);
            expect(listObj.element.parentElement.classList.contains('e-disabled')).toBe(true);
            expect(listObj.element.getAttribute('placeholder')).toBe('new text');
            expect(listObj.element.parentElement.getAttribute('role')).toBe('combobox');
            expect(listObj.element.parentElement.getAttribute('style')).toBe('margin: 0');
        })
        /**
         * data source property
         */
        it('data source ', () => {
            document.body.appendChild(element);
            listObj = new DropDownList({ dataSource: datasource2, index: 5, popupHeight: 100, fields: { value: 'id', text: 'text' } });
            listObj.appendTo(element);
            listObj.showPopup();
            listObj.value = 'list3';
            listObj.dataSource = datasource;
            listObj.dataBind();
            let items: HTMLElement[] = listObj.popupObj.element.querySelectorAll('li');
            expect(items.length).toEqual(5);
            expect(listObj.text === 'C++').toBe(true);
        });
        /**
         * text with null
         */
        it('nullable text ', () => {
            listObj.text = null;
            listObj.dataBind();
            expect(listObj.index).toEqual(null);
            expect(listObj.text).toEqual(null);
            expect(listObj.value).toEqual(null);
            expect(listObj.item).toEqual(null);
            expect(listObj.itemData).toEqual(null);
        });
        /**
         * Index with null
         */
        it('nullable index ', () => {
            listObj.index = 2;
            listObj.dataBind();
            listObj.index = null;
            listObj.dataBind();
            expect(listObj.index).toEqual(null);
            expect(listObj.text).toEqual(null);
            expect(listObj.value).toEqual(null);
            expect(listObj.item).toEqual(null);
            expect(listObj.itemData).toEqual(null);
        });
        /**
         * Value with null
         */
        it('nullable value ', () => {
            listObj.value = 'list3';
            listObj.dataBind();
            listObj.value = null;
            listObj.dataBind();
            expect(listObj.index).toEqual(null);
            expect(listObj.text).toEqual(null);
            expect(listObj.value).toEqual(null);
            expect(listObj.item).toEqual(null);
            expect(listObj.itemData).toEqual(null);
            element.parentElement.remove();
            document.body.innerHTML = '';
        });
        it('footerTemplate ', () => {
            listObj.footerTemplate = 'Total items count 5';
            listObj.dataBind();
            expect(listObj.popupObj.element.lastElementChild.innerHTML).toEqual(listObj.footerTemplate);
            listObj.footerTemplate = 'Overall 5 cources available';
            listObj.dataBind();
            expect(listObj.popupObj.element.lastElementChild.innerHTML).not.toEqual('Total items count 5');
        })
        /**
       * locale
       */
      it('locale property - es', (done) => {
            setCulture('es');
            listObj.htmlAttributes = {};
            listObj.enabled = true;
            listObj.readonly = false;
            listObj.locale = 'es';
            listObj.dataSource = [];
            listObj.open = (args: PopupEventArgs): void => {
                expect((args.popup.element.querySelector('.e-nodata') as HTMLElement).innerText).toEqual('Pas de');
                done();
            };
            listObj.dataBind();
            listObj.showPopup();
        });
    });

    describe('Dynamically update', () => {
        let listObj: any;
        let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
        beforeAll(() => {
            document.body.appendChild(element);
            listObj = new DropDownList({ enabled: false, dataSource: datasource2, fields: { text: 'text', value: 'id' } });
            listObj.appendTo(element);
        });
        afterAll(() => {
            if (element) {
                element.remove();
                document.body.innerHTML = '';
            }
        });
        it('header and footer template with empty popupObj', () => {
            listObj.popupObj = null;
            listObj.footerTemplate = 'Total items count 5';
            listObj.dataBind();
            listObj.headerTemplate = null;
            listObj.dataBind();
        })
    });

    describe('Check rtl mode without inputElement', () => {
        let listObj: any;
        let popupObj: any;
        let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
        beforeAll(() => {
            document.body.appendChild(element);
            listObj = new DropDownList({ enabled: false, dataSource: datasource2, fields: { text: 'text', value: 'id' } });
            listObj.appendTo(element);
        });
        afterAll(() => {
            if (element) {
                element.remove();
                document.body.innerHTML = '';
            }
        }); 
        it('enableRtl ', () => {
            listObj.enableRtl = true;
            listObj.inputElement = null;
            listObj.dataBind();
            listObj.showPopup();
            document.body.innerHTML = '';
        });
    });

    // Initialize the properties
    describe('Initialize properties changes', () => {
        let listObj: any;
        let element: HTMLElement;
        beforeEach(() => {
            element = createElement('input', { id: 'DropDownList' });
            document.body.appendChild(element);
        });
        afterEach(() => {
            if (element) {
                let parent: HTMLElement = element.parentElement as HTMLElement;
                parent.remove();
                document.body.innerHTML = '';
            }
        });
        /**
         * value
         */
        it('value at initialize ', () => {
            listObj = new DropDownList({ dataSource: datasource, fields: { value: 'id' }, value: 'list2' });
            listObj.appendTo(element);
            listObj.showPopup();
            let ele: Element = listObj.popupObj.element;
            let li: Element[] & NodeListOf<HTMLLIElement> = <Element[] & NodeListOf<HTMLLIElement>>ele.querySelectorAll('li');
            expect(li[1].classList.contains('e-active')).toBe(true);
        });
        /**
         * Index
         */
        it('index at initialize ', () => {
            listObj = new DropDownList({ dataSource: datasource, index: 2, fields: { text: 'text', value: 'id' } });
            listObj.appendTo(element);
            listObj.showPopup();
            let ele: Element = listObj.popupObj.element;
            let li: Element[] & NodeListOf<HTMLLIElement> = <Element[] & NodeListOf<HTMLLIElement>>ele.querySelectorAll('li');
            expect(li[2].classList.contains('e-active')).toBe(true);
        });
        /**
         * text
         */
        it('text at initialize ', () => {
            listObj = new DropDownList({ dataSource: datasource, fields: { value: 'id', text: 'text' }, text: '.NET' });
            listObj.appendTo(element);
            listObj.showPopup();
            let ele: Element = listObj.popupObj.element;
            let li: Element[] & NodeListOf<HTMLLIElement> = <Element[] & NodeListOf<HTMLLIElement>>ele.querySelectorAll('li');
            expect(li[3].classList.contains('e-active')).toBe(true);
        });
        /**
         * Value integer type checking
         */
        it('value in integer type', () => {
            let datasource: { [key: string]: Object }[] = [{ id: 1, text: 'JAVA', icon: 'icon' }, { id: 2, text: 'C#' },
            { id: 3, text: 'C++' }, { id: 4, text: '.NET', icon: 'icon' }, { id: 5, text: 'Oracle' }];
            listObj = new DropDownList({ dataSource: datasource, index: 3, fields: { text: 'text', value: 'id' } });
            listObj.appendTo(element);
            listObj.showPopup();
            let li: Element[] = listObj.popupObj.element.querySelectorAll('li');
            expect((li[3]).classList.contains('e-active')).toBe(true);
            expect(listObj.value).toBe(4);
        });
        /**
        *  component render with not exist text in dataSource
        */
        it('component render with not exist text in dataSource ', () => {
            listObj = new DropDownList({ dataSource: datasource, fields: { value: 'id', text: 'text' }, text: 'ASP.NET' });
            listObj.appendTo(element);
            expect(listObj.text === null).toBe(true);
            expect(listObj.value === null).toBe(true);
            expect(listObj.index === null).toBe(true);
        });
    });
    // template supports
    describe('Template support', () => {
        let listObj: any;
        let listObj1: any;
        let listObj2: any;
        let element1: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'ddl' });
        let element2: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'ddl2' });
        let keyEventArgs: any = { preventDefault: (): void => { /** NO Code */ }, action: 'down', type: 'keydown' };
        afterAll(() => {
            element1.remove();
            element2.remove();
            document.body.innerHTML = '';
        });
        it('string header template property', () => {
            document.body.appendChild(element1);
            listObj1 = new DropDownList({ dataSource: datasource2, headerTemplate: "header", footerTemplate: "footer", popupHeight: '300px' });
            listObj1.appendTo(element1);
            listObj1.showPopup();
            expect(listObj1.headerTemplate).toEqual(listObj1.popupObj.element.firstChild.innerText);
        });
        it('string footer template property', () => {
            expect(listObj1.footerTemplate).toEqual(listObj1.popupObj.element.lastChild.innerText);
        });
        it('value template', () => {
            document.body.innerHTML = '';
            document.body.appendChild(element2);
            listObj2 = new DropDownList({
                dataSource: datasource2,
                fields: { text: 'text', value: 'id' },
                valueTemplate: "<div class='ename'> ${id} </div>"
            });
            listObj2.appendTo(element2);
            listObj2.showPopup();
            listObj2.index = 3;
            listObj2.dataBind();
            let valueEle: HTMLElement = listObj2.element.parentElement.querySelector('.e-input-value');
            expect(valueEle.innerHTML).toEqual('<div class="ename"> list1 </div>');
            expect(listObj2.element.parentElement.childNodes[1].classList.contains('e-input-value')).toBe(true);
            expect(listObj2.element.style.display).toBe('none');
        });
        it('value template with null value', () => {
            listObj2.value = null;
            listObj2.dataBind();
            expect(listObj2.element.style.display).toBe('block');
            expect(listObj2.element.parentElement.firstChild.classList.contains('e-input-value')).not.toBe(true);

        });
        it('dynamically update value template', () => {
            document.body.innerHTML = '';
            document.body.appendChild(element2);
            listObj2 = new DropDownList({
                dataSource: datasource2,
                fields: { text: 'text', value: 'id' },
            });
            listObj2.appendTo(element2);
            listObj2.valueTemplate = "<div class='ename'> ${id} </div>"
            listObj2.showPopup();
            listObj2.index = 3;
            listObj2.dataBind();
            let valueEle: HTMLElement = listObj2.element.parentElement.querySelector('.e-input-value');
            expect(valueEle.innerHTML).toEqual('<div class="ename"> list1 </div>');
            expect(listObj2.element.parentElement.childNodes[1].classList.contains('e-input-value')).toBe(true);
            expect(listObj2.element.style.display).toBe('none');
        });

        it('escape key - after value select and previous empty text box', (done) => {
            keyEventArgs.action = 'open';
            listObj2.keyActionHandler(keyEventArgs);
            setTimeout(() => {
                keyEventArgs.action = 'down';
                listObj2.keyActionHandler(keyEventArgs);
                expect(listObj2.inputElement.value !== '').toBe(true);
                keyEventArgs.action = 'escape';
                listObj2.keyActionHandler(keyEventArgs);
                setTimeout(() => {
                    let valueTemp: Element = document.querySelector('.e-input-value')
                    //expect(isNullOrUndefined(valueTemp)).toBe(true);
                    expect(listObj2.isPopupOpen).toBe(false);
                    done();
                }, 450);
            }, 450);
        });

        it('escape key - after value select and previous not empty text box', (done) => {
            listObj2.value = 'id2';
            listObj2.dataBind();
            keyEventArgs.action = 'open';
            listObj2.keyActionHandler(keyEventArgs);
            setTimeout(() => {
                keyEventArgs.action = 'down';
                listObj2.keyActionHandler(keyEventArgs);
                keyEventArgs.action = 'escape';
                listObj2.keyActionHandler(keyEventArgs);
                setTimeout(() => {
                    let valueTemp: HTMLElement = <HTMLElement>document.querySelector('.ename')
                    expect(valueTemp.innerText === 'id2').toBe(true);
                    expect(listObj2.isPopupOpen).toBe(false);
                    done();
                }, 450);
            }, 450);
        });

        it('value template with value', () => {
            listObj2.value = 'id3';
            listObj2.valueTemplate = null;
            listObj2.dataBind();
            expect(listObj2.element.style.display).toBe('block');
            expect(listObj2.element.parentElement.firstChild.classList.contains('e-input-value')).not.toBe(true);
        });
    });

    // Method testing
    describe('method testing ', () => {
        let listObj: any;
        let element: HTMLInputElement;
        let originalTimeout: number;
        beforeAll(() => {
            originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 700;
            element = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
            document.body.appendChild(element);
            listObj = new DropDownList({ fields: { text: 'text', value: 'id' } });
            listObj.appendTo(element);
        });
        afterAll(() => {
            jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
            if (element) { element.remove(); };
            document.body.innerHTML = '';
        });
        /**
         * show popup method
         */
        it('show popup method', (done) => {
            expect(listObj.inputWrapper.container.getAttribute('aria-expanded')).toBe('false');
            listObj.showPopup();
            setTimeout(function () {
                expect(listObj.isPopupOpen).toEqual(true);
                expect(listObj.element.parentElement.classList.contains('e-icon-anim')).toEqual(true);
                expect(listObj.element.parentElement.classList.contains('e-input-focus')).toEqual(true);
                expect(listObj.inputWrapper.container.getAttribute('aria-expanded')).toBe('true');
                listObj.showPopup();
                expect(listObj.isPopupOpen).toEqual(true);
                expect(listObj.element.parentElement.classList.contains('e-input-focus')).toEqual(true);
                done();
            }, 450);
        });
        /**
         * hide popup method
         */
        it('Hide popup method', (done) => {
            listObj.hidePopup();
            expect(listObj.inputWrapper.container.getAttribute('aria-expanded')).toBe('false');
            setTimeout(function () {
                expect(listObj.isPopupOpen).toEqual(false);
                listObj.hidePopup();
                expect(listObj.isPopupOpen).toEqual(false);
                done();
            }, 450);

        });
        /**
         * focusIn method
         */
        it('focus method ', () => {
            listObj.focusIn();
            expect(listObj.element.parentElement.classList.contains('e-input-focus')).toBe(true);
        });
        /**
         * focusOut method
         */
        it('focusOut method ', () => {
            listObj.focusOut();
            expect(listObj.element.parentElement.classList.contains('e-input-focus')).toBe(false);
        });

        /**
         * getModuleName
         */
        it('getModuleName method', () => {
            let name: string = listObj.getModuleName();
            expect(name).toEqual('dropdownlist');
        });
        /**
         * getPersistData
         */
        it('getPersistData method ', () => {
            let stringItems: any = listObj.getPersistData();
            expect(stringItems.search('value')).toBe(2);
        });
        /**
         * hovering
         */
        it('hovering method ', () => {
            listObj.dataSource = datasource;
            listObj.dataBind();
            let items: Element[] = listObj.popupObj.element.querySelectorAll('li');
            listObj.setHover(items[3]);
            expect(items[3].classList.contains('e-hover')).toBe(true);
            listObj.setHover(items[3]);
        });
        /**
         * removeHover
         */
        it('removeHover method ', () => {
            let hoveredLi: Element = listObj.popupObj.element.querySelector('.e-hover');
            listObj.removeHover(hoveredLi);
            expect(hoveredLi.classList.contains('e-hover')).toBe(false);
        });
        it('getElementByText', () => {
            listObj.fields = { text: 'text', value: 'id' };
            listObj.dataBind();
            let text: string = 'c#';
            let value: string = listObj.getValueByText(text, true);
            expect(value).toEqual('list2');
        });
        it('addItem ', () => {
            listObj.addItem({ id: 'list14', text: 'PHP' }, 0);
            expect(listObj.list.querySelector('li').textContent).toBe('PHP');
        })
        it('addItem with selection ', () => {
            listObj.index = 2;
            listObj.dataBind();
            listObj.addItem({ id: 'list04', text: 'TypeScript' }, 3);
            expect(listObj.list.querySelector('li').textContent).not.toBe('TypeScript');
        })
        it('getValueByText with number type value', () => {
            listObj.dataSource = [1, 2, 3, 4, 5, 6, 7];
            listObj.fields = { text: null, value: null };
            listObj.dataBind();
            let value: number = listObj.getValueByText('3');
            expect(value).toBe(3);
        })
        it('getValueByText with string type value', () => {
            listObj.dataSource = ['Cricket', 'FootBall', 'Tennis', 'VolleyBall'];
            listObj.dataBind();
            let value: string = listObj.getValueByText('cricket', true);
            expect(value).toBe('Cricket');
            let value2: string = listObj.getValueByText('tennis');
            expect(value2).not.toBe('Tennis');
        })
        it('getTextByValue  with number type value', () => {
            listObj.dataSource = [1, 2, 3, 4, 5, 6, 7];
            listObj.fields = { text: null, value: null };
            listObj.dataBind();
            let value: string = listObj.getTextByValue(2);
            expect(value).toBe('2');
        })
        /**
         * destroy
         */
        it('destroy method ', () => {
            listObj.destroy();
            expect(!!listObj.element.classList.contains('e-dropdownlist')).toBe(false);
            document.body.innerHTML = '';
        });
    });
    describe(' number of array dataSource ', () => {
        let listObj: any;
        let datasource1: number[] = [1, 2, 3, 4, 5, 6, 7];
        beforeAll(() => {
            let element: HTMLElement = createElement('input', { id: 'list' });
            document.body.appendChild(element);
            listObj = new DropDownList({ dataSource: datasource1, text: 4 as any });
            listObj.appendTo(element);
        });
        afterAll(() => {
            listObj.destroy();
            document.body.innerHTML = '';
        });
        it(' check initial value, text and index ', () => {
            expect(listObj.value === 4).toBe(true);
            expect(listObj.text === "4").toBe(true);
            expect(listObj.index === 3).toBe(true);
        });
    });

    describe('Before list creation AddItem method testing ', () => {
        let listObj: any;
        let datasource1: { [key: string]: Object }[] = [{ 'text': 'Audi', 'id': 'e807' },
        { 'text': 'BMW', 'id': 'a0cc' }, { 'text': 'BENZ', 'id': 'f8435' }];
        beforeAll(() => {
            let element: HTMLElement = createElement('input', { id: 'list' });
            document.body.appendChild(element);
            listObj = new DropDownList({ dataSource: datasource2, fields: { text: 'text', value: 'id' } });
            listObj.appendTo(element);
        });
        afterAll(() => {
            listObj.destroy();
            document.body.innerHTML = '';
        });
        it('AddItem testing ', () => {
            listObj.addItem({ id: 'bike01', text: 'Suzuki' }, 0);
            expect(listObj.list.querySelector('li').textContent).toBe('Suzuki');
        });
    });
    // angular tag testing
    describe('Angular tag testing ', () => {
        let listObj: any;
        let datasource1: { [key: string]: Object }[] = [{ 'text': 'Audi A6', 'id': 'e807', 'category': 'Audi' }, { 'text': 'Audi A7', 'id': 'a0cc', 'category': 'Audi' },
        { 'text': 'BMW 501', 'id': 'f8435', 'category': 'BMW' }, { 'text': 'BMW 3', 'id': 'b2b1', 'category': 'BMW' }];
        beforeAll(() => {
            let element: any = createElement('EJS-DROPDOWNLIST', { id: 'dropdownlist' });
            document.body.appendChild(element);
            listObj = new DropDownList({ dataSource: datasource2 });
            listObj.appendTo(element);
        });
        afterAll(() => {
            listObj.destroy();
            document.body.innerHTML = '';
        });
        it('Wrapper testing ', () => {
            expect(listObj.element.tagName).toEqual('EJS-DROPDOWNLIST');
            expect(listObj.inputWrapper.container.parentElement).toBe(listObj.element);
        });
    });
    // Event testing

    describe('Select event triggered', () => {
        let listObj: any;
        let element: HTMLElement;
        let data: string[] = ['Basketball', 'Football', 'Hockey', 'Snooker'];
        let selectAction: EmitType<Object> = jasmine.createSpy('Select');
        let changeAction: EmitType<Object> = jasmine.createSpy('Change');
        let e: any = { preventDefault: function () { } };
        let originalTimeout: number;
        beforeEach(() => {
            originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000;
            element = createElement('input', { id: 'list' });
            document.body.appendChild(element);
            listObj = new DropDownList({ dataSource: data, change: changeAction, select: selectAction, index: 2 });
            listObj.appendTo(element);
        });
        afterEach(() => {
            if (element) {
                element.parentElement.remove();
                document.body.innerHTML = '';
            }
        });
        /**
         * select  event
         */
        it('select event trigger at initialize and check aria-activedescendant', (done) => {
            expect(changeAction).not.toHaveBeenCalled();
            expect(selectAction).not.toHaveBeenCalled();
            expect(listObj.inputWrapper.container.getAttribute('aria-activedescendant') !== 'null').toBe(true);
            listObj.showPopup();
            setTimeout(() => {
                expect(listObj.inputWrapper.container.getAttribute('aria-activedescendant') !== 'null').toBe(true);
                let items: Element[] = listObj.popupObj.element.querySelectorAll('li');
                listObj.setSelection(items[0], e);
                expect(selectAction).toHaveBeenCalled();
                expect(changeAction).toHaveBeenCalled();
                done()
            }, 450)
        });

        /**
         * change event
         */
        it('change event trigger when value selected', (done) => {
            listObj.showPopup();
            setTimeout(() => {
                let keyEventArgs: any = { preventDefault: (): void => { /** NO Code */ }, action: 'down', type: 'keydown' };
                listObj.keyActionHandler(keyEventArgs);
                expect(selectAction).toHaveBeenCalled();
                keyEventArgs.action = 'enter';
                listObj.keyActionHandler(keyEventArgs);
                expect(changeAction).toHaveBeenCalled();
                done();
            }, 450);
        });

    });
    describe('event testing ', () => {
        let listObj: any;
        let element: HTMLInputElement;
        let keyEventArgs: any = { preventDefault: (): void => { /** NO Code */ }, action: 'down' };
        let mouseEventArgs: any = { preventDefault: function () { }, target: null };
        let e: any = { preventDefault: function () { } };
        let originalTimeout: number;
        beforeAll(() => {
            originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 3000;
            element = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
            document.body.appendChild(element);
            listObj = new DropDownList({ dataSource: datasource2, debounceDelay: 0, fields: { text: 'text', value: 'id' } });
            listObj.appendTo(element);
        });
        afterAll(() => {
            jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
            if (element) { element.remove(); };
            document.body.innerHTML = '';
        });

        it('document click event', (done) => {
            listObj.allowFiltering = true;
            listObj.showPopup();
            setTimeout(() => {
                mouseEventArgs.target = document.getElementsByTagName('HTML')[0];
                mouseEventArgs.srcElement = document.getElementsByTagName('HTML')[0];
                listObj.onDocumentClick(mouseEventArgs);
                setTimeout(function () {
                    expect(listObj.isPopupOpen).toBe(false);
                    done();
                }, 450);
            }, 450)
        });
        it('documentclick event in this.element', (done) => {
            listObj.showPopup();
            mouseEventArgs.target = listObj.element;
            listObj.onDocumentClick(mouseEventArgs);
            setTimeout(function () {
                expect(listObj.isPopupOpen).toBe(true);
                done();
            }, 250);
        });
        it('mouse click on input', (done) => {
            listObj.dropDownClick(mouseEventArgs);
            expect(listObj.isPopupOpen).toBe(true);
            setTimeout(function () {
                expect(listObj.isPopupOpen).toBe(false);
                done();
            }, 450);
        });
        it('mouse click on disabled input', (done) => {
            listObj.enabled = false;
            listObj.dataBind();
            listObj.dropDownClick(mouseEventArgs);
            setTimeout(function () {
                expect(listObj.isPopupOpen).toBe(false);
                done();
            }, 450);
        });
        it('mouse click on list ', (done) => {
            listObj.showPopup();
            setTimeout(() => {
                let item: HTMLElement[] = listObj.popupObj.element.querySelectorAll('li')[3];
                mouseEventArgs.target = item;
                mouseEventArgs.type = 'click';
                listObj.onMouseClick(mouseEventArgs);
                setTimeout(function () {
                    expect(listObj.isPopupOpen).toBe(false);
                    done();
                }, 450);
            }, 450)
        });
        it('mouse click on list with allowObjectBinding', (done) => {
            listObj.allowObjectBinding = true;
            listObj.showPopup();
            setTimeout(() => {
                let item: HTMLElement[] = listObj.popupObj.element.querySelectorAll('li')[3];
                mouseEventArgs.target = item;
                mouseEventArgs.type = 'click';
                listObj.onMouseClick(mouseEventArgs);
                setTimeout(function () {
                    expect(listObj.isPopupOpen).toBe(false);
                    done();
                }, 450);
            }, 450)
        });
        it('change & close event trigger ', (done) => {
            listObj.allowObjectBinding = false;
            listObj.enabled = true;
            listObj.showPopup();
            let closeAction: EmitType<Object> = jasmine.createSpy('Open');
            listObj.close = closeAction;
            setTimeout(() => {
                let item: HTMLElement[] = listObj.popupObj.element.querySelectorAll('li')[4];
                mouseEventArgs.target = item;
                mouseEventArgs.type = 'click';
                listObj.onMouseClick(mouseEventArgs);
                setTimeout(function () {
                    expect(closeAction).toHaveBeenCalled();
                    expect(listObj.value).toEqual(listObj.listData[4][listObj.fields.value]);
                    expect(listObj.isPopupOpen).toBe(false);
                    done();
                }, 450);
            }, 450);
        });
        /**
         * select event
         */
        it('select & open event trigger', (done) => {
            let selectAction: EmitType<Object> = jasmine.createSpy('Select');
            let openAction: EmitType<Object> = jasmine.createSpy('Open');
            listObj.select = selectAction;
            listObj.open = openAction;
            listObj.showPopup();
            setTimeout(() => {
                expect(openAction).toHaveBeenCalled();
                let items: Element[] = listObj.popupObj.element.querySelectorAll('li');
                listObj.setSelection(items[2], e);
                expect(selectAction).toHaveBeenCalled();
                done()
            }, 450)
        });

        it('blur event', (done) => {
            listObj.hidePopup();
            setTimeout(() => {
                mouseEventArgs.target = document.body;
                listObj.showPopup();
                setTimeout(() => {
                    listObj.onBlurHandler(mouseEventArgs);
                    setTimeout(() => {
                        expect(listObj.isPopupOpen).toBe(false);
                        done()
                    }, 450)
                }, 450);
            }, 450)
        });
        describe('change event arguments', () => {
            let listObj: any;
            let element: HTMLInputElement;
            let datasource1: { [key: string]: Object }[] = [{ 'text': 'Audi A6', 'id': 'e807', 'category': 'Audi' }, { 'text': 'Audi A7', 'id': 'a0cc', 'category': 'Audi' },
            { 'text': 'BMW 501', 'id': 'f8435', 'category': 'BMW' }, { 'text': 'BMW 3', 'id': 'b2b1', 'category': 'BMW' }];
            beforeAll(() => {
                element = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
                document.body.appendChild(element);
            });
            afterAll(() => {
                document.body.innerHTML = '';
            });
            it("change value checking", () => {
                listObj = new DropDownList({
                    dataSource: datasource1,
                    fields: { text: "text", value: "id" },
                    index: 0
                });
                listObj.appendTo(element);
                expect(listObj.text).toEqual('Audi A6');
                listObj.change = function(args: any){
                    expect(args.previousItemData.text).toEqual('Audi A6');
                    expect(args.element).not.toBe(null);
                };
                listObj.index = 2;
                listObj.dataBind();
            });
        });
    });

    describe(' hidden element ', () => {
        let listObj: any;
        let element: HTMLInputElement;
        let mouseEventArgs: any = { preventDefault: function () { }, target: null };
        let datasource1: { [key: string]: Object }[] = [{ 'text': 'Audi A6', 'id': 'e807', 'category': 'Audi' }, { 'text': 'Audi A7', 'id': 'a0cc', 'category': 'Audi' },
        { 'text': 'BMW 501', 'id': 'f8435', 'category': 'BMW' }, { 'text': 'BMW 3', 'id': 'b2b1', 'category': 'BMW' }];
        let originalTimeout: number;
        beforeAll(() => {
            element = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
            document.body.appendChild(element);
        });
        afterAll(() => {
            document.body.innerHTML = '';
        });
        it("name attribute as id of this.element", () => {
            let ddl: DropDownList = new DropDownList({}, element);
            let select: HTMLSelectElement[] = <HTMLSelectElement[] & NodeListOf<HTMLSelectElement>>element.parentElement.querySelectorAll('select');
            expect(select.length).toBe(1);
            expect(element.id).toBe(select[0].getAttribute('name'));
        });
        it("name attribute as name of this.element", () => {
            element.setAttribute('name', 'select1');
            let ddl: DropDownList = new DropDownList({}, element);
            let select: HTMLSelectElement[] = <HTMLSelectElement[] & NodeListOf<HTMLSelectElement>>element.parentElement.querySelectorAll('select');
            expect('select1').toBe(select[0].getAttribute('name'));
        });
        it("select value checking", () => {
            element.setAttribute('name', 'select1');
            let ddl: DropDownList = new DropDownList({
                dataSource: datasource1,
                fields: { text: "text", value: "id" },
                text: "BMW 3"
            });
            ddl.appendTo(element);
            let option: HTMLOptionElement[] = <HTMLOptionElement[] & NodeListOf<HTMLElement>>element.parentElement.querySelectorAll('select>option');
            expect(option.length).toBe(1);
            expect(ddl.value).toBe(option[0].value);
            expect(option[0].selected).toBe(true);
            ddl.text = 'Audi A6';
            ddl.dataBind();
            let option1: HTMLOptionElement[] = <HTMLOptionElement[] & NodeListOf<HTMLElement>>element.parentElement.querySelectorAll('select>option');
            expect(option.length).toBe(1);
            expect(ddl.value).toBe(option1[0].value);
            expect(option1[0].selected).toBe(true);
        });

    });
    describe("select element Rendering", () => {
        let listObj: any;
        let element: string = "<select id='select1'><option>option1</option><option value='option2'>option2</option></select>";
        let groupelement: string = "<select id='select2'><optgroup label='option'><option>option1</option><option value='option2' disabled>option2</option></optgroup><option>option3</option></select>";
        /**
         * Select Rendering
         */
        it('Select Rendering with options only', () => {
            document.body.innerHTML = element;
            let select: HTMLSelectElement = document.getElementById('select1') as HTMLSelectElement;
            listObj = new DropDownList();
            listObj.appendTo(select);
            listObj.value = 'option1';
            listObj.dataBind();
            listObj.showPopup();
            let ele: HTMLElement = listObj.popupObj.element;
            expect(ele.querySelectorAll('li').length).toBe(2);
            expect(ele.querySelectorAll('li')[0].innerText).toBe('option1');
            expect(ele.querySelectorAll('li')[0].getAttribute('data-value')).toBe('option1');
            expect(ele.querySelectorAll('li')[1].getAttribute('data-value')).toBe('option2');
        });
        it('Select Rendering with options and optgroup', () => {
            document.body.innerHTML = groupelement;
            let groupselect: HTMLSelectElement = document.getElementById('select2') as HTMLSelectElement;
            listObj = new DropDownList();
            listObj.appendTo(groupselect);
            listObj.index = 1;
            listObj.dataBind();
            listObj.showPopup();
            let ele: HTMLElement = listObj.popupObj.element;
            expect(ele.querySelectorAll('li').length).toBe(4);
            expect(ele.querySelectorAll('li')[0].innerText).toBe('option3');
            expect(ele.querySelectorAll('li')[1].classList).toContain('e-list-group-item');
            expect(ele.querySelectorAll('li')[2].getAttribute('data-value')).toBe('option1');
            expect(ele.querySelectorAll('li')[3].getAttribute('data-value')).toBe('option2');
            expect(ele.querySelectorAll('li')[3].textContent).toBe('option2');
        });
        afterAll(() => {
            let groupselect: HTMLSelectElement = document.getElementById('select2') as HTMLSelectElement;
            let select: HTMLSelectElement = document.getElementById('select1') as HTMLSelectElement;
            if (select) {
                let parent: HTMLElement = select.parentElement as HTMLElement;
                parent.remove();
            }
            if (groupselect) {
                let parent: HTMLElement = groupselect.parentElement as HTMLElement;
                parent.remove();
            }
        });
    });

    describe("Escaped HTML entities should display", () => {
        let listObj: any;
        let element: string = `<select id="select1">
                                    <option value="P">Create a new &lt;p&gt;</option>
                                    <option value="DIV">Create a new &lt;div&gt;</option>
                                    <option value="BR">Create a new &lt;br&gt;</option>
                                </select>`;
        it('Select Rendering with options', () => {
            document.body.innerHTML = element;
            let select: HTMLSelectElement = document.getElementById('select1') as HTMLSelectElement;
            listObj = new DropDownList();
            listObj.appendTo(select);
            listObj.value = 'option1';
            listObj.dataBind();
            listObj.showPopup();
            let ele: HTMLElement = listObj.popupObj.element;
            expect(ele.querySelectorAll('li')[0].innerText).toBe('Create a new <p>');
        });
        afterAll(() => {
            let select: HTMLSelectElement = document.getElementById('select1') as HTMLSelectElement;
            if (select) {
                let parent: HTMLElement = select.parentElement as HTMLElement;
                parent.remove();
            }
        });
    });
   
    describe('Rendering by UL-LI tag', () => {
        let ele: HTMLElement = document.createElement('ul');
        ele.id = 'newlist';
        ele.innerHTML = '<li id="i1">item1</li>' +
            '<li id="i2">item2</li><li id="i3">item3</li><li id="i4" disabled>item4</li><li id="i5">item5</li>' +
            '<li>item6</li><li>item7</li>';
        let listObj: any;
        beforeAll(() => {
            document.body.appendChild(ele);
            listObj = new DropDownList();
            listObj.appendTo('#newlist');
        });
        afterAll(() => {
            if (ele) {
                ele.remove();
                document.body.innerText = '';
            }
        })
        it('ul-li rendering', () => {
            listObj.text = 'item1';
            listObj.dataBind();
            listObj.showPopup();
            let ele: HTMLElement = listObj.popupObj.element;
            expect(ele.querySelectorAll('li').length).toBe(7);
            expect(listObj.element.classList.contains('e-control')).toBe(true);
            expect(listObj.element.style.display).toBe('none');
        });
    });

    // Keyboard Interaction
    describe('key actions', () => {
        let keyEventArgs: any = { preventDefault: (): void => { /** NO Code */ }, action: 'down' };
        let list: any;
        let ele: HTMLElement;
        beforeAll(() => {
            ele = createElement('input', { id: 'DropDownList' });
            document.body.appendChild(ele);
            list = new DropDownList({
                dataSource: datasource, fields: { text: 'text', value: 'id' }
            });
            list.appendTo(ele);
        });
        afterAll(() => {
            ele.remove();
            list.destroy();
            document.body.innerHTML = '';
        });
        /**
        * Tab Key without open popup
        */
        it("Tab Key without open popup ", () => {
            list.focusIn();
            keyEventArgs.action = 'tab';
            list.keyActionHandler(keyEventArgs);
            expect(isNullOrUndefined(list.list)).toBe(true);
        })
        /**
         * Tab Key
         */
        it("Tab key ", (done) => {
            list.showPopup();
            setTimeout(() => {
                keyEventArgs.action = 'tab';
                list.keyActionHandler(keyEventArgs);
                setTimeout(() => {
                    expect(list.isPopupOpen).toBe(false);
                    done();
                }, 300);
            }, 450);
        });
        /**
         * Shift+Tab Key
         */
        it("Shift+Tab key ", (done) => {
            list.showPopup();
            setTimeout(() => {
                expect(list.isPopupOpen).toBe(true);
                keyEventArgs.action = 'close';
                list.keyActionHandler(keyEventArgs);
                setTimeout(() => {
                    expect(list.isPopupOpen).toBe(false);
                    done();
                }, 300);
            }, 450)
        });
        /**
         * DownKey
         */
        it('Down key pressed ', () => {
            list.index = 1;
            list.dataBind();
            let li: Element[] = list.popupObj.element.querySelectorAll('li');
            expect(li[1].classList.contains('e-active')).toBe(true);
            keyEventArgs.action = 'down';
            list.keyActionHandler(keyEventArgs);
            expect(li[1].classList.contains('e-active')).toBe(false);
            expect(li[2].classList.contains('e-active')).toBe(true);
            list.index = null;
            list.dataBind();
            list.keyActionHandler(keyEventArgs);
            expect(li[0].classList.contains('e-active')).toBe(true);
        });
        /**
         * DownKey
         */
        it('Down key to last li ', () => {
            let ele: Element = list.popupObj.element;
            let li: Element[] = <Element[] & NodeListOf<HTMLLIElement>>ele.querySelectorAll('li');
            list.setSelection(li[li.length - 1]);
            expect((li[li.length - 1] as Element).classList.contains('e-active')).toBe(true);
            list.keyActionHandler(keyEventArgs);
            expect((li[1] as Element).classList.contains('e-active')).toBe(false);
        });
        /**
         * UpKey
         */
        it('Up key pressed ', () => {
            let li: Element[] = list.popupObj.element.querySelectorAll('li');
            list.setSelection(li[3]);
            expect(li[3].classList.contains('e-active')).toBe(true);
            keyEventArgs.action = 'up';
            list.keyActionHandler(keyEventArgs);
            expect(li[2].classList.contains('e-active')).toBe(true);
            list.index = null;
            list.dataBind();
            list.keyActionHandler(keyEventArgs);
            expect(li[0].classList.contains('e-active')).toBe(true);
        });
        /**
         * UpKey
         */
        it('Up key pressed for 0th li ', () => {
            let ele: Element = list.popupObj.element;
            let li: Element[] = <Element[] & NodeListOf<HTMLLIElement>>ele.querySelectorAll('li');
            keyEventArgs.action = 'up';
            list.keyActionHandler(keyEventArgs);
            expect((li[li.length - 1] as Element).classList.contains('e-active')).toBe(false);
        });
        /**
         * HomeKey
         */
        it('Home key pressed ', () => {
            let ele: Element = list.popupObj.element;
            let li: Element[] = <Element[] & NodeListOf<HTMLLIElement>>ele.querySelectorAll('li');
            list.setSelection(li[3]);
            expect((li[3] as Element).classList.contains('e-active')).toBe(true);
            keyEventArgs.action = 'home';
            list.keyActionHandler(keyEventArgs);
            expect((li[0] as Element).classList.contains('e-active')).toBe(true);
        });
        /**
         * HomeKey
         */
        it('Home key pressed to 0th li ', () => {
            let ele: Element = list.popupObj.element;
            let li: Element[] = <Element[] & NodeListOf<HTMLLIElement>>ele.querySelectorAll('li');
            list.setSelection(li[0]);
            expect((li[0] as Element).classList.contains('e-active')).toBe(true);
            keyEventArgs.action = 'home';
            list.keyActionHandler(keyEventArgs);
            expect((li[0] as Element).classList.contains('e-active')).toBe(true);
        });
        /**
         * EndKey
         */
        it('End key pressed ', () => {
            let ele: Element = list.popupObj.element;
            let li: Element[] = <Element[] & NodeListOf<HTMLLIElement>>ele.querySelectorAll('li');
            list.setSelection(li[3]);
            expect((li[3] as Element).classList.contains('e-active')).toBe(true);
            keyEventArgs.action = 'end';
            list.keyActionHandler(keyEventArgs);
            expect((li[li.length - 1] as Element).classList.contains('e-active')).toBe(true);
        });
        /**
         * EndKey
         */
        it('End key pressed to last li', () => {
            let ele: Element = list.popupObj.element;
            let li: Element[] = <Element[] & NodeListOf<HTMLLIElement>>ele.querySelectorAll('li');
            list.setSelection(li[li.length - 1]);
            expect((li[li.length - 1] as Element).classList.contains('e-active')).toBe(true);
            keyEventArgs.action = 'end';
            list.keyActionHandler(keyEventArgs);
            expect((li[li.length - 1] as Element).classList.contains('e-active')).toBe(true);
        });
        /**
         * pageUp key without open popup
         */
        it('pageUp key without open popup', () => {
            let ele: Element = list.popupObj.element;
            let li: Element[] = <Element[] & NodeListOf<HTMLLIElement>>ele.querySelectorAll('li');
            keyEventArgs.action = 'pageUp';
            list.keyActionHandler(keyEventArgs);
            expect((li[li.length - 1] as Element).classList.contains('e-active')).toBe(true);
        });
        /**
         * pageUp key without open popup
         */
        it('pageDown key without open popup', () => {
            let ele: Element = list.popupObj.element;
            let li: Element[] = <Element[] & NodeListOf<HTMLLIElement>>ele.querySelectorAll('li');
            keyEventArgs.action = 'pageDown';
            list.keyActionHandler(keyEventArgs);
            expect((li[li.length - 1] as Element).classList.contains('e-active')).toBe(true);
        });
        /**
         * Page_up key
         */
        it('Page_up key pressed ', (done) => {
            list.showPopup();
            setTimeout(() => {
                let ele: Element = list.popupObj.element;
                let li: Element[] = <Element[] & NodeListOf<HTMLLIElement>>ele.querySelectorAll('li');
                list.setSelection(li[4]);
                expect((li[4] as Element).classList.contains('e-active')).toBe(true);
                keyEventArgs.action = 'pageUp';
                list.keyActionHandler(keyEventArgs);
                expect((li[0] as Element).classList.contains('e-active')).toBe(true);
                list.list.querySelector('ul').style.height = '50px';
                list.dataBind();
                list.list.querySelector('ul').style.overflow = 'auto';
                list.list.querySelector('ul').style.display = 'block';
                list.setSelection(li[4]);
                keyEventArgs.action = 'pageUp';
                list.keyActionHandler(keyEventArgs);
                done();
            }, 450);
        });
        /**
         * HomeKey
         */
        it('Page_up key pressed to 0th li ', () => {
            let ele: Element = list.popupObj.element;
            let li: Element[] = <Element[] & NodeListOf<HTMLLIElement>>ele.querySelectorAll('li');
            list.setSelection(li[0]);
            expect((li[0] as Element).classList.contains('e-active')).toBe(true);
            keyEventArgs.action = 'pageUp';
            list.keyActionHandler(keyEventArgs);
            expect((li[0] as Element).classList.contains('e-active')).toBe(true);
            list.index = li.length;
            list.dataBind();
            list.keyActionHandler(keyEventArgs);
        });
        /**
         * Page_down key
         */
        it('Page_down key pressed ', () => {
            let ele: Element = list.popupObj.element;
            let li: Element[] = <Element[] & NodeListOf<HTMLLIElement>>ele.querySelectorAll('li');
            list.setSelection(li[3]);
            expect((li[3] as Element).classList.contains('e-active')).toBe(true);
            keyEventArgs.action = 'pageDown';
            list.keyActionHandler(keyEventArgs);
            expect((li[li.length - 1] as Element).classList.contains('e-active')).toBe(true);
            list.list.querySelector('ul').style.height = '50px';
            list.dataBind();
            list.list.querySelector('ul').style.overflow = 'auto';
            list.list.querySelector('ul').style.display = 'block';
            list.setSelection(li[1]);
            keyEventArgs.action = 'pageDown';
            list.keyActionHandler(keyEventArgs);
        });
        /**
         * EndKey
         */
        it('Page_down key pressed to last li', () => {
            let ele: Element = list.popupObj.element;
            let li: Element[] = <Element[] & NodeListOf<HTMLLIElement>>ele.querySelectorAll('li');
            list.setSelection(li[li.length - 1]);
            expect((li[li.length - 1] as Element).classList.contains('e-active')).toBe(true);
            keyEventArgs.action = 'pageDown';
            list.keyActionHandler(keyEventArgs);
            expect((li[li.length - 1] as Element).classList.contains('e-active')).toBe(true);
            list.index = 0;
            list.dataBind();
            list.keyActionHandler(keyEventArgs);
        });
        /**
       * space key
       */
        it('Space key - popup open state', (done) => {
            keyEventArgs.action = 'space';
            list.keyActionHandler(keyEventArgs);
            setTimeout(() => {
                expect(list.isPopupOpen).toBe(true);
                list.hidePopup();
                setTimeout(() => {
                    expect(list.isPopupOpen).toBe(false);
                    done();
                }, 450);
            }, 450);
        });
        /**
      * space key
      */
        it('Space key - popup hidden state', (done) => {
            keyEventArgs.action = 'space';
            list.keyActionHandler(keyEventArgs);
            setTimeout(() => {
                expect(list.isPopupOpen).toBe(true);
                list.hidePopup();
                setTimeout(() => {
                    expect(list.isPopupOpen).toBe(false);
                    done();
                }, 450);
            }, 450);
        });
    });
    // describe('key actions after manual scroll', () => {
    //     describe('without group', () => {
    //         let keyEventArgs: any = { preventDefault: (): void => { /** NO Code */ }, action: 'down' };
    //         let list: any;
    //         let ele: HTMLElement;
    //         beforeAll(() => {
    //             ele = createElement('input', { id: 'DropDownList' });
    //             document.body.appendChild(ele);
    //             list = new DropDownList({
    //                 dataSource: datasource2, fields: { text: 'text', value: 'id' },
    //                 index: 4
    //             });
    //             list.appendTo(ele);
    //         });
    //         afterAll((done) => {
    //             list.hidePopup();
    //             setTimeout(() => {
    //                 list.destroy();
    //                 ele.remove();
    //                 done();
    //             }, 450)
    //         });
    //         it('down && up key press after scroll by manually', (done) => {
    //             list.showPopup();
    //             setTimeout(() => {
    //                 expect(list.isPopupOpen).toBe(true);
    //                 list.list.style.overflow = 'auto';
    //                 list.list.style.height = '48px';
    //                 list.list.style.display = 'block';
    //                 keyEventArgs.action = 'up';
    //                 list.list.scrollTop = 0;
    //                 list.keyActionHandler(keyEventArgs);
    //                 expect(list.list.scrollTop !== 0).toBe(true);
    //                 list.index = 0;
    //                 list.dataBind();
    //                 keyEventArgs.action = 'down';
    //                 list.list.scrollTop = 90;
    //                 list.keyActionHandler(keyEventArgs);
    //                 expect(list.list.scrollTop !== 90).toBe(true);
    //                 done()
    //             }, 650)
    //         });
    //     });
    // });

    describe('key actions', () => {
        describe('without opening popup', () => {
            let keyEventArgs: any = { preventDefault: (): void => { /** NO Code */ }, key: 'a', code: 'KeyA', charCode: 97 };
            let list: any;
            let ele: HTMLElement;
            beforeAll(() => {
                ele = createElement('input', { id: 'DropDownList' });
                document.body.appendChild(ele);
                list = new DropDownList({
                    dataSource: datasource2, fields: { text: 'text', value: 'id' },
                    index: 4,
                    allowFiltering: true,
                    debounceDelay: 0,
                    select: function(e: any) {
                        e.cancel = true;
                    },
                    open: function(e: any){
                        e.cancel = true;
                    },
                    beforeOpen: function(e: any){
                        e.cancel = true;
                    },
                    filtering: function(e: any) {
                        e.cancel = true;
                    }

                });
                list.appendTo(ele);
            });
            afterAll((done) => {
                setTimeout(() => {
                    list.destroy();
                    ele.remove();
                    done();
                }, 450)
            });
            it('Send key value on search function', (done) => {
                list.onSearch(keyEventArgs);
                setTimeout(() => {
                       expect(list.isPopupOpen).toBe(false);
                    done()
                }, 450)
            });
        });
    });

    describe('with group', () => {
        let keyEventArgs: any = { preventDefault: (): void => { /** NO Code */ }, action: 'down' };
        let list: any;
        let ele: HTMLElement;
        let mouseEventArgs: any = {
            preventDefault: (): void => { /** NO Code */ },
            target: null
        };
        let scrollItemData: { [key: string]: Object }[] = [{ 'text': 'Audi A6', 'id': 'e807', 'category': 'Audi' }, { 'text': 'Audi A7', 'id': 'a0cc', 'category': 'Audi' },
        { 'text': 'BMW 501', 'id': 'f8435', 'category': 'BMW' },
        { 'text': 'BMW 502', 'id': 'f8430', 'category': 'BMW' },
        { 'text': 'BMW 3', 'id': 'b2b1', 'category': 'BMW' }];
        beforeAll(() => {
            ele = createElement('input', { id: 'DropDownList' });
            document.body.appendChild(ele);
            list = new DropDownList({
                dataSource: scrollItemData,
                fields: { text: 'text', value: 'id', groupBy: 'category' },
                index: 4
            });
            list.appendTo(ele);
        });
        afterAll((done) => {
            list.hidePopup();
            setTimeout(() => {
                list.destroy();
                ele.remove();
                done();
            }, 450)
        });
        /**
       * Mouse click
       */
        it('mouse click on group item', (done) => {
            list.showPopup();
            setTimeout(() => {
                let items: Element[] = list.popupObj.element.querySelectorAll('li');
                mouseEventArgs.target = items[0];
                list.onMouseClick(mouseEventArgs);
                expect((items[0].classList.contains('e-list-group-item'))).toBe(true);
                expect(list.value === 'b2b1').toBe(true);
                expect(list.beforePopupOpen).toBe(true);
                done();
            }, 450);
        });
        it('down && up key press after scroll by manually', () => {
            expect(list.isPopupOpen).toBe(true);
            list.list.style.overflow = 'auto';
            list.list.style.height = '48px';
            list.list.style.display = 'block';
            keyEventArgs.action = 'up';
            list.list.scrollTop = 0;
            list.keyActionHandler(keyEventArgs);
            expect(list.list.scrollTop !== 0).toBe(true);
            list.index = 0;
            list.dataBind();
            keyEventArgs.action = 'down';
            list.list.scrollTop = 120;
            list.keyActionHandler(keyEventArgs);
            //expect(list.list.scrollTop !== 120).toBe(true);
        });
    });

    describe('Check popup opens after BeforeOpen event set as true', () => {
        let mouseEventArgs: any = { preventDefault: function () { }, target: null };
        let list: any;
        let count: number = 0;
        let ele: HTMLElement;
        beforeAll(() => {
            ele = createElement('input', { id: 'DropDownList' });
            document.body.appendChild(ele);
        });
        afterAll((done) => {
            setTimeout(() => {
                list.destroy();
                ele.remove();
                done();
            }, 450)
        });
        it('BeforeOpen event set as true', (done) => {
            list = new DropDownList({
                dataSource: datasource2, fields: { text: 'text', value: 'id' },
                index: 4,
                allowFiltering: true,
                debounceDelay: 0,
                beforeOpen: function(e: any){
                    if (count === 2) {
                        e.cancel = true;
                    }
                },
            });
            list.appendTo(ele);
            setTimeout(() => {
            count++;
            list.showPopup();
            expect(list.beforePopupOpen).toBe(true);
            list.hidePopup();
            expect(list.beforePopupOpen).toBe(false);
            count++;
            list.showPopup();
            expect(list.beforePopupOpen).toBe(false);
            count++;
            list.showPopup();
            expect(list.beforePopupOpen).toBe(true);
            list.hidePopup();
            expect(list.beforePopupOpen).toBe(false);
                done();
        }, 450)
        });
    });
    
    // Mouse Events
    describe('mouse events', () => {
        let mouseEventArgs: any = {
            preventDefault: (): void => { /** NO Code */ },
            target: null
        };
        let listObj: any;
        let ele: HTMLElement = createElement('input', { id: 'List' });
        beforeAll(() => {
            document.body.appendChild(ele);
            listObj = new DropDownList({ dataSource: datasource, value: 'list2', fields: { text: 'text', value: 'id' } });
            listObj.appendTo(ele);
        });
        /**
         * Mouse click
         */
        it('mouse click event', () => {
            listObj.showPopup();
            let items: Element[] = listObj.popupObj.element.querySelectorAll('li');
            mouseEventArgs.target = items[2];
            expect((items[2] as Element).classList.contains('e-active')).toBe(false);
            listObj.onMouseClick(mouseEventArgs);
            expect((items[2] as Element).classList.contains('e-active')).toBe(true);
            mouseEventArgs.target = items[3];
            listObj.onMouseClick(mouseEventArgs);
            expect((items[3] as Element).classList.contains('e-active')).toBe(true);
            mouseEventArgs = { target: listObj.list }
            listObj.onMouseClick(mouseEventArgs);
        });
        /**
         * Mouse hover
         */
        it('hover event', () => {
            let li: Element[] = listObj.popupObj.element.querySelectorAll('li');
            mouseEventArgs.target = li[0];
            expect((li[0] as Element).classList.contains('e-hover')).toBe(false);
            listObj.onMouseOver(mouseEventArgs);
            expect((li[0] as Element).classList.contains('e-hover')).toBe(true);
        });
        /**
         * Mouse leave
         */
        it('mouse leave event', () => {
            let li: Element[] = listObj.popupObj.element.querySelectorAll('li');
            mouseEventArgs.target = li[0];
            expect((li[0] as Element).classList.contains('e-hover')).toBe(true);
            listObj.onMouseLeave();
            expect((li[0] as Element).classList.contains('e-hover')).toBe(false);
        });
        afterAll(() => {
            ele.parentElement.remove();
            document.body.innerHTML = '';
        });
    });
    describe("Animation ", function () {
        let originalTimeout: number;
        let keyEventArgs: any = { preventDefault: (): void => { /** NO Code */ }, action: 'escape' };
        let listObj: any;
        beforeAll(() => {
            originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 3700;
            let element: any;
            element = createElement('div', { id: 'popup1' });
            document.body.appendChild(element);
            listObj = new DropDownList({ dataSource: datasource2, fields: { text: 'text', value: 'id' } });
            listObj.appendTo(element);
        });
        /**
         * Show popup method
         */
        it("show method ", (done) => {
            listObj.showPopup();
            setTimeout(() => {
                expect(listObj.popupObj.element.style.display).not.toEqual('none');
                done();
            }, 300);
        });
        /**
         * Focus element testing
         */
        it('Focus element testing', (done) => {
            let item: Element = listObj.popupObj.element.querySelector('li');
            expect(item.classList.contains('e-item-focus')).toBe(true);
            keyEventArgs.action = 'enter';
            listObj.keyActionHandler(keyEventArgs);
            let FocusItem: Element = listObj.popupObj.element.querySelector('li');
            expect(FocusItem.classList.contains('e-item-focus')).toBe(false);
            expect(FocusItem.classList.contains('e-active')).toBe(true);
            setTimeout(() => {
                expect(listObj.isPopupOpen).toBe(false);
                listObj.keyActionHandler(keyEventArgs);
                setTimeout(() => {
                    expect(listObj.isPopupOpen).toBe(true);
                    done();
                }, 450);
            }, 350);
        })
        /**
         * heide popup method
         */
        it("hide method ", (done) => {
            listObj.hidePopup();
            setTimeout(() => {
                expect(listObj.popupObj.element.classList.contains('e-control')).toBe(false);
                done();
            }, 500);
        });
        /**
         * Esc key
         */
        it('Esc key pressed ', (done) => {
            listObj.showPopup();
            setTimeout(() => {
                expect(listObj.popupObj.element.style.display).not.toEqual('none');
                keyEventArgs.action = 'escape';
                listObj.keyActionHandler(keyEventArgs);
            }, 300);
            setTimeout(() => {
                expect(listObj.popupObj.element.classList.contains('e-control')).toBe(false);
                expect(listObj.isPopupOpen).toEqual(false);
                done();
            }, 1000);
        });
        /**
         * Down Key
         */
        it('Down key pressed ', (done) => {
            keyEventArgs.action = 'down';
            listObj.keyActionHandler(keyEventArgs);
            setTimeout(() => {
                let items: HTMLElement[] = listObj.popupObj.element.querySelectorAll('li');
                expect(items[1].classList.contains('e-active')).toBe(true);
                done();
            }, 1000);
        });
        afterAll(() => {
            jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
            if (listObj) {
                listObj.destroy();
                document.body.innerHTML = '';
            }
        });
    });

    describe('Keys in input elements', () => {
        let listObj: any;
        let keyEventArgs: any = { preventDefault: (): void => { /** NO Code */ } };
        let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
        beforeAll(() => {
            document.body.appendChild(element);
            listObj = new DropDownList({ dataSource: datasource2, fields: { text: 'text', value: 'id' }, popupHeight: '100px' });
            listObj.appendTo(element);
        });
        afterAll(() => {
            if (element) {
                element.remove();
                document.body.innerHTML = '';
            }
        });
        /**
         * Down Key while popup closed
         */
        it('Down key pressed ', () => {
            keyEventArgs.action = 'down';
            listObj.keyActionHandler(keyEventArgs);
            let items: HTMLElement[] = listObj.list.querySelectorAll('li');
            expect(items[0].classList.contains('e-active')).toBe(true);
        });
        /**
         * Up Key while popup closed
         */
        it('Up key pressed ', () => {
            keyEventArgs.action = 'up';
            listObj.keyActionHandler(keyEventArgs);
            let items: HTMLElement[] = listObj.list.querySelectorAll('li');
            expect(items[0].classList.contains('e-active')).toBe(true);
        });
        /**
         * Down Key while popup closed
         */
        it('popup - Down key pressed ', (done) => {
            listObj.showPopup();
            setTimeout(() => {
                listObj.list.style.height = '50px';
                listObj.list.style.overflow = 'auto';
                listObj.list.style.display = 'block';
                keyEventArgs.action = 'down';
                keyEventArgs.type = 'keydown';
                keyEventArgs.code = 'ArrowDown';
                listObj.keyActionHandler(keyEventArgs);
                listObj.keyActionHandler(keyEventArgs);
                listObj.keyActionHandler(keyEventArgs);
                listObj.scrollHandler();
                listObj.keyActionHandler(keyEventArgs);
                let items: HTMLElement[] = listObj.list.querySelectorAll('li');
                expect(items[4].classList.contains('e-active')).toBe(true);
                done();
            }, 450);
        });
        /**
         * Up Key while popup open
         */
        it('popup - Up key pressed ', () => {
            keyEventArgs.action = 'up';
            keyEventArgs.type = 'keydown';
            keyEventArgs.code = 'ArrowUp';
            listObj.keyActionHandler(keyEventArgs);
            listObj.keyActionHandler(keyEventArgs);
            listObj.keyActionHandler(keyEventArgs);
            let items: HTMLElement[] = listObj.list.querySelectorAll('li');
            expect(items[1].classList.contains('e-active')).toBe(true);
        });
        /**
         * alt + up arrow to close the popup
         */
        it('Alt + Up arrow pressing', (done) => {
            keyEventArgs.action = 'hide';
            listObj.keyActionHandler(keyEventArgs);
            setTimeout(() => {
                expect(listObj.isPopupOpen).toBe(false);
                done();
            }, 450);
        });
        /**
         * alt + down arrow to open the popup
         */
        it('Alt + Down arrow pressing', (done) => {
            keyEventArgs.action = 'open';
            listObj.keyActionHandler(keyEventArgs);
            setTimeout(() => {
                expect(listObj.isPopupOpen).toBe(true);
                done();
            }, 450);
        });
    });
    describe('DropdownList incremental search', () => {
        let listObj1: any;
        let element: HTMLElement;
        let keyEventArgs: any = { preventDefault: (): void => { /** NO Code */ }, charCode: 70 };
        let searchList: { [key: string]: Object }[] = [{ text: "Algeria" }, { text: "Bangladesh" }, { text: "Finland" },
        { text: "Cuba" }, { text: "Denmark", }, { text: "Egypt" }, { text: "Armenia" }, { text: "India" }, { text: "Malaysia" }];
        let li4: HTMLElement;
        let originalTimeout: number;
        beforeAll(() => {
            originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 1100;
            element = createElement('div', { id: 'listbase', attrs: { 'tabindex': '1' } });
            document.body.appendChild(element);
        });
        afterAll(() => {
            jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
            if (element) {
                element.parentElement.remove();
            }
        });
        it('"F" key pressing ', (done) => {
            listObj1 = new DropDownList({ dataSource: searchList, fields: { text: 'text' } });
            listObj1.appendTo(element);
            li4 = listObj1.onSearch(keyEventArgs);
            setTimeout(() => {
                expect(listObj1.value).toBe("Finland");
                done();
            }, 500);
        });
        it('"A" key pressing ', (done) => {
            keyEventArgs.charCode = 65;
            setTimeout(() => {
                li4 = listObj1.onSearch(keyEventArgs);
                expect(listObj1.value).toBe("Armenia");
                done();
            }, 500);
        });
        it('"O" key pressing ', (done) => {
            keyEventArgs.charCode = 79;
            setTimeout(() => {
                li4 = listObj1.onSearch(keyEventArgs);
                expect(li4).toBe(undefined);
                done();
            }, 500);
        });
    });

    describe('SearchBox support', () => {
        describe('Basic rendering', () => {
            let listObj: DropDownList;
            let element: HTMLInputElement;
            beforeAll(() => {
                element = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
                document.body.appendChild(element);
                listObj = new DropDownList({
                    dataSource: datasource,
                    fields: { text: "text", value: "id" },
                    popupHeight: "200px",
                    allowFiltering: true,
                    debounceDelay: 0,
                    headerTemplate: 'header'
                });
                listObj.appendTo(element);
                listObj.showPopup();
            });
            it('header position while enable the searchBox', () => {
                let element = <HTMLElement[] | NodeListOf<HTMLElement>>document.querySelectorAll(".e-filter-parent")
                expect(element[0].nextElementSibling.textContent === 'header').toBe(true);
            });
            it('check search box element', () => {
                let element = <HTMLElement>document.querySelector(".e-input-filter");
                expect(!isNullOrUndefined(element)).toBe(true);
            });
            it('check search box parent element', () => {
                let element = <HTMLElement>document.querySelector(".e-input-filter");
                expect(element.parentElement.classList.contains("e-input-group")).toBe(true);
            });
            it('check search box icon element', () => {
                let element = <HTMLElement>document.querySelector(".e-input-filter");
                expect((element.nextSibling as HTMLElement).classList.contains("e-icons")).toBe(true);
            });
            it('search box wrapper insert before of list element', () => {
                let element = <HTMLElement>document.querySelector(".e-popup");
                expect((element.childNodes[0] as HTMLElement).classList.contains("e-filter-parent")).toBe(true);
            });
            afterAll(() => {
                if (element) { element.remove(); };
                document.body.innerHTML = '';
            });
        });
        describe('in-built filter support', () => {
            let keyEventArgs: any = {
                preventDefault: (): void => { /** NO Code */ },
                keyCode: 74,
                metaKey: false
            };
            let keyEvent: any = { preventDefault: (): void => { /** NO Code */ }, action: 'down' };
            let listObj: any;
            let element: HTMLInputElement;
            beforeAll(() => {
                element = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
                document.body.appendChild(element);
                listObj = new DropDownList({
                    dataSource: datasource2,
                    fields: { text: "text", value: "id" },
                    popupHeight: "200px",
                    allowFiltering: true,
                    debounceDelay: 0
                });
                listObj.appendTo(element);
                listObj.showPopup();
            });
            afterAll(() => {
                if (element) { element.remove(); };
                document.body.innerHTML = '';
            });

            it('select a searched item', (done) => {
                setTimeout(() => {
                    listObj.filterInput.value = "p";
                    listObj.onInput()
                    listObj.onFilterUp(keyEventArgs);
                    listObj.keyActionHandler(keyEvent);
                    listObj.keyActionHandler(keyEvent);
                    listObj.hidePopup();
                    setTimeout(() => {
                        expect(listObj.text === 'PERL').toBe(true);
                        done();
                    }, 250)
                }, 500)
            });
            it('filter a suggestion list while empty text', (done) => {
                setTimeout(() => {
                    listObj.showPopup();
                    setTimeout(() => {
                        listObj.filterInput.value = "";
                        listObj.onInput()
                        listObj.onFilterUp(keyEventArgs);
                        let element = document.querySelector(".e-list-parent");
                        expect(element.childNodes.length).not.toBe(0);
                        done();
                    }, 250)
                }, 250)
            });

            it('filter a suggestion list with ascending order', () => {
                listObj.sortOrder = 'Ascending';
                listObj.dataBind();
                listObj.filterInput.value = "P";
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                let element = document.querySelector(".e-list-parent");
                expect(element.childNodes[0].textContent === 'PERL').toBe(true);
                listObj.filterInput.value = '';
            });

            it('filter a suggestion list with ascending order', () => {
                listObj.sortOrder = 'Descending';
                listObj.dataBind();
                listObj.filterInput.value = "P";
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                let element = document.querySelector(".e-list-parent");
                expect(element.childNodes[element.childNodes.length - 1].textContent === 'PERL').toBe(true);
            });

            it('back space key and delete in searchBox', () => {
                let element: any;
                keyEventArgs.keyCode = 8;
                listObj.filterInput.value = "j";
                listObj.onFilterDown(keyEventArgs);
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length).not.toBe(0);

                keyEventArgs.keyCode = 46;
                listObj.onFilterDown(keyEventArgs);
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length).not.toBe(0);
            });

            it('prevent browser default behavior in searchBox keydown', () => {
                let element: any;
                keyEventArgs.keyCode = 35;
                listObj.filterInput.value = "j";
                listObj.onFilterDown(keyEventArgs);
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 36;
                listObj.onFilterDown(keyEventArgs);
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 40;
                listObj.onFilterDown(keyEventArgs);
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 38;
                listObj.onFilterDown(keyEventArgs);
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 33;
                listObj.onFilterDown(keyEventArgs);
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 13;
                listObj.onFilterDown(keyEventArgs);

                keyEventArgs.keyCode = 34;
                listObj.onFilterDown(keyEventArgs);
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 37;
                listObj.onFilterDown(keyEventArgs);
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 39;
                listObj.onFilterDown(keyEventArgs);
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);
            });

            it('skip and prevent browser default behavior in searchBox keyup', () => {
                let element: any;
                keyEventArgs.keyCode = 35;
                listObj.filterInput.value = "j";
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 36;
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 40;
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 38;
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 33;
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 34;
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 37;
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 39;
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 20;
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 16;
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 17;
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 18;
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 144;
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 9;
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 27;
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 13;
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);
            });
        });
        describe('Local data filtering', () => {
            let keyEventArgs: any = {
                preventDefault: (): void => { /** NO Code */ },
                keyCode: 74,
                metaKey: false
            };
            let keyEvent: any = { preventDefault: (): void => { /** NO Code */ }, action: 'down' };
            let listObj: any;
            let element: HTMLInputElement;
            beforeAll(() => {
                element = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
                document.body.appendChild(element);
                listObj = new DropDownList({
                    dataSource: datasource,
                    fields: { text: "text", value: "id" },
                    popupHeight: "200px",
                    allowFiltering: true,
                    debounceDelay: 0,
                    filtering: function (e: FilteringEventArgs) {
                        let query = new Query();
                        query = (e.text != "") ? query.where("text", "startswith", e.text, true) : query;
                        e.updateData(datasource2, query);
                    }
                });
                listObj.appendTo(element);
                listObj.showPopup();
            });

            it('select a searched item', (done) => {
                setTimeout(() => {
                    listObj.filterInput.value = "p";
                    listObj.onInput()
                    listObj.onFilterUp(keyEventArgs);
                    listObj.keyActionHandler(keyEvent);
                    listObj.keyActionHandler(keyEvent);
                    listObj.hidePopup();
                    setTimeout(() => {
                        expect(listObj.text === 'PERL').toBe(true);
                        listObj.showPopup();
                        done();
                    }, 250)
                }, 500)
            });
            xit('add a selected item on initial suggestion lists', (done) => {
                setTimeout(() => {
                    listObj.showPopup();
                    setTimeout(() => {
                        let element = document.querySelector(".e-list-parent");
                        expect(element.childNodes[element.childNodes.length - 1].textContent === 'PERL').toBe(true);
                        done();
                    }, 250)
                }, 250)
            });

            it('filter a suggestion list while empty text', () => {
                listObj.filterInput.value = "";
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                let element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length).not.toBe(0);
            });

            it('filter a suggestion list with ascending order', () => {
                listObj.sortOrder = 'Ascending';
                listObj.dataBind();
                listObj.filterInput.value = "P";
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                let element = document.querySelector(".e-list-parent");
                expect(element.childNodes[0].textContent === 'PERL').toBe(true);
                listObj.filterInput.value = '';
            });

            it('filter a suggestion list with ascending order', () => {
                listObj.sortOrder = 'Descending';
                listObj.dataBind();
                listObj.filterInput.value = "P";
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                let element = document.querySelector(".e-list-parent");
                expect(element.childNodes[element.childNodes.length - 1].textContent === 'PERL').toBe(true);
            });

            it('back space key and delete in searchBox', () => {
                let element: any;
                keyEventArgs.keyCode = 8;
                listObj.filterInput.value = "j";
                listObj.onFilterDown(keyEventArgs);
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length).not.toBe(0);

                keyEventArgs.keyCode = 46;
                listObj.onFilterDown(keyEventArgs);
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length).not.toBe(0);
            });

            it('prevent browser default behavior in searchBox keydown', () => {
                let element: any;
                keyEventArgs.keyCode = 35;
                listObj.filterInput.value = "j";
                listObj.onFilterDown(keyEventArgs);
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 36;
                listObj.onFilterDown(keyEventArgs);
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 40;
                listObj.onFilterDown(keyEventArgs);
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 38;
                listObj.onFilterDown(keyEventArgs);
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 33;
                listObj.onFilterDown(keyEventArgs);
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 13;
                listObj.onFilterDown(keyEventArgs);

                keyEventArgs.keyCode = 34;
                listObj.onFilterDown(keyEventArgs);
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 37;
                listObj.onFilterDown(keyEventArgs);
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 39;
                listObj.onFilterDown(keyEventArgs);
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);
            });

            it('skip and prevent browser default behavior in searchBox keyup', () => {
                let element: any;
                keyEventArgs.keyCode = 35;
                listObj.filterInput.value = "j";
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 36;
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 40;
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 38;
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 33;
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 34;
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 37;
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 39;
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 20;
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 16;
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 17;
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 18;
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 144;
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 9;
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 27;
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);

                keyEventArgs.keyCode = 13;
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                element = document.querySelector(".e-list-parent");
                expect(element.childNodes.length === 1).toBe(true);
            });

            afterAll(() => {
                if (element) { element.remove(); };
            });
        });
    });

    // mobile layout testing
    describe('mobile layout testing', () => {
        let ele: HTMLElement = document.createElement('input');
        ele.id = 'newlist';
        let listObj: any;
        let data: { [key: string]: Object }[] = [{ id: 'list1', text: 'JAVA', icon: 'icon' }, { id: 'list2', text: 'C#' },
        { id: 'list3', text: 'C++' }, { id: 'list4', text: '.NET', icon: 'icon' }, { id: 'list5', text: 'Oracle' },
        { id: 'lit2', text: 'PHP' }, { id: 'list22', text: 'Phython' }, { id: 'list32', text: 'Perl' },
        { id: 'list42', text: 'Core' }, { id: 'lis2', text: 'C' }, { id: 'list12', text: 'C##' }];
        beforeAll(() => {
            let androidPhoneUa: string = 'Mozilla/5.0 (Linux; Android 4.3; Nexus 7 Build/JWR66Y) ' +
                'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.92 Safari/537.36';
            Browser.userAgent = androidPhoneUa;
            document.body.appendChild(ele);
            listObj = new DropDownList({ dataSource: data, debounceDelay: 0, fields: { text: 'text', value: 'id' }, popupHeight: '100px' });
            listObj.appendTo('#newlist');
        });
        afterAll(() => {
            if (ele) {
                ele.remove();
            }
        })
        it('initial items choosing', (done) => {
            listObj.text = 'JAVA';
            listObj.dataBind();
            listObj.list.querySelector('ul').style.height = '100px';
            listObj.list.querySelector('ul').style.overflow = 'auto';
            listObj.list.querySelector('ul').style.display = 'block';
            listObj.showPopup();
            setTimeout(() => {
                expect(listObj.index).toBe(0);
                listObj.hidePopup();
                setTimeout(function () {
                    expect(listObj.isPopupOpen).toBe(false);
                    done();
                }, 300);
            }, 450);
        })
        it('middle items choosing', (done) => {
            listObj.text = 'Oracle';
            listObj.dataBind();
            listObj.showPopup();
            setTimeout(() => {
                expect(listObj.index).toBe(4);
                listObj.hidePopup();
                setTimeout(function () {
                    expect(listObj.isPopupOpen).toBe(false);
                    done();
                }, 300);
            }, 450);
        })
        it('end items choosing', () => {
            listObj.text = 'C';
            listObj.dataBind();
            listObj.showPopup();
            expect(listObj.index).toBe(9);
        });
        it('scrollHandler choosing', () => {
            listObj.allowFiltering = true;
            listObj.dataBind();
            listObj.scrollHandler();
            expect(listObj.index).toBe(9);
        });
    });

    describe('Mobile popup appears when scrolling', () => {
        let ele: HTMLElement = document.createElement('input');
        ele.id = 'newlist';
        let listObj: any;
        let data: { [key: string]: Object }[] = [{ id: 'list1', text: 'JAVA', icon: 'icon' }, { id: 'list2', text: 'C#' },
        { id: 'list3', text: 'C++' }, { id: 'list4', text: '.NET', icon: 'icon' }, { id: 'list5', text: 'Oracle' },
        { id: 'lit2', text: 'PHP' }, { id: 'list22', text: 'Phython' }, { id: 'list32', text: 'Perl' },
        { id: 'list42', text: 'Core' }, { id: 'lis2', text: 'C' }, { id: 'list12', text: 'C##' }];
        beforeAll(() => {
            let androidPhoneUa: string = 'Mozilla/5.0 (Linux; Android 4.3; Nexus 7 Build/JWR66Y) ' +
                'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.92 Safari/537.36';
            Browser.userAgent = androidPhoneUa;
            document.body.appendChild(ele);
            listObj = new DropDownList({
                dataSource: data, fields: { text: 'text', value: 'id' }, allowFiltering: true,
                popupHeight: '100px',
                popupWidth: '1000px',
                debounceDelay: 0
            });
            listObj.appendTo('#newlist');
        });
        afterAll(() => {
            if (ele) {
                ele.remove();
            }
        })
        it('target element in view port popup not close when scrolling', () => {
            listObj.showPopup();
            listObj.scrollHandler();
            setTimeout(function () {
                expect(listObj.isPopupOpen).toBe(true);
            }, 350);
        })
    });
    describe('Allowfiltering support in mobile', () => {
        let ele: HTMLElement = document.createElement('input');
        ele.id = 'newlist';
        let listObj: any;
        let data: { [key: string]: Object }[] = [{ id: 'list1', text: 'JAVA', icon: 'icon' }, { id: 'list2', text: 'C#' },
        { id: 'list3', text: 'C++' }, { id: 'list4', text: '.NET', icon: 'icon' }, { id: 'list5', text: 'Oracle' },
        { id: 'lit2', text: 'PHP' }, { id: 'list22', text: 'Phython' }, { id: 'list32', text: 'Perl' },
        { id: 'list42', text: 'Core' }, { id: 'lis2', text: 'C' }, { id: 'list12', text: 'C##' }];
        beforeAll(() => {
            let androidPhoneUa: string = 'Mozilla/5.0 (Linux; Android 4.3; Nexus 7 Build/JWR66Y) ' +
                'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.92 Safari/537.36';
            Browser.userAgent = androidPhoneUa;
            document.body.appendChild(ele);
            listObj = new DropDownList({
                dataSource: data, fields: { text: 'text', value: 'id' }, allowFiltering: true, debounceDelay: 0,
                popupHeight: '100px'
            });
            listObj.appendTo('#newlist');
        });
        afterAll(() => {
            if (ele) {
                ele.remove();
            }
        })
        it('allowFiltering enabled', () => {
            listObj.showPopup();
            expect(listObj.popupObj.element.style.maxHeight).toBe('100%');
            expect(listObj.popupObj.element.style.width).toBe('100%');
        })
        it('clear text & search icon in search textbox', () => {
            listObj.clearText();
            var clearElement = listObj.filterInput.parentElement.querySelector('.e-clear-icon');
            expect(clearElement.style.visibility).toBe('hidden');
            listObj.filterInput.value = 'a';
            listObj.searchLists();
            expect(clearElement.style.visibility).toBe('visible');
        })
    });
    describe('Remote Data Binding', () => {
        let ddlObj: any;
        let element: HTMLInputElement;
        let keyEvent: any = { preventDefault: (): void => { /** NO Code */ }, action: 'down', type: 'keydown' };
        beforeAll(() => {
            element = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
            document.body.appendChild(element);
            ddlObj = new DropDownList({
                dataSource: new DataManager({
                    url: 'https://services.syncfusion.com/js/production/api/Employees',
                    adaptor: new WebApiAdaptor,
                    crossDomain: true
                }),
                query: new Query().take(9),
                fields: { value: 'EmployeeID', text: 'FirstName' }
            });
            ddlObj.appendTo('#dropdownlist');
        });
        it('select the first value while press down key', (done) => {
            ddlObj.keyActionHandler(keyEvent);
            setTimeout(() => {
                //expect(ddlObj.inputElement.value !== '').toBe(true);
                done()
            }, 800);
        });
        it('popup show after actionComplete event', (done) => {
            ddlObj.showPopup();
            setTimeout(() => {
                let liElement = ddlObj.list.querySelectorAll('li');
                //expect(liElement.length > 0).toBe(true);
                done()
            }, 800);
        });
        afterAll(() => {
            if (element) {
                element.parentElement.remove();
                document.body.innerHTML = '';
            }
        });
    });
    describe('focus and blur event triggered', () => {
        describe('basic rendering', () => {
            let listObj1: any;
            let listObj2: any;
            let element1: HTMLElement;
            let empList: { [key: string]: Object }[] = [
                { id: 'level1', sports: 'American Football' }, { id: 'level2', sports: 'Badminton' },
                { id: 'level3', sports: 'Basketball' }, { id: 'level4', sports: 'Cricket' },
                { id: 'level5', sports: 'Football' }, { id: 'level6', sports: 'Golf' },
                { id: 'level7', sports: 'Hockey' }, { id: 'level8', sports: 'Rugby' },
                { id: 'level9', sports: 'Snooker' }, { id: 'level10', sports: 'Tennis' },
            ];
            let focusAction: EmitType<Object> = jasmine.createSpy('Focus');
            let blurAction: EmitType<Object> = jasmine.createSpy('Blur');
            let keyEventArgs: any = { preventDefault: (): void => { /** NO Code */ }, action: 'down' };
            let mouseEventArgs: any = { preventDefault: function () { }, target: null };
            beforeAll((done) => {
                element1 = createElement('input', { id: 'list1' });
                document.body.appendChild(element1);
                listObj1 = new DropDownList({
                    dataSource: empList,
                    fields: { text: 'sports', value: 'id' },
                    focus: focusAction,
                    blur: blurAction,
                    index: 1,
                    headerTemplate: '<span id="header">Games</span>',
                    footerTemplate: '<span id="footer"> Best game</span>',
                    valueTemplate: '<span id="value-temp">${sports}</span>',
                    debounceDelay: 0
                });
                listObj1.appendTo(element1);
                done();
            });
            afterAll(() => {
                if (element1) {
                    element1.parentElement.remove();
                    document.body.innerHTML = '';
                }
            });

            it('focus event trigger when click on dropdown input', (done) => {
                mouseEventArgs.target = listObj1.inputWrapper.container;
                listObj1.dropDownClick(mouseEventArgs);
                setTimeout(() => {
                    expect(focusAction).toHaveBeenCalled();
                    expect(listObj1.inputWrapper.container.classList.contains('e-input-focus')).toBe(true);
                    done()
                }, 450)
            });

            it('focus event hold when click on header template', () => {
                mouseEventArgs.target = document.getElementById('header');
                listObj1.onDocumentClick(mouseEventArgs);
                expect(listObj1.inputWrapper.container.classList.contains('e-input-focus')).toBe(true);
                expect(listObj1.isPopupOpen).toBe(true);
            })

            it('focus event hold when click on footer template', () => {
                mouseEventArgs.target = document.getElementById('footer');
                listObj1.onDocumentClick(mouseEventArgs);
                expect(listObj1.inputWrapper.container.classList.contains('e-input-focus')).toBe(true);
                expect(listObj1.isPopupOpen).toBe(true);
            })

            it('focus event hold when click a list', (done) => {
                let item: HTMLElement[] = listObj1.popupObj.element.querySelectorAll('li')[2];
                mouseEventArgs.target = item;
                mouseEventArgs.type = 'click';
                listObj1.onMouseClick(mouseEventArgs);
                setTimeout(() => {
                    expect(listObj1.inputWrapper.container.classList.contains('e-input-focus')).toBe(true);
                    done()
                }, 450)
            })

            it('focus event hold when click on value template', () => {
                mouseEventArgs.target = document.getElementById('value-temp');
                listObj1.onDocumentClick(mouseEventArgs);
                expect(listObj1.inputWrapper.container.classList.contains('e-input-focus')).toBe(true);
            })
            it('IE 11 issue: focus the current focus element when click on header at popup open state', (done) => {
                mouseEventArgs.target = listObj1.inputWrapper.container;
                listObj1.dropDownClick(mouseEventArgs);
                setTimeout(() => {
                    Browser.userAgent = 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; Touch; .NET4.0C; .NET4.0E; .NET CLR 2.0.50727; .NET CLR 3.0.30729; .NET CLR 3.5.30729; Tablet PC 2.0; rv:11.0) like Gecko';
                    mouseEventArgs.target = document.getElementById('header');
                    listObj1.onDocumentClick(mouseEventArgs);
                    listObj1.onBlurHandler(mouseEventArgs);
                    expect(listObj1.inputWrapper.container === document.activeElement).toBe(true);
                    expect(listObj1.inputWrapper.container.classList.contains('e-input-focus')).toBe(true);
                    done();
                }, 450)
            })
            it('IE 11 issue: focus the current focus element when click on header at popup open state with enabled the filter', (done) => {
                listObj1.hidePopup();
                setTimeout(() => {
                    listObj1.allowFiltering = true;
                    listObj1.dataBind();
                    mouseEventArgs.target = listObj1.inputWrapper.container;
                    listObj1.dropDownClick(mouseEventArgs);
                    listObj1.showPopup();
                    setTimeout(() => {
                        mouseEventArgs.target = document.getElementById('header');
                        listObj1.onDocumentClick(mouseEventArgs);
                        listObj1.onBlurHandler(mouseEventArgs);
                        expect(listObj1.filterInput === document.activeElement).toBe(true);
                        let androidPhoneUa: string = 'Mozilla/5.0 (Linux; Android 4.3; Nexus 7 Build/JWR66Y) ' +
                            'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.92 Safari/537.36';
                        Browser.userAgent = androidPhoneUa;
                        done();
                    }, 450);
                }, 450);
            })

            it('blur event trigger when click document', (done) => {
                mouseEventArgs.target = document.body;
                listObj1.onDocumentClick(mouseEventArgs);
                setTimeout(() => {
                    expect(listObj1.inputWrapper.container.classList.contains('e-input-focus')).toBe(false);
                    expect(blurAction).toHaveBeenCalled();
                    done();
                }, 400)
            })
        });
        describe('render with filtering', () => {
            let listObj1: any;
            let listObj2: any;
            let element1: HTMLElement;
            let data: string[] = ['Basketball', 'Football', 'Hockey', 'Snooker'];
            let focusAction: EmitType<Object> = jasmine.createSpy('Focus');
            let blurAction: EmitType<Object> = jasmine.createSpy('Blur');
            let keyEventArgs: any = { preventDefault: (): void => { /** NO Code */ }, action: 'down' };
            let mouseEventArgs: any = { preventDefault: function () { }, target: null };
            let originalTimeout: number;
            beforeAll((done) => {
                element1 = createElement('input', { id: 'list1' });
                document.body.appendChild(element1);
                listObj1 = new DropDownList({
                    dataSource: data,
                    focus: focusAction,
                    blur: blurAction,
                    index: 1,
                    allowFiltering: true,
                    debounceDelay: 0
                });
                listObj1.appendTo(element1);
                done();
            });
            afterAll(() => {
                if (element1) {
                    element1.parentElement.remove();
                    document.body.innerHTML = '';
                }
            });
            it('focus search box element when click dropdown input', (done) => {
                mouseEventArgs.target = listObj1.inputWrapper.container;
                listObj1.dropDownClick(mouseEventArgs);
                setTimeout(() => {
                    expect(listObj1.inputWrapper.container.classList.contains('e-input-focus')).toBe(false);
                    done()
                }, 450)
            });

            it('focus hold when click on search icon', () => {
                mouseEventArgs.target = listObj1.inputWrapper.container;
                mouseEventArgs.target = listObj1.filterInput;
                listObj1.onDocumentClick(mouseEventArgs);
                expect(listObj1.isPopupOpen).toBe(true);
            });

            it('filterBarPlaceholder property', (done) => {
                listObj1.filterBarPlaceholder = 'Search a customer';
                listObj1.dataBind();
                expect(listObj1.filterInput.getAttribute('placeholder')).toEqual(listObj1.filterBarPlaceholder);
                listObj1.hidePopup();
                setTimeout(() => {
                    done();
                }, 300)
            });
            it('filterBarPlaceholder property with allowFiltering false', (done) => {
                listObj1.allowFiltering = false;
                listObj1.filterBarPlaceholder = 'Search a customer2';
                listObj1.dataBind();
                listObj1.hidePopup();
                setTimeout(() => {
                    done();
                }, 300)
            });

            it('hold focus event when click a list', (done) => {
                mouseEventArgs.target = listObj1.inputWrapper.container;
                listObj1.dropDownClick(mouseEventArgs);
                setTimeout(() => {
                    let item: HTMLElement[] = listObj1.popupObj.element.querySelectorAll('li')[2];
                    mouseEventArgs.target = item;
                    mouseEventArgs.type = 'click';
                    listObj1.onMouseClick(mouseEventArgs);
                    setTimeout(() => {
                        expect(listObj1.inputWrapper.container.classList.contains('e-input-focus')).toBe(true);
                        done();
                    }, 450)
                }, 450)
            });

            it('hold focus event when click a back icon', (done) => {
                listObj1.showPopup();
                setTimeout(() => {
                    listObj1.clickOnBackIcon();
                    setTimeout(() => {
                        expect(listObj1.inputWrapper.container.classList.contains('e-input-focus')).toBe(true);
                        done();
                    }, 450)
                }, 400)
            });
        });
    });
    // HTMLData Binding
    describe('HTML UL element data binding', () => {
        let ele: HTMLElement = document.createElement('ul');
        ele.id = 'newlist';
        ele.innerHTML = '<li id="i1">item1</li>' +
            '<li id="i2">item2</li><li id="i3">item3</li><li id="i4">item4</li><li id="i5">item5</li>' +
            '<li>item6</li><li>item7</li>';
        let listObj: any;
        let keyEventArgs: any = { preventDefault: (): void => { /** NO Code */ }, action: 'down' };
        let mouseEventArgs: any = { preventDefault: function () { }, target: null };
        beforeAll(() => {
            document.body.appendChild(ele);
            listObj = new DropDownList();
            listObj.appendTo('#newlist');
        });
        afterAll(() => {
            if (ele) {
                let parent: HTMLElement = ele.parentElement as HTMLElement;
                parent.remove();
                document.body.innerText = '';
            }
        })
        it('rendered the ul-li data element in popup', (done) => {
            listObj.showPopup();
            setTimeout(() => {
                expect(listObj.list.querySelectorAll('.e-list-item').length).toBe(7);
                done();
            }, 450);
        });
        it('check fields value and text', () => {
            expect(listObj.fields.value === 'text').toBe(true);
            expect(listObj.fields.text === 'text').toBe(true);
        });
        it('click on list item', () => {
            let item: HTMLElement[] = listObj.popupObj.element.querySelectorAll('li')[2];
            mouseEventArgs.target = item;
            mouseEventArgs.type = 'click';
            listObj.onMouseClick(mouseEventArgs);
            expect(listObj.value === 'item3').toBe(true);
            expect(listObj.text === 'item3').toBe(true);
            expect(listObj.inputElement.value === 'item3').toBe(true);
        });
    });
    describe('datasource with number type', () => {
        let listObj: any;
        let numberData: number[] = [1001, 2001, 3001, 4001, 5001, 6001, 7001];
        let mouseEventArgs: any = { preventDefault: function () { }, target: null };
        beforeAll(() => {
            let element: HTMLElement = createElement('input', { id: 'list' });
            document.body.appendChild(element);
            listObj = new DropDownList({ dataSource: numberData, index: 2 });
            listObj.appendTo(element);
        });
        afterAll(() => {
            listObj.destroy();
            document.body.innerHTML = '';
        });
        it('Initializing as number ', () => {
            let liItem: Element = listObj.list.querySelector('li');
            expect(liItem.classList.contains('e-list-item')).toBe(true);
            expect(liItem.getAttribute('data-value')).toEqual('1001');
            expect(liItem.textContent).toEqual('1001');
            expect(listObj.value).toEqual(3001);
        });
        it('Interaction in DDL', (done) => {
            listObj.showPopup();
            setTimeout(() => {
                let item: HTMLElement[] = listObj.popupObj.element.querySelectorAll('li')[3];
                mouseEventArgs.target = item;
                mouseEventArgs.type = 'click';
                listObj.onMouseClick(mouseEventArgs);
                setTimeout(function () {
                    expect(listObj.isPopupOpen).toBe(false);
                    expect(listObj.element.value).toEqual(listObj.value.toString());
                    done();
                }, 450);
            }, 450);
        })
    })
    describe("select element Rendering", () => {
        let listObj: any;
        let element: string = "<select id='select1'><option>option1</option><option value='option2'>option2</option></select>";
        let keyEventArgs: any = { preventDefault: (): void => { /** NO Code */ }, action: 'down' };
        let mouseEventArgs: any = { preventDefault: function () { }, target: null };
        afterAll(() => {
            let select: HTMLSelectElement = document.getElementById('select1') as HTMLSelectElement;
            if (select) {
                let parent: HTMLElement = select.parentElement as HTMLElement;
                parent.remove();
            }
        });
        beforeAll(() => {
            document.body.innerHTML = element;
            let select: HTMLSelectElement = document.getElementById('select1') as HTMLSelectElement;
            document.body.appendChild(select);
            listObj = new DropDownList();
            listObj.appendTo('#select1');
        });
        it('check fields value and text', (done) => {
            listObj.showPopup();
            setTimeout(() => {
                expect(listObj.fields.value === 'value').toBe(true);
                expect(listObj.fields.text === 'text').toBe(true);
                expect(listObj.value === 'option1').toBe(true);
                expect(listObj.text === 'option1').toBe(true);
                done();
            }, 450);
        });
        it('click on list item', () => {
            let item: HTMLElement[] = listObj.popupObj.element.querySelectorAll('li')[1];
            mouseEventArgs.target = item;
            mouseEventArgs.type = 'click';
            listObj.onMouseClick(mouseEventArgs);
            expect(listObj.value === 'option2').toBe(true);
            expect(listObj.text === 'option2').toBe(true);
            expect(listObj.inputElement.value === 'option2').toBe(true);
        });
    });
    describe('DropdownList incremental search with DataManager instance', () => {
        let listObj: any;
        let popupObj: any;
        let keyEventArgs: any = { preventDefault: (): void => { /** NO Code */ }, charCode: 76, metaKey: false };
        let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
        let remoteData: DataManager = new DataManager({ 
            url: 'https://services.syncfusion.com/js/production/api/Employees',
            adaptor: new WebApiAdaptor,
            crossDomain: true 
        });
        beforeEach(() => {
            document.body.appendChild(element);
        });
        afterEach(() => {
            if (element) {
                element.remove();
                document.body.innerHTML = '';
            }
        });
        /**
         * set the search key value in text
         */
        it(' set the search key value in text ', (done) => {
            listObj = new DropDownList({ dataSource: remoteData, query: new Query().take(9), fields: { value: 'EmployeeID', text: 'FirstName' } });
            listObj.appendTo(element);
            listObj.onSearch(keyEventArgs)
            setTimeout(() => {
               // expect(listObj.text).toBe('Laura Callahan');
                done();
            }, 800);
        });
    });
    describe('Spinner support', () => {
        let ele: HTMLElement = document.createElement('input');
        ele.id = 'newlist';
        let listObj: any;
        let data: { [key: string]: Object }[] = [{ id: 'list1', text: 'JAVA', icon: 'icon' }, { id: 'list2', text: 'C#' },
        { id: 'list3', text: 'C++' }, { id: 'list4', text: '.NET', icon: 'icon' }, { id: 'list5', text: 'Oracle' },
        { id: 'lit2', text: 'PHP' }, { id: 'list22', text: 'Phython' }, { id: 'list32', text: 'Perl' },
        { id: 'list42', text: 'Core' }, { id: 'lis2', text: 'C' }, { id: 'list12', text: 'C##' }];
        beforeAll(() => {
            document.body.appendChild(ele);
            listObj = new DropDownList({
                dataSource: data, fields: { text: 'text', value: 'id' }, allowFiltering: true, debounceDelay: 0,
                popupHeight: '100px',
                filtering: function (e: FilteringEventArgs) {
                    let query = new Query();
                    query = (e.text != "") ? query.where("text", "startswith", e.text, true) : query;
                    e.updateData(data, query);
                }
            });
            listObj.appendTo('#newlist');
        });
        afterAll(() => {
            if (ele) {
                ele.remove();
            }
        })
        it(' - spinner show instead of dropdown icon at initial time', () => {
            listObj.showPopup();
            expect(isNullOrUndefined(listObj.inputWrapper.buttons[0].querySelector('e-spinner-pane'))).toBe(true);
        })
        it(' - spinner show instead of clear icon in filter bar', (done) => {
            setTimeout(() => {
                listObj.filterInput.value = 'a';
                listObj.searchLists();
                expect(isNullOrUndefined(listObj.filterInputObj.buttons[0].querySelector('e-spinner-pane'))).toBe(true);
                listObj.hidePopup();
                setTimeout(() => {
                    expect(listObj.filterInputObj === null).toBe(true);
                    done();
                }, 400);
            }, 400);
        })

        it(' - spinner show on mobile filter bar', (done) => {
            let androidPhoneUa: string = 'Mozilla/5.0 (Linux; Android 4.3; Nexus 7 Build/JWR66Y) ' +
                'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.92 Safari/537.36';
            Browser.userAgent = androidPhoneUa;
            listObj.showPopup();
            setTimeout(() => {
                listObj.filterInput.value = 'j';
                listObj.searchLists();
                expect(isNullOrUndefined(listObj.list.querySelector('e-spinner-pane'))).toBe(true);
                Browser.userAgent = navigator.userAgent;
                done();
            }, 400);
        })
    });
    describe('with group alignemnt', () => {
        let keyEventArgs: any = { preventDefault: (): void => { /** NO Code */ }, action: 'down' };
        let list: any;
        let ele: HTMLElement;
        let mouseEventArgs: any = {
            preventDefault: (): void => { /** NO Code */ },
            target: null
        };
        let scrollItemData: { [key: string]: Object }[] = [{ 'text': 'Audi A6', 'id': 'e807', 'category': 'Audi' }, { 'text': 'Audi A7', 'id': 'a0cc', 'category': 'Audi' },
        { 'text': 'BMW 501', 'id': 'f8435', 'category': 'BMW' },
        { 'text': 'BMW 502', 'id': 'f8430', 'category': 'BMW' },
        { 'text': 'BMW 3', 'id': 'b2b1', 'category': 'BMW' }];
        beforeAll(() => {
            ele = createElement('input', { id: 'DropDownList' });
            let ele1: HTMLElement = createElement('div', { id: 'dd' });
            ele1.appendChild(ele);
            ele1.style.height = '500px';
            document.body.appendChild(ele1);
            document.body.style.overflowY = 'scroll';
            document.body.style.height = '300px';
            list = new DropDownList({
                dataSource: scrollItemData,
                fields: { text: 'text', value: 'id', groupBy: 'category' },
                index: 4
            });
            list.appendTo(ele);
        });
        afterAll((done) => {
            list.hidePopup();
            setTimeout(() => {
                list.destroy();
                ele.remove();
                done();
            }, 450)
        });
        /**
       * Mouse click
       */
        it('grouping header alignment', (done) => {
            list.showPopup();
            let obj = list;
            setTimeout(() => {
                let items: Element[] = list.popupObj.element.querySelectorAll('li');
                list.list.style.overflow = 'auto';
                list.list.style.height = '48px';
                list.list.style.display = 'block';
                list.list.scrollTop = 100;
                setTimeout(() => {
                    expect((document.getElementsByClassName('e-fixed-head')[0] as any).style.zIndex === '10').toBe(true);
                    list.scrollHandler();
                    list.dataBind();
                    keyEventArgs.action = 'down';
                    list.list.scrollTop = 120;
                    list.keyActionHandler(keyEventArgs);
                    done();
                }, 100);
                list.index = 0;
                list.dataBind();
                keyEventArgs.action = 'down';
                list.list.scrollTop = 120;
                list.keyActionHandler(keyEventArgs);
                list.scrollHandler();
                list.list.scrollTop = 100;
                document.body.scrollTop = 100;
            }, 450);
        });
    });
    describe('nested data binding to fields', () => {
        let keyEventArgs: any = { preventDefault: (): void => { /** NO Code */ }, action: 'down' };
        let list: any;
        let ele: HTMLElement;
        let mouseEventArgs: any = {
            preventDefault: (): void => { /** NO Code */ },
            target: null
        };
        let complexStringData: { [key: string]: Object; }[] = [
            {
                id: '01', list: { text: 'text1' }, iconCss: 'iconClass1',
                primaryKey: { code: '001' }
            },
            {
                id: '02', list: { text: 'text2' }, iconCss: undefined,
                primaryKey: { code: '002' }
            },
            {
                id: '03', list: { text: 'text3' }, iconCss: 'iconClass3',
                primaryKey: { code: '003' }
            },
        ];
        beforeAll(() => {
            ele = createElement('input', { id: 'DropDownList' });
            document.body.appendChild(ele);
            list = new DropDownList({
                dataSource: complexStringData,
                fields: { text: 'list.text', value: 'primaryKey.code' },
                index: 0
            });
            list.appendTo(ele);
        });
        afterAll((done) => {
            list.hidePopup();
            setTimeout(() => {
                list.destroy();
                ele.remove();
                done();
            }, 450)
        });

        it('initially select the complex data of text and value fields', () => {
            expect(list.value === '001').toBe(true);
            expect(list.text === 'text1').toBe(true);
        });
        it('select the complex data of text and value fields while click on popup list', (done) => {
            list.showPopup();
            setTimeout(() => {
                let item: HTMLElement[] = list.popupObj.element.querySelectorAll('li')[1];
                mouseEventArgs.target = item;
                mouseEventArgs.type = 'click';
                list.onMouseClick(mouseEventArgs);
                expect(list.value === '002').toBe(true);
                expect(list.text === 'text2').toBe(true);
                expect(list.index === 1).toBe(true);
                expect(list.inputElement.value === 'text2').toBe(true);
                list.hidePopup();
                setTimeout(() => {
                    done()
                }, 400);
            }, 400);
        });
    });


    describe('Value get as object if selected value as 0 (I197200||EJ2-7752)', () => {
        let list: any;
        let ele: HTMLElement;
        let mouseEventArgs: any = {
            preventDefault: (): void => { /** NO Code */ },
            target: null
        };
        let countryData: { [key: string]: Object }[] = [{ value: 0, text: 'USA' }, { value: 1, text: 'UK' }];

        beforeAll(() => {
            ele = createElement('input', { id: 'DropDownList' });
            document.body.appendChild(ele);
            list = new DropDownList({
                dataSource: countryData,
                fields: { text: 'text', value: 'value' }
            });
            list.appendTo(ele);
        });

        afterAll((done) => {
            list.hidePopup();
            setTimeout(() => {
                list.destroy();
                ele.remove();
                done();
            }, 450)
        });

        it('select the 0 value item', (done) => {
            list.showPopup();
            setTimeout(() => {
                let item: HTMLElement[] = list.popupObj.element.querySelectorAll('li')[0];
                mouseEventArgs.target = item;
                mouseEventArgs.type = 'click';
                list.onMouseClick(mouseEventArgs);
                expect(list.value === 0).toBe(true);
                expect(list.text === 'USA').toBe(true);
                expect(list.index === 0).toBe(true);
                expect(list.inputElement.value === 'USA').toBe(true);
                list.hidePopup();
                setTimeout(() => {
                    done()
                }, 400);
            }, 400);
        });
    });
    describe('add the zIndex property', () => {
        let ele: HTMLElement = document.createElement('input');
        ele.id = 'newlist';
        let list: any;
        let data: { [key: string]: Object }[] = [{ id: 'list1', text: 'JAVA', icon: 'icon' }, { id: 'list2', text: 'C#' },
        { id: 'list3', text: 'C++' }, { id: 'list4', text: '.NET', icon: 'icon' }, { id: 'list5', text: 'Oracle' },
        { id: 'lit2', text: 'PHP' }, { id: 'list22', text: 'Phython' }, { id: 'list32', text: 'Perl' },
        { id: 'list42', text: 'Core' }, { id: 'lis2', text: 'C' }, { id: 'list12', text: 'C##' }];
        beforeAll(() => {
            document.body.appendChild(ele);
            list = new DropDownList({
                dataSource: data,
                fields: { text: 'text', value: 'text' },
                zIndex: 1234
            });
            list.appendTo('#newlist');
        });
        afterAll(() => {
            if (ele) {
                ele.remove();
            }
        })
        it('check zIndex on popup open', (done) => {
            list.showPopup();
            setTimeout(() => {
                expect(list.popupObj.element.style.zIndex === '1234').toBe(true);
                list.zIndex = 1333;
                list.dataBind();
                expect(list.popupObj.element.style.zIndex === '1333').toBe(true);
                done();
            }, 400);
        });
    });
    describe('validation events for args.cancel', () => {
        let keyEventArgs: any = {
            preventDefault: (): void => { /** NO Code */ },
            keyCode: 74,
            metaKey: false
        };
        let keyEvent: any = { preventDefault: (): void => { /** NO Code */ }, action: 'down' };
        let listObj: any;
        let element: HTMLInputElement;
        beforeAll(() => {
            element = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
            document.body.appendChild(element);
            listObj = new DropDownList({
                dataSource: datasource,
                fields: { text: "text", value: "id" },
                popupHeight: "200px",
                select: function (e: any) {
                    e.cancel = true;
                }
            });
            listObj.appendTo(element);
        });

        afterAll(() => {
            if (element) {
                listObj.destroy();
                element.remove();
            }
        });

        it('select event args.cancel', (done) => {
            listObj.showPopup();
            setTimeout(() => {
                let items: Element[] = listObj.popupObj.element.querySelectorAll('li');
                listObj.setSelection(items[0]);
                expect(listObj.value === null).toBe(true);
                expect(listObj.text === null).toBe(true);
                expect(listObj.index === null).toBe(true);
                done();
            }, 450);
        });
    })
    describe('filter validation events for args.cancel', () => {
        let keyEventArgs: any = {
            preventDefault: (): void => { /** NO Code */ },
            keyCode: 74,
            metaKey: false
        };
        let keyEvent: any = { preventDefault: (): void => { /** NO Code */ }, action: 'down' };
        let listObj: any;
        let element: HTMLInputElement;
        beforeAll(() => {
            element = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
            document.body.appendChild(element);
        });
        afterAll(() => {
            element.remove();
        });
        // it('filter event args.cancel', (done) => {
        //     listObj = new DropDownList({
        //         dataSource: datasource,
        //         fields: { text: "text", value: "id" },
        //         popupHeight: "200px",
        //         allowFiltering: true,
        //         filtering: function (e: FilteringEventArgs) {
        //             expect(e.cancel).toBe(false);
        //             e.cancel = true;
        //             let query = new Query();
        //             query = (e.text != "") ? query.where("text", "startswith", e.text, true) : query;
        //             e.updateData(datasource2, query);
        //         }
        //     });
        //     listObj.appendTo(element);
        //     listObj.showPopup();
        //     setTimeout(() => {
        //         listObj.filterInput.value = "p";
        //         listObj.onInput()
        //         listObj.onFilterUp(keyEventArgs);
        //         done();
        //     }, 100)
        // });
            });
    describe('open and close args.cancel', () => {
        let keyEventArgs: any = {
            preventDefault: (): void => { /** NO Code */ },
            keyCode: 74,
            metaKey: false
        };
        let keyEvent: any = { preventDefault: (): void => { /** NO Code */ }, action: 'down' };
        let listObj: any;
        let element: HTMLInputElement;
        beforeAll(() => {
            element = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
            document.body.appendChild(element);
        });
        afterAll(() => {
            element.remove();
        });
        it('open event args.cancel ', () => {
            document.body.appendChild(element);
            listObj = new DropDownList({
                dataSource: datasource2, value: 'list1', popupHeight: 100, fields: { value: 'id', text: 'text' },
                select: function (e: any) {
                    expect(e.cancel).toBe(false);
                    e.cancel = true;
                },
                open: function (e) {
                    expect(e.cancel).toBe(false);
                    e.cancel = true;
                }
            });
            listObj.appendTo(element);
            listObj.showPopup();
            listObj.destroy();
        });
        it('close event args.cancel ', () => {
            document.body.appendChild(element);
            listObj = new DropDownList({
                dataSource: datasource2, index: 5, popupHeight: 100, fields: { value: 'id', text: 'text' },
                close: function (e) {
                    expect(e.cancel).toBe(false);
                    e.cancel = true;
                }
            });
            listObj.appendTo(element);
            listObj.showPopup();
            listObj.hidePopup();
            listObj.destroy();
        });
    });
    
    // describe('ignoreAccent support', () => {
    //     let keyEventArgs: any = { preventDefault: (): void => { /** NO Code */ }, action: 'down' };
    //     let mouseEventArgs: any = { preventDefault: function () { }, target: null };
    //     let dropDowns: any;
    //     let activeElement: HTMLElement[];
    //     let e: any = { preventDefault: function () { }, target: null };
    //     let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'autocomplete' });
    //     let data: string[] = ['Åland', ' à propos', 'abacá'];
    //     beforeAll(() => {
    //         document.body.appendChild(element);
    //         dropDowns = new DropDownList({
    //             dataSource: data,
    //             ignoreAccent: true,
    //             allowFiltering: true
    //         });
    //         dropDowns.appendTo(element);
    //     });
    //     afterAll(() => {
    //         dropDowns.destroy();
    //         element.remove();
    //     });

    //     it('search diacritics data', () => {
    //         dropDowns.showPopup();
    //         dropDowns.filterInput.value = 'ä';
    //         keyEventArgs.keyCode = 67;
    //         dropDowns.onInput();
    //         dropDowns.onFilterUp(keyEventArgs);
    //             let item: HTMLElement[] = dropDowns.popupObj.element.querySelectorAll('li');
    //             expect(item.length === 2).toBe(true);
    //             mouseEventArgs.target = item[0];
    //             mouseEventArgs.type = 'click';
    //             dropDowns.onMouseClick(mouseEventArgs);
    //             expect(dropDowns.value === 'Åland').toBe(true);
    //             expect(dropDowns.inputElement.value === 'Åland').toBe(true);
    //     });
    // });

    describe('prevent right click', () => {
        let mouseEventArgs: any = { which: 3, button: 2, preventDefault: function () { }, target: null };
        let dropDowns: any;
        let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdown' });
        beforeAll(() => {
            document.body.appendChild(element);
            dropDowns = new DropDownList({
                dataSource: datasource,
                fields: { value: 'id', text: 'text' }
            });
            dropDowns.appendTo(element);
        });
        afterAll(() => {
            dropDowns.destroy();
            element.remove();
        });

        it(' click on popup button', () => {
            mouseEventArgs.target = dropDowns.inputWrapper.container;
            dropDowns.dropDownClick(mouseEventArgs);
                expect(dropDowns.isPopupOpen).toBe(false);
        });
    });


    describe('dataBound event', () => {
        let mouseEventArgs: any = { which: 3, button: 2, preventDefault: function () { }, target: null };
        let dropDowns: any;
        let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdown' });
        beforeAll(() => {
            document.body.appendChild(element);
        });
        afterAll(() => {
            dropDowns.destroy();
            element.remove();
        });

        it(' trigger on local data', (done) => {
            let isDataBound: boolean = false;
            dropDowns = new DropDownList({
                dataSource: datasource,
                fields: { value: 'id', text: 'text' },
                dataBound: () => {
                    isDataBound = true;
                }
            });
            dropDowns.appendTo(element);
            expect(isDataBound).toBe(false);
            dropDowns.showPopup();
            setTimeout(() => {
                expect(isDataBound).toBe(true);
                done();
            }, 450);
        });
        it(' trigger on remote data', (done) => {
            let remoteData: DataManager = new DataManager({ 
                url: 'https://services.syncfusion.com/js/production/api/Employees',
                adaptor: new WebApiAdaptor,
                crossDomain: true 
            });
            let isDataBound: boolean = false;
            dropDowns = new DropDownList({
                dataSource: remoteData,
                query: new Query().take(9),
                fields: { value: 'FirstName', text: 'FirstName' },
                dataBound: () => {
                    isDataBound = true;
                }
            });
            dropDowns.appendTo(element);
            //expect(isDataBound).toBe(false);
            dropDowns.showPopup();
            setTimeout(() => {
                //expect(isDataBound).toBe(true);
                done();
            }, 800);
        });
    });

    describe('event args.cancel', () => {
        let mouseEventArgs: any = { which: 3, button: 2, preventDefault: function () { }, target: null };
        let dropDowns: any;
        let e: any = { preventDefault: function () { }, target: null };
        let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdown' });
        beforeAll(() => {
            document.body.appendChild(element);
        });
        afterAll(() => {
            dropDowns.destroy();
            element.remove();
        });

        it(' filtering event', () => {
            dropDowns = new DropDownList({
                dataSource: datasource,
                allowFiltering: true,
                debounceDelay: 0,
                fields: { value: 'id', text: 'text' },
                filtering: (e: FilteringEventArgs) => {
                    e.cancel = true;
                }
            });
            dropDowns.appendTo(element);
            dropDowns.showPopup();
            dropDowns.filterInput.value = 'java';
            e.keyCode = 72;
            dropDowns.onInput();
            dropDowns.onFilterUp(e);
            expect(dropDowns.list.classList.contains(dropDownBaseClasses.noData)).toBe(false);

        });
    });

    describe('remote data : actionComplete event args.cancel', () => {
        let mouseEventArgs: any = { which: 3, button: 2, preventDefault: function () { }, target: null };
        let dropDowns: any;
        let e: any = { preventDefault: function () { }, target: null };
        let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdown' });
        beforeAll(() => {
            document.body.appendChild(element);
        });
        afterAll(() => {
            dropDowns.destroy();
            element.remove();
        });

        it(' actionComplete event', (done) => {
            let remoteData: DataManager = new DataManager({
                url: 'https://services.syncfusion.com/js/production/api/Employees',
                adaptor: new WebApiAdaptor,
                crossDomain: true
            });
            dropDowns = new DropDownList({
                dataSource: remoteData,
                allowFiltering: true,
                query: new Query().take(9),
                debounceDelay: 0,
                fields: { value: 'FirstName', text: 'FirstName' },
                actionComplete: (e: any) => {
                    e.cancel = true;
                }
            });
            dropDowns.appendTo(element);
            dropDowns.showPopup();
            setTimeout(() => {
                expect(dropDowns.isPopupOpen).toBe(false);
                done();
            }, 800)
        });
    });

    describe('remote data : actionBegin event args.cancel', () => {
        let mouseEventArgs: any = { which: 3, button: 2, preventDefault: function () { }, target: null };
        let dropDowns: any;
        let e: any = { preventDefault: function () { }, target: null };
        let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdown' });
        beforeAll(() => {
            document.body.appendChild(element);
        });
        afterAll(() => {
            dropDowns.destroy();
            element.remove();
        });
        it(' actionBegin event', (done) => {
            let remoteData: DataManager = new DataManager({ 
                url: 'https://services.syncfusion.com/js/production/api/Employees',
                adaptor: new WebApiAdaptor,
                crossDomain: true
            });
            dropDowns = new DropDownList({
                dataSource: remoteData,
                allowFiltering: true,
                query: new Query().take(9),
                debounceDelay: 0,
                fields: { value: 'FirstName', text: 'FirstName' },
                actionBegin: (e: any) => {
                    e.cancel = true;
                }
            });
            dropDowns.appendTo(element);
            dropDowns.showPopup();
            setTimeout(() => {
                expect(dropDowns.isPopupOpen).toBe(false);
                done();
            }, 800);
        });
    });

    describe('itemCreated fields event', () => {
        let mouseEventArgs: any = { which: 3, button: 2, preventDefault: function () { }, target: null };
        let dropDowns: any;
        let e: any = { preventDefault: function () { }, target: null };
        let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdown' });
        beforeAll(() => {
            document.body.appendChild(element);
        });
        afterAll(() => {
            dropDowns.destroy();
            element.remove();
        });

        it(' set disable to first item', (done) => {
            let count: number = 0;
            dropDowns = new DropDownList({
                dataSource: datasource,
                allowFiltering: true,
                debounceDelay: 0,
                fields: <Object> {
                    value: 'text', text:'text', itemCreated: (e: any) => {
                        if (count === 0) {
                            e.item.classList.add('e-disabled');
                        }
                    }
                }
            });
            dropDowns.appendTo(element);
            dropDowns.showPopup();
            setTimeout(() => {
                expect(dropDowns.list.querySelectorAll('li')[0].classList.contains('e-disabled')).toBe(true);
                done();
            }, 500);
        });
    });

    describe('created and destroy event', () => {
        let mouseEventArgs: any = { which: 3, button: 2, preventDefault: function () { }, target: null };
        let dropDowns: any;
        let e: any = { preventDefault: function () { }, target: null };
        let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdown' });
        beforeAll(() => {
            document.body.appendChild(element);
        });
        afterAll(() => {
            dropDowns.destroy();
            element.remove();
        });

        it(' trigger create event after component rendering', () => {
            let isCreated: boolean = false;
            dropDowns = new DropDownList({
                dataSource: datasource,
                fields: {
                    value: 'text'
                },
                created: () => {
                    isCreated = true;
                }
            });
            dropDowns.appendTo(element);
            expect(isCreated).toBe(true);
        });
        it(' trigger destroyed event after component destroy', (done) => {
            let isDestroy: boolean = false;
            let destroyedEvent: EmitType<Object> = jasmine.createSpy('destroyed');
            dropDowns = new DropDownList({
                dataSource: datasource,
                fields: {
                    value: 'text'
                },
                destroyed: () => {
                    isDestroy = true;
                }
            });
            dropDowns.appendTo(element);
            dropDowns.destroy();
            setTimeout(() => {
                expect(isDestroy).toBe(true);
                done();
            }, 200);
        });

    });
    describe('Grouping in DropDownList', () => {
        let dropDowns: any;
        let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdown' });
        beforeAll(() => {
            document.body.appendChild(element);
        });
        afterAll(() => {
            dropDowns.destroy();
            element.remove();
        });

        it('Render the DropDowns with grouping and sortOrder:None', (done) => {
            let groupData = [
                { vegetable: 'Cabbage', category: 'Leafy and Salad' }, { vegetable: 'Spinach', category: 'Leafy and Salad' },
                { vegetable: 'Wheatgrass', category: 'Leafy and Salad' }, { vegetable: 'Yarrow', category: 'Leafy and Salad' },
                { vegetable: 'Chickpea', category: 'Beans' }, { vegetable: 'Green bean', category: 'Beans' },
                { vegetable: 'Horse gram', category: 'Beans' }, { vegetable: 'Garlic', category: 'Bulb and Stem' },
                { vegetable: 'Nopal', category: 'Bulb and Stem' }, { vegetable: 'Onion', category: 'Bulb and Stem' }
            ];
            dropDowns = new DropDownList({
                dataSource: groupData,
                fields: { groupBy: 'category', text: 'vegetable' },
                placeholder: 'Select a vegetable'
            });
            dropDowns.appendTo(element);
            dropDowns.open = function(args: any){
                let groupElemenet: HTMLElement = dropDowns.list.querySelector(".e-list-group-item");
                let groupText: string = groupElemenet.innerText;
                expect(groupText).toEqual('Leafy and Salad');
                dropDowns.open = null;
                dropDowns.hidePopup();
                dropDowns.destroy();
                done();
            };
            dropDowns.showPopup();
        });
        it('Render the DropDowns with grouping and sortOrder:Ascending', (done) => {
            let groupData = [
                { vegetable: 'Cabbage', category: 'Leafy and Salad' }, { vegetable: 'Spinach', category: 'Leafy and Salad' },
                { vegetable: 'Wheatgrass', category: 'Leafy and Salad' }, { vegetable: 'Yarrow', category: 'Leafy and Salad' },
                { vegetable: 'Chickpea', category: 'Beans' }, { vegetable: 'Green bean', category: 'Beans' },
                { vegetable: 'Horse gram', category: 'Beans' }, { vegetable: 'Garlic', category: 'Bulb and Stem' },
                { vegetable: 'Nopal', category: 'Bulb and Stem' }, { vegetable: 'Onion', category: 'Bulb and Stem' }
            ];
            dropDowns = new DropDownList({
                dataSource: groupData,
                fields: { groupBy: 'category', text: 'vegetable' },
                placeholder: 'Select a vegetable',
                sortOrder: 'Ascending'
            });
            dropDowns.appendTo(element);
            dropDowns.open = function(args: any){
                let groupElemenet: HTMLElement = dropDowns.list.querySelector(".e-list-group-item");
                let groupText: string = groupElemenet.innerText;
                expect(groupText).toEqual('Beans');
                dropDowns.open = null;
                dropDowns.hidePopup();
                dropDowns.destroy();
                done();
            };
            dropDowns.showPopup();
        });
    });

    describe('GetItems related bug', () => {
        let element: HTMLInputElement;
        let element1: HTMLInputElement;
        let data: boolean[] = [ true, false ];
        let ddl: DropDownList;
        let ddl1: DropDownList;
        let remoteData: DataManager = new DataManager({ url: '/api/Employee', adaptor: new ODataV4Adaptor });
        beforeAll(() => {
            element = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
            document.body.appendChild(element);
            element1 = <HTMLInputElement>createElement('input', { id: 'dropdownlist1' });
            document.body.appendChild(element1);
        });
        afterAll(() => {
            document.body.innerHTML = '';
        });
        it('Check the items', () => {
            ddl = new DropDownList({
                dataSource: data
            });
            ddl.appendTo(element);
            expect(ddl.getItems().length).toBe(2);
        });
    });

    describe('Boolean value support', () => {
        let element: HTMLInputElement;
        let data: boolean[] = [ true, false ];
        let ddl: any;
        let jsonData: { [key: string]: Object; }[] = [{'id': false, 'text': 'failure'},{'id': true,
        'text': 'success'}];
        beforeAll(() => {
            element = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
            document.body.appendChild(element);
        });
        afterAll(() => {
            document.body.innerHTML = '';
        });
        it('select boolean value', () => {
            ddl = new DropDownList({
                dataSource: data,
                value: false
            });
            ddl.appendTo(element);
            expect(ddl.inputElement.value).toBe('false');
            expect(ddl.value).toBe(false);
            expect(ddl.index).toBe(1);
            expect(ddl.getDataByValue(false)).toBe(false);
        });
        it('set boolean value in dynamic way', () => {
            ddl = new DropDownList({
                dataSource: data
            });
            ddl.appendTo(element);
            ddl.setProperties({value:true});
            expect(ddl.inputElement.value).toBe('true');
            expect(ddl.value).toBe(true);
            expect(ddl.index).toBe(0);
            expect(ddl.getDataByValue(true)).toBe(true);
        });
        it('select boolean value', () => {
            ddl = new DropDownList({
                dataSource: jsonData,
                fields: {text: 'text', value: 'id'},
                value: false
            });
            ddl.appendTo(element);
            expect(ddl.inputElement.value).toBe('failure');
            expect(ddl.text).toBe('failure');
            expect(ddl.value).toBe(false);
            expect(ddl.index).toBe(0);
            expect(ddl.getDataByValue(false).text).toBe('failure');
        });
        it('set boolean value in dynamic way', () => {
            ddl= new DropDownList({
                dataSource: jsonData,
                fields: {text: 'text', value: 'id'}
            });
            ddl.appendTo(element);
            ddl.setProperties({value:true});
            expect(ddl.inputElement.value).toBe('success');
            expect(ddl.text).toBe('success');
            expect(ddl.value).toBe(true);
            expect(ddl.index).toBe(1);
            expect(ddl.getDataByValue(true).text).toBe('success');
        });
    });
    describe('Disabled with showpopup public methpd', () => {
        let element: HTMLInputElement;
        let data: boolean[] = [ true, false ];
        let ddl: any;
        let isOpen: boolean = false;
        let isFocus: boolean = false;
        let isBlur: boolean = false;
        beforeAll(() => {
            element = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
            document.body.appendChild(element);
        });
        afterAll(() => {
            document.body.innerHTML = '';
        });
        it('check popup open', () => {
            ddl = new DropDownList({
                dataSource: data,
                value: false,
                enabled: false,
                open: (): void => {
                    isOpen = true;
                }
            });
            ddl.appendTo(element);
            ddl.showPopup();
            expect(isOpen).toBe(false);
        });
        it('check focus event trigger', () => {
            ddl = new DropDownList({
                dataSource: data,
                value: false,
                enabled: false,
                focus: (): void => {
                    isFocus = true;
                }
            });
            ddl.appendTo(element);
            ddl.focusIn();
            expect(isFocus).toBe(false);
        });
        it('check blur event trigger', () => {
            ddl = new DropDownList({
                dataSource: data,
                value: false,
                enabled: false,
                blur: (): void => {
                    isBlur = true;
                }
            });
            ddl.appendTo(element);
            ddl.focusOut();
            expect(isBlur).toBe(false);
        });
    });

    describe('Check Readonly focus issue', () => {
        let element: HTMLInputElement;
        let data: boolean[] = [ true, false ];
        let ddl: DropDownList;
        beforeAll(() => {
            element = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
            document.body.appendChild(element);
        });
        afterAll(() => {
            document.body.innerHTML = '';
        });
        it('Check the items', () => {
            ddl = new DropDownList({
                dataSource: data,
                readonly: true,
                focus: (): void => {
                    expect(true).toBe(true);
                }
            });
            ddl.appendTo(element);
            ddl.focusIn();
        });
    });

    describe('Check beforeopen event', () => {
        let element: HTMLInputElement;
        let data: boolean[] = [ true, false ];
        let ddl: DropDownList;
        beforeAll(() => {
            element = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
            document.body.appendChild(element);
        });
        afterAll(() => {
            document.body.innerHTML = '';
        });
        it('Check the items', () => {
            ddl = new DropDownList({
                dataSource: data,
                beforeOpen: (): void => {
                    expect(true).toBe(true);
                }
            });
            ddl.appendTo(element);
            ddl.showPopup();
        });
    });

    describe('EJ2-12367 - Angular reset and disable combination is not working in DropDownList', () => {
        let element: HTMLInputElement;
        let ddl: any;
        beforeAll(() => {
            element = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
            document.body.appendChild(element);
            ddl = new DropDownList({
                dataSource: datasource,
                value: 'list1'
            });
            ddl.appendTo(element);
        });
        afterAll(() => {
            document.body.innerHTML = '';
        });
        it(' disable the control after set as value null and set the enabled property false', () => {
            ddl.value = null;
            ddl.enabled = false;
            ddl.dataBind();
            expect(ddl.element.classList.contains('e-disabled')).toBe(true);
        });
    });
    describe('dropdownlist same value not cleared', () => {
        let element: HTMLInputElement;
        let mouseEventArgs: any = { which: 3, button: 2, preventDefault: function () { }, target: null };
        let ddl: any;
        beforeAll(() => {
            element = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
            document.body.appendChild(element);
            ddl = new DropDownList({
                dataSource: datasource
            });
            ddl.appendTo(element);
        });
        afterAll(() => {
            document.body.innerHTML = '';
        });
        it(' same value not clear', () => {
            ddl.showPopup();
             let items: Element[] = ddl.popupObj.element.querySelectorAll('li');
                mouseEventArgs.target = items[0];
                ddl.onMouseClick(mouseEventArgs);
                expect(ddl.value ==='JAVA').toBe(true);
                ddl.value = null;
                ddl.dataBind();
                ddl.showPopup();
                expect(ddl.value === null).toBe(true);
                ddl.onMouseClick(mouseEventArgs);
                expect(ddl.value ==='JAVA').toBe(true);
                ddl.value = null;
                ddl.dataBind();
                expect(ddl.value === null).toBe(true);
        });
    });

    describe('EJ2-17776 - Check variable exists before iteration', () => {
        let listObj: DropDownList;
        let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
        beforeAll(() => {
            document.body.appendChild(element);
            listObj = new DropDownList({ dataSource: null });
            listObj.appendTo(element);
        });
        afterAll(() => {
            if (element) {
                element.remove();
                document.body.innerHTML = '';
            }
        });
        it('Check getElementByValue function', () => {
            let ele: Element = (<any>listObj).getElementByValue('car');
            expect(ele).toBe(undefined);
        });
    });

    describe('EJ2-15820 - select event not trigger issue', () => {
        let listObj: DropDownList;
        let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
        let num: number = 0;
        let e : any = { preventDefault: (): void => { /** NO Code */ } }
        beforeAll(() => {
            document.body.appendChild(element);
          
        });
        afterAll(() => {
            if (element) {
                element.remove();
                document.body.innerHTML = '';
            }
        });
        /**
         * initialize
         */
        it('check same value selection', (done) => {
            listObj = new DropDownList({
                dataSource: datasource2,
               fields: { text: "text", value: "id" },
                open: () => {
                    let items: HTMLLIElement = (<any>listObj).popupObj.element.querySelector('.e-list-parent').firstChild;
                    (<any>listObj).setSelection(items, e);
                },
                close: () => {
                    listObj.showPopup();
                },
                select: (e) => {
                    if (num === 0) {
                        num = 1;
                        listObj.hidePopup();
                    }
                    else {
                        expect(num).toBe(1);
                        done();
                    }
                    e.cancel = true;
                }
            });
            listObj.appendTo(element);
            listObj.dataBind();
            listObj.showPopup();
        });

    });

    describe('EJ2-22432 - allowFiltering not work with select element', () => {
        let keyEventArgs: any = {
            preventDefault: (): void => { /** NO Code */ },
            keyCode: 74,
            metaKey: false
        };
        let listObj: any;
        let element: HTMLSelectElement;
        beforeAll(() => {
            element = <HTMLSelectElement>createElement('select', { id: 'list' });
            element.innerHTML = `<option value="0">American Football</option>
            <option value="1">Badminton</option>
            <option value="2">Basketball</option>
            <option value="3">Cricket</option>
            <option value="4">Football</option>
            <option value="5">Golf</option>
            <option value="6">Hockey</option>
            <option value="7">Rugby</option>
            <option value="8">Snooker</option>
            <option value="9">Tennis</option>`;
            document.body.appendChild(element);
            listObj = new DropDownList({
                allowFiltering: true,
                debounceDelay: 0
            });
            listObj.appendTo(element);
            listObj.showPopup();
        });
        afterAll(() => {
            if (element) { element.remove(); };
            document.body.innerHTML = '';
        });

        it('filter a suggestion list with select element', () => {
            listObj.filterInput.value = "C";
            listObj.onInput()
            listObj.onFilterUp(keyEventArgs);
            let element = document.querySelector(".e-list-parent");
            expect(element.childNodes[0].textContent === 'Cricket').toBe(true);
        });
    });
    describe('EJ2-22523: Form reset', () => {
        let element: HTMLInputElement;
        let data: { [key: string]: Object }[] = [
            { id: 'list1', text: 'JAVA', icon: 'icon' },
            { id: 'list2', text: 'C#' },
            { id: 'list3', text: 'C++' },
            { id: 'list4', text: '.NET', icon: 'icon' },
            { id: 'list5', text: 'Oracle' }
        ];
        let listObj: DropDownList;
        beforeAll(() => {
            element = <HTMLInputElement>createElement('form', { id: 'form1' });
            element.innerHTML = `<input type="text" id="ddl">
            <input type="reset" id="resetForm"/>`;
            document.body.appendChild(element);
            listObj = new DropDownList({
                dataSource: data,
                fields: { text: "text", value: "id" },
                value: 'list2'
            });
            listObj.appendTo('#ddl');
        });
        afterAll(() => {
            document.body.innerHTML = '';
        });
        it('reset the form', (done) => {
            document.getElementById('resetForm').click();
            setTimeout(() => {
                expect((<any>listObj).inputElement.value === 'C#').toBe(true);
                done();
            });
        });
    });
    // describe('EJ2-23180 - preselect value not selected when select the value not in the list', () => {
    //     let listObj: any;
    //     let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
    //     let originalTimeout: number;
    //     beforeEach((done) => {
    //         originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    //         jasmine.DEFAULT_TIMEOUT_INTERVAL = 6000;
    //         document.body.appendChild(element);
    //         listObj = new DropDownList({
    //             dataSource: new DataManager({ url: 'https://js.syncfusion.com/demos/ejServices/Wcf/Northwind.svc/' }),
    //             query: new Query().from('Customers').select('ContactName').take(2),
    //             fields: { text: 'ContactName' },
    //             value: "Hanna Moos"
    //         });
    //         listObj.appendTo(element);
    //         done();
    //     });
    //     afterEach(() => {
    //         jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    //         if (element) {
    //             element.remove();
    //             document.body.innerHTML = '';
    //         }
    //     });
    //     it('get selected value ', (done) => {
    //         setTimeout(() => {
    //             expect(listObj.element.value === listObj.value).toBe(true);
    //             expect(listObj.liCollections.length === 3).toBe(true);
    //             done();
    //         }, 6000);
    //     });
    // });
    describe('bug(EJ2-21907): Dropdowns html5 validation attributes are added.', () => {
        let ddlObj: any;
        let ddlEle: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'ddl' });
        let empList: { [key: string]: Object }[] = [
            { Id: 'Game1', Game: 'American Football' },
            { Id: 'Game2', Game: 'Badminton' },
            { Id: 'Game3', Game: 'Basketball' },
            { Id: 'Game4', Game: 'Cricket' },
            { Id: 'Game5', Game: 'Football' }

        ];
        beforeAll(() => {
            document.body.appendChild(ddlEle);
            ddlObj = new DropDownList({
                dataSource: empList,
                fields: { text: 'Game', value: 'Id' }
            });
            ddlObj.appendTo(ddlEle);
        });
        afterAll(() => {
            if (ddlEle) {
                ddlEle.remove();
                document.body.innerHTML = '';
            }
        });
        it('Check attributes', () => {
            expect(isNullOrUndefined(ddlObj.inputWrapper.container.getAttribute('readonly'))).toBe(true);
            expect(isNullOrUndefined(ddlObj.inputWrapper.container.getAttribute('aria-placeholder'))).toBe(true);
            expect(isNullOrUndefined(ddlObj.inputWrapper.container.getAttribute('autocorrect'))).toBe(true);
            expect(isNullOrUndefined(ddlObj.inputWrapper.container.getAttribute('autocomplete'))).toBe(true);
            expect(isNullOrUndefined(ddlObj.inputWrapper.container.getAttribute('autocapitalize'))).toBe(true);
            expect(isNullOrUndefined(ddlObj.inputWrapper.container.getAttribute('spellcheck'))).toBe(true);
            expect(!isNullOrUndefined(ddlObj.inputElement.getAttribute('role'))).toBe(true);
            expect(!isNullOrUndefined(ddlObj.inputElement.getAttribute('type'))).toBe(true);
        });
    });

    describe('DDL-add item', () => {
        let count = 0;
        let ddlObj: any;
        let isChangeCalled: boolean = false;
        let ddlEle: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'ddl' });
        let empList: any = [ 'American Football', 'Badminton'];
        beforeAll(() => {
            document.body.appendChild(ddlEle);
            ddlObj = new DropDownList({
                dataSource: empList,
                showClearButton: true
            });
            ddlObj.appendTo(ddlEle);
        });
        afterAll(() => {
            ddlObj.destroy();
            ddlEle.remove();
        });

        it('Add item with string and array', () => {
            ddlObj.addItem(['Cricket', 'Basketball'], 0);
            expect(ddlObj.list.querySelectorAll('li')[0].textContent).toBe('Cricket');
            expect(ddlObj.list.querySelectorAll('li')[1].textContent).toBe('Basketball');
            expect(ddlObj.list.querySelectorAll('li').length === 4).toBe(true);
            ddlObj.addItem('Kabadi', 0);
            expect(ddlObj.list.querySelectorAll('li')[0].textContent).toBe('Kabadi');
            expect(ddlObj.list.querySelectorAll('li').length === 5).toBe(true);
        });
    });

    it('memory leak', () => {     
        profile.sample();
        let average: any = inMB(profile.averageChange)
        //Check average change in memory samples to not be over 10MB
        expect(average).toBeLessThan(10);
        let memory: any = inMB(getMemoryProfile())
        //Check the final memory usage against the first usage, there should be little change if everything was properly deallocated
        expect(memory).toBeLessThan(profile.samples[0] + 0.25);
    })
    describe('DropdownList incremental search in disabled dropdown', () => {
        let listObj: any;
        let popupObj: any;
        let datasource2: { [key: string]: Object }[] = [{ id: 'id2', text: 'PHP' }, { id: 'id1', text: 'HTML' }, { id: 'id3', text: 'PERL' },
        { id: 'list1', text: 'JAVA' }, { id: 'list2', text: 'Phython' }, { id: 'list5', text: 'Oracle' }];
        let keyEventArgs: any = { preventDefault: (): void => { /** NO Code */ }, charCode: 76 };
        let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
        beforeEach(() => {
            document.body.appendChild(element);
        });
        afterEach(() => {
            if (element) {
                element.remove();
                document.body.innerHTML = '';
            }
        });
        it('Pressing key in disabled dropdown testing ', (done) => {
            listObj = new DropDownList({ dataSource: datasource2, fields: { value: 'EmployeeID', text: 'FirstName' }, enabled : false });
            listObj.appendTo(element);
            listObj.charCode = 76;
            listObj.onSearch(keyEventArgs)
            setTimeout(() => {
                expect(listObj.text).toBe(null);
                done();
            }, 800);
        });
        it('Pressing Up key in disabled dropdown testing ', (done) => {
            listObj = new DropDownList({ dataSource: datasource2, fields: { value: 'EmployeeID', text: 'FirstName' }, enabled : false });
            listObj.appendTo(element);
            keyEventArgs.action = 'up';
            listObj.onSearch(keyEventArgs)
            setTimeout(() => {
                expect(listObj.text).toBe(null);
                done();
            }, 800);
        });
        it('Pressing Down key in disabled dropdown testing ', (done) => {
            listObj = new DropDownList({ dataSource: datasource2, fields: { value: 'EmployeeID', text: 'FirstName' }, enabled : false });
            listObj.appendTo(element);
            keyEventArgs.action = 'down';
            listObj.onSearch(keyEventArgs)
            setTimeout(() => {
                expect(listObj.text).toBe(null);
                done();
            }, 800);
        });
        it('Pressing Home key in disabled dropdown testing ', (done) => {
            listObj = new DropDownList({ dataSource: datasource2, fields: { value: 'EmployeeID', text: 'FirstName' }, enabled : false });
            listObj.appendTo(element);
            keyEventArgs.action = 'home';
            listObj.onSearch(keyEventArgs)
            setTimeout(() => {
                expect(listObj.text).toBe(null);
                done();
            }, 800);
        });
        it('Pressing End key in disabled dropdown testing ', (done) => {
            listObj = new DropDownList({ dataSource: datasource2, fields: { value: 'EmployeeID', text: 'FirstName' }, enabled : false });
            listObj.appendTo(element);
            keyEventArgs.action = 'end';
            listObj.onSearch(keyEventArgs)
            setTimeout(() => {
                expect(listObj.text).toBe(null);
                done();
            }, 800);
        });
    });

    describe('Filtering API', () => {
        let ele: HTMLElement = document.createElement('input');
        ele.id = 'newlist';
        let listObj: any;
        let e: any = { preventDefault: function () { }, target: null };
        let data: { [key: string]: Object }[] = [{ id: 'list1', text: 'JAVA', icon: 'icon' }, { id: 'list2', text: 'C#' },
        { id: 'list3', text: 'C++' }, { id: 'list4', text: '.NET', icon: 'icon' }, { id: 'list5', text: 'Oracle' },
        { id: 'lit2', text: 'PHP' }, { id: 'list22', text: 'Phython' }, { id: 'list32', text: 'Perl' },
        { id: 'list42', text: 'Core' }, { id: 'lis2', text: 'C' }, { id: 'list12', text: 'C##' }];
        beforeAll(() => {
            document.body.appendChild(ele);
            listObj = new DropDownList({
                dataSource: data, fields: { text: 'text', value: 'id' }, allowFiltering: true, debounceDelay: 0,
                popupHeight: '100px',
                filterType: 'StartsWith'
            });
            listObj.appendTo('#newlist');
        });
        afterAll(() => {
            if (ele) {
                ele.remove();
            }
        })
        it(' check the filter', () => {
            listObj.showPopup();
            listObj.filterInput.value = 'java';
            e.keyCode = 72;
            listObj.onInput();
            listObj.onFilterUp(e);
            expect(listObj.list.classList.contains(dropDownBaseClasses.noData)).toBe(false);
            expect(listObj.liCollections[0].getAttribute('data-value') === 'list1').toBe(true);
            listObj.filterType = 'Contains';
            listObj.dataBind();
            listObj.filterInput.value = 'o';
            e.keyCode = 72;
            listObj.onInput();
            listObj.onFilterUp(e);
            expect(listObj.list.classList.contains(dropDownBaseClasses.noData)).toBe(false);
            expect(listObj.liCollections.length >1).toBe(true);
            listObj.filterType = 'EndsWith';   
            listObj.dataBind();
            listObj.filterInput.value = 'n';
            e.keyCode = 72;
            listObj.onInput();
            listObj.onFilterUp(e);
            expect(listObj.list.classList.contains(dropDownBaseClasses.noData)).toBe(false);
            expect(listObj.liCollections.length >=1).toBe(true);
        });
    });
    describe('filtering', () => {
        let keyEventArgs: any = {
            preventDefault: (): void => { /** NO Code */ },
            keyCode: 74,
            metaKey: false
        };
        let keyEvent: any = { preventDefault: (): void => { /** NO Code */ }, action: 'down' };
        let listObj: any;
        let element: HTMLInputElement;
        beforeAll(() => {
            element = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
            document.body.appendChild(element);
            listObj = new DropDownList({
                dataSource: datasource,
                fields: { text: "text", value: "id" },
                popupHeight: "200px",
                allowFiltering: true,
                debounceDelay: 0,
                filtering: function (e: FilteringEventArgs) {
                    let query = new Query();
                    query = (e.text != "") ? query.where("text", "startswith", e.text, true) : query;
                    listObj.filter(datasource2, query);
                }
            });
            listObj.appendTo(element);
            listObj.showPopup();
        });

        it('using filter method', (done) => {
            setTimeout(() => {
                listObj.filterInput.value = "p";
                listObj.onInput()
                listObj.onFilterUp(keyEventArgs);
                listObj.keyActionHandler(keyEvent);
                listObj.keyActionHandler(keyEvent);
                listObj.hidePopup();
                setTimeout(() => {
                    expect(listObj.text === 'PERL').toBe(true);
                    done();
                }, 250)
            }, 500)
        });
    });
    describe('DDL-hidepopup', () => {
        let divElement: any;
        divElement = createElement('div', { id: 'divElement' });
        divElement.style.height = '900px';
        let ddlObj: any;
        let ddlEle: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'ddl' });
        let empList: any = ['American Football', 'Badminton'];
        beforeAll(() => {
            document.body.appendChild(ddlEle);
            ddlObj = new DropDownList({
                dataSource: empList,
                showClearButton: true
            });
            ddlObj.appendTo(ddlEle);
        });
        afterAll(() => {
            ddlObj.destroy();
            ddlEle.remove();
        });

        it('when crosses view port', () => {
            (<HTMLInputElement>document.getElementsByClassName('e-ddl-icon')[0]).click();
            ddlObj.showPopup();
            document.body.appendChild(divElement)
            scrollBy({top: 500, behavior: 'smooth'});
            ddlObj.popupObj.trigger('targetExitViewport');
        });
    });
    describe('Width value with unit em', () => {
        let listObj: any;
        let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
        beforeAll(() => {
            document.body.appendChild(element);
        });
        afterAll(() => {
            if (element) {
                element.remove();
                document.body.innerHTML = '';
            }
        });
        it('Set the width to unit em', () => {
            listObj = new DropDownList({ width: "30em" });
            listObj.appendTo(element);
            //expect(listObj.element.parentElement.style.width).toEqual('30em');
            listObj.width = '400px';
            listObj.dataBind();
            expect(listObj.element.parentElement.style.width).toEqual('400px');
            listObj.width = '50em';
            listObj.dataBind();
            expect(listObj.element.parentElement.style.width).toEqual('50em');
            listObj.width = '20%';
            listObj.dataBind();
            expect(listObj.element.parentElement.style.width).toEqual('20%');
            listObj.width = '30';
            listObj.dataBind();
            expect(listObj.element.parentElement.style.width).toEqual('30px');
            listObj.width = 60;
            listObj.dataBind();
            expect(listObj.element.parentElement.style.width).toEqual('60px');
        });
        it('Set the width to unit px', () => {
            listObj = new DropDownList({ width: "100px" });
            listObj.appendTo(element);
            expect(listObj.element.parentElement.style.width).toEqual('100px');
            listObj.width = '30em';
            listObj.dataBind();
            expect(listObj.element.parentElement.style.width).toEqual('30em');
            listObj.width = '200px';
            listObj.dataBind();
            expect(listObj.element.parentElement.style.width).toEqual('200px');
        });
        it('Set the width to unit %', () => {
            listObj = new DropDownList({ width: "100%" });
            listObj.appendTo(element);
            expect(listObj.element.parentElement.style.width).toEqual('100%');
            listObj.width = '200px';
            listObj.dataBind();
            expect(listObj.element.parentElement.style.width).toEqual('200px');
            listObj.width = '30em';
            listObj.dataBind();
            expect(listObj.element.parentElement.style.width).toEqual('30em');
        });
    });
	describe('Check popup opens after open event set as true', () => {
        let list: any;
        let count: number = 0;
        let ele: HTMLElement;
        beforeAll(() => {
            ele = createElement('input', { id: 'DropDownList' });
            document.body.appendChild(ele);
        });
        afterAll((done) => {
            setTimeout(() => {
                list.destroy();
                ele.remove();
                done();
            }, 450)
        });
        it('open event set as true', (done) => {
            list = new DropDownList({
                dataSource: datasource2, fields: { text: 'text', value: 'id' },
                index: 4,
                allowFiltering: true,
                debounceDelay: 0,
                open: function(e: any){
                    if (count === 2) {
                        e.cancel = true;
                    }
                },
            });
            list.appendTo(ele);
            setTimeout(() => {
            count++;
            list.showPopup();
            expect(list.beforePopupOpen).toBe(true);
            list.hidePopup();
            expect(list.beforePopupOpen).toBe(false);
            count++;
            list.showPopup();
            expect(list.beforePopupOpen).toBe(false);
            count++;
            list.showPopup();
            expect(list.beforePopupOpen).toBe(true);
            list.hidePopup();
            expect(list.beforePopupOpen).toBe(false);
                done();
        }, 450)
        });
    });
    describe('Press backspace key for delete input', () => {
        let keyEventArgs: any = {
            preventDefault: (): void => { /** NO Code */ },
            keyCode: 74,
            metaKey: false
        };
        let listObj: any;
        let element: HTMLInputElement;
        beforeAll(() => {
            element = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
            document.body.appendChild(element);
            listObj = new DropDownList({
                dataSource: datasource,
                fields: { text: "text", value: "id" },
                popupHeight: "200px",
                allowFiltering: true,
                debounceDelay: 0,
                filtering: function (e: FilteringEventArgs) {
                    let query = new Query();
                    query = (e.text != "") ? query.where("text", "startswith", e.text, true) : query;
                    listObj.filter(datasource2, query);
                }
            });
            listObj.appendTo(element);
            listObj.showPopup();
        });
        it('back space key in searchBox', () => {
            keyEventArgs.keyCode = 8;
            listObj.filterInput.value = "j";
            listObj.onFilterDown(keyEventArgs);
            listObj.onInput();
            listObj.onFilterUp(keyEventArgs);
            expect(listObj.queryString).toBe('j');
        });
    });
    describe('EJ2-33258', () => {
        let listObj: any;
        let element: HTMLInputElement;
        beforeAll(() => {
            element = <HTMLInputElement>createElement('input', { id: 'dropdownlist.list' });
            document.body.appendChild(element);
            listObj = new DropDownList({
                dataSource: datasource,
                fields: { text: "text", value: "id" },
                popupHeight: "200px",
            });
            listObj.appendTo(element);
            listObj.showPopup();
        });
        it('Invalid id testing', () => {
            expect(listObj.value === null).toBe(true);
            listObj.inputWrapper.container.click();
            listObj.showPopup();
            listObj.popupObj.element.querySelectorAll('ul li')[0].click();
            expect(listObj.value === 'list1').toBe(true)
        });
    });
    describe('EJ2-33656', () => {
        let listObj: any;
        let element: HTMLInputElement;
        let keyEventArgs: any = { preventDefault: (): void => { /** NO Code */ }, key: 'j', code: 'KeyJ', charCode: 106 };
        beforeAll(() => {
            element = <HTMLInputElement>createElement('input', { id: 'dropdownlist.list' });
            document.body.appendChild(element);
            listObj = new DropDownList({
                dataSource: datasource,
                fields: { text: "text", value: "id" },
            });
            listObj.appendTo(element);
            listObj.showPopup();
        });
        it('Readonly mode testing', () => {
            expect(listObj.value === null).toBe(true);
            listObj.inputWrapper.container.click();
            listObj.onSearch(keyEventArgs);
            expect(listObj.value === 'list1').toBe(true);
            listObj.readonly = true;
            listObj.inputWrapper.container.click();
            keyEventArgs.key = 'c';
            keyEventArgs.code = 'keyC';
            keyEventArgs.charCode = 99;
            listObj.onSearch(keyEventArgs);
            expect(listObj.value === 'list1').toBe(true);
        });
    });
    // mobile key action testing
    describe('mobile key action testing for enter key', () => {
        let keyEventArgs: any = { preventDefault: (): void => { /** NO Code */ }, action: 'down' };
        let ele: HTMLElement = document.createElement('input');
        ele.id = 'newlist';
        let listObj: any;
        let data: { [key: string]: Object }[] = [{ id: 'list1', text: 'JAVA', icon: 'icon' }, { id: 'list2', text: 'C#' },
        { id: 'list3', text: 'C++' }, { id: 'list4', text: '.NET', icon: 'icon' }, { id: 'list5', text: 'Oracle' },
        { id: 'lit2', text: 'PHP' }, { id: 'list22', text: 'Phython' }, { id: 'list32', text: 'Perl' },
        { id: 'list42', text: 'Core' }, { id: 'lis2', text: 'C' }, { id: 'list12', text: 'C##' }];
        beforeAll(() => {
            let androidPhoneUa: string = 'Mozilla/5.0 (Linux; Android 4.3; Nexus 7 Build/JWR66Y) ' +
                'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.92 Safari/537.36';
            Browser.userAgent = androidPhoneUa;
            document.body.appendChild(ele);
            listObj = new DropDownList({ 
                dataSource: data, 
                fields: { text: 'text', value: 'id' }, 
                popupHeight: '100px',
                allowFiltering: true,
                debounceDelay: 0,
                filtering: function (e: FilteringEventArgs) {
                    let query = new Query();
                    query = (e.text != "") ? query.where("text", "startswith", e.text, true) : query;
                    listObj.filter(data, query);
                }
            });
            listObj.appendTo('#newlist');
        });
        afterAll(() => {
            if (ele) {
                ele.remove();
            }
        })
        it("Enter key ", (done) => {
            listObj.value = 'J';
            listObj.dataBind();
            listObj.showPopup();
            setTimeout(() => {
                keyEventArgs.action = 'enter';
                listObj.mobileKeyActionHandler(keyEventArgs);
                setTimeout(() => {
                    expect(listObj.isPopupOpen).toBe(false);
                    done();
                }, 300);
            }, 450);
        });
    });
    describe('EJ2-33412', () => {
        let listObj: any;
        let element: HTMLInputElement;
        let keyEventArgs: any = { preventDefault: (): void => { /** NO Code */ }, key: 'j', code: 'KeyJ', charCode: 106 };
        beforeAll(() => {
            element = <HTMLInputElement>createElement('input', { id: 'dropdownlist.list' });
            document.body.appendChild(element);
            listObj = new DropDownList({
                dataSource: datasource,
                fields: { text: "text", value: "id" },
                value: 'list1'
            });
            listObj.appendTo(element);
            listObj.showPopup();
        });
        it('clear public method testing', () => {
            expect(listObj.value === 'list1').toBe(true);
            listObj.clear();
            expect(listObj.value === null).toBe(true);
        });
    });

    describe('Fixed header maintained after reopening the popup', () => {
        let listObj: any;
        let popupObj: any;
        let groupData = [
            { vegetable: 'Cabbage', category: 'Leafy and Salad' }, { vegetable: 'Chickpea', category: 'Beans' },
            { vegetable: 'Green bean', category: 'Beans' }, { vegetable: 'Horse gram', category: 'Beans' },
            { vegetable: 'Garlic', category: 'Bulb and Stem' }, { vegetable: 'Nopal', category: 'Bulb and Stem' },
            { vegetable: 'Onion', category: 'Bulb and Stem' }
        ];
        let keyEventArgs: any = { preventDefault: (): void => { /** NO Code */ }, charCode: 76 };
        let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
        beforeEach(() => {
            document.body.appendChild(element);
        });
        afterEach(() => {
            if (element) {
                element.remove();
                document.body.innerHTML = '';
            }
        });
        it('Pressing Down key in to scroll the popup down', () => {
            listObj = new DropDownList({ dataSource: groupData, fields: { groupBy: 'category', text: 'vegetable' }, popupHeight: '100px'})
            listObj.appendTo(element);
            keyEventArgs.action = 'down';
            keyEventArgs.action = 'down';
            listObj.onSearch(keyEventArgs);
            listObj.showPopup();
            expect(listObj.popupObj.element.querySelector('.e-fixed-header')).toBe(null);
        });
    });
    describe('EJ2-36604 - While giving the class name with empty space for HtmlAttributes, console error is produced.', function () {
        let listObj: any;
        beforeEach(function () {
            let inputElement: HTMLElement = createElement('input', { id: 'dropdownlist' });
            document.body.appendChild(inputElement);
        });
        afterEach(function () {
            if (listObj) {
                listObj.destroy();
                document.body.innerHTML = '';
            }
        });
        it('Entering the class name without any empty space', function () {
            listObj = new DropDownList({
                htmlAttributes: { class: 'custom-class' }
            });
            listObj.appendTo('#dropdownlist');
            expect(listObj.inputWrapper.container.classList.contains('custom-class')).toBe(true);
        });
        it('Giving empty space before and after the class name', function () {
            listObj = new DropDownList({
                htmlAttributes: { class: ' custom-class ' }
            });
            listObj.appendTo('#dropdownlist');
            expect(listObj.inputWrapper.container.classList.contains('custom-class')).toBe(true);
        });
        it('Giving more than one empty space between two class names', function () {
            listObj = new DropDownList({
                htmlAttributes: { class: 'custom-class-one      custom-class-two'}
            });
            listObj.appendTo('#dropdownlist');
            expect(listObj.inputWrapper.container.classList.contains('custom-class-one')).toBe(true);
            expect(listObj.inputWrapper.container.classList.contains('custom-class-two')).toBe(true);
        });
        it('Giving more than one empty space between two class names as well before and after the class name', function () {
            listObj = new DropDownList({
                htmlAttributes: {  class: ' custom-class-one       custom-class-two ' }
            });
            listObj.appendTo('#dropdownlist');
            expect(listObj.inputWrapper.container.classList.contains('custom-class-one')).toBe(true);
            expect(listObj.inputWrapper.container.classList.contains('custom-class-two')).toBe(true);
        });
        it('Giving only empty space  without entering any class Name', function () {
            listObj = new DropDownList({
            });
            listObj.appendTo('#dropdownlist');
            let beforeAddClass = listObj.inputWrapper.container.classList.length;
            listObj.htmlAttributes = { class: '  ' };
            listObj.appendTo('#dropdownlist');
            let AfterAddClass = listObj.inputWrapper.container.classList.length;
            expect(beforeAddClass == AfterAddClass).toBe(true);
        });
        it('Keep input as empty without entering any class Name', function () {
            listObj = new DropDownList({
            });
            listObj.appendTo('#dropdownlist');
            let beforeAddClass = listObj.inputWrapper.container.classList.length;
            listObj.htmlAttributes = { class: '' };
            listObj.appendTo('#dropdownlist');
            let AfterAddClass = listObj.inputWrapper.container.classList.length;
            expect(beforeAddClass == AfterAddClass).toBe(true);
        });
    
        it('Entering the class name without any empty space', function () {
            listObj = new DropDownList({
                cssClass: 'custom-class' 
            });
            listObj.appendTo('#dropdownlist');
            expect(listObj.inputWrapper.container.classList.contains('custom-class')).toBe(true);
        });
        it('Giving empty space before and after the class name', function () {
            listObj = new DropDownList({
                 cssClass: ' custom-class ' 
            });
            listObj.appendTo('#dropdownlist');
            expect(listObj.inputWrapper.container.classList.contains('custom-class')).toBe(true);
        });
        it('Giving more than one empty space between two class names', function () {
            listObj = new DropDownList({
                 cssClass: 'custom-class-one      custom-class-two'
            });
            listObj.appendTo('#dropdownlist');
            expect(listObj.inputWrapper.container.classList.contains('custom-class-one')).toBe(true);
            expect(listObj.inputWrapper.container.classList.contains('custom-class-two')).toBe(true);
        });
        it('Giving more than one empty space between two class names as well before and after the class name', function () {
            listObj = new DropDownList({
                 cssClass: ' custom-class-one       custom-class-two ' 
            });
            listObj.appendTo('#dropdownlist');
            expect(listObj.inputWrapper.container.classList.contains('custom-class-one')).toBe(true);
            expect(listObj.inputWrapper.container.classList.contains('custom-class-two')).toBe(true);
        });
        it('Giving only empty space  without entering any class Name', function () {
            listObj = new DropDownList({
            });
            listObj.appendTo('#dropdownlist');
            let beforeAddClass = listObj.inputWrapper.container.classList.length;
            listObj.cssClass =  '  ' ;
            listObj.appendTo('#dropdownlist');
            let AfterAddClass = listObj.inputWrapper.container.classList.length;
            expect(beforeAddClass == AfterAddClass).toBe(true);
        });
        it('Keep input as empty without entering any class Name', function () {
            listObj = new DropDownList({
            });
            listObj.appendTo('#dropdownlist');
            let beforeAddClass = listObj.inputWrapper.container.classList.length;
            listObj.cssClass =  '' ;
            listObj.appendTo('#dropdownlist');
            let AfterAddClass = listObj.inputWrapper.container.classList.length;
            expect(beforeAddClass == AfterAddClass).toBe(true);
        });
        it('Giving class name with underscore in the beginning', function () {
            listObj = new DropDownList({
                htmlAttributes : { class : '  _custom-class-one  '},
                cssClass : '   _custom-class-two  '
            });
            listObj.appendTo('#dropdownlist');
            expect(listObj.inputWrapper.container.classList.contains('_custom-class-one')).toBe(true);
            expect(listObj.inputWrapper.container.classList.contains('_custom-class-two')).toBe(true);
        });
        it('Giving class name with empty space in both cases seperatly', function () {
            listObj = new DropDownList({
                htmlAttributes : { class : '  custom-class-one  '},
                cssClass : '   custom-class-two  '
            });
            listObj.appendTo('#dropdownlist');
            expect(listObj.inputWrapper.container.classList.contains('custom-class-one')).toBe(true);
            expect(listObj.inputWrapper.container.classList.contains('custom-class-two')).toBe(true);
        });   
    });
    describe('EJ2-39852', () => {
        let ddlObj: any;
        let ddlEle: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'ddl' });
        let empList: { [key: string]: Object }[] = [
            { Id: 'Game1', Game: 'American Football' },
            { Id: 'Game2', Game: 'Badminton' },
            { Id: 'Game3', Game: 'Basketball' },
            { Id: 'Game4', Game: 'Cricket' },
            { Id: 'Game5', Game: 'Football' }
        ];
        beforeAll(() => {
            document.body.appendChild(ddlEle);
            ddlObj = new DropDownList({
                dataSource: empList,
                fields: { text: 'Game', value: 'Id' },
                allowFiltering: true,
                debounceDelay: 0
            });
            ddlObj.appendTo(ddlEle);
        });
        afterAll(() => {
            ddlObj.destroy();
            ddlEle.remove();
        });
        it('Newly added item position changes on popup open and close action when allowfiltring is enabled', () => {
            ddlObj.sortOrder = "Ascending";
            ddlObj.dataBind();
            ddlObj.addItem({Id: 'Game6', Game: 'Baseball' });
            ddlObj.showPopup();
            expect((ddlObj as any).ulElement.querySelectorAll('li').length).toBe(6);
            ddlObj.hidePopup();
            ddlObj.addItem({Id: 'Game7', Game: 'Archery' });
            ddlObj.showPopup();
            expect((ddlObj as any).ulElement.querySelectorAll('li').length).toBe(7);
            ddlObj.hidePopup();
            ddlObj.showPopup();
            expect((ddlObj as any).list.querySelectorAll('li')[1].textContent).toBe('Archery');
            expect((ddlObj as any).list.querySelectorAll('li')[3].textContent).toBe('Baseball');
        });
    });
    describe('EJ2-39852', () => {
        let keyEventArgs: any = {
            preventDefault: (): void => { /** NO Code */ },
            metaKey: false
        };
        let Country: { [key: string]: Object }[] = [
            { id: 'list1', text: 'Australia'}, { id: 'list2', text: 'Belgium' },
            { id: 'list3', text: 'Canada' }, { id: 'list4', text: 'France'}, 
            { id: 'list5', text: 'India' }];
        let listObj: any;
        let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
        beforeAll(() => {
            document.body.appendChild(element);
            listObj = new DropDownList({
                dataSource: Country,
                fields: { text: "text", value: "id" },
                popupHeight: "200px",
                allowFiltering: true,
                debounceDelay: 0,
                filtering: function (e: FilteringEventArgs) {
                    let query = new Query();
                    query = (e.text != "") ? query.where("text", "startswith", e.text, true) : query;
                    listObj.filter(((listObj).actionCompleteData.list), query);
                }
            });
            listObj.appendTo(element);
        });
        afterAll(() => {
            listObj.destroy();
            element.remove();
        });
        it('Filter newly added item from the list', () => {
            listObj.sortOrder = "Ascending";
            listObj.dataBind();
            listObj.addItem({id: 'list6', text: 'Brazil' });
            listObj.showPopup();
            listObj.filterInput.value = "b";
            keyEventArgs.keyCode = 66;
            listObj.onInput(keyEventArgs)
            listObj.onFilterUp(keyEventArgs);
            expect((listObj as any).list.querySelectorAll('li')[0].textContent).toBe('Belgium');
            expect((listObj as any).list.querySelectorAll('li')[1].textContent).toBe('Brazil');
        });
    });
    describe('EJ2-41293 : Popup did not open after focus out the component before loading the remote data' , () => {
        let listObj: any;
        let popupObj: any;
        let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
        let remoteData: DataManager = new DataManager({ 
            url: 'https://services.syncfusion.com/js/production/api/Employees',
            adaptor: new WebApiAdaptor,
            crossDomain: true 
        });
        let mouseEventArgs: any = { preventDefault: function () { }, target: null };
        beforeEach(() => {
            document.body.appendChild(element);
        });
        afterEach(() => {
            if (element) {
                element.remove();
                document.body.innerHTML = '';
            }
        });
        /**
         * remoteData binding with index
         */
        it('Open the remote dropDown after initial loading with focus out before the data loaded ', (done) => {
            listObj = new DropDownList({ dataSource: remoteData, query: new Query().take(9), fields: { value: 'EmployeeID', text: 'FirstName' } });
            listObj.appendTo(element);
            listObj.showPopup();
            mouseEventArgs.target = document.body;
            listObj.onBlurHandler(mouseEventArgs);
            //expect(listObj.isPopupOpen).toBe(false);
            listObj.showPopup();
            setTimeout(function () {
                //expect(listObj.isPopupOpen).toBe(true);
                done();
            }, 800);
            listObj.hidePopup();
            //expect(listObj.isPopupOpen).toBe(false);
            listObj.showPopup();
            setTimeout(function () {
                //expect(listObj.isPopupOpen).toBe(true);
                done();
            }, 800);            
        });
    });
    describe('bug(EJMVC-273): EJ2 Dropdown list is preventing form submission with integer data type as value property', function () {
        let listObj: any;
        beforeEach(function () {
            let inputElement: HTMLElement = createElement('input', { id: 'dropdownlist' });
            document.body.appendChild(inputElement);
            inputElement.setAttribute('data-val','true');
        });
        afterEach(function () {
            if (listObj) {
                listObj.destroy();
                document.body.innerHTML = '';
            }
        });
        it('Entering the class name without any empty space', function () {
            listObj = new DropDownList({});
            listObj.appendTo('#dropdownlist');
            expect(listObj.element.getAttribute('data-val')).toBe('false');
        });
    });
    describe('EJ2-47484', () => {
        let Country: { [key: string]: Object }[] = [
            { id: 'list1', text: 'Australia'}, { id: 'list2', text: 'Belgium' },
            { id: 'list3', text: 'Canada' }, { id: 'list4', text: 'France'}, 
            { id: 'list5', text: 'India' }];
        let listObj: any;
        let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
        beforeAll(() => {
            document.body.appendChild(element);
        });
        afterAll(() => {
            listObj.destroy();
            element.remove();
        });
        it('Testing value template after refresh', () => {
            listObj = new DropDownList({
                dataSource: Country,
                fields: { text: "text", value: "text" },
                popupHeight: "200px",
                valueTemplate : "<div class='ename'> ${text} </div>",
                value : "India",
            });
            listObj.appendTo(element);
            let valueEle: HTMLElement = listObj.element.parentElement.querySelector('.e-input-value');
            expect(valueEle.innerHTML).toEqual('<div class="ename"> India </div>');
            expect(listObj.element.parentElement.childNodes[1].classList.contains('e-input-value')).toBe(true);
            expect(listObj.element.style.display).toBe('none');
            listObj.refresh();
            expect(valueEle.innerHTML).toEqual('<div class="ename"> India </div>');
            expect(listObj.element.parentElement.childNodes[1].classList.contains('e-input-value')).toBe(true);
            expect(listObj.element.style.display).toBe('none');
        });
        it('After selected new value testing value template after refresh', () => {
            listObj = new DropDownList({
                dataSource: Country,
                fields: { text: "text", value: "text" },
                popupHeight: "200px",
                valueTemplate : "<div class='ename'> ${text} </div>",
                value : "India",
            });
            listObj.appendTo(element);
            let valueEle: HTMLElement = listObj.element.parentElement.querySelector('.e-input-value');
            expect(valueEle.innerHTML).toEqual('<div class="ename"> India </div>');
            listObj.value = 'Australia';
            listObj.dataBind();
            expect(valueEle.innerHTML).toEqual('<div class="ename"> Australia </div>');
            expect(listObj.element.parentElement.childNodes[1].classList.contains('e-input-value')).toBe(true);
            expect(listObj.element.style.display).toBe('none');            
            listObj.refresh();
            expect(valueEle.innerHTML).toEqual('<div class="ename"> Australia </div>');
            expect(listObj.element.parentElement.childNodes[1].classList.contains('e-input-value')).toBe(true);
            expect(listObj.element.style.display).toBe('none');
        });
    });
    describe('EJ2-51558 - Incremental search not working in grid', () => {
        let keyEventArgs: any = { preventDefault: (): void => { /** NO Code */ }, key: 'c', code: 'KeyC', charCode: 99 };
        let Country: { [key: string]: Object }[] = [
            {  Id : "Game1", Game :"Golf"  },
            {  Id : "Game2", Game :"Cricket"  },
            {  Id : "Game3", Game : "Tennis" },
            {  Id:  "Game4", Game :"Carrom" },
        ]
        let originalTimeout: number;
        let listObj1: any;
        let listObj2: any;
        let element1: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist1' });
        let element2: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist2' });
        beforeAll(() => {
            originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 2500;
            document.body.appendChild(element1);
            document.body.appendChild(element2);
        });
        afterAll(() => {
            jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
        });
        it('Testing the incremental search for destroy case', () => {
            listObj1 = new DropDownList({
                dataSource: Country,
                fields: { text: 'Game', value: 'Game'},
            });
            listObj1.appendTo(element1);
            expect(listObj1.value).toBe(null);
            listObj1.inputWrapper.container.click();
            listObj1.onSearch(keyEventArgs);
            expect(listObj1.value).toBe('Cricket');
            listObj1.destroy();
            listObj1 = new DropDownList({
                dataSource: Country,
                fields: { text: 'Game', value: 'Game'},
            });
            listObj1.appendTo(element1);
            listObj1.inputWrapper.container.click();
            keyEventArgs.key = 'c';
            keyEventArgs.code = 'keyC';
            keyEventArgs.charCode = 99;
            listObj1.inputWrapper.container.click();
            listObj1.onSearch(keyEventArgs);
            expect(listObj1.value).toBe('Cricket');
            listObj1.destroy();
        });
        it('Testing the incremental search for destroy case with multiple dropdown', (done) => {
            listObj1 = new DropDownList({
                dataSource: Country,
                fields: { text: 'Game', value: 'Game'},
            });
            listObj1.appendTo(element1);
            listObj2 = new DropDownList({
                dataSource: Country,
                fields: { text: 'Game', value: 'Game'},
            });
            listObj2.appendTo(element2);
            expect(listObj1.value).toBe(null);
            listObj1.inputWrapper.container.click();
            listObj1.onSearch(keyEventArgs);
            expect(listObj1.value).toBe('Cricket');
            setTimeout(() => {
                listObj2.inputWrapper.container.click();
                listObj2.onSearch(keyEventArgs);
                expect(listObj2.value).toBe('Cricket');
                listObj1.destroy();
                listObj2.inputWrapper.container.click();
                keyEventArgs.key = 'c';
                keyEventArgs.code = 'keyC';
                keyEventArgs.charCode = 99;
                setTimeout(() => {
                    listObj2.inputWrapper.container.click();
                    listObj2.onSearch(keyEventArgs);
                    expect(listObj2.value).toBe('Carrom');
                    listObj2.destroy();
                    element2.remove();
                    listObj1.destroy();
                    element1.remove();
                    done();
                }, 1000);                    
            }, 1000);
        });
    });
    describe('EJ2CORE-663-Additem method not working properly for x-template script', () => {
        let listObj: any;
        let dataSource : { [key: string]: Object }[] = [
            { text: "JavaScript", pic: "javascript", description: "It is a lightweight interpreted or JIT-compiled programming language."},
            { text: "TypeScript", pic: "typescript", description: "It is a typed superset of JavaScript that compiles to plain JavaScript."},
            { text: "Angular", pic: "angular", description: "It is a TypeScript-based open-source web application framework."},
            { text: "React", pic: "react", description: "A JavaScript library for building user interfaces. It can also render on the server using Node."},
            { text: "Vue", pic: "vue", description: "A progressive framework for building user interfaces. it is incrementally adoptable."}
        ]
        beforeAll(() => {
            let element: HTMLElement = createElement('input', { id: 'list' });
            document.body.appendChild(element);
        });
        it('AddItem testing ', () => {
            let element1: string = "<script id='xtemplate' type='text/x-template'><div class='list-wrapper'><span class='${pic} e-avatar e-avatar-xlarge e-avatar-circle'></span><span class='text'>${text}</span><span class='description'> +${description}</span></div></script>"
            document.body.innerHTML = element1;
            let select: HTMLSelectElement = document.getElementById('xtemplate') as HTMLSelectElement;
            listObj = new DropDownList({ 
                dataSource: dataSource,
                sortOrder: 'Ascending',
                width: '250px',
                index: 2,
                popupHeight: '500px',
                popupWidth: '500px',
                itemTemplate: '#xtemplate'  });
            listObj.appendTo(select);
            listObj.addItem({ text: "JavaScript1", pic: "javascript1", description: "added item" });
            expect(listObj.liCollections[2].textContent).not.toBe('#xtemplate');
            expect(listObj.liCollections[2].textContent).toBe('JavaScript1 +added item');
        });
    });
    describe('Empty popup is opened while opening the popup programmatically - EJ2React-923602', () => {
        let element: HTMLInputElement;
        let listObj: DropDownList;
        let templateDataSource: { [key: string]: Object }[] = [
            { Name: 'Andrew Fuller', Eimg: '7', Designation: 'Team Lead', Country: 'England' },
            { Name: 'Anne Dodsworth', Eimg: '1', Designation: 'Developer', Country: 'USA' },
            { Name: 'Janet Leverling', Eimg: '3', Designation: 'HR', Country: 'USA' },
            { Name: 'Laura Callahan', Eimg: '2', Designation: 'Product Manager', Country: 'USA' },
            { Name: 'Margaret Peacock', Eimg: '6', Designation: 'Developer', Country: 'USA' },
            { Name: 'Michael Suyama', Eimg: '9', Designation: 'Team Lead', Country: 'USA' },
            { Name: 'Nancy Davolio', Eimg: '4', Designation: 'Product Manager', Country: 'USA' },
            { Name: 'Robert King', Eimg: '8', Designation: 'Developer ', Country: 'England' },
            { Name: 'Steven Buchanan', Eimg: '10', Designation: 'CEO', Country: 'England' }
        ];
        beforeAll(() => {
            element = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
            document.body.appendChild(element);
            listObj = new DropDownList({
                dataSource: templateDataSource,
                fields: { text: 'Name', value: 'Eimg' },
                popupHeight: "200px",
                allowFiltering: true,
                debounceDelay: 0,
                headerTemplate: '<div class="header"> <span>Photo</span> <span class="info">Employee Info</span></div>',
                // set the template content for list items
                itemTemplate: '<div><img class="empImage"' +
                    ' src="http://npmci.syncfusion.com/development/demos/src/combobox/Employees/${Eimg}.png"' +
                    'alt="employee"/>' +
                    '<div class="ename"> ${Name} </div><div class="job"> ${Designation} </div></div>',
            });
            listObj.appendTo(element);
        });
        it("Checked Popup Li Item TextContent", function () {
            (<any>listObj).isReact = true;
            listObj.showPopup();
            expect((<any>listObj).list.querySelector('.e-list-item').textContent).not.toBe('');
            (<any>listObj).isReact = false;
        });
        afterAll(() => {
            if (element) {
                element.remove();
                document.body.innerHTML = '';
            }
        });
    });
    describe('Header and Footer template causes a popup style issue - EJ2React-923771', () => {
        let element: HTMLInputElement;
        let listObj: DropDownList;
        let templateDataSource: { [key: string]: Object }[] = [
            { Name: 'Andrew Fuller', Eimg: '7', Designation: 'Team Lead', Country: 'England' },
            { Name: 'Anne Dodsworth', Eimg: '1', Designation: 'Developer', Country: 'USA' },
            { Name: 'Janet Leverling', Eimg: '3', Designation: 'HR', Country: 'USA' },
            { Name: 'Laura Callahan', Eimg: '2', Designation: 'Product Manager', Country: 'USA' },
            { Name: 'Margaret Peacock', Eimg: '6', Designation: 'Developer', Country: 'USA' },
            { Name: 'Michael Suyama', Eimg: '9', Designation: 'Team Lead', Country: 'USA' },
            { Name: 'Nancy Davolio', Eimg: '4', Designation: 'Product Manager', Country: 'USA' },
            { Name: 'Robert King', Eimg: '8', Designation: 'Developer ', Country: 'England' },
            { Name: 'Steven Buchanan', Eimg: '10', Designation: 'CEO', Country: 'England' }
        ];
        beforeAll(() => {
            element = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
            document.body.appendChild(element);
            listObj = new DropDownList({
                dataSource: templateDataSource,
                fields: { text: 'Name', value: 'Eimg' },
                popupHeight: "270px",
                headerTemplate: '<div class="header"> <span>Photo</span> <span class="info">Employee Info</span></div>',
                // set the template content for list items
                itemTemplate: '<div><img class="empImage"' +
                    ' src="http://npmci.syncfusion.com/development/demos/src/combobox/Employees/${Eimg}.png"' +
                    'alt="employee"/>' +
                    '<div class="ename"> ${Name} </div><div class="job"> ${Designation} </div></div>',
                footerTemplate: '<div class="footer"> <span>Photo</span> <span class="info">Employee Info</span></div>',
            });
            listObj.appendTo(element);
        });
        it("Checked Popup List Height", (done) => {
            (<any>listObj).isReact = true;
            listObj.showPopup();
            setTimeout(() => {
                expect((parseInt((<any>listObj).popupHeight as string, 10)) > (parseInt((<any>listObj).list.style.maxHeight, 10))).toBe(true);
                (<any>listObj).isReact = false;
                done();
            }, 30);
        });
        afterAll(() => {
            if (element) {
                element.remove();
                document.body.innerHTML = '';
            }
        });
    });
    describe('EJ2-60347', () => {
        let dropDowns: any;
        let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdown' });
        beforeAll(() => {
            document.body.appendChild(element);
        });
        afterAll(() => {
            dropDowns.destroy();
            element.remove();
        });
        it('Need to provide the dynamic property support for groupby infields property', (done) => {
            let groupData = [
                { vegetable: 'Cabbage', category: 'Leafy and Salad' }, { vegetable: 'Spinach', category: 'Leafy and Salad' },
                { vegetable: 'Wheatgrass', category: 'Leafy and Salad' }, { vegetable: 'Yarrow', category: 'Leafy and Salad' },
                { vegetable: 'Chickpea', category: 'Beans' }, { vegetable: 'Green bean', category: 'Beans' },
                { vegetable: 'Horse gram', category: 'Beans' }, { vegetable: 'Garlic', category: 'Bulb and Stem' },
                { vegetable: 'Nopal', category: 'Bulb and Stem' }, { vegetable: 'Onion', category: 'Bulb and Stem' }
            ];
            dropDowns = new DropDownList({
                dataSource: groupData,
                fields: { text: 'vegetable' },
                placeholder: 'Select a vegetable'
            });
            dropDowns.appendTo(element);
            dropDowns.fields.groupBy = 'category';
            dropDowns.dataBind();
            dropDowns.open = function(args: any){
                let groupElemenet: HTMLElement = dropDowns.list.querySelector(".e-list-group-item");
                let groupText: string = groupElemenet.innerText;
                expect(groupText).toEqual('Leafy and Salad');
                dropDowns.open = null;
                dropDowns.hidePopup();
                dropDowns.destroy();
                done();
            };
            dropDowns.showPopup();
            });
        });
        describe('Dropdown Popup Resizing', () => {
            let listObj: any;
            let resizer: HTMLElement;
            let popupElement: HTMLElement;
            let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
            beforeAll(() => {
                document.body.appendChild(element);
                // Initialize the DropDownList with resize support
                listObj = new DropDownList({
                    dataSource: [{ id: 'id1', text: 'Item 1' }, { id: 'id2', text: 'Item 2' },{ id: 'id3', text: 'Item 3' },{ id: 'id4', text: 'Item 4' },{ id: 'id5', text: 'Item 5' }],
                    fields: { text: 'text', value: 'id'},
                    allowResize: true
                });
                listObj.appendTo(element);
            });
            it('should create resizer element when popup opens', (done) => {
                listObj.showPopup();
                popupElement = listObj.list.parentElement;
                resizer = <HTMLElement>popupElement.querySelector('.e-resizer-right.e-icons');
                expect(resizer).not.toBeNull();  // Verify the resizer element is created
                done();
            });
            it('should start resizing on mousedown', (done) => {
                listObj.showPopup();
                popupElement = listObj.list.parentElement;
                resizer = <HTMLElement>popupElement.querySelector('.e-resizer-right.e-icons');
                // Simulate mousedown event on resizer
                const mouseDownEvent = new MouseEvent('mousedown', {
                    clientX: 200,
                    clientY: 200
                });
                resizer.dispatchEvent(mouseDownEvent);
                expect(listObj.isResizing).toBe(true);  // Check if resizing starts
                done();
            });
            it('should resize popup on mouse move', (done) => {
                listObj.showPopup();
                popupElement = listObj.list.parentElement;
                resizer = <HTMLElement>popupElement.querySelector('.e-resizer-right.e-icons');
                // Simulate mousedown to start resizing
                const mouseDownEvent = new MouseEvent('mousedown', {
                    clientX: 200,
                    clientY: 200
                });
                resizer.dispatchEvent(mouseDownEvent);
                // Simulate mousemove to resize
                const mouseMoveEvent = new MouseEvent('mousemove', {
                    clientX: 300,
                    clientY: 300
                });
                document.dispatchEvent(mouseMoveEvent);
                expect(parseFloat(popupElement.style.width)).toBeGreaterThan(100);  // Width increases
                expect(parseFloat(popupElement.style.height)).toBeGreaterThan(100);  // Height increases
                expect(popupElement.style.height).toEqual(popupElement.style.maxHeight);
                done();
            });
            it('should stop resizing on mouseup', (done) => {
                listObj.showPopup();
                popupElement = listObj.list.parentElement;
                resizer = <HTMLElement>popupElement.querySelector('.e-resizer-right.e-icons');
                // Simulate mousedown to start resizing
                const mouseDownEvent = new MouseEvent('mousedown', {
                    clientX: 200,
                    clientY: 200
                });
                resizer.dispatchEvent(mouseDownEvent);
                // Simulate mouseup to stop resizing
                const mouseUpEvent = new MouseEvent('mouseup');
                document.dispatchEvent(mouseUpEvent);
                expect(listObj.isResizing).toBe(false);  // Resizing stopped
                done();
            });
            afterAll(() => {
                if (element) {
                    element.remove();
                    document.body.innerHTML = '';
                }
            });
        });        
        describe('Provide event details in open and close event arguments in dropdown components', () => {
            let listObj: any;
            let mouseEventArgs: any = {
                preventDefault: (): void => { /** NO Code */ },
                target: null
            };
            let eventDetails : any;
            let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
            beforeEach(() => {
                document.body.appendChild(element);
                listObj = new DropDownList({ dataSource: datasource2,  open: (e: PopupEventArgs) => {
                    eventDetails = e.event;
                },
                close: (e: PopupEventArgs) => {
                    eventDetails = e.event;
                }});
                listObj.appendTo(element);
            });
            afterEach(() => {
                if (element) {
                    element.remove();
                    document.body.innerHTML = '';
                }
            });
            it('open popup by alt+down key ', (done) => {
                let keyEventArgs: any = {
                    preventDefault: (): void => { /** NO Code */ },
                    keyCode: 74,
                    action: 'open',
                    type: 'keydown'
                };
                listObj.keyActionHandler(keyEventArgs);
                setTimeout(() => {
                expect(!isNullOrUndefined(eventDetails)).toBe(true);
                eventDetails = null;
                keyEventArgs.action = 'hide';
                listObj.keyActionHandler(keyEventArgs);
                expect(!isNullOrUndefined(eventDetails)).toBe(true);
                eventDetails = null;
                done();
               }, 450);
            });
            it('mouse click on input', (done) => {
                mouseEventArgs.target = listObj.inputWrapper.buttons[0];
                listObj.dropDownClick(mouseEventArgs);
                setTimeout(() => {
                expect(!isNullOrUndefined(eventDetails)).toBe(true);
                done();
                }, 250);
            });
        });
        describe('Disable items', () => {       
            let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
            let listObj: any;
            let sportsData: { [key: string]: Object }[] = [ 
                { "State": false, "Game": "American Football", "Id" : 'Game1' },
                { "State": false, "Game": "Badminton", "Id" : 'Game2' },
                { "State": false, "Game": "Basketball", "Id" : 'Game3' },
                { "State": true, "Game": "Cricket", "Id" : 'Game4' },
                { "State": false, "Game": "Football", "Id" : 'Game5' },
                { "State": false, "Game": "Golf", "Id" : 'Game6' },
                { "State": true, "Game": "Hockey", "Id" : 'Game7' },
                { "State": false, "Game": "Rugby", "Id" : 'Game8' },
                { "State": false, "Game": "Snooker", "Id" : 'Game9' },
                { "State": false, "Game": "Tennis", "Id" : 'Game10' } 
            
            ]; 
            beforeAll(() => {
                document.body.appendChild(element);
                listObj = new DropDownList({
                    dataSource: sportsData,
                    fields: { value: 'Id', text: 'Game', disabled: 'State' },
                });
                listObj.appendTo(element);
            });
            afterAll((done) => {
                listObj.hidePopup();
                setTimeout(() => {
                    listObj.destroy();
                    element.remove();
                    done();
                }, 450)
            });
            /**
           * Mouse click
           */
            it('checked with disableItem method', (done) => {             
                listObj.showPopup();
                setTimeout(() => {
                    expect(listObj.list.querySelectorAll('.e-list-item:not(.e-disabled)').length).toBe(8);
                    listObj.disableItem("Game4");
                    expect(listObj.liCollections[3].classList.contains('e-disabled')).toBe(true);
                    expect(listObj.liCollections[3].getAttribute('aria-selected')).toBe('false');
                    expect(listObj.liCollections[3].getAttribute('aria-disabled')).toBe('true');
                    expect(listObj.liCollections[6].classList.contains('e-disabled')).toBe(true);
                    expect(listObj.liCollections[6].getAttribute('aria-selected')).toBe('false');
                    expect(listObj.liCollections[6].getAttribute('aria-disabled')).toBe('true');
                    expect(listObj.list.querySelectorAll('.e-list-item:not(.e-disabled)').length).toBe(8);
                    listObj.disableItem({ "State": true, "Game": "Hockey", "Id" : 'Game7' });
                    expect(listObj.list.querySelectorAll('.e-list-item:not(.e-disabled)').length).toBe(8);
                    listObj.disableItem(0);
                    expect(listObj.liCollections[0].classList.contains('e-disabled')).toBe(true);
                    expect(listObj.liCollections[0].getAttribute('aria-selected')).toBe('false');
                    expect(listObj.liCollections[0].getAttribute('aria-disabled')).toBe('true');
                    expect(listObj.list.querySelectorAll('.e-list-item:not(.e-disabled)').length).toBe(7);
                    listObj.disableItem("Game8");
                    expect(listObj.liCollections[7].classList.contains('e-disabled')).toBe(true);
                    expect(listObj.liCollections[7].getAttribute('aria-selected')).toBe('false');
                    expect(listObj.liCollections[7].getAttribute('aria-disabled')).toBe('true');
                    expect(listObj.list.querySelectorAll('.e-list-item:not(.e-disabled)').length).toBe(6);
                    listObj.disableItem({ "State": false, "Game": "Tennis", "Id": 'Game10' });
                    expect(listObj.liCollections[9].classList.contains('e-disabled')).toBe(true);
                    expect(listObj.list.querySelectorAll('.e-list-item:not(.e-disabled)').length).toBe(5);
                    listObj.disableItem(0);
                    expect(listObj.list.querySelectorAll('.e-list-item:not(.e-disabled)').length).toBe(5);
                    listObj.disableItem("Game8");
                    expect(listObj.list.querySelectorAll('.e-list-item:not(.e-disabled)').length).toBe(5);
                    listObj.disableItem({ "State": false, "Game": "Tennis", "Id": 'Game10' });
                    expect(listObj.list.querySelectorAll('.e-list-item:not(.e-disabled)').length).toBe(5);
                    listObj.disableItem(listObj.liCollections[8]);
                    expect(listObj.liCollections[8].classList.contains('e-disabled')).toBe(true);
                    expect(listObj.liCollections[8].getAttribute('aria-selected')).toBe('false');
                    expect(listObj.liCollections[8].getAttribute('aria-disabled')).toBe('true');
                    expect(listObj.list.querySelectorAll('.e-list-item:not(.e-disabled)').length).toBe(4);
                    done();
                }, 450);
            });
        }); 
        describe('Disable items', function () {
            let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
            let listObj: any;
            let sportsData: { [key: string]: Object }[] = [ 
                { "State": false, "Game": "American Football", "Id" : 'Game1' },
                { "State": false, "Game": "Badminton", "Id" : 'Game2' },
                { "State": false, "Game": "Basketball", "Id" : 'Game3' },
                { "State": true, "Game": "Cricket", "Id" : 'Game4' },
                { "State": false, "Game": "Football", "Id" : 'Game5' },
                { "State": false, "Game": "Golf", "Id" : 'Game6' },
                { "State": true, "Game": "Hockey", "Id" : 'Game7' },
                { "State": false, "Game": "Rugby", "Id" : 'Game8' },
                { "State": false, "Game": "Snooker", "Id" : 'Game9' },
                { "State": false, "Game": "Tennis", "Id" : 'Game10' } 
            
            ]; 
            beforeAll(() => {
                document.body.appendChild(element);
                listObj = new DropDownList({
                    dataSource: sportsData,
                    fields: { value: 'Id', text: 'Game', disabled: 'State' },
                    value: 'Game7',
                });
                listObj.appendTo(element);
            });
            afterAll((done) => {
                listObj.hidePopup();
                setTimeout(() => {
                    listObj.destroy();
                    element.remove();
                    done();
                }, 450)
            });
            it('checked with value binding', function (done) { 
                setTimeout(function () {
                    expect(listObj.value).toBe(null);
                    listObj.value = "Game4";
                    listObj.dataBind();
                    expect(listObj.value === null).toBe(true);
                    listObj.value = "Game1";
                    listObj.dataBind();
                    listObj.disableItem(0);
                    expect(listObj.value === null).toBe(true);
                    done();
                }, 450);
            });
        }); 
        describe('Disable items with incremental search', function () {
            let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
            let listObj: any;
            let keyEventArgs: any = { preventDefault: (): void => { /** NO Code */ }, charCode: 70 };
            let sportsData: { [key: string]: Object }[] = [ 
                { "State": true, "Game": "American Football", "Id" : 'Game1' },
                { "State": false, "Game": "Badminton", "Id" : 'Game2' },
                { "State": false, "Game": "Basketball", "Id" : 'Game3' },
                { "State": true, "Game": "Cricket", "Id" : 'Game4' },
                { "State": false, "Game": "Football", "Id" : 'Game5' },
                { "State": false, "Game": "Golf", "Id" : 'Game6' },
                { "State": true, "Game": "Hockey", "Id" : 'Game7' },
                { "State": false, "Game": "Rugby", "Id" : 'Game8' },
                { "State": false, "Game": "Snooker", "Id" : 'Game9' },
                { "State": false, "Game": "Tennis", "Id" : 'Game10' } 
            
            ]; 
            beforeAll(() => {
                document.body.appendChild(element);
                listObj = new DropDownList({
                    dataSource: sportsData,
                    fields: { value: 'Id', text: 'Game', disabled: 'State' },
                });
                listObj.appendTo(element);
            });
            afterAll((done) => {
                listObj.hidePopup();
                setTimeout(() => {
                    listObj.destroy();
                    element.remove();
                    done();
                }, 450)
            });
            it('"C" key pressing ', (done) => {
                keyEventArgs.charCode = 67;                
                setTimeout(() => {
                    listObj.onSearch(keyEventArgs);
                    expect(listObj.value).toBe(null);
                    done();
                }, 500);
            });
            it('"A" key pressing ', (done) => {
                keyEventArgs.charCode = 66;                
                setTimeout(() => {
                    listObj.onSearch(keyEventArgs);
                    expect(listObj.value).toBe(null);
                    done();
                }, 700);
            });
            it('"B" key pressing ', (done) => {
                keyEventArgs.charCode = 66;               
                setTimeout(() => {
                    listObj.onSearch(keyEventArgs); 
                    expect(listObj.value).toBe('Game2');
                    listObj.disableItem(1);
                    done();
                }, 700);
            });
            it('"B" key pressing ', (done) => {               
                setTimeout(() => {
                    listObj.onSearch(keyEventArgs);
                    expect(listObj.value).toBe('Game3');
                    done();
                }, 500);
            });
            it('"C" key pressing ', (done) => {
                keyEventArgs.charCode = 66;                
                setTimeout(() => {
                    listObj.onSearch(keyEventArgs);
                    expect(listObj.value).toBe('Game3');
                    done();
                }, 500);
            });
        });  
        describe('Disable items with allowfiltering', function () {
            let keyEventArgs: any = { preventDefault: (): void => { /** NO Code */ }, action: 'escape' };
            let mouseEventArgs: any = { preventDefault: function () { }, target: null };
            let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
            let listObj: any;
            let sportsData: { [key: string]: Object }[] = [ 
                { "State": false, "Game": "American Football", "Id" : 'Game1' },
                { "State": false, "Game": "Badminton", "Id" : 'Game2' },
                { "State": false, "Game": "Basketball", "Id" : 'Game3' },
                { "State": true, "Game": "Cricket", "Id" : 'Game4' },
                { "State": false, "Game": "Football", "Id" : 'Game5' },
                { "State": false, "Game": "Golf", "Id" : 'Game6' },
                { "State": true, "Game": "Hockey", "Id" : 'Game7' },
                { "State": false, "Game": "Rugby", "Id" : 'Game8' },
                { "State": false, "Game": "Snooker", "Id" : 'Game9' },
                { "State": false, "Game": "Tennis", "Id" : 'Game10' } 
            
            ]; 
            beforeAll(() => {
                document.body.appendChild(element);
                listObj = new DropDownList({
                    dataSource: sportsData,
                    fields: { value: 'Id', text: 'Game', disabled: 'State' },
                    allowFiltering: true,
                    debounceDelay: 0
                });
                listObj.appendTo(element);
            });
            afterAll((done) => {
                listObj.hidePopup();
                setTimeout(() => {
                    listObj.destroy();
                    element.remove();
                    done();
                }, 450)
            });
            it('to check the mouse click action', function (done) { 
                setTimeout(function () {
                    listObj.showPopup();
                    listObj.filterInput.value = "r";
                    listObj.onInput()
                    listObj.onFilterUp(keyEventArgs);
                    mouseEventArgs.target = listObj.popupObj.element.querySelectorAll('li')[0];
                    listObj.onMouseClick(mouseEventArgs);
                    expect(listObj.liCollections[0].classList.contains('e-active')).toBe(true);
                    listObj.showPopup();
                    listObj.filterInput.value = "c";
                    listObj.onInput()
                    listObj.onFilterUp(keyEventArgs);
                    mouseEventArgs.target = listObj.liCollections[0];
                    listObj.onMouseClick(mouseEventArgs);
                    expect(listObj.liCollections[0].classList.contains('e-active')).toBe(false);
                    expect(listObj.liCollections[0].classList.contains('e-disabled')).toBe(true);
                    done();
                }, 450);
            });
        });
        describe('Disable items with allowfiltering', function () {
            let keyEventArgs: any = { preventDefault: (): void => { /** NO Code */ }, action: 'escape' };
            let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
            let listObj: any;
            let sportsData: { [key: string]: Object }[] = [ 
                { "State": false, "Game": "American Football", "Id" : 'Game1' },
                { "State": false, "Game": "Badminton", "Id" : 'Game2' },
                { "State": false, "Game": "Basketball", "Id" : 'Game3' },
                { "State": true, "Game": "Cricket", "Id" : 'Game4' },
                { "State": false, "Game": "Football", "Id" : 'Game5' },
                { "State": false, "Game": "Golf", "Id" : 'Game6' },
                { "State": true, "Game": "Hockey", "Id" : 'Game7' },
                { "State": false, "Game": "Rugby", "Id" : 'Game8' },
                { "State": false, "Game": "Snooker", "Id" : 'Game9' },
                { "State": false, "Game": "Tennis", "Id" : 'Game10' } 
            
            ]; 
            beforeAll(() => {
                document.body.appendChild(element);
                listObj = new DropDownList({
                    dataSource: sportsData,
                    fields: { value: 'Id', text: 'Game', disabled: 'State' },
                    allowFiltering: true,
                    debounceDelay: 0
                });
                listObj.appendTo(element);
            });
            afterAll((done) => {
                listObj.hidePopup();
                setTimeout(() => {
                    listObj.destroy();
                    element.remove();
                    done();
                }, 450)
            });
            it('to check the enabled value with enter key action', function (done) { 
                listObj.showPopup();
                setTimeout(function () {
                    listObj.filterInput.value = "s";
                    listObj.onInput()
                    listObj.onFilterUp(keyEventArgs); 
                    keyEventArgs.action = 'enter';
                    listObj.keyActionHandler(keyEventArgs);
                    expect(listObj.liCollections[0].classList.contains('e-active')).toBe(true);
                    done();
                }, 200);
            });
            it('to check the diabled value with enter key action', function (done) { 
                setTimeout(function () {
                    listObj.showPopup();
                    listObj.filterInput.value = "c";
                    listObj.onInput()
                    listObj.onFilterUp(keyEventArgs); 
                    keyEventArgs.action = 'enter';
                    listObj.keyActionHandler(keyEventArgs);
                    expect(listObj.liCollections[0].classList.contains('e-active')).toBe(false);
                    expect(listObj.liCollections[0].classList.contains('e-disabled')).toBe(true);
                    done();
                }, 400);
            });
        });   
        describe('Disable Items', function () {      
            let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
            let listObj: any;
            let sportsData: { [key: string]: Object }[] = [ 
                { "State": false, "Game": "American Football", "Id" : 'Game1' },
                { "State": false, "Game": "Badminton", "Id" : 'Game2' },
                { "State": false, "Game": "Basketball", "Id" : 'Game3' },
                { "State": true, "Game": "Cricket", "Id" : 'Game4' },
                { "State": false, "Game": "Football", "Id" : 'Game5' },
                { "State": false, "Game": "Golf", "Id" : 'Game6' },
                { "State": true, "Game": "Hockey", "Id" : 'Game7' },
                { "State": false, "Game": "Rugby", "Id" : 'Game8' },
                { "State": false, "Game": "Snooker", "Id" : 'Game9' },
                { "State": false, "Game": "Tennis", "Id" : 'Game10' } 
            
            ]; 
            beforeAll(() => {
                document.body.appendChild(element);
                listObj = new DropDownList({
                    dataSource: sportsData,
                    fields: { value: 'Id', text: 'Game', disabled: 'State' },
                    value: { "State": true, "Game": "Hockey", "Id" : 'Game7' },
                    allowObjectBinding: true,
                });
                listObj.appendTo(element);
            });
            afterAll((done) => {
                listObj.hidePopup();
                setTimeout(() => {
                    listObj.destroy();
                    element.remove();
                    done();
                }, 450)
            });
            it('checked with object value binding', function (done) {   
                setTimeout(function () {
                    expect(listObj.value).toBe(null);
                    listObj.value = { "State": true, "Game": "Cricket", "Id" : 'Game4' };
                    listObj.dataBind();
                    expect(listObj.value === null).toBe(true);
                    listObj.value = { "State": false, "Game": "American Football", "Id" : 'Game1' };
                    listObj.dataBind();
                    listObj.disableItem(0);
                    expect(listObj.value === null).toBe(true);
                    done();
                }, 450);
            });
        });
        describe('Disable items', function () {        
            let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
            let listObj: any;
            let sportsData: { [key: string]: Object }[] = [ 
                { "State": false, "Game": "American Football", "Id" : 'Game1' },
                { "State": false, "Game": "Badminton", "Id" : 'Game2' },
                { "State": false, "Game": "Basketball", "Id" : 'Game3' },
                { "State": true, "Game": "Cricket", "Id" : 'Game4' },
                { "State": false, "Game": "Football", "Id" : 'Game5' },
                { "State": false, "Game": "Golf", "Id" : 'Game6' },
                { "State": true, "Game": "Hockey", "Id" : 'Game7' },
                { "State": false, "Game": "Rugby", "Id" : 'Game8' },
                { "State": false, "Game": "Snooker", "Id" : 'Game9' },
                { "State": false, "Game": "Tennis", "Id" : 'Game10' } 
            
            ]; 
            beforeAll(() => {
                document.body.appendChild(element);
                listObj = new DropDownList({
                    dataSource: sportsData,
                    fields: { value: 'Id', text: 'Game', disabled: 'State' },
                    text: "Hockey",
                });
                listObj.appendTo(element);
            });
            afterAll((done) => {
                listObj.hidePopup();
                setTimeout(() => {
                    listObj.destroy();
                    element.remove();
                    done();
                }, 450)
            });
            it('checked with text binding', function (done) {
                setTimeout(function () {
                    expect(listObj.value).toBe(null);
                    listObj.text = "Cricket";
                    listObj.dataBind();
                    expect(listObj.value === null).toBe(true);
                    listObj.text = "American Football";
                    listObj.dataBind();
                    listObj.disableItem("Game1");
                    expect(listObj.value === null).toBe(true);
                    done();
                }, 450);
            });
        });
        describe('Disable items', function () {         
            let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
            let listObj: any;
            let sportsData: { [key: string]: Object }[] = [ 
                { "State": false, "Game": "American Football", "Id" : 'Game1' },
                { "State": false, "Game": "Badminton", "Id" : 'Game2' },
                { "State": false, "Game": "Basketball", "Id" : 'Game3' },
                { "State": true, "Game": "Cricket", "Id" : 'Game4' },
                { "State": false, "Game": "Football", "Id" : 'Game5' },
                { "State": false, "Game": "Golf", "Id" : 'Game6' },
                { "State": true, "Game": "Hockey", "Id" : 'Game7' },
                { "State": false, "Game": "Rugby", "Id" : 'Game8' },
                { "State": false, "Game": "Snooker", "Id" : 'Game9' },
                { "State": false, "Game": "Tennis", "Id" : 'Game10' } 
            
            ]; 
            beforeAll(() => {
                document.body.appendChild(element);
                listObj = new DropDownList({
                    dataSource: sportsData,
                    fields: { value: 'Id', text: 'Game', disabled: 'State' },
                    index: 6,
                });
                listObj.appendTo(element);
            });
            afterAll((done) => {
                listObj.hidePopup();
                setTimeout(() => {
                    listObj.destroy();
                    element.remove();
                    done();
                }, 450)
            });
            it('checked with index binding', function (done) {
                setTimeout(function () {
                    expect(listObj.value).toBe(null);
                    listObj.index = 3;
                    listObj.dataBind();
                    expect(listObj.value === null).toBe(true);
                    listObj.index = 0;
                    listObj.dataBind();
                    listObj.disableItem({ "State": false, "Game": "American Football", "Id" : 'Game1' });
                    expect(listObj.value === null).toBe(true);
                    done();
                }, 450);
            });
        });
        describe('keyboard interaction with disabled items', () => {     
            let keyEventArgs: any = { preventDefault: (): void => { /** NO Code */ }, action: 'up' };
            let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'dropdownlist' });
            let listObj: any;
            let sportsData: { [key: string]: Object }[] = [ 
                { "State": true, "Game": "American Football", "Id" : 'Game1' },
                { "State": false, "Game": "Badminton", "Id" : 'Game2' },
                { "State": true, "Game": "Basketball", "Id" : 'Game3' },
                { "State": true, "Game": "Cricket", "Id" : 'Game4' },
                { "State": false, "Game": "Football", "Id" : 'Game5' },
                { "State": true, "Game": "Golf", "Id" : 'Game6' },
            
            ]; 
            beforeAll(() => {
                document.body.appendChild(element);
                listObj = new DropDownList({
                    dataSource: sportsData,
                    fields: { value: 'Id', text: 'Game', disabled: 'State' },
                });
                listObj.appendTo(element);
            });
            afterAll((done) => {
                listObj.hidePopup();
                setTimeout(() => {
                    listObj.destroy();
                    element.remove();
                    done();
                }, 450)
            });
            /**
           * Mouse click
           */
            it('up and down action', (done) => {            
                listObj.showPopup();
                setTimeout(() => {
                    expect(listObj.list.querySelector('.e-item-focus').getAttribute('data-value') === "Game2").toBe(true);
                    listObj.keyActionHandler(keyEventArgs);
                    expect(listObj.list.querySelector('.e-active').getAttribute('data-value') === "Game2").toBe(true);
                    listObj.keyActionHandler(keyEventArgs);
                    expect(listObj.list.querySelector('.e-active').getAttribute('data-value') === "Game2").toBe(true);
                    keyEventArgs.action = 'down';
                    listObj.keyActionHandler(keyEventArgs);
                    expect(listObj.list.querySelector('.e-active').getAttribute('data-value') === "Game5").toBe(true);
                    keyEventArgs.action = 'down';
                    listObj.keyActionHandler(keyEventArgs);
                    expect(listObj.list.querySelector('.e-active').getAttribute('data-value') === "Game5").toBe(true);
                    keyEventArgs.action = 'up';
                    listObj.keyActionHandler(keyEventArgs);
                    expect(listObj.list.querySelector('.e-active').getAttribute('data-value') === "Game2").toBe(true);
                    done();
                }, 450);
            });
            it('all disabled items', (done) => {         
                listObj.showPopup();
                setTimeout(() => {
                    listObj.disableItem('Game2');
                    listObj.disableItem('Game5');
                    expect(listObj.list.querySelectorAll('.e-item-focus').length === 0).toBe(true);
                    keyEventArgs.action = 'down';
                    listObj.keyActionHandler(keyEventArgs);
                    expect(listObj.list.querySelectorAll('.e-item-focus').length === 0).toBe(true);
                    keyEventArgs.action = 'up';
                    listObj.keyActionHandler(keyEventArgs);
                    expect(listObj.list.querySelectorAll('.e-item-focus').length === 0).toBe(true);
                    keyEventArgs.action = 'down';
                    listObj.keyActionHandler(keyEventArgs);
                    expect(listObj.list.querySelectorAll('.e-item-focus').length === 0).toBe(true);
                    keyEventArgs.action = 'up';
                    listObj.keyActionHandler(keyEventArgs);
                    expect(listObj.list.querySelectorAll('.e-item-focus').length === 0).toBe(true);
                    done();
                }, 450);
            });
        });
        describe('DropdownList Null or undefined value testing', () => {
            let listObj: DropDownList;
            beforeEach(() => {
                listObj = undefined;
                let element: HTMLInputElement = <HTMLInputElement>createElement('input', { id: 'list' });
                document.body.appendChild(element);
            });
            afterEach(() => {
                document.body.innerHTML = '';
            });
            it('actionFailureTemplate', () => {
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    actionFailureTemplate: null
                }, '#list');
                expect(listObj.actionFailureTemplate).toBe(null);
                listObj.destroy();
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    actionFailureTemplate: undefined
                }, '#list');
                expect(listObj.actionFailureTemplate).toBe('Request failed');
                listObj.destroy();
            });
            it('allowFiltering', () => {
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    allowFiltering: null,
                    debounceDelay: 0
                }, '#list');
                expect(listObj.allowFiltering).toBe(null);
                listObj.destroy();
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    allowFiltering: undefined,
                    debounceDelay: 0
                }, '#list');
                expect(listObj.allowFiltering).toBe(false);
                listObj.destroy();
            });
            it('allowObjectBinding', () => {
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    allowObjectBinding: null
                }, '#list');
                expect(listObj.allowObjectBinding).toBe(null);
                listObj.destroy();
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    allowObjectBinding: undefined
                }, '#list');
                expect(listObj.allowObjectBinding).toBe(false);
                listObj.destroy();
            });
            it('cssClass', () => {
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    cssClass: null
                }, '#list');
                expect(listObj.cssClass).toBe(null);
                listObj.destroy();
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    cssClass: undefined
                }, '#list');
                expect(listObj.cssClass).toBe(null);
                listObj.destroy();
            });
            it('enablePersistence', () => {
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    enablePersistence: null
                }, '#list');
                expect(listObj.enablePersistence).toBe(null);
                listObj.destroy();
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    enablePersistence: undefined
                }, '#list');
                expect(listObj.enablePersistence).toBe(false);
                listObj.destroy();
            });
            it('enableRtl', () => {
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    enableRtl: null
                }, '#list');
                expect(listObj.enableRtl).toBe(false);
                listObj.destroy();
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    enableRtl: undefined
                }, '#list');
                expect(listObj.enableRtl).toBe(false);
                listObj.destroy();
            });
            it('enableVirtualization', () => {
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    enableVirtualization: null
                }, '#list');
                expect(listObj.enableVirtualization).toBe(null);
                listObj.destroy();
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    enableVirtualization: undefined
                }, '#list');
                expect(listObj.enableVirtualization).toBe(false);
                listObj.destroy();
            });
            it('enabled', () => {
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    enabled: null
                }, '#list');
                expect(listObj.enabled).toBe(null);
                listObj.destroy();
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    enabled: undefined
                }, '#list');
                expect(listObj.enabled).toBe(true);
                listObj.destroy();
            });
            it('filterBarPlaceholder', () => {
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    allowFiltering: true,
                    debounceDelay: 0,
                    filterBarPlaceholder: null
                }, '#list');
                expect(listObj.filterBarPlaceholder).toBe(null);
                listObj.destroy();
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    allowFiltering: true,
                    debounceDelay: 0,
                    filterBarPlaceholder: undefined
                }, '#list');
                expect(listObj.filterBarPlaceholder).toBe(null);
                listObj.destroy();
            });
            it('footerTemplate', () => {
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    footerTemplate: null
                }, '#list');
                expect(listObj.footerTemplate).toBe(null);
                listObj.destroy();
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    footerTemplate: undefined
                }, '#list');
                expect(listObj.footerTemplate).toBe(null);
                listObj.destroy();
            });
            it('groupTemplate', () => {
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    groupTemplate: null
                }, '#list');
                expect(listObj.groupTemplate).toBe(null);
                listObj.destroy();
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    groupTemplate: undefined
                }, '#list');
                expect(listObj.groupTemplate).toBe(null);
                listObj.destroy();
            });
            it('headerTemplate', () => {
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    headerTemplate: null
                }, '#list');
                expect(listObj.headerTemplate).toBe(null);
                listObj.destroy();
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    headerTemplate: undefined
                }, '#list');
                expect(listObj.headerTemplate).toBe(null);
                listObj.destroy();
            });
            it('ignoreAccent', () => {
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    ignoreAccent: null
                }, '#list');
                expect(listObj.ignoreAccent).toBe(null);
                listObj.destroy();
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    ignoreAccent: undefined
                }, '#list');
                expect(listObj.ignoreAccent).toBe(false);
                listObj.destroy();
            });
            it('ignoreCase', () => {
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    ignoreCase: null
                }, '#list');
                expect(listObj.ignoreCase).toBe(null);
                listObj.destroy();
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    ignoreCase: undefined
                }, '#list');
                expect(listObj.ignoreCase).toBe(true);
                listObj.destroy();
            });
            it('itemTemplate', () => {
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    itemTemplate: null
                }, '#list');
                expect(listObj.itemTemplate).toBe(null);
                listObj.destroy();
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    itemTemplate: undefined
                }, '#list');
                expect(listObj.itemTemplate).toBe(null);
                listObj.destroy();
            });
            it('noRecordsTemplate', () => {
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    noRecordsTemplate: null
                }, '#list');
                expect(listObj.noRecordsTemplate).toBe(null);
                listObj.destroy();
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    noRecordsTemplate: undefined
                }, '#list');
                expect(listObj.noRecordsTemplate).toBe('No records found');
                listObj.destroy();
            });
            it('placeholder', () => {
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    placeholder: null
                }, '#list');
                expect(listObj.placeholder).toBe(null);
                listObj.destroy();
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    placeholder: undefined
                }, '#list');
                expect(listObj.placeholder).toBe(null);
                listObj.destroy();
            });
            it('popupHeight', () => {
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    popupHeight: null
                }, '#list');
                expect(listObj.popupHeight).toBe(null);
                listObj.destroy();
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    popupHeight: undefined
                }, '#list');
                expect(listObj.popupHeight).toBe('300px');
                listObj.destroy();
            });
            it('popupWidth', () => {
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    popupWidth: null
                }, '#list');
                expect(listObj.popupWidth).toBe(null);
                listObj.destroy();
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    popupWidth: undefined
                }, '#list');
                expect(listObj.popupWidth).toBe('100%');
                listObj.destroy();
            });
            it('readonly', () => {
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    readonly: null
                }, '#list');
                expect(listObj.readonly).toBe(null);
                listObj.destroy();
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    readonly: undefined
                }, '#list');
                expect(listObj.readonly).toBe(false);
                listObj.destroy();
            });
            it('showClearButton', () => {
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    showClearButton: null
                }, '#list');
                expect(listObj.showClearButton).toBe(null);
                listObj.destroy();
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    showClearButton: undefined
                }, '#list');
                expect(listObj.showClearButton).toBe(false);
                listObj.destroy();
            });
            it('dynamically update showClearButton', () => {
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                }, '#list');
                listObj.showClearButton = true;
                listObj.dataBind();
                listObj.destroy();
            });
            it('text', () => {
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    text: null
                }, '#list');
                expect(listObj.text).toBe(null);
                listObj.destroy();
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    text: undefined
                }, '#list');
                expect(listObj.text).toBe(null);
                listObj.destroy();
            });
            it('value', () => {
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    value: null
                }, '#list');
                expect(listObj.value).toBe(null);
                listObj.destroy();
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    value: undefined
                }, '#list');
                expect(listObj.value).toBe(null);
                listObj.destroy();
            });
            it('valueTemplate', () => {
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    valueTemplate: null
                }, '#list');
                expect(listObj.valueTemplate).toBe(null);
                listObj.destroy();
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    valueTemplate: undefined
                }, '#list');
                expect(listObj.valueTemplate).toBe(null);
                listObj.destroy();
            });
            it('width', () => {
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    width: null
                }, '#list');
                expect(listObj.width).toBe(null);
                listObj.destroy();
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    width: undefined
                }, '#list');
                expect(listObj.width).toBe('100%');
                listObj.destroy();
            });
            it('index', () => {
                listObj = new DropDownList({ 
                    dataSource: datasource,
                    fields: { value: "id", text: "text" },
                    index: null
                }, '#list');
                expect(listObj.index).toBe(null);
                listObj.destroy();
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    index: undefined
                }, '#list');
                expect(listObj.index).toBe(null);
                listObj.destroy();
            });
            it('zIndex', () => {
                listObj = new DropDownList({ 
                    dataSource: datasource,
                    fields: { value: "id", text: "text" },
                    zIndex: null
                }, '#list');
                expect(listObj.zIndex).toBe(null);
                listObj.destroy();
                listObj = new DropDownList({ 
                    dataSource: datasource2,
                    fields: { value: "id", text: "text" },
                    zIndex: undefined
                }, '#list');
                expect(listObj.zIndex).toBe(1000);
                listObj.destroy();
            });
        });
    });
