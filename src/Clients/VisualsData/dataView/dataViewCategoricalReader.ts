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

module powerbi.data {
    import DataRoleHelper = powerbi.data.DataRoleHelper;

    export function createIDataViewCategoricalReader(dataView): IDataViewCategoricalReader {
        return new DataViewCategoricalReader(dataView);
    }

    export interface IDataViewCategoricalReader {
        // Category functions
        hasCategories(): boolean;
        getCategoryCount(): number;
        getCategoryValues(roleName: string): any;
        getCategoryValue(categoryIndex: number, roleName: string): any;
        getCategoryColumn(roleName: string): DataViewCategoryColumn;
        getCategoryMetadataColumn(roleName: string): DataViewMetadataColumn;
        getCategoryDisplayName(roleName: string): string;
        hasCompositeCategories(): boolean;
        hasCategoryWithRole(roleName: string): boolean;
        getCategoryObjects(categoryIndex: number, roleName: string): DataViewObjects;
        // Value functions
        hasValues(roleName: string): boolean;
        getValues(roleName: string, seriesIndex?: number): any[];
        getValue(roleName: string, categoryIndex: number, seriesIndex?: number): any;
        /**
         * Obtains the first non-null value for the given role name and category index.
         * It should mainly be used for values that are expected to be the same across
         * series, but avoids false nulls when the data is sparse.
         */
        getFirstNonNullValueForCategory(roleName: string, categoryIndex: number): any;
        getMeasureQueryName(roleName: string): string;
        getValueColumn(roleName: string, seriesIndex?: number): DataViewValueColumn;
        getValueMetadataColumn(roleName: string, seriesIndex?: number): DataViewMetadataColumn;
        getValueDisplayName(roleName: string, seriesIndex?: number): string;
        // Series Methods
        hasDynamicSeries(): boolean;
        getSeriesCount(): number;
        getSeriesObjects(seriesIndex: number): DataViewObjects;
        getSeriesColumn(seriesIndex: number): DataViewValueColumn;
        getSeriesColumns(): DataViewValueColumns;
        getSeriesMetadataColumn(): DataViewMetadataColumn;
        getSeriesColumnIdentifier(): powerbi.data.ISQExpr[];
        getSeriesName(seriesIndex: number): PrimitiveValue;
        getSeriesDisplayName(): string;
    }

    class DataViewCategoricalReader implements IDataViewCategoricalReader {
        private dataView: DataView;
        private categories: DataViewCategoryColumn[];
        private grouped: DataViewValueColumnGroup[];
        private dataHasDynamicSeries: boolean;
        
        // Validation variables
        private hasValidCategories: boolean;
        private hasAnyValidValues: boolean;
        private hasCategoryObjects: boolean;

        constructor(dataView: DataView) {
            debug.assertValue(dataView, 'dataView');
            this.dataView = dataView;
            // Validate categories
            let categorical: DataViewCategorical;
            if (dataView)
                categorical = dataView.categorical;
            let categories: DataViewCategoryColumn[];
            if (categorical)
                categories = this.categories = categorical.categories;
            this.hasValidCategories = !_.isEmpty(categories);
            if (this.hasValidCategories) {
                this.hasCategoryObjects = !!(categories[0].objects);
            }

            // Validate values
            let values: DataViewValueColumns;
            if (categorical)
                values = categorical.values;
            let hasAnyValidValues = this.hasAnyValidValues = !_.isEmpty(values);
            if (hasAnyValidValues)
                this.grouped = dataView.categorical.values.grouped();

            if (this.hasAnyValidValues)
                this.dataHasDynamicSeries = !!this.dataView.categorical.values.source;
        }

        // Category methods
        
        public hasCategories(): boolean {
            return this.hasValidCategories;
        }

        public getCategoryCount(): number {
            if (this.hasValidCategories)
                return this.categories[0].values.length;
            else
                return 0;
        }

        public getCategoryValues(roleName: string): any {
            if (this.hasValidCategories) {
                let categories = this.getCategoryFromRole(roleName);
                return categories ? categories.values : undefined;
            }
        }

        public getCategoryValue(categoryIndex: number, roleName: string): any {
            if (this.hasValidCategories) {
                let categories = this.getCategoryFromRole(roleName);
                return categories ? categories.values[categoryIndex] : undefined;
            }
        }

        public getCategoryColumn(roleName: string): DataViewCategoryColumn {
            if (this.hasValidCategories)
                return this.getCategoryFromRole(roleName);
        }

        public getCategoryMetadataColumn(roleName: string): DataViewMetadataColumn {
            if (this.hasValidCategories) {
                let categories = this.getCategoryFromRole(roleName);
                return categories ? categories.source : undefined;
            }
        }

        public getCategoryDisplayName(roleName: string): string {
            if (this.hasValidCategories) {
                let targetColumn = this.getCategoryColumn(roleName);
                if (targetColumn && targetColumn.source) {
                    return targetColumn.source.displayName;
                }
            }
        }

        public hasCompositeCategories(): boolean {
            if (this.hasValidCategories)
                return this.categories.length > 1;
        }

        public hasCategoryWithRole(roleName: string): boolean {
            return DataRoleHelper.getCategoryIndexOfRole(this.categories, roleName) !== -1;
        }

        public getCategoryObjects(categoryIndex: number, roleName: string): DataViewObjects {
            if (this.hasValidCategories && this.hasCategoryObjects)
                return this.getCategoryFromRole(roleName).objects[categoryIndex];
        }

        private getCategoryFromRole(roleName: string): DataViewCategoryColumn {
            let categories = this.categories;
            return categories[DataRoleHelper.getCategoryIndexOfRole(categories, roleName)];
        }

        // Value and measure methods

        public hasValues(roleName: string): boolean {
            return this.getMeasureIndex(roleName) !== -1;
        }

        public getValues(roleName: string, seriesIndex: number = 0): any[] {
            let measureIndex = this.getMeasureIndex(roleName);
            if (this.hasAnyValidValues && measureIndex !== -1)
                return this.grouped[seriesIndex].values[measureIndex].values;
        }

        public getValue(roleName: string, categoryIndex: number, seriesIndex?: number): any {
            if (this.hasAnyValidValues) {
                let values = this.getValues(roleName, seriesIndex);
                return values ? values[categoryIndex] : undefined;
            }
        }

        public getFirstNonNullValueForCategory(roleName: string, categoryIndex: number): any {
            if (this.hasAnyValidValues) {
                if (!this.dataHasDynamicSeries) {
                    debug.assert(this.grouped.length === 1, "getFirstNonNullValueForCategory shouldn't be called if you have a static series");
                    return this.getValue(roleName, categoryIndex);
                }
                for (let seriesIndex = 0, seriesCount = this.grouped.length; seriesIndex < seriesCount; seriesIndex++) {
                    let values = this.getValues(roleName, seriesIndex);
                    let value = !_.isEmpty(values) ? values[categoryIndex] : undefined;
                    if (value != null) {
                        return value;
                    }
                }
            }
        }

        public getMeasureQueryName(roleName: string): string {
            let measureIndex = this.getMeasureIndex(roleName);
            if (this.hasAnyValidValues && measureIndex !== -1)
                return this.grouped[0].values[measureIndex].source.queryName;
        }

        public getValueColumn(roleName: string, seriesIndex: number = 0): DataViewValueColumn {
            let measureIndex = this.getMeasureIndex(roleName);
            if (this.hasAnyValidValues && measureIndex !== -1)
                return this.grouped[seriesIndex].values[measureIndex];
        }

        public getValueMetadataColumn(roleName: string, seriesIndex: number = 0): DataViewMetadataColumn {
            let measureIndex = this.getMeasureIndex(roleName);
            if (this.hasAnyValidValues && measureIndex !== -1)
                return this.grouped[seriesIndex].values[measureIndex].source;
        }

        public getValueDisplayName(roleName: string, seriesIndex?: number): string {
            if (this.hasAnyValidValues) {
                let targetColumn = this.getValueColumn(roleName, seriesIndex);
                if (targetColumn && targetColumn.source) {
                    return targetColumn.source.displayName;
                }
            }
        }

        private getMeasureIndex(roleName: string): number {
            return DataRoleHelper.getMeasureIndexOfRole(this.grouped, roleName);
        }

        // Series methods

        public hasDynamicSeries(): boolean {
            return this.dataHasDynamicSeries;
        }

        public getSeriesCount(): number {
            if (this.hasAnyValidValues)
                return this.grouped.length;
        }

        public getSeriesObjects(seriesIndex: number): DataViewObjects {
            if (this.hasAnyValidValues)
                return this.grouped[seriesIndex].objects;
        }

        public getSeriesColumn(seriesIndex: number): DataViewValueColumn {
            if (this.hasAnyValidValues)
                return this.dataView.categorical.values[seriesIndex];
        }

        public getSeriesColumns(): DataViewValueColumns {
            if (this.hasAnyValidValues)
                return this.dataView.categorical.values;
        }

        public getSeriesMetadataColumn(): DataViewMetadataColumn {
            if (this.hasAnyValidValues)
                return this.dataView.categorical.values.source;
        }

        public getSeriesColumnIdentifier(): powerbi.data.ISQExpr[] {
            if (this.hasAnyValidValues)
                return this.dataView.categorical.values.identityFields;
        }

        public getSeriesName(seriesIndex: number): PrimitiveValue {
            if (this.hasAnyValidValues)
                return this.grouped[seriesIndex].name;
        }

        public getSeriesDisplayName(): string {
            if (this.hasAnyValidValues && this.dataHasDynamicSeries)
                return this.dataView.categorical.values.source.displayName;
        }
    }
}