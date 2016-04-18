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
    powerbitests.mocks.setLocale();
    import VisualClass = powerbi.visuals.samples.WordCloud;
    import colorAssert = powerbitests.helpers.assertColorsMatch;

    describe("WordCloud", () => {

        describe('capabilities', () => {
            it("registered capabilities", () => expect(VisualClass.capabilities).toBeDefined());
        });

        // function that returns afghanistan from an array
        const func = e => e.innerHTML === "Afghanistan" || e.textContent === "Afghanistan";

        // function that uses grep to filter
        const grep = (val) => {
            return $.grep(val, func);
        };

        describe("DOM tests", () => {
            let visualBuilder: WordCloudBuilder;
            let dataViews: powerbi.DataView[];
            let timeOutTime: number = DefaultWaitForRender;

            beforeEach(() => {
                visualBuilder = new WordCloudBuilder();
                dataViews = [new powerbitests.customVisuals.sampleDataViews.CountriesData().getDataView()];
            });

            it("svg element created", () => expect(visualBuilder.mainElement[0]).toBeInDOM());

            it("basic update", (done) => {
                let defaultView = _.cloneDeep(dataViews);
                visualBuilder.update(defaultView);

                setTimeout(() => {
                    expect(visualBuilder.mainElement.children("g").children("g.words").children("text.word").length)
                        .toBeGreaterThan(0);
                    done();
                }, timeOutTime);
            });

            it("Word stop property change", (done) => {
                let defaultView = _.cloneDeep(dataViews);
                visualBuilder.update(defaultView);

                setTimeout(() => {
                    expect(grep(visualBuilder.mainElement.children("g").children("g.words").children("text.word").toArray()).length)
                        .toBeGreaterThan(0);

                    let item: powerbi.DataViewObjects = {
                        stopWords: {
                            show: true,
                            words: "Afghanistan"
                        }
                    };

                    let clonedView = _.cloneDeep(defaultView);
                    clonedView[0].metadata.objects = item;
                    visualBuilder.update(clonedView);

                    setTimeout(() => {
                        expect(grep(visualBuilder.mainElement.children("g").children("g.words").children("text.word").toArray()).length)
                            .toBe(0);
                        done();
                    }, timeOutTime);
                }, timeOutTime * 2);
            });

            it("Word returns after word stop property is changed back", (done) => {
                let defaultView = _.cloneDeep(dataViews);
                visualBuilder.update(defaultView);
                setTimeout(() => {
                    expect(grep(visualBuilder.mainElement.children("g").children("g.words").children("text.word").toArray()).length)
                        .toBeGreaterThan(0);

                    let item: powerbi.DataViewObjects = {
                        stopWords: {
                            show: true,
                            words: "Afghanistan"
                        }
                    };
                    let clonedView = _.cloneDeep(defaultView);
                    clonedView[0].metadata.objects = item;
                    visualBuilder.update(clonedView);

                    setTimeout(() => {
                        expect(grep(visualBuilder.mainElement.children("g").children("g.words").children("text.word").toArray()).length)
                            .toBe(0);

                        item = {
                            stopWords: {
                                show: false,
                            }
                        };
                        let secondView = _.cloneDeep(clonedView);
                        secondView[0].metadata.objects = item;
                        visualBuilder.update(secondView);

                        setTimeout(() => {
                            expect(grep(visualBuilder.mainElement.children("g").children("g.words").children("text.word").toArray()).length)
                                .toBeGreaterThan(0);
                            done();
                        }, timeOutTime);
                    }, timeOutTime * 2);
                }, 2 * (timeOutTime * 2));
            });

            it("change color for first country (Afghanistan)", (done) => {
                let defaultView = _.cloneDeep(dataViews);
                visualBuilder.update(defaultView);

                setTimeout(() => {
                    let item: powerbi.DataViewObjects = {
                        dataPoint: {
                            fill: {
                                solid: {
                                    color: "#00B8AA"
                                }
                            }
                        }
                    };

                    let baseWordColor = $(grep(visualBuilder.mainElement.children("g").children("g.words").children("text.word").toArray())).css('fill');

                    defaultView[0].categorical.categories[0].objects = [item];
                    visualBuilder.update(defaultView);

                    setTimeout(() => {
                        colorAssert(($(grep(visualBuilder.mainElement.children("g").children("g.words").children("text.word").toArray())).css('fill')), baseWordColor, true);
                        done();
                    }, timeOutTime);
                }, timeOutTime * 2);
            });

        });
    });

    class WordCloudBuilder extends VisualBuilderBase<VisualClass> {
        constructor(height: number = 200, width: number = 300, isMinervaVisualPlugin: boolean = false) {
            super(height, width, isMinervaVisualPlugin);
            this.build();
            this.init();
        }

        public get mainElement() {
            return this.element.children("svg.wordCloud");
        }

        private build(): void {
            this.visual = new VisualClass();
        }
    }
}
