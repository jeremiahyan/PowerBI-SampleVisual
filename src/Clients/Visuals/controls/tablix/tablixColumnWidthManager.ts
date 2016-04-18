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
    import PropAutoSizeWidth = internal.TablixObjects.PropGeneralAutoSizeColumns;
    import getMetadataObjects = internal.TablixObjects.getMetadadataObjects;

    /**
     * Column Width Object identifying a certain column and its width
     */
    export interface ColumnWidthObject {
        /**
        * QueryName of the Column
        */
        queryName: string;

        /**
        * Width of the column in px. -1 means it's fixed but unknown.
        */
        width: number;
    }

     /**
     * Handler for Column Width Changed event
     */
    export interface ColumnWidthCallbackType {
        (index: number, width: number): void;
    }

    /**
     * Handler for requesting host to persist Column Width Objects
     */
    export interface HostPersistCallBack {
        (visualObjectInstances: VisualObjectInstancesToPersist): void;
    }

    export class TablixColumnWidthManager {
        /**
        * PropertyID for Column Widths (General > columnWidth)
        */
        public static columnWidthProp: DataViewObjectPropertyIdentifier = { objectName: 'general', propertyName: 'columnWidth' };

        /**
        * Array holding widths for all columns. Index is the index for the column in the visual Table/Matrix
        * Width will be a number for fixed size columns, undefined for autosized columns
        */
        private columnWidthObjects: controls.ColumnWidthObject[];

        /**
        * Visual Object Instances to be persisted. Containing autoSizeProperty and any width to remove/merge
        */
        private visualObjectInstancesToPersist: VisualObjectInstancesToPersist;

        /**
         * True if the Tablix is a Matrix
         */
        private isMatrix: boolean;
        /**
        * Array of all leaf nodes (Row Groupings + Columns/Values instances)
        */
        private matrixLeafNodes: MatrixVisualNode[];
        /**
        * Current DataView
        */
        private currentDataView: DataView;
        /**
        * Current value of AutoSizeColumns after last DataView Update
        */
        private currentAutoColumnSizePropertyValue: boolean;

        /**
        * Previous DataView
        */
        private previousDataView: DataView;
        /**
        * Previous value of AutoSizeColumns before last DataView Update
        */
        private previousAutoColumnSizePropertyValue: boolean;

        /**
        * Handler for requesting host to persist Column Width Objects
        */
        private hostPersistCallBack: HostPersistCallBack;

        constructor(dataView: DataView, isMatrix: boolean, hostPersistCallBack: HostPersistCallBack, matrixLeafNodes?: MatrixVisualNode[]) {
            this.columnWidthObjects = [];
            this.isMatrix = isMatrix;
            this.updateDataView(dataView, matrixLeafNodes);
            this.hostPersistCallBack = hostPersistCallBack;
        }

        /**
         * Update the current DataView
         * @param {dataView} DataView new DataView
         * @param {MatrixVisualNode[]} matrixLeafNodes? (Optional)Matrix Leaf Nodes
         */
        public updateDataView(dataView: DataView, matrixLeafNodes?: MatrixVisualNode[]): void {
            this.previousDataView = this.currentDataView;
            if (this.previousDataView)
                this.previousAutoColumnSizePropertyValue = PropAutoSizeWidth.getValue<boolean>(getMetadataObjects(this.previousDataView));
            else
                this.previousAutoColumnSizePropertyValue = undefined;

            this.currentDataView = dataView;
            if(this.currentDataView)
                this.currentAutoColumnSizePropertyValue = PropAutoSizeWidth.getValue<boolean>(getMetadataObjects(this.currentDataView));
            else
                this.currentAutoColumnSizePropertyValue = undefined;

            this.matrixLeafNodes = matrixLeafNodes;
            
            this.updateColumnWidthObjects();

            this.updateTablixColumnWidths();
        }

        /**
        * Destroy columnWidthObjects and construct it again from the currently displayed Columns
        */
        private updateColumnWidthObjects(): void {
            this.columnWidthObjects.length = 0;

            if (this.isMatrix)
                this.updateMatrixColumnWidthObjects();
            else
                this.updateTableColumnWidthObjects();
        }

        private updateTableColumnWidthObjects(): void {
            if (this.currentDataView && this.currentDataView.table) {
                let columnMetaData = this.currentDataView.table.columns;
                for (let i = 0, len = columnMetaData.length; i < len; i++) {
                    let query = columnMetaData[i].queryName;
                    this.columnWidthObjects.push({
                        queryName: query,
                        width: undefined
                    });
                }
            }
        }

        private updateMatrixColumnWidthObjects(): void {
            // Matrix visual columns are row headers and column hierarchy leaves

            if (this.currentDataView && this.currentDataView.matrix && this.currentDataView.matrix.rows) {
                // Get query names of row groups (row headers)
                for (let i = 0, len = this.currentDataView.matrix.rows.levels.length; i < len; i++) {
                    let rowGroup = this.currentDataView.matrix.rows.levels[i]; // TODO: Investigate multi-source groups
                    if (!_.isEmpty(rowGroup.sources))
                        this.columnWidthObjects.push({
                            queryName: rowGroup.sources[0].queryName,
                            width: undefined
                        });
                }
            }

            // Get query names of columns leaves or values
            if (this.matrixLeafNodes) {
                for (let i = 0, len = this.matrixLeafNodes.length; i < len; i++) {
                    let query = this.matrixLeafNodes[i].queryName;
                    this.columnWidthObjects.push({
                        queryName: query,
                        width: undefined
                    });
                }
            }
        }

        /**
         * Update the column widths after a dataViewChange
         */
        public updateTablixColumnWidths(): void {
            let columnMetaData = this.currentDataView && this.currentDataView.metadata && this.currentDataView.metadata.columns;
            if (columnMetaData) {
                // Auto-Size false to true.
                // Blow away any saved widths and revert back to default of calculating column sizes
                if (this.shouldClearAllColumnWidths()) {
                    this.autoSizeAllColumns();
                }
                else {
                    this.deserializeColumnWidths(columnMetaData);
                }
            }
        }

        /**
         * Read the Column Widths from the Columns metadata
         * @param {DataViewMetadataColumn[]} columnMetaData Columns metadata
         */
        private deserializeColumnWidths(columnMetaData: DataViewMetadataColumn[]): void {
            // Clear existing widths
            this.columnWidthObjects.forEach(obj => {
                obj.width = undefined;
            });

            for (let column of columnMetaData) {
                let columnWidthPropValue = DataViewObjects.getValue<number>(column.objects, TablixColumnWidthManager.columnWidthProp);
                if (!_.isNumber(columnWidthPropValue)) {
                    continue;
                }

                for (let obj of this.columnWidthObjects) {
                    if (obj.queryName === column.queryName) {
                        obj.width = columnWidthPropValue;
                        // Don't break, we need to set all instances of that Group
                    }
                }
            }
        }

        /**
         * Returns a value indicating that autoSizeColumns was flipped from true to false
         */
        public shouldPersistAllColumnWidths(): boolean {
            // We don't have a previous DataView -> Don't persist
            if (!this.previousDataView)
                // TODO: 6928446
                // Once 6927388 gets fixed, we need to persist the DataView is first loaded with AutoSize off to count for missing set widths
                return false;
            // We had a DataView before -> return true if Autosize switched from true to false
            else
                return !this.currentAutoColumnSizePropertyValue && this.previousAutoColumnSizePropertyValue;
        }

        /**
         * Returns a value indicating that autoSizeColumns was flipped from false to true
         */
        public shouldClearAllColumnWidths(): boolean {
            return this.previousDataView != null && this.previousAutoColumnSizePropertyValue === false
                && this.currentDataView != null && this.currentAutoColumnSizePropertyValue === true;
        }

        /**
         * Returns the current columnWidthObjects
         * @returns current columnWidthObjects including undefined widths for autosized columns
         */
        public getColumnWidthObjects(): controls.ColumnWidthObject[] {
            return this.columnWidthObjects;
        }

        /**
         * Returns the current columnWidthObjects for only the fixed-size columns
         * @returns Returns the current columnWidthObjects excluding auto-sized columns
         */
        public getFixedColumnWidthObjects(): controls.ColumnWidthObject[] {
            return this.columnWidthObjects.filter(obj => {
                return obj.width != null;
            });
         }

        /**
         * Get the persisted width of a certain column in px, or undefined if the columns is set to autosize or index is out of range
         * @param {number} index index of the Column
         * @returns Column persisted width in pixel
         */
        public getPersistedColumnWidth(index: number): number {
            let colIndex = this.isMatrix ? index : index - 1;
            let item = this.columnWidthObjects[colIndex];
            if (item)
                return item.width;
            else
                return undefined;
        }

        /**
         * Call the host to persist the data
         * @param {boolean} generateInstances
         */
        private callHostToPersist(generateInstances: boolean) {
            if (generateInstances)
                this.generateVisualObjectInstancesToPersist();

            if (this.hostPersistCallBack) {
                this.hostPersistCallBack(this.visualObjectInstancesToPersist);
            }
         }

        /**
         * Remove all persisted columns widths and Update visualObjectInstancesToPersist
         */
        private autoSizeAllColumns(): void {
            this.visualObjectInstancesToPersist = {
                merge: [this.getAutoSizeColumnWidthObject()],
                remove: [],
            };

            for (let columnWidthObject of this.columnWidthObjects) {
                this.visualObjectInstancesToPersist.remove.push({
                    selector: { metadata: columnWidthObject.queryName },
                    objectName: 'general',
                    properties: {
                        columnWidth: undefined
                    }
                });
            }

            this.callHostToPersist(false);
        }

        /**
         * Remove persisted column width for a specific column and Update visualObjectInstancesToPersist
         */
        private onColumnAutosized(queryName: string): void {
            // If AutoSize option is ON, remove the persisted value
            // Else, update the persisted value
            let width: number = this.currentAutoColumnSizePropertyValue ? undefined : -1;

            for (let obj of this.columnWidthObjects) {
                if (obj.queryName === queryName) {
                    obj.width = width;
                    // ToDo: make sure aligning size works
                }
            };

            // If AutoSize option is ON, remove the persisted value
            if (this.currentAutoColumnSizePropertyValue) {
                this.visualObjectInstancesToPersist = {
                    remove: [{
                        selector: { metadata: queryName },
                        objectName: 'general',
                        properties: { columnWidth: undefined }
                    }],
                };

                this.callHostToPersist(false);
            }

            // Else, do nothing. A Column Resize will be triggered soon
        }

        /**
         * Handler for a column width change by the user
         * @param {number} index zero-based index of the column, including hidden row header for table
         * @param {number} width new width
         */
        public onColumnWidthChanged(index: number, width: number): void {
            // Table has a hidden row headers column
            let colIndex = this.isMatrix ? index : index - 1;

            if (_.isEmpty(this.columnWidthObjects) || colIndex < 0 || colIndex >= this.columnWidthObjects.length)
                return;

            let queryName = this.columnWidthObjects[colIndex].queryName;

            // Column Autosize
            if (width === -1)
            {
                this.onColumnAutosized(queryName);
            }
            else {
                for (let obj of this.columnWidthObjects) {
                    if (obj.queryName === queryName) {
                        obj.width = width;
                    }
                };

                this.callHostToPersist(true);
            }
        }

        /**
         * Persist all column widths, called when autoSizeColumns flipped to false
         * @param {number[]} widthsToPersist Widths to persist, including an empty row header for table
         */
        public persistAllColumnWidths(widthsToPersist: number[]): void {
            // Table indices are offset with an empty header. 
            let widths = this.isMatrix ? widthsToPersist : widthsToPersist.slice(1, widthsToPersist.length);

            // ToDo: Handle this properly
            // This happens when autosizing turns OFF before knowing all widths (lots of columns outside of ViewPort)
            if (this.columnWidthObjects.length !== widths.length) {
                return;
            }

            // Pick the maximum for each queryName
            // This will ensure going from autoSize ON to OFF will not show any ellipsis
            let dictionary = new Array<number>();
            widths.forEach((w, i) => {
                let query = this.columnWidthObjects[i].queryName;
                if (dictionary[query] == null)
                    dictionary[query] = w;
                else
                    dictionary[query] = Math.max(w, dictionary[query]);
            });

            for (let obj of this.columnWidthObjects) {
                let width = dictionary[obj.queryName];
                if (width != null)
                    obj.width = width;
            }

            this.callHostToPersist(true);
        }

        /**
         * Construct a ColumnAutoSize object
         * @returns ColumnAutoSize object
         */
        private getAutoSizeColumnWidthObject(): VisualObjectInstance {
            return {
                selector: null,
                objectName: 'general',
                properties: {
                    autoSizeColumnWidth: this.currentAutoColumnSizePropertyValue
                }
            };
        }
        /**
         * Generate visualObjectInstances with autoSizeColumns and Column Widths
         */
        private generateVisualObjectInstancesToPersist(): void {
            // ToDo: Ensure lists need to be reset after call to persist

            // AutoSize Property
            this.visualObjectInstancesToPersist = {
                merge: [this.getAutoSizeColumnWidthObject()]
            };

            // Column Widths
            let added = new Array<boolean>();
            for (let obj of this.columnWidthObjects) {
                // Only persist width if we have a valid queryName to use as selector
                // ToDo: Not sure how we can have an item without a queryName
                if (obj.queryName && _.isNumber(obj.width) && !added[obj.queryName]) {
                    this.visualObjectInstancesToPersist.merge.push({
                        selector: { metadata: obj.queryName },
                        objectName: 'general',
                        properties: {
                            columnWidth: obj.width
                        }
                    });

                    added[obj.queryName] = true;
                }
            }
        }
    }
}