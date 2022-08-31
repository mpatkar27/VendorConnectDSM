sap.ui.define([
], function() {
	"use strict";
	
	var AlwaysEnabledRenderer = {
		render: function(oRm, oControl) {
			// Render control header.

			oRm.write("<div");
			oRm.writeControlData(oControl);
			oRm.writeClasses();
			oRm.write(">");
			
			// Render child control.
			
			var oChildControl = oControl.getControl();
			if (oChildControl)
				oRm.renderControl(oChildControl);
				
			// Render control footer.

			oRm.write("</div>");
		}
	};

	return AlwaysEnabledRenderer;
}, true);
