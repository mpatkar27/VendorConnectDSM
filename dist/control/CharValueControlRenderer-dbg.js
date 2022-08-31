sap.ui.define([
], function() {
	"use strict";

	var CharValueControlRenderer = {
		render: function(oRm, oControl) {
			oRm.write("<div");
			oRm.writeControlData(oControl);
			oRm.addClass("gramontPlmVc_CharValueControl");
			oRm.writeClasses();
			oRm.write(">");

			var oInnerControl = oControl.getInnerControl();
			var oEditButton = oControl.getEditButton();
			var bRenderSeparator = oControl.getShowSeparator() && oInnerControl && oEditButton;

			if (oInnerControl)
				oRm.renderControl(oInnerControl);

			if (bRenderSeparator)
				oRm.write("&nbsp;");

			if (oEditButton)
				oRm.renderControl(oEditButton);

			oRm.write("</div>");
		}
	};

	return CharValueControlRenderer;
}, true);
