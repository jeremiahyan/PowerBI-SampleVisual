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
    import VisualClass = powerbi.visuals.samples.RadarChart;
    import ColorAssert = powerbitests.helpers.assertColorsMatch;
    import PixelConverter = jsCommon.PixelConverter;

	powerbitests.mocks.setLocale();
	
    describe("RadarChart", () => {

            let visualBuilder: RadarChartBuilder;
            let dataViews: powerbi.DataView[];

            beforeEach(() => {
                visualBuilder = new RadarChartBuilder();
                dataViews = [new powerbitests.customVisuals.sampleDataViews.SalesByDayOfWeekData().getDataView()];
            });

        describe('Capabilities', () => {
            it("registered capabilities", () => expect(VisualClass.capabilities).toBeDefined());
        });

        describe("DOM tests", () => {

            it("svg element created", () => expect(visualBuilder.mainElement[0]).toBeInDOM());

            it("legend element created", () => {
                expect($(visualBuilder.mainElement[1]).attr('class')).toBe('legend');
            });

            it("update", (done) => {                
                visualBuilder.update(dataViews);
                setTimeout(() => {
                    expect(visualBuilder.mainElement.find("g.axis").children("text.axisLabel").length)
                        .toBe(dataViews[0].categorical.categories[0].values.length);
                    expect(visualBuilder.mainElement.find("g.chartNode").first().children("circle.chartDot").length)
                        .toBe(dataViews[0].categorical.categories[0].values.length);
                    done();
                }, DefaultWaitForRender);
            });

            it("update with empty data point", (done) => {
                dataViews[0].categorical.values[0].values[2] = null;
                visualBuilder.update(dataViews);
                setTimeout(() => {
                    expect(visualBuilder.mainElement.find("g.axis").children("text.axisLabel").length)
                        .toBe(dataViews[0].categorical.categories[0].values.length);
                    expect(visualBuilder.mainElement.find("g.chartNode").first().children("circle.chartDot").length)
                        .toBe(dataViews[0].categorical.categories[0].values.length - 1);
                    done();
                }, DefaultWaitForRender);
            });
        });

        describe("Drawing tests", () => {

            it("data points highlights", (done) => {
                visualBuilder.update(dataViews);
                let firstPoint = visualBuilder.mainElement.find("circle.chartDot").first();
                let secondPoint = visualBuilder.mainElement.find("circle.chartDot").last();

                setTimeout(() => {
                    expect(firstPoint.css("opacity")).toBe("1");
                    expect(secondPoint.css("opacity")).toBe("1");

                    firstPoint.d3Click(parseInt(firstPoint.attr("cx"), 10), parseInt(firstPoint.attr("cy"), 10));
                    expect(firstPoint.css("opacity")).toBe("1");

                    // The value is approximate because of the chutzpah test. In the browser, the test passes with the specific value (0.4).
                    expect(secondPoint.css("opacity")).toBe("0.4000000059604645");

                    done();
                }, DefaultWaitForRender);
            });

            it("legend highlights", (done) => {
                RadarChartHelper.changeDataColor(dataViews, "#123123");
                visualBuilder.update(dataViews);

                setTimeout(() => {
                    let firstLegendItem = visualBuilder.mainElement.find("circle.legendIcon").first();
                    let secondLegendItem = visualBuilder.mainElement.find("circle.legendIcon").last();
                    let notSelectedColor = "#a6a6a6";
                    let firstItemColorBeforeSelection = firstLegendItem.css("fill");
                    let secondItemColorBeforeSelection = secondLegendItem.css("fill");
                    ColorAssert(firstItemColorBeforeSelection, "#123123");

                    secondLegendItem.d3Click(parseInt(secondLegendItem.attr("cx"), 10), parseInt(secondLegendItem.attr("cy"), 10));
                    ColorAssert(firstLegendItem.css("fill"), notSelectedColor);
                    ColorAssert(secondLegendItem.css("fill"), secondItemColorBeforeSelection);

                    done();
                }, DefaultWaitForRender);
            });

            it("interactivity legend highlights", (done) => {
                visualBuilder.update(dataViews);
                let firstPoint = visualBuilder.mainElement.find("circle.chartDot").first();
                let secondPoint = visualBuilder.mainElement.find("circle.chartDot").last();
                let firstLegendItem = visualBuilder.mainElement.find("circle.legendIcon").first();

                setTimeout(() => {
                    expect(firstPoint.css("opacity")).toBe("1");
                    expect(secondPoint.css("opacity")).toBe("1");

                    firstLegendItem.d3Click(parseInt(firstLegendItem.attr("cx"), 10), parseInt(firstLegendItem.attr("cy"), 10));
                    expect(firstPoint.css("opacity")).toBe("1");

                    // The value is approximate because of the chutzpah test. In the browser, the test passes with the specific value (0.4).
                    expect(secondPoint.css("opacity")).toBe("0.4000000059604645");

                    done();
                }, DefaultWaitForRender);
            });
        });

        describe('Property pane changes', () => {
            describe('Legend', () => {

                it("show legend on", (done) => {
                    dataViews[0].metadata.objects =
                    {
                        legend: {
                            show: true
                        }
                    };
                    visualBuilder.update(dataViews);
                    setTimeout(() => {
                        expect(visualBuilder.mainElement.find("g#legendGroup").children.length).toBe(dataViews[0].categorical.values.length);
                        done();
                    }, DefaultWaitForRender);
                });

                it("show legend off", (done) => {
                    dataViews[0].metadata.objects =
                    {
                        legend: {
                            show: false
                        }
                    };
                    visualBuilder.update(dataViews);
                    setTimeout(() => {
                        expect(visualBuilder.mainElement.find("g#legendGroup")).toBeEmpty();
                        done();
                    }, DefaultWaitForRender);
                });
            });

            describe('Data Colors', () => {

                it("change data color", (done) => {

                    // Init by one color
                    RadarChartHelper.changeDataColor(dataViews, "#123123");
                    visualBuilder.update(dataViews);

                    setTimeout(() => {
                        let polygon = visualBuilder.mainElement.find('.chartPolygon').first();
                        ColorAssert(polygon.css("fill"), "#123123");

                        // Change data color
                        RadarChartHelper.changeDataColor(dataViews, "#ab1234");
                        visualBuilder.update(dataViews);
                        let polygonAfterUpdate = visualBuilder.mainElement.find('.chartPolygon').first();
                        ColorAssert(polygonAfterUpdate.css("fill"), "#ab1234");
                        done();
                    }, DefaultWaitForRender);
                });
            });

            describe("Data Labels", () => {

                it("nodes labels on", done => {
                    dataViews[0].metadata.objects = {
                        labels: {
                            show: true
                        }
                    };

                    visualBuilder.update(dataViews);

                    setTimeout(() => {
                        expect(visualBuilder.mainElement.find("g.labels").length).toBe(1);
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
                        expect(visualBuilder.mainElement.find("g.labels").length).toBe(0);
                        done();
                    }, DefaultWaitForRender);
                });

                it("nodes labels change color", done => {
                    RadarChartHelper.changeDataLabelColor(dataViews, "#123123");
                    visualBuilder.update(dataViews);

                    setTimeout(() => {
                        let dataLabel = visualBuilder.mainElement.find('.data-labels').first();
                        ColorAssert(dataLabel.css("fill"), "#123123");

                        RadarChartHelper.changeDataLabelColor(dataViews, "#324435");
                        visualBuilder.update(dataViews);

                        let dataLabelAfterUpdate = visualBuilder.mainElement.find('.data-labels').first();
                        setTimeout(() => {
                            ColorAssert(dataLabelAfterUpdate.css("fill"), "#324435");
                            done();
                        }, DefaultWaitForRender);
                    }, DefaultWaitForRender);
                });

                it("nodes labels change font size", done => {
                    dataViews[0].metadata.objects = {
                        labels: {
                            show: true,
                            fontSize: 16
                        }
                    };

                    visualBuilder.update(dataViews);

                    setTimeout(() => {
                        let label = visualBuilder.mainElement.find('.data-labels').first();
                        expect(Math.round(parseInt(label.css('font-size'), 10))).toBe(Math.round(parseInt(PixelConverter.fromPoint(16), 10)));
                        done();
                    }, DefaultWaitForRender);
                });

                it("nodes labels change percision - decimal places", done => {
                    let decimalPlaces = 4;

                    dataViews[0].metadata.objects = {
                        labels: {
                            show: true,
                            labelPrecision: decimalPlaces,
                            labelDisplayUnits: 1
                        }
                    };

                    visualBuilder.update(dataViews);

                    setTimeout(() => {
                        let labelText = visualBuilder.mainElement.find('.data-labels').first().text();
                        let percisionValues = labelText.split('.');
                        expect(percisionValues[1].length).toBe(decimalPlaces);
                        done();
                    }, DefaultWaitForRender);
                });

                it("nodes labels change display unit", done => {
                   
                    dataViews[0].metadata.objects = {
                        labels: {
                            show: true,
                            displayUnits: 2
                        }
                    };

                    visualBuilder.update(dataViews);

                    setTimeout(() => {
                        let labelText = visualBuilder.mainElement.find('.data-labels').first().text();
                        let lastChart = labelText.charAt(labelText.length-1);
                        expect(lastChart).toBe("K");
                        done();
                    }, DefaultWaitForRender);
                });
            });
        });
    });

    class RadarChartBuilder extends VisualBuilderBase<VisualClass> {
        constructor(height: number = 200, width: number = 300, isMinervaVisualPlugin: boolean = false) {
            super(height, width, isMinervaVisualPlugin);
            this.build();
            this.init();
        }

        public get mainElement() {
            return this.element.children("svg");
        }

        private build(): void {
            this.visual = new VisualClass();
        }
    }

    export module RadarChartHelper {
        export function changeDataColor(dataViews: powerbi.DataView[], colorValue: string): void {
            dataViews[0].categorical.values[0].source.objects = {
                dataPoint: {
                    fill: { solid: { color: colorValue } }
                }
            };
        }

        export function changeDataLabelColor(dataViews: powerbi.DataView[], colorValue: string): void {
            dataViews[0].metadata.objects = {
                labels: {
                    show: true,
                    color: { solid: { color: colorValue } }
                }
            };
        }
    }
}