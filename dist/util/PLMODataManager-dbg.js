//FIXMEVC:remove what is not needed
/*
 * PLMODataManager extends ODataManager with PLM specific
 * OData calls.
 */

sap.ui.define([
	"sap/base/assert",
	"gramont/VCDSM/specedit/util/CharHeaderException",
	"gramont/VCDSM/specedit/util/CharHeaderFactory",
	"gramont/VCDSM/specedit/util/ODataManager",
	"gramont/VCDSM/specedit/util/ODataManagerException",
	"gramont/VCDSM/specedit/util/Util"
], function (assert, CharHeaderException, CharHeaderFactory, ODataManager, ODataManagerException, Util) {
	"use strict";

	// Create-Parent index:

	var INDEX = {
		CREATE: "X-MSE-CreateIndex",
		PARENT: "X-MSE-ParentIndex"
	};

	var PLMODataManager = function (oComponent) {
		ODataManager.call(this, oComponent);

		// EXT_CLASS
		oComponent.initClassExtension(this, "gramont.VCDSM.specedit.util.PLMODataManager", arguments);

		this._oCharHeaderFactory = new CharHeaderFactory(this._oComponent);
	};

	PLMODataManager.prototype = Object.create(ODataManager.prototype);
	PLMODataManager.prototype.constructor = PLMODataManager;

	PLMODataManager.prototype.requestForFetchConfig = function (sMessageKey) {
		this._checkInit();

		var oBatchRequest = this._createBatchOperation("/GetConfig", "GET");

		var fProcess = function (aBatchResponses) {
			var oBatchResponse = aBatchResponses[0].data;

			var oConfig = {
				language: oBatchResponse.LANGU
			};
			return oConfig;
		};

		var oRequest = {
			messageKey: sMessageKey,
			batchRequests: [oBatchRequest],
			process: fProcess
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForFetchLogo = function (Key) {

		var sParams = this._escapeParamsForFI({
			RECNROOT: Key.RECNROOT,
			ACTN: Key.ACTN
		});
		var oBatchRequest = this._createBatchOperation("/GetLogoDoc?", "GET");

		var fProcess = function (aBatchResponses) {
			var logo = aBatchResponses[0].data.results[0];
			var logodat = [];

			logodat.push(logo);

			var oResponse = {
				entries: logodat
			};

			return oResponse;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.logo.fetch",
			batchRequests: [oBatchRequest],
			process: fProcess
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForFetchitmkey = function () {
		this._checkInit();

		var oBatchRequest = this._createBatchOperation("/RecnGen", "GET");

		var fProcess = function (aBatchResponses) {
			var oBatchResponse = aBatchResponses[0].data;

			return oBatchResponse;
		};

		var oRequest = {
			batchRequests: [oBatchRequest],
			process: fProcess
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForFetchSpecificationList = function () {
		this._checkInit();

		var aKinds = ["favorites", "lastacc", "rchgd"];
		var aBatchRequests = [];

		for (var i = 0; i < aKinds.length; i++) {
			var sKind = aKinds[i];
			var sURL = "/GetSpecList?" + this._escapeParamsForFI({
				Kind: sKind
			});
			var oBatchRequest = this._createBatchOperation(sURL, "GET");
			aBatchRequests.push(oBatchRequest);
		}

		var fProcess = function (aBatchResponses) {
			var oData = {};

			for (var i = 0; i < aKinds.length; i++) {
				var sKind = aKinds[i];
				oData[sKind] = aBatchResponses[i].data.results;
			}

			return oData;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.specList",
			batchRequests: aBatchRequests,
			process: fProcess
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForFetchText = function (phrkey) {
		this._checkInit();

		var params = this._escapeParamsForFI({
			Phrkey: phrkey
		});
		var oBatchRequest = this._createBatchOperation("/GetTextValue?" + params, "GET");
		var aBatchRequests = [];
		aBatchRequests.push(oBatchRequest);

		var fProcess = function (aBatchResponses) {
			var oData = {};

			for (var i = 0; i < aBatchResponses.length; i++) {

				oData[i] = aBatchResponses[i].data.results;
			}

			return oData;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.fetchtext",
			batchRequests: aBatchRequests,
			process: fProcess
		};

		return oRequest;
	};
	//doc changes
	PLMODataManager.prototype.requestForFetchDoclist = function (recnroot) {
		this._checkInit();

		var params = this._escapeParamsForFI({
			RECNROOT: recnroot
		});

		var oBatchRequest = this._createBatchOperation("/GetDocList?" + params, "GET");
		var aBatchRequests = [];
		aBatchRequests.push(oBatchRequest);

		var fProcess = function (aBatchResponses) {
			var oData = {};

			for (var i = 0; i < aBatchResponses.length; i++) {

				oData[i] = aBatchResponses[i].data.results;
			}

			return oData;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.fetchdoclist",
			batchRequests: aBatchRequests,
			process: fProcess
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForFetchSpecificationInfo = function (oSpecificationSUBIDKey) {
		this._checkInit();

		this._checkSpecificationSUBIDKey(oSpecificationSUBIDKey);

		var sKeyDate = Util.convertDateToString(oSpecificationSUBIDKey.KEYDATE);

		var sParams = this._escapeParamsForFI({
			SUBID: oSpecificationSUBIDKey.SUBID,
			KEYDATE: sKeyDate
		});

		var oBatchRequest = this._createBatchOperation("/GetSpecInfo?" + sParams, "GET");

		var fProcess = function (aBatchResponses) {
			var oData = aBatchResponses[0].data;
			return oData;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.specInfo",
			batchRequests: [oBatchRequest],
			process: fProcess
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForFetchHeaderInfo = function (oSpecificationKey) {
		this._checkInit();

		this._checkSpecificationKey(oSpecificationKey);

		var sParams = this._escapeParamsForKey({
			RECNROOT: oSpecificationKey.RECNROOT,
			ACTN: oSpecificationKey.ACTN,
			ACTIVITY: oSpecificationKey.actvtparam
		});

		var oBatchRequest = this._createBatchOperation("/HeaderInfoCollection(" + sParams + ")", "GET");

		var fProcess = function (aBatchResponses) {
			var oHeaderInfo = aBatchResponses[0].data;
			return oHeaderInfo;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.headerInfo.fetch",
			batchRequests: [oBatchRequest],
			process: fProcess
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForFetchBasicData = function (oSpecificationKey) {
		this._checkInit();

		this._checkSpecificationKey(oSpecificationKey);

		var sParams = this._escapeParamsForKey({
			RECNROOT: oSpecificationKey.RECNROOT,
			ACTN: oSpecificationKey.ACTN
		});

		var oBatchRequest = this._createBatchOperation("/BasicDataCollection(" + sParams + ")", "GET");

		var fProcess = function (aBatchResponses) {
			var oBasicData = aBatchResponses[0].data;
			return oBasicData;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.basicData.fetch",
			batchRequests: [oBatchRequest],
			process: fProcess
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForUpdateBasicData = function (oBasicData) {
		this._checkInit();

		this._checkSpecificationKey(oBasicData);

		var sParams = this._escapeParamsForKey({
			RECNROOT: oBasicData.RECNROOT,
			ACTN: oBasicData.ACTN
		});

		var oData = this._filterBasicData(oBasicData);

		var oBatchRequest = this._createBatchOperation("/BasicDataCollection(" + sParams + ")", "PUT", oData);

		var oRequest = {
			messageKey: "PLMODataManager.error.basicData.update",
			batchRequests: [oBatchRequest],
			change: true
		};

		return oRequest;
	};
	PLMODataManager.prototype.requestForValidateInput = function (oSpecificationKey) {
		// this._checkInit();

		// var oSpecificationKey = oCreateInfo.parentKey;
		// this._checkSpecificationKey(oSpecificationKey);

		var sParams = this._escapeParamsForFI({
			ATNAM: oSpecificationKey.ATNAM,
			ATWRT: oSpecificationKey.ATWRT
		});

		// var oData = this._filterIdentifier(oIdentifier);

		var oBatchRequest = this._createBatchOperation("/ValidateInput?" + sParams, "GET");

		var fProcess = function (aBatchResponses) {
			var oIdentifierKey = aBatchResponses[0].data;
			return oIdentifierKey;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.validate.input",
			batchRequests: [oBatchRequest],
			process: fProcess
				// change: true
		};

		return oRequest;
	};
	
	PLMODataManager.prototype.requestForFetchIdentifier = function (oSpecificationKey) {
		this._checkInit();

		this._checkSpecificationKey(oSpecificationKey);

		var sParams = this._escapeParamsForKey({
			RECNROOT: oSpecificationKey.RECNROOT,
			ACTN: oSpecificationKey.ACTN
		});

		var oBatchRequest = this._createBatchOperation("/BasicDataCollection(" + sParams + ")/Identifiers", "GET");

		var fProcess = function (aBatchResponses) {
			var aIdentifiers = aBatchResponses[0].data.results;
			var oResponse = {
				entries: aIdentifiers
			};

			return oResponse;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.identifier.fetch",
			batchRequests: [oBatchRequest],
			process: fProcess
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForCreateIdentifier = function (oCreateInfo, oIdentifier) {
		this._checkInit();

		var oSpecificationKey = oCreateInfo.parentKey;
		this._checkSpecificationKey(oSpecificationKey);

		var sParams = this._escapeParamsForKey({
			RECNROOT: oSpecificationKey.RECNROOT,
			ACTN: oSpecificationKey.ACTN
		});

		var oData = this._filterIdentifier(oIdentifier);

		var oBatchRequest = this._createBatchOperation("/BasicDataCollection(" + sParams + ")/Identifiers", "POST", oData);

		var fProcess = function (aBatchResponses) {
			var oIdentifierKey = aBatchResponses[0].data;
			return oIdentifierKey;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.identifier.create",
			batchRequests: [oBatchRequest],
			process: fProcess,
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForUpdateIdentifier = function (oIdentifier) {
		this._checkInit();

		this._checkIdentifierKey(oIdentifier);

		var sParams = this._escapeParamsForKey({
			RECNROOT: oIdentifier.RECNROOT,
			SPC_ACTN: oIdentifier.SPC_ACTN,
			ACTN: oIdentifier.ACTN,
			RECN: oIdentifier.RECN
		});

		var oData = this._filterIdentifier(oIdentifier);

		var oBatchRequest = this._createBatchOperation("/IdentifiersCollection(" + sParams + ")", "PUT", oData);

		var oRequest = {
			messageKey: "PLMODataManager.error.identifier.update",
			batchRequests: [oBatchRequest],
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForDeleteIdentifier = function (oIdentifierKey) {
		this._checkInit();

		this._checkIdentifierKey(oIdentifierKey);

		var sParams = this._escapeParamsForKey({
			RECNROOT: oIdentifierKey.RECNROOT,
			SPC_ACTN: oIdentifierKey.SPC_ACTN,
			ACTN: oIdentifierKey.ACTN,
			RECN: oIdentifierKey.RECN
		});

		var oBatchRequest = this._createBatchOperation("/IdentifiersCollection(" + sParams + ")", "DELETE");

		var oRequest = {
			messageKey: "PLMODataManager.error.identifier.delete",
			batchRequests: [oBatchRequest],
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForFetchDefaultIdentifier = function (oSpecificationKey) {
		this._checkInit();

		this._checkSpecificationKey(oSpecificationKey);

		var sParams = this._escapeParamsForKey({
			RECNROOT: oSpecificationKey.RECNROOT,
			ACTN: oSpecificationKey.ACTN
		});

		var oBatchRequest = this._createBatchOperation("/BasicDataCollection(" + sParams + ")/DefaultIdentifiers", "GET");

		var fProcess = function (aBatchResponses) {
			var aDefaultIdentifiers = aBatchResponses[0].data.results;
			var oResponse = {
				defaultIdentifiers: aDefaultIdentifiers
			};

			return oResponse;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.defaultIdentifier.fetch",
			batchRequests: [oBatchRequest],
			process: fProcess
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForFetchPropTree = function (oSpecificationKey) {
		this._checkInit();

		this._checkSpecificationKey(oSpecificationKey);

		var that = this;

		var sParams = this._escapeParamsForKey({
			RECNROOT: oSpecificationKey.RECNROOT,
			ACTN: oSpecificationKey.ACTN
		});

		var oBatchRequest = this._createBatchOperation("/BasicDataCollection(" + sParams + ")/PTreeList?$expand=PTree", "GET");

		var fProcess = function (aBatchResponses) {
			var aPropTrees = aBatchResponses[0].data.results;

			// Build property tree structure.

			for (var i = 0; i < aPropTrees.length; i++) {
				var oPropTree = aPropTrees[i];
				var sPropTreeID = oPropTree.MENID;

				var aNodes = oPropTree.PTree.results;
				delete oPropTree.PTree;

				var oRootNodeInfo = that._buildPropTree(sPropTreeID, aNodes);
				oPropTree.rootNode = oRootNodeInfo.rootNode;
				oPropTree.levelCount = oRootNodeInfo.levelCount; // Tree deepness in number of non-leaf nodes.
			}

			var oResponse = {
				propTrees: aPropTrees
			};

			return oResponse;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.propTree",
			batchRequests: [oBatchRequest],
			process: fProcess
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForFetchInstance = function (oPropertyKey, bFetchInfo, oCharHeaderInfo) {
		this._checkInit();

		this._checkPropertyKey(oPropertyKey);

		var that = this;

		var aBatchRequests = [];
		if (oPropertyKey.Phrkey == "" || oPropertyKey.Phrkey == null) {
			if (bFetchInfo) {
				var sParams = this._escapeParamsForFI({
					RECNROOT: oPropertyKey.RECNROOT,
					ACTN: oPropertyKey.ACTN,
					// MENID: oPropertyKey.MENID,
					// ID: oPropertyKey.ID,
					MENID: "",
					ID: "",
					ESTCAT: oPropertyKey.ESTCAT
				});

				var oBatchRequest = this._createBatchOperation("/GetPTreeInfo?" + sParams, "GET");
				aBatchRequests.push(oBatchRequest);
			}

			// Instead of using boolean for requesting header info fetch, we have
			// to use an object, because header info is necessary for parsing instance
			// entries.

			if (!oCharHeaderInfo) {
				var sParams = this._escapeParamsForFI({
					RECNROOT: oPropertyKey.RECNROOT,
					ACTN: oPropertyKey.ACTN,
					ESTCAT: oPropertyKey.ESTCAT
				});

				var oBatchRequest = this._createBatchOperation("/GetInstanceHeader?" + sParams, "GET");
				aBatchRequests.push(oBatchRequest);
			}

			var sParams = this._escapeParamsForFI({
				RECNROOT: oPropertyKey.RECNROOT,
				ACTN: oPropertyKey.ACTN,
				// MENID: oPropertyKey.MENID,
				// ID: oPropertyKey.ID,
				MENID: "",
				ID: "",
				ESTCAT: oPropertyKey.ESTCAT
			});

			var oBatchRequest = this._createBatchOperation("/GetInstanceList?" + sParams, "GET");
			aBatchRequests.push(oBatchRequest);

			var fProcess = function (aBatchResponses) {
				var iBatchResponseIndex = 0;

				// Create result data objects.

				var oInfo = null;
				var aInstances = null;

				// Store property tree node info.

				if (bFetchInfo)
					oInfo = aBatchResponses[iBatchResponseIndex++].data;

				// Construct and store header objects.

				if (!oCharHeaderInfo) {
					var aODataHeaders = aBatchResponses[iBatchResponseIndex++].data.results;
					var oCharHeadersByFieldName = {};
					var aCharHeadersByOrder = [];

					for (var i = 0; i < aODataHeaders.length; i++) {
						var oODataHeader = aODataHeaders[i];
						var oCharHeader;

						try {
							oCharHeader = that._oCharHeaderFactory.create(oODataHeader);
						} catch (e) {
							if (!(e instanceof CharHeaderException))
								throw e;

							throw new ODataManagerException(e.messageKey, e.args);
						}

						oCharHeadersByFieldName[oCharHeader.getFieldName()] = oCharHeader;
						aCharHeadersByOrder.push(oCharHeader);
					}

					oCharHeaderInfo = {
						byFieldName: oCharHeadersByFieldName,
						byOrder: aCharHeadersByOrder // Columns are coming sorted from OData service (no need to sort them again).
					};
				}

				// Construct and store values array.

				var aFieldEntries = aBatchResponses[iBatchResponseIndex++].data.results;
				aInstances = that._buildInstances(oCharHeaderInfo.byFieldName, aFieldEntries);

				var oResponse = {
					info: oInfo,
					charHeaderInfo: oCharHeaderInfo,
					entries: aInstances
				};

				return oResponse;
			};

			var oRequest = {
				messageKey: "PLMODataManager.error.prop.fetch",
				batchRequests: aBatchRequests,
				process: fProcess
			};
			return oRequest;
		}
		//doc changes
		else if (oPropertyKey.Phrkey == "doc") {
			this._checkInit();
			var params = this._escapeParamsForFI({
				RECNROOT: oPropertyKey.RECNROOT
			});

			var oBatchRequest = this._createBatchOperation("/GetDocList?" + params, "GET");
			// var	aBatchRequests=[];
			aBatchRequests.push(oBatchRequest);

			var fProcess = function (aBatchResponses) {
				var oData = {};

				for (var i = 0; i < aBatchResponses.length; i++) {
					oData[i] = aBatchResponses[i].data.results;
				}

				return oData;
			};

			var oRequest = {
				messageKey: "PLMODataManager.error.doclist",
				batchRequests: aBatchRequests,
				process: fProcess
			};

			return oRequest;
		}
		// doc changes
		else if (oPropertyKey.Phrkey == "udt") {
			this._checkInit();
			var params = this._escapeParamsForFI({
				RECNROOT: oPropertyKey.RECNROOT,
				ACTN: oPropertyKey.ACTN,
				ESTCAT: oPropertyKey.ESTCAT,
				RECNPARENT: oPropertyKey.RECNPARENT,
				RECN_VP: oPropertyKey.RECN_VP,
				ACTN_VP: oPropertyKey.ACTN_VP
			});

			var oBatchRequest = this._createBatchOperation("/InstanceUserdefinedText?" + params, "GET");
			// var	aBatchRequests=[];
			aBatchRequests.push(oBatchRequest);

			var fProcess = function (aBatchResponses) {
				var oData = {};

				for (var i = 0; i < aBatchResponses.length; i++) {
					oData[i] = aBatchResponses[i].data;
				}

				return oData;
			};

			var oRequest = {
				messageKey: "PLMODataManager.error.udt",
				batchRequests: aBatchRequests,
				process: fProcess
			};

			return oRequest;
		} else {
			this._checkInit();

			var params = this._escapeParamsForFI({
				Phrkey: oPropertyKey.Phrkey
			});
			var oBatchRequest = this._createBatchOperation("/GetTextValue?" + params, "GET");
			// var	aBatchRequests=[];
			aBatchRequests.push(oBatchRequest);

			var fProcess = function (aBatchResponses) {
				var oData = {};

				for (var i = 0; i < aBatchResponses.length; i++) {
					// 	var sKind = aKinds[i];
					oData[i] = aBatchResponses[i].data.results;
				}

				return oData;
			};

			var oRequest = {
				messageKey: "PLMODataManager.error.fetchtext",
				batchRequests: aBatchRequests,
				process: fProcess
			};

			return oRequest;
		}

	};

	PLMODataManager.prototype.requestForCreateInstance = function (oCreateInfo, oInstance, oCharHeaderInfo) {
		this._checkInit();

		var oPropertyKey = oCreateInfo.parentKey;
		this._checkPropertyKey(oPropertyKey);

		var aBatchRequests = this._buildInstanceBatchRequests(oInstance, oCharHeaderInfo);

		var sParams = this._escapeParamsForFI({
			RECNROOT: oPropertyKey.RECNROOT,
			ACTN: oPropertyKey.ACTN,
			MENID: oPropertyKey.MENID,
			ID: oPropertyKey.ID,
			ESTCAT: oPropertyKey.ESTCAT
		});

		var oHeaders = {};
		oHeaders[INDEX.CREATE] = oCreateInfo.createIndex.toString();

		var oBatchRequest = this._createBatchOperation("/CreateInstance?" + sParams, "POST", null, oHeaders);
		aBatchRequests.push(oBatchRequest);

		var fProcess = function (aBatchResponses) {
			var oInstanceKey = aBatchResponses[aBatchRequests.length - 1].data;
			return oInstanceKey;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.prop.create",
			batchRequests: aBatchRequests,
			process: fProcess,
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForCreateInstanceUDT = function (oInstance) {
		this._checkInit();

		var aBatchRequests = [];

		var sParams = this._escapeParamsForFI({
			RECNROOT: oInstance.RECNROOT,
			ACTN: oInstance.ACTN,
			MENID: oInstance.MENID,
			ID: oInstance.ID,
			ESTCAT: oInstance.ESTCAT
		});

		var oBatchRequest = this._createBatchOperation("/CreateInstance?" + sParams, "POST", null, null);
		aBatchRequests.push(oBatchRequest);

		var fProcess = function (aBatchResponses) {
			var oInstanceKey = aBatchResponses[aBatchRequests.length - 1].data;
			return oInstanceKey;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.prop.create",
			batchRequests: aBatchRequests,
			process: fProcess,
			change: true
		};

		return oRequest;
	};
	PLMODataManager.prototype.requestForUpdateInstance = function (oInstance, oCharHeaderInfo) {
		this._checkInit();

		this._checkInstanceKey(oInstance);

		var aBatchRequests = this._buildInstanceBatchRequests(oInstance, oCharHeaderInfo);

		var sParams = this._escapeParamsForFI({
			RECNROOT: oInstance.RECNROOT,
			ACTN: oInstance.ACTN,
			RECNPARENT: oInstance.RECNPARENT,
			ESTCAT: oInstance.ESTCAT,
			RECN_VP: oInstance.RECN_VP,
			ACTN_VP: oInstance.ACTN_VP
		});

		var oBatchRequest = this._createBatchOperation("/UpdateInstance?" + sParams, "POST");
		aBatchRequests.push(oBatchRequest);

		var oRequest = {
			messageKey: "PLMODataManager.error.prop.update",
			batchRequests: aBatchRequests,
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForDeleteInstance = function (oInstanceKey) {
		this._checkInit();

		this._checkInstanceKey(oInstanceKey);

		var sParams = this._escapeParamsForFI({
			RECNROOT: oInstanceKey.RECNROOT,
			ACTN: oInstanceKey.ACTN,
			RECNPARENT: oInstanceKey.RECNPARENT,
			ESTCAT: oInstanceKey.ESTCAT,
			RECN_VP: oInstanceKey.RECN_VP,
			ACTN_VP: oInstanceKey.ACTN_VP
		});

		var oBatchRequest = this._createBatchOperation("/DeleteInstance?" + sParams, "POST");

		var oRequest = {
			messageKey: "PLMODataManager.error.prop.delete",
			batchRequests: [oBatchRequest],
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForFetchCharValue = function (oKey, oCharHeader) {
		this._checkInit();

		var bInstanceKey = (oKey.RECN_VP != null);
		if (bInstanceKey)
			this._checkInstanceKey(oKey);
		else
			this._checkPropertyKey(oKey);

		var that = this;

		var sParams = this._escapeParamsForFI({
			RECNROOT: oKey.RECNROOT,
			ACTN: oKey.ACTN,
			MENID: bInstanceKey ? "" : oKey.MENID,
			ID: bInstanceKey ? "" : oKey.ID,
			ESTCAT: oKey.ESTCAT,
			RECNPARENT: bInstanceKey ? oKey.RECNPARENT : "",
			ATNAM: oCharHeader.getFieldName(),
			RECN_VP: bInstanceKey ? oKey.RECN_VP : "",
			ACTN_VP: bInstanceKey ? oKey.ACTN_VP : ""
		});

		var oBatchRequest = this._createBatchOperation("/GetCharValue?" + sParams, "GET");

		var fProcess = function (aBatchResponses) {
			var aCharEntries = that._buildCharEntries(oCharHeader, aBatchResponses[0].data.results);
			return aCharEntries;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.charValue",
			batchRequests: [oBatchRequest],
			process: fProcess
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForFetchCharValueHelperList = function (oKey, oCharHeader) {
		this._checkInit();

		var bInstanceKey = (oKey.RECN_VP != null);
		if (bInstanceKey)
			this._checkInstanceKey(oKey);
		else
			this._checkPropertyKey(oKey);

		var sParams = this._escapeParamsForFI({
			RECNROOT: oKey.RECNROOT,
			ACTN: oKey.ACTN,
			MENID: bInstanceKey ? "" : oKey.MENID,
			ID: bInstanceKey ? "" : oKey.ID,
			ESTCAT: oKey.ESTCAT,
			RECNPARENT: bInstanceKey ? oKey.RECNPARENT : "",
			ATNAM: oCharHeader.getFieldName(),
			RECN_VP: bInstanceKey ? oKey.RECN_VP : "",
			ACTN_VP: bInstanceKey ? oKey.ACTN_VP : ""
		});

		var oBatchRequest = this._createBatchOperation("/GetCharValueHelperList?" + sParams, "GET");

		var fProcess = function (aBatchResponses) {
			var aCharValueHelpers = aBatchResponses[0].data.results;
			return aCharValueHelpers;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.charValueHelperList",
			batchRequests: [oBatchRequest],
			process: fProcess
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForFetchMultiComposition = function (oInstanceKey, oExtParam) {
		this._checkInit();

		this._checkInstanceKey(oInstanceKey);

		var that = this;

		var sParams = this._escapeParamsForFI({
			RECNROOT: oInstanceKey.RECNROOT,
			ACTN: oInstanceKey.ACTN,
			RECNPARENT: oInstanceKey.RECNPARENT,
			ESTCAT: oInstanceKey.ESTCAT,
			RECN_VP: oInstanceKey.RECN_VP,
			ACTN_VP: oInstanceKey.ACTN_VP
		});

		var oBatchRequest = this._createBatchOperation("/GetMLC?" + sParams, "GET");
		var aBatchRequests = [oBatchRequest];

		// EXT_HOOK: _extHookRequestForFetchCompositionAddBatchRequests
		// Add custom batch requests.

		if (this._extHookRequestForFetchCompositionAddBatchRequests) {
			var _aBatchRequests = this._extHookRequestForFetchCompositionAddBatchRequests(oInstanceKey, oExtParam);
			aBatchRequests = aBatchRequests.concat(_aBatchRequests);
		}

		var fProcess = function (aBatchResponses) {
			var aCompositions = aBatchResponses[0].data.results;
			var oResponse = {
				entries: aCompositions
			};

			// EXT_HOOK: _extHookRequestForFetchCompositionProcess
			// Customize processing.

			if (that._extHookRequestForFetchCompositionProcess) {
				var _aBatchResponses = aBatchResponses.slice(1);
				that._extHookRequestForFetchCompositionProcess(oExtParam, _aBatchResponses, oResponse);
			}

			return oResponse;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.composition.fetch",
			batchRequests: aBatchRequests,
			process: fProcess
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForFetchMLCSpecValue = function (oInstanceKey) {

		var that = this;
		if (oInstanceKey.SUBID == undefined)
			oInstanceKey.SUBID = "";

		if (oInstanceKey.IDENT1 == undefined)
			oInstanceKey.IDENT1 = "";

		if (oInstanceKey.ESTCAT == undefined)
			oInstanceKey.ESTCAT = "";

		var sParams = this._escapeParamsForFI({
			SUBID: oInstanceKey.SUBID,
			IDENT_DESCR1: oInstanceKey.IDENT1,
			ESTCAT: oInstanceKey.ESTCAT
		});

		var oBatchRequest = this._createBatchOperation("/SpecSearchHelp?" + sParams, "GET");
		var aBatchRequests = [oBatchRequest];

		// EXT_HOOK: _extHookRequestForFetchCompositionAddBatchRequests
		// Add custom batch requests.
		var fProcess = function (aBatchResponses) {
			var aCompositions = aBatchResponses[0].data.results;
			var oResponse = {
				entries: aCompositions
			};

			// EXT_HOOK: _extHookRequestForFetchCompositionProcess
			// Customize processing.
			return oResponse;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.composition.fetch",
			batchRequests: aBatchRequests,
			process: fProcess
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForFetcUsageDetails = function (oInstanceKey) {

		var that = this;
		if (oInstanceKey.RECNROOT == undefined)
			oInstanceKey.RECNROOT = "";

		if (oInstanceKey.ACTN == undefined)
			oInstanceKey.IDENT1 = "";

		if (oInstanceKey.ESTCAT == undefined)
			oInstanceKey.ESTCAT = "";

		if (oInstanceKey.RECN_VP == undefined)
			oInstanceKey.RECN_VP = "";

		if (oInstanceKey.ACTN_VP == undefined)
			oInstanceKey.ACTN_VP = "";

		if (oInstanceKey.RECNPARENT == undefined)
			oInstanceKey.RECNPARENT = "";

		var sParams = this._escapeParamsForFI({
			RECNROOT: oInstanceKey.RECNROOT,
			ACTN: oInstanceKey.ACTN,
			RECNPARENT: oInstanceKey.RECNPARENT,
			ESTCAT: oInstanceKey.ESTCAT,
			RECN_VP: oInstanceKey.RECN_VP,
			ACTN_VP: oInstanceKey.ACTN_VP
		});

		var oBatchRequest = this._createBatchOperation("/GetUsage?" + sParams, "GET");
		var aBatchRequests = [oBatchRequest];

		// EXT_HOOK: _extHookRequestForFetchCompositionAddBatchRequests
		// Add custom batch requests.
		var fProcess = function (aBatchResponses) {
			var aCompositions = aBatchResponses[0].data.results;
			var oResponse = {
				entries: aCompositions
			};

			// EXT_HOOK: _extHookRequestForFetchCompositionProcess
			// Customize processing.
			return oResponse;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.composition.fetch",
			batchRequests: aBatchRequests,
			process: fProcess
		};

		return oRequest;
	};
	PLMODataManager.prototype.requestForCreateMultiComposition = function (oCreateInfo, oComposition, oExtParam) {
		this._checkInit();

		var oInstanceKey = oCreateInfo.parentKey;
		if (oInstanceKey)
			this._checkInstanceKey(oInstanceKey);

		var sParams = this._escapeParamsForKey({
			RECNROOT: oInstanceKey ? oInstanceKey.RECNROOT : "0",
			ACTN: oInstanceKey ? oInstanceKey.ACTN : "0",
			RECNPARENT: oInstanceKey ? oInstanceKey.RECNPARENT : "0",
			ESTCAT: oInstanceKey ? oInstanceKey.ESTCAT : "",
			RECN_VP: oInstanceKey ? oInstanceKey.RECN_VP : "0",
			ACTN_VP: oInstanceKey ? oInstanceKey.ACTN_VP : "0"
		});

		var oHeaders = {};
		var iParentIndex = oCreateInfo.parentIndex;
		if (iParentIndex != null)
			oHeaders[INDEX.PARENT] = iParentIndex.toString();

		var oData = this._filterComposition(oComposition, oExtParam);

		var oBatchRequest = this._createBatchOperation("/InstanceCollection(" + sParams + ")/Composition", "POST", oData, oHeaders);

		var fProcess = function (aBatchResponses) {
			var oCompositionKey = aBatchResponses[0].data;
			return oCompositionKey;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.composition.create",
			batchRequests: [oBatchRequest],
			process: fProcess,
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForUpdateMultiComposition = function (oComposition, oExtParam) {
		this._checkInit();

		// this._checkCompositionKey(oComposition);

		var sParams = this._escapeParamsForFI({
			ABS_QTY: oComposition.ABS_QTY,
			ACTN: oComposition.ACTN,
			ACTN_VP: oComposition.ACTN_VP,
			CHILD_KEY: oComposition.CHILD_KEY,
			COMPCAT: oComposition.COMPCAT,
			COMPNAM: oComposition.COMPNAM,
			ESTCAT: oComposition.ESTCAT,
			EXP_LEVEL: oComposition.EXP_LEVEL.toString(),
			IDENT1: oComposition.IDENT1,
			ITEM_KEY: oComposition.ITEM_KEY,
			ORD: oComposition.ORD,
			PARENT_KEY: oComposition.PARENT_KEY,
			RECN: oComposition.RECN,
			RECNPARENT: oComposition.RECNPARENT,
			RECNROOT: oComposition.RECNROOT,
			RECN_VP: oComposition.RECN_VP,
			ROW_KEY: oComposition.ROW_KEY,
			SORTNO: oComposition.SORTNO,
			SUBID: oComposition.SUBID,
			UOM: oComposition.UOM,
			COMPAVG: oComposition.COMPAVG.toString(),
			DELFLG: oComposition.DELFLG
		});

		var oBatchRequest = this._createBatchOperation("/UpdateMLC?" + sParams, "POST");

		var oRequest = {
			messageKey: "PLMODataManager.error.multicomposition.update",
			batchRequests: [oBatchRequest],
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForUpdateUsagedat = function (oComposition) {
		this._checkInit();

		// this._checkCompositionKey(oComposition);

		var sParams = this._escapeParamsForFI({
			ACTN: oComposition.ACTN,
			ACTVFLG: false,
			ESTCAT: oComposition.ESTCAT,
			ESNTFLG: false,
			EXCLFLG: false,
			RECN: "",
			RVLID: oComposition.RVLID,
			RVLNAM: oComposition.RVLNAM,
			RVLTYPE: "",
			RVLTYPENAM: "",
			RECNROOT: oComposition.RECNROOT,
			RECNMST: oComposition.RECNMST,
			RECNPARENT: oComposition.RECNPARENT,
			VACLID: "",
			VACLNAM: ""
		});

		var oBatchRequest = this._createBatchOperation("/UpdateUsage?" + sParams, "POST");

		var oRequest = {
			messageKey: "PLMODataManager.error.UpdateUsage.update",
			batchRequests: [oBatchRequest],
			change: true
		};

		return oRequest;
	};
	PLMODataManager.prototype.requestForDeleteMultiComposition = function (oCompositionKey) {
		this._checkInit();

		this._checkCompositionKey(oCompositionKey);

		var sParams = this._escapeParamsForKey({
			RECNROOT: oCompositionKey.RECNROOT,
			SPC_ACTN: oCompositionKey.SPC_ACTN,
			RECN: oCompositionKey.RECN,
			ACTN: oCompositionKey.ACTN,
			RECNPARENT: oCompositionKey.RECNPARENT,
			ESTCAT: oCompositionKey.ESTCAT,
			RECN_VP: oCompositionKey.RECN_VP,
			ACTN_VP: oCompositionKey.ACTN_VP
		});

		var oBatchRequest = this._createBatchOperation("/CompositionCollection(" + sParams + ")", "DELETE");

		var oRequest = {
			messageKey: "PLMODataManager.error.composition.delete",
			batchRequests: [oBatchRequest],
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForFetchComposition = function (oInstanceKey, oExtParam) {
		this._checkInit();

		this._checkInstanceKey(oInstanceKey);

		var that = this;

		var sParams = this._escapeParamsForKey({
			RECNROOT: oInstanceKey.RECNROOT,
			ACTN: oInstanceKey.ACTN,
			RECNPARENT: oInstanceKey.RECNPARENT,
			ESTCAT: oInstanceKey.ESTCAT,
			RECN_VP: oInstanceKey.RECN_VP,
			ACTN_VP: oInstanceKey.ACTN_VP
		});

		var oBatchRequest = this._createBatchOperation("/InstanceCollection(" + sParams + ")/Composition", "GET");
		var aBatchRequests = [oBatchRequest];

		// EXT_HOOK: _extHookRequestForFetchCompositionAddBatchRequests
		// Add custom batch requests.

		if (this._extHookRequestForFetchCompositionAddBatchRequests) {
			var _aBatchRequests = this._extHookRequestForFetchCompositionAddBatchRequests(oInstanceKey, oExtParam);
			aBatchRequests = aBatchRequests.concat(_aBatchRequests);
		}

		var fProcess = function (aBatchResponses) {
			var aCompositions = aBatchResponses[0].data.results;
			var oResponse = {
				entries: aCompositions
			};

			// EXT_HOOK: _extHookRequestForFetchCompositionProcess
			// Customize processing.

			if (that._extHookRequestForFetchCompositionProcess) {
				var _aBatchResponses = aBatchResponses.slice(1);
				that._extHookRequestForFetchCompositionProcess(oExtParam, _aBatchResponses, oResponse);
			}

			return oResponse;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.composition.fetch",
			batchRequests: aBatchRequests,
			process: fProcess
		};

		return oRequest;
	};
	PLMODataManager.prototype.requestForCreateComposition = function (oCreateInfo, oComposition, oExtParam) {
		this._checkInit();

		var oInstanceKey = oCreateInfo.parentKey;
		if (oInstanceKey)
			this._checkInstanceKey(oInstanceKey);

		var sParams = this._escapeParamsForKey({
			RECNROOT: oInstanceKey ? oInstanceKey.RECNROOT : "0",
			ACTN: oInstanceKey ? oInstanceKey.ACTN : "0",
			RECNPARENT: oInstanceKey ? oInstanceKey.RECNPARENT : "0",
			ESTCAT: oInstanceKey ? oInstanceKey.ESTCAT : "",
			RECN_VP: oInstanceKey ? oInstanceKey.RECN_VP : "0",
			ACTN_VP: oInstanceKey ? oInstanceKey.ACTN_VP : "0"
		});

		var oHeaders = {};
		var iParentIndex = oCreateInfo.parentIndex;
		if (iParentIndex != null)
			oHeaders[INDEX.PARENT] = iParentIndex.toString();

		var oData = this._filterComposition(oComposition, oExtParam);

		var oBatchRequest = this._createBatchOperation("/InstanceCollection(" + sParams + ")/Composition", "POST", oData, oHeaders);

		var fProcess = function (aBatchResponses) {
			var oCompositionKey = aBatchResponses[0].data;
			return oCompositionKey;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.composition.create",
			batchRequests: [oBatchRequest],
			process: fProcess,
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForUpdateComposition = function (oComposition, oExtParam) {
		this._checkInit();

		this._checkCompositionKey(oComposition);

		var sParams = this._escapeParamsForKey({
			RECNROOT: oComposition.RECNROOT,
			SPC_ACTN: oComposition.SPC_ACTN,
			RECN: oComposition.RECN,
			ACTN: oComposition.ACTN,
			RECNPARENT: oComposition.RECNPARENT,
			ESTCAT: oComposition.ESTCAT,
			RECN_VP: oComposition.RECN_VP,
			ACTN_VP: oComposition.ACTN_VP
		});

		var oData = this._filterComposition(oComposition, oExtParam);

		var oBatchRequest = this._createBatchOperation("/CompositionCollection(" + sParams + ")", "PUT", oData);

		var oRequest = {
			messageKey: "PLMODataManager.error.composition.update",
			batchRequests: [oBatchRequest],
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForDeleteComposition = function (oCompositionKey) {
		this._checkInit();

		this._checkCompositionKey(oCompositionKey);

		var sParams = this._escapeParamsForKey({
			RECNROOT: oCompositionKey.RECNROOT,
			SPC_ACTN: oCompositionKey.SPC_ACTN,
			RECN: oCompositionKey.RECN,
			ACTN: oCompositionKey.ACTN,
			RECNPARENT: oCompositionKey.RECNPARENT,
			ESTCAT: oCompositionKey.ESTCAT,
			RECN_VP: oCompositionKey.RECN_VP,
			ACTN_VP: oCompositionKey.ACTN_VP
		});

		var oBatchRequest = this._createBatchOperation("/CompositionCollection(" + sParams + ")", "DELETE");

		var oRequest = {
			messageKey: "PLMODataManager.error.composition.delete",
			batchRequests: [oBatchRequest],
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForFetchGroup = function (oPropertyKey) {
		this._checkInit();

		this._checkPropertyKey(oPropertyKey);

		var that = this;

		var sParams = this._escapeParamsForFI({
			RECNROOT: oPropertyKey.RECNROOT,
			ACTN: oPropertyKey.ACTN,
			ESTCAT: oPropertyKey.ESTCAT
		});

		var oBatchRequest = this._createBatchOperation("/GetGroup?" + sParams, "GET");

		var fProcess = function (aBatchResponses) {
			var aGroupEntries = aBatchResponses[0].data.results;
			var oGroupInfo = that._buildGroupInfo(aGroupEntries);

			return oGroupInfo;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.group.fetch",
			batchRequests: [oBatchRequest],
			process: fProcess
		};

		return oRequest;
	};
	//2217
	PLMODataManager.prototype.requestForCompHeader = function (oPropertyKey) {
		this._checkInit();

		this._checkPropertyKey(oPropertyKey);

		var that = this;

		var sParams = this._escapeParamsForFI({
			RECNROOT: oPropertyKey.RECNROOT,
			ACTN: oPropertyKey.ACTN,
			ESTCAT: oPropertyKey.ESTCAT
		});

		var oBatchRequest = this._createBatchOperation("/GetCompHeader?" + sParams, "GET");

		var fProcess = function (aBatchResponses) {
			var aheaders = aBatchResponses[0].data.results;

			return aheaders;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.CompHeader.fetch",
			batchRequests: [oBatchRequest],
			process: fProcess
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForVatlist = function (oParentKey) {
		this._checkInit();

		// this._checkPropertyKey(oPropertyKey);

		var that = this;

		var sParams = this._escapeParamsForFI({
			RECNROOT: oParentKey.RECNROOT,
			ACTN: oParentKey.ACTN
		});

		var oBatchRequest = that._createBatchOperation("/GetVatList?" + sParams, "GET");

		var fProcess = function (aBatchResponses) {
			var aheaders = aBatchResponses[0].data.results;

			return aheaders;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.VATList.fetch",
			batchRequests: [oBatchRequest],
			process: fProcess
		};

		return oRequest;
	};
	//2217
	// dynamic qual
	PLMODataManager.prototype.requestForFetchdynQual = function (oInstanceKey, oExtParam) {
		this._checkInit();

		this._checkInstanceKey(oInstanceKey);
		var aBatchRequests = [];
		var that = this;

		if (oInstanceKey.RECNROOT == null) {
			oInstanceKey.RECNROOT = "0";
		}
		if (oInstanceKey.ACTN == null) {
			oInstanceKey.ACTN = "0";
		}
		if (oInstanceKey.RECNPARENT == null) {
			oInstanceKey.RECNPARENT = "0";
		}
		if (oInstanceKey.ESTCAT == null) {
			oInstanceKey.ESTCAT = "0";
		}
		if (oInstanceKey.RECN_VP == null) {
			oInstanceKey.RECN_VP = "0";
		}
		if (oInstanceKey.ACTN_VP == null) {
			oInstanceKey.ACTN_VP = "0";
		}
		var sParams = this._escapeParamsForFI({
			RECNROOT: oInstanceKey.RECNROOT,
			ACTN: oInstanceKey.ACTN,
			RECNPARENT: oInstanceKey.RECNPARENT,
			ESTCAT: oInstanceKey.ESTCAT,
			RECN_VP: oInstanceKey.RECN_VP,
			ACTN_VP: oInstanceKey.ACTN_VP
		});
		var oBatchRequest = this._createBatchOperation("/InstanceQualToCompositionField?" + sParams, "GET");
		aBatchRequests.push(oBatchRequest);

		var sParams1 = this._escapeParamsForFI({
			RECNROOT: oInstanceKey.RECNROOT,
			ACTN: oInstanceKey.ACTN,
			ESTCAT: oInstanceKey.ESTCAT
		});

		var oBatchRequest1 = this._createBatchOperation("/GetCompHeader?" + sParams1, "GET");
		aBatchRequests.push(oBatchRequest1);
		// EXT_HOOK: _extHookRequestForFetchQualAddBatchRequests
		// Add custom batch requests.

		if (this._extHookRequestForFetchQualAddBatchRequests) {
			var _aBatchRequests = this._extHookRequestForFetchQualAddBatchRequests(oInstanceKey, oExtParam);
			aBatchRequests = aBatchRequests.concat(_aBatchRequests);
		}

		var fProcess = function (aBatchResponses) {
			var aQuals = aBatchResponses[0].data.results;
			// var aQuals = aBatchResponses;
			var i = 0;

			var data2 = aBatchResponses[0].data.results,
				data = [],
				modelql = [],
				aCharHeaders = aBatchResponses[1].data.results;
			// 		var modelql = {
			// 	colhd: [],
			// 	Data: []
			// };	
			// for (i = 0; i < aCharHeaders.length; i++) {

			// var oCharHeader = aCharHeaders[i];
			// var sHeaderColumnText = oCharHeader.ColDescr;

			// modelql.colhd[i] = {
			// 	label: sHeaderColumnText
			// 	};
			// }
			i = 0;
			for (var j = 0; j < data2.length; j++) {
				if (j != 0 && data2[j].KEY_VP != data2[j - 1].KEY_VP) {
					data["RECN"] = data2[j - 1].RECN;
					data["RECNROOT"] = data2[j - 1].RECNROOT;
					data["RECN_VP"] = data2[j - 1].RECN_VP;
					data["ACTN"] = data2[j - 1].ACTN;
					data["ACTN_VP"] = data2[j - 1].ACTN_VP;
					data["RECNPARENT"] = data2[j - 1].RECNPARENT;
					data["SPC_ACTN"] = data2[j - 1].SPC_ACTN;
					data["ESTCAT"] = data2[j - 1].ESTCAT;
					data["KEY_VP"] = data2[j - 1].KEY_VP;
					modelql[i] = jQuery.extend({}, data);
					i++;
				}
				for (var k = 0; k < aCharHeaders.length; k++) {
					if (data2[j].FIELDNAME == aCharHeaders[k].ColId) {
						if (aCharHeaders[k].AsRadiobutton == true) {
							if (data2[j].FIELDVALUE == "") {
								data[data2[j].FIELDNAME] = false;
							} else {
								data[data2[j].FIELDNAME] = true;
							}
						} else {
							data[data2[j].FIELDNAME] = data2[j].FIELDVALUE;
						}
					}
				}
			}
			if (j == data2.length && data2.length != 0) {
				data["RECN"] = data2[j - 1].RECN;
				data["RECNROOT"] = data2[j - 1].RECNROOT;
				data["RECN_VP"] = data2[j - 1].RECN_VP;
				data["ACTN"] = data2[j - 1].ACTN;
				data["ACTN_VP"] = data2[j - 1].ACTN_VP;
				data["RECNPARENT"] = data2[j - 1].RECNPARENT;
				data["SPC_ACTN"] = data2[j - 1].SPC_ACTN;
				data["ESTCAT"] = data2[j - 1].ESTCAT;
				data["KEY_VP"] = data2[j - 1].KEY_VP;
				modelql[i] = jQuery.extend({}, data);
			}
			var oResponse = {
				entries: modelql
			};

			// EXT_HOOK: _extHookRequestForFetchQualProcess
			// Customize processing.

			if (that._extHookRequestForFetchQualProcess) {
				var _aBatchResponses = aBatchResponses.slice(1);
				that._extHookRequestForFetchQualProcess(oExtParam, _aBatchResponses, oResponse);
			}

			return oResponse;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.qual.fetch",
			batchRequests: aBatchRequests,
			process: fProcess
		};

		return oRequest;
	};
	// dynamic qual
	PLMODataManager.prototype.requestForFetchQual = function (oInstanceKey, oExtParam) {
		this._checkInit();

		this._checkInstanceKey(oInstanceKey);

		var that = this;

		var sParams = this._escapeParamsForKey({
			RECNROOT: oInstanceKey.RECNROOT,
			ACTN: oInstanceKey.ACTN,
			RECNPARENT: oInstanceKey.RECNPARENT,
			ESTCAT: oInstanceKey.ESTCAT,
			RECN_VP: oInstanceKey.RECN_VP,
			ACTN_VP: oInstanceKey.ACTN_VP
		});

		var oBatchRequest = this._createBatchOperation("/InstanceCollection(" + sParams + ")/Qual", "GET");
		var aBatchRequests = [oBatchRequest];
		// EXT_HOOK: _extHookRequestForFetchQualAddBatchRequests
		// Add custom batch requests.

		if (this._extHookRequestForFetchQualAddBatchRequests) {
			var _aBatchRequests = this._extHookRequestForFetchQualAddBatchRequests(oInstanceKey, oExtParam);
			aBatchRequests = aBatchRequests.concat(_aBatchRequests);
		}

		var fProcess = function (aBatchResponses) {
			var aQuals = aBatchResponses[0].data.results;
			// var aQuals = aBatchResponses;

			var oResponse = {
				entries: aQuals
			};

			// EXT_HOOK: _extHookRequestForFetchQualProcess
			// Customize processing.

			if (that._extHookRequestForFetchQualProcess) {
				var _aBatchResponses = aBatchResponses.slice(1);
				that._extHookRequestForFetchQualProcess(oExtParam, _aBatchResponses, oResponse);
			}

			return oResponse;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.qual.fetch",
			batchRequests: aBatchRequests,
			process: fProcess
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForFetchQuant = function (oInstanceKey, oExtParam) {
		this._checkInit();

		this._checkInstanceKey(oInstanceKey);

		var that = this;

		var sParams = this._escapeParamsForKey({
			RECNROOT: oInstanceKey.RECNROOT,
			ACTN: oInstanceKey.ACTN,
			RECNPARENT: oInstanceKey.RECNPARENT,
			ESTCAT: oInstanceKey.ESTCAT,
			RECN_VP: oInstanceKey.RECN_VP,
			ACTN_VP: oInstanceKey.ACTN_VP
		});

		var oBatchRequest = this._createBatchOperation("/InstanceCollection(" + sParams + ")/Quant", "GET");
		var aBatchRequests = [oBatchRequest];

		// EXT_HOOK: _extHookRequestForFetchQualAddBatchRequests
		// Add custom batch requests.

		if (this._extHookRequestForFetchQualAddBatchRequests) {
			var _aBatchRequests = this._extHookRequestForFetchQualAddBatchRequests(oInstanceKey, oExtParam);
			aBatchRequests = aBatchRequests.concat(_aBatchRequests);
		}

		var fProcess = function (aBatchResponses) {
			var aQuants = aBatchResponses[0].data.results;
			var oResponse = {
				entries: aQuants
			};

			// EXT_HOOK: _extHookRequestForFetchQualProcess
			// Customize processing.

			if (that._extHookRequestForFetchQualProcess) {
				var _aBatchResponses = aBatchResponses.slice(1);
				that._extHookRequestForFetchQualProcess(oExtParam, _aBatchResponses, oResponse);
			}

			return oResponse;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.quant.fetch",
			batchRequests: aBatchRequests,
			process: fProcess
		};

		return oRequest;
	};
	//dyn quant
	PLMODataManager.prototype.requestForFetchdynQuant = function (oInstanceKey, oExtParam) {
		this._checkInit();

		this._checkInstanceKey(oInstanceKey);

		var that = this;
		if (oInstanceKey.RECNROOT == null) {
			oInstanceKey.RECNROOT = "0";
		}
		if (oInstanceKey.ACTN == null) {
			oInstanceKey.ACTN = "0";
		}
		if (oInstanceKey.RECNPARENT == null) {
			oInstanceKey.RECNPARENT = "0";
		}
		if (oInstanceKey.ESTCAT == null) {
			oInstanceKey.ESTCAT = "0";
		}
		if (oInstanceKey.RECN_VP == null) {
			oInstanceKey.RECN_VP = "0";
		}
		if (oInstanceKey.ACTN_VP == null) {
			oInstanceKey.ACTN_VP = "0";
		}
		var sParams = this._escapeParamsForFI({
			RECNROOT: oInstanceKey.RECNROOT,
			ACTN: oInstanceKey.ACTN,
			RECNPARENT: oInstanceKey.RECNPARENT,
			ESTCAT: oInstanceKey.ESTCAT,
			RECN_VP: oInstanceKey.RECN_VP,
			ACTN_VP: oInstanceKey.ACTN_VP
		});

		var oBatchRequest = this._createBatchOperation("/InstanceQuantToCompositionField?" + sParams, "GET");
		var aBatchRequests = [oBatchRequest];

		var sParams1 = this._escapeParamsForFI({
			RECNROOT: oInstanceKey.RECNROOT,
			ACTN: oInstanceKey.ACTN,
			ESTCAT: oInstanceKey.ESTCAT
		});

		var oBatchRequest1 = this._createBatchOperation("/GetCompHeader?" + sParams1, "GET");
		aBatchRequests.push(oBatchRequest1);
		// EXT_HOOK: _extHookRequestForFetchQuantAddBatchRequests
		// Add custom batch requests.

		if (this._extHookRequestForFetchQuantAddBatchRequests) {
			var _aBatchRequests = this._extHookRequestForFetchQuantAddBatchRequests(oInstanceKey, oExtParam);
			aBatchRequests = aBatchRequests.concat(_aBatchRequests);
		}

		var fProcess = function (aBatchResponses) {
			// var aQuants = aBatchResponses[0].data.results;

			var i = 0;

			var data2 = aBatchResponses[0].data.results,
				data = [],
				modelql = [],
				aCharHeaders = aBatchResponses[1].data.results;
			for (var j = 0; j < data2.length; j++) {
				if (j != 0 && data2[j].KEY_VP != data2[j - 1].KEY_VP) {
					data["RECN"] = data2[j - 1].RECN;
					data["RECNROOT"] = data2[j - 1].RECNROOT;
					data["RECN_VP"] = data2[j - 1].RECN_VP;
					data["ACTN"] = data2[j - 1].ACTN;
					data["ACTN_VP"] = data2[j - 1].ACTN_VP;
					data["RECNPARENT"] = data2[j - 1].RECNPARENT;
					data["SPC_ACTN"] = data2[j - 1].SPC_ACTN;
					data["ESTCAT"] = data2[j - 1].ESTCAT;
					data["KEY_VP"] = data2[j - 1].KEY_VP;
					modelql[i] = jQuery.extend({}, data);
					i++;
				}
				for (var k = 0; k < aCharHeaders.length; k++) {
					if (data2[j].FIELDNAME == aCharHeaders[k].ColId) {
						if (aCharHeaders[k].AsRadiobutton == true) {
							if (data2[j].FIELDVALUE == "") {
								data[data2[j].FIELDNAME] = false;
							} else {
								data[data2[j].FIELDNAME] = true;
							}
						} else {
							data[data2[j].FIELDNAME] = data2[j].FIELDVALUE;
						}
					}
				}
			}
			if (j == data2.length && data2.length != 0) {
				data["RECN"] = data2[j - 1].RECN;
				data["RECNROOT"] = data2[j - 1].RECNROOT;
				data["RECN_VP"] = data2[j - 1].RECN_VP;
				data["ACTN"] = data2[j - 1].ACTN;
				data["ACTN_VP"] = data2[j - 1].ACTN_VP;
				data["RECNPARENT"] = data2[j - 1].RECNPARENT;
				data["SPC_ACTN"] = data2[j - 1].SPC_ACTN;
				data["ESTCAT"] = data2[j - 1].ESTCAT;
				data["KEY_VP"] = data2[j - 1].KEY_VP;
				modelql[i] = jQuery.extend({}, data);
			}
			var oResponse = {
				entries: modelql
			};
			// var oResponse = {
			// 	entries: aQuants
			// };

			// EXT_HOOK: _extHookRequestForFetchQuantProcess
			// Customize processing.

			if (that._extHookRequestForFetchQuantProcess) {
				var _aBatchResponses = aBatchResponses.slice(1);
				that._extHookRequestForFetchQuantProcess(oExtParam, _aBatchResponses, oResponse);
			}

			return oResponse;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.quant.fetch",
			batchRequests: aBatchRequests,
			process: fProcess
		};

		return oRequest;
	};

	// dyn quant
	PLMODataManager.prototype.requestForFetchQualEmpty = function (oPropertyKey, oExtParam) {
		this._checkInit();

		this._checkPropertyKey(oPropertyKey);

		var that = this;

		var sParams = this._escapeParamsForFI({
			RECNROOT: oPropertyKey.RECNROOT,
			ACTN: oPropertyKey.ACTN,
			ESTCAT: oPropertyKey.ESTCAT
		});

		var oBatchRequest = this._createBatchOperation("/GetQualEmpty?" + sParams, "GET");
		var aBatchRequests = [oBatchRequest];

		// EXT_HOOK: _extHookRequestForFetchQualEmptyAddBatchRequests
		// Add custom batch requests.

		if (this._extHookRequestForFetchQualEmptyAddBatchRequests) {
			var _aBatchRequests = this._extHookRequestForFetchQualEmptyAddBatchRequests(oPropertyKey, oExtParam);
			aBatchRequests = aBatchRequests.concat(_aBatchRequests);
		}

		var fProcess = function (aBatchResponses) {
			var aQualEmptys = aBatchResponses[0].data.results;
			var oResponse = {
				entries: aQualEmptys
			};

			// EXT_HOOK: _extHookRequestForFetchQualEmptyProcess
			// Customize processing.

			if (that._extHookRequestForFetchQualEmptyProcess) {
				var _aBatchResponses = aBatchResponses.slice(1);
				that._extHookRequestForFetchQualEmptyProcess(oExtParam, _aBatchResponses, oResponse);
			}

			return oResponse;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.qual.fetch",
			batchRequests: aBatchRequests,
			process: fProcess
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForCreateQual = function (oCreateInfo, oQual, oExtParam, oHeaderinfo) {
		// This method is used for both create and update.

		this._checkInit();

		var oInstanceKey = oCreateInfo.parentKey;
		if (oInstanceKey)
			this._checkInstanceKey(oInstanceKey);

		var sParams1 = this._escapeParamsForFI({
			RECNROOT: oInstanceKey ? oInstanceKey.RECNROOT : "0",
			ACTN: oInstanceKey ? oInstanceKey.ACTN : "0",
			RECNPARENT: oInstanceKey ? oInstanceKey.RECNPARENT : "0",
			ESTCAT: oInstanceKey ? oInstanceKey.ESTCAT : "",
			RECN_VP: oInstanceKey ? oInstanceKey.RECN_VP : "0",
			ACTN_VP: oInstanceKey ? oInstanceKey.ACTN_VP : "0",
			RECN: oQual.RECN
		});

		var oHeaders = {};
		var iParentIndex = oCreateInfo.parentIndex;
		if (iParentIndex != null)
			oHeaders[INDEX.PARENT] = iParentIndex.toString();
		var fldnm = "FIELDNAME";
		var flval = "FIELDVALUE";
		// var keyvp = "KeyVp";

		var fieldinfo = [],
			fieldval = [],
			oBatchRequests = [];
		for (var i = 0; i < oHeaderinfo.length; i++) {
			fieldinfo[fldnm] = oHeaderinfo[i].ColId;
			if (oHeaderinfo[i].AsRadiobutton == true) {
				if (oQual[oHeaderinfo[i].ColId] == true)
					fieldinfo[flval] = "X";
				else
					fieldinfo[flval] = "";
			} else {
				fieldinfo[flval] = oQual[oHeaderinfo[i].ColId];
			}
			// fieldinfo[keyvp] = oQual[keyvp];
			fieldval[i] = jQuery.extend({}, fieldinfo);

			var sParams = this._escapeParamsForFI({
				FieldName: fieldinfo[fldnm],
				FieldValue: fieldinfo[flval],
				// KeyVp: fieldinfo[keyvp]
			});

			var aBatchRequest = this._createBatchOperation("/SetInstanceField?" + sParams, "POST");

			oBatchRequests.push(aBatchRequest);
		}

		// var oData = this._filterQual(oQual, oExtParam);

		// var oBatchRequest1 = this._createBatchOperation("/InstanceCollection(" + sParams + ")/Qual", "POST", oData, oHeaders);
		// var oBatchRequest1 = this._createBatchOperation("/InstanceCollection(" + sParams + ")/Qual", "POST");

		var oBatchRequest1 = this._createBatchOperation("/UpdateInstanceQual?" + sParams1, "POST");
		oBatchRequests.push(oBatchRequest1);

		var fProcess = function (aBatchResponses) {
			var oQualKey = aBatchResponses[0].data;
			return oQualKey;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.qual.create",
			batchRequests: oBatchRequests,
			process: fProcess,
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForDeleteQual = function (oQualKey) {
		this._checkInit();

		this._checkQualKey(oQualKey);

		var sParams = this._escapeParamsForKey({
			RECNROOT: oQualKey.RECNROOT,
			SPC_ACTN: oQualKey.SPC_ACTN,
			RECN: oQualKey.RECN,
			ACTN: oQualKey.ACTN,
			RECNPARENT: oQualKey.RECNPARENT,
			ESTCAT: oQualKey.ESTCAT,
			RECN_VP: oQualKey.RECN_VP,
			ACTN_VP: oQualKey.ACTN_VP
		});

		var oBatchRequest = this._createBatchOperation("/QualCollection(" + sParams + ")", "DELETE");

		var oRequest = {
			messageKey: "PLMODataManager.error.qual.delete",
			batchRequests: [oBatchRequest],
			change: true
		};

		return oRequest;
	};

	// 

	PLMODataManager.prototype.requestForFetchQuantEmpty = function (oPropertyKey, oExtParam) {
		this._checkInit();

		this._checkPropertyKey(oPropertyKey);

		var that = this;

		var sParams = this._escapeParamsForFI({
			RECNROOT: oPropertyKey.RECNROOT,
			ACTN: oPropertyKey.ACTN,
			ESTCAT: oPropertyKey.ESTCAT
		});

		var oBatchRequest = this._createBatchOperation("/GetQuantEmpty?" + sParams, "GET");
		var aBatchRequests = [oBatchRequest];

		// EXT_HOOK: _extHookRequestForFetchQuantEmptyAddBatchRequests
		// Add custom batch requests.

		if (this._extHookRequestForFetchQuantEmptyAddBatchRequests) {
			var _aBatchRequests = this._extHookRequestForFetchQuantEmptyAddBatchRequests(oPropertyKey, oExtParam);
			aBatchRequests = aBatchRequests.concat(_aBatchRequests);
		}

		var fProcess = function (aBatchResponses) {
			var aQuantEmptys = aBatchResponses[0].data.results;
			var oResponse = {
				entries: aQuantEmptys
			};

			// EXT_HOOK: _extHookRequestForFetchQuantEmptyProcess
			// Customize processing.

			if (that._extHookRequestForFetchQuantEmptyProcess) {
				var _aBatchResponses = aBatchResponses.slice(1);
				that._extHookRequestForFetchQuantEmptyProcess(oExtParam, _aBatchResponses, oResponse);
			}

			return oResponse;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.quant.fetch",
			batchRequests: aBatchRequests,
			process: fProcess
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForCreateQuant = function (oCreateInfo, oQuant, oExtParam, oHeaderinfo) {
		// This method is used for both create and update.

		this._checkInit();

		var oInstanceKey = oCreateInfo.parentKey;
		if (oInstanceKey)
			this._checkInstanceKey(oInstanceKey);

		var sParams1 = this._escapeParamsForFI({
			RECNROOT: oInstanceKey ? oInstanceKey.RECNROOT : "0",
			ACTN: oInstanceKey ? oInstanceKey.ACTN : "0",
			RECNPARENT: oInstanceKey ? oInstanceKey.RECNPARENT : "0",
			ESTCAT: oInstanceKey ? oInstanceKey.ESTCAT : "",
			RECN_VP: oInstanceKey ? oInstanceKey.RECN_VP : "0",
			ACTN_VP: oInstanceKey ? oInstanceKey.ACTN_VP : "0",
			RECN: oQuant.RECN
		});

		var oHeaders = {};
		var iParentIndex = oCreateInfo.parentIndex;
		if (iParentIndex != null)
			oHeaders[INDEX.PARENT] = iParentIndex.toString();

		var fldnm = "FIELDNAME";
		var flval = "FIELDVALUE";

		var fieldinfo = [],
			fieldval = [],
			oBatchRequests = [];
		for (var i = 0; i < oHeaderinfo.length; i++) {
			fieldinfo[fldnm] = oHeaderinfo[i].ColId;
			if (oHeaderinfo[i].AsRadiobutton == true) {
				if (oQuant[oHeaderinfo[i].ColId] == true)
					fieldinfo[flval] = "X";
				else
					fieldinfo[flval] = "";
			} else {
				fieldinfo[flval] = oQuant[oHeaderinfo[i].ColId];
			}
			// fieldinfo[keyvp] = oQual[keyvp];
			fieldval[i] = jQuery.extend({}, fieldinfo);

			var sParams = this._escapeParamsForFI({
				FieldName: fieldinfo[fldnm],
				FieldValue: fieldinfo[flval],
				// KeyVp: fieldinfo[keyvp]
			});

			var aBatchRequest = this._createBatchOperation("/SetInstanceField?" + sParams, "POST");

			oBatchRequests.push(aBatchRequest);
		}

		// var oData = this._filterQual(oQual, oExtParam);

		// var oBatchRequest1 = this._createBatchOperation("/InstanceCollection(" + sParams + ")/Qual", "POST", oData, oHeaders);
		// var oBatchRequest1 = this._createBatchOperation("/InstanceCollection(" + sParams + ")/Qual", "POST");

		var oBatchRequest1 = this._createBatchOperation("/UpdateInstanceQuant?" + sParams1, "POST");
		oBatchRequests.push(oBatchRequest1);

		// var oData = this._filterQuant(oQuant, oExtParam);

		// var oBatchRequest = this._createBatchOperation("/InstanceCollection(" + sParams + ")/Quant", "POST", oData, oHeaders);

		var fProcess = function (aBatchResponses) {
			var oQuantKey = aBatchResponses[0].data;
			return oQuantKey;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.quant.create",
			batchRequests: oBatchRequests,
			process: fProcess,
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForDeleteQuant = function (oQuantKey) {
		this._checkInit();

		this._checkQuantKey(oQuantKey);

		var sParams = this._escapeParamsForKey({
			RECNROOT: oQuantKey.RECNROOT,
			SPC_ACTN: oQuantKey.SPC_ACTN,
			RECN: oQuantKey.RECN,
			ACTN: oQuantKey.ACTN,
			RECNPARENT: oQuantKey.RECNPARENT,
			ESTCAT: oQuantKey.ESTCAT,
			RECN_VP: oQuantKey.RECN_VP,
			ACTN_VP: oQuantKey.ACTN_VP
		});

		var oBatchRequest = this._createBatchOperation("/QuantCollection(" + sParams + ")", "DELETE");

		var oRequest = {
			messageKey: "PLMODataManager.error.quant.delete",
			batchRequests: [oBatchRequest],
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForFetchList = function (oInstanceKey, oExtParam) {
		this._checkInit();

		this._checkInstanceKey(oInstanceKey);

		var that = this;

		var sParams = this._escapeParamsForKey({
			RECNROOT: oInstanceKey.RECNROOT,
			ACTN: oInstanceKey.ACTN,
			RECNPARENT: oInstanceKey.RECNPARENT,
			ESTCAT: oInstanceKey.ESTCAT,
			RECN_VP: oInstanceKey.RECN_VP,
			ACTN_VP: oInstanceKey.ACTN_VP
		});

		var oBatchRequest = this._createBatchOperation("/InstanceCollection(" + sParams + ")/List", "GET");
		var aBatchRequests = [oBatchRequest];

		// EXT_HOOK: _extHookRequestForFetchListAddBatchRequests
		// Add custom batch requests.

		if (this._extHookRequestForFetchListAddBatchRequests) {
			var _aBatchRequests = this._extHookRequestForFetchListAddBatchRequests(oInstanceKey, oExtParam);
			aBatchRequests = aBatchRequests.concat(_aBatchRequests);
		}

		var fProcess = function (aBatchResponses) {
			var aLists = aBatchResponses[0].data.results;
			var oResponse = {
				entries: aLists
			};

			// EXT_HOOK: _extHookRequestForFetchListProcess
			// Customize processing.

			if (that._extHookRequestForFetchListProcess) {
				var _aBatchResponses = aBatchResponses.slice(1);
				that._extHookRequestForFetchListProcess(oExtParam, _aBatchResponses, oResponse);
			}

			return oResponse;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.list.fetch",
			batchRequests: aBatchRequests,
			process: fProcess
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForCreateList = function (oCreateInfo, oList, oExtParam) {
		this._checkInit();

		var oInstanceKey = oCreateInfo.parentKey;
		if (oInstanceKey)
			this._checkInstanceKey(oInstanceKey);

		var sParams = this._escapeParamsForKey({
			RECNROOT: oInstanceKey ? oInstanceKey.RECNROOT : "0",
			ACTN: oInstanceKey ? oInstanceKey.ACTN : "0",
			RECNPARENT: oInstanceKey ? oInstanceKey.RECNPARENT : "0",
			ESTCAT: oInstanceKey ? oInstanceKey.ESTCAT : "",
			RECN_VP: oInstanceKey ? oInstanceKey.RECN_VP : "0",
			ACTN_VP: oInstanceKey ? oInstanceKey.ACTN_VP : "0"
		});

		var oHeaders = {};
		var iParentIndex = oCreateInfo.parentIndex;
		if (iParentIndex != null)
			oHeaders[INDEX.PARENT] = iParentIndex.toString();

		var oData = this._filterList(oList, oExtParam);

		var oBatchRequest = this._createBatchOperation("/InstanceCollection(" + sParams + ")/List", "POST", oData, oHeaders);

		var fProcess = function (aBatchResponses) {
			var oListKey = aBatchResponses[0].data;
			return oListKey;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.list.create",
			batchRequests: [oBatchRequest],
			process: fProcess,
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForUpdateList = function (oList, oExtParam) {
		this._checkInit();

		this._checkListKey(oList);

		var sParams = this._escapeParamsForKey({
			RECNROOT: oList.RECNROOT,
			SPC_ACTN: oList.SPC_ACTN,
			RECN: oList.RECN,
			ACTN: oList.ACTN,
			RECNPARENT: oList.RECNPARENT,
			ESTCAT: oList.ESTCAT,
			RECN_VP: oList.RECN_VP,
			ACTN_VP: oList.ACTN_VP,
			RECNTVA: oList.RECNTVA
		});

		var oData = this._filterList(oList, oExtParam);

		var oBatchRequest = this._createBatchOperation("/ListCollection(" + sParams + ")", "PUT", oData);

		var oRequest = {
			messageKey: "PLMODataManager.error.list.update",
			batchRequests: [oBatchRequest],
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForDeleteList = function (oListKey) {
		this._checkInit();

		this._checkListKey(oListKey);

		var sParams = this._escapeParamsForKey({
			RECNROOT: oListKey.RECNROOT,
			SPC_ACTN: oListKey.SPC_ACTN,
			RECN: oListKey.RECN,
			ACTN: oListKey.ACTN,
			RECNPARENT: oListKey.RECNPARENT,
			ESTCAT: oListKey.ESTCAT,
			RECN_VP: oListKey.RECN_VP,
			ACTN_VP: oListKey.ACTN_VP,
			RECNTVA: oListKey.RECNTVA
		});

		var oBatchRequest = this._createBatchOperation("/ListCollection(" + sParams + ")", "DELETE");

		var oRequest = {
			messageKey: "PLMODataManager.error.list.delete",
			batchRequests: [oBatchRequest],
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForFetchUserDefinedText = function (oInstanceKey) {
		this._checkInit();

		// this._checkInstanceKey(oInstanceKey);
		if (oInstanceKey.LAYOUT == null) {
			oInstanceKey.LAYOUT = "";
		}
		if (oInstanceKey.RECNPARENT == null) {
			var sParams = this._escapeParamsForFI({
				RECNROOT: oInstanceKey.RECNROOT,
				ACTN: oInstanceKey.ACTN,
				RECNPARENT: "",
				ESTCAT: oInstanceKey.ESTCAT,
				RECN_VP: "",
				ACTN_VP: "",
				LAYOUT: oInstanceKey.LAYOUT
			});
		} else {
			var sParams = this._escapeParamsForFI({
				RECNROOT: oInstanceKey.RECNROOT,
				ACTN: oInstanceKey.ACTN,
				RECNPARENT: oInstanceKey.RECNPARENT,
				ESTCAT: oInstanceKey.ESTCAT,
				RECN_VP: oInstanceKey.RECN_VP,
				ACTN_VP: oInstanceKey.ACTN_VP,
				LAYOUT: oInstanceKey.LAYOUT
			});
		}

		var oBatchRequest = this._createBatchOperation("/InstanceUserDefinedText?" + sParams, "GET");

		var fProcess = function (aBatchResponses) {
			var aUserDefinedTexts = aBatchResponses[0].data.results;
			var oResponse = {
				entries: aUserDefinedTexts
			};

			return oResponse;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.userdefinedtext.fetch",
			batchRequests: [oBatchRequest],
			process: fProcess
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForCreateUserDefinedText = function (oCreateInfo, oUserDefinedText) {
		this._checkInit();

		var oInstanceKey = oCreateInfo.parentKey;
		if (oInstanceKey)
			this._checkInstanceKey(oInstanceKey);

		var sParams = this._escapeParamsForKey({
			RECNROOT: oInstanceKey ? oInstanceKey.RECNROOT : "0",
			ACTN: oInstanceKey ? oInstanceKey.ACTN : "0",
			RECNPARENT: oInstanceKey ? oInstanceKey.RECNPARENT : "0",
			ESTCAT: oInstanceKey ? oInstanceKey.ESTCAT : "",
			RECN_VP: oInstanceKey ? oInstanceKey.RECN_VP : "0",
			ACTN_VP: oInstanceKey ? oInstanceKey.ACTN_VP : "0"
		});

		var oHeaders = {};
		var iParentIndex = oCreateInfo.parentIndex;
		if (iParentIndex != null)
			oHeaders[INDEX.PARENT] = iParentIndex.toString();

		var oData = this._filterUserDefinedText(oUserDefinedText);

		var oBatchRequest = this._createBatchOperation("/InstanceCollection(" + sParams + ")/UserDefinedText", "POST", oData, oHeaders);

		var fProcess = function (aBatchResponses) {
			var oUserDefinedTextKey = aBatchResponses[0].data;
			return oUserDefinedTextKey;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.userdefinedtext.create",
			batchRequests: [oBatchRequest],
			process: fProcess,
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForUpdateUserDefinedText = function (oUserDefinedText, oentry) {
		this._checkInit();

		// this._checkUserDefinedTextKey(oUserDefinedText);
		if(!oUserDefinedText.DELFLAG)
		oUserDefinedText.DELFLAG="";
		var sParams = this._escapeParamsForFI({

			ACTN: oUserDefinedText.ACTN,
			LANGU: oUserDefinedText.LANGU,
			ORD: oUserDefinedText.ORD,
			ESTCAT: oentry.ESTCAT,
			LTXTFLG: oUserDefinedText.LTXTFLG,
			RECNROOT: oUserDefinedText.RECNROOT,
			SPC_ACTN: oUserDefinedText.SPC_ACTN,
			RECN: oUserDefinedText.RECN,
			RECNPARENT: oUserDefinedText.RECNPARENT,
			RECNMST: oUserDefinedText.RECNMST,
			TEXT: oUserDefinedText.TEXT,
			TEXTNAM: oUserDefinedText.TEXTNAM,
			TEXTCAT: oUserDefinedText.TEXTCAT,
			DELFLG: oUserDefinedText.DELFLAG,
			LAYOUT: oUserDefinedText.LAYOUT
		});

		// var oData = this._filterUserDefinedText(oUserDefinedText);

		var oBatchRequest = this._createBatchOperation("/UpdateInstanceUserdefinedText?" + sParams, "POST");

		var oRequest = {
			messageKey: "PLMODataManager.error.userdefinedtext.update",
			batchRequests: oBatchRequest,
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForDeleteUserDefinedText = function (oUserDefinedTextKey) {
		this._checkInit();

		this._checkUserDefinedTextKey(oUserDefinedTextKey);

		var sParams = this._escapeParamsForKey({
			RECNROOT: oUserDefinedTextKey.RECNROOT,
			SPC_ACTN: oUserDefinedTextKey.SPC_ACTN,
			RECN: oUserDefinedTextKey.RECN,
			ACTN: oUserDefinedTextKey.ACTN,
			RECNPARENT: oUserDefinedTextKey.RECNPARENT,
			RECNMST: oUserDefinedTextKey.RECNMST
		});

		var oBatchRequest = this._createBatchOperation("/UserDefinedTextCollection(" + sParams + ")", "DELETE");

		var oRequest = {
			messageKey: "PLMODataManager.error.userdefinedtext.delete",
			batchRequests: [oBatchRequest],
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForFetchDocLink = function (oInstanceKey) {
		this._checkInit();

		// this._checkInstanceKey(oInstanceKey);

		var sParams = this._escapeParamsForFI({
			RECNROOT: oInstanceKey.RECNROOT,
			ACTN: oInstanceKey.ACTN
		});

		var oBatchRequest = this._createBatchOperation("/GetDocList?" + sParams, "GET");

		var fProcess = function (aBatchResponses) {
			var aDocLinks = aBatchResponses[0].data.results;
			var oResponse = {
				entries: aDocLinks
			};

			return oResponse;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.doclink.fetch",
			batchRequests: [oBatchRequest],
			process: fProcess
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForCreateDocLink = function (oCreateInfo, oDocLink) {
		this._checkInit();

		var oInstanceKey = oCreateInfo.parentKey;
		if (oInstanceKey)
			this._checkInstanceKey(oInstanceKey);

		var sParams = this._escapeParamsForKey({
			RECNROOT: oInstanceKey ? oInstanceKey.RECNROOT : "0",
			ACTN: oInstanceKey ? oInstanceKey.ACTN : "0",
			RECNPARENT: oInstanceKey ? oInstanceKey.RECNPARENT : "0",
			ESTCAT: oInstanceKey ? oInstanceKey.ESTCAT : "",
			RECN_VP: oInstanceKey ? oInstanceKey.RECN_VP : "0",
			ACTN_VP: oInstanceKey ? oInstanceKey.ACTN_VP : "0"
		});

		var oHeaders = {};
		var iParentIndex = oCreateInfo.parentIndex;
		if (iParentIndex != null)
			oHeaders[INDEX.PARENT] = iParentIndex.toString();

		var oData = this._filterDocLink(oDocLink);

		var oBatchRequest = this._createBatchOperation("/InstanceCollection(" + sParams + ")/DocLink", "POST", oData, oHeaders);

		var fProcess = function (aBatchResponses) {
			var oDocLinkKey = aBatchResponses[0].data;
			return oDocLinkKey;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.doclink.create",
			batchRequests: [oBatchRequest],
			process: fProcess,
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForUpdatedoclink = function (oCreateInfo, oDocLink) {
		this._checkInit();

		// var oInstanceKey = oCreateInfo.parentKey;
		// if (oInstanceKey)
		// 	this._checkInstanceKey(oInstanceKey);

		var sParams = this._escapeParamsForFI({
			RECNROOT: oCreateInfo.RECNROOT,
			ACTN: oCreateInfo.ACTN,
			SUBID: oCreateInfo.SUBID,
			IDENT1: oCreateInfo.IDENT1,
			FILEPATH: oCreateInfo.FILEPATH,
			FILECONTENT: oCreateInfo.FILECONTENT,
			DOKAR: oCreateInfo.DOKAR,
			DOKNR: oCreateInfo.DOKNR,
			DOKVR: oCreateInfo.DOKVR,
			DOKTL: oCreateInfo.DOKTL,
			LOEDK: oCreateInfo.LOEDK
		});

		// var oHeaders = {};
		// var iParentIndex = oCreateInfo.parentIndex;
		// if (iParentIndex != null)
		// 	oHeaders[INDEX.PARENT] = iParentIndex.toString();

		// var oData = this._filterDocLink(oDocLink);

		var oBatchRequest = this._createBatchOperation("/UpdateDocuments?" + sParams, "POST");

		var fProcess = function (aBatchResponses) {
			var oDocLinkKey = aBatchResponses[0];
			return oDocLinkKey;
			// var test1234 = null;
			// test1234 = 45;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.doclink.update",
			batchRequests: [oBatchRequest],
			process: fProcess,
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForSubmit = function (Key) {

		var sParams = this._escapeParamsForFI({
			RECN: Key.RECNROOT,
			ACTN: Key.ACTN
		});

		var oBatchRequest = this._createBatchOperation("/Submit?" + sParams, "POST");

		var fProcess = function (aBatchResponses) {
			var logo = aBatchResponses[0].data;
			var oResponse = {
				entries: logo
			};

			return oResponse;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.submit",
			batchRequests: [oBatchRequest],
			process: fProcess,
			change: true
		};

		return oRequest;
	};
	PLMODataManager.prototype.requestForFetchCountry = function (oInstanceKey) {
		this._checkInit();

		// this._checkInstanceKey(oInstanceKey);

		// var sParams = this._escapeParamsForFI({
		// 	RECNROOT: oInstanceKey.RECNROOT,
		// 	ACTN: oInstanceKey.ACTN
		// });

		var oBatchRequest = this._createBatchOperation("/UsageSearchHelp?", "GET");

		var fProcess = function (aBatchResponses) {
			var aDocLinks = aBatchResponses[0].data.results;
			var oResponse = {
				entries: aDocLinks
			};

			return oResponse;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.UsageSearch.fetch",
			batchRequests: [oBatchRequest],
			process: fProcess
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForFetchLanguage = function (oInstanceKey) {
		this._checkInit();

		// this._checkInstanceKey(oInstanceKey);

		// var sParams = this._escapeParamsForFI({
		// 	RECNROOT: oInstanceKey.RECNROOT,
		// 	ACTN: oInstanceKey.ACTN
		// });

		var oBatchRequest = this._createBatchOperation("/LanguSearchHelp?", "GET");

		var fProcess = function (aBatchResponses) {
			var aDocLinks = aBatchResponses[0].data.results;
			var oResponse = {
				entries: aDocLinks
			};

			return oResponse;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.UsageSearch.fetch",
			batchRequests: [oBatchRequest],
			process: fProcess
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForDeleteDocLink = function (oDocLinkKey) {
		this._checkInit();

		this._checkDocLinkKey(oDocLinkKey);

		var sParams = this._escapeParamsForKey({
			RECNROOT: oDocLinkKey.RECNROOT,
			SPC_ACTN: oDocLinkKey.SPC_ACTN,
			RECN: oDocLinkKey.RECN,
			ACTN: oDocLinkKey.ACTN,
			RECNPARENT: oDocLinkKey.RECNPARENT
		});

		var oBatchRequest = this._createBatchOperation("/DocLinkCollection(" + sParams + ")", "DELETE");

		var oRequest = {
			messageKey: "PLMODataManager.error.doclink.delete",
			batchRequests: [oBatchRequest],
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.getDocUploadURL = function () {
		this._checkInit();

		var sServiceURL = this._getServiceURL();
		var sURL = sServiceURL + "/DocCollection";

		return sURL;
	};

	PLMODataManager.prototype.getDocDownloadURL = function (oDocKey) {
		this._checkInit();

		this._checkDocKey(oDocKey);

		var sParams = this._escapeParamsForKey({
			DOKAR: oDocKey.DOKAR,
			DOKNR: oDocKey.DOKNR,
			DOKVR: oDocKey.DOKVR,
			DOKTL: oDocKey.DOKTL
		});

		var sServiceURL = this._getServiceURL();
		var sURL = sServiceURL + "/DocCollection(" + sParams + ")/$value";

		return sURL;
	};

	PLMODataManager.prototype.requestForFetchUsage = function (oInstanceKey) {
		this._checkInit();

		this._checkInstanceKey(oInstanceKey);

		var sParams = this._escapeParamsForKey({
			RECNROOT: oInstanceKey.RECNROOT,
			ACTN: oInstanceKey.ACTN,
			RECNPARENT: oInstanceKey.RECNPARENT,
			ESTCAT: oInstanceKey.ESTCAT,
			RECN_VP: oInstanceKey.RECN_VP,
			ACTN_VP: oInstanceKey.ACTN_VP
		});

		var oBatchRequest = this._createBatchOperation("/InstanceCollection(" + sParams + ")/Usage", "GET");

		var fProcess = function (aBatchResponses) {
			var aUsages = aBatchResponses[0].data.results;
			var oResponse = {
				entries: aUsages
			};

			return oResponse;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.usage.fetch",
			batchRequests: [oBatchRequest],
			process: fProcess
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForCreateUsage = function (oCreateInfo, oUsage) {
		this._checkInit();

		var oInstanceKey = oCreateInfo.parentKey;
		if (oInstanceKey)
			this._checkInstanceKey(oInstanceKey);

		var sParams = this._escapeParamsForKey({
			RECNROOT: oInstanceKey ? oInstanceKey.RECNROOT : "0",
			ACTN: oInstanceKey ? oInstanceKey.ACTN : "0",
			RECNPARENT: oInstanceKey ? oInstanceKey.RECNPARENT : "0",
			ESTCAT: oInstanceKey ? oInstanceKey.ESTCAT : "",
			RECN_VP: oInstanceKey ? oInstanceKey.RECN_VP : "0",
			ACTN_VP: oInstanceKey ? oInstanceKey.ACTN_VP : "0"
		});

		var oHeaders = {};
		var iParentIndex = oCreateInfo.parentIndex;
		if (iParentIndex != null)
			oHeaders[INDEX.PARENT] = iParentIndex.toString();

		var oData = this._filterUsage(oUsage);

		var oBatchRequest = this._createBatchOperation("/InstanceCollection(" + sParams + ")/Usage", "POST", oData, oHeaders);

		var fProcess = function (aBatchResponses) {
			var oUsageKey = aBatchResponses[0].data;
			return oUsageKey;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.usage.create",
			batchRequests: [oBatchRequest],
			process: fProcess,
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForUpdateUsage = function (oUsage) {
		this._checkInit();

		this._checkUsageKey(oUsage);

		var sParams = this._escapeParamsForKey({
			RECNROOT: oUsage.RECNROOT,
			SPC_ACTN: oUsage.SPC_ACTN,
			RECN: oUsage.RECN,
			ACTN: oUsage.ACTN,
			RECNMST: oUsage.RECNMST
		});

		var oData = this._filterUsage(oUsage);

		var oBatchRequest = this._createBatchOperation("/UsageCollection(" + sParams + ")", "PUT", oData);

		var oRequest = {
			messageKey: "PLMODataManager.error.usage.update",
			batchRequests: [oBatchRequest],
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForDeleteUsage = function (oUsageKey) {
		this._checkInit();

		this._checkUsageKey(oUsageKey);

		var sParams = this._escapeParamsForKey({
			RECNROOT: oUsageKey.RECNROOT,
			SPC_ACTN: oUsageKey.SPC_ACTN,
			RECN: oUsageKey.RECN,
			ACTN: oUsageKey.ACTN,
			RECNMST: oUsageKey.RECNMST
		});

		var oBatchRequest = this._createBatchOperation("/UsageCollection(" + sParams + ")", "DELETE");

		var oRequest = {
			messageKey: "PLMODataManager.error.usage.delete",
			batchRequests: [oBatchRequest],
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForFetchStatus = function (oSpecificationKey) {
		this._checkInit();

		this._checkSpecificationKey(oSpecificationKey);

		var sParams = this._escapeParamsForKey({
			RECNROOT: oSpecificationKey.RECNROOT,
			ACTN: oSpecificationKey.ACTN
		});

		var oBatchRequest = this._createBatchOperation("/BasicDataCollection(" + sParams + ")/Status", "GET");

		var fProcess = function (aBatchResponses) {
			var aStatuss = aBatchResponses[0].data.results;
			var oResponse = {
				entries: aStatuss
			};

			return oResponse;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.status.fetch",
			batchRequests: [oBatchRequest],
			process: fProcess
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForCreateStatus = function (oCreateInfo, oStatus) {
		this._checkInit();

		var oSpecificationKey = oCreateInfo.parentKey;
		this._checkSpecificationKey(oSpecificationKey);

		var sParams = this._escapeParamsForKey({
			RECNROOT: oSpecificationKey.RECNROOT,
			ACTN: oSpecificationKey.ACTN
		});

		var oData = this._filterStatus(oStatus);

		var oBatchRequest = this._createBatchOperation("/BasicDataCollection(" + sParams + ")/Status", "POST", oData);

		var fProcess = function (aBatchResponses) {
			var oStatusKey = aBatchResponses[0].data;
			return oStatusKey;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.status.create",
			batchRequests: [oBatchRequest],
			process: fProcess,
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForUpdateStatus = function (oStatus) {
		this._checkInit();

		this._checkStatusKey(oStatus);

		var sParams = this._escapeParamsForKey({
			RECNROOT: oStatus.RECNROOT,
			SPC_ACTN: oStatus.SPC_ACTN,
			RECN: oStatus.RECN,
			ACTN: oStatus.ACTN
		});

		var oData = this._filterStatus(oStatus);

		var oBatchRequest = this._createBatchOperation("/StatusCollection(" + sParams + ")", "PUT", oData);

		var oRequest = {
			messageKey: "PLMODataManager.error.status.update",
			batchRequests: [oBatchRequest],
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForDeleteStatus = function (oStatusKey) {
		this._checkInit();

		this._checkStatusKey(oStatusKey);

		var sParams = this._escapeParamsForKey({
			RECNROOT: oStatusKey.RECNROOT,
			SPC_ACTN: oStatusKey.SPC_ACTN,
			RECN: oStatusKey.RECN,
			ACTN: oStatusKey.ACTN
		});

		var oBatchRequest = this._createBatchOperation("/StatusCollection(" + sParams + ")", "DELETE");

		var oRequest = {
			messageKey: "PLMODataManager.error.status.delete",
			batchRequests: [oBatchRequest],
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForFetchMaterial = function (oSpecificationKey) {
		this._checkInit();

		this._checkSpecificationKey(oSpecificationKey);

		var sParams = this._escapeParamsForKey({
			RECNROOT: oSpecificationKey.RECNROOT,
			ACTN: oSpecificationKey.ACTN
		});

		var oBatchRequest = this._createBatchOperation("/BasicDataCollection(" + sParams + ")/Material", "GET");

		var fProcess = function (aBatchResponses) {
			var aMaterials = aBatchResponses[0].data.results;
			var oResponse = {
				entries: aMaterials
			};

			return oResponse;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.material.fetch",
			batchRequests: [oBatchRequest],
			process: fProcess
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForFetchChats = function (Key) {

		var sParams = this._escapeParamsForFI({
			RECNROOT: Key
		});

		var oBatchRequest = this._createBatchOperation("/GetChats?" + sParams, "GET");

		var fProcess = function (aBatchResponses) {
			var achats = aBatchResponses[0].data.results;
			var oResponse = {
				entries: achats
			};

			return oResponse;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.chats.fetch",
			batchRequests: [oBatchRequest],
			process: fProcess
		};

		return oRequest;
	};
	PLMODataManager.prototype.requestForUpdateChats = function (ochatinfo) {

		var sParams = this._escapeParamsForFI({
			RECNROOT: ochatinfo.RECNROOT,
			CHAT: ochatinfo.CHAT,
			USER_NAME: ochatinfo.USER_NAME,
			DATE: ochatinfo.DATE,
			TIME: ochatinfo.TIME,
			CHAT_ID: ochatinfo.CHAT_ID,
			PARENT_CHAT: ochatinfo.PARENT_CHAT
		});
		var oBatchRequest = this._createBatchOperation("/UpdateChats?" + sParams, "POST");

		var fProcess = function (aBatchResponses) {
			var chatres = aBatchResponses[0];
			return chatres;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.chat.update",
			batchRequests: [oBatchRequest],
			process: fProcess,
			change: true
		};

		return oRequest;
	};
	PLMODataManager.prototype.requestForCreateMaterial = function (oCreateInfo, oMaterial) {
		this._checkInit();

		var oSpecificationKey = oCreateInfo.parentKey;
		this._checkSpecificationKey(oSpecificationKey);

		var sParams = this._escapeParamsForKey({
			RECNROOT: oSpecificationKey.RECNROOT,
			ACTN: oSpecificationKey.ACTN
		});

		var oData = this._filterMaterial(oMaterial);

		var oBatchRequest = this._createBatchOperation("/BasicDataCollection(" + sParams + ")/Material", "POST", oData);

		var fProcess = function (aBatchResponses) {
			var oMaterialKey = aBatchResponses[0].data;
			return oMaterialKey;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.material.create",
			batchRequests: [oBatchRequest],
			process: fProcess,
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForUpdateMaterial = function (oMaterial) {
		this._checkInit();

		this._checkMaterialKey(oMaterial);

		var sParams = this._escapeParamsForKey({
			RECNROOT: oMaterial.RECNROOT,
			SPC_ACTN: oMaterial.SPC_ACTN,
			RECN: oMaterial.RECN,
			ACTN: oMaterial.ACTN
		});

		var oData = this._filterMaterial(oMaterial);

		var oBatchRequest = this._createBatchOperation("/MaterialCollection(" + sParams + ")", "PUT", oData);

		var oRequest = {
			messageKey: "PLMODataManager.error.material.update",
			batchRequests: [oBatchRequest],
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForDeleteMaterial = function (oMaterialKey) {
		this._checkInit();

		this._checkMaterialKey(oMaterialKey);

		var sParams = this._escapeParamsForKey({
			RECNROOT: oMaterialKey.RECNROOT,
			SPC_ACTN: oMaterialKey.SPC_ACTN,
			RECN: oMaterialKey.RECN,
			ACTN: oMaterialKey.ACTN
		});

		var oBatchRequest = this._createBatchOperation("/MaterialCollection(" + sParams + ")", "DELETE");

		var oRequest = {
			messageKey: "PLMODataManager.error.material.delete",
			batchRequests: [oBatchRequest],
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForFetchLayout = function () {
		this._checkInit();

		var oBatchRequest = this._createBatchOperation("/LayoutCollection", "GET");

		var fProcess = function (aBatchResponses) {
			var aLayouts = aBatchResponses[0].data.results;

			for (var i = 0; i < aLayouts.length; i++) {
				var oLayout = aLayouts[i];
				var sESTCAT_LIST = oLayout.ESTCAT_LIST;
				var aProps = [];

				if (sESTCAT_LIST != "")
					aProps = sESTCAT_LIST.split(" ");

				oLayout.props = aProps;
			}

			return aLayouts;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.layout.fetch",
			batchRequests: [oBatchRequest],
			process: fProcess
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForCreateLayout = function (oLayout) {
		this._checkInit();

		var oData = this._filterLayout(oLayout);

		var oBatchRequest = this._createBatchOperation("/LayoutCollection", "POST", oData);

		var fProcess = function (aBatchResponses) {
			var oLayoutKey = aBatchResponses[0].data;
			return oLayoutKey;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.layout.create",
			batchRequests: [oBatchRequest],
			process: fProcess,
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForUpdateLayout = function (oLayout) {
		this._checkInit();

		this._checkLayoutKey(oLayout);

		var sParams = this._escapeParamsForKey({
			IS_SYS: oLayout.IS_SYS,
			ID: oLayout.ID
		});

		var oData = this._filterLayout(oLayout);

		var oBatchRequest = this._createBatchOperation("/LayoutCollection(" + sParams + ")", "PUT", oData);

		var oRequest = {
			messageKey: "PLMODataManager.error.layout.update",
			batchRequests: [oBatchRequest],
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForDeleteLayout = function (oLayoutKey) {
		this._checkInit();

		this._checkLayoutKey(oLayoutKey);

		var sParams = this._escapeParamsForKey({
			IS_SYS: oLayoutKey.IS_SYS,
			ID: oLayoutKey.ID
		});

		var oBatchRequest = this._createBatchOperation("/LayoutCollection(" + sParams + ")", "DELETE");

		var oRequest = {
			messageKey: "PLMODataManager.error.layout.delete",
			batchRequests: [oBatchRequest],
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForUpdateDefaultLayout = function (oLayoutKey) {
		this._checkInit();

		if (oLayoutKey)
			this._checkLayoutKey(oLayoutKey);

		var sParams = this._escapeParamsForFI({
			IS_SYS: oLayoutKey ? oLayoutKey.IS_SYS : false,
			ID: oLayoutKey ? oLayoutKey.ID : ""
		});

		var oBatchRequest = this._createBatchOperation("/SetDefaultLayout?" + sParams, "POST");

		var oRequest = {
			messageKey: "PLMODataManager.error.layout.updateDefault",
			batchRequests: [oBatchRequest],
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForFetchValueHelper = function (oValueHelperKey, oHeaderInfo, oInputParams) {
		this._checkInit();

		this._checkValueHelperKey(oValueHelperKey);

		var that = this;

		var aBatchRequests = [];

		if (!oHeaderInfo) {
			var sHeaderParams = this._escapeParamsForFI({
				EntityName: oValueHelperKey.entityName,
				FieldName: oValueHelperKey.fieldName
			});

			var oBatchRequest = this._createBatchOperation("/GetValueHelperHeader?" + sHeaderParams, "GET");
			aBatchRequests.push(oBatchRequest);
		}

		var sInputParams = oInputParams ? this._escapeParamsForGeneric(oInputParams) : "";

		var sListParams = this._escapeParamsForFI({
			EntityName: oValueHelperKey.entityName,
			FieldName: oValueHelperKey.fieldName,
			Parameters: sInputParams
		});

		var oBatchRequest = this._createBatchOperation("/GetValueHelperList?" + sListParams, "GET");
		aBatchRequests.push(oBatchRequest);

		var fProcess = function (aBatchResponses) {
			var iBatchResponseIndex = 0;

			// Construct and store header info.

			if (!oHeaderInfo) {
				var aDataHeader = aBatchResponses[iBatchResponseIndex++].data.results;
				var oHeaderById = {};

				for (var i = 0; i < aDataHeader.length; i++) {
					var oHeader = aDataHeader[i];
					oHeaderById[oHeader.FIELDNAME] = oHeader;
				}

				oHeaderInfo = {
					byId: oHeaderById,
					byOrder: aDataHeader // Columns are coming sorted from OData service (no need to sort them again).
				};
			}

			// Construct and store values array.

			var aFieldEntries = aBatchResponses[iBatchResponseIndex++].data.results;
			var oBuildData = that._buildValueHelperEntries(oHeaderInfo.byId, aFieldEntries);

			var oValueHelper = {
				headerInfo: oHeaderInfo,
				headerShow: oBuildData.headerShow,
				entries: oBuildData.entries
			};

			return oValueHelper;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.valueHelper",
			batchRequests: aBatchRequests,
			process: fProcess
		};

		return oRequest;
	};

	PLMODataManager.prototype.requestForFetchAdhocReportURL = function (oAdhocReportKey) {
		this._checkInit();

		this._checkAdhocReportKey(oAdhocReportKey);

		var sParams = this._escapeParamsForKey({
			RECNROOT: oAdhocReportKey.RECNROOT,
			ACTN: oAdhocReportKey.ACTN,
			LDEPID: oAdhocReportKey.LDEPID,
			STATUS_CHK_IND: oAdhocReportKey.STATUS_CHK_IND,
			LANGU: oAdhocReportKey.LANGU,
			KEY_DATE: oAdhocReportKey.KEY_DATE
		});

		var oBatchRequest = this._createBatchOperation("/AdhocReportCollection(" + sParams + ")", "GET");

		var sServiceURL = this._getServiceURL();

		var fProcess = function (aBatchResponses) {
			var sURL = sServiceURL + "/AdhocReportCollection(" + sParams + ")/$value";
			return sURL;
		};

		var oRequest = {
			messageKey: "PLMODataManager.error.adhocReport",
			batchRequests: [oBatchRequest],
			process: fProcess
		};

		return oRequest;
	};

	PLMODataManager.prototype._getServiceURL = function () {
		// EXT_HOOK: _extHookGetServiceURL
		// Return with service URL programatically. If URL is static, then customization
		// in manifest.json is preferred (sap.ui5/config/serviceURL).

		var sServiceURL = this._extHookGetServiceURL ? this._extHookGetServiceURL() : this._oComponent.getComponentConfig().serviceURL;
		return sServiceURL;
	};

	PLMODataManager.prototype._requestForDoPostponeError = function () {
		this._checkInit();

		var oBatchRequest = this._createBatchOperation("/PostponeError", "POST");

		var oRequest = {
			messageKey: "PLMODataManager.error.postponeError",
			batchRequests: [oBatchRequest],
			change: true
		};

		return oRequest;
	};

	PLMODataManager.prototype._buildPropTree = function (sPropTreeID, aNodes) {
		// Collect nodes by their .PARENT. Do not use .CHILD and .NEXT here, since they can be
		// unreliable if there is a customization on backend, which removes nodes from
		// property tree.

		var oNodesByParent = {};
		var oRootNode = null;

		for (var i = 0; i < aNodes.length; i++) {
			var oNode = aNodes[i];

			oNode.nodeID = this._transformPropTreeNodeID(oNode.ID);
			oNode.nodeParentID = this._transformPropTreeNodeID(oNode.PARENT);

			var aNodesByParent = oNodesByParent[oNode.nodeParentID];
			if (!aNodesByParent)
				aNodesByParent = oNodesByParent[oNode.nodeParentID] = [];

			aNodesByParent.push(oNode);

			if (oNode.TYPE == "ROOT") {
				if (oRootNode)
					throw new ODataManagerException("PLMODataManager.error.propTreeParse", [sPropTreeID]); // Duplicated root node.

				oRootNode = oNode;
			}
		}

		// It is okay if the property list is empty. In this case we
		// return null for the root node.

		this._iBuildPropTreeLevelCount = 0;

		if (aNodes.length > 0) {
			if (!oRootNode) {
				// If there is no root node, then select first non-leaf node as root.

				var oNode = aNodes[0];

				if (oNode.TYPE != "LEAF")
					oRootNode = oNode;
				else
					throw new ODataManagerException("PLMODataManager.error.propTreeParse", [sPropTreeID]); // Missing root node.
			}

			this._buildPropTreeNode(oRootNode, oNodesByParent, 1);
		}

		// Construct info object.

		var oRootNodeInfo = {
			rootNode: oRootNode,
			levelCount: this._iBuildPropTreeLevelCount
		};

		return oRootNodeInfo;
	};

	PLMODataManager.prototype._buildPropTreeNode = function (oBaseNode, oNodesByParent, iLevelCount) {
		// Look for all direct children of oBaseNode and collect them.

		assert(oBaseNode.TYPE != "LEAF", "Node type should be non-leaf");

		var aNodesByParent = oNodesByParent[oBaseNode.nodeID];
		var aChildNodes = aNodesByParent ? aNodesByParent : [];

		// Store child info.
		// .childNotes = []: if no direct children
		// .childNotes = null: if leaf

		oBaseNode.childNodes = aChildNodes;

		// Update levelcount.

		if (this._iBuildPropTreeLevelCount < iLevelCount)
			this._iBuildPropTreeLevelCount = iLevelCount;

		// Do recursive construction.

		for (var i = 0; i < aChildNodes.length; i++) {
			var oChildNode = aChildNodes[i];

			if (oChildNode.TYPE == "LEAF")
				oChildNode.childNodes = null;
			else
				this._buildPropTreeNode(oChildNode, oNodesByParent, iLevelCount + 1);
		}
	};

	PLMODataManager.prototype._transformPropTreeNodeID = function (sNodeIDOrig) {
		// Transformation of nodeIDs is a safety measure: it won't interfere with
		// built-in JavaScript property names.

		var sNodeID = "propTreeNodeID" + sNodeIDOrig;
		return sNodeID;
	};

	PLMODataManager.prototype._buildInstances = function (oCharHeadersByFieldName, aFieldEntries) {
		var aInstances = [];

		for (var i = 0; i < aFieldEntries.length; i++) {
			var oFieldEntry = aFieldEntries[i];

			var oInstance = aInstances[oFieldEntry.RECNO]; // FIXME: validate recno
			if (!oInstance)
				aInstances[oFieldEntry.RECNO] = oInstance = {};

			// Lookup field in header:
			// - Found: parse value according to characteristic type.
			// - Not found: field is part of instance key (like RECNROOT, ACTN, etc.).
			// FIXME: escape ATNAM (to not contain special chars like /)

			var oCharHeader = oCharHeadersByFieldName[oFieldEntry.FIELDNAME];
			if (oCharHeader) {
				try {
					oCharHeader.parseCharValues(oFieldEntry, oInstance);
				} catch (e) {
					if (!(e instanceof CharHeaderException))
						throw e;

					throw new ODataManagerException(e.messageKey, e.args);
				}
			} else {
				oInstance[oFieldEntry.FIELDNAME] = oFieldEntry.FIELDVALUE; // FIXME: translate propname to avoid javascript built-in name interference!
			}
		}

		return aInstances;
	};

	PLMODataManager.prototype._buildCharEntries = function (oCharHeader, aODataEntries) {
		var aCharEntries = [];

		for (var i = 0; i < aODataEntries.length; i++) {
			var oODataEntry = aODataEntries[i];
			var oCharEntry;

			try {
				oCharEntry = oCharHeader.parseCharEntry(oODataEntry);
			} catch (e) {
				if (!(e instanceof CharHeaderException))
					throw e;

				throw new ODataManagerException(e.messageKey, e.args);
			}

			aCharEntries.push(oCharEntry);
		}

		return aCharEntries;
	};

	PLMODataManager.prototype._buildInstanceBatchRequests = function (oInstance, oCharHeaderInfo) {
		// Loop thru headers and create batch operations.

		var aBatchRequests = [];
		var aCharHeaders = oCharHeaderInfo.byOrder;

		for (var i = 0; i < aCharHeaders.length; i++) {
			var oCharHeader = aCharHeaders[i];

			// Skip non-editable fields.

			if (!oCharHeader.getEditable(oInstance))
				continue;

			// Convert data from internal to OData representation. If convertCharValues returns
			// null, then this field will be skipped.

			var oFieldEntry = oCharHeader.convertCharValues(oInstance);
			if (!oFieldEntry)
				continue;

			// Store.

			var sParams = this._escapeParamsForFI({
				FieldName: oFieldEntry.FIELDNAME,
				FieldValue: oFieldEntry.FIELDVALUE
			});

			var oBatchRequest = this._createBatchOperation("/SetInstanceField?" + sParams, "POST");
			aBatchRequests.push(oBatchRequest);
		}

		return aBatchRequests;
	};

	PLMODataManager.prototype._buildGroupInfo = function (aGroupEntries) {
		var oGroups = {};
		var aGroups = [];
		var oSortsBySUBIDAndGRP_SUBID = {};

		for (var i = 0; i < aGroupEntries.length; i++) {
			var oGroupEntry = aGroupEntries[i];
			var sGroupSUBID = oGroupEntry.GRP_SUBID;

			// Collect unique groups.

			var oGroup = oGroups[sGroupSUBID];
			if (!oGroup) {
				oGroup = oGroups[sGroupSUBID] = {
					GRP_SUBID: sGroupSUBID,
					GRP_IDENT: oGroupEntry.GRP_IDENT
				};

				aGroups.push(oGroup);
			}

			// Collect sort order by SUBID and GRP_SUBID. Empty SUBID means
			// group with no specifications.

			var sSUBID = oGroupEntry.SUBID;

			if (sSUBID != "") {
				var oSortsByGRP_SUBID = oSortsBySUBIDAndGRP_SUBID[sSUBID];
				if (!oSortsByGRP_SUBID)
					oSortsByGRP_SUBID = oSortsBySUBIDAndGRP_SUBID[sSUBID] = {};

				oSortsByGRP_SUBID[sGroupSUBID] = oGroupEntry.ORD;
			}
		}

		// Construct group info object.

		var oGroupInfo = {
			groups: aGroups,
			sortsBySUBIDAndGRP_SUBID: oSortsBySUBIDAndGRP_SUBID
		};

		return oGroupInfo;
	};

	PLMODataManager.prototype._buildValueHelperEntries = function (oHeaderById, aFieldEntries) {
		// Construct headerShow object.

		var oHeaderShow = {};

		for (var sFieldName in oHeaderById)
			oHeaderShow[sFieldName] = true;

		var bRemoveHighColumn = (oHeaderById._HIGH != null);

		// Build value helper entries.

		var aEntries = [];

		for (var i = 0; i < aFieldEntries.length; i++) {
			// Read field entry.

			var oFieldEntry = aFieldEntries[i];

			var iRECORDPOS = parseInt(oFieldEntry.RECORDPOS); // FIXME: validate recordpos, RECORDPOS is Edm.String -> change OData service definition
			var oEntry = aEntries[iRECORDPOS];
			if (!oEntry)
				aEntries[iRECORDPOS] = oEntry = {};

			var sFieldName = oFieldEntry.FIELDNAME;
			var sFieldValue = oFieldEntry.FIELDVALUE;

			// Lookup header.

			var oHeader = oHeaderById[sFieldName];
			if (!oHeader)
				throw new ODataManagerException("PLMODataManager.error.valueHelperParse"); // Unknown header.

			// Check for _HIGH column.

			if (bRemoveHighColumn && sFieldName == "_HIGH" && sFieldValue != "")
				bRemoveHighColumn = false;

			// Do type conversion.

			var vFieldValue;

			switch (oHeader.DATATYPE) {
			case "DATS":
				vFieldValue = this._parseValueHelperDate(sFieldValue);
				break;

			default:
				vFieldValue = sFieldValue;
			}

			oEntry[sFieldName] = vFieldValue;
		}

		// Remove _HIGH column if it is empty in all records.

		if (bRemoveHighColumn)
			oHeaderShow._HIGH = false;

		// Construct result.

		var oBuildData = {
			headerShow: oHeaderShow,
			entries: aEntries
		};

		return oBuildData;
	};

	PLMODataManager.prototype._parseValueHelperDate = function (sDate) { // FIXME: code dup
		var oRegExp = /^(\d{4})(\d{2})(\d{2})$/;

		var aResult = oRegExp.exec(sDate);
		if (!aResult)
			throw new ODataManagerException("PLMODataManager.error.valueHelperParse"); // Can't parse date.

		var iYear = parseInt(aResult[1]);
		var iMonth = parseInt(aResult[2]) - 1;
		var iDay = parseInt(aResult[3]);

		var oDate = new Date(iYear, iMonth, iDay);

		return oDate;
	};

	PLMODataManager.prototype._checkSpecificationSUBIDKey = function (oSpecificationSUBIDKey) {
		assert(oSpecificationSUBIDKey.SUBID != null &&
			oSpecificationSUBIDKey.KEYDATE != null, "Specification SUBID key is incomplete");
	};

	PLMODataManager.prototype._checkSpecificationKey = function (oSpecificationKey) {
		assert(oSpecificationKey.RECNROOT != null &&
			oSpecificationKey.ACTN != null, "Specification key is incomplete");
	};

	PLMODataManager.prototype._checkIdentifierKey = function (oIdentifierKey) {
		assert(oIdentifierKey.RECNROOT != null &&
			oIdentifierKey.SPC_ACTN != null &&
			oIdentifierKey.ACTN != null &&
			oIdentifierKey.RECN != null, "Identifier key is incomplete");
	};

	PLMODataManager.prototype._checkPropertyKey = function (oPropertyKey) {
		assert(oPropertyKey.RECNROOT != null &&
			oPropertyKey.ACTN != null &&
			oPropertyKey.MENID != null &&
			oPropertyKey.ID != null &&
			oPropertyKey.ESTCAT != null, "Property key is incomplete");
	};

	PLMODataManager.prototype._checkInstanceKey = function (oInstanceKey) {
		assert(oInstanceKey.RECNROOT != null &&
			oInstanceKey.ACTN != null &&
			oInstanceKey.RECNPARENT != null &&
			oInstanceKey.ESTCAT != null &&
			oInstanceKey.RECN_VP != null &&
			oInstanceKey.ACTN_VP != null, "Instance key is incomplete");
	};

	PLMODataManager.prototype._checkCompositionKey = function (oCompositionKey) {
		assert(oCompositionKey.RECNROOT != null &&
			oCompositionKey.SPC_ACTN != null &&
			oCompositionKey.RECN != null &&
			oCompositionKey.ACTN != null &&
			oCompositionKey.RECNPARENT != null &&
			oCompositionKey.ESTCAT != null &&
			oCompositionKey.RECN_VP != null &&
			oCompositionKey.ACTN_VP != null, "Composition key is incomplete");
	};

	PLMODataManager.prototype._checkQualKey = function (oQualKey) {
		assert(oQualKey.RECNROOT != null &&
			oQualKey.SPC_ACTN != null &&
			oQualKey.RECN != null &&
			oQualKey.ACTN != null &&
			oQualKey.RECNPARENT != null &&
			oQualKey.ESTCAT != null &&
			oQualKey.RECN_VP != null &&
			oQualKey.ACTN_VP != null, "Qual key is incomplete");
	};

	PLMODataManager.prototype._checkQuantKey = function (oQuantKey) {
		assert(oQuantKey.RECNROOT != null &&
			oQuantKey.SPC_ACTN != null &&
			oQuantKey.RECN != null &&
			oQuantKey.ACTN != null &&
			oQuantKey.RECNPARENT != null &&
			oQuantKey.ESTCAT != null &&
			oQuantKey.RECN_VP != null &&
			oQuantKey.ACTN_VP != null, "Quant key is incomplete");
	};

	PLMODataManager.prototype._checkListKey = function (oListKey) {
		assert(oListKey.RECNROOT != null &&
			oListKey.SPC_ACTN != null &&
			oListKey.RECN != null &&
			oListKey.ACTN != null &&
			oListKey.RECNPARENT != null &&
			oListKey.ESTCAT != null &&
			oListKey.RECN_VP != null &&
			oListKey.ACTN_VP != null &&
			oListKey.RECNTVA != null, "List key is incomplete");
	};

	PLMODataManager.prototype._checkUserDefinedTextKey = function (oUserDefinedTextKey) {
		assert(oUserDefinedTextKey.RECNROOT != null &&
			oUserDefinedTextKey.SPC_ACTN != null &&
			oUserDefinedTextKey.RECN != null &&
			oUserDefinedTextKey.ACTN != null &&
			oUserDefinedTextKey.RECNPARENT != null &&
			oUserDefinedTextKey.RECNMST != null, "User defined text key is incomplete");
	};

	PLMODataManager.prototype._checkDocLinkKey = function (oDocLinkKey) {
		assert(oDocLinkKey.RECNROOT != null &&
			oDocLinkKey.SPC_ACTN != null &&
			oDocLinkKey.RECN != null &&
			oDocLinkKey.ACTN != null &&
			oDocLinkKey.RECNPARENT != null, "DocLink key is incomplete");
	};

	PLMODataManager.prototype._checkDocKey = function (oDocKey) {
		assert(oDocKey.DOKAR != null &&
			oDocKey.DOKNR != null &&
			oDocKey.DOKVR != null &&
			oDocKey.DOKTL != null, "Doc key is incomplete");
	};

	PLMODataManager.prototype._checkUsageKey = function (oUsageKey) {
		assert(oUsageKey.RECNROOT != null &&
			oUsageKey.SPC_ACTN != null &&
			oUsageKey.RECN != null &&
			oUsageKey.ACTN != null &&
			oUsageKey.RECNMST != null, "Usage key is incomplete");
	};

	PLMODataManager.prototype._checkStatusKey = function (oStatusKey) {
		assert(oStatusKey.RECNROOT != null &&
			oStatusKey.SPC_ACTN != null &&
			oStatusKey.RECN != null &&
			oStatusKey.ACTN != null, "Status key is incomplete");
	};

	PLMODataManager.prototype._checkMaterialKey = function (oMaterialKey) {
		assert(oMaterialKey.RECNROOT != null &&
			oMaterialKey.SPC_ACTN != null &&
			oMaterialKey.RECN != null &&
			oMaterialKey.ACTN != null, "Material key is incomplete");
	};

	PLMODataManager.prototype._checkLayoutKey = function (oLayoutKey) {
		assert(oLayoutKey.IS_SYS != null &&
			oLayoutKey.ID != null, "Layout key is incomplete");
	};

	PLMODataManager.prototype._checkValueHelperKey = function (oValueHelperKey) {
		assert(oValueHelperKey.entityName != null &&
			oValueHelperKey.fieldName != null, "Value helper key is incomplete");
	};

	PLMODataManager.prototype._checkAdhocReportKey = function (oAdhocReportKey) {
		assert(oAdhocReportKey.RECNROOT != null &&
			oAdhocReportKey.ACTN != null &&
			oAdhocReportKey.LDEPID != null &&
			oAdhocReportKey.STATUS_CHK_IND != null &&
			oAdhocReportKey.LANGU != null &&
			oAdhocReportKey.KEY_DATE != null, "Adhoc Report key is incomplete");
	};

	PLMODataManager.prototype._filterBasicData = function (oBasicData) {
		// Keep in sync with server-side!
		var oData = this._filterProperties(oBasicData, ["SUBCHAR", "AUTHGRP", "REM"]);
		return oData;
	};

	PLMODataManager.prototype._filterIdentifier = function (oIdentifier) {
		// Keep in sync with server-side!
		// FIXMEX: langu: conversion_exit issue!
		var oData = this._filterProperties(oIdentifier, ["IDTYPE", "IDCAT", "LANGU", "IDENT", "ORD"]);
		return oData;
	};

	PLMODataManager.prototype._filterComposition = function (oComposition, oExtParam) {
		// Keep in sync with server-side!
		var oData = this._filterProperties(oComposition, ["SUBID", "COMPCAT", "COMPEXCVAL", "COMPAVGTXT", "COMPEXP", "PRECL", "COMPLOWTXT",
			"PRECU", "COMPUPPTXT", "ORD"
		]);

		// EXT_HOOK: _extHookFilterComposition
		// Customize filtering.

		if (this._extHookFilterComposition)
			this._extHookFilterComposition(oComposition, oExtParam, oData);

		return oData;
	};

	PLMODataManager.prototype._filterQual = function (oQual, oExtParam) {
		// Keep in sync with server-side!
		var oData = this._filterProperties(oQual, ["Recn", "Actn", "Subid", "Compcat", "Subcat", "Compexcval"]);

		// EXT_HOOK: _extHookFilterQual
		// Customize filtering.

		if (this._extHookFilterQual)
			this._extHookFilterQual(oQual, oExtParam, oData);

		return oData;
	};

	PLMODataManager.prototype._filterQuant = function (oQuant, oExtParam) {
		// Keep in sync with server-side!
		var oData = this._filterProperties(oQuant, ["RECN", "ACTN", "SUBID", "COMPCAT", "SUBCAT", "DIMID", "COMPEXCVAL", "COMPAVGTXT",
			"COMPLOWTXT", "COMPUPPTXT", "COMPEXP", "PRECL", "PRECU"
		]);

		// EXT_HOOK: _extHookFilterQuant
		// Customize filtering.

		if (this._extHookFilterQuant)
			this._extHookFilterQuant(oQuant, oExtParam, oData);

		return oData;
	};

	PLMODataManager.prototype._filterList = function (oList, oExtParam) {
		// Keep in sync with server-side!
		var oData = this._filterProperties(oList, ["SUBID", "ORD"]);

		// EXT_HOOK: _extHookFilterList
		// Customize filtering.

		if (this._extHookFilterList)
			this._extHookFilterList(oList, oExtParam, oData);

		return oData;
	};

	PLMODataManager.prototype._filterUserDefinedText = function (oUserDefinedText) {
		// Keep in sync with server-side!
		var oData = this._filterProperties(oUserDefinedText, ["ORD", "TEXTCAT", "TEXT", "LANGU"]);
		return oData;
	};

	PLMODataManager.prototype._filterDocLink = function (oDocLink) {
		// Keep in sync with server-side!
		var oData = this._filterProperties(oDocLink, ["ORD", "TEXTCAT", "DOKAR", "DOKNR", "DOKVR", "DOKTL"]);
		return oData;
	};

	PLMODataManager.prototype._filterUsage = function (oUsage) {
		// Keep in sync with server-side!
		var oData = this._filterProperties(oUsage, ["VACLID", "RVLID", "EXCLFLG", "ACTVFLG", "ESNTFLG"]);
		return oData;
	};

	PLMODataManager.prototype._filterStatus = function (oStatus) {
		// Keep in sync with server-side!
		var oData = this._filterProperties(oStatus, ["VACLID", "RVLTYPE", "RVLID", "SUBSTAT_ON_SCREEN", "VALFR", "VALTO", "AENNR", "OTYPE",
			"REALO"
		]);
		return oData;
	};

	PLMODataManager.prototype._filterMaterial = function (oMaterial) {
		// Keep in sync with server-side!
		var oData = this._filterProperties(oMaterial, ["MATNR", "WERKS"]);
		return oData;
	};

	PLMODataManager.prototype._filterLayout = function (oLayout) {
		// Keep in sync with server-side!
		var oData = this._filterProperties(oLayout, ["NAME", "DESCR", "MENID"]);
		oData.ESTCAT_LIST = oLayout.props.join(" ");
		return oData;
	};

	return PLMODataManager;
});