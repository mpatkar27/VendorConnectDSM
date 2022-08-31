/*
 * Time characteristic handling
 * TODO: handling of intervals.
 */

sap.ui.define([
	"sap/base/assert",
	"sap/m/TimePicker",
	"sap/ui/model/type/Time",
	"gramont/VCDSM/specedit/util/CharHeaderBase",
	"gramont/VCDSM/specedit/util/CharHeaderException",
	"gramont/VCDSM/specedit/util/Util"
], function(assert, TimePicker, Time, CharHeaderBase, CharHeaderException, Util) {
	"use strict";

	var CharHeaderTime = function(oComponent, oODataHeader) {
		CharHeaderBase.call(this, oComponent, oODataHeader);

		// EXT_CLASS
		oComponent.initClassExtension(this, "gramont.VCDSM.specedit.util.CharHeaderTime", arguments);
	};

	CharHeaderTime.prototype = Object.create(CharHeaderBase.prototype);
	CharHeaderTime.prototype.constructor = CharHeaderTime;

	CharHeaderTime.prototype._parseCharValue = function(sRawValue) {
		var oRegExp = /^(\d{2}):(\d{2}):(\d{2})$/;

		var aResult = oRegExp.exec(sRawValue);
		if (!aResult)
			throw new CharHeaderException("CharHeaderTime.error.time", [sRawValue, this._sFieldName]);

		var iHour   = parseInt(aResult[1]);
		var iMinute = parseInt(aResult[2]);
		var iSecond = parseInt(aResult[3]);

		var oTime = new Date(1970, 0, 1, iHour, iMinute, iSecond);
		return oTime;
	};

	CharHeaderTime.prototype._convertCharValue = function(vCharValue) {
		var sTime = Util.convertTimeToString(vCharValue);
		return sTime;
	};

	CharHeaderTime.prototype._emptyCharValue = function() {
		return null;
	};

	CharHeaderTime.prototype._isEmptyCharValue = function(vCharValue) {
		var bEmpty = (vCharValue == null);
		return bEmpty;
	};

	CharHeaderTime.prototype._isCharValueEqual = function(vCharValue1, vCharValue2) {
		var bEqual = (vCharValue1.getTime() == vCharValue2.getTime());
		return bEqual;
	};

	CharHeaderTime.prototype._getCharValueInputImpl = function(sEditableBindingPath, sCharValueBindingPath) {
		var oControl = new TimePicker({
			value: {
				path: sCharValueBindingPath,
				type: new Time({
					strictParsing: true
				})
			},
			width: "9rem",
			enabled: this._calculateEnabledBinding(sEditableBindingPath),
			parseError: jQuery.proxy(this._onParseError, this)
		});
		
		return oControl;
	};

	CharHeaderTime.prototype._formatterForCharValue = function(bInstanceTable, vCharValue) {
		var oType = new Time();
		var sValue = oType.formatValue(vCharValue, "string");
		return sValue;
	};

	CharHeaderTime.prototype._parseCharValueOfCharEntry = function(sRawValue, sDescription) {
		var vCharValue = this._parseCharValue(sRawValue);
		return vCharValue;
	};

	CharHeaderTime.prototype._createCharEntryFromCharValue = function(vCharValue) {
		var oCharEntry = this._makeCharEntryFromCharValue(vCharValue, "");
		return oCharEntry;
	};

	CharHeaderTime.prototype._getCharEntryFilterPath = function() {
		return null;
	};

	CharHeaderTime.prototype._createCharValueFromValueHelperValue = function(vValueHelperValue, oValueHelperHeader) {
		return null;
	};

	CharHeaderTime.prototype._onParseError = function(oEvent) {
		// On parse error, clear field.

		var oControl = oEvent.getSource();
		var oBinding = oControl.getBinding("value");

		oBinding.setValue(null);
		oBinding.refresh(true);
	};

	return CharHeaderTime;
});
