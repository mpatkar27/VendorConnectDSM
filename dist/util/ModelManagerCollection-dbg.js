sap.ui.define([
	"sap/base/assert",
	"gramont/VCDSM/specedit/util/ModelManagerAdmin",
	"gramont/VCDSM/specedit/util/ModelManagerAutoGrowOp",
	"gramont/VCDSM/specedit/util/ModelManagerIntStatus",
	"gramont/VCDSM/specedit/util/Util"
], function(assert, ModelManagerAdmin, ModelManagerAutoGrowOp, ModelManagerIntStatus, Util) {
	"use strict";

	var ModelManagerCollection = function(oParentKeyRef, oModel, oAdditional, oCollectionMethods, oAliveObj) {
		// Parent key is passed as reference, since if the key is updated
		// (e.g. during create), then we need to know its up-to-date value.
		
		this._oParentKeyRef = oParentKeyRef;
		this._oModel = oModel;
		this._oAdditional = oAdditional;
		this._oCollectionMethods = oCollectionMethods;
		this._oAliveObj = oAliveObj;
		this._fAutoGrowHandler = null;
	};
	
	ModelManagerCollection.prototype.getParentKey = function() {
		var oParentKey = null;
		
		// Check for parent key: top-level nodes don't have it.
		
		if (this._oParentKeyRef) {
			var fExtractParentKey = this._oCollectionMethods.extractParentKey;
			assert(fExtractParentKey, "fExtractParentKey should be set");
			oParentKey = fExtractParentKey(this._oParentKeyRef);
		}
		
		return oParentKey;
	};

	ModelManagerCollection.prototype.getModel = function() {
		return this._oModel;
	};

	ModelManagerCollection.prototype.getAdditional = function() {
		return this._oAdditional;
	};

	ModelManagerCollection.prototype.getEntry = function(iIndex) {
		this._checkEntryIndex(iIndex);

		var aEntries = this._oModel.getData();
		var oEntry = aEntries[iIndex];

		return oEntry;
	};

	ModelManagerCollection.prototype.getEntries = function() {
		var aEntries = this._oModel.getData();
		return aEntries;
	};
	
	ModelManagerCollection.prototype.setFieldValue = function(iIndex, sFieldName, vFieldValue, bNoUpdate) {
		this._checkEntryIndex(iIndex);
		Util.checkFieldName(sFieldName);

		// Set field value.

		this._oModel.setProperty("/" + iIndex + "/" + sFieldName, vFieldValue);

		// Update entry status.

		if (!bNoUpdate)
			this.updateEntryStatus(iIndex);
		else
			this._oModel.setProperty("/" + iIndex + "/" + ModelManagerAdmin.FullPropName.ForceReset, true);
			
		// TODO_FUTURE: bNoUpdate should be removed:
		// - It is used by PropControl to store private data -> should be replaced with private data storage framework.
		// - It is used by PropDetail* and CharEdit* to update instance table:
		//   - ModelManager should be refactored to allow $expand in collection fetches (e.g. download instances + udt + doclink
		//     at the same time, and merge data into instance table on client-side).
		//   - OData: instance fetches should be refactored to use GET.
	};
	
	ModelManagerCollection.prototype.revertEntryToUnchanged = function(iIndex) { // TODO_FUTURE: Rethink, we need a better solution here.
		// This method sets entry status back to unchanged, but doesn't revert data fields.
		
		this._checkEntryIndex(iIndex);

		// Set status.
		
		var sBindingPath = "/" + iIndex + "/" + ModelManagerAdmin.FullPropName.IntStatus;
		var sIntStatus = this._oModel.getProperty(sBindingPath);
		var bModified = (sIntStatus == ModelManagerIntStatus.Modified);
		assert(bModified || sIntStatus == ModelManagerIntStatus.Unchanged, "Entry status should be either Modified or Unchanged");
		
		if (bModified)
			this._oModel.setProperty(sBindingPath, ModelManagerIntStatus.Unchanged);
	};
	
	ModelManagerCollection.prototype.updateEntryStatus = function(iIndex) {
		// This function is called when a field value has been changed.

		this._checkEntryIndex(iIndex);

		var sBindingPath = "/" + iIndex + "/" + ModelManagerAdmin.FullPropName.IntStatus;
		var sIntStatus = this._oModel.getProperty(sBindingPath);

		// Entry state transition on field value change:
		// - EMPTY     -> NEW
		// - UNCHANGED -> MODIFIED
		// - MODIFIED  -> MODIFIED (no change)
		// - NEW       -> NEW      (no change)

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
			this._oModel.setProperty(sBindingPath, sNewIntStatus);

		// Create autogrow, if needed.
		// TODO_FUTURE: test early here if autogrow is needed for this node?
		
		if (this._oCollectionMethods.create && (iIndex == (this._oModel.getData().length - 1)))
			this._createAutoGrow(ModelManagerAutoGrowOp.New);
	};
	
	ModelManagerCollection.prototype.getEntryIndexOfControl = function(oControl) {
		// Return with entry index (record number) of the given control.

		assert(oControl.getModel() == this._oModel, "oControl should be bound to model");

		var aPathComps = oControl.getBindingContext().getPath().split("/");
		assert(aPathComps.length == 2 &&
			   aPathComps[0]     == "", "Control should have absolute binding context path");

		var iIndex = parseInt(aPathComps[1]);
		return iIndex;
	};
	
	ModelManagerCollection.prototype.create = function(oNewEntry) {
		var oAutoGrowEntry = this._callAutoGrowHandler(ModelManagerAutoGrowOp.New);
		this._create(false, oAutoGrowEntry, oNewEntry);
	};
	
	ModelManagerCollection.prototype.delete = function(iIndex, bDeleted) {
		var fDelete = this._oCollectionMethods.delete;
		assert(fDelete, "delete is not possible");
		
		fDelete(this._oParentKeyRef, iIndex, bDeleted);
	};
	
	ModelManagerCollection.prototype.attachChange = function(fChangeListener) {
		var fAttachChange = this._oCollectionMethods.attachChange;
		assert(fAttachChange, "attachChange is not possible");
		
		var oAttachInfo = fAttachChange(this._oParentKeyRef, fChangeListener);
		return oAttachInfo;
	};

	ModelManagerCollection.prototype.isCreateEnabled = function() {
		var fIsCreateEnabled = this._oCollectionMethods.isCreateEnabled;
		assert(fIsCreateEnabled, "isCreateEnabled is not possible");
		
		var bIsCreateEnabled = fIsCreateEnabled(this._oParentKeyRef);
		return bIsCreateEnabled;
	};
	
	ModelManagerCollection.prototype.setAutoGrowHandler = function(fAutoGrowHandler) {
		// If there was a call to ModelManager.clearStorage, then unsubscription
		// is not needed.
		
		if (!fAutoGrowHandler && !this._oAliveObj.alive)
			return;

		// Call the previous autogrow handler to clear its data, then
		// call the new autogrow handler to set its data.
		
		this._createAutoGrow(ModelManagerAutoGrowOp.Clear);
		this._fAutoGrowHandler = fAutoGrowHandler;
		this._createAutoGrow(ModelManagerAutoGrowOp.Set);
	};
	
	ModelManagerCollection.prototype._create = function(bAutoGrowEntry, oAutoGrowEntry, oNewEntry) {
		var fCreate = this._oCollectionMethods.create;
		assert(fCreate, "create is not possible");
		
		fCreate(this._oParentKeyRef, bAutoGrowEntry, oAutoGrowEntry, oNewEntry);
	};
	
	ModelManagerCollection.prototype._createAutoGrow = function(sAutoGrowOp) {
		var oAutoGrowEntry = this._callAutoGrowHandler(sAutoGrowOp);
		this._create(true, oAutoGrowEntry, null);
	};
	
	ModelManagerCollection.prototype._callAutoGrowHandler = function(sAutoGrowOp) {
		var oAutoGrowEntry = null;
		
		if (this._fAutoGrowHandler)
			oAutoGrowEntry = this._fAutoGrowHandler(sAutoGrowOp);
			
		return oAutoGrowEntry;
	};
	
	ModelManagerCollection.prototype._checkEntryIndex = function(iIndex) {
		var iLength = this._oModel.getData().length;
		assert(iIndex < iLength, "iIndex should be < iLength");
	};

	return ModelManagerCollection;
});
