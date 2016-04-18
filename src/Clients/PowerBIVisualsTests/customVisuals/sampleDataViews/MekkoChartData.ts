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

module powerbitests.customVisuals.sampleDataViews {
    import DataView = powerbi.DataView;
    import DataViewTransform = powerbi.data.DataViewTransform;
    import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
    import ValueType = powerbi.ValueType;
    import DataViewMatrix = powerbi.DataViewMatrix;
    import DataViewTreeNode = powerbi.DataViewTreeNode;
    import SQExprBuilder = powerbi.data.SQExprBuilder;

    export class MekkoChartData {

        private sampleDataSales = [
            [13438, 62722, 21356, 50502, 63827, 8984, 5921, 19239, 7489, 58],
            [39559, 208747, 59596, 129009, 153618, 22633, 12742, 51294, 34898, 166],
            [46292, 122965, 62160, 92930, 90940, 24216, 10220, 35798, 75083, 15522],
            [148748, 393446, 174099, 244620, 304140, 66829, 43622, 130262, 193782, 53495],
            [125167, 659662, 176596, 423307, 476365, 66337, 41294, 164091, 81065, 662],
            [485202, 916391, 761667, 610353, 790347, 241163, 124495, 314178, 930288, 276962],
            [452835, 781470, 658360, 543560, 655662, 191357, 114213, 273051, 934784, 285953],
            [33500, 171652, 49714, 110020, 117515, 18193, 10041, 44154, 27382, 193],
            [29348, 154279, 40143, 103909, 100518, 16849, 7661, 46671, 22621, 168],
            [102131, 409566, 146385, 237980, 321628, 55519, 37320, 103045, 120289, 15794],
            [311736, 571521, 555415, 384193, 500341, 140739, 78576, 197475, 625643, 180804]
        ];

        private sampleDataSalesUnits = [
            [1626, 8636, 3393, 6954, 4414, 2069, 1470, 4314, 1508, 20],
            [5165, 29620, 9895, 18569, 12964, 5444, 3274, 12048, 7126, 42],
            [6578, 16744, 11773, 12973, 6918, 5655, 2834, 8137, 17235, 10507],
            [19176, 54206, 32902, 35402, 22056, 15470, 11787, 25150, 54483, 35426],
            [16553, 89366, 29345, 61281, 37375, 16399, 10802, 37554, 16546, 276],
            [68244, 132250, 148565, 87137, 54099, 56346, 35012, 63132, 238791, 188100],
            [62610, 112793, 129220, 77027, 46945, 43607, 32724, 53859, 248326, 199478],
            [4440, 23933, 8426, 16148, 9508, 4460, 2556, 10548, 5411, 105],
            [3713, 20271, 6779, 14674, 7618, 3834, 1996, 10098, 4851, 71],
            [12965, 56461, 25732, 34168, 24354, 13342, 9038, 22603, 30630, 10530],
            [43763, 80795, 104172, 54402, 32043, 32652, 20399, 37434, 151567, 121176]
        ];

        private categoryValues = ["010-Womens", "020-Mens", "030-Kids", "040-Juniors", "050-Shoes", "060-Intimate", "070-Hosiery", "080-Accessories", "090-Home", "100-Groceries"];
        private territoryValues = ["DE", "GA", "KY", "MD", "NC", "OH", "PA", "SC", "TN", "VA", "WV"];
        private categoryEntityField = SQExprBuilder.fieldExpr({ column: { schema: undefined, entity: "Mekko", name: "Category" } });
        private territiryEntityField = SQExprBuilder.fieldExpr({ column: { schema: undefined, entity: "Mekko", name: "Territory" } });

        public getDataView(): DataView {
            let categoryIdentities = this.categoryValues.map(value =>
                powerbi.data.createDataViewScopeIdentity(SQExprBuilder.equal(this.categoryEntityField, SQExprBuilder.text(value))));

            let dataProperties: DataViewMetadataColumn[] = this.dataProperties; 

            let dataViewMetadata = this.getMetadata();

            let columns = [];
            for (let index = 0, length = this.territoryValues.length; index < length; index++) {
                let columnIdentity = powerbi.data.createDataViewScopeIdentity(
                    SQExprBuilder.equal(this.territiryEntityField, SQExprBuilder.text(this.territoryValues[index])));

                columns.push(
                    {
                        source: dataViewMetadata.columns[index * 2 + 2],
                        values: this.sampleDataSales[index],
                        identity: columnIdentity
                    });

                columns.push(
                    {
                        source: dataViewMetadata.columns[index * 2 + 3],
                        values: this.sampleDataSalesUnits[index],
                        identity: columnIdentity
                    });
            }

            let columnRootChildrens = [];
            for (let index = 0, length = this.territoryValues.length; index < length; index++) {
                columnRootChildrens.push(
                    {
                        children: [
                            { level: 1 },
                            { level: 1, levelSourceIndex: 1 }
                        ],
                        identity: powerbi.data.createDataViewScopeIdentity(
                            SQExprBuilder.equal(this.territiryEntityField, SQExprBuilder.text(this.territoryValues[index]))),
                        level: 0,
                        value: this.territoryValues[index]
                    });
            }

            let matrixSellData: DataViewMatrix = {
                rows: {
                    root: {
                        childIdentityFields: [this.categoryEntityField],
                        children: this.getRowChilds()
                    },
                    levels: [{
                        sources: [dataProperties[0]]
                    }]
                },
                columns: {
                    root: {
                        children: columnRootChildrens,
                        childIdentityFields: [this.territiryEntityField]
                    },
                    levels: [
                        {
                            sources: [dataProperties[1]]
                        },
                        {
                            sources: [dataProperties[2], dataProperties[3]]
                        }
                    ]
                },
                valueSources: [dataProperties[2], dataProperties[3]]
            };

            return {
                metadata: dataViewMetadata,
                categorical: {
                    categories: [{
                        source: dataViewMetadata.columns[0],
                        values: this.categoryValues,
                        identity: categoryIdentities,
                        identityFields: [this.categoryEntityField]
                    }],
                    values: DataViewTransform.createValueColumns(columns, undefined, dataViewMetadata.columns[1])
                },
                matrix: matrixSellData
            };
        }

        private get dataProperties(): DataViewMetadataColumn[] {
            return [
                {
                    displayName: "Category",
                    index: 0,
                    queryName: "Mekko.Category",
                    roles: { Category: true },
                    type: ValueType.fromDescriptor({ text: true })
                },
                {
                    displayName: "Territory",
                    index: 1,
                    queryName: "Mekko.Territory",
                    roles: { Series: true },
                    type: ValueType.fromDescriptor({ text: true })
                },
                {
                    displayName: "This Year Sales",
                    format: "\"$\"#,##0;\\(\"$\"#,##0\\)",
                    index: 2,
                    roles: { Y: true },
                    queryName: "Sum(Mekko.This Year Sales)",
                    isMeasure: true,
                    type: ValueType.fromDescriptor({ numeric: true })
                },
                {
                    displayName: "Sum Total Units This Year",
                    format: "\"$\"#,##0;\\(\"$\"#,##0\\)",
                    index: 3,
                    roles: { Width: true },
                    queryName: "CountNonNull(Mekko.Total Units This Year)",
                    isMeasure: true,
                    type: ValueType.fromDescriptor({ numeric: true })
                }];
        }

        private getMetadata(): powerbi.DataViewMetadata {
            let metadataColumns: DataViewMetadataColumn[] = [];
            metadataColumns.push(this.dataProperties[0]);
            metadataColumns.push(this.dataProperties[1]);

            for (let index = 0, length = this.territoryValues.length; index <= length; index++) {
                let salesColumn = this.dataProperties[2];
                if (index < length)
                    salesColumn.groupName = this.territoryValues[index];
                metadataColumns.push(salesColumn);
                
                let totalUnitsColumn = this.dataProperties[3];
                if (index < length)
                    totalUnitsColumn.groupName = this.territoryValues[index];
                metadataColumns.push(totalUnitsColumn);
            }
            return { columns: metadataColumns };
        }

        private getRowChilds(): DataViewTreeNode[] {
            let rowChilds: DataViewTreeNode[] = [];

            for (let i = 0, length = this.categoryValues.length; i < length; i++) {
                let children: DataViewTreeNode = {
                    value: this.categoryValues[i],
                    identity: powerbi.data.createDataViewScopeIdentity(SQExprBuilder.equal(
                        this.categoryEntityField, SQExprBuilder.text(this.categoryValues[i]))),
                    level: 0,
                    values: {}
                };

                for (let j = 0, terLen = this.territoryValues.length; j < terLen; j++) {
                    children.values[2 * j] = { value: this.sampleDataSales[j][i] };
                    children.values[2 * j + 1] = { value: this.sampleDataSalesUnits[j][i], valueSourceIndex: 1 };
                }

                rowChilds.push(children);
            }
            return rowChilds;
        }

        public randomize(): void {
        }
    }
}