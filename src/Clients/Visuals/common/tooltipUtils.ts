module powerbi.visuals {
    /**
     * Contains functions/constants to aid in adding tooltips. 
     */
    export module tooltipUtils {

        export function tooltipUpdate(selection: D3.Selection, tooltips: string[]): void {
            if (tooltips.length === 0)
                return;

            debug.assert(selection.length === tooltips.length || selection[0].length === tooltips.length, 'data length should match dom element count');
            let titles = selection.selectAll('title');
            let titlesUpdate = titles.data((d, i) => [tooltips[i]]);

            titlesUpdate.enter().append('title');
            titlesUpdate.exit().remove();
            titlesUpdate.text((d) => d);
        }
    }
}