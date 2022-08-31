sap.ui.define([
	"sap/ui/core/Element",
	"sap/ui/core/TextAlign"
], function(Element, TextAlign) {
	"use strict";

	var Column = Element.extend("gramont.VCDSM.specedit.control.Column", {
		metadata: {
			properties: {
				visible: {type: "boolean", defaultValue: true},
				width: {type: "sap.ui.core.CSSSize", defaultValue: ""},                                           // Only in horizontal row mode.
				hAlign: {type: "sap.ui.core.TextAlign", defaultValue: TextAlign.Begin},               // Only in horizontal row mode.
				hAlignForVerticalRow: {type: "sap.ui.core.TextAlign", defaultValue: TextAlign.Begin}, // Only in vertical row mode.
				floatingTooltip: {type: "string", defaultValue: ""}
			},

			aggregations: {
				header: {type: "sap.ui.core.Control", multiple: false}
			},

			defaultAggregation: "header"
		}
	});

	return Column;
});
