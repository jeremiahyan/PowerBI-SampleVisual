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
    import SQExpr = powerbi.data.SQExpr;

    export function createStaticEvalContext(colorAllocatorCache?: IColorAllocatorCache): IEvalContext;
    export function createStaticEvalContext(colorAllocatorCache: IColorAllocatorCache, dataView: DataView, selectTransforms: DataViewSelectTransform[]): IEvalContext;
    export function createStaticEvalContext(colorAllocatorCache: IColorAllocatorCache, dataView?: DataView, selectTransforms?: DataViewSelectTransform[]): IEvalContext {
        return new StaticEvalContext(
            colorAllocatorCache || createColorAllocatorCache(),
            dataView || { metadata: { columns: [] } },
            selectTransforms);
    }

    /**
     * Represents an eval context over a potentially empty DataView.  Only static repetition data view objects
     * are supported.
     */
    class StaticEvalContext implements IEvalContext {
        private colorAllocatorCache: IColorAllocatorCache;
        private dataView: DataView;
        private selectTransforms: DataViewSelectTransform[];

        constructor(colorAllocatorCache: IColorAllocatorCache, dataView: DataView, selectTransforms: DataViewSelectTransform[]) {
            debug.assertValue(colorAllocatorCache, 'colorAllocatorCache');
            debug.assertValue(dataView, 'dataView');
            debug.assertAnyValue(selectTransforms, 'selectTransforms');

            this.colorAllocatorCache = colorAllocatorCache;
            this.dataView = dataView;
            this.selectTransforms = selectTransforms;
        }

        public getColorAllocator(expr: SQFillRuleExpr): IColorAllocator {
            return this.colorAllocatorCache.get(expr);
        }

        public getExprValue(expr: SQExpr): PrimitiveValue {
            let dataView = this.dataView,
                selectTransforms = this.selectTransforms;
            if (dataView && dataView.table && selectTransforms)
                return getExprValueFromTable(expr, selectTransforms, dataView.table, /*rowIdx*/ 0);
        }

        public getRoleValue(roleName: string): PrimitiveValue {
            return;
        }
    }

    export function getExprValueFromTable(expr: SQExpr, selectTransforms: DataViewSelectTransform[], table: DataViewTable, rowIdx: number): PrimitiveValue {
        debug.assertValue(expr, 'expr');
        debug.assertValue(selectTransforms, 'selectTransforms');
        debug.assertValue(table, 'table');
        debug.assertValue(rowIdx, 'rowIdx');

        let rows = table.rows;
        if (_.isEmpty(rows) || rows.length <= rowIdx)
            return;

        let cols = table.columns;
        for (let selectIdx = 0, selectLen = selectTransforms.length; selectIdx < selectLen; selectIdx++) {
            let selectTransform = selectTransforms[selectIdx];
            if (!SQExpr.equals(selectTransform.expr, expr) || !selectTransform.queryName)
                continue;

            for (let colIdx = 0, colLen = cols.length; colIdx < colLen; colIdx++) {
                if (selectIdx !== cols[colIdx].index)
                    continue;

                return rows[rowIdx][colIdx];
            }
        }

    }
}