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

module powerbi.data.utils {
    export module DataViewMetadataColumnUtils {

        export interface MetadataColumnAndProjectionIndex {
            /**
            * A metadata column taken from a source collection, e.g. DataViewHierarchyLevel.sources, DataViewMatrix.valueSources...
            */
            metadataColumn: DataViewMetadataColumn;

            /**
             * The index of this.metadataColumn in its sources collection.
             *
             * E.g.1 This can be the value of the property DataViewMatrixGroupValue.levelSourceIndex which is the index of this.metadataColumn in DataViewHierarchyLevel.sources.
             * E.g.2 This can be the value of the property DataViewMatrixNodeValue.valueSourceIndex which refer to columns in DataViewMatrix.valueSources.
             */
            sourceIndex: number;

            /**
            * The index of this.metadataColumn in the projection ordering of a given role.
            */
            projectionOrderIndex: number;
        }

        /**
         * Returns true iff the specified metadataColumn is assigned to the specified targetRole.
         */
        export function isForRole(metadataColumn: DataViewMetadataColumn, targetRole: string): boolean {
            debug.assertValue(metadataColumn, 'metadataColumn');
            debug.assertValue(targetRole, 'targetRole');

            let roles = metadataColumn.roles;
            return roles && roles[targetRole];
        }

        /**
         * Joins each column in the specified columnSources with projection ordering index into a wrapper object.
         *
         * Note: In order for this function to reliably calculate the "source index" of a particular column, the 
         * specified columnSources must be a non-filtered array of column sources from the DataView, such as
         * the DataViewHierarchyLevel.sources and DataViewMatrix.valueSources array properties.
         *
         * @param columnSources E.g. DataViewHierarchyLevel.sources, DataViewMatrix.valueSources...
         * @param projection The projection ordering.  It must contain an ordering for the specified role.
         * @param role The role for getting the relevant projection ordering, as well as for filtering out the irrevalent columns in columnSources.
         */
        export function joinMetadataColumnsAndProjectionOrder(
            columnSources: DataViewMetadataColumn[],
            projection: DataViewProjectionOrdering,
            role: string): MetadataColumnAndProjectionIndex[] {
            debug.assertAnyValue(columnSources, 'columnSources');
            debug.assert(_.all(columnSources, column => _.isNumber(column.index)),
                'pre-condition: Every value in columnSources must already have its Select Index property initialized.');
            debug.assertNonEmpty(projection[role], 'projection[role]');
            debug.assert(_.all(columnSources, column => !isForRole(column, role) || _.contains(projection[role], column.index)),
                'pre-condition: The projection order for the specified role must contain the Select Index of every column with matching role in the specified columnSources.');

            let jointResult: MetadataColumnAndProjectionIndex[] = [];

            if (!_.isEmpty(columnSources)) {
                let projectionOrderSelectIndices = projection[role];
                let selectIndexToProjectionIndexMap: { [selectIndex: number]: number } = {};
                for (let i = 0, ilen = projectionOrderSelectIndices.length; i < ilen; i++) {
                    let selectIndex = projectionOrderSelectIndices[i];
                    selectIndexToProjectionIndexMap[selectIndex] = i;
                }

                for (let j = 0, jlen = columnSources.length; j < jlen; j++) {
                    var column = columnSources[j];
                    if (isForRole(column, role)) {
                        let jointColumnInfo: MetadataColumnAndProjectionIndex = {
                            metadataColumn: column,
                            sourceIndex: j,
                            projectionOrderIndex: selectIndexToProjectionIndexMap[column.index]
                        };

                        jointResult.push(jointColumnInfo);
                    }
                }
            }

            return jointResult;
        }
    }
} 