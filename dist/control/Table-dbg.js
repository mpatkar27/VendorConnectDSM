/*
 * Table control implements a custom control which is similar to
 * sap.m.Table, and in addition it provides axis-switch.
 */

sap.ui.define([
	"sap/base/assert",
	"sap/ui/core/Control",
	"gramont/VCDSM/specedit/control/TableConst"
], function(assert, Control, TableConst) {
	"use strict";

	var Table = Control.extend("gramont.VCDSM.specedit.control.Table", {
		metadata: {
			properties: {
				horizontalRow: {type: "boolean", defaultValue: true},
				fixedLayout: {type: "boolean", defaultValue: true},   // Only in horizontal row mode.
				sticky: {type: "boolean", defaultValue: false}
			},

			aggregations: {
				headerToolbar: {type: "sap.m.Toolbar", multiple: false},
				columns: {type: "gramont.VCDSM.specedit.control.Column", multiple: true, singularName: "column"},
				items: {type: "gramont.VCDSM.specedit.control.ColumnListItem", multiple: true, singularName: "item", bindable: true}
			}
		},

		init: function() {
			this._fMouseEnter = jQuery.proxy(this._displayFloatingTooltip, this, true);
			this._fMouseLeave = jQuery.proxy(this._displayFloatingTooltip, this, false);
		},

		onBeforeRendering: function() {
			// Detach event handlers.

			var oDataCellDomRef = this._getDataCellDomRef();

			oDataCellDomRef.unbind("mouseenter", this._fMouseEnter);
			oDataCellDomRef.unbind("mouseleave", this._fMouseLeave);
		},

		onAfterRendering: function() {
			// Attach event handlers.

			var oDataCellDomRef = this._getDataCellDomRef();

			oDataCellDomRef.bind("mouseenter", this._fMouseEnter);
			oDataCellDomRef.bind("mouseleave", this._fMouseLeave);
		},

		_getDataCellDomRef: function() {
			// Get DOM reference for data cells.

			var oDataCellDomRef = this.$().find(".gramontPlmVc_Table_Data");
			return oDataCellDomRef;
		},

		_displayFloatingTooltip: function(bEnter, oEvent) {
			// Remove tooltip.

			var oTooltipDomRef = this.$().find(".gramontPlmVc_Table_FloatingTooltip");
			oTooltipDomRef.remove();

			// Construct tooltip.

			if (bEnter) {
				var oDataCellDomRef = oEvent.currentTarget;

				var iColumnIndex = oDataCellDomRef.getAttribute(TableConst.ColumnIndex);
				assert(iColumnIndex != null, "iColumnIndex should be set");

				var aColumns = this.getColumns();
				var oColumn = aColumns[iColumnIndex];
				var sText = oColumn.getFloatingTooltip();

				if (sText != "") {
					oTooltipDomRef = document.createElement("div");
					oTooltipDomRef.classList.add("gramontPlmVc_Table_FloatingTooltip");
					oDataCellDomRef.insertBefore(oTooltipDomRef, oDataCellDomRef.childNodes[0]);

					var oTextDomRef = document.createTextNode(sText);
					oTooltipDomRef.appendChild(oTextDomRef);
				}
			}
		}
	});

	return Table;
});
