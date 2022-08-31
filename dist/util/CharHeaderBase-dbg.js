/*
 * CharHeader sits between OData and UI:
 * - To unify handling of different characteristic.
 * - OData and UI doesn't have to care about the details of different
 *   characteristic types.
 * - CharHeader stores only the details of characteristic header, and not the
 *   data itself. The data usually goes to a JSONModel.
 * - Try to keep CharHeader independent from TableManager as much as
 *   possible.
 */

sap.ui.define([
	"sap/base/assert",
	"sap/m/Button",
	"sap/m/Text",
	"gramont/VCDSM/specedit/control/CharValueControl",
	"gramont/VCDSM/specedit/control/ExpandVerticalLayout",
	"gramont/VCDSM/specedit/control/Field",
	"gramont/VCDSM/specedit/util/CharEditCommon",
	"gramont/VCDSM/specedit/util/CharHeaderBaseConst",
	"gramont/VCDSM/specedit/util/TableManagerConst"
], function (assert, Button, Text, CharValueControl, ExpandVerticalLayout, Field, CharEditCommon, CharHeaderBaseConst, TableManagerConst) {
	"use strict";

	var EDITABLE = "_editable";

	// Base class for characteristic header

	var CharHeaderBase = function (oComponent, oODataHeader) {
		// EXT_CLASS
		oComponent.initClassExtension(this, "gramont.VCDSM.specedit.util.CharHeaderBase", arguments);

		this._oComponent = oComponent;

		this._sFieldName = oODataHeader.ATNAM;
		this._sLabel = oODataHeader.ATBEZ;
		this._bIsNewEditable = oODataHeader.IS_NEW_EDITABLE;
		this._bIsMultiValue = oODataHeader.FLG_IS_NO_SINGLE_VALUE;
		this._bHaveValueHelper = !oODataHeader.FLG_TEMP_CHARAC;
		this._bHaveAdditionalValues = oODataHeader.IS_ADDVAL;
		this._sHelp = oODataHeader.HELP;
		this._isCheckBox = oODataHeader.IS_CHECK_BOX;
		this._valuehelppresent = oODataHeader.FLG_VALHELP_EXISTS;
		this._coledit = oODataHeader.COL_EDITABLE;
		this._datatype = oODataHeader.ATFOR;
		this._datalength = oODataHeader.ANZST;
		this._Linked_prop = oODataHeader.LINKED_PROP;
	};

	// Getters

	CharHeaderBase.prototype.getFieldName = function () {
		return this._sFieldName;
	};

	CharHeaderBase.prototype.getLabel = function () {
		return this._sLabel;
	};

	CharHeaderBase.prototype.getMultiValue = function () {
		return this._bIsMultiValue;
	};

	CharHeaderBase.prototype.getValueHelper = function () {
		return this._bHaveValueHelper;
	};

	CharHeaderBase.prototype.getAdditionalValues = function () {
		return this._bHaveAdditionalValues;
	};

	CharHeaderBase.prototype.getHelp = function () {
		return this._sHelp;
	};

	// Handling of CharValues

	CharHeaderBase.prototype.parseCharValues = function (oODataFieldEntry, oInstance) {
		// Parse oODataFieldEntry from OData to internal data type. Called from PLMODataManager during instance fetch.

		assert(oODataFieldEntry.FIELDNAME == this._sFieldName, "Fieldname mismatch");

		var sODataFieldEntryValue = oODataFieldEntry.FIELDVALUE;
		var aCharValues = [];

		if (sODataFieldEntryValue != "") {
			var aRawValues = this._bIsMultiValue ? sODataFieldEntryValue.split(CharHeaderBaseConst.FieldValueSep) : [sODataFieldEntryValue];

			for (var i = 0; i < aRawValues.length; i++) {
				var sRawValue = aRawValues[i];
				var vCharValue = this._parseCharValue(sRawValue);
				aCharValues.push(vCharValue);
			}
		}

		// Regardless of multivalue flag, the parsed data always kept in
		// array. (In case of non-multivalue, one element is always present at index 0.)

		if (!this._bIsMultiValue && aCharValues.length == 0) {
			if (this._isCheckBox)
				var vCharValue = false;
			else
				var vCharValue = this._emptyCharValue();
			aCharValues.push(vCharValue);
		}

		// Store value into oInstance.

		oInstance[this._sFieldName] = aCharValues;

		// Store editable flag.

		this._storeEditable(oInstance, oODataFieldEntry.IS_EDITABLE);
	};

	CharHeaderBase.prototype.convertCharValues = function (oInstance) {
		// Convert internal data type to oODataFieldEntry. Called from PLMODataManager during save.

		var aCharValues = oInstance[this._sFieldName];
		var aRawValues = [];

		for (var i = 0; i < aCharValues.length; i++) {
			var vCharValue = aCharValues[i];

			if (!this._isEmptyCharValue(vCharValue)) {
				var sRawValue = this._convertCharValue(vCharValue);
				aRawValues.push(sRawValue);
			}
		}

		// Store.

		var sODataFieldEntryValue;

		if (!this._bIsMultiValue) {
			if (this._isCheckBox == true) {
				if (vCharValue.value == true)
					sODataFieldEntryValue = "X";
				else
					sODataFieldEntryValue = "";
			} else {
				sODataFieldEntryValue = (aRawValues.length == 1) ? aRawValues[0] : "";
			}
		} else {
			if (this._isCheckBox == true) {
				if (vCharValue.value == true)
					sODataFieldEntryValue = "X";
				else
					sODataFieldEntryValue = "";
			} else {
				sODataFieldEntryValue = aRawValues.join(CharHeaderBaseConst.FieldValueSep);
			}
		}

		var oODataFieldEntry = {
			FIELDNAME: this._sFieldName,
			FIELDVALUE: sODataFieldEntryValue
		};

		return oODataFieldEntry;
	};

	CharHeaderBase.prototype.createEmptyCharValues = function (oInstance) {
		// Create empty characteristic value. Called from PLMModelManager during instance create.

		var aCharValues = [];

		if (!this._bIsMultiValue) {
			var vCharValue = this._emptyCharValue();
			aCharValues.push(vCharValue);
		}

		// Store value into oInstance.

		oInstance[this._sFieldName] = aCharValues;

		// Store editable flag.

		this._storeEditable(oInstance, this._bIsNewEditable);
	};

	CharHeaderBase.prototype.getEditable = function (oInstance) {
		// Determine characteristic editable flag. Called from PLMODataManager during save.

		var bEditable = oInstance[EDITABLE][this._sFieldName];
		assert(bEditable != null, "bEditable should be set");

		return bEditable;
	};

	CharHeaderBase.prototype.getControl = function (iCollapseLimit, fOnEdit) {
		// Return with a UI control, bound to the corresponding field of oInstance. Used in
		// creating the template item for table bindings. Called from PropControl.

		var sEditableBindingPath = EDITABLE + "/" + this._sFieldName;

		// Create inner control.

		var oInnerControl = null;
		var bHaveEditControl = false;

		if (!this._bIsMultiValue) {
			// Single value case: directly editable using edit control.

			var oDisplayControl = this._createDisplayValueControlSingleTemplate();
			var oEditControl = this._getCharValueInput(sEditableBindingPath, this._sFieldName + "/0");
			var vEditMode = false;

			if (oEditControl) {
				// If edit control is present, then bind editMode. Otherwise, display
				// control will be displayed even in edit mode.

				vEditMode = {
					path: "appModel>/editMode"
				};

				// Set correct fieldname for tablemanager, since the bindingpath contains
				// "/0" suffix.

				oEditControl.data(TableManagerConst.FieldName, this._sFieldName);

				bHaveEditControl = true;
			}

			oInnerControl = new Field({
				editMode: vEditMode,
				display: oDisplayControl,
				edit: oEditControl
			});
		} else {
			// Multi value case: display values, editable only via edit dialog.

			oInnerControl = this._createDisplayValueControlMulti(iCollapseLimit);
		}

		assert(oInnerControl, "oInnerControl should be set");

		// Create edit button.

		var that = this;
		var _fOnEdit = function (oEvent) {
			if (fOnEdit)
				fOnEdit(that, oEvent);
		};

		if (this._isCheckBox != true && this._valuehelppresent == "X") {
			var oEditButton = new Button({
				icon: "sap-icon://value-help",
				enabled: {
					path: "appModel>/editMode",
					formatter: jQuery.proxy(this._editButtonEnabledFormatter, this, this._isEditButtonAlwaysEnabled())
				},
				visible: {
					path: "appModel>/editMode",
					formatter: jQuery.proxy(this._editButtonEnabledFormatter, this, this._isEditButtonAlwaysEnabled())
				},
				press: _fOnEdit
			});

			// Setup CharValueControl.

			var oControl = new CharValueControl({
				innerControl: oInnerControl,
				editButton: oEditButton
			});

		} else {
			var oControl = new CharValueControl({
				innerControl: oInnerControl
			});
		}

		if (!this._bIsMultiValue) {
			// Single value case: edit button is visible if characteristic is editable and
			// has value helper.

			// oEditButton.bindProperty("visible", {
			// 	path: sEditableBindingPath,
			// 	formatter: jQuery.proxy(this._editButtonVisibleFormatter, this)
			// });

			// Depending on editMode, show separator and value:
			// - display: if value is not empty,
			// - edit: if value is not empty, or have edit control. If the value is empty and we don't
			//   have edit control, then the value can be modified only in edit dialog.
			// TODO: can we use the same binding object here, or UI5 requires separate ones?

			oControl.bindProperty("showSeparator", {
				parts: [{
					path: "appModel>/editMode"
				}, {
					path: this._sFieldName
				}, ],
				formatter: jQuery.proxy(this._charValueControlSingleVisibleFormatter, this, bHaveEditControl)
			});

			oInnerControl.bindProperty("visible", {
				parts: [{
					path: "appModel>/editMode"
				}, {
					path: this._sFieldName
				}, ],
				formatter: jQuery.proxy(this._charValueControlSingleVisibleFormatter, this, bHaveEditControl)
			});

		} else {
			// Multi value case: edit button is visible if characteristic is editable.

			// oEditButton.bindProperty("visible",{ 
			// 	path: sEditableBindingPath
			// }
			// );

			// Show separator and values only, if we have at least one value in
			// a multi-value characteristic.
			// TODO: can we use the same binding object here, or UI5 requires separate ones?

			oControl.bindProperty("showSeparator", {
				path: this._sFieldName,
				formatter: jQuery.proxy(this._charValueControlMultiVisibleFormatter, this)
			});

			oInnerControl.bindProperty("visible", {
				path: this._sFieldName,
				formatter: jQuery.proxy(this._charValueControlMultiVisibleFormatter, this)
			});

			// Errors will be reported using tooltips on edit button.
			if (this._isCheckBox != true && this._valuehelppresent == "X") {
				oEditButton.data(TableManagerConst.FieldName, this._sFieldName);
			}
		}

		return oControl;
	};

	// Handling of CharEntry

	CharHeaderBase.prototype.parseCharEntry = function (oODataEntry) {
		// Parse oODataEntry (value helper) to internal format.

		var sODataEntryValue = oODataEntry.VALUE;
		var sODataEntryDescription = oODataEntry.DESCR;

		var vCharValue = this._parseCharValueOfCharEntry(sODataEntryValue, sODataEntryDescription);
		var oCharEntry = this._makeCharEntryFromCharValue(vCharValue, sODataEntryDescription);

		// EXT_HOOK: _extHookParseCharEntry
		// Parse entry.

		if (this._extHookParseCharEntry)
			this._extHookParseCharEntry(oODataEntry, oCharEntry);

		return oCharEntry;
	};

	CharHeaderBase.prototype.createCharEntryFromCharValue = function (vCharValue) {
		// Create CharEntry from CharValue, used in user-defined values.

		var oCharEntry = this._createCharEntryFromCharValue(vCharValue);
		return oCharEntry;
	};

	CharHeaderBase.prototype.createEmptyCharEntry = function (sDescription) {
		// Create empty CharEntry.

		var vCharValue = this._emptyCharValue();
		var oCharEntry = this._makeCharEntryFromCharValue(vCharValue, (sDescription != null) ? sDescription : "");

		return oCharEntry;
	};

	CharHeaderBase.prototype.createCharValuesFromCharEntries = function (aCharEntries) {
		// Convert CharEntries to CharValues.

		var aCharValues = [];

		for (var i = 0; i < aCharEntries.length; i++) {
			var oCharEntry = aCharEntries[i];
			var vCharValue = oCharEntry.charValue;

			if (!this._isEmptyCharValue(vCharValue))
				aCharValues.push(vCharValue);
		}

		if (!this._bIsMultiValue && aCharValues.length == 0) {
			var vCharValue = this._emptyCharValue();
			aCharValues.push(vCharValue);
		}

		return aCharValues;
	};

	CharHeaderBase.prototype.getCharEntryInput = function () {
		// Return with a control, suitable for editing single characteristic data (used in edit dialog).

		var oControl = this._getCharValueInput(null, "charValue");
		return oControl;
	};

	CharHeaderBase.prototype.getCharEntryLabel = function () {
		// Return with a control, suitable for displaying single characteristic data (used in edit dialog).

		var oControl = new Text({
			wrapping: false,
			text: {
				path: "charValue",
				formatter: jQuery.proxy(this._formatterForCharValue, this, false)
			}
		});
		return oControl;
	};

	CharHeaderBase.prototype.getCharEntryFilterPath = function () {
		// Return with filter path, suitable for filtering of CharValue (used in edit dialog).
		// Return with null if filtering for CharValue is not possible.

		var sPath = this._getCharEntryFilterPath();

		if (sPath != null)
			sPath = "charValue" + ((sPath != "") ? ("/" + sPath) : "");

		return sPath;
	};

	CharHeaderBase.prototype.openEdit = function (oInstance, fOnStore) {
		// Bring up characteristic edit dialog.

		if (!this._oEditDialog)
			this._oEditDialog = this._createEditDialog();

		this._oEditDialog.open(this, oInstance, fOnStore);
	};

	// Handling of CharValue

	CharHeaderBase.prototype.isEmptyCharValue = function (vCharValue) {
		// Return true if single characteristic data is empty, false otherwise.

		var bEmpty = this._isEmptyCharValue(vCharValue);
		return bEmpty;
	};

	CharHeaderBase.prototype.isCharValueEqual = function (vCharValue1, vCharValue2) {
		// Return true if the two single characteristic values are equal, false otherwise.

		var bEqual = this._isCharValueEqual(vCharValue1, vCharValue2);
		return bEqual;
	};

	// Handling of ValueHelperValue

	CharHeaderBase.prototype.createCharValuesFromValueHelperValues = function (aValueHelperValues, oValueHelperHeader) {
		// Convert ValueHelperValues to CharValues.

		var aCharValues = [];

		for (var i = 0; i < aValueHelperValues.length; i++) {
			var vValueHelperValue = aValueHelperValues[i];
			var vCharValue = this._createCharValueFromValueHelperValue(vValueHelperValue, oValueHelperHeader);

			if (vCharValue != null && !this._isEmptyCharValue(vCharValue))
				aCharValues.push(vCharValue);
		}

		if (!this._bIsMultiValue && aCharValues.length == 0) {
			var vCharValue = this._emptyCharValue();
			aCharValues.push(vCharValue);
		}

		return aCharValues;
	};

	CharHeaderBase.prototype.fetchValueHelperFirst = function () {
		// Return value for edit behaviour:
		// - true: check value helper first, and if we don't have any, then go to characteristic edit dialog.
		// - false: go directly to characteristic edit dialog.

		return true;
	};

	// Private methods

	CharHeaderBase.prototype._createDisplayValueControlMulti = function (iCollapseLimit) {
		var oTemplate = this._createDisplayValueControlMultiTemplate();

		// Create vertical layout for displaying characteristic values.

		var oControl = new ExpandVerticalLayout({
			collapseLimit: iCollapseLimit,
			content: {
				path: this._sFieldName,
				template: oTemplate,
				templateShareable: false
			}
		});

		return oControl;
	};

	CharHeaderBase.prototype._createDisplayValueControlSingleTemplate = function () {
		var sCharValueBindingPath = this._sFieldName + "/0";
		var oTemplate = this._createDisplayValueControlSingleTemplateImpl(sCharValueBindingPath);

		// EXT_HOOK: _extHookCreateDisplayValueControlSingleTemplate
		// Customize template creation.

		if (this._extHookCreateDisplayValueControlSingleTemplate)
			oTemplate = this._extHookCreateDisplayValueControlSingleTemplate(sCharValueBindingPath, oTemplate);

		return oTemplate;
	};

	CharHeaderBase.prototype._createDisplayValueControlMultiTemplate = function () {
		var oTemplate = this._createDisplayValueControlMultiTemplateImpl();

		// EXT_HOOK: _extHookCreateDisplayValueControlMultiTemplate
		// Customize template creation.

		if (this._extHookCreateDisplayValueControlMultiTemplate)
			oTemplate = this._extHookCreateDisplayValueControlMultiTemplate(oTemplate);

		return oTemplate;
	};

	CharHeaderBase.prototype._charValueControlSingleVisibleFormatter = function (bHaveEditControl, bEditMode, aCharValues) {
		assert(aCharValues.length == 1, "Should be a single-value characteristic");

		var vCharValue = aCharValues[0];
		var bVisible = (!this._isEmptyCharValue(vCharValue) || (bEditMode && bHaveEditControl));
		return bVisible;
	};

	CharHeaderBase.prototype._charValueControlMultiVisibleFormatter = function (aCharValues) {
		var bVisible = aCharValues.length > 0;
		return bVisible;
	};

	CharHeaderBase.prototype._editButtonEnabledFormatter = function (bEditButtonAlwaysEnabled, bEditMode) {
		var bEnabled = bEditMode || bEditButtonAlwaysEnabled;
		return bEnabled;
	};

	CharHeaderBase.prototype._editButtonVisibleFormatter = function (bEditable) {
		var bVisible = bEditable && this._bHaveValueHelper;
		return bVisible;
	};

	CharHeaderBase.prototype._calculateCharValueInputWidth = function () {
		// FIXME: what should be the logic for width calculation?
		var iWidth = 10;

		if (this._sFieldName.indexOf("__STDVAI_") == 0) // startsWith
			iWidth = 5;

		var sWidth = iWidth.toString() + "rem";

		// EXT_HOOK: _extHookCalculateCharValueInputWidth
		// Customize width calculation.

		if (this._extHookCalculateCharValueInputWidth)
			sWidth = this._extHookCalculateCharValueInputWidth(sWidth);

		return sWidth;
	};

	CharHeaderBase.prototype._makeCharEntryFromCharValue = function (vCharValue, sDescription) {
		var oCharEntry = {
			charValue: vCharValue,
			description: sDescription
		};

		return oCharEntry;
	};

	CharHeaderBase.prototype._storeEditable = function (oInstance, bEditable) {
		if (!oInstance[EDITABLE])
			oInstance[EDITABLE] = {};

		oInstance[EDITABLE][this._sFieldName] = bEditable;
	};

	CharHeaderBase.prototype._calculateEnabledBinding = function (sEditableBindingPath) {
		var vEnabledBinding = (sEditableBindingPath != null) ? {
			path: sEditableBindingPath
		} : true;
		return vEnabledBinding;
	};

	CharHeaderBase.prototype._getCharValueInput = function (sEditableBindingPath, sCharValueBindingPath) {
		var oControl = this._getCharValueInputImpl(sEditableBindingPath, sCharValueBindingPath);

		// EXT_HOOK: _extHookGetCharValueInput
		// Customize control creation.

		if (this._extHookGetCharValueInput)
			oControl = this._extHookGetCharValueInput(sEditableBindingPath, sCharValueBindingPath, oControl);

		if (sEditableBindingPath == null)
			assert(oControl, "oControl should be set");

		return oControl;
	};

	// Characteristic-type specific methods, should be overridden in derived class

	CharHeaderBase.prototype._parseCharValue = function (sRawValue) {
		// Parse single characteristic data from OData to internal format.

		assert(false, "_parseCharValue should be overridden in derived class");
	};

	CharHeaderBase.prototype._convertCharValue = function (vCharValue) {
		// Convert single characteristic data from internal to OData format.

		assert(false, "_convertCharValue should be overridden in derived class");
	};

	CharHeaderBase.prototype._emptyCharValue = function () {
		// Return with a single, empty characteristic data.

		assert(false, "_emptyCharValue should be overridden in derived class");
	};

	CharHeaderBase.prototype._isEmptyCharValue = function (vCharValue) {
		// Return true if single characteristic data is empty, false otherwise.

		assert(false, "_isEmptyCharValue should be overridden in derived class");
	};

	CharHeaderBase.prototype._isCharValueEqual = function (vCharValue1, vCharValue2) {
		// Return true if the two single characteristic values are equal, false otherwise.

		assert(false, "_isCharValueEqual should be overridden in derived class");
	};

	CharHeaderBase.prototype._getCharValueInputImpl = function (sEditableBindingPath, sCharValueBindingPath) {
		// Return with a control, suitable for editing single characteristic data.
		// sEditableBindingPath != null if we are displaying data for instance table, == null for edit dialog.
		// In case of instance table, if the returned control is null, then it will be rendered as read-only,
		// and modification is possible only in the edit dialog.

		assert(false, "_getCharValueInputImpl should be overridden in derived class");
	};

	CharHeaderBase.prototype._createDisplayValueControlSingleTemplateImpl = function (sCharValueBindingPath) {
		// Can be overriden in derived class to provide custom template for displaying single
		// valued characteristic data.

		if (this._isCheckBox == false) {
			var oTemplate = new Text({
				wrapping: false
			});

			// UI5: Specifying path: "" in constructor will result in
			// incorrect binding setup. That is the reason of bindProperty usage.

			oTemplate.bindProperty("text", {
				path: sCharValueBindingPath,
				formatter: jQuery.proxy(this._formatterForCharValue, this, true)
			});
		} else {
			var oTemplate = new sap.m.Switch({
				customTextOn: "Yes",
				customTextOff: "No",
				state: {
					path: sCharValueBindingPath + "/value"
				},
				enabled: false
			});

			// // UI5: Specifying path: "" in constructor will result in
			// // incorrect binding setup. That is the reason of bindProperty usage.
		}

		// var oTemplate = new Text({
		// 	wrapping: false
		// });

		// UI5: Specifying path: "" in constructor will result in
		// incorrect binding setup. That is the reason of bindProperty usage.

		// oTemplate.bindProperty("text", {
		// 	path: sCharValueBindingPath,
		// 	formatter: jQuery.proxy(this._formatterForCharValue, this, true)
		// });
		return oTemplate;
	};

	CharHeaderBase.prototype._createDisplayValueControlMultiTemplateImpl = function () {
		// Can be overriden in derived class to provide custom template for displaying multi
		// valued characteristic data.

		var oTemplate = new Text({
			wrapping: false
		});

		// UI5: Specifying path: "" in constructor will result in
		// incorrect binding setup. That is the reason of bindProperty usage.

		oTemplate.bindProperty("text", {
			path: "",
			formatter: jQuery.proxy(this._formatterForCharValue, this, true)
		});

		return oTemplate;
	};

	CharHeaderBase.prototype._formatterForCharValue = function (bInstanceTable, vCharValue) {
		// Return with a string, suitable for displaying single characteristic data.
		// bInstanceTable is true if we are displaying data for instance table, false for edit dialog.

		assert(false, "_formatterForCharValue should be overridden in derived class");
	};

	CharHeaderBase.prototype._parseCharValueOfCharEntry = function (sRawValue, sDescription) {
		// Parse single characteristic value help data from OData to internal format.

		assert(false, "_parseCharValueOfCharEntry should be overridden in derived class");
	};

	CharHeaderBase.prototype._createCharEntryFromCharValue = function (vCharValue) {
		// Create CharEntry from CharValue, used in user-defined values.

		assert(false, "_createCharEntryFromCharValue should be overridden in derived class");
	};

	CharHeaderBase.prototype._getCharEntryFilterPath = function () {
		// Return with filter path, suitable for filtering of CharValue (used in edit dialog).
		// Return with null if filtering for CharValue is not possible.

		assert(false, "_getCharEntryFilterPath should be overridden in derived class");
	};

	CharHeaderBase.prototype._createCharValueFromValueHelperValue = function (vValueHelperValue, oValueHelperHeader) {
		// Create CharValue from ValueHelperValue, based on type information from
		// ValueHelperHeader. Return with null if conversion is not possible.

		assert(false, "_createCharValueFromValueHelperValue should be overridden in derived class");
	};

	CharHeaderBase.prototype._isEditButtonAlwaysEnabled = function () {
		// By default, edit button is enabled only in edit mode. Can be overridden in derived
		// to enable edit button even in display mode (in the dialog, data modification is not
		// possible, only viewing).

		return false;
	};

	CharHeaderBase.prototype._createEditDialog = function () {
		// Can be overriden in derived class to provide custom dialog.
		// FIXME: create base class for CharEdit?

		var oEditDialog = new CharEditCommon(this._oComponent);
		return oEditDialog;
	};

	return CharHeaderBase;
});