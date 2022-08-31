//FIXMEVC:remove unneeded methods
sap.ui.define([
	"sap/base/assert",
	"sap/m/Column",
	"sap/m/ColumnListItem",
	"sap/m/Label",
	"sap/m/LabelDesign",
	"sap/m/MessageBox",
	"sap/m/Text",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/type/Date"
], function(assert, Column, ColumnListItem, Label, LabelDesign, MessageBox, Text, Filter, FilterOperator, type_Date) {
	"use strict";

	var Util = {
		// MessageBox types (these are also used as i18n keys):

		MessageBoxType: {
			Warning: "warning",
			Error:   "error",
			Confirm: "confirm"
		},

		createSearchFilter: function(sSearchQuery, aPropertyNames) {
			var oFilter = null;

			if (sSearchQuery != "") {
				var aPropertyNameFilters = [];

				for (var i = 0; i < aPropertyNames.length; i++) {
					// Creates a filter columns (if it contains sSearchQuery).

					aPropertyNameFilters.push(
						new Filter({
							path: aPropertyNames[i],
							operator: FilterOperator.Contains,
							value1: sSearchQuery
						})
					);
				}

				// Creates the aggregated filter from the column ones (or).

				oFilter = new Filter({
					filters: aPropertyNameFilters,
					and: false
				});
			}

			return oFilter;
		},

		copy: function(vSrc) {
			var bWrap = false;

			switch (jQuery.type(vSrc)) {
			case "array":
				bWrap = true;
				break;

			case "object":
				break;

			default:
				assert(false, "Only array and object types can be copied");
			}

			if (bWrap)
				vSrc = {wrap: vSrc};

			var vDst = jQuery.extend(true, {}, vSrc);

			if (bWrap)
				vDst = vDst.wrap;

			return vDst;
		},

		buildValueHelperHeaderAndTemplate: function(oValueHelper) {
			var aHeaders = oValueHelper.headerInfo.byOrder;
			var oHeaderShow = oValueHelper.headerShow;

			var aHeaderPropNames = [];
			var aHeaderColumns = [];
			var oTemplate = new ColumnListItem();

			for (var i = 0; i < aHeaders.length; i++) {
				var oHeader = aHeaders[i];

				// If header is hidden, don't show it.

				if (!oHeaderShow[oHeader.FIELDNAME])
					continue;

				aHeaderPropNames.push(oHeader.FIELDNAME);

				// Build table header (Column objects).

				var oHeaderColumnLabel = new Label({
					design: LabelDesign.Bold
				});
				oHeaderColumnLabel.setText(oHeader.SCRTEXT); // Use setText because we don't want the expansion of {...} binding symbols.

				var oHeaderColumn = new Column({
					header: oHeaderColumnLabel
				});

				aHeaderColumns.push(oHeaderColumn);

				// Build template.

				var oBindingType = null;

				switch (oHeader.DATATYPE) {
				case "DATS":
					oBindingType = new type_Date();
					break;
				}

				var oEntryColumnText = new Text({
					wrapping: false,
					text: {
						path: oHeader.FIELDNAME,
						type: oBindingType
					}
				});

				oTemplate.addCell(oEntryColumnText);
			}

			// Construct result object.

			var oBuildData = {
				headerPropNames: aHeaderPropNames,
				headerColumns: aHeaderColumns,
				template: oTemplate
			};

			return oBuildData;
		},

		parseDateFromString: function(sDate) {
			var oRegExp = /^(\d{4})(\d{2})(\d{2})$/;
			var oDate = null;

			var aResult = oRegExp.exec(sDate);
			if (aResult) {
				var iYear  = parseInt(aResult[1]);
				var iMonth = parseInt(aResult[2]) - 1;
				var iDay   = parseInt(aResult[3]);

				oDate = new Date(iYear, iMonth, iDay);
			}

			return oDate;
		},

		convertDateToString: function(oDate, sSep) {
			if (sSep == null)
				sSep = "";

			var sYear  = Util._padInteger(oDate.getFullYear(), 4);
			var sMonth = Util._padInteger(oDate.getMonth() + 1, 2);
			var sDay   = Util._padInteger(oDate.getDate(), 2);

			var sDate = sYear + sSep + sMonth + sSep + sDay;
			return sDate;
		},

		convertTimeToString: function(oTime) {
			var sHour   = Util._padInteger(oTime.getHours(), 2);
			var sMinute = Util._padInteger(oTime.getMinutes(), 2);
			var sSecond = Util._padInteger(oTime.getSeconds(), 2);

			var sTime = sHour + ":" + sMinute + ":" + sSecond;
			return sTime;
		},

		getSpecificationKeyDate: function() {
			var oKeyDate = new Date();
			return oKeyDate;
		},

		showMessageBox: function(oComponent, oParam, fClose) {
			// Process parameters.

			var sIcon = null;
			var aActions = [];

			switch (oParam.type) {
			case Util.MessageBoxType.Warning:
				sIcon = MessageBox.Icon.WARNING;
				aActions.push(MessageBox.Action.OK);
				break;

			case Util.MessageBoxType.Error:
				sIcon = MessageBox.Icon.ERROR;
				aActions.push(MessageBox.Action.OK);
				break;

			case Util.MessageBoxType.Confirm:
				sIcon = MessageBox.Icon.QUESTION;
				aActions.push(MessageBox.Action.YES);
				aActions.push(MessageBox.Action.NO);
				if (oParam.cancel)
					aActions.push(MessageBox.Action.CANCEL);
				break;

			default:
				assert(false, "type is unknown");
			}

			assert(sIcon != null, "sIcon should be set");

			var sTitle = oComponent.getI18nBundle().getText("Util.messageBox." + oParam.type);

			// Create close callback.

			var _fClose = function(sAction) {
				var bOK = null;
				
				switch (sAction) {
				case MessageBox.Action.OK:
				case MessageBox.Action.YES:
					bOK = true;
					break;
					
				case MessageBox.Action.NO:
					bOK = false;
					break;
					
				case MessageBox.Action.CANCEL:
					break;
				
				default:
					assert(false, "sAction is unknown");
				}
				
				if (fClose)
					fClose(bOK);
			};

			// Setup MessageBox parameters.

			var oMessageBoxParam = {
				icon: sIcon,
				title: sTitle,
				actions: aActions,
				onClose: _fClose,
				styleClass: oComponent.getNavigator().getContentDensityClass()
			};

			var sDetails = oParam.details;

			if (sDetails != null) {
				// Escape details string, since MessageBox expects HTML.

				sDetails = sDetails.replace(/&/g, "&amp;")
								   .replace(/</g, "&lt;")
								   .replace(/>/g, "&gt;")
								   .replace(/\n/g, "<br/>");
				oMessageBoxParam.details = sDetails;
			}

			// Show MessageBox.

			MessageBox.show(oParam.message, oMessageBoxParam);
		},

		showExecuteError: function(oComponent, sMessageKey, oExecuteData, bShowAsError, fClose) {
			assert(!oExecuteData.allSuccess, "allSuccess should be cleared");

			var sMessage = null;
			var aDetails = null;

			var oError = oExecuteData.error;
			if (oError) {
				// Check top-level error.

				sMessage = oError.message;
				aDetails = oError.details;
			} else {
				// Check for individual request errors.

				var aExecuteResponses = oExecuteData.responses;
				var iErrorCount = 0;

				for (var i = 0; i < aExecuteResponses.length; i++) {
					var oExecuteResponse = aExecuteResponses[i];
					oError = oExecuteResponse.error;

					if (oError)
						iErrorCount++;
				}

				assert(iErrorCount > 0, "iErrorCount should be > 0");

				if (sMessageKey == null)
					assert(iErrorCount == 1, "iErrorCount should be equal to 1");
				else
					sMessage = oComponent.getI18nBundle().getText(sMessageKey);

				aDetails = [];

				for (var i = 0; i < aExecuteResponses.length; i++) {
					var oExecuteResponse = aExecuteResponses[i];
					oError = oExecuteResponse.error;

					if (oError) {
						// Put message.

						var sErrorMessage = oError.message;

						if (sMessage == null) {
							sMessage = sErrorMessage;
						} else {
							// Separate error responses with empty line.

							if (aDetails.length > 0)
								aDetails.push("");

							aDetails.push(sErrorMessage);
						}

						var aErrorMessages = Util.getErrorMessages(null, oError.details, oError.fieldErrorsByField);
						aDetails = aDetails.concat(aErrorMessages);
					}
				}
			}

			assert(sMessage != null, "sMessage should be set");
			assert(aDetails, "aDetails should be set");

			// Display error.

			var _fClose = function() {
				if (fClose)
					fClose();
			};

			Util.showMessageBox(oComponent, {
				type: bShowAsError ? Util.MessageBoxType.Error : Util.MessageBoxType.Warning,
				message: sMessage,
				details: aDetails.join("\n")
			}, _fClose);
		},

		formatSort: function(iSort) {
			var sSort = Util._padInteger(iSort, 4);
			return sSort;
		},

		atHistoryTop: function() {
			// FIXME: this is not perfect, since it gives only history length and
			// not position.

			var bAtHistoryTop = (window.history.length == 1);
			return bAtHistoryTop;
		},

		getErrorMessages: function(sMessage, aDetails, oFieldErrorsByField) {
			var aErrorMessages = [];

			// Put message.

			if (sMessage != null)
				aErrorMessages.push(sMessage);

			// Put details.

			assert(aDetails, "aDetails should be set");

			for (var i = 0; i < aDetails.length; i++) {
				var sDetail = aDetails[i];
				aErrorMessages.push(sDetail);
			}

			// Put fieldErrorsByField.

			assert(oFieldErrorsByField, "oFieldErrorsByField should be set");

			for (var sFieldName in oFieldErrorsByField) {
				var aFieldErrors = oFieldErrorsByField[sFieldName];
				var sDetailPrefix = (sFieldName != "") ? (sFieldName + ": ") : "";

				for (var i = 0; i < aFieldErrors.length; i++) {
					var sFieldError = aFieldErrors[i];
					var sDetail = sDetailPrefix + sFieldError;
					aErrorMessages.push(sDetail);
				}
			}

			return aErrorMessages;
		},
				
		getModulePath: function(sModuleName) {
			var sModulePath = sModuleName.replace(/\./g, "/");
			return sModulePath;
		},
		
		checkFieldName: function(sFieldName) {
			assert(sFieldName.length > 0 && sFieldName.indexOf("/") == -1, "Invalid FieldName");
		},

		_padInteger: function(iNumber, iLength) {
			var sNumber = iNumber.toString();
			var iFill = iLength - sNumber.length;

			for (var i = 0; i < iFill; i++)
				sNumber = "0" + sNumber;

			return sNumber;
		}
	};

	return Util;
});
