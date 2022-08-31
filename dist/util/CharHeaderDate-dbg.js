/*
 * Date characteristic handling
 * TODO: handling of intervals.
 */

sap.ui.define([
	"sap/m/DatePicker",
	"sap/ui/model/type/Date",
	"gramont/VCDSM/specedit/util/CharHeaderBase",
	"gramont/VCDSM/specedit/util/CharHeaderException",
	"gramont/VCDSM/specedit/util/Util"
], function(DatePicker, type_Date, CharHeaderBase, CharHeaderException, Util) {
	"use strict";

	var CharHeaderDate = function(oComponent, oODataHeader) {
		CharHeaderBase.call(this, oComponent, oODataHeader);

		// EXT_CLASS
		oComponent.initClassExtension(this, "gramont.VCDSM.specedit.util.CharHeaderDate", arguments);
	};

	CharHeaderDate.prototype = Object.create(CharHeaderBase.prototype);
	CharHeaderDate.prototype.constructor = CharHeaderDate;

	CharHeaderDate.prototype._parseCharValue = function(sRawValue) {
		var oDate = Util.parseDateFromString(sRawValue);

		if (!oDate)
			throw new CharHeaderException("CharHeaderDate.error.date", [sRawValue, this._sFieldName]);

		return oDate;
	};

	CharHeaderDate.prototype._convertCharValue = function(vCharValue) {
		var sDate = Util.convertDateToString(vCharValue);
		return sDate;
	};

	CharHeaderDate.prototype._emptyCharValue = function() {
		return null;
	};

	CharHeaderDate.prototype._isEmptyCharValue = function(vCharValue) {
		var bEmpty = (vCharValue == null);
		return bEmpty;
	};

	CharHeaderDate.prototype._isCharValueEqual = function(vCharValue1, vCharValue2) {
		var bEqual = (vCharValue1.getTime() == vCharValue2.getTime());
		return bEqual;
	};

	CharHeaderDate.prototype._getCharValueInputImpl = function(sEditableBindingPath, sCharValueBindingPath) {
		var oControl = new DatePicker({
			value: {
				path: sCharValueBindingPath,
				type: new type_Date({
					strictParsing: true
				})
			},
			width: "9rem",
			enabled: this._calculateEnabledBinding(sEditableBindingPath),
			parseError: jQuery.proxy(this._onParseError, this)
		});

		return oControl;
	};

	CharHeaderDate.prototype._formatterForCharValue = function(bInstanceTable, vCharValue) {
		var oType = new type_Date();
		var sValue = oType.formatValue(vCharValue, "string");
		return sValue;
	};

	CharHeaderDate.prototype._parseCharValueOfCharEntry = function(sRawValue, sDescription) {
		var vCharValue = this._parseCharValue(sRawValue);
		return vCharValue;
	};

	CharHeaderDate.prototype._createCharEntryFromCharValue = function(vCharValue) {
		var oCharEntry = this._makeCharEntryFromCharValue(vCharValue, "");
		return oCharEntry;
	};

	CharHeaderDate.prototype._getCharEntryFilterPath = function() {
		return null;
	};

	CharHeaderDate.prototype._createCharValueFromValueHelperValue = function(vValueHelperValue, oValueHelperHeader) {
		return null;
	};

	CharHeaderDate.prototype._onParseError = function(oEvent) {
		// On parse error, clear field.
		// UI5: If incorrect value entered, DatePicker keeps previous (correct) value
		// in model, however TimePicker (see CharHeaderTime) clears it (set it to null).
		// To have consistent behaviour, we also clear value for DatePicker.

		var oControl = oEvent.getSource();
		var oBinding = oControl.getBinding("value");

		oBinding.setValue(null);
		oBinding.refresh(true);
	};

	return CharHeaderDate;
});
