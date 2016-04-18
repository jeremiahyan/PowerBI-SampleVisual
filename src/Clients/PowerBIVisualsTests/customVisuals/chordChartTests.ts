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
    import VisualClass = powerbi.visuals.samples.ChordChart;
    import helpers = powerbitests.helpers;
    import PixelConverter = jsCommon.PixelConverter;
	powerbitests.mocks.setLocale();
	
    describe("ChordChart", () => {
        describe('capabilities', () => {
            it("registered capabilities", () => expect(VisualClass.capabilities).toBeDefined());
        });

        describe("DOM tests", () => {
            let visualBuilder: ChordChartBuilder;
            let dataViews: powerbi.DataView[];

            beforeEach(() => {
                visualBuilder = new ChordChartBuilder();
                dataViews = [new powerbitests.customVisuals.sampleDataViews.ChortChartData().getDataView()];
            });

            it("svg element created", () => expect(visualBuilder.mainElement[0]).toBeInDOM());

            it("update", (done) => {
                visualBuilder.update(dataViews);
                setTimeout(() => {
                    expect(visualBuilder.mainElement.children("g").children("g.chords").children("path").length)
                        .toBe(dataViews[0].categorical.categories[0].values.length);
                    expect(visualBuilder.mainElement.children("g").children("g.ticks").children("g.slice-ticks").length)
                        .toBe(dataViews[0].categorical.categories[0].values.length + 1);
                    expect(visualBuilder.mainElement.children("g").children("g.slices").children("path.slice").length)
                        .toBe(dataViews[0].categorical.categories[0].values.length + 1);
                    expect(visualBuilder.element.find('.chordChart').attr('height')).toBe('200');
                    expect(visualBuilder.element.find('.chordChart').attr('width')).toBe('300');
                    done();
                }, powerbitests.DefaultWaitForRender);
            });

            it("update axis on", (done) => {
                let clonedDataViews = _.cloneDeep(dataViews);
                let axis: powerbi.DataViewObjects = { axis: { show: true } };
                clonedDataViews[0].metadata.objects = axis;
                visualBuilder.update(clonedDataViews);
                setTimeout(() => {
                    expect(visualBuilder.element.find('.ticks .slice-ticks').length).toBeGreaterThan(0);
                    done();
                }, powerbitests.DefaultWaitForRender);
            });

            it("update axis off", (done) => {
                let clonedDataViews = _.cloneDeep(dataViews);
                let axis: powerbi.DataViewObjects = { axis: { show: false } };
                clonedDataViews[0].metadata.objects = axis;
                visualBuilder.update(clonedDataViews);
                setTimeout(() => {
                    expect(visualBuilder.element.find('.ticks .slice-ticks').length).toBe(0);
                    done();
                }, powerbitests.DefaultWaitForRender);
            });

            it("update labels on", (done) => {
                let clonedDataViews = _.cloneDeep(dataViews);
                let labels: powerbi.DataViewObjects = { labels: { show: true, color: { solid: { color: '#222222' } }, fontSize: 22 } };
                clonedDataViews[0].metadata.objects = labels;
                visualBuilder.update(clonedDataViews);
                setTimeout(() => {
                    expect(visualBuilder.element.find('.labels .data-labels').length).toBeGreaterThan(0);
                    let label = visualBuilder.element.find('.labels .data-labels').first();
                    helpers.assertColorsMatch(label.css('fill'), "#222222");
                    expect(Math.round(parseInt(label.css('font-size'), 10))).toBe(Math.round(parseInt(PixelConverter.fromPoint(22), 10)));
                    done();
                }, powerbitests.DefaultWaitForRender);
            });

            it("update labels off", (done) => {
                let clonedDataViews = _.cloneDeep(dataViews);
                let labels: powerbi.DataViewObjects = { labels: { show: false } };
                clonedDataViews[0].metadata.objects = labels;
                visualBuilder.update(clonedDataViews);
                setTimeout(() => {
                    expect(visualBuilder.element.find('.labels .data-labels').length).toBe(0);
                    done();
                }, powerbitests.DefaultWaitForRender);
            });
        });

        describe('enumerateObjectInstances', () => {
            let visualBuilder: ChordChartBuilder;
            let dataViews: powerbi.DataView[];

            beforeEach(() => {
                visualBuilder = new ChordChartBuilder();
                dataViews = [new powerbitests.customVisuals.sampleDataViews.ChortChartData().getDataView()];
            });

            it('enumerateObjectInstances axis', (done) => {
                let clonedDataViews = _.cloneDeep(dataViews);
                let axis: powerbi.DataViewObjects = { axis: { show: true } };
                clonedDataViews[0].metadata.objects = axis;
                visualBuilder.update(clonedDataViews);
                let result = visualBuilder.enumerateObjectInstances({ objectName: 'axis' });
                setTimeout(() => {
                    expect(result[0]).toBeDefined();
                    expect(result[0].objectName).toBe('axis');
                    expect(result[0].displayName).toBe('Axis');
                    expect(result[0].properties['show']).toBe(true);
                    done();
                }, DefaultWaitForRender);
            });

            it('enumerateObjectInstances labels', (done) => {
                let clonedDataViews = _.cloneDeep(dataViews);
                let labels: powerbi.DataViewObjects = { labels: { show: true, fontSize: '20px', color: { solid: { color: '#222222' } } } };
                clonedDataViews[0].metadata.objects = labels;
                visualBuilder.update(clonedDataViews);
                let result = visualBuilder.enumerateObjectInstances({ objectName: 'labels' });
                setTimeout(() => {
                    expect(result[0]).toBeDefined();
                    expect(result[0].objectName).toBe('labels');
                    expect(result[0].displayName).toBe('Labels');
                    expect(result[0].properties['show']).toBe(true);
                    expect(result[0].properties['color']).toBe('#222222');
                    expect(result[0].properties['fontSize']).toBe('20px');
                    done();
                }, DefaultWaitForRender);
            });
        });
    });

    class ChordChartBuilder extends VisualBuilderBase<VisualClass> {
        constructor(height: number = 200, width: number = 300, isMinervaVisualPlugin: boolean = false) {
            super(height, width, isMinervaVisualPlugin);
            this.build();
            this.init();
        }
        
        public get mainElement() {
            return this.element.children("svg.chordChart");
        }

        private build(): void {
            this.visual = new VisualClass();
        }

        public enumerateObjectInstances(options: powerbi.EnumerateVisualObjectInstancesOptions): powerbi.VisualObjectInstance[] {
            return this.visual.enumerateObjectInstances(options);
        }
    }
}
