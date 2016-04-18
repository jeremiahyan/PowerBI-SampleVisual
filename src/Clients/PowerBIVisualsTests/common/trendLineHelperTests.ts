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

module powerbitests {
    import lineStyle = powerbi.visuals.lineStyle;
    import ObjectEnumerationBuilder = powerbi.visuals.ObjectEnumerationBuilder;
    import TrendLineHelper = powerbi.visuals.TrendLineHelper;
    import TrendLine = powerbi.visuals.TrendLine;
    import DataViewTransform = powerbi.data.DataViewTransform;

    describe('TrendLineHelper', () => {
        let samplePoints: powerbi.visuals.IPoint[] = [{ x: 0, y: 0 }, { x: 100, y: 100 }];

        describe('enumerateObjectInstances', () => {
            it('with no trend lines generates a trend line object', () => {
                let enumerationBuilder = new ObjectEnumerationBuilder();
                TrendLineHelper.enumerateObjectInstances(enumerationBuilder, undefined);
                let instances = enumerationBuilder.complete().instances;

                expect(instances.length).toBe(1);
                expect(instances[0]).toEqual({
                    selector: null,
                    properties: {
                        show: false,
                    },
                    objectName: 'trend',
                });
            });

            it('with trend line object', () => {
                let enumerationBuilder = new ObjectEnumerationBuilder();

                let trendLine: TrendLine = {
                    points: samplePoints,
                    show: true,
                    lineColor: { fill: { solid: { color: 'red' } } },
                    style: lineStyle.dotted,
                    transparency: 20,
                };

                TrendLineHelper.enumerateObjectInstances(enumerationBuilder, trendLine);
                let instances = enumerationBuilder.complete().instances;

                expect(instances[0]).toEqual({
                    selector: null,
                    properties: {
                        show: true,
                        lineColor: { fill: { solid: { color: 'red' } } },
                        style: lineStyle.dotted,
                        transparency: 20,
                    },
                    objectName: 'trend',
                });
            });
        });

        describe('readDataView', () => {
            it('invalid data view', () => {
                expect(TrendLineHelper.readDataView(null)).toBeUndefined();

                expect(TrendLineHelper.readDataView({ single: { value: 10 }, metadata: { columns: [] } })).toBeUndefined();

                expect(TrendLineHelper.readDataView({
                    categorical: {
                        categories: [],
                        values: DataViewTransform.createValueColumns(),
                    },
                    metadata: {
                        columns: []
                    },
                })).toBeUndefined();

                // Only category column
                let categoryField = powerbi.data.SQExprBuilder.entity('schema', 'table', 'category_column');
                let categoryValues = ['a', 'b'];
                expect(TrendLineHelper.readDataView(
                    powerbi.data.createCategoricalDataViewBuilder().withCategory({
                        identityFrom: {
                            fields: [categoryField],
                            identities: _.map(categoryValues, v => mocks.dataViewScopeIdentity(v))
                        },
                        source: {
                            displayName: 'category column',
                            isMeasure: false,
                            index: 0,
                            queryName: 'select1',
                            roles: { 'Category': true },
                            type: powerbi.ValueType.fromDescriptor({ text: true }),
                        },
                        values: categoryValues
                    }).build())).toBeUndefined();

                // Only value column
                expect(TrendLineHelper.readDataView(
                    powerbi.data.createCategoricalDataViewBuilder().withValues({
                        columns: [
                            {
                                source: {
                                    displayName: 'value column',
                                    isMeasure: false,
                                    index: 0,
                                    queryName: 'select1',
                                    roles: { 'Y': true },
                                    type: powerbi.ValueType.fromDescriptor({ numeric: true }),
                                },
                                values: [1],
                            }
                        ]
                    }).build())).toBeUndefined();
            });

            it('data view with defaults', () => {
                let dataView = buildValidDataView();

                expect(TrendLineHelper.readDataView(dataView)).toEqual({
                    points: [{ x: 1, y: 100 }, { x: 2, y: 200 }],
                    show: false,
                    lineColor: { solid: { color: '#000' } },
                    transparency: TrendLineHelper.defaults.transparency,
                    style: TrendLineHelper.defaults.lineStyle,
                });
            });

            it('legacy color', () => {
                let dataView = buildValidDataView();

                dataView.categorical.values[0].source.objects = {
                    dataPoint: {
                        fill: { solid: { color: '#123' } },
                    }
                };

                expect(TrendLineHelper.readDataView(dataView)).toEqual({
                    points: [{ x: 1, y: 100 }, { x: 2, y: 200 }],
                    show: false,
                    lineColor: { solid: { color: '#123' } },
                    transparency: TrendLineHelper.defaults.transparency,
                    style: TrendLineHelper.defaults.lineStyle,
                });

                // --- Legacy color overrides line color
                dataView.metadata.objects = {
                    trend: {
                        lineColor: { solid: { color: '#456' } }
                    },
                    dataPoint: {
                        fill: { solid: { color: '#123' } },
                    }
                };

                expect(TrendLineHelper.readDataView(dataView)).toEqual({
                    points: [{ x: 1, y: 100 }, { x: 2, y: 200 }],
                    show: false,
                    lineColor: { solid: { color: '#123' } },
                    transparency: TrendLineHelper.defaults.transparency,
                    style: TrendLineHelper.defaults.lineStyle,
                });
            });

            it('invalid numbers', () => {
                let dataView = buildValidDataView();

                dataView.categorical.categories[0].values = [20, null];
                dataView.categorical.values[0].values = [NaN, 100];

                expect(TrendLineHelper.readDataView(dataView)).toEqual({
                    points: [],
                    show: false,
                    lineColor: TrendLineHelper.defaults.color,
                    transparency: TrendLineHelper.defaults.transparency,
                    style: TrendLineHelper.defaults.lineStyle,
                });
            });

            function buildValidDataView(): powerbi.DataView {
                let categoryField = powerbi.data.SQExprBuilder.entity('schema', 'table', 'category_column');
                let categoryValues = [1, 2];
                return powerbi.data.createCategoricalDataViewBuilder().withCategory({
                    identityFrom: {
                        fields: [categoryField],
                        identities: _.map(categoryValues, v => mocks.dataViewScopeIdentity(v))
                    },
                    source: {
                        displayName: 'category column',
                        isMeasure: false,
                        index: 0,
                        queryName: 'select1',
                        roles: { 'Category': true },
                        type: powerbi.ValueType.fromDescriptor({ text: true }),
                    },
                    values: categoryValues
                }).withValues({
                    columns: [
                        {
                            source: {
                                displayName: 'value column',
                                isMeasure: false,
                                index: 0,
                                queryName: 'select1',
                                roles: { 'Y': true },
                                type: powerbi.ValueType.fromDescriptor({ numeric: true }),
                            },
                            values: [100, 200],
                        }
                    ]
                }).build();
            }
        });
    });
}
