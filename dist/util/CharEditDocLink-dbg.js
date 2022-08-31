//FIXMEVC:is this needed?
sap.ui.define([
	"sap/base/assert",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel",
	"gramont/VCDSM/specedit/util/ModelManagerStatus",
	"gramont/VCDSM/specedit/util/TableManager"
], function(assert, Filter, FilterOperator, JSONModel, ModelManagerStatus, TableManager) {
	"use strict";
	
	var CharEditDocLink = function(oComponent) {
		this._oComponent = oComponent;

		// Construct dialog.

		this._oDialog = this._oComponent.getNavigator().createFragment("gramont.VCDSM.specedit.frag.CharEditDocLink", this);//FIXME:parentcontrol
		
		this._oDialogDialogModel = new JSONModel();
		this._oDialog.control.setModel(this._oDialogDialogModel, "dialogModel");
		
		// Setup uploader.
		
		var oUploader = this._oDialog.byId("uploader");
		oUploader.setUploadUrl(this._oComponent.getODataManager().getDocUploadURL());

		// Setup table.

		var oTable = this._oDialog.byId("table");
		var oTableItem = this._oDialog.byId("table.item");
		this._oTableManager = new TableManager(this._oComponent, oTable, oTableItem);
	};

	CharEditDocLink.prototype.open = function(oCharHeader, oInstance, fOnStore) {//FIXME:assert for CharHeaderDocLink?
		this._oCharHeader = oCharHeader;
		this._oInstance = oInstance; // TODO_FUTURE: keep this._oInstance or pass as parameter?
		this._fOnStore = fOnStore;

		this._fetchData();
	};

	CharEditDocLink.prototype._fetchData = function() {
		var oRequest = this._oComponent.getModelManager().requestForFetchDocLinkByInstanceKey(this._oInstance);
		this._oComponent.getModelManager().executeFetchRequest(oRequest,
			jQuery.proxy(this._fetchDataSuccess, this));
	};

	CharEditDocLink.prototype._fetchDataSuccess = function(oCollection) {
		this._oCollection = oCollection;
		assert(this._oCollection, "oCollection should be set");

		// Upload is allowed only, if doctype is configured.
		
		this._oDialogDialogModel.setProperty("/enableCreate", this._oCharHeader.getDocType() != "");
		
		// Display doclinks.
		
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
	
	CharEditDocLink.prototype._formatCreateEnabled = function(bEditMode, bEnableCreate) {
		var bEnabled = bEditMode && bEnableCreate;
		return bEnabled;
	};
	
	CharEditDocLink.prototype._onUploadStart = function(oEvent) {
		var aReqHeaders = oEvent.getParameter("requestHeaders");
		
		var oFilenameReqHeader = {
			name: "slug",
			value: this._oCharHeader.getDocType() + "/" + oEvent.getParameter("fileName") // FIXME: nicer way of passing doctype?
		};
		aReqHeaders.push(oFilenameReqHeader);

		var oAcceptReqHeader = {
			name: "Accept",
			value: "application/json"
		};
		aReqHeaders.push(oAcceptReqHeader);
		
		var oSecurityTokenReqHeader = {
			name: "x-csrf-token",
			value: this._oComponent.getODataManager().getSecurityToken()
		};
		aReqHeaders.push(oSecurityTokenReqHeader);
		
		this._oComponent.getNavigator().requireBusyDialog();
	};
	
	CharEditDocLink.prototype._onUploadComplete = function(oEvent) {
		this._oComponent.getNavigator().releaseBusyDialog();
		
		var iStatus = oEvent.getParameter("status");
		var sRawResponse = oEvent.getParameter("responseRaw");
		var sFilename = oEvent.getParameter("fileName");
		
		this._oComponent.getODataManager().parseRawResponse(iStatus, sRawResponse, "CharEditDocLink.error.upload", jQuery.proxy(this._onUploadCompleteSuccess, this, sFilename));
	};
	
	CharEditDocLink.prototype._onUploadCompleteSuccess = function(sFilename, oData) {
		// Create doclink.
		
		var sTextType = this._oCharHeader.getTextType();

		var oDocLink = {
			TEXTCAT: sTextType,
			FILENAME: sFilename,
			DOKAR: oData.DOKAR,
			DOKNR: oData.DOKNR,
			DOKVR: oData.DOKVR,
			DOKTL: oData.DOKTL
		};
			
		this._oCollection.create(oDocLink);
	};
	
	CharEditDocLink.prototype._onDocOpen = function(oEvent) {
 		var oDocKey = oEvent.getSource().getBindingContext().getProperty();
		this._oCharHeader.openDoc(oDocKey);
	};

	CharEditDocLink.prototype._onClose = function() {
		this._oDialog.control.close();
		
		// Update instance table.
		// FIXME: better solution: how to keep instance table up-to-date automatically?

		var sTextType = this._oCharHeader.getTextType();

		var aAllDocLinks = this._oCollection.getEntries();
		var aDocLinks = [];

		for (var i = 0; i < aAllDocLinks.length; i++) {
			var oDocLink = aAllDocLinks[i];
			var sStatus = this._oComponent.getModelManager().getEntryStatus(oDocLink);

			switch (sStatus) {
			case ModelManagerStatus.Deleted:
				break;

			case ModelManagerStatus.New:
			case ModelManagerStatus.Unchanged:
				if (oDocLink.TEXTCAT == sTextType)
					aDocLinks.push(oDocLink);
				break;
				
			default:
				assert(false, "sStatus is unknown");
			}
		}
		
		var aCharValues = this._oCharHeader.buildCharValues(aDocLinks);
		
		this._fOnStore(aCharValues, true);
	};

	return CharEditDocLink;
});
