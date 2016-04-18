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
    import ValueType = powerbi.ValueType;
    import DataViewTransform = powerbi.data.DataViewTransform;

    export class EnhancedScatterChartData {

        public getDataViewMultiSeries(firstGroupName: string = 'Canada', secondGroupName: string = 'United States', withMinMax: boolean = false): powerbi.DataView {
            let dataViewMetadata: powerbi.DataViewMetadata = {
                columns: [
                    {
                        displayName: 'category',
                        format: 'yyyy',
                        type: ValueType.fromDescriptor({ dateTime: true })
                    }, {
                        displayName: 'series'
                    }, {
                        displayName: 'x',
                        format: '#,0.00',
                        isMeasure: true,
                        roles: { 'X': true },
                        groupName: firstGroupName,
                    }, {
                        displayName: 'y',
                        format: '#,0',
                        isMeasure: true,
                        roles: { 'Y': true },
                        groupName: firstGroupName,
                    }, {
                        displayName: 'size',
                        format: '#,0',
                        isMeasure: true,
                        roles: { 'Size': true },
                        groupName: firstGroupName,
                    }, {
                        displayName: 'x',
                        format: '#,0.00',
                        isMeasure: true,
                        roles: { 'X': true },
                        groupName: secondGroupName,
                    }, {
                        displayName: 'y',
                        format: '#,0',
                        isMeasure: true,
                        roles: { 'Y': true },
                        groupName: secondGroupName,
                    }, {
                        displayName: 'size',
                        format: '#,0',
                        isMeasure: true,
                        roles: { 'Size': true },
                        groupName: secondGroupName,
                    }
                ]
            };

            let colP1Ref = powerbi.data.SQExprBuilder.fieldDef({ schema: 's', entity: 't', column: 'p1' });
            let colP2Ref = powerbi.data.SQExprBuilder.fieldDef({ schema: 's', entity: 't', column: 'p2' });

            let seriesValues = [firstGroupName, secondGroupName];
            let seriesIdentities = seriesValues.map(v => mocks.dataViewScopeIdentity(v));

            let dataViewValueColumns: powerbi.DataViewValueColumn[] = [
                {
                    source: dataViewMetadata.columns[2],
                    values: [150, 177, 157],
                    identity: seriesIdentities[0],
                }, {
                    source: dataViewMetadata.columns[3],
                    values: [30, 25, 28],
                    identity: seriesIdentities[0],
                }, {
                    source: dataViewMetadata.columns[4],
                    values: [100, 200, 300],
                    identity: seriesIdentities[0],
                }, {
                    source: dataViewMetadata.columns[5],
                    values: [100, 149, 144],
                    identity: seriesIdentities[1],
                }, {
                    source: dataViewMetadata.columns[6],
                    values: [300, 250, 280],
                    identity: seriesIdentities[1],
                }, {
                    source: dataViewMetadata.columns[7],
                    values: [150, 250, 350],
                    identity: seriesIdentities[1],
                }
            ];

            if (withMinMax) {
                dataViewValueColumns[2].min = 50;
                dataViewValueColumns[2].max = 400;
                dataViewValueColumns[5].min = 100;
                dataViewValueColumns[5].max = 500;
            }

            let dataView: powerbi.DataView = {
                metadata: dataViewMetadata,
                categorical: {
                    categories: [{
                        source: dataViewMetadata.columns[0],
                        values: [
                            powerbitests.helpers.parseDateString("2012-01-01T00:00:00"),
                            powerbitests.helpers.parseDateString("2011-01-01T00:00:00"),
                            powerbitests.helpers.parseDateString("2010-01-01T00:00:00")
                        ],
                        identity: [seriesIdentities[0]],
                        identityFields: [
                            colP1Ref
                        ]
                    }],
                    values: DataViewTransform.createValueColumns(dataViewValueColumns, [colP2Ref])
                },
            };

            dataView.categorical.values.source = dataViewMetadata.columns[1];

            return dataView;
        }
    }
}