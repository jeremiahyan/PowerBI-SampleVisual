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
    import VisualClass = powerbi.visuals.samples.StreamGraph;
    import colorAssert = powerbitests.helpers.assertColorsMatch;

    powerbitests.mocks.setLocale();

    describe("StreamGraph", () => {
        describe('capabilities', () => {
            let streamGraphCapabilities = VisualClass.capabilities;

            it("registered capabilities", () => expect(streamGraphCapabilities).toBeDefined());

            it("Capabilities should include dataRoles", () => expect(streamGraphCapabilities.dataRoles).toBeDefined());

            it("Capabilities should include dataViewMappings", () => expect(streamGraphCapabilities.dataViewMappings).toBeDefined());

            it("Capabilities should include objects", () => expect(streamGraphCapabilities.objects).toBeDefined());
        });

        describe("DOM tests", () => {
            let visualBuilder: StreamGraphBuilder;
            let dataViews: powerbi.DataView[];

            beforeEach(() => {
                visualBuilder = new StreamGraphBuilder();
                dataViews = [new powerbitests.customVisuals.sampleDataViews.ProductSalesByDateData().getDataView()];
            });

            it("x axis on", done => {
                dataViews[0].metadata.objects = {
                    categoryAxis: {
                        show: true
                    }
                };
                let xAxis = $(".streamGraph .axisGraphicsContext .x.axis");

                visualBuilder.update(dataViews);

                setTimeout(() => {
                    expect(xAxis).toBeInDOM();
                    expect(xAxis.children("g.tick")).toBeInDOM();
                    expect(xAxis.children('g').length).toBeGreaterThan(0);
                    done();
                }, DefaultWaitForRender);
            });

            it("x axis off", done => {
                dataViews[0].metadata.objects = {
                    categoryAxis: {
                        show: false
                    }
                };
                let xAxis = $(".streamGraph .axisGraphicsContext .x.axis").children('g');

                visualBuilder.update(dataViews);

                setTimeout(() => {
                    expect(xAxis.length).toBe(0);
                    done();
                }, DefaultWaitForRender);
            });

            it("y axis on", done => {
                dataViews[0].metadata.objects = {
                    valueAxis: {
                        show: true
                    }
                };
                let yAxis = $(".streamGraph .axisGraphicsContext .y.axis");

                visualBuilder.update(dataViews);

                setTimeout(() => {
                    expect(yAxis).toBeInDOM();
                    expect(yAxis.children("g.tick")).toBeInDOM();
                    expect(yAxis.children('g').length).toBeGreaterThan(0);
                    done();
                }, DefaultWaitForRender);
            });

            it("y axis off", done => {
                dataViews[0].metadata.objects = {
                    valueAxis: {
                        show: false
                    }
                };
                let yAxis = $(".streamGraph .axisGraphicsContext .y.axis").children('g');

                visualBuilder.update(dataViews);

                setTimeout(() => {
                    expect(yAxis.length).toBe(0);
                    done();
                }, DefaultWaitForRender);
            });

            it("x axis title on", done => {
                dataViews[0].metadata.objects = {
                    categoryAxis: {
                        show: true,
                        showAxisTitle: true
                    }
                };
                let xAxis = $(".streamGraph .axisGraphicsContext");

                visualBuilder.update(dataViews);

                setTimeout(() => {
                    expect(xAxis.children("text")).toBeInDOM();
                    done();
                }, DefaultWaitForRender);
            });

            it("x axis title off", done => {
                dataViews[0].metadata.objects = {
                    categoryAxis: {
                        show: true,
                        showAxisTitle: false
                    }
                };
                let xAxis = $(".streamGraph .axisGraphicsContext");

                visualBuilder.update(dataViews);

                setTimeout(() => {
                    expect(xAxis.children("text").length).toBe(0);
                    done();
                }, DefaultWaitForRender);
            });

            it("y axis title on", done => {
                dataViews[0].metadata.objects = {
                    valueAxis: {
                        show: true,
                        showAxisTitle: true
                    }
                };
                let yAxis = $(".streamGraph .axisGraphicsContext");

                visualBuilder.update(dataViews);

                setTimeout(() => {
                    expect(yAxis.children("text")).toBeInDOM();
                    done();
                }, DefaultWaitForRender);
            });

            it("y axis title off", done => {
                dataViews[0].metadata.objects = {
                    valueAxis: {
                        show: true,
                        showAxisTitle: false
                    }
                };
                let yAxis = $(".streamGraph .axisGraphicsContext");

                visualBuilder.update(dataViews);

                setTimeout(() => {
                    expect(yAxis.children("text").length).toBe(0);
                    done();
                }, DefaultWaitForRender);
            });

            it("x axis change color", done => {
                let blackColor = "#111111";
                let greyColor = "#999999";
                dataViews[0].metadata.objects = {
                    categoryAxis: {
                        show: true,
                        labelColor: { solid: { color: blackColor } }
                    }
                };

                visualBuilder.update(dataViews);

                setTimeout(() => {
                    let xAxis = $(".streamGraph .axisGraphicsContext .x.axis .tick");
                    colorAssert(xAxis.children('text').css('fill'), blackColor);

                    dataViews[0].metadata.objects = {
                        categoryAxis: {
                            show: true,
                            labelColor: { solid: { color: greyColor } }
                        }
                    };

                    visualBuilder.update(dataViews);

                    setTimeout(() => {
                        colorAssert(xAxis.children('text').css("fill"), greyColor);
                        done();
                    }, powerbitests.DefaultWaitForRender);

                }, powerbitests.DefaultWaitForRender);
            });

            it("y axis change color", done => {
                let blackColor = "#111111";
                let greyColor = "#999999";
                dataViews[0].metadata.objects = {
                    valueAxis: {
                        show: true,
                        labelColor: { solid: { color: blackColor } }
                    }
                };

                visualBuilder.update(dataViews);

                setTimeout(() => {
                    let yAxis = $(".streamGraph .axisGraphicsContext .y.axis .tick");
                    colorAssert(yAxis.children('text').css('fill'), blackColor);

                    dataViews[0].metadata.objects = {
                        valueAxis: {
                            show: true,
                            labelColor: { solid: { color: greyColor } }
                        }
                    };

                    visualBuilder.update(dataViews);

                    setTimeout(() => {
                        colorAssert(yAxis.children('text').css("fill"), greyColor);
                        done();
                    }, powerbitests.DefaultWaitForRender);

                }, powerbitests.DefaultWaitForRender);
            });

            it("data labels on", done => {
                dataViews[0].metadata.objects = {
                    labels: {
                        show: true
                    }
                };

                visualBuilder.update(dataViews);

                setTimeout(() => {
                    let labels = $(".streamGraph .labels");
                    expect(labels).toBeInDOM();
                    expect(labels.children('text').length).toBeGreaterThan(0);
                    done();
                }, powerbitests.DefaultWaitForRender);
            });

            it("data labels off", done => {
                dataViews[0].metadata.objects = {
                    labels: {
                        show: false
                    }
                };

                visualBuilder.update(dataViews);

                setTimeout(() => {
                    let labels = $(".streamGraph .labels");
                    expect(labels.length).toBe(0);
                    done();
                }, powerbitests.DefaultWaitForRender);
            });

            it("data labels change color", done => {
                let blackColor = "#111111";
                let greyColor = "#999999";
                dataViews[0].metadata.objects = {
                    labels: {
                        show: true,
                        color: { solid: { color: blackColor } }
                    }
                };

                visualBuilder.update(dataViews);

                setTimeout(() => {
                    let labels = $(".streamGraph .labels");
                    colorAssert(labels.first().find('text').css("fill"), blackColor);

                    dataViews[0].metadata.objects = {
                        labels: {
                            show: true,
                            color: { solid: { color: greyColor } }
                        }
                    };

                    visualBuilder.update(dataViews);

                    setTimeout(() => {
                        colorAssert(labels.first().find('text').css("fill"), greyColor);
                        done();
                    }, powerbitests.DefaultWaitForRender);

                }, powerbitests.DefaultWaitForRender);
            });

            it("data labels change font size", done => {
                dataViews[0].metadata.objects = {
                    labels: {
                        show: true,
                        fontSize: 15,
                    }
                };

                visualBuilder.update(dataViews);

                setTimeout(() => {
                    let labels = $(".streamGraph .labels");
                    expect(labels.first().find('text').css("font-size")).toBe('20px');
                    done();
                }, powerbitests.DefaultWaitForRender);
            });

            it("svg element created", () => expect(visualBuilder.mainElement[0]).toBeInDOM());

            it("update", (done) => {
                visualBuilder.update(dataViews);
                setTimeout(() => {
                    expect($('.streamGraph .layer').length).toBe(dataViews[0].categorical.values.length);
                    done();
                }, DefaultWaitForRender);
            });

            it("legend should be in DOM", (done) => {
                dataViews[0].metadata.objects = {
                    legend: {
                        show: true
                    }
                };
                visualBuilder.update(dataViews);
                setTimeout(() => {
                    let legend = $(".legend");
                    expect(legend).toBeInDOM();
                    done();
                }, powerbitests.DefaultWaitForRender);
            });

            it("Should add right amount of legend items", (done) => {
                visualBuilder = new StreamGraphBuilder();
                dataViews = [new powerbitests.customVisuals.sampleDataViews.SalesByDayOfWeekData().getDataView()];

                dataViews[0].metadata.objects = {
                    legend: {
                        show: true
                    },
                };
                visualBuilder.update(dataViews);
                setTimeout(() => {
                    let legendGroup = $(".legend #legendGroup");
                    let legendItemsCount = legendGroup.children.length;
                    expect(legendItemsCount).toBe(dataViews[0].categorical.values.length);
                    done();
                }, powerbitests.DefaultWaitForRender);
            });
        });
    });

    class StreamGraphBuilder extends VisualBuilderBase<VisualClass> {
        constructor(height: number = 200, width: number = 300, isMinervaVisualPlugin: boolean = false) {
            super(height, width, isMinervaVisualPlugin);
            this.build();
            this.init();
        }

        public get mainElement() {
            return this.element.children('svg.streamGraph');
        }

        public get legendElement() {
            return this.element.children('svg.legend');
        }

        private build(): void {
            this.visual = new VisualClass();
        }
    }
}