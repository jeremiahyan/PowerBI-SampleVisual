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

// Word cloud layout by Jason Davies, https://www.jasondavies.com/wordcloud/ https://github.com/jasondavies/d3-cloud
// Algorithm due to Jonathan Feinberg, http://static.mrfeinberg.com/bv_ch03.pdf

module powerbi.visuals.samples {
    import ValueFormatter = powerbi.visuals.valueFormatter;
    import getAnimationDuration = AnimatorCommon.GetAnimationDuration;
    import ClassAndSelector = jsCommon.CssConstants.ClassAndSelector;

    type D3Element =
        D3.UpdateSelection
        | D3.Selection
        | D3.Selectors
        | D3.Transition.Transition;

    export enum WordCloudScaleType {
        logn,
        sqrt,
        value
    };

    export interface WordCloudText {
        text: string;
        count: number;
        index: number;
        selectionId: SelectionId;
        color: string;
    }

    export interface WordCloudDataPoint extends IPoint {
        text: string;
        xOff: number;
        yOff: number;
        rotate?: number;
        size: number;
        padding: number;
        width: number;
        height: number;
        sprite?: number[];
        x0: number;
        y0: number;
        x1: number;
        y1: number;
        color: string;
        selectionId: SelectionId;
        wordIndex: number;
    }

    export interface WordCloudData {
        settings: WordCloudSettings;
        texts: WordCloudText[];
    }

    export interface WordCloudDataView {
        data: WordCloudDataPoint[];
        leftBorder: IPoint;
        rightBorder: IPoint;
    }

    export interface WordCloudConstructorOptions {
        svg?: D3.Selection;
        animator?: IGenericAnimator;
        margin?: IMargin;
    }

    export interface WordCloudSettings {
        minFontSize: number;
        maxFontSize: number;
        minAngle?: number;
        maxAngle?: number;
        maxNumberOfOrientations?: number;
        valueFormatter?: IValueFormatter;
        isRotateText: boolean;
        isBrokenText: boolean;
        isRemoveStopWords: boolean;
        stopWords: string;
        isDefaultStopWords: boolean;
        stopWordsArray: string[];
        maxNumberOfWords: number;
    }

    class VisualLayout {
        private marginValue: IMargin;
        private viewportValue: IViewport;
        private viewportInValue: IViewport;

        public defaultMargin: IMargin;
        public defaultViewport: IViewport;

        constructor(defaultViewport?: IViewport, defaultMargin?: IMargin) {
            this.defaultViewport = defaultViewport || { width: 0, height: 0 };
            this.defaultMargin = defaultMargin || { top: 0, bottom: 0, right: 0, left: 0 };
        }

        public get margin(): IMargin {
            return this.marginValue || (this.margin = this.defaultMargin);
        }

        public set margin(value: IMargin) {
            this.marginValue = VisualLayout.restrictToMinMax(value);
            this.update();
        }

        public get viewport(): IViewport {
            return this.viewportValue || (this.viewportValue = this.defaultViewport);
        }

        public set viewport(value: IViewport) {
            this.viewportValue = VisualLayout.restrictToMinMax(value);
            this.update();
        }

        public get viewportIn(): IViewport {
            return this.viewportInValue || this.viewport;
        }

        public get viewportInIsZero(): boolean {
            return this.viewportIn.width === 0 || this.viewportIn.height === 0;
        }

        private update(): void {
            this.viewportInValue = VisualLayout.restrictToMinMax({
                width: this.viewport.width - (this.margin.left + this.margin.right),
                height: this.viewport.height - (this.margin.top + this.margin.bottom)
            });
        }

        private static restrictToMinMax<T>(value: T): T {
            let result = $.extend({}, value);
            d3.keys(value).forEach(x => result[x] = Math.max(0, value[x]));
            return result;
        }
    }

    export class WordCloud implements IVisual {
        private static ClassName: string = "wordCloud";

        private static Properties: any = {
            general: {
                formatString: <DataViewObjectPropertyIdentifier>{
                    objectName: "general",
                    propertyName: "formatString"
                },
                maxNumberOfWords: <DataViewObjectPropertyIdentifier>{
                    objectName: "general",
                    propertyName: "maxNumberOfWords"
                },
                minFontSize: <DataViewObjectPropertyIdentifier>{
                    objectName: "general",
                    propertyName: "minFontSize"
                },
                maxFontSize: <DataViewObjectPropertyIdentifier>{
                    objectName: "general",
                    propertyName: "maxFontSize"
                },
                isBrokenText: <DataViewObjectPropertyIdentifier>{
                    objectName: "general",
                    propertyName: "isBrokenText"
                },
            },
            dataPoint: {
                fill: <DataViewObjectPropertyIdentifier>{
                    objectName: "dataPoint",
                    propertyName: "fill"
                }
            },
            stopWords: {
                show: <DataViewObjectPropertyIdentifier>{
                    objectName: "stopWords",
                    propertyName: "show"
                },
                isDefaultStopWords: <DataViewObjectPropertyIdentifier>{
                    objectName: "stopWords",
                    propertyName: "isDefaultStopWords"
                },
                words: <DataViewObjectPropertyIdentifier>{
                    objectName: "stopWords",
                    propertyName: "words"
                },
            },
            rotateText: {
                show: <DataViewObjectPropertyIdentifier>{
                    objectName: "rotateText",
                    propertyName: "show"
                },
                minAngle: <DataViewObjectPropertyIdentifier>{
                    objectName: "rotateText",
                    propertyName: "minAngle"
                },
                maxAngle: <DataViewObjectPropertyIdentifier>{
                    objectName: "rotateText",
                    propertyName: "maxAngle"
                },
                maxNumberOfOrientations: <DataViewObjectPropertyIdentifier>{
                    objectName: "rotateText",
                    propertyName: "maxNumberOfOrientations"
                }
            }
        };

        private static Words: ClassAndSelector = {
            "class": "words",
            selector: ".words"
        };

        private static Word: ClassAndSelector = {
            "class": "word",
            selector: ".word"
        };

        private static Size: string = "px";
        private static StopWordsDelemiter: string = " ";

        private static Radians: number = Math.PI / 180;

        private static MinAngle: number = -180;
        private static MaxAngle: number = 180;

        private static MaxNumberOfWords: number = 2500;

        private static MinOpacity: number = 0.2;
        private static MaxOpacity: number = 1;

        public static capabilities: VisualCapabilities = {
            dataRoles: [{
                name: "Category",
                kind: VisualDataRoleKind.Grouping,
                displayName: "Category"
            }, {
                    name: "Values",
                    kind: VisualDataRoleKind.Measure,
                    displayName: "Values"
                }],
            dataViewMappings: [{
                conditions: [{
                    "Category": {
                        min: 1,
                        max: 1
                    },
                    "Values": {
                        min: 0,
                        max: 1
                    }
                }],
                categorical: {
                    categories: {
                        for: { in: "Category" },
                        dataReductionAlgorithm: { top: { count: WordCloud.MaxNumberOfWords } }
                    },
                    values: {
                        for: { in: "Values" }
                    }
                }
            }],
            sorting: {
                implicit: {
                    clauses: [{
                        role: "Values",
                        direction: 2 /*SortDirection.Descending*/ //Constant SortDirection.Descending currently is not supported on the msit
                    }]
                }
            },
            objects: {
                general: {
                    displayName: "General",
                    properties: {
                        formatString: {
                            type: {
                                formatting: {
                                    formatString: true
                                }
                            }
                        },
                        maxNumberOfWords: {
                            displayName: "Max number of words",
                            type: { numeric: true }
                        },
                        minFontSize: {
                            displayName: "Min Font",
                            type: { numeric: true }
                        },
                        maxFontSize: {
                            displayName: "Max Font",
                            type: { numeric: true }
                        },
                        isBrokenText: {
                            displayName: "Word-breaking",
                            type: { bool: true }
                        },
                        isRemoveStopWords: {
                            displayName: "Stop Words",
                            type: { bool: true }
                        }
                    }
                },
                dataPoint: {
                    displayName: "Data colors",
                    properties: {
                        fill: {
                            displayName: "Fill",
                            type: { fill: { solid: { color: true } } }
                        }
                    }
                },
                stopWords: {
                    displayName: "Stop Words",
                    properties: {
                        show: {
                            displayName: "Show",
                            type: { bool: true }
                        },
                        isDefaultStopWords: {
                            displayName: "Default Stop Words",
                            type: { bool: true }
                        },
                        words: {
                            displayName: "Words",
                            type: { text: true }
                        }
                    }
                },
                rotateText: {
                    displayName: "Rotate Text",
                    properties: {
                        show: {
                            displayName: "Show",
                            type: { bool: true }
                        },
                        minAngle: {
                            displayName: "Min Angle",
                            type: { numeric: true }
                        },
                        maxAngle: {
                            displayName: "Max Angle",
                            type: { numeric: true }
                        },
                        maxNumberOfOrientations: {
                            displayName: "Max number of orientations",
                            type: { numeric: true }
                        }
                    }
                }
            }
        };

        private static Punctuation: string[] = [
            "!", ".", ":", "'", ";", ",", "!",
            "@", "#", "$", "%", "^", "&", "*",
            "(", ")", "[", "]", "\"", "\\", "/",
            "-", "_", "+", "="
        ];

        private static StopWords: string[] = [
            "a", "able", "about", "across", "after", "all", "almost", "also", "am", "among", "an",
            "and", "any", "are", "as", "at", "be", "because", "been", "but", "by", "can", "cannot",
            "could", "did", "do", "does", "either", "else", "ever", "every", "for", "from", "get",
            "got", "had", "has", "have", "he", "her", "hers", "him", "his", "how", "however", "i",
            "if", "in", "into", "is", "it", "its", "just", "least", "let", "like", "likely", "may",
            "me", "might", "most", "must", "my", "neither", "no", "nor", "not", "of", "off", "often",
            "on", "only", "or", "other", "our", "own", "rather", "said", "say", "says", "she", "should",
            "since", "so", "some", "than", "that", "the", "their", "them", "then", "there", "these",
            "they", "this", "tis", "to", "too", "twas", "us", "wants", "was", "we", "were", "what",
            "when", "where", "which", "while", "who", "whom", "why", "will", "with", "would", "yet",
            "you", "your"
        ];

        private static DefaultSettings: WordCloudSettings = {
            minFontSize: 20,
            maxFontSize: 100,
            minAngle: -60,
            maxAngle: 90,
            maxNumberOfOrientations: 2,
            isRotateText: false,
            isBrokenText: true,
            isRemoveStopWords: false,
            stopWordsArray: [],
            stopWords: undefined,
            isDefaultStopWords: false,
            maxNumberOfWords: 200
        };

        private static RenderDelay: number = 50;

        private static DefaultMargin: IMargin = {
            top: 10,
            right: 10,
            bottom: 10,
            left: 10
        };

        private settings: WordCloudSettings;
        private wordCloudTexts: WordCloudText[];
        private wordCloudDataView: WordCloudDataView;
        private data: WordCloudData;
        private dataBeforeRender: WordCloudDataPoint[];

        private durationAnimations: number = 500;

        private specialViewport: IViewport;

        private fakeViewport: IViewport = {
            width: 1500,
            height: 1000
        };

        private canvasViewport: IViewport = {
            width: 128,
            height: 2048
        };

        public static colors: IDataColorPalette;
        private root: D3.Selection;
        private svg: D3.Selection;
        private main: D3.Selection;
        private wordsContainerSelection: D3.Selection;
        private wordsSelection: D3.UpdateSelection;

        private canvas: HTMLCanvasElement;

        private fontFamily: string;

        private animator: IGenericAnimator;

        private layout: VisualLayout;

        private hostService: IVisualHostServices;
        private selectionManager: utility.SelectionManager;

        private visualUpdateOptions: VisualUpdateOptions;

        private isUpdating: boolean;
        private incomingUpdateOptions: VisualUpdateOptions;

        constructor(options?: WordCloudConstructorOptions) {
            if (options) {
                this.svg = options.svg || this.svg;
                this.layout = new VisualLayout(null, options.margin || WordCloud.DefaultMargin);

                if (options.animator)
                    this.animator = options.animator;
            }

            this.isUpdating = false;
        }

        public init(options: VisualInitOptions): void {
            if (this.svg)
                this.root = this.svg;
            else
                this.root = d3.select(options.element.get(0)).append("svg");

            WordCloud.colors = options.style.colorPalette.dataColors;
            this.hostService = options.host;
            this.selectionManager = new utility.SelectionManager({ hostServices: this.hostService });

            if (!this.layout)
                this.layout = new VisualLayout(null, WordCloud.DefaultMargin);

            this.root.classed(WordCloud.ClassName, true);

            this.root.on("click", () => {
                this.selectionManager.clear();
                this.setSelection(this.wordsSelection);
            });

            this.fontFamily = this.root.style("font-family");

            this.main = this.root.append("g");

            this.wordsContainerSelection = this.main
                .append("g")
                .classed(WordCloud.Words["class"], true);

            this.canvas = document.createElement("canvas");
        }

        public converter(dataView: DataView): WordCloudData {
            if (!dataView ||
                !dataView.categorical ||
                !dataView.categorical.categories ||
                !dataView.categorical.categories[0] ||
                !dataView.categorical.categories[0].values ||
                !dataView.categorical.categories[0].values.length ||
                !(dataView.categorical.categories[0].values.length > 0))
                return null;

            let categories: string[] = dataView.categorical.categories[0].values,
                settings: WordCloudSettings = WordCloud.parseSettings(dataView, categories[0]),
                frequencies: number[],
                texts: WordCloudText[];
            if (!settings)
                return null;

            if (!_.isEmpty(dataView.categorical.values) &&
                !_.isEmpty(dataView.categorical.values[0]) &&
                !_.isEmpty(dataView.categorical.values[0].values))
                frequencies = dataView.categorical.values[0].values;

            texts = categories.map((item: string, index: number) => {
                let color, categoryObject = dataView.categorical.categories[0];
                if (categoryObject.objects && categoryObject.objects[index])
                    color = this.getColor(WordCloud.Properties.dataPoint.fill, explore.util.getRandomColor(), categoryObject.objects[index]);
                else {
                    if (this.wordCloudTexts && this.wordCloudTexts[index])
                        color = this.wordCloudTexts[index].color;
                    else
                        color = explore.util.getRandomColor();
                }

                return <WordCloudText>{
                    text: item,
                    count: (frequencies && frequencies[index] && !isNaN(frequencies[index])) ? frequencies[index] : 1,
                    index: index,
                    selectionId: SelectionId.createWithId(dataView.categorical.categories[0].identity[index]),
                    color: color,
                };
            });

            return <WordCloudData>{
                settings: settings,
                texts: texts
            };
        }

        private getColor(properties: any, defaultColor: string, objects: DataViewObjects): string {
            let colorHelper: ColorHelper;

            colorHelper = new ColorHelper(WordCloud.colors, properties, defaultColor);

            return explore.util.hexToRgb(colorHelper.getColorForMeasure(objects, ""));
        }

        private static parseSettings(dataView: DataView, value: any): WordCloudSettings {
            if (!dataView ||
                !dataView.metadata ||
                !dataView.metadata.columns ||
                !dataView.metadata.columns[0])
                return null;

            let objects: DataViewObjects = dataView.metadata.objects,
                valueFormatter: IValueFormatter,
                minFontSize: number,
                maxFontSize: number,
                minAngle: number,
                maxAngle: number,
                maxNumberOfOrientations: number,
                isRotateText: boolean = false,
                isBrokenText: boolean = true,
                isRemoveStopWords: boolean = true,
                stopWords: string,
                stopWordsArray: string[],
                isDefaultStopWords: boolean = false,
                maxNumberOfWords: number;

            maxNumberOfWords = WordCloud.getNumberFromObjects(
                objects,
                WordCloud.Properties.general.maxNumberOfWords,
                WordCloud.DefaultSettings.maxNumberOfWords);

            minFontSize = WordCloud.getNumberFromObjects(
                objects,
                WordCloud.Properties.general.minFontSize,
                WordCloud.DefaultSettings.minFontSize);

            maxFontSize = WordCloud.getNumberFromObjects(
                objects,
                WordCloud.Properties.general.maxFontSize,
                WordCloud.DefaultSettings.maxFontSize);

            minAngle = WordCloud.getNumberFromObjects(
                objects,
                WordCloud.Properties.rotateText.minAngle,
                WordCloud.DefaultSettings.minAngle);

            maxAngle = WordCloud.getNumberFromObjects(
                objects,
                WordCloud.Properties.rotateText.maxAngle,
                WordCloud.DefaultSettings.maxAngle);

            isRotateText = DataViewObjects.getValue<boolean>(
                objects,
                WordCloud.Properties.rotateText.show,
                WordCloud.DefaultSettings.isRotateText);

            maxNumberOfOrientations = WordCloud.getNumberFromObjects(
                objects,
                WordCloud.Properties.rotateText.maxNumberOfOrientations,
                WordCloud.DefaultSettings.maxNumberOfOrientations);

            valueFormatter = ValueFormatter.create({
                format: ValueFormatter.getFormatString(
                    dataView.categorical.categories[0].source,
                    WordCloud.Properties.general.formatString),
                value: value
            });

            isBrokenText = DataViewObjects.getValue<boolean>(
                objects,
                WordCloud.Properties.general.isBrokenText,
                WordCloud.DefaultSettings.isBrokenText);

            isRemoveStopWords = DataViewObjects.getValue<boolean>(
                objects,
                WordCloud.Properties.stopWords.show,
                WordCloud.DefaultSettings.isRemoveStopWords);

            stopWords = DataViewObjects.getValue(
                objects,
                WordCloud.Properties.stopWords.words,
                WordCloud.DefaultSettings.stopWords);

            if (typeof stopWords === "string")
                stopWordsArray = stopWords.split(WordCloud.StopWordsDelemiter);
            else
                stopWordsArray = WordCloud.DefaultSettings.stopWordsArray;

            isDefaultStopWords = DataViewObjects.getValue<boolean>(
                objects,
                WordCloud.Properties.stopWords.isDefaultStopWords,
                WordCloud.DefaultSettings.isDefaultStopWords);

            return {
                minFontSize: minFontSize,
                maxFontSize: maxFontSize,
                minAngle: minAngle,
                maxAngle: maxAngle,
                maxNumberOfOrientations: maxNumberOfOrientations,
                valueFormatter: valueFormatter,
                isRotateText: isRotateText,
                isBrokenText: isBrokenText,
                isRemoveStopWords: isRemoveStopWords,
                stopWords: stopWords,
                stopWordsArray: stopWordsArray,
                isDefaultStopWords: isDefaultStopWords,
                maxNumberOfWords: maxNumberOfWords
            };
        }

        private static getNumberFromObjects(objects: DataViewObjects, properties: any, defaultValue: number): number {
            return objects ? DataViewObjects.getValue<number>(objects, properties, defaultValue) : defaultValue;
        }

        private parseNumber(
            value: number | string,
            defaultValue: number = 0,
            minValue: number = -Number.MAX_VALUE,
            maxValue: number = Number.MAX_VALUE): number {
            let parsedValue: number = Number(value);

            if (isNaN(parsedValue) || (typeof value === "string" && value.length === 0))
                return defaultValue;

            if (parsedValue < minValue)
                return minValue;

            if (parsedValue > maxValue)
                return maxValue;

            return parsedValue;
        }

        private computePositions(words: WordCloudDataPoint[], onPositionsComputed: (WordCloudDataView) => void): void {
            let context: CanvasRenderingContext2D = this.getCanvasContext(),
                surface: number[] = [],
                borders: IPoint[] = null,
                maxNumberOfWords: number;

            if (!words || !(words.length > 0))
                return null;

            maxNumberOfWords = Math.abs(this.parseNumber(
                this.settings.maxNumberOfWords,
                WordCloud.DefaultSettings.maxNumberOfWords,
                words.length * -1,
                words.length));

            if (words.length > maxNumberOfWords)
                words = words.slice(0, maxNumberOfWords);

            for (let i: number; i < (this.specialViewport.width >> 5) * this.specialViewport.height; i++) {
                surface[i] = 0;
            }

            setTimeout(() => this.computeCycle(words, context, surface, borders, onPositionsComputed, [], 0), 0);
        }

        private computeCycle(
            words: WordCloudDataPoint[],
            context: CanvasRenderingContext2D,
            surface: number[],
            borders: IPoint[],
            onPositionsComputed: (WordCloudDataView) => void,
            wordsForDraw: WordCloudDataPoint[] = [],
            index: number = 0): void {
            let word: WordCloudDataPoint = words[index],
                ratio: number = 1;

            if (words.length <= 10)
                ratio = 5;
            else if (words.length <= 25)
                ratio = 3;
            else if (words.length <= 75)
                ratio = 1.5;
            else if (words.length <= 100)
                ratio = 1.25;

            word.x = (this.specialViewport.width / ratio * (Math.random() + 0.5)) >> 1;
            word.y = (this.specialViewport.height / ratio * (Math.random() + 0.5)) >> 1;

            this.generateSprites(context, word, words, index);

            if (word.sprite && this.findPosition(surface, word, borders)) {
                wordsForDraw.push(word);

                borders = this.updateBorders(word, borders);
                word.x -= this.specialViewport.width >> 1;
                word.y -= this.specialViewport.height >> 1;
            }

            if (++index < words.length && this.root)
                this.computeCycle(words, context, surface, borders, onPositionsComputed, wordsForDraw, index);
            else {
                onPositionsComputed({
                    data: wordsForDraw,
                    leftBorder: borders && borders[0],
                    rightBorder: borders && borders[1]
                });
            }
        }

        private updateBorders(word: WordCloudDataPoint, borders: IPoint[]): IPoint[] {
            if (borders && borders.length === 2) {
                let leftBorder: IPoint = borders[0],
                    rightBorder: IPoint = borders[1];

                if (word.x + word.x0 < leftBorder.x)
                    leftBorder.x = word.x + word.x0;

                if (word.y + word.y0 < leftBorder.y)
                    leftBorder.y = word.y + word.y0;

                if (word.x + word.x1 > rightBorder.x)
                    rightBorder.x = word.x + word.x1;

                if (word.y + word.y1 > rightBorder.y)
                    rightBorder.y = word.y + word.y1;
            } else {
                borders = [
                    {
                        x: word.x + word.x0,
                        y: word.y + word.y0
                    }, {
                        x: word.x + word.x1,
                        y: word.y + word.y1
                    }
                ];
            }

            return borders;
        }

        private generateSprites(
            context: CanvasRenderingContext2D,
            currentWord: WordCloudDataPoint,
            words: WordCloudDataPoint[],
            index: number): void {
            if (currentWord.sprite)
                return;

            context.clearRect(0, 0, this.canvasViewport.width << 5, this.canvasViewport.height);

            let x: number = 0,
                y: number = 0,
                maxHeight: number = 0,
                quantityOfWords: number = words.length,
                pixels: number[],
                sprite: number[] = [];

            for (let i: number = index; i < quantityOfWords; i++) {
                let currentWordData: WordCloudDataPoint = words[i],
                    widthOfWord: number = 0,
                    heightOfWord: number = 0;

                context.save();
                context.font = "normal normal " + (currentWordData.size + 1) + WordCloud.Size + " " + this.fontFamily;

                widthOfWord = context.measureText(currentWordData.text + "m").width;
                heightOfWord = currentWordData.size << 1;

                if (currentWordData.rotate) {
                    let sr: number = Math.sin(currentWordData.rotate * WordCloud.Radians),
                        cr: number = Math.cos(currentWordData.rotate * WordCloud.Radians),
                        widthCr: number = widthOfWord * cr,
                        widthSr: number = widthOfWord * sr,
                        heightCr: number = heightOfWord * cr,
                        heightSr: number = heightOfWord * sr;

                    widthOfWord = (Math.max(Math.abs(widthCr + heightSr), Math.abs(widthCr - heightSr)) + 31) >> 5 << 5;
                    heightOfWord = Math.floor(Math.max(Math.abs(widthSr + heightCr), Math.abs(widthSr - heightCr)));
                } else
                    widthOfWord = (widthOfWord + 31) >> 5 << 5;

                if (heightOfWord > maxHeight)
                    maxHeight = heightOfWord;

                if (x + widthOfWord >= (this.canvasViewport.width << 5)) {
                    x = 0;
                    y += maxHeight;
                    maxHeight = 0;
                }

                context.translate((x + (widthOfWord >> 1)), (y + (heightOfWord >> 1)));

                if (currentWordData.rotate)
                    context.rotate(currentWordData.rotate * WordCloud.Radians);

                context.fillText(currentWordData.text, 0, 0);

                if (currentWordData.padding) {
                    context.lineWidth = 2 * currentWordData.padding;
                    context.strokeText(currentWordData.text, 0, 0);
                }

                context.restore();

                currentWordData.width = widthOfWord;
                currentWordData.height = heightOfWord;
                currentWordData.xOff = x;
                currentWordData.yOff = y;
                currentWordData.x1 = widthOfWord >> 1;
                currentWordData.y1 = heightOfWord >> 1;
                currentWordData.x0 = -currentWordData.x1;
                currentWordData.y0 = -currentWordData.y1;

                x += widthOfWord;
            }

            pixels = context.getImageData(0, 0, this.canvasViewport.width << 5, this.canvasViewport.height).data;

            sprite = [];

            for (let i = quantityOfWords - 1; i >= 0; i--) {
                let currentWordData: WordCloudDataPoint = words[i],
                    width: number = currentWordData.width,
                    width32: number = width >> 5,
                    height: number = currentWordData.y1 - currentWordData.y0,
                    x: number = 0,
                    y: number = 0,
                    seen: number = 0,
                    seenRow: number = 0;

                if (currentWordData.xOff + width >= (this.canvasViewport.width << 5) ||
                    currentWordData.yOff + height >= this.canvasViewport.height) {
                    currentWordData.sprite = null;

                    continue;
                }

                for (let j = 0; j < height * width32; j++) {
                    sprite[j] = 0;
                }

                if (currentWordData.xOff !== null)
                    x = currentWordData.xOff;
                else
                    return;

                y = currentWordData.yOff;

                seen = 0;
                seenRow = -1;

                for (let j = 0; j < height; j++) {
                    for (let k = 0; k < width; k++) {
                        let l: number = width32 * j + (k >> 5),
                            index: number = ((y + j) * (this.canvasViewport.width << 5) + (x + k)) << 2,
                            m: number = pixels[index]
                                ? 1 << (31 - (k % 32))
                                : 0;

                        sprite[l] |= m;
                        seen |= m;
                    }

                    if (seen)
                        seenRow = j;
                    else {
                        currentWordData.y0++;
                        height--;
                        j--;
                        y++;
                    }
                }

                currentWordData.y1 = currentWordData.y0 + seenRow;
                currentWordData.sprite = sprite.slice(0, (currentWordData.y1 - currentWordData.y0) * width32);
            }
        }

        private findPosition(surface: number[], word: WordCloudDataPoint, borders: IPoint[]): boolean {
            let startPoint: IPoint = { x: word.x, y: word.y },
                delta = Math.sqrt(this.specialViewport.width * this.specialViewport.width + this.specialViewport.height * this.specialViewport.height),
                point: IPoint,
                dt: number = Math.random() < 0.5 ? 1 : -1,
                shift: number = -dt,
                dx: number,
                dy: number;

            while (true) {
                shift += dt;

                point = this.archimedeanSpiral(shift);

                dx = Math.floor(point.x);
                dy = Math.floor(point.y);

                if (Math.min(Math.abs(dx), Math.abs(dy)) >= delta)
                    break;

                word.x = startPoint.x + dx;
                word.y = startPoint.y + dy;

                if (word.x + word.x0 < 0 ||
                    word.y + word.y0 < 0 ||
                    word.x + word.x1 > this.specialViewport.width ||
                    word.y + word.y1 > this.specialViewport.height)
                    continue;

                if (!borders || !this.checkIntersect(word, surface)) {
                    if (!borders || this.checkIntersectOfRectangles(word, borders[0], borders[1])) {
                        let sprite: number[] = word.sprite,
                            width: number = word.width >> 5,
                            shiftWidth: number = this.specialViewport.width >> 5,
                            lx: number = word.x - (width << 4),
                            sx: number = lx & 127,
                            msx: number = 32 - sx,
                            height: number = word.y1 - word.y0,
                            x: number = (word.y + word.y0) * shiftWidth + (lx >> 5);

                        for (let i: number = 0; i < height; i++) {
                            let lastSprite: number = 0;

                            for (let j: number = 0; j <= width; j++) {
                                let leftMask: number = lastSprite << msx,
                                    rightMask: number;

                                if (j < width)
                                    lastSprite = sprite[i * width + j];

                                rightMask = j < width
                                    ? lastSprite >>> sx
                                    : 0;

                                surface[x + j] |= leftMask | rightMask;
                            }

                            x += shiftWidth;
                        }

                        word.sprite = null;

                        return true;
                    }
                }
            }

            return false;
        }

        private archimedeanSpiral(value: number): IPoint {
            let ratio: number = this.specialViewport.width / this.specialViewport.height;

            value = value * 0.1;

            return {
                x: ratio * value * Math.cos(value),
                y: value * Math.sin(value)
            };
        }

        private checkIntersect(word: WordCloudDataPoint, surface: number[]): boolean {
            let shiftWidth: number = this.specialViewport.width >> 5,
                sprite: number[] = word.sprite,
                widthOfWord = word.width >> 5,
                lx: number = word.x - (widthOfWord << 4),
                sx: number = lx & 127,
                msx: number = 32 - sx,
                heightOfWord = word.y1 - word.y0,
                x: number = (word.y + word.y0) * shiftWidth + (lx >> 5);

            for (let i = 0; i < heightOfWord; i++) {
                let lastSprite: number = 0;

                for (let j = 0; j <= widthOfWord; j++) {
                    let mask: number = 0,
                        leftMask: number,
                        intersectMask: number = 0;

                    leftMask = lastSprite << msx;

                    if (j < widthOfWord)
                        lastSprite = sprite[i * widthOfWord + j];

                    mask = j < widthOfWord
                        ? lastSprite >>> sx
                        : 0;

                    intersectMask = (leftMask | mask) & surface[x + j];

                    if (intersectMask)
                        return true;
                }

                x += shiftWidth;
            }

            return false;
        }

        private checkIntersectOfRectangles(word: WordCloudDataPoint, leftBorder: IPoint, rightBorder: IPoint): boolean {
            return (word.x + word.x1) > leftBorder.x &&
                (word.x + word.x0) < rightBorder.x &&
                (word.y + word.y1) > leftBorder.y &&
                (word.y + word.y0) < rightBorder.y;
        }

        private getCanvasContext(): CanvasRenderingContext2D {
            if (!this.canvasViewport)
                return null;

            this.canvas.width = 1;
            this.canvas.height = 1;

            let context: CanvasRenderingContext2D = this.canvas.getContext("2d");

            this.canvas.width = this.canvasViewport.width << 5;
            this.canvas.height = this.canvasViewport.height;

            context = this.canvas.getContext("2d");
            context.fillStyle = context.strokeStyle = "red";
            context.textAlign = "center";

            return context;
        }

        private getReducedText(texts: WordCloudText[]): WordCloudText[] {
            let brokenStrings: WordCloudText[] = [];
            brokenStrings = this.getBrokenWords(texts);

            return brokenStrings.reduce((previousValue: WordCloudText[], currentValue: WordCloudText) => {
                if (!previousValue.some((value: WordCloudText) => {
                    if (value.index !== currentValue.index && value.text === currentValue.text) {
                        value.count += currentValue.count;

                        return true;
                    }

                    return false;
                })) {
                    previousValue.push(currentValue);
                }

                return previousValue;
            }, []);
        }

        private getBrokenWords(words: WordCloudText[]): WordCloudText[] {
            let brokenStrings: WordCloudText[] = [],
                whiteSpaceRegExp: RegExp = /\s/,
                punctuatuinRegExp: RegExp;

            if (!this.settings.isBrokenText)
                return words;

            punctuatuinRegExp = new RegExp(`[${WordCloud.Punctuation.join("\\")}]`, "gim");

            words.forEach((item: WordCloudText) => {
                if (typeof item.text === "string") {
                    let words: string[];

                    words = item.text.replace(punctuatuinRegExp, " ").split(whiteSpaceRegExp);

                    if (this.settings.isRemoveStopWords) {
                        let stopWords: string[] = this.settings.stopWordsArray;

                        if (this.settings.isDefaultStopWords)
                            stopWords = stopWords.concat(WordCloud.StopWords);

                        words = words.filter((value: string) => {
                            return value.length > 0 && !stopWords.some((removeWord: string) => {
                                return value.toLocaleLowerCase() === removeWord.toLocaleLowerCase();
                            });
                        });
                    }

                    words.forEach((element: string) => {
                        if (element.length > 0 && !whiteSpaceRegExp.test(element)) {
                            brokenStrings.push({
                                text: element,
                                count: item.count,
                                index: item.index,
                                selectionId: item.selectionId,
                                color: item.color
                            });
                        }
                    });
                } else
                    brokenStrings.push(item);
            });

            return brokenStrings;
        }

        private getWords(values: WordCloudText[]): WordCloudDataPoint[] {
            let sortedValues: WordCloudText[],
                minValue: number = 0,
                maxValue: number = 0,
                valueFormatter: IValueFormatter = this.settings.valueFormatter;

            if (!values || !(values.length >= 1))
                return [];

            sortedValues = values.sort((a: WordCloudText, b: WordCloudText) => {
                return b.count - a.count;
            });

            minValue = sortedValues[sortedValues.length - 1].count;
            maxValue = sortedValues[0].count;

            let returnValues = values.map((value: WordCloudText) => {
                return <WordCloudDataPoint>{
                    text: valueFormatter.format(value.text),
                    size: this.getFontSize(value.count, minValue, maxValue),
                    x: 0,
                    y: 0,
                    rotate: this.getAngle(),
                    padding: 1,
                    width: 0,
                    height: 0,
                    xOff: 0,
                    yOff: 0,
                    x0: 0,
                    y0: 0,
                    x1: 0,
                    y1: 0,
                    color: value.color,
                    selectionId: value.selectionId,
                    wordIndex: value.index
                };
            });
            this.dataBeforeRender = returnValues;
            return returnValues;
        }

        private getFontSize(
            value: number,
            minValue: number,
            maxValue: number,
            scaleType: WordCloudScaleType = WordCloudScaleType.value) {
            let weight: number,
                fontSize: number,
                maxFontSize: number,
                minFontSize: number;

            minFontSize = Math.abs(this.parseNumber(this.settings.minFontSize, WordCloud.DefaultSettings.minFontSize));
            maxFontSize = Math.abs(this.parseNumber(this.settings.maxFontSize, WordCloud.DefaultSettings.maxFontSize));

            if (minFontSize > maxFontSize) {
                let buffer: number = minFontSize;

                minFontSize = maxFontSize;
                maxFontSize = buffer;
            }

            switch (scaleType) {
                case WordCloudScaleType.logn: {
                    weight = Math.log(value);
                }
                case WordCloudScaleType.sqrt: {
                    weight = Math.sqrt(value);
                }
                case WordCloudScaleType.value: {
                    weight = value;
                }
            }

            fontSize = weight > minValue
                ? (maxFontSize * (weight - minValue)) / (maxValue - minValue)
                : 0;

            fontSize = (fontSize * 100) / maxFontSize;

            fontSize = (fontSize * (maxFontSize - minFontSize)) / 100 + minFontSize;

            return fontSize;
        }

        private getAngle(): number {
            if (!this.settings ||
                !this.settings.isRotateText)
                return 0;

            let minAngle: number,
                maxAngle: number,
                maxNumberOfOrientations: number,
                angle: number;

            maxNumberOfOrientations = Math.abs(this.parseNumber(this.settings.maxNumberOfOrientations, 0));

            minAngle = this.parseNumber(
                this.settings.minAngle,
                0,
                WordCloud.MinAngle,
                WordCloud.MaxAngle);

            maxAngle = this.parseNumber(
                this.settings.maxAngle,
                0,
                WordCloud.MinAngle,
                WordCloud.MaxAngle);

            if (minAngle > maxAngle) {
                let buffer: number = minAngle;

                minAngle = maxAngle;
                maxAngle = buffer;
            }

            angle = Math.abs(((maxAngle - minAngle) / maxNumberOfOrientations) * Math.floor(Math.random() * maxNumberOfOrientations));

            return maxNumberOfOrientations !== 0 ? minAngle + angle : 0;
        }

        public update(visualUpdateOptions: VisualUpdateOptions): void {
            if (!visualUpdateOptions ||
                !visualUpdateOptions.viewport ||
                !visualUpdateOptions.dataViews ||
                !visualUpdateOptions.dataViews[0] ||
                !visualUpdateOptions.viewport ||
                !(visualUpdateOptions.viewport.height >= 0) ||
                !(visualUpdateOptions.viewport.width >= 0))
                return;

            if (visualUpdateOptions !== this.visualUpdateOptions)
                this.incomingUpdateOptions = visualUpdateOptions;

            if (!this.isUpdating && (this.incomingUpdateOptions !== this.visualUpdateOptions)) {
                this.visualUpdateOptions = this.incomingUpdateOptions;
                this.layout.viewport = this.visualUpdateOptions.viewport;
                let dataView: DataView = visualUpdateOptions.dataViews[0];

                if (this.layout.viewportInIsZero)
                    return;

                this.durationAnimations = getAnimationDuration(
                    this.animator,
                    visualUpdateOptions.suppressAnimations);
                this.UpdateSize();

                this.data = this.converter(dataView);
                if (!this.data)
                    return;

                this.settings = this.data.settings;
                this.wordCloudTexts = this.data.texts;

                this.computePositions(
                    this.getWords(this.getReducedText(this.data.texts)),
                    (wordCloudDataView: WordCloudDataView) => this.render(wordCloudDataView));
            }
        }

        private UpdateSize(): void {
            let fakeWidth: number,
                fakeHeight: number,
                ratio: number;

            ratio = Math.sqrt((this.fakeViewport.width * this.fakeViewport.height)
                / (this.layout.viewportIn.width * this.layout.viewportIn.height));

            if (isNaN(ratio))
                fakeHeight = fakeWidth = 1;
            else {
                fakeHeight = this.layout.viewportIn.height * ratio;
                fakeWidth = this.layout.viewportIn.width * ratio;
            }

            this.specialViewport = {
                height: fakeHeight,
                width: fakeWidth
            };

            this.root.attr({
                "height": this.layout.viewport.height,
                "width": this.layout.viewport.width
            });
        }

        private render(wordCloudDataView: WordCloudDataView): void {
            if (!wordCloudDataView ||
                !wordCloudDataView.data)
                return;

            this.wordCloudDataView = wordCloudDataView;

            let animatedWordSelection: D3.Selection,
                wordElements: D3.Selection = this.main
                    .select(WordCloud.Words.selector)
                    .selectAll(WordCloud.Word.selector);

            this.wordsSelection = wordElements.data(wordCloudDataView.data);

            (<D3.UpdateSelection>this.animation(this.wordsSelection, this.durationAnimations))
                .attr("transform", (item: WordCloudDataPoint) => `${SVGUtil.translate(item.x, item.y)}rotate(${item.rotate})`)
                .style({
                    "font-size": ((item: WordCloudDataPoint): string => `${item.size}${WordCloud.Size}`),
                    "fill": ((item: WordCloudDataPoint): string => item.color),
                });

            animatedWordSelection = this.wordsSelection
                .enter()
                .append("svg:text")
                .attr("transform", (item: WordCloudDataPoint) => `${SVGUtil.translate(item.x, item.y)}rotate(${item.rotate})`)
                .style("font-size", "1px");

            this.wordsSelection.on("click", (item: WordCloudDataPoint) => {
                this.selectionManager
                    .select(item.selectionId, d3.event.ctrlKey)
                    .then(() => this.setSelection(this.wordsSelection));
                d3.event.stopPropagation();
            });

            (<D3.UpdateSelection>this.animation(animatedWordSelection, this.durationAnimations))
                .style({
                    "font-size": ((item: WordCloudDataPoint): string => `${item.size}${WordCloud.Size}`),
                    "fill": ((item: WordCloudDataPoint): string => item.color),
                });

            this.wordsSelection
                .text((item: WordCloudDataPoint) => item.text)
                .classed(WordCloud.Word["class"], true);

            this.wordsSelection.exit().remove();
            this.setSelection(this.wordsSelection);

            setTimeout(() => {
                if (this.root)
                    this.scaleMainView(wordCloudDataView, wordElements[0].length && this.durationAnimations);

                this.isUpdating = false;

                if (this.incomingUpdateOptions !== this.visualUpdateOptions)
                    this.update(this.incomingUpdateOptions);

            }, this.durationAnimations + WordCloud.RenderDelay);
        }

        private setSelection(selection: D3.Selection): void {
            let selectionIds: SelectionId[] = this.selectionManager.getSelectionIds();

            if (selectionIds.some(x => !selection.data().some((d: WordCloudDataPoint) => d.selectionId.getKey() === x.getKey()))) {
                this.selectionManager.clear();
                selectionIds = [];
            }

            if (!selectionIds.length) {
                this.setOpacity(selection, WordCloud.MaxOpacity, true);
                return;
            }

            let selectedColumns: D3.UpdateSelection = selection.filter((x: WordCloudDataPoint) =>
                selectionIds.some((y: SelectionId) => y.getKey() === x.selectionId.getKey()));

            this.setOpacity(selection, WordCloud.MinOpacity);
            this.setOpacity(selectedColumns, WordCloud.MaxOpacity);
        }

        private setOpacity(element: D3.Selection, opacityValue: number, disableAnimation: boolean = false): void {
            let elementAnimation = disableAnimation ? element : this.animation(element);
            elementAnimation.style("fill-opacity", opacityValue);
        }

        private scaleMainView(wordCloudDataView: WordCloudDataView, durationAnimation: number = 0): void {
            if (!wordCloudDataView ||
                !wordCloudDataView.leftBorder ||
                !wordCloudDataView.rightBorder)
                return;

            let scale: number = 1,
                mainSVGRect: SVGRect = this.main.node()["getBBox"](),
                leftBorder: IPoint = wordCloudDataView.leftBorder,
                rightBorder: IPoint = wordCloudDataView.rightBorder,
                width2: number,
                height2: number,
                scaleByX: number,
                scaleByY: number;

            scaleByX = this.layout.viewportIn.width / Math.abs(leftBorder.x - rightBorder.x);
            scaleByY = this.layout.viewportIn.height / Math.abs(leftBorder.y - rightBorder.y);

            scale = Math.min(scaleByX, scaleByY);

            width2 = this.layout.margin.left + (mainSVGRect.x * scale * -1)
                + (this.layout.viewportIn.width - (mainSVGRect.width * scale)) / 2;
            height2 = this.layout.margin.top + (mainSVGRect.y * scale * -1)
                + (this.layout.viewportIn.height - (mainSVGRect.height * scale)) / 2;

            (<D3.Selection>this.animation(this.main, durationAnimation))
                .attr("transform", `${SVGUtil.translate(width2, height2)}scale(${scale})`);
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] {
            let instances: VisualObjectInstance[] = [];

            if (!this.settings)
                return instances;

            switch (options.objectName) {
                case "general": {
                    let general: VisualObjectInstance = {
                        objectName: "general",
                        displayName: "general",
                        selector: null,
                        properties: {
                            maxNumberOfWords: this.settings.maxNumberOfWords,
                            minFontSize: this.settings.minFontSize,
                            maxFontSize: this.settings.maxFontSize,
                            isBrokenText: this.settings.isBrokenText
                        }
                    };

                    instances.push(general);
                    break;
                }
                case "dataPoint": {
                    if (!this.wordCloudDataView ||
                        !this.wordCloudDataView.data)
                        return;

                    let dataPoints: WordCloudDataPoint[] = this.dataBeforeRender;
                    let wordCategoriesIndex: number[] = [];
                    dataPoints.forEach((item: WordCloudDataPoint) => {
                        if (wordCategoriesIndex.indexOf(item.wordIndex) === -1) {
                            wordCategoriesIndex.push(item.wordIndex);
                            instances.push({
                                objectName: "dataPoint",
                                displayName: this.data.texts[item.wordIndex].text,
                                selector: ColorHelper.normalizeSelector(item.selectionId.getSelector(), false),
                                properties: {
                                    fill: { solid: { color: item.color } }
                                }
                            });
                        }
                    });

                    break;
                }
                case "rotateText": {
                    let rotateText: VisualObjectInstance = {
                        objectName: "rotateText",
                        displayName: "Rotate Text",
                        selector: null,
                        properties: {
                            show: this.settings.isRotateText,
                            minAngle: this.settings.minAngle,
                            maxAngle: this.settings.maxAngle,
                            maxNumberOfOrientations: this.settings.maxNumberOfOrientations
                        }
                    };

                    instances.push(rotateText);
                    break;
                }
                case "stopWords": {
                    let stopWords: VisualObjectInstance = {
                        objectName: "stopWords",
                        displayName: "Stop Words",
                        selector: null,
                        properties: {
                            show: this.settings.isRemoveStopWords,
                            isDefaultStopWords: this.settings.isDefaultStopWords,
                            words: this.settings.stopWords ||
                            this.settings.stopWordsArray.join(WordCloud.StopWordsDelemiter)
                        }
                    };

                    instances.push(stopWords);
                    break;
                }
            }

            return instances;
        }

        private animation(
            element: D3.Selection,
            duration: number = 0,
            callback?: (data: any, index: number) => void): D3.Transition.Transition | D3.Selection {
            return element
                .transition()
                .duration(duration)
                .each("end", callback);
        }

        public destroy(): void {
            this.root = null;
            this.canvas = null;
        }
    }

    module explore.util {
        export function hexToRgb(hex): string {
            // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
            let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            hex = hex.replace(shorthandRegex, function (m, r, g, b) {
                return r + r + g + g + b + b;
            });

            let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? `rgb(${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)})` : null;
        }

        export function getRandomColor(): string {
            let red: number = Math.floor(Math.random() * 255),
                green: number = Math.floor(Math.random() * 255),
                blue: number = Math.floor(Math.random() * 255);

            return `rgb(${red},${green},${blue})`;
        }
    }
}