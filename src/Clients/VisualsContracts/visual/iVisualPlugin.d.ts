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

declare module powerbi {
    
    export interface IVisualPlugin {
        /** The name of the plugin.  Must match the property name in powerbi.visuals. */
        name: string;

        /** The key for the watermark style of this visual. Must match the id name in ExploreUI/views/svg/visualsWatermarks.svg */
        watermarkKey?: string;

        /** Declares the capabilities for this IVisualPlugin type. */
        capabilities?: VisualCapabilities;

        /** Function to call to create the visual. */
        create: IVisualFactoryMethod;

        /** 
         * Function to allow the visual to influence query generation. Called each time a query is generated
        * so the visual can translate its state into options understood by the query generator. 
        */
        customizeQuery?: CustomizeQueryMethod;

        /** Funation to allow the visual to provide additional information for telemetry. */
        getAdditionalTelemetry?: GetAdditionalTelemetryMethod;

        /** The class of the plugin.  At the moment it is only used to have a way to indicate the class name that a custom visual has. */
        class?: string;

        /** The url to the icon to display within the visualization pane. */
        iconUrl?: string;

        /** Check if a visual is custom */
        custom?: boolean;

        /* Function to get the list of sortable roles */
        getSortableRoles?: (visualSortableOptions?: VisualSortableOptions) => string[];
        
        /** The version of the api that this plugin should be run against */
        apiVersion?: string;
    }

    /** Method for gathering addition information from the visual for telemetry. */
    export interface GetAdditionalTelemetryMethod {
        (dataView: DataView): any;
    }

    /** Factory method for an IVisual.  This factory method should be registered on the powerbi.visuals object. */
    export interface IVisualFactoryMethod {
        (): powerbi.IVisual;
    }
}