sap.ui.define([
	"sap/ui/core/Control"
], function(Control) {
	"use strict";

	var AlwaysEnabled = Control.extend("gramont.VCDSM.specedit.control.AlwaysEnabled", {
		metadata: {
			aggregations: {
				control: {type: "sap.ui.core.Control", multiple: false}
			}
		},

		getEnabled: function() {
			// Inhibit EnabledPropagator.
			
			return true;
		}
	});
	
	return AlwaysEnabled;
});
