/*
 * ODataManager provides a generic OData framework.
 * FIXME: transform oRequest into a class (to avoid direct manipulation like .transformError, .data, .entryInfo)
 */

sap.ui.define([
	"sap/base/assert",
	"sap/ui/model/odata/ODataModel",
	"gramont/VCDSM/specedit/util/ODataManagerException",
	"gramont/VCDSM/specedit/util/Util"
], function(assert, ODataModel, ODataManagerException, Util) {
	"use strict";

	var CODE_ERROR      = "/GMT/VC/ERROR";
	var REF_RECORD      = "RECORD";
	var OPINDEX_UNKNOWN = "";

	var ODataManager = function(oComponent) {
		this._oComponent = oComponent;
		this._oModel = null;
	};

	ODataManager.prototype.init = function(sMessageKey, fSuccess, fError) {
		this._checkInit(true);

		this._oComponent.getNavigator().requireBusyDialog();

		// Use async metadata loading during ODataModel instantiation.

		var sServiceURL = this._getServiceURL();
		this._oModel = new ODataModel(sServiceURL, true, null, null, null, null, null, true);

		var that = this;

		var _fSuccess = function() {
			// Call success callback first: if the success callback wants
			// to start another OData operation, then the busy indicator will remain
			// on the screen, without any flashing. The same pattern must be used in
			// all success callbacks.

			if (fSuccess)
				fSuccess();
			that._oComponent.getNavigator().releaseBusyDialog();
		};

		var _fError = function(oODataError) {
			that._oComponent.getNavigator().releaseBusyDialog();
			var oError = that._parseODataError(sMessageKey, oODataError);

			var fClose = function() {
				if (fError)
					fError(oError);
			};

			that._showError(oError, fClose);
		};

		this._oModel.attachMetadataLoaded(_fSuccess);
		this._oModel.attachMetadataFailed(_fError);
	};

	ODataManager.prototype.isInited = function() {
		var bInited = this._oModel && this._oModel.getServiceMetadata();
		return bInited;
	};
	
	ODataManager.prototype.getSecurityToken = function() {
		this._checkInit();
		
		var sSecurityToken = this._oModel.getSecurityToken();
		return sSecurityToken;
	};

	ODataManager.prototype.requestForMergeRequests = function(aSubRequests) {
		// This is a special request: used for merge several requests into a
		// single (change) request:
		// - Either all subrequests will be successful, or if there is at least
		//   one failed subrequest, then the whole merged request will fail.
		// - In case of error, then response will contain only failed subrequests,
		//   and not the full list.

		this._checkInit();

		assert(aSubRequests.length > 0, "aSubRequests.length should be > 0");

		var sMessageKey = "ODataManager.error.mergeRequestError";
		var that = this;

		// In case of change request, ask backend to postpone error reporting
		// to changeset end.

		var bChange = aSubRequests[0].change ? true : false; // FIXME: bool testing
		var oPostponeErrorSubRequest = null;

		if (bChange) {
			oPostponeErrorSubRequest = this._requestForDoPostponeError();
			var aPostponeErrorSubRequests = [oPostponeErrorSubRequest];

			aSubRequests = [].concat(aPostponeErrorSubRequests, aSubRequests);
		}

		// Put every batchrequest inside every subrequest into a single list.

		var aBatchRequests = [];
		var aOpIndexToSubRequest = [];

		for (var i = 0; i < aSubRequests.length; i++) {
			var oSubRequest = aSubRequests[i];
			var bSubRequestChange = oSubRequest.change ? true : false; // FIXME: bool testing
			var aSubBatchRequests = oSubRequest.batchRequests;

			assert(bChange == bSubRequestChange, "Requests in aSubRequests should be either change or non-change requests, but not both");

			assert(!oSubRequest.transformError, "oSubRequest.transformError should be cleared");
			assert(aSubBatchRequests.length > 0, "aSubBatchRequests.length should be > 0");

			aBatchRequests = aBatchRequests.concat(aSubBatchRequests);

			for (var j = 0; j < aSubBatchRequests.length; j++)
				aOpIndexToSubRequest.push(oSubRequest);
		}

		assert(aBatchRequests.length == aOpIndexToSubRequest.length, "length mismatch");

		// Group batch responses by individual subrequest.

		var fProcess = function(aBatchResponses) {
			var aExecuteSubResponsesSuccess = [];
			var aExecuteSubResponsesError = [];
			var aDetails = [];
			var iBatchResponseIndex = 0;

			for (var i = 0; i < aSubRequests.length; i++) {
				var oSubRequest = aSubRequests[i];
				var aSubBatchRequests = oSubRequest.batchRequests;
				var iSubBatchRequestsLength = aSubBatchRequests.length;
				var iNextBatchResponseIndex = iBatchResponseIndex + iSubBatchRequestsLength;

				var aSubBatchResponses = aBatchResponses.slice(iBatchResponseIndex, iNextBatchResponseIndex);
				iBatchResponseIndex = iNextBatchResponseIndex;

				// Create empty subresponse object.

				var oExecuteSubResponse = {
						error: null,
						response: null,
						subRequest: oSubRequest
				};

				// Process response.
					// for (var k = 0; k < aSubBatchRequests.length; k++) {
				var bSubRequestSupplied = (oSubRequest != oPostponeErrorSubRequest);

				try {
					// process: method comes from request.

					var fProcess = oSubRequest.process;
					var vSubResponse = fProcess ? fProcess(aSubBatchResponses) : null;

					// postProcess: method comes from "outside".

					var fPostProcess = oSubRequest.postProcess;
					oExecuteSubResponse.response = fPostProcess ? fPostProcess(vSubResponse) : vSubResponse;

					// Ignore response given to _requestForDoPostponeError.

					if (bSubRequestSupplied)
						aExecuteSubResponsesSuccess.push(oExecuteSubResponse);
				} catch (e) {
					if (!(e instanceof ODataManagerException))
						throw e;

					var sDetail = that._oComponent.getI18nBundle().getText(e.detailKey, e.args);
					var oSubError = oExecuteSubResponse.error = that._createError(oSubRequest.messageKey, [sDetail], null, e.data);

					// ODataManagerException is not allowed for _requestForDoPostponeError.

					assert(bSubRequestSupplied, "ODataManagerException is not allowed for _requestForDoPostponeError");
					aExecuteSubResponsesError.push(oExecuteSubResponse);

					// Construct error summary (useful for showExecuteError).

					aDetails = that._buildDetails(aDetails, oSubError);
						}
					// }
			}

			// Construct response object.

			var bHaveError = (aExecuteSubResponsesError.length > 0);

			var oResponse = {
					responses: bHaveError ? aExecuteSubResponsesError : aExecuteSubResponsesSuccess
			};

			if (bHaveError) {
				// Patch details of the error object, so some parameters of ODataManagerException will
				// be ignored. FIXME: is this correct?

				oResponse.details = aDetails;
				throw new ODataManagerException(sMessageKey, null, oResponse);
			}

			return oResponse;
		};

		// Create error transformer:
		// - For non-change request: error details are available only for the first failed subrequest
		//   (see executeRequests).
		// - For change request: error details are available for multiple failed subrequests
		//   (see _requestForDoPostponeError).

		var fTransformError = function(oError) {
			var aExecuteSubResponses = [];
			var aDetails = [];

			var oErrorObjsByOpIndex = oError.errorObjsByOpIndex;
			assert(oErrorObjsByOpIndex, "oErrorObjsByOpIndex should be set");

			// There are OpIndexes, which are special:
			// - OPINDEX_UNKNOWN.
			// - "0" in case of change request (see _requestForDoPostponeError above).
			// Therefore aExecuteSubResponses can contain more elements than aSubRequests.

			// Sort OpIndexes in increasing order to have the same order as subrequests.

			var aOpIndexes = Object.keys(oErrorObjsByOpIndex);
			aOpIndexes.sort(jQuery.proxy(that._opIndexSorter, that));

			for (var i = 0; i < aOpIndexes.length; i++) {
				var sOpIndex = aOpIndexes[i];
				var bOpIndexKnown = (sOpIndex != OPINDEX_UNKNOWN);

				// Determine error object.

				var oErrorObj = oErrorObjsByOpIndex[sOpIndex];

				// Determine subrequest.

				var oSubRequest = null;

				if (bOpIndexKnown) {
					var iOpIndex = parseInt(sOpIndex);
					assert(!isNaN(iOpIndex), "iOpIndex should be an integer");

					oSubRequest = aOpIndexToSubRequest[iOpIndex];
				}

				// Create empty subresponse object.

				var oExecuteSubResponse = {
						error: null,
						response: null,
						subRequest: (oSubRequest != oPostponeErrorSubRequest) ? oSubRequest : null
				};

				var oSubError = oExecuteSubResponse.error = that._createError(oSubRequest ? oSubRequest.messageKey : sMessageKey, oErrorObj.details, oErrorObj.fieldErrorsByField);

				aExecuteSubResponses.push(oExecuteSubResponse);

				// Construct error summary (useful for showExecuteError).

				aDetails = that._buildDetails(aDetails, oSubError);
			}

			// Construct error object.

			var oResponse = {
					responses: aExecuteSubResponses
			};

			var oNewError = that._createError(sMessageKey, aDetails, null, oResponse);
			return oNewError;
		};

		// Create the merged request.

		var oRequest = {
				messageKey: sMessageKey,
				batchRequests: aBatchRequests,
				process: fProcess,
				transformError: fTransformError,
				change: bChange
		};

		return oRequest;
	};

	ODataManager.prototype.executeRequest = function(oRequest, fSuccess, fError) {
		// Execute a single request.

		this._checkInit();

		var that = this;

		var fCallback = function(oExecuteData) {
			if (oExecuteData.allSuccess) {
				// Successful execution.

				var aExecuteResponses = oExecuteData.responses;
				assert(aExecuteResponses.length == 1, "aExecuteResponses length should be 1");

				var oExecuteResponse = aExecuteResponses[0];
				var vResponse = oExecuteResponse.response;
				// Sometimes vResponse is null even for successful response, therefore we
				// can't put assert here (assert(vResponse != null, "vResponse should be set")).

				if (fSuccess)
					fSuccess(vResponse);
			} else {
				// Error during execution.

				var fClose = function() {
					if (fError)
						fError();
				};

				Util.showExecuteError(that._oComponent, null, oExecuteData, true, fClose);
			}
		};

		this.executeRequests([oRequest], fCallback);
	};

	ODataManager.prototype.executeRequests = function(aRequests, fCallback) {
		// Execute multiple requests.

		this._checkInit();

		assert(aRequests.length > 0, "aRequests should contain at least one element");

		var that = this;

		// Queue batch operations into model.

		var iTotalBatchRequestsLength = 0;

		this._oModel.clearBatch();

		for (var i = 0; i < aRequests.length; i++) {
			var oRequest = aRequests[i];
			var bChange = oRequest.change;
			var aBatchRequests = oRequest.batchRequests;
			var iBatchRequestsLength = aBatchRequests.length;

			assert(iBatchRequestsLength > 0, "iBatchRequestsLength should be > 0");
			iTotalBatchRequestsLength += bChange ? 1 : iBatchRequestsLength;

			if (bChange)
				this._oModel.addBatchChangeOperations(aBatchRequests);
			else
				this._oModel.addBatchReadOperations(aBatchRequests);
		}

		// Create empty result object and callback wrapper.

		var oExecuteData = {
				allSuccess: true,
				error: null,
				responses: []
		};

		var _fCallback = function() {
			var bAllSuccess = oExecuteData.allSuccess;
			var fReleaseBusyDialog = function() {
				that._oComponent.getNavigator().releaseBusyDialog();
			};

			// In case of error, hide busy indicator before callback.

			if (!bAllSuccess)
				setTimeout(fReleaseBusyDialog(),1000);  // timeout is set to resolve Rich text editor disappearing issue

			if (fCallback)
				fCallback(oExecuteData);

			// In case of success, hide busy indicator after callback. This
			// is needed to prevent flicker, if callback wants to do additional
			// data fetch.

			if (bAllSuccess)
				setTimeout(fReleaseBusyDialog(),1000);  // timeout is set to resolve Rich text editor disappearing issue
		};

		// Callbacks for processing success and error.

		var fSuccess = function(oData) {
			// Success doesn't mean that all batch operations are executed successfully,
			// it only means that the gateway has processed our request.
			// Data structure of oData:
			// - success: oData.__batchResponses[x] (.data/.__changeResponses[y]),
			// - error: oData.__batchResponses[x].response.

			// Check for response count.

			if (oData.__batchResponses.length != iTotalBatchRequestsLength) {
				oExecuteData.error = that._createError("ODataManager.error.gateway");
				oExecuteData.allSuccess = false;
				_fCallback();
				return;
			}

			// Group batch responses by individual request.

			var iBatchResponseIndex = 0;

			for (var i = 0; i < aRequests.length; i++) {
				var oRequest = aRequests[i];
				var bChange = oRequest.change;
				var aBatchRequests = oRequest.batchRequests;
				var iBatchRequestsLength = aBatchRequests.length;
				var iNextBatchResponseIndex = iBatchResponseIndex + (bChange ? 1 : iBatchRequestsLength);

				var aBatchResponses = oData.__batchResponses.slice(iBatchResponseIndex, iNextBatchResponseIndex);
				iBatchResponseIndex = iNextBatchResponseIndex;

				// Create empty response object.

				var oExecuteResponse = {
						error: null,
						response: null
				};

				// Check for errors. A single error within a request will
				// cancel further processing of that request. Other requests
				// will be still processed.
				// - For non-change request: stop at first error is implemented on client-side, and error
				//   is reported only for the first failing batch request.
				// - For change request: OData service stops processing of a changeset at first error.

				for (var j = 0; j < aBatchResponses.length; j++) {
					var oBatchResponse = aBatchResponses[j];

					if (oBatchResponse.response) {
						// OpIndex determination:
						// - For non-change request: backend doesn't supply it, instead we fake it (batchresponse index: j).
						// - For change request: backend supplies it.

						var fTransformError = oRequest.transformError;
						var oError = that._parseODataError(oRequest.messageKey, oBatchResponse,
								fTransformError ? iBatchRequestsLength : null,
								fTransformError && !bChange ? j : null);

						// Transform error object using request-specific transform function (if present). It
						// is possible only to modify request-specific error object, but not top-level errors.

						oExecuteResponse.error = fTransformError ? fTransformError(oError) : oError;
						oExecuteData.allSuccess = false;
						break;
					}
				}

				// If no errors, then continue processing.

				if (!oExecuteResponse.error) {
					// Check response count of change request.

					if (bChange &&
						aBatchResponses[0].__changeResponses.length != iBatchRequestsLength) {
						oExecuteData.error = that._createError("ODataManager.error.gateway");
						oExecuteData.responses = [];
						oExecuteData.allSuccess = false;
						_fCallback();
						return;
					}

					// Process response.

					try {
						var _aBatchResponses = bChange ? aBatchResponses[0].__changeResponses : aBatchResponses;

						// process: method comes from request.

						var fProcess = oRequest.process;
						var vResponse = fProcess ? fProcess(_aBatchResponses) : null;

						// postProcess: method comes from "outside".

						var fPostProcess = oRequest.postProcess;
						oExecuteResponse.response = fPostProcess ? fPostProcess(vResponse) : vResponse;
					} catch (e) {
						if (!(e instanceof ODataManagerException))
							throw e;

						var sDetail = that._oComponent.getI18nBundle().getText(e.detailKey, e.args);
						oExecuteResponse.error = that._createError(oRequest.messageKey, [sDetail], null, e.data);
						oExecuteData.allSuccess = false;
					}
				}

				oExecuteData.responses.push(oExecuteResponse);
			}

			_fCallback();
		};

		var fError = function(oODataError) {
			oExecuteData.error = that._parseODataError("ODataManager.error.gateway", oODataError);
			oExecuteData.allSuccess = false;
			_fCallback();
		};

		// Execute batch request.

		this._oComponent.getNavigator().requireBusyDialog();
		this._oModel.submitBatch(fSuccess, fError, true);
	};
	
	ODataManager.prototype.parseRawResponse = function(iStatus, sRawResponse, sMessageKey, fSuccess, fError) {
		var oBody = this._parseJSON(sRawResponse);
		var that = this;

		var fReportError = function() {
			var aDetails = [];
			
			if (oBody                                 && // FIXME: hasOwnProperty vs in vs simple test
				oBody.hasOwnProperty("error")         &&
				oBody.error.hasOwnProperty("message") &&
				oBody.error.message.hasOwnProperty("value")) {
				var sValue = oBody.error.message.value;
				aDetails.push(sValue);
			}
			
			var oError = that._createError(sMessageKey, aDetails);
			
			var fClose = function() {
				if (fError)
					fError();
			};
			
			that._showError(oError, fClose);
		};
		
		if (iStatus < 200 || iStatus > 299 || !oBody) {
			fReportError();
			return;
		}
		
		var oData = oBody.d;
		if (!oData) {
			fReportError();
			return;
		}
		
		if (fSuccess)
			fSuccess(oData);
	};

	ODataManager.prototype._requestForDoPostponeError = function() {
		assert(false, "_requestForDoPostponeError should be overridden in derived class");
	};

	ODataManager.prototype._getServiceURL = function() {
		assert(false, "_getServiceURL should be overridden in derived class");
	};

	ODataManager.prototype._createBatchOperation = function(sPath, sMethod, oData, oHeaders) {
		this._oModel.setHeaders(oHeaders);
		var oBatchRequest = this._oModel.createBatchOperation(sPath, sMethod, oData);
		this._oModel.setHeaders(null);

		return oBatchRequest;
	};

	ODataManager.prototype._filterProperties = function(oInput, aProperties) {
		var oOutput = {};

		for (var i = 0; i < aProperties.length; i++) {
			var sProperty = aProperties[i];
			var vValue = oInput[sProperty];

			if (vValue != null)
				oOutput[sProperty] = vValue;
		}

		return oOutput;
	};

	ODataManager.prototype._escapeParamsForKey = function(oParams) {
		var sParams = this._escapeParams(oParams, ",", true);
		return sParams;
	};

	ODataManager.prototype._escapeParamsForFI = function(oParams) {
		var sParams = this._escapeParams(oParams, "&", true);
		return sParams;
	};

	ODataManager.prototype._escapeParamsForGeneric = function(oParams) {
		var sParams = this._escapeParams(oParams, "&", false);
		return sParams;
	};

	ODataManager.prototype._escapeParams = function(oParams, sSep, bQuote) {
		var aEscapedParams = [];

		for (var sKey in oParams) {
			var vValue = oParams[sKey];
			var sValue;

			switch (jQuery.type(vValue)) {
			case "boolean":
				sValue = vValue.toString();
				break;

			case "string":
				sValue = bQuote ? "'" + encodeURIComponent(vValue.replace(/'/g, "''")) + "'" : encodeURIComponent(vValue);
				break;

			case "date":
				// If the date is not URIEncoded inside a batch request, then gateway throws
				// parsing error. However, if it is sent without batch, then non-encoded URL is
				// properly parsed.

				sValue = "datetime'" + encodeURIComponent(Util.convertDateToString(vValue, "-") +
														  "T" +
														  Util.convertTimeToString(vValue)) +
						 "'";
				break;

			default:
				assert(false, "vValue type is unknown");
			}

			sValue = encodeURIComponent(sKey) + "=" + sValue;
			aEscapedParams.push(sValue);
		}

		var sEscapedParams = aEscapedParams.join(sSep);
		return sEscapedParams;
	};
	
	ODataManager.prototype._parseJSON = function(sJSON) {
		var oJSON = null;
		
		try {
			oJSON = JSON.parse(sJSON);
		} catch (e) {
			if (!(e instanceof SyntaxError))
				throw e;
		}
		
		return oJSON;
	};

	ODataManager.prototype._createError = function(sMessageKey, aDetails, oFieldErrorsByField, oData) {
		assert(sMessageKey, "sMessageKey should be set");

		// Construct standard content of error object.

		var oError = {
				message: this._oComponent.getI18nBundle().getText(sMessageKey),
				details: aDetails ? aDetails : [],
				fieldErrorsByField: oFieldErrorsByField ? oFieldErrorsByField : {} // FieldName (can be empty string) -> [msg1, msg2, ...]
		};

		// Extend error object with custom data, if needed.

		if (oData)
			jQuery.extend(oError, oData);

		return oError;
	};

	ODataManager.prototype._showError = function(oError, fClose) {
		// Called during metadata fetch (see init) and parseRawResponse. In all
		// other cases, showExecuteError should be used for error reporting.

		var aDetails = oError.details;

		Util.showMessageBox(this._oComponent, {
			type: Util.MessageBoxType.Error,
			message: oError.message,
			details: ((aDetails.length > 0) ? aDetails.join("\n") : null)
		}, fClose);
	};

	ODataManager.prototype._parseODataError = function(sMessageKey, oODataError, iOpLen, iForceOpIndex) {
		// During parsing, two data structures can be built:
		// - iOpLen != null: oErrorObjsByOpIndex: errors keyed by OpIndex.
		// - iOpLen == null: aDetails, oFieldErrorsByField: errors without OpIndex.

		var bHaveOpLen = (iOpLen != null);
		var oErrorObjsByOpIndex = {};
		var aDetails = [];
		var oFieldErrorsByField = {};

		if (iForceOpIndex != null)
			assert(bHaveOpLen, "bHaveOpLen should be set");

		var fLookupErrorObj = function(sOpIndex) {
			assert(bHaveOpLen, "bHaveOpLen should be set");
			var _sOpIndex = OPINDEX_UNKNOWN;

			if (sOpIndex != null) {
				var iOpIndex = parseInt(sOpIndex);
				if (!isNaN(iOpIndex) && iOpIndex >= 0 && iOpIndex < iOpLen)
					_sOpIndex = iOpIndex.toString();
			}

			var oErrorObj = oErrorObjsByOpIndex[_sOpIndex];
			if (!oErrorObj) {
				oErrorObj = oErrorObjsByOpIndex[_sOpIndex] = {
						details: [],
						fieldErrorsByField: {}
				};
			}

			return oErrorObj;
		};

		var fAddDetail = function(sOpIndex, sDetail) {
			if (bHaveOpLen) {
				// Put error by OpIndex.

				var oErrorObj = fLookupErrorObj(sOpIndex);

				oErrorObj.details.push(sDetail);
			} else {
				// Put error into merged list.

				aDetails.push(sDetail);
			}
		};

		var fAddFieldError = function(sOpIndex, sFieldName, sFieldError) {
			if (bHaveOpLen) {
				// Put error by OpIndex.

				var oErrorObj = fLookupErrorObj(sOpIndex);

				var aErrorObjFieldErrors = oErrorObj.fieldErrorsByField[sFieldName];
				if (!aErrorObjFieldErrors)
					aErrorObjFieldErrors = oErrorObj.fieldErrorsByField[sFieldName] = [];

				aErrorObjFieldErrors.push(sFieldError);
			} else {
				// Put error into merged list.

				var aFieldErrors = oFieldErrorsByField[sFieldName];
				if (!aFieldErrors)
					aFieldErrors = oFieldErrorsByField[sFieldName] = [];

				aFieldErrors.push(sFieldError);
			}
		};

		// Parse OData error.

		if (!oODataError.getParameters) {
			// In case of failed metadata fetch, it seems that we receive a double-wrapped event
			// object in oODataError, which can be read: oODataError.getParameters().getParameter(...). The
			// "responseText" parameter seems to be HTML, but we can only display normal text in
			// the detail area, so in this case we don't provide detail message.

			if (oODataError.response.statusCode == 0) {
				// Provide a generic message, in case of no net connection.

				var sDetail = this._oComponent.getI18nBundle().getText("ODataManager.error.connection");
				fAddDetail(null, sDetail);
			} else {
				var oBody = this._parseJSON(oODataError.response.body);
				
				// Try to check if it is a properly formatted error payload.

				if (oBody                                 && // FIXME: hasOwnProperty vs in vs simple test
					oBody.hasOwnProperty("error")         &&
					oBody.error.hasOwnProperty("message") &&
					oBody.error.message.hasOwnProperty("value")) {
					// Check if we are dealing with:
					// - generic gateway error, or
					// - a more specific/detailed error message(s).

					var sValue = oBody.error.message.value;

					if (sValue.indexOf(CODE_ERROR) != 0) { // COMPAT: Müller systems append dot to value. // startsWith
						var sDetail = sValue;
						fAddDetail(null, sDetail);
					} else {
						var aErrorDetails = oBody.error.innererror.errordetails;

						for (var i = 0; i < aErrorDetails.length; i++) {
							var oErrorDetail = aErrorDetails[i];
							var sErrorDetailMessage = oErrorDetail.message;

							if (oErrorDetail.code == CODE_ERROR) {
								// Parse detailed error message.

								var aPropertyRef = oErrorDetail.propertyref.split("/");
								var iPropertyRefLen = aPropertyRef.length;
								var sOpIndex = (iForceOpIndex != null) ? iForceOpIndex.toString() : (iPropertyRefLen >= 2 ? aPropertyRef[0] : null);

								if (iPropertyRefLen == 3 &&
									aPropertyRef[1] == REF_RECORD) {
									// Field-specific error message.

									var sFieldName = aPropertyRef[2];
									fAddFieldError(sOpIndex, sFieldName, sErrorDetailMessage);
								} else {
									// General error message.

									fAddDetail(sOpIndex, sErrorDetailMessage);
								}
							}
						}
					}
				}
			}
		}

		// Create error object.

		var oData = null;

		if (bHaveOpLen) {
			oData = {
					errorObjsByOpIndex: oErrorObjsByOpIndex
			};
		}

		var oError = this._createError(sMessageKey, aDetails, oFieldErrorsByField, oData);
		return oError;
	};

	ODataManager.prototype._buildDetails = function(aDetails, oError) {
		aDetails = aDetails.slice(0);

		// Separate error responses with empty line.

		if (aDetails.length > 0)
			aDetails.push("");

		// Put details.

		var aErrorMessages = Util.getErrorMessages(oError.message, oError.details, oError.fieldErrorsByField);
		aDetails = aDetails.concat(aErrorMessages);

		return aDetails;
	};

	ODataManager.prototype._opIndexSorter = function(sOpIndex1, sOpIndex2) {
		var fParseInt = function(sOpIndex) {
			var iOpIndex = (sOpIndex == OPINDEX_UNKNOWN) ? -1 : parseInt(sOpIndex);
			assert(!isNaN(iOpIndex), "iOpIndex should be an integer");

			return iOpIndex;
		};

		var iOpIndex1 = fParseInt(sOpIndex1);
		var iOpIndex2 = fParseInt(sOpIndex2);

		var iResult = iOpIndex1 - iOpIndex2;
		return iResult;
	};

	ODataManager.prototype._checkInit = function(bReverse) {
		var bFlag = this.isInited();
		if (bReverse)
			bFlag = !bFlag;
		assert(bFlag, bReverse ? "ODataManager is already initialized" : "ODataManager is not yet initialized");
	};

	return ODataManager;
});
