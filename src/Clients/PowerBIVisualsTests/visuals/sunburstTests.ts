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
    import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
    import SQExprBuilder = powerbi.data.SQExprBuilder;
    import data = powerbi.data;
    import VisualUpdateOptions = powerbi.VisualUpdateOptions;
    import DataViewMatrix = powerbi.DataViewMatrix;
    import DataView = powerbi.DataView;
    import Sunburst = powerbi.visuals.Sunburst;
    import SunburstSlice = powerbi.visuals.SunburstSlice;
    import ArrayExtensions = jsCommon.ArrayExtensions;
    import QueryProjectionsByRole = powerbi.data.QueryProjectionsByRole;
    import QueryProjectionCollection = powerbi.data.QueryProjectionCollection;
    import DataViewAnalysis = powerbi.DataViewAnalysis;
    import DataViewMetadata = powerbi.DataViewMetadata;
    import SelectionId = powerbi.visuals.SelectionId;

    const column1: powerbi.DataViewMetadataColumn = { displayName: 'Region', index: 0, queryName: 'example.Region', roles: { Values: true } };
    const column2: powerbi.DataViewMetadataColumn = { displayName: 'State', index: 1, queryName: 'example.State', roles: { Values: true } };
    const column3: powerbi.DataViewMetadataColumn = { displayName: 'City', index: 2, queryName: 'example.City', roles: { Values: true } };
    const measure: powerbi.DataViewMetadataColumn = { displayName: 'Value', index: 3, isMeasure: true, queryName: 'Sum(example.Value)', roles: { Values: true } };

    function createMatrixWith2Columns(): DataViewMatrix {
        return {
            rows: {
                root: {
                    children: [
                        {
                            level: 0,
                            value: 'East',
                            identity: data.createDataViewScopeIdentity(SQExprBuilder.text('East')),
                            children: [
                                {
                                    level: 1,
                                    value: 'NY',
                                    identity: data.createDataViewScopeIdentity(SQExprBuilder.text('NY')),
                                    children: [{
                                        level: 2,
                                        value: 'New York',
                                        identity: data.createDataViewScopeIdentity(SQExprBuilder.text('New York')),
                                        values: { 0: { value: 35 } }
                                    }]
                                },
                                {
                                    level: 1,
                                    value: 'NM',
                                    identity: data.createDataViewScopeIdentity(SQExprBuilder.text('NM')),
                                    children: [{
                                        level: 2,
                                        identity: data.createDataViewScopeIdentity(SQExprBuilder.text('')),
                                        values: { 0: { value: 10 } }
                                    }]
                                }
                            ],
                            objects: {}
                        },
                        {
                            level: 0,
                            value: 'MidWest',
                            identity: data.createDataViewScopeIdentity(SQExprBuilder.text('MidWest')),
                            children: [
                                {
                                    level: 1,
                                    value: 'OH',
                                    identity: data.createDataViewScopeIdentity(SQExprBuilder.text('OH')),
                                    children: [{
                                        level: 2,
                                        identity: data.createDataViewScopeIdentity(SQExprBuilder.text('')),
                                        values: { 0: { value: 5 } }
                                    }]
                                }
                            ],                            
                            objects: {}
                        },
                    ]
                },
                levels: [{
                    sources: [column1, column2, column3]
                }]
            },
            columns: {
                root: {
                    children: [{ level: 0 }]
                },
                levels: [{
                    sources: [measure]
                }]
            },
            valueSources: [measure]
        };
    }

    function createMatrixWith3Columns(): DataViewMatrix {
        return {
            rows: {
                root: {
                    children: [
                        {
                            level: 0,
                            value: 'East',
                            identity: data.createDataViewScopeIdentity(SQExprBuilder.text('East')),
                            children: [
                                {
                                    level: 1,
                                    value: 'NY',
                                    identity: data.createDataViewScopeIdentity(SQExprBuilder.text('NY')),
                                    children: [{
                                        level: 2,
                                        value: 'New York',
                                        identity: data.createDataViewScopeIdentity(SQExprBuilder.text('New York')),
                                        values: { 0: { value: 35 } }
                                    }]
                                },
                                {
                                    level: 1,
                                    value: 'NM',
                                    identity: data.createDataViewScopeIdentity(SQExprBuilder.text('NM')),
                                    children: [{
                                        level: 2,
                                        identity: data.createDataViewScopeIdentity(SQExprBuilder.text('')),
                                        values: { 0: { value: 10 } }
                                    }]
                                }
                            ]
                        },
                        {
                            level: 0,
                            identity: data.createDataViewScopeIdentity(SQExprBuilder.text('')),
                            children: [
                                {
                                    level: 1,
                                    identity: data.createDataViewScopeIdentity(SQExprBuilder.text('')),
                                    children: [{
                                        level: 2,
                                        value: 'Seattle',
                                        identity: data.createDataViewScopeIdentity(SQExprBuilder.text('Seattle')),
                                        values: { 0: { value: 25 } }
                                    }]
                                },
                                {
                                    level: 1,
                                    value: 'OR',
                                    identity: data.createDataViewScopeIdentity(SQExprBuilder.text('OR')),
                                    children: [{
                                        level: 2,
                                        value: 'Bellevue',
                                        identity: data.createDataViewScopeIdentity(SQExprBuilder.text('Bellevue')),
                                        values: { 0: { value: 10 } }
                                    }]
                                }
                            ]
                        },
                        {
                            level: 0,
                            value: 'MidWest',
                            identity: data.createDataViewScopeIdentity(SQExprBuilder.text('MidWest')),
                            children: [
                                {
                                    level: 1,
                                    value: 'OH',
                                    identity: data.createDataViewScopeIdentity(SQExprBuilder.text('OH')),
                                    children: [{
                                        level: 2,
                                        identity: data.createDataViewScopeIdentity(SQExprBuilder.text('')),
                                        values: { 0: { value: 5 } }
                                    }]
                                }
                            ]
                        },
                    ]
                },
                levels: [{
                    sources: [column1, column2, column3]
                }]
            },
            columns: {
                root: {
                    children: [{ level: 0 }]
                },
                levels: [{
                    sources: [measure]
                }]
            },
            valueSources: [measure]
        };
    }

    function createMatrixWith4Columns(): DataViewMatrix {
        return {
            rows: {
                root: {
                    children: [
                        {
                            level: 0,
                            value: 'East',
                            identity: data.createDataViewScopeIdentity(SQExprBuilder.text('East')),
                            children: [
                                {
                                    level: 1,
                                    value: 'NY',
                                    identity: data.createDataViewScopeIdentity(SQExprBuilder.text('NY')),
                                    children: [{
                                        level: 2,
                                        value: 'New York',
                                        identity: data.createDataViewScopeIdentity(SQExprBuilder.text('New York')),
                                        values: { 0: { value: 35 } }
                                    }]
                                },
                                {
                                    level: 1,
                                    value: 'NM',
                                    identity: data.createDataViewScopeIdentity(SQExprBuilder.text('NM')),
                                    children: [{
                                        level: 2,
                                        identity: data.createDataViewScopeIdentity(SQExprBuilder.text('')),
                                        values: { 0: { value: 10 } }
                                    }]
                                }
                            ]
                        },
                        {
                            level: 0,
                            identity: data.createDataViewScopeIdentity(SQExprBuilder.text('')),
                            children: [
                                {
                                    level: 1,
                                    identity: data.createDataViewScopeIdentity(SQExprBuilder.text('')),
                                    children: [{
                                        level: 2,
                                        value: 'Seattle',
                                        identity: data.createDataViewScopeIdentity(SQExprBuilder.text('Seattle')),
                                        values: { 0: { value: 25 } }
                                    }]
                                },
                                {
                                    level: 1,
                                    value: 'OR',
                                    identity: data.createDataViewScopeIdentity(SQExprBuilder.text('OR')),
                                    children: [{
                                        level: 2,
                                        value: 'Bellevue',
                                        identity: data.createDataViewScopeIdentity(SQExprBuilder.text('Bellevue')),
                                        values: { 0: { value: 10 } }
                                    }]
                                }
                            ]
                        },
                        {
                            level: 0,
                            value: 'MidWest',
                            identity: data.createDataViewScopeIdentity(SQExprBuilder.text('MidWest')),
                            children: [
                                {
                                    level: 1,
                                    value: 'OH',
                                    identity: data.createDataViewScopeIdentity(SQExprBuilder.text('OH')),
                                    children: [{
                                        level: 2,
                                        identity: data.createDataViewScopeIdentity(SQExprBuilder.text('')),
                                        values: { 0: { value: 5 } }
                                    }]
                                }
                            ]
                        },
                        {
                            level: 0,
                            value: 'NW',
                            identity: data.createDataViewScopeIdentity(SQExprBuilder.text('NW')),
                            children: [
                                {
                                    level: 1,
                                    value: 'WA',
                                    identity: data.createDataViewScopeIdentity(SQExprBuilder.text('WA')),
                                    children: [{
                                        level: 2,
                                        value: 'Redmond',
                                        identity: data.createDataViewScopeIdentity(SQExprBuilder.text('Redmond')),
                                        values: { 0: { value: 1 } }
                                    }]
                                }
                            ]
                        },
                    ]
                },
                levels: [{
                    sources: [column1, column2, column3]
                }]
            },
            columns: {
                root: {
                    children: [{ level: 0 }]
                },
                levels: [{
                    sources: [measure]
                }]
            },
            valueSources: [measure]
        };
    }

    describe("Sunburst", () => {

        it('Sunburst registered capabilities', () => {
            expect(powerbi.visuals.visualPluginFactory.create().getPlugin('sunburst').capabilities).toBe(powerbi.visuals.sunburstCapabilities);
        });

        it('Capabilities should include dataViewMappings', () => {
            expect(powerbi.visuals.sunburstCapabilities.dataViewMappings).toBeDefined();
        });

        it('Capabilities should include dataRoles', () => {
            expect(powerbi.visuals.sunburstCapabilities.dataRoles).toBeDefined();
        });

        it('Capabilities should include objects', () => {
            expect(powerbi.visuals.sunburstCapabilities.objects).toBeDefined();
        });

        it('FormatString property should match calculated', () => {
            expect(powerbi.data.DataViewObjectDescriptors.findFormatString(powerbi.visuals.sunburstCapabilities.objects)).toEqual(powerbi.visuals.sunburstProps.general.formatString);
        });

        it('Capabilities should only allow one measure', () => {
            let allowedProjections: QueryProjectionsByRole =
                {
                    'Group': new QueryProjectionCollection([{ queryRef: '0' }]),
                    'Values': new QueryProjectionCollection([{ queryRef: '2' }]),
                };
            let disallowedProjections1: QueryProjectionsByRole =
                {
                    'Group': new QueryProjectionCollection([{ queryRef: '0' }]),
                    'Values': new QueryProjectionCollection([
                        { queryRef: '2' },
                        { queryRef: '3' }
                    ])
                };

            var dataViewMappings = powerbi.visuals.sunburstCapabilities.dataViewMappings;
            expect(DataViewAnalysis.chooseDataViewMappings(allowedProjections, dataViewMappings, {}).supportedMappings).toEqual(dataViewMappings);
            expect(DataViewAnalysis.chooseDataViewMappings(disallowedProjections1, dataViewMappings, {}).supportedMappings).toBe(null);
        });
    });

    describe("Enumerate Objects", () => {
        let v: powerbi.IVisual, element: JQuery;

        beforeEach(() => {
            jasmine.clock().install();
            element = powerbitests.helpers.testDom('500', '500');
            v = powerbi.visuals.visualPluginFactory.create().getPlugin('sunburst').create();
            v.init({
                element: element,
                host: powerbitests.mocks.createVisualHostServices(),
                style: powerbi.visuals.visualStyles.create(),
                viewport: {
                    height: element.height(),
                    width: element.width()
                },
                animation: { transitionImmediate: true }
            });
        });

        afterEach(function () {
            jasmine.clock().uninstall();
        });

        it('Check basic enumeration', () => {

            let dataView: DataView = {
                matrix: createMatrixWith4Columns(),
                metadata: { columns: [column1, column2, column3, measure] }
            };

            let updateOptions: VisualUpdateOptions = {
                dataViews: [dataView],
                viewport: { height: 500, width: 500 }
            };

            v.update(updateOptions);

            jasmine.clock().tick(DefaultWaitForRender);
            
            let points = <VisualObjectInstanceEnumerationObject>v.enumerateObjectInstances({ objectName: 'dataPoint' });
            expect(points.instances.length).toBe(3);
            expect(points.instances[0].displayName).toEqual('East');
            expect(points.instances[0].properties['fill']).toBeDefined();
            expect(points.instances[1].displayName).toEqual('MidWest');
            expect(points.instances[1].properties['fill']).toBeDefined();
            expect(points.instances[2].displayName).toEqual('NW');
            expect(points.instances[2].properties['fill']).toBeDefined();                
        });
    });

    describe("Sunburst DOM validation", () => {
        let v: powerbi.IVisual, element: JQuery;

        let hostServices = powerbitests.mocks.createVisualHostServices();

        beforeEach(() => {
            element = powerbitests.helpers.testDom('500', '500');
            v = powerbi.visuals.visualPluginFactory.create().getPlugin('sunburst').create();
            v.init({
                element: element,
                host: hostServices,
                style: powerbi.visuals.visualStyles.create(),
                viewport: {
                    height: element.height(),
                    width: element.width()
                },
                animation: { transitionImmediate: true }
            });
        });

        it('sunburst slices dom validation', (done) => {

            let dataView: DataView = {
                matrix: createMatrixWith4Columns(),
                metadata: { columns: [column1, column2, column3, measure] }
            };

            let updateOptions: VisualUpdateOptions = {
                dataViews: [dataView],
                viewport: { height: 500, width: 500 }
            };

            v.update(updateOptions);

            setTimeout(() => {
                expect($('.sunburst path').length).toBe(15);
                done();
            }, DefaultWaitForRender);
        });

        it('sunburst invisible slices dom validation', (done) => {

            let dataView: DataView = {
                matrix: createMatrixWith3Columns(),
                metadata: { columns: [column1, column2, column3, measure] }
            };

            let updateOptions: VisualUpdateOptions = {
                dataViews: [dataView],
                viewport: { height: 500, width: 500 }
            };

            v.update(updateOptions);

            setTimeout(() => {
                expect($(".sunburst path[style*='opacity: 0']").length).toBe(4);
                done();
            }, DefaultWaitForRender);
        });

        it('sunburst text dom validation', (done) => {

            let dataView: DataView = {
                matrix: createMatrixWith4Columns(),
                metadata: { columns: [column1, column2, column3, measure] }
            };

            let updateOptions: VisualUpdateOptions = {
                dataViews: [dataView],
                viewport: { height: 500, width: 500 }
            };

            v.update(updateOptions);

            setTimeout(() => {
                expect($('.sunburst .label').length).toBe(14);
                done();
            }, DefaultWaitForRender);
        });

        it('sunburst slices onDataChanged dom validation', (done) => {
            let initialDataView: DataView = {
                matrix: createMatrixWith3Columns(),
                metadata: { columns: [column1, column2, column3, measure] }
            };

            let initialUpdateOptions: VisualUpdateOptions = {
                dataViews: [initialDataView],
                viewport: { height: 500, width: 500 }
            };

            v.update(initialUpdateOptions);

            let updatedDataView: DataView = {
                matrix: createMatrixWith4Columns(),
                metadata: { columns: [column1, column2, column3, measure] }
            };

            let updatedUpdateOptions: VisualUpdateOptions = {
                dataViews: [updatedDataView],
                viewport: { height: 500, width: 500 }
            };

            v.update(initialUpdateOptions);

            setTimeout(() => {
                expect($('.sunburst path').length).toBe(13);
                v.update(updatedUpdateOptions);
                setTimeout(() => {
                    expect($('.sunburst path').length).toBe(15);
                    done();
                }, DefaultWaitForRender);
            }, DefaultWaitForRender);
        });
    });
    
    describe("Sunburst converter validation", () => {       
        it('sunburst dataView single measure', () => {
            let metadata: DataViewMetadata = { columns: [column1, column2, column3, measure] };

            let dataView: DataView = {
                matrix: createMatrixWith2Columns(),
                metadata: metadata
            };            
            
            let colors = powerbi.visuals.visualStyles.create().colorPalette.dataColors;
            let root = Sunburst.converter(dataView, colors).root;

            let nodes = root.children;
            expect(root.total).toBe(50);
            expect(nodes.length).toBe(2);

            let node: SunburstSlice = <SunburstSlice>nodes[0];
            expect(node.name).toBe('East');
            expect(node.total).toBe(45);
            expect(node.identity.getKey()).toBe(new SelectionId(node.identity.getSelector(), false).getKey());
            expect(node.children).toBeDefined();
            expect(node.children.length).toBe(2);
            expect(node.children[0]).toBeDefined();
            expect(node.children[0].color).toBe(node.color);
            expect(node.children[0].children).toBeDefined();
            expect(node.children[0].children.length).toBe(1);
            expect(node.children[0].children[0].color).toBe(node.color);
            expect(node.children[1]).toBeDefined();
            expect(node.children[1].color).toBe(node.color);
            expect(node.children[1].children).toBeDefined();
            expect(node.children[1].children.length).toBe(1);
            expect(node.children[1].children[0].color).toBe(undefined);

            let shapeColors = nodes.map(n => (<SunburstSlice>n).color);
            expect(shapeColors).toEqual(ArrayExtensions.distinct(shapeColors));
        });

        it('sunburst dataView single measure with null values', () => {
            let metadata: DataViewMetadata = { columns: [column1, column2, column3, measure] };

            let dataView: DataView = {
                matrix: createMatrixWith4Columns(),
                metadata: metadata
            };

            let colors = powerbi.visuals.visualStyles.create().colorPalette.dataColors;
            let root = Sunburst.converter(dataView, colors).root;

            let nodes = root.children;
            expect(nodes.length).toBe(4);

            let node: SunburstSlice = <SunburstSlice>nodes[1];
            expect(node.name).toBeUndefined();
            expect(node.total).toBe(35);
            expect(node.children).toBeDefined();
            expect(node.children.length).toBe(2);

            let shapeColors = nodes.map(n => (<SunburstSlice>n).color);
            expect(shapeColors).toEqual(ArrayExtensions.distinct(shapeColors));
        });

        it('sunburst measure tooltip values test', () => {
            let metadata: DataViewMetadata = { columns: [column1, column2, column3, measure] };

            let dataView: DataView = {
                matrix: createMatrixWith4Columns(),
                metadata: metadata
            };

            let colors = powerbi.visuals.visualStyles.create().colorPalette.dataColors;
            let root = Sunburst.converter(dataView, colors).root;

            let node1: SunburstSlice = <SunburstSlice>root.children[0];
            let node2: SunburstSlice = <SunburstSlice>root.children[1];
            let node3: SunburstSlice = <SunburstSlice>root.children[2];
            let node4: SunburstSlice = <SunburstSlice>root.children[3];
            
            expect(node1.tooltipInfo).toEqual([{ displayName: 'East', value: '45' }]);
            expect(node1.children[0].tooltipInfo).toEqual(
                [{ displayName: 'NY', value: '35' },
                 { displayName: 'East', value: '45' }]
            );
            expect(node1.children[0].children[0].tooltipInfo).toEqual(
                [{ displayName: 'New York', value: '35' },
                 { displayName: 'NY', value: '35' },
                 { displayName: 'East', value: '45' }]
            );
            expect(node1.children[1].tooltipInfo).toEqual([
                { displayName: 'NM', value: '10' },
                { displayName: 'East', value: '45' }]
            );
            expect(node1.children[1].children[0].tooltipInfo).toEqual(
                [{ displayName: undefined, value: '10' },
                 { displayName: 'NM', value: '10' },
                 { displayName: 'East', value: '45' }]);

            expect(node2.tooltipInfo).toEqual([{ displayName: undefined, value: '35' }]);
            expect(node3.tooltipInfo).toEqual([{ displayName: 'MidWest', value: '5' }]);
            expect(node4.tooltipInfo).toEqual([{ displayName: 'NW', value: '1' }]);
        });

        it('sunburst data point color validation', () => {
            let dataPointColors = ["#000000", "#FD625E"];
            let objectDefinitions: powerbi.DataViewObjects[] = [
                { dataPoint: { fill: { solid: { color: dataPointColors[0] } } } },
                { dataPoint: { fill: { solid: { color: dataPointColors[1] } } } }
            ];

            let metadata: DataViewMetadata = { columns: [column1, column2, column3, measure] };
            let matrix: DataViewMatrix = createMatrixWith2Columns();
            matrix.rows.root.children[0].objects = objectDefinitions[0];
            matrix.rows.root.children[1].objects = objectDefinitions[1];

            let dataView: DataView = {
                matrix: matrix,
                metadata: metadata
            };            

            let colors = powerbi.visuals.visualStyles.create().colorPalette.dataColors;
            let root = Sunburst.converter(dataView, colors).root;

            let node1: SunburstSlice = <SunburstSlice>root.children[0];
            let node2: SunburstSlice = <SunburstSlice>root.children[1];
            
            helpers.assertColorsMatch(node1.color, dataPointColors[0]);
            helpers.assertColorsMatch(node2.color, dataPointColors[1]);
        });
    });

    describe("Sunburst labels", () => {
        let v: powerbi.IVisual, element: JQuery;

        let hostServices = powerbitests.mocks.createVisualHostServices();

        beforeEach(() => {
            element = powerbitests.helpers.testDom('500', '500');
            v = powerbi.visuals.visualPluginFactory.create().getPlugin('sunburst').create();
            v.init({
                element: element,
                host: hostServices,
                style: powerbi.visuals.visualStyles.create(),
                viewport: {
                    height: element.height(),
                    width: element.width()
                },
                animation: { transitionImmediate: true }
            });
        });

        it('category labels should be visible by default', (done) => {
            let dataView: DataView = {
                matrix: createMatrixWith3Columns(),
                metadata: { columns: [column1, measure] }
            };

            let updateOptions: VisualUpdateOptions = {
                dataViews: [dataView],
                viewport: { height: 500, width: 500 }
            };

            v.update(updateOptions);
        
            setTimeout(() => {
                expect($('.sunburst .label').length).toBe(13);
                done();
            }, DefaultWaitForRender);  
        });

        it('category labels should be hidden', (done) => {
            let dataView: DataView = {
                matrix: createMatrixWith2Columns(),
                metadata: { columns: [column1, measure] }
            };

            dataView.metadata.objects = {
                labels: { show: false },
                categoryLabels: { show: false }
            };

            let updateOptions: VisualUpdateOptions = {
                dataViews: [dataView],
                viewport: { height: 500, width: 500 }
            };

            v.update(updateOptions);

            setTimeout(() => {
                expect($('.sunburst .label').length).toBe(8);
                done();
            }, DefaultWaitForRender);
        });

        it("color of legend title", (done) => {
            let labelColor = "#002121";

            let dataView: DataView = {
                matrix: createMatrixWith4Columns(),
                metadata: { columns: [column1, column2, column3, measure] }
            };

            dataView.metadata.objects = {
                labels: { show: false },
                categoryLabels: { show: false },
                legend:
                {
                    titleText: 'my title text',
                    show: true,
                    showTitle: true,
                    labelColor: { solid: { color: labelColor } },
                }
            };

            let updateOptions: VisualUpdateOptions = {
                dataViews: [dataView],
                viewport: { height: 500, width: 500 }
            };

            v.update(updateOptions);

            let legend = element.find('.legend');
            let legendGroup = legend.find('#legendGroup');
            let legendTitle = legendGroup.find('.legendTitle');
            let legendText = legendGroup.find('.legendItem').find('.legendText');

            setTimeout(() => {
                helpers.assertColorsMatch(legendTitle.css('fill'), labelColor);
                helpers.assertColorsMatch(legendText.first().css('fill'), labelColor);
                done();
            }, DefaultWaitForRender);
        });

        it("default font size of legend", (done) => {
            let labelFontSize = powerbi.visuals.SVGLegend.DefaultFontSizeInPt;

            let dataView: DataView = {
                matrix: createMatrixWith4Columns(),
                metadata: { columns: [column1, column2, column3, measure] }
            };

            dataView.metadata.objects = {
                labels: { show: false },
                categoryLabels: { show: false },
                legend:
                {
                    titleText: 'my title text',
                    show: true,
                    showTitle: true,
                }
            };            

            let updateOptions: VisualUpdateOptions = {
                dataViews: [dataView],
                viewport: { height: 500, width: 500 }
            };

            v.update(updateOptions);

            let legend = element.find('.legend');
            let legendGroup = legend.find('#legendGroup');
            let legendTitle = legendGroup.find('.legendTitle');
            let legendText = legendGroup.find('.legendItem').find('.legendText');

            setTimeout(() => {
                helpers.assertFontSizeMatch(legendTitle.css('font-size'), labelFontSize);
                helpers.assertFontSizeMatch(legendText.css('font-size'), labelFontSize);

                done();
            }, DefaultWaitForRender);
        });
    });
}