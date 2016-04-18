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
    import inherit = Prototype.inherit;
    import inheritSingle = Prototype.inheritSingle;
    import ArrayExtensions = jsCommon.ArrayExtensions;
    import EnumExtensions = jsCommon.EnumExtensions;
    import INumberDictionary = jsCommon.INumberDictionary;

    export interface DataViewTransformApplyOptions {
        prototype: DataView;
        objectDescriptors: DataViewObjectDescriptors;
        dataViewMappings?: DataViewMapping[];
        transforms: DataViewTransformActions;
        colorAllocatorFactory: IColorAllocatorFactory;
        dataRoles: VisualDataRole[];
    }

    /** Describes the Transform actions to be done to a prototype DataView. */
    export interface DataViewTransformActions {
        /** Describes transform metadata for each semantic query select item, as the arrays align, by index. */
        selects?: DataViewSelectTransform[];

        /** Describes the DataViewObject definitions. */
        objects?: DataViewObjectDefinitions;

        /** Describes the splitting of a single input DataView into multiple DataViews. */
        splits?: DataViewSplitTransform[];

        /** Describes the projection metadata which includes projection ordering and active items. */
        roles?: DataViewRoleTransformMetadata;
    }

    export interface DataViewSplitTransform {
        selects: INumberDictionary<boolean>;
    }

    export interface DataViewProjectionOrdering {
        [roleName: string]: number[];
    }

    export interface DataViewProjectionActiveItems {
        [roleName: string]: string[];
    }

    export interface DataViewRoleTransformMetadata {
        /** Describes the order of selects (referenced by query index) in each role. */
        ordering?: DataViewProjectionOrdering;

        /** Describes the active items in each role. */
        activeItems?: DataViewProjectionActiveItems;
    }

    export interface MatrixTransformationContext {
        rowHierarchyRewritten: boolean;
        columnHierarchyRewritten: boolean;
        hierarchyTreesRewritten: boolean;
    }

    interface ValueRewrite<T> {
        from: T;
        to: T;
    }

    interface NumberToNumberMapping {
        [position: number]: number;
    }

    const enum CategoricalDataViewTransformation {
        None,
        Pivot,
        SelfCrossJoin,
    }

    export const enum StandardDataViewKinds {
        None = 0,
        Categorical = 1,
        Matrix = 1 << 1,
        Single = 1 << 2,
        Table = 1 << 3,
        Tree = 1 << 4,
    }

    // TODO: refactor & focus DataViewTransform into a service with well-defined dependencies.
    export module DataViewTransform {
        const fillRulePropertyDescriptor: DataViewObjectPropertyDescriptor = { type: { fillRule: {} } };
        
        const enum ColumnIdentifierKind {
            QueryName,
            Role,
        }

        export function apply(options: DataViewTransformApplyOptions): DataView[] {
            debug.assertValue(options, 'options');

            // TODO: Flow a context object through to capture errors/warnings about what happens here for better diagnosability.

            let prototype = options.prototype,
                objectDescriptors = options.objectDescriptors,
                dataViewMappings = options.dataViewMappings,
                transforms = options.transforms,
                projectionActiveItems = transforms && transforms.roles && transforms.roles.activeItems,
                colorAllocatorFactory = options.colorAllocatorFactory,
                dataRoles = options.dataRoles;

            if (!prototype)
                return transformEmptyDataView(objectDescriptors, transforms, colorAllocatorFactory);

            if (!transforms)
                return [prototype];

            // Transform Query DataView
            prototype = DataViewPivotCategoricalToPrimaryGroups.unpivotResult(prototype, transforms.selects, dataViewMappings, projectionActiveItems);
            let transformedDataViews: DataView[] = transformQueryToVisualDataView(prototype, transforms, objectDescriptors, dataViewMappings, colorAllocatorFactory, dataRoles);

            // Transform and generate derived visual DataViews
            transformedDataViews = DataViewRegression.run({
                dataViewMappings: dataViewMappings,
                transformedDataViews: transformedDataViews,
                dataRoles: dataRoles,
                objectDescriptors: objectDescriptors,
                objectDefinitions: transforms.objects,
                colorAllocatorFactory: colorAllocatorFactory,
                transformSelects: transforms.selects,
                dataView: prototype,
                projectionActiveItems: projectionActiveItems,
            });

            return transformedDataViews;
        }

        function transformQueryToVisualDataView(
            prototype: DataView,
            transforms: DataViewTransformActions,
            objectDescriptors: DataViewObjectDescriptors,
            dataViewMappings: DataViewMapping[],
            colorAllocatorFactory: IColorAllocatorFactory,
            dataRoles: VisualDataRole[]): DataView[] {
            let transformedDataViews: DataView[] = [];
            let splits = transforms.splits;
            if (_.isEmpty(splits)) {
                transformedDataViews.push(transformDataView(prototype, objectDescriptors, dataViewMappings, transforms, colorAllocatorFactory, dataRoles));
            } else {
                for (let split of splits) {
                    let transformed = transformDataView(prototype, objectDescriptors, dataViewMappings, transforms, colorAllocatorFactory, dataRoles, split.selects);
                    transformedDataViews.push(transformed);
                }
            }
            return transformedDataViews;
        }

        function transformEmptyDataView(objectDescriptors: DataViewObjectDescriptors, transforms: DataViewTransformActions, colorAllocatorFactory: IColorAllocatorFactory): DataView[] {
            if (transforms && transforms.objects) {
                let emptyDataView: DataView = {
                    metadata: {
                        columns: [],
                    }
                };

                transformObjects(
                    emptyDataView,
                    StandardDataViewKinds.None,
                    objectDescriptors,
                    transforms.objects,
                    transforms.selects,
                    colorAllocatorFactory);

                return [emptyDataView];
            }

            return [];
        }

        function transformDataView(
            prototype: DataView,
            objectDescriptors: DataViewObjectDescriptors,
            roleMappings: DataViewMapping[],
            transforms: DataViewTransformActions,
            colorAllocatorFactory: IColorAllocatorFactory,
            dataRoles: VisualDataRole[],
            selectsToInclude?: INumberDictionary<boolean>): DataView {
            debug.assertValue(prototype, 'prototype');

            let targetKinds = getTargetKinds(roleMappings);
            let transformed = inherit(prototype);
            transformed.metadata = inherit(prototype.metadata);

            let projectionOrdering = transforms.roles && transforms.roles.ordering;
            let projectionActiveItems = transforms.roles && transforms.roles.activeItems;
            transformed = transformSelects(transformed, roleMappings, transforms.selects, projectionOrdering, selectsToInclude);
            transformObjects(transformed, targetKinds, objectDescriptors, transforms.objects, transforms.selects, colorAllocatorFactory);

            // Note: Do this step after transformObjects() so that metadata columns in 'transformed' have roles and objects.general.formatString populated
            transformed = DataViewConcatenateCategoricalColumns.detectAndApply(transformed, roleMappings, projectionOrdering, transforms.selects, projectionActiveItems);

            DataViewNormalizeValues.apply({
                dataview: transformed,
                dataViewMappings: roleMappings,
                dataRoles: dataRoles,
            });

            return transformed;
        }

        function getTargetKinds(roleMappings: DataViewMapping[]): StandardDataViewKinds {
            debug.assertAnyValue(roleMappings, 'roleMappings');

            if (!roleMappings)
                return StandardDataViewKinds.None;

            let result = StandardDataViewKinds.None;
            for (let roleMapping of roleMappings) {
                if (roleMapping.categorical)
                    result |= StandardDataViewKinds.Categorical;
                if (roleMapping.matrix)
                    result |= StandardDataViewKinds.Matrix;
                if (roleMapping.single)
                    result |= StandardDataViewKinds.Single;
                if (roleMapping.table)
                    result |= StandardDataViewKinds.Table;
                if (roleMapping.tree)
                    result |= StandardDataViewKinds.Tree;
            }
            return result;
        }

        function transformSelects(
            dataView: DataView,
            roleMappings: DataViewMapping[],
            selectTransforms: DataViewSelectTransform[],
            projectionOrdering?: DataViewProjectionOrdering,
            selectsToInclude?: INumberDictionary<boolean>): DataView {

            let columnRewrites: ValueRewrite<DataViewMetadataColumn>[] = [];
            if (selectTransforms) {
                dataView.metadata.columns = applyTransformsToColumns(
                    dataView.metadata.columns,
                    selectTransforms,
                    columnRewrites);
            }

            // NOTE: no rewrites necessary for Tree (it doesn't reference the columns)
            if (dataView.categorical) {
                dataView.categorical = applyRewritesToCategorical(dataView.categorical, columnRewrites, selectsToInclude);

                // TODO VSTS 7024199: separate out structural transformations from dataViewTransform.transformSelects(...)
                // NOTE: This is slightly DSR-specific.
                dataView = pivotIfNecessary(dataView, roleMappings);
            }

            if (dataView.matrix) {
                let matrixTransformationContext: MatrixTransformationContext = {
                    rowHierarchyRewritten: false,
                    columnHierarchyRewritten: false,
                    hierarchyTreesRewritten: false
                };
                dataView.matrix = applyRewritesToMatrix(dataView.matrix, columnRewrites, roleMappings, projectionOrdering, matrixTransformationContext);

                // TODO VSTS 7024199: separate out structural transformations from dataViewTransform.transformSelects(...)
                if (shouldPivotMatrix(dataView.matrix, roleMappings))
                    DataViewPivotMatrix.apply(dataView.matrix, matrixTransformationContext);
            }

            if (dataView.table)
                dataView.table = applyRewritesToTable(dataView.table, columnRewrites, roleMappings, projectionOrdering);

            return dataView;
        }

        function applyTransformsToColumns(
            prototypeColumns: DataViewMetadataColumn[],
            selects: DataViewSelectTransform[],
            rewrites: ValueRewrite<DataViewMetadataColumn>[]): DataViewMetadataColumn[] {
            debug.assertValue(prototypeColumns, 'columns');

            if (!selects)
                return prototypeColumns;

            //column may contain undefined entries
            let columns = inherit(prototypeColumns);

            for (let i = 0, len = prototypeColumns.length; i < len; i++) {
                let prototypeColumn = prototypeColumns[i];
                let select = selects[prototypeColumn.index];
                if (!select)
                    continue;

                let column: DataViewMetadataColumn = columns[i] = inherit(prototypeColumn);

                if (select.roles)
                    column.roles = select.roles;
                if (select.type)
                    column.type = select.type;
                column.format = getFormatForColumn(select, column);

                if (select.displayName)
                    column.displayName = select.displayName;
                if (select.queryName)
                    column.queryName = select.queryName;
                if (select.kpi)
                    column.kpi = select.kpi;
                if (select.sort)
                    column.sort = select.sort;
                if (select.discourageAggregationAcrossGroups)
                    column.discourageAggregationAcrossGroups = select.discourageAggregationAcrossGroups;

                rewrites.push({
                    from: prototypeColumn,
                    to: column,
                });
            }

            return columns;
        }

        /**
         * Get the column format. Order of precendence is:
         *  1. Select format
         *  2. Column format
         */
        function getFormatForColumn(select: DataViewSelectTransform, column: DataViewMetadataColumn): string {
            // TODO: we already copied the select.Format to column.format, we probably don't need this check
            return select.format || column.format;
        }

        function applyRewritesToCategorical(prototype: DataViewCategorical, columnRewrites: ValueRewrite<DataViewMetadataColumn>[], selectsToInclude?: INumberDictionary<boolean>): DataViewCategorical {
            debug.assertValue(prototype, 'prototype');
            debug.assertValue(columnRewrites, 'columnRewrites');

            let categorical = inherit(prototype);

            function override(value: { source?: DataViewMetadataColumn }) {
                let rewrittenSource = findOverride(value.source, columnRewrites);
                if (rewrittenSource) {
                    let rewritten = inherit(value);
                    rewritten.source = rewrittenSource;
                    return rewritten;
                }
            }

            let categories = Prototype.overrideArray(prototype.categories, override);
            if (categories)
                categorical.categories = categories;

            let values = Prototype.overrideArray(prototype.values, override);

            if (values) {
                if (selectsToInclude) {
                    for (let i = values.length - 1; i >= 0; i--) {
                        if (!selectsToInclude[values[i].source.index])
                            values.splice(i, 1);
                    }
                }

                if (values.source) {
                    if (selectsToInclude && !selectsToInclude[values.source.index]) {
                        values.source = undefined;
                    }
                    else {
                        let rewrittenValuesSource = findOverride(values.source, columnRewrites);
                        if (rewrittenValuesSource)
                            values.source = rewrittenValuesSource;
                    }
                }

                categorical.values = values;
                setGrouped(values);
            }

            return categorical;
        }

        function applyRewritesToTable(
            prototype: DataViewTable,
            columnRewrites: ValueRewrite<DataViewMetadataColumn>[],
            roleMappings: DataViewMapping[],
            projectionOrdering: DataViewProjectionOrdering): DataViewTable {
            debug.assertValue(prototype, 'prototype');
            debug.assertValue(columnRewrites, 'columnRewrites');

            // Don't perform this potentially expensive transform unless we actually have a table.
            // When we switch to lazy per-visual DataView creation, we'll be able to remove this check.
            if (!roleMappings || roleMappings.length !== 1 || !roleMappings[0].table)
                return prototype;

            let table = inherit(prototype);

            // Copy the rewritten columns into the table view
            let override = (metadata: DataViewMetadataColumn) => findOverride(metadata, columnRewrites);
            let columns = Prototype.overrideArray(prototype.columns, override);
            if (columns)
                table.columns = columns;

            if (!projectionOrdering)
                return table;

            let newToOldPositions = createTableColumnPositionMapping(projectionOrdering, columnRewrites);
            if (!newToOldPositions)
                return table;

            // Reorder the columns
            let columnsClone = columns.slice(0);
            let keys = Object.keys(newToOldPositions);
            for (let i = 0, len = keys.length; i < len; i++) {
                let sourceColumn = columnsClone[newToOldPositions[keys[i]]];

                // In the case we've hit the end of our columns array, but still have position reordering keys,
                // there is a duplicate column so we will need to add a new column for the duplicate data
                if (i === columns.length)
                    columns.push(sourceColumn);
                else {
                    debug.assert(i < columns.length, 'The column index is out of range for reordering.');
                    columns[i] = sourceColumn;
                }
            }

            // Reorder the rows
            let rows = Prototype.overrideArray(table.rows,
                (row: any[]) => {
                    let newRow: any[] = [];
                    for (let i = 0, len = keys.length; i < len; ++i)
                        newRow[i] = row[newToOldPositions[keys[i]]];

                    return newRow;
                });

            if (rows)
                table.rows = rows;

            return table;
        }

        /** Creates a mapping of new position to original position. */
        function createTableColumnPositionMapping(
            projectionOrdering: DataViewProjectionOrdering,
            columnRewrites: ValueRewrite<DataViewMetadataColumn>[]): NumberToNumberMapping {
            let roles = Object.keys(projectionOrdering);

            // If we have more than one role then the ordering of columns between roles is ambiguous, so don't reorder anything.
            if (roles.length !== 1)
                return;

            let role = roles[0],
                originalOrder = _.map(columnRewrites, (rewrite: ValueRewrite<DataViewMetadataColumn>) => rewrite.from.index),
                newOrder = projectionOrdering[role];

            return createOrderMapping(originalOrder, newOrder);
        }

        function applyRewritesToMatrix(
            prototype: DataViewMatrix,
            columnRewrites: ValueRewrite<DataViewMetadataColumn>[],
            roleMappings: DataViewMapping[],
            projectionOrdering: DataViewProjectionOrdering,
            context: MatrixTransformationContext): DataViewMatrix {
            debug.assertValue(prototype, 'prototype');
            debug.assertValue(columnRewrites, 'columnRewrites');

            // Don't perform this potentially expensive transform unless we actually have a matrix.
            // When we switch to lazy per-visual DataView creation, we'll be able to remove this check.
            if (!roleMappings || roleMappings.length < 1 || !(roleMappings[0].matrix || (roleMappings[1] && roleMappings[1].matrix)))
                return prototype;

            let matrixMapping = roleMappings[0].matrix || roleMappings[1].matrix;
            let matrix = inherit(prototype);

            function override(metadata: DataViewMetadataColumn) {
                return findOverride(metadata, columnRewrites);
            }

            function overrideHierarchy(hierarchy: DataViewHierarchy): DataViewHierarchy {
                let rewrittenHierarchy: DataViewHierarchy = null;

                let newLevels = Prototype.overrideArray(
                    hierarchy.levels,
                    (level: DataViewHierarchyLevel) => {
                        let newLevel: DataViewHierarchyLevel = null;
                        let levelSources = Prototype.overrideArray(level.sources, override);
                        if (levelSources)
                            newLevel = ensureRewritten<DataViewHierarchyLevel>(newLevel, level, h => h.sources = levelSources);

                        return newLevel;
                    });
                if (newLevels)
                    rewrittenHierarchy = ensureRewritten<DataViewHierarchy>(rewrittenHierarchy, hierarchy, r => r.levels = newLevels);

                return rewrittenHierarchy;
            }

            let rows = overrideHierarchy(matrix.rows);
            if (rows) {
                matrix.rows = rows;
                context.rowHierarchyRewritten = true;
            }

            let columns = overrideHierarchy(matrix.columns);
            if (columns) {
                matrix.columns = columns;
                context.columnHierarchyRewritten = true;
            }

            let valueSources = Prototype.overrideArray(matrix.valueSources, override);
            if (valueSources) {
                matrix.valueSources = valueSources;

                // Only need to reorder if we have more than one value source, and they are all bound to the same role
                let matrixValues = <DataViewRoleForMapping>matrixMapping.values;
                if (projectionOrdering && valueSources.length > 1 && matrixValues && matrixValues.for) {
                    let columnLevels = columns.levels.length;
                    if (columnLevels > 0) {
                        let newToOldPositions = createMatrixValuesPositionMapping(matrixValues, projectionOrdering, valueSources, columnRewrites);
                        if (newToOldPositions) {
                            let keys = Object.keys(newToOldPositions);
                            let numKeys = keys.length;

                            // Reorder the value columns
                            columns.root = DataViewPivotMatrix.cloneTree(columns.root);
                            if (columnLevels === 1)
                                reorderChildNodes(columns.root, newToOldPositions);
                            else
                                forEachNodeAtLevel(columns.root, columnLevels - 2, (node: DataViewMatrixNode) => reorderChildNodes(node, newToOldPositions));

                            // Reorder the value rows
                            matrix.rows.root = DataViewPivotMatrix.cloneTreeExecuteOnLeaf(matrix.rows.root, (node: DataViewMatrixNode) => {

                                if (!node.values)
                                    return;

                                let newValues: { [id: number]: DataViewTreeNodeValue } = {};

                                let iterations = Object.keys(node.values).length / numKeys;
                                for (let i = 0, len = iterations; i < len; i++) {
                                    let offset = i * numKeys;
                                    for (let keysIndex = 0; keysIndex < numKeys; keysIndex++)
                                        newValues[offset + keysIndex] = node.values[offset + newToOldPositions[keys[keysIndex]]];
                                }

                                node.values = newValues;
                            });

                            context.hierarchyTreesRewritten = true;
                        }
                    }
                }
            }

            reorderMatrixCompositeGroups(matrix, matrixMapping, projectionOrdering);

            return matrix;
        }

        function reorderChildNodes(node: DataViewMatrixNode, newToOldPositions: NumberToNumberMapping): void {
            let keys = Object.keys(newToOldPositions);
            let numKeys = keys.length;
            let children = node.children;

            let childrenClone = children.slice(0);
            for (let i = 0, len = numKeys; i < len; i++) {
                let sourceColumn = childrenClone[newToOldPositions[keys[i]]];

                // In the case we've hit the end of our columns array, but still have position reordering keys,
                // there is a duplicate column so we will need to add a new column for the duplicate data
                if (i === children.length)
                    children.push(sourceColumn);
                else {
                    debug.assert(i < children.length, 'The column index is out of range for reordering.');
                    children[i] = sourceColumn;
                }
            }
        }

        /**
         * Returns a inheritSingle() version of the specified prototype DataViewMatrix with any composite group levels
         * and values re-ordered by projection ordering.
         * Returns undefined if no re-ordering under the specified prototype is necessary.
         */
        function reorderMatrixCompositeGroups(
            prototype: DataViewMatrix,
            supportedDataViewMapping: DataViewMatrixMapping,
            projection: DataViewProjectionOrdering): DataViewMatrix {

            let transformedDataView: DataViewMatrix;

            if (prototype && supportedDataViewMapping && projection) {

                // reorder levelValues in any composite groups in rows hierarchy
                let transformedRowsHierarchy: DataViewHierarchy;
                DataViewMapping.visitMatrixItems(supportedDataViewMapping.rows, {
                    visitRole: (role: string, context?: RoleItemContext): void => {
                        transformedRowsHierarchy = reorderMatrixHierarchyCompositeGroups(
                            transformedRowsHierarchy || prototype.rows,
                            role,
                            projection);
                    }
                });
                
                // reorder levelValues in any composite groups in columns hierarchy
                let transformedColumnsHierarchy: DataViewHierarchy;
                DataViewMapping.visitMatrixItems(supportedDataViewMapping.columns, {
                    visitRole: (role: string, context?: RoleItemContext): void => {
                        transformedColumnsHierarchy = reorderMatrixHierarchyCompositeGroups(
                            transformedColumnsHierarchy || prototype.columns,
                            role,
                            projection);
                    }
                });

                if (transformedRowsHierarchy || transformedColumnsHierarchy) {
                    transformedDataView = inheritSingle(prototype);
                    transformedDataView.rows = transformedRowsHierarchy || transformedDataView.rows;
                    transformedDataView.columns = transformedColumnsHierarchy || transformedDataView.columns;
                }
            }

            return transformedDataView;
        }

        /**
         * Returns a inheritSingle() version of the specified matrixHierarchy with any composite group levels and  
         * values re-ordered by projection ordering.
         * Returns undefined if no re-ordering under the specified matrixHierarchy is necessary.
         */
        function reorderMatrixHierarchyCompositeGroups(
            matrixHierarchy: DataViewHierarchy,
            hierarchyRole: string,
            projection: DataViewProjectionOrdering): DataViewHierarchy {
            debug.assertValue(matrixHierarchy, 'matrixHierarchy');
            debug.assertValue(hierarchyRole, 'hierarchyRole');
            debug.assertValue(projection, 'projection');

            let transformedHierarchy: DataViewHierarchy;
            let selectIndicesInProjectionOrder: number[] = projection[hierarchyRole];

            // reordering needs to happen only if there are multiple columns for the hierarchy's role in the projection
            let hasMultipleColumnsInProjection = selectIndicesInProjectionOrder && selectIndicesInProjectionOrder.length >= 2;
            if (hasMultipleColumnsInProjection && !_.isEmpty(matrixHierarchy.levels)) {
                for (let i = matrixHierarchy.levels.length - 1; i >= 0; i--) {
                    var hierarchyLevel: DataViewHierarchyLevel = matrixHierarchy.levels[i];

                    // compute a mapping for any necessary reordering of columns at this given level, based on projection ordering
                    let newToOldLevelSourceIndicesMapping: NumberToNumberMapping =
                        createMatrixHierarchyLevelSourcesPositionMapping(hierarchyLevel, hierarchyRole, projection);

                    if (newToOldLevelSourceIndicesMapping) {
                        if (_.isUndefined(transformedHierarchy)) {
                            // Because we start inspecting the hierarchy from the deepest level and work backwards to the root,
                            // the current hierarchyLevel is therefore the inner-most level that needs re-ordering of composite group values...
                            transformedHierarchy = inheritSingle(matrixHierarchy);
                            transformedHierarchy.levels = inheritSingle(matrixHierarchy.levels);

                            // Because the current hierarchyLevel is the inner-most level that needs re-ordering of composite group values,
                            // inheriting all nodes from root down to this level will also prepare the nodes for any transform that needs to 
                            // happen in other hierarchy levels in the later iterations of this for-loop.
                            transformedHierarchy.root = utils.DataViewMatrixUtils.inheritMatrixNodeHierarchy(matrixHierarchy.root, i, true);
                        }

                        // reorder the metadata columns in the sources array at that level
                        let transformingHierarchyLevel = inheritSingle(matrixHierarchy.levels[i]); // inherit at most once during the whole dataViewTransform for this obj...
                        transformedHierarchy.levels[i] = reorderMatrixHierarchyLevelColumnSources(transformingHierarchyLevel, newToOldLevelSourceIndicesMapping);

                        // reorder the level values in the composite group nodes at the current hierarchy level
                        reorderMatrixHierarchyLevelValues(transformedHierarchy.root, i, newToOldLevelSourceIndicesMapping);
                    }
                }
            }

            return transformedHierarchy;
        }

        /**
         * If reordering is needed on the level's metadata column sources (i.e. hierarchyLevel.sources),
         * returns the mapping from the target LevelSourceIndex (based on projection order) to original LevelSourceIndex.
         *
         * The returned value maps level source indices from the new target order (calculated from projection order)
         * back to the original order as they appear in the specified hierarchyLevel's sources.
         * Please refer to comments on the createOrderMapping() function for more explanation on the mappings in the return value.
         *
         * Note: The return value is the mapping from new index to old index, for consistency with existing and similar functions in this module.
         *
         * @param hierarchyLevel The hierarchy level that contains the metadata column sources.
         * @param hierarchyRoleName The role name for the hierarchy where the specified hierarchyLevel belongs.
         * @param projection The projection ordering that includes an ordering for the specified hierarchyRoleName.
         */
        function createMatrixHierarchyLevelSourcesPositionMapping(
            hierarchyLevel: DataViewHierarchyLevel,
            hierarchyRole: string,
            projection: DataViewProjectionOrdering): NumberToNumberMapping {
            debug.assertValue(hierarchyLevel, 'hierarchyLevel');
            debug.assertValue(hierarchyRole, 'hierarchyRole');
            debug.assertValue(projection, 'projection');
            debug.assertValue(projection[hierarchyRole], 'pre-condition: The specified projection must contain an ordering for the specified hierarchyRoleName.');

            let newToOldLevelSourceIndicesMapping: NumberToNumberMapping;
            let levelSourceColumns = hierarchyLevel.sources;

            if (levelSourceColumns && levelSourceColumns.length >= 2) {
                // The hierarchy level has multiple columns, so it is possible to have composite group, go on to check other conditions...

                let columnsForHierarchyRoleOrderedByLevelSourceIndex = utils.DataViewMetadataColumnUtils.joinMetadataColumnsAndProjectionOrder(
                    levelSourceColumns,
                    projection,
                    hierarchyRole);

                if (columnsForHierarchyRoleOrderedByLevelSourceIndex && columnsForHierarchyRoleOrderedByLevelSourceIndex.length >= 2) {
                    // The hierarchy level has multiple columns for the hierarchy's role, go on to calculate newToOldLevelSourceIndicesMapping...
                    let columnsForHierarchyRoleOrderedByProjection = _.sortBy(
                        columnsForHierarchyRoleOrderedByLevelSourceIndex,
                        columnInfo => columnInfo.projectionOrderIndex);

                    newToOldLevelSourceIndicesMapping = createOrderMapping(
                        _.map(columnsForHierarchyRoleOrderedByLevelSourceIndex, columnInfo => columnInfo.sourceIndex),
                        _.map(columnsForHierarchyRoleOrderedByProjection, columnInfo => columnInfo.sourceIndex));
                }
            }

            return newToOldLevelSourceIndicesMapping;
        }

        /**
         * Applies re-ordering on the specified transformingHierarchyLevel's sources.
         * Returns the same object as the specified transformingHierarchyLevel.
         */
        function reorderMatrixHierarchyLevelColumnSources(transformingHierarchyLevel: DataViewHierarchyLevel, newToOldLevelSourceIndicesMapping: NumberToNumberMapping): DataViewHierarchyLevel {
            debug.assertValue(transformingHierarchyLevel, 'transformingHierarchyLevel');
            debug.assertValue(newToOldLevelSourceIndicesMapping, 'newToOldLevelSourceIndicesMapping');

            let originalLevelSources = transformingHierarchyLevel.sources;

            transformingHierarchyLevel.sources = originalLevelSources.slice(0); // make a clone of the array before modifying it, because the for-loop depends on the origin array.
            
            let newLevelSourceIndices = Object.keys(newToOldLevelSourceIndicesMapping);
            for (let i = 0, ilen = newLevelSourceIndices.length; i < ilen; i++) {
                let newLevelSourceIndex = newLevelSourceIndices[i];
                let oldLevelSourceIndex = newToOldLevelSourceIndicesMapping[newLevelSourceIndex];

                debug.assert(oldLevelSourceIndex < originalLevelSources.length,
                    'pre-condition: The value in every mapping in the specified levelSourceIndicesReorderingMap must be a valid index to the specified hierarchyLevel.sources array property');

                transformingHierarchyLevel.sources[newLevelSourceIndex] = originalLevelSources[oldLevelSourceIndex];
            }

            return transformingHierarchyLevel;
        }

        /**
         * Reorders the elements in levelValues in each node under transformingHierarchyRootNode at the specified hierarchyLevel,
         * and updates their DataViewMatrixGroupValue.levelSourceIndex property.
         *
         * Returns the same object as the specified transformingHierarchyRootNode.
         */
        function reorderMatrixHierarchyLevelValues(
            transformingHierarchyRootNode: DataViewMatrixNode,
            transformingHierarchyLevelIndex: number,
            newToOldLevelSourceIndicesMapping: NumberToNumberMapping): DataViewMatrixNode {
            debug.assertValue(transformingHierarchyRootNode, 'transformingHierarchyRootNode');
            debug.assertValue(newToOldLevelSourceIndicesMapping, 'newToOldLevelSourceIndicesMapping');

            let oldToNewLevelSourceIndicesMapping: NumberToNumberMapping = createReversedMapping(newToOldLevelSourceIndicesMapping);

            forEachNodeAtLevel(transformingHierarchyRootNode, transformingHierarchyLevelIndex, (transformingMatrixNode: DataViewMatrixNode) => {
                let originalLevelValues = transformingMatrixNode.levelValues;

                // Note: Technically this function is incorrect, because the driving source of the new LevelValues is really
                // the "projection for this composite group", a concept that isn't yet implemented in DataViewProjectionOrdering.
                // The following code isn't correct in the special case where a column is projected twice in this composite group,
                // in which case the DSR will not have the duplicate columns; DataViewTransform is supposed to expand the duplicates.
                // Until we fully implement composite group projection, though, we'll just sort what we have in transformingMatrixNode.levelValues.

                if (!_.isEmpty(originalLevelValues)) {
                    // First, re-order the elements in transformingMatrixNode.levelValues by the new levelSourceIndex order.
                    // _.sortBy() also creates a new array, which we want to do for all nodes (including when levelValues.length === 1)
                    // because we don't want to accidentally modify the array AND its value references in Query DataView
                    let newlyOrderedLevelValues = _.sortBy(originalLevelValues, levelValue => oldToNewLevelSourceIndicesMapping[levelValue.levelSourceIndex]);

                    for (let i = 0, ilen = newlyOrderedLevelValues.length; i < ilen; i++) {
                        let transformingLevelValue = inheritSingle(newlyOrderedLevelValues[i]);
                        transformingLevelValue.levelSourceIndex = oldToNewLevelSourceIndicesMapping[transformingLevelValue.levelSourceIndex];
                        newlyOrderedLevelValues[i] = transformingLevelValue;
                    }

                    transformingMatrixNode.levelValues = newlyOrderedLevelValues;

                    // For consistency with how DataViewTreeNode.value works, and for a bit of backward compatibility,
                    // copy the last value from DataViewMatrixNode.levelValues to DataViewMatrixNode.value.
                    let newlyOrderedLastLevelValue = _.last(newlyOrderedLevelValues);
                    if (transformingMatrixNode.value !== newlyOrderedLastLevelValue.value) {
                        transformingMatrixNode.value = newlyOrderedLastLevelValue.value;
                    }
                    if ((transformingMatrixNode.levelSourceIndex || 0) !== newlyOrderedLastLevelValue.levelSourceIndex) {
                        transformingMatrixNode.levelSourceIndex = newlyOrderedLastLevelValue.levelSourceIndex;
                    }
                }
            });

            return transformingHierarchyRootNode;
        }

        /**
         * Creates a mapping of new position to original position.
         *
         * The return value is a mapping where each key-value pair represent the order  mapping of a particular column:
         * - the key in the key-value pair is the index of the particular column in the new order (e.g. projection order)
         * - the value in the key-value pair is the index of the particular column in the original order
         */
        function createMatrixValuesPositionMapping(
            matrixValues: DataViewRoleForMapping,
            projectionOrdering: DataViewProjectionOrdering,
            valueSources: DataViewMetadataColumn[],
            columnRewrites: ValueRewrite<DataViewMetadataColumn>[]): NumberToNumberMapping {

            let role = matrixValues.for.in;
            let newOrder = projectionOrdering[role];

            let originalOrder = _.chain(columnRewrites)
                .filter(rewrite => _.contains(valueSources, rewrite.to))
                .map(rewrite => rewrite.from.index)
                .value();

            return createOrderMapping(originalOrder, newOrder);
        }

        /**
         * Creates a mapping of indices, from indices to the specified newOrder array, back to indices to the specified
         * originalOrder array.
         * Each of the number value in originalOrder and newOrder is actually the unique key of a column (unqiue
         * under the context of the caller code), e.g. the Select Index in projection ordering array.
         * Also, the specified originalOrder must contain every value that exists in newOrder.
         *
         * If the specified originalOrder and newOrder are different in sequence order, then this function returns a collection of
         * key-value pair, each of which represents the new and old indices of a particular column:
         * - the key in each key-value pair is the index of the particular column key as it exists in the specified newOrder array
         * - the value in each key-value pair is the index of the particular column key as it exists in the specified originalOrder array
         *
         * For example on how the return value is consumed, see functions such as reorderMatrixHierarchyLevelColumnSources(...).
         *
         * If the specified originalOrder and newOrder are same, then this function returns undefined.
         *
         * @param originalOrder E.g. an array of metadata column "select indices", in the original order as they exist in Query DataView.
         * @param newOrder E.g. an array of metadata column "select indices", in rojection ordering.
         */
        function createOrderMapping(originalOrder: number[], newOrder: number[]): NumberToNumberMapping {
            // Optimization: avoid rewriting if the current order is correct
            if (ArrayExtensions.sequenceEqual(originalOrder, newOrder, (x: number, y: number) => x === y))
                return;

            let mapping: NumberToNumberMapping = {};
            for (let i = 0, len = newOrder.length; i < len; ++i) {
                let newPosition = newOrder[i];
                mapping[i] = originalOrder.indexOf(newPosition);
            }

            return mapping;
        }

        function createReversedMapping(mapping: NumberToNumberMapping): NumberToNumberMapping {
            debug.assertValue(mapping, 'mapping');

            let reversed: NumberToNumberMapping = {};

            for (let key in mapping) {
                // Note: key is a string after we get it out from mapping, thus we need to parse it 
                // back into a number before putting it as the value in the reversed mapping
                let value = mapping[key];
                let keyAsNumber = parseInt(key, 10);
                reversed[value] = keyAsNumber;
            }

            debug.assertValue(Object.keys(mapping).length === Object.keys(reversed).length,
                'pre-condition: The specified mapping must not contain any duplicate value because duplicate values are obmitted from the reversed mapping.');

            return reversed;
        }

        export function forEachNodeAtLevel(node: DataViewMatrixNode, targetLevel: number, callback: (node: DataViewMatrixNode) => void): void {
            debug.assertValue(node, 'node');
            debug.assert(targetLevel >= 0, 'argetLevel >= 0');
            debug.assertValue(callback, 'callback');

            if (node.level === targetLevel) {
                callback(node);
                return;
            }

            let children = node.children;
            if (children && children.length > 0) {
                for (let i = 0, ilen = children.length; i < ilen; i++)
                    forEachNodeAtLevel(children[i], targetLevel, callback);
            }
        }

        function findOverride(source: DataViewMetadataColumn, columnRewrites: ValueRewrite<DataViewMetadataColumn>[]): DataViewMetadataColumn {
            for (let i = 0, len = columnRewrites.length; i < len; i++) {
                let columnRewrite = columnRewrites[i];
                if (columnRewrite.from === source)
                    return columnRewrite.to;
            }
        }

        function ensureRewritten<T>(rewritten: T, prototype: T, callback?: (rewritten: T) => void): T {
            if (!rewritten)
                rewritten = inherit(prototype);

            if (callback)
                callback(rewritten);

            return rewritten;
        }

        export function transformObjects(
            dataView: DataView,
            targetDataViewKinds: StandardDataViewKinds,
            objectDescriptors: DataViewObjectDescriptors,
            objectDefinitions: DataViewObjectDefinitions,
            selectTransforms: DataViewSelectTransform[],
            colorAllocatorFactory: IColorAllocatorFactory): void {
            debug.assertValue(dataView, 'dataView');
            debug.assertValue(targetDataViewKinds, 'targetDataViewKinds');
            debug.assertAnyValue(objectDescriptors, 'objectDescriptors');
            debug.assertAnyValue(objectDefinitions, 'objectDefinitions');
            debug.assertAnyValue(selectTransforms, 'selectTransforms');
            debug.assertValue(colorAllocatorFactory, 'colorAllocatorFactory');

            if (!objectDescriptors)
                return;

            let objectsForAllSelectors = DataViewObjectEvaluationUtils.groupObjectsBySelector(objectDefinitions);
            DataViewObjectEvaluationUtils.addImplicitObjects(objectsForAllSelectors, objectDescriptors, dataView.metadata.columns, selectTransforms);

            let metadataOnce = objectsForAllSelectors.metadataOnce;
            let dataObjects = objectsForAllSelectors.data;
            if (metadataOnce)
                evaluateMetadataObjects(dataView, selectTransforms, objectDescriptors, metadataOnce.objects, dataObjects, colorAllocatorFactory);

            let metadataObjects = objectsForAllSelectors.metadata;
            if (metadataObjects) {
                for (let i = 0, len = metadataObjects.length; i < len; i++) {
                    let metadataObject = metadataObjects[i];
                    let objectDefns = metadataObject.objects;
                    let colorAllocatorCache = populateColorAllocatorCache(dataView, selectTransforms, objectDefns, colorAllocatorFactory);
                    evaluateMetadataRepetition(dataView, selectTransforms, objectDescriptors, metadataObject.selector, objectDefns, colorAllocatorCache);
                }
            }

            for (let i = 0, len = dataObjects.length; i < len; i++) {
                let dataObject = dataObjects[i];
                let objectDefns = dataObject.objects;
                let colorAllocatorCache = populateColorAllocatorCache(dataView, selectTransforms, objectDefns, colorAllocatorFactory);
                evaluateDataRepetition(dataView, targetDataViewKinds, selectTransforms, objectDescriptors, dataObject.selector, dataObject.rules, objectDefns, colorAllocatorCache);
            }

            let userDefined = objectsForAllSelectors.userDefined;
            if (userDefined) {
                // TODO: We only handle user defined objects at the metadata level, but should be able to support them with arbitrary repetition.
                evaluateUserDefinedObjects(dataView, selectTransforms, objectDescriptors, userDefined, colorAllocatorFactory);
            }
        }

        function evaluateUserDefinedObjects(
            dataView: DataView,
            selectTransforms: DataViewSelectTransform[],
            objectDescriptors: DataViewObjectDescriptors,
            objectDefns: DataViewObjectDefinitionsForSelector[],
            colorAllocatorFactory: IColorAllocatorFactory): void {
            debug.assertValue(dataView, 'dataView');
            debug.assertAnyValue(selectTransforms, 'selectTransforms');
            debug.assertValue(objectDescriptors, 'objectDescriptors');
            debug.assertValue(objectDefns, 'objectDefns');
            debug.assertValue(colorAllocatorFactory, 'colorAllocatorFactory');

            let dataViewObjects: DataViewObjects = dataView.metadata.objects;
            if (!dataViewObjects) {
                dataViewObjects = dataView.metadata.objects = {};
            }

            for (let objectDefn of objectDefns) {
                let id = objectDefn.selector.id;

                let colorAllocatorCache = populateColorAllocatorCache(dataView, selectTransforms, objectDefn.objects, colorAllocatorFactory);
                let evalContext = createStaticEvalContext(colorAllocatorCache, dataView, selectTransforms);
                let objects = DataViewObjectEvaluationUtils.evaluateDataViewObjects(evalContext, objectDescriptors, objectDefn.objects);

                for (let objectName in objects) {
                    let object = <DataViewObject>objects[objectName];

                    let map = <DataViewObjectMap>dataViewObjects[objectName];
                    if (!map)
                        map = dataViewObjects[objectName] = [];
                    debug.assert(DataViewObjects.isUserDefined(map), 'expected DataViewObjectMap');

                    // NOTE: We do not check for duplicate ids.
                    map.push({ id: id, object: object });
                }
            }
        }

        /** Evaluates and sets properties on the DataView metadata. */
        function evaluateMetadataObjects(
            dataView: DataView,
            selectTransforms: DataViewSelectTransform[],
            objectDescriptors: DataViewObjectDescriptors,
            objectDefns: DataViewNamedObjectDefinition[],
            dataObjects: DataViewObjectDefinitionsForSelectorWithRule[],
            colorAllocatorFactory: IColorAllocatorFactory): void {
            debug.assertValue(dataView, 'dataView');
            debug.assertAnyValue(selectTransforms, 'selectTransforms');
            debug.assertValue(objectDescriptors, 'objectDescriptors');
            debug.assertValue(objectDefns, 'objectDefns');
            debug.assertValue(dataObjects, 'dataObjects');
            debug.assertValue(colorAllocatorFactory, 'colorAllocatorFactory');

            let colorAllocatorCache = populateColorAllocatorCache(dataView, selectTransforms, objectDefns, colorAllocatorFactory);
            let evalContext = createStaticEvalContext(colorAllocatorCache, dataView, selectTransforms);
            let objects = DataViewObjectEvaluationUtils.evaluateDataViewObjects(evalContext, objectDescriptors, objectDefns);
            if (objects) {
                dataView.metadata.objects = objects;

                for (let objectName in objects) {
                    let object = <DataViewObject>objects[objectName],
                        objectDesc = objectDescriptors[objectName];

                    for (let propertyName in object) {
                        let propertyDesc = objectDesc.properties[propertyName],
                            ruleDesc = propertyDesc.rule;
                        if (!ruleDesc)
                            continue;

                        let definition = createRuleEvaluationInstance(
                            dataView,
                            colorAllocatorFactory,
                            ruleDesc,
                            objectName,
                            object[propertyName],
                            propertyDesc.type);
                        if (!definition)
                            continue;

                        dataObjects.push(definition);
                    }
                }
            }
        }

        function createRuleEvaluationInstance(
            dataView: DataView,
            colorAllocatorFactory: IColorAllocatorFactory,
            ruleDesc: DataViewObjectPropertyRuleDescriptor,
            objectName: string,
            propertyValue: DataViewPropertyValue,
            ruleType: StructuralTypeDescriptor): DataViewObjectDefinitionsForSelectorWithRule {
            debug.assertValue(dataView, 'dataView');
            debug.assertValue(colorAllocatorFactory, 'colorAllocatorFactory');
            debug.assertValue(ruleDesc, 'ruleDesc');
            debug.assertValue(propertyValue, 'propertyValue');
            debug.assertValue(ruleType, 'ruleType');

            let ruleOutput = ruleDesc.output;
            if (!ruleOutput)
                return;

            let selectorToCreate = findSelectorForRuleInput(dataView, ruleOutput.selector);
            if (!selectorToCreate)
                return;

            if (ruleType.fillRule) {
                return createRuleEvaluationInstanceFillRule(dataView, colorAllocatorFactory, ruleDesc, selectorToCreate, objectName, <FillRule>propertyValue);
            }
        }

        function createRuleEvaluationInstanceFillRule(
            dataView: DataView,
            colorAllocatorFactory: IColorAllocatorFactory,
            ruleDesc: DataViewObjectPropertyRuleDescriptor,
            selectorToCreate: Selector,
            objectName: string,
            propertyValue: FillRule): DataViewObjectDefinitionsForSelectorWithRule {
            debug.assertValue(dataView, 'dataView');
            debug.assertValue(colorAllocatorFactory, 'colorAllocatorFactory');
            debug.assertValue(ruleDesc, 'ruleDesc');
            debug.assertValue(selectorToCreate, 'selectorToCreate');
            debug.assertValue(propertyValue, 'propertyValue');

            let colorAllocator = tryCreateColorAllocatorForFillRule(dataView, colorAllocatorFactory, ruleDesc.inputRole, ColumnIdentifierKind.Role, propertyValue);

            if (!colorAllocator)
                return;

            let rule = new ColorRuleEvaluation(ruleDesc.inputRole, colorAllocator);
            let fillRuleProperties: DataViewObjectPropertyDefinitions = {};
            fillRuleProperties[ruleDesc.output.property] = {
                solid: { color: rule }
            };

            return {
                selector: selectorToCreate,
                rules: [rule],
                objects: [{
                    name: objectName,
                    properties: fillRuleProperties,
                }]
            };
        }

        function tryCreateColorAllocatorForFillRule(
            dataView: DataView,
            colorAllocatorFactory: IColorAllocatorFactory,
            identifier: string,
            identifierKind: ColumnIdentifierKind,
            propertyValue: FillRule): IColorAllocator {
            debug.assertValue(dataView, 'dataView');
            debug.assertValue(colorAllocatorFactory, 'colorAllocatorFactory');
            debug.assertValue(identifier, 'identifier');
            debug.assertValue(identifierKind, 'identifierKind');
            debug.assertValue(propertyValue, 'propertyValue');

            if (propertyValue.linearGradient2)
                return createColorAllocatorLinearGradient2(dataView, colorAllocatorFactory, identifier, identifierKind, propertyValue, propertyValue.linearGradient2);

            if (propertyValue.linearGradient3)
                return createColorAllocatorLinearGradient3(dataView, colorAllocatorFactory, identifier, identifierKind, propertyValue, propertyValue.linearGradient3);
        }

        function createColorAllocatorLinearGradient2(
            dataView: DataView,
            colorAllocatorFactory: IColorAllocatorFactory,
            identifier: string,
            identifierKind: ColumnIdentifierKind,
            propertyValueFillRule: FillRule,
            linearGradient2: LinearGradient2): IColorAllocator {
            debug.assertValue(dataView, 'dataView');
            debug.assertValue(colorAllocatorFactory, 'colorAllocatorFactory');
            debug.assertValue(identifier, 'identifier');
            debug.assertValue(identifierKind, 'identifierKind');
            debug.assertValue(linearGradient2, 'linearGradient2');

            linearGradient2 = propertyValueFillRule.linearGradient2;
            if (linearGradient2.min.value === undefined ||
                linearGradient2.max.value === undefined) {
                let inputRange = findRuleInputColumnNumberRange(dataView, identifier, identifierKind);
                if (!inputRange)
                    return;

                if (linearGradient2.min.value === undefined)
                    linearGradient2.min.value = inputRange.min;
                if (linearGradient2.max.value === undefined)
                    linearGradient2.max.value = inputRange.max;
            }

            return colorAllocatorFactory.linearGradient2(propertyValueFillRule.linearGradient2);
        }

        function createColorAllocatorLinearGradient3(
            dataView: DataView,
            colorAllocatorFactory: IColorAllocatorFactory,
            identifier: string,
            identifierKind: ColumnIdentifierKind,
            propertyValueFillRule: FillRule,
            linearGradient3: LinearGradient3): IColorAllocator {
            debug.assertValue(dataView, 'dataView');
            debug.assertValue(colorAllocatorFactory, 'colorAllocatorFactory');
            debug.assertValue(identifier, 'identifier');
            debug.assertValue(identifierKind, 'identifierKind');
            debug.assertValue(linearGradient3, 'linearGradient3');

            let splitScales: boolean;
            linearGradient3 = propertyValueFillRule.linearGradient3;
            if (linearGradient3.min.value === undefined ||
                linearGradient3.mid.value === undefined ||
                linearGradient3.max.value === undefined) {
                let inputRange = findRuleInputColumnNumberRange(dataView, identifier, identifierKind);
                if (!inputRange)
                    return;

                splitScales =
                    linearGradient3.min.value === undefined &&
                    linearGradient3.max.value === undefined &&
                    linearGradient3.mid.value !== undefined;

                if (linearGradient3.min.value === undefined) {
                    linearGradient3.min.value = inputRange.min;
                }
                if (linearGradient3.max.value === undefined) {
                    linearGradient3.max.value = inputRange.max;
                }
                if (linearGradient3.mid.value === undefined) {
                    let midValue: number = (linearGradient3.max.value + linearGradient3.min.value) / 2;
                    linearGradient3.mid.value = midValue;
                }
            }

            return colorAllocatorFactory.linearGradient3(propertyValueFillRule.linearGradient3, splitScales);
        }

        function populateColorAllocatorCache(
            dataView: DataView,
            selectTransforms: DataViewSelectTransform[],
            objectDefns: DataViewNamedObjectDefinition[],
            colorAllocatorFactory: IColorAllocatorFactory): IColorAllocatorCache {
            debug.assertValue(dataView, 'dataView');
            debug.assertAnyValue(selectTransforms, 'selectTransforms');
            debug.assertValue(objectDefns, 'objectDefns');
            debug.assertValue(colorAllocatorFactory, 'colorAllocatorFactory');

            let cache = createColorAllocatorCache();
            let staticEvalContext = createStaticEvalContext();

            for (let i = 0, len = objectDefns.length; i < len; i++) {
                let objectDefnProperties = objectDefns[i].properties;

                for (let propertyName in objectDefnProperties) {
                    let fillProperty = <FillDefinition>objectDefnProperties[propertyName];
                    if (fillProperty &&
                        fillProperty.solid &&
                        fillProperty.solid.color &&
                        fillProperty.solid.color.kind === SQExprKind.FillRule) {

                        let fillRuleExpr = <SQFillRuleExpr>fillProperty.solid.color;

                        let inputExprQueryName = findFirstQueryNameForExpr(selectTransforms, fillRuleExpr.input);
                        if (!inputExprQueryName)
                            continue;

                        let fillRule = DataViewObjectEvaluator.evaluateProperty(
                            staticEvalContext,
                            fillRulePropertyDescriptor,
                            fillRuleExpr.rule);

                        let colorAllocator = tryCreateColorAllocatorForFillRule(dataView, colorAllocatorFactory, inputExprQueryName, ColumnIdentifierKind.QueryName, fillRule);
                        if (colorAllocator)
                            cache.register(fillRuleExpr, colorAllocator);
                    }
                }
            }

            return cache;
        }

        function evaluateDataRepetition(
            dataView: DataView,
            targetDataViewKinds: StandardDataViewKinds,
            selectTransforms: DataViewSelectTransform[],
            objectDescriptors: DataViewObjectDescriptors,
            selector: Selector,
            rules: RuleEvaluation[],
            objectDefns: DataViewNamedObjectDefinition[],
            colorAllocatorCache: IColorAllocatorCache): void {
            debug.assertValue(dataView, 'dataView');
            debug.assertValue(targetDataViewKinds, 'targetDataViewKinds');
            debug.assertAnyValue(selectTransforms, 'selectTransforms');
            debug.assertValue(objectDescriptors, 'objectDescriptors');
            debug.assertValue(selector, 'selector');
            debug.assertAnyValue(rules, 'rules');
            debug.assertValue(objectDefns, 'objectDefns');
            debug.assertValue(colorAllocatorCache, 'colorAllocatorFactory');

            let containsWildcard = Selector.containsWildcard(selector);

            let dataViewCategorical = dataView.categorical;
            if (dataViewCategorical && EnumExtensions.hasFlag(targetDataViewKinds, StandardDataViewKinds.Categorical)) {
                // 1) Match against categories
                evaluateDataRepetitionCategoricalCategory(dataViewCategorical, objectDescriptors, selector, rules, containsWildcard, objectDefns, colorAllocatorCache);

                // 2) Match against valueGrouping
                evaluateDataRepetitionCategoricalValueGrouping(dataViewCategorical, objectDescriptors, selector, rules, containsWildcard, objectDefns, colorAllocatorCache);

                // Consider capturing diagnostics for unmatched selectors to help debugging.
            }

            let dataViewMatrix = dataView.matrix;
            if (dataViewMatrix && EnumExtensions.hasFlag(targetDataViewKinds, StandardDataViewKinds.Matrix)) {
                let rewrittenMatrix = evaluateDataRepetitionMatrix(dataViewMatrix, objectDescriptors, selector, rules, containsWildcard, objectDefns, colorAllocatorCache);
                if (rewrittenMatrix) {
                    // TODO: This mutates the DataView -- the assumption is that prototypal inheritance has already occurred.  We should
                    // revisit this, likely when we do lazy evaluation of DataView.
                    dataView.matrix = rewrittenMatrix;
                }

                // Consider capturing diagnostics for unmatched selectors to help debugging.
            }

            let dataViewTable = dataView.table;
            if (dataViewTable && EnumExtensions.hasFlag(targetDataViewKinds, StandardDataViewKinds.Table)) {
                let rewrittenTable = evaluateDataRepetitionTable(dataViewTable, selectTransforms, objectDescriptors, selector, rules, containsWildcard, objectDefns, colorAllocatorCache);
                if (rewrittenTable) {
                    // TODO: This mutates the DataView -- the assumption is that prototypal inheritance has already occurred.  We should
                    // revisit this, likely when we do lazy evaluation of DataView.
                    dataView.table = rewrittenTable;
                }

                // Consider capturing diagnostics for unmatched selectors to help debugging.
            }
        }

        function evaluateDataRepetitionCategoricalCategory(
            dataViewCategorical: DataViewCategorical,
            objectDescriptors: DataViewObjectDescriptors,
            selector: Selector,
            rules: RuleEvaluation[],
            containsWildcard: boolean,
            objectDefns: DataViewNamedObjectDefinition[],
            colorAllocatorCache: IColorAllocatorCache): boolean {
            debug.assertValue(dataViewCategorical, 'dataViewCategorical');
            debug.assertValue(objectDescriptors, 'objectDescriptors');
            debug.assertValue(selector, 'selector');
            debug.assertAnyValue(rules, 'rules');
            debug.assertValue(containsWildcard, 'containsWildcard');
            debug.assertValue(objectDefns, 'objectDefns');
            debug.assertValue(colorAllocatorCache, 'colorAllocatorCache');

            if (!dataViewCategorical.categories || dataViewCategorical.categories.length === 0)
                return;

            let targetColumn = findSelectedCategoricalColumn(dataViewCategorical, selector);
            if (!targetColumn)
                return;

            let identities = targetColumn.identities,
                foundMatch: boolean,
                evalContext = createCategoricalEvalContext(colorAllocatorCache, dataViewCategorical);

            if (!identities)
                return;

            debug.assert(targetColumn.column.values.length === identities.length, 'Column length mismatch');

            for (let i = 0, len = identities.length; i < len; i++) {
                let identity = identities[i];

                if (containsWildcard || Selector.matchesData(selector, [identity])) {
                    evalContext.setCurrentRowIndex(i);

                    let objects = DataViewObjectEvaluationUtils.evaluateDataViewObjects(evalContext, objectDescriptors, objectDefns);
                    if (objects) {
                        // TODO: This mutates the DataView -- the assumption is that prototypal inheritance has already occurred.  We should
                        // revisit this, likely when we do lazy evaluation of DataView.
                        if (!targetColumn.column.objects) {
                            targetColumn.column.objects = [];
                            targetColumn.column.objects.length = len;
                        }
                        targetColumn.column.objects[i] = objects;
                    }

                    if (!containsWildcard)
                        return true;

                    foundMatch = true;
                }
            }

            return foundMatch;
        }

        function evaluateDataRepetitionCategoricalValueGrouping(
            dataViewCategorical: DataViewCategorical,
            objectDescriptors: DataViewObjectDescriptors,
            selector: Selector,
            rules: RuleEvaluation[],
            containsWildcard: boolean,
            objectDefns: DataViewNamedObjectDefinition[],
            colorAllocatorCache: IColorAllocatorCache): boolean {
            debug.assertValue(dataViewCategorical, 'dataViewCategorical');
            debug.assertValue(objectDescriptors, 'objectDescriptors');
            debug.assertValue(selector, 'selector');
            debug.assertAnyValue(rules, 'rules');
            debug.assertValue(containsWildcard, 'containsWildcard');
            debug.assertValue(objectDefns, 'objectDefns');
            debug.assertValue(colorAllocatorCache, 'colorAllocatorCache');

            let dataViewCategoricalValues = dataViewCategorical.values;
            if (!dataViewCategoricalValues || !dataViewCategoricalValues.identityFields)
                return;

            if (!Selector.matchesKeys(selector, <SQExpr[][]>[dataViewCategoricalValues.identityFields]))
                return;

            let valuesGrouped = dataViewCategoricalValues.grouped();
            if (!valuesGrouped)
                return;

            // NOTE: We do not set the evalContext row index below because iteration is over value groups (i.e., columns, no rows).
            // This should be enhanced in the future.
            let evalContext = createCategoricalEvalContext(colorAllocatorCache, dataViewCategorical);

            let foundMatch: boolean;
            for (let i = 0, len = valuesGrouped.length; i < len; i++) {
                let valueGroup = valuesGrouped[i];
                let selectorMetadata = selector.metadata;
                let valuesInGroup = valueGroup.values;
                if (containsWildcard || Selector.matchesData(selector, [valueGroup.identity])) {
                    let objects = DataViewObjectEvaluationUtils.evaluateDataViewObjects(evalContext, objectDescriptors, objectDefns);
                    if (objects) {
                        // TODO: This mutates the DataView -- the assumption is that prototypal inheritance has already occurred.  We should
                        // revisit this, likely when we do lazy evaluation of DataView.

                        if (selectorMetadata) {
                            for (let j = 0, jlen = valuesInGroup.length; j < jlen; j++) {
                                let valueColumn = valuesInGroup[j],
                                    valueSource = valueColumn.source;
                                if (valueSource.queryName === selectorMetadata) {
                                    let valueSourceOverwrite = Prototype.inherit(valueSource);
                                    valueSourceOverwrite.objects = objects;
                                    valueColumn.source = valueSourceOverwrite;

                                    foundMatch = true;
                                    break;
                                }
                            }
                        }
                        else {
                            valueGroup.objects = objects;
                            setGrouped(dataViewCategoricalValues, valuesGrouped);

                            foundMatch = true;
                        }
                    }

                    if (!containsWildcard)
                        return true;
                }
            }

            return foundMatch;
        }

        function evaluateDataRepetitionMatrix(
            dataViewMatrix: DataViewMatrix,
            objectDescriptors: DataViewObjectDescriptors,
            selector: Selector,
            rules: RuleEvaluation[],
            containsWildcard: boolean,
            objectDefns: DataViewNamedObjectDefinition[],
            colorAllocatorCache: IColorAllocatorCache): DataViewMatrix {

            let evalContext = createMatrixEvalContext(colorAllocatorCache, dataViewMatrix);
            let rewrittenRows = evaluateDataRepetitionMatrixHierarchy(evalContext, dataViewMatrix.rows, objectDescriptors, selector, rules, containsWildcard, objectDefns);
            let rewrittenCols = evaluateDataRepetitionMatrixHierarchy(evalContext, dataViewMatrix.columns, objectDescriptors, selector, rules, containsWildcard, objectDefns);

            if (rewrittenRows || rewrittenCols) {
                let rewrittenMatrix = inheritSingle(dataViewMatrix);

                if (rewrittenRows)
                    rewrittenMatrix.rows = rewrittenRows;
                if (rewrittenCols)
                    rewrittenMatrix.columns = rewrittenCols;

                return rewrittenMatrix;
            }
        }

        function evaluateDataRepetitionMatrixHierarchy(
            evalContext: IEvalContext,
            dataViewMatrixHierarchy: DataViewHierarchy,
            objectDescriptors: DataViewObjectDescriptors,
            selector: Selector,
            rules: RuleEvaluation[],
            containsWildcard: boolean,
            objectDefns: DataViewNamedObjectDefinition[]): DataViewHierarchy {
            debug.assertAnyValue(dataViewMatrixHierarchy, 'dataViewMatrixHierarchy');
            debug.assertValue(objectDescriptors, 'objectDescriptors');
            debug.assertValue(selector, 'selector');
            debug.assertAnyValue(rules, 'rules');
            debug.assertValue(objectDefns, 'objectDefns');

            if (!dataViewMatrixHierarchy)
                return;

            let root = dataViewMatrixHierarchy.root;
            if (!root)
                return;

            let rewrittenRoot = evaluateDataRepetitionMatrixNode(evalContext, root, objectDescriptors, selector, rules, containsWildcard, objectDefns);
            if (rewrittenRoot) {
                let rewrittenHierarchy = inheritSingle(dataViewMatrixHierarchy);
                rewrittenHierarchy.root = rewrittenRoot;

                return rewrittenHierarchy;
            }
        }

        function evaluateDataRepetitionMatrixNode(
            evalContext: IEvalContext,
            dataViewNode: DataViewMatrixNode,
            objectDescriptors: DataViewObjectDescriptors,
            selector: Selector,
            rules: RuleEvaluation[],
            containsWildcard: boolean,
            objectDefns: DataViewNamedObjectDefinition[]): DataViewMatrixNode {
            debug.assertValue(evalContext, 'evalContext');
            debug.assertValue(dataViewNode, 'dataViewNode');
            debug.assertValue(objectDescriptors, 'objectDescriptors');
            debug.assertValue(selector, 'selector');
            debug.assertAnyValue(rules, 'rules');
            debug.assertValue(objectDefns, 'objectDefns');

            let childNodes = dataViewNode.children;
            if (!childNodes)
                return;

            let rewrittenNode: DataViewMatrixNode;
            let shouldSearchChildren: boolean;
            let childIdentityFields = dataViewNode.childIdentityFields;
            if (childIdentityFields) {
                // NOTE: selector matching in matrix currently only considers the current node, and does not consider parents as part of the match.
                shouldSearchChildren = Selector.matchesKeys(selector, <SQExpr[][]>[childIdentityFields]);
            }

            for (let i = 0, len = childNodes.length; i < len; i++) {
                let childNode = childNodes[i],
                    identity = childNode.identity,
                    rewrittenChildNode: DataViewMatrixNode = null;

                if (shouldSearchChildren) {
                    if (containsWildcard || Selector.matchesData(selector, [identity])) {
                        // TODO: Need to initialize context for rule-based properties.  Rule-based properties
                        // (such as fillRule/gradients) are not currently implemented.

                        let objects = DataViewObjectEvaluationUtils.evaluateDataViewObjects(evalContext, objectDescriptors, objectDefns);
                        if (objects) {
                            rewrittenChildNode = inheritSingle(childNode);
                            rewrittenChildNode.objects = objects;
                        }
                    }
                }
                else {
                    rewrittenChildNode = evaluateDataRepetitionMatrixNode(
                        evalContext,
                        childNode,
                        objectDescriptors,
                        selector,
                        rules,
                        containsWildcard,
                        objectDefns);
                }

                if (rewrittenChildNode) {
                    if (!rewrittenNode)
                        rewrittenNode = inheritNodeAndChildren(dataViewNode);
                    rewrittenNode.children[i] = rewrittenChildNode;

                    if (!containsWildcard) {
                        // NOTE: once we find a match for a non-wildcard selector, stop looking.
                        break;
                    }
                }
            }

            return rewrittenNode;
        }

        function inheritNodeAndChildren(node: DataViewMatrixNode): DataViewMatrixNode {
            if (Object.getPrototypeOf(node) !== Object.prototype) {
                return node;
            }

            let inherited = inheritSingle(node);
            inherited.children = inherit(node.children);
            return inherited;
        }

        function evaluateDataRepetitionTable(
            dataViewTable: DataViewTable,
            selectTransforms: DataViewSelectTransform[],
            objectDescriptors: DataViewObjectDescriptors,
            selector: Selector,
            rules: RuleEvaluation[],
            containsWildcard: boolean,
            objectDefns: DataViewNamedObjectDefinition[],
            colorAllocatorCache: IColorAllocatorCache): DataViewTable {
            debug.assertValue(dataViewTable, 'dataViewTable');
            debug.assertAnyValue(selectTransforms, 'selectTransforms');
            debug.assertValue(objectDescriptors, 'objectDescriptors');
            debug.assertValue(selector, 'selector');
            debug.assertAnyValue(rules, 'rules');
            debug.assertValue(objectDefns, 'objectDefns');
            debug.assertValue(colorAllocatorCache, 'colorAllocatorCache');

            let evalContext = createTableEvalContext(colorAllocatorCache, dataViewTable, selectTransforms);
            let rewrittenRows = evaluateDataRepetitionTableRows(
                evalContext,
                dataViewTable.columns,
                dataViewTable.rows,
                dataViewTable.identity,
                dataViewTable.identityFields,
                objectDescriptors,
                selector,
                rules,
                containsWildcard,
                objectDefns);

            if (rewrittenRows) {
                let rewrittenTable = inheritSingle(dataViewTable);
                rewrittenTable.rows = rewrittenRows;

                return rewrittenTable;
            }
        }

        function evaluateDataRepetitionTableRows(
            evalContext: ITableEvalContext,
            columns: DataViewMetadataColumn[],
            rows: DataViewTableRow[],
            identities: DataViewScopeIdentity[],
            identityFields: ISQExpr[],
            objectDescriptors: DataViewObjectDescriptors,
            selector: Selector,
            rules: RuleEvaluation[],
            containsWildcard: boolean,
            objectDefns: DataViewNamedObjectDefinition[]): DataViewTableRow[] {
            debug.assertValue(evalContext, 'evalContext');
            debug.assertValue(columns, 'columns');
            debug.assertValue(rows, 'rows');
            debug.assertAnyValue(identities, 'identities');
            debug.assertAnyValue(identityFields, 'identityFields');
            debug.assertValue(objectDescriptors, 'objectDescriptors');
            debug.assertValue(selector, 'selector');
            debug.assertAnyValue(rules, 'rules');
            debug.assertValue(objectDefns, 'objectDefns');

            if (_.isEmpty(identities) || _.isEmpty(identityFields))
                return;

            if (!selector.metadata &&
                !Selector.matchesKeys(selector, <SQExpr[][]>[identityFields]))
                return;

            let colIdx = _.findIndex(columns, col => col.queryName === selector.metadata);
            if (colIdx < 0)
                return;

            debug.assert(rows.length === identities.length, 'row length mismatch');
            let colLen = columns.length;
            let inheritedRows: DataViewTableRow[];

            for (let rowIdx = 0, rowLen = identities.length; rowIdx < rowLen; rowIdx++) {
                let identity = identities[rowIdx];

                if (containsWildcard || Selector.matchesData(selector, [identity])) {
                    evalContext.setCurrentRowIndex(rowIdx);

                    let objects = DataViewObjectEvaluationUtils.evaluateDataViewObjects(evalContext, objectDescriptors, objectDefns);
                    if (objects) {
                        if (!inheritedRows)
                            inheritedRows = inheritSingle(rows);

                        let inheritedRow = inheritedRows[rowIdx] = inheritSingle(inheritedRows[rowIdx]);
                        let objectsForColumns = inheritedRow.objects;
                        if (!objectsForColumns)
                            inheritedRow.objects = objectsForColumns = new Array(colLen);

                        objectsForColumns[colIdx] = objects;
                    }

                    if (!containsWildcard)
                        break;
                }
            }

            return inheritedRows;
        }

        function evaluateMetadataRepetition(
            dataView: DataView,
            selectTransforms: DataViewSelectTransform[],
            objectDescriptors: DataViewObjectDescriptors,
            selector: Selector,
            objectDefns: DataViewNamedObjectDefinition[],
            colorAllocatorCache: IColorAllocatorCache): void {
            debug.assertValue(dataView, 'dataView');
            debug.assertAnyValue(selectTransforms, 'selectTransforms');
            debug.assertValue(objectDescriptors, 'objectDescriptors');
            debug.assertValue(selector, 'selector');
            debug.assertValue(objectDefns, 'objectDefns');
            debug.assertValue(colorAllocatorCache, 'colorAllocatorCache');

            // TODO: This mutates the DataView -- the assumption is that prototypal inheritance has already occurred.  We should
            // revisit this, likely when we do lazy evaluation of DataView.
            let columns = dataView.metadata.columns,
                metadataId = selector.metadata,
                evalContext = createStaticEvalContext(colorAllocatorCache, dataView, selectTransforms);
            for (let i = 0, len = columns.length; i < len; i++) {
                let column = columns[i];
                if (column.queryName === metadataId) {
                    let objects = DataViewObjectEvaluationUtils.evaluateDataViewObjects(evalContext, objectDescriptors, objectDefns);
                    if (objects)
                        column.objects = objects;
                }
            }
        }

        /** Attempts to find a column that can possibly match the selector. */
        function findSelectedCategoricalColumn(dataViewCategorical: DataViewCategorical, selector: Selector) {
            debug.assertValue(dataViewCategorical.categories[0], 'dataViewCategorical.categories[0]');

            let categoricalColumn = dataViewCategorical.categories[0];
            if (!categoricalColumn.identityFields)
                return;
            if (!Selector.matchesKeys(selector, <SQExpr[][]>[categoricalColumn.identityFields]))
                return;

            let identities = categoricalColumn.identity,
                targetColumn: DataViewCategoricalColumn = categoricalColumn;

            let selectedMetadataId = selector.metadata;
            if (selectedMetadataId) {
                let valueColumns = dataViewCategorical.values;
                if (valueColumns) {
                    for (let i = 0, len = valueColumns.length; i < len; i++) {
                        let valueColumn = valueColumns[i];
                        if (valueColumn.source.queryName === selectedMetadataId) {
                            targetColumn = valueColumn;
                            break;
                        }
                    }
                }
            }

            return {
                column: targetColumn,
                identities: identities,
            };
        }

        function findSelectorForRuleInput(dataView: DataView, selectorRoles: string[]): Selector {
            debug.assertValue(dataView, 'dataView');
            debug.assertValue(selectorRoles, 'selectorRoles');

            if (selectorRoles.length !== 1)
                return;

            let dataViewCategorical = dataView.categorical;
            if (!dataViewCategorical)
                return;

            let categories = dataViewCategorical.categories;
            if (!categories || categories.length !== 1)
                return;

            let categoryColumn = categories[0],
                categoryRoles = categoryColumn.source.roles,
                categoryIdentityFields = categoryColumn.identityFields;
            if (!categoryRoles || !categoryIdentityFields || !categoryRoles[selectorRoles[0]])
                return;

            return { data: [DataViewScopeWildcard.fromExprs(<SQExpr[]>categoryIdentityFields)] };
        }

        function findFirstQueryNameForExpr(selectTransforms: DataViewSelectTransform[], expr: SQExpr): string {
            debug.assertAnyValue(selectTransforms, 'selectTransforms');
            debug.assertValue(expr, 'expr');

            if (!selectTransforms)
                return;

            for (let i = 0, len = selectTransforms.length; i < len; i++) {
                let select = selectTransforms[i],
                    columnExpr = select.expr;

                if (!columnExpr || !SQExpr.equals(expr, select.expr))
                    continue;

                return select.queryName;
            }
        }

        /** Attempts to find the value range for the single column with the given identifier/identifierKind. */
        function findRuleInputColumnNumberRange(dataView: DataView, identifier: string, identifierKind: ColumnIdentifierKind): NumberRange {
            debug.assertValue(dataView, 'dataView');
            debug.assertValue(identifier, 'identifier');
            debug.assertValue(identifierKind, 'identifierKind');

            // NOTE: This implementation currently only supports categorical DataView, becuase that's the
            // only scenario that has custom colors, as of this writing.  This would be rewritten to be more generic
            // as required, when needed.
            let dataViewCategorical = dataView.categorical;
            if (!dataViewCategorical)
                return;

            let values = dataViewCategorical.values;
            if (!values)
                return;

            for (let i = 0, len = values.length; i < len; i++) {
                let valueCol = values[i];

                if (identifierKind === ColumnIdentifierKind.Role) {
                    let valueColRoles = valueCol.source.roles;

                    if (!valueColRoles || !valueColRoles[identifier])
                        continue;
                }
                else {
                    debug.assert(identifierKind === ColumnIdentifierKind.QueryName, 'identifierKind === ColumnIdentifierKind.QueryName');

                    if (valueCol.source.queryName !== identifier)
                        continue;
                }

                let min = valueCol.min;
                if (min === undefined)
                    min = valueCol.minLocal;
                if (min === undefined)
                    continue;

                let max = valueCol.max;
                if (max === undefined)
                    max = valueCol.maxLocal;
                if (max === undefined)
                    continue;

                return { min: min, max: max };
            }
        }

        export function createValueColumns(
            values: DataViewValueColumn[] = [],
            valueIdentityFields?: SQExpr[],
            source?: DataViewMetadataColumn): DataViewValueColumns {
            let result = <DataViewValueColumns>values;
            setGrouped(<DataViewValueColumns>values);

            if (valueIdentityFields)
                result.identityFields = valueIdentityFields;

            if (source)
                result.source = source;

            return result;
        }

        function setGrouped(values: DataViewValueColumns, groupedResult?: DataViewValueColumnGroup[]): void {
            values.grouped = groupedResult
                ? () => groupedResult
                : () => groupValues(values);
        }

        /** Group together the values with a common identity. */
        function groupValues(values: DataViewValueColumn[]): DataViewValueColumnGroup[] {
            debug.assertValue(values, 'values');

            let groups: DataViewValueColumnGroup[] = [],
                currentGroup: DataViewValueColumnGroup;

            for (let i = 0, len = values.length; i < len; i++) {
                let value = values[i];

                if (!currentGroup || currentGroup.identity !== value.identity) {
                    currentGroup = {
                        values: []
                    };

                    if (value.identity) {
                        currentGroup.identity = value.identity;

                        let source = value.source;

                        // allow null, which will be formatted as (Blank).
                        if (source.groupName !== undefined)
                            currentGroup.name = source.groupName;
                        else if (source.displayName)
                            currentGroup.name = source.displayName;
                    }

                    groups.push(currentGroup);
                }

                currentGroup.values.push(value);
            }

            return groups;
        }

        function pivotIfNecessary(dataView: DataView, dataViewMappings: DataViewMapping[]): DataView {
            debug.assertValue(dataView, 'dataView');

            let transformedDataView: DataView;
            switch (determineCategoricalTransformation(dataView.categorical, dataViewMappings)) {
                case CategoricalDataViewTransformation.Pivot:
                    transformedDataView = DataViewPivotCategorical.apply(dataView);
                    break;

                case CategoricalDataViewTransformation.SelfCrossJoin:
                    transformedDataView = DataViewSelfCrossJoin.apply(dataView);
                    break;
            }

            return transformedDataView || dataView;
        }

        function determineCategoricalTransformation(categorical: DataViewCategorical, dataViewMappings: DataViewMapping[]): CategoricalDataViewTransformation {
            if (!categorical || _.isEmpty(dataViewMappings))
                return;

            let categories = categorical.categories;
            if (!categories || categories.length !== 1)
                return;

            let values = categorical.values;
            if (_.isEmpty(values))
                return;

            if (values.grouped().some(vg => !!vg.identity))
                return;

            // If we made it here, the DataView has a single category and no valueGrouping.
            let categoryRoles = categories[0].source.roles;

            for (let i = 0, len = dataViewMappings.length; i < len; i++) {
                let roleMappingCategorical = dataViewMappings[i].categorical;
                if (!roleMappingCategorical)
                    continue;

                if (!hasRolesGrouped(categoryRoles, <DataViewGroupedRoleMapping>roleMappingCategorical.values))
                    continue;

                // If we made it here, the DataView's single category has the value grouping role.
                let categoriesMapping = roleMappingCategorical.categories;
                let hasCategoryRole =
                    hasRolesBind(categoryRoles, <DataViewRoleBindMappingWithReduction>categoriesMapping) ||
                    hasRolesFor(categoryRoles, <DataViewRoleForMappingWithReduction>categoriesMapping);

                if (hasCategoryRole)
                    return CategoricalDataViewTransformation.SelfCrossJoin;

                return CategoricalDataViewTransformation.Pivot;
            }
        }

        function shouldPivotMatrix(matrix: DataViewMatrix, dataViewMappings: DataViewMapping[]): boolean {
            if (!matrix || _.isEmpty(dataViewMappings))
                return;

            let rowLevels = matrix.rows.levels;
            if (rowLevels.length < 1)
                return;

            let rows = matrix.rows.root.children;
            if (!rows || rows.length === 0)
                return;

            let rowRoles = rowLevels[0].sources[0].roles;

            for (let i = 0, len = dataViewMappings.length; i < len; i++) {
                let roleMappingMatrix = dataViewMappings[i].matrix;
                if (!roleMappingMatrix)
                    continue;

                if (!hasRolesFor(rowRoles, <DataViewRoleForMappingWithReduction>roleMappingMatrix.rows) &&
                    hasRolesFor(rowRoles, <DataViewRoleForMappingWithReduction>roleMappingMatrix.columns)) {
                    return true;
                }
            }
        }

        function hasRolesBind(roles: { [name: string]: boolean }, roleMapping: DataViewRoleBindMappingWithReduction): boolean {
            if (roles && roleMapping && roleMapping.bind)
                return roles[roleMapping.bind.to];
        }

        function hasRolesFor(roles: { [name: string]: boolean }, roleMapping: DataViewRoleForMappingWithReduction): boolean {
            if (roles && roleMapping && roleMapping.for)
                return roles[roleMapping.for.in];
        }

        function hasRolesGrouped(roles: { [name: string]: boolean }, roleMapping: DataViewGroupedRoleMapping): boolean {
            if (roles && roleMapping && roleMapping.group)
                return roles[roleMapping.group.by];
        }
    }
}