sap.ui.define([
], function() {
	"use strict";
	
	var FieldRenderer = {
		render: function(oRm, oControl) {
			// Render control header.

			oRm.write("<div");
			oRm.writeControlData(oControl);
			oRm.addClass("gramontPlmVc_Field");
			oRm.writeClasses();
			
			var sWidth = oControl.getWidth();
			if (sWidth) // Test for null and empty value.
				oRm.addStyle("width", sWidth);
				
			oRm.writeStyles();
			oRm.write(">");
			
			// Render child control.
			
			var oChildControl = !oControl.getEditMode() ? oControl.getDisplay() : oControl.getEdit();
			if (oChildControl)
				oRm.renderControl(oChildControl);
				
			// Render control footer.

			oRm.write("</div>");
		}
	};

	return FieldRenderer;
}, true);
