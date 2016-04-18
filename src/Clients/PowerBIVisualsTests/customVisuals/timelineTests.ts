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
	import GranularityType = powerbi.visuals.samples.GranularityType;
    import VisualClass = powerbi.visuals.samples.Timeline;
    powerbitests.mocks.setLocale();
    import colorAssert = powerbitests.helpers.assertColorsMatch;
    import TimeLineData = powerbi.visuals.samples.TimelineData;

    describe("Timeline", () => {
        describe('capabilities', () => {
            it("registered capabilities", () => expect(VisualClass.capabilities).toBeDefined());
        });

        describe("DOM tests", () => {
            let visualBuilder: TimelineBuilder;
            let dataViews: powerbi.DataView[];

            beforeEach(() => {
                visualBuilder = new TimelineBuilder();
                dataViews = [new customVisuals.sampleDataViews.TimelineData().getDataView()];
            });

            it("svg element created", () => expect(visualBuilder.mainElement[0]).toBeInDOM());

            it("basic update", (done) => {
                visualBuilder.update(dataViews);
                visualBuilder.currentPeriod = GranularityType.day;
                setTimeout(() => {
                    let countOfDays = visualBuilder.mainElement.children("g.mainArea").children(".cellsArea").children(".cellRect").length;
					let countOfTextItems = visualBuilder.mainElement.children("g.mainArea").children("g").children(".label").children().length;

                    expect(countOfDays).toBe(dataViews[0].categorical.categories[0].values.length);
                    expect(countOfTextItems).toBe(15);

                    done();
                }, DefaultWaitForRender);
            });

            it("change color for header", (done) => {
                visualBuilder.update(dataViews);
                visualBuilder.currentPeriod = GranularityType.day;

                setTimeout(() => {
                    let item: powerbi.DataViewObjects = {
                        rangeHeader: {
                            fontColor: {
                                solid: {
                                    color: "#00B8AA"
                                }
                            }
                        }
                    };

                    colorAssert(visualBuilder.mainElement.children('g.rangeTextArea').children('text').css('fill'), '#777777');

                    dataViews[0].metadata.objects = item;
                    visualBuilder.update(dataViews);

                    setTimeout(() => {
                        colorAssert(visualBuilder.mainElement.children('g.rangeTextArea').children('text').css('fill'), '#00B8AA');
                        done();
                    }, DefaultWaitForRender);
                }, DefaultWaitForRender);
            });

            it("change color for selected cell color", (done) => {
                dataViews[0].metadata.objects = {};
                visualBuilder.update(dataViews);
                visualBuilder.currentPeriod = GranularityType.day;

                setTimeout(() => {
                    let item: powerbi.DataViewObjects = {
                        cells: {
                            fillSelected: {
                                solid: {
                                    color: "#00B8AA"
                                }
                            }
                        }
                    };

                    colorAssert(visualBuilder.mainElement.children("g.mainArea").children(".cellsArea").children(".cellRect").css('fill'), '#ADD8E6');

                    dataViews[0].metadata.objects = item;
                    visualBuilder.update(dataViews);

                    setTimeout(() => {
                        colorAssert(visualBuilder.mainElement.children("g.mainArea").children(".cellsArea").children(".cellRect").css('fill'), '#00B8AA');
                        done();
                    }, DefaultWaitForRender);
                }, DefaultWaitForRender);
            });

            it("change color for notselected cell color", (done) => {
                dataViews[0].metadata.objects = {};
                visualBuilder.update(dataViews);
                visualBuilder.currentPeriod = GranularityType.day;

                setTimeout(() => {
                    let item: powerbi.DataViewObjects = {
                        cells: {
                            fillUnselected: {
                                solid: {
                                    color: "#00B8AA"
                                }
                            }
                        }
                    };

                    colorAssert(visualBuilder.mainElement.children("g.mainArea").children(".cellsArea").children(".cellRect").css('fill'), '#ADD8E6');

                    let rows = [
                        ['02.01.2014'], ];
                    let value = rows.map(function (value) {
                        let arr = value[0].split('.');
                        return (new Date(Number(arr[2]), Number(arr[1]) - 1, Number(arr[0]))); 
                    });
                    dataViews[0].categorical.categories[0].values = value;
                    dataViews[0].metadata.objects = item;
                    visualBuilder.update(dataViews);

                    setTimeout(() => {
                        colorAssert(visualBuilder.mainElement.children("g.mainArea").children(".cellsArea").children(".cellRect").css('fill'), '#00B8AA');
                        done();
                    }, DefaultWaitForRender);
                }, DefaultWaitForRender);
            });
        });
    });

    class TimelineBuilder extends VisualBuilderBase<VisualClass> {
        constructor(height: number = 400, width: number = 600, isMinervaVisualPlugin: boolean = false) {
            super(height, width, isMinervaVisualPlugin);
            this.build();
            this.init();
        }

        public get mainElement() {
            return this.element
                .children("div")
                .children("svg.Timeline");
        }

        public set currentPeriod(period: number) {
            this.visual.selectPeriod(period);
        }

        public click(data: TimeLineData): void {
            this.visual.setSelection(data);
        }

        private build(): void {
            this.visual = new VisualClass();
        }
    }
}