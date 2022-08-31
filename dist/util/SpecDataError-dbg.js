sap.ui.define([
	"sap/base/assert",
	"sap/ui/model/json/JSONModel",
	"gramont/VCDSM/specedit/util/Util"
], function(assert, JSONModel, Util) {
	"use strict";

	var SpecDataError = function(oComponent, oParentControl) {
		this._oComponent = oComponent;

		// Construct popover.

		this._oPopover = this._oComponent.getNavigator().createFragment("gramont.VCDSM.specedit.frag.SpecDataError", this, oParentControl);

		this._oPopoverModel = new JSONModel();
		this._oPopover.control.setModel(this._oPopoverModel);
	};
	
	SpecDataError.prototype.setEntryErrorInfos = function(aEntryErrorInfos) {
		assert(aEntryErrorInfos.length > 0, "aEntryErrorInfos.length should be > 0");
		this._oPopoverModel.setData(aEntryErrorInfos);
	};
	
	SpecDataError.prototype.show = function(bShow, oControl) {
		switch (bShow) {
		case true:
			this._oPopover.control.openBy(oControl);
			break;
			
		case false:
			this._oPopover.control.close();
			break;

		case null:
			this._oPopover.control.toggle(oControl);
			break;

		default:
			assert(false, "bShow is unknown");
		}
	};
	
	SpecDataError.prototype._formatDescription = function(aEntryErrors, oFieldErrorsByField) {
		var aErrorMessages = Util.getErrorMessages(null, aEntryErrors, oFieldErrorsByField);
		var sErrorMessages = aErrorMessages.join("\n");
		return sErrorMessages;
	};

	return SpecDataError;
});
