sap.ui.define([
	"sap/base/assert"
], function(assert) {
	"use strict";
	
	var SpecDataTabBase = function(oComponent, sFragmentName) {
		this._oComponent = oComponent;

		this._oFragment = this._oComponent.getNavigator().createFragment(sFragmentName, this);
		// assert(this._oFragment.control.isA("sap.uxap.ObjectPageSection"), "Top-level fragment control should be sap.uxap.ObjectPageSection");
	};

	SpecDataTabBase.prototype.getControl = function() {
		// Called by SpecData controller to get tab control.

		return this._oFragment.control;
	};
	
	// Override in derived class:

	SpecDataTabBase.prototype.onBeforeShow = function() {
	};
	
	// Utility methods:

	SpecDataTabBase.prototype._getOwnerComponent = function() {
		return this._oComponent;
	};

	SpecDataTabBase.prototype._byId = function(sId) {
		var oControl = this._oFragment.byId(sId);
		return oControl;
	};

	return SpecDataTabBase;
});
