/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved. 
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *   
 *  The above copyright notice and this permission notice shall be included in 
 *  all copies or substantial portions of the Software.
 *   
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

module powerbi.visuals.controls {
    export module HTMLElementUtils {
        export function clearChildren(element: HTMLElement): void {
            if (!element) {
                return;
            }

            while (element.hasChildNodes()) {
                element.removeChild(element.firstChild);
            }
        }

        export function setElementTop(element: HTMLElement, top: number): void {
            element.style.top = top + "px";
        }

        export function setElementLeft(element: HTMLElement, left: number): void {
            element.style.left = left + "px";
        }

        export function setElementHeight(element: HTMLElement, height: number): void {
            if (HTMLElementUtils.isAutoSize(height))
                element.style.height = "";
            else
                element.style.height = height + "px";
        }

        export function setElementWidth(element: HTMLElement, width: number): void {
            if (HTMLElementUtils.isAutoSize(width))
                element.style.width = "";
            else
                element.style.width = width + "px";
        }

        export function getElementWidth(element: HTMLElement): number {
            return element.offsetWidth;
        }

        export function getElementHeight(element: HTMLElement): number {
            return element.offsetHeight;
        }

        export function isAutoSize(size: number): boolean {
            return size === -1;
        }

        export function getAccumulatedScale(element: HTMLElement): number {
            let scale: number = 1;
            while (element) {
                scale *= HTMLElementUtils.getScale(element);
                element = element.parentElement;
            }

            return scale;
        }
        
        /**
         * Get scale of element, return 1 when not scaled.
         */
        export function getScale(element: any): number {
            element = $(element);

            let str = element.css('-webkit-transform') ||
                element.css('-moz-transform') ||
                element.css('-ms-transform') ||
                element.css('-o-transform') ||
                element.css('transform');

            return (str && (
                str.match(/\d*\.\d*/) && Number(str.match(/\d*\.\d*/)[0]) ||
                str.match(/\d+/) && Number(str.match(/\d+/)[0]))
            ) || 1;
        }
    }
}

module powerbi.visuals.controls.internal {
    import DomFactory = InJs.DomFactory;
    import DataViewObjectDefinitions = powerbi.data.DataViewObjectDefinitions;

    export module TablixObjects {
        export const ObjectGeneral: string = "general";
        export const ObjectGrid: string = "grid";
        export const ObjectColumnHeaders: string = "columnHeaders";
        export const ObjectRowHeaders: string = "rowHeaders";
        export const ObjectValues: string = "values";
        export const ObjectTotal: string = "total";
        export const ObjectSubTotals: string = "subTotals";

        export interface ObjectValueGetterFunction {
            <T>(objects: DataViewObjects, propertyId: DataViewObjectPropertyIdentifier, defaultValue?: T): T;
        }

        /**
         * Represents a DataViewObjects property related to the Tablix
         */
        export class TablixProperty {
            public objectName: string;
            public propertyName: string;
            public defaultValue: any;
            private getterFuntion: ObjectValueGetterFunction;

            /**
             * Creates a new TablixProperty
             * @param {string} objectName Object Name
             * @param {string} propertyName Property Name
             * @param {any} defaultValue Default value of the Property
             * @param {ObjectValueGetterFunction} getterFuntion Function used to get the Property value from the Objects
             */
            constructor(objectName: string, propertyName: string, defaultValue: any, getterFuntion: ObjectValueGetterFunction) {
                this.objectName = objectName;
                this.propertyName = propertyName;
                this.defaultValue = defaultValue;
                this.getterFuntion = getterFuntion;
        }

            /**
             * Gets the PropertyIdentifier for the Property
             * @returns PropertyIdentifier for the Property
             */
            public getPropertyID(): DataViewObjectPropertyIdentifier {
                return { objectName: this.objectName, propertyName: this.propertyName };
            }

            /**
             * Gets the value of the Property from the Objects
             * @param {DataViewObjects} objects DataView Objects to get the value from
             * @param {boolean} useDefault True to fall back to the Default value if the Property is missing from the objects. False to return undefined
             * @returns Value of the property
             */
            public getValue<T>(objects: DataViewObjects, useDefault?: boolean): T {
                // We use this when we intend to have undefined for missing properties. Useful in letting styles fallback to CSS if not defined
                if (useDefault === false)
                    return this.getterFuntion<T>(objects, this.getPropertyID());
                else
                    return this.getterFuntion<T>(objects, this.getPropertyID(), this.defaultValue);
        }
            }

        // Per Column
        export const PropColumnFormatString = new TablixProperty(ObjectGeneral, 'formatString', undefined, DataViewObjects.getValue);

        // General
        export const PropGeneralAutoSizeColumns = new TablixProperty(ObjectGeneral, 'autoSizeColumnWidth', true, DataViewObjects.getValue);
        export const PropGeneralTextSize = new TablixProperty(ObjectGeneral, 'textSize', 8, DataViewObjects.getValue);
        export const PropGeneralTableTotals = new TablixProperty(ObjectGeneral, 'totals', true, DataViewObjects.getValue);
        export const PropGeneralMatrixRowSubtotals = new TablixProperty(ObjectGeneral, 'rowSubtotals', true, DataViewObjects.getValue);
        export const PropGeneralMatrixColumnSubtotals = new TablixProperty(ObjectGeneral, 'columnSubtotals', true, DataViewObjects.getValue);

        //Grid
        export const PropGridVertical = new TablixProperty(ObjectGrid, 'gridVertical', false, DataViewObjects.getValue);
        export const PropGridVerticalColor = new TablixProperty(ObjectGrid, 'gridVerticalColor', "#E8E8E8", DataViewObjects.getFillColor);
        export const PropGridVerticalWeight = new TablixProperty(ObjectGrid, 'gridVerticalWeight', 1, DataViewObjects.getValue);
        export const PropGridHorizontalTable = new TablixProperty(ObjectGrid, 'gridHorizontal', true, DataViewObjects.getValue);
        export const PropGridHorizontalMatrix = new TablixProperty(ObjectGrid, 'gridHorizontal', false, DataViewObjects.getValue);
        export const PropGridHorizontalColor = new TablixProperty(ObjectGrid, 'gridHorizontalColor', "#E8E8E8", DataViewObjects.getFillColor);
        export const PropGridHorizontalWeight = new TablixProperty(ObjectGrid, 'gridHorizontalWeight', 1, DataViewObjects.getValue);
        export const PropGridRowPadding = new TablixProperty(ObjectGrid, 'rowPadding', 0, DataViewObjects.getValue);
        export const PropGridOutlineColor = new TablixProperty(ObjectGrid, 'outlineColor', "#E8E8E8", DataViewObjects.getFillColor);
        export const PropGridOutlineWeight = new TablixProperty(ObjectGrid, 'outlineWeight', 2, DataViewObjects.getValue);

        // Column Headers
        export const PropColumnsFontColor = new TablixProperty(ObjectColumnHeaders, 'fontColor', "#666", DataViewObjects.getFillColor);
        export const PropColumnsBackColor = new TablixProperty(ObjectColumnHeaders, 'backColor', undefined, DataViewObjects.getFillColor);
        export const PropColumnsOutline = new TablixProperty(ObjectColumnHeaders, 'outline', "BottomOnly", DataViewObjects.getValue);

        // Row Headers
        export const PropRowsFontColor = new TablixProperty(ObjectRowHeaders, 'fontColor', "#666", DataViewObjects.getFillColor);
        export const PropRowsBackColor = new TablixProperty(ObjectRowHeaders, 'backColor', undefined, DataViewObjects.getFillColor);
        export const PropRowsOutline = new TablixProperty(ObjectRowHeaders, 'outline', "RightOnly", DataViewObjects.getValue);

        // Values
        // VSTS 7167767: Remove temporary code for product demo.
        export const PropValuesBackColorConditionalFormatting = new TablixProperty(ObjectValues, 'backgroundColorConditional', false, DataViewObjects.getValue);
        export const PropValuesFontColorPrimary = new TablixProperty(ObjectValues, 'fontColorPrimary', "#666", DataViewObjects.getFillColor);
        export const PropValuesBackColorPrimary = new TablixProperty(ObjectValues, 'backColorPrimary', undefined, DataViewObjects.getFillColor);
        export const PropValuesFontColorSecondary = new TablixProperty(ObjectValues, 'fontColorSecondary', "#666", DataViewObjects.getFillColor);
        export const PropValuesBackColorSecondary = new TablixProperty(ObjectValues, 'backColorSecondary', undefined, DataViewObjects.getFillColor);
        export const PropValuesOutline = new TablixProperty(ObjectValues, 'outline', "None", DataViewObjects.getValue);
        export const PropValuesUrlIconProp = new TablixProperty(ObjectValues, 'urlIcon', false, DataViewObjects.getValue);

        // Total
        export const PropTotalFontColor = new TablixProperty(ObjectTotal, 'fontColor', "#666", DataViewObjects.getFillColor);
        export const PropTotalBackColor = new TablixProperty(ObjectTotal, 'backColor', "#FFF", DataViewObjects.getFillColor);
        export const PropTotalOutline = new TablixProperty(ObjectTotal, 'outline', "TopOnly", DataViewObjects.getValue);

        // SubTotals
        export const PropSubTotalsFontColor = new TablixProperty(ObjectSubTotals, 'fontColor', "#666", DataViewObjects.getFillColor);
        export const PropSubTotalsBackColor = new TablixProperty(ObjectSubTotals, 'backColor', undefined, DataViewObjects.getFillColor);
        export const PropSubTotalsOutline = new TablixProperty(ObjectSubTotals, 'outline', "TopOnly", DataViewObjects.getValue);

        /**
         * Get the DataViewObject from the DataView
         * @param {DataView} dataview The DataView
         * @returns DataViewObjects (dataView.metadata.objects)
         */
        export function getMetadadataObjects(dataview: DataView): DataViewObjects {
            if (dataview && dataview.metadata)
                return dataview.metadata.objects;

            return null;
        } 

        export function enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions, enumeration: ObjectEnumerationBuilder, dataView: DataView, isFormattingPropertiesEnabled: boolean, isConditionalFormattingEnabled: boolean, tablixType: TablixType): void {
            debug.assertValue(dataView, "dataView can't be undefined");

            let objects = getMetadadataObjects(dataView);

            let totalsShown: boolean = true;

            if (tablixType === TablixType.Table) {
                totalsShown = shouldShowTableTotalsOption(dataView) && shouldShowTableTotals(objects);
            }
            else {
                totalsShown =
                    (shouldShowColumnSubtotalsOption(dataView) && shouldShowColumnSubtotals(objects)) ||
                    (shouldShowRowSubtotalsOption(dataView) && shouldShowRowSubtotals(objects));
            }

            switch (options.objectName) {
                case TablixObjects.ObjectGeneral:
                    enumerateGeneralOptions(enumeration, objects, tablixType, dataView);
                    break;
                case TablixObjects.ObjectGrid:
                    if (isFormattingPropertiesEnabled)
                        enumerateGridOptions(enumeration, objects, tablixType);
                    break;
                case TablixObjects.ObjectColumnHeaders:
                    if (isFormattingPropertiesEnabled)
                        enumerateColumnHeadersOptions(enumeration, objects);
                    break;
                case TablixObjects.ObjectRowHeaders:
                    if (isFormattingPropertiesEnabled)
                        enumerateRowHeadersOptions(enumeration, objects);
                    break;
                case TablixObjects.ObjectValues:
                    if (isFormattingPropertiesEnabled) {
                        enumerateValuesOptions(enumeration, objects, tablixType);

                        if (tablixType === TablixType.Table && isConditionalFormattingEnabled)
                            enumerateValuesOptionConditionalFormat(enumeration, objects);
                    }
                    break;
                case TablixObjects.ObjectTotal:
                    if (isFormattingPropertiesEnabled && totalsShown)
                        enumerateTotalOptions(enumeration, objects);
                    break;
                case TablixObjects.ObjectSubTotals:
                    if (isFormattingPropertiesEnabled && totalsShown)
                        enumerateSubTotalsOptions(enumeration, objects);
                    break;
                default:
                    break;
            }
        }

        export function enumerateGeneralOptions(enumeration: ObjectEnumerationBuilder, objects: DataViewObjects, tablixType: TablixType, dataView: DataView): void {
            let visualObjectinstance: VisualObjectInstance = {
                            selector: null,
                objectName: TablixObjects.ObjectGeneral,
                            properties: {
                    autoSizeColumnWidth: TablixObjects.PropGeneralAutoSizeColumns.getValue(objects),
                    textSize: TablixObjects.PropGeneralTextSize.getValue<number>(objects),
                            }
                        };

            let properties = visualObjectinstance.properties;

            // Total and SubTotals
            switch (tablixType) {
                case TablixType.Table:
                    if (shouldShowTableTotalsOption(dataView))
                        properties[TablixObjects.PropGeneralTableTotals.propertyName] = shouldShowTableTotals(objects);
                        break;

                case TablixType.Matrix:
                        if (shouldShowRowSubtotalsOption(dataView))
                        properties[TablixObjects.PropGeneralMatrixRowSubtotals.propertyName] = shouldShowRowSubtotals(objects);
                        if (shouldShowColumnSubtotalsOption(dataView))
                        properties[TablixObjects.PropGeneralMatrixColumnSubtotals.propertyName] = shouldShowColumnSubtotals(objects);
                        break;
                }

            enumeration.pushInstance(visualObjectinstance);
            }

        export function enumerateGridOptions(enumeration: ObjectEnumerationBuilder, objects: DataViewObjects, tablixType: TablixType): void {
            let visualObjectinstance: VisualObjectInstance = {
                            selector: null,
                objectName: TablixObjects.ObjectGeneral,
                properties: {}
                        };
            let properties = visualObjectinstance.properties;

            // Vertical Grid
            let verticalGridEnabled = TablixObjects.PropGridVertical.getValue<boolean>(objects);
            properties[TablixObjects.PropGridVertical.propertyName] = verticalGridEnabled;
            if (verticalGridEnabled) {
                properties[TablixObjects.PropGridVerticalColor.propertyName] = TablixObjects.PropGridVerticalColor.getValue<string>(objects);
                properties[TablixObjects.PropGridVerticalWeight.propertyName] = TablixObjects.PropGridVerticalWeight.getValue<number>(objects);
            }

            // Horizontal Grid
            let horizontalGridEnabled = (tablixType === TablixType.Table ? TablixObjects.PropGridHorizontalTable : TablixObjects.PropGridHorizontalMatrix).getValue<boolean>(objects);
            properties[(tablixType === TablixType.Table ? TablixObjects.PropGridHorizontalTable : TablixObjects.PropGridHorizontalMatrix).propertyName] = horizontalGridEnabled;
            if (horizontalGridEnabled) {
                properties[TablixObjects.PropGridHorizontalColor.propertyName] = TablixObjects.PropGridHorizontalColor.getValue<string>(objects);
                properties[TablixObjects.PropGridHorizontalWeight.propertyName] = TablixObjects.PropGridHorizontalWeight.getValue<number>(objects);
                            }

            // Row Padding
            properties[TablixObjects.PropGridRowPadding.propertyName] = TablixObjects.PropGridRowPadding.getValue<number>(objects);

            // Outline
            properties[TablixObjects.PropGridOutlineColor.propertyName] = TablixObjects.PropGridOutlineColor.getValue<string>(objects);
            properties[TablixObjects.PropGridOutlineWeight.propertyName] = TablixObjects.PropGridOutlineWeight.getValue<number>(objects);

                        enumeration.pushInstance(visualObjectinstance);
                }

        export function enumerateColumnHeadersOptions(enumeration: ObjectEnumerationBuilder, objects: DataViewObjects): void {
            enumeration.pushInstance({
                selector: null,
                objectName: TablixObjects.ObjectColumnHeaders,
                properties: {
                    fontColor: TablixObjects.PropColumnsFontColor.getValue<string>(objects),
                    backColor: TablixObjects.PropColumnsBackColor.getValue<string>(objects),
                    outline: TablixObjects.PropColumnsOutline.getValue<string>(objects),
                }
            });
        }

        export function enumerateRowHeadersOptions(enumeration: ObjectEnumerationBuilder, objects: DataViewObjects): void {
            enumeration.pushInstance({
                selector: null,
                objectName: TablixObjects.ObjectRowHeaders,
                properties: {
                    fontColor: TablixObjects.PropRowsFontColor.getValue<string>(objects),
                    backColor: TablixObjects.PropRowsBackColor.getValue<string>(objects),
                    outline: TablixObjects.PropRowsOutline.getValue<string>(objects),
                }
            });
        }

        export function enumerateValuesOptions(enumeration: ObjectEnumerationBuilder, objects: DataViewObjects, tablixType: TablixType): void {
            let instance: VisualObjectInstance = {
                selector: null,
                objectName: TablixObjects.ObjectValues,
                properties: {
                    fontColorPrimary: TablixObjects.PropValuesFontColorPrimary.getValue<string>(objects),
                    backColorPrimary: TablixObjects.PropValuesBackColorPrimary.getValue<string>(objects),
                    fontColorSecondary: TablixObjects.PropValuesFontColorSecondary.getValue<string>(objects),
                    backColorSecondary: TablixObjects.PropValuesBackColorSecondary.getValue<string>(objects),
                    outline: TablixObjects.PropValuesOutline.getValue<string>(objects),
                }
            };

            if (tablixType === TablixType.Table)
                instance.properties[TablixObjects.PropValuesUrlIconProp.propertyName] = TablixObjects.PropValuesUrlIconProp.getValue<boolean>(objects);

            enumeration.pushInstance(instance);
        }

        // TODO: VSTS 7167767: Remove temporary code for product demo.
        export function enumerateValuesOptionConditionalFormat(enumeration: ObjectEnumerationBuilder, objects: DataViewObjects): void {
            let instance: VisualObjectInstance = {
                selector: null,
                objectName: TablixObjects.ObjectValues,
                properties: {
                    backgroundColorConditional: TablixObjects.PropValuesBackColorConditionalFormatting.getValue<boolean>(objects),
                }
            };

            enumeration.pushInstance(instance);
        }

        export function enumerateTotalOptions(enumeration: ObjectEnumerationBuilder, objects: DataViewObjects): void {
            enumeration.pushInstance({
                selector: null,
                objectName: TablixObjects.ObjectTotal,
                properties: {
                    fontColor: TablixObjects.PropTotalFontColor.getValue<string>(objects),
                    backColor: TablixObjects.PropTotalBackColor.getValue<string>(objects),
                    outline: TablixObjects.PropTotalOutline.getValue<string>(objects),
                }
            });
        }

        export function enumerateSubTotalsOptions(enumeration: ObjectEnumerationBuilder, objects: DataViewObjects): void {
            enumeration.pushInstance({
                selector: null,
                objectName: TablixObjects.ObjectSubTotals,
                properties: {
                    fontColor: TablixObjects.PropSubTotalsFontColor.getValue<string>(objects),
                    backColor: TablixObjects.PropSubTotalsBackColor.getValue<string>(objects),
                }
            });
        }

        export function getTableObjects(dataView: DataView, isFormattingEnabled: boolean, isConditionalFormattingEnabled: boolean): TablixFormattingPropertiesTable {
            let objects = getMetadadataObjects(dataView);

            let formattingProperties: TablixFormattingPropertiesTable = {
                isFormattingEnabled: isFormattingEnabled,
                // TODO: VSTS 7167767: Remove temporary code for product demo.
                isConditionalFormattingEnabled: isConditionalFormattingEnabled,

                general: {
                    autoSizeColumnWidth: TablixObjects.PropGeneralAutoSizeColumns.getValue<boolean>(objects),
                    textSize: TablixObjects.PropGeneralTextSize.getValue<number>(objects),
                    totals: shouldShowTableTotals(objects),
                    },
            };

            if (isFormattingEnabled) {
                formattingProperties.grid = {
                    gridVertical: TablixObjects.PropGridVertical.getValue<boolean>(objects),
                    gridVerticalColor: TablixObjects.PropGridVerticalColor.getValue<string>(objects),
                    gridVerticalWeight: TablixObjects.PropGridVerticalWeight.getValue<number>(objects),
                    gridHorizontal: TablixObjects.PropGridHorizontalTable.getValue<boolean>(objects),
                    gridHorizontalColor: TablixObjects.PropGridHorizontalColor.getValue<string>(objects),
                    gridHorizontalWeight: TablixObjects.PropGridHorizontalWeight.getValue<number>(objects),
                    outlineColor: TablixObjects.PropGridOutlineColor.getValue<string>(objects),
                    outlineWeight: TablixObjects.PropGridOutlineWeight.getValue<number>(objects),
                    rowPadding: TablixObjects.PropGridRowPadding.getValue<number>(objects, false),
                };

                formattingProperties.columnHeaders = {
                    fontColor: TablixObjects.PropColumnsFontColor.getValue<string>(objects, false),
                    backColor: TablixObjects.PropColumnsBackColor.getValue<string>(objects, false),
                    outline: TablixObjects.PropColumnsOutline.getValue<string>(objects),
                };

                formattingProperties.values = {
                    fontColorPrimary: TablixObjects.PropValuesFontColorPrimary.getValue<string>(objects, false),
                    backColorPrimary: TablixObjects.PropValuesBackColorPrimary.getValue<string>(objects, false),
                    fontColorSecondary: TablixObjects.PropValuesFontColorSecondary.getValue<string>(objects, false),
                    backColorSecondary: TablixObjects.PropValuesBackColorSecondary.getValue<string>(objects, false),
                    outline: TablixObjects.PropValuesOutline.getValue<string>(objects),
                    urlIcon: TablixObjects.PropValuesUrlIconProp.getValue<boolean>(objects),
                };

                if (isConditionalFormattingEnabled) {
                    formattingProperties.values.conditionalFormatting = TablixObjects.PropValuesBackColorConditionalFormatting.getValue<boolean>(objects);
                }

                formattingProperties.total = {
                    fontColor: TablixObjects.PropTotalFontColor.getValue<string>(objects, false),
                    backColor: TablixObjects.PropTotalBackColor.getValue<string>(objects, false),
                    outline: TablixObjects.PropTotalOutline.getValue<string>(objects),
                };
            }

            return formattingProperties;
        }

        // TODO: VSTS 7167767: Remove temporary code for product demo.
        export function getTableObjectConditionalFormatEnabled(dataView: DataView) {
            return TablixObjects.PropValuesBackColorConditionalFormatting.getValue<boolean>(getMetadadataObjects(dataView));
        }

        export function getMatrixObjects(dataView: DataView, isFormattingEnabled): TablixFormattingPropertiesMatrix {
            let objects = getMetadadataObjects(dataView);

            let formattingProperties: TablixFormattingPropertiesMatrix = {
                isFormattingEnabled: isFormattingEnabled,

                general: {
                    autoSizeColumnWidth: TablixObjects.PropGeneralAutoSizeColumns.getValue<boolean>(objects),
                    textSize: TablixObjects.PropGeneralTextSize.getValue<number>(objects),
                    rowSubtotals: shouldShowRowSubtotals(objects),
                    columnSubtotals: shouldShowColumnSubtotals(objects),
                    },
            };

            if (isFormattingEnabled) {
                formattingProperties.grid = {
                    gridVertical: TablixObjects.PropGridVertical.getValue<boolean>(objects),
                    gridVerticalColor: TablixObjects.PropGridVerticalColor.getValue<string>(objects),
                    gridVerticalWeight: TablixObjects.PropGridVerticalWeight.getValue<number>(objects),
                    gridHorizontal: TablixObjects.PropGridHorizontalMatrix.getValue<boolean>(objects),
                    gridHorizontalColor: TablixObjects.PropGridHorizontalColor.getValue<string>(objects),
                    gridHorizontalWeight: TablixObjects.PropGridHorizontalWeight.getValue<number>(objects),
                    outlineColor: TablixObjects.PropGridOutlineColor.getValue<string>(objects),
                    outlineWeight: TablixObjects.PropGridOutlineWeight.getValue<number>(objects),
                    rowPadding: TablixObjects.PropGridRowPadding.getValue<number>(objects, false),
                };

                formattingProperties.columnHeaders = {
                    fontColor: TablixObjects.PropColumnsFontColor.getValue<string>(objects, false),
                    backColor: TablixObjects.PropColumnsBackColor.getValue<string>(objects, false),
                    outline: TablixObjects.PropColumnsOutline.getValue<string>(objects),
                };

                formattingProperties.rowHeaders = {
                    fontColor: TablixObjects.PropRowsFontColor.getValue<string>(objects, false),
                    backColor: TablixObjects.PropRowsBackColor.getValue<string>(objects, false),
                    outline: TablixObjects.PropRowsOutline.getValue<string>(objects),
                };

                formattingProperties.values = {
                    fontColorPrimary: TablixObjects.PropValuesFontColorPrimary.getValue<string>(objects, false),
                    backColorPrimary: TablixObjects.PropValuesBackColorPrimary.getValue<string>(objects, false),
                    fontColorSecondary: TablixObjects.PropValuesFontColorSecondary.getValue<string>(objects, false),
                    backColorSecondary: TablixObjects.PropValuesBackColorSecondary.getValue<string>(objects, false),
                    outline: TablixObjects.PropValuesOutline.getValue<string>(objects),
                };

                formattingProperties.subtotals = {
                    fontColor: TablixObjects.PropSubTotalsFontColor.getValue<string>(objects, false),
                    backColor: TablixObjects.PropSubTotalsBackColor.getValue<string>(objects, false),
                    outline: TablixObjects.PropSubTotalsOutline.getValue<string>(objects),
                };
            }

            return formattingProperties;
        }

        /**
         * Generate default objects for the Table/Matrix to set default styling
         * @param {TablixType} tablixType Tablix Type: table | matrix
         * @returns DataViewObjects that can be attached to the DataViewMetadata
         */
        export function generateTablixDefaultObjects(tablixType: TablixType): data.DataViewObjectDefinitions {
            return {
                general: [{
                    selector: null,
                    properties: {
                        textSize: DataViewObjectDefinitions.encodePropertyValue(12, { numeric: true }),
                        totals: DataViewObjectDefinitions.encodePropertyValue(false, { bool: true }),
                    }
                }],
                };
            }

        export function getTextSizeInPx(textSize: number): string {
            return jsCommon.PixelConverter.fromPoint(textSize);
        }

        export function shouldShowTableTotals(objects: DataViewObjects): boolean {
            return TablixObjects.PropGeneralTableTotals.getValue<boolean>(objects);
        }

        function shouldShowTableTotalsOption(dataView: DataView): boolean {
            if (dataView && dataView.table && !_.isEmpty(dataView.table.columns)) {
                let columns = dataView.table.columns;
                if (_.some(columns, (column) => column.discourageAggregationAcrossGroups))
                    return false;
            }

            return true;
        }

        export function shouldShowRowSubtotals(objects: DataViewObjects): boolean {
            return TablixObjects.PropGeneralMatrixRowSubtotals.getValue<boolean>(objects);
        }

        function shouldShowRowSubtotalsOption(dataView: DataView): boolean {
            return !(dataView &&
                dataView.matrix &&
                dataView.matrix.rows &&
                isDiscourageAggregationAcrossGroups(dataView.matrix.rows.levels));
        }

        export function shouldShowColumnSubtotals(objects: DataViewObjects): boolean {
            return TablixObjects.PropGeneralMatrixColumnSubtotals.getValue<boolean>(objects);
        }

        export function shouldShowColumnSubtotalsOption(dataView: DataView): boolean {
            return !(dataView &&
                dataView.matrix &&
                dataView.matrix.columns &&
                isDiscourageAggregationAcrossGroups(dataView.matrix.columns.levels));
        }

        export function isDiscourageAggregationAcrossGroups(levels: DataViewHierarchyLevel[]): boolean {
            let lastLevel = _.last(levels);
            // If the last item is not Aggregatable, disable totals option since there will be no totals at all to display
            // However, if the non-aggregatable filed is in the middle, there are totals showing up in matrix.
            // Therefore, we still allow users to turn it off
            return lastLevel && _.some(lastLevel.sources, source => source.discourageAggregationAcrossGroups);
        }
    }

    export module TablixUtils {
        export const CssClassTablixDiv = "tablixDiv";                                                   // Any DIV inside the table (outer and inner)
        export const CssClassContentElement = "tablixCellContentElement";                               // Outer DIV
        export const CssClassContentHost = "tablixCellContentHost";                                     // Inner DIV

        export const CssClassTablixHeader = "tablixHeader";                                             // Any Header in the Table/Matrix
        export const CssClassTablixColumnHeaderLeaf = "tablixColumnHeaderLeaf";                         // Leaf Column Headers

        export const CssClassTablixValueNumeric = "tablixValueNumeric";                                 // Numeric cells, will also be applied to all Matrix body cells
        export const CssClassTablixValueTotal = "tablixValueTotal";                                     // Total cells,  will also be applied to subtotal Matrix body cells
        export const CssClassValueURLIcon: string = "powervisuals-glyph url-icon tablixUrlIconGlyph";   // Any <a> Tag
        export const CssClassValueURLIconContainer: string = "tablixValueUrlIcon";                      // Container for the <a> tag

        export const CssClassMatrixRowHeaderLeaf = "matrixRowHeaderLeaf";                               // Matrix Leaf Row Headers
        export const CssClassMatrixRowHeaderSubTotal = "matrixRowHeaderSubTotal";                       // Matrix SubTotal Row Headers

        export const CssClassTableFooter = 'tableFooterCell';                                           // Any cell in the Footer area
        export const CssClassTableBodyCell = 'tableBodyCell';                                           // Any cell in the Table Body
        export const CssClassTableBodyCellBottom = 'tableBodyCellBottom';                               // Bottom-Most Body cell

        export const StringNonBreakingSpace = '&nbsp;';

        export const UnitOfMeasurement: string = 'px';
        const SortIconContainerClassName: string = "tablixSortIconContainer";
        export const CellPaddingLeft: number = 10;
        export const CellPaddingRight: number = 5;

        export interface Surround<T> {
            top?: T;
            right?: T;
            bottom?: T;
            left?: T;
        }

        export class EdgeSettings {
            /**
             * Weight in pixels. 0 to remove border. Undefined to fall back to CSS
            */
            public weight: number;
            public style: string;
            public color: string;

            constructor(weight?: number, color?: string, style?: string) {
                this.applyParams(true, weight, color, style);
            }

            public applyParams(shown: boolean, weight: number, color?: string, style?: string) {
                if (shown) {
                    this.weight = weight;
                    this.color = color;
                    this.style = style ? style : 'solid';
                }
                else {
                    this.weight = 0;
                    this.color = undefined;
                    this.style = undefined;
                }
            }

            public getCSS(): string {
                let css: string[] = [];

                if (_.isNumber(this.weight)) {
                    css.push(this.weight + UnitOfMeasurement);
                    if (this.color)
                        css.push(this.color);
                    if (this.style)
                        css.push(this.style);
                }

                return css.join(' ');
            }
        }

        /**
         * Style parameters for each Cell
         */
        export class CellStyle {
            /**
             * Font color of the cell, undefined to fall back to CSS
            */
            public fontColor: string;
            /**
             * Background color of the cell, undefined to fall back to CSS
            */
            public backColor: string;

            /**
            * Settings for Borders
            */
            public borders: Surround<EdgeSettings>;

            /**
             * Settings for Padding
            */
            public paddings: Surround<number>;

            constructor() {
                this.borders = {};
                this.paddings = {};
            }

            /**
             * Sets the Inline style for the Cell
             * @param {ITablixCell} cell Cell to set style to
             */
            public applyStyle(cell: ITablixCell): void {
                let div = cell.extension.contentHost;
                let style = div.style;

                style.color = this.fontColor ? this.fontColor : "";
                style.backgroundColor = this.backColor ? this.backColor : "";

                style.borderTop = this.borders.top ? this.borders.top.getCSS() : "";
                style.borderRight = this.borders.right ? this.borders.right.getCSS() : "";
                style.borderBottom = this.borders.bottom ? this.borders.bottom.getCSS() : "";
                style.borderLeft = this.borders.left ? this.borders.left.getCSS() : "";

                style.paddingTop = _.isNumber(this.paddings.top) ? (this.paddings.top + UnitOfMeasurement) : "";
                style.paddingRight = _.isNumber(this.paddings.right) ? (this.paddings.right + UnitOfMeasurement) : "";
                style.paddingBottom = _.isNumber(this.paddings.bottom) ? (this.paddings.bottom + UnitOfMeasurement) : "";
                style.paddingLeft = _.isNumber(this.paddings.left) ? (this.paddings.left + UnitOfMeasurement) : "";
            }

            public getExtraTop(): number {
                let extra = 0;

                if (this.paddings.top)
                    extra += this.paddings.top;
                if (this.borders.top)
                    extra += this.borders.top.weight;

                return extra;
            }

            public getExtraBottom(): number {
                let extra = 0;

                if (this.paddings.bottom)
                    extra += this.paddings.bottom;
                if (this.borders.bottom)
                    extra += this.borders.bottom.weight;

                return extra;
            }
        }

        /**
         * Index within a dimension (row/column)
         */
        export class DimensionPosition {
            public index: number;
            public isLast: boolean;
            public isFirst: boolean;
        }
        /**
         * Poistion information about the cell
         */
        export class CellPosition {
            public row: DimensionPosition;
            public column: DimensionPosition;

            constructor() {
                this.row = new DimensionPosition();
                this.column = new DimensionPosition();
        }

            public isMatch(position: CellPosition) {
                return this.column.index === position.column.index &&
                    this.row.index === position.row.index;
            }
        }

        export class TablixVisualCell {
            public dataPoint: any;
            public position: TablixUtils.CellPosition;
            public columnMetadata: DataViewMetadataColumn;
            public isTotal: boolean;
            private formatter: ICustomValueColumnFormatter;
            // VSTS 7167767: Remove temporary code for product demo.
            public backColorCustomFormatting: string;

            constructor(dataPoint: any, isTotal: boolean, columnMetadata: DataViewMetadataColumn, formatter: ICustomValueColumnFormatter) {
                this.dataPoint = dataPoint;
                this.columnMetadata = columnMetadata;
                this.formatter = formatter;
                this.isTotal = isTotal;
                this.backColorCustomFormatting = undefined;

                this.position = new TablixUtils.CellPosition();
        }

            public get textContent(): string {
                if (this.dataPoint == null)
                    return '';

                if (this.formatter)
                    return this.formatter(this.dataPoint, this.columnMetadata, TablixObjects.PropColumnFormatString.getPropertyID());
                else
                    return this.dataPoint;
            };

            public get domContent(): JQuery {
                if (this.columnMetadata && isValidStatusGraphic(this.columnMetadata.kpi, this.textContent))
                    return createKpiDom(this.columnMetadata.kpi, this.textContent);
            };

            public get isNumeric(): boolean {
                if (this.columnMetadata)
                    return this.columnMetadata.type.numeric && !this.columnMetadata.kpi;
            };

            public get isValidUrl(): boolean {
                if (this.columnMetadata)
                return converterHelper.isWebUrlColumn(this.columnMetadata) && jsCommon.UrlUtils.isValidUrl(this.textContent);
            };

            public get isValidImage(): boolean {
                if (this.columnMetadata)
                return converterHelper.isImageUrlColumn(this.columnMetadata) && jsCommon.UrlUtils.isValidImageUrl(this.textContent);
            };

            public isMatch(item: TablixVisualCell) {
                return this.position.isMatch(item.position);
            }
        }

        export function createTable(): HTMLTableElement {
            return <HTMLTableElement>document.createElement("table");
        }

        export function createDiv(): HTMLDivElement {
            let div: HTMLDivElement = <HTMLDivElement>document.createElement("div");
            div.className = "tablixDiv";
            return div;
        }

        export function resetCellCssClass(cell: controls.ITablixCell) {
            cell.extension.contentElement.className = TablixUtils.CssClassTablixDiv + " " + TablixUtils.CssClassContentElement;
            cell.extension.contentHost.className = TablixUtils.CssClassTablixDiv + " " + TablixUtils.CssClassContentHost;
        }

        export function addCellCssClass(cell: controls.ITablixCell, style: string): void {
            cell.extension.contentHost.className += " " + style;
        }

        /**
         * Clears all inline styles (border, fontColor, background) and resets CSS classes
         * Performed with unbind-<Cell>
         */
        export function clearCellStyle(cell: controls.ITablixCell): void {
            cell.extension.contentHost.className = "";
            cell.extension.contentHost.style.cssText = "";
        }

        export function clearCellTextAndTooltip(cell: controls.ITablixCell): void {
            cell.extension.contentHost.textContent = '';
            cell.extension.contentHost.removeAttribute('title');
            HTMLElementUtils.clearChildren(cell.extension.contentHost);
        }

        export function setCellTextAndTooltip(cell: controls.ITablixCell, text: string): void {
            let val = TextUtil.replaceSpaceWithNBSP(text);
            cell.extension.contentHost.textContent = val;
            cell.extension.contentHost.title = val;
        }

        export function isValidSortClick(e: MouseEvent) {
            let colHeader = <HTMLElement>e.target;
            let x = e.offsetX;
            return x >= 0 && x < colHeader.offsetWidth - TablixResizer.resizeHandleSize;
        }

        export function appendATagToBodyCell(value: string, cell: controls.ITablixCell, urlIcon?: boolean): void {
            let element = <HTMLElement>cell.extension.contentHost;
            let atag: HTMLAnchorElement = null;
            if (element.childElementCount === 0) {
                atag = document.createElement('a');
                element.appendChild(atag);
            } else {
                atag = <HTMLAnchorElement>element.children[0];
        }

            atag.href = value;
            atag.target = '_blank';
            atag.title = value;

            if (urlIcon === true) {
                atag.className = CssClassValueURLIcon;
                element.className = CssClassValueURLIconContainer;

            }
            else {
                atag.innerText = value;
            }
        }

        export function appendImgTagToBodyCell(value: string, cell: controls.ITablixCell): void {
            let element = <HTMLElement>cell.extension.contentHost;
            let contentElement = element.parentElement;
            let imgTag: HTMLImageElement;
            if (element.childElementCount === 0) {
                imgTag = document.createElement('img');
                element.appendChild(imgTag);
            } else {
                imgTag = <HTMLImageElement>element.children[0];
            }
            // set padding for contentElement
            contentElement.style.paddingBottom = '3px';
            contentElement.style.paddingTop = '3px';
            imgTag.src = value;
            imgTag.style.maxHeight = '75px';
            imgTag.style.maxWidth = '100px';
            imgTag.style.height = '100%';
        }

        export function createKpiDom(kpi: DataViewKpiColumnMetadata, kpiValue: string): JQuery {
            debug.assertValue(kpi, 'kpi');
            debug.assertValue(kpiValue, 'kpiValue');
            let className: string = KpiUtil.getClassForKpi(kpi, kpiValue) || '';
            return DomFactory.div()
                .addClass(className)
                .css({
                    'display': 'inline-block',
                    'vertical-align': 'bottom',
                    'margin': '0 1px 1px 0',
                });
        }

        export function isValidStatusGraphic(kpi: DataViewKpiColumnMetadata, kpiValue: string): boolean {
            if (!kpi || kpiValue === undefined) {
                return false;
        }

            return !!KpiUtil.getClassForKpi(kpi, kpiValue);
        }

        export function getCustomSortEventArgs(queryName: string, sortDirection: SortDirection): CustomSortEventArgs {
            let sortDescriptors: SortableFieldDescriptor[] = [{
                queryName: queryName,
                sortDirection: sortDirection
            }];
            return { sortDescriptors: sortDescriptors };
        }

        export function reverseSort(sortDirection: SortDirection): SortDirection {
            return sortDirection === SortDirection.Descending ? SortDirection.Ascending : SortDirection.Descending;
        }

        export function createColumnHeaderWithSortIcon(item: DataViewMetadataColumn, cell: controls.ITablixCell): void {
            let colHeaderContainer: HTMLDivElement = TablixUtils.createDiv();

            if (item.sort) {
                let itemSort = item.sort;
                colHeaderContainer.appendChild(createSortIcon(itemSort, true));
                colHeaderContainer.appendChild(createSortIcon(reverseSort(itemSort), false));
            }
            else {
                colHeaderContainer.appendChild(createSortIcon(SortDirection.Descending, false));
            }

            let colHeaderTitle: HTMLDivElement = TablixUtils.createDiv();
            // Preserving trailing and leading spaces
            let title = item ? TextUtil.replaceSpaceWithNBSP(item.displayName) : '';
            colHeaderTitle.textContent = title;
            colHeaderContainer.appendChild(colHeaderTitle);
            cell.extension.contentHost.title = title;
            cell.extension.contentHost.appendChild(colHeaderContainer);
        }

        function createSortIcon(sort: SortDirection, isSorted: boolean): HTMLElement {
            let imgSort: HTMLPhraseElement = <HTMLPhraseElement>document.createElement('i');
            imgSort.className = SortIconContainerClassName +
                " " + (isSorted ? "sorted" : "future") +
                " " + (sort === SortDirection.Ascending ? "powervisuals-glyph caret-up" : "powervisuals-glyph caret-down");
            return imgSort;
        }

        function checkSortIconExists(cell: controls.ITablixCell): boolean {
            for (let i = 0, len = cell.extension.contentElement.childElementCount; i < len; i++) {
                let element = cell.extension.contentElement.children.item(i);
                if (element.classList.contains(SortIconContainerClassName))
                    return true;
            }
            return false;
        }

        export function removeSortIcons(cell: controls.ITablixCell): void {
            if (!checkSortIconExists(cell))
                return;
            $((<HTMLElement>cell.extension.contentElement)).find('.' + SortIconContainerClassName).remove();
        }
    }
}