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
    import VisualClass = powerbi.visuals.samples.Gantt;
    import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;

    const defaultTaskDuration: number = 1;
    const taskLabelIndex: number = 1;

    describe("Gantt", () => {
        describe('capabilities', () => {
            it("registered capabilities", () => expect(VisualClass.capabilities).toBeDefined());
        });

        describe("DOM tests", () => {
            let visualBuilder: GanttBuilder;
            let dataViews: powerbi.DataView[];

            const func = e => e.innerHTML === "" || e.textContent === "";

            // function that uses grep to filter
            const grep = (val) => {
                return $.grep(val, func);
            };

            beforeEach(() => {
                visualBuilder = new GanttBuilder();
                let sampleData: any[][] = new customVisuals.sampleDataViews.GanttData().getSampleData();
                dataViews = new customVisuals.sampleDataViews.GanttData().getDataViews(sampleData);
            });

            it("svg element created", () => {
                expect(visualBuilder.mainElement[0]).toBeInDOM();
            });

            it("update", (done) => {
                visualBuilder.update(dataViews);
                setTimeout(() => {
                    let countOfTaskLabels = visualBuilder.mainElement
                        .children("g.chart")
                        .children("g.tasks")
                        .children("g.task")
                        .children(".task-resource")
                        .length;
                    let countOfTaskLines = visualBuilder.mainElement
                        .children("g.task-lines")
                        .children("text")
                        .length;
                    let countOfTasks = visualBuilder.mainElement
                        .children("g.chart")
                        .children("g.tasks")
                        .children("g.task")
                        .length;

                    expect(countOfTaskLabels).toEqual(dataViews[0].table.rows.length);
                    expect(countOfTaskLines).toEqual(dataViews[0].table.rows.length);
                    expect(countOfTasks).toEqual(dataViews[0].table.rows.length);

                    done();
                }, DefaultWaitForRender);
            });

            it("When Task Element is Missing, empty viewport should be created", () => {
                let sampleData: any[][] = new customVisuals.sampleDataViews.GanttData().getSampleDataNoTask();
                dataViews = new customVisuals.sampleDataViews.GanttData().getDataViews(sampleData, false /* no task*/);
                visualBuilder.update(dataViews);

                let body = d3.select(visualBuilder.element.get(0));

                expect(body.select('.axis').selectAll('*')[0].length).toEqual(0);
                expect(body.select('.task-lines').selectAll('*')[0].length).toEqual(0);
                expect(body.select('.chart .tasks').selectAll('*')[0].length).toEqual(0);
            });

            it("When task duration is missing,  it should be set to 1", () => {
                let sampleData: any[][] = new customVisuals.sampleDataViews.GanttData().getSampleDataNoDuration();
                dataViews = new customVisuals.sampleDataViews.GanttData().getDataViews(sampleData);
                visualBuilder.update(dataViews);

                let tasks = d3.select(visualBuilder.element.get(0)).selectAll('.task').data();

                for (let task of tasks)
                    expect(task.duration).toEqual(defaultTaskDuration);
            });

            it("When task start time is missing, it should be set to today date", () => {
                let sampleData: any[][] = new customVisuals.sampleDataViews.GanttData().getSampleDataNoStartDate();
                dataViews = new customVisuals.sampleDataViews.GanttData().getDataViews(sampleData);
                visualBuilder.update(dataViews);

                let tasks = d3.select(visualBuilder.element.get(0)).selectAll('.task').data();

                for (let task of tasks)
                    expect(task.start.toDateString()).toEqual(new Date(Date.now()).toDateString());
            });

            it("Task Resource is Missing, not shown on dom", () => {
                let sampleData: any[][] = new customVisuals.sampleDataViews.GanttData().getSampleDataNoResource();
                dataViews = new customVisuals.sampleDataViews.GanttData().getDataViews(sampleData);
                visualBuilder.update(dataViews);

                let resources = d3.select(visualBuilder.element.get(0)).selectAll('.task-resource')[0];

                var returnResource = grep(resources);

                expect(returnResource.length).toEqual(resources.length);
            });

            it("Task Completion is Missing, not shown on dom", () => {
                let sampleData: any[][] = new customVisuals.sampleDataViews.GanttData().getSampleDataNoCompletion();
                dataViews = new customVisuals.sampleDataViews.GanttData().getDataViews(sampleData);
                visualBuilder.update(dataViews);

                let progressOfTasks = d3.select(visualBuilder.element.get(0)).selectAll('.task-progress')[0];

                var returnTasks = grep(progressOfTasks);

                expect(progressOfTasks.length).toEqual(returnTasks.length);
            });

            it("Verify task labels have tooltips", () => {
                let sampleData: any[][] = new customVisuals.sampleDataViews.GanttData().getSampleDataLongNames();
                dataViews = new customVisuals.sampleDataViews.GanttData().getDataViews(sampleData);
                visualBuilder.update(dataViews);

                let taskLabelsInDom = d3.select(visualBuilder.element.get(0)).selectAll('.label title')[0];
                let taskLabels = d3.select(visualBuilder.element.get(0)).selectAll('.label').data();

                for (let i = 0; i < sampleData.length; i++) {
                    expect(taskLabels[i].name).toEqual(taskLabelsInDom[i].textContent);
                    expect(sampleData[i][taskLabelIndex]).toEqual(taskLabelsInDom[i].textContent);
                }
            });

            //it("Verify Axis number of ticks", () => {
            //    visualBuilder.update(dataViews);

            //    //sort by startDate if exists
            //    let dateIndex = _.findIndex(dataViews[0].table.columns, col => col.roles.hasOwnProperty("StartDate"));
            //    let durationIndex = _.findIndex(dataViews[0].table.columns, col => col.roles.hasOwnProperty("Duration"));
            //    let MillisecondsInAWeek: number = 604800000;

            //    let minRow: powerbi.DataViewTableRow = _.min(dataViews[0].table.rows, row=> new Date(row[dateIndex]));
            //    let maxRow: powerbi.DataViewTableRow = _.max(dataViews[0].table.rows, row=> new Date(row[dateIndex]).getTime() + row[durationIndex]);

            //    let startDate: Date = new Date(minRow[dateIndex]);
            //    let endDate: Date = new Date(maxRow[dateIndex]);
            //    endDate.setDate(endDate.getDate() + maxRow[durationIndex]);

            //    let allTicks = d3.select(visualBuilder.element.get(0)).selectAll('.axis .tick')[0];
            //    let numOfTicks = allTicks.length;
            //    let weeks: number = Math.ceil(Math.round(endDate.valueOf() - startDate.valueOf()) / MillisecondsInAWeek);
            //    expect(weeks).toEqual(numOfTicks);
            //});

            //it("Verify Axis number of ticks", () => {
            //    visualBuilder.update(dataViews);

            //    //sort by startDate if exists
            //    let dateIndex = _.findIndex(dataViews[0].table.columns, col => col.roles.hasOwnProperty("StartDate"));
            //    let durationIndex = _.findIndex(dataViews[0].table.columns, col => col.roles.hasOwnProperty("Duration"));

            //    let minRow: powerbi.DataViewTableRow = _.min(dataViews[0].table.rows, row=> new Date(row[dateIndex]));
            //    let maxRow: powerbi.DataViewTableRow = _.max(dataViews[0].table.rows, row=> new Date(row[dateIndex]).getTime() + row[durationIndex]);

            //    let startDate: Date = new Date(minRow[dateIndex]);
            //    let endDate: Date = new Date(maxRow[dateIndex]);
            //    endDate.setDate(endDate.getDate() + maxRow[durationIndex]);

            //    let allTicks = d3.select(visualBuilder.element.get(0)).selectAll('.axis .tick')[0];
            //    let numOfTicks = allTicks.length;

            //    let firstTick: Date = new Date(allTicks[0].textContent + " " + startDate.getUTCFullYear());
            //    let endTick: Date = new Date(allTicks[numOfTicks - 1].textContent + " " + endDate.getUTCFullYear());

            //    expect(startDate).toEqual(firstTick);
            //    expect(endDate).toEqual(endTick);
            //});

            it("Verify Font Size set to default", () => {
                visualBuilder.update(dataViews);

                let resources = d3.select(visualBuilder.element.get(0)).selectAll('.task-resource')[0];
                let labels = d3.select(visualBuilder.element.get(0)).selectAll('.label')[0];

                expect(resources[0].style["font-size"]).toEqual("12px");
                expect(labels[0].style["font-size"]).toEqual("12px");
            });

        });

        describe("View Model tests", () => {

            let visualBuilder: GanttBuilder;
            let dataViews: powerbi.DataView[];

            beforeEach(() => {
                visualBuilder = new GanttBuilder();
                let sampleData: any[][] = new customVisuals.sampleDataViews.GanttData().getSampleData();
                dataViews = new customVisuals.sampleDataViews.GanttData().getDataViews(sampleData);
            });

            it("Test result from enumeration", () => {
                let clonedDataViews = _.cloneDeep(dataViews);
                let taskResource: powerbi.DataViewObjects = { taskResource: { show: true, fill: { solid: { color: '#A3A3A3' } }, fontSize: '14px' } };
                clonedDataViews[0].metadata.objects = taskResource;
                visualBuilder.update(clonedDataViews);
                let result = <VisualObjectInstanceEnumerationObject>visualBuilder.enumerateObjectInstances({ objectName: 'taskResource' });

                expect(result.instances[0]).toBeDefined();
                expect(result.instances[0].properties['show']).toBe(true);
                expect(result.instances[0].properties['fill']).toBe('#A3A3A3');
                expect(result.instances[0].properties['fontSize']).toBe('14px');
            });
        });
    });

    class GanttBuilder extends VisualBuilderBase<VisualClass> {
        constructor(height: number = 200, width: number = 300, isMinervaVisualPlugin: boolean = false) {
            super(height, width, isMinervaVisualPlugin);
            this.build();
            this.init();
        }

        public get mainElement() {
            return this.element.children("div.gantt-body")
                .children("svg.gantt");
        }

        private build(): void {
            this.visual = new VisualClass();
        }

        public enumerateObjectInstances(options: powerbi.EnumerateVisualObjectInstancesOptions): powerbi.VisualObjectInstanceEnumeration {
            return this.visual.enumerateObjectInstances(options);
        }
    }
}
