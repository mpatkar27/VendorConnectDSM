/*
 * ModelManager implements a generic data handling class:
 * - It provides a bridge: UI <-> ModelManager <-> OData layer.
 * - Provides single save (button) feature.
 */

sap.ui.define([
	"sap/base/assert",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel",
	"gramont/VCDSM/specedit/util/ModelManagerAdmin",
	"gramont/VCDSM/specedit/util/ModelManagerChangeType",
	"gramont/VCDSM/specedit/util/ModelManagerCollection",
	"gramont/VCDSM/specedit/util/ModelManagerConst",
	"gramont/VCDSM/specedit/util/ModelManagerIntStatus",
	"gramont/VCDSM/specedit/util/ModelManagerStatus",
	"gramont/VCDSM/specedit/util/Util"
], function (assert, MessageToast, JSONModel, ModelManagerAdmin, ModelManagerChangeType, ModelManagerCollection, ModelManagerConst,
	ModelManagerIntStatus, ModelManagerStatus, Util) {
	"use strict";

	var ROOT = {
		NodeName: "ROOT",
		Key: ""
	};

	var CREATE_KEYFIELD = "_ModelManager:CREATE";

	var ModelManager = function (oComponent) {
		this._oComponent = oComponent;
	};

	ModelManager.prototype.clearStorage = function () {
		// Storage structure:
		// [ParentNodeName][ParentKey] = {                            <- storageParent: can be used to test if parent is loaded
		//                                 child: [ChildNodeName] = { <- storageChild:  can be used to test if child is loaded
		//                                                            model: JSONModel([ ... ])
		//                                                            additional: { ... }
		//                                                            changeListeners: [ ... ]
		//                                                            collection: ...
		//                                                          }
		//                                 additional: { ... }
		//                                 keyRef: ...
		//                                 parentKeyRef: ...
		//                               }

		this._oStorage = {};

		var oStorageNode = this._oStorage[ROOT.NodeName] = {};
		oStorageNode[ROOT.Key] = {
			child: {},
			additional: null,
			keyRef: null,
			parentKeyRef: null
		};

		this._iCreateIndex = 0;

		// Mark already existing alive object as dead, and
		// create new.

		if (this._oAliveObj)
			this._oAliveObj.alive = false;

		this._oAliveObj = {
			alive: true
		};
	};

	ModelManager.prototype.requestForBackendPassthru = function (oBackendRequest) {
		// Special request: pass backend request directly to connectivity layer without any processing.

		var oRequest = {
			passthru: true,
			backendRequest: oBackendRequest
		};

		return oRequest;
	};

	ModelManager.prototype.executeFetchRequest = function (oRequest, fSuccess, fError) {
		// Execute a single fetch request.

		var that = this;

		var fCallback = function (oExecuteData) {
			if (oExecuteData.allSuccess) {
				// Successful execution.

				var aExecuteResponses = oExecuteData.responses;
				assert(aExecuteResponses.length == 1, "aExecuteResponses length should be 1");

				var oExecuteResponse = aExecuteResponses[0];
				var oResponse = oExecuteResponse.response;
				assert(oResponse, "oResponse should be set");

				if (fSuccess)
					fSuccess(oResponse);
			} else {
				// Error during execution.

				var fClose = function () {
					if (fError)
						fError();
				};

				Util.showExecuteError(that._oComponent, null, oExecuteData, true, fClose);
			}
		};

		this.executeFetchRequests([oRequest], fCallback);
	};

	ModelManager.prototype.executeFetchRequests = function (aRequests, fCallback) {
		assert(aRequests.length > 0, "aRequests should contain at least one element");

		this._executeFetchRequestsBegin();

		// De-duplicate aRequests to make sure that we fetch missing
		// nodes only once from backend. Only applied for normal requests,
		// backend passthru requests are not de-duplicated.

		var oRequestInfos = {}; // TODO: single/multilevel key?
		var aRequestInfos = [];

		for (var i = 0; i < aRequests.length; i++) {
			var oRequest = aRequests[i];
			var bPassthru = oRequest.passthru;
			var sRequest = !bPassthru ? this._requestToString(oRequest, false) : ("backendPassthru" + i.toString());

			var oRequestInfo = oRequestInfos[sRequest];
			if (!oRequestInfo) {
				oRequestInfo = oRequestInfos[sRequest] = {
					request: oRequest,
					reload: false,
					requestIndexes: [],
					additional: null, // For non-existing storage nodes: additional object.
					fetchResponseEntries: null, // For non-existing or reloaded storage nodes: immediate response (backend fetch suppressed).
					storageResponseChild: null, // For existing storage nodes: storage child.
					error: null,
					response: null
				};
				aRequestInfos.push(oRequestInfo);
			}

			// Reload will silently discard changes (non-saved entries).

			if (oRequest.reload)
				oRequestInfo.reload = true;

			oRequestInfo.requestIndexes.push(i);
		}

		// Sort aRequestInfos by ascending node level:
		// - Fetch parent first, then child nodes.
		// - It is used to determine orphaned child nodes to keep storage
		//   consistent.

		aRequestInfos.sort(jQuery.proxy(this._compareRequestInfo, this));

		// Collect requests that are not present in storage. These should
		// be fetched from backend.

		var aBackendRequests = [];
		var oParentAdditionals = {}; // TODO: single/multilevel key?

		for (var i = 0; i < aRequestInfos.length; i++) {
			var oRequestInfo = aRequestInfos[i];
			var oRequest = oRequestInfo.request;
			var nodename = oRequest.nodeMetadata.name;

			if (!oRequest.passthru) {
				// Handle normal request.

				var oNodeMetadata = oRequest.nodeMetadata;
				var oParentKey = oRequest.parentKey;
				var bReload = oRequestInfo.reload;

				// Lookup node.
				// - For non-keyed parent node: should be present in storage.
				// - For keyed parent node: it is possible, that the parent node doesn't exist
				//   in storage.

				var oStorageChild = null;
				var oAdditional = null;

				var oStorageParent = this._getStorageParent(oNodeMetadata, oParentKey, true);
				
					if (oStorageParent) {
						oStorageChild = this._getStorageChild(oStorageParent, oNodeMetadata);
						if (oStorageChild) {
							// Node found:
							// - bReload = false: read entries and additional from storage.
							// - bReload = true: read only additional from storage and reload entries.

							oAdditional = oStorageChild.additional;
							assert(oAdditional, "oAdditional should be set");
							if (nodename == "MultiComposition") {
							bReload = true;
							}
							if(oRequest.parentKey)
							{
								if(oRequest.parentKey.MLC == true)
								{
									bReload = true;
								}
							}
							if (bReload)
								oStorageChild = null;
						}
					}
				

				// For non-existing nodes, construct "additional" object:
				// - Can be used to store metadata besides data entries.
				// - Has link to parent additional object.
				// TODO: Remove child specific data from parent additional, when child is deleted.

				if (!oAdditional) {
					var oParentAdditional;

					if (oStorageParent) {
						// oParentAdditional can be null for non-existent top-level nodes
						// (see clearStorage).

						oParentAdditional = oStorageParent.additional;
					} else {
						// For non-existent keyed parent nodes: collect parent-additional objects,
						// since there can be cases when there are multiple requests which refer
						// to the same parent.

						assert(oNodeMetadata.parent.keyed, "Parent node should be keyed");

						var sParentRequest = this._requestToString(oRequest, true);

						oParentAdditional = oParentAdditionals[sParentRequest];
						if (!oParentAdditional) {
							oParentAdditional = oParentAdditionals[sParentRequest] = {
								parent: null
							};
						}
					}

					oAdditional = {
						parent: oParentAdditional
					};
				}

				oRequestInfo.additional = oAdditional;
				assert(oRequestInfo.additional, "oRequestInfo.additional should be set");

				if (!oStorageChild) {
					// Storage: node not present or reload needed:
					// - If the parent key is new, then we can't load child, since it is not
					//   exist yet. In this case, we execute a special request (backendFetchEmptyRequest)
					//   to retrieve data.
					// - Request methods (backendFetchRequest and backendFetchEmptyRequest) can
					//   supply data immediately to suppress backend fetch.
					if (oNodeMetadata.name != "Phrase") {
						var oBackendRequestObj = (!oNodeMetadata.parent || oParentKey[CREATE_KEYFIELD] == null) ? oNodeMetadata.backendFetchRequest(
							oParentKey, oAdditional) : oNodeMetadata.backendFetchEmptyRequest(oParentKey, oAdditional);

						var oBackendRequest = oBackendRequestObj.request;
						var oBackendResponse = oBackendRequestObj.response;
					} else {
						var oBackendRequest = oRequest;
						var oBackendResponse = null;
					}

					if (oBackendRequest) {
						// Request will be executed on backend to fetch data.

						assert(!oBackendResponse, "oBackendResponse should be unset");
						aBackendRequests.push(oBackendRequest);

					} else {
						// Immediate response, backend fetch suppressed. Put into fetchResponseEntries.

						assert(oBackendResponse, "oBackendResponse should be set");
						oRequestInfo.fetchResponseEntries = oBackendResponse.entries;
					}
				} else {
					// Storage: node present. Put into storageResponseChild.

					oRequestInfo.storageResponseChild = oStorageChild;
				}
			} else {
				// Handle backend passthru request.

				var oBackendRequest = oRequest.backendRequest;
				aBackendRequests.push(oBackendRequest);
			}
		}

		//dynamic properties
		if (oNodeMetadata.name != "Phrase" && oNodeMetadata.level == 1) {
			var vatlistBackendRequest = this._getComponent().getODataManager().requestForVatlist(oParentKey);
			aBackendRequests.push(vatlistBackendRequest);
		}
		//dynamic properties
		// Execute requests on backend, if necessary. Storage update will
		// be done in fBackendCallback.

		var fBackendCallback = jQuery.proxy(this._executeFetchRequestsContinue, this, aRequests, aRequestInfos, fCallback);

		if (aBackendRequests.length > 0)
			this._backendExecuteFetchRequests(aBackendRequests, fBackendCallback);
		else
			fBackendCallback(null);
	};

	ModelManager.prototype.detach = function (oAttachInfo) {
		// If there was a call to ModelManager.clearStorage, then unsubscription
		// is not needed.

		if (!oAttachInfo.aliveObj.alive)
			return;

		var aChangeListeners = oAttachInfo.changeListeners;
		var fChangeListener = oAttachInfo.changeListener;

		var i = aChangeListeners.indexOf(fChangeListener);
		assert(i >= 0, "fChangeListener should be in aChangeListeners");

		aChangeListeners.splice(i, 1);
	};

	ModelManager.prototype.isKeyCreated = function (oKey) {
		var bCreated = (oKey[CREATE_KEYFIELD] != null);
		return bCreated;
	};

	ModelManager.prototype.getEntryStatus = function (oEntry) {
		var oAdmin = oEntry[ModelManagerAdmin.Prefix];
		var bDeleted = oAdmin[ModelManagerAdmin.PropName.Deleted];
		var sIntStatus = oAdmin[ModelManagerAdmin.PropName.IntStatus];

		// Calculate external entry status.

		var sStatus = null;

		switch (sIntStatus) {
		case ModelManagerIntStatus.Empty:
			assert(!bDeleted, "bDeleted should be cleared");
			sStatus = ModelManagerStatus.Empty;
			break;

		case ModelManagerIntStatus.New:
			assert(!bDeleted, "bDeleted should be cleared");
			sStatus = ModelManagerStatus.New;
			break;

		case ModelManagerIntStatus.Modified:
			sStatus = bDeleted ? ModelManagerStatus.Deleted : ModelManagerStatus.Modified;
			break;

		case ModelManagerIntStatus.Unchanged:
			sStatus = bDeleted ? ModelManagerStatus.Deleted : ModelManagerStatus.Unchanged;
			break;

		default:
			assert(false, "sIntStatus is unknown");
		}

		assert(sStatus != null, "sStatus should be set");
		return sStatus;
	};

	ModelManager.prototype.createSaveInfo = function (bSuccess, aEntryErrorInfos) {
		var oSaveInfo = {
			success: bSuccess,
			entryErrorInfos: aEntryErrorInfos
		};

		return oSaveInfo;
	};

	ModelManager.prototype._init = function () {
		// Initialize ModelManager: it is delayed to give chance to extension
		// class to load itself.

		// Parse node info to metadata.

		this._oNodeMetadatas = {};

		var oNodeInfos = this._getNodeInfos();
		this._parseNodeInfos(null, oNodeInfos, 0);

		// Generate methods.

		this._generateMethods();

		// Initialize node storage.

		this.clearStorage();
	};

	ModelManager.prototype._parseNodeInfos = function (oParentNodeMetadata, oNodeInfos, iLevel) {
		var oNodeMetadatas = {};

		if (oNodeInfos) {
			for (var sNodeName in oNodeInfos) {
				var oNodeInfo = oNodeInfos[sNodeName];
				var oNodeMetadata = this._parseNodeInfo(oParentNodeMetadata, sNodeName, oNodeInfo, iLevel);

				oNodeMetadatas[oNodeMetadata.name] = oNodeMetadata;
			}
		}

		return oNodeMetadatas;
	};

	ModelManager.prototype._parseNodeInfo = function (oParentNodeMetadata, sNodeName, oNodeInfo, iLevel) {
		// FIXME: validate checks.
		// Check node name.

		assert(sNodeName != ROOT.NodeName, sNodeName + ": reserved node name should not be used");
		assert(!this._oNodeMetadatas[sNodeName], sNodeName + ": node name should be unique");

		// Check node keys.

		var aNodeKeyFields = oNodeInfo.keyFields;
		assert(aNodeKeyFields && aNodeKeyFields.length > 0, sNodeName + ": key fields should be defined");

		// Check for keyed node.

		var bKeyed = oNodeInfo.keyed ? true : false;
		if (bKeyed)
			assert(!oParentNodeMetadata, sNodeName + ": keyed node should not have parent");

		// Check implementation funcs.

		var fBackendFetchRequest = oNodeInfo.backendFetchRequest ? oNodeInfo.backendFetchRequest : null;
		if (bKeyed)
			assert(!fBackendFetchRequest, sNodeName + ": keyed node should not have fetch method");
		else
			assert(fBackendFetchRequest, sNodeName + ": non-keyed node should have fetch method");

		var fBackendFetchEmptyRequest = oNodeInfo.backendFetchEmptyRequest ? oNodeInfo.backendFetchEmptyRequest : null;
		if (oParentNodeMetadata && oParentNodeMetadata.backendCreateRequest)
			assert(fBackendFetchEmptyRequest, sNodeName + ": node should have fetch empty method");
		else
			assert(!fBackendFetchEmptyRequest, sNodeName + ": node should not have fetch empty method");

		var fBackendCreateRequest = oNodeInfo.backendCreateRequest ? oNodeInfo.backendCreateRequest : null;
		if (bKeyed)
			assert(!fBackendCreateRequest, sNodeName + ": keyed node should not have create method");

		var fBackendUpdateRequest = oNodeInfo.backendUpdateRequest ? oNodeInfo.backendUpdateRequest : null;
		if (bKeyed)
			assert(!fBackendUpdateRequest, sNodeName + ": keyed node should not have update method");

		var fBackendDeleteRequest = oNodeInfo.backendDeleteRequest ? oNodeInfo.backendDeleteRequest : null;
		if (bKeyed)
			assert(!fBackendDeleteRequest, sNodeName + ": keyed node should not have delete method");

		var fPrepareEntry = oNodeInfo.prepareEntry ? oNodeInfo.prepareEntry : null;
		if (!fBackendCreateRequest)
			assert(!fPrepareEntry, sNodeName + ": node should not have prepareentry method");

		var fGetFieldNames = oNodeInfo.getFieldNames ? oNodeInfo.getFieldNames : null;
		if (fBackendCreateRequest || fBackendUpdateRequest || fBackendDeleteRequest)
			assert(fGetFieldNames, sNodeName + ": node should have fieldnames method");

		var fGetErrorLabel = oNodeInfo.getErrorLabel ? oNodeInfo.getErrorLabel : null;
		if (fBackendCreateRequest || fBackendUpdateRequest || fBackendDeleteRequest)
			assert(fGetErrorLabel, sNodeName + ": node should have errorlabel method");

		var fForceReload = oNodeInfo.forceReload ? oNodeInfo.forceReload : null;
		if (fForceReload)
			assert(fBackendCreateRequest || fBackendUpdateRequest || fBackendDeleteRequest, sNodeName +
				": node should not have forcereload method");

		var fIsSingleEntry = oNodeInfo.isSingleEntry ? oNodeInfo.isSingleEntry : null;
		if (fIsSingleEntry)
			assert(fBackendCreateRequest || fBackendDeleteRequest, sNodeName + ": node should not have issingleentry method");

		var bAutoGrow = oNodeInfo.autoGrow ? true : false;
		if (!fBackendCreateRequest)
			assert(!bAutoGrow, sNodeName + ": node should not have autogrow enabled");

		var bResetOnDelete = oNodeInfo.resetOnDelete ? true : false;
		if (!fBackendDeleteRequest)
			assert(!bResetOnDelete, sNodeName + ": node should not have resetondelete enabled");

		// Build node metadata.

		var oNodeMetadata = {
			name: sNodeName, // Node name
			level: iLevel, // Level
			parent: oParentNodeMetadata, // Parent node
			keyFields: aNodeKeyFields, // List of key-fields
			keyed: bKeyed, // Keyed or normal node
			backendFetchRequest: fBackendFetchRequest, // Fetch entries using existent parent key
			backendFetchEmptyRequest: fBackendFetchEmptyRequest, // Fetch entries using non-existent (not yet committed) parent key
			backendCreateRequest: fBackendCreateRequest, // Create entry
			backendUpdateRequest: fBackendUpdateRequest, // Update entry
			backendDeleteRequest: fBackendDeleteRequest, // Delete entry
			prepareEntry: fPrepareEntry, // Prepare entry for create, autogrow and STORAGE_EMPTY (optional if backendCreateRequest present), key change not allowed
			getFieldNames: fGetFieldNames, // Get field names
			getErrorLabel: fGetErrorLabel, // Get error label
			forceReload: fForceReload, // Force reload on change
			isSingleEntry: fIsSingleEntry, // Only single entry is permitted (used to control create button state, see _isCreateEnabled)
			autoGrow: bAutoGrow, // Autogrow enabled
			resetOnDelete: bResetOnDelete, // Deletion mark for EMPTY and NEW entries: reset entry, after save but before reload for DELETED entries: keep entry on UI
			// (this works only for tables, where entry creation is not possible, since NEW entries created by user don't have original data)
			collectionMethods: {} // Methods can be called from ModelManagerCollection
		};

		this._oNodeMetadatas[oNodeMetadata.name] = oNodeMetadata;

		// Recurse into children.

		oNodeMetadata.nodes = this._parseNodeInfos(oNodeMetadata, oNodeInfo.nodes, iLevel + 1);

		return oNodeMetadata;
	};

	ModelManager.prototype._generateMethods = function () {
		for (var sNodeName in this._oNodeMetadatas) {
			var oNodeMetadata = this._oNodeMetadatas[sNodeName];
			assert(sNodeName == oNodeMetadata.name, "Node name mismatch");
			var oParentNodeMetadata = oNodeMetadata.parent;
			var sParentNodeName = oParentNodeMetadata ? oParentNodeMetadata.name : null;
			var bKeyed = oNodeMetadata.keyed;
			var bHaveChild = this._haveChildNode(oNodeMetadata);

			// fFuncImplGenerate is necessary to capture value of
			// oNodeMetadata to avoid closure.

			// Generate fetch request method.

			if (oNodeMetadata.backendFetchRequest) {
				var sFuncName = "requestForFetch" + sNodeName;
				if (oParentNodeMetadata)
					sFuncName += "By" + sParentNodeName + "Key";

				var fFuncImplGenerate = function () {
					var _oNodeMetadata = oNodeMetadata;

					var fFuncImpl = oParentNodeMetadata ?
						function (oParentKey, bReload) {
							var oRequest = this._requestForFetch(_oNodeMetadata, oParentKey, bReload);
							return oRequest;
						} :
						function (bReload) {
							var oRequest = this._requestForFetch(_oNodeMetadata, null, bReload);
							return oRequest;
						};

					return fFuncImpl;
				};

				this._generateMethod(sFuncName, fFuncImplGenerate());
			}

			// Generate create method.
			// TODO_FUTURE: since we have ModelManagerCollection.create, do we need to keep this method?

			if (oNodeMetadata.backendCreateRequest) {
				var sFuncName = "create" + sNodeName;
				if (oParentNodeMetadata)
					sFuncName += "By" + sParentNodeName + "Key";

				oNodeMetadata.collectionMethods.create = jQuery.proxy(this._create, this, oNodeMetadata);

				var fFuncImplGenerate = function () {
					var _oNodeMetadata = oNodeMetadata;

					var fFuncImpl = oParentNodeMetadata ?
						function (oParentKey, bAutoGrowEntry, oAutoGrowEntry, oNewEntry) {
							this._create(_oNodeMetadata, oParentKey, bAutoGrowEntry, oAutoGrowEntry, oNewEntry);
						} :
						function (bAutoGrowEntry, oAutoGrowEntry, oNewEntry) {
							this._create(_oNodeMetadata, null, bAutoGrowEntry, oAutoGrowEntry, oNewEntry);
						};

					return fFuncImpl;
				};

				this._generateMethod(sFuncName, fFuncImplGenerate());
			}

			// Generate delete method.
			// TODO_FUTURE: since we have ModelManagerCollection.delete, do we need to keep this method?

			if (oNodeMetadata.backendCreateRequest || oNodeMetadata.backendDeleteRequest) {
				var sFuncName = "delete" + sNodeName + "By";
				if (oParentNodeMetadata)
					sFuncName += sParentNodeName + "KeyAnd";
				sFuncName += "Index";

				oNodeMetadata.collectionMethods.delete = jQuery.proxy(this._delete, this, oNodeMetadata);

				var fFuncImplGenerate = function () {
					var _oNodeMetadata = oNodeMetadata;

					var fFuncImpl = oParentNodeMetadata ?
						function (oParentKey, iIndex, bDeleted) {
							this._delete(_oNodeMetadata, oParentKey, iIndex, bDeleted);
						} :
						function (iIndex, bDeleted) {
							this._delete(_oNodeMetadata, null, iIndex, bDeleted);
						};

					return fFuncImpl;
				};

				this._generateMethod(sFuncName, fFuncImplGenerate());
			}

			// Generate need save method.
			// TODO: Only for nodes which are modifiable/or have modifiable children.

			if (!oParentNodeMetadata) {
				var sFuncName = "needSaveFor" + sNodeName;
				if (bKeyed)
					sFuncName += "ByKey";

				var fFuncImplGenerate = function () {
					var _oNodeMetadata = oNodeMetadata;

					var fFuncImpl = bKeyed ?
						function (oKey) {
							var bNeedSave = this._needSave(_oNodeMetadata, oKey);
							return bNeedSave;
						} :
						function () {
							var bNeedSave = this._needSave(_oNodeMetadata, null);
							return bNeedSave;
						};

					return fFuncImpl;
				};

				this._generateMethod(sFuncName, fFuncImplGenerate());
			}

			// Generate save method.
			// TODO: Only for nodes which are modifiable/or have modifiable children.

			if (!oParentNodeMetadata) {
				var sFuncName = "save" + sNodeName;
				if (bKeyed)
					sFuncName += "ByKey";

				var fFuncImplGenerate = function () {
					var _oNodeMetadata = oNodeMetadata;

					var fFuncImpl = bKeyed ?
						function (oKey, fSaveDone) {
							this._save(_oNodeMetadata, oKey, fSaveDone);
						} :
						function (fSaveDone) {
							this._save(_oNodeMetadata, null, fSaveDone);
						};

					return fFuncImpl;
				};

				this._generateMethod(sFuncName, fFuncImplGenerate());
			}

			// Generate reset method:
			// - It will restore the state which was present at the time of fetch.
			// - Silently discard changes (non-saved entries).
			// - Fields which are set with bNoUpdate = true, will be resetted as well.
			// TODO: Only for nodes which are modifiable/or have modifiable children.

			if (!oParentNodeMetadata) {
				var sFuncName = "reset" + sNodeName;
				if (bKeyed)
					sFuncName += "ByKey";

				var fFuncImplGenerate = function () {
					var _oNodeMetadata = oNodeMetadata;

					var fFuncImpl = bKeyed ?
						function (oKey) {
							this._reset(_oNodeMetadata, oKey);
						} :
						function () {
							this._reset(_oNodeMetadata, null);
						};

					return fFuncImpl;
				};

				this._generateMethod(sFuncName, fFuncImplGenerate());
			}

			// Generate change event attach method.
			// TODO_FUTURE: since we have ModelManagerCollection.attachChange, do we need to keep this method?

			if (!bKeyed) {
				var sFuncName = "attachChangeFor" + sNodeName;
				if (oParentNodeMetadata)
					sFuncName += "By" + sParentNodeName + "Key";

				oNodeMetadata.collectionMethods.attachChange = jQuery.proxy(this._attachChangeFor, this, oNodeMetadata);

				var fFuncImplGenerate = function () {
					var _oNodeMetadata = oNodeMetadata;

					var fFuncImpl = oParentNodeMetadata ?
						function (oParentKey, fChangeListener) {
							var oAttachInfo = this._attachChangeFor(_oNodeMetadata, oParentKey, fChangeListener);
							return oAttachInfo;
						} :
						function (fChangeListener) {
							var oAttachInfo = this._attachChangeFor(_oNodeMetadata, null, fChangeListener);
							return oAttachInfo;
						};

					return fFuncImpl;
				};

				this._generateMethod(sFuncName, fFuncImplGenerate());
			}

			// Generate key compare method.

			{
				var sFuncName = "compare" + sNodeName + "Key";

				var fFuncImplGenerate = function () {
					var _oNodeMetadata = oNodeMetadata;

					var fFuncImpl = function (oKey1, oKey2) {
						var bEqual = this._compareKey(_oNodeMetadata, oKey1, oKey2);
						return bEqual;
					};

					return fFuncImpl;
				};

				this._generateMethod(sFuncName, fFuncImplGenerate());
			}

			// Generate get parent key method.

			if (oParentNodeMetadata && bHaveChild) {
				var sFuncName = "getParent" + sParentNodeName + "KeyBy" + sNodeName + "Key";

				var fFuncImplGenerate = function () {
					var _oNodeMetadata = oNodeMetadata;

					var fFuncImpl = function (oKey) {
						var oParentKey = this._getParentKey(_oNodeMetadata, oKey);
						return oParentKey;
					};

					return fFuncImpl;
				};

				this._generateMethod(sFuncName, fFuncImplGenerate());
			}

			// Generate key extract method.

			{
				var sFuncName = "extract" + sNodeName + "Key";

				oNodeMetadata.collectionMethods.extractParentKey = oParentNodeMetadata ? jQuery.proxy(this._extractKey, this, oParentNodeMetadata) :
					null;

				var fFuncImplGenerate = function () {
					var _oNodeMetadata = oNodeMetadata;

					var fFuncImpl = function (oData) {
						var oKey = this._extractKey(_oNodeMetadata, oData);
						return oKey;
					};

					return fFuncImpl;
				};

				this._generateMethod(sFuncName, fFuncImplGenerate());
			}

			// Generate create enabled method.
			// TODO_FUTURE: since we have ModelManagerCollection.isCreateEnabled, do we need to keep this method?

			if (oNodeMetadata.isSingleEntry) {
				var sFuncName = "isCreate" + sNodeName + "Enabled";
				if (oParentNodeMetadata)
					sFuncName += "By" + sParentNodeName + "Key";

				oNodeMetadata.collectionMethods.isCreateEnabled = jQuery.proxy(this._isCreateEnabled, this, oNodeMetadata);

				var fFuncImplGenerate = function () {
					var _oNodeMetadata = oNodeMetadata;

					var fFuncImpl = oParentNodeMetadata ?
						function (oParentKey) {
							var bIsCreateEnabled = this._isCreateEnabled(_oNodeMetadata, oParentKey);
							return bIsCreateEnabled;
						} :
						function () {
							var bIsCreateEnabled = this._isCreateEnabled(_oNodeMetadata, null);
							return bIsCreateEnabled;
						};

					return fFuncImpl;
				};

				this._generateMethod(sFuncName, fFuncImplGenerate());
			}
		}
	};

	ModelManager.prototype._generateMethod = function (sFuncName, fFuncImpl) {
		// Add instance method. Don't patch prototype, since multiple child objects can have
		// different node model, although child class names are the same.

		this[sFuncName] = fFuncImpl;
	};

	ModelManager.prototype._executeFetchRequestsContinue = function (aRequests, aRequestInfos, fCallback, oBackendExecuteData) {
		// Create empty result object.

		var oExecuteData = {
			allSuccess: true,
			error: null,
			responses: []
		};

		var oBackendExecuteError = null;
		var aBackendExecuteResponses = null;

		if (oBackendExecuteData) {
			oBackendExecuteError = oBackendExecuteData.error;
			aBackendExecuteResponses = oBackendExecuteData.responses;
		}

		if (oBackendExecuteError) {
			// Check top-level error.

			oExecuteData.error = oBackendExecuteError;
			oExecuteData.allSuccess = false;
		} else {
			// Process aRequestInfos. When processing normal requests:
			// - We need to test if parent node is still exists (_checkStorageParent),
			//   since requests are processed starting from parent to child (see aRequestInfos
			//   sort in executeFetchRequests).
			// - Nodes can became orphaned if parent doesn't exist anymore.

			var iBackendExecuteResponsesIndex = 0;

			for (var i = 0; i < aRequestInfos.length; i++) {
				var oRequestInfo = aRequestInfos[i];
				var oRequest = oRequestInfo.request;
				var oRequestInfoError = null;
				var oRequestInfoResponse = null;

				if (!oRequest.passthru) {
					// Handle normal request.

					var oNodeMetadata = oRequest.nodeMetadata;
					var oParentKey = oRequest.parentKey;

					var oStorageChild = null;
					var oAdditional = oRequestInfo.additional;
					assert(oAdditional, "oAdditional should be set");

					var bCheckStorageParent = this._checkStorageParent(oNodeMetadata, oParentKey);

					if (oRequestInfo.fetchResponseEntries) {
						// Immediate response.

						if (bCheckStorageParent) {
							// Put data into storage.

							var aBackendEntries = oRequestInfo.fetchResponseEntries;
							oStorageChild = this._executeFetchRequestsPutIntoStorage(oNodeMetadata, oParentKey, aBackendEntries, oAdditional);
						}
					} else if (oRequestInfo.storageResponseChild) {
						// Storage node present.

						if (bCheckStorageParent)
							oStorageChild = oRequestInfo.storageResponseChild;
					} else {
						// Data fetched from backend. Special handling: error will be
						// suppressed if parent node doesn't exist anymore.

						var oBackendExecuteResponse = aBackendExecuteResponses[iBackendExecuteResponsesIndex++];
						if (aRequestInfos[i].request.nodeMetadata.name == "DocLink") {
							bCheckStorageParent = true;
						}
						if (bCheckStorageParent) {
							var oError = oBackendExecuteResponse.error;
							if (oError) {
								oRequestInfoError = oError;

								// If the autogrow entry has been created on backend (because it contains child entries)
								// and reload fails, then recreate autogrow entry.

								if (oRequestInfo.reload)
									this._executeFetchRequestsReloadCreateAutogrow(oNodeMetadata, oParentKey);
							} else {
								// Put data into storage.
								if (oNodeMetadata.name != "Phrase") {
									var aBackendEntries = oBackendExecuteResponse.response.entries;
								} else {
									var aBackendEntries = oBackendExecuteResponse.response;
								}
								oStorageChild = this._executeFetchRequestsPutIntoStorage(oNodeMetadata, oParentKey, aBackendEntries, oAdditional);
							}
						}
					}

					if (!oRequestInfoError)
						oRequestInfoResponse = oStorageChild ? oStorageChild.collection : null;
				} else {
					// Handle backend passthru request.

					var oBackendExecuteResponse = aBackendExecuteResponses[iBackendExecuteResponsesIndex++];

					var oError = oBackendExecuteResponse.error;
					if (oError)
						oRequestInfoError = oError;
					else
						oRequestInfoResponse = oBackendExecuteResponse.response;
				}

				oRequestInfo.error = oRequestInfoError;
				oRequestInfo.response = oRequestInfoResponse;

				if (oRequestInfoError)
					oExecuteData.allSuccess = false;
			}

			// Construct responses. Grow execute responses array.

			var aExecuteResponses = oExecuteData.responses;

			for (var i = 0; i < aRequests.length; i++)
				aExecuteResponses.push(null);

			// Undo de-duplication of requests.

			for (var i = 0; i < aRequestInfos.length; i++) {
				var oRequestInfo = aRequestInfos[i];
				var aRequestIndexes = oRequestInfo.requestIndexes;
				var oExecuteResponse = {
					error: oRequestInfo.error,
					response: oRequestInfo.response
				};

				for (var j = 0; j < aRequestIndexes.length; j++) {
					var iRequestIndex = aRequestIndexes[j];
					aExecuteResponses[iRequestIndex] = oExecuteResponse;
				}
			}
		}

		//this._executeFetchRequestsEnd();

		// Invoke callback.

		if (fCallback) {
			fCallback(oExecuteData, oBackendExecuteData);
		}

	};

	ModelManager.prototype._executeFetchRequestsPutIntoStorage = function (oNodeMetadata, oParentKey, aBackendEntries, oAdditional) {
		var oStorageParent = this._getStorageParent(oNodeMetadata, oParentKey, true);
		if (!oStorageParent) {
			// For keyed parent node: it is possible, that the parent node
			// doesn't exist in storage. Create it.

			var oParentNodeMetadata = oNodeMetadata.parent;
			assert(oParentNodeMetadata.keyed, "Parent node should be keyed");

			var oParentAdditional = oAdditional.parent;
			var oParentKeyCopy = this._extractKey(oParentNodeMetadata, oParentKey);
			oStorageParent = this._createStorageParent(oParentNodeMetadata, oParentKeyCopy, null, oParentAdditional);
		}

		var oParentKeyRef = oStorageParent.keyRef;
		var bHaveChild = this._haveChildNode(oNodeMetadata);

		// Prepare entries.
		// TODO: In case of missing key fields in aBackendEntries, display error.

		for (var i = 0; i < aBackendEntries.length; i++) {
			var oBackendEntry = aBackendEntries[i];

			// Handle entries with EMPTY status. Apply the same semantics here,
			// as for created entries (see _create).

			if (oBackendEntry[ModelManagerConst.Empty]) {
				delete oBackendEntry[ModelManagerConst.Empty];

				var aTopBackendEntries = aBackendEntries.slice(0, i);
				var oBackendEntryEmpty = this._createEntry(oNodeMetadata, ModelManagerIntStatus.Empty, true, aTopBackendEntries, oBackendEntry,
					oAdditional);
				aBackendEntries[i] = oBackendEntryEmpty;
			} else {
				this._prepareEntry(oBackendEntry, ModelManagerIntStatus.Unchanged, true);
			}
		}

		var aNewEntries = aBackendEntries;

		// Handle autogrow entry.

		if (this._getAutoGrowEnabled(oNodeMetadata)) {
			var oAutoGrowEntry = this._createAutoGrowEntry(oNodeMetadata, aNewEntries, null, oAdditional);
			aNewEntries.push(oAutoGrowEntry);
		}

		// Look for child node.
		if (oNodeMetadata.name != "Phrase") {
			var oStorageChild = this._getStorageChild(oStorageParent, oNodeMetadata);
		} else {
			var oStorageChild;
		}

		if (!oStorageChild) {
			// Child: not exists.

			oStorageChild = this._createStorageChild(oStorageParent, oNodeMetadata, aNewEntries, oAdditional);

			// If we have any child nodes, then we have to create parent
			// nodes as well.
			// TODO: In case of duplicated key, display error.

			if (bHaveChild) {
				for (var i = 0; i < aNewEntries.length; i++) {
					var oNewEntry = aNewEntries[i];
					this._createStorageParent(oNodeMetadata, oNewEntry, oParentKeyRef, oAdditional);
				}
			}
		} else {
			// Child: already exists.

			var oModel = oStorageChild.model;
			assert(oModel, "oModel should be set");
			var aOldEntries = oModel.getData();
			assert(aOldEntries, "aOldEntries should be set");

			// Map old entries to keys.

			var oOldEntries = {};

			for (var i = 0; i < aOldEntries.length; i++) {
				var oOldEntry = aOldEntries[i];
				var sOldKey = this._keyToString(oNodeMetadata, oOldEntry);

				oOldEntries[sOldKey] = oOldEntry;
			}

			// Calculate delta between old<->new keys. The reason why we simply not
			// store aNewEntries, because references for keyRef and parentKeyRef fields
			// needs to be kept.

			var aNewEntriesToStore = [];

			for (var i = 0; i < aNewEntries.length; i++) {
				var oNewEntry = aNewEntries[i];
				var sNewKey = this._keyToString(oNodeMetadata, oNewEntry);
				var oOldEntry = oOldEntries[sNewKey];

				if (oOldEntry) {
					// New key present in old: entry still present.

					this._clearEntry(oOldEntry, true);
					jQuery.extend(oOldEntry, oNewEntry);
					aNewEntriesToStore.push(oOldEntry);

					delete oOldEntries[sNewKey];
				} else {
					// New key not present in old: new entry.
					// TODO: In case of duplicated key, display error.

					aNewEntriesToStore.push(oNewEntry);

					if (bHaveChild)
						this._createStorageParent(oNodeMetadata, oNewEntry, oParentKeyRef, oAdditional);
				}
			}

			// Remove remaining (old) keys from storage.

			if (bHaveChild) {
				for (var sOldKey in oOldEntries) {
					var oOldKey = oOldEntries[sOldKey];

					this._deleteStorageParent(oNodeMetadata, oOldKey);
				}
			}

			// Update storage child.

			this._updateStorageChild(oStorageChild, aNewEntriesToStore);
		}

		assert(oStorageChild.additional == oAdditional, "Additional data mismatch");

		// Invoke change listeners.

		this._invokeChangeListenersForFetch(oStorageChild);

		return oStorageChild;
	};

	ModelManager.prototype._executeFetchRequestsReloadCreateAutogrow = function (oNodeMetadata, oParentKey) {
		// Lookup node.

		var oStorageParent = this._getStorageParent(oNodeMetadata, oParentKey);
		var oStorageChild = this._getStorageChild(oStorageParent, oNodeMetadata);
		assert(oStorageChild, "oStorageChild should be set");

		var oModel = oStorageChild.model;
		assert(oModel, "oModel should be set");
		var aEntries = oModel.getData();
		assert(aEntries, "aEntries should be set");

		var oAdditional = oStorageChild.additional;
		assert(oAdditional, "oAdditional should be set");

		if (this._getAutoGrowEnabled(oNodeMetadata)) {
			var oAutoGrowEntry = this._lookupAutoGrowEntry(aEntries);
			if (!oAutoGrowEntry) {
				var oAutoGrowEntry = this._createAutoGrowEntry(oNodeMetadata, aEntries, null, oAdditional);
				aEntries.push(oAutoGrowEntry);

				// If we have any child nodes, then we have to
				// create storage parent as well.

				if (this._haveChildNode(oNodeMetadata))
					this._createStorageParent(oNodeMetadata, oAutoGrowEntry, oStorageParent.keyRef, oAdditional);

				this._updateStorageChild(oStorageChild, aEntries);

				// Invoke change listeners.

				this._invokeChangeListenersForFetch(oStorageChild);
			}
		}
	};

	ModelManager.prototype._requestForFetch = function (oNodeMetadata, oParentKey, bReload) {
		// Normal request: fetch node data according to parent key.

		var oRequest = {
			passthru: false,
			nodeMetadata: oNodeMetadata,
			parentKey: oParentKey,
			reload: bReload
		};

		return oRequest;
	};

	ModelManager.prototype._create = function (oNodeMetadata, oParentKey, bAutoGrowEntry, oAutoGrowEntryData, oNewEntryData) {
		// Lookup node.

		var oStorageParent = this._getStorageParent(oNodeMetadata, oParentKey);
		var oStorageChild = this._getStorageChild(oStorageParent, oNodeMetadata);
		assert(oStorageChild, "oStorageChild should be set");

		var oModel = oStorageChild.model;
		assert(oModel, "oModel should be set");
		var aEntries = oModel.getData();
		assert(aEntries, "aEntries should be set");

		var oAdditional = oStorageChild.additional;
		assert(oAdditional, "oAdditional should be set");

		var bAutoGrow = this._getAutoGrowEnabled(oNodeMetadata);
		var oNewEntry = null;

		if (bAutoGrowEntry) {
			assert(!oNewEntryData, "oNewEntryData should be null");

			if (bAutoGrow) {
				var oAutoGrowEntry = this._lookupAutoGrowEntry(aEntries);
				if (!oAutoGrowEntry) {
					// Last entry updated (it has become NEW), create autogrow entry.

					oNewEntry = this._createAutoGrowEntry(oNodeMetadata, aEntries, oAutoGrowEntryData, oAdditional);
				} else if (oAutoGrowEntryData) {
					// Update autogrow entry.

					jQuery.extend(oAutoGrowEntry, oAutoGrowEntryData);
					this._updateStorageChild(oStorageChild, aEntries);
				}
			}
		} else {
			// Create entry, if autogrow entry:
			// - Exist: autogrow entry will become NEW entry, and another autogrow entry will be created.
			//
			//   +---------------------+                                             +--------------------------------------+
			//   | Existing entries    |                                             | Existing entries                     |
			//   | ...                 | create(oAutoGrowEntryData2, oNewEntryData2) | ...                                  |
			//   +---------------------+ ->                                          +--------------------------------------+
			//   | oAutoGrowEntryData1 |                                             | oAutoGrowEntryData1 + oNewEntryData2 |
			//   +---------------------+                                             +--------------------------------------+
			//                                                                       | oAutoGrowEntryData2                  |
			//                                                                       +--------------------------------------+
			//
			// - Not exist: create a NEW entry.
			//
			//   +---------------------+                                             +--------------------------------------+
			//   | Existing entries    |                                             | Existing entries                     |
			//   | ...                 | create(oAutoGrowEntryData1, oNewEntryData1) | ...                                  |
			//   +---------------------+ ->                                          +--------------------------------------+
			//                                                                       | oAutoGrowEntryData1 + oNewEntryData1 |
			//                                                                       +--------------------------------------+

			var oAutoGrowEntry = null;

			if (bAutoGrow) {
				oAutoGrowEntry = this._lookupAutoGrowEntry(aEntries);
				assert(oAutoGrowEntry, "oAutoGrowEntry should be set");
			}

			if (oAutoGrowEntry) {
				// Set entry status.

				if (oNewEntryData)
					jQuery.extend(oAutoGrowEntry, oNewEntryData);

				this._setEntryIntStatus(oAutoGrowEntry, ModelManagerIntStatus.New);

				// Create autogrow entry.

				oNewEntry = this._createAutoGrowEntry(oNodeMetadata, aEntries, oAutoGrowEntryData, oAdditional);
			} else {
				// Create NEW entry.

				var _oNewEntryData = {};

				if (oAutoGrowEntryData)
					jQuery.extend(_oNewEntryData, oAutoGrowEntryData);

				if (oNewEntryData)
					jQuery.extend(_oNewEntryData, oNewEntryData);

				oNewEntry = this._createEntry(oNodeMetadata, ModelManagerIntStatus.New, false, aEntries, _oNewEntryData, oAdditional);
			}

			assert(oNewEntry, "oNewEntry should be set");
		}

		if (oNewEntry) {
			aEntries.push(oNewEntry);

			// If we have any child nodes, then we have to
			// create storage parent as well.

			if (this._haveChildNode(oNodeMetadata))
				this._createStorageParent(oNodeMetadata, oNewEntry, oStorageParent.keyRef, oAdditional);

			this._updateStorageChild(oStorageChild, aEntries);

			// Invoke event handler on entry count change.

			this._invokeChangeListenersForCount(oStorageChild);
		}
	};

	ModelManager.prototype._delete = function (oNodeMetadata, oParentKey, iIndex, bDeleted) {
		// Lookup node.
		// TODO: instead of index, use entry key?

		var oStorageParent = this._getStorageParent(oNodeMetadata, oParentKey);
		var oStorageChild = this._getStorageChild(oStorageParent, oNodeMetadata);
		assert(oStorageChild, "oStorageChild should be set");

		var oModel = oStorageChild.model;
		assert(oModel, "oModel should be set");
		var aEntries = oModel.getData();
		assert(aEntries, "aEntries should be set");

		var oAdditional = oStorageChild.additional;
		assert(oAdditional, "oAdditional should be set");

		assert(iIndex < aEntries.length, "iIndex should be < aEntries.length");
		var oEntry = aEntries[iIndex];

		var oAdmin = oEntry[ModelManagerAdmin.Prefix];
		var bModelDeleted = oAdmin[ModelManagerAdmin.PropName.Deleted];
		var bPrevModelDeleted = bModelDeleted;

		if (bModelDeleted != bDeleted) {
			var bTriggerCount = false;

			if (bDeleted) {
				var sIntStatus = oAdmin[ModelManagerAdmin.PropName.IntStatus];

				// Delete behaviour depends on entry status, see below.

				switch (sIntStatus) {
				case ModelManagerIntStatus.Empty:
				case ModelManagerIntStatus.New:
					var bAutoGrow = this._getAutoGrowEnabled(oNodeMetadata);
					var bAutoGrowEntry = oAdmin[ModelManagerAdmin.PropName.AutoGrowEntry];

					if (sIntStatus == ModelManagerIntStatus.Empty && bAutoGrowEntry) {
						// Autogrow entry: it is immutable, do nothing.

						assert(bAutoGrow, "autoGrow is not enabled for node");
					} else {
						// Not autogrow entry.

						if (!oNodeMetadata.resetOnDelete) {
							// Remove entry.

							aEntries.splice(iIndex, 1);

							// Delete storage parent recursively.

							if (this._haveChildNode(oNodeMetadata))
								this._deleteStorageParent(oNodeMetadata, oEntry);

							bModelDeleted = true;

							// Handle autogrow entry. This can be used to refresh some fields
							// (e.g. sort).

							if (bAutoGrow) {
								var oAutoGrowEntry = this._lookupAutoGrowEntry(aEntries);
								assert(oAutoGrowEntry, "oAutoGrowEntry should be set");

								var iLength = aEntries.length;
								assert(iLength >= 1, "iLength should be >= 1");

								var aTopEntries = aEntries.slice(0, iLength - 1);
								this._updateAutoGrowEntry(oNodeMetadata, aTopEntries, oAutoGrowEntry, oAdditional);
							}

							// Delay event after model update (see _updateStorageChild below).

							bTriggerCount = true;
						} else {
							// Reset entry.

							this._resetEntry(oNodeMetadata, oEntry);

							// Set entry status.

							this._setEntryIntStatus(oEntry, ModelManagerIntStatus.Empty);

							// Clear entry error.

							this._clearEntryError(oEntry);
						}
					}
					break;

				case ModelManagerIntStatus.Modified:
				case ModelManagerIntStatus.Unchanged:
					// Mark entry for delete.

					bModelDeleted = true;
					break;

				default:
					assert(false, "sIntStatus is unknown");
				}
			} else {
				// Undelete.

				bModelDeleted = false;
			}

			// Update model.

			oAdmin[ModelManagerAdmin.PropName.Deleted] = bModelDeleted;

			this._updateStorageChild(oStorageChild, aEntries);

			// Invoke event handler on delete change.

			if (bPrevModelDeleted != bModelDeleted) {
				var oEventParam = {
					modelDeleted: bModelDeleted,
					key: this._extractKey(oNodeMetadata, oEntry)
				};
				var oEvent = this._createChangeEvent(ModelManagerChangeType.DeleteChange, oEventParam);

				this._invokeChangeListeners(oStorageChild, oEvent);
			}

			// Invoke event handler on entry count change.

			if (bTriggerCount)
				this._invokeChangeListenersForCount(oStorageChild);
		}
	};

	ModelManager.prototype._needSave = function (oNodeMetadata, oKey) {
		var oCollectInfo = this._collectBackendRequests(oNodeMetadata, oKey);
		var aBackendRequests = oCollectInfo.backendRequests;
		var bNeedSave = (aBackendRequests.length > 0);

		return bNeedSave;
	};

	ModelManager.prototype._save = function (oNodeMetadata, oKey, fSaveDone) {
		var oCollectInfo = this._collectBackendRequests(oNodeMetadata, oKey);
		var aBackendRequests = oCollectInfo.backendRequests;

		var _fSaveDone = function (oSaveInfo) {
			if (fSaveDone)
				fSaveDone(oSaveInfo);
		};

		// Execute requests on backend, if necessary.
		// TODO: Gray out save button if save is not needed.

		if (aBackendRequests.length > 0) {
			this._backendExecuteChangeRequests(aBackendRequests, jQuery.proxy(this._saveContinue, this, oCollectInfo, _fSaveDone));
		} else {
			this._showMessageToast("ModelManager.save.notNeeded");

			// Call status callback.

			var oSaveInfo = this.createSaveInfo(true, []);
			_fSaveDone(oSaveInfo);
		}
	};

	ModelManager.prototype._saveContinue = function (oCollectInfo, fSaveDone, oBackendExecuteData) {
		var that = this;

		// All model updates are postponed to improve performance (see _updateModels).
		// TODO: Group updates by node/parentkey to improve performance even more (to avoid storage lookups).

		if (oBackendExecuteData.allSuccess) {
			// Backend: all changes executed successfully.

			// Clear all UI errors: even if reload fails, it is nicer to
			// not have highlighted fields.

			this._clearAllErrors(oCollectInfo);

			// Update storage:
			// - Process entries in reverse order to avoid parent key inconsistency
			//   (e.g. update child before parent, since child needs unchanged
			//    parent key).
			// - Batch response order should be the same as batch request order.

			var aBackendExecuteResponses = oBackendExecuteData.responses;

			for (var i = aBackendExecuteResponses.length - 1; i >= 0; i--) {
				// No assert for oBackendResponse, since it is optional for update and delete.
				if (aBackendExecuteResponses[i].subRequest.messageKey == "PLMODataManager.error.qual.create" || aBackendExecuteResponses[i].subRequest
					.messageKey == "PLMODataManager.error.quant.create") {
					aBackendExecuteResponses[i].response = null;
				}
				var oBackendExecuteResponse = aBackendExecuteResponses[i];
				var oBackendResponse = oBackendExecuteResponse.response;
				var oEntryInfo = oBackendExecuteResponse.entryInfo;
				assert(oEntryInfo, "oEntryInfo should be set");

				this._processBackendResponse_Success(oBackendResponse, oEntryInfo);
			}

			// Update storage child models.

			this._updateModels(oCollectInfo);

			// Invoke change listeners.

			this._invokeKeyChangeListeners(oCollectInfo);

			// Reload entries, and call status callback after.

			var fReloadDone = function (oReloadInfo) {
				if (oReloadInfo.success)
					that._showMessageToast("ModelManager.save.success");

				var oSaveInfo = that.createSaveInfo(true, []);
				fSaveDone(oSaveInfo);
			};

			this._reloadImpl(oCollectInfo, "ModelManager.error.reloadaftersave", fReloadDone);
		} else {
			// Backend: change execution failed.

			var bShowError = false;
			var aEntryErrorInfos = null;

			if (oBackendExecuteData.error) {
				// Check for top-level error.

				bShowError = true;
			} else {
				aEntryErrorInfos = [];

				// Clear all UI errors.

				this._clearAllErrors(oCollectInfo);

				// Display errors. Don't check for response count here, since the
				// backend can give up processing after some errors.

				var aBackendExecuteResponses = oBackendExecuteData.responses;
				var aBackendExecuteResponsesShowError = [];

				for (var i = 0; i < aBackendExecuteResponses.length; i++) {
					// No assert for oEntryInfo, since for generic error it is not present.

					var oBackendExecuteResponse = aBackendExecuteResponses[i];
					var oError = oBackendExecuteResponse.error;
					assert(oError, "oError should be set");
					var oEntryInfo = oBackendExecuteResponse.entryInfo;

					var oErrorObj = this._processBackendResponse_Error(oError, oEntryInfo);

					if (oErrorObj.showError)
						aBackendExecuteResponsesShowError.push(oBackendExecuteResponse);

					var oEntryErrorInfo = oErrorObj.entryErrorInfo;
					if (oEntryErrorInfo)
						aEntryErrorInfos.push(oEntryErrorInfo);
				}

				// Update storage child models.

				this._updateModels(oCollectInfo);

				// Non-entry specific errors will be displayed in error dialog.

				if (aBackendExecuteResponsesShowError.length > 0) {
					oBackendExecuteData.responses = aBackendExecuteResponsesShowError;
					bShowError = true;
				}
			}

			// Display error dialog (if needed) and call status callback.

			var _fSaveDone = function () {
				var oSaveInfo = that.createSaveInfo(false, aEntryErrorInfos);
				fSaveDone(oSaveInfo);
			};

			if (bShowError)
				Util.showExecuteError(this._oComponent, "ModelManager.error.save", oBackendExecuteData, true, _fSaveDone);
			else
				_fSaveDone();
		}
	};

	ModelManager.prototype._collectBackendRequests = function (oNodeMetadata, oKey) {
		// We support save only for top-level nodes to avoid any issues
		// with parent key status (e.g. new or deleted parent).

		assert(!oNodeMetadata.parent, "Node should be top-level");

		// Collect backend requests needed to save data.

		var aBackendRequests = [];
		var oCollectInfo = {
			createIndexesByNodeName: {},
			createIndex: 0,
			changeInfos: [],
			reloadInfos: []
		};

		// Top-level node (either keyed or non-keyed) should be present in storage.

		if (!oNodeMetadata.keyed) {
			var oCollectBackendRequestsObj = this._collectBackendRequestsImpl(oNodeMetadata, null, oCollectInfo, false);

			aBackendRequests = oCollectBackendRequestsObj.backendRequests;
		} else {
			var oChildNodeMetadatas = oNodeMetadata.nodes;

			for (var sChildNodeName in oChildNodeMetadatas) {
				var oChildNodeMetadata = oChildNodeMetadatas[sChildNodeName];
				var oCollectBackendRequestsObj = this._collectBackendRequestsImpl(oChildNodeMetadata, oKey, oCollectInfo, true);

				aBackendRequests = aBackendRequests.concat(oCollectBackendRequestsObj.backendRequests);
			}
		}

		oCollectInfo.backendRequests = aBackendRequests; // TODO: refactor _collectBackendRequestsImpl to store aBackendRequests into oCollectInfo.

		return oCollectInfo;
	};

	ModelManager.prototype._collectBackendRequestsImpl = function (oNodeMetadata, oParentKeyRef, oCollectInfo, bAllowNoChild) {
		// Lookup node.

		var oStorageParent = this._getStorageParent(oNodeMetadata, oParentKeyRef);
		var oStorageChild = this._getStorageChild(oStorageParent, oNodeMetadata);

		if (!oStorageChild) {
			assert(bAllowNoChild, "oStorageChild should be set");

			// TODO: keep oCollectBackendRequestsObj or switch to list (.backendRequests)?
			var oCollectBackendRequestsObj = {
				backendRequests: []
			};

			return oCollectBackendRequestsObj;
		}

		var oModel = oStorageChild.model;
		assert(oModel, "oModel should be set");
		var aEntries = oModel.getData();

		assert(aEntries, "aEntries should be set");

		var oAdditional = oStorageChild.additional;
		assert(oAdditional, "oAdditional should be set");

		// Create change info object. For code simplification:
		// - Use reference to parent key (oParentKeyRef).
		// - In _processBackendResponse_Success, in case of EMPTY and NEW statuses, keys are
		//   patched. Since, we are using reference here, oChangeInfo.parentKeyRef
		//   will be automatically updated as well.

		var oChangeInfo = {
			nodeMetadata: oNodeMetadata,
			parentKeyRef: oParentKeyRef,
			changedKeys: []
		};

		// Process entries.

		var aBackendRequests = [];
		var oEmptyBackendRequestIndexes = {};

		for (var i = 0; i < aEntries.length; i++) {
			var oEntry = aEntries[i];
			var sStatus = this.getEntryStatus(oEntry);
			var oEntryInfo = { // Entry info is attached to every backend request for mapping request back to entry.
				changeInfo: oChangeInfo,
				index: i
			};
			var bCheckParentKey = false;
			var oBackendRequest = null;

			switch (sStatus) {
			case ModelManagerStatus.Empty:
			case ModelManagerStatus.New:
				var oCreateInfo = this._createCreateInfo(oNodeMetadata, oParentKeyRef, oEntry, oCollectInfo);
				oBackendRequest = oNodeMetadata.backendCreateRequest(oEntryInfo, oCreateInfo, oEntry, oAdditional);
				break;

			case ModelManagerStatus.Modified:
				bCheckParentKey = true;
				oBackendRequest = oNodeMetadata.backendUpdateRequest(oEntryInfo, oEntry, oAdditional);
				break;

			case ModelManagerStatus.Unchanged:
				bCheckParentKey = true;
				break;

			case ModelManagerStatus.Deleted:
				bCheckParentKey = true;
				oBackendRequest = oNodeMetadata.backendDeleteRequest(oEntryInfo, oEntry, oAdditional);
				break;

			default:
				assert(false, "sStatus is unknown");
			}

			if (bCheckParentKey && oNodeMetadata.parent)
				assert(oParentKeyRef[CREATE_KEYFIELD] == null, "Inconsistent parentkey-entry status");

			if (oBackendRequest) {
				if (sStatus == ModelManagerStatus.Empty)
					oEmptyBackendRequestIndexes[i] = aBackendRequests.length;

				aBackendRequests.push(oBackendRequest);
			}
		}

		// Process child entries.

		var oChildNodeMetadatas = oNodeMetadata.nodes;
		var aChildBackendRequests = [];

		for (var i = 0; i < aEntries.length; i++) {
			var oEntry = aEntries[i];
			var sStatus = this.getEntryStatus(oEntry);
			var bRecurse = false;

			// Do recursive scan depending on entry status.

			switch (sStatus) {
			case ModelManagerStatus.Empty:
			case ModelManagerStatus.New:
			case ModelManagerStatus.Modified:
			case ModelManagerStatus.Unchanged:
				bRecurse = true;
				break;
			}

			// Iterate thru child nodes.

			if (bRecurse) {
				var aChildBackendRequestsForEntry = [];

				for (var sChildNodeName in oChildNodeMetadatas) {
					// For _collectBackendRequestsImpl invocation: oEntry is valid for oParentKeyRef,
					// since it references the original entry, which is also the parent key.

					var oChildNodeMetadata = oChildNodeMetadatas[sChildNodeName];
					var oCollectBackendRequestsObj = this._collectBackendRequestsImpl(oChildNodeMetadata, oEntry, oCollectInfo, true);

					aChildBackendRequestsForEntry = aChildBackendRequestsForEntry.concat(oCollectBackendRequestsObj.backendRequests);
				}

				if (sStatus == ModelManagerStatus.Empty &&
					aChildBackendRequestsForEntry.length == 0) {
					// EMPTY status: if there is no child, then flag parent backend request to
					// be removed. The reason why we don't remove it right now: it would change
					// indexes in aBackendRequests, making subsequent indexes in
					// oEmptyBackendRequestIndexes invalid.
					// TODO: better logic here?
					//
					// Removing from oCollectInfo.createIndexesByNodeName is not neccessary,
					// since the current entry can't be a parent of subsequent child nodes.

					var iEmptyBackendRequestIndex = oEmptyBackendRequestIndexes[i];
					assert(iEmptyBackendRequestIndex != null, "iEmptyBackendRequestIndex should be set");

					aBackendRequests[iEmptyBackendRequestIndex] = null;
				}

				aChildBackendRequests = aChildBackendRequests.concat(aChildBackendRequestsForEntry);
			}
		}

		// Cleanup backend requests.

		var aBackendRequestsFinal = [];

		for (var i = 0; i < aBackendRequests.length; i++) {
			var oBackendRequest = aBackendRequests[i];

			if (oBackendRequest)
				aBackendRequestsFinal.push(oBackendRequest);
		}

		if (aBackendRequestsFinal.length > 0) {
			// We need to mark node to be reloaded (see _reloadImpl):
			// - If change is detected.
			// - If reload is forced.

			var aChangeInfos = oCollectInfo.changeInfos;
			aChangeInfos.push(oChangeInfo);

			var fForceReload = oNodeMetadata.forceReload;
			if (fForceReload) {
				var aReloadInfos = fForceReload(oParentKeyRef, oAdditional);
				oCollectInfo.reloadInfos = oCollectInfo.reloadInfos.concat(aReloadInfos);
			}
		}

		aBackendRequestsFinal = aBackendRequestsFinal.concat(aChildBackendRequests);

		// Construct return object.

		var oCollectBackendRequestsObj = {
			backendRequests: aBackendRequestsFinal
		};

		return oCollectBackendRequestsObj;
	};

	ModelManager.prototype._createCreateInfo = function (oNodeMetadata, oParentKey, oKey, oCollectInfo) {
		assert(oKey[CREATE_KEYFIELD] != null, "Create key field should be set");

		// Maintain create indexes.
		// TODO: single/multilevel key?

		var oCreateIndexesByNodeName = oCollectInfo.createIndexesByNodeName;
		var sNodeName = oNodeMetadata.name;

		var oCreateIndexesByKey = oCreateIndexesByNodeName[sNodeName];
		if (!oCreateIndexesByKey)
			oCreateIndexesByKey = oCreateIndexesByNodeName[sNodeName] = {};

		var sKey = this._keyToString(oNodeMetadata, oKey);
		var iCreateIndex = oCollectInfo.createIndex++;

		assert(oCreateIndexesByKey[sKey] == null, "oCreateIndexesByKey should not contain sKey");
		oCreateIndexesByKey[sKey] = iCreateIndex;

		// Construct create info:
		// - Parent exists: can use parent key, since it is valid on backend.
		// - Parent not exists (just created on UI): supply parent index, which
		//   should be transformed to real parent key by backend.

		var oCreateInfo = {
			createIndex: iCreateIndex,
			parentKey: null,
			parentIndex: null
		};

		var oParentNodeMetadata = oNodeMetadata.parent;

		if (!oParentNodeMetadata || oParentKey[CREATE_KEYFIELD] == null) {
			oCreateInfo.parentKey = oParentKey;
		} else {
			var sParentKey = this._keyToString(oParentNodeMetadata, oParentKey);

			oCreateIndexesByKey = oCreateIndexesByNodeName[oParentNodeMetadata.name];
			assert(oCreateIndexesByKey, "oCreateIndexesByKey should be set");

			var iParentIndex = oCreateIndexesByKey[sParentKey];
			assert(iParentIndex != null, "iParentIndex should be set");

			oCreateInfo.parentIndex = iParentIndex;
		}

		return oCreateInfo;
	};

	ModelManager.prototype._processBackendResponse_Success = function (oBackendResponse, oEntryInfo) {
		// Process entry after successful save.

		var oChangeInfo = oEntryInfo.changeInfo;
		var oNodeMetadata = oChangeInfo.nodeMetadata;
		var oParentKey = oChangeInfo.parentKeyRef;
		var iIndex = oEntryInfo.index;

		// Lookup node.

		var oStorageParent = this._getStorageParent(oNodeMetadata, oParentKey);
		var oStorageChild = this._getStorageChild(oStorageParent, oNodeMetadata);
		assert(oStorageChild, "oStorageChild should be set");

		// Process entry.

		var oModel = oStorageChild.model;
		assert(oModel, "oModel should be set");
		var aEntries = oModel.getData();
		assert(aEntries, "aEntries should be set");

		var oAdditional = oStorageChild.additional;
		assert(oAdditional, "oAdditional should be set");

		assert(iIndex < aEntries.length, "iIndex should be < aEntries.length");
		var oEntry = aEntries[iIndex];

		var bCopyToOrigEntry = false;
		var sStatus = this.getEntryStatus(oEntry);

		switch (sStatus) {
		case ModelManagerStatus.Empty:
		case ModelManagerStatus.New:
			// Set entry status.

			this._setEntryIntStatus(oEntry, ModelManagerIntStatus.Unchanged);

			// Handle rename, new key is mandatory.

			var oNewRawKey = oBackendResponse;
			assert(oNewRawKey, "oNewRawKey should be set");

			this._processBackendResponse_Success_Rename(oNodeMetadata, oEntry, oNewRawKey, oChangeInfo, true);

			bCopyToOrigEntry = true;
			break;

		case ModelManagerStatus.Modified:
			// Set entry status.

			this._setEntryIntStatus(oEntry, ModelManagerIntStatus.Unchanged);

			// Handle rename, new key is optional.

			var oNewRawKey = oBackendResponse;
			if (oNewRawKey && !this._compareKey(oNodeMetadata, oEntry, oNewRawKey))
				this._processBackendResponse_Success_Rename(oNodeMetadata, oEntry, oNewRawKey, oChangeInfo, false);

			bCopyToOrigEntry = true;
			break;

		case ModelManagerStatus.Deleted:
			var bDoDelete = !oNodeMetadata.resetOnDelete;

			if (bDoDelete) {
				// Remove entry and all child nodes. Since we are processing entries in
				// reverse order (see _saveContinue), delete always executed from
				// the bottom, therefore it won't cause any issues with indexes.

				aEntries.splice(iIndex, 1);
			} else {
				// Set entry status.

				this._setEntryIntStatus(oEntry, ModelManagerIntStatus.Unchanged);

				// The flag resetOnDelete is true:
				// - We need to keep entry on UI.
				// - We can't reset the data fields, since it is done by backend.
				// - Status is set to UNCHANGED, and entry is copied to original (actually,
				//   this is not semantically correct, but at least status (UNCHANGED) and
				//   original are consistent).

				bCopyToOrigEntry = true;
			}

			// Delete storage parent recursively.

			if (this._haveChildNode(oNodeMetadata))
				this._deleteStorageParent(oNodeMetadata, oEntry, !bDoDelete);

			break;

		default:
			assert(false, "sStatus is unknown");
		}

		// Update original, since the entry has been saved on backend.

		if (bCopyToOrigEntry) {
			var oOrigEntry = Util.copy(oEntry);
			delete oOrigEntry[ModelManagerAdmin.Prefix];

			var oAdmin = oEntry[ModelManagerAdmin.Prefix];
			oAdmin[ModelManagerAdmin.PropName.OrigEntry] = oOrigEntry;
			oAdmin[ModelManagerAdmin.PropName.ForceReset] = false;
		}
	};

	ModelManager.prototype._processBackendResponse_Success_Rename = function (oNodeMetadata, oEntry, oNewRawKey, oChangeInfo, bCreated) {
		// Patch entry key directly (without creating a new object).

		var oOldKey = this._extractKey(oNodeMetadata, oEntry);

		if (bCreated) {
			assert(oEntry[CREATE_KEYFIELD] != null, "Create key field should be set");
			delete oEntry[CREATE_KEYFIELD];
		}

		// TODO: If any key field is missing in oNewRawKey, display error.

		var oNewKey = this._extractKey(oNodeMetadata, oNewRawKey);
		jQuery.extend(oEntry, oNewKey);

		// Patch storage parent key.
		// TODO: If key is already exist (duplicated key), display error.

		if (this._haveChildNode(oNodeMetadata))
			this._renameStorageParent(oNodeMetadata, oOldKey, oNewKey);

		// Register changed key.

		var aChangedKeys = oChangeInfo.changedKeys;
		var oChangedKey = {
			oldKey: oOldKey,
			newKey: oNewKey
		};
		aChangedKeys.push(oChangedKey);
	};

	ModelManager.prototype._processBackendResponse_Error = function (oError, oEntryInfo) {
		var oErrorObj = {
			showError: true,
			entryErrorInfo: null
		};

		// Process entry after failed save. We need to check for
		// entryInfo, since for some generic errors it is not
		// present.

		if (!oEntryInfo)
			return oErrorObj;

		var oChangeInfo = oEntryInfo.changeInfo;
		var oNodeMetadata = oChangeInfo.nodeMetadata;
		var oParentKey = oChangeInfo.parentKeyRef;
		var iIndex = oEntryInfo.index;

		// Lookup node.

		var oStorageParent = this._getStorageParent(oNodeMetadata, oParentKey);
		var oStorageChild = this._getStorageChild(oStorageParent, oNodeMetadata);
		assert(oStorageChild, "oStorageChild should be set");

		// Process entry.

		var oModel = oStorageChild.model;
		assert(oModel, "oModel should be set");
		var aEntries = oModel.getData();
		assert(aEntries, "aEntries should be set");

		var oAdditional = oStorageChild.additional;
		assert(oAdditional, "oAdditional should be set");

		// Iterate thru field errors:
		// - For known field name: highlight specific field.
		// - For unknown field name, if oFieldNamesInfo.entryError:
		//   - true: convert field error to entry error.
		//   - false: show error dialog.
		//
		// Since known field names are supplied by model, the UI controls
		// should be in sync with the model.

		var oFieldNamesInfo = oNodeMetadata.getFieldNames(oAdditional);

		var oFieldErrorsByField = oError.fieldErrorsByField;
		var oFieldErrorsByFieldToDisplay = {};
		var aEntryErrors = [];
		var bDoSetEntryError = false; // Have at least one field/entry error.
		var bForceShowError = false; // Have at least one error, which should be displayed in a dialog.

		for (var sFieldName in oFieldErrorsByField) {
			var aFieldErrors = oFieldErrorsByField[sFieldName];

			if (oFieldNamesInfo.fieldNames.indexOf(sFieldName) >= 0) {
				delete oFieldErrorsByField[sFieldName];

				oFieldErrorsByFieldToDisplay[sFieldName] = aFieldErrors;
				bDoSetEntryError = true;
			} else if (oFieldNamesInfo.entryError) {
				delete oFieldErrorsByField[sFieldName];

				aEntryErrors = aEntryErrors.concat(aFieldErrors);
				bDoSetEntryError = true;
			} else {
				bForceShowError = true;
			}
		}

		var oEntryErrorInfo = null;

		if (bDoSetEntryError) {
			// Set field/entry errors.

			assert(iIndex < aEntries.length, "iIndex should be < aEntries.length");
			var oEntry = aEntries[iIndex];

			this._setEntryError(oEntry, aEntryErrors, oFieldErrorsByFieldToDisplay);

			// Construct entry error info.

			var sLabel = oNodeMetadata.getErrorLabel(oEntry, oAdditional);
			var aEntryPaths = this._getEntryPaths(oNodeMetadata, oEntry);

			oEntryErrorInfo = {
				label: sLabel,
				entryPaths: aEntryPaths,
				entryErrors: aEntryErrors,
				fieldErrorsByField: oFieldErrorsByFieldToDisplay
			};
		}

		// If we have either details or don't have field/entry error, then show error dialog.

		var bShowError = (oError.details.length > 0 || !bDoSetEntryError || bForceShowError);

		oErrorObj.showError = bShowError;
		oErrorObj.entryErrorInfo = oEntryErrorInfo;

		return oErrorObj;
	};

	ModelManager.prototype._reloadImpl = function (oCollectInfo, sMessageKey, fReloadDone) {
		// TODO: This method can be simplified, since it is only called after save.
		var aRequests = [];
		var that = this;

		var fAddRequest = function (oNodeMetadata, oParentKey) {
			var oRequest = that._requestForFetch(oNodeMetadata, oParentKey, true);
			aRequests.push(oRequest);
		};

		// Reload changed nodes.

		var aChangeInfos = oCollectInfo.changeInfos;

		for (var i = 0; i < aChangeInfos.length; i++) {
			var oChangeInfo = aChangeInfos[i];
			var oNodeMetadata = oChangeInfo.nodeMetadata;
			var oParentKey = oChangeInfo.parentKeyRef;

			fAddRequest(oNodeMetadata, oParentKey);
		}

		// Reload forced nodes. If a request is duplicated in changed and forced nodes, it won't
		// cause any issues, since we perform request de-duplication (see executeFetchRequests).

		var aReloadInfos = oCollectInfo.reloadInfos;

		for (var i = 0; i < aReloadInfos.length; i++) {
			var oReloadInfo = aReloadInfos[i];
			var oNodeMetadata = this._oNodeMetadatas[oReloadInfo.nodeName];
			assert(oNodeMetadata, "oNodeMetadata should be set");
			var oParentKey = oReloadInfo.parentKey;

			fAddRequest(oNodeMetadata, oParentKey);
		}

		this.executeFetchRequests(aRequests, jQuery.proxy(this._reloadImplContinue, this, sMessageKey, fReloadDone));
	};

	ModelManager.prototype._reloadImplContinue = function (sMessageKey, fReloadDone, oExecuteData) {
		var that = this;

		if (oExecuteData.allSuccess) {
			// Backend: reload executed successfully.

			var oReloadInfo = this._createReloadInfo(true);
			fReloadDone(oReloadInfo);
		} else {
			// Backend: error during reload.

			var _fReloadDone = function () {
				var oReloadInfo = that._createReloadInfo(false);
				fReloadDone(oReloadInfo);
			};

			Util.showExecuteError(this._oComponent, sMessageKey, oExecuteData, true, _fReloadDone);
		}
	};

	ModelManager.prototype._reset = function (oNodeMetadata, oKey) {
		// Top-level node (either keyed or non-keyed) should be present in storage.

		if (!oNodeMetadata.keyed) {
			this._resetImpl(oNodeMetadata, null, false);
		} else {
			var oChildNodeMetadatas = oNodeMetadata.nodes;

			for (var sChildNodeName in oChildNodeMetadatas) {
				var oChildNodeMetadata = oChildNodeMetadatas[sChildNodeName];
				this._resetImpl(oChildNodeMetadata, oKey, true);
			}
		}
	};

	ModelManager.prototype._resetImpl = function (oNodeMetadata, oParentKey, bAllowNoChild) {
		// Lookup node.

		var oStorageParent = this._getStorageParent(oNodeMetadata, oParentKey);
		var oStorageChild = this._getStorageChild(oStorageParent, oNodeMetadata);

		if (!oStorageChild) {
			assert(bAllowNoChild, "oStorageChild should be set");
			return;
		}

		var oModel = oStorageChild.model;
		assert(oModel, "oModel should be set");
		var aEntries = oModel.getData();
		assert(aEntries, "aEntries should be set");

		var oAdditional = oStorageChild.additional;
		assert(oAdditional, "oAdditional should be set");

		// Lookup autogrow entry.

		var oAutoGrowEntry = null;

		if (this._getAutoGrowEnabled(oNodeMetadata)) {
			oAutoGrowEntry = this._lookupAutoGrowEntry(aEntries);
			assert(oAutoGrowEntry, "oAutoGrowEntry should be set");
		}

		// Process entries. The reset flag (bReset) determines, if this node
		// needs a reset or not.

		var aRemoveIndexes = [];
		var bReset = false;

		for (var i = 0; i < aEntries.length; i++) {
			var oEntry = aEntries[i];
			var oAdmin = oEntry[ModelManagerAdmin.Prefix];
			var oOrigEntry = oAdmin[ModelManagerAdmin.PropName.OrigEntry];
			var bForceReset = oAdmin[ModelManagerAdmin.PropName.ForceReset];
			var sStatus = this.getEntryStatus(oEntry);
			var bClearError = false;
			var sNewIntStatus = null;
			var bCheckParentKey = false;

			switch (sStatus) {
			case ModelManagerStatus.Empty:
				if (bForceReset) {
					if (oOrigEntry) {
						assert(oEntry != oAutoGrowEntry, "Autogrow entry can't have original data");
						sNewIntStatus = ModelManagerIntStatus.Empty;
					} else {
						assert(oEntry == oAutoGrowEntry, "Entry should be the autogrow entry");
						bReset = true;
					}
				} else if (oAdmin[ModelManagerAdmin.PropName.Error]) {
					bClearError = true;
				}
				break;

			case ModelManagerStatus.New:
				// If we have original, then this entry was in Empty status
				// during fetch. Otherwise remove the entry.

				if (oOrigEntry) {
					// In ESM core:
					// - Only Qual and Quant create EMPTY entries during fetch (with original).
					// - The instance entry (which is the parent) is either NEW or autogrow (without original):
					//   - If NEW: instance entry as well as children will be deleted.
					//   - If autogrow: depending on reset flag of instance entry:
					//     - If true: instance entry as well as children will be deleted, and then the autogrow is recreated.
					//     - If false: children will be resetted.

					sNewIntStatus = ModelManagerIntStatus.Empty;
				} else {
					aRemoveIndexes.push(i);
					bReset = true;
				}
				break;

			case ModelManagerStatus.Modified:
				sNewIntStatus = ModelManagerIntStatus.Unchanged;
				bCheckParentKey = true;
				break;

			case ModelManagerStatus.Unchanged:
				if (bForceReset)
					sNewIntStatus = ModelManagerIntStatus.Unchanged;
				bCheckParentKey = true;
				// TODO: Clear entry error (bClearError = true) is not needed in this case.
				break;

			case ModelManagerStatus.Deleted:
				oAdmin[ModelManagerAdmin.PropName.Deleted] = false;
				sNewIntStatus = ModelManagerIntStatus.Unchanged;
				bCheckParentKey = true;
				break;

			default:
				assert(false, "sStatus is unknown");
			}

			if (bCheckParentKey && oNodeMetadata.parent)
				assert(oParentKey[CREATE_KEYFIELD] == null, "Inconsistent parentkey-entry status");

			// Set entry status and reset entry data.

			if (sNewIntStatus != null) {
				// Reset entry.

				this._resetEntry(oNodeMetadata, oEntry);

				// Set entry status.

				this._setEntryIntStatus(oEntry, sNewIntStatus);

				bClearError = true;
			}

			// Clear entry error.

			if (bClearError) {
				this._clearEntryError(oEntry);
				bReset = true;
			}
		}

		// If we need to reset, then remove autogrow as well.

		if (bReset && oAutoGrowEntry)
			aRemoveIndexes.push(aEntries.length - 1);

		// Entry removal is postponed to here, since we were iterating thru
		// the entries (see above). Removal is done in reverse order to
		// avoid index shifting issue.

		for (var i = aRemoveIndexes.length - 1; i >= 0; i--) {
			var iIndex = aRemoveIndexes[i];
			var oEntry = aEntries[iIndex];

			// Remove entry.

			aEntries.splice(iIndex, 1);

			// Delete storage parent recursively.

			if (this._haveChildNode(oNodeMetadata))
				this._deleteStorageParent(oNodeMetadata, oEntry);
		}

		// If reset is done, then recreate autogrow entry. If forceReset is:
		// - true for autogrow: remove autogrow (see above) and recreate, since the autogrow doesn't have original data.
		// - false for autogrow: same as true (we could use _updateAutoGrowEntry here, instead of recreating the autogrow
		//   entry).

		if (bReset && oAutoGrowEntry) {
			oAutoGrowEntry = this._createAutoGrowEntry(oNodeMetadata, aEntries, null, oAdditional);
			aEntries.push(oAutoGrowEntry);

			// If we have any child nodes, then we have to
			// create storage parent as well.

			if (this._haveChildNode(oNodeMetadata))
				this._createStorageParent(oNodeMetadata, oAutoGrowEntry, oStorageParent.keyRef, oAdditional);
		}

		// Iterate thru child nodes.

		var oChildNodeMetadatas = oNodeMetadata.nodes;

		for (var i = 0; i < aEntries.length; i++) {
			var oEntry = aEntries[i];

			for (var sChildNodeName in oChildNodeMetadatas) {
				var oChildNodeMetadata = oChildNodeMetadatas[sChildNodeName];
				this._resetImpl(oChildNodeMetadata, oEntry, true);
			}
		}

		// TODO: update parent before children?
		if (bReset) {
			// Update storage child.

			this._updateStorageChild(oStorageChild, aEntries);

			// Invoke change listeners. Fetch event will be triggered to simulate
			// reload.

			this._invokeChangeListenersForFetch(oStorageChild);
		}
	};

	ModelManager.prototype._clearAllErrors = function (oCollectInfo) {
		// TODO: Faster way of clearing errors, e.g. dirty flag.

		var aChangeInfos = oCollectInfo.changeInfos;

		for (var i = 0; i < aChangeInfos.length; i++) {
			var oChangeInfo = aChangeInfos[i];

			var oNodeMetadata = oChangeInfo.nodeMetadata;
			var oParentKey = oChangeInfo.parentKeyRef;

			this._clearErrors(oNodeMetadata, oParentKey);
		}
	};

	ModelManager.prototype._clearErrors = function (oNodeMetadata, oParentKey) {
		// Lookup node.

		var oStorageParent = this._getStorageParent(oNodeMetadata, oParentKey);
		var oStorageChild = this._getStorageChild(oStorageParent, oNodeMetadata);
		assert(oStorageChild, "oStorageChild should be set");

		// Clear errors.

		var oModel = oStorageChild.model;
		assert(oModel, "oModel should be set");
		var aEntries = oModel.getData();
		assert(aEntries, "aEntries should be set");

		for (var i = 0; i < aEntries.length; i++) {
			var oEntry = aEntries[i];

			this._clearEntryError(oEntry);
		}
	};

	ModelManager.prototype._updateModels = function (oCollectInfo) {
		// Update changed models.

		var aChangeInfos = oCollectInfo.changeInfos;

		for (var i = 0; i < aChangeInfos.length; i++) {
			var oChangeInfo = aChangeInfos[i];

			var oNodeMetadata = oChangeInfo.nodeMetadata;
			var oParentKey = oChangeInfo.parentKeyRef;

			// Lookup node.

			var oStorageParent = this._getStorageParent(oNodeMetadata, oParentKey);
			var oStorageChild = this._getStorageChild(oStorageParent, oNodeMetadata);
			assert(oStorageChild, "oStorageChild should be set");

			// Update model. Actually, aEntries is already up-to-date, but it is
			// not yet propagated to the model.
			// TODO: better way of doing this.

			var oModel = oStorageChild.model;
			assert(oModel, "oModel should be set");
			var aEntries = oModel.getData();
			assert(aEntries, "aEntries should be set");

			this._updateStorageChild(oStorageChild, aEntries);
		}
	};

	ModelManager.prototype._invokeKeyChangeListeners = function (oCollectInfo) {
		// Send key change events.

		var aChangeInfos = oCollectInfo.changeInfos;

		for (var i = 0; i < aChangeInfos.length; i++) {
			var oChangeInfo = aChangeInfos[i];
			var aChangedKeys = oChangeInfo.changedKeys;

			if (aChangedKeys.length > 0) {
				// Lookup node.

				var oNodeMetadata = oChangeInfo.nodeMetadata;
				var oParentKey = oChangeInfo.parentKeyRef;

				var oStorageParent = this._getStorageParent(oNodeMetadata, oParentKey);
				var oStorageChild = this._getStorageChild(oStorageParent, oNodeMetadata);
				assert(oStorageChild, "oStorageChild should be set");

				// Invoke change listeners.

				var oEventParam = {
					changedKeys: aChangedKeys
				};
				var oEvent = this._createChangeEvent(ModelManagerChangeType.Key, oEventParam);

				this._invokeChangeListeners(oStorageChild, oEvent);
			}
		}
	};

	ModelManager.prototype._attachChangeFor = function (oNodeMetadata, oParentKey, fChangeListener) {
		// Lookup node.

		var oStorageParent = this._getStorageParent(oNodeMetadata, oParentKey);
		var oStorageChild = this._getStorageChild(oStorageParent, oNodeMetadata);
		assert(oStorageChild, "oStorageChild should be set");

		// Attach change listener.

		var aChangeListeners = oStorageChild.changeListeners;
		assert(aChangeListeners, "aChangeListeners should be set");

		aChangeListeners.push(fChangeListener);

		// Construct attach info to be used as parameter to detach.

		var oAttachInfo = {
			changeListeners: aChangeListeners,
			changeListener: fChangeListener,
			aliveObj: this._oAliveObj
		};

		return oAttachInfo;
	};

	ModelManager.prototype._compareKey = function (oNodeMetadata, oKey1, oKey2) {
		var sKey1 = this._keyToString(oNodeMetadata, oKey1);
		var sKey2 = this._keyToString(oNodeMetadata, oKey2);
		var bEqual = (sKey1 == sKey2);
		return bEqual;
	};

	ModelManager.prototype._getParentKey = function (oNodeMetadata, oKey) {
		var oStorageParent = this._getDirectStorageParent(oNodeMetadata, oKey);

		var oParentNodeMetadata = oNodeMetadata.parent;
		assert(oParentNodeMetadata, "oParentNodeMetadata should be set");

		// Use _extractKey to make deep copy, since parentKeyRef can change.

		var oParentKey = this._extractKey(oParentNodeMetadata, oStorageParent.parentKeyRef);
		return oParentKey;
	};

	ModelManager.prototype._isCreateEnabled = function (oNodeMetadata, oParentKey) {
		// Lookup node.

		var oStorageParent = this._getStorageParent(oNodeMetadata, oParentKey);
		var oStorageChild = this._getStorageChild(oStorageParent, oNodeMetadata);
		assert(oStorageChild, "oStorageChild should be set");

		var oModel = oStorageChild.model;
		assert(oModel, "oModel should be set");
		var aEntries = oModel.getData();
		assert(aEntries, "aEntries should be set");

		var oAdditional = oStorageChild.additional;
		assert(oAdditional, "oAdditional should be set");

		// Determine if create is enabled or not:
		// - It is typically used to enable/disable create button on UI.
		// - It doesn't inhibit entry creation (see _create).

		var bIsCreateEnabled = this._isMoreEntryAllowed(oNodeMetadata, aEntries, oAdditional);
		return bIsCreateEnabled;
	};

	ModelManager.prototype._getEntryPaths = function (oNodeMetadata, oKey) {
		var aEntryPaths = [];

		while (oNodeMetadata) {
			var _oKey = this._extractKey(oNodeMetadata, oKey);

			// Add current path.

			var oEntryPath = {
				nodeName: oNodeMetadata.name,
				key: _oKey
			};

			aEntryPaths.splice(0, 0, oEntryPath);

			// Move to parent.

			var oStorageParent = this._getDirectStorageParent(oNodeMetadata, oKey);

			oNodeMetadata = oNodeMetadata.parent;
			oKey = oStorageParent.parentKeyRef;
		}

		return aEntryPaths;
	};

	ModelManager.prototype._getStorageParent = function (oNodeMetadata, oParentKey, bAllowKeyed) {
		// Lookup storage parent and return. If storage parent doesn't exist:
		// - For non-keyed parent nodes: error.
		// - For keyed parent nodes: not error, return null.

		// Determine parent node name and key.

		var oParentNodeMetadata = oNodeMetadata.parent;
		var sParentNodeName = null;
		var sParentKey = null;
		var bKeyed = false;

		if (oParentNodeMetadata) {
			// Non top-level node.

			sParentNodeName = oParentNodeMetadata.name;
			sParentKey = this._keyToString(oParentNodeMetadata, oParentKey);

			if (bAllowKeyed)
				bKeyed = oParentNodeMetadata.keyed;
		} else {
			// Top-level node.

			sParentNodeName = ROOT.NodeName;
			sParentKey = ROOT.Key;
		}

		assert(sParentNodeName != null, "sParentNodeName should be set");
		assert(sParentKey != null, "sParentKey should be set");

		// Lookup parent node.

		var oStorageParent = null;

		var oStorageNode = this._oStorage[sParentNodeName];
		if (oStorageNode)
			oStorageParent = oStorageNode[sParentKey];

		if (!bKeyed)
			assert(oStorageParent, "oStorageParent should be set");

		return oStorageParent;
	};

	ModelManager.prototype._getDirectStorageParent = function (oNodeMetadata, oKey) {
		var sNodeName = oNodeMetadata.name;
		var sKey = this._keyToString(oNodeMetadata, oKey);

		var oStorageNode = this._oStorage[sNodeName];
		assert(oStorageNode, "oStorageNode should be set");
		var oStorageParent = oStorageNode[sKey];
		assert(oStorageParent, "oStorageParent should be set");

		return oStorageParent;
	};

	ModelManager.prototype._checkStorageParent = function (oNodeMetadata, oParentKey) {
		// Check if storage parent exist. For keyed parent nodes, always
		// return true.

		var oParentNodeMetadata = oNodeMetadata.parent;
		var bResult = null;

		if (oParentNodeMetadata) {
			// Non top-level node.

			if (!oParentNodeMetadata.keyed) {
				var sParentNodeName = oParentNodeMetadata.name;
				var sParentKey = this._keyToString(oParentNodeMetadata, oParentKey);

				// Lookup parent node.

				var oStorageParent = null;

				var oStorageNode = this._oStorage[sParentNodeName];
				if (oStorageNode)
					oStorageParent = oStorageNode[sParentKey];

				bResult = oStorageParent ? true : false;
			} else {
				bResult = true;
			}
		} else {
			// Top-level node.

			bResult = true;
		}

		assert(bResult != null, "bResult should be set");
		return bResult;
	};

	ModelManager.prototype._createStorageParent = function (oNodeMetadata, oKeyRef, oParentKeyRef, oAdditional) {
		// Create storage parent.

		var sNodeName = oNodeMetadata.name;

		var oStorageNode = this._oStorage[sNodeName];
		if (!oStorageNode)
			oStorageNode = this._oStorage[sNodeName] = {};

		var sKey = this._keyToString(oNodeMetadata, oKeyRef);
		assert(!oStorageNode[sKey], "oStorageNode should not contain sKey");

		// Build storage parent. Since keyRef and parentKeyRef fields are references,
		// they are updated automatically in case of key change (see _processBackendResponse_Success
		// and _executeFetchRequestsPutIntoStorage).

		assert(oAdditional, "oAdditional should be set");

		var oStorageParent = {
			child: {},
			additional: oAdditional,
			keyRef: oKeyRef,
			parentKeyRef: oParentKeyRef
		};

		oStorageNode[sKey] = oStorageParent;

		return oStorageParent;
	};

	ModelManager.prototype._renameStorageParent = function (oNodeMetadata, oOldKey, oNewKey) {
		// Rename storage parent.

		var sNodeName = oNodeMetadata.name;
		var sOldKey = this._keyToString(oNodeMetadata, oOldKey);
		var sNewKey = this._keyToString(oNodeMetadata, oNewKey);

		// Lookup node.

		var oStorageNode = this._oStorage[sNodeName];
		assert(oStorageNode, "oStorageNode should be set");

		var oStorageParent = oStorageNode[sOldKey];
		assert(oStorageParent, "oStorageParent should be set");

		// Do rename.

		assert(!oStorageNode[sNewKey], "oStorageNode should not contain sNewKey");
		oStorageNode[sNewKey] = oStorageParent;

		delete oStorageNode[sOldKey];
	};

	ModelManager.prototype._deleteStorageParent = function (oNodeMetadata, oKey, bRemoveOnlyChild) {
		// Delete storage parent.

		var sNodeName = oNodeMetadata.name;

		// Lookup node.

		var oStorageNode = this._oStorage[sNodeName];
		assert(oStorageNode, "oStorageNode should be set");

		var sKey = this._keyToString(oNodeMetadata, oKey);
		var oStorageParent = oStorageNode[sKey];
		assert(oStorageParent, "oStorageParent should be set");

		// Iterate thru child nodes.

		var oChildNodeMetadatas = oNodeMetadata.nodes;

		for (var sChildNodeName in oChildNodeMetadatas) {
			var oChildNodeMetadata = oChildNodeMetadatas[sChildNodeName];
			var bChildHaveChild = this._haveChildNode(oChildNodeMetadata);
			var oStorageChild = oStorageParent.child[oChildNodeMetadata.name];

			if (bChildHaveChild && oStorageChild) {
				var oModel = oStorageChild.model;
				assert(oModel, "oModel should be set");
				var aEntries = oModel.getData();
				assert(aEntries, "aEntries should be set");

				for (var i = 0; i < aEntries.length; i++) {
					var oEntry = aEntries[i];
					this._deleteStorageParent(oChildNodeMetadata, oEntry);
				}
			}
		}

		// Do delete.

		if (bRemoveOnlyChild) {
			oStorageParent.child = {};
		} else {
			delete oStorageNode[sKey];

			if (Object.keys(oStorageNode).length == 0)
				delete this._oStorage[sNodeName];
		}
	};

	ModelManager.prototype._getStorageChild = function (oStorageParent, oNodeMetadata) {
		// Lookup storage child and return.

		var oStorageChild = oStorageParent.child[oNodeMetadata.name];
		return oStorageChild;
	};

	ModelManager.prototype._createStorageChild = function (oStorageParent, oNodeMetadata, aEntries, oAdditional) {
		// Create storage child.

		var oStorageChildren = oStorageParent.child;
		var sNodeName = oNodeMetadata.name;
		assert(!oStorageChildren[sNodeName], "oStorageChildren should not contain sNodeName");

		// Build storage child.

		assert(aEntries, "aEntries should be set");
		var oModel = new JSONModel(aEntries);

		assert(oAdditional, "oAdditional should be set");

		var oCollection = new ModelManagerCollection(oStorageParent.keyRef, oModel, oAdditional, oNodeMetadata.collectionMethods, this._oAliveObj);

		var oStorageChild = {
			model: oModel,
			additional: oAdditional,
			changeListeners: [],
			collection: oCollection
		};

		oStorageChildren[sNodeName] = oStorageChild;

		return oStorageChild;
	};

	ModelManager.prototype._updateStorageChild = function (oStorageChild, aEntries) {
		// Update storage child.

		var oModel = oStorageChild.model;
		assert(oModel, "oModel should be set");

		assert(aEntries, "aEntries should be set");
		oModel.setData(aEntries);
	};

	ModelManager.prototype._haveChildNode = function (oNodeMetadata) {
		// For every entry in storage child (JSON)model, there is a storage parent (with the same key), even
		// if the child doesn't have any sub-child nodes. Actually, this was necessary to implement _getEntryPaths
		// and make getParent useable for all nodes.

		return true;

		// Keep here original code, until we decide how to improve storage model further. TODO
		//var bHaveChild = (Object.keys(oNodeMetadata.nodes).length > 0);
		//return bHaveChild;
	};

	ModelManager.prototype._invokeChangeListenersForFetch = function (oStorageChild) {
		var oEventParam = {
			model: oStorageChild.model
		};

		var oEvent = this._createChangeEvent(ModelManagerChangeType.Fetch, oEventParam);
		this._invokeChangeListeners(oStorageChild, oEvent);
	};

	ModelManager.prototype._invokeChangeListenersForCount = function (oStorageChild) {
		var oEvent = this._createChangeEvent(ModelManagerChangeType.Count, {});
		this._invokeChangeListeners(oStorageChild, oEvent);
	};

	ModelManager.prototype._invokeChangeListeners = function (oStorageChild, oEvent) {
		// Before calling _invokeChangeListeners, the model should be already
		// up-to-date.

		var aChangeListeners = oStorageChild.changeListeners;
		assert(aChangeListeners, "aChangeListeners should be set");

		// Clone change listeners array to avoid array modification during
		// for-loop if an event handler wishes to attach/detach.

		var _aChangeListeners = aChangeListeners.slice(0);

		for (var i = 0; i < _aChangeListeners.length; i++) {
			var fChangeListener = _aChangeListeners[i];
			fChangeListener(oEvent);
		}
	};

	ModelManager.prototype._createChangeEvent = function (sChangeType, oEventParam) {
		var oEvent = {
			type: sChangeType
		};

		if (oEventParam)
			jQuery.extend(oEvent, oEventParam);

		return oEvent;
	};

	ModelManager.prototype._createEntry = function (oNodeMetadata, sIntStatus, bStoreOrig, aEntries, oEntryData, oAdditional) {
		// Generate pseudo key and prepare entry.

		var oEntry = {};
		oEntry[CREATE_KEYFIELD] = this._iCreateIndex++;

		var fPrepareEntry = oNodeMetadata.prepareEntry;
		if (fPrepareEntry)
			fPrepareEntry(aEntries, oEntry, oAdditional);

		if (oEntryData)
			jQuery.extend(oEntry, oEntryData);

		this._prepareEntry(oEntry, sIntStatus, bStoreOrig);

		return oEntry;
	};

	ModelManager.prototype._lookupAutoGrowEntry = function (aEntries) {
		// Lookup autogrow entry.

		var iLength = aEntries.length;
		var oEntry = null;

		if (iLength > 0) {
			var _oEntry = aEntries[iLength - 1];
			var oAdmin = _oEntry[ModelManagerAdmin.Prefix];
			var sIntStatus = oAdmin[ModelManagerAdmin.PropName.IntStatus];
			var bAutoGrowEntry = oAdmin[ModelManagerAdmin.PropName.AutoGrowEntry];

			if (sIntStatus == ModelManagerIntStatus.Empty && bAutoGrowEntry)
				oEntry = _oEntry;
		}

		return oEntry;
	};

	ModelManager.prototype._createAutoGrowEntry = function (oNodeMetadata, aEntries, oEntryData, oAdditional) {
		// Create autogrow entry.

		assert(this._getAutoGrowEnabled(oNodeMetadata), "autoGrow is not enabled for node");

		var oEntry = this._createEntry(oNodeMetadata, ModelManagerIntStatus.Empty, false, aEntries, oEntryData, oAdditional);
		var oAdmin = oEntry[ModelManagerAdmin.Prefix];
		oAdmin[ModelManagerAdmin.PropName.AutoGrowEntry] = true;

		this._updateAutoGrowVisible(oNodeMetadata, aEntries, oEntry, oAdditional);

		return oEntry;
	};

	ModelManager.prototype._updateAutoGrowEntry = function (oNodeMetadata, aEntries, oEntry, oAdditional) {
		// Update autogrow entry.

		assert(this._getAutoGrowEnabled(oNodeMetadata), "autoGrow is not enabled for node");

		this._updateAutoGrowVisible(oNodeMetadata, aEntries, oEntry, oAdditional);

		var fPrepareEntry = oNodeMetadata.prepareEntry;
		if (fPrepareEntry)
			fPrepareEntry(aEntries, oEntry, oAdditional);
	};

	ModelManager.prototype._updateAutoGrowVisible = function (oNodeMetadata, aEntries, oEntry, oAdditional) {
		// Depending on isSingleEntry (see _isMoreEntryAllowed), show/hide autogrow
		// entry. It is useful, since we can provide transparent behaviour when _create
		// is called to update autogrow entry, even it is hidden.

		var oAdmin = oEntry[ModelManagerAdmin.Prefix];
		oAdmin[ModelManagerAdmin.PropName.AutoGrowVisible] = this._isMoreEntryAllowed(oNodeMetadata, aEntries, oAdditional);
	};

	ModelManager.prototype._prepareEntry = function (oEntry, sIntStatus, bStoreOrig) {
		assert(sIntStatus == ModelManagerIntStatus.Empty ||
			sIntStatus == ModelManagerIntStatus.New ||
			sIntStatus == ModelManagerIntStatus.Unchanged, "Invalid internal status");

		// Original entry is present, if the entry is created during fetch
		// (see _executeFetchRequestsPutIntoStorage).

		if (sIntStatus == ModelManagerIntStatus.New)
			assert(!bStoreOrig, "bStoreOrig should be false");

		var oOrigEntry = bStoreOrig ? Util.copy(oEntry) : null;

		// Add administrative info to entry.

		var oAdmin = oEntry[ModelManagerAdmin.Prefix] = {};

		oAdmin[ModelManagerAdmin.PropName.Error] = false; // Entry and/or field error flag
		oAdmin[ModelManagerAdmin.PropName.ErrorMessage] = null; // Entry error message
		oAdmin[ModelManagerAdmin.PropName.Deleted] = false; // Deleted flag
		oAdmin[ModelManagerAdmin.PropName.Field] = {}; // Field name (key) -> field error message
		oAdmin[ModelManagerAdmin.PropName.IntStatus] = sIntStatus; // Internal entry status
		oAdmin[ModelManagerAdmin.PropName.AutoGrowEntry] = false; // Autogrow (only for EMPTY entries)
		oAdmin[ModelManagerAdmin.PropName.AutoGrowVisible] = false; // Visible flag for autogrow
		oAdmin[ModelManagerAdmin.PropName.OrigEntry] = oOrigEntry; // Original entry
		oAdmin[ModelManagerAdmin.PropName.ForceReset] = false; // ModelManagerCollection->setFieldValue invoked with bNoUpdate = true
	};

	ModelManager.prototype._resetEntry = function (oNodeMetadata, oEntry) {
		var oAdmin = oEntry[ModelManagerAdmin.Prefix];
		var oOrigEntry = oAdmin[ModelManagerAdmin.PropName.OrigEntry];

		assert(oOrigEntry, "oOrigEntry should be set");
		assert(this._compareKey(oNodeMetadata, oEntry, oOrigEntry), "Key should be unchanged");

		// Deep copy is done to prevent any modification of oOrigEntry.

		this._clearEntry(oEntry, false);
		var oOrigEntryCopy = Util.copy(oOrigEntry);
		jQuery.extend(oEntry, oOrigEntryCopy);

		oAdmin[ModelManagerAdmin.PropName.ForceReset] = false;
	};

	ModelManager.prototype._clearEntry = function (oEntry, bClearAdmin) {
		for (var sFieldName in oEntry) {
			if (bClearAdmin || sFieldName != ModelManagerAdmin.Prefix)
				delete oEntry[sFieldName];
		}
	};

	ModelManager.prototype._setEntryIntStatus = function (oEntry, sIntStatus) {
		var oAdmin = oEntry[ModelManagerAdmin.Prefix];

		oAdmin[ModelManagerAdmin.PropName.IntStatus] = sIntStatus;
	};

	ModelManager.prototype._setEntryError = function (oEntry, aEntryErrors, oFieldErrorsByField) {
		assert(aEntryErrors.length > 0 || Object.keys(oFieldErrorsByField).length > 0,
			"aEntryErrors or oFieldErrorsByField should contain at least one error");

		// Set error flag.

		var oAdmin = oEntry[ModelManagerAdmin.Prefix];

		oAdmin[ModelManagerAdmin.PropName.Error] = true;

		// Set entry errors.

		if (aEntryErrors.length > 0) {
			var sEntryErrors = aEntryErrors.join("\n");

			oAdmin[ModelManagerAdmin.PropName.ErrorMessage] = sEntryErrors;
		}

		// Set field errors.

		for (var sFieldName in oFieldErrorsByField) {
			var aFieldErrors = oFieldErrorsByField[sFieldName];
			var sFieldErrors = aFieldErrors.join("\n");

			oAdmin[ModelManagerAdmin.PropName.Field][sFieldName] = sFieldErrors;
		}
	};

	ModelManager.prototype._clearEntryError = function (oEntry) {
		var oAdmin = oEntry[ModelManagerAdmin.Prefix];

		oAdmin[ModelManagerAdmin.PropName.Error] = false;
		oAdmin[ModelManagerAdmin.PropName.ErrorMessage] = null;
		oAdmin[ModelManagerAdmin.PropName.Field] = {};
	};

	ModelManager.prototype._keyToString = function (oNodeMetadata, oKey) {
		// Convert node key to string.

		var aNodeKeyFields = (oKey[CREATE_KEYFIELD] != null) ? [CREATE_KEYFIELD] : oNodeMetadata.keyFields;
		var aKeyComps = [];

		for (var i = 0; i < aNodeKeyFields.length; i++) {
			var sNodeKeyField = aNodeKeyFields[i];

			var vKeyFieldValue = oKey[sNodeKeyField];
			assert(vKeyFieldValue != null, sNodeKeyField + ": key field should be set");

			var sKeyComp = sNodeKeyField + "=\"" + vKeyFieldValue.toString().replace(/"/g, "\"\"") + "\"";
			aKeyComps.push(sKeyComp);
		}

		var sKey = aKeyComps.join(",");
		return sKey;
	};

	ModelManager.prototype._extractKey = function (oNodeMetadata, oData) {
		// Extract node key from object.

		var aNodeKeyFields = (oData[CREATE_KEYFIELD] != null) ? [CREATE_KEYFIELD] : oNodeMetadata.keyFields;
		var oKey = {};

		for (var i = 0; i < aNodeKeyFields.length; i++) {
			var sNodeKeyField = aNodeKeyFields[i];

			var vKeyFieldValue = oData[sNodeKeyField];
			assert(vKeyFieldValue != null, sNodeKeyField + ": key field should be set");

			oKey[sNodeKeyField] = vKeyFieldValue;
		}

		return oKey;
	};

	ModelManager.prototype._isMoreEntryAllowed = function (oNodeMetadata, aEntries, oAdditional) {
		// If there is at least one entry, then call isSingleEntry to determine
		// if additional entries can be created. We don't check for entry status,
		// imagine the following scenario:
		// 1) Let's say we have an UNCHANGED entry. Create is disabled.
		// 2) User mark entry for deletion. Create is enabled.
		// 3) User creates a new entry. Create is disabled.
		// 4) User unmark first entry -> so we have two entries, which is not allowed.

		var fIsSingleEntry = oNodeMetadata.isSingleEntry;
		var bIsMoreEntryAllowed = !(aEntries.length > 0 && fIsSingleEntry && fIsSingleEntry(oAdditional));
		return bIsMoreEntryAllowed;
	};

	ModelManager.prototype._createReloadInfo = function (bSuccess) {
		var oReloadInfo = {
			success: bSuccess
		};

		return oReloadInfo;
	};

	ModelManager.prototype._requestToString = function (oRequest, bUseParent) {
		assert(!oRequest.passthru, "Request should be normal request");
		if (oRequest.nodeMetadata.name != "Phrase") {
			var oNodeMetadata = oRequest.nodeMetadata;
			var oParentNodeMetadata = oNodeMetadata.parent;
			var oParentKey = oRequest.parentKey;

			if (bUseParent)
				assert(oParentNodeMetadata, "oParentNodeMetadata should be set");
			var sNodeName = bUseParent ? oParentNodeMetadata.name : oNodeMetadata.name;

			var sRequest = sNodeName + "/" + (oParentNodeMetadata ? this._keyToString(oParentNodeMetadata, oParentKey) : "");
			return sRequest;
		} else {
			var oNodeMetadata = oRequest.nodeMetadata;
			var sRequest = oNodeMetadata.name + "/" + oNodeMetadata.Phrkey;
			return sRequest;
			// return oRequest;
		}
	};

	ModelManager.prototype._compareRequestInfo = function (oRequestInfo1, oRequestInfo2) {
		var oRequest1 = oRequestInfo1.request;
		var oRequest2 = oRequestInfo2.request;

		// Compare by passthru.

		if (oRequest1.passthru && !oRequest2.passthru)
			return -1;
		else if (!oRequest1.passthru && oRequest2.passthru)
			return 1;
		else if (oRequest1.passthru && oRequest2.passthru)
			return 0;

		// Compare by node level.

		return (oRequest1.nodeMetadata.level - oRequest2.nodeMetadata.level);
	};

	ModelManager.prototype._showMessageToast = function (sMessageKey) {
		var sMessage = this._oComponent.getI18nBundle().getText(sMessageKey);
		MessageToast.show(sMessage);
	};

	ModelManager.prototype._getComponent = function () {
		return this._oComponent;
	};

	ModelManager.prototype._getNodeInfos = function () {
		assert(false, "_getNodeInfos should be overridden in derived class");
	};

	ModelManager.prototype._backendExecuteFetchRequests = function (aBackendRequests, fBackendCallback) {
		assert(false, "_backendExecuteFetchRequests should be overridden in derived class");
	};

	ModelManager.prototype._backendExecuteChangeRequests = function (aBackendRequests, fBackendCallback) {
		assert(false, "_backendExecuteChangeRequests should be overridden in derived class");
	};

	ModelManager.prototype._executeFetchRequestsBegin = function () {
		// Can be overridden in derived class (optional).
	};

	ModelManager.prototype._executeFetchRequestsEnd = function () {
		// Can be overridden in derived class (optional).
	};

	ModelManager.prototype._getAutoGrowEnabled = function (oNodeMetadata) {
		// Can be overridden in derived class (optional).

		return false;
	};

	return ModelManager;
});