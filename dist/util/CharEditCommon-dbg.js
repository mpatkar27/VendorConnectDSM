sap.ui.define([
	"sap/base/assert",
	"sap/m/ColumnListItem",
	"sap/m/ListMode",
	"sap/m/Text",
	"sap/ui/core/VerticalAlign",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel",
	"gramont/VCDSM/specedit/util/Util"
], function(assert, ColumnListItem, ListMode, Text, VerticalAlign, Filter, FilterOperator, JSONModel, Util) {
	"use strict";
	
	var CharEditCommon = function(oComponent) {
		// EXT_CLASS
		oComponent.initClassExtension(this, "gramont.VCDSM.specedit.util.CharEditCommon", arguments);

		this._oComponent = oComponent;
		
		// Construct dialog.

		this._oDialog = this._oComponent.getNavigator().createFragment("gramont.VCDSM.specedit.frag.CharEditCommon", this);//FIXME:parentcontrol

		this._oDialogDialogModel = new JSONModel();
		this._oDialog.control.setModel(this._oDialogDialogModel, "dialogModel");

		var oTable = this._oDialog.byId("table");

		this._oDialogTableModel = new JSONModel();
		oTable.setModel(this._oDialogTableModel);
	};
	
	CharEditCommon.prototype.open = function(oCharHeader, oInstance, fOnStore) {
		this._oCharHeader = oCharHeader;
		this._oInstance = oInstance; // TODO_FUTURE: keep this._oInstance or pass as parameter?
		this._fOnStore = fOnStore;
		
		if (this._oCharHeader.getValueHelper())
			this._fetchCharValue();
		else
			this._open2([]);
	};
	
	CharEditCommon.prototype._fetchCharValue = function() {
		var oKey = this._oInstance;

		// If instance is just created, then use property key.

		if (this._oComponent.getModelManager().isKeyCreated(oKey))
			oKey = this._oComponent.getModelManager().getParentPropertyKeyByInstanceKey(oKey);

		// EXT_HOOK: _extHookRequestForFetchCharValue
		// Create characteristic value help request.

		var oRequest = this._extHookRequestForFetchCharValue ? this._extHookRequestForFetchCharValue(oKey, this._oInstance, this._oCharHeader) :
			this._oComponent.getODataManager().requestForFetchCharValue(oKey, this._oCharHeader);

		this._oComponent.getODataManager().executeRequest(oRequest,
				jQuery.proxy(this._fetchCharValueSuccess, this));
	};

	CharEditCommon.prototype._fetchCharValueSuccess = function(aCharEntries) {
		this._open2(aCharEntries);
	};

	CharEditCommon.prototype._open2 = function(aCharEntries) {
		// Add button is visible only for multi-value characteristic.

		this._oDialogDialogModel.setProperty("/visibleCreate", this._oCharHeader.getMultiValue() && this._oCharHeader.getAdditionalValues());

		// Set table mode.

		this._oDialogDialogModel.setProperty("/tableMode", this._oCharHeader.getMultiValue() ? ListMode.MultiSelect : ListMode.SingleSelectLeft);

		// Empty filter.

		var oSearch = this._oDialog.byId("search");
		oSearch.setValue("");

		// Mark backend-supplied characteristic values as read-only.

		for (var i = 0; i < aCharEntries.length; i++) {
			var oCharEntry = aCharEntries[i];
			this._setCharEntryProp(oCharEntry, false, false);
		}

		// Determine, if we need to display empty option in value list to allow the
		// user to clear selection.

		var oEmptyCharEntry = null;

		if (!this._oCharHeader.getMultiValue()) {
			// EXT_HOOK: _extHookDisplayEmptyCharEntry
			// Display empty option in value list, if needed.

			if (this._extHookDisplayEmptyCharEntry && this._extHookDisplayEmptyCharEntry(this._oCharHeader)) {
				var sDescription = this._oComponent.getI18nBundle().getText("CharEditCommon.empty.charDescr");
				oEmptyCharEntry = this._createEmptyCharEntry(false, false, sDescription);
			}
		}

		// Iterate thru characteristic values. Characteristic values are copied, to
		// avoid any modification in table model.

		var aCharValues = Util.copy(this._oInstance[this._oCharHeader.getFieldName()]);
		var aUserCharEntries = [];
		var bCharEntrySelected = false;

		for (var i = 0; i < aCharValues.length; i++) {
			var vCharValue = aCharValues[i];
			var bFound = false;

			// Handle empty value.

			if (this._oCharHeader.isEmptyCharValue(vCharValue)) {
				if (oEmptyCharEntry) {
					this._setCharEntryProp(oEmptyCharEntry, null, true);
					bCharEntrySelected = true;
				}

				continue;
			}

			for (var j = 0; j < aCharEntries.length; j++) {
				var oCharEntry = aCharEntries[j];

				bFound = this._oCharHeader.isCharValueEqual(vCharValue, oCharEntry.charValue);

				if (bFound) {
					// If the characteristic value is present in aCharEntries,
					// then mark as selected.

					this._setCharEntryProp(oCharEntry, null, true);
					bCharEntrySelected = true;
					break;
				}
			}

			if (!bFound) {
				// If the characteristic value is not present in aCharEntries,
				// then create user-defined value and mark as read-write and selected.

				var oCharEntry = this._oCharHeader.createCharEntryFromCharValue(vCharValue);
				this._setCharEntryProp(oCharEntry, true, true);
				aUserCharEntries.push(oCharEntry);
			}
		}

		// Insert empty value after the for-cycle, since isCharValueEqual can't be called on
		// empty values.

		if (oEmptyCharEntry)
			aCharEntries.splice(0, 0, oEmptyCharEntry);

		aCharEntries = aCharEntries.concat(aUserCharEntries);

		// Special case: if we working with single-value characteristic with additional values
		// and there is no user-specific characteristic (which is editable), then create an empty one.

		if (!this._oCharHeader.getMultiValue() && this._oCharHeader.getAdditionalValues() && aUserCharEntries.length == 0) {
			var oCharEntry = this._createEmptyCharEntry(true, !bCharEntrySelected);
			aCharEntries.push(oCharEntry);
		}

		// Setup table. First, the model has to be cleared, otherwise bindItems and
		// setupFilter can cause errors (because of different characteristic type).

		this._oDialogTableModel.setData([]);
		this._setupFilter();
		
		// EXT_HOOK: _extHookSetupTable
		// Setup char entries.
		
		if (this._extHookSetupTable)
			this._extHookSetupTable(aCharEntries);

		var oTable = this._oDialog.byId("table");
		oTable.bindItems({
			path: "/",
			factory: jQuery.proxy(this._itemFactory, this)
		});

		this._oDialogTableModel.setData(aCharEntries);

		// Open dialog.

		assert(!this._oDialog.control.isOpen(), "oDialog should be closed");
		this._oDialog.control.open();
	};

	CharEditCommon.prototype._close = function() {
		this._oDialog.control.close();
	};

	CharEditCommon.prototype._setupFilter = function() {
		// Query search bar.

		var oSearch = this._oDialog.byId("search");
		var sSearchQuery = oSearch.getValue();

		// Construct filter object.

		var aFilters = [];

		if (sSearchQuery != "") {
			var aInnerFilters = [];

			// Filter by value (if possible).

			var sPath = this._oCharHeader.getCharEntryFilterPath();
			if (sPath != null) {
				var oCharEntryFilter = new Filter({
					path: sPath,
					operator: FilterOperator.Contains,
					value1: sSearchQuery
				});
				aInnerFilters.push(oCharEntryFilter);
			}

			// Filter by description.

			var oDescriptionFilter = new Filter({
				path: "description",
				operator: FilterOperator.Contains,
				value1: sSearchQuery
			});
			aInnerFilters.push(oDescriptionFilter);

			var oFilter = new Filter({
				filters: aInnerFilters,
				and: false
			});

			aFilters = [oFilter];
		}
		
		// EXT_HOOK: _extHookSetupFilter
		// Customize search filter.
		
		if (this._extHookSetupFilter)
			this._extHookSetupFilter(sSearchQuery, aFilters);

		// Set binding filter.

		var oTable = this._oDialog.byId("table");
		var oBinding = oTable.getBinding("items");

		if (oBinding)
			oBinding.filter(aFilters);
	};

	CharEditCommon.prototype._setCharEntryProp = function(oCharEntry, bEditable, bSelected) {
		if (bEditable != null)
			oCharEntry._editable = bEditable;

		if (bSelected != null)
			oCharEntry._selected = bSelected;
	};

	CharEditCommon.prototype._createEmptyCharEntry = function(bEditable, bSelected, sDescription) {
		var oCharEntry = this._oCharHeader.createEmptyCharEntry(sDescription);
		this._setCharEntryProp(oCharEntry, bEditable, bSelected);

		return oCharEntry;
	};

	CharEditCommon.prototype._itemFactory = function(sId, oContext) {
		// Construct table item.

		var oItem = new ColumnListItem({
			vAlign: VerticalAlign.Middle,
			selected: {
				path: "_selected"
			}
		});

		var oCharEntryControl;

		if (!oContext.getProperty("_editable")) {
			// Render read-only values.

			oCharEntryControl = this._oCharHeader.getCharEntryLabel();
		} else {
			// Render read-write values.

			oCharEntryControl = this._oCharHeader.getCharEntryInput();
		}

		// Create control for displaying description, allow wrapping.

		var oDescriptionControl = new Text({
			text: {
				path: "description"
			}
		});

		// oItem.addCell(oCharEntryControl);
		oItem.addCell(oDescriptionControl);
		
		// EXT_HOOK: _extHookItemFactory
		// Customize item factory.
		
		if (this._extHookItemFactory)
			this._extHookItemFactory(oContext, oItem);

		return oItem;
	};

	CharEditCommon.prototype._onCreate = function() {
		var aCharEntries = this._oDialogTableModel.getData();

		var oCharEntry = this._createEmptyCharEntry(true, true);
		aCharEntries.push(oCharEntry);

		this._oDialogTableModel.setData(aCharEntries);
	};

	CharEditCommon.prototype._onSearch = function() {
		this._setupFilter();
	};

	CharEditCommon.prototype._onSelect = function(oEvent) {
		if (!this._oCharHeader.getMultiValue()) {
			// Single value case.
			// UI5: UI5 only clears selected property for items which are visible,
			// therefore we need to clear others manually.

			assert(oEvent.getParameter("selected"), "selected should be set");

			// Don't use oTable.getItems(), since it contains only visible
			// (non-paged and un-filtered) items. Therefore, it can't be used to
			// determine selected item index.

			var oTable = oEvent.getSource();
			var iSelectedIndex = parseInt(oTable.getSelectedContextPaths()[0].substr(1));
			assert(!isNaN(iSelectedIndex), "iSelectedIndex should be a number");

			var aCharEntries = this._oDialogTableModel.getData();

			for (var i = 0; i < aCharEntries.length; i++) {
				if (i != iSelectedIndex) {
					var oCharEntry = aCharEntries[i];
					this._setCharEntryProp(oCharEntry, null, false);
				}
			}
		}
	};

	CharEditCommon.prototype._onOK = function() {
		this._close();

		// Collect selected entries.

		var aCharEntries = this._oDialogTableModel.getData();
		var aSelectedCharEntries = [];

		for (var i = 0; i < aCharEntries.length; i++) {
			var oCharEntry = aCharEntries[i];
			if (oCharEntry._selected)
				aSelectedCharEntries.push(oCharEntry);
		}

		// Convert CharEntries to CharValues.

		var aCharValues = this._oCharHeader.createCharValuesFromCharEntries(aSelectedCharEntries);

		// Store.
		
		this._fOnStore(aCharValues, false);
	};

	CharEditCommon.prototype._onCancel = function() {
		this._close();
	};
	
	return CharEditCommon;
});
