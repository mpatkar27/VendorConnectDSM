 /*
  * CHAR characteristic with allowed values/phrases handling
  */

 sap.ui.define([
 	"sap/base/assert",
 	"sap/m/Input",
 	"gramont/VCDSM/specedit/util/CharHeaderBase",
 	"gramont/VCDSM/specedit/util/CharHeaderBaseConst",
 	"gramont/VCDSM/specedit/util/CharHeaderException",
	"gramont/VCDSM/specedit/util/ModelManagerAdmin",
	"gramont/VCDSM/specedit/util/ModelManagerAutoGrowOp",
	"gramont/VCDSM/specedit/util/ModelManagerIntStatus"
 ], function (assert, Input, CharHeaderBase, CharHeaderBaseConst, CharHeaderException, ModelManagerAdmin, ModelManagerAutoGrowOp,
	ModelManagerIntStatus) {
 	"use strict";

 	var CharHeaderCharPhrase = function (oComponent, oODataHeader) {
 		CharHeaderBase.call(this, oComponent, oODataHeader);

 		// EXT_CLASS
 		oComponent.initClassExtension(this, "gramont.VCDSM.specedit.util.CharHeaderCharPhrase", arguments);

 		this._bIsRealPhrase = oODataHeader.IS_REAL_PHRASE;
 		this._FLG_IS_PHR = oODataHeader.FLG_IS_PHR;
		this._datatype = oODataHeader.ATFOR;
		this._datalength = oODataHeader.ANZST;
 	};

 	CharHeaderCharPhrase.prototype = Object.create(CharHeaderBase.prototype);
 	CharHeaderCharPhrase.prototype.constructor = CharHeaderCharPhrase;

 	CharHeaderCharPhrase.prototype.parseCharValues = function (oODataFieldEntry, oInstance) {
 		// This method needs to be overridden, since the special nature of phrases (phrase, description pair).

 		assert(oODataFieldEntry.FIELDNAME == this._sFieldName, "Fieldname mismatch");

 		var sODataFieldEntryValue = oODataFieldEntry.FIELDVALUE;
 		var sODataFieldEntryPhrase = oODataFieldEntry.FIELDPHRASE;
 		var aCharValues = [];

 		// In case of CHAR_PHRASE, we check FIELDPHRASE just to make sure it is
 		// not empty.

 		if (sODataFieldEntryPhrase != "") {
 			var aRawValues = this._bIsMultiValue ? sODataFieldEntryValue.split(CharHeaderBaseConst.FieldValueSep) : [sODataFieldEntryValue];
 			var aRawPhrases = this._bIsMultiValue ? sODataFieldEntryPhrase.split(CharHeaderBaseConst.FieldValueSep) : [sODataFieldEntryPhrase];

 			if (aRawValues.length != aRawPhrases.length)
 				throw new CharHeaderException("CharHeaderCharPhrase.error.countMismatch", [this._sFieldName]);

 			for (var i = 0; i < aRawValues.length; i++) {

 				if (oODataFieldEntry.IS_CHECK_BOX == "X") {
 					if (aRawValues[i] == "X") {
 						var sRawValue = true;
 						var sRawPhrase = aRawPhrases[i];
 					} else {
 						var sRawValue = false;
 						var sRawPhrase = aRawPhrases[i];
 					}
 				} else {
 					var sRawValue = aRawValues[i];
 					var sRawPhrase = aRawPhrases[i];
 				}

 				var vCharValue = this._parseCharValue(sRawValue, sRawPhrase);
 				aCharValues.push(vCharValue);
 			}
 		} else {
 			if (oODataFieldEntry.IS_CHECK_BOX == "X") {
 				this.chckbx = "X";
 				if (sODataFieldEntryValue == "X") {
 					var sRawValue = true;
 					var sRawPhrase = sODataFieldEntryPhrase;
 				} else {
 					var sRawValue = false;
 					var sRawPhrase = sODataFieldEntryPhrase;
 				}
 				var vCharValue = this._parseCharValue(sRawValue, sRawPhrase);
 				aCharValues.push(vCharValue);
 			}

 		}

 		// Regardless of multivalue flag, the parsed data always kept in
 		// array. (In case of non-multivalue, one element is always present at index 0.)

 		if (!this._bIsMultiValue && aCharValues.length == 0) {
 			var vCharValue = this._emptyCharValue();
 			aCharValues.push(vCharValue);
 		}

 		// Store value into oInstance.

 		oInstance[this._sFieldName] = aCharValues;

 		// Store editable flag.

 		this._storeEditable(oInstance, oODataFieldEntry.IS_EDITABLE);
 	};

 	CharHeaderCharPhrase.prototype.getIsRealPhrase = function () {
 		return this._bIsRealPhrase;
 	};

 	CharHeaderCharPhrase.prototype._parseCharValue = function (sRawValue, sRawPhrase) {
 		if (sRawPhrase == "" && this.chckbx != "X")
 			throw new CharHeaderException("CharHeaderCharPhrase.error.emptyPhrase", [this._sFieldName]);

 		var oCharPhrase = this._createCharPhrase(sRawValue, sRawPhrase);
 		return oCharPhrase;
 	};

 	CharHeaderCharPhrase.prototype._convertCharValue = function (vCharValue) {
 		return vCharValue.phrase;
 	};

 	CharHeaderCharPhrase.prototype._emptyCharValue = function () {
 		if(this._isCheckBox == true)
 		{
 			var oCharPhrase = this._createCharPhrase(false, "");
 		}
 		else
 		{
 			var oCharPhrase = this._createCharPhrase("", "");
 		}
 			
 		return oCharPhrase;
 	};

 	CharHeaderCharPhrase.prototype._isEmptyCharValue = function (vCharValue) {
 		var bEmpty = (vCharValue.phrase == "");
 		return bEmpty;
 	};

 	CharHeaderCharPhrase.prototype._isCharValueEqual = function (vCharValue1, vCharValue2) {
 		var bEqual = (vCharValue1.phrase == vCharValue2.phrase);
 		return bEqual;
 	};

 	CharHeaderCharPhrase.prototype._getCharValueInputImpl = function (sEditableBindingPath, sCharValueBindingPath) {
 		var bInstanceTable = (sEditableBindingPath != null);

 		// UI5: Don't use liveChange event here, since it would cause
 		// issue in _onChange (oModel.setProperty): users can't edit
 		// newly added values.
 		if (this._isCheckBox == false) {
 			var oControl = new Input({
 				value: {
 					path: sCharValueBindingPath + "/" + (bInstanceTable ? "value" : "phrase")
 				},
 				width: this._calculateCharValueInputWidth(),
 				change: jQuery.proxy(this._onChange, this, bInstanceTable),
 				enabled: this._calculateEnabledBinding(sEditableBindingPath)
 			});
 		} else {
 			var oControl = new sap.m.Switch({
 				// state: "{" + sCharValueBindingPath + "/value}",
 				state: {
 					path: sCharValueBindingPath + "/value"
 				},
 				customTextOn: "Yes",
 				customTextOff: "No",
 				change: jQuery.proxy(this._onChange, this, bInstanceTable),
 				// state: true,
 				// width: this._calculateCharValueInputWidth(),
 				enabled: this._calculateEnabledBinding(sEditableBindingPath)
 			});
 		}
 		return oControl;
 	};

 	CharHeaderCharPhrase.prototype._formatterForCharValue = function (bInstanceTable, vCharValue) {
 		return bInstanceTable ? vCharValue.value : vCharValue.phrase;
 	};

 	CharHeaderCharPhrase.prototype._parseCharValueOfCharEntry = function (sRawValue, sDescription) {
 		var vCharValue = this._parseCharValue(sDescription, sRawValue);
 		return vCharValue;
 	};

 	CharHeaderCharPhrase.prototype._createCharEntryFromCharValue = function (vCharValue) {
 		var oCharEntry = this._makeCharEntryFromCharValue(vCharValue, vCharValue.value);
 		return oCharEntry;
 	};

 	CharHeaderCharPhrase.prototype._getCharEntryFilterPath = function () {
 		return "phrase";
 	};

 	CharHeaderCharPhrase.prototype._createCharValueFromValueHelperValue = function (vValueHelperValue, oValueHelperHeader) {
 		return null;
 	};

 	CharHeaderCharPhrase.prototype._createCharPhrase = function (sValue, sPhrase) {
 	 		var oCharPhrase = {
 			value: sValue,
 			phrase: sPhrase
 		};

 		return oCharPhrase;
 	};

 	CharHeaderCharPhrase.prototype._onChange = function (bInstanceTable, oEvent) {
 		// In instance table: copy user entered value to phrase, since the control is bound to value.
 		// In edit dialog: copy user entered value to value, since the control is bound to phrase.

 		var oControl = oEvent.getSource();
		var oModel = oControl.getModel();
 		var aContextPathComps = oControl.getBindingContext().getPath().split("/");
 		if(oControl.getBindingPath("value") != null)
 		{
 		var aValuePathComps = oControl.getBindingPath("value").split("/");	
 		}
 		else
 		{
 			var aValuePathComps = oControl.getBindingPath("state").split("/");
 				// var aPathComps = oEvent.getSource().getBindingContext().getPath().split("/");
 			var iIndex = parseInt(aValuePathComps[1]);
 			var sBindingPath = "/" + iIndex + "/" + ModelManagerAdmin.FullPropName.IntStatus;
			var sIntStatus = oModel.getProperty(sBindingPath);
			
			var sNewIntStatus = null;

			switch (sIntStatus) {
			case ModelManagerIntStatus.Empty:
				sNewIntStatus = ModelManagerIntStatus.New;
				break;

			case ModelManagerIntStatus.Unchanged:
				sNewIntStatus = ModelManagerIntStatus.Modified;
				break;
			}

			if (sNewIntStatus != null)
				oModel.setProperty(sBindingPath, sNewIntStatus);
 		}
 		var aFullPathComps = [].concat(aContextPathComps, aValuePathComps);
 		aFullPathComps[aFullPathComps.length - 1] = bInstanceTable ? "phrase" : "value";
 		var sFullPathComps = aFullPathComps.join("/");

 		
 		if(oControl.getBindingPath("value") != null){
 			var sValue = oEvent.getParameter("value");
 		}
 		else
 		{
 	// 		var iIndex = this._oCollection.getEntryIndexOfControl(oControl);

		// // Update entry status.
		
		// this._oCollection.updateEntryStatus(iIndex);
 			var sValue = oEvent.getParameter("state");
 		}
 		
 		oModel.setProperty(sFullPathComps, sValue);
 	};

 	return CharHeaderCharPhrase;
 });