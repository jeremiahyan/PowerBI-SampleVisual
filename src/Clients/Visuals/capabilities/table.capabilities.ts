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
    export const tableCapabilities: VisualCapabilities = {
        dataRoles: [{
            name: 'Values',
            kind: VisualDataRoleKind.GroupingOrMeasure,
        }],
        objects: {
            general: {
                displayName: data.createDisplayNameGetter('Visual_General'),
                properties: {
                    formatString: {
                        type: { formatting: { formatString: true } },
                    },
                    columnWidth: {
                        type: { numeric: true }
                    },
                    totals: {
                        type: { bool: true },
                        displayName: data.createDisplayNameGetter('Visual_Totals')
                    },
                    autoSizeColumnWidth: {
                        type: { bool: true },
                        displayName: data.createDisplayNameGetter('Visual_Adjust_Column_Width')
                    },
                    textSize: {
                        displayName: data.createDisplayNameGetter('Visual_TextSize'),
                        type: { numeric: true }
                    },
                },
            },

            grid: {
                displayName: data.createDisplayNameGetter('Visual_Grid'),
                properties: {
                    outlineColor: {
                        displayName: data.createDisplayNameGetter('Visual_OutlineColor'),
                        description: data.createDisplayNameGetter('Visual_OutlineColor_Desc'),
                        type: { fill: { solid: { color: true } } }
                    },
                    outlineWeight: {
                        displayName: data.createDisplayNameGetter('Visual_OutlineWeight'),
                        description: data.createDisplayNameGetter('Visual_OutlineWeight_Desc'),
                        type: { numeric: true }
                    },
                    gridVertical: {
                        displayName: data.createDisplayNameGetter('Visual_GridVertical'),
                        description: data.createDisplayNameGetter('Visual_GridVertical_Desc'),
                        type: { bool: true }
                    },
                    gridVerticalColor: {
                        displayName: data.createDisplayNameGetter('Visual_GridVertical_Color'),
                        description: data.createDisplayNameGetter('Visual_GridVertical_Color_Desc'),
                        type: { fill: { solid: { color: true } } }
                    },
                    gridVerticalWeight: {
                        displayName: data.createDisplayNameGetter('Visual_GridVertical_Weight'),
                        description: data.createDisplayNameGetter('Visual_GridVertical_Weight_Desc'),
                        type: { numeric: true }
                    },
                    gridHorizontal: {
                        displayName: data.createDisplayNameGetter('Visual_GridHorizontal'),
                        description: data.createDisplayNameGetter('Visual_GridHorizontal_Desc'),
                        type: { bool: true }
                    },
                    gridHorizontalColor: {
                        displayName: data.createDisplayNameGetter('Visual_GridHorizontal_Color'),
                        description: data.createDisplayNameGetter('Visual_GridHorizontal_Color_Desc'),
                        type: { fill: { solid: { color: true } } }
                    },
                    gridHorizontalWeight: {
                        displayName: data.createDisplayNameGetter('Visual_GridHorizontal_Weight'),
                        description: data.createDisplayNameGetter('Visual_GridHorizontal_Weight_Desc'),
                        type: { numeric: true }
                    },
                    rowPadding: {
                        displayName: data.createDisplayNameGetter('Visual_RowPadding'),
                        description: data.createDisplayNameGetter('Visual_RowPadding_Desc'),
                        type: { numeric: true }
                    },
                }
            },

            columnHeaders: {
                displayName: data.createDisplayNameGetter('Visual_Tablix_ColumnHeaders'),
                properties: {
                    outline: {
                        displayName: data.createDisplayNameGetter('Visual_Outline'),
                        type: { enumeration: outline.type }
                    },
                    fontColor: {
                        displayName: data.createDisplayNameGetter('Visual_Tablix_FontColor'),
                        description: data.createDisplayNameGetter('Visual_Tablix_FontColor_Desc'),
                        type: { fill: { solid: { color: true } } }
                    },
                    backColor: {
                        displayName: data.createDisplayNameGetter('Visual_Tablix_BackColor'),
                        description: data.createDisplayNameGetter('Visual_Tablix_BackColor_Desc'),
                        type: { fill: { solid: { color: true } } }
                    },
                }
            },

            values: {
                displayName: data.createDisplayNameGetter('Visual_Tablix_Values'),
                properties: {
                    outline: {
                        displayName: data.createDisplayNameGetter('Visual_Outline'),
                        type: { enumeration: outline.type }
                    },
                    // TODO: VSTS 7167767: Remove temporary code for product demo.
                    backgroundColorConditional: {
                        displayName: 'Conditional Formatting',
                        type: { bool: true }
                    },
                    fontColorPrimary: {
                        displayName: data.createDisplayNameGetter('Visual_Tablix_FontColorPrimary'),
                        description: data.createDisplayNameGetter('Visual_Tablix_FontColorPrimary_Desc'),
                        type: { fill: { solid: { color: true } } }
                    },
                    backColorPrimary: {
                        displayName: data.createDisplayNameGetter('Visual_Tablix_BackColorPrimary'),
                        description: data.createDisplayNameGetter('Visual_Tablix_BackColorPrimary_Desc'),
                        type: { fill: { solid: { color: true } } }
                    },
                    fontColorSecondary: {
                        displayName: data.createDisplayNameGetter('Visual_Tablix_FontColorSecondary'),
                        description: data.createDisplayNameGetter('Visual_Tablix_FontColorSecondary_Desc'),
                        type: { fill: { solid: { color: true } } }
                    },
                    backColorSecondary: {
                        displayName: data.createDisplayNameGetter('Visual_Tablix_BackColorSecondary'),
                        description: data.createDisplayNameGetter('Visual_Tablix_BackColorSecondary_Desc'),
                        type: { fill: { solid: { color: true } } }
                    },
                    urlIcon: {
                        displayName: data.createDisplayNameGetter('Visual_Tablix_UrlIcon'),
                        description: data.createDisplayNameGetter('Visual_Tablix_UrlIcon_Desc'),
                        type: { bool: true }
                    },
                }
            },

            total: {
                displayName: data.createDisplayNameGetter('Visual_Tablix_TotalGrand'),
                properties: {
                    outline: {
                        displayName: data.createDisplayNameGetter('Visual_Outline'),
                        type: { enumeration: outline.type }
                    },
                    fontColor: {
                        displayName: data.createDisplayNameGetter('Visual_Tablix_FontColor'),
                        description: data.createDisplayNameGetter('Visual_Tablix_FontColor_Desc'),
                        type: { fill: { solid: { color: true } } }
                    },
                    backColor: {
                        displayName: data.createDisplayNameGetter('Visual_Tablix_BackColor'),
                        description: data.createDisplayNameGetter('Visual_Tablix_BackColor_Desc'),
                        type: { fill: { solid: { color: true } } }
                    },
                }
            },
        },
        dataViewMappings: [{
            table: {
                rows: {
                    for: { in: 'Values' },
                    dataReductionAlgorithm: { window: { count: 500 } }
                },
                rowCount: { preferred: { min: 1 } }
            },
        }],
        sorting: {
            custom: {},
        },
        suppressDefaultTitle: true,
        supportsSelection: false,
        disableVisualDetails: true,
    };
}