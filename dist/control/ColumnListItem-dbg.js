sap.ui.define([
	"sap/ui/core/Element"
], function(Element) {
	"use strict";

	var ColumnListItem = Element.extend("gramont.VCDSM.specedit.control.ColumnListItem", {
		metadata: {
			properties: {
				error: {type: "boolean", defaultValue: false},
				deleted: {type: "boolean", defaultValue: false},
				autoGrow: {type: "boolean", defaultValue: false}
			},

			aggregations: {
				cells: {type: "sap.ui.core.Control", multiple: true, singularName: "cell"}
			},

			defaultAggregation: "cells"
		},

		getEnabled: function() {
			// Controls in "cells" aggregation are using this method thru EnabledPropagator to
			// determine their enabled state.
			
			var bEnabled = !this.getDeleted();
			return bEnabled;
		}
	});

	return ColumnListItem;
});
