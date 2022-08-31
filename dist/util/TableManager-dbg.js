/*
 * TableManager sits between UI and ModelManager:
 * - Updates entry status in case of edition.
 * - Creation and deletion of records are handled by ModelManager
 *   (since they may require additional administration tasks).
 */

sap.ui.define([
	"sap/base/assert",
	"sap/m/ButtonType",
	"sap/m/CheckBox",
	"sap/ui/core/Icon",
	"sap/ui/core/TextAlign",
	"sap/ui/core/ValueState",
	"sap/ui/model/BindingMode",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"gramont/VCDSM/specedit/control/AlwaysEnabled",
	"gramont/VCDSM/specedit/control/Column",
	"gramont/VCDSM/specedit/control/DestroyListener",
	"gramont/VCDSM/specedit/util/ModelManagerAdmin",
	"gramont/VCDSM/specedit/util/ModelManagerIntStatus",
	"gramont/VCDSM/specedit/util/TableManagerConst",
	"gramont/VCDSM/specedit/util/Util"
], function(assert, ButtonType, CheckBox, Icon, TextAlign, ValueState, BindingMode, Filter, FilterOperator, AlwaysEnabled, Column, DestroyListener, ModelManagerAdmin, ModelManagerIntStatus, TableManagerConst, Util) {
	"use strict";

	// FIXME: items="{/}"

	var TableManager = function(oComponent, oTable, oTemplate) {
		this._oComponent = oComponent;
		this._oTable = oTable;
		this._oFilter = null;
		this._aSorters = null;
		
		// Setup table header and template.

		assert(this._oTable.isA("gramont.VCDSM.specedit.control.Table"), "oTable should be an instance of gramont.VCDSM.specedit.control.Table");
		
		// - Error indicator

		oTemplate.bindProperty("error", {
			path: ModelManagerAdmin.FullPropName.Error
		});
		oTemplate.bindProperty("tooltip", {
			path: ModelManagerAdmin.FullPropName.ErrorMessage
		});

		// - Delete indicator

		oTemplate.bindProperty("deleted", {
			path: ModelManagerAdmin.FullPropName.Deleted
		});

		var oHeaderDeleteColumnIcon = new Icon({
			src: "sap-icon://delete"
		});
		this._oHeaderDeleteColumn = new Column({
			header: oHeaderDeleteColumnIcon,
			hAlign: TextAlign.Center,
			width: "3rem"
		});
		this._oTable.insertColumn(this._oHeaderDeleteColumn, 0);

		this.setTableDeleteVisible(true);

		var oEntryDeleteColumnCheckBox = new CheckBox({
			selected: {
				path: ModelManagerAdmin.FullPropName.Deleted,
				mode: BindingMode.OneWay
			},
			enabled: {
				path: "appModel>/editMode"
			},
			select: jQuery.proxy(this._onDelete, this)
		});
		this._oEntryDeleteColumn = new AlwaysEnabled({
			control: oEntryDeleteColumnCheckBox
		});
		oTemplate.insertCell(this._oEntryDeleteColumn, 0);

		this.setEntryDeleteVisible(null);

		// - Empty indicator

		oTemplate.bindProperty("autoGrow", {
			parts: [
				{ path: ModelManagerAdmin.FullPropName.IntStatus },
				{ path: ModelManagerAdmin.FullPropName.AutoGrowEntry }
			],
			formatter: jQuery.proxy(this._formatAutoGrow, this)
		});

		// Setup template.

		var aEntryColumns = oTemplate.getCells().slice(1);
		this._prepareControls(aEntryColumns);

		// Setup binding.

		this._oTable.bindItems({
			path: "/",
			template: oTemplate
		});
		
		// Attach to editMode change.
		
		this._fEditModeChange = jQuery.proxy(this._editModeChange, this);
		this._oComponent.attachEditModeChange(this._fEditModeChange);
		
		// In util classes of ESM, we usually don't inherit from UI5 control/element,
		// therefore we need a "fake" control for detecting destroy events.

		var oDestroyListener = new DestroyListener();
		oDestroyListener.setDestroyCallback(jQuery.proxy(this._destroy, this));
		this._oTable.addDependent(oDestroyListener);
	};
	
	TableManager.prototype.setCollection = function(oCollection) {
		this._oCollection = oCollection;
		
		this._oTable.setModel(this._oCollection.getModel());
		// this._oTable.setModel(new sap.ui.model.json.JSONModel(this._oCollection));
		this._setupBinding();
	};
	
	TableManager.prototype.setFilter = function(oFilter) {
		this._oFilter = oFilter;
		this._setupBinding();
	};

	TableManager.prototype.setSorter = function(aSorters) {
		this._aSorters = aSorters;
		this._setupBinding();
	};

	TableManager.prototype.setTableDeleteVisible = function(bVisible) {
		this._oHeaderDeleteColumn.setVisible(bVisible);
	};

	TableManager.prototype.setEntryDeleteVisible = function(oCustomBindingInfo) { // FIXME: integrate this into modelmgr?
		// UI5: From ManagedObject->bindProperty doc: "recursive composite bindings are
		// currently not supported", therefore we have to emulate it.

		var aParts = [
			{ path: ModelManagerAdmin.FullPropName.IntStatus },
			{ path: ModelManagerAdmin.FullPropName.AutoGrowEntry }
		];

		var fCustomFormatter = null;

		if (oCustomBindingInfo) {
			var sPath = oCustomBindingInfo.path;
			assert(sPath != null, "sPath should be set");

			var oPart = { path: sPath };
			aParts.push(oPart);

			fCustomFormatter = oCustomBindingInfo.formatter;
			if (!fCustomFormatter) {
				fCustomFormatter = function(bVisible) {
					return bVisible;
				};
			}
		}

		var oBindingInfo = {
			parts: aParts,
			formatter: jQuery.proxy(this._formatDeleteVisible, this, fCustomFormatter)
		};

		this._oEntryDeleteColumn.bindProperty("visible", oBindingInfo);
	};
	
	TableManager.prototype._prepareControls = function(aControls) {
		for (var i = 0; i < aControls.length; i++) {
			var oControl = aControls[i];
			this._prepareControl(oControl);
		}
	};

	TableManager.prototype._prepareControl = function(oControl) {
		if (!oControl)
			return;

		// 1) Setup error indicator.
		// Control order: containers, display and edit controls.

		var sFieldErrorBindingPath = null;
		var fAttachChange = null;

		if (oControl.isA("sap.ui.layout.HorizontalLayout")) {
			this._prepareControls(oControl.getContent());
		} else if (oControl.isA("gramont.VCDSM.specedit.control.CharValueControl")) {
			this._prepareControl(oControl.getInnerControl());
			this._prepareControl(oControl.getEditButton());
		} else if (oControl.isA("gramont.VCDSM.specedit.control.Field")) {
			this._prepareControl(oControl.getDisplay());
			this._prepareControl(oControl.getEdit());
		} else if (oControl.isA(["sap.m.Link", "sap.m.Text", "sap.ui.core.Icon"])) {
			oControl.addStyleClass("gramontPlmVc_TableManager_VAlign");
		} else if (oControl.isA("sap.m.Button")) {
			sFieldErrorBindingPath = this._getFieldErrorBindingPath(oControl, null);
			if (sFieldErrorBindingPath != null) {
				oControl.bindProperty("type", {
					path: sFieldErrorBindingPath,
					formatter: jQuery.proxy(this._formatType, this)
				});
			}
		} else if (oControl.isA("sap.m.CheckBox")) {
			sFieldErrorBindingPath = this._getFieldErrorBindingPath(oControl, "selected");
			if (sFieldErrorBindingPath != null) {
				oControl.bindProperty("valueState", {
					path: sFieldErrorBindingPath,
					formatter: jQuery.proxy(this._formatValueState, this)
				});
			}

			fAttachChange = oControl.attachSelect;
		} else if (oControl.isA("sap.m.InputBase")) { // DatePicker, Input, TextArea, TimePicker
			sFieldErrorBindingPath = this._getFieldErrorBindingPath(oControl, "value");
			if (sFieldErrorBindingPath != null) {
				oControl.bindProperty("valueState", {
					path: sFieldErrorBindingPath,
					formatter: jQuery.proxy(this._formatValueState, this)
				});
			}

			fAttachChange = oControl.attachLiveChange;
			if (!fAttachChange)
				fAttachChange = oControl.attachChange;
		}

		if (sFieldErrorBindingPath != null) {
			oControl.bindProperty("tooltip", {
				path: sFieldErrorBindingPath
			});
		}

		// 2) Attach change event handler.

		if (fAttachChange)
			fAttachChange.call(oControl, jQuery.proxy(this._onChange, this));
	};

	TableManager.prototype._getFieldErrorBindingPath = function(oControl, sPropName) {
		var sFieldErrorBindingPath = null;

		var sFieldName = oControl.data(TableManagerConst.FieldName);
		if (sPropName != null && sFieldName == null)
			sFieldName = oControl.getBindingPath(sPropName);
		if (sFieldName != null) {
			Util.checkFieldName(sFieldName);
			sFieldErrorBindingPath = ModelManagerAdmin.FullPropName.Field + "/" + sFieldName;
		}

		return sFieldErrorBindingPath;
	};

	TableManager.prototype._setupBinding = function() {
		var oBinding = this._oTable.getBinding("items");
		if (!oBinding)
			return;

		// Setup filering.

		var aFilters = [];
		
		// Add autogrow filter, implementing:
		// bVisible = (!(sIntStatus == ModelManagerIntStatus.Empty && bAutoGrowEntry) || (bEditMode && bAutoGrowVisible))
		
		var oAutoGrowFilter1 = new Filter({
           	path: ModelManagerAdmin.FullPropName.IntStatus,
          	operator: FilterOperator.NE,
          	value1: ModelManagerIntStatus.Empty
		});
			
		var oAutoGrowFilter2 = new Filter({
	    	path: ModelManagerAdmin.FullPropName.AutoGrowEntry,
         	operator: FilterOperator.EQ,
           	value1: false
		});
		
		var aAutoGrowFilters = [oAutoGrowFilter1, oAutoGrowFilter2];

		if (this._oComponent.getEditMode()) {
			var oAutoGrowFilter3 = new Filter({
           		path: ModelManagerAdmin.FullPropName.AutoGrowVisible,
          		operator: FilterOperator.EQ,
          		value1: true
			});
			aAutoGrowFilters.push(oAutoGrowFilter3);
		}
		
		var oAutoGrowFilter = new Filter({
			filters: aAutoGrowFilters,
			and: false
		});
		aFilters.push(oAutoGrowFilter);
		
		// Add external filter, if any.
		
		if (this._oFilter)
			aFilters.push(this._oFilter);
			
		var oFilter = new Filter({
			filters: aFilters,
			and: true
		});
		
		oBinding.filter([oFilter]);

		// Setup sorting.

		oBinding.sort(this._aSorters);
	};

	TableManager.prototype._editModeChange = function() {
		this._setupBinding();
	};
	
	TableManager.prototype._destroy = function() {
		this._oComponent.detachEditModeChange(this._fEditModeChange);
	};

	TableManager.prototype._formatDeleteVisible = function(fCustomFormatter, sIntStatus, bAutoGrowEntry, vCustomValue) {
		var bVisible = (!(sIntStatus == ModelManagerIntStatus.Empty && bAutoGrowEntry));

		if (fCustomFormatter)
			bVisible = bVisible && fCustomFormatter(vCustomValue);

		return bVisible;
	};

	TableManager.prototype._formatAutoGrow = function(sIntStatus, bAutoGrowEntry) {
		var bAutoGrow = (sIntStatus == ModelManagerIntStatus.Empty && bAutoGrowEntry);
		return bAutoGrow;
	};

	TableManager.prototype._formatValueState = function(sErrorMessage) {
		var sValueState = (sErrorMessage != null ? ValueState.Error : ValueState.None);
		return sValueState;
	};

	TableManager.prototype._formatType = function(sErrorMessage) {
		var sType = (sErrorMessage != null ? ButtonType.Reject : ButtonType.Default);
		return sType;
	};

	TableManager.prototype._onDelete = function(oEvent) {
		// This function is called when a delete checkbox changes
		// state.

		var oControl = oEvent.getSource();

		// Find out entry index from binding context.

		var iIndex = this._oCollection.getEntryIndexOfControl(oControl);
		var bDeleted = oEvent.getParameter("selected");

		// Delete entry.
		
		this._oCollection.delete(iIndex, bDeleted);

		// UI5: If the iIndex'th entry goes away (it is either NEW or EMPTY), then
		// the cloned template item is not destroyed: it gets data from the iIndex + 1'th
		// entry. We need to correct its checkbox state.
		
        var oModel = this._oCollection.getModel();
        var bModelDeleted = oModel.getProperty("/" + iIndex + "/" + ModelManagerAdmin.FullPropName.Deleted);

        if (bModelDeleted != null && bModelDeleted != oControl.getSelected())
        	oControl.setSelected(bModelDeleted);
	};

	TableManager.prototype._onChange = function(oEvent) {
		// This function is called when a field has been changed
		// by user.

		// Find out entry index from binding context.

		var iIndex = this._oCollection.getEntryIndexOfControl(oEvent.getSource());

		// Update entry status.
		
		this._oCollection.updateEntryStatus(iIndex);
	};

	return TableManager;
});
