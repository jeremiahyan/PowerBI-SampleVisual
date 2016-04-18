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
    import SQExprBuilder = powerbi.data.SQExprBuilder;
    import DataView = powerbi.DataView;
    import ValueType = powerbi.ValueType;
    import DataViewTransform = powerbi.data.DataViewTransform;
    import DataViewValueColumns = powerbi.DataViewValueColumns;
    import DataViewValueColumn = powerbi.DataViewValueColumn;

    export class CarLogosData {

        private categoryValues: string[] = ["BMW", "Mercedes", "Honda", "Toyota", "Ferrari"];

        public getDataView(): DataView {
            let dataViewMetadata: powerbi.DataViewMetadata = {
                columns: [
                    {
                        displayName: 'Car',
                        queryName: 'Country',
                        roles: { Category: true },
                        type: ValueType.fromDescriptor({ text: true })
                    },
                    {
                        displayName: 'Sales Count',
                        format: "g",
                        isMeasure: true,
                        queryName: 'sales',
                        roles: { Values: true },
                        type: ValueType.fromDescriptor({ numeric: true }),
                        objects: { dataPoint: { fill: { solid: { color: 'purple' } } } },
                    },
                    {
                        displayName: 'Image',
                        format: "g",
                        queryName: 'Image',
                        roles: { Image: true },
                        type: ValueType.fromDescriptor({ text: true })
                    }
                ],
                objects: {
                    general: {
                        columns: 1
                    }
                }
            };

            let sampleData: number[] = [5, 10, 15, 20, 25];
            let carImages: string[] = [
                "https://raw.githubusercontent.com/Microsoft/PowerBI-visuals/resources/images/chicletSlicer/bmw.png",
                "https://raw.githubusercontent.com/Microsoft/PowerBI-visuals/resources/images/chicletSlicer/mercedes.png",
                "https://raw.githubusercontent.com/Microsoft/PowerBI-visuals/resources/images/chicletSlicer/honda.png",
                "https://raw.githubusercontent.com/Microsoft/PowerBI-visuals/resources/images/chicletSlicer/toyota.gif",
                "https://raw.githubusercontent.com/Microsoft/PowerBI-visuals/resources/images/chicletSlicer/ferrari.png"
            ];

            let fieldExpr = SQExprBuilder.fieldExpr({ column: { schema: 's', entity: "table1", name: "country" } });
            let imageFieldExpr = SQExprBuilder.fieldExpr({ column: { schema: 's', entity: "table1", name: "Image" } });

            let imageIdentities = carImages.map((value) => 
                powerbi.data.createDataViewScopeIdentity(SQExprBuilder.equal(imageFieldExpr, SQExprBuilder.text(value))));
        
            let categoryIdentities = this.categoryValues.map((value) =>
                powerbi.data.createDataViewScopeIdentity(SQExprBuilder.equal(fieldExpr, SQExprBuilder.text(value))));

            let columns: DataViewValueColumn[] = this.categoryValues.map((car, i): DataViewValueColumn => {

                let source = dataViewMetadata.columns[1];
                source.groupName = carImages[i];
                return {
                    source: source,
                    identity: imageIdentities[i],
                    values: sampleData
                };
            });

            let dataValues: DataViewValueColumns = DataViewTransform.createValueColumns(columns, [fieldExpr, imageFieldExpr], dataViewMetadata.columns[2]);

            return {
                metadata: dataViewMetadata,
                categorical: {
                    categories: [{
                        source: dataViewMetadata.columns[0],
                        values: this.categoryValues,
                        identity: categoryIdentities,
                    }],
                    values: dataValues
                }
            };
        }

        public getDataViewWithoutImages(): DataView {
            let dataViewMetadata: powerbi.DataViewMetadata = {
                columns: [
                    {
                        displayName: 'Car',
                        queryName: 'Country',
                        roles: { Category: true },
                        type: ValueType.fromDescriptor({ text: true })
                    },
                    {
                        displayName: 'Sales Count',
                        format: "g",
                        isMeasure: true,
                        queryName: 'sales',
                        roles: { Values: true },
                        type: ValueType.fromDescriptor({ numeric: true }),
                        objects: { dataPoint: { fill: { solid: { color: 'purple' } } } },
                    },
                ],
                objects: {
                    general: {
                        columns: 1
                    }
                }
            };

            let sampleData: number[] = [5, 10, 15, 20, 25];
            let fieldExpr = SQExprBuilder.fieldExpr({ column: { schema: 's', entity: "table1", name: "country" } });
            let imageFieldExpr = SQExprBuilder.fieldExpr({ column: { schema: 's', entity: "table1", name: "Image" } });
            let categoryIdentities = this.categoryValues.map((value) =>
                powerbi.data.createDataViewScopeIdentity(SQExprBuilder.equal(fieldExpr, SQExprBuilder.text(value))));

            let columns: DataViewValueColumn[] = this.categoryValues.map((car, i): DataViewValueColumn => {

                let source = dataViewMetadata.columns[1];
                source.groupName = this.categoryValues[i];
                return {
                    source: source,
                    identity: null,
                    values: sampleData
                };
            });

            let dataValues: DataViewValueColumns = DataViewTransform.createValueColumns(columns, [fieldExpr, imageFieldExpr], dataViewMetadata.columns[2]);

            return {
                metadata: dataViewMetadata,
                categorical: {
                    categories: [{
                        source: dataViewMetadata.columns[0],
                        values: this.categoryValues,
                        identity: categoryIdentities,
                    }],
                    values: dataValues
                }
            };
        }
    }
}