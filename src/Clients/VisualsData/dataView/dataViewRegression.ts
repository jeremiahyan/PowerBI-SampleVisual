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
    import RoleKindByQueryRef = DataViewAnalysis.RoleKindByQueryRef;

    export interface DataViewRegressionRunOptions {
        dataViewMappings: DataViewMapping[];
        transformedDataViews: DataView[];
        dataRoles: VisualDataRole[];
        objectDescriptors: DataViewObjectDescriptors;
        objectDefinitions: DataViewObjectDefinitions;
        colorAllocatorFactory: IColorAllocatorFactory;
        transformSelects: DataViewSelectTransform[];
        dataView: DataView;
        projectionActiveItems: DataViewProjectionActiveItems;
    }

    export module DataViewRegression {
        // TODO VSTS 6842046: Currently we are using a constant queryName since we don't have a way to generate
        // unique ones. There is a bug filed to do this by lawong, so this part will be fixed with that bug.
        const regressionXQueryName: string = 'RegressionX';
        export const regressionYQueryName: string = 'RegressionY';

        export function run(options: DataViewRegressionRunOptions): DataView[] {
            debug.assertValue(options, 'options');

            let dataViewMappings: DataViewMapping[] = options.dataViewMappings;
            let transformedDataViews: DataView[] = options.transformedDataViews;
            let dataRoles: VisualDataRole[] = options.dataRoles;
            let objectDescriptors: DataViewObjectDescriptors = options.objectDescriptors;
            let objectDefinitions: DataViewObjectDefinitions = options.objectDefinitions;
            let colorAllocatorFactory: IColorAllocatorFactory = options.colorAllocatorFactory;
            let transformSelects: DataViewSelectTransform[] = options.transformSelects;
            let projectionActiveItems = options.projectionActiveItems;
            let dataView: DataView = options.dataView;

            if (transformedDataViews.length === 1  && transformSelects && dataView.metadata) {
                // compute linear regression line if applicable
                let roleKindByQueryRef: RoleKindByQueryRef = DataViewSelectTransform.createRoleKindFromMetadata(transformSelects, dataView.metadata);
                let projections: QueryProjectionsByRole = DataViewSelectTransform.projectionsFromSelects(transformSelects, projectionActiveItems);
                if (!roleKindByQueryRef || !projections || _.isEmpty(dataViewMappings) || !objectDescriptors || !objectDefinitions)
                    return transformedDataViews;

                let applicableDataViewMappings: DataViewMapping[] = DataViewAnalysis.chooseDataViewMappings(projections, dataViewMappings, roleKindByQueryRef, objectDescriptors, objectDefinitions).supportedMappings;

                if (applicableDataViewMappings) {
                    let regressionDataViewMapping: DataViewMapping = _.find(applicableDataViewMappings, (dataViewMapping) => {
                        return dataViewMapping.usage && dataViewMapping.usage.regression;
                    });

                    if (regressionDataViewMapping) {
                        let regressionSource = transformedDataViews[0];
                        let regressionDataView: DataView = this.linearRegressionTransform(regressionSource, dataRoles, regressionDataViewMapping, objectDescriptors, objectDefinitions, colorAllocatorFactory);

                        if (regressionDataView)
                            transformedDataViews.push(regressionDataView);
                    }
                }
            }

            return transformedDataViews;
        }

        /**
         * This function will compute the linear regression algorithm on the sourceDataView and create a new dataView.
         * It works on scalar axis only.
         * The algorithm is as follows
         *
         * 1. Find the cartesian X and Y roles and the columns that correspond to those roles
         * 2. Order the X-Y value pairs by the X values
         * 3. Linearly map dates to their respective times and normalize since regression cannot be directly computed on dates
         * 4. Compute the actual regression:
         *    i.   xBar: average of X values, yBar: average of Y values
         *    ii.  ssXX: sum of squares of X values = Sum(xi - xBar)^2
         *    iii. ssXY: sum of squares of X and Y values  = Sum((xi - xBar)(yi - yBar)
         *    iv.  Slope: ssXY / ssXX
         *    v.   Intercept: yBar - xBar * slope
         * 5. Compute the X and Y points for regression line using Y = Slope * X + Intercept
         * 6. Create the new dataView using the points computed above
         */
        export function linearRegressionTransform(
            sourceDataView: DataView,
            dataRoles: VisualDataRole[],
            regressionDataViewMapping: DataViewMapping,
            objectDescriptors: DataViewObjectDescriptors,
            objectDefinitions: DataViewObjectDefinitions,
            colorAllocatorFactory: IColorAllocatorFactory): DataView {
            debug.assertValue(sourceDataView, 'sourceDataView');
            debug.assertValue(sourceDataView.categorical, 'sourceDataView.categorical');
            debug.assertValue(dataRoles, 'dataRoles');
            debug.assertValue(objectDescriptors, 'objectDescriptors');
            debug.assertValue(objectDefinitions, 'objectDefinitions');
            debug.assertValue(colorAllocatorFactory, 'colorAllocatorFactory');

            if (!sourceDataView.categorical)
                return;

            // Step 1
            let xRole: string = findRoleWithCartesianAxis(CartesianRoleKind.X, dataRoles);
            let yRole: string = findRoleWithCartesianAxis(CartesianRoleKind.Y, dataRoles);

            if (!xRole || !yRole)
                return;

            let xColumn = getColumnForCategoricalRole(xRole, sourceDataView.categorical);
            let yColumn = getColumnForCategoricalRole(yRole, sourceDataView.categorical);

            if (!xColumn || !yColumn)
                return;

            let unsortedXValues = xColumn.values;
            let unsortedYValues = yColumn.values;

            if (_.isEmpty(unsortedXValues) || _.isEmpty(unsortedYValues))
                return;

            // get the data type for each column; we will have null type when dataPoints have different type or if a value is null
            let xDataType: string = getDataType(unsortedXValues);
            if (!xDataType)
                return;
            let yDataType: string = getDataType(unsortedYValues);
            if (!yDataType)
                return;

            // Step 2
            let { xValues, yValues } = sortValues(unsortedXValues, unsortedYValues);
            let minCategoryValue = xValues[0];
            let maxCategoryValue = xValues[xValues.length - 1];

            // Step 3
            if (xDataType === 'Date')
                xValues = normalizeDateValues(xValues);

            // Step 4
            let { slope, intercept } = computeRegressionLine(xValues, yValues);

            // Step 5
            let minXValue = xValues[0];
            let maxXValue = xValues[xValues.length - 1];

            let newCategories = [minCategoryValue, maxCategoryValue];
            let newValues = [minXValue * slope + intercept, maxXValue * slope + intercept];

            // Step 6
            let regressionDataView: DataView = createRegressionDataView(xColumn, yColumn, newCategories, newValues, sourceDataView, regressionDataViewMapping, objectDescriptors, objectDefinitions, colorAllocatorFactory);

            return regressionDataView;
        }

        function findRoleWithCartesianAxis(cartesianRole: CartesianRoleKind, dataRoles: VisualDataRole[]): string {
            debug.assertValue(cartesianRole, 'cartesianRole');
            debug.assertValue(dataRoles, 'dataRoles');

            for (let dataRole of dataRoles) {
                if (dataRole.cartesianKind === cartesianRole)
                    return dataRole.name;
            }
        }

        function getColumnForCategoricalRole(roleName: string, categorical: DataViewCategorical): DataViewCategoryColumn | DataViewValueColumn {
            debug.assertValue(roleName, 'roleName');
            debug.assertValue(categorical, 'categorical');

            let categoryColumn = getRoleFromColumn(roleName, categorical.categories);
            if (categoryColumn)
                return categoryColumn;

            // Regression is not supported for multiple series yet, so return null column back
            if (categorical.values && categorical.values.source)
                return null;

            let valueColumn = getRoleFromColumn(roleName, categorical.values);
            if (valueColumn)
                return valueColumn;

            return null;
        }

        function getRoleFromColumn(roleName: string, columns: DataViewCategoricalColumn[] | DataViewValueColumn[]): DataViewCategoryColumn | DataViewValueColumn {
            debug.assertValue(roleName, 'roleName');

            if (_.isEmpty(columns))
                return;

            return _.find(columns, (column) => {
                return column.source.roles[roleName];
            });
        }

        function getDataType(values: any[]): string {
            if (_.isEmpty(values) || values[0] == null)
                return;

            let dataType: string = typeof values[0];

            if (_.some(values, (value) => value === null || typeof value !== dataType))
                return;

            return dataType;
        }

        function sortValues(unsortedXValues: any[], unsortedYValues: any[]): { xValues: any[], yValues: any[] } {
            debug.assertValue(unsortedXValues, 'unsortedXValues');
            debug.assertValue(unsortedYValues, 'unsortedYValues');

            let zippedValues = _.zip(unsortedXValues, unsortedYValues);
            let sortedValues = _.sortBy(zippedValues, (valuePair) => {
                return valuePair[0];
            });
            let [xValues, yValues] = _.unzip(sortedValues);
            return {
                xValues: xValues,
                yValues: yValues
            };
        }

        function normalizeDateValues(xValues: any[]): number[] {
            debug.assertValue(xValues, 'xValues');

            let initialTime = (<Date>xValues[0]).getTime();
            for (let i = 0; i < xValues.length; i++) {
                xValues[i] = (<Date>xValues[i]).getTime() - initialTime;
            }
            return xValues;
        }

        function computeRegressionLine(xValues: number[], yValues: number[]): { slope: number, intercept: number } {
            debug.assertValue(xValues, 'xValues');
            debug.assertValue(yValues, 'yValues');

            let xBar = _.sum(xValues) / xValues.length;
            let yBar = _.sum(yValues) / yValues.length;

            let ssXX = _.chain(xValues)
                .map((x) => {
                    return (x - xBar) ** 2;
                })
                .sum();

            let ssXY = _.chain(xValues)
                .map((x, i) => {
                    return (x - xBar) * (yValues[i] - yBar);
                })
                .sum();

            let slope = ssXY / ssXX;
            let intercept = yBar - (xBar * slope);

            return {
                slope: slope,
                intercept: intercept
            };
        }

        function createRegressionDataView(
            xColumn: DataViewCategoryColumn | DataViewValueColumn,
            yColumn: DataViewCategoryColumn | DataViewValueColumn,
            newCategories: any[],
            newValues: any[],
            sourceDataView: DataView,
            regressionDataViewMapping: DataViewMapping,
            objectDescriptors: DataViewObjectDescriptors,
            objectDefinitions: DataViewObjectDefinitions,
            colorAllocatorFactory: IColorAllocatorFactory): DataView {
            debug.assertValue(xColumn, 'xColumn');
            debug.assertValue(yColumn, 'yColumn');
            debug.assertValue(newCategories, 'newCategories');
            debug.assertValue(newValues, 'newValues');
            debug.assertValue(sourceDataView, 'sourceDataView');
            debug.assertValue(objectDescriptors, 'objectDescriptors');
            debug.assertValue(objectDefinitions, 'objectDefinitions');
            debug.assertValue(colorAllocatorFactory, 'colorAllocatorFactory');

            let xRole: string = (<DataViewRoleForMapping>regressionDataViewMapping.categorical.categories).for.in;
            let yRole: string = (<DataViewRoleForMapping>regressionDataViewMapping.categorical.values).for.in;
            let categoricalRoles: { [name: string]: boolean } = {};
            categoricalRoles[xRole] = true;
            let valueRoles: { [name: string]: boolean } = {};
            valueRoles[yRole] = true;

            let regressionDataView: DataView = createCategoricalDataViewBuilder()
                .withCategories([{
                    source: {
                        displayName: xColumn.source.displayName,
                        queryName: regressionXQueryName,
                        type: xColumn.source.type,
                        isMeasure: xColumn.source.isMeasure,  // false?
                        roles: categoricalRoles
                    },
                    values: newCategories
                }])
                .withValues({
                    columns: [{
                        source: {
                            displayName: yColumn.source.displayName,
                            queryName: regressionYQueryName,
                            type: yColumn.source.type,
                            isMeasure: yColumn.source.isMeasure,
                            roles: valueRoles
                        },
                        values: newValues
                    }]
                })
                .build();
            DataViewTransform.transformObjects(regressionDataView, data.StandardDataViewKinds.Categorical, objectDescriptors, objectDefinitions, [], colorAllocatorFactory);
            return regressionDataView;
        }
    }
}
