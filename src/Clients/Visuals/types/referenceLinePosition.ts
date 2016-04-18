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
    export module referenceLinePosition {
        export const back: string = 'back';
        export const front: string = 'front';

        export const type: IEnumType = createEnumType([
            { value: back, displayName: resources => resources.get('Visual_Reference_Line_Behind') },
            { value: front, displayName: resources => resources.get('Visual_Reference_Line_InFront') },
        ]);
    }

    export module referenceLineDataLabelHorizontalPosition {
        export const left: string = 'left';
        export const right: string = 'right';

        export const type: IEnumType = createEnumType([
            { value: left, displayName: resources => resources.get('Visual_Reference_Line_Data_Label_Left') },
            { value: right, displayName: resources => resources.get('Visual_Reference_Line_Data_Label_Right') },
        ]);
    }

    export module referenceLineDataLabelVerticalPosition {
        export const above: string = 'above';
        export const under: string = 'under';

        export const type: IEnumType = createEnumType([
            { value: above, displayName: resources => resources.get('Visual_Reference_Line_Data_Label_Above') },
            { value: under, displayName: resources => resources.get('Visual_Reference_Line_Data_Label_Under') },
        ]);
    }
}