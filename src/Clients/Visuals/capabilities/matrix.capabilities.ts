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
    export const matrixRoleNames = {
        rows: 'Rows',
        columns: 'Columns',
        values: 'Values',
    };

    export const matrixCapabilities: VisualCapabilities = {
        dataRoles: [
            {
                name: matrixRoleNames.rows,
                kind: VisualDataRoleKind.Grouping,
                description: data.createDisplayNameGetter('Role_DisplayName_RowsDescription')
            }, {
                name: matrixRoleNames.columns,
                kind: VisualDataRoleKind.Grouping,
                description: data.createDisplayNameGetter('Role_DisplayName_ColumnsDescription')
            }, {
                name: matrixRoleNames.values,
                kind: VisualDataRoleKind.Measure
            }
        ],
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
                    rowSubtotals: {
                        type: { bool: true },
                        displayName: data.createDisplayNameGetter('Visual_TotalRow')
                    },
                    columnSubtotals: {
                        type: { bool: true },
                        displayName: data.createDisplayNameGetter('Visual_TotalColumn')
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
                },
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

            rowHeaders:
            {
                displayName: data.createDisplayNameGetter('Visual_Tablix_RowHeaders'),
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
            values:
            {
                displayName: data.createDisplayNameGetter('Visual_Tablix_Values'),
                properties: {
                    outline: {
                        displayName: data.createDisplayNameGetter('Visual_Outline'),
                        type: { enumeration: outline.type }
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
                }
            },
            subTotals:
            {
                displayName: data.createDisplayNameGetter('Visual_Tablix_TotalSub'),
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
            conditions: [
                { 'Rows': { max: 0 }, 'Columns': { max: 0 }, 'Values': { min: 1 } },
                { 'Rows': { min: 1 }, 'Columns': { min: 0 }, 'Values': { min: 0 } },
                { 'Rows': { min: 0 }, 'Columns': { min: 1 }, 'Values': { min: 0 } }
            ],
            matrix: {
                rows: {
                    for: { in: 'Rows' },
                    /* Explicitly override the server data reduction to make it appropriate for matrix. */
                    dataReductionAlgorithm: { window: { count: 500 } }
                },
                columns: {
                    for: { in: 'Columns' },
                    /* Explicitly override the server data reduction to make it appropriate for matrix. */
                    dataReductionAlgorithm: { top: { count: 100 } }
                },
                values: {
                    for: { in: 'Values' }
                }
            }
        }],
        filterMappings: {
            measureFilter: {
                targetRoles: [matrixRoleNames.rows]
            }
        },
        sorting: {
            custom: {},
        },
        suppressDefaultTitle: true,
        supportsSelection: false,
        disableVisualDetails: true,
    };
}