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

module powerbitests {
    import visuals = powerbi.visuals;
    import IVisualPluginService = powerbi.visuals.IVisualPluginService;

    describe('visual plugin service tests', () => {
        let featureSwitchService: visuals.MinervaVisualFeatureSwitches;
        let pluginService: IVisualPluginService;
        let minervaVisualPluginService: IVisualPluginService;

        beforeEach(() => {
            featureSwitchService = {};
            pluginService = visuals.visualPluginFactory.create();
            minervaVisualPluginService = visuals.visualPluginFactory.createMinerva(featureSwitchService);
        });

        afterEach(() => {
            delete (localStorage['customVisualMetaData']);
        });

        it("Disables map when locale doesn't support maps", () => {
            expect(pluginService.shouldDisableVisual(powerbi.visuals.plugins.map.name, true)).toBe(true);
        });

        it("Disables filled map when locale doesn't support maps", () => {
            expect(pluginService.shouldDisableVisual(powerbi.visuals.plugins.filledMap.name, true)).toBe(true);
        });

        it("Doesn't disable map when locale supports maps", () => {
            expect(pluginService.shouldDisableVisual(powerbi.visuals.plugins.map.name, false)).toBe(false);
        });

        it("Doesn't disable filled map when locale supports maps", () => {
            expect(pluginService.shouldDisableVisual(powerbi.visuals.plugins.filledMap.name, false)).toBe(false);
        });

        it("Doesn't disable non-map visuals when locale doesn't support maps", () => {
            expect(pluginService.shouldDisableVisual(powerbi.visuals.plugins.pieChart.name, true)).toBe(false);
        });

        it('Should validate plugin and not pushPluginIntoConvertibleTypes', () => {
            let visualMetaDataMock = { "Test": { "visualSettings": { "visualName": "Test", "version": "1.0.0" }, "sourceCode": { "typescriptCode": "// Example ts", "cssCode": "// Example css" } } };
            let spy = spyOn(minervaVisualPluginService, 'pushPluginIntoConvertibleTypes');

            powerbi.localStorageService.setData('customVisualMetaData', visualMetaDataMock);

            expect(spy).not.toHaveBeenCalled();
        });

        it('Should validate javascript sourcecode and not pushPluginIntoConvertibleTypes', () => {
            let visualMetaDataMock = { "Test": { "visualSettings": { "visualName": "Test", "version": "1.0.0" }, "pluginName": "Test1450902079303" } };
            let spy = spyOn(minervaVisualPluginService, 'pushPluginIntoConvertibleTypes');

            powerbi.localStorageService.setData('customVisualMetaData', visualMetaDataMock);

            expect(spy).not.toHaveBeenCalled();
        });

        it('Should validate javascript sourcecode and not pushPluginIntoConvertibleTypes', () => {
            let visualMetaDataMock = { "Test": { "visualSettings": { "visualName": "Test", "version": "1.0.0" }, "sourceCode": { "typescriptCode": "// Example ts", "cssCode": "// Example css" }, "pluginName": "Test1450902079303" } };
            let spy = spyOn(minervaVisualPluginService, 'pushPluginIntoConvertibleTypes');

            powerbi.localStorageService.setData('customVisualMetaData', visualMetaDataMock);

            expect(spy).not.toHaveBeenCalled();
        });
    });
}
