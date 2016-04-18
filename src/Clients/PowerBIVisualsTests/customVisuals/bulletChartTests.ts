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

module powerbitests.customVisuals {
    import VisualClass = powerbi.visuals.samples.BulletChart;
    import helpers = powerbitests.helpers;
    powerbitests.mocks.setLocale();

    describe("BulletChart", () => {
        describe('capabilities', () => {
            it("registered capabilities", () => expect(VisualClass.capabilities).toBeDefined());
        });

        describe("DOM tests", () => {
            let visualBuilder: BulletChartBuilder;
            let dataViews: powerbi.DataView[];

            beforeEach(() => {
                visualBuilder = new BulletChartBuilder();
                dataViews = [new powerbitests.customVisuals.sampleDataViews.BulletChartData().getDataView()];
            });

            it("svg element created", () => expect(visualBuilder.mainElement[0]).toBeInDOM());
            it("update", (done) => {
                visualBuilder.update(dataViews);
                setTimeout(() => {
                    expect(visualBuilder.mainElement.children("g").first().children("text").length)
                        .toBe(dataViews[0].categorical.categories[0].values.length);
                    expect(visualBuilder.element.find('.bulletChart').css('height')).toBe('200px');
                    expect(visualBuilder.element.find('.bulletChart').css('width')).toBe('300px');
                    done();
                }, DefaultWaitForRender);
            });

            it("update vertical", (done) => {
                let clonedDataViews = _.cloneDeep(dataViews);
                let orientation: powerbi.DataViewObjects = { orientation: { vertical: true } };
                clonedDataViews[0].metadata.objects = orientation;
                visualBuilder.update(clonedDataViews);
                setTimeout(() => {
                    expect(visualBuilder.element.find('.bullet-scroll-region').css('height')).toBe('420px');
                    expect(visualBuilder.element.find('.bullet-scroll-region').css('width')).toBe('287px');

                    done();
                }, DefaultWaitForRender);
            });

            it("update non vertical", (done) => {
                let clonedDataViews = _.cloneDeep(dataViews);
                let orientation: powerbi.DataViewObjects = { orientation: { vertical: false } };
                clonedDataViews[0].metadata.objects = orientation;
                visualBuilder.update(clonedDataViews);
                setTimeout(() => {
                    expect(visualBuilder.element.find('.bullet-scroll-region').css('height')).toBe('420px');
                    expect(visualBuilder.element.find('.bullet-scroll-region').css('width')).toBe('287px');

                    done();
                }, DefaultWaitForRender);
            });

            it("update axis", (done) => {
                let clonedDataViews = _.cloneDeep(dataViews);
                let axis: powerbi.DataViewObjects = { axis: { axis: true, axisColor: { solid: { color: '#222222' } } } };
                clonedDataViews[0].metadata.objects = axis;
                visualBuilder.update(clonedDataViews);
                setTimeout(() => {
                    expect(visualBuilder.element.find('.axis')).toBeDefined();
                    helpers.assertColorsMatch(visualBuilder.element.find('.axis').css('fill'), "#222222");
                    helpers.assertColorsMatch(visualBuilder.element.find('.axis').find('line').css('stroke'), "#222222");
                    done();
                }, DefaultWaitForRender);
            });

            it("update without axis", (done) => {
                let clonedDataViews = _.cloneDeep(dataViews);
                let axis: powerbi.DataViewObjects = { axis: { axis: false } };
                clonedDataViews[0].metadata.objects = axis;
                visualBuilder.update(clonedDataViews);
                setTimeout(() => {
                    expect(visualBuilder.element.find('.axis').length).toBe(0);
                    done();
                }, DefaultWaitForRender);
            });
        });

        describe('enumerateObjectInstances', () => {
            let visualBuilder: BulletChartBuilder;
            let dataViews: powerbi.DataView[];

            beforeEach(() => {
                visualBuilder = new BulletChartBuilder();
                dataViews = [new powerbitests.customVisuals.sampleDataViews.BulletChartData().getDataView()];
            });

            it('enumerateObjectInstances no model', (done) => {
                let result = visualBuilder.enumerateObjectInstances({ objectName: 'labels' });
                setTimeout(() => {
                    expect(result).toBeUndefined();
                    done();
                }, DefaultWaitForRender);
            });

            it('enumerateObjectInstances labels', (done) => {
                visualBuilder.update(dataViews);
                let result = visualBuilder.enumerateObjectInstances({ objectName: 'labels' });
                setTimeout(() => {
                    expect(result[0]).toBeDefined();
                    expect(result[0].objectName).toBe('labels');
                    expect(result[0].properties['labelColor']).toBe('Black');
                    expect(result[0].properties['fontSize']).toBe(11);
                    done();
                }, DefaultWaitForRender);
            });

            it('enumerateObjectInstances values', (done) => {
                visualBuilder.update(dataViews);
                let result = visualBuilder.enumerateObjectInstances({ objectName: 'values' });
                setTimeout(() => {
                    expect(result[0]).toBeDefined();
                    expect(result[0].objectName).toBe('values');
                    expect(result[0].properties['targetValue']).toBe(0);
                    expect(result[0].properties['targetValue2']).toBe(0);
                    expect(result[0].properties['minimumPercent']).toBe(0);
                    expect(result[0].properties['needsImprovementPercent']).toBe(25);
                    expect(result[0].properties['satisfactoryPercent']).toBe(50);
                    expect(result[0].properties['goodPercent']).toBe(100);
                    expect(result[0].properties['veryGoodPercent']).toBe(125);
                    expect(result[0].properties['maximumPercent']).toBe(200);
                    done();
                }, DefaultWaitForRender);
            });

            it('enumerateObjectInstances orientation', (done) => {
                visualBuilder.update(dataViews);
                let result = visualBuilder.enumerateObjectInstances({ objectName: 'orientation' });
                setTimeout(() => {
                    expect(result[0]).toBeDefined();
                    expect(result[0].objectName).toBe('orientation');
                    expect(result[0].properties['orientation']).toBe('Horizontal Left');
                    done();
                }, DefaultWaitForRender);
            });

            it('enumerateObjectInstances axis', (done) => {
                visualBuilder.update(dataViews);
                let result = visualBuilder.enumerateObjectInstances({ objectName: 'axis' });
                setTimeout(() => {
                    expect(result[0]).toBeDefined();
                    expect(result[0].objectName).toBe('axis');
                    expect(result[0].properties['axisColor']).toBe('Grey');
                    expect(result[0].properties['measureUnits']).toBe('');
                    expect(result[0].properties['unitsColor']).toBe('Grey');
                    done();
                }, DefaultWaitForRender);
            });
        });
    });

    class BulletChartBuilder extends VisualBuilderBase<VisualClass> {
        constructor(height: number = 200, width: number = 300, isMinervaVisualPlugin: boolean = false) {
            super(height, width, isMinervaVisualPlugin);
            this.build();
            this.init();
        }

        public get mainElement() {
            return this.element.children("div").children("svg");
        }

        private build(): void {
            this.visual = new VisualClass();
        }

        public enumerateObjectInstances(options: powerbi.EnumerateVisualObjectInstancesOptions): powerbi.VisualObjectInstance[] {
            return this.visual.enumerateObjectInstances(options);
        }
    }
}
