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

module powerbi.visuals.samples {
    import SelectionManager = utility.SelectionManager;
    import ValueFormatter = powerbi.visuals.valueFormatter;
    import ClassAndSelector = jsCommon.CssConstants.ClassAndSelector;
    import getAnimationDuration = AnimatorCommon.GetAnimationDuration;
    import createClassAndSelector = jsCommon.CssConstants.createClassAndSelector;
    import PixelConverter = jsCommon.PixelConverter;

    type D3Element =
        D3.UpdateSelection |
        D3.Selection |
        D3.Selectors |
        D3.Transition.Transition;

    export interface HistogramConstructorOptions {
        svg?: D3.Selection;
        animator?: IGenericAnimator;
        margin?: IMargin;
    }

    export interface HistogramSettings {
        displayName?: string;
        fillColor?: string;
        frequency: boolean;
        bins?: number;
        precision: number;
        xAxisColor?: string;
        xDisplayUnits?: number;
        xPrecision?: number;
        xTitle?: boolean;
        xShow?: boolean;
        xStyle?: string;
        yAxisColor?: string;
        yTitle?: boolean;
        yDisplayUnits?: number;
        yPrecision?: number;
        yShow?: boolean;
        yStyle?: string;
        yStart?: number;
        yEnd?: number;
        yPosition?: string;
        labelShow?: boolean;
        labelColor?: string;
        labelDisplayUnit?: number;
        labelPrecision?: number;
        labelFontSize?: number;
    }

    export interface HistogramData extends D3.Layout.Bin, TooltipEnabledDataPoint {
        range: number[];
        selectionIds: SelectionId[];
    }

    export interface HistogramDataView {
        data: HistogramData[];
        xScale?: D3.Scale.LinearScale;
        yScale?: D3.Scale.LinearScale;
        settings: HistogramSettings;
        formatter: IValueFormatter;
        xLabelFormatter?: IValueFormatter;
        yLabelFormatter?: IValueFormatter;
    }

    interface HistogramValue {
        value: number;
        selectionId: SelectionId;
        frequency: number;
    }

    interface Legend {
        text: string;
        transform?: string;
        dx?: string;
        dy?: string;
    }

    interface Brackets {
        left: string;
        right: string;
    }

    interface HistogramProperty {
        [propertyName: string]: DataViewObjectPropertyIdentifier;
    }

    interface HistogramProperties {
        [objectName: string]: HistogramProperty;
    }

      export class HistogramChartWarning implements IVisualWarning {
          public static ErrorInvalidDataValues: string = "Some data values are invalid or too big";
  
          private message: string;
          constructor(message: string) {
              this.message = message;
          }
  
          public get code(): string {
              return "BulletChartWarning";
          }
  
          public getMessages(resourceProvider: jsCommon.IStringResourceProvider): IVisualErrorMessage {
              return {
                  message: this.message,
                  title: resourceProvider.get(""),
                  detail: resourceProvider.get("")
              };
          }
      }

    export class Histogram implements IVisual {
        private static ClassName: string = "histogram";
        private static FrequencyText: string = "Frequency";
        private static DensityText: string = "Density";

        private static Properties: HistogramProperties = {
            general: {
                bins: {
                    objectName: "general",
                    propertyName: "bins"
                },
                frequency: {
                    objectName: "general",
                    propertyName: "frequency"
                },
                formatString: {
                    objectName: "general",
                    propertyName: "formatString"
                }
            },
            dataPoint: {
                fill: {
                    objectName: "dataPoint",
                    propertyName: "fill"
                }
            },
            labels: {
                show: {
                    objectName: "labels",
                    propertyName: "show"
                },
                color: {
                    objectName: "labels",
                    propertyName: "color"
                },
                labelDisplayUnits: {
                    objectName: "labels",
                    propertyName: "labelDisplayUnits"
                },
                labelPrecision: {
                    objectName: "labels",
                    propertyName: "labelPrecision"
                },
                fontSize: {
                    objectName: "labels",
                    propertyName: "fontSize"
                }
            },
            xAxis: {
                show: {
                    objectName: "xAxis",
                    propertyName: "show"
                },
                axisColor: {
                    objectName: "xAxis",
                    propertyName: "axisColor"
                },
                title: {
                    objectName: "xAxis",
                    propertyName: "title"
                },
                displayUnits: {
                    objectName: "xAxis",
                    propertyName: "displayUnits"
                },
                precision: {
                    objectName: "xAxis",
                    propertyName: "precision"
                },
                style: {
                    objectName: "xAxis",
                    propertyName: "style"
                }
            },
            yAxis: {
                show: {
                    objectName: "yAxis",
                    propertyName: "show"
                },
                axisColor: {
                    objectName: "yAxis",
                    propertyName: "axisColor"
                },
                title: {
                    objectName: "yAxis",
                    propertyName: "title"
                },
                displayUnits: {
                    objectName: "yAxis",
                    propertyName: "displayUnits"
                },
                precision: {
                    objectName: "yAxis",
                    propertyName: "precision"
                },
                style: {
                    objectName: "yAxis",
                    propertyName: "style"
                },
                start: {
                    objectName: "yAxis",
                    propertyName: "start"
                },
                end: {
                    objectName: "yAxis",
                    propertyName: "end"
                },
                position: {
                    objectName: "yAxis",
                    propertyName: "position"
                }
            }
        };

        private static DefaultHistogramSettings: HistogramSettings = {
            frequency: true,
            displayName: "Histogram",
            bins: null,
            fillColor: "#5f9ea0",
            precision: 2,
            xShow: true,
            xAxisColor: "#5f9ea0",
            yAxisColor: "#5f9ea0",
            xTitle: true,
            xDisplayUnits: 0,
            xPrecision: 2,
            xStyle: axisStyle.showTitleOnly,
            yTitle: true,
            yDisplayUnits: 0,
            yPrecision: 2,
            yShow: true,
            yStyle: axisStyle.showTitleOnly,
            yStart: 0,
            yPosition: yAxisPosition.left,
            labelShow: false,
            labelColor: "#5f9ea0",
            labelDisplayUnit: 0,
            labelPrecision: 2,
            labelFontSize: 9
        };

        private static Axes: ClassAndSelector = createClassAndSelector('axes');
        private static Axis: ClassAndSelector = createClassAndSelector('axis');
        private static Labels: ClassAndSelector = createClassAndSelector('labels');
        private static Columns: ClassAndSelector = createClassAndSelector('columns');
        private static Column: ClassAndSelector = createClassAndSelector('column');
        private static Legends: ClassAndSelector = createClassAndSelector('legends');
        private static Legend: ClassAndSelector = createClassAndSelector('legend');

        public static capabilities: VisualCapabilities = {
            dataRoles: [{
                name: "Values",
                kind: VisualDataRoleKind.Grouping,
                displayName: data.createDisplayNameGetter("Role_DisplayName_Values")
            }, {
                    name: "Frequency",
                    kind: VisualDataRoleKind.Measure,
                    displayName: "Frequency"
                }],
            dataViewMappings: [{
                conditions: [{ "Values": { min: 1, max: 1 }, "Frequency": { min: 0, max: 1 } }],
                categorical: {
                    categories: {
                        bind: { to: "Values" },
                        dataReductionAlgorithm: { top: {} }
                    },
                    values: { for: { in: "Frequency" } }
                }
            }],
            sorting: {
                implicit: {
                    clauses: [{ role: "Values", direction: 1 /*SortDirection.Ascending*/ }] //Constant SortDirection.Ascending currently is not supported on the msit
                }
            },
            objects: {
                general: {
                    displayName: "General",
                    properties: {
                        formatString: { type: { formatting: { formatString: true } } },
                        bins: {
                            displayName: "Bins",
                            type: { numeric: true }
                        },
                        frequency: {
                            displayName: "Frequency",
                            type: { bool: true }
                        }
                    },
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
                xAxis: {
                    displayName: 'X-Axis',
                    properties: {
                        show: {
                            displayName: "Show",
                            type: { bool: true },
                        },
                        axis: {
                            displayName: 'Axis',
                            type: { bool: true }
                        },
                        axisColor: {
                            displayName: "Color",
                            type: { fill: { solid: { color: true } } }
                        },
                        title: {
                            displayName: "Title",
                            type: { bool: true }
                        },
                        displayUnits: {
                            displayName: "Display Units",
                            type: { formatting: { labelDisplayUnits: true } }
                        },
                        precision: {
                            displayName: "Decimal Places",
                            type: { numeric: true },
                        },
                        style: {
                            displayName: "Style",
                            type: { enumeration: axisStyle.type }
                        },
                    }
                },
                yAxis: {
                    displayName: 'Y-Axis',
                    properties: {
                        show: {
                            displayName: "Show",
                            type: { bool: true },
                        },
                        axis: {
                            displayName: 'yAxis',
                            type: { bool: true }
                        },
                        axisColor: {
                            displayName: "Color",
                            type: { fill: { solid: { color: true } } }
                        },
                        title: {
                            displayName: "Title",
                            type: { bool: true }
                        },
                        displayUnits: {
                            displayName: "Display Units",
                            type: { formatting: { labelDisplayUnits: true } }
                        },
                        precision: {
                            displayName: "Decimal Places",
                            type: { numeric: true },
                        },
                        style: {
                            displayName: "Style",
                            type: { enumeration: axisStyle.type }
                        },
                        start: {
                            displayName: "Start",
                            type: { numeric: true },
                            placeHolderText: "Start",
                            suppressFormatPainterCopy: true,
                        },
                        end: {
                            displayName: "End",
                            type: { numeric: true },
                            placeHolderText: "End",
                            suppressFormatPainterCopy: true,
                        },
                        position: {
                            displayName: "Position",
                            type: { enumeration: yAxisPosition.type },
                        },
                    }
                },
                labels: {
                    displayName: "Data Labels",
                    properties: {
                        show: {
                            displayName: "Show",
                            type: { bool: true }
                        },
                        color: {
                            displayName: "Color",
                            type: { fill: { solid: { color: true } } }
                        },
                        labelDisplayUnits: {
                            displayName: "Display Units",
                            type: { formatting: { labelDisplayUnits: true } },
                            suppressFormatPainterCopy: true
                        },
                        labelPrecision: {
                            displayName: "Decimal Places",
                            type: { numeric: true },
                            suppressFormatPainterCopy: true
                        },
                        fontSize: {
                            displayName: "Text Size",
                            type: { formatting: { fontSize: true } }
                        },
                    },
                },
            }
        };

        private ColumnPadding: number = 1;
        private MinColumnHeight: number = 1;
        private MinOpacity: number = 0.3;
        private MaxOpacity: number = 1;
        private NumberOfLabelsOnAxisY: number = 5;
        private MinNumberOfBins: number = 0;
        private MaxNumberOfBins: number = 100;
        private MinPrecision: number = 0;
        private MaxPrecision: number = 17; // max number of decimals in float
        private TooltipDisplayName: string = "Range";
        private SeparatorNumbers: string = ", ";
        private LegendSize: number = 50;
        private AxisSize: number = 30;
        private DataLabelMargin: number = 0;
        private widthOfColumn: number = 0;
        private yTitleMargin: number = 0;

        private ExcludeBrackets: Brackets = {
            left: "(",
            right: ")"
        };

        private IncludeBrackets: Brackets = {
            left: "[",
            right: "]"
        };

        private margin: IMargin = {
            top: 10,
            right: 10,
            bottom: 10,
            left: 10
        };

        private durationAnimations: number = 200;

        private viewport: IViewport;
        private hostService: IVisualHostServices;
        private selectionManager: SelectionManager;
        private colors: IDataColorPalette;
        private root: D3.Selection;
        private svg: D3.Selection;
        private main: D3.Selection;
        private axes: D3.Selection;
        private axisX: D3.Selection;
        private axisY: D3.Selection;
        private legend: D3.Selection;
        private columns: D3.Selection;
        private labels: D3.Selection;

        private histogramDataView: HistogramDataView;

        private animator: IGenericAnimator;

        private get columnsSelection(): D3.Selection {
            return this.main.select(Histogram.Columns.selector)
                .selectAll(Histogram.Column.selector);
        }

        constructor(histogramConstructorOptions?: HistogramConstructorOptions) {
            if (histogramConstructorOptions) {
                if (histogramConstructorOptions.svg) {
                    this.svg = histogramConstructorOptions.svg;
                }

                if (histogramConstructorOptions.animator) {
                    this.animator = histogramConstructorOptions.animator;
                }

                this.margin = histogramConstructorOptions.margin || this.margin;
            }
        }

        public init(visualsOptions: VisualInitOptions): void {
            this.hostService = visualsOptions.host;

            if (this.svg) {
                this.root = this.svg;
            } else {
                this.root = d3.select(visualsOptions.element.get(0))
                    .append("svg");
            }

            let style: IVisualStyle = visualsOptions.style;

            this.colors = style && style.colorPalette
                ? style.colorPalette.dataColors
                : new DataColorPalette();

            this.root.classed(Histogram.ClassName, true);

            this.main = this.root.append("g");

            this.axes = this.main
                .append("g")
                .classed(Histogram.Axes["class"], true);

            this.axisX = this.axes
                .append("g")
                .classed(Histogram.Axis["class"], true);

            this.axisY = this.axes
                .append("g")
                .classed(Histogram.Axis["class"], true);

            this.legend = this.main
                .append("g")
                .classed(Histogram.Legends["class"], true);

            this.columns = this.main
                .append("g")
                .classed(Histogram.Columns["class"], true);

            this.labels = this.main
                .append("g")
                .classed(Histogram.Labels["class"], true);
            this.selectionManager = new SelectionManager({ hostServices: visualsOptions.host });
        }

        public converter(dataView: DataView): HistogramDataView {
            if (!dataView ||
                !dataView.categorical ||
                !dataView.categorical.categories ||
                !dataView.categorical.categories[0] ||
                !dataView.categorical.categories[0].values ||
                !(dataView.categorical.categories[0].values.length > 0)) {
                return null;
            }

            let settings: HistogramSettings,
                histogramLayout: D3.Layout.HistogramLayout,
                values: HistogramValue[],
                numericalValues: number[] = [],
                data: D3.Layout.Bin[],
                xScale: D3.Scale.LinearScale,
                yScale: D3.Scale.LinearScale,
                valueFormatter: IValueFormatter,
                frequencies: number[] = [],
                identities: DataViewScopeIdentity[] = [],
                shiftByValues: number = 0,
                sumFrequency: number = 0,
                xLabelFormatter: IValueFormatter,
                yLabelFormatter: IValueFormatter;

            if (dataView.categorical.values &&
                dataView.categorical.values[0] &&
                dataView.categorical.values[0].values) {
                frequencies = dataView.categorical.values[0].values;
            }

            if (dataView.categorical.categories[0].identity
                && dataView.categorical.categories[0].identity.length > 0) {
                identities = dataView.categorical.categories[0].identity;
            }

            settings = this.parseSettings(dataView);

            if (!settings) {
                return null;
            }

            values = this.getValuesByFrequencies(
                dataView.categorical.categories[0].values,
                frequencies,
                identities);
            values.forEach((value: HistogramValue) => {
                numericalValues.push(value.value);
                sumFrequency += value.frequency;
            });

            histogramLayout = d3.layout.histogram();

            if (settings.bins && settings.bins > this.MinNumberOfBins) {
                histogramLayout = histogramLayout.bins(settings.bins);
            }

            data = histogramLayout.frequency(settings.frequency)(numericalValues);

            data.forEach((bin: D3.Layout.Bin, index: number) => {
                let filteredValues: HistogramValue[],
                    frequency: number;

                filteredValues = values.filter((value: HistogramValue) => {
                    return this.isValueContainedInRange(value, bin, index);
                });

                frequency = filteredValues.reduce((previousValue: number, currentValue: HistogramValue): number => {
                    return previousValue + currentValue.frequency;
                }, 0);

                bin.y = settings.frequency
                    ? frequency
                    : frequency / sumFrequency;

                shiftByValues += bin.length;
            });

            let maxYvalue = settings.yEnd !== null && settings.yEnd > settings.yStart ? settings.yEnd : d3.max(data, (item: D3.Layout.Bin) => item.y);
            let minYValue = settings.yStart < maxYvalue ? settings.yStart : 0;
            settings.yEnd = maxYvalue;

            xScale = d3.scale.linear()
                .domain([
                    d3.min(data, (item: D3.Layout.Bin) => d3.min(item)),
                    d3.max(data, (item: D3.Layout.Bin) => d3.max(item))
                ])
                .range([0, this.viewport.width - this.LegendSize - this.AxisSize]);

            yScale = d3.scale.linear()
                .domain([
                    minYValue,
                    maxYvalue
                ])
                .range([this.viewport.height - this.LegendSize, 0]);

            valueFormatter = ValueFormatter.create({
                format: ValueFormatter.getFormatString(
                    dataView.categorical.categories[0].source, Histogram.Properties["general"]["formatString"]),
                value: values[0].value,
                value2: values[values.length - 1].value,
                precision: settings.precision
            });

            xLabelFormatter = ValueFormatter.create({
                value: settings.xDisplayUnits === 0 ? values[0].value : settings.xDisplayUnits,
                precision: settings.xPrecision
            });

            yLabelFormatter = ValueFormatter.create({
                value: settings.yDisplayUnits,
                precision: settings.yPrecision
            });

            return {
                xScale: xScale,
                yScale: yScale,
                settings: settings,
                data: this.getData(values, numericalValues, data, settings, valueFormatter),
                formatter: valueFormatter,
                xLabelFormatter: xLabelFormatter,
                yLabelFormatter: yLabelFormatter
            };
        }

        private getValuesByFrequencies(sourceValues: number[], frequencies: number[], identities: DataViewScopeIdentity[]): HistogramValue[] {
            let values: HistogramValue[] = [];

            sourceValues.forEach((item: number, index: number) => {
                let frequency: number = 1,
                    value: number = Number(item);

                value = isNaN(value) ? 0 : value;

                if (frequencies
                    && frequencies[index]
                    && !isNaN(frequencies[index])
                    && frequencies[index] > 1) {
                    frequency = frequencies[index];
                }

                values.push({
                    value: value,
                    frequency: frequency,
                    selectionId: SelectionId.createWithId(identities[index])
                });
            });

            return values;
        }

        private getData(
            values: HistogramValue[],
            numericalValues: number[],
            data: D3.Layout.Bin[],
            settings: HistogramSettings,
            valueFormatter: IValueFormatter): HistogramData[] {
            let minValue: number = d3.min(numericalValues),
                maxValue: number = d3.max(numericalValues);
            let fontSizeInPx = PixelConverter.fromPoint(settings.labelFontSize);

            return data.map((bin: any, index: number): HistogramData => {
                bin.range = this.getRange(minValue, maxValue, bin.dx, index);
                bin.tooltipInfo = this.getTooltipData(bin.y, bin.range, settings, index === 0, valueFormatter);
                bin.selectionIds = this.getSelectionIds(values, bin, index);
                bin.labelFontSize = fontSizeInPx;
                return bin;
            });
        }

        private getRange(minValue: number, maxValue: number, step: number, index: number): number[] {
            let leftBorder: number = minValue + index * step,
                rightBorder: number = leftBorder + step;

            return [leftBorder, rightBorder];
        }

        private getTooltipData(
            value: number,
            range: number[],
            settings: HistogramSettings,
            includeLeftBorder: boolean,
            valueFormatter: IValueFormatter): TooltipDataItem[] {

            return [{
                displayName: this.getLegendText(settings),
                value: valueFormatter.format(value)
            }, {
                    displayName: this.TooltipDisplayName,
                    value: this.rangeToString(range, includeLeftBorder, valueFormatter)
                }];
        }

        private getSelectionIds(values: HistogramValue[], bin: HistogramData, index: number): SelectionId[] {
            let selectionIds: SelectionId[] = [];

            values.forEach((value: HistogramValue) => {
                if (this.isValueContainedInRange(value, bin, index)) {
                    selectionIds.push(value.selectionId);
                }
            });

            return selectionIds;
        }

        private isValueContainedInRange(value: HistogramValue, bin: D3.Layout.Bin, index: number): boolean {
            return ((index === 0 && value.value >= bin.x) || (value.value > bin.x)) && value.value <= bin.x + bin.dx;
        }

        private parseSettings(dataView: DataView): HistogramSettings {
            if (!dataView ||
                !dataView.metadata ||
                !dataView.metadata.columns ||
                !dataView.metadata.columns[0]) {
                return null;
            }

            let histogramSettings: HistogramSettings = <HistogramSettings>{},
                objects: DataViewObjects,
                colorHelper: ColorHelper;

            colorHelper = new ColorHelper(
                this.colors,
                Histogram.Properties["dataPoint"]["fill"],
                Histogram.DefaultHistogramSettings.fillColor);

            histogramSettings.displayName =
            dataView.metadata.columns[0].displayName || Histogram.DefaultHistogramSettings.displayName;

            objects = this.getObjectsFromDataView(dataView);

            histogramSettings.fillColor = colorHelper.getColorForMeasure(objects, "");
            histogramSettings.bins = this.getBins(objects);
            histogramSettings.frequency = this.getFrequency(objects);
            histogramSettings.precision = this.getPrecision(objects);
            histogramSettings.xAxisColor = this.getXAxisColor(objects).solid.color;
            histogramSettings.xTitle = this.getXTitle(objects);
            histogramSettings.yAxisColor = this.getYAxisColor(objects).solid.color;
            histogramSettings.yTitle = this.getYTitle(objects);
            histogramSettings.xPrecision = this.getXPrecision(objects);
            histogramSettings.xStyle = this.getXStyle(objects);
            histogramSettings.xDisplayUnits = this.getXDisplayUnit(objects);
            histogramSettings.displayName = this.setLegend(histogramSettings.displayName, histogramSettings.xStyle, histogramSettings.xDisplayUnits);
            histogramSettings.yStyle = this.getYStyle(objects);
            histogramSettings.yDisplayUnits = this.getYDisplayUnit(objects);
            histogramSettings.yPrecision = this.getYPrecision(objects);
            histogramSettings.xShow = this.getXAxisShow(objects);
            histogramSettings.yShow = this.getYAxisShow(objects);
            histogramSettings.yStart = this.getYStart(objects);
            histogramSettings.yEnd = this.getYEnd(objects);
            histogramSettings.yPosition = this.getYPosition(objects);
            histogramSettings.labelShow = this.getLabelShow(objects);
            histogramSettings.labelColor = this.getLabelColor(objects).solid.color;
            histogramSettings.labelDisplayUnit = this.getLabelDisplayUnit(objects);
            histogramSettings.labelPrecision = this.getLabelPrecision(objects);
            histogramSettings.labelFontSize = this.getLabelFontSize(objects);

            return histogramSettings;
        }

        private setLegend(title, style, displayUnit): string {
            let retValue: string;
            let formatter: IValueFormatter = ValueFormatter.create({
                value: displayUnit
            });

            switch (style) {
                case axisStyle.showTitleOnly:
                    retValue = title;
                    break;
                case axisStyle.showUnitOnly:
                    retValue = displayUnit === 0 || displayUnit === 1 ? title : formatter.displayUnit.title;
                    break;
                case axisStyle.showBoth:
                    retValue = displayUnit === 0 || displayUnit === 1 ? title : title + " (" + formatter.displayUnit.title + ")";
                    break;
            }
            return retValue;
        }

        private getLabelFontSize(objects: DataViewObjects) {
            return DataViewObjects.getValue<number>(
                objects,
                Histogram.Properties["labels"]["fontSize"],
                Histogram.DefaultHistogramSettings.labelFontSize
            );
        }

        private getLabelShow(objects: DataViewObjects) {
            return DataViewObjects.getValue<boolean>(
                objects,
                Histogram.Properties["labels"]["show"],
                Histogram.DefaultHistogramSettings.labelShow
            );
        }
        private getLabelColor(objects: DataViewObjects) {
            return DataViewObjects.getValue<Fill>(
                objects,
                Histogram.Properties["labels"]["color"],
                {
                    solid: {
                        color: Histogram.DefaultHistogramSettings.labelColor
                    }
                }
            );
        }
        private getLabelDisplayUnit(objects: DataViewObjects) {
            return DataViewObjects.getValue<number>(
                objects,
                Histogram.Properties["labels"]["labelDisplayUnits"],
                Histogram.DefaultHistogramSettings.labelDisplayUnit
            );
        }
        private getLabelPrecision(objects: DataViewObjects) {
            return DataViewObjects.getValue<number>(
                objects,
                Histogram.Properties["labels"]["labelPrecision"],
                Histogram.DefaultHistogramSettings.labelPrecision
            );
        }

        private getXStyle(objects: DataViewObjects) {
            return DataViewObjects.getValue<string>(
                objects,
                Histogram.Properties["xAxis"]["style"],
                Histogram.DefaultHistogramSettings.xStyle
            );
        }

        private getXDisplayUnit(objects: DataViewObjects) {
            return DataViewObjects.getValue<number>(
                objects,
                Histogram.Properties["xAxis"]["displayUnits"],
                Histogram.DefaultHistogramSettings.xDisplayUnits
            );
        }

        private getXPrecision(objects: DataViewObjects): number {
            let precision: number = DataViewObjects.getValue(
                objects,
                Histogram.Properties["xAxis"]["precision"],
                Histogram.DefaultHistogramSettings.xPrecision);

            if (precision <= this.MinPrecision)
                return this.MinPrecision;

            if (precision >= this.MaxPrecision)
                return this.MaxPrecision;

            return precision;
        }

        private getXAxisShow(objects: DataViewObjects) {
            return DataViewObjects.getValue<boolean>(
                objects,
                Histogram.Properties["xAxis"]["show"],
                Histogram.DefaultHistogramSettings.xShow
            );
        }

        private getXAxisColor(objects: DataViewObjects) {
            return DataViewObjects.getValue<Fill>(
                objects,
                Histogram.Properties["xAxis"]["axisColor"],
                {
                    solid: {
                        color: Histogram.DefaultHistogramSettings.xAxisColor
                    }
                }
            );
        }

        private getXTitle(objects: DataViewObjects): boolean {
            return DataViewObjects.getValue<boolean>(
                objects,
                Histogram.Properties["xAxis"]["title"],
                Histogram.DefaultHistogramSettings.xTitle);
        }

        private getYStyle(objects: DataViewObjects) {
            return DataViewObjects.getValue<string>(
                objects,
                Histogram.Properties["yAxis"]["style"],
                Histogram.DefaultHistogramSettings.yStyle
            );
        }

        private getYPosition(objects: DataViewObjects) {
            return DataViewObjects.getValue<string>(
                objects,
                Histogram.Properties["yAxis"]["position"],
                Histogram.DefaultHistogramSettings.yPosition
            );
        }

        private getYAxisShow(objects: DataViewObjects) {
            return DataViewObjects.getValue<boolean>(
                objects,
                Histogram.Properties["yAxis"]["show"],
                Histogram.DefaultHistogramSettings.yShow
            );
        }

        private getYAxisColor(objects: DataViewObjects) {
            return DataViewObjects.getValue<Fill>(
                objects,
                Histogram.Properties["yAxis"]["axisColor"],
                {
                    solid: {
                        color: Histogram.DefaultHistogramSettings.yAxisColor
                    }
                }
            );
        }

        private getYStart(objects: DataViewObjects) {
            return DataViewObjects.getValue<number>(
                objects,
                Histogram.Properties["yAxis"]["start"],
                Histogram.DefaultHistogramSettings.yStart
            );
        }

        private getYEnd(objects: DataViewObjects) {
            return DataViewObjects.getValue<number>(
                objects,
                Histogram.Properties["yAxis"]["end"],
                Histogram.DefaultHistogramSettings.yEnd
            );
        }

        private getYDisplayUnit(objects: DataViewObjects) {
            return DataViewObjects.getValue<number>(
                objects,
                Histogram.Properties["yAxis"]["displayUnits"],
                Histogram.DefaultHistogramSettings.yDisplayUnits
            );
        }

        private getYPrecision(objects: DataViewObjects): number {
            let precision: number = DataViewObjects.getValue(
                objects,
                Histogram.Properties["yAxis"]["precision"],
                Histogram.DefaultHistogramSettings.yPrecision);

            if (precision <= this.MinPrecision) {
                return this.MinPrecision;
            }

            if (precision >= this.MaxPrecision) {
                return this.MaxPrecision;
            }

            return precision;
        }

        private getYTitle(objects: DataViewObjects): boolean {
            return DataViewObjects.getValue<boolean>(
                objects,
                Histogram.Properties["yAxis"]["title"],
                Histogram.DefaultHistogramSettings.yTitle);
        }

        private getBins(objects: DataViewObjects): number {
            let binsNumber: number;

            binsNumber = Number(DataViewObjects.getValue<number>(
                objects,
                Histogram.Properties["general"]["bins"],
                Histogram.DefaultHistogramSettings.bins));

            if (!binsNumber || isNaN(binsNumber) || binsNumber <= this.MinNumberOfBins) {
                return Histogram.DefaultHistogramSettings.bins;
            }

            if (binsNumber > this.MaxNumberOfBins) {
                return this.MaxNumberOfBins;
            }

            return binsNumber;
        }

        private getFrequency(objects: DataViewObjects): boolean {
            return DataViewObjects.getValue<boolean>(
                objects,
                Histogram.Properties["general"]["frequency"],
                Histogram.DefaultHistogramSettings.frequency);
        }

        private getPrecision(objects: DataViewObjects): number {
            let precision: number = DataViewObjects.getValue(
                objects,
                Histogram.Properties["labels"]["labelPrecision"],
                Histogram.DefaultHistogramSettings.precision);

            if (precision <= this.MinPrecision) {
                return this.MinPrecision;
            }

            if (precision >= this.MaxPrecision) {
                return this.MaxPrecision;
            }

            return precision;
        }

        public validateData(data: HistogramDataView): boolean {
            if (data && data.data.some(x=> x.range.some(x => isNaN(x) || x === Infinity || x === -Infinity))) {
                 this.hostService.setWarnings([new HistogramChartWarning(HistogramChartWarning.ErrorInvalidDataValues)]);
                return false;
            }
            return true;
        }

        public update(visualUpdateOptions: VisualUpdateOptions): void {
            if (!visualUpdateOptions ||
                !visualUpdateOptions.dataViews ||
                !visualUpdateOptions.dataViews[0]) {
                return;
            }

            let dataView: DataView = visualUpdateOptions.dataViews[0];

            this.durationAnimations = getAnimationDuration(
                this.animator,
                visualUpdateOptions.suppressAnimations);

            this.setSize(visualUpdateOptions.viewport);

            this.histogramDataView = this.converter(dataView);
            if (!this.validateData(this.histogramDataView)) {
                this.histogramDataView.data = [];
            }
            this.render();
        }

        private setSize(viewport: IViewport): void {
            let height: number,
                width: number;

            height = viewport.height -
            this.margin.top -
            this.margin.bottom;

            width = viewport.width -
            this.margin.left -
            this.margin.right;

            this.viewport = {
                height: height,
                width: width
            };

            this.updateElements(viewport.height, viewport.width);
        }

        private updateElements(height: number, width: number): void {

            this.root.attr({
                "height": height,
                "width": width
            });

            this.main.attr("transform", SVGUtil.translate(this.margin.left, this.margin.top));

            this.legend.attr("transform", SVGUtil.translate(this.margin.left, this.margin.top));

            this.axisX.attr(
                "transform",
                SVGUtil.translate(0, this.viewport.height - this.LegendSize));
        }

        public shouldShowYOnRight(): boolean {
            return this.histogramDataView.settings.yPosition === yAxisPosition.right;
        }

        private columsAndAxesTransform(labelWidth: number): void {
            let constMargin = 20;
            let shiftToRight: number = this.shouldShowYOnRight() ? 10 : this.margin.left + labelWidth + constMargin;
            this.DataLabelMargin = shiftToRight;

            this.columns.attr("transform", SVGUtil.translate(shiftToRight, 0));
            this.axes.attr("transform", SVGUtil.translate(shiftToRight, 0));
        }

        private render(): void {
            if (!this.histogramDataView || !this.histogramDataView.settings) {
                return;
            }

            this.renderAxes();
            let columnsSelection: D3.UpdateSelection = this.renderColumns();

            this.adjustTransformToAxisLabels();

            this.renderLegend();
            if (this.histogramDataView.settings.labelShow)
                this.renderLabels();
            else
                this.labels.selectAll('*').remove();
            this.bindSelectionHandler(columnsSelection);
        }
        private adjustTransformToAxisLabels() {
            let maxWidthOfLabael = 0;
            this.main.selectAll('g.axis').filter((d, index) => index === 1).selectAll('g.tick text')
                .each(function (d, i) {
                    let p = powerbi.TextMeasurementService.getSvgMeasurementProperties(this);
                    let textProperties: powerbi.TextProperties = {
                        text: p.text,
                        fontFamily: p.fontFamily,
                        fontSize: p.fontSize
                    };
                    let widthOfLabel = powerbi.TextMeasurementService.measureSvgTextWidth(textProperties);
                    if (widthOfLabel > maxWidthOfLabael)
                        maxWidthOfLabael = widthOfLabel;
                });
            let constMargin = 70;
            this.yTitleMargin = this.shouldShowYOnRight() ? this.viewport.width - this.AxisSize - constMargin + this.LegendSize + maxWidthOfLabael : 0;
            this.columsAndAxesTransform(maxWidthOfLabael);
        }

        private renderColumns(): D3.UpdateSelection {
            let data: HistogramData[] = this.histogramDataView.data,
                yScale: D3.Scale.LinearScale = this.histogramDataView.yScale,
                countOfValues: number = data.length,
                widthOfColumn: number,
                updateColumnsSelection: D3.UpdateSelection;

            widthOfColumn = countOfValues && ((this.viewport.width - this.AxisSize - this.LegendSize) / countOfValues - this.ColumnPadding);

            if (widthOfColumn < 0) {
                widthOfColumn = 0;
            }

            this.widthOfColumn = widthOfColumn;
            updateColumnsSelection = this.columnsSelection.data(data);

            updateColumnsSelection
                .enter()
                .append("svg:rect");

            updateColumnsSelection
                .attr("x", this.ColumnPadding / 2)
                .attr("width", widthOfColumn)
                .attr("height", (item: HistogramData) => this.getColumnHeight(item, yScale))
                .style("fill", this.histogramDataView.settings.fillColor)
                .attr("class", Histogram.Column["class"])
                .attr("transform", (item: HistogramData, index: number) => SVGUtil.translate(
                    widthOfColumn * index + this.ColumnPadding * index,
                    yScale(item.y) - this.ColumnPadding / 2.5));

            if (countOfValues) {
                //if data is empty, it throws for some reason
                updateColumnsSelection.classed(Histogram.Column["class"]);
            }

            updateColumnsSelection.exit().remove();

            this.renderTooltip(updateColumnsSelection);

            return updateColumnsSelection;
        }

        private renderTooltip(selection: D3.UpdateSelection): void {
            TooltipManager.addTooltip(selection, (tooltipEvent: TooltipEvent) => {
                return (<HistogramData>tooltipEvent.data).tooltipInfo;
            });
        }

        private getColumnHeight(column: D3.Layout.Bin, y: D3.Scale.LinearScale): number {
            let height: number = this.viewport.height - this.LegendSize - y(column.y);

            return height > 0 ? height : this.MinColumnHeight;
        }

        private renderAxes(): void {

            let xScale: D3.Scale.LinearScale = this.histogramDataView.xScale,
                yScale: D3.Scale.LinearScale = this.histogramDataView.yScale,
                xAxis: D3.Svg.Axis,
                yAxis: D3.Svg.Axis;

            xAxis = d3.svg.axis()
                .scale(xScale)
                .orient("bottom")
                .tickValues(this.rangesToArray(this.histogramDataView.data))
                .tickFormat((item: number) => this.histogramDataView.xLabelFormatter.format(item));

            yAxis = d3.svg.axis()
                .scale(yScale)
                .orient(this.histogramDataView.settings.yPosition.toLowerCase())
                .ticks(this.NumberOfLabelsOnAxisY)
                .tickFormat((item: number) => this.histogramDataView.yLabelFormatter.format(item));

            this.main.selectAll('g.axis').filter((d, index) => index === 1).selectAll('g.tick text').attr('transform', SVGUtil.translate(
                this.shouldShowYOnRight() ? this.viewport.width - this.AxisSize - this.LegendSize : 0, 0));

            let xShow = this.histogramDataView.settings.xShow;
            let yShow = this.histogramDataView.settings.yShow;

            if (xShow)
                this.axisX.call(xAxis);
            else
                this.axisX.selectAll('*').remove();

            if (yShow)
                this.axisY.call(yAxis);
            else
                this.axisY.selectAll('*').remove();

            this.main.selectAll('g.axis').filter((d, index) => index === 0).selectAll('g.tick text').style({
                'fill': this.histogramDataView.settings.xAxisColor,
            });

            this.main.selectAll('g.axis').filter((d, index) => index === 1).selectAll('g.tick text').style({
                'fill': this.histogramDataView.settings.yAxisColor,
            });
        }

        private getLabaelLayout(): ILabelLayout {
            let fontSizeInPx = PixelConverter.fromPoint(this.histogramDataView.settings.labelFontSize);
            let settings = this.histogramDataView.settings;
            let dataLabelFormatter = ValueFormatter.create({
                value: settings.labelDisplayUnit,
                precision: settings.labelPrecision
            });
            return {
                labelText: (b: D3.Layout.Bin) => {
                    return dataLabelFormatter.format(b.y).toString();
                },
                labelLayout: {
                    x: (b: D3.Layout.Bin) => this.DataLabelMargin + this.histogramDataView.xScale(b.x) + + this.widthOfColumn / 2,
                    y: (b: D3.Layout.Bin) => this.histogramDataView.yScale(b.y) - 5
                },
                filter: (b: D3.Layout.Bin) => {
                    return (b != null);
                },
                style: {
                    'fill': settings.labelColor,
                    'font-size': fontSizeInPx,
                },
            };
        }

        private renderLabels(): void {
            let layout = this.getLabaelLayout();
            let dataPointsArray = this.histogramDataView.data;
            dataLabelUtils.drawDefaultLabelsForDataPointChart(dataPointsArray, this.main, layout, this.viewport);

        }
        private rangesToArray(data: HistogramData[]): number[] {
            return data.reduce((previousValue: number[], currentValue: HistogramData, index: number) => {
                let range: number[];

                range = index === 0
                    ? currentValue.range
                    : currentValue.range.slice(1);

                return previousValue.concat(range);
            }, []);
        }

        private rangeToString(range: number[], includeLeftBorder: boolean, valueFormatter: IValueFormatter): string {
            let leftBracket: string,
                rightBracket: string = this.IncludeBrackets.right,
                leftBorder: string = valueFormatter.format(range[0]),
                rightBorder: string = valueFormatter.format(range[1]);

            leftBracket = includeLeftBorder
                ? this.IncludeBrackets.left
                : this.ExcludeBrackets.left;

            return `${leftBracket}${leftBorder}${this.SeparatorNumbers}${rightBorder}${rightBracket}`;
        }

        private renderLegend(): void {
            let legendElements: D3.Selection,
                legendSelection: D3.UpdateSelection,
                datalegends: Legend[] = this.getDataLegends(this.histogramDataView.settings);

            legendElements = this.main
                .select(Histogram.Legends.selector)
                .selectAll(Histogram.Legend.selector);

            legendSelection = legendElements.data(datalegends);

            legendSelection
                .enter()
                .append("svg:text");

            legendSelection
                .attr("x", 0)
                .attr("y", 0)
                .attr("dx", (item: Legend) => item.dx)
                .attr("dy", (item: Legend) => item.dy)
                .attr("transform", (item: Legend) => item.transform)
                .attr("class", Histogram.Legend["class"])
                .text((item: Legend) => item.text)
                .classed(Histogram.Legend["class"], true);

            legendSelection
                .exit()
                .remove();

            this.main.selectAll('g.axis').filter((d, index) => index === 0).selectAll('g.tick text').style({
                'display': this.histogramDataView.settings.xTitle === true ? 'block' : 'none',
            });

            this.main.selectAll('g.axis').filter((d, index) => index === 1).selectAll('g.tick text').style({
                'display': this.histogramDataView.settings.yTitle === true ? 'block' : 'none',
            });
        }

        private getDataLegends(settings: HistogramSettings): Legend[] {
            let bottomLegendText: string = this.getLegendText(settings);
            bottomLegendText = this.setLegend(bottomLegendText, settings.yStyle, settings.yDisplayUnits);

            return [{
                transform: SVGUtil.translate(
                    this.viewport.width / 2,
                    this.viewport.height),
                text: settings.displayName,
                dx: "1em",
                dy: "-1em"
            }, {
                    transform: SVGUtil.translateAndRotate(
                        this.shouldShowYOnRight() ? this.yTitleMargin : 0,
                        this.viewport.height / 2,
                        0,
                        0,
                        270),
                    text: bottomLegendText,
                    dx: "3em"
                }];
        }

        private getLegendText(settings: HistogramSettings): string {
            return settings.frequency
                ? Histogram.FrequencyText
                : Histogram.DensityText;
        }

        private bindSelectionHandler(columnsSelection: D3.UpdateSelection): void {
            this.setSelection(columnsSelection);

            columnsSelection.on("click", (data: HistogramData) => {
                this.selectionManager.clear();

                data.selectionIds.forEach((selectionId: SelectionId) => {
                    this.selectionManager.select(selectionId, true).then((selectionIds: SelectionId[]) => {
                        if (selectionIds.length > 0) {
                            this.setSelection(columnsSelection, data);
                        } else {
                            this.setSelection(columnsSelection);
                        }
                    });
                });

                d3.event.stopPropagation();
            });

            this.root.on("click", () => {
                this.selectionManager.clear();
                this.setSelection(columnsSelection);
            });
        }

        private setSelection(columnsSelection: D3.UpdateSelection, data?: HistogramData): void {
            columnsSelection.transition()
                .duration(this.durationAnimations)
                .style("fill-opacity", this.MaxOpacity);

            if (!data) {
                return;
            }

            columnsSelection
                .filter((columnSelection: HistogramData) => {
                    return columnSelection !== data;
                })
                .transition()
                .duration(this.durationAnimations)
                .style("fill-opacity", this.MinOpacity);
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] {
            let instances: VisualObjectInstance[] = [],
                settings: HistogramSettings;

            if (!this.histogramDataView ||
                !this.histogramDataView.settings) {
                return instances;
            }

            settings = this.histogramDataView.settings;

            switch (options.objectName) {
                case "general": {
                    let general: VisualObjectInstance = {
                        objectName: "general",
                        displayName: "general",
                        selector: null,
                        properties: {
                            bins: settings.bins,
                            frequency: settings.frequency
                        }
                    };

                    instances.push(general);
                    break;
                }
                case "dataPoint": {
                    let dataPoint: VisualObjectInstance = {
                        objectName: "dataPoint",
                        displayName: "dataPoint",
                        selector: null,
                        properties: {
                            fill: settings.fillColor
                        }
                    };

                    instances.push(dataPoint);
                    break;
                }
                case "labels": {
                    let labels: VisualObjectInstance = {
                        objectName: "labels",
                        displayName: "labels",
                        selector: null,
                        properties: {
                            show: settings.labelShow,
                            color: settings.labelColor,
                            labelDisplayUnits: settings.labelDisplayUnit,
                            labelPrecision: settings.labelPrecision,
                            fontSize: settings.labelFontSize
                        }
                    };
                    instances.push(labels);
                    break;
                }
                case "xAxis": {
                    let xAxis: VisualObjectInstance = {
                        objectName: "axis",
                        displayName: "X Axis",
                        selector: null,
                        properties: {
                            show: settings.xShow,
                            title: settings.xTitle,
                            style: settings.xStyle,
                            axisColor: settings.xAxisColor,
                            displayUnits: settings.xDisplayUnits,
                            precision: settings.xPrecision
                        }
                    };
                    instances.push(xAxis);
                    break;
                }
                case "yAxis": {
                    let yAxis: VisualObjectInstance = {
                        objectName: "axis",
                        displayName: "Y Axis",
                        selector: null,
                        properties: {
                            show: settings.yShow,
                            position: settings.yPosition,
                            start: settings.yStart,
                            end: settings.yEnd,
                            title: settings.yTitle,
                            style: settings.yStyle,
                            axisColor: settings.yAxisColor,
                            displayUnits: settings.yDisplayUnits,
                            precision: settings.yPrecision
                        }
                    };
                    instances.push(yAxis);
                    break;
                }
            }
            return instances;
        }

        private getObjectsFromDataView(dataView: DataView): DataViewObjects {
            if (!dataView ||
                !dataView.metadata ||
                !dataView.metadata.columns ||
                !dataView.metadata.objects) {
                return null;
            }

            return dataView.metadata.objects;
        }

        public destroy(): void {
            this.root = null;
        }
    }
}