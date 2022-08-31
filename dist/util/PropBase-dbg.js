sap.ui.define([
	"sap/base/assert"
], function(assert) {
	"use strict";
	
	var PropBase = function(oComponent, sFragmentName) {
		this._oComponent = oComponent;

		this._oFragment = this._oComponent.getNavigator().createFragment(sFragmentName, this);
		assert(this._oFragment.control.isA("sap.uxap.ObjectPageSubSection"), "Top-level fragment control should be sap.uxap.ObjectPageSubSection");
	};

	PropBase.prototype.getControl = function() {
		// Called by SpecDataTabProp controller to get control.

		return this._oFragment.control;
	};
	
	PropBase.prototype.destroy = function() {
		this._oFragment.control.destroy();
	};
	
	// Utility methods:

	PropBase.prototype._getOwnerComponent = function() {
		return this._oComponent;
	};

	PropBase.prototype._byId = function(sId) {
		var oControl = this._oFragment.byId(sId);
		return oControl;
	};
	
	return PropBase;
});
