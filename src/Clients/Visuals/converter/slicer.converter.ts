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

module powerbi.visuals {
    import SemanticFilter = powerbi.data.SemanticFilter;
    import UrlUtils = jsCommon.UrlUtils;

    /** Helper module for converting a DataView into SlicerData. */
    export module DataConversion {
        export function convert(dataView: DataView, localizedSelectAllText: string, interactivityService: IInteractivityService | ISelectionHandler, hostServices: IVisualHostServices): SlicerData {
            debug.assertValue(hostServices, 'hostServices');
            if (!dataView || !dataView.categorical || _.isEmpty(dataView.categorical.categories))
                return;

            let identityFields = dataView.categorical.categories[0].identityFields;

            if (!identityFields)
                return;

            let filter: SemanticFilter = <SemanticFilter>(
                dataView.metadata &&
                dataView.metadata.objects &&
                DataViewObjects.getValue(dataView.metadata.objects, visuals.slicerProps.filterPropertyIdentifier));

            let analyzer = hostServices.analyzeFilter({
                dataView: dataView,
                defaultValuePropertyId: slicerProps.defaultValue,
                filter: filter,
                fieldSQExprs: identityFields
            });
            if (!analyzer)
                return;
            
            let analyzedSemanticFilter = <SemanticFilter>analyzer.filter;
            if (analyzedSemanticFilter && !SemanticFilter.isSameFilter(analyzedSemanticFilter, filter)) {
                (<ISelectionHandler>interactivityService).handleClearSelection();
                let filterPropertyIdentifier = slicerProps.filterPropertyIdentifier;
                let properties: { [propertyName: string]: DataViewPropertyValue } = {};
                properties[filterPropertyIdentifier.propertyName] = analyzer.filter;
                let instance = {
                    objectName: filterPropertyIdentifier.objectName,
                    selector: undefined,
                    properties: properties
                };

                let changes: VisualObjectInstancesToPersist = {
                    merge: [instance]
                };
                hostServices.persistProperties(changes);
            }

            let slicerData = getSlicerData(analyzer, dataView.metadata, dataView.categorical, localizedSelectAllText, <IInteractivityService>interactivityService, hostServices);
            return slicerData;
        }

        function getSlicerData(
            analyzer: AnalyzedFilter,
            dataViewMetadata: DataViewMetadata,
            categorical: DataViewCategorical,
            localizedSelectAllText: string, interactivityService: IInteractivityService, hostServices: IVisualHostServices): SlicerData {
            let isInvertedSelectionMode: boolean = interactivityService && interactivityService.isSelectionModeInverted();
            let selectedScopeIds = analyzer.selectedIdentities;

            let hasSelectionOverride = !_.isEmpty(selectedScopeIds) || isInvertedSelectionMode === true;
            if (!isInvertedSelectionMode && analyzer.filter)
                isInvertedSelectionMode = analyzer.isNotFilter;

            if (interactivityService) {
                // To indicate whether the selection is Not selected items
                interactivityService.setSelectionModeInverted(isInvertedSelectionMode);

                // defaultValueMode will be used when determine show/hide clear button.
                interactivityService.setDefaultValueMode(SemanticFilter.isDefaultFilter(<SemanticFilter>analyzer.filter));
            }

            let category = categorical.categories[0];
            let categoryValuesLen: number = category && category.values ? category.values.length : 0;
            let slicerDataPoints: SlicerDataPoint[] = [];
            let formatString = valueFormatter.getFormatString(category.source, slicerProps.formatString);
            let numOfSelected: number = 0;
            let valueCounts = categorical.values && categorical.values[0] && categorical.values[0].values;
            if (valueCounts && _.isEmpty(valueCounts))
                valueCounts = undefined;

            debug.assert(!valueCounts || valueCounts.length === categoryValuesLen, "valueCounts doesn't match values");
            let isImageData = dataViewMetadata &&
                !_.isEmpty(dataViewMetadata.columns) && converterHelper.isImageUrlColumn(dataViewMetadata.columns[0]);
            let displayNameIdentityPairs: DisplayNameIdentityPair[] = [];
            for (let i = 0; i < categoryValuesLen; i++) {
                let scopeId = category.identity && category.identity[i];
                let value = category.values && category.values[i];
                let count = valueCounts && valueCounts[i];

                let isRetained = hasSelectionOverride ? SlicerUtil.tryRemoveValueFromRetainedList(scopeId, selectedScopeIds) : false;
                let label: string = valueFormatter.format(value, formatString);
                let isImage = isImageData === true && UrlUtils.isValidImageUrl(label);
                let slicerData: SlicerDataPoint = {
                    value: label,
                    tooltip: label,
                    identity: SelectionId.createWithId(scopeId),
                    selected: isRetained,
                    count: <number>count,
                    isImage: isImage,
                };

                    if (isRetained) {
                        let displayNameIdentityPair: DisplayNameIdentityPair = {
                            displayName: label,
                            identity: scopeId
                        };
                        displayNameIdentityPairs.push(displayNameIdentityPair);
                    }

                    slicerDataPoints.push(slicerData);
                    if (slicerData.selected)
                        numOfSelected++;
                }

            if (!_.isEmpty(displayNameIdentityPairs))
                hostServices.setIdentityDisplayNames(displayNameIdentityPairs);

            // Add retained values that are not in the returned dataview to the value list.
            if (hasSelectionOverride && !_.isEmpty(selectedScopeIds)) {
                
                let displayNamesIdentityPairs = hostServices.getIdentityDisplayNames(selectedScopeIds);
                if (!_.isEmpty(displayNamesIdentityPairs)) {
                    for (let pair of displayNamesIdentityPairs) {
                        // When there is no valueCounts, set count to be undefined, otherwise use 0 as the count for retained values
                        let slicerData: SlicerDataPoint = {
                            value: pair.displayName,
                            tooltip: pair.displayName,
                            identity: SelectionId.createWithId(pair.identity),
                            selected: true,
                            count: valueCounts != null ? 0 : undefined,
                        };

                        slicerDataPoints.push(slicerData);
                        numOfSelected++;
                    }
                }
            }

            let defaultSettings = createDefaultSettings(dataViewMetadata);
            if (defaultSettings.selection.selectAllCheckboxEnabled) {
                //If selectAllCheckboxEnabled, and all the items are selected and there is no more data to request, then unselect all and toggle the invertedSelectionMode
                if (numOfSelected > 0 && !dataViewMetadata.segment && numOfSelected === slicerDataPoints.length) {
                    isInvertedSelectionMode = !isInvertedSelectionMode;
                    interactivityService.setSelectionModeInverted(isInvertedSelectionMode);
                    for (let item of slicerDataPoints) {
                        item.selected = false;
                    }
                    hasSelectionOverride = false;
                    numOfSelected = 0;
                }

                slicerDataPoints.unshift({
                    value: localizedSelectAllText,
                    tooltip: localizedSelectAllText,
                    identity: SelectionId.createWithMeasure(localizedSelectAllText),
                    selected: !!isInvertedSelectionMode && numOfSelected === 0,
                    isSelectAllDataPoint: true,
                    count: undefined,
                });
            }

            let slicerData: SlicerData = {
                categorySourceName: category.source.displayName,
                slicerSettings: defaultSettings,
                slicerDataPoints: slicerDataPoints,
                hasSelectionOverride: hasSelectionOverride,
                defaultValue: analyzer.defaultValue,
            };

            return slicerData;
        }

        function createDefaultSettings(dataViewMetadata: DataViewMetadata): SlicerSettings {
            let defaultSettings = Slicer.DefaultStyleProperties();
            let objects = dataViewMetadata.objects;
            let forceSingleSelect = dataViewMetadata.columns && _.some(dataViewMetadata.columns, (column) => column.discourageAggregationAcrossGroups);

            if (objects) {
                defaultSettings.general.outlineColor = DataViewObjects.getFillColor(objects, slicerProps.general.outlineColor, defaultSettings.general.outlineColor);
                defaultSettings.general.outlineWeight = DataViewObjects.getValue<number>(objects, slicerProps.general.outlineWeight, defaultSettings.general.outlineWeight);
                defaultSettings.general.orientation = DataViewObjects.getValue<slicerOrientation.Orientation>(objects, slicerProps.general.orientation, defaultSettings.general.orientation);

                defaultSettings.header.show = DataViewObjects.getValue<boolean>(objects, slicerProps.header.show, defaultSettings.header.show);
                defaultSettings.header.fontColor = DataViewObjects.getFillColor(objects, slicerProps.header.fontColor, defaultSettings.header.fontColor);
                let headerBackground = DataViewObjects.getFillColor(objects, slicerProps.header.background);
                if (headerBackground)
                    defaultSettings.header.background = headerBackground;
                defaultSettings.header.outline = DataViewObjects.getValue<string>(objects, slicerProps.header.outline, defaultSettings.header.outline);
                defaultSettings.header.textSize = DataViewObjects.getValue<number>(objects, slicerProps.header.textSize, defaultSettings.header.textSize);

                defaultSettings.slicerText.color = DataViewObjects.getFillColor(objects, slicerProps.items.fontColor, defaultSettings.slicerText.color);
                let textBackground = DataViewObjects.getFillColor(objects, slicerProps.items.background);
                if (textBackground)
                    defaultSettings.slicerText.background = textBackground;

                defaultSettings.slicerText.outline = DataViewObjects.getValue<string>(objects, slicerProps.items.outline, defaultSettings.slicerText.outline);
                defaultSettings.slicerText.textSize = DataViewObjects.getValue<number>(objects, slicerProps.items.textSize, defaultSettings.slicerText.textSize);

                defaultSettings.selection.selectAllCheckboxEnabled = !forceSingleSelect && DataViewObjects.getValue<boolean>(objects, slicerProps.selection.selectAllCheckboxEnabled, defaultSettings.selection.selectAllCheckboxEnabled);
                defaultSettings.selection.singleSelect = forceSingleSelect || DataViewObjects.getValue<boolean>(objects, slicerProps.selection.singleSelect, defaultSettings.selection.singleSelect);
            }

            return defaultSettings;
        }
    }
}