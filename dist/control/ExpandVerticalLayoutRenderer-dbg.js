sap.ui.define([
], function() {
	"use strict";

	var ExpandVerticalLayoutRenderer = {
		render: function(oRm, oControl) {
			// Render control header.

			oRm.write("<div");
			oRm.writeControlData(oControl);
			oRm.addClass("gramontPlmVc_ExpandVerticalLayout");
			
			if (!oControl.getEnabled())
				oRm.addClass("gramontPlmVc_ExpandVerticalLayout_Disabled");
			
			oRm.writeClasses();
			oRm.write(">");

			// Render more/less link.

			var bExpanded = oControl.getExpanded();
			var iCollapseLimit = oControl.getCollapseLimit();
			var aContents = oControl.getContent();
			var oLink = oControl.getAggregation("_link");

			if (iCollapseLimit > 0 && aContents.length > iCollapseLimit) {
				var sLinkText = oControl.getModel("i18n").getProperty(bExpanded ? "ExpandVerticalLayout.show.less" : "ExpandVerticalLayout.show.more");
				oLink.setText(sLinkText);

				oRm.renderControl(oLink);

				if (!bExpanded)
					aContents = aContents.slice(0, iCollapseLimit);
			}

			// Render content.

			for (var i = 0; i < aContents.length; i++) {
				var oContent = aContents[i];

				oRm.write("<div>");
				oRm.renderControl(oContent);
				oRm.write("</div>");
			}

			// Render control footer.

			oRm.write("</div>");
		}
	};

	return ExpandVerticalLayoutRenderer;
}, true);
