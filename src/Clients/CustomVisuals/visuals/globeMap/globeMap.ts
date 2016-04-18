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

var THREE: any;
var WebGLHeatmap;
var GlobeMapCanvasLayers: JQuery[];

module powerbi.visuals.samples {
    import TouchRect = controls.TouchUtils.Rectangle;
    import DataRoleHelper = powerbi.data.DataRoleHelper;

    interface GlobeMapData {
        lat: number;
        lng: number;
        height: number;
        heightBySeries: number[];
        seriesToolTipData: any[];
        heat: number;
        toolTipData: any;
    }

    interface GlobeMapDataPoint extends SelectableDataPoint {
        label: string;
        color: string;
        category?: string;
    }

    export class GlobeMap implements IVisual {
        public static MercartorSphere: any;
        private viewport: IViewport;
        private container: JQuery;
        private domElement: HTMLElement;
        private camera: any;
        private renderer: any;
        private scene: any;
        private orbitControls: any;
        private earth: any;
        private settings: any;
        private data: GlobeMapData[] = [];
        private dataPointsToEnumerate: GlobeMapDataPoint[];
        private heatmap: any;
        private heatTexture: any;
        private mapTextures: any[];
        private barsGroup: any;
        private readyToRender: boolean;
        private categoricalView: any;
        private deferredRenderTimerId: any;
        private globeMapLocationCache: any;
        private locationsToLoad: number = 0;
        private locationsLoaded: number = 0;
        private renderLoopEnabled = true;
        private needsRender = false;
        private mousePosNormalized: any;
        private mousePos: any;
        private rayCaster: any;
        private selectedBar: any;
        private hoveredBar: any;
        private averageBarVector: any;
        private zoomControl: any;
        private colorHelper: ColorHelper;
        private colors: IDataColorPalette;
        private style: IVisualStyle;

        public static capabilities: VisualCapabilities = {
            dataRoles: [
                {
                    name: 'Category',
                    kind: VisualDataRoleKind.Grouping,
                    displayName: data.createDisplayNameGetter('Role_DisplayName_Location'),
                    preferredTypes: [
                        { geography: { address: true } },
                        { geography: { city: true } },
                        { geography: { continent: true } },
                        { geography: { country: true } },
                        { geography: { county: true } },
                        { geography: { place: true } },
                        { geography: { postalCode: true } },
                        { geography: { region: true } },
                        { geography: { stateOrProvince: true } },
                    ],
                },
                {
                    name: 'Series',
                    kind: powerbi.VisualDataRoleKind.Grouping,
                    displayName: "Legend",
                },
                {
                    name: 'X',
                    kind: VisualDataRoleKind.Measure,
                    displayName: 'Longitude',
                    description: 'Use to override the longitude of locations',
                    preferredTypes: [{ geography: { longitude: true } }],
                },
                {
                    name: 'Y',
                    kind: VisualDataRoleKind.Measure,
                    displayName: 'Latitude',
                    description: 'Use to override the latitude of locations',
                    preferredTypes: [{ geography: { latitude: true } }],
                },
                {
                    name: 'Height',
                    kind: VisualDataRoleKind.Measure,
                    displayName: 'Bar Height',
                },
                {
                    name: 'Heat',
                    kind: VisualDataRoleKind.Measure,
                    displayName: 'Heat Intensity',
                }
            ],
            objects: {
                general: {
                    displayName: data.createDisplayNameGetter('Visual_General'),
                    properties: {
                        formatString: {
                            type: { formatting: { formatString: true } },
                        },
                    },
                },
                legend: {
                    displayName: data.createDisplayNameGetter('Visual_Legend'),
                    properties: {
                        show: {
                            displayName: data.createDisplayNameGetter('Visual_Show'),
                            type: { bool: true }
                        },
                        position: {
                            displayName: data.createDisplayNameGetter('Visual_LegendPosition'),
                            type: { formatting: { legendPosition: true } }
                        },
                        showTitle: {
                            displayName: data.createDisplayNameGetter('Visual_LegendShowTitle'),
                            type: { bool: true }
                        },
                        titleText: {
                            displayName: data.createDisplayNameGetter('Visual_LegendTitleText'),
                            type: { text: true }
                        }
                    }
                },
                dataPoint: {
                    displayName: data.createDisplayNameGetter('Visual_DataPoint'),
                    properties: {
                        defaultColor: {
                            displayName: data.createDisplayNameGetter('Visual_DefaultColor'),
                            type: { fill: { solid: { color: true } } }
                        },
                        showAllDataPoints: {
                            displayName: data.createDisplayNameGetter('Visual_DataPoint_Show_All'),
                            type: { bool: true }
                        },
                        fill: {
                            displayName: data.createDisplayNameGetter('Visual_Fill'),
                            type: { fill: { solid: { color: true } } }
                        },
                        fillRule: {
                            displayName: data.createDisplayNameGetter('Visual_Gradient'),
                            type: { fillRule: {} },
                            rule: {
                                inputRole: 'Gradient',
                                output: {
                                    property: 'fill',
                                    selector: ['Category'],
                                },
                            },
                        }
                    }
                },
                categoryLabels: {
                    displayName: data.createDisplayNameGetter('Visual_CategoryLabels'),
                    properties: {
                        show: {
                            displayName: data.createDisplayNameGetter('Visual_Show'),
                            type: { bool: true }
                        },
                        color: {
                            displayName: data.createDisplayNameGetter('Visual_LabelsFill'),
                            type: { fill: { solid: { color: true } } }
                        },
                    },
                },
            },
            dataViewMappings: [{
                conditions: [
                    { 'Category': { max: 1 }, 'Series': { max: 1 }, 'Height': { max: 1 }, 'Heat': { max: 1 } },
                ],
                categorical: {
                    categories: {
                        for: { in: 'Category' },
                        dataReductionAlgorithm: { top: {} }
                    },
                    values: {
                        group: {
                            by: 'Series',
                            select: [
                                { bind: { to: 'Height' } },
                                { bind: { to: 'Heat' } },
                                { bind: { to: 'X' } },
                                { bind: { to: 'Y' } },
                            ],
                            dataReductionAlgorithm: { top: {} }
                        }
                    },
                    rowCount: { preferred: { min: 2 } }
                },
            }],
            sorting: {
                custom: {},
            }
        };

        private static Properties: any = {
            general: {
                formatString: <DataViewObjectPropertyIdentifier>{
                    objectName: "general",
                    propertyName: "formatString"
                }
            },
            dataPoint: {
                fill: <DataViewObjectPropertyIdentifier>{
                    objectName: "dataPoint",
                    propertyName: "fill"
                }
            },
        };

        public static converter(dataView: DataView): any {
            return {};
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            var enumeration = new ObjectEnumerationBuilder();

            switch (options.objectName) {
                case 'dataPoint':
                    this.enumerateDataPoints(enumeration);
                    break;
            }
            return enumeration.complete();
        }

        private enumerateDataPoints(enumeration: ObjectEnumerationBuilder): void {
            var data = this.data;
            if (!data)
                return;

            var dataPoints = this.dataPointsToEnumerate;
            var dataPointsLength = dataPoints.length;

            for (var i = 0; i < dataPointsLength; i++) {
                var dataPoint = dataPoints[i];
                enumeration.pushInstance({
                    objectName: 'dataPoint',
                    displayName: dataPoint.label,
                    selector: ColorHelper.normalizeSelector(dataPoint.identity.getSelector()),
                    properties: {
                        fill: { solid: { color: dataPoint.color } }
                    },
                });
            }
        }

        public init(options: VisualInitOptions): void {
            this.container = options.element;
            this.viewport = options.viewport;
            this.readyToRender = false;
            if (!this.globeMapLocationCache) this.globeMapLocationCache = {};

            this.style = options.style;
            this.colors = this.style.colorPalette.dataColors;
            this.colorHelper = new ColorHelper(this.colors, GlobeMap.Properties.dataPoint.fill);

            if (!THREE) {
                loadGlobeMapLibs();
            }

            if (THREE) {
                this.setup();
            }
        }

        private setup() {
            this.initSettings();
            this.initTextures();
            this.initMercartorSphere();
            this.initZoomControl();
            this.initScene();
            this.initHeatmap();
            this.readyToRender = true;
            this.composeRenderData();
            this.initRayCaster();
        }

        private initSettings() {
            var settings = this.settings = <any>{};
            settings.autoRotate = false;
            settings.earthRadius = 30;
            settings.cameraRadius = 100;
            settings.earthSegments = 100;
            settings.heatmapSize = 1000;
            settings.heatPointSize = 7;
            settings.heatIntensity = 10;
            settings.heatmapScaleOnZoom = 0.95;
            settings.barWidth = 0.3;
            settings.barHeight = 5;
            settings.rotateSpeed = 0.5;
            settings.zoomSpeed = 0.8;
            settings.cameraAnimDuration = 1000; //ms
            settings.clickInterval = 200; //ms
        }

        private initScene() {
            var viewport = this.viewport;
            var settings = this.settings;
            var clock = new THREE.Clock();
            var renderer = this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
            this.container.append(renderer.domElement);
            this.domElement = renderer.domElement;
            var camera = this.camera = new THREE.PerspectiveCamera(35, viewport.width / viewport.height, 0.1, 10000);
            var orbitControls = this.orbitControls = new THREE.OrbitControls(camera, this.domElement);
            var scene = this.scene = new THREE.Scene();

            renderer.setSize(viewport.width, viewport.height);
            renderer.setClearColor(0xbac4d2, 1);
            camera.position.z = settings.cameraRadius;

            orbitControls.maxDistance = settings.cameraRadius;
            orbitControls.minDistance = settings.earthRadius + 1;
            orbitControls.rotateSpeed = settings.rotateSpeed;
            orbitControls.zoomSpeed = settings.zoomSpeed;
            orbitControls.autoRotate = settings.autoRotate;

            var ambientLight = new THREE.AmbientLight(0x000000);
            var light1 = new THREE.DirectionalLight(0xffffff, 0.4);
            var light2 = new THREE.DirectionalLight(0xffffff, 0.4);
            var earth = this.earth = this.createEarth();

            scene.add(ambientLight);
            scene.add(light1);
            scene.add(light2);
            scene.add(earth);

            light1.position.set(20, 20, 20);
            light2.position.set(0, 0, -20);

            var _zis = this;

            requestAnimationFrame(function render() {
                try {
                    if (_zis.renderLoopEnabled) requestAnimationFrame(render);
                    if (!_zis.shouldRender()) return;
                    orbitControls.update(clock.getDelta());
                    _zis.setEarthTexture();
                    _zis.intersectBars();
                    if (_zis.heatmap &&_zis.heatmap.display) {
                        _zis.heatmap.display(); // Needed for IE/Edge to behave nicely
                    }
                    renderer.render(scene, camera);
                    _zis.needsRender = false;	
                    //console.log("render");			
                } catch (e) {
                    console.error(e);
                }
            });
        }

        private shouldRender(): boolean {
            return this.readyToRender && this.needsRender;
        }

        private createEarth() {
            var geometry = new GlobeMap.MercartorSphere(this.settings.earthRadius, this.settings.earthSegments, this.settings.earthSegments);
            var material = new THREE.MeshPhongMaterial({
                map: this.mapTextures[0],
                side: THREE.DoubleSide,
                shininess: 1,
                emissive: 0xaaaaaa,
                //wireframe: true
            });
            return new THREE.Mesh(geometry, material);
        }

        public zoomClicked(zoomDirection: any) {
            if (this.orbitControls.enabled === false || this.orbitControls.enableZoom === false)
                return;

            if (zoomDirection === -1)
                this.orbitControls.constraint.dollyOut(Math.pow(0.95, this.settings.zoomSpeed));
            else if (zoomDirection === 1)
                this.orbitControls.constraint.dollyIn(Math.pow(0.95, this.settings.zoomSpeed));

            this.orbitControls.update();
            this.animateCamera(this.camera.position);
        }

        public rotateCam(deltaX: number, deltaY: number) {
            if (this.orbitControls.enabled === false || this.orbitControls.enableRotate === false)
                return;

            this.orbitControls.constraint.rotateLeft(2 * Math.PI * deltaX / this.domElement.offsetHeight * this.settings.rotateSpeed);
            this.orbitControls.constraint.rotateUp(2 * Math.PI * deltaY / this.domElement.offsetHeight * this.settings.rotateSpeed);
            this.orbitControls.update();
            this.animateCamera(this.camera.position);
        }

        private initTextures() {
            if (!GlobeMapCanvasLayers) {
                // Initialize once, since this is a CPU + Network heavy operation.
                GlobeMapCanvasLayers = [];

                for (var level = 2; level <= 5; ++level) {
                    var canvas = this.getBingMapCanvas(level);
                    GlobeMapCanvasLayers.push(canvas);
                }
            }

            // Can't execute in for loop because variable assignement gets overwritten
            var createTexture = (canvas: JQuery) => {
                var texture = new THREE.Texture(canvas.get(0));
                texture.needsUpdate = true;
                canvas.on("ready", (e, resolution) => {
                    //console.log("level ready", resolution, texture)
                    texture.needsUpdate = true;
                    this.needsRender = true;
                });
                return texture;

            };

            this.mapTextures = [];
            for (var i = 0; i < GlobeMapCanvasLayers.length; ++i) {
                this.mapTextures.push(createTexture(GlobeMapCanvasLayers[i]));
            }
        }

        private initHeatmap() {
            var settings = this.settings;

            //console.log("initHeatmap");
            try {
                var heatmap = this.heatmap = new WebGLHeatmap({ width: settings.heatmapSize, height: settings.heatmapSize, intensityToAlpha: true });
            } catch (e) {
                // IE & Edge will throw an error about texImage2D, we need to ignore it
                console.error(e);
            }

            // canvas contents will be used for a texture
            var texture = this.heatTexture = new THREE.Texture(heatmap.canvas);
            texture.needsUpdate = true;

            var material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
            var geometry = new THREE.SphereGeometry(settings.earthRadius + 0.01, settings.earthSegments, settings.earthSegments);
            var mesh = new THREE.Mesh(geometry, material);

            window["heatmap"] = heatmap;
            window["heatmapTexture"] = texture;

            this.scene.add(mesh);
        }

        private setEarthTexture() {
            //get distance as arbitrary value from 0-1
            if (!this.camera) return;
            var maxDistance = this.settings.cameraRadius - this.settings.earthRadius;
            var distance = (this.camera.position.length() - this.settings.earthRadius) / maxDistance;

            var texture;
            if (distance <= 1 / 5) {
                texture = this.mapTextures[3];
            } else if (distance <= 2 / 5) {
                texture = this.mapTextures[2];
            } else if (distance <= 3 / 5) {
                texture = this.mapTextures[1];
            } else {
                texture = this.mapTextures[0];
            }

            if (this.earth.material.map !== texture) {
                this.earth.material.map = texture;
            }

            if (this.selectedBar) {
                this.orbitControls.rotateSpeed = this.settings.rotateSpeed;
            } else {
                this.orbitControls.rotateSpeed = this.settings.rotateSpeed * distance;
            }

            //console.log(distance, this.orbitControls.rotateSpeed);
        }

        public update(options: VisualUpdateOptions) {
            this.needsRender = true;
            if (options.viewport.height !== this.viewport.height || options.viewport.width !== this.viewport.width) {
                var viewport = this.viewport = options.viewport;
                if (this.camera && this.renderer) {
                    this.camera.aspect = viewport.width / viewport.height;
                    this.camera.updateProjectionMatrix();
                    this.renderer.setSize(viewport.width, viewport.height);
                }
                return;
            }
            this.cleanHeatAndBar();

            // PowerBI fires two update calls, one for size, one for data
            if (options.dataViews[0] && (options.dataViews[0].categorical || options.dataViews[0].metadata)) {
                this.composeRenderData(options.dataViews[0].categorical, options.dataViews[0].metadata);
            }
        }

        public cleanHeatAndBar() {
            this.heatmap.clear();
            this.heatTexture.needsUpdate = true;
            if (this.barsGroup) {
                this.scene.remove(this.barsGroup);
            }
        }

        private renderMagic() {
            if (!this.readyToRender) {
                //console.log("not ready to render");
                this.defferedRender();
                return;
            }

            var renderData = this.data;
            var heatmap = this.heatmap;
            var settings = this.settings;

            heatmap.clear();

            if (this.barsGroup) {
                this.scene.remove(this.barsGroup);
            }

            this.barsGroup = new THREE.Object3D();
            this.scene.add(this.barsGroup);

            this.averageBarVector = new THREE.Vector3();

            for (var i = 0, len = renderData.length; i < len; ++i) {
                var renderDatum = renderData[i];

                if (!renderDatum.lat || !renderDatum.lng) continue;

                if (renderDatum.heat > 0.001) {
                    if (renderDatum.heat < 0.1) renderDatum.heat = 0.1;
                    var x = (180 + renderDatum.lng) / 360 * settings.heatmapSize;
                    var y = (1 - ((90 + renderDatum.lat) / 180)) * settings.heatmapSize;
                    heatmap.addPoint(x, y, settings.heatPointSize, renderDatum.heat * settings.heatIntensity);
                }

                if (renderDatum.height >= 0) {
                    if (renderDatum.height < 0.01) renderDatum.height = 0.01;
                    var latRadians = renderDatum.lat / 180 * Math.PI; //radians
                    var lngRadians = renderDatum.lng / 180 * Math.PI;

                    var x = Math.cos(lngRadians) * Math.cos(latRadians);
                    var z = -Math.sin(lngRadians) * Math.cos(latRadians);
                    var y = Math.sin(latRadians);
                    var v = new THREE.Vector3(x, y, z);

                    this.averageBarVector.add(v);

                    var barHeight = settings.barHeight * renderDatum.height;
                    //this array holds the relative series values to the actual measure for example [0.2,0.3,0.5]
                    //this is how we draw the vectors relativly to the complete value one on top of another. 
                    var measuresBySeries = [];
                    //this array holds the original values of the series for the tool tips
                    var dataPointToolTip = [];
                    if (renderDatum.heightBySeries) {
                        for (var c = 0; c < renderDatum.heightBySeries.length; c++) {
                            if (renderDatum.heightBySeries[c]) {
                                measuresBySeries.push(renderDatum.heightBySeries[c]);
                            }
                            dataPointToolTip.push(renderDatum.seriesToolTipData[c]);
                        }
                    } else {
                        //no category series so we'll just draw one value
                        measuresBySeries.push(1);
                    }

                    var previousMeasureValue = 0;
                    for (var j = 0; j < measuresBySeries.length; j++) {
                        previousMeasureValue += measuresBySeries[j];
                        var geometry = new THREE.CubeGeometry(settings.barWidth, settings.barWidth, barHeight * measuresBySeries[j]);
                        var bar = new THREE.Mesh(geometry, this.getBarMaterialByIndex(j));
                        bar.position = v.clone().multiplyScalar(settings.earthRadius + ((barHeight / 2) * previousMeasureValue));
                        bar.lookAt(v);
                        bar.toolTipData = dataPointToolTip.length === 0 ? renderDatum.toolTipData : this.getToolTipDataForSeries(renderDatum.toolTipData, dataPointToolTip[j]);
                        this.barsGroup.add(bar);
                        previousMeasureValue += measuresBySeries[j];
                    }
                }
            }

            if (this.barsGroup.children.length > 0 && this.camera) {
                this.averageBarVector.multiplyScalar(1 / this.barsGroup.children.length);
                if (this.locationsLoaded === this.locationsToLoad) {
                    this.animateCamera(this.averageBarVector);
                }
            }

            heatmap.update();
            heatmap.blur();
            this.heatTexture.needsUpdate = true;
            this.needsRender = true;			

            //console.log("renderMagic done! locations:", this.barsGroup.children.length, "toload/loaded", this.locationsToLoad, this.locationsLoaded)
        }

        private getBarMaterialByIndex(index): any {
            return new THREE.MeshPhongMaterial({ color: this.dataPointsToEnumerate[index].color });
        }

        private getToolTipDataForSeries(toolTipData, dataPointToolTip): any {
            var result = jQuery.extend(true, {
                series: { displayName: dataPointToolTip.displayName, value: dataPointToolTip.value }
            }, toolTipData);
            result.height.value = dataPointToolTip.dataPointValue;
            return result;
        }

        private createDataPointForEnumeration(seriesData, valueIndex, seriesIndex, metaData?): GlobeMapDataPoint {
            let source = seriesData.values[valueIndex].source;
            let label = converterHelper.getFormattedLegendLabel(source, seriesData.values, null);
            let identity = SelectionId.createWithId(seriesData.identity);
            let category = converterHelper.getSeriesName(source);
            let color = seriesData.objects && seriesData.objects.dataPoint ? seriesData.objects.dataPoint.fill.solid.color :
                metaData && metaData.objects ? this.colorHelper.getColorForMeasure(metaData.objects,"") : this.colors.getColorByIndex(seriesIndex).value;

            return {
                label: label,
                identity: identity,
                category: category,
                color: color,
                selected: null
            };
        }

        private composeRenderData(categoricalView?, metadataView?) {
            // memoize last value
            if (categoricalView) {
                this.categoricalView = categoricalView;
            } else {
                categoricalView = this.categoricalView;
            }

            this.data = [];
            this.dataPointsToEnumerate = [];
            var locations = [];
            var globeMapLocationCache = this.globeMapLocationCache;

            //console.log("categoricalView", categoricalView)
            if (!categoricalView) return;

            var heightIndex = 0,
                intensityIndex = 0,
                categories = [];
            try {
                if (categoricalView.categories) {
                    categories = categoricalView.categories;
                }
                var grouped = categoricalView.values.grouped();
                heightIndex = DataRoleHelper.getMeasureIndexOfRole(grouped, "Height");
                intensityIndex = DataRoleHelper.getMeasureIndexOfRole(grouped, "Heat");
                var longitudeIndex = DataRoleHelper.getMeasureIndexOfRole(grouped, "X");
                var latitudeIndex = DataRoleHelper.getMeasureIndexOfRole(grouped, "Y");
            } catch (e) { }

            var locationType, heights, heightsBySeries, toolTipDataBySeries, heats, latitudes, longitudes, locationDispName, heightDispName, heatDispName, heightFormat, heatFormat;

            if (categories && categories.length > 0 && categories[0].values) {
                var locationCategory = categories[0];
                locations = locationCategory.values;
                locationDispName = locationCategory.source.displayName;
                if (locationCategory.source.type.category) {
                    locationType = locationCategory.source.type.category.toLowerCase();
                } else {
                    locationType = "";
                }
            } else {
                locations = [];
            }

            // For debugging since devTools - salesByCountry isn't really sales by country
            //var places = ["kenya", "india", "united states", "london", "australia", "canada"]
            //heightIndex = 0;

            if (heightIndex !== undefined && categoricalView.values[heightIndex] && categoricalView.values !== undefined) {
                // heights = categoricalView.values[heightIndex].values;
                heightDispName = categoricalView.values[heightIndex].source.displayName;
                heightFormat = categoricalView.values[heightIndex].source.format;
                if (grouped.length > 1) {
                    heights = new Array(locations.length);
                    heightsBySeries = new Array(locations.length);
                    toolTipDataBySeries = new Array(locations.length);
                    this.dataPointsToEnumerate = new Array(grouped.length);
                    //creating a matrix for drawing values by series later.
                    for (var i = 0; i < grouped.length; i++) {
                        var values = grouped[i].values[heightIndex].values;
                        this.dataPointsToEnumerate[i] = this.createDataPointForEnumeration(grouped[i], heightIndex, i);
                        for (var j = 0; j < values.length; j++) {
                            if (!heights[j]) heights[j] = 0;
                            heights[j] += values[j] ? values[j] : 0;
                            if (!heightsBySeries[j]) heightsBySeries[j] = [];
                            heightsBySeries[j][i] = values[j];
                            if (!toolTipDataBySeries[j]) toolTipDataBySeries[j] = [];
                            toolTipDataBySeries[j][i] = { displayName: categoricalView.values.source.displayName, value: grouped[i].name, dataPointValue: values[j] };
                        }
                    }
                    for (var i = 0; i < grouped.length; i++) {
                        var values = grouped[i].values[heightIndex].values;
                        for (var j = 0; j < values.length; j++) { 
                            //calculating relative size of series
                            heightsBySeries[j][i] = values[j] / heights[j];
                        }
                    }
                } else {
                    heights = categoricalView.values[heightIndex].values;
                    heightsBySeries = new Array(grouped.length);
                    this.dataPointsToEnumerate[0] = this.createDataPointForEnumeration(grouped[0], heightIndex, 0, metadataView);
                }

            } else {
                heightsBySeries = new Array(locations.length);
                heights = new Array(locations.length);
            }

            if (intensityIndex !== undefined && categoricalView.values[intensityIndex]) {
                if (grouped.length > 1) {
                    heats = new Array(locations.length);
                    for (var i = 0; i < grouped.length; i++) {
                        var values = grouped[i].values[intensityIndex].values;
                        for (var j = 0; j < values.length; j++) {
                            if (!heats[j]) heats[j] = 0;
                            heats[j] += values[j] ? values[j] : 0;
                        }
                    }
                } else {
                    heats = categoricalView.values[intensityIndex].values;
                }
                heatDispName = categoricalView.values[intensityIndex].source.displayName;
                heatFormat = categoricalView.values[intensityIndex].source.format;
            } else {
                heats = new Array(locations.length);
            }

            if (longitudeIndex !== undefined && categoricalView.values[longitudeIndex]
                && latitudeIndex !== undefined && categoricalView.values[latitudeIndex]) {
                longitudes = categoricalView.values[longitudeIndex].values;
                latitudes = categoricalView.values[latitudeIndex].values;
            }
            else {
                longitudes = null;
                latitudes = null;
            }

            var maxHeight = Math.max.apply(null, heights) || 1;
            var maxHeat = Math.max.apply(null, heats) || 1;
            var heatFormatter = valueFormatter.create({ format: heatFormat, value: heats[0], value2: heats[1] });
            var heightFormatter = valueFormatter.create({ format: heightFormat, value: heights[0], value2: heights[1] });

            for (var i = 0, len = locations.length; i < len; ++i) {
                var place = locations[i];
                var lat, lng, latlng, height, heat;

                //place = places[i];

                if (place && typeof (place) === "string") {
                    place = place.toLowerCase();
                    var placeKey = place + "/" + locationType;

                    if (!longitudes && globeMapLocationCache[placeKey]) {
                        latlng = globeMapLocationCache[placeKey];
                        lat = latlng.latitude;
                        lng = latlng.longitude;
                    }
                    else if (longitudes) {
                        lat = latitudes[i];
                        lng = longitudes[i];
                    }

                    height = heights[i] / maxHeight;
                    heat = heats[i] / maxHeat;

                    var renderDatum = {
                        lat: lat,
                        lng: lng,
                        height: height ? height || 0.01 : undefined,
                        heightBySeries: heightsBySeries[i],
                        seriesToolTipData: toolTipDataBySeries ? toolTipDataBySeries[i] : undefined,
                        heat: heat || 0,
                        toolTipData: {
                            location: { displayName: locationDispName, value: locations[i] },
                            height: { displayName: heightDispName, value: heightFormatter.format(heights[i]) },
                            heat: { displayName: heatDispName, value: heatFormatter.format(heats[i]) }
                        }
                    };

                    this.data.push(renderDatum);

                    if (!longitudes && !latlng) {
                        this.geocodeRenderDatum(renderDatum, place, locationType);
                    }
                }
            }

            try {
                this.renderMagic();
            } catch (e) {
                console.error(e);
            }
        }

        private geocodeRenderDatum(renderDatum, place, locationType) {
            var placeKey = place + "/" + locationType;
            this.globeMapLocationCache[placeKey] = {}; //store empty object so we don't send AJAX request again
            this.locationsToLoad++;

            try {
                var geocoder = powerbi.visuals["BI"].Services.GeocodingManager.geocode;
            } catch (e) {
                geocoder = services.geocode;
            }

            if (geocoder) {
                geocoder(place, locationType).always((latlng: any) => {
                    // we use always because we want to cache unknown values. 
                    // No point asking bing again and again when it tells us it doesn't know about a location
                    this.globeMapLocationCache[placeKey] = latlng;
                    this.locationsLoaded++;
                    //console.log(place, latlng);

                    if (latlng.latitude && latlng.longitude) {
                        renderDatum.lat = latlng.latitude;
                        renderDatum.lng = latlng.longitude;

                        this.defferedRender();
                    }
                });
            }
        }

        private defferedRender() {
            if (!this.deferredRenderTimerId) {
                this.deferredRenderTimerId = setTimeout(() => {
                    this.deferredRenderTimerId = null;
                    this.composeRenderData();
                }, 500);
            }
        }

        private initRayCaster() {
            this.rayCaster = new THREE.Raycaster();
            var settings = this.settings;
            var mousePosNormalized = this.mousePosNormalized = new THREE.Vector2();
            var mousePos = this.mousePos = new THREE.Vector2();
            var element = this.container.get(0);
            var mouseDownTime;

            $(this.domElement).on("mousemove", (event) => {
                // get coordinates in -1 to +1 space
                var rect = element.getBoundingClientRect();
                mousePos.x = event.clientX;
                mousePos.y = event.clientY;
                mousePosNormalized.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                mousePosNormalized.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
                this.needsRender = true;
            }).on("mousedown", (event) => {
                mouseDownTime = Date.now();
            }).on("mouseup", (event) => {
                // Debounce slow clicks
                if ((Date.now() - mouseDownTime) > settings.clickInterval) return;
                if (this.hoveredBar && event.shiftKey) {
                    this.selectedBar = this.hoveredBar;
                    this.animateCamera(this.selectedBar.position, () => {
                        if (!this.selectedBar) return;
                        this.orbitControls.center.copy(this.selectedBar.position.clone().normalize().multiplyScalar(settings.earthRadius));
                        this.orbitControls.minDistance = 1;
                    });
                } else {
                    if (this.selectedBar) {
                        this.animateCamera(this.selectedBar.position, () => {
                            this.orbitControls.center.set(0, 0, 0);
                            this.orbitControls.minDistance = settings.earthRadius + 1;
                        });
                        this.selectedBar = null;
                    }
                }
            }).on("mousewheel DOMMouseScroll", (e: any) => {
                this.needsRender = true;
                if (this.orbitControls.enabled && this.orbitControls.enableZoom) {
                    this.heatTexture.needsUpdate = true;
                    e = e.originalEvent;
                    var delta = e.wheelDelta > 0 || e.detail < 0 ? 1 : -1;
                    var scale = delta > 0 ? this.settings.heatmapScaleOnZoom : (1 / this.settings.heatmapScaleOnZoom);
                    this.heatmap.multiply(scale);
                    this.heatmap.update();
                }
            });
        }

        private intersectBars() {
            if (!this.rayCaster || !this.barsGroup) return;
            var rayCaster = this.rayCaster;
            rayCaster.setFromCamera(this.mousePosNormalized, this.camera);
            var intersects = rayCaster.intersectObjects(this.barsGroup.children);

            if (intersects && intersects.length > 0) {
                //console.log(intersects[0], this.mousePos.x, this.mousePos.y);
                var object = intersects[0].object;
                if (!object || !object.toolTipData) return;
                var toolTipData = object.toolTipData;
                var toolTipItems: TooltipDataItem[] = [];
                if (toolTipData.location.displayName) toolTipItems.push(toolTipData.location);
                if (toolTipData.series) toolTipItems.push(toolTipData.series);
                if (toolTipData.height.displayName) toolTipItems.push(toolTipData.height);
                if (toolTipData.heat.displayName) toolTipItems.push(toolTipData.heat);
                this.hoveredBar = object;
                TooltipManager.ToolTipInstance.show(toolTipItems, <TouchRect>{ x: this.mousePos.x, y: this.mousePos.y, width: 0, height: 0 });
            } else {
                this.hoveredBar = null;
                TooltipManager.ToolTipInstance.hide();
            }
        }

        private animateCamera(to: any, done?: Function) {
            if (!this.camera) return;
            var startTime = Date.now();
            var duration = this.settings.cameraAnimDuration;
            var endTime = startTime + duration;
            var startPos = this.camera.position.clone().normalize();
            var endPos = to.clone().normalize();
            var length = this.camera.position.length();

            var easeInOut = function (t) {
                t *= 2;
                if (t < 1) return (t * t * t) / 2;
                t -= 2;
                return (t * t * t + 2) / 2;
            };

            var onUpdate = () => {
                var now = Date.now();
                var t = (now - startTime) / duration;
                if (t > 1) t = 1;
                t = easeInOut(t);

                var pos = new THREE.Vector3()
                    .add(startPos.clone().multiplyScalar(1 - t))
                    .add(endPos.clone().multiplyScalar(t))
                    .normalize()
                    .multiplyScalar(length);

                this.camera.position = pos;

                if (now < endTime) {
                    requestAnimationFrame(onUpdate);
                } else if (done) {
                    done();
                }

                this.needsRender = true;
            };
            requestAnimationFrame(onUpdate);
        }

        public destroy() {
            clearTimeout(this.deferredRenderTimerId);
            this.renderLoopEnabled = false;
            this.scene = null;
            this.heatmap = null;
            this.heatTexture = null;
            this.camera = null;
            if (this.renderer) {
                if (this.renderer.context) {
                    var extension = this.renderer.context.getExtension('WEBGL_lose_context');
                    if (extension)
                        extension.loseContext();
                    this.renderer.context = null;
                }
                this.renderer.domElement = null;
            }
            this.renderer = null;
            this.data = null;
            this.barsGroup = null;
            if (this.orbitControls) this.orbitControls.dispose();
            this.orbitControls = null;
            if (this.domElement) $(this.domElement)
                .off("mousemove mouseup mousedown mousewheel DOMMouseScroll");
            this.domElement = null;
            if (this.container) this.container.empty();
        }

        private initZoomControl() {
            var radius = 17;
            var zoomControlWidth = radius * 8.5;
            var zoomControlHeight = radius * 8.5;
            var startX = radius * 3;
            var startY = radius + 3;
            var gap = radius * 2;

            var zoomCss = {
                'position': 'absolute',
                'left': 'calc(100% - ' + zoomControlWidth + 'px)',
                'top': 'calc(100% - ' + zoomControlHeight + 'px)',
                'zIndex': '1000',
            };

            var zoomContainer = d3.select(this.container[0])
                .append('div')
                .style(zoomCss);

            this.zoomControl = zoomContainer.append("svg").attr({ "width": zoomControlWidth, "height": zoomControlHeight });

            var bottom = this.zoomControl.append("g").on("click", () => this.rotateCam(0, -5));
            bottom.append("circle").attr({ cx: startX + gap, cy: startY + (2 * gap), r: radius, fill: "white", opacity: 0.5, stroke: 'gray' });
            bottom.append("path").attr({ d: "M" + (startX + (2 * radius)) + " " + (startY + (radius * 4.7)) + " l12 -20 a40,70 0 0,1 -24,0z", fill: "gray" });

            var left = this.zoomControl.append("g").on("click", () => this.rotateCam(5, 0));
            left.append("circle").attr({ cx: startX, cy: startY + gap, r: radius, fill: "white", stroke: "gray", opacity: 0.5 });
            left.append("path").attr({ d: "M" + (startX - radius / 1.5) + " " + (startY + (radius * 2)) + " l20 -12 a70,40 0 0,0 0,24z", fill: "gray" });

            var top = this.zoomControl.append("g").on("click", () => this.rotateCam(0, 5));
            top.append("circle").attr({ cx: startX + gap, cy: startY, r: radius, fill: "white", stroke: "gray", opacity: 0.5 });
            top.append("path").attr({ d: "M" + (startX + (2 * radius)) + " " + (startY - (radius / 1.5)) + " l12 20 a40,70 0 0,0 -24,0z", fill: "gray" });

            var right = this.zoomControl.append("g").on("click", () => this.rotateCam(-5, 0));
            right.append("circle").attr({ cx: startX + (2 * gap), cy: startY + gap, r: radius, fill: "white", stroke: "gray", opacity: 0.5 });
            right.append("path").attr({ d: "M" + (startX + (4.7 * radius)) + " " + (startY + (radius * 2)) + " l-20 -12 a70,40 0 0,1 0,24z", fill: "gray" });

            var zoomIn = this.zoomControl.append("g").on("click", () => this.zoomClicked(-1));
            zoomIn.append("circle").attr({ cx: startX + 4 * radius, cy: startY + 6 * radius, r: radius, fill: "white", stroke: "gray", opacity: 0.5 });
            zoomIn.append("rect").attr({ x: startX + 3.5 * radius, y: startY + 5.9 * radius, width: radius, height: radius / 3, fill: "gray" });
            zoomIn.append("rect").attr({ x: startX + (4 * radius) - radius / 6, y: startY + 5.55 * radius, width: radius / 3, height: radius, fill: "gray" });

            var zoomOut = this.zoomControl.append("g").on("click", () => this.zoomClicked(1));
            zoomOut.append("circle").attr({ cx: startX, cy: startY + 6 * radius, r: radius, fill: "white", stroke: "gray", opacity: "0.50" });
            zoomOut.append("rect").attr({ x: startX - (radius / 2), y: startY + 5.9 * radius, width: radius, height: radius / 3, fill: "gray" });
        }

        private initMercartorSphere() {
            if (GlobeMap.MercartorSphere) return;

            var MercartorSphere = function (radius, widthSegments, heightSegments) {
                THREE.Geometry.call(this);

                this.radius = radius;
                this.widthSegments = widthSegments;
                this.heightSegments = heightSegments;

                this.t = 0;

                var x, y, vertices = [], uvs = [];

                function interplolate(a, b, t) {
                    return (1 - t) * a + t * b;
                }

                // interpolates between sphere and plane
                function interpolateVertex(u, v, t) {
                    var maxLng = Math.PI * 2;
                    var maxLat = Math.PI;
                    var radius = this.radius;

                    var sphereX = - radius * Math.cos(u * maxLng) * Math.sin(v * maxLat);
                    var sphereY = - radius * Math.cos(v * maxLat);
                    var sphereZ = radius * Math.sin(u * maxLng) * Math.sin(v * maxLat);

                    var planeX = u * radius * 2 - radius;
                    var planeY = v * radius * 2 - radius;
                    var planeZ = 0;

                    var x = interplolate(sphereX, planeX, t);
                    var y = interplolate(sphereY, planeY, t);
                    var z = interplolate(sphereZ, planeZ, t);

                    return new THREE.Vector3(x, y, z);
                }

                // http://mathworld.wolfram.com/MercatorProjection.html
                // Mercator projection goes form +85.05 to -85.05 degrees
                function interpolateUV(u, v, t) {
                    var lat = (v - 0.5) * 90 * 2 / 180 * Math.PI; //turn from 0-1 into lat in radians
                    var sin = Math.sin(lat);
                    var normalizedV = 0.5 + 0.25 * Math.log((1 + sin) / (1 - sin)) / Math.PI;
                    return new THREE.Vector2(u, normalizedV);//interplolate(normalizedV1, v, t))
                }

                for (y = 0; y <= heightSegments; y++) {

                    var verticesRow = [];
                    var uvsRow = [];

                    for (x = 0; x <= widthSegments; x++) {

                        var u = x / widthSegments;
                        var v = y / heightSegments;

                        this.vertices.push(interpolateVertex.call(this, u, v, this.t));
                        uvsRow.push(interpolateUV.call(this, u, v, this.t));
                        verticesRow.push(this.vertices.length - 1);
                    }

                    vertices.push(verticesRow);
                    uvs.push(uvsRow);

                }

                //console.log(vertices, uvs);

                for (y = 0; y < this.heightSegments; y++) {

                    for (x = 0; x < this.widthSegments; x++) {

                        var v1 = vertices[y][x + 1];
                        var v2 = vertices[y][x];
                        var v3 = vertices[y + 1][x];
                        var v4 = vertices[y + 1][x + 1];

                        var n1 = this.vertices[v1].clone().normalize();
                        var n2 = this.vertices[v2].clone().normalize();
                        var n3 = this.vertices[v3].clone().normalize();
                        var n4 = this.vertices[v4].clone().normalize();

                        var uv1 = uvs[y][x + 1].clone();
                        var uv2 = uvs[y][x].clone();
                        var uv3 = uvs[y + 1][x].clone();
                        var uv4 = uvs[y + 1][x + 1].clone();

                        var normals = [n1, n2, n3, n4];

                        this.faces.push(new THREE.Face4(v1, v2, v3, v4, normals));
                        this.faceVertexUvs[0].push([uv1, uv2, uv3, uv4]);
                    }

                }

                this.computeCentroids();
                this.computeFaceNormals();

                this.boundingSphere = new THREE.Sphere(new THREE.Vector3(), radius);
            };

            MercartorSphere.prototype = Object.create(THREE.Geometry.prototype);
            GlobeMap.MercartorSphere = MercartorSphere;
        }

        private getBingMapCanvas(resolution): JQuery {
            var tileSize = 256;
            var numSegments = Math.pow(2, resolution);
            var numTiles = numSegments * numSegments;
            var tilesLoaded = 0;
            var canvasSize = tileSize * numSegments;
            var canvas: JQuery = $('<canvas/>').attr({ width: canvasSize, height: canvasSize });
            var canvasElem: any = canvas.get(0);
            var canvasContext = canvasElem.getContext("2d");

            function generateQuads(res, quad) {
                if (res <= resolution) {
                    if (res === resolution) {
                        loadTile(quad);
                        //console.log(res, maxResolution, quad);
                    }

                    generateQuads(res + 1, quad + "0");
                    generateQuads(res + 1, quad + "1");
                    generateQuads(res + 1, quad + "2");
                    generateQuads(res + 1, quad + "3");
                }
            }

            function loadTile(quad) {
                var template: any = "https://t{server}.tiles.virtualearth.net/tiles/r{quad}.jpeg?g=0&mkt={language}";
                var numServers = 7;
                var server = Math.round(Math.random() * numServers);
                var language = (navigator["languages"] && navigator["languages"].length) ? navigator["languages"][0] : navigator.language;
                var url = template.replace("{server}", server)
                    .replace("{quad}", quad)
                    .replace("{language}", language);
                var coords = getCoords(quad);
                //console.log(quad, coords.x, coords.y)

                var tile = new Image();
                tile.onload = function () {
                    tilesLoaded++;
                    canvasContext.drawImage(tile, coords.x * tileSize, coords.y * tileSize, tileSize, tileSize);
                    if (tilesLoaded === numTiles) {
                        canvas.trigger("ready", resolution);
                    }
                };

                // So the canvas doesn't get tainted
                tile.crossOrigin = '';
                tile.src = url;
            }

            function getCoords(quad) {
                var x = 0;
                var y = 0;
                var last = quad.length - 1;

                for (var i = last; i >= 0; i--) {
                    var chr = quad.charAt(i);
                    var pow = Math.pow(2, last - i);

                    if (chr === "1") {
                        x += pow;
                    } else if (chr === "2") {
                        y += pow;
                    } else if (chr === "3") {
                        x += pow;
                        y += pow;
                    }
                }

                return { x: x, y: y };
            }

            generateQuads(0, "");
            return canvas;
        }
    }
}

function loadGlobeMapLibs() {
    // include GlobeMapLibs.js
}