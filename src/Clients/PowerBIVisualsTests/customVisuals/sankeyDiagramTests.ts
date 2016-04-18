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
    import VisualClass = powerbi.visuals.samples.SankeyDiagram;
    import colorAssert = powerbitests.helpers.assertColorsMatch;

    describe("SankeyDiagram", () => {
        describe('capabilities', () => {
            it("registered capabilities", () => expect(VisualClass.capabilities).toBeDefined());
        });

        describe("DOM tests", () => {
            let visualBuilder: SankeyDiagramBuilder;
            let dataViews: powerbi.DataView[];

            beforeEach(() => {
                visualBuilder = new SankeyDiagramBuilder();
                dataViews = [new powerbitests.customVisuals.sampleDataViews.ValuesByCountriesData().getDataView()];
            });

            it("main element created", () => expect(visualBuilder.mainElement[0]).toBeInDOM());
            it("update", (done) => {
                visualBuilder.update(dataViews);
                setTimeout(() => {

                    expect(visualBuilder.linksElement).toBeInDOM();
                    expect(visualBuilder.linksElement.children("path.link").length)
                        .toBe(dataViews[0].categorical.categories[0].values.length);

                    let allCountries: string[] = dataViews[0].categorical.categories[0].values.concat(dataViews[0].categorical.categories[1].values);
                    let uniqueCountries = allCountries.sort().filter((value, index, array) => !index || value !== array[index - 1]);

                    expect(visualBuilder.nodesElement).toBeInDOM();
                    expect(visualBuilder.nodesElement.children("g.node").length)
                        .toEqual(uniqueCountries.length);

                    done();
                }, DefaultWaitForRender);
            });

            it("nodes labels on", done => {
                dataViews[0].metadata.objects = {
                    labels: {
                        show: true
                    }
                };

                visualBuilder.update(dataViews);

                setTimeout(() => {
                    expect(visualBuilder.nodesElement.find('text').first().css('display')).toBe('block');
                    done();
                }, DefaultWaitForRender);
            });

            it("nodes labels off", done => {
                dataViews[0].metadata.objects = {
                    labels: {
                        show: false
                    }
                };

                visualBuilder.update(dataViews);

                setTimeout(() => {
                    expect(visualBuilder.nodesElement.find('text').first().css('display')).toBe('none');
                    done();
                }, DefaultWaitForRender);
            });

            it("nodes labels change color", done => {
                dataViews[0].metadata.objects = {
                    labels: {
                        fill: { solid: { color: "#123123" } }
                    }
                };

                visualBuilder.update(dataViews);

                setTimeout(() => {
                    colorAssert(visualBuilder.nodesElement.find('text').first().css('fill'), "#123123");
                    done();
                }, DefaultWaitForRender);
            });

            it("link change color", done => {
                let objects = dataViews[0].categorical.categories[0].objects = [];
                objects.push({
                    links: {
                        fill: { solid: { color: "#E0F600" } }
                    }
                });

                visualBuilder.update(dataViews);

                setTimeout(() => {
                    colorAssert(visualBuilder.linksElement.find('.link').first().css('stroke'), "#E0F600");
                    done();
                }, DefaultWaitForRender);
            });
        });
    });

    class SankeyDiagramBuilder extends VisualBuilderBase<VisualClass> {
        constructor(height: number = 200, width: number = 300, isMinervaVisualPlugin: boolean = false) {
            super(height, width, isMinervaVisualPlugin);
            this.build();
            this.init();
        }

        public get mainElement() {
            return this.element.children("svg.sankeyDiagram");
        }

        public get nodesElement() {
            return this.mainElement.children("g").children("g.nodes");
        }

        public get linksElement() {
            return this.mainElement.children("g").children("g.links");
        }

        private build(): void {
            this.visual = new VisualClass();
        }
    }
}
