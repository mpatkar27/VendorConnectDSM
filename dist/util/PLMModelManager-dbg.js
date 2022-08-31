//FIXMEVC:remove what is not needed
/*
 * PLMModelManager provides PLM specific data model and OData hooks.
 * In a typical scenario, PLMModelManager _backend* methods:
 * - Call ODataManager requestFor* methods.
 * - Provide the required code for additional object handling. Therefore
 *   ODataManager doesn't need to do anything (e.g. read/write) with additional.
 * - For additional object which are in parent, prefix them with "NodeName_".
 */

sap.ui.define([
	"sap/base/assert",
	"sap/ui/model/json/JSONModel",
	"gramont/VCDSM/specedit/util/CharHeaderChar",
	"gramont/VCDSM/specedit/util/CharHeaderDocLink",
	"gramont/VCDSM/specedit/util/CharHeaderUserDefinedText",
	"gramont/VCDSM/specedit/util/ModelManager",
	"gramont/VCDSM/specedit/util/ModelManagerConst",
	"gramont/VCDSM/specedit/util/Util"
], function (assert, JSONModel, CharHeaderChar, CharHeaderDocLink, CharHeaderUserDefinedText, ModelManager, ModelManagerConst, Util) {
	"use strict";

	// Property tree node types:

	var PROPTREENODE = {
		Internal: "internal_",
		Leaf: "leaf_"
	};

	// Qua groups:

	var GROUP_PREFIX = "____________"; // To avoid group SUBID conflict.
	var GROUP = {
		All: GROUP_PREFIX + "MSE_All",
		Maintained: GROUP_PREFIX + "MSE_Maintained",
		NotMaintained: GROUP_PREFIX + "MSE_NotMaintained"
	};

	var PLMModelManager = function (oComponent) {
		ModelManager.call(this, oComponent);

		// EXT_CLASS
		oComponent.initClassExtension(this, "gramont.VCDSM.specedit.util.PLMModelManager", arguments);

		this._init();
	};

	PLMModelManager.prototype = Object.create(ModelManager.prototype);
	PLMModelManager.prototype.constructor = PLMModelManager;

	PLMModelManager.prototype._getNodeInfos = function () {
		// Construct PLM node structure.

		var oNodeInfos = {
			Specification: {
				keyFields: ["RECNROOT", "ACTN"],
				keyed: true,

				nodes: {
					HeaderInfo: {
						keyFields: ["RECNROOT", "ACTN"],

						backendFetchRequest: jQuery.proxy(this._backendFetchRequestForHeaderInfo, this)
					},

					BasicData: {
						keyFields: ["RECNROOT", "ACTN"],

						backendFetchRequest: jQuery.proxy(this._backendFetchRequestForBasicData, this),
						backendUpdateRequest: jQuery.proxy(this._backendUpdateRequestForBasicData, this),
						getFieldNames: jQuery.proxy(this._getFieldNamesForBasicData, this),
						getErrorLabel: jQuery.proxy(this._getErrorLabelForBasicData, this)
					},

					Identifier: {
						keyFields: ["RECNROOT", "SPC_ACTN", "RECN", "ACTN"],

						backendFetchRequest: jQuery.proxy(this._backendFetchRequestForIdentifier, this),
						backendCreateRequest: jQuery.proxy(this._backendCreateRequestForIdentifier, this),
						backendUpdateRequest: jQuery.proxy(this._backendUpdateRequestForIdentifier, this),
						backendDeleteRequest: jQuery.proxy(this._backendDeleteRequestForIdentifier, this),
						prepareEntry: jQuery.proxy(this._prepareEntryForIdentifier, this),
						getFieldNames: jQuery.proxy(this._getFieldNamesForIdentifier, this),
						getErrorLabel: jQuery.proxy(this._getErrorLabelForIdentifier, this),
						forceReload: jQuery.proxy(this._forceReloadForIdentifier, this),
						autoGrow: true
					},

					Property: {
						keyFields: ["RECNROOT", "ACTN", "MENID", "ID", "ESTCAT"],

						backendFetchRequest: jQuery.proxy(this._backendFetchRequestForProperty, this),

						nodes: {
							Instance: {
								keyFields: ["RECNROOT", "ACTN", "RECNPARENT", "ESTCAT", "RECN_VP", "ACTN_VP"],

								backendFetchRequest: jQuery.proxy(this._backendFetchRequestForInstance, this),
								backendCreateRequest: jQuery.proxy(this._backendCreateRequestForInstance, this),
								backendUpdateRequest: jQuery.proxy(this._backendUpdateRequestForInstance, this),
								backendDeleteRequest: jQuery.proxy(this._backendDeleteRequestForInstance, this),
								prepareEntry: jQuery.proxy(this._prepareEntryForInstance, this),
								getFieldNames: jQuery.proxy(this._getFieldNamesForInstance, this),
								getErrorLabel: jQuery.proxy(this._getErrorLabelForInstance, this),
								forceReload: jQuery.proxy(this._forceReloadForInstance, this),
								isSingleEntry: jQuery.proxy(this._isSingleEntryForInstance, this),
								autoGrow: true,

								nodes: {
									Composition: {
										keyFields: ["RECNROOT", "SPC_ACTN", "RECN", "ACTN", "RECNPARENT", "ESTCAT", "RECN_VP", "ACTN_VP"],

										backendFetchRequest: jQuery.proxy(this._backendFetchRequestForComposition, this),
										backendFetchEmptyRequest: jQuery.proxy(this._backendFetchEmptyRequestForComposition, this),
										backendCreateRequest: jQuery.proxy(this._backendCreateRequestForComposition, this),
										backendUpdateRequest: jQuery.proxy(this._backendUpdateRequestForComposition, this),
										backendDeleteRequest: jQuery.proxy(this._backendDeleteRequestForComposition, this),
										prepareEntry: jQuery.proxy(this._prepareEntryForComposition, this),
										getFieldNames: jQuery.proxy(this._getFieldNamesForComposition, this),
										getErrorLabel: jQuery.proxy(this._getErrorLabelForComposition, this),
										autoGrow: true
									},

									MultiComposition: {
										keyFields: ["RECNROOT", "RECN", "ACTN", "RECNPARENT", "ESTCAT", "RECN_VP", "ACTN_VP"],

										backendFetchRequest: jQuery.proxy(this._backendFetchRequestForMultiComposition, this),
										backendFetchEmptyRequest: jQuery.proxy(this._backendFetchEmptyRequestForMultiComposition, this),
										backendCreateRequest: jQuery.proxy(this._backendCreateRequestForMultiComposition, this),
										backendUpdateRequest: jQuery.proxy(this._backendUpdateRequestForMultiComposition, this),
										backendDeleteRequest: jQuery.proxy(this._backendDeleteRequestForMultiComposition, this),
										prepareEntry: jQuery.proxy(this._prepareEntryForMultiComposition, this),
										getFieldNames: jQuery.proxy(this._getFieldNamesForMultiComposition, this),
										getErrorLabel: jQuery.proxy(this._getErrorLabelForMultiComposition, this),
										autoGrow: true
									},

									Qual: {
										keyFields: ["RECNROOT", "SPC_ACTN", "RECN", "ACTN", "RECNPARENT", "ESTCAT", "RECN_VP", "ACTN_VP"],

										backendFetchRequest: jQuery.proxy(this._backendFetchRequestForQual, this),
										backendFetchEmptyRequest: jQuery.proxy(this._backendFetchEmptyRequestForQual, this),
										backendCreateRequest: jQuery.proxy(this._backendCreateRequestForQual, this),
										backendUpdateRequest: jQuery.proxy(this._backendUpdateRequestForQual, this),
										backendDeleteRequest: jQuery.proxy(this._backendDeleteRequestForQual, this),
										getFieldNames: jQuery.proxy(this._getFieldNamesForQual, this),
										getErrorLabel: jQuery.proxy(this._getErrorLabelForQual, this),
										resetOnDelete: true
									},

									Quant: {
										keyFields: ["RECNROOT", "SPC_ACTN", "RECN", "ACTN", "RECNPARENT", "ESTCAT", "RECN_VP", "ACTN_VP"],

										backendFetchRequest: jQuery.proxy(this._backendFetchRequestForQuant, this),
										backendFetchEmptyRequest: jQuery.proxy(this._backendFetchEmptyRequestForQuant, this),
										backendCreateRequest: jQuery.proxy(this._backendCreateRequestForQuant, this),
										backendUpdateRequest: jQuery.proxy(this._backendUpdateRequestForQuant, this),
										backendDeleteRequest: jQuery.proxy(this._backendDeleteRequestForQuant, this),
										getFieldNames: jQuery.proxy(this._getFieldNamesForQuant, this),
										getErrorLabel: jQuery.proxy(this._getErrorLabelForQuant, this),
										resetOnDelete: true
									},

									List: {
										keyFields: ["RECNROOT", "SPC_ACTN", "RECN", "ACTN", "RECNPARENT", "ESTCAT", "RECN_VP", "ACTN_VP", "RECNTVA"],

										backendFetchRequest: jQuery.proxy(this._backendFetchRequestForList, this),
										backendFetchEmptyRequest: jQuery.proxy(this._backendFetchEmptyRequestForList, this),
										backendCreateRequest: jQuery.proxy(this._backendCreateRequestForList, this),
										backendUpdateRequest: jQuery.proxy(this._backendUpdateRequestForList, this),
										backendDeleteRequest: jQuery.proxy(this._backendDeleteRequestForList, this),
										prepareEntry: jQuery.proxy(this._prepareEntryForList, this),
										getFieldNames: jQuery.proxy(this._getFieldNamesForList, this),
										getErrorLabel: jQuery.proxy(this._getErrorLabelForList, this),
										autoGrow: true
									},

									UserDefinedText: {
										keyFields: ["RECNROOT", "SPC_ACTN", "RECN", "ACTN", "RECNPARENT", "RECNMST"],

										backendFetchRequest: jQuery.proxy(this._backendFetchRequestForUserDefinedText, this),
										backendFetchEmptyRequest: jQuery.proxy(this._backendFetchEmptyRequestForUserDefinedText, this),
										backendCreateRequest: jQuery.proxy(this._backendCreateRequestForUserDefinedText, this),
										backendUpdateRequest: jQuery.proxy(this._backendUpdateRequestForUserDefinedText, this),
										backendDeleteRequest: jQuery.proxy(this._backendDeleteRequestForUserDefinedText, this),
										prepareEntry: jQuery.proxy(this._prepareEntryForUserDefinedText, this),
										getFieldNames: jQuery.proxy(this._getFieldNamesForUserDefinedText, this),
										getErrorLabel: jQuery.proxy(this._getErrorLabelForUserDefinedText, this),
										forceReload: jQuery.proxy(this._forceReloadForUserDefinedText, this),
										autoGrow: true
									},
									Phrase: {
										keyFields: ["Phrkey"],

										backendFetchRequest: jQuery.proxy(this._backendFetchRequestForText, this),
										backendFetchEmptyRequest: jQuery.proxy(this._backendFetchEmptyRequestForText, this),
										// backendCreateRequest: jQuery.proxy(this._backendCreateRequestForUserDefinedText, this),
										// backendUpdateRequest: jQuery.proxy(this._backendUpdateRequestForUserDefinedText, this),
										// backendDeleteRequest: jQuery.proxy(this._backendDeleteRequestForUserDefinedText, this),
										prepareEntry: jQuery.proxy(this._prepareEntryForUserDefinedText, this),
										getFieldNames: jQuery.proxy(this._getFieldNamesForUserDefinedText, this),
										getErrorLabel: jQuery.proxy(this._getErrorLabelForUserDefinedText, this),
										forceReload: jQuery.proxy(this._forceReloadForUserDefinedText, this),
										autoGrow: true
									},

									DocLink: {
										keyFields: ["RECNROOT"],

										backendFetchRequest: jQuery.proxy(this._backendFetchRequestForDocLink, this),
										backendFetchEmptyRequest: jQuery.proxy(this._backendFetchEmptyRequestForDocLink, this),
										backendCreateRequest: jQuery.proxy(this._backendCreateRequestForDocLink, this),
										backendUpdateRequest: jQuery.proxy(this._backendUpdateRequestFordoclink, this),
										backendDeleteRequest: jQuery.proxy(this._backendDeleteRequestForDocLink, this),
										prepareEntry: jQuery.proxy(this._prepareEntryForDocLink, this),
										getFieldNames: jQuery.proxy(this._getFieldNamesForDocLink, this),
										getErrorLabel: jQuery.proxy(this._getErrorLabelForDocLink, this),
										forceReload: jQuery.proxy(this._forceReloadForDocLink, this)
									},

									Usage: {
										keyFields: ["RECNROOT", "SPC_ACTN", "RECN", "ACTN", "RECNMST"],

										backendFetchRequest: jQuery.proxy(this._backendFetchRequestForUsage, this),
										backendFetchEmptyRequest: jQuery.proxy(this._backendFetchEmptyRequestForUsage, this),
										backendCreateRequest: jQuery.proxy(this._backendCreateRequestForUsage, this),
										backendUpdateRequest: jQuery.proxy(this._backendUpdateRequestForUsage, this),
										backendDeleteRequest: jQuery.proxy(this._backendDeleteRequestForUsage, this),
										prepareEntry: jQuery.proxy(this._prepareEntryForUsage, this),
										getFieldNames: jQuery.proxy(this._getFieldNamesForUsage, this),
										getErrorLabel: jQuery.proxy(this._getErrorLabelForUsage, this),
										forceReload: jQuery.proxy(this._forceReloadForUsage, this),
										autoGrow: true
									}
								}
							}
						}
					},

					Status: {
						keyFields: ["RECNROOT", "SPC_ACTN", "RECN", "ACTN"],

						backendFetchRequest: jQuery.proxy(this._backendFetchRequestForStatus, this),
						backendCreateRequest: jQuery.proxy(this._backendCreateRequestForStatus, this),
						backendUpdateRequest: jQuery.proxy(this._backendUpdateRequestForStatus, this),
						backendDeleteRequest: jQuery.proxy(this._backendDeleteRequestForStatus, this),
						getFieldNames: jQuery.proxy(this._getFieldNamesForStatus, this),
						getErrorLabel: jQuery.proxy(this._getErrorLabelForStatus, this),
						autoGrow: true
					},

					Material: {
						keyFields: ["RECNROOT", "SPC_ACTN", "RECN", "ACTN"],

						backendFetchRequest: jQuery.proxy(this._backendFetchRequestForMaterial, this),
						backendCreateRequest: jQuery.proxy(this._backendCreateRequestForMaterial, this),
						backendUpdateRequest: jQuery.proxy(this._backendUpdateRequestForMaterial, this),
						backendDeleteRequest: jQuery.proxy(this._backendDeleteRequestForMaterial, this),
						getFieldNames: jQuery.proxy(this._getFieldNamesForMaterial, this),
						getErrorLabel: jQuery.proxy(this._getErrorLabelForMaterial, this),
						autoGrow: true
					}
				}
			}
		};

		// EXT_HOOK: _extHookSetupNodeInfos
		// Setup node info customization.

		if (this._extHookSetupNodeInfos)
			this._extHookSetupNodeInfos(oNodeInfos);

		return oNodeInfos;
	};

	PLMModelManager.prototype._backendFetchRequestForHeaderInfo = function (oSpecificationKey, oAdditional) {
		var oBackendRequest = this._getComponent().getODataManager().requestForFetchHeaderInfo(oSpecificationKey);

		oBackendRequest.postProcess = function (oHeaderInfo) {
			var oResponse = {
				entries: [oHeaderInfo]
			};

			return oResponse;
		};

		var oBackendRequestObj = {
			request: oBackendRequest,
			response: null
		};

		return oBackendRequestObj;
	};

	PLMModelManager.prototype._backendFetchRequestForBasicData = function (oSpecificationKey, oAdditional) {
		var oBackendRequest = this._getComponent().getODataManager().requestForFetchBasicData(oSpecificationKey);

		oBackendRequest.postProcess = function (oBasicData) {
			var oResponse = {
				entries: [oBasicData]
			};

			return oResponse;
		};

		var oBackendRequestObj = {
			request: oBackendRequest,
			response: null
		};

		return oBackendRequestObj;
	};

	PLMModelManager.prototype._backendUpdateRequestForBasicData = function (oEntryInfo, oBasicData, oAdditional) {
		var oBackendRequest = this._getComponent().getODataManager().requestForUpdateBasicData(oBasicData);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._getFieldNamesForBasicData = function (oAdditional) {
		var oFieldNamesInfo = oAdditional.fieldNamesInfo;

		if (!oFieldNamesInfo) {
			oFieldNamesInfo = oAdditional.fieldNamesInfo = {
				fieldNames: ["SUBCHAR", "AUTHGRP", "REM"],
				entryError: false
			};
		}

		return oFieldNamesInfo;
	};

	PLMModelManager.prototype._getErrorLabelForBasicData = function (oBasicDataKey, oAdditional) {
		var sLabel = this._getComponent().getI18nBundle().getText("PLMModelManager.errorLabel.basicData");
		return sLabel;
	};

	PLMModelManager.prototype._backendFetchRequestForIdentifier = function (oSpecificationKey, oAdditional) {
		var that = this;
		var aBackendRequests = [];

		// Fetch default identifier list, if needed.

		var bFetchDefaultIdentifier = !oAdditional.defaultIdentifiers;

		if (bFetchDefaultIdentifier) {
			var oDefaultIdentifierBackendRequest = this._getComponent().getODataManager().requestForFetchDefaultIdentifier(oSpecificationKey);
			aBackendRequests.push(oDefaultIdentifierBackendRequest);
		}

		// Fetch identifiers.

		var oIdentifierBackendRequest = this._getComponent().getODataManager().requestForFetchIdentifier(oSpecificationKey);
		aBackendRequests.push(oIdentifierBackendRequest);

		// EXT_HOOK: _extHookBackendFetchRequestForIdentifierAddRequests
		// Add custom requests.

		if (this._extHookBackendFetchRequestForIdentifierAddRequests) {
			var _aBackendRequests = this._extHookBackendFetchRequestForIdentifierAddRequests(oSpecificationKey, oAdditional);
			aBackendRequests = aBackendRequests.concat(_aBackendRequests);
		}

		var oBackendRequest = this._getComponent().getODataManager().requestForMergeRequests(aBackendRequests);

		oBackendRequest.postProcess = function (oResponse) {
			var iResponseIndex = 0;
			var aResponses = oResponse.responses;

			// Store into additional.

			if (bFetchDefaultIdentifier) {
				assert(!oAdditional.defaultIdentifiers, "defaultIdentifiers should be cleared");

				var aDefaultIdentifiers = aResponses[iResponseIndex++].response.defaultIdentifiers;
				oAdditional.defaultIdentifiers = aDefaultIdentifiers;
			}

			// Store entries.

			var oIdentifierResponse = aResponses[iResponseIndex++].response;

			// EXT_HOOK: _extHookBackendFetchRequestForIdentifierProcessResponse
			// Do custom response processing.

			if (that._extHookBackendFetchRequestForIdentifierProcessResponse) {
				var _aResponses = aResponses.slice(iResponseIndex);
				that._extHookBackendFetchRequestForIdentifierProcessResponse(oIdentifierResponse, oAdditional, _aResponses);
			}

			var aIdentifiers = oIdentifierResponse.entries;

			var oNewResponse = {
				entries: aIdentifiers
			};

			return oNewResponse;
		};

		var oBackendRequestObj = {
			request: oBackendRequest,
			response: null
		};

		return oBackendRequestObj;
	};

	PLMModelManager.prototype._backendCreateRequestForIdentifier = function (oEntryInfo, oCreateInfo, oIdentifier, oAdditional) {
		var oBackendRequest = this._getComponent().getODataManager().requestForCreateIdentifier(oCreateInfo, oIdentifier);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._backendUpdateRequestForIdentifier = function (oEntryInfo, oIdentifier, oAdditional) {
		var oBackendRequest = this._getComponent().getODataManager().requestForUpdateIdentifier(oIdentifier);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._backendDeleteRequestForIdentifier = function (oEntryInfo, oIdentifierKey, oAdditional) {
		var oBackendRequest = this._getComponent().getODataManager().requestForDeleteIdentifier(oIdentifierKey);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._prepareEntryForIdentifier = function (aIdentifiers, oIdentifier, oAdditional) {
		// Calculate sort order.

		var aSorts = this._extractSort(aIdentifiers, "ORD");
		oIdentifier.ORD = this._calcSortNext(aSorts);

		// EXT_HOOK: _extHookPrepareEntryForIdentifier
		// Customize data fields.

		if (this._extHookPrepareEntryForIdentifier)
			this._extHookPrepareEntryForIdentifier(aIdentifiers, oIdentifier, oAdditional);
	};

	PLMModelManager.prototype._getFieldNamesForIdentifier = function (oAdditional) {
		var oFieldNamesInfo = oAdditional.fieldNamesInfo;

		if (!oFieldNamesInfo) {
			oFieldNamesInfo = oAdditional.fieldNamesInfo = {
				fieldNames: ["ORD", "IDTYPE", "IDCAT", "IDENT", "LANGU"],
				entryError: true
			};

			// EXT_HOOK: _extHookGetFieldNamesForIdentifier
			// Customize field names.

			if (this._extHookGetFieldNamesForIdentifier)
				this._extHookGetFieldNamesForIdentifier(oFieldNamesInfo, oAdditional);
		}

		return oFieldNamesInfo;
	};

	PLMModelManager.prototype._getErrorLabelForIdentifier = function (oIdentifierKey, oAdditional) {
		var sLabel = this._getComponent().getI18nBundle().getText("PLMModelManager.errorLabel.identifier");
		return sLabel;
	};

	PLMModelManager.prototype._forceReloadForIdentifier = function (oSpecificationKey, oAdditional) {
		// Construct reload info object.

		var aReloadInfos = [];

		var oReloadInfo = {
			nodeName: "HeaderInfo",
			parentKey: oSpecificationKey
		};

		aReloadInfos.push(oReloadInfo);

		return aReloadInfos;
	};

	PLMModelManager.prototype._backendFetchRequestForProperty = function (oSpecificationKey, oAdditional) {
		var that = this;

		var oBackendRequest = this._getComponent().getODataManager().requestForFetchPropTree(oSpecificationKey);

		oBackendRequest.postProcess = function (oResponse) {
			var aPropTrees = oResponse.propTrees;

			// Process property trees:
			// - Collect leaf nodes (with unique ESTCAT).
			// - Build data structure for maintained flag:
			//   - For leaf node:
			//     - On initial property tree fetch, use backend-side calculated value.
			//     - On instance modification, use client-side calculated value.
			//   - For root and internal nodes:
			//     - Always calculate flag, based on its sub nodes.

			var oNodesByESTCAT = {};
			var oMaintainedData = {};

			var oProcessInfo = {
				nodesByESTCAT: oNodesByESTCAT,
				nodes: [],
				maintainedKey: 0,
				maintainedData: oMaintainedData
			};

			for (var i = 0; i < aPropTrees.length; i++) {
				var oPropTree = aPropTrees[i];
				var oRootNode = oPropTree.rootNode;

				if (oRootNode)
					that._processPropTreeNode(oRootNode, oProcessInfo);
			}

			that._calcPropTreeMaintained(aPropTrees, oMaintainedData);

			// Store into additional.

			oAdditional.propTrees = aPropTrees;

			oAdditional.nodesByESTCAT = oNodesByESTCAT;

			var oMaintainedModel = oAdditional.maintainedModel;
			if (!oMaintainedModel)
				oMaintainedModel = oAdditional.maintainedModel = new JSONModel();

			oMaintainedModel.setData(oMaintainedData);

			// Store entries.

			oResponse.entries = oProcessInfo.nodes;

			return oResponse;
		};

		var oBackendRequestObj = {
			request: oBackendRequest,
			response: null
		};

		return oBackendRequestObj;
	};

	PLMModelManager.prototype._backendFetchRequestForInstance = function (oPropertyKey, oAdditional) {
		var that = this;

		var oBackendRequest = this._getComponent().getODataManager().requestForFetchInstance(oPropertyKey, oAdditional.info == null,
			oAdditional.charHeaderInfo);

		oBackendRequest.postProcess = function (oResponse) {
			// Trigger maintained flag calculation. It is postponed to the end of fetch
			// for performance reasons to do calculation only once, even if you change
			// many properties.
			if (oPropertyKey.Phrkey == "") {
				var oPropertyAdditional = oAdditional.parent; // Property
				var oMaintainedData = oPropertyAdditional.maintainedModel.getData();
				assert(oMaintainedData, "oMaintainedData should be set");

				var sMaintainedKey = PROPTREENODE.Leaf + oPropertyKey.ESTCAT;
				assert(oMaintainedData[sMaintainedKey] != null, "Maintained flag should exist");

				oMaintainedData[sMaintainedKey] = (oResponse.entries.length > 0);
				oMaintainedData[sMaintainedKey] = false;

				if (that._aPropTreeAdditionals.indexOf(oPropertyAdditional) < 0) // FIXME: faster way
					that._aPropTreeAdditionals.push(oPropertyAdditional);

				// Store into additional.

				if (!oAdditional.info)
					oAdditional.info = oResponse.info;

				if (!oAdditional.charHeaderInfo)
					oAdditional.charHeaderInfo = oResponse.charHeaderInfo;

				// VC: make sure we always have at least one instance.

				var aInstances = oResponse.entries;

				if (aInstances.length == 0) {
					var oInstance = {};
					oInstance[ModelManagerConst.Empty] = true;

					aInstances.push(oInstance);
				}

				// EXT_HOOK: _extHookBackendFetchRequestForInstancePostProcess
				// Do custom postprocess.

				if (that._extHookBackendFetchRequestForInstancePostProcess)
					that._extHookBackendFetchRequestForInstancePostProcess(oResponse.entries);
			}

			return oResponse;
		};

		var oBackendRequestObj = {
			request: oBackendRequest,
			response: null
		};

		return oBackendRequestObj;
	};

	PLMModelManager.prototype._backendCreateRequestForInstance = function (oEntryInfo, oCreateInfo, oInstance, oAdditional) {
		var oCharHeaderInfo = oAdditional.charHeaderInfo;
		assert(oCharHeaderInfo, "oCharHeaderInfo should be set");

		var oBackendRequest = this._getComponent().getODataManager().requestForCreateInstance(oCreateInfo, oInstance, oCharHeaderInfo);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._backendUpdateRequestForInstance = function (oEntryInfo, oInstance, oAdditional) {
		var oCharHeaderInfo = oAdditional.charHeaderInfo;
		assert(oCharHeaderInfo, "oCharHeaderInfo should be set");

		var oBackendRequest = this._getComponent().getODataManager().requestForUpdateInstance(oInstance, oCharHeaderInfo);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._backendDeleteRequestForInstance = function (oEntryInfo, oInstanceKey, oAdditional) {
		var oBackendRequest = this._getComponent().getODataManager().requestForDeleteInstance(oInstanceKey);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._prepareEntryForInstance = function (aInstances, oInstance, oAdditional) {
		// Create empty characteristics.

		var oCharHeaderInfo = oAdditional.charHeaderInfo;
		assert(oCharHeaderInfo, "oCharHeaderInfo should be set");

		var aCharHeaders = oCharHeaderInfo.byOrder;

		for (var i = 0; i < aCharHeaders.length; i++) {
			var oCharHeader = aCharHeaders[i];
			oCharHeader.createEmptyCharValues(oInstance);
		}

		// Calculate sort order.

		var oSortCharHeader = oCharHeaderInfo.byFieldName["__STDVAI_SORT"];
		if (oSortCharHeader &&
			oSortCharHeader instanceof CharHeaderChar && // FIXME: better check
			!oSortCharHeader.getMultiValue()) {
			var aSorts = [];

			for (var i = 0; i < aInstances.length; i++) {
				var _oInstance = aInstances[i];

				var aCharValues = oSortCharHeader.getCharValues(_oInstance);
				assert(aCharValues.length == 1, "aCharValues.length should be 1");
				var sCharValue = aCharValues[0];

				aSorts.push(sCharValue);
			}

			var sSortNext = this._calcSortNext(aSorts);
			oSortCharHeader.setCharValues(oInstance, [sSortNext]);
		}
	};

	PLMModelManager.prototype._getFieldNamesForInstance = function (oAdditional) {
		var oFieldNamesInfo = oAdditional.fieldNamesInfo;

		if (!oFieldNamesInfo) {
			var aFieldNames = [];

			oFieldNamesInfo = oAdditional.fieldNamesInfo = {
				fieldNames: aFieldNames,
				entryError: true
			};

			var oCharHeaderInfo = oAdditional.charHeaderInfo;
			assert(oCharHeaderInfo, "oCharHeaderInfo should be set");

			var aCharHeaders = oCharHeaderInfo.byOrder;

			for (var i = 0; i < aCharHeaders.length; i++) {
				// FIXME: In case of error, highlight only EDITABLE fields. -> Currently it is instance specific which field is editable.

				var oCharHeader = aCharHeaders[i];
				var sFieldName = oCharHeader.getFieldName();

				aFieldNames.push(sFieldName);
			}
		}

		return oFieldNamesInfo;
	};

	PLMModelManager.prototype._getErrorLabelForInstance = function (oInstanceKey, oAdditional) {
		var sLabel = this._getErrorLabelByInstanceKey("PLMModelManager.errorLabel.instance", oInstanceKey, oAdditional);
		return sLabel;
	};

	PLMModelManager.prototype._forceReloadForInstance = function (oPropertyKey, oAdditional) {
		// Construct reload info object.

		var aReloadInfos = [];

		// EXT_HOOK: _extHookForceReloadForInstance
		// Customize reload info.

		if (this._extHookForceReloadForInstance)
			this._extHookForceReloadForInstance(oPropertyKey, oAdditional, aReloadInfos);

		return aReloadInfos;
	};

	PLMModelManager.prototype._isSingleEntryForInstance = function (oAdditional) {
		var bIsSingleEntry = oAdditional.info.INSTANCE_SINGLE;
		return bIsSingleEntry;
	};

	PLMModelManager.prototype._backendFetchRequestForComposition = function (oInstanceKey, oAdditional) {
		var oBackendRequestObj = this._createFetchCompositionBackendRequestObj(oInstanceKey, oAdditional, true);
		return oBackendRequestObj;
	};

	PLMModelManager.prototype._backendFetchEmptyRequestForComposition = function (oInstanceKey, oAdditional) {
		var oBackendRequestObj = this._createFetchCompositionBackendRequestObj(oInstanceKey, oAdditional, false);
		return oBackendRequestObj;
	};

	PLMModelManager.prototype._backendCreateRequestForComposition = function (oEntryInfo, oCreateInfo, oComposition, oAdditional) {
		// EXT_HOOK: _extHookBackendCreateRequestForCompositionGetExtParam
		// Get ExtParam for OData query.

		var oExtParam = this._extHookBackendCreateRequestForCompositionGetExtParam ?
			this._extHookBackendCreateRequestForCompositionGetExtParam(oAdditional) :
			null;

		var oBackendRequest = this._getComponent().getODataManager().requestForCreateComposition(oCreateInfo, oComposition, oExtParam);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._backendUpdateRequestForComposition = function (oEntryInfo, oComposition, oAdditional) {
		// EXT_HOOK: _extHookBackendUpdateRequestForCompositionGetExtParam
		// Get ExtParam for OData query.

		var oExtParam = this._extHookBackendUpdateRequestForCompositionGetExtParam ?
			this._extHookBackendUpdateRequestForCompositionGetExtParam(oAdditional) :
			null;

		var oBackendRequest = this._getComponent().getODataManager().requestForUpdateComposition(oComposition, oExtParam);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._backendDeleteRequestForComposition = function (oEntryInfo, oCompositionKey, oAdditional) {
		var oBackendRequest = this._getComponent().getODataManager().requestForDeleteComposition(oCompositionKey);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._prepareEntryForComposition = function (aCompositions, oComposition, oAdditional) {
		// Calculate sort order.

		var aSorts = this._extractSort(aCompositions, "ORD");
		oComposition.ORD = this._calcSortNext(aSorts);

		// Fill fields (see /plmu/cl_spc_ign_fd_li_comp->get_default_row).

		oComposition.PRECL = ">=";
		oComposition.PRECU = "<=";
		oComposition.COMPEXP = "%";

		// EXT_HOOK: _extHookPrepareEntryForComposition
		// Customize data fields.

		if (this._extHookPrepareEntryForComposition)
			this._extHookPrepareEntryForComposition(aCompositions, oComposition, oAdditional);
	};

	PLMModelManager.prototype._getFieldNamesForComposition = function (oAdditional) {
		var oFieldNamesInfo = oAdditional.fieldNamesInfo;

		if (!oFieldNamesInfo) {
			oFieldNamesInfo = oAdditional.fieldNamesInfo = {
				fieldNames: ["SUBID", "COMPCAT", "COMPEXCVAL", "COMPAVGTXT", "COMPEXP", "PRECL", "COMPLOWTXT", "PRECU", "COMPUPPTXT", "ORD"],
				entryError: true
			};

			// EXT_HOOK: _extHookGetFieldNamesForComposition
			// Customize field names.

			if (this._extHookGetFieldNamesForComposition)
				this._extHookGetFieldNamesForComposition(oFieldNamesInfo, oAdditional);
		}

		return oFieldNamesInfo;
	};

	PLMModelManager.prototype._getErrorLabelForComposition = function (oCompositionKey, oAdditional) {
		var oInstanceKey = this.getParentInstanceKeyByCompositionKey(oCompositionKey);
		var oInstanceAdditional = oAdditional.parent; // Instance

		var sLabel = this._getErrorLabelByInstanceKey("PLMModelManager.errorLabel.composition", oInstanceKey, oInstanceAdditional);
		return sLabel;
	};

	PLMModelManager.prototype._backendFetchRequestForMultiComposition = function (oInstanceKey, oAdditional) {
		var oBackendRequestObj = this._createFetchMultiCompositionBackendRequestObj(oInstanceKey, oAdditional, true);
		return oBackendRequestObj;
	};

	PLMModelManager.prototype._backendFetchEmptyRequestForMultiComposition = function (oInstanceKey, oAdditional) {
		var oBackendRequestObj = this._createFetchMultiCompositionBackendRequestObj(oInstanceKey, oAdditional, false);
		return oBackendRequestObj;
	};

	PLMModelManager.prototype._backendCreateRequestForMultiComposition = function (oEntryInfo, oCreateInfo, oComposition, oAdditional) {
		// EXT_HOOK: _extHookBackendCreateRequestForCompositionGetExtParam
		// Get ExtParam for OData query.

		var oExtParam = this._extHookBackendCreateRequestForCompositionGetExtParam ?
			this._extHookBackendCreateRequestForCompositionGetExtParam(oAdditional) :
			null;

		var oBackendRequest = this._getComponent().getODataManager().requestForCreateMultiComposition(oCreateInfo, oComposition, oExtParam);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._backendUpdateRequestForMultiComposition = function (oEntryInfo, oComposition, oAdditional) {
		// EXT_HOOK: _extHookBackendUpdateRequestForCompositionGetExtParam
		// Get ExtParam for OData query.

		var oExtParam = this._extHookBackendUpdateRequestForCompositionGetExtParam ?
			this._extHookBackendUpdateRequestForCompositionGetExtParam(oAdditional) :
			null;

		var oBackendRequest = this._getComponent().getODataManager().requestForUpdateMultiComposition(oComposition, oExtParam);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._backendDeleteRequestForMultiComposition = function (oEntryInfo, oCompositionKey, oAdditional) {
		var oBackendRequest = this._getComponent().getODataManager().requestForDeleteMultiComposition(oCompositionKey);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._prepareEntryForMultiComposition = function (aCompositions, oComposition, oAdditional) {
		// Calculate sort order.

		var aSorts = this._extractSort(aCompositions, "ORD");
		oComposition.ORD = this._calcSortNext(aSorts);

		// Fill fields (see /plmu/cl_spc_ign_fd_li_comp->get_default_row).

		oComposition.PRECL = ">=";
		oComposition.PRECU = "<=";
		oComposition.COMPEXP = "%";

		// EXT_HOOK: _extHookPrepareEntryForComposition
		// Customize data fields.

		if (this._extHookPrepareEntryForComposition)
			this._extHookPrepareEntryForComposition(aCompositions, oComposition, oAdditional);
	};

	PLMModelManager.prototype._getFieldNamesForMultiComposition = function (oAdditional) {
		var oFieldNamesInfo = oAdditional.fieldNamesInfo;

		if (!oFieldNamesInfo) {
			oFieldNamesInfo = oAdditional.fieldNamesInfo = {
				fieldNames: ["SUBID", "COMPCAT", "COMPEXCVAL", "COMPAVGTXT", "COMPEXP", "PRECL", "COMPLOWTXT", "PRECU", "COMPUPPTXT", "ORD"],
				entryError: true
			};

			// EXT_HOOK: _extHookGetFieldNamesForComposition
			// Customize field names.

			if (this._extHookGetFieldNamesForComposition)
				this._extHookGetFieldNamesForComposition(oFieldNamesInfo, oAdditional);
		}

		return oFieldNamesInfo;
	};

	PLMModelManager.prototype._getErrorLabelForMultiComposition = function (oCompositionKey, oAdditional) {
		var oInstanceKey = this.getParentInstanceKeyByCompositionKey(oCompositionKey);
		var oInstanceAdditional = oAdditional.parent; // Instance

		var sLabel = this._getErrorLabelByInstanceKey("PLMModelManager.errorLabel.composition", oInstanceKey, oInstanceAdditional);
		return sLabel;
	};
	PLMModelManager.prototype._backendFetchRequestForQual = function (oInstanceKey, oAdditional) {
		var oBackendRequestObj = this._createFetchQualBackendRequestObj(oInstanceKey, oAdditional, true);
		return oBackendRequestObj;
	};

	PLMModelManager.prototype._backendFetchEmptyRequestForQual = function (oInstanceKey, oAdditional) {
		var oBackendRequestObj = this._createFetchQualBackendRequestObj(oInstanceKey, oAdditional, false);
		return oBackendRequestObj;
	};

	PLMModelManager.prototype._backendCreateRequestForQual = function (oEntryInfo, oCreateInfo, oQual, oAdditional) {
		// EXT_HOOK: _extHookBackendCreateRequestForQualGetExtParam
		// Get ExtParam for OData query.
		var oHeaderinfo = oAdditional.parent.CompHeader;
		var oCreateInfo = {
			parentKey: {
				RECNROOT: oQual.RECNROOT,
				ACTN: oQual.SPC_ACTN,
				RECNPARENT: oQual.RECNPARENT,
				ESTCAT: oQual.ESTCAT,
				RECN_VP: oQual.RECN_VP,
				ACTN_VP: oQual.ACTN_VP
			}
		};
		var oExtParam = this._extHookBackendCreateRequestForQualGetExtParam ?
			this._extHookBackendCreateRequestForQualGetExtParam(oAdditional) :
			null;

		var oBackendRequest = this._getComponent().getODataManager().requestForCreateQual(oCreateInfo, oQual, oExtParam, oHeaderinfo);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._backendUpdateRequestForQual = function (oEntryInfo, oQual, oAdditional) {
		// Update is using the same backend call as create:
		// - Construct instance key from qual key.
		// - Can't construct RECNPARENT from qual key, but fortunately
		//   this key component is not used on backend during qual update.
		var oHeaderinfo = oAdditional.parent.CompHeader;
		var oCreateInfo = {
			parentKey: {
				RECNROOT: oQual.RECNROOT,
				ACTN: oQual.SPC_ACTN,
				RECNPARENT: oQual.RECNPARENT,
				ESTCAT: oQual.ESTCAT,
				RECN_VP: oQual.RECN_VP,
				ACTN_VP: oQual.ACTN_VP
			}
		};

		// EXT_HOOK: _extHookBackendUpdateRequestForQualGetExtParam
		// Get ExtParam for OData query.

		var oExtParam = this._extHookBackendUpdateRequestForQualGetExtParam ?
			this._extHookBackendUpdateRequestForQualGetExtParam(oAdditional) :
			null;

		var oBackendRequest = this._getComponent().getODataManager().requestForCreateQual(oCreateInfo, oQual, oExtParam, oHeaderinfo);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._backendDeleteRequestForQual = function (oEntryInfo, oQualKey, oAdditional) {
		var oBackendRequest = this._getComponent().getODataManager().requestForDeleteQual(oQualKey);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._getFieldNamesForQual = function (oAdditional) {
		var oFieldNamesInfo = oAdditional.fieldNamesInfo;

		if (!oFieldNamesInfo) {
			oFieldNamesInfo = oAdditional.fieldNamesInfo = {
				fieldNames: ["COMPEXCVAL"],
				entryError: true
			};

			// EXT_HOOK: _extHookGetFieldNamesForQual
			// Customize field names.

			if (this._extHookGetFieldNamesForQual)
				this._extHookGetFieldNamesForQual(oFieldNamesInfo, oAdditional);
		}

		return oFieldNamesInfo;
	};

	PLMModelManager.prototype._getErrorLabelForQual = function (oQualKey, oAdditional) {
		var oInstanceKey = this.getParentInstanceKeyByQualKey(oQualKey);
		var oInstanceAdditional = oAdditional.parent; // Instance
		var oInfo = oInstanceAdditional.info;

		var sLabel = this._getErrorLabelByInstanceKey("PLMModelManager.errorLabel.qual", oInstanceKey, oInstanceAdditional, oInfo.COMP_LABEL);
		return sLabel;
	};

	PLMModelManager.prototype._backendFetchRequestForQuant = function (oInstanceKey, oAdditional) {
		var oBackendRequestObj = this._createFetchQuantBackendRequestObj(oInstanceKey, oAdditional, true);
		return oBackendRequestObj;
	};

	PLMModelManager.prototype._backendFetchEmptyRequestForQuant = function (oInstanceKey, oAdditional) {
		var oBackendRequestObj = this._createFetchQuantBackendRequestObj(oInstanceKey, oAdditional, false);
		return oBackendRequestObj;
	};

	PLMModelManager.prototype._backendCreateRequestForQuant = function (oEntryInfo, oCreateInfo, oQuant, oAdditional) {
		// EXT_HOOK: _extHookBackendCreateRequestForQuantGetExtParam
		// Get ExtParam for OData query.
		var oHeaderinfo = oAdditional.parent.CompHeaderqnt;
		var oCreateInfo = {
			parentKey: {
				RECNROOT: oQuant.RECNROOT,
				ACTN: oQuant.SPC_ACTN,
				RECNPARENT: oQuant.RECNPARENT,
				ESTCAT: oQuant.ESTCAT,
				RECN_VP: oQuant.RECN_VP,
				ACTN_VP: oQuant.ACTN_VP
			}
		};
		var oExtParam = this._extHookBackendCreateRequestForQuantGetExtParam ?
			this._extHookBackendCreateRequestForQuantGetExtParam(oAdditional) :
			null;

		var oBackendRequest = this._getComponent().getODataManager().requestForCreateQuant(oCreateInfo, oQuant, oExtParam, oHeaderinfo);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._backendUpdateRequestForQuant = function (oEntryInfo, oQuant, oAdditional) {
		// Update is using the same backend call as create:
		// - Construct instance key from quant key.
		// - Can't construct RECNPARENT from quant key, but fortunately
		//   this key component is not used on backend during quant update.
		var oHeaderinfo = oAdditional.parent.CompHeaderqnt;
		var oCreateInfo = {
			parentKey: {
				RECNROOT: oQuant.RECNROOT,
				ACTN: oQuant.SPC_ACTN,
				RECNPARENT: oQuant.RECNPARENT,
				ESTCAT: oQuant.ESTCAT,
				RECN_VP: oQuant.RECN_VP,
				ACTN_VP: oQuant.ACTN_VP
			}
		};

		// EXT_HOOK: _extHookBackendUpdateRequestForQuantGetExtParam
		// Get ExtParam for OData query.

		var oExtParam = this._extHookBackendUpdateRequestForQuantGetExtParam ?
			this._extHookBackendUpdateRequestForQuantGetExtParam(oAdditional) :
			null;

		var oBackendRequest = this._getComponent().getODataManager().requestForCreateQuant(oCreateInfo, oQuant, oExtParam, oHeaderinfo);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._backendDeleteRequestForQuant = function (oEntryInfo, oQuantKey, oAdditional) {
		var oBackendRequest = this._getComponent().getODataManager().requestForDeleteQuant(oQuantKey);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._getFieldNamesForQuant = function (oAdditional) {
		var oFieldNamesInfo = oAdditional.fieldNamesInfo;

		if (!oFieldNamesInfo) {
			oFieldNamesInfo = oAdditional.fieldNamesInfo = {
				fieldNames: ["COMPEXCVAL", "COMPAVGTXT", "COMPEXP", "PRECL", "COMPLOWTXT", "PRECU", "COMPUPPTXT"],
				entryError: true
			};

			// EXT_HOOK: _extHookGetFieldNamesForQuant
			// Customize field names.

			if (this._extHookGetFieldNamesForQuant)
				this._extHookGetFieldNamesForQuant(oFieldNamesInfo, oAdditional);
		}

		return oFieldNamesInfo;
	};

	PLMModelManager.prototype._getErrorLabelForQuant = function (oQuantKey, oAdditional) {
		var oInstanceKey = this.getParentInstanceKeyByQuantKey(oQuantKey);
		var oInstanceAdditional = oAdditional.parent; // Instance
		var oInfo = oInstanceAdditional.info;

		var sLabel = this._getErrorLabelByInstanceKey("PLMModelManager.errorLabel.quant", oInstanceKey, oInstanceAdditional, oInfo.COMP_LABEL);
		return sLabel;
	};

	PLMModelManager.prototype._backendFetchRequestForList = function (oInstanceKey, oAdditional) {
		var oBackendRequestObj = this._createFetchListBackendRequestObj(oInstanceKey, oAdditional, true);
		return oBackendRequestObj;
	};

	PLMModelManager.prototype._backendFetchEmptyRequestForList = function (oInstanceKey, oAdditional) {
		var oBackendRequestObj = this._createFetchListBackendRequestObj(oInstanceKey, oAdditional, false);
		return oBackendRequestObj;
	};

	PLMModelManager.prototype._backendCreateRequestForList = function (oEntryInfo, oCreateInfo, oList, oAdditional) {
		// EXT_HOOK: _extHookBackendCreateRequestForListGetExtParam
		// Get ExtParam for OData query.

		var oExtParam = this._extHookBackendCreateRequestForListGetExtParam ?
			this._extHookBackendCreateRequestForListGetExtParam(oAdditional) :
			null;

		var oBackendRequest = this._getComponent().getODataManager().requestForCreateList(oCreateInfo, oList, oExtParam);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._backendUpdateRequestForList = function (oEntryInfo, oList, oAdditional) {
		// EXT_HOOK: _extHookBackendUpdateRequestForListGetExtParam
		// Get ExtParam for OData query.

		var oExtParam = this._extHookBackendUpdateRequestForListGetExtParam ?
			this._extHookBackendUpdateRequestForListGetExtParam(oAdditional) :
			null;

		var oBackendRequest = this._getComponent().getODataManager().requestForUpdateList(oList, oExtParam);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._backendDeleteRequestForList = function (oEntryInfo, oListKey, oAdditional) {
		var oBackendRequest = this._getComponent().getODataManager().requestForDeleteList(oListKey);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._prepareEntryForList = function (aLists, oList, oAdditional) {
		// Calculate sort order.

		var aSorts = this._extractSort(aLists, "ORD");
		oList.ORD = this._calcSortNext(aSorts);

		// EXT_HOOK: _extHookPrepareEntryForList
		// Customize data fields.

		if (this._extHookPrepareEntryForList)
			this._extHookPrepareEntryForList(aLists, oList, oAdditional);
	};

	PLMModelManager.prototype._getFieldNamesForList = function (oAdditional) {
		var oFieldNamesInfo = oAdditional.fieldNamesInfo;

		if (!oFieldNamesInfo) {
			oFieldNamesInfo = oAdditional.fieldNamesInfo = {
				fieldNames: ["SUBID", "ORD"],
				entryError: true
			};

			// EXT_HOOK: _extHookGetFieldNamesForList
			// Customize field names.

			if (this._extHookGetFieldNamesForList)
				this._extHookGetFieldNamesForList(oFieldNamesInfo, oAdditional);
		}

		return oFieldNamesInfo;
	};

	PLMModelManager.prototype._getErrorLabelForList = function (oListKey, oAdditional) {
		var oInstanceKey = this.getParentInstanceKeyByListKey(oListKey);
		var oInstanceAdditional = oAdditional.parent; // Instance

		var sLabel = this._getErrorLabelByInstanceKey("PLMModelManager.errorLabel.list", oInstanceKey, oInstanceAdditional);
		return sLabel;
	};

	PLMModelManager.prototype._backendFetchRequestForUserDefinedText = function (oInstanceKey, oAdditional) {
		var oBackendRequestObj = this._createFetchUserDefinedTextBackendRequestObj(oInstanceKey, oAdditional, true);
		return oBackendRequestObj;
	};
	// text changes
	PLMModelManager.prototype._backendFetchRequestForText = function (oInstanceKey, oAdditional) {
		var oBackendRequestObj = this._createFetchTextBackendRequestObj(oInstanceKey, oAdditional, true);
		return oBackendRequestObj;
	};

	PLMModelManager.prototype._backendFetchEmptyRequestForUserDefinedText = function (oInstanceKey, oAdditional) {
		var oBackendRequestObj = this._createFetchUserDefinedTextBackendRequestObj(oInstanceKey, oAdditional, false);
		return oBackendRequestObj;
	};
	// text changes
	PLMModelManager.prototype._backendFetchEmptyRequestForText = function (oInstanceKey, oAdditional) {
		var oBackendRequestObj = this._createFetchUserDefinedTextBackendRequestObj(oInstanceKey, oAdditional, false);
		return oBackendRequestObj;
	};

	PLMModelManager.prototype._backendCreateRequestForUserDefinedText = function (oEntryInfo, oCreateInfo, oUserDefinedText, oAdditional) {
		var oBackendRequest = this._getComponent().getODataManager().requestForCreateUserDefinedText(oCreateInfo, oUserDefinedText);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._backendUpdateRequestForUserDefinedText = function (oEntryInfo, oUserDefinedText, oAdditional) {
		var oBackendRequest = this._getComponent().getODataManager().requestForUpdateUserDefinedText(oUserDefinedText, oEntryInfo.changeInfo.parentKeyRef);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._backendUpdateRequestFordoclink = function (oEntryInfo, oUserDefinedText, oAdditional) {
		var oBackendRequest = this._getComponent().getODataManager().requestForUpdatedoclink(oUserDefinedText, oEntryInfo.changeInfo.parentKeyRef);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._backendDeleteRequestForUserDefinedText = function (oEntryInfo, oUserDefinedTextKey, oAdditional) {
		var oBackendRequest = this._getComponent().getODataManager().requestForDeleteUserDefinedText(oUserDefinedTextKey);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._prepareEntryForUserDefinedText = function (aUserDefinedTexts, oUserDefinedText, oAdditional) {
		// Calculate sort order.

		var aSorts = this._extractSort(aUserDefinedTexts, "ORD");
		oUserDefinedText.ORD = this._calcSortNext(aSorts);
	};

	PLMModelManager.prototype._getFieldNamesForUserDefinedText = function (oAdditional) {
		// FIXME: for CharEditUserDefinedText: only TEXT and LANGU are visible.
		var oFieldNamesInfo = oAdditional.fieldNamesInfo;

		if (!oFieldNamesInfo) {
			oFieldNamesInfo = oAdditional.fieldNamesInfo = {
				fieldNames: ["ORD", "TEXTCAT", "TEXT", "LANGU"],
				entryError: true
			};
		}

		return oFieldNamesInfo;
	};

	PLMModelManager.prototype._getErrorLabelForUserDefinedText = function (oUserDefinedTextKey, oAdditional) {
		var oInstanceKey = this.getParentInstanceKeyByUserDefinedTextKey(oUserDefinedTextKey);
		var oInstanceAdditional = oAdditional.parent; // Instance

		var sLabel = this._getErrorLabelByInstanceKey("PLMModelManager.errorLabel.userDefinedText", oInstanceKey, oInstanceAdditional);
		return sLabel;
	};

	PLMModelManager.prototype._forceReloadForUserDefinedText = function (oInstanceKey, oAdditional) {
		// If the instance table contains at least one FTEXT column, then
		// instance table will be reloaded as well, if there is a change in
		// user defined text.

		var oInstanceAdditional = oAdditional.parent; // Instance
		var bHaveUserDefinedText = oInstanceAdditional.UserDefinedText_HaveUserDefinedText;

		if (bHaveUserDefinedText == null) {
			bHaveUserDefinedText = false;

			var oCharHeaderInfo = oInstanceAdditional.charHeaderInfo;
			assert(oCharHeaderInfo, "oCharHeaderInfo should be set");

			var aCharHeaders = oCharHeaderInfo.byOrder;

			for (var i = 0; i < aCharHeaders.length; i++) {
				var oCharHeader = aCharHeaders[i];

				if (oCharHeader instanceof CharHeaderUserDefinedText) { // FIXME: better check
					bHaveUserDefinedText = true;
					break;
				}
			}

			oInstanceAdditional.UserDefinedText_HaveUserDefinedText = bHaveUserDefinedText;
		}

		// Construct reload info object.

		var aReloadInfos = [];

		if (bHaveUserDefinedText) {
			var oPropertyKey = this.getParentPropertyKeyByInstanceKey(oInstanceKey);
			var oReloadInfo = {
				nodeName: "Instance",
				parentKey: oPropertyKey
			};

			aReloadInfos.push(oReloadInfo);
		}

		return aReloadInfos;
	};

	PLMModelManager.prototype._backendFetchRequestForDocLink = function (oInstanceKey, oAdditional) {
		var oBackendRequest = this._getComponent().getODataManager().requestForFetchDocLink(oInstanceKey);

		var oBackendRequestObj = {
			request: oBackendRequest,
			response: null
		};

		return oBackendRequestObj;
	};

	PLMModelManager.prototype._backendFetchEmptyRequestForDocLink = function (oInstanceKey, oAdditional) {
		var oBackendResponse = {
			entries: []
		};

		var oBackendRequestObj = {
			request: null,
			response: oBackendResponse
		};

		return oBackendRequestObj;
	};

	PLMModelManager.prototype._backendCreateRequestForDocLink = function (oEntryInfo, oCreateInfo, oDocLink, oAdditional) {
		var oBackendRequest = this._getComponent().getODataManager().requestForCreateDocLink(oCreateInfo, oDocLink);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._backendDeleteRequestForDocLink = function (oEntryInfo, oDocLinkKey, oAdditional) {
		var oBackendRequest = this._getComponent().getODataManager().requestForDeleteDocLink(oDocLinkKey);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._prepareEntryForDocLink = function (aDocLinks, oDocLink, oAdditional) {
		// Calculate sort order.

		var aSorts = this._extractSort(aDocLinks, "ORD");
		oDocLink.ORD = this._calcSortNext(aSorts);
	};

	PLMModelManager.prototype._getFieldNamesForDocLink = function (oAdditional) {
		var oFieldNamesInfo = oAdditional.fieldNamesInfo;

		if (!oFieldNamesInfo) {
			oFieldNamesInfo = oAdditional.fieldNamesInfo = {
				fieldNames: [],
				entryError: true
			};
		}

		return oFieldNamesInfo;
	};

	PLMModelManager.prototype._getErrorLabelForDocLink = function (oDocLinkKey, oAdditional) {
		var oInstanceKey = this.getParentInstanceKeyByDocLinkKey(oDocLinkKey);
		var oInstanceAdditional = oAdditional.parent; // Instance

		var sLabel = this._getErrorLabelByInstanceKey("PLMModelManager.errorLabel.docLink", oInstanceKey, oInstanceAdditional);
		return sLabel;
	};

	PLMModelManager.prototype._forceReloadForDocLink = function (oInstanceKey, oAdditional) {
		// If the instance table contains at least one DOCLINK column, then
		// instance table will be reloaded as well, if there is a change in
		// doclink.

		var oInstanceAdditional = oAdditional.parent; // Instance
		var bHaveDocLink = oInstanceAdditional.DocLink_HaveDocLink;

		if (bHaveDocLink == null) {
			bHaveDocLink = false;

			var oCharHeaderInfo = oInstanceAdditional.charHeaderInfo;
			assert(oCharHeaderInfo, "oCharHeaderInfo should be set");

			var aCharHeaders = oCharHeaderInfo.byOrder;

			for (var i = 0; i < aCharHeaders.length; i++) {
				var oCharHeader = aCharHeaders[i];

				if (oCharHeader instanceof CharHeaderDocLink) { // FIXME: better check
					bHaveDocLink = true;
					break;
				}
			}

			oInstanceAdditional.DocLink_HaveDocLink = bHaveDocLink;
		}

		// Construct reload info object.

		var aReloadInfos = [];

		if (bHaveDocLink) {
			var oPropertyKey = this.getParentPropertyKeyByInstanceKey(oInstanceKey);
			var oReloadInfo = {
				nodeName: "Instance",
				parentKey: oPropertyKey
			};

			aReloadInfos.push(oReloadInfo);
		}

		return aReloadInfos;
	};

	PLMModelManager.prototype._backendFetchRequestForUsage = function (oInstanceKey, oAdditional) {
		var oBackendRequest = this._getComponent().getODataManager().requestForFetchUsage(oInstanceKey);

		var oBackendRequestObj = {
			request: oBackendRequest,
			response: null
		};

		return oBackendRequestObj;
	};

	PLMModelManager.prototype._backendFetchEmptyRequestForUsage = function (oInstanceKey, oAdditional) {
		var oBackendResponse = {
			entries: []
		};

		var oBackendRequestObj = {
			request: null,
			response: oBackendResponse
		};

		return oBackendRequestObj;
	};

	PLMModelManager.prototype._backendCreateRequestForUsage = function (oEntryInfo, oCreateInfo, oUsage, oAdditional) {
		var oBackendRequest = this._getComponent().getODataManager().requestForCreateUsage(oCreateInfo, oUsage);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._backendUpdateRequestForUsage = function (oEntryInfo, oUsage, oAdditional) {
		var oBackendRequest = this._getComponent().getODataManager().requestForUpdateUsage(oUsage);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._backendDeleteRequestForUsage = function (oEntryInfo, oUsageKey, oAdditional) {
		var oBackendRequest = this._getComponent().getODataManager().requestForDeleteUsage(oUsageKey);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._prepareEntryForUsage = function (aUsages, oUsage, oAdditional) {
		// Set flags to their default state.
		// FIXME: would make sense to do the same for all nodes&fields.

		oUsage.EXCLFLG = false;
		oUsage.ACTVFLG = false;
		oUsage.ESNTFLG = false;
	};

	PLMModelManager.prototype._getFieldNamesForUsage = function (oAdditional) {
		var oFieldNamesInfo = oAdditional.fieldNamesInfo;

		if (!oFieldNamesInfo) {
			oFieldNamesInfo = oAdditional.fieldNamesInfo = {
				fieldNames: ["VACLID", "RVLID", "EXCLFLG", "ACTVFLG", "ESNTFLG"],
				entryError: true
			};
		}

		return oFieldNamesInfo;
	};

	PLMModelManager.prototype._getErrorLabelForUsage = function (oUsageKey, oAdditional) {
		var oInstanceKey = this.getParentInstanceKeyByUsageKey(oUsageKey);
		var oInstanceAdditional = oAdditional.parent; // Instance

		var sLabel = this._getErrorLabelByInstanceKey("PLMModelManager.errorLabel.usage", oInstanceKey, oInstanceAdditional);
		return sLabel;
	};

	PLMModelManager.prototype._forceReloadForUsage = function (oInstanceKey, oAdditional) {
		// If the instance table contains USAGE column, then the instance
		// table will be reloaded as well, if there is a change in
		// usage.

		var oInstanceAdditional = oAdditional.parent; // Instance
		var bHaveUsage = oInstanceAdditional.Usage_HaveUsage;

		if (bHaveUsage == null) {
			bHaveUsage = false;

			var oCharHeaderInfo = oInstanceAdditional.charHeaderInfo;
			assert(oCharHeaderInfo, "oCharHeaderInfo should be set");

			var oUsageCharHeader = oCharHeaderInfo.byFieldName["__USAGE"];
			if (oUsageCharHeader &&
				oUsageCharHeader instanceof CharHeaderChar) // FIXME: better check
				bHaveUsage = true;

			oInstanceAdditional.Usage_HaveUsage = bHaveUsage;
		}

		// Construct reload info object.

		var aReloadInfos = [];

		if (bHaveUsage) {
			var oPropertyKey = this.getParentPropertyKeyByInstanceKey(oInstanceKey);
			var oReloadInfo = {
				nodeName: "Instance",
				parentKey: oPropertyKey
			};

			aReloadInfos.push(oReloadInfo);
		}

		return aReloadInfos;
	};

	PLMModelManager.prototype._backendFetchRequestForStatus = function (oSpecificationKey, oAdditional) {
		var oBackendRequest = this._getComponent().getODataManager().requestForFetchStatus(oSpecificationKey);

		var oBackendRequestObj = {
			request: oBackendRequest,
			response: null
		};

		return oBackendRequestObj;
	};

	PLMModelManager.prototype._backendCreateRequestForStatus = function (oEntryInfo, oCreateInfo, oStatus, oAdditional) {
		var oBackendRequest = this._getComponent().getODataManager().requestForCreateStatus(oCreateInfo, oStatus);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._backendUpdateRequestForStatus = function (oEntryInfo, oStatus, oAdditional) {
		var oBackendRequest = this._getComponent().getODataManager().requestForUpdateStatus(oStatus);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._backendDeleteRequestForStatus = function (oEntryInfo, oStatusKey, oAdditional) {
		var oBackendRequest = this._getComponent().getODataManager().requestForDeleteStatus(oStatusKey);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._getFieldNamesForStatus = function (oAdditional) {
		var oFieldNamesInfo = oAdditional.fieldNamesInfo;

		if (!oFieldNamesInfo) {
			oFieldNamesInfo = oAdditional.fieldNamesInfo = {
				fieldNames: ["VACLID", "RVLTYPE", "RVLID", "SUBSTAT_ON_SCREEN", "VALFR", "VALTO", "AENNR", "OTYPE", "REALO"],
				entryError: true
			};

			// EXT_HOOK: _extHookGetFieldNamesForStatus
			// Customize field names.

			if (this._extHookGetFieldNamesForStatus)
				this._extHookGetFieldNamesForStatus(oFieldNamesInfo, oAdditional);
		}

		return oFieldNamesInfo;
	};

	PLMModelManager.prototype._getErrorLabelForStatus = function (oStatusKey, oAdditional) {
		var sLabel = this._getComponent().getI18nBundle().getText("PLMModelManager.errorLabel.status");
		return sLabel;
	};

	PLMModelManager.prototype._backendFetchRequestForMaterial = function (oSpecificationKey, oAdditional) {
		var oBackendRequest = this._getComponent().getODataManager().requestForFetchMaterial(oSpecificationKey);

		var oBackendRequestObj = {
			request: oBackendRequest,
			response: null
		};

		return oBackendRequestObj;
	};

	PLMModelManager.prototype._backendCreateRequestForMaterial = function (oEntryInfo, oCreateInfo, oMaterial, oAdditional) {
		var oBackendRequest = this._getComponent().getODataManager().requestForCreateMaterial(oCreateInfo, oMaterial);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._backendUpdateRequestForMaterial = function (oEntryInfo, oMaterial, oAdditional) {
		var oBackendRequest = this._getComponent().getODataManager().requestForUpdateMaterial(oMaterial);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._backendDeleteRequestForMaterial = function (oEntryInfo, oMaterialKey, oAdditional) {
		var oBackendRequest = this._getComponent().getODataManager().requestForDeleteMaterial(oMaterialKey);
		oBackendRequest.entryInfo = oEntryInfo;
		return oBackendRequest;
	};

	PLMModelManager.prototype._getFieldNamesForMaterial = function (oAdditional) {
		var oFieldNamesInfo = oAdditional.fieldNamesInfo;

		if (!oFieldNamesInfo) {
			oFieldNamesInfo = oAdditional.fieldNamesInfo = {
				fieldNames: ["MATNR", "WERKS"],
				entryError: true
			};

			// EXT_HOOK: _extHookGetFieldNamesForMaterial
			// Customize field names.

			if (this._extHookGetFieldNamesForMaterial)
				this._extHookGetFieldNamesForMaterial(oFieldNamesInfo, oAdditional);
		}

		return oFieldNamesInfo;
	};

	PLMModelManager.prototype._getErrorLabelForMaterial = function (oMaterialKey, oAdditional) {
		var sLabel = this._getComponent().getI18nBundle().getText("PLMModelManager.errorLabel.material");
		return sLabel;
	};

	PLMModelManager.prototype._backendExecuteFetchRequests = function (aBackendRequests, fBackendCallback) {
		this._getComponent().getODataManager().executeRequests(aBackendRequests, fBackendCallback);
	};

	PLMModelManager.prototype._backendExecuteChangeRequests = function (aBackendRequests, fBackendCallback) {
		// Put all requests into a single change request. Commit will
		// happen only, if all requests can be executed successfully.

		var _fBackendCallback = function (oBackendExecuteData) {
			if (!oBackendExecuteData.error) {
				// Unwrap responses.

				var aBackendExecuteResponses = oBackendExecuteData.responses;
				assert(aBackendExecuteResponses.length == 1, "aBackendExecuteResponses.length should be 1");

				var oBackendExecuteResponse = aBackendExecuteResponses[0];
				var aBackendExecuteMergeResponses = oBackendExecuteResponse.error ? oBackendExecuteResponse.error.responses :
					oBackendExecuteResponse.response.responses;
				assert(aBackendExecuteMergeResponses, "aBackendExecuteMergeResponses should be set");

				for (var i = 0; i < aBackendExecuteMergeResponses.length; i++) {
					var oBackendExecuteMergeResponse = aBackendExecuteMergeResponses[i];
					oBackendExecuteMergeResponse.entryInfo = oBackendExecuteMergeResponse.subRequest ? oBackendExecuteMergeResponse.subRequest.entryInfo :
						null;
				}

				oBackendExecuteData.responses = aBackendExecuteMergeResponses;
			}

			if (fBackendCallback)
				fBackendCallback(oBackendExecuteData);
		};

		// Wrap requests into a single changeset.

		var oBackendRequest = this._getComponent().getODataManager().requestForMergeRequests(aBackendRequests);
		this._getComponent().getODataManager().executeRequests([oBackendRequest], _fBackendCallback);
	};

	PLMModelManager.prototype._executeFetchRequestsBegin = function () {
		this._aPropTreeAdditionals = [];
	};

	PLMModelManager.prototype._executeFetchRequestsEnd = function () {
		for (var i = 0; i < this._aPropTreeAdditionals.length; i++) {
			var oPropertyAdditional = this._aPropTreeAdditionals[i];
			var aPropTrees = oPropertyAdditional.propTrees;
			var oMaintainedModel = oPropertyAdditional.maintainedModel;
			var oMaintainedData = oMaintainedModel.getData();

			this._calcPropTreeMaintained(aPropTrees, oMaintainedData);
			oMaintainedModel.setData(oMaintainedData);
		}
	};

	PLMModelManager.prototype._getAutoGrowEnabled = function (oNodeMetadata) {
		var bAutoGrowEnabled = false;

		// EXT_HOOK: _extHookGetAutoGrowEnabled
		// Get auto grow enabled flag (master switch), since it can cause problems with some UI5 versions.

		if (this._extHookGetAutoGrowEnabled)
			bAutoGrowEnabled = this._extHookGetAutoGrowEnabled() && oNodeMetadata.autoGrow;

		return bAutoGrowEnabled;
	};

	PLMModelManager.prototype._extractSort = function (aEntries, sFieldName) {
		// Extract sort field.

		var aSorts = [];

		for (var i = 0; i < aEntries.length; i++) {
			var oEntry = aEntries[i];
			var sSort = oEntry[sFieldName];

			aSorts.push(sSort);
		}

		return aSorts;
	};

	PLMModelManager.prototype._calcSortNext = function (aSorts) {
		// Calculate next value for sort field.

		var iSortNext = 0;

		for (var i = 0; i < aSorts.length; i++) {
			var sSort = aSorts[i];
			var iSort = parseInt(sSort);

			if (!isNaN(iSort) && iSort > iSortNext)
				iSortNext = iSort;
		}

		// Clamp iSortNext to 9999.

		iSortNext = Math.min(iSortNext + 1, 9999);

		// Format.

		var sSortNext = Util.formatSort(iSortNext);
		return sSortNext;
	};

	PLMModelManager.prototype._processPropTreeNode = function (oBaseNode, oProcessInfo) {
		var aChildNodes = oBaseNode.childNodes;
		var oMaintainedData = oProcessInfo.maintainedData;

		if (aChildNodes) {
			// For root and internal nodes: generate unique MaintainedKey
			// for every node.

			var sMaintainedKey = PROPTREENODE.Internal + oProcessInfo.maintainedKey.toString();
			oMaintainedData[sMaintainedKey] = false;
			oBaseNode.maintainedKey = sMaintainedKey;
			oProcessInfo.maintainedKey++;

			for (var i = 0; i < aChildNodes.length; i++) {
				var oChildNode = aChildNodes[i];
				this._processPropTreeNode(oChildNode, oProcessInfo);
			}
		} else {
			// For leaf node: generate unique MaintainedKey for each
			// unique ESTCAT.

			var oNodesByESTCAT = oProcessInfo.nodesByESTCAT;
			var aNodes = oProcessInfo.nodes;
			var sESTCAT = oBaseNode.ESTCAT;
			var oNode = oNodesByESTCAT[sESTCAT];

			if (!oNode) {
				oNodesByESTCAT[sESTCAT] = oBaseNode;
				aNodes.push(oBaseNode);

				var sMaintainedKey = PROPTREENODE.Leaf + sESTCAT;
				oMaintainedData[sMaintainedKey] = oBaseNode.MAINTAINED;
				oBaseNode.maintainedKey = sMaintainedKey;
			} else {
				// Patch MENID and ID fields, since only the first ESTCAT
				// will be put into aNodes.

				oBaseNode.MENID = oNode.MENID;
				oBaseNode.ID = oNode.ID;

				oBaseNode.maintainedKey = oNode.maintainedKey;
			}
		}
	};

	PLMModelManager.prototype._calcPropTreeMaintained = function (aPropTrees, oMaintainedData) {
		// Calculate maintained flag for root and internal nodes.

		for (var i = 0; i < aPropTrees.length; i++) {
			var oPropTree = aPropTrees[i];
			var oRootNode = oPropTree.rootNode;

			if (oRootNode)
				this._calcPropTreeNodeMaintained(oRootNode, oMaintainedData, true);
		}
	};

	PLMModelManager.prototype._calcPropTreeNodeMaintained = function (oBaseNode, oMaintainedData, bRoot) {
		var aChildNodes = oBaseNode.childNodes;
		assert(aChildNodes, "aChildNodes should be set");

		var bHaveMaintainedChild = false;

		for (var i = 0; i < aChildNodes.length; i++) {
			var oChildNode = aChildNodes[i];
			var aChildNodeChildNodes = oChildNode.childNodes;

			if (aChildNodeChildNodes) {
				// For root and internal nodes: recurse.

				if (this._calcPropTreeNodeMaintained(oChildNode, oMaintainedData, false))
					bHaveMaintainedChild = true;
			} else {
				// For leaf node: query maintained flag.

				var sMaintainedKey = oChildNode.maintainedKey;
				assert(oMaintainedData[sMaintainedKey] != null, "Maintained flag should exist");

				if (oMaintainedData[sMaintainedKey])
					bHaveMaintainedChild = true;
			}
		}

		var sMaintainedKey = oBaseNode.maintainedKey;
		assert(oMaintainedData[sMaintainedKey] != null, "Maintained flag should exist");

		oMaintainedData[sMaintainedKey] = (bHaveMaintainedChild && !bRoot);

		return bHaveMaintainedChild;
	};

	PLMModelManager.prototype._createFetchCompositionBackendRequestObj = function (oInstanceKey, oAdditional, bFetch) {
		var that = this;

		// Fetch either composition or composition empty, if needed.

		var oBackendRequest = null;

		if (bFetch) {
			// EXT_HOOK: _extHookCreateFetchCompositionBackendRequestObjGetExtParam
			// Get ExtParam for OData query.

			var oExtParam = this._extHookCreateFetchCompositionBackendRequestObjGetExtParam ?
				this._extHookCreateFetchCompositionBackendRequestObjGetExtParam(oAdditional, true) :
				null;

			oBackendRequest = this._getComponent().getODataManager().requestForFetchComposition(oInstanceKey, oExtParam);
		} else {
			// EXT_HOOK: _extHookCreateFetchCompositionBackendRequestObjEmptyRequest
			// Get custom OData request.

			var oPropertyKey = this.getParentPropertyKeyByInstanceKey(oInstanceKey);

			oBackendRequest = this._extHookCreateFetchCompositionBackendRequestObjEmptyRequest ?
				this._extHookCreateFetchCompositionBackendRequestObjEmptyRequest(oPropertyKey, oAdditional) :
				null;
		}

		var fGetCompositionEmptys = function () {
			var aCompositionEmptys = [];

			// EXT_HOOK: _extHookCreateFetchCompositionBackendRequestObjPostProcess
			// Do custom postprocess.

			if (that._extHookCreateFetchCompositionBackendRequestObjPostProcess)
				that._extHookCreateFetchCompositionBackendRequestObjPostProcess(aCompositionEmptys);

			return aCompositionEmptys;
		};

		var oBackendResponse = null;

		if (oBackendRequest) {
			oBackendRequest.postProcess = function (oResponse) {
				// Store entries.

				var oCompositionResponse = oResponse;

				// EXT_HOOK: _extHookCreateFetchCompositionBackendRequestObjProcessResponse
				// Do custom response processing.

				if (that._extHookCreateFetchCompositionBackendRequestObjProcessResponse)
					that._extHookCreateFetchCompositionBackendRequestObjProcessResponse(oCompositionResponse, oAdditional, bFetch);

				var aEntries = null;

				if (bFetch)
					aEntries = oCompositionResponse.entries;
				else
					aEntries = fGetCompositionEmptys();

				assert(aEntries, "aEntries should be set");

				// EXT_HOOK: _extHookCreateFetchCompositionBackendRequestObjPostProcess
				// Do custom postprocess.

				if (that._extHookCreateFetchCompositionBackendRequestObjPostProcess)
					that._extHookCreateFetchCompositionBackendRequestObjPostProcess(aEntries);

				var oNewResponse = {
					entries: aEntries
				};

				return oNewResponse;
			};
		} else {
			assert(!bFetch, "bFetch should be cleared");

			oBackendResponse = {
				entries: fGetCompositionEmptys()
			};
		}

		var oBackendRequestObj = {
			request: oBackendRequest,
			response: oBackendResponse
		};

		return oBackendRequestObj;
	};
	PLMModelManager.prototype._createFetchMultiCompositionBackendRequestObj = function (oInstanceKey, oAdditional, bFetch) {
		var that = this;

		// Fetch either composition or composition empty, if needed.

		var oBackendRequest = null;

		if (bFetch) {
			// EXT_HOOK: _extHookCreateFetchCompositionBackendRequestObjGetExtParam
			// Get ExtParam for OData query.

			var oExtParam = this._extHookCreateFetchCompositionBackendRequestObjGetExtParam ?
				this._extHookCreateFetchCompositionBackendRequestObjGetExtParam(oAdditional, true) :
				null;

			oBackendRequest = this._getComponent().getODataManager().requestForFetchMultiComposition(oInstanceKey, oExtParam);
		} else {
			// EXT_HOOK: _extHookCreateFetchCompositionBackendRequestObjEmptyRequest
			// Get custom OData request.

			var oPropertyKey = this.getParentPropertyKeyByInstanceKey(oInstanceKey);

			oBackendRequest = this._extHookCreateFetchCompositionBackendRequestObjEmptyRequest ?
				this._extHookCreateFetchCompositionBackendRequestObjEmptyRequest(oPropertyKey, oAdditional) :
				null;
		}

		var fGetCompositionEmptys = function () {
			var aCompositionEmptys = [];

			// EXT_HOOK: _extHookCreateFetchCompositionBackendRequestObjPostProcess
			// Do custom postprocess.

			if (that._extHookCreateFetchCompositionBackendRequestObjPostProcess)
				that._extHookCreateFetchCompositionBackendRequestObjPostProcess(aCompositionEmptys);

			return aCompositionEmptys;
		};

		var oBackendResponse = null;

		if (oBackendRequest) {
			oBackendRequest.postProcess = function (oResponse) {
				// Store entries.

				var oCompositionResponse = oResponse;

				// EXT_HOOK: _extHookCreateFetchCompositionBackendRequestObjProcessResponse
				// Do custom response processing.

				if (that._extHookCreateFetchCompositionBackendRequestObjProcessResponse)
					that._extHookCreateFetchCompositionBackendRequestObjProcessResponse(oCompositionResponse, oAdditional, bFetch);

				var aEntries = null;

				if (bFetch)
					aEntries = oCompositionResponse.entries;
				else
					aEntries = fGetCompositionEmptys();

				assert(aEntries, "aEntries should be set");

				// EXT_HOOK: _extHookCreateFetchCompositionBackendRequestObjPostProcess
				// Do custom postprocess.

				if (that._extHookCreateFetchCompositionBackendRequestObjPostProcess)
					that._extHookCreateFetchCompositionBackendRequestObjPostProcess(aEntries);

				var oNewResponse = {
					entries: aEntries
				};

				return oNewResponse;
			};
		} else {
			assert(!bFetch, "bFetch should be cleared");

			oBackendResponse = {
				entries: fGetCompositionEmptys()
			};
		}

		var oBackendRequestObj = {
			request: oBackendRequest,
			response: oBackendResponse
		};

		return oBackendRequestObj;
	};
	PLMModelManager.prototype._createFetchQualBackendRequestObj = function (oInstanceKey, oAdditional, bFetch) {
		var that = this;

		var oInstanceAdditional = oAdditional.parent; // Instance
		var oPropertyKey = this.getParentPropertyKeyByInstanceKey(oInstanceKey); // chng 1
		// var oPropertyKey;
		// oPropertyKey = {
		// RECNROOT: oInstanceKey.RECNROOT,
		// ACTN: oInstanceKey.ACTN,
		// ESTCAT: oInstanceKey.ESTCAT,
		// MENID: "",
		// ID: ""
		// };
		var aBackendRequests = [];

		// Fetch group info, if needed.

		var oGroupInfo = oInstanceAdditional.Qual_GroupInfo;
		if (!oGroupInfo) {
			var oGroupBackendRequest = this._getComponent().getODataManager().requestForFetchGroup(oPropertyKey);
			aBackendRequests.push(oGroupBackendRequest);
		}

		// Fetch either qual or qual empty, if needed.

		if (bFetch) {
			// EXT_HOOK: _extHookCreateFetchQualBackendRequestObjGetExtParam
			// Get ExtParam for OData query.

			var oExtParam = this._extHookCreateFetchQualBackendRequestObjGetExtParam ?
				this._extHookCreateFetchQualBackendRequestObjGetExtParam(oAdditional, true) :
				null;

			var oQualBackendRequest = this._getComponent().getODataManager().requestForFetchQual(oInstanceKey, oExtParam);
			aBackendRequests.push(oQualBackendRequest);

			// 2217
			var compheaderBackendRequest = this._getComponent().getODataManager().requestForCompHeader(oPropertyKey);
			aBackendRequests.push(compheaderBackendRequest);

			// var vatlistBackendRequest = this._getComponent().getODataManager().requestForVatlist(oPropertyKey);
			// aBackendRequests.push(vatlistBackendRequest);
			//2217
			var requestForFetchdynQual = this._getComponent().getODataManager().requestForFetchdynQual(oInstanceKey, oExtParam);
			aBackendRequests.push(requestForFetchdynQual);
		} else {
			var oQualEmptyInfo = oInstanceAdditional.Qual_EmptyInfo;

			if (!oQualEmptyInfo) {
				// EXT_HOOK: _extHookCreateFetchQualBackendRequestObjGetExtParam
				// Get ExtParam for OData query.

				var oExtParam = this._extHookCreateFetchQualBackendRequestObjGetExtParam ?
					this._extHookCreateFetchQualBackendRequestObjGetExtParam(oAdditional, false) :
					null;

				var oQualEmptyBackendRequest = this._getComponent().getODataManager().requestForFetchQualEmpty(oPropertyKey, oExtParam);
				aBackendRequests.push(oQualEmptyBackendRequest);

				// 2217
				compheaderBackendRequest = this._getComponent().getODataManager().requestForCompHeader(oPropertyKey);
				aBackendRequests.push(compheaderBackendRequest);

				//2217
				var requestForFetchdynQual = this._getComponent().getODataManager().requestForFetchdynQual(oPropertyKey, oExtParam);
				aBackendRequests.push(requestForFetchdynQual);

			} else {
				// If empty info is present, then group info should be present.

				assert(oGroupInfo, "oGroupInfo should be set");
				assert(aBackendRequests.length == 0, "aBackendRequests.length should be 0");
			}
		}

		var fGetQualEmptys = function () {
			var oQualEmptyInfo = oInstanceAdditional.Qual_EmptyInfo;
			assert(oQualEmptyInfo, "oQualEmptyInfo should be set");

			var aQualEmptys = that._prepareQuaEmptys(oQualEmptyInfo);
			return aQualEmptys;
		};

		var oBackendRequest = null;
		var oBackendResponse = null;

		if (aBackendRequests.length > 0) {
			oBackendRequest = this._getComponent().getODataManager().requestForMergeRequests(aBackendRequests);

			oBackendRequest.postProcess = function (oResponse) {
				var iResponseIndex = 0;
				var aResponses = oResponse.responses;

				// Store into additional.

				if (!oGroupInfo) {
					oGroupInfo = aResponses[iResponseIndex++].response;

					var oInstanceGroupInfo = oInstanceAdditional.Qual_GroupInfo;
					if (oInstanceGroupInfo) {
						// Throw away fetched data, if it is already present in instance.

						oGroupInfo = oInstanceGroupInfo;
					} else {
						that._processGroupInfo(oGroupInfo);
						oInstanceAdditional.Qual_GroupInfo = oGroupInfo;
					}
				}

				// Store entries.

				var oQualResponse = aResponses[iResponseIndex++].response;
				//2217
				var oQualResponse1 = aResponses[iResponseIndex++].response;
				oInstanceAdditional.CompHeader = oQualResponse1;
				// dynamic comp
				var oQualResponse2 = aResponses[iResponseIndex++].response;
				// oInstanceAdditional.dyncomp = oQualResponse2;
				// dynamic comp
				// var oQualResponse2 = aResponses[iResponseIndex++].response;
				// oInstanceAdditional.VatList = oQualResponse2;
				//2217
				// EXT_HOOK: _extHookCreateFetchQualBackendRequestObjProcessResponse
				// Do custom response processing.

				if (that._extHookCreateFetchQualBackendRequestObjProcessResponse)
					that._extHookCreateFetchQualBackendRequestObjProcessResponse(oQualResponse, oAdditional, bFetch);

				var aQuals = oQualResponse2.entries;
				var aEntries = null;

				if (bFetch) {
					that._processQua(aQuals, oGroupInfo);

					aEntries = aQuals;
					// aEntries = aQuals.concat(oQualResponse1);

				} else {
					// Throw away fetched data, if it is already present in instance.

					if (!oInstanceAdditional.Qual_EmptyInfo) {
						that._processQua(aQuals, oGroupInfo);

						var oQualEmptyInfo = that._buildQuaEmptyInfo(aQuals);
						oInstanceAdditional.Qual_EmptyInfo = oQualEmptyInfo;
					}

					aEntries = fGetQualEmptys();
				}

				assert(aEntries, "aEntries should be set");

				var oNewResponse = {
					entries: aEntries,
					headers: oQualResponse1
				};

				return oNewResponse;
			};
		} else {
			assert(!bFetch, "bFetch should be cleared");

			oBackendResponse = {
				entries: fGetQualEmptys()
			};
		}

		var oBackendRequestObj = {
			request: oBackendRequest,
			response: oBackendResponse
		};

		return oBackendRequestObj;
	};

	PLMModelManager.prototype._createFetchQuantBackendRequestObj = function (oInstanceKey, oAdditional, bFetch) {
		var that = this;

		var oInstanceAdditional = oAdditional.parent; // Instance
		var oPropertyKey = this.getParentPropertyKeyByInstanceKey(oInstanceKey);
		var aBackendRequests = [];

		// Fetch group info, if needed.

		var oGroupInfo = oInstanceAdditional.Quant_GroupInfo;
		if (!oGroupInfo) {
			var oGroupBackendRequest = this._getComponent().getODataManager().requestForFetchGroup(oPropertyKey);
			aBackendRequests.push(oGroupBackendRequest);
		}

		// Fetch either quant or quant empty, if needed.

		if (bFetch) {
			// EXT_HOOK: _extHookCreateFetchQuantBackendRequestObjGetExtParam
			// Get ExtParam for OData query.

			var oExtParam = this._extHookCreateFetchQuantBackendRequestObjGetExtParam ?
				this._extHookCreateFetchQuantBackendRequestObjGetExtParam(oAdditional, true) :
				null;

			var oQuantBackendRequest = this._getComponent().getODataManager().requestForFetchQuant(oInstanceKey, oExtParam);
			aBackendRequests.push(oQuantBackendRequest);

			//dyn quant

			var compheaderBackendRequest1 = this._getComponent().getODataManager().requestForCompHeader(oPropertyKey);
			aBackendRequests.push(compheaderBackendRequest1);

			var oQuantBackendRequest1 = this._getComponent().getODataManager().requestForFetchdynQuant(oInstanceKey, oExtParam);
			aBackendRequests.push(oQuantBackendRequest1);
			// dyn quant
		} else {
			var oQuantEmptyInfo = oInstanceAdditional.Quant_EmptyInfo;

			if (!oQuantEmptyInfo) {
				// EXT_HOOK: _extHookCreateFetchQuantBackendRequestObjGetExtParam
				// Get ExtParam for OData query.

				var oExtParam = this._extHookCreateFetchQuantBackendRequestObjGetExtParam ?
					this._extHookCreateFetchQuantBackendRequestObjGetExtParam(oAdditional, false) :
					null;

				var oQuantEmptyBackendRequest = this._getComponent().getODataManager().requestForFetchQuantEmpty(oPropertyKey, oExtParam);
				aBackendRequests.push(oQuantEmptyBackendRequest);

				//dyn quant
				var compheaderBackendRequest2 = this._getComponent().getODataManager().requestForCompHeader(oPropertyKey);
				aBackendRequests.push(compheaderBackendRequest2);

				var oQuantBackendRequest3 = this._getComponent().getODataManager().requestForFetchdynQuant(oPropertyKey, oExtParam);
				aBackendRequests.push(oQuantBackendRequest3);
				// dyn quant
			} else {
				// If empty info is present, then group info should be present.

				assert(oGroupInfo, "oGroupInfo should be set");
				assert(aBackendRequests.length == 0, "aBackendRequests.length should be 0");
			}
		}

		var fGetQuantEmptys = function () {
			var oQuantEmptyInfo = oInstanceAdditional.Quant_EmptyInfo;
			assert(oQuantEmptyInfo, "oQuantEmptyInfo should be set");

			var aQuantEmptys = that._prepareQuaEmptys(oQuantEmptyInfo);
			return aQuantEmptys;
		};

		var oBackendRequest = null;
		var oBackendResponse = null;

		if (aBackendRequests.length > 0) {
			oBackendRequest = this._getComponent().getODataManager().requestForMergeRequests(aBackendRequests);

			oBackendRequest.postProcess = function (oResponse) {
				var iResponseIndex = 0;
				var aResponses = oResponse.responses;

				// Store into additional.

				if (!oGroupInfo) {
					oGroupInfo = aResponses[iResponseIndex++].response;

					var oInstanceGroupInfo = oInstanceAdditional.Quant_GroupInfo;
					if (oInstanceGroupInfo) {
						// Throw away fetched data, if it is already present in instance.

						oGroupInfo = oInstanceGroupInfo;
					} else {
						that._processGroupInfo(oGroupInfo);
						oInstanceAdditional.Quant_GroupInfo = oGroupInfo;
					}
				}

				// Store entries.

				var oQuantResponse = aResponses[iResponseIndex++].response;

				//dyn quant
				var oQuantResponse3 = aResponses[iResponseIndex++].response;
				oInstanceAdditional.CompHeaderqnt = oQuantResponse3;

				var oQuantResponse4 = aResponses[iResponseIndex++].response;
				// oInstanceAdditional.dynqnt = oQualResponse4;
				// dyn quant

				// EXT_HOOK: _extHookCreateFetchQuantBackendRequestObjProcessResponse
				// Do custom response processing.

				if (that._extHookCreateFetchQuantBackendRequestObjProcessResponse)
					that._extHookCreateFetchQuantBackendRequestObjProcessResponse(oQuantResponse, oAdditional, bFetch);

				var aQuants = oQuantResponse4.entries;
				var aEntries = null;

				if (bFetch) {
					that._processQua(aQuants, oGroupInfo);

					aEntries = aQuants;
				} else {
					// Throw away fetched data, if it is already present in instance.

					if (!oInstanceAdditional.Quant_EmptyInfo) {
						that._processQua(aQuants, oGroupInfo);

						var oQuantEmptyInfo = that._buildQuaEmptyInfo(aQuants);
						oInstanceAdditional.Quant_EmptyInfo = oQuantEmptyInfo;
					}

					aEntries = fGetQuantEmptys();
				}

				assert(aEntries, "aEntries should be set");

				var oNewResponse = {
					entries: aEntries
				};

				return oNewResponse;
			};
		} else {
			assert(!bFetch, "bFetch should be cleared");

			oBackendResponse = {
				entries: fGetQuantEmptys()
			};
		}

		var oBackendRequestObj = {
			request: oBackendRequest,
			response: oBackendResponse
		};

		return oBackendRequestObj;
	};

	PLMModelManager.prototype._createFetchListBackendRequestObj = function (oInstanceKey, oAdditional, bFetch) {
		var that = this;

		// Fetch either list or list empty, if needed.

		var oBackendRequest = null;

		if (bFetch) {
			// EXT_HOOK: _extHookCreateFetchListBackendRequestObjGetExtParam
			// Get ExtParam for OData query.

			var oExtParam = this._extHookCreateFetchListBackendRequestObjGetExtParam ?
				this._extHookCreateFetchListBackendRequestObjGetExtParam(oAdditional, true) :
				null;

			oBackendRequest = this._getComponent().getODataManager().requestForFetchList(oInstanceKey, oExtParam);
		} else {
			// EXT_HOOK: _extHookCreateFetchListBackendRequestObjEmptyRequest
			// Get custom OData request.

			var oPropertyKey = this.getParentPropertyKeyByInstanceKey(oInstanceKey);

			oBackendRequest = this._extHookCreateFetchListBackendRequestObjEmptyRequest ?
				this._extHookCreateFetchListBackendRequestObjEmptyRequest(oPropertyKey, oAdditional) :
				null;
		}

		var fGetListEmptys = function () {
			var aListEmptys = [];

			// EXT_HOOK: _extHookCreateFetchListBackendRequestObjPostProcess
			// Do custom postprocess.

			if (that._extHookCreateFetchListBackendRequestObjPostProcess)
				that._extHookCreateFetchListBackendRequestObjPostProcess(aListEmptys);

			return aListEmptys;
		};

		var oBackendResponse = null;

		if (oBackendRequest) {
			oBackendRequest.postProcess = function (oResponse) {
				// Store entries.

				var oListResponse = oResponse;

				// EXT_HOOK: _extHookCreateFetchListBackendRequestObjProcessResponse
				// Do custom response processing.

				if (that._extHookCreateFetchListBackendRequestObjProcessResponse)
					that._extHookCreateFetchListBackendRequestObjProcessResponse(oListResponse, oAdditional, bFetch);

				var aEntries = null;

				if (bFetch)
					aEntries = oListResponse.entries;
				else
					aEntries = fGetListEmptys();

				assert(aEntries, "aEntries should be set");

				// EXT_HOOK: _extHookCreateFetchListBackendRequestObjPostProcess
				// Do custom postprocess.

				if (that._extHookCreateFetchListBackendRequestObjPostProcess)
					that._extHookCreateFetchListBackendRequestObjPostProcess(aEntries);

				var oNewResponse = {
					entries: aEntries
				};

				return oNewResponse;
			};
		} else {
			assert(!bFetch, "bFetch should be cleared");

			oBackendResponse = {
				entries: fGetListEmptys()
			};
		}

		var oBackendRequestObj = {
			request: oBackendRequest,
			response: oBackendResponse
		};

		return oBackendRequestObj;
	};

	PLMModelManager.prototype._processGroupInfo = function (oGroupInfo) {
		var aGroups = oGroupInfo.groups;

		// Create pseudo groups.

		var oI18nBundle = this._getComponent().getI18nBundle();

		var oGroupAll = {
			GRP_SUBID: GROUP.All,
			GRP_IDENT: oI18nBundle.getText("PLMModelManager.group.all")
		};
		aGroups.push(oGroupAll);

		var oGroupMaintained = {
			GRP_SUBID: GROUP.Maintained,
			GRP_IDENT: oI18nBundle.getText("PLMModelManager.group.maintained")
		};
		aGroups.push(oGroupMaintained);

		var oGroupNotMaintained = {
			GRP_SUBID: GROUP.NotMaintained,
			GRP_IDENT: oI18nBundle.getText("PLMModelManager.group.notMaintained")
		};
		aGroups.push(oGroupNotMaintained);
	};

	PLMModelManager.prototype._processQua = function (aQuas, oGroupInfo) {
		var iSortAll = 1;
		var iSortMaintained = 1;
		var iSortNotMaintained = 1;

		for (var i = 0; i < aQuas.length; i++) {
			var oQua = aQuas[i];

			// Special handling:
			// - Copy to avoid modification: pseudo group membership is not static
			//   like normal group membership.
			// - Non-existing SUBID will be visible only in pseudo groups.

			var oSortsByGRP_SUBID = oGroupInfo.sortsBySUBIDAndGRP_SUBID[oQua.SUBID];
			var oSortsByGRP_SUBIDCopy = oSortsByGRP_SUBID ? Util.copy(oSortsByGRP_SUBID) : {};

			oSortsByGRP_SUBIDCopy[GROUP.All] = Util.formatSort(iSortAll++);

			if (oQua.MAINTAINED)
				oSortsByGRP_SUBIDCopy[GROUP.Maintained] = Util.formatSort(iSortMaintained++);
			else
				oSortsByGRP_SUBIDCopy[GROUP.NotMaintained] = Util.formatSort(iSortNotMaintained++);

			oQua.sortsByGRP_SUBID = oSortsByGRP_SUBIDCopy;
		}
	};

	PLMModelManager.prototype._buildQuaEmptyInfo = function (aQuas) {
		var oQuaEmptyInfo = { // TODO_FUTURE: Switch it to simple array, since this object is not neccessary now.
			byList: aQuas
		};

		return oQuaEmptyInfo;
	};

	PLMModelManager.prototype._prepareQuaEmptys = function (oQuaEmptyInfo) {
		// Copy oQuaEmptyInfo.byList to avoid modification in additional object, since
		// each instance should get its own copy.

		var aQuaEmptys = Util.copy(oQuaEmptyInfo.byList);

		for (var i = 0; i < aQuaEmptys.length; i++) {
			var oQuaEmpty = aQuaEmptys[i];
			oQuaEmpty[ModelManagerConst.Empty] = true;
		}

		return aQuaEmptys;
	};

	PLMModelManager.prototype._createFetchUserDefinedTextBackendRequestObj = function (oInstanceKey, oAdditional, bFetch) {
		var oSpecificationAdditional = oAdditional.parent.parent.parent; // Specification
		var aBackendRequests = [];

		// Fetch SUBCAT, if needed.

		var sSUBCAT = oSpecificationAdditional.UserDefinedText_SUBCAT;
		if (sSUBCAT == null) {
			// FIXME: better mechanism for SUBCAT query?
			var oPropertyKey = this.getParentPropertyKeyByInstanceKey(oInstanceKey);
			var oSpecificationKey = this.getParentSpecificationKeyByPropertyKey(oPropertyKey);

			var oBasicDataBackendRequest = this._getComponent().getODataManager().requestForFetchBasicData(oSpecificationKey);
			aBackendRequests.push(oBasicDataBackendRequest);
		}

		// Fetch user defined texts, if needed.

		if (bFetch) {
			var oUserDefinedTextBackendRequest = this._getComponent().getODataManager().requestForFetchUserDefinedText(oInstanceKey);
			aBackendRequests.push(oUserDefinedTextBackendRequest);
		}

		var fGetUserDefinedTextEmptys = function () {
			var aUserDefinedTextEmptys = [];
			return aUserDefinedTextEmptys;
		};

		var oBackendRequest = null;
		var oBackendResponse = null;

		if (aBackendRequests.length > 0) {
			oBackendRequest = this._getComponent().getODataManager().requestForMergeRequests(aBackendRequests);

			oBackendRequest.postProcess = function (oResponse) {
				var iResponseIndex = 0;
				var aResponses = oResponse.responses;

				// Store into additional.

				if (sSUBCAT == null) {
					var oBasicData = aResponses[iResponseIndex++].response;
					sSUBCAT = oBasicData.SUBCAT;

					// Throw away fetched data, if it is already present in instance.

					if (oSpecificationAdditional.UserDefinedText_SUBCAT == null)
						oSpecificationAdditional.UserDefinedText_SUBCAT = sSUBCAT;
				}

				// Store entries.

				var aUserDefinedTexts = bFetch ? aResponses[iResponseIndex++].response.entries : fGetUserDefinedTextEmptys();

				var oNewResponse = {
					entries: aUserDefinedTexts
				};

				return oNewResponse;
			};
		} else {
			assert(!bFetch, "bFetch should be cleared");

			oBackendResponse = {
				entries: fGetUserDefinedTextEmptys()
			};
		}

		var oBackendRequestObj = {
			request: oBackendRequest,
			response: oBackendResponse
		};

		return oBackendRequestObj;
	};
	// text changes
	PLMModelManager.prototype._createFetchTextBackendRequestObj = function (oInstanceKey, oAdditional, bFetch) {
		var oSpecificationAdditional = oAdditional.parent.parent.parent; // Specification
		var aBackendRequests = [];

		// Fetch SUBCAT, if needed.

		// var sSUBCAT = oSpecificationAdditional.UserDefinedText_SUBCAT;
		// if (sSUBCAT == null) {
		// 	// FIXME: better mechanism for SUBCAT query?
		// 	var oPropertyKey = this.getParentPropertyKeyByInstanceKey(oInstanceKey);
		// 	var oSpecificationKey = this.getParentSpecificationKeyByPropertyKey(oPropertyKey);

		// 	var oBasicDataBackendRequest = this._getComponent().getODataManager().requestForFetchBasicData(oSpecificationKey);
		// 	aBackendRequests.push(oBasicDataBackendRequest);
		// }

		// Fetch user defined texts, if needed.

		// if (bFetch) {
		var oTextBackendRequest = this._getComponent().getODataManager().requestForFetchText(oInstanceKey);
		aBackendRequests.push(oTextBackendRequest);
		// }

		var fGetUserDefinedTextEmptys = function () {
			var aUserDefinedTextEmptys = [];
			return aUserDefinedTextEmptys;
		};

		var oBackendRequest = null;
		var oBackendResponse = null;

		if (aBackendRequests.length > 0) {
			oBackendRequest = this._getComponent().getODataManager().requestForMergeRequests(aBackendRequests);

			oBackendRequest.postProcess = function (oResponse) {
				var iResponseIndex = 0;
				var aResponses = oResponse.responses;

				// Store into additional.

				// if (sSUBCAT == null) {
				// 	var oBasicData = aResponses[iResponseIndex++].response;
				// 	sSUBCAT = oBasicData.SUBCAT;

				// 	// Throw away fetched data, if it is already present in instance.

				// 	if (oSpecificationAdditional.UserDefinedText_SUBCAT == null)
				// 		oSpecificationAdditional.UserDefinedText_SUBCAT = sSUBCAT;
				// }

				// Store entries.

				var aUserDefinedTexts = bFetch ? aResponses[iResponseIndex++].response.entries : fGetUserDefinedTextEmptys();

				var oNewResponse = {
					entries: aUserDefinedTexts
				};

				return oNewResponse;
			};
		} else {
			assert(!bFetch, "bFetch should be cleared");

			oBackendResponse = {
				entries: fGetUserDefinedTextEmptys()
			};
		}

		var oBackendRequestObj = {
			request: oBackendRequest,
			response: oBackendResponse
		};

		return oBackendRequestObj;
	};

	// text changes
	PLMModelManager.prototype._getErrorLabelByInstanceKey = function (sLabelKey, oInstanceKey, oInstanceAdditional, sAdditionalLabel) {
		// Read ESTCAT from property key (because an instance can be NEW, and in
		// this case ESTCAT is not yet part of instance key).

		var oPropertyKey = this.getParentPropertyKeyByInstanceKey(oInstanceKey);
		var sESTCAT = oPropertyKey.ESTCAT;

		// Lookup property tree node.

		var oPropertyAdditional = oInstanceAdditional.parent; // Property
		var oNodesByESTCAT = oPropertyAdditional.nodesByESTCAT;
		var oNode = oNodesByESTCAT[sESTCAT];
		assert(oNode, "oNode should be set");

		// Construct error label.

		var sLabel = this._getComponent().getI18nBundle().getText(sLabelKey, [oNode.TEXT, sAdditionalLabel]);
		return sLabel;
	};

	return PLMModelManager;
});