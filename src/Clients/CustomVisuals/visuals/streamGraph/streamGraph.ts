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

    import ValueFormatter = powerbi.visuals.valueFormatter;
    import SelectionManager = utility.SelectionManager;
    import ClassAndSelector = jsCommon.CssConstants.ClassAndSelector;
    import PixelConverter = jsCommon.PixelConverter;

    export interface StreamData {
        dataPoints: StreamDataPoint[][];
        legendData: LegendData;
        valueFormatter: IValueFormatter;
        categoryFormatter: IValueFormatter;
        streamGraphSettings: StreamGraphSettings;
    }

    export interface StreamDataPoint {
        x: number;
        y: number;
        y0?: number;
        tooltipInfo?: TooltipDataItem[];
        identity: SelectionId;
        text: string;
        labelFontSize: string;
    }

    export interface StreamGraphSettings {
        legendSettings: StreamGraphLegendSettings;
        categoryAxisSettings: StreamGraphAxisSettings;
        valueAxisSettings: StreamGraphAxisSettings;
        dataLabelsSettings: VisualDataLabelsSettings;
    }

    export interface StreamGraphLegendSettings {
        show: boolean;
        showTitle: boolean;
        labelColor: string;
        titleText: string;
        fontSize: number;
    }

    export interface StreamGraphAxisSettings {
        show: boolean;
        labelColor: string;
        showAxisTitle: boolean;
    }

    export interface StreamProperty {
        [propertyName: string]: DataViewObjectPropertyIdentifier;
    }

    const StreamGraphAxisGraphicsContextClassName = 'axisGraphicsContext';
    const DataPointsContainer = 'dataPointsContainer';
    const StreamGraphXAxisClassName = 'x axis';
    const StreamGraphYAxisClassName = 'y axis';
    const StreamGraphDefaultColor = "#777";
    const StreamGraphDefaultFontSizeInPoints: number = 8;
    const DefaultDataLabelsOffset: number = 4;
    const DefaultLegendLabelFillColor: string = '#666666';
    const StreamGraphDefaultFontFamily: string = 'wf_segoe-ui_normal';
    const StreamGraphDefaultFontWeight: string = 'normal';
    const XAxisOnSize: number = 20;
    const XAxisOffSize: number = 10;
    const XAxisLabelSize: number = 20;
    const YAxisOnSize: number = 45;
    const YAxisOffSize: number = 10;
    const YAxisLabelSize: number = 20;
    const StreamGraphDefaultSettings: StreamGraphSettings = {
        legendSettings: {
            show: true,
            showTitle: true,
            labelColor: DefaultLegendLabelFillColor,
            titleText: "",
            fontSize: StreamGraphDefaultFontSizeInPoints
        },
        categoryAxisSettings: {
            show: true,
            labelColor: StreamGraphDefaultColor,
            showAxisTitle: false,
        },
        valueAxisSettings: {
            show: true,
            labelColor: StreamGraphDefaultColor,
            showAxisTitle: false,
        },
        dataLabelsSettings: dataLabelUtils.getDefaultPointLabelSettings(),
    };

    export class StreamGraph implements IVisual {
        private static VisualClassName = 'streamGraph';

        private static Properties: any = {
            general: {
                formatString: <DataViewObjectPropertyIdentifier>{
                    objectName: 'general',
                    propertyName: 'formatString'
                }
            },
            legend: {
                show: <DataViewObjectPropertyIdentifier>{
                    objectName: "legend",
                    propertyName: "show"
                },
                showTitle: <DataViewObjectPropertyIdentifier>{
                    objectName: "legend",
                    propertyName: "showTitle"
                },
                titleText: <DataViewObjectPropertyIdentifier>{
                    objectName: "legend",
                    propertyName: "titleText"
                },
                labelColor: <DataViewObjectPropertyIdentifier>{
                    objectName: "legend",
                    propertyName: "labelColor"
                },
                fontSize: <DataViewObjectPropertyIdentifier>{
                    objectName: "legend",
                    propertyName: "fontSize"
                }
            },
            categoryAxis: {
                show: <DataViewObjectPropertyIdentifier>{
                    objectName: "categoryAxis",
                    propertyName: "show"
                },
                labelColor: <DataViewObjectPropertyIdentifier>{
                    objectName: "categoryAxis",
                    propertyName: "labelColor"
                },
                showAxisTitle: <DataViewObjectPropertyIdentifier>{
                    objectName: "categoryAxis",
                    propertyName: "showAxisTitle"
                }
            },
            valueAxis: {
                show: <DataViewObjectPropertyIdentifier>{
                    objectName: "valueAxis",
                    propertyName: "show"
                },
                labelColor: <DataViewObjectPropertyIdentifier>{
                    objectName: "valueAxis",
                    propertyName: "labelColor"
                },
                showAxisTitle: <DataViewObjectPropertyIdentifier>{
                    objectName: "valueAxis",
                    propertyName: "showAxisTitle"
                }
            },
            labels: {
                show: <DataViewObjectPropertyIdentifier>{
                    objectName: 'labels',
                    propertyName: 'show'
                },
                color: <DataViewObjectPropertyIdentifier>{
                    objectName: 'labels',
                    propertyName: 'color'
                },
                fontSize: <DataViewObjectPropertyIdentifier>{
                    objectName: 'labels',
                    propertyName: 'fontSize'
                }
            }
        };

        private static Layer: ClassAndSelector = {
            'class': 'layer',
            selector: '.layer'
        };

        private static XAxisLabel: ClassAndSelector = {
            'class': 'xAxisLabel',
            selector: '.xAxisLabel'
        };

        private static YAxisLabel: ClassAndSelector = {
            'class': 'yAxisLabel',
            selector: '.yAxisLabel'
        };

        private static MaxNumberOfAxisXValues: number = 5;

        public static capabilities: VisualCapabilities = {
            dataRoles: [
                {
                    name: 'Category',
                    kind: VisualDataRoleKind.Grouping,
                    displayName: 'Category',
                }, {
                    name: 'Series',
                    kind: VisualDataRoleKind.Grouping,
                    displayName: 'Series',
                }, {
                    name: 'Y',
                    kind: VisualDataRoleKind.Measure,
                    displayName: data.createDisplayNameGetter('Role_DisplayName_Values'),
                }
            ],
            dataViewMappings: [{
                conditions: [
                    { 'Category': { max: 1 }, 'Series': { max: 0 } },
                    { 'Category': { max: 1 }, 'Series': { min: 1, max: 1 }, 'Y': { max: 1 } }
                ],
                categorical: {
                    categories: {
                        for: { in: 'Category' },
                        dataReductionAlgorithm: { bottom: {} }
                    },
                    values: {
                        group: {
                            by: 'Series',
                            select: [{ for: { in: 'Y' } }],
                            dataReductionAlgorithm: { bottom: {} }
                        }
                    },
                }
            }],
            objects: {
                general: {
                    displayName: 'General',
                    properties: {
                        formatString: { type: { formatting: { formatString: true } } },
                        wiggle: {
                            type: { bool: true },
                            displayName: 'Wiggle'
                        }
                    }
                },
                categoryAxis: {
                    displayName: 'X-Axis',
                    properties: {
                        show: {
                            displayName: 'show',
                            type: { bool: true }
                        },
                        showAxisTitle: {
                            displayName: 'Title',
                            type: { bool: true }
                        },
                        labelColor: {
                            displayName: 'Color',
                            type: { fill: { solid: { color: true } } }
                        }
                    }
                },
                valueAxis: {
                    displayName: 'Y-Axis',
                    properties: {
                        show: {
                            displayName: 'show',
                            type: { bool: true }
                        },
                        showAxisTitle: {
                            displayName: 'Title',
                            type: { bool: true }
                        },
                        labelColor: {
                            displayName: 'Color',
                            type: { fill: { solid: { color: true } } }
                        }
                    }
                },
                legend: {
                    displayName: 'Legend',
                    properties: {
                        show: {
                            displayName: 'show',
                            type: { bool: true }
                        },
                        position: {
                            displayName: 'Position',
                            type: { enumeration: legendPosition.type }
                        },
                        showTitle: {
                            displayName: 'Title',
                            type: { bool: true }
                        },
                        titleText: {
                            displayName: 'Legend Name',
                            type: { text: true },
                            suppressFormatPainterCopy: true
                        },
                        labelColor: {
                            displayName: 'Color',
                            type: { fill: { solid: { color: true } } }
                        },
                        fontSize: {
                            displayName: 'Text Size',
                            type: { formatting: { fontSize: true } }
                        }
                    }
                },
                labels: {
                    displayName: 'Data Labels',
                    properties: {
                        show: {
                            displayName: 'Show',
                            type: { bool: true },
                        },
                        color: {
                            displayName: 'Color',
                            type: { fill: { solid: { color: true } } }
                        },
                        fontSize: {
                            displayName: 'Text Size',
                            type: { formatting: { fontSize: true } },
                        },
                    }
                }
            }
        };

        private margin: IMargin = { left: YAxisOnSize, right: 15, bottom: XAxisOnSize, top: 10 };

        private viewport: IViewport;

        private svg: D3.Selection;
        private dataPointsContainer: D3.Selection;
        private axisGraphicsContext: D3.Selection;
        private xAxis: D3.Selection;
        private yAxis: D3.Selection;
        private colors: IDataColorPalette;
        private selectionManager: utility.SelectionManager;
        private dataView: DataView;
        private legend: ILegend;
        private data: StreamData;

        public converter(dataView: DataView, colors: IDataColorPalette): StreamData {
            if (!dataView || !dataView.categorical || !dataView.categorical.values || !dataView.categorical.categories)
                return null;

            let catDv: DataViewCategorical = dataView.categorical,
                categories = catDv.categories,
                values: DataViewValueColumns = catDv.values,
                dataPoints: StreamDataPoint[][] = [],
                legendData: LegendData = {
                    dataPoints: [],
                    title: values.source ? values.source.displayName : "",
                    fontSize: StreamGraphDefaultFontSizeInPoints,
                },
                value: number = 0,
                valueFormatter: IValueFormatter,
                categoryFormatter: IValueFormatter;

            let category = categories && categories.length > 0 ? categories[0] : null;
            let formatString = StreamGraph.Properties.general.formatString;

            let streamGraphSettings: StreamGraphSettings = this.parseSettings(dataView);
            let fontSizeInPx = PixelConverter.fromPoint(streamGraphSettings.dataLabelsSettings.fontSize);

            for (let i = 0; i < values.length; i++) {
                dataPoints.push([]);
                let groupName = values[i].source.groupName;

                if (groupName)
                    legendData.dataPoints.push({
                        label: groupName,
                        color: colors.getColorByIndex(i).value,
                        icon: LegendIcon.Box,
                        selected: false,
                        identity: SelectionId.createWithId(values[i].identity)
                    });

                var tooltipInfo: TooltipDataItem[] = TooltipBuilder.createTooltipInfo(
                    formatString,
                    catDv,
                    category.values[i],
                    null,
                    null,
                    null,
                    i);

                let dataPointsValues = values[i].values;
                for (let k = 0; k < dataPointsValues.length; k++) {
                    let id: SelectionId = SelectionIdBuilder
                        .builder()
                        .withMeasure(groupName)
                        .withCategory(category, k)
                        .withSeries(values, values[i])
                        .createSelectionId(),
                        y: number = dataPointsValues[k];

                    if (y > value) {
                        value = y;
                    }

                    dataPoints[i].push({
                        x: k,
                        y: y,
                        identity: id,
                        tooltipInfo: tooltipInfo,
                        text: groupName,
                        labelFontSize: fontSizeInPx
                    });
                }
            }

            valueFormatter = ValueFormatter.create({
                format: "g",
                value: value
            });

            categoryFormatter = ValueFormatter.create({
                format: ValueFormatter.getFormatString(
                    category.source,
                    StreamGraph.Properties.general.formatString),
                value: category.values
            });

            return {
                dataPoints: dataPoints,
                legendData: legendData,
                valueFormatter: valueFormatter,
                categoryFormatter: categoryFormatter,
                streamGraphSettings: streamGraphSettings
            };
        }

        private parseSettings(dataView: DataView): StreamGraphSettings {
            if (!dataView || !dataView.metadata)
                return StreamGraphDefaultSettings;

            let objects: DataViewObjects = dataView.metadata.objects;
            let streamGraphSettings: StreamGraphSettings = _.cloneDeep(StreamGraphDefaultSettings);

            let categoryAxisSettings: StreamGraphAxisSettings = streamGraphSettings.categoryAxisSettings;
            categoryAxisSettings.show = DataViewObjects.getValue<boolean>(objects, StreamGraph.Properties.categoryAxis.show, categoryAxisSettings.show);
            categoryAxisSettings.labelColor = <string>DataViewObjects.getFillColor(objects, StreamGraph.Properties.categoryAxis.labelColor, categoryAxisSettings.labelColor);
            categoryAxisSettings.showAxisTitle = DataViewObjects.getValue<boolean>(objects, StreamGraph.Properties.categoryAxis.showAxisTitle, categoryAxisSettings.showAxisTitle);

            let valueAxisSettings: StreamGraphAxisSettings = streamGraphSettings.valueAxisSettings;
            valueAxisSettings.show = DataViewObjects.getValue<boolean>(objects, StreamGraph.Properties.valueAxis.show, valueAxisSettings.show);
            valueAxisSettings.labelColor = <string>DataViewObjects.getFillColor(objects, StreamGraph.Properties.valueAxis.labelColor, valueAxisSettings.labelColor);
            valueAxisSettings.showAxisTitle = DataViewObjects.getValue<boolean>(objects, StreamGraph.Properties.valueAxis.showAxisTitle, valueAxisSettings.showAxisTitle);

            let dataLabelsSettings: VisualDataLabelsSettings = streamGraphSettings.dataLabelsSettings;
            dataLabelsSettings.show = DataViewObjects.getValue<boolean>(objects, StreamGraph.Properties.labels.show, dataLabelsSettings.show);
            dataLabelsSettings.labelColor = <string>DataViewObjects.getFillColor(objects, StreamGraph.Properties.labels.color, dataLabelsSettings.labelColor);
            dataLabelsSettings.fontSize = DataViewObjects.getValue<number>(objects, StreamGraph.Properties.labels.fontSize, dataLabelsSettings.fontSize);

            let legendSettings: StreamGraphLegendSettings = streamGraphSettings.legendSettings;
            let valuesSource: DataViewMetadataColumn = dataView.categorical.values.source;
            let titleTextDefault: string = valuesSource && _.isEmpty(legendSettings.titleText) ? valuesSource.displayName : legendSettings.titleText;

            legendSettings.show = DataViewObjects.getValue<boolean>(objects, StreamGraph.Properties.legend.show, legendSettings.show);
            legendSettings.showTitle = DataViewObjects.getValue<boolean>(objects, StreamGraph.Properties.legend.showTitle, legendSettings.showTitle);
            legendSettings.titleText = DataViewObjects.getValue<string>(objects, StreamGraph.Properties.legend.titleText, titleTextDefault);
            legendSettings.labelColor = DataViewObjects.getValue<string>(objects, StreamGraph.Properties.legend.labelColor, legendSettings.labelColor);
            legendSettings.fontSize = DataViewObjects.getValue<number>(objects, StreamGraph.Properties.legend.fontSize, legendSettings.fontSize);
            if (_.isEmpty(legendSettings.titleText))
                legendSettings.titleText = titleTextDefault; // Force a value (shouldn't be empty with show=true)

            return streamGraphSettings;
        }

        public init(options: VisualInitOptions): void {
            let element: JQuery = options.element;

            this.selectionManager = new SelectionManager({ hostServices: options.host });

            this.svg = d3.select(element.get(0))
                .append('svg')
                .classed(StreamGraph.VisualClassName, true)
                .style('position', 'absolute');

            this.axisGraphicsContext = this.svg.append('g').classed(StreamGraphAxisGraphicsContextClassName, true);
            this.xAxis = this.axisGraphicsContext.append('g').classed(StreamGraphXAxisClassName, true);
            this.yAxis = this.axisGraphicsContext.append('g').classed(StreamGraphYAxisClassName, true);
            this.dataPointsContainer = this.svg.append('g').classed(DataPointsContainer, true);

            this.colors = options.style.colorPalette.dataColors;

            this.legend = createLegend(element, false, null, true);
        }

        public update(options: VisualUpdateOptions): void {
            if (!options.dataViews || !options.dataViews[0] || !options.dataViews[0].categorical) {
                this.clearData();
                return;
            };

            this.viewport = {
                width: Math.max(0, options.viewport.width),
                height: Math.max(0, options.viewport.height)
            };

            let duration: number = options.suppressAnimations ? 0 : 250,
                dataView: DataView = this.dataView = options.dataViews[0],
                data: StreamData = this.data = this.converter(dataView, this.colors);

            if (!data || !data.dataPoints || !data.dataPoints.length) {
                this.clearData();
                return;
            }

            this.renderLegend(data);
            this.renderXAxisLabels();
            this.renderYAxisLabels();

            let width: number = Math.max(0, this.viewport.width);
            let height: number = Math.max(0, this.viewport.height);

            this.svg.attr({
                'width': width,
                'height': height
            });

            let stack: D3.Layout.StackLayout = d3.layout.stack();

            if (this.getWiggle(dataView))
                stack.offset('wiggle');

            let dataPoints: StreamDataPoint[][] = data.dataPoints;
            let layers: StreamDataPoint[][] = stack(dataPoints);
            let margin: IMargin = this.margin;

            let xScale: D3.Scale.LinearScale = d3.scale.linear()
                .domain([0, dataPoints[0].length - 1])
                .range([margin.left, width - margin.right]);

            let yMax = d3.max(layers, (layer: StreamDataPoint[]) => {
                return d3.max(layer, (d: StreamDataPoint) => {
                    return d.y0 + d.y;
                });
            });

            let yMin = d3.min(layers, (layer: StreamDataPoint[]) => {
                return d3.min(layer, (d: StreamDataPoint) => {
                    return d.y0 + d.y;
                });
            });

            let yScale: D3.Scale.LinearScale = d3.scale.linear()
                .domain([Math.min(yMin, 0), yMax])
                .range([height - margin.bottom, margin.top])
                .nice();

            let area: D3.Svg.Area = d3.svg.area()
                .interpolate('monotone')
                .x(d => xScale(d.x))
                .y0(d => yScale(d.y0))
                .y1(d => yScale(d.y0 + d.y));

            let selectionManager: SelectionManager = this.selectionManager;

            let selection: D3.UpdateSelection = this.dataPointsContainer.selectAll(StreamGraph.Layer.selector)
                .data(layers);

            selection.enter()
                .append('path')
                .classed(StreamGraph.Layer.class, true);

            selection
                .style("fill", (d, i) => this.colors.getColorByIndex(i).value)
                .on('click', function (d) {
                    selectionManager.select(d[0].identity).then(ids=> {
                        if (ids.length > 0) {
                            selection.style('opacity', 0.5);
                            d3.select(this).style('opacity', 1);
                        } else
                            selection.style('opacity', 1);
                    });
                })
                .transition()
                .duration(duration)
                .attr("d", area);

            selection.selectAll("path").append('g').classed(DataPointsContainer, true);

            selection.exit().remove();

            if (this.data.streamGraphSettings.dataLabelsSettings.show) {
                let layout = this.getStreamGraphLabelLayout(xScale, yScale);
                
                // Merge all points into a single array
                let dataPointsArray: StreamDataPoint[] = [];
                for (let i = 0; i < dataPoints.length; i++) {
                    dataPointsArray = dataPointsArray.concat(dataPoints[i]);
                }
                let viewport: IViewport = {
                    height: height - margin.top - margin.bottom,
                    width: width - margin.right - margin.left,
                };
                dataLabelUtils.drawDefaultLabelsForDataPointChart(dataPointsArray, this.svg, layout, viewport);
                let offset = DefaultDataLabelsOffset * this.data.streamGraphSettings.dataLabelsSettings.fontSize;
                this.svg.select('.labels').attr('transform', SVGUtil.translate(offset, 0));
            }
            else
                dataLabelUtils.cleanDataLabels(this.svg);

            TooltipManager.addTooltip(selection, (tooltipEvent: TooltipEvent) => {
                return (tooltipEvent.data[0]).tooltipInfo;
            });

            this.drawAxis(data, xScale, yScale);
        }

        private getStreamGraphLabelLayout(xScale: D3.Scale.LinearScale, yScale: D3.Scale.LinearScale): ILabelLayout {
            let dataLabelsSettings = this.data.streamGraphSettings.dataLabelsSettings;
            let fontSize = PixelConverter.fromPoint(dataLabelsSettings.fontSize);
            let offset = dataLabelsSettings.fontSize * DefaultDataLabelsOffset;

            return {
                labelText: (d: StreamDataPoint) => {
                    return d.text;
                },
                labelLayout: {
                    x: (d: StreamDataPoint) => xScale(d.x) - offset,
                    y: (d: StreamDataPoint) => yScale(d.y0)
                },
                filter: (d: StreamDataPoint) => {
                    return (d != null);
                },
                style: {
                    'fill': dataLabelsSettings.labelColor,
                    'font-size': fontSize,
                },
            };
        }

        private drawAxis(data: StreamData, xScale: D3.Scale.LinearScale, yScale: D3.Scale.LinearScale) {
            let margin: IMargin = this.margin,
                shiftY: number = this.viewport.height - margin.bottom,
                shiftX: number = this.viewport.width - margin.left - margin.right,
                xAxis: D3.Svg.Axis = d3.svg.axis(),
                getTextPropertiesFunction = this.getTextPropertiesFunction;

            xAxis.scale(xScale)
                .orient("bottom")
                .tickFormat(((item: any, index: number): any => {
                    if (data.categoryFormatter)
                        item = data.categoryFormatter.format(item);

                    if (index != null && xAxis.tickValues() &&
                        (index === 0 || index === xAxis.tickValues().length - 1)) {
                        item = TextMeasurementService.getTailoredTextOrDefault(
                            getTextPropertiesFunction(item),
                            (index ? margin.right : margin.left) * 2);
                    }
                    return item;
                }).bind(xAxis));

            let yAxis: D3.Svg.Axis = d3.svg.axis()
                .scale(yScale)
                .orient("left")
                .tickFormat((item: any): any => {
                    if (data.valueFormatter) {
                        return data.valueFormatter.format(item);
                    }
                    return item;
                });

            this.setMaxTicks(xAxis, shiftX, StreamGraph.MaxNumberOfAxisXValues);
            this.setMaxTicks(yAxis, shiftY);

            let valueAxisSettings = this.data.streamGraphSettings.valueAxisSettings;
            if (valueAxisSettings.show) {
                let axisColor: Fill = valueAxisSettings.labelColor;
                this.yAxis
                    .attr("transform", SVGUtil.translate(margin.left, 0))
                    .call(yAxis);
                this.yAxis.selectAll("text").style("fill", axisColor);
            } else
                this.yAxis.selectAll("*").remove();

            let categoryAxisSettings = this.data.streamGraphSettings.categoryAxisSettings;
            if (categoryAxisSettings.show) {
                let axisColor: Fill = categoryAxisSettings.labelColor;
                this.xAxis
                    .attr("transform", SVGUtil.translate(0, shiftY))
                    .call(xAxis);
                this.xAxis.selectAll("text").style("fill", axisColor);
            } else
                this.xAxis.selectAll("*").remove();
        }

        private renderYAxisLabels(): void {
            this.axisGraphicsContext.selectAll(StreamGraph.YAxisLabel.selector).remove();
            let valueAxisSettings: StreamGraphAxisSettings = this.data.streamGraphSettings.valueAxisSettings;
            this.margin.left = valueAxisSettings.show ? YAxisOnSize : YAxisOffSize;

            if (valueAxisSettings.showAxisTitle) {
                this.margin.left += YAxisLabelSize;
                let categoryAxisSettings: StreamGraphAxisSettings = this.data.streamGraphSettings.categoryAxisSettings;
                let isXAxisOn: boolean = categoryAxisSettings.show === true;
                let isXTitleOn: boolean = categoryAxisSettings.showAxisTitle === true;
                let marginTop: number = this.margin.top;
                let height: number = this.viewport.height - marginTop - (isXAxisOn ? XAxisOnSize : XAxisOffSize) - (isXTitleOn ? XAxisLabelSize : 0);
                let values = this.dataView.categorical.values;
                let yAxisText: string = values.source ? values.source.displayName : this.getYAxisTitleFromValues(values);
                let textSettings: TextProperties = this.getTextPropertiesFunction(yAxisText);
                yAxisText = TextMeasurementService.getTailoredTextOrDefault(textSettings, height);
                let yAxisClass: string = StreamGraph.YAxisLabel.class;
                let yAxisLabel: D3.Selection = this.axisGraphicsContext.append("text")
                    .style("text-anchor", "middle")
                    .style("font-family", textSettings.fontFamily)
                    .style("font-size", textSettings.fontSize)
                    .style("font-style", textSettings.fontStyle)
                    .style("font-weight", textSettings.fontWeight)
                    .text(yAxisText)
                    .call((text: D3.Selection) => {
                        text.each(function () {
                            let text = d3.select(this);
                            text.attr({
                                class: yAxisClass,
                                transform: "rotate(-90)",
                                fill: valueAxisSettings.labelColor,
                                x: -(marginTop + (height / 2)),
                                dy: "1em"
                            });
                        });
                    });

                yAxisLabel.call(AxisHelper.LabelLayoutStrategy.clip,
                    height,
                    TextMeasurementService.svgEllipsis);
            }
        }

        private getYAxisTitleFromValues(values: DataViewValueColumns): string {
            let valuesMetadataArray: powerbi.DataViewMetadataColumn[] = [];
            for (let i = 0; i < values.length; i++) {
                if (values[i] && values[i].source && values[i].source.displayName) {
                    valuesMetadataArray.push({ displayName: values[i].source.displayName });
                }
            }
            let valuesNames: string[] = valuesMetadataArray.map(v => v ? v.displayName : '').filter((value, index, self) => value !== '' && self.indexOf(value) === index);
            return valueFormatter.formatListAnd(valuesNames);
        }

        private renderXAxisLabels(): void {
            this.axisGraphicsContext.selectAll(StreamGraph.XAxisLabel.selector).remove();
            let categoryAxisSettings = this.data.streamGraphSettings.categoryAxisSettings;
            this.margin.bottom = categoryAxisSettings.show ? XAxisOnSize : XAxisOffSize;

            if (categoryAxisSettings.showAxisTitle)
                if (this.dataView.categorical.categories[0].source) {
                    this.margin.bottom += XAxisLabelSize;
                    let valueAxisSettings: StreamGraphAxisSettings = this.data.streamGraphSettings.valueAxisSettings;
                    let isYAxisOn: boolean = valueAxisSettings.show === true;
                    let isYTitleOn: boolean = valueAxisSettings.showAxisTitle === true;
                    let leftMargin: number = (isYAxisOn ? YAxisOnSize : YAxisOffSize) + (isYTitleOn ? YAxisLabelSize : 0);
                    let width: number = this.viewport.width - this.margin.right - leftMargin;
                    let height: number = this.viewport.height;
                    let xAxisText: string = this.dataView.categorical.categories[0].source.displayName;
                    let textSettings: TextProperties = this.getTextPropertiesFunction(xAxisText);
                    xAxisText = TextMeasurementService.getTailoredTextOrDefault(textSettings, width);
                    let xAxisClass: string = StreamGraph.XAxisLabel.class;
                    let xAxisLabel: D3.Selection = this.axisGraphicsContext.append("text")
                        .style("text-anchor", "middle")
                        .style("font-family", textSettings.fontFamily)
                        .style("font-size", textSettings.fontSize)
                        .style("font-weight", textSettings.fontWeight)
                        .text(xAxisText)
                        .call((text: D3.Selection) => {
                            text.each(function () {
                                let text = d3.select(this);
                                text.attr({
                                    class: xAxisClass,
                                    transform: SVGUtil.translate(leftMargin + (width / 2), height),
                                    fill: categoryAxisSettings.labelColor,
                                    dy: "-0.5em",
                                });
                            });
                        });

                    xAxisLabel.call(AxisHelper.LabelLayoutStrategy.clip,
                        width,
                        TextMeasurementService.svgEllipsis);
                }
        }

        private renderLegend(streamGraphData: StreamData): void {
            let legendSettings: StreamGraphLegendSettings = streamGraphData.streamGraphSettings.legendSettings;
            let legendData: LegendData = streamGraphData.legendData;
            if (!this.dataView || !this.dataView.metadata)
                return;

            let legendObjectProperties: DataViewObject = DataViewObjects.getObject(this.dataView.metadata.objects, "legend", {});
            legendObjectProperties['titleText'] = legendSettings.titleText; // Force legend title when show = true
            LegendData.update(legendData, legendObjectProperties);

            let position: string = <string>legendObjectProperties[legendProps.position];

            if (position)
                this.legend.changeOrientation(LegendPosition[position]);

            this.legend.drawLegend(legendData, _.clone(this.viewport));
            Legend.positionChartArea(this.svg, this.legend);

            this.updateViewPort();
        }

        private updateViewPort(): void {
            let legendMargins: IViewport = this.legend.getMargins();
            let legendPosition: LegendPosition = this.legend.getOrientation();

            switch (legendPosition) {
                case LegendPosition.Top:
                case LegendPosition.TopCenter:
                case LegendPosition.Bottom:
                case LegendPosition.BottomCenter: {
                    this.viewport.height -= legendMargins.height;
                    break;
                }
                case LegendPosition.Left:
                case LegendPosition.LeftCenter:
                case LegendPosition.Right:
                case LegendPosition.RightCenter: {
                    this.viewport.width -= legendMargins.width;
                    break;
                }
            }
        }

        private setMaxTicks(axis: D3.Svg.Axis, maxSize: number, maxValue?: number): void {
            let maxTicks = maxValue === undefined
                ? this.getTicksByAxis(axis).length
                : Math.min(maxValue, this.getTicksByAxis(axis).length);

            if (axis.scale().domain.toString() === d3.scale.linear().domain.toString())
                axis.ticks(this.getFittedTickLength(axis, maxSize, maxTicks));
            else
                axis.tickValues(this.getFittedTickValues(axis, maxSize, maxTicks));
        }

        private getFittedTickLength(axis: D3.Svg.Axis, maxSize: number, maxTicks: number): number {
            for (let ticks: any[] = this.getTicksByAxis(axis), measureTickFunction = this.getMeasureTickFunction(axis, ticks);
                maxTicks > 0 && maxSize > 0 && (this.measureTicks(ticks, measureTickFunction) > maxSize || axis.scale().ticks([maxTicks]).length > maxTicks);
                maxTicks-- , ticks = this.getTicksByAxis(axis)) {
                axis.ticks(maxTicks);
            }
            return maxTicks;
        }

        private getFittedTickValues(axis: D3.Svg.Axis, maxSize: number, maxTicks: number): any[] {
            let ticks: any[] = this.getTicksByAxis(axis),
                maxWidthOf2Ticks: number,
                tickPairsWidths: any[] = [],
                measureTickFunction: (any) => number = this.getMeasureTickFunction(axis, ticks);

            for (let currentMaxTicks: number = maxTicks, indexes: number[] = [];
                maxTicks > 0 && maxSize > 0;
                currentMaxTicks-- , indexes = []) {
                switch (currentMaxTicks) {
                    case 0:
                        return [];
                    case 1:
                        indexes = [0];
                        break;
                    case 2:
                        indexes = [0, ticks.length - 1];
                        break;
                    default:
                        let takeEvery: number = ticks.length / (currentMaxTicks - 1);

                        for (let i = 0; i < currentMaxTicks - 1; i++) {
                            indexes.push(Math.round(takeEvery * i));
                        }

                        indexes.push(ticks.length - 1);
                        break;
                }

                let ticksIndexes: any[][] = indexes.map(x => [ticks[x], x]);
                maxWidthOf2Ticks = (maxSize / ticks.length) * 2;

                ticksIndexes.reduce((a, b) => {
                    tickPairsWidths.push([measureTickFunction(a[0]) + measureTickFunction(b[0]), (b[1] - a[1]) * maxWidthOf2Ticks]);
                    return b;
                });

                if (!tickPairsWidths.some(x => x[0] > x[1])) {
                    return ticksIndexes.map(x => x[0]);
                }
            }
            return [];
        }

        private measureTicks(ticks: any[], measureTickFunction: (number) => any): number {
            return ticks.map((x: any) => measureTickFunction(x)).reduce((a: number, b: number) => a + b);
        }

        private getTicksByAxis(axis: D3.Svg.Axis): any[] {
            let scale = axis.scale();
            let result: any = axis.tickValues() === null
                ? scale.ticks
                    ? scale.ticks.apply(scale, axis.ticks())
                    : scale.domain()
                : axis.tickValues();

            return result.length === undefined ? [result] : result;
        }

        private getMeasureTickFunction(axis: D3.Svg.Axis, ticks: string[]): (number) => any {
            let measureFunction = axis.orient() === "top" || axis.orient() === "bottom"
                ? TextMeasurementService.measureSvgTextWidth
                : TextMeasurementService.measureSvgTextHeight;
            let getTextPropertiesFunction = this.getTextPropertiesFunction;

            let cache = {};

            return function (x: any): number {
                return cache[x]
                    ? cache[x]
                    : cache[x] = measureFunction(getTextPropertiesFunction(axis.tickFormat()(x))) + axis.tickPadding();
            };
        }

        private getTextPropertiesFunction(text: string): TextProperties {
            let fontFamily: string = StreamGraphDefaultFontFamily,
                fontSize: string = PixelConverter.fromPoint(StreamGraphDefaultFontSizeInPoints),
                fontWeight: string = StreamGraphDefaultFontWeight;

            return { text: text, fontFamily: fontFamily, fontSize: fontSize, fontWeight: fontWeight };
        }

        private getWiggle(dataView: DataView) {
            if (dataView && dataView.metadata) {
                let objects = dataView.metadata.objects;

                if (objects) {
                    let general = DataViewObjects.getObject(objects, 'general', undefined);

                    if (general)
                        return <boolean>general['wiggle'];
                }
            }
            return true;
        }

        private enumerateValueAxisValues(enumeration: ObjectEnumerationBuilder): void {
            let valueAxisSettings: StreamGraphAxisSettings = this.data && this.data.streamGraphSettings ? this.data.streamGraphSettings.valueAxisSettings : StreamGraphDefaultSettings.valueAxisSettings;

            enumeration.pushInstance({
                selector: null,
                objectName: 'valueAxis',
                displayName: "Y-Axis",
                properties: {
                    show: valueAxisSettings.show,
                    showAxisTitle: valueAxisSettings.showAxisTitle,
                    labelColor: valueAxisSettings.labelColor,
                }
            });
        }

        private enumerateCategoryAxisValues(enumeration: ObjectEnumerationBuilder): void {
            let categoryAxisSettings: StreamGraphAxisSettings = this.data && this.data.streamGraphSettings ? this.data.streamGraphSettings.categoryAxisSettings : StreamGraphDefaultSettings.categoryAxisSettings;

            enumeration.pushInstance({
                selector: null,
                objectName: 'categoryAxis',
                displayName: "X-Axis",
                properties: {
                    show: categoryAxisSettings.show,
                    showAxisTitle: categoryAxisSettings.showAxisTitle,
                    labelColor: categoryAxisSettings.labelColor,
                }
            });
        }

        private enumerateLegend(enumeration: ObjectEnumerationBuilder): void {
            let legendSettings: StreamGraphLegendSettings = this.data && this.data.streamGraphSettings ? this.data.streamGraphSettings.legendSettings : StreamGraphDefaultSettings.legendSettings;

            enumeration.pushInstance({
                selector: null,
                objectName: 'legend',
                displayName: "Legend",
                properties: {
                    show: legendSettings.show,
                    position: LegendPosition[this.legend.getOrientation()],
                    showTitle: legendSettings.showTitle,
                    titleText: legendSettings.titleText,
                    labelColor: legendSettings.labelColor,
                    fontSize: legendSettings.fontSize,
                }
            });
        }

        private clearData() {
            this.svg.selectAll(StreamGraph.Layer.selector).remove();
            this.legend.drawLegend({ dataPoints: [] }, this.viewport);
            this.yAxis.selectAll("*").remove();
            this.axisGraphicsContext.selectAll(StreamGraph.YAxisLabel.selector).remove();
            this.xAxis.selectAll("*").remove();
            this.axisGraphicsContext.selectAll(StreamGraph.XAxisLabel.selector).remove();
            this.svg.select('.labels').remove();
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            let enumeration: ObjectEnumerationBuilder = new ObjectEnumerationBuilder(),
                dataView = this.dataView;

            let dataLabelsSettings;
            if (this.data)
                dataLabelsSettings = this.data.streamGraphSettings.dataLabelsSettings ? this.data.streamGraphSettings.dataLabelsSettings : StreamGraphDefaultSettings.dataLabelsSettings;

            switch (options.objectName) {
                case 'legend':
                    if (dataView
                        && dataView.categorical
                        && dataView.categorical.values
                        && dataView.categorical.values.source)
                        this.enumerateLegend(enumeration);
                    break;
                case 'categoryAxis':
                    this.enumerateCategoryAxisValues(enumeration);
                    break;
                case 'valueAxis':
                    this.enumerateValueAxisValues(enumeration);
                    break;
                case 'labels':
                    let labelSettingOptions: VisualDataLabelsSettingsOptions = {
                        enumeration: enumeration,
                        dataLabelsSettings: dataLabelsSettings,
                        show: true,
                        fontSize: true,
                    };
                    dataLabelUtils.enumerateDataLabels(labelSettingOptions);
                    break;
                case 'general':
                    let general: VisualObjectInstance = {
                        objectName: 'general',
                        displayName: 'General',
                        selector: null,
                        properties: {
                            wiggle: this.getWiggle(dataView)
                        }
                    };

                    enumeration.pushInstance(general);
                    break;
            }
            return enumeration.complete();
        }
    }
}