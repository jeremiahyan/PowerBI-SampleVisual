﻿/*
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
    export interface TreemapBehaviorOptions {
        shapes: D3.Selection;
        highlightShapes: D3.Selection;
        majorLabels: D3.Selection;
        minorLabels: D3.Selection;
        nodes: TreemapNode[];
        hasHighlights: boolean;
    }

    export class TreemapWebBehavior implements IInteractiveBehavior {
        private shapes: D3.Selection;
        private highlightShapes: D3.Selection;
        private hasHighlights: boolean;

        public bindEvents(options: TreemapBehaviorOptions, selectionHandler: ISelectionHandler): void {
            let shapes = this.shapes = options.shapes;
            let highlightShapes = this.highlightShapes = options.highlightShapes;
            let majorLabels = options.majorLabels;
            let minorLabels = options.minorLabels;
            this.hasHighlights = options.hasHighlights;

            InteractivityUtils.registerStandardInteractivityHandlers(shapes, selectionHandler);
            InteractivityUtils.registerStandardInteractivityHandlers(highlightShapes, selectionHandler);

            if (majorLabels) {
                InteractivityUtils.registerStandardInteractivityHandlers(majorLabels, selectionHandler);
            }
            if (minorLabels) {
                InteractivityUtils.registerStandardInteractivityHandlers(minorLabels, selectionHandler);
            }
        }

        public renderSelection(hasSelection: boolean): void {
            let hasHighlights = this.hasHighlights;
            this.shapes
                .style("fill", (d: TreemapNode) => Treemap.getFill(d, /* isHighlightRect */ false))
                .style("fill-opacity", (d: TreemapNode) => Treemap.getFillOpacity(d, hasSelection, !d.selected && hasHighlights, /* isHighlightRect */ false));
            this.highlightShapes
                .style("fill", (d: TreemapNode) => Treemap.getFill(d, /* isHighlightRect */ true))
                .style("fill-opacity", (d: TreemapNode) => Treemap.getFillOpacity(d, hasSelection, !d.selected && hasHighlights, /* isHighlightRect */ true));
        }
    }
}