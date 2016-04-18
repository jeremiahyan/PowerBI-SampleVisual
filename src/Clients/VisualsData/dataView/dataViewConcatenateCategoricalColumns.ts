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
    import inheritSingle = Prototype.inheritSingle;
    import RoleKindByQueryRef = DataViewAnalysis.RoleKindByQueryRef;

    export module DataViewConcatenateCategoricalColumns {

        /* Represents a collection of DataViewCategoryColumn that are tied to the same role. */
        interface CategoryColumnsByRole {
            /* The name of the role shared by all the objects in the categories property. */
            roleName: string;

            /**
             * The list of columns that are tied to roleName, in the same order as they appear
             * in the categories property of their owner DataViewCategorical object.
             */
            categories: DataViewCategoryColumn[];
        }

        export function detectAndApply(dataView: DataView, roleMappings: DataViewMapping[], projectionOrdering: DataViewProjectionOrdering, selects: DataViewSelectTransform[], projectionActiveItems: DataViewProjectionActiveItems): DataView {
            debug.assertValue(dataView, 'dataView');
            debug.assertAnyValue(roleMappings, 'roleMappings');
            debug.assertAnyValue(projectionOrdering, 'projectionOrdering');

            let result = dataView;
            let dataViewCategorical: DataViewCategorical = dataView.categorical;

            if (dataViewCategorical) {
                let concatenationSource: CategoryColumnsByRole = detectCategoricalRoleForHierarchicalGroup(dataViewCategorical, dataView.metadata, roleMappings, selects, projectionActiveItems);

                if (concatenationSource) {
                    let columnsSortedByProjectionOrdering = sortColumnsByProjectionOrdering(projectionOrdering, concatenationSource.roleName, concatenationSource.categories);
                    if (columnsSortedByProjectionOrdering.length >= 2) {
                        result = applyConcatenation(dataView, concatenationSource.roleName, columnsSortedByProjectionOrdering);
                    }
                }
            }

            return result;
        }

        /**
         * Returns the role and its assocated category columns (from dataViewCategorical.categories)
         * that should be concatenated for the case of hierarchical group.
         *
         * Note: In the future if we support sibling hierarchical groups in categorical,
         * change the return type to CategoryColumnsByRole[] and update detection logic.
         */
        function detectCategoricalRoleForHierarchicalGroup(dataViewCategorical: DataViewCategorical, metadata: DataViewMetadata, dataViewMappings: DataViewMapping[], selects: DataViewSelectTransform[], projectionActiveItems: DataViewProjectionActiveItems): CategoryColumnsByRole {
            debug.assertValue(dataViewCategorical, 'dataViewCategorical');
            debug.assertAnyValue(dataViewMappings, 'dataViewMappings');

            let result: CategoryColumnsByRole;

            // For now, just handle the case where roleMappings.length === 1.
            // In the future, if there is more than 1, we might want to proceed if, 
            // for example, all role mappings map category to the same role name and they all have { max: 1 } conditions.
            let roleKinds: RoleKindByQueryRef = DataViewSelectTransform.createRoleKindFromMetadata(selects, metadata);
            let projections = DataViewSelectTransform.projectionsFromSelects(selects, projectionActiveItems);
            let roleMappings = DataViewAnalysis.chooseDataViewMappings(projections, dataViewMappings, roleKinds).supportedMappings;

            let roleMappingForCategorical: DataViewMapping = (roleMappings && roleMappings.length === 1 && !!roleMappings[0].categorical) ? roleMappings[0] : undefined;
            if (roleMappingForCategorical) {
                let roleNamesForCategory: string[] = getAllRolesInCategories(roleMappingForCategorical.categorical);

                // With "list" in role mapping, is it possible to have multiple role names for category.
                // For now, proceed to concatenate category columns only when categories are bound to 1 Role.
                // We can change this if we want to support independent (sibling) group hierarchies in categorical.
                if (roleNamesForCategory && roleNamesForCategory.length === 1) {
                    let targetRoleName = roleNamesForCategory[0];

                    let isVisualExpectingMaxOneCategoryColumn: boolean =
                        !_.isEmpty(roleMappingForCategorical.conditions) &&
                        _.every(roleMappingForCategorical.conditions, condition => condition[targetRoleName] && condition[targetRoleName].max === 1);

                    if (isVisualExpectingMaxOneCategoryColumn) {
                        let categoriesForTargetRole: DataViewCategoryColumn[] = _.filter(
                            dataViewCategorical.categories,
                            (categoryColumn: DataViewCategoryColumn) => categoryColumn.source.roles && !!categoryColumn.source.roles[targetRoleName]);

                        // At least for now, we expect all category columns for the same role to have the same number of value entries.
                        // If that's not the case, we won't run the concatenate logic for that role at all...
                        let areValuesCountsEqual: boolean = _.every(
                            categoriesForTargetRole,
                            (categoryColumn: DataViewCategoryColumn) => categoryColumn.values.length === categoriesForTargetRole[0].values.length);

                        // Also, there is no need to concatenate columns unless there is actually more than one column
                        if (areValuesCountsEqual &&
                            categoriesForTargetRole.length >= 2) {
                            result = {
                                roleName: targetRoleName,
                                categories: categoriesForTargetRole
                            };
                        }
                    }
                }
            }

            return result;
        }
        
        /**
         * Returns the array of role names that are mapped to categorical categories.
         * Returns an empty array if none exists.
         */
        function getAllRolesInCategories(categoricalRoleMapping: DataViewCategoricalMapping): string[] {
            debug.assertValue(categoricalRoleMapping, 'categoricalRoleMapping');

            let roleNames: string[] = [];
            DataViewMapping.visitCategoricalCategories(
                categoricalRoleMapping.categories,
                {
                    visitRole: (roleName: string) => {
                        roleNames.push(roleName);
                    }
                });

            return roleNames;
        }

        function applyConcatenation(dataView: DataView, roleName: string, columnsSortedByProjectionOrdering: DataViewCategoryColumn[]): DataView {
            debug.assertValue(dataView, 'dataView');
            debug.assertValue(roleName, 'roleName');
            debug.assert(columnsSortedByProjectionOrdering && columnsSortedByProjectionOrdering.length >= 2, 'columnsSortedByProjectionOrdering && columnsSortedByProjectionOrdering.length >= 2');

            let concatenatedValues: string[] = concatenateValues(columnsSortedByProjectionOrdering);

            let concatenatedColumnMetadata: DataViewMetadataColumn = createConcatenatedColumnMetadata(roleName, columnsSortedByProjectionOrdering);
            let transformedDataView = inheritSingle(dataView);
            addToMetadata(transformedDataView, concatenatedColumnMetadata);

            let concatenatedCategoryColumn: DataViewCategoryColumn = createConcatenatedCategoryColumn(
                columnsSortedByProjectionOrdering,
                concatenatedColumnMetadata,
                concatenatedValues);

            let dataViewCategorical: DataViewCategorical = dataView.categorical;

            let transformedCategoricalCategories: DataViewCategoryColumn[] = _.difference(dataViewCategorical.categories, columnsSortedByProjectionOrdering);
            transformedCategoricalCategories.push(concatenatedCategoryColumn);

            let transformedCategorical: DataViewCategorical = inheritSingle(dataViewCategorical);
            transformedCategorical.categories = transformedCategoricalCategories;
            transformedDataView.categorical = transformedCategorical;

            return transformedDataView;
        }

        function concatenateValues(columnsSortedByProjectionOrdering: DataViewCategoryColumn[]): string[] {
            debug.assertValue(columnsSortedByProjectionOrdering, 'columnsSortedByProjectionOrdering');

            let concatenatedValues: string[] = [];

            // concatenate the values in dataViewCategorical.categories[0..length-1].values[j], and store it in combinedValues[j]
            for (let categoryColumn of columnsSortedByProjectionOrdering) {
                for (let i = 0, len = categoryColumn.values.length; i < len; i++) {
                    // TODO VSTS 6842107: need to clean up this value concatenation logic
                    // This code does not have access to valueFormatter module.  So first, move valueFormatter.getFormatString(...)
                    // and/or valueFormatter.formatValueColumn(...) to somewhere near DataViewObjects.ts, and then use it from here.
                    let valueToAppend = categoryColumn.values && categoryColumn.values[i];
                    concatenatedValues[i] = (concatenatedValues[i] === undefined) ? (valueToAppend + '') : (valueToAppend + ' ' + concatenatedValues[i]);
                }
            }

            return concatenatedValues;
        }

        /**
        * Returns a new array of elements from columns as they are ordered for the specified roleName in the specified projectionOrdering.
        */
        function sortColumnsByProjectionOrdering(projectionOrdering: DataViewProjectionOrdering, roleName: string, columns: DataViewCategoryColumn[]): DataViewCategoryColumn[] {
            debug.assertAnyValue(projectionOrdering, 'projectionOrdering');
            debug.assertValue(roleName, 'roleName');
            debug.assertValue(columns, 'columns');

            let columnsInProjectionOrdering: DataViewCategoryColumn[];

            if (projectionOrdering) {
                // the numeric values in projectionOrdering correspond to the index property of DataViewMetadataColumn
                let columnsByIndex: { [index: number]: DataViewCategoricalColumn } = {};
                for (let column of columns) {
                    if (column.source.roles[roleName]) {
                        debug.assert(!columnsByIndex[column.source.index], 'The specified columns should not contain multiple columns with same index: ' + column.source.index);
                        columnsByIndex[column.source.index] = column;
                    }
                }

                let columnIndicesInProjectionOrdering: number[] = projectionOrdering[roleName];

                columnsInProjectionOrdering = _.chain(columnIndicesInProjectionOrdering)
                    .map(columnIndex => columnsByIndex[columnIndex])
                    .filter((column: DataViewCategoricalColumn) => !!column)
                    .value();
            }
            else {
                // If projectionOrder is unspecified, just return the columns for the specified role in their current order
                columnsInProjectionOrdering = _.filter(columns, column => column.source.roles[roleName]);
            }

            return columnsInProjectionOrdering;
        }

        /**
         * Creates the column metadata that will back the column with the concatenated values. 
         */
        function createConcatenatedColumnMetadata(roleName: string, columnsSortedByProjectionOrdering: DataViewCategoryColumn[]): DataViewMetadataColumn {
            debug.assertValue(roleName, 'roleName');
            debug.assertNonEmpty(columnsSortedByProjectionOrdering, 'columnsSortedByProjectionOrdering');

            let concatenatedDisplayName: string;

            let columnForCurrentDrillLevel = _.last(columnsSortedByProjectionOrdering);

            // By the end of the for-loop, consistentIsMeasure will be:
            // - true if _.every(categoryColumn, c => c.source.isMeasure === true), or else
            // - false if _.every(categoryColumn, c => c.source.isMeasure === false), or else
            // - undefined.
            let consistentIsMeasure: boolean = columnForCurrentDrillLevel.source.isMeasure;

            for (let categoryColumn of columnsSortedByProjectionOrdering) {
                let columnSource: DataViewMetadataColumn = categoryColumn.source;

                concatenatedDisplayName = (concatenatedDisplayName == null) ? columnSource.displayName : (columnSource.displayName + ' ' + concatenatedDisplayName);

                if (consistentIsMeasure !== columnSource.isMeasure) {
                    consistentIsMeasure = undefined;
                }
            }

            let newRoles: { [name: string]: boolean } = {};
            newRoles[roleName] = true;

            let newColumnMetadata: DataViewMetadataColumn = {
                displayName: concatenatedDisplayName,
                roles: newRoles,
                type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Text)
            };

            if (consistentIsMeasure !== undefined) {
                newColumnMetadata.isMeasure = consistentIsMeasure;
            }

            // TODO VSTS 6842046: Investigate whether we should change that property to mandatory or change the Chart visual code.
            // If queryName is not set at all, the column chart visual will only render column for the first group instance.
            // If queryName is set to any string other than columnForCurrentDrillLevel.source.queryName, then drilldown by group instance is broken (VSTS 6847879).
            newColumnMetadata.queryName = columnForCurrentDrillLevel.source.queryName;

            return newColumnMetadata;
        }

        function addToMetadata(transformedDataView: DataView, newColumn: DataViewMetadataColumn): void {
            debug.assertValue(transformedDataView, 'transformedDataView');
            debug.assertValue(newColumn, 'newColumn');

            let transformedColumns = inheritSingle(transformedDataView.metadata.columns);
            transformedColumns.push(newColumn);

            let transformedMetadata = inheritSingle(transformedDataView.metadata);
            transformedMetadata.columns = transformedColumns;

            transformedDataView.metadata = transformedMetadata;
        }

        function createConcatenatedCategoryColumn(
            sourceColumnsSortedByProjectionOrdering: DataViewCategoryColumn[],
            columnMetadata: DataViewMetadataColumn,
            concatenatedValues: string[]): DataViewCategoryColumn {
            debug.assert(sourceColumnsSortedByProjectionOrdering && sourceColumnsSortedByProjectionOrdering.length >= 2, 'sourceColumnsSortedByProjectionOrdering && sourceColumnsSortedByProjectionOrdering.length >= 2');

            let newCategoryColumn: DataViewCategoryColumn = {
                source: columnMetadata,
                values: concatenatedValues
            };

            // We expect every DataViewCategoryColumn in concatenationSourceColumns to have the same set of identities, always.
            // So, we'll just take the identities and identityFields from the first column
            let firstColumn = sourceColumnsSortedByProjectionOrdering[0];

            if (firstColumn.identity) {
                newCategoryColumn.identity = firstColumn.identity;
            }

            if (firstColumn.identityFields) {
                newCategoryColumn.identityFields = firstColumn.identityFields;
            }

            // I doubt that any firstColumn.objects property would still make sense in the new column,
            // so I won't copy that over for now.

            return newCategoryColumn;
        }
    }
}