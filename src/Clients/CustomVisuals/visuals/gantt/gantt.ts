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
    import PixelConverter = jsCommon.PixelConverter;
    import IStringResourceProvider = jsCommon.IStringResourceProvider;

    const PercentFormat: string = "0.00 %;-0.00 %;0.00 %";
    const MillisecondsInADay: number = 86400000;
    const MillisecondsInWeek: number = 604800000;
    const MillisecondsInAMonth: number = 2629746000;
    const MillisecondsInAYear: number = 31556952000;
    export const DefaultDateType: string = "Week";
    const ChartLineHeight: number = 40;
    const PaddingTasks: number = 5;

    export module dateTypeSelector {
        export const day: string = 'Day';
        export const week: string = 'Week';
        export const month: string = 'Month';
        export const year: string = 'Year';

        export const type: IEnumType = createEnumType([
            { value: day, displayName: 'Day' },
            { value: week, displayName: 'Week' },
            { value: month, displayName: 'Month' },
            { value: year, displayName: 'Year' }
        ]);
    }
    export interface Task extends SelectableDataPoint {
        id: number;
        name: string;
        start: Date;
        duration: number;
        completion: number;
        resource: string;
        end: Date;
        taskType: string;
        description: string;
        color: string;
        tooltipInfo: TooltipDataItem[];
    }

    export interface GanttChartFormatters {
        startDateFormatter: IValueFormatter;
        completionFormatter: IValueFormatter;
        durationFormatter: IValueFormatter;
    }

    export interface GanttChartData {
        legendData: LegendData;
        series: GanttSeries[];
        showLegend: boolean;
    }

    export interface GanttViewModel {
        taskLabelsShow: boolean;
        taskLabelsColor: string;
        taskLabelsFontSize: number;
        taskLabelsWidth: number;
        taskProgressColor: string;
        taskResourceShow: boolean;
        taskResourceColor: string;
        taskResourceFontSize: number;
        legendData: LegendData;
        taskTypes: TaskTypes;
        dateType: string;
    }

    export interface GanttDataPoint extends SelectableDataPoint {
        color: string;
        value: any;
    }

    export interface GanttSeries extends SelectableDataPoint {
        tasks: Task[];
        fill: string;
        name: string;
    }

    export interface TaskTypes { /*TODO: change to more proper name*/
        types: string[];
        typeName: string;
    };

    interface Line {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        tooltipInfo: TooltipDataItem[];
    }

    export const GanttChartProps = {
        legend: {
            show: <DataViewObjectPropertyIdentifier>{ objectName: 'legend', propertyName: 'show' },
            position: <DataViewObjectPropertyIdentifier>{ objectName: 'legend', propertyName: 'position' },
            showTitle: <DataViewObjectPropertyIdentifier>{ objectName: 'legend', propertyName: 'showTitle' },
            titleText: <DataViewObjectPropertyIdentifier>{ objectName: 'legend', propertyName: 'titleText' },
            labelColor: <DataViewObjectPropertyIdentifier>{ objectName: 'legend', propertyName: 'labelColor' },
            fontSize: <DataViewObjectPropertyIdentifier>{ objectName: 'legend', propertyName: 'fontSize' },
        },
        taskCompletion: {
            fill: <DataViewObjectPropertyIdentifier>{ objectName: 'taskCompletion', propertyName: 'fill' },
        },
        dataPoint: {
            fill: <DataViewObjectPropertyIdentifier>{ objectName: 'dataPoint', propertyName: 'fill' },
        },
        taskLabels: {
            show: <DataViewObjectPropertyIdentifier>{ objectName: 'taskLabels', propertyName: 'show' },
            fill: <DataViewObjectPropertyIdentifier>{ objectName: 'taskLabels', propertyName: 'fill' },
            fontSize: <DataViewObjectPropertyIdentifier>{ objectName: 'taskLabels', propertyName: 'fontSize' },
            width: <DataViewObjectPropertyIdentifier>{ objectName: 'taskLabels', propertyName: 'width' },
        },
        taskResource: {
            show: <DataViewObjectPropertyIdentifier>{ objectName: 'taskResource', propertyName: 'show' },
            fill: <DataViewObjectPropertyIdentifier>{ objectName: 'taskResource', propertyName: 'fill' },
            fontSize: <DataViewObjectPropertyIdentifier>{ objectName: 'taskResource', propertyName: 'fontSize' },
        },
        ganttDateType:
        {
            type: <DataViewObjectPropertyIdentifier>{ objectName: 'ganttDateType', propertyName: 'type' },
        }
    };

    module Selectors {

        import ClassAndSelector = jsCommon.CssConstants.ClassAndSelector;
        import CreateClassAndSelector = jsCommon.CssConstants.createClassAndSelector;

        export const ClassName: ClassAndSelector = CreateClassAndSelector("gantt");
        export const Chart: ClassAndSelector = CreateClassAndSelector("chart");
        export const ChartLine: ClassAndSelector = CreateClassAndSelector("chart-line");
        export const Body: ClassAndSelector = CreateClassAndSelector("gantt-body");
        export const AxisGroup: ClassAndSelector = CreateClassAndSelector("axis");
        export const Domain: ClassAndSelector = CreateClassAndSelector("domain");
        export const AxisTick: ClassAndSelector = CreateClassAndSelector("tick");

        export const Tasks: ClassAndSelector = CreateClassAndSelector("tasks");
        export const SingleTask: ClassAndSelector = CreateClassAndSelector("task");
        export const TaskRect: ClassAndSelector = CreateClassAndSelector("task-rect");
        export const TaskProgress: ClassAndSelector = CreateClassAndSelector("task-progress");
        export const TaskResource: ClassAndSelector = CreateClassAndSelector("task-resource");
        export const SingleMilestone: ClassAndSelector = CreateClassAndSelector("milestone");

        export const TaskLabels: ClassAndSelector = CreateClassAndSelector("task-labels");
        export const TaskLines: ClassAndSelector = CreateClassAndSelector("task-lines");
        export const SingleTaskLine: ClassAndSelector = CreateClassAndSelector("task-line");
        export const Label: ClassAndSelector = CreateClassAndSelector("label");
        export const LegendItems: ClassAndSelector = CreateClassAndSelector("legendItem");
        export const LegendTitle: ClassAndSelector = CreateClassAndSelector("legendTitle");
    }

    export class Gantt implements IVisual {

        private data: GanttChartData;
        private dataView: DataView;
        private viewport: IViewport;
        private colors: IDataColorPalette;
        private legend: ILegend;
        private legendObjectProperties: DataViewObject;

        private textProperties: TextProperties = {
            fontFamily: 'wf_segoe-ui_normal',
            fontSize: jsCommon.PixelConverter.toString(9),
        };

        private static DefaultValues = {
            AxisTickSize: 6,
            LabelFontSize: 9,
            LegendFontSize: 8,
            LegendLabelColor: "#000000",
            MaxTaskOpacity: 1,
            MinTaskOpacity: 0.4,
            ProgressBarHeight: 4,
            ProgressColor: "#000000",
            ResourceFontSize: 9,
            ResourceWidth: 100,
            TaskColor: "#00B099",
            TaskLabelColor: "#000000",
            TaskLabelWidth: 110,
            TaskLineWidth: 15,
            TaskResourceColor: "#000000",
            ganttFormatString: "MMM dd"
        };

        public static capabilities: VisualCapabilities = {
            dataRoles: [
                {
                    name: "Legend",
                    kind: VisualDataRoleKind.Grouping,
                    displayName: "Legend",
                }, {
                    name: "Task",
                    kind: VisualDataRoleKind.Grouping,
                    displayName: "Task"
                }, {
                    name: "StartDate",
                    kind: VisualDataRoleKind.Grouping,
                    displayName: "Start Date",
                }, {
                    name: "Duration",
                    kind: VisualDataRoleKind.Measure,
                    displayName: "Duration",
                    requiredTypes: [{ numeric: true }, { integer: true }]
                }, {
                    name: "Completion",
                    kind: VisualDataRoleKind.Measure,
                    displayName: "% Completion",
                    requiredTypes: [{ numeric: true }, { integer: true }]
                }, {
                    name: "Resource",
                    kind: VisualDataRoleKind.Grouping,
                    displayName: "Resource"
                }
            ],
            dataViewMappings: [{
                conditions: [
                    {
                        "Legend": { min: 0, max: 1 },
                        "Task": { min: 1, max: 1 },
                        "StartDate": { min: 0, max: 0 },
                        "Duration": { min: 0, max: 0 },
                        "Completion": { min: 0, max: 0 },
                        "Resource": { min: 0, max: 0 }
                    }, {
                        "Legend": { min: 0, max: 1 },
                        "Task": { min: 1, max: 1 },
                        "StartDate": { min: 0, max: 1 },
                        "Duration": { min: 0, max: 0 },
                        "Completion": { min: 0, max: 0 },
                        "Resource": { min: 0, max: 0 }
                    }, {
                        "Legend": { min: 0, max: 1 },
                        "Task": { min: 0, max: 1 },
                        "StartDate": { min: 0, max: 1 },
                        "Duration": { min: 0, max: 1 },
                        "Completion": { min: 0, max: 1 },
                        "Resource": { min: 0, max: 1 },
                    }
                ],
                table: {
                    rows: {
                        select:
                        [
                            { for: { in: "Legend" } },
                            { for: { in: "Task" } },
                            { for: { in: "StartDate" } },
                            { for: { in: "Duration" } },
                            { for: { in: "Completion" } },
                            { for: { in: "Resource" } },
                        ]
                    },
                },
            }],
            sorting: {
                default: {},
            },
            objects: {
                legend: {
                    displayName: "Legend",
                    description: "Display legend options",
                    properties: {
                        show: {
                            displayName: "Show",
                            type: { bool: true }
                        },
                        position: {
                            displayName: "Position",
                            description: "Select the location for the legend",
                            type: { enumeration: legendPosition.type }
                        },
                        showTitle: {
                            displayName: "Title",
                            description: "Display a title for legend symbols",
                            type: { bool: true }
                        },
                        titleText: {
                            displayName: "Legend Name",
                            description: "Title text",
                            type: { text: true },
                            suppressFormatPainterCopy: true
                        },
                        labelColor: {
                            displayName: "Color",
                            type: { fill: { solid: { color: true } } }
                        },
                        fontSize: {
                            displayName: "Text Size",
                            type: { formatting: { fontSize: true } }
                        }
                    }
                },
                //dataPoint: {
                //    displayName: "Data colors",
                //    properties: {
                //        fill: {
                //            displayName: "Fill",
                //            type: { fill: { solid: { color: true } } }
                //        }
                //    }
                //},
                taskLabels: {
                    displayName: 'Category Labels',
                    properties: {
                        show: {
                            displayName: "Show",
                            type: { bool: true }
                        },
                        fill: {
                            displayName: 'Fill',
                            type: { fill: { solid: { color: true } } }
                        },
                        fontSize: {
                            displayName: 'Font Size',
                            type: { formatting: { fontSize: true } }
                        },
                        width: {
                            displayName: 'Width',
                            type: { numeric: true }
                        }
                    }
                },
                taskCompletion: {
                    displayName: 'Task Completion',
                    properties: {
                        show: {
                            type: { bool: true }
                        },
                        fill: {
                            displayName: 'Completion Color',
                            type: { fill: { solid: { color: true } } }
                        }
                    }
                },
                taskResource: {
                    displayName: 'Data Labels',
                    properties: {
                        show: {
                            displayName: "Show",
                            type: { bool: true }
                        },
                        fill: {
                            displayName: 'Color',
                            type: { fill: { solid: { color: true } } }
                        },
                        fontSize: {
                            displayName: 'Font Size',
                            type: { formatting: { fontSize: true } }
                        }
                    }
                },
                ganttDateType: {
                    displayName: 'Gantt Date Type',
                    properties: {
                        type: {
                            displayName: "Type",
                            type: { enumeration: dateTypeSelector.type }
                        },
                    }
                },
            }
        };

        private margin: IMargin = {
            top: 50,
            right: 40,
            bottom: 40,
            left: 10
        };

        private style: IVisualStyle;
        private body: D3.Selection;
        private ganttSvg: D3.Selection;
        private viewModel: GanttViewModel;
        private timeScale: D3.Scale.TimeScale;
        private axisGroup: D3.Selection;

        private chartGroup: D3.Selection;
        private taskGroup: D3.Selection;
        private lineGroup: D3.Selection;

        private clearCatcher: D3.Selection;
        private ganttDiv: D3.Selection;
        private selectionManager: SelectionManager;
        private behavior: GanttChartBehavior;
        private interactivityService: IInteractivityService;
        private hostServices: IVisualHostServices;
        private isInteractiveChart: boolean;

        public static getMaxTaskOpacity(): number {
            return Gantt.DefaultValues.MaxTaskOpacity;
        }

        public static getMinTaskOpacity(): number {
            return Gantt.DefaultValues.MinTaskOpacity;
        }

        public init(options: VisualInitOptions): void {
            let element: JQuery = options.element;

            this.style = options.style;
            this.body = d3.select(element.get(0));

            this.hostServices = options.host;
            this.selectionManager = new SelectionManager({ hostServices: options.host });

            this.isInteractiveChart = options.interactivity && options.interactivity.isInteractiveLegend;
            this.interactivityService = createInteractivityService(this.hostServices);
            this.createViewport(element);
            this.updateChartSize(options.viewport);
            this.behavior = new GanttChartBehavior();
            this.colors = options.style.colorPalette.dataColors;

            this.data = {
                legendData: null,
                series: null,
                showLegend: null
            };
        }

        /**
         * Create the vieport area of the gantt chart
         */
        private createViewport(element: JQuery): void {
            //create div container to the whole viewport area
            this.ganttDiv = this.body.append("div")
                .classed(Selectors.Body.class, true);

            //create container to the svg area
            this.ganttSvg = this.ganttDiv
                .append("svg")
                .classed(Selectors.ClassName.class, true);
         
            //create clear catcher
            this.clearCatcher = appendClearCatcher(this.ganttSvg);

            //create axis container
            this.axisGroup = this.ganttSvg
                .append("g")
                .classed(Selectors.AxisGroup.class, true);
            
            //create task lines container
            this.lineGroup = this.ganttSvg
                .append("g")
                .classed(Selectors.TaskLines.class, true);
            
            //create chart container
            this.chartGroup = this.ganttSvg
                .append("g")
                .classed(Selectors.Chart.class, true);
            
            //create tasks container
            this.taskGroup = this.chartGroup
                .append("g")
                .classed(Selectors.Tasks.class, true);

            //create legend container
            this.legend = createLegend(element.children(Selectors.Body.selector),
                this.isInteractiveChart,
                this.interactivityService,
                true,
                LegendPosition.Top);
        }

        /**
         * Clear the viewport area
         */
        private clearViewport(): void {
            this.body.selectAll(Selectors.LegendItems.selector).remove();
            this.body.selectAll(Selectors.LegendTitle.selector).remove();
            this.axisGroup.selectAll(Selectors.AxisTick.selector).remove();
            this.axisGroup.selectAll(Selectors.Domain.selector).remove();
            this.lineGroup.selectAll("*").remove();
            this.chartGroup.selectAll(Selectors.ChartLine.selector).remove();
            this.chartGroup.selectAll(Selectors.SingleTask.selector).remove();
        }

        /**
         * Update div container size to the whole viewport area
         * @param viewport The vieport to change it size 
         */
        private updateChartSize(viewport: IViewport): void {
            this.ganttDiv.style({
                height: PixelConverter.toString(viewport.height),
                width: PixelConverter.toString(viewport.width)
            });
        }

        /**
       * Create the gantt tasks series based on all task types
       * @param taskTypes All unique types from the tasks array.
       */
        private createSeries(objects: DataViewObjects, tasks: Task[]): GanttSeries[] {
            let colorHelper = new ColorHelper(this.colors, GanttChartProps.dataPoint.fill);
            let taskGroup: _.Dictionary<Task[]> = _.groupBy(tasks, t=> t.taskType);
            let taskTypes = Gantt.getAllTasksTypes(this.dataView);

            let series: GanttSeries[] = _.map(taskTypes.types, type => {
                return {
                    tasks: taskGroup[type],
                    fill: colorHelper.getColorForMeasure(objects, type),
                    name: type,
                    identity: SelectionId.createWithMeasure(type),
                    selected: false
                };
            });

            return series;
        }

        /**
        * Convert the dataView to view model
        * @param dataView The data Model
        */
        public static converter(dataView: DataView, colorPalette: IDataColorPalette): GanttViewModel {
            let taskLabelsShow: boolean = DataViewObjects.getValue<boolean>(dataView.metadata.objects, GanttChartProps.taskLabels.show, true);
            let taskLabelsColor: string = DataViewObjects.getFillColor(dataView.metadata.objects, GanttChartProps.taskLabels.fill, Gantt.DefaultValues.TaskLabelColor);
            let taskLabelsFontSize: number = DataViewObjects.getValue<number>(dataView.metadata.objects, GanttChartProps.taskLabels.fontSize, Gantt.DefaultValues.LabelFontSize);
            let taskLabelsWidth: number = DataViewObjects.getValue<number>(dataView.metadata.objects, GanttChartProps.taskLabels.width, taskLabelsShow ? Gantt.DefaultValues.TaskLabelWidth : 0);
            let taskProgressColor: string = DataViewObjects.getFillColor(dataView.metadata.objects, GanttChartProps.taskCompletion.fill, Gantt.DefaultValues.ProgressColor);
            let taskResourceColor: string = DataViewObjects.getFillColor(dataView.metadata.objects, GanttChartProps.taskResource.fill, Gantt.DefaultValues.TaskResourceColor);
            let taskResourceFontSize: number = DataViewObjects.getValue<number>(dataView.metadata.objects, GanttChartProps.taskResource.fontSize, Gantt.DefaultValues.ResourceFontSize);
            let taskResourceShow: boolean = DataViewObjects.getValue<boolean>(dataView.metadata.objects, GanttChartProps.taskResource.show, true);
            let dateType: string = DataViewObjects.getValue<string>(dataView.metadata.objects, GanttChartProps.ganttDateType.type, DefaultDateType);

            let taskTypes = Gantt.getAllTasksTypes(dataView);
            let colorHelper = new ColorHelper(colorPalette, GanttChartProps.dataPoint.fill);
            let legendData: LegendData = {
                fontSize: Gantt.DefaultValues.LegendFontSize,
                dataPoints: [],
                title: taskTypes.typeName
            };

            legendData.dataPoints = _.map(taskTypes.types, type => {
                return {
                    label: type,
                    color: colorHelper.getColorForMeasure(dataView.metadata.objects, type),
                    icon: LegendIcon.Circle,
                    selected: false,
                    identity: SelectionId.createWithMeasure(type)
                };
            });

            let settings: GanttViewModel = {
                taskLabelsShow: taskLabelsShow,
                taskLabelsColor: taskLabelsColor,
                taskLabelsFontSize: taskLabelsFontSize,
                taskLabelsWidth: taskLabelsWidth,
                taskProgressColor: taskProgressColor,
                taskResourceShow: taskResourceShow,
                taskResourceColor: taskResourceColor,
                taskResourceFontSize: taskResourceFontSize,
                legendData: legendData,
                taskTypes: taskTypes,
                dateType: dateType
            };

            return settings;
        }

        /**
         * Returns the chart formatters
         * @param dataView The data Model
         */
        private parseSettings(dataView: DataView): GanttChartFormatters {
            if (!dataView ||
                !dataView.metadata ||
                !dataView.metadata.columns)
                return null;

            let dateFormat = "d";
            let numberFormat = "#";

            for (let dvColumn of dataView.metadata.columns) {
                if (!!dataView.categorical.categories) {
                    for (let dvCategory of dataView.categorical.categories) {
                        if (this.hasRole(dvCategory.source, "StartDate"))
                            dateFormat = dvColumn.format;
                    }
                }
            }

            return <GanttChartFormatters>{
                startDateFormatter: valueFormatter.create({ format: dateFormat }),
                durationFormatter: valueFormatter.create({ format: numberFormat }),
                completionFormatter: valueFormatter.create({ format: PercentFormat, value: 1, allowFormatBeautification: true })
            };
        }

        private isValidDate(date: Date) {
            if (Object.prototype.toString.call(date) !== "[object Date]")
                return false;
            return !isNaN(date.getTime());
        }

        private convertToDecimal(number) {
            if (!(number >= 0 && number <= 1))
                return (number / 100);
            return number;
        }

        /**
        * Create task objects dataView
        * @param dataView The data Model.
        * @param formatters task attributes represented format.
        * @param series An array that holds the color data of different task groups.
        */
        private createTasks(dataView: DataView, formatters: GanttChartFormatters): Task[] {
            let columnSource = dataView.table.columns;
            let data = dataView.table.rows;
            let categories = dataView.categorical.categories[0];
            let colorHelper = new ColorHelper(this.colors, GanttChartProps.dataPoint.fill);

            return data.map((child: DataViewTableRow, index: number) => {
                let dateString = this.getTaskProperty<Date>(columnSource, child, "StartDate");
                //let startDate = new Date(dateString);
                dateString = this.isValidDate(dateString) ? dateString : new Date(Date.now());

                let duration = this.getTaskProperty<number>(columnSource, child, "Duration");

                let completionValue = this.getTaskProperty<number>(columnSource, child, "Completion");
                let completion = this.convertToDecimal(completionValue);
                completion = completion <= 1 ? completion : 1;

                let taskType = this.getTaskProperty<string>(columnSource, child, "Legend");
                let tasksTypeColor: string = colorHelper.getColorForMeasure(dataView.metadata.objects, taskType);

                let task: Task = {
                    id: index,
                    name: this.getTaskProperty<string>(columnSource, child, "Task"),
                    start: dateString ? dateString : new Date(Date.now()),
                    duration: duration > 0 ? duration : 1,
                    end: null,
                    completion: completion > 0 ? completion : 0,
                    resource: this.getTaskProperty<string>(columnSource, child, "Resource"),
                    taskType: taskType,
                    color: tasksTypeColor ? tasksTypeColor : Gantt.DefaultValues.TaskColor, /* get color by task type  */
                    tooltipInfo: null,
                    description: "",
                    identity: SelectionId.createWithIdAndMeasure(categories.identity[index], taskType),
                    selected: false
                };

                task.end = d3.time.day.offset(task.start, task.duration);
                task.tooltipInfo = this.getTooltipInfo(task, formatters);
                return task;
            });
        }

        /**
        * Gets all unique types from the tasks array
        * @param dataView The data model.
        */
        private static getAllTasksTypes(dataView: DataView): TaskTypes {
            let types: string[] = [];
            let groupName: string = "";
            let taskTypes: TaskTypes;
            let data = dataView.table.rows;
            let index = _.findIndex(dataView.table.columns, col => col.roles.hasOwnProperty("Legend"));

            if (index !== -1) {
                groupName = dataView.table.columns[index].displayName;
                types = _.unique(data, (d) => d[index]).map((d) => d[index]);
            }

            taskTypes = {
                typeName: groupName,
                types: types
            };

            return taskTypes;
        }

        /**
        * Get the tooltip info (data display names & formated values)
        * @param task All task attributes.
        * @param formatters Formatting options for gantt attributes.
        */
        private getTooltipInfo(task: Task, formatters: GanttChartFormatters, timeInterval: string = "Days") {
            let tooltipDataArray: TooltipDataItem[] = [];

            if (task.taskType)
                tooltipDataArray.push({ displayName: Gantt.capabilities.dataRoles[0].name, value: task.taskType });

            tooltipDataArray.push({ displayName: Gantt.capabilities.dataRoles[1].name, value: task.name });
            if (!isNaN(task.start.getDate()))
                tooltipDataArray.push({ displayName: Gantt.capabilities.dataRoles[2].name, value: formatters.startDateFormatter.format(task.start.toLocaleDateString()) });

            tooltipDataArray.push({ displayName: Gantt.capabilities.dataRoles[3].name, value: formatters.durationFormatter.format(task.duration) + " " + timeInterval });
            tooltipDataArray.push({ displayName: Gantt.capabilities.dataRoles[4].name, value: formatters.completionFormatter.format(task.completion) });

            if (task.resource)
                tooltipDataArray.push({ displayName: Gantt.capabilities.dataRoles[5].name, value: task.resource });

            return tooltipDataArray;
        }

        /**
         * Get task property from the data view
         * @param columnSource
         * @param child
         * @param propertyName The property to get
         */
        private getTaskProperty<T>(columnSource: DataViewMetadataColumn[], child: DataViewTableRow, propertyName: string): T {
            if (!child ||
                !columnSource ||
                !(columnSource.length > 0) ||
                !columnSource[0].roles)
                return null;

            let index = columnSource.indexOf(columnSource.filter(x=> x.roles[propertyName])[0]);
            return index !== -1 ? <T>child[index] : null;
        }

        /**
         * Check if dataView has a given role
         * @param column The dataView headers
         * @param name The role to find
         */
        private hasRole(column: DataViewMetadataColumn, name: string) {
            var roles = column.roles;
            return roles && roles[name];
        }

        /**
         * Check if task has data for task
         * @param dataView
         */
        private isChartHasTask(dataView: DataView): boolean {
            if (!!dataView.categorical.categories)
                for (let dvCategory of dataView.categorical.categories) {
                    if (this.hasRole(dvCategory.source, "Task"))
                        return true;
                };
            return false;
        }

        /**
         * Get legend data, calculate position and draw it
         * @param ganttChartData Data for series and legend
         */
        private renderLegend(legendData: LegendData): void {
            if (!legendData)
                return;

            if (this.legendObjectProperties) {
                LegendData.update(legendData, this.legendObjectProperties);
                var position: string;
                position = <string>this.legendObjectProperties[legendProps.position];

                if (position)
                    this.legend.changeOrientation(LegendPosition[position]);
            }

            let viewport = this.viewport;
            this.legend.drawLegend(legendData, { height: viewport.height, width: viewport.width });
            Legend.positionChartArea(this.ganttSvg, this.legend);
        }

        private parseLegendProperties(dataView: DataView): void {
            if (!dataView || !dataView.metadata) {
                this.legendObjectProperties = {};
                return;
            }

            this.legendObjectProperties = DataViewObjects.getObject(dataView.metadata.objects, 'legend', {});
        }

        /**
        * Called on data change or resizing
        * @param options The visual option that contains the dataview and the viewport
        */
        public update(options: VisualUpdateOptions) {
            if (!options.dataViews || !options.dataViews[0])
                return;
            let dataView = options.dataViews[0];

            if (!this.isChartHasTask(dataView) || options.dataViews[0].table.rows.length === 0) {
                this.clearViewport();
                return;
            }

            this.dataView = dataView;
            let viewport = options.viewport;
            this.viewport = viewport;
            this.updateChartSize(viewport);

            let viewModel: GanttViewModel = Gantt.converter(dataView, this.colors),
                formatters: GanttChartFormatters = this.parseSettings(dataView),
                tasks: Task[] = this.createTasks(dataView, formatters);

            this.parseLegendProperties(dataView);
            this.renderLegend(viewModel.legendData);
            this.data.series = this.createSeries(dataView.metadata.objects, tasks);
            this.viewModel = viewModel;

            if (this.interactivityService) {
                this.interactivityService.applySelectionStateToData(tasks);
                this.interactivityService.applySelectionStateToData(this.data.series);
            }

            if (tasks.length > 0) {
                let tasksSortedByStartDate: Task[] = _.sortBy(tasks, (t) => t.start);
                let tasksSortedByEndDate: Task[] = _.sortBy(tasks, (t) => t.end);
                let dateTypeMilliseconds = this.getDateType();

                let startDate: Date = tasksSortedByStartDate[0].start,
                    endDate: Date = tasksSortedByEndDate[tasks.length - 1].end,
                    ticks = Math.ceil(Math.round(endDate.valueOf() - startDate.valueOf()) / dateTypeMilliseconds);

                ticks = ticks === 0 || ticks === 1 ? 2 : ticks;
                let axisLength = ticks * 50;
                this.ganttSvg
                    .attr({
                        height: PixelConverter.toString(tasks.length * ChartLineHeight + this.margin.top),
                        width: PixelConverter.toString(this.margin.left + this.viewModel.taskLabelsWidth + axisLength + Gantt.DefaultValues.ResourceWidth)
                    });

                let viewportIn: IViewport = {
                    height: viewport.height,
                    width: axisLength
                };

                let xAxisProperties = this.calculateAxes(viewportIn, this.textProperties, startDate, endDate, axisLength, ticks, false);
                this.timeScale = <D3.Scale.TimeScale>xAxisProperties.scale;

                this.renderAxis(xAxisProperties, 200);
                this.renderTasks(tasks);

                this.createMilestoneLine(tasks);
                this.updateTaskLabels(tasks, viewModel.taskLabelsWidth);
                this.updateElementsPositions(viewport, this.margin);

                if (this.interactivityService) {
                    let behaviorOptions: GanttBehaviorOptions = {
                        clearCatcher: this.clearCatcher,
                        taskSelection: this.taskGroup.selectAll(Selectors.SingleTask.selector),
                        legendSelection: this.body.selectAll(Selectors.LegendItems.selector),
                        interactivityService: this.interactivityService
                    };
                    this.interactivityService.bind(tasks, this.behavior, behaviorOptions);
                }
            }
        }
        
        private getDateType(): number {
            let milliSeconds: number = MillisecondsInWeek;

            switch (this.viewModel.dateType) {
                case "Day":
                    milliSeconds = MillisecondsInADay;
                    break;

                case "Week":
                    milliSeconds = MillisecondsInWeek;
                    break;

                case "Month":
                    milliSeconds = MillisecondsInAMonth;
                    break;

                case "Year":
                    milliSeconds = MillisecondsInAYear;
                    break;
            }

            return milliSeconds;
        }

        private calculateAxes(
            viewportIn: IViewport,
            textProperties: TextProperties,
            startDate: Date,
            endDate: Date,
            axisLength: number,
            ticksCount: number,
            scrollbarVisible: boolean): IAxisProperties {

            let dataTypeDatetime = ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Date);
            let category: DataViewMetadataColumn = { displayName: "StartDate", queryName: "StartDate", type: dataTypeDatetime, index: 0 };
            let visualOptions: CalculateScaleAndDomainOptions = {
                viewport: viewportIn,
                margin: this.margin,
                forcedXDomain: [startDate, endDate],
                forceMerge: false,
                showCategoryAxisLabel: false,
                showValueAxisLabel: false,
                categoryAxisScaleType: powerbi.visuals.axisScale.linear,
                valueAxisScaleType: null,
                valueAxisDisplayUnits: 0,
                categoryAxisDisplayUnits: 0,
                trimOrdinalDataOnOverflow: false,
                forcedTickCount: ticksCount
            };

            let width = viewportIn.width;
            let axes = this.calculateAxesProperties(viewportIn, visualOptions, axisLength, category);
            axes.willLabelsFit = AxisHelper.LabelLayoutStrategy.willLabelsFit(
                axes,
                width,
                TextMeasurementService.measureSvgTextWidth,
                textProperties);

            // If labels do not fit and we are not scrolling, try word breaking
            axes.willLabelsWordBreak = (!axes.willLabelsFit && !scrollbarVisible) && AxisHelper.LabelLayoutStrategy.willLabelsWordBreak(
                axes, this.margin, width, TextMeasurementService.measureSvgTextWidth,
                TextMeasurementService.estimateSvgTextHeight, TextMeasurementService.getTailoredTextOrDefault,
                textProperties);

            return axes;
        }

        private calculateAxesProperties(viewportIn: IViewport, options: CalculateScaleAndDomainOptions, axisLength: number, metaDataColumn: DataViewMetadataColumn): IAxisProperties {
            let xAxisProperties = AxisHelper.createAxis({
                pixelSpan: viewportIn.width,
                dataDomain: options.forcedXDomain,
                metaDataColumn: metaDataColumn,
                formatString: Gantt.DefaultValues.ganttFormatString,
                outerPadding: 0,
                isScalar: true,
                isVertical: false,
                forcedTickCount: options.forcedTickCount,
                useTickIntervalForDisplayUnits: true,
                isCategoryAxis: true,
                getValueFn: (index, type) => {
                    return valueFormatter.format(new Date(index), Gantt.DefaultValues.ganttFormatString);
                },
                scaleType: options.categoryAxisScaleType,
                axisDisplayUnits: options.categoryAxisDisplayUnits,
            });

            xAxisProperties.axisLabel = metaDataColumn.displayName;
            return xAxisProperties;
        }

        private renderAxis(xAxisProperties: IAxisProperties, duration: number): void {
            let xAxis = xAxisProperties.axis;
            xAxis.orient('bottom');

            this.axisGroup.transition().duration(duration).call(xAxis);
        }
        /**
        * Update task labels and add its tooltips 
        * @param tasks All tasks array
        * @param width The task label width
        */
        private updateTaskLabels(tasks: Task[], width: number): void {
            let axisLabel: D3.UpdateSelection;
            let taskLineCoordinateX: number = 15;
            let taskLabelsShow = this.viewModel ? this.viewModel.taskLabelsShow : true;
            let taskLabelsColor = this.viewModel ? this.viewModel.taskLabelsColor : Gantt.DefaultValues.TaskLabelColor;
            let taskLabelsFontSize = this.viewModel ? this.viewModel.taskLabelsFontSize : Gantt.DefaultValues.LabelFontSize;

            if (taskLabelsShow) {
                axisLabel = this.lineGroup.selectAll(Selectors.Label.selector).data(tasks);
                axisLabel.enter().append("text").classed(Selectors.Label.class, true);
                axisLabel.attr({
                    x: taskLineCoordinateX,
                    y: (task: Task, i: number) => this.getTaskLabelCoordinateY(task.id),
                    fill: taskLabelsColor,
                    "stroke-width": 1
                })
                    .style("font-size", PixelConverter.fromPoint(taskLabelsFontSize))
                    .text((task) => { return task.name; });

                axisLabel.call(AxisHelper.LabelLayoutStrategy.clip, width - 20, TextMeasurementService.svgEllipsis);
                axisLabel.append("title").text((task) => { return task.name; });
                axisLabel.exit().remove();
            }
            else {
                this.lineGroup.selectAll(Selectors.Label.selector).remove();
            }
        }

        private renderTasks(tasks: Task[]) {
            let taskSelection: D3.UpdateSelection = this.taskGroup.selectAll(Selectors.SingleTask.selector).data(tasks);
            let taskProgressColor = this.viewModel ? this.viewModel.taskProgressColor : Gantt.DefaultValues.ProgressColor;
            let taskResourceShow = this.viewModel ? this.viewModel.taskResourceShow : true;
            let padding: number = 4;
            let taskResourceColor = this.viewModel ? this.viewModel.taskResourceColor : Gantt.DefaultValues.TaskResourceColor;
            let taskResourceFontSize: number = this.viewModel ? this.viewModel.taskResourceFontSize : Gantt.DefaultValues.ResourceFontSize;

            //render task group container 
            taskSelection.enter().append("g").classed(Selectors.SingleTask.class, true);
            //render task main rect
            let taskRect = taskSelection.selectAll(Selectors.TaskRect.selector).data((d: Task) => [d]);
            taskRect.enter().append("rect").classed(Selectors.TaskRect.class, true);
            taskRect.classed(Selectors.TaskRect.class, true).attr({
                x: (task: Task) => this.timeScale(task.start),
                y: (task: Task) => this.getBarYCoordinate(task.id),
                width: (task: Task) => this.taskDurationToWidth(task),
                height: () => this.getBarHeight()
            }).style("fill", (task: Task) => task.color);
            taskRect.exit().remove();

            //render task progress rect 
            let taskProgress = taskSelection.selectAll(Selectors.TaskProgress.selector).data((d: Task) => [d]);
            taskProgress.enter().append("rect").classed(Selectors.TaskProgress.class, true);
            taskProgress.attr({
                x: (task: Task) => this.timeScale(task.start),
                y: (task: Task) => this.getBarYCoordinate(task.id) + this.getBarHeight() / 2 - Gantt.DefaultValues.ProgressBarHeight / 2,
                width: (task: Task) => this.setTaskProgress(task),
                height: Gantt.DefaultValues.ProgressBarHeight
            }).style("fill", taskProgressColor);
            taskProgress.exit().remove();

            if (taskResourceShow) {
                //render task resource labels
                let taskResource = taskSelection.selectAll(Selectors.TaskResource.selector).data((d: Task) => [d]);
                taskResource.enter().append("text").classed(Selectors.TaskResource.class, true);
                taskResource.attr({
                    x: (task: Task) => this.timeScale(task.end) + padding,
                    y: (task: Task) => (this.getBarYCoordinate(task.id) + (this.getBarHeight() / 2) + padding)
                })
                    .text((task: Task) => task.resource)
                    .style({
                        fill: taskResourceColor,
                        "font-size": PixelConverter.fromPoint(taskResourceFontSize)
                    }).call(AxisHelper.LabelLayoutStrategy.clip,
                    Gantt.DefaultValues.ResourceWidth - 10,
                    TextMeasurementService.svgEllipsis);

                taskResource.exit().remove();
            }
            else {
                taskSelection.selectAll(Selectors.TaskResource.selector).remove();
            }

            TooltipManager.addTooltip(taskSelection, (tooltipEvent: TooltipEvent) => (<Task>tooltipEvent.data).tooltipInfo);
            taskSelection.exit().remove();
        }

        public onClearSelection() {
            this.selectionManager.clear();
        }

        /**
         * Returns the matching Y coordinate for a given task index 
         * @param taskIndex Task Number
         */
        private getTaskLabelCoordinateY(taskIndex: number): number {
            let fontSize: number = +this.getTaskLabelFontSize();
            return (ChartLineHeight * taskIndex) + (this.getBarHeight() + 5 - (40 - fontSize) / 4);
        }

        /**
         * Set the task progress bar in the gantt
         * @param task All task attributes
         */
        private setTaskProgress(task: Task): number {
            let fraction = task.completion / 1.0,
                y = this.timeScale,
                progress = (y(task.end) - y(task.start)) * fraction;

            return progress;
        }

        /**
         * Set the task progress bar in the gantt
         * @param lineNumber Line number that represents the task number
         */
        private getBarYCoordinate(lineNumber: number): number {
            return (ChartLineHeight * lineNumber) + (PaddingTasks);
        }

        private getBarHeight(): number {
            return ChartLineHeight / 1.5;
        }

        /**
        * convert task duration to width in the time scale
        * @param task The task to convert
        */
        private taskDurationToWidth(task: Task): number {
            return this.timeScale(task.end) - this.timeScale(task.start);
        }

        private getTooltipForMilstoneLine(timestamp: number, milestoneTitle: string): TooltipDataItem[] {
            let stringDate = new Date(timestamp).toDateString();
            let tooltip: TooltipDataItem[] = [{ displayName: milestoneTitle, value: stringDate }];
            return tooltip;
        }

        /**
        * Create vertical dotted line that represent milestone in the time axis (by default it shows not time)
        * @param tasks All tasks array
        * @param timestamp the milestone to be shown in the time axis (default Date.now())
        */
        private createMilestoneLine(tasks: Task[], milestoneTitle: string = "Today", timestamp: number = Date.now()): void {
            let line: Line[] = [{
                x1: this.timeScale(timestamp),
                y1: 0,
                x2: this.timeScale(timestamp),
                y2: this.getMilestoneLineLength(tasks.length),
                tooltipInfo: this.getTooltipForMilstoneLine(timestamp, milestoneTitle)
            }];

            let chartLineSelection: D3.UpdateSelection = this.chartGroup.selectAll(Selectors.ChartLine.selector).data(line);
            chartLineSelection.enter().append("line").classed(Selectors.ChartLine.class, true);
            chartLineSelection.attr({
                x1: (line: Line) => line.x1,
                y1: (line: Line) => line.y1,
                x2: (line: Line) => line.x2,
                y2: (line: Line) => line.y2,
                tooltipInfo: (line: Line) => line.tooltipInfo
            });

            TooltipManager.addTooltip(chartLineSelection, (tooltipEvent: TooltipEvent) => (<Line>tooltipEvent.data).tooltipInfo);
            chartLineSelection.exit().remove();
        }

        private updateElementsPositions(viewport: IViewport, margin: IMargin): void {
            let viewModel = this.viewModel;
            this.axisGroup.attr("transform", SVGUtil.translate(viewModel.taskLabelsWidth + margin.left, 15));
            this.chartGroup.attr("transform", SVGUtil.translate(viewModel.taskLabelsWidth + margin.left, margin.top));
            this.lineGroup.attr("transform", SVGUtil.translate(0, margin.top));
        }
       
        /**
         * Returns the width of the now line based on num of tasks
         * @param numOfTasks Number of tasks
         */
        private getMilestoneLineLength(numOfTasks: number): number {
            return numOfTasks * ChartLineHeight;
        }

        private getTaskLabelFontSize(): number {
            return DataViewObjects.getValue<number>(this.dataView.metadata.objects, GanttChartProps.taskLabels.fontSize, Gantt.DefaultValues.LabelFontSize);
        }
            
        /** 
         * handle "Legend" card
         * @param enumeration The instance to be pushed into "Legend" card
         * @param objects Dataview objects
         */
        private enumerateLegendOptions(enumeration: ObjectEnumerationBuilder, objects: DataViewObjects) {
            enumeration.pushInstance({
                displayName: GanttChartProps.legend.show.objectName,
                selector: null,
                properties: {
                    show: DataViewObjects.getValue<boolean>(objects, GanttChartProps.legend.show, true),
                    position: DataViewObjects.getValue<boolean>(objects, GanttChartProps.legend.position, true), //TODO: change type of prop
                    showTitle: DataViewObjects.getValue<boolean>(objects, GanttChartProps.legend.showTitle, true),
                    titleText: DataViewObjects.getValue<string>(objects, GanttChartProps.legend.titleText, ""), //TODO: default text ?
                    labelColor: DataViewObjects.getFillColor(objects, GanttChartProps.legend.labelColor, Gantt.DefaultValues.LegendLabelColor),
                    fontSize: DataViewObjects.getValue<number>(objects, GanttChartProps.legend.fontSize, Gantt.DefaultValues.LegendFontSize)
                },
                objectName: GanttChartProps.legend.show.objectName
            });
        }

        /** 
        * handle "Data Colors" card
        * @param enumeration The instance to be pushed into "Data Colors" card
        * @param objects Dataview objects
        */
        private enumerateDataPoints(enumeration: ObjectEnumerationBuilder, objects: DataViewObjects) {
            let taskSeries: GanttSeries[] = this.data.series;

            taskSeries.forEach((item: GanttSeries) => {
                enumeration.pushInstance({
                    objectName: 'dataPoint',
                    displayName: item.name,
                    selector: ColorHelper.normalizeSelector(item.identity.getSelector(), false),
                    properties: {
                        fill: { solid: { color: item.fill } }
                    }
                });
            });
        }
            
        /** 
        * handle "Task Completion" card
        * @param enumeration The instance to be pushed into "Task Completion" card
        * @param objects Dataview objects
        */
        private enumerateTaskCompletion(enumeration: ObjectEnumerationBuilder, objects: DataViewObjects) {
            enumeration.pushInstance({
                selector: null,
                properties: {
                    fill: DataViewObjects.getFillColor(objects, GanttChartProps.taskCompletion.fill, Gantt.DefaultValues.ProgressColor)
                },
                objectName: GanttChartProps.taskCompletion.fill.objectName
            });
        }
        
        /** 
        * handle "Labels" card
        * @param enumeration The instance to be pushed into "Data Labels" card
        * @param objects Dataview objects
        */
        private enumerateTaskLabels(enumeration: ObjectEnumerationBuilder, objects: DataViewObjects) {
            enumeration.pushInstance({
                selector: null,
                properties: {
                    show: DataViewObjects.getValue<boolean>(objects, GanttChartProps.taskLabels.show, true),
                    fill: DataViewObjects.getFillColor(objects, GanttChartProps.taskLabels.fill, Gantt.DefaultValues.TaskLabelColor),
                    fontSize: DataViewObjects.getValue<number>(objects, GanttChartProps.taskLabels.fontSize, Gantt.DefaultValues.LabelFontSize),
                    width: DataViewObjects.getValue<number>(objects, GanttChartProps.taskLabels.width, Gantt.DefaultValues.TaskLabelWidth),
                },
                objectName: GanttChartProps.taskLabels.show.objectName
            });
        }
      
        /** 
        * handle "Data Labels" card
        * @param enumeration The instance to be pushed into "Task Resource" card
        * @param objects Dataview objects
        */
        private enumerateDataLabels(enumeration: ObjectEnumerationBuilder, objects: DataViewObjects) {
            enumeration.pushInstance({
                selector: null,
                properties: {
                    show: DataViewObjects.getValue<boolean>(objects, GanttChartProps.taskResource.show, true),
                    fill: DataViewObjects.getFillColor(objects, GanttChartProps.taskResource.fill, Gantt.DefaultValues.TaskResourceColor),
                    fontSize: DataViewObjects.getValue<number>(objects, GanttChartProps.taskResource.fontSize, Gantt.DefaultValues.ResourceFontSize)
                },
                objectName: GanttChartProps.taskResource.show.objectName
            });
        }

        private enumerateDateType(enumeration: ObjectEnumerationBuilder, objects: DataViewObjects) {
            enumeration.pushInstance({
                selector: null,
                properties: {
                    type: DataViewObjects.getValue<string>(objects, GanttChartProps.ganttDateType.type, DefaultDateType),
                },
                objectName: GanttChartProps.ganttDateType.type.objectName
            });
        }        
        /** 
        * handle the property pane options
        * @param objects Dataview enumerate objects
        */
        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            let dataView = this.dataView;
            if (!dataView)
                return;

            let enumeration = new ObjectEnumerationBuilder();

            switch (options.objectName) {
                case 'legend':
                    this.enumerateLegendOptions(enumeration, dataView.metadata.objects);
                    break;
                case 'dataPoint':
                    this.enumerateDataPoints(enumeration, dataView.metadata.objects);
                    break;
                case 'taskLabels':
                    this.enumerateTaskLabels(enumeration, dataView.metadata.objects);
                    break;
                case 'taskCompletion':
                    this.enumerateTaskCompletion(enumeration, dataView.metadata.objects);
                    break;
                case 'taskResource':
                    this.enumerateDataLabels(enumeration, dataView.metadata.objects);
                    break;
                case 'ganttDateType':
                    this.enumerateDateType(enumeration, dataView.metadata.objects);
                    break;
            }
            return enumeration.complete();
        }
    }

    export interface GanttBehaviorOptions {
        clearCatcher: D3.Selection;
        taskSelection: D3.Selection;
        legendSelection: D3.Selection;
        interactivityService: IInteractivityService;
    }

    export class GanttChartBehavior implements IInteractiveBehavior {
        private options: GanttBehaviorOptions;

        public bindEvents(options: GanttBehaviorOptions, selectionHandler: ISelectionHandler) {
            this.options = options;
            let clearCatcher = options.clearCatcher;

            options.taskSelection.on('click', (d: SelectableDataPoint) => {
                selectionHandler.handleSelection(d, d3.event.ctrlKey);
                d3.event.stopPropagation();
            });

            clearCatcher.on('click', () => {
                selectionHandler.handleClearSelection();
            });
        }

        public renderSelection(hasSelection: boolean) {
            let options = this.options;
            let ganttMaxOpacity = Gantt.getMaxTaskOpacity();
            let ganttMinOpacity = Gantt.getMinTaskOpacity();

            options.taskSelection.style("opacity", (d: SelectableDataPoint) => {
                return (hasSelection && !d.selected) ? ganttMinOpacity : ganttMaxOpacity;
            });

        }
    }

    export class GanttChartWarning implements IVisualWarning {
        public get code(): string {
            return "GanttChartWarning";
        }

        public getMessages(resourceProvider: IStringResourceProvider): IVisualErrorMessage {
            let message: string = "This visual requires task value",
                titleKey: string = "",
                detailKey: string = "",
                visualMessage: IVisualErrorMessage;

            visualMessage = {
                message: message,
                title: resourceProvider.get(titleKey),
                detail: resourceProvider.get(detailKey)
            };

            return visualMessage;
        }
    }
}