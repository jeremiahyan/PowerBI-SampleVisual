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
    import inherit = Prototype.inherit;
    import inheritSingle = Prototype.inheritSingle;

    export module DataViewMatrixUtils {

        /**
         * Invokes the specified callback once per descendent leaf node of the specified matrixNode, with an optional 
         * index parameter in the callback that is the 0-based index of the particular leaf node in the context of this 
         * forEachLeafNode(...) invocation.
         */
        export function forEachLeafNode(matrixNode: DataViewMatrixNode, callback: (leafNode: DataViewMatrixNode, index?: number) => void): void {
            debug.assertValue(matrixNode, 'matrixNode');
            debug.assertValue(callback, 'callback');

            forEachLeafNodeRecursive(matrixNode, 0, callback);
        }

        function forEachLeafNodeRecursive(matrixNode: DataViewMatrixNode, nextIndex: number, callback: (leafNode: DataViewMatrixNode, index?: number) => void): number {
            debug.assertValue(matrixNode, 'matrixNode');
            debug.assertValue(callback, 'callback');

            if (_.isEmpty(matrixNode.children)) {
                callback(matrixNode, nextIndex);
                nextIndex++;
            }
            else {
                let children = matrixNode.children;
                for (var i = 0, len = children.length; i < len; i++) {
                    var nextChild = children[i];
                    if (nextChild) {
                        nextIndex = forEachLeafNodeRecursive(nextChild, nextIndex, callback);
                    }
                }
            }

            return nextIndex;
        }

        /**
         * Returned an object tree where each node and its children property are inherited from the specified node 
         * hierarchy, from the root down to the nodes at the specified deepestLevelToInherit, inclusively.
         *
         * The inherited nodes at level === deepestLevelToInherit will NOT get an inherited version of children array 
         * property, i.e. its children property is the same array object referenced in the input node's object tree.
         *
         * @param node The input node with the hierarchy object tree.
         * @param deepestLevelToInherit The highest level for a node to get inherited. See DataViewMatrixNode.level property.
         * @param useInheritSingle If true, then a node will get inherited in the returned object tree only if it is 
         * not already an inherited object. Same goes for the node's children property.  This is useful for creating 
         * "visual DataView" objects from "query DataView" objects, as object inheritance is the mechanism for 
         * "visual DataView" to override properties in "query DataView", and that "query DataView" never contains 
         * inherited objects.
         */
        export function inheritMatrixNodeHierarchy(
            node: DataViewMatrixNode,
            deepestLevelToInherit: number,
            useInheritSingle: boolean): DataViewMatrixNode {
            debug.assertValue(node, 'node');
            debug.assert(deepestLevelToInherit >= 0, 'deepestLevelToInherit >= 0');
            debug.assertValue(useInheritSingle, 'useInheritSingle');

            let returnNode = node;

            // Note: The level property of DataViewMatrix.rows.root and DataViewMatrix.columns.root are always undefined.
            // Also, in a matrix with multiple column grouping fields and multiple value fields, the DataViewMatrixNode
            // for the Grand Total column in the column hierarchy will have children nodes where level > (parent.level + 1):
            //  {
            //    "level": 0,
            //    "isSubtotal": true,
            //    "children": [
            //      { "level": 2, "isSubtotal": true },
            //      { "level": 2, "levelSourceIndex": 1, "isSubtotal": true }
            //    ]
            //  }
            let isRootNode = _.isUndefined(node.level);
            let shouldInheritCurrentNode = isRootNode || (node.level <= deepestLevelToInherit);
            if (shouldInheritCurrentNode) {
                let inheritFunc = useInheritSingle ? inheritSingle : inherit;
                let inheritedNode: DataViewMatrixNode = inheritFunc(node);

                let shouldInheritChildNodes = isRootNode || (node.level < deepestLevelToInherit);
                if (shouldInheritChildNodes && !_.isEmpty(node.children)) {
                    inheritedNode.children = inheritFunc(node.children); // first, make an inherited array
                    for (let i = 0, ilen = inheritedNode.children.length; i < ilen; i++) {
                        inheritedNode.children[i] =
                            inheritMatrixNodeHierarchy(inheritedNode.children[i], deepestLevelToInherit, useInheritSingle);
                    }
                }

                returnNode = inheritedNode;
            }

            return returnNode;
        }
    }
} 