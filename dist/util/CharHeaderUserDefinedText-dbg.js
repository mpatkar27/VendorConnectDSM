/*
 * User defined text handling
 * FIXME: put asserts into not used methods
 */

sap.ui.define([
	"gramont/VCDSM/specedit/util/CharEditUserDefinedText",	
	"gramont/VCDSM/specedit/util/CharHeaderBasic",
	"gramont/VCDSM/specedit/util/CharHeaderException"
], function(CharEditUserDefinedText, CharHeaderBasic, CharHeaderException) {
	"use strict";

	var FTEXT = "__FTEXT_";

	var CharHeaderUserDefinedText = function(oComponent, oODataHeader) {
		CharHeaderBasic.call(this, oComponent, oODataHeader);

		// EXT_CLASS
		oComponent.initClassExtension(this, "gramont.VCDSM.specedit.util.CharHeaderUserDefinedText", arguments);

		this._bIsMultiValue = true; // Force multivalue -> editable only via edit dialog.

		if (this._sFieldName.indexOf(FTEXT) != 0) // startsWith
			throw new CharHeaderException("CharHeaderUserDefinedText.error.invalidFieldName", [this._sFieldName]);

		this._sTextType = this._sFieldName.substr(FTEXT.length);
	};

	CharHeaderUserDefinedText.prototype = Object.create(CharHeaderBasic.prototype);
	CharHeaderUserDefinedText.prototype.constructor = CharHeaderUserDefinedText;

	CharHeaderUserDefinedText.prototype.convertCharValues = function(oInstance) {
		return null;
	};
	
	CharHeaderUserDefinedText.prototype.fetchValueHelperFirst = function() {
		return false;	
	};
	
	CharHeaderUserDefinedText.prototype.getTextType = function() {
		return this._sTextType;
	};
	
	CharHeaderUserDefinedText.prototype.buildCharValues = function(aStrings) {
		var aCharValues = aStrings; // FIXME: type check?, length check?
		return aCharValues;
	};

	CharHeaderUserDefinedText.prototype._isEditButtonAlwaysEnabled = function() {
		return true;
	};
	
	CharHeaderUserDefinedText.prototype._createEditDialog = function() {
		var oEditDialog = new CharEditUserDefinedText(this._oComponent);
		return oEditDialog;
	};

	return CharHeaderUserDefinedText;
});
