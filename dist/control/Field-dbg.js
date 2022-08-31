/*
 * Field control works similar like SmartField: depending on mode
 * (display/edit) it displays a suitable control.
 *
 * See:
 * - sap/ui/comp/smartfield/SmartField: _createControlIfRequired
 * - sap/ui/comp/smartfield/ODataControlFactory: _createEdm*
 */

sap.ui.define([
	"sap/ui/core/Control"
], function(Control) {
	"use strict";

	var Field = Control.extend("gramont.VCDSM.specedit.control.Field", {
		metadata: {
			properties: {
				editMode: {type: "boolean", defaultValue: false},
				width: {type: "sap.ui.core.CSSSize", defaultValue: ""}
			},
			
			aggregations: {
				display: {type: "sap.ui.core.Control", multiple: false},
				edit: {type: "sap.ui.core.Control", multiple: false}
			}
		}
	});
	
	return Field;
});
