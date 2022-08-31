//FIXMEVC:is this needed?
sap.ui.define([
	"sap/base/assert",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"gramont/VCDSM/specedit/util/ModelManagerAutoGrowOp",
	"gramont/VCDSM/specedit/util/ModelManagerStatus",
	"gramont/VCDSM/specedit/util/TableManager",
	"gramont/VCDSM/specedit/util/ValueHelperDialog"
], function(assert, Filter, FilterOperator, ModelManagerAutoGrowOp, ModelManagerStatus, TableManager, ValueHelperDialog) {
	"use strict";

	// FIXME: code dup: CharEditUserDefinedText<->PropDetailUserDefinedText

	var CharEditUserDefinedText = function(oComponent) {
		// EXT_CLASS
		oComponent.initClassExtension(this, "gramont.VCDSM.specedit.util.CharEditUserDefinedText", arguments);

		this._oComponent = oComponent;

		// Construct dialog.

		this._oDialog = this._oComponent.getNavigator().createFragment("gramont.VCDSM.specedit.frag.CharEditUserDefinedText", this);//FIXME:parentcontrol

		// Setup table.

		var oTable = this._oDialog.byId("table");
		var oTableItem = this._oDialog.byId("table.item");
		this._oTableManager = new TableManager(this._oComponent, oTable, oTableItem);

		// Setup value helper parameters.

		this._oValueHelperPropMaps = {
				"LANGU": {"LANGU": {property: "SPRAS"}}
		};

		// EXT_HOOK: _extHookDisplayLongText
		// Determine if either standard or longtext should be displayed.

		var bDisplayLongText = false;

		if (this._extHookDisplayLongText)
			bDisplayLongText = this._extHookDisplayLongText();

		this._oDialog.byId("table.text.std").setVisible(!bDisplayLongText); // FIXME: use model?
		this._oDialog.byId("table.text.long").setVisible(bDisplayLongText);
	};

	CharEditUserDefinedText.prototype.open = function(oCharHeader, oInstance, fOnStore) {//FIXME:assert for CharHeaderUserDefinedText?
		this._oCharHeader = oCharHeader;
		this._oInstance = oInstance; // TODO_FUTURE: keep this._oInstance or pass as parameter?
		this._fOnStore = fOnStore;

		this._fetchData();
	};

	CharEditUserDefinedText.prototype._fetchData = function() {
		var oRequest = this._oComponent.getModelManager().requestForFetchUserDefinedTextByInstanceKey(this._oInstance);
		this._oComponent.getModelManager().executeFetchRequest(oRequest,
				jQuery.proxy(this._fetchDataSuccess, this));
	};

	CharEditUserDefinedText.prototype._fetchDataSuccess = function(oCollection) {
		this._oCollection = oCollection;
		assert(this._oCollection, "oCollection should be set");
		
		this._oCollection.setAutoGrowHandler(jQuery.proxy(this._autoGrowHandler, this));

		// Display user defined texts.
		
		this._oTableManager.setCollection(this._oCollection);

		// Setup filter.

		var sTextType = this._oCharHeader.getTextType();

		var oFilter = new Filter({
			path: "TEXTCAT",
			operator: FilterOperator.EQ,
			value1: sTextType
		});

		this._oTableManager.setFilter(oFilter);

		// Open dialog.

		assert(!this._oDialog.control.isOpen(), "oDialog should be closed");
		this._oDialog.control.open();
	};

	CharEditUserDefinedText.prototype._autoGrowHandler = function(sAutoGrowOp) {
		var oUserDefinedText = null;
		
		switch (sAutoGrowOp) {
		case ModelManagerAutoGrowOp.Set:
		case ModelManagerAutoGrowOp.New:
			oUserDefinedText = {
				TEXTCAT: this._oCharHeader.getTextType()
			};
			break;
			
		case ModelManagerAutoGrowOp.Clear:
			oUserDefinedText = {
				TEXTCAT: null
			};
			break;
			
		default:
			assert(false, "sAutoGrowOp is unknown");
		}
		
		return oUserDefinedText;
	};

	CharEditUserDefinedText.prototype._onCreate = function() {
		this._oCollection.create(null);
	};

	CharEditUserDefinedText.prototype._onValueHelpRequest = function(oEvent) {
		ValueHelperDialog.openDialog(this._oComponent,
				"UserDefinedText",
				this._oValueHelperPropMaps,
				null,
				oEvent.getSource(),
				this._oCollection);
	};

	CharEditUserDefinedText.prototype._onClose = function() {
		this._oDialog.control.close();

		this._oCollection.setAutoGrowHandler(null);

		// Update instance table.
		// FIXME: better solution: how to keep instance table up-to-date automatically?

		var sTextType = this._oCharHeader.getTextType();
		var sLanguage = this._oComponent.getConfig().language;

		var aUserDefinedTexts = this._oCollection.getEntries();
		var aStrings = [];

		for (var i = 0; i < aUserDefinedTexts.length; i++) {
			var oUserDefinedText = aUserDefinedTexts[i];
			var sStatus = this._oComponent.getModelManager().getEntryStatus(oUserDefinedText);

			switch (sStatus) {
			case ModelManagerStatus.Empty:
			case ModelManagerStatus.Deleted:
				break;

			case ModelManagerStatus.New:
			case ModelManagerStatus.Modified:
			case ModelManagerStatus.Unchanged:
				if (oUserDefinedText.TEXTCAT == sTextType &&
					(oUserDefinedText.LANGU == null || // Keep in sync with server-side!
					 oUserDefinedText.LANGU == ""   ||
					 oUserDefinedText.LANGU == sLanguage))
					aStrings.push(oUserDefinedText.TEXT);
				break;

			default:
				assert(false, "sStatus is unknown");
			}
		}

		var aCharValues = this._oCharHeader.buildCharValues(aStrings);

		this._fOnStore(aCharValues, true);
	};

	return CharEditUserDefinedText;
});
