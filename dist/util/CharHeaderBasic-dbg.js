/*
 * Generic handler for string-like characteristic
 */

sap.ui.define([
	"sap/m/Input",
	"gramont/VCDSM/specedit/util/CharHeaderBase",
	"gramont/VCDSM/specedit/util/CharHeaderException"
], function(Input, CharHeaderBase, CharHeaderException) {
	"use strict";

	var CharHeaderBasic = function (oComponent, oODataHeader) {
		CharHeaderBase.call(this, oComponent, oODataHeader);
		this._odataheader = oODataHeader;
	};

	CharHeaderBasic.prototype = Object.create(CharHeaderBase.prototype);
	CharHeaderBasic.prototype.constructor = CharHeaderBasic;

	CharHeaderBasic.prototype._parseCharValue = function(sRawValue) {
		if (sRawValue == "")
			throw new CharHeaderException("CharHeaderBasic.error.emptyChar", [this._sFieldName]);

		return sRawValue;
	};

	CharHeaderBasic.prototype._convertCharValue = function(vCharValue) {
		return vCharValue;
	};

	CharHeaderBasic.prototype._emptyCharValue = function() {
		return "";
	};

	CharHeaderBasic.prototype._isEmptyCharValue = function(vCharValue) {
		var bEmpty = (vCharValue == "");
		return bEmpty;
	};

	CharHeaderBasic.prototype._isCharValueEqual = function(vCharValue1, vCharValue2) {
		var bEqual = (vCharValue1 == vCharValue2);
		return bEqual;
	};

	CharHeaderBasic.prototype._getCharValueInputImpl = function(sEditableBindingPath, sCharValueBindingPath) {
		
		if(this._isCheckBox == false)
		{
		var oControl = new Input({
			value: {
				path: sCharValueBindingPath
			},
			width: this._calculateCharValueInputWidth(),
			enabled: this._calculateEnabledBinding(sEditableBindingPath)
		});	
		}else
		{
			var oControl = new sap.m.Switch({
			state: { path: sCharValueBindingPath},
			// state: true,
			// width: this._calculateCharValueInputWidth(),
			enabled: this._calculateEnabledBinding(sEditableBindingPath)
		});
		}
		

		return oControl;
	};

	CharHeaderBasic.prototype._formatterForCharValue = function(bInstanceTable, vCharValue) {
		// if(this._isCheckBox == false)
		// {
		// 	return vCharValue;
		// }
		// else
		// {
		// 	if (vCharValue)
		// 	{
		// 		return true;
		// 	}
		// 	else{
		// 		return false;
		// 	}
		// }
		return vCharValue;
	};

	CharHeaderBasic.prototype._parseCharValueOfCharEntry = function(sRawValue, sDescription) {
		// Allow empty values for currency type in value helper. It is the reason why
		// we don't call _parseCharValue here (like in case of other
		// characteristic).

		return sRawValue;
	};

	CharHeaderBasic.prototype._createCharEntryFromCharValue = function(vCharValue) {
		var oCharEntry = this._makeCharEntryFromCharValue(vCharValue, "");
		return oCharEntry;
	};

	CharHeaderBasic.prototype._getCharEntryFilterPath = function() {
		return "";
	};

	CharHeaderBasic.prototype._createCharValueFromValueHelperValue = function(vValueHelperValue, oValueHelperHeader) {
		var vCharValue = null;

		if (oValueHelperHeader.DATATYPE == "CHAR") // FIXME
			vCharValue = vValueHelperValue;

		return vCharValue;
	};

	return CharHeaderBasic;
});