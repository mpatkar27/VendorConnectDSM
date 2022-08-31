sap.ui.define([
	"sap/base/assert",
	"sap/ui/model/json/JSONModel",
	"gramont/VCDSM/specedit/util/Util"
], function(assert, JSONModel, Util) {
	"use strict";

	var ValueHelperDialog = function(oComponent, oValueHelperKey, oInputParams, fOnConfirm) {
		this._oComponent = oComponent;
		this._oValueHelperKey = oValueHelperKey;
		this._oInputParams = oInputParams;
		this._fOnConfirm = fOnConfirm;

		// Construct dialog.

		this._oDialog = this._oComponent.getNavigator().createFragment("gramont.VCDSM.specedit.frag.ValueHelperDialog", this);

		this._oDialogModel = new JSONModel();
		this._oDialog.control.setModel(this._oDialogModel);
	};

	ValueHelperDialog.prototype.open = function() {
		assert(!this._bOpenInvoked, "bOpenInvoked shouldn't be set");
		this._bOpenInvoked = true;

		this._fetchValueHelper();
	};

	ValueHelperDialog.prototype._fetchValueHelper = function() {
		// Fetch value helper.

		var oRequest = this._oComponent.getODataManager().requestForFetchValueHelper(this._oValueHelperKey, null, this._oInputParams);
		this._oComponent.getODataManager().executeRequest(oRequest,
				jQuery.proxy(this._fetchValueHelperSuccess, this));
	};

	ValueHelperDialog.prototype._fetchValueHelperSuccess = function(oValueHelper) {
		// Setup table columns.

		var oBuildData = Util.buildValueHelperHeaderAndTemplate(oValueHelper);
		var aHeaderColumns = oBuildData.headerColumns;

		for (var i = 0; i < aHeaderColumns.length; i++) {
			var oHeaderColumn = aHeaderColumns[i];
			this._oDialog.control.addColumn(oHeaderColumn);
		}

		// Do item binding.

		this._oDialog.control.bindItems("/", oBuildData.template);

		// Set property names for searching.

		this._aHeaderPropNames = oBuildData.headerPropNames;

		// Set model.

		this._oDialogModel.setData(oValueHelper.entries);

		// Open dialog.

		this._oDialog.control.open();
	};

	ValueHelperDialog.prototype._destroyDialog = function() {
		this._oDialog.control.destroy();
	};

	ValueHelperDialog.prototype._onConfirm = function(oEvent) {
		this._destroyDialog();

		var oEntry = oEvent.getParameter("selectedItem").getBindingContext().getProperty();

		if (this._fOnConfirm)
			this._fOnConfirm(oEntry);
	};

	ValueHelperDialog.prototype._onCancel = function() {
		this._destroyDialog();
	};

	ValueHelperDialog.prototype._onLiveChange = function(oEvent) {
		var sSearchQuery = oEvent.getParameter("value");
		var oBinding = this._oDialog.control.getBinding("items");
		var oFilter = Util.createSearchFilter(sSearchQuery, this._aHeaderPropNames);

		oBinding.filter(oFilter ? [oFilter] : []);
	};

	ValueHelperDialog.openDialog = function(oComponent, sEntityName, oPropMaps, oParamMaps, oControl, oCollection, fOnSelect) {//FIXME:refactor
		if (!oPropMaps)
			oPropMaps = {};

		if (!oParamMaps)
			oParamMaps = {};

		assert(oControl.isA("sap.m.Input"), "oControl should be instance of sap.m.Input");

		var iIndex;
		var sFieldName;

		// FIXMEX: rework: record/prop query
		if (oCollection) {
			iIndex = oCollection.getEntryIndexOfControl(oControl);
			sFieldName = oControl.getBindingPath("value");
		} else {
			var aPathComps = oControl.getBindingPath("value").split("/");
			assert(aPathComps.length == 2 &&
				   aPathComps[0]     == "", "Control should have absolute binding context path");

			sFieldName = aPathComps[0];
		}

		var oValueHelperKey = {
				entityName: sEntityName,
				fieldName: sFieldName
		};

		var oInputParams = oParamMaps[sFieldName];

		var fOnConfirm = function(oEntry) {
			var vPropMap = oPropMaps[sFieldName];
			var aValues = [];

			// Map value helper fields into model properties.

			switch (jQuery.type(vPropMap)) {
			case "null":
			case "undefined":
				// Straight mapping to single model property.

				var oValue = {
					fieldName: sFieldName,
					value: oEntry[sFieldName]
				};
				aValues.push(oValue);
				break;

			case "array":
				// Straight mapping to array of model properties.

				for (var i = 0; i < vPropMap.length; i++) {
					var sPropMapFieldName = vPropMap[i];
					var oValue = {
							fieldName: sPropMapFieldName,
							value: oEntry[sPropMapFieldName]
					};
					aValues.push(oValue);
				}
				break;

			case "object":
				// Custom mapping of value helper fields to model properties.

				for (var sPropMapFieldName in vPropMap) {
					var oPropMapFieldValue = vPropMap[sPropMapFieldName];
					var vValue;

					if (oPropMapFieldValue.property != null)
						vValue = oEntry[oPropMapFieldValue.property];
					else if (oPropMapFieldValue.value != null)
						vValue = oPropMapFieldValue.value;
					else
						assert(false, "unknown mapping");

					var oValue = {
							fieldName: sPropMapFieldName,
							value: vValue
					};
					aValues.push(oValue);
				}
				break;

			default:
				assert(false, "Unknown vPropMap type");
			}

			// Update model.

			if (oCollection) {
				for (var i = 0; i < aValues.length; i++) {
					var oValue = aValues[i];
					oCollection.setFieldValue(iIndex, oValue.fieldName, oValue.value);
				}
			} else {
				var oModel = oControl.getModel();
				var aPathComps = oControl.getBindingContext().getPath().split("/");

				var idatindex = parseInt(aPathComps[1]);
				for (var i = 0; i < aValues.length; i++) {
					var oValue = aValues[i];
					oModel.setProperty("/"+idatindex +"/" + oValue.fieldName, oValue.value);
					oModel.setProperty("/"+idatindex +"/Change", true);
				}
			}
			
			if (fOnSelect)
				fOnSelect(oControl, sFieldName);
		};

		var oValueHelperDialog = new ValueHelperDialog(oComponent, oValueHelperKey, oInputParams, fOnConfirm);
		oValueHelperDialog.open();
	};

	return ValueHelperDialog;
});
