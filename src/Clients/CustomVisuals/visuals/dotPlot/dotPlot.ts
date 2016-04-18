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
    import ClassAndSelector = jsCommon.CssConstants.ClassAndSelector;
    import getAnimationDuration = AnimatorCommon.GetAnimationDuration;
    import CreateClassAndSelector = jsCommon.CssConstants.createClassAndSelector;
    import AxisScale = powerbi.visuals.axisScale;
    import PixelConverter = jsCommon.PixelConverter;

    const MaxXAxisHeight: number = 40;
    const LabelMargin: number = 15;
    const DefaultRadius: number = 5;
    const DefaultStrokeWidth: number = 1;
    const DefaultDataPointColor = "#00B8AA";
    const MinPrecision: number = 0;
    const MaxPrecision: number = 17;

    export const DotPlotProperties: any = {
        general: {
            formatString: <DataViewObjectPropertyIdentifier>{
                objectName: "general",
                propertyName: "formatString"
            }
        },
        labels: {
            show: <DataViewObjectPropertyIdentifier>{
                objectName: "labels",
                propertyName: "show"
            },
            fontSize: <DataViewObjectPropertyIdentifier>{
                objectName: "labels",
                propertyName: "fontSize"
            },
            labelPrecision: <DataViewObjectPropertyIdentifier>{
                objectName: "labels",
                propertyName: "labelPrecision"
            },
            labelDisplayUnits: <DataViewObjectPropertyIdentifier>{
                objectName: "labels",
                propertyName: "labelDisplayUnits"
            },
            labelColor: <DataViewObjectPropertyIdentifier>{
                objectName: "labels",
                propertyName: "color"
            }
        },
        dataPoint: {
            fill: <DataViewObjectPropertyIdentifier>{
                objectName: "dataPoint",
                propertyName: "fill"
            }
        },
        categories: {
            show: <DataViewObjectPropertyIdentifier>{
                objectName: "categories",
                propertyName: "show"
            },
            fontColor: <DataViewObjectPropertyIdentifier>{
                objectName: "categories",
                propertyName: "fontColor"
            },
            fontSize: <DataViewObjectPropertyIdentifier>{
                objectName: "categories",
                propertyName: "fontSize"
            }
        }
    };

    export interface DotPlotSelectors {
        svgPlotSelector: ClassAndSelector;
        plotSelector: ClassAndSelector;
        plotGroupSelector: ClassAndSelector;
        axisSelector: ClassAndSelector;
        xAxisSelector: ClassAndSelector;
        circleSeletor: ClassAndSelector;
    }

    export interface DotPlotChartCategory {
        value: string;
        selectionId: SelectionId;
    }

    export interface DotPlotConstructorOptions {
        animator?: IGenericAnimator;
        svg?: D3.Selection;
        margin?: IMargin;
        radius?: number;
        strokeWidth?: number;
    }

    export interface DotPlotDataPoint {
        x: number;
        y: number;
        tooltipInfo: TooltipDataItem[];
    }

    export interface DotPlotSettings {
        labelSettings?: VisualDataLabelsSettings;
        formatter?: IValueFormatter;
        tooltipFormatter?: IValueFormatter;
        categorySettings?: DotPlotCategorySettings;
        defaultDataPointColor?: string;
    }

    export interface DotPlotCategorySettings {
        show?: boolean;
        fontColor?: string;
        fontSize?: number;
    }

    export interface DotPlotDataGroup extends SelectableDataPoint {
        label?: string;
        value?: number;
        color?: string;
        tooltipInfo?: TooltipDataItem[];
        dataPoints: DotPlotDataPoint[];
        labelFontSize: string;
        highlight?: boolean;
    }

    export interface DotPlotDataView {
        displayName: string;
        dataPoints: DotPlotDataGroup[];
        values: any[];
        settings: DotPlotSettings;
        categories: DotPlotChartCategory[];
    }

    export class DotPlot implements IVisual {
        public static capabilities: VisualCapabilities = {
            dataRoles: [{
                name: 'Category',
                kind: powerbi.VisualDataRoleKind.Grouping,
                displayName: 'Category'
            },
                {
                    name: "Values",
                    kind: VisualDataRoleKind.Measure,
                    displayName: 'Values'
                }],
            dataViewMappings: [{
                conditions: [
                    { 'Category': { max: 1 }, 'Values': { max: 1 } },
                ],
                categorical: {
                    categories: {
                        for: { in: 'Category' },
                        dataReductionAlgorithm: { top: {} }
                    },
                    values: {
                        group: {
                            by: "Series",
                            select: [{ for: { in: "Values" } }],
                            dataReductionAlgorithm: { top: {} }
                        }
                    }
                },
            }],
            objects: {
                general: {
                    displayName: 'General',
                    properties: {
                        formatString: {
                            type: { formatting: { formatString: true } },
                        },
                    },
                },
                dataPoint: {
                    displayName: 'Data colors',
                    properties: {
                        fill: {
                            displayName: 'Fill',
                            type: { fill: { solid: { color: true } } }
                        }
                    }
                },
                labels: {
                    displayName: "Data labels",
                    description: 'Display data label options',
                    properties: {
                        show: {
                            displayName: 'Show',
                            type: { bool: true }
                        },
                        showSeries: {
                            displayName: 'Show',
                            type: { bool: true }
                        },
                        color: {
                            displayName: 'Color',
                            description: 'Select color for data labels',
                            type: { fill: { solid: { color: true } } }
                        },
                        labelDisplayUnits: {
                            displayName: 'Display units',
                            description: 'Select the units (millions, billions, etc.)',
                            type: { formatting: { labelDisplayUnits: true } },
                            suppressFormatPainterCopy: true
                        },
                        labelPrecision: {
                            displayName: 'Decimal places',
                            description: 'Select the number of decimal places to display',
                            placeHolderText: 'Auto',
                            type: { numeric: true },
                            suppressFormatPainterCopy: true
                        },
                        showAll: {
                            displayName: 'Customize series',
                            type: { bool: true }
                        },
                        fontSize: {
                            displayName: 'Text Size',
                            type: { formatting: { fontSize: true } }
                        },
                    }
                }
            }
        };

        private DefaultMargin: IMargin = {
            top: 10,
            bottom: 10,
            right: 20,
            left: 20
        };

        private svg: D3.Selection;
        private xAxis: D3.Selection;
        private dotPlot: D3.Selection;
        private clearCatcher: D3.Selection;
        private behavior: IInteractiveBehavior;

        private colors: IDataColorPalette;
        private dataView: DataView;
        private animator: IGenericAnimator;
        private durationAnimations: number = 200;
        private dotPlotDataView: DotPlotDataView;

        private radius: number;
        private strokeWidth: number;
        private interactivityService: IInteractivityService;
        private scaleType: string = AxisScale.linear;
        private textProperties: TextProperties = {
            fontFamily: 'wf_segoe-ui_normal',
            fontSize: jsCommon.PixelConverter.toString(9),
        };

        private dotPlotSelectors: DotPlotSelectors =
        {
            svgPlotSelector: CreateClassAndSelector('dotplot'),
            plotSelector: CreateClassAndSelector('dotplotSelector'),
            plotGroupSelector: CreateClassAndSelector('dotplotGroup'),
            axisSelector: CreateClassAndSelector('axisGraphicsContext'),
            xAxisSelector: CreateClassAndSelector('x axis'),
            circleSeletor: CreateClassAndSelector('circleSelector'),
        };

        private DefaultDotPlotSettings: DotPlotSettings = {
            labelSettings: {
                show: true,
                precision: 2,
                fontSize: dataLabelUtils.DefaultFontSizeInPt,
                displayUnits: 0,
                labelColor: dataLabelUtils.defaultLabelColor,
            },
            categorySettings: {
                show: true,
                fontColor: LegendData.DefaultLegendLabelFillColor
            },
            defaultDataPointColor: DefaultDataPointColor
        };

        private static getTooltipData(value: number): TooltipDataItem[] {
            return [{
                displayName: "Value",
                value: value.toString()
            }];
        }

        public static converter(dataView: DataView, scale: D3.Scale.OrdinalScale, defaultMargin: IMargin, defaultSetting: DotPlotSettings, colors: IDataColorPalette, viewport: IViewport, radius: number): DotPlotDataView {
            let values: DataViewValueColumns = dataView.categorical.values,
                dataPointsGroup: DotPlotDataGroup[] = [],
                displayName: string = dataView.categorical.categories[0].source.displayName,
                objects: DataViewObjects = this.getObjectsFromDataView(dataView),
                settings: DotPlotSettings,
                defaultColor = DataViewObjects.getFillColor(objects, DotPlotProperties.dataPoint.fill, colors.getColorByIndex(0).value);

            let categories: DotPlotChartCategory[] = dataView.categorical.categories[0].values.map((x, i) => <DotPlotChartCategory>{
                value: x,
                selectionId: SelectionId.createWithId(dataView.categorical.categories[0].identity[i])
            });

            settings = {
                categorySettings: this.getCategorySettings(objects, defaultSetting),
                defaultDataPointColor: defaultColor,
                labelSettings: this.parseSettings(objects, defaultSetting)
            };

            let categoryColumn = dataView.categorical.categories[0];
            let diameter: number = 2 * radius + 1;
            let dotsTotalHeight: number = viewport.height - radius - MaxXAxisHeight;
            let maxDots: number = Math.floor((dotsTotalHeight - defaultMargin.top) / diameter) - 1;
            let fontSizeInPx: string = PixelConverter.fromPoint(settings.labelSettings.fontSize);

            let yScale: D3.Scale.LinearScale = d3.scale.linear()
                .domain([0, maxDots])
                .range([dotsTotalHeight - defaultMargin.bottom, defaultMargin.top + defaultMargin.bottom]);

            for (let value of values) {
                let min = _.min(value.values);
                let max = _.max(value.values);

                let color = DataViewObjects.getFillColor(objects, DotPlotProperties.dataPoint.fill, colors.getColorByIndex(0).value);
                let length = value.values.length;
                let minDots = min / (max / maxDots);
                let dotsScale = d3.scale.log().domain([min, max]).range([minDots === 0 ? 1 : minDots, maxDots]).clamp(true);

                for (let k = 0; k < length; k++) {
                    let y = dotsScale(value.values[k]);
                    let dataPoints: DotPlotDataPoint[] = [];

                    for (let level = 0; level < y; level++) {
                        dataPoints.push({
                            x: scale(categories[k].value) + scale.rangeBand() / 2,
                            y: yScale(level),
                            tooltipInfo: DotPlot.getTooltipData(value.values[k])
                        });
                    }

                    let categorySelectionId = SelectionIdBuilder.builder().withCategory(categoryColumn, k).createSelectionId();
                    let tooltipInfo = DotPlot.getTooltipData(value.values[k]);

                    dataPointsGroup.push({
                        selected: false,
                        value: value.values[k],
                        label: value.values[k],
                        color: color,
                        identity: categorySelectionId,
                        tooltipInfo: tooltipInfo,
                        dataPoints: dataPoints,
                        labelFontSize: fontSizeInPx,
                    });
                }
            }

            return {
                dataPoints: dataPointsGroup,
                values: dataView.categorical.categories[0].values,
                displayName: displayName,
                categories: categories,
                settings: settings
            };
        }

        public constructor(options?: DotPlotConstructorOptions) {
            if (options) {
                if (options.svg) {
                    this.svg = options.svg;
                }
                if (options.animator) {
                    this.animator = options.animator;
                }

                this.radius = options.radius || DefaultRadius;
                this.strokeWidth = options.strokeWidth || DefaultStrokeWidth;
            }
        }

        public init(options: VisualInitOptions): void {
            let element = options.element;
            this.behavior = new DotplotBehavior();

            this.interactivityService = createInteractivityService(options.host);
            this.radius = DefaultRadius;
            this.strokeWidth = DefaultStrokeWidth;
            this.colors = options.style.colorPalette.dataColors;

            this.svg = d3.select(element.get(0)).append('svg').classed(this.dotPlotSelectors.svgPlotSelector.class, true).style('position', 'absolute');
            this.clearCatcher = appendClearCatcher(this.svg);

            let axisGraphicsContext = this.svg.append('g').classed(this.dotPlotSelectors.axisSelector.class, true);
            this.dotPlot = this.svg.append('g').classed(this.dotPlotSelectors.plotSelector.class, true);
            this.xAxis = axisGraphicsContext.append("g").classed(this.dotPlotSelectors.xAxisSelector.class, true);
        }

        public update(options: VisualUpdateOptions): void {
            if (!options.dataViews || !options.dataViews[0]) return;

            this.durationAnimations = getAnimationDuration(this.animator, options.suppressAnimations);
            let dataView = this.dataView = options.dataViews[0];
            let viewport = options.viewport;

            if (!dataView ||
                !dataView.categorical ||
                !dataView.categorical.values ||
                dataView.categorical.values.length < 1 ||
                !dataView.categorical ||
                !dataView.categorical.categories ||
                !dataView.categorical.categories[0]) {
                this.clearData();
                return;
            }

            let viewportIn: IViewport =
                {
                    height: (viewport.height - this.DefaultMargin.top),
                    width: (viewport.width - this.DefaultMargin.left)
                };

            this.svg.style({
                height: PixelConverter.toString(viewport.height),
                width: PixelConverter.toString(viewport.width)
            });

            let xAxisProperties = this.calculateAxes(viewportIn, this.textProperties, false);
            let data = DotPlot.converter(dataView, <D3.Scale.OrdinalScale>xAxisProperties.scale, this.DefaultMargin, this.DefaultDotPlotSettings, this.colors, viewport, this.radius);

            this.dotPlotDataView = data;
            let dataPoints = data.dataPoints;

            if (this.interactivityService)
                this.interactivityService.applySelectionStateToData(dataPoints);

            this.renderAxis(viewportIn.height - MaxXAxisHeight, xAxisProperties, data, this.durationAnimations);
            this.drawDotPlot(dataPoints, data.settings);

            let dataLabelsSettings = data.settings.labelSettings;
            if (dataLabelsSettings.show) {
                let layout = this.getEnhanchedDotplotLayout(dataLabelsSettings, viewportIn);
                dataLabelUtils.drawDefaultLabelsForDataPointChart(dataPoints, this.svg, layout, viewportIn, !options.suppressAnimations, this.durationAnimations);
            }
            else {
                dataLabelUtils.cleanDataLabels(this.svg);
            }
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            let enumeration = new ObjectEnumerationBuilder();

            switch (options.objectName) {
                case 'dataPoint':
                    this.enumerateDataPoints(enumeration, this.dataView);
                    break;
                case 'labels':
                    this.enumerateDataLabels(enumeration, this.dataView);
                    break;
                case 'categories':
                    this.enumerateCategories(enumeration, this.dataView);
                    break;
            }

            return enumeration.complete();
        }

        private static getObjectsFromDataView(dataView: DataView): DataViewObjects {
            if (!dataView ||
                !dataView.metadata ||
                !dataView.metadata.columns ||
                !dataView.metadata.objects) {
                return null;
            }

            return dataView.metadata.objects;
        }

        private static parseSettings(objects: DataViewObjects, defaultDotPlotSettings: DotPlotSettings): VisualDataLabelsSettings {
            let precision = this.getPrecision(objects, defaultDotPlotSettings);

            return {
                show: DataViewObjects.getValue(objects, DotPlotProperties.labels.show, defaultDotPlotSettings.labelSettings.show),
                precision: precision,
                fontSize: DataViewObjects.getValue(objects, DotPlotProperties.labels.fontSize, defaultDotPlotSettings.labelSettings.fontSize),
                displayUnits: DataViewObjects.getValue<number>(objects, DotPlotProperties.labels.labelDisplayUnits, defaultDotPlotSettings.labelSettings.displayUnits),
                labelColor: DataViewObjects.getFillColor(objects, DotPlotProperties.labels.labelColor, defaultDotPlotSettings.labelSettings.labelColor),
            };
        }

        private static getCategorySettings(objects: DataViewObjects, defaultDotPlotSettings: DotPlotSettings): DotPlotCategorySettings {
            return {
                show: DataViewObject.getValue<boolean>(objects, DotPlotProperties.categories.show, defaultDotPlotSettings.categorySettings.show),
                fontColor: DataViewObjects.getFillColor(objects, DotPlotProperties.categories.fontColor, defaultDotPlotSettings.categorySettings.fontColor)
            };
        }

        private static getPrecision(objects: DataViewObjects, defaultDotPlotSettings: DotPlotSettings): number {
            let precision: number = DataViewObjects.getValue<number>(objects, DotPlotProperties.labels.labelPrecision, defaultDotPlotSettings.labelSettings.precision);

            if (precision <= MinPrecision)
                return MinPrecision;

            if (precision >= MaxPrecision)
                return MaxPrecision;

            return precision;
        }

        private drawDotPlot(data: DotPlotDataGroup[], setting: DotPlotSettings): void {
            let selection: D3.UpdateSelection = this.dotPlot.selectAll(this.dotPlotSelectors.plotGroupSelector.selector).data(data);
            let hasSelection = this.interactivityService && this.interactivityService.hasSelection();

            selection
                .enter()
                .append('g')
                .attr(
                {
                    stroke: "black",
                    "stroke-width": this.strokeWidth
                }).
                style("fill-opacity", (item: DotPlotDataGroup) => ColumnUtil.getFillOpacity(item.selected, item.highlight, hasSelection, false)).
                classed(this.dotPlotSelectors.plotGroupSelector.class, true);

            let circleSelection = selection.selectAll(this.dotPlotSelectors.circleSeletor.selector).data((d: DotPlotDataGroup) => { return d.dataPoints; });
            circleSelection.enter().append('circle')
                .classed(this.dotPlotSelectors.circleSeletor.class, true);

            circleSelection.attr(
                {
                    cx: (point: DotPlotDataPoint) => { return point.x; },
                    cy: (point: DotPlotDataPoint) => { return point.y; },
                    r: this.radius,
                    fill: setting.defaultDataPointColor
                });

            this.renderTooltip(selection);
            circleSelection.exit().remove();
            selection.exit().remove();

            let interactivityService = this.interactivityService;
            if (interactivityService) {
                interactivityService.applySelectionStateToData(data);

                let behaviorOptions: DotplotBehaviorOptions = {
                    columns: selection,
                    clearCatcher: this.clearCatcher,
                    interactivityService: this.interactivityService,
                };
                interactivityService.bind(data, this.behavior, behaviorOptions);
            }
        }

        private getEnhanchedDotplotLayout(labelSettings: VisualDataLabelsSettings, viewport: IViewport): ILabelLayout {
            let fontSizeInPx = jsCommon.PixelConverter.fromPoint(labelSettings.fontSize);

            let formatter: IValueFormatter = valueFormatter.create({
                format: valueFormatter.getFormatString(this.dataView.categorical.categories[0].source, DotPlotProperties.general.formatString),
                precision: labelSettings.precision,
                value: labelSettings.displayUnits
            });

            return {
                labelText: function (d) {
                    return dataLabelUtils.getLabelFormattedText({
                        label: formatter.format(d.label),
                        fontSize: labelSettings.fontSize,
                        maxWidth: viewport.width,
                    });
                },
                labelLayout: {
                    x: (d: DotPlotDataGroup) => d && d.dataPoints && d.dataPoints[d.dataPoints.length - 1] ? d.dataPoints[d.dataPoints.length - 1].x : 0,
                    y: (d: DotPlotDataGroup) => d && d.dataPoints && d.dataPoints[d.dataPoints.length - 1] ? d.dataPoints[d.dataPoints.length - 1].y - LabelMargin : 0
                },
                filter: function (d) {
                    return (d != null && d.label != null);
                },
                style: {
                    'fill': labelSettings.labelColor,
                    'font-size': fontSizeInPx,
                },
            };
        }

        private enumerateDataLabels(enumeration: ObjectEnumerationBuilder, dataView: DataView): void {
            let objects = dataView && dataView.metadata ? dataView.metadata.objects : undefined;
            enumeration.pushInstance({
                objectName: "labels",
                displayName: "Labels",
                selector: null,
                properties: {
                    show: DataViewObjects.getValue<boolean>(objects, DotPlotProperties.labels.show, this.DefaultDotPlotSettings.labelSettings.show),
                    fontSize: DataViewObjects.getValue<number>(objects, DotPlotProperties.labels.fontSize, this.DefaultDotPlotSettings.labelSettings.fontSize),
                    labelPrecision: DataViewObjects.getValue<number>(objects, DotPlotProperties.labels.labelPrecision, this.DefaultDotPlotSettings.labelSettings.precision),
                    labelDisplayUnits: DataViewObjects.getValue<number>(objects, DotPlotProperties.labels.labelDisplayUnits, this.DefaultDotPlotSettings.labelSettings.displayUnits),
                    color: DataViewObjects.getFillColor(objects, DotPlotProperties.labels.labelColor, this.DefaultDotPlotSettings.labelSettings.labelColor)
                }
            });
        }

        private enumerateDataPoints(enumeration: ObjectEnumerationBuilder, dataView: DataView): void {
            let objects = dataView && dataView.metadata ? dataView.metadata.objects : undefined;
            let dataPointColor = DataViewObjects.getFillColor(objects, DotPlotProperties.dataPoint.fill, this.DefaultDotPlotSettings.defaultDataPointColor);
            enumeration.pushInstance({
                objectName: "dataPoint",
                displayName: "Data Points",
                selector: null,
                properties: {
                    fill: { solid: { color: dataPointColor } }
                }
            });
        }

        private enumerateCategories(enumeration: ObjectEnumerationBuilder, dataView: DataView): void {
            let objects = dataView && dataView.metadata ? dataView.metadata.objects : undefined;
            let categoriesSettings = DotPlot.getCategorySettings(objects, this.DefaultDotPlotSettings);
            enumeration.pushInstance({
                objectName: "categories",
                displayName: "Categories",
                selector: null,
                properties: {
                    show: categoriesSettings.show,
                    fontSize: categoriesSettings.fontSize,
                    fontColor: categoriesSettings.fontColor
                }
            });
        }

        private clearData(): void {
            this.dotPlot.selectAll("*").remove();
            this.xAxis.selectAll("*").remove();
            dataLabelUtils.cleanDataLabels(this.svg);
        }

        private renderTooltip(selection: D3.UpdateSelection): void {
            TooltipManager.addTooltip(selection, (tooltipEvent: TooltipEvent) =>
                (<DotPlotDataGroup>tooltipEvent.data).tooltipInfo);
        }

        private calculateAxes(
            viewportIn: IViewport,
            textProperties: TextProperties,
            scrollbarVisible: boolean): IAxisProperties {

            let category = this.dataView.categorical.categories && this.dataView.categorical.categories.length > 0
                ? this.dataView.categorical.categories[0]
                : {
                    source: undefined,
                    values: [valueFormatter.format(null)],
                    identity: undefined,
                };

            let visualOptions: CalculateScaleAndDomainOptions = {
                viewport: viewportIn,
                margin: this.DefaultMargin,
                forcedXDomain: this.dataView.categorical.categories[0].values,
                forceMerge: false,
                showCategoryAxisLabel: false,
                showValueAxisLabel: false,
                categoryAxisScaleType: this.scaleType,
                valueAxisScaleType: null,
                valueAxisDisplayUnits: 0,
                categoryAxisDisplayUnits: 0,
                trimOrdinalDataOnOverflow: false,
            };

            let width = viewportIn.width;
            let axes = this.calculateAxesProperties(viewportIn, visualOptions, category.source);
            axes.willLabelsFit = AxisHelper.LabelLayoutStrategy.willLabelsFit(
                axes,
                width,
                TextMeasurementService.measureSvgTextWidth,
                textProperties);

            // If labels do not fit and we are not scrolling, try word breaking
            axes.willLabelsWordBreak = (!axes.willLabelsFit && !scrollbarVisible) && AxisHelper.LabelLayoutStrategy.willLabelsWordBreak(
                axes, this.DefaultMargin, width, TextMeasurementService.measureSvgTextWidth,
                TextMeasurementService.estimateSvgTextHeight, TextMeasurementService.getTailoredTextOrDefault,
                textProperties);

            return axes;
        }

        private calculateAxesProperties(viewportIn: IViewport, options: CalculateScaleAndDomainOptions, metaDataColumn: DataViewMetadataColumn): IAxisProperties {
            let xAxisProperties = AxisHelper.createAxis({
                pixelSpan: viewportIn.width,
                dataDomain: options.forcedXDomain,
                metaDataColumn: metaDataColumn,
                formatString: valueFormatter.getFormatString(metaDataColumn, DotPlotProperties.general.formatString),
                outerPadding: 0,
                isScalar: false,
                isVertical: false,
                forcedTickCount: options.forcedTickCount,
                useTickIntervalForDisplayUnits: true,
                isCategoryAxis: true,
                getValueFn: (index, type) => index,
                scaleType: options.categoryAxisScaleType,
                axisDisplayUnits: options.categoryAxisDisplayUnits
            });

            xAxisProperties.axisLabel = "New Label";
            return xAxisProperties;
        }

        private renderAxis(height: number, xAxisProperties: IAxisProperties, data: DotPlotDataView, duration: number): void {
            this.xAxis.attr(
                {
                    transform: SVGUtil.translate(0, height)
                });

            let xAxis = xAxisProperties.axis;
            xAxis.orient('bottom');

            this.xAxis
                .transition()
                .duration(duration)
                .call(xAxis);
        }
    }

    export interface DotplotBehaviorOptions {
        columns: D3.Selection;
        clearCatcher: D3.Selection;
        interactivityService: IInteractivityService;
    }

    export class DotplotBehavior implements IInteractiveBehavior {
        private columns: D3.Selection;
        private clearCatcher: D3.Selection;
        private interactivityService: IInteractivityService;

        public bindEvents(options: DotplotBehaviorOptions, selectionHandler: ISelectionHandler): void {
            this.columns = options.columns;
            this.clearCatcher = options.clearCatcher;
            this.interactivityService = options.interactivityService;

            this.columns.on('click', (d: SelectableDataPoint, i: number) => {
                selectionHandler.handleSelection(d, d3.event.ctrlKey);
            });

            options.clearCatcher.on('click', () => {
                selectionHandler.handleClearSelection();
            });
        }

        public renderSelection(hasSelection: boolean) {
            let hasHighlights = this.interactivityService.hasSelection();
            this.columns.style("fill-opacity", (d: DotPlotDataGroup) => ColumnUtil.getFillOpacity(d.selected, d.highlight, !d.highlight && hasSelection, !d.selected && hasHighlights));
        }
    }
}