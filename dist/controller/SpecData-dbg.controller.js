sap.ui.define([
	"sap/base/assert",
	"sap/ui/model/json/JSONModel",
	"sap/m/IconTabFilter",
	"sap/m/Text",
	"gramont/VCDSM/specedit/util/ControllerBase",
	"gramont/VCDSM/specedit/util/SpecDataError",
	"gramont/VCDSM/specedit/util/Util",
	"gramont/VCDSM/specedit/util/CompType",
	"gramont/VCDSM/specedit/util/PropMode",
	"gramont/VCDSM/specedit/util/Commit",
	"gramont/VCDSM/specedit/util/SpecDataTabProp",
	"gramont/VCDSM/specedit/util/SpecDataTabAttachment",
	"gramont/VCDSM/specedit/util/SpecDataTabMessage",
	"sap/ui/core/routing/History",
	"sap/m/Dialog",
	"sap/m/DialogType",
	"sap/m/Button",
	"sap/m/ButtonType",
	"gramont/VCDSM/specedit/util/AdhocReport"
], function (assert, JSONModel, IconTabFilter, Text, ControllerBase, SpecDataError, Util, CompType, PropMode, Commit, SpecDataTabProp,
	SpecDataTabAttachment, SpecDataTabMessage, History, Dialog, DialogType, Button, ButtonType, AdhocReport) {
	"use strict";

	var SpecData = ControllerBase.extend("gramont.VCDSM.specedit.controller.SpecData", {
		onInit: function () {
			// Attach save/reset callbacks.
			// TODO: move save messagetoast to _afterSave?
			this.getOwnerComponent().getNavigator().releaseBusyDialog();
			this.getOwnerComponent().getSaveHandler().attachBeforeSave(jQuery.proxy(this._beforeSave, this));
			this.getOwnerComponent().getSaveHandler().attachAfterSave(jQuery.proxy(this._afterSave, this));
			this.getOwnerComponent().getSaveHandler().attachAfterReset(jQuery.proxy(this._afterReset, this));

			// Construct page model.

			// var oModel = new JSONModel("./view/treetabledata.json");
			// this.byId("TreeTableBasic").setModel(oModel);
			// this._oPageModel = new JSONModel();   //test

			var oPage = this.byId("ictb"); //test
			// oPage.setModel(this._oPageModel, "pageModel");   //test

			// Setup error popover.

			this._oErrorPopover = new SpecDataError(this.getOwnerComponent(), this.getView());

			// Setup tabs.
			// FIXMEVC: use classnames -> simplify using for loop?

			this._aTabControllers = [];

			this._oTabControllerPropNonEditable = new SpecDataTabProp(this.getOwnerComponent(), false);
			this._setupTab(this._oTabControllerPropNonEditable);

			this._oTabControllerPropEditable = new SpecDataTabProp(this.getOwnerComponent(), true);
			this._setupTab(this._oTabControllerPropEditable);
		},

		// 2224
		onnavtab: function () {

			var objpgly = this.byId("ictb");
			this.fttlb = this.byId("tlb2");
			var key = objpgly.getSelectedKey();

			if (key == "maintain" || key == "attachments") {
				this._onEdit();
				this.fttlb.setVisible(true);
			} else {
				this.fttlb.setVisible(false);
				this._onCancel();

			}
		},
		_onBack: function () {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();
			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("Main");
			}
		},
		_onCommit: function () {
			var commit = new Commit(this.getOwnerComponent());
		},
		// 2224
		onBeforeShow: function (oViewParam) {
			// Read parameters.

			this._oSpecificationSUBIDKey = null;

			var sSUBID = oViewParam.SUBID;
			if (sSUBID != null) {
				this._oSpecificationSUBIDKey = {
					SUBID: sSUBID,
					KEYDATE: new Date()
				};
			}

			// Determine if we need to switch to edit mode after successful data fetch.

			this._bNeedEditMode = false;

			var oParams = oViewParam["?query"];
			if (oParams && oParams.mode == "edit")
				this._bNeedEditMode = true;

			// Disable all controls before showing the view.

			this._setEnablePage(false);

			// In case of deep-linking:
			// - No unsaved changes dialog (since url hash is already updated).
			// - Clear storage.

			this._clearStorage();

			// Initialize save indicators
			// (see https://experience.sap.com/fiori-design-web/manage-objects-with-the-global-flow).

			this._initSave();
			// Initialize every tab.

			for (var i = 0; i < this._aTabControllers.length; i++) {
				var oTabController = this._aTabControllers[i];
				oTabController.onBeforeShow();
			}
		},

		onAfterShowInited: function () {
			if (!this._oSpecificationSUBIDKey) {
				Util.showMessageBox(this.getOwnerComponent(), {
					type: Util.MessageBoxType.Error,
					message: this.getOwnerComponent().getI18nBundle().getText("SpecData.error.param"),
				}, jQuery.proxy(this._noParameter, this));

				return;
			}

			// Resolve SUBID to RECNROOT, ACTN.

			this._fetchSpecificationInfo();
		},
		//VC change
		_formatTitle: function (sSUBID, sIDTYPE_VALUE, sID_VALUE) {
			var oI18nBundle = this.getOwnerComponent().getI18nBundle();
			var sTitle;

			if (sIDTYPE_VALUE && sID_VALUE) // Test for null and empty value.
				sTitle = oI18nBundle.getText("SpecDetail.title.final", [sSUBID, sIDTYPE_VALUE, sID_VALUE]);
			else
				sTitle = oI18nBundle.getText("SpecDetail.title.initial", [sSUBID]);

			return sTitle;
		},
		// VC change
		getHandledRoutes: function () {
			var aHandledRoutes = ["SpecData", "SpecData_SUBID"];
			return aHandledRoutes;
		},
		_onAdhocReport: function () {
			// Ask user to save unsaved changes.

			var oI18nBundle = this.getOwnerComponent().getI18nBundle();
			this.getOwnerComponent().getSaveHandler().confirmAndSave(oI18nBundle.getText("SpecDetail.adhocReportConfirm"), false, jQuery.proxy(
				this._onAdhocReportContinue, this));
		},
		_onAdhocReportContinue: function (bContinue) {
			if (bContinue) {
				// Bring-up adhoc report dialog.

				if (!this._oAdhocReport)
					this._oAdhocReport = new AdhocReport(this.getOwnerComponent(), this.getView());

				this._oAdhocReport.open(this.oSpecificationkey);
			}
		},

		_setupTab: function (oTabController) {
			this._aTabControllers.push(oTabController);

			// It is easier if we bind visible in a central place, instead of repeating it in every view.

			var oControl = oTabController.getControl();
			oControl.bindProperty("visible", {
				path: "pageModel>/enablePage"
			});
			// if(oTabController == "_filter0")
			// {
			// oControl.bindProperty("key","prereq");
			// oControl.bindProperty("icon","prereq");
			// oControl.bindProperty("icon","prereq");
			// }

			// var oPage = this.byId("page");

			// oPage.addSection(oControl);

			this.otab = this.byId("ictb");
			this.otab.addItem(oControl);
		},

		_noParameter: function () {
			// FIXMEVC: navigate back?
		},

		_fetchSpecificationInfo: function () {
			assert(this._oSpecificationSUBIDKey, "oSpecificationSUBIDKey should be set");

			var oRequest = this.getOwnerComponent().getODataManager().requestForFetchSpecificationInfo(this._oSpecificationSUBIDKey);
			this.getOwnerComponent().getODataManager().executeRequest(oRequest,
				jQuery.proxy(this._fetchSpecificationInfoSuccess, this),
				jQuery.proxy(this._fetchSpecificationInfoError, this));
		},

		_fetchSpecificationInfoSuccess: function (oData) {
			var oSpecificationKey = {
				RECNROOT: oData.RECNROOT,
				ACTN: oData.ACTN
			};
			this.oSpecificationkey = oSpecificationKey;
			this.getOwnerComponent().getSaveHandler().setSpecificationKey(oSpecificationKey);

			var oRequest = this.getOwnerComponent().getODataManager().requestForFetchLogo(oSpecificationKey);
			this.getOwnerComponent().getODataManager().executeRequest(oRequest,
				jQuery.proxy(this._logosuccess, this), jQuery.proxy(this._logoerror, this));

		},

		_logosuccess: function (oLogo) {

			var logod = oLogo.entries;
			if(logod[0].DOKAR){
				var oLogoKey1 = {
				DOKAR: logod[0].DOKAR,
				DOKNR: logod[0].DOKNR,
				DOKVR: logod[0].DOKVR,
				DOKTL: logod[0].DOKTL
			};
			var sURL1 = this.getOwnerComponent().getODataManager().getDocDownloadURL(oLogoKey1);

			this.byId("imglog").setSrc(sURL1);
			}
			
			this._initialFetch(this.oSpecificationkey);
			// FIXMEVC: what to do in case of error? navigate back?
		},
		_logoerror: function (oLogo) {

			this._initialFetch(this.oSpecificationkey);
			// FIXMEVC: what to do in case of error? navigate back?
		},

		_fetchSpecificationInfoError: function () {
			// FIXMEVC: what to do in case of error? navigate back?
		},

		_initialFetch: function (oSpecificationKey) {
			// FIXMEVC: It would be nice, if we can collect requests from tab controllers, instead of hardcoding them.

			var oPropTreeRequest = this.getOwnerComponent().getModelManager().requestForFetchPropertyBySpecificationKey(oSpecificationKey);
			// FIXMEVC: also request list of properties to be displayed/edited.
			var activityparam = jQuery.sap.getUriParameters().get("ACTIVITY");
			if (activityparam)
				oSpecificationKey.actvtparam = activityparam;
			else
				oSpecificationKey.actvtparam = "";
			//specnum
			var aRequests = [];
			var oHeaderInfoRequest = this.getOwnerComponent().getModelManager().requestForFetchHeaderInfoBySpecificationKey(oSpecificationKey);

			aRequests.push(oHeaderInfoRequest);
			aRequests.push(oPropTreeRequest);

			//specnum
			// Execute data fetches.

			this.getOwnerComponent().getModelManager().executeFetchRequests(aRequests, jQuery.proxy(this._initialFetchCallback, this));
		},

		_initialFetchCallback: function (oExecuteData, bckenddat) {
			if (oExecuteData.allSuccess) {

				//specnum
				var specval = oExecuteData.responses[0].response._oModel.oData[0].ID_VALUE;
				var specid = this._oSpecificationSUBIDKey.SUBID;
				// this.byId("txthd").setText(specval);
				var spectxt = this.getOwnerComponent().getI18nBundle().getText("specnum");
				this.byId("txthd1").setText(specval + "\n" + spectxt + specid);
				// this.byId("txthd2").setText("Specification ID: "+specid);
				//specnum
				var hdinfo = oExecuteData.responses[0].response;
				var oPropTreeCollection = oExecuteData.responses[1].response;
				var oPropTreeAdditional = oPropTreeCollection.getAdditional();

				if (bckenddat.responses[2] != null) {
					var tst = bckenddat.responses[2].response[0].__metadata.type;
					var propinf_resp = bckenddat.responses[2].response;
					this.secondrun = false;
				} else {
					this.secondrun = true;
					var tst = bckenddat.responses[0].response[0].__metadata.type;
					var propinf_resp = bckenddat.responses[0].response;
				}
				this._aPropInfos = [];
				var udt = "UDT";
				if (tst == "GMT.VC_ODATA_SRV.GetVATList") {
					for (var i = 0; i < propinf_resp.length; i++) {

						var propmode, udtinst = false;
						if (propinf_resp[i].Layout == "TABLE") {
							propmode = PropMode.Composition;
							this._mlc = false;
						} else if (propinf_resp[i].Layout == "FORM") {
							propmode = PropMode.Instance;
							this._mlc = false;
						} else if (propinf_resp[i].Layout == "TREE TABLE") {
							this._mlc = true;
							propmode = PropMode.Composition;
						} else if (propinf_resp[i].Layout == "PHRASE") {
							propmode = PropMode.Phrase;
							this._mlc = false;
						} else if (propinf_resp[i].Layout == "UDT_INST") {
							propmode = PropMode.Instance;
							this._mlc = false;
							udtinst = true;
						}
						var prpinfline = {
							ESTCAT: propinf_resp[i].Estcat,
							propMode: propmode,
							editable: propinf_resp[i].Editable,
							sortorder: propinf_resp[i].SortOrder,
							PhrKey: propinf_resp[i].Phrkey,
							UDT: propinf_resp[i].NumOfTexts,
							UDTPos: "",
							MLC: this._mlc,
							UDTINST: udtinst,
							Layout: propinf_resp[i].Layout,
							Visible: true,
							PropListId: propinf_resp[i].PropertyListId,
							propid: null
						};
						this._aPropInfos.push(prpinfline);
					}
				} else {
					// FIXMEVC: also request list of properties to be displayed/edited.
					// FIXMEVC: handle cases if this is empty(inst/comp)
					this._aPropInfos = [{
						ESTCAT: null,
						propMode: null,
						editable: false
					}];
				}
				this._fetchInstance(oPropTreeAdditional, hdinfo);
			} else {
				// On error, display dialog.

				Util.showExecuteError(this.getOwnerComponent(), "SpecData.error.fetch", oExecuteData, true, jQuery.proxy(this._initialFetchClose,
					this));
			}
		},

		_initialFetchClose: function () {
			// FIXMEVC: what to do in case of error?: navigate back?
		},

		_fetchInstance: function (oPropTreeAdditional, hdinfo) {
			var oNodesByESTCAT = oPropTreeAdditional.nodesByESTCAT; //FIXMEVC:can we use nodesByESTCAT here, or is it internal?
			var aUnknownESTCATs = [];
			var aRequests = [];
			var hdinfo1 = hdinfo._oModel.oData[0];

			for (var i = 0; i < this._aPropInfos.length; i++) {
				var oPropInfo = this._aPropInfos[i];
				var sESTCAT = oPropInfo.ESTCAT;
				var oTreeNode = oNodesByESTCAT[sESTCAT];
				var phrky = this._aPropInfos[i].PhrKey;

				if (!oTreeNode && this._aPropInfos[i].propMode != "Phrase") {
					// if (!oTreeNode ) {
					aUnknownESTCATs.push(sESTCAT);
					continue;
				}

				if (this._aPropInfos[i].propMode == "Phrase") {
					var oTreeNode2 = {
						RECNROOT: "",
						ACTN: "",
						MENID: "",
						ID: "",
						TEXT: "",
						ESTCAT: "",
						Phrkey: phrky,
						MLC: this._aPropInfos[i].MLC
					};
				} else {
					var oTreeNode2 = {
						RECNROOT: oTreeNode.RECNROOT,
						ACTN: oTreeNode.ACTN,
						MENID: oTreeNode.MENID,
						ID: oTreeNode.ID,
						TEXT: oTreeNode.TEXT,
						ESTCAT: oTreeNode.ESTCAT,
						Phrkey: phrky,
						MLC: this._aPropInfos[i].MLC
					};

				}
				oPropInfo.treeNode = oTreeNode2;

				var oRequest = this.getOwnerComponent().getModelManager().requestForFetchInstanceByPropertyKey(oTreeNode2); //FIXMEVC:get req from propctrl?
				aRequests.push(oRequest);
			}
			// dynamic prop
			for (var i = 0; i < this._aPropInfos.length; i++) {
				var oPropInfo = this._aPropInfos[i];
				var sESTCAT = oPropInfo.ESTCAT;
				var oTreeNode = oNodesByESTCAT[sESTCAT];

				if (!oTreeNode && this._aPropInfos[i].propMode != "Phrase" && this._aPropInfos[i].propMode != "doc") {
					// if (!oTreeNode) {
					this._aPropInfos.splice(i, 1);
					i--;
					continue;
				}
			}
			// dynamic prop
			// Display errors.

			// if (aUnknownESTCATs.length > 0) {
			// 	var sDetail = aUnknownESTCATs.join("\n");
			// 	Util.showMessageBox(this.getOwnerComponent(), {
			// 		type: Util.MessageBoxType.Error,
			// 		message: this.getOwnerComponent().getI18nBundle().getText("SpecData.error.unknownProp"),
			// 		details: sDetail
			// 	});
			// 	//FIXMEVC:navigate back on error?

			// 	return;
			// }

			// If there are no requests, then we are finished.

			if (aRequests.length == 0) {
				this._fetchFinish();
				return;
			}

			// Execute data fetches.

			this.getOwnerComponent().getModelManager().executeFetchRequests(aRequests, jQuery.proxy(this._fetchInstanceCallback, this));
		},

		_fetchInstanceCallback: function (oExecuteData, oBackendExecuteData) {
			if (oExecuteData.allSuccess) {
				var aExecuteResponses = oExecuteData.responses;
				assert(this._aPropInfos.length == aExecuteResponses.length, "Length inconsistency");
				var instinf = [],
					instdoc = [],
					treenode3 = null;
				var txtcmp = "COMP_TYPE";
				instinf[txtcmp] = "Phrase";
				instdoc[txtcmp] = "DocLink";
				for (var i = 0; i < this._aPropInfos.length; i++) {
					var oPropInfo = this._aPropInfos[i];
					if (oPropInfo.propMode != "Phrase" && oPropInfo.propMode != "doc") {
						var oCollection = aExecuteResponses[i].response;
						var oInstanceAdditional = oCollection.getAdditional();

						oPropInfo.instanceInfo = oInstanceAdditional.info;
						//oPropInfo.instanceInfo = oCollection.info;

						if (oPropInfo.propMode == PropMode.Instance) {
							treenode3 = oPropInfo.treeNode;
							if (oPropInfo.UDT > 0) {
								var aInstances = oCollection.getEntries();
								// var aInstances = oCollection.entries;
								assert(aInstances.length > 0, "aInstances.length should be > 0"); //FIXMEVCX:check for status?
								aInstances[0].LAYOUT = oPropInfo.Layout;
								oPropInfo._instanceKey = aInstances[0];
							}
							oPropInfo.collection = oCollection;
						} else {
							// Fetch detail for the first instance.

							var aInstances = oCollection.getEntries();
							// var aInstances = oCollection.entries;
							assert(aInstances.length > 0, "aInstances.length should be > 0"); //FIXMEVCX:check for status?

							oPropInfo._instanceKey = aInstances[0];
							var instkey = aInstances[0];
						}
					} else {

						oPropInfo.propMode = "Composition";
						oPropInfo.instanceInfo = instinf;
					}

				}
				this._fetchDetail();
			} else {
				// On error, display dialog.

				Util.showExecuteError(this.getOwnerComponent(), "SpecData.error.fetch", oExecuteData, true, jQuery.proxy(this._fetchInstanceClose,
					this));
			}
		},

		_fetchInstanceClose: function () {
			// FIXMEVC: what to do in case of error?: navigate back?
		},

		_fetchDetail: function () {
			var aUnknownComps = [];
			var aRequests = [];
			var proplist = this._aPropInfos;
			var instinf = [];
			var txtcmp = "COMP_TYPE";
			instinf[txtcmp] = "UserDefinedText";

			for (var i = 0; i < proplist.length; i++) {
				if (proplist[i].UDT != 0)
				// if(proplist[i].instanceInfo.COMP_LABEL == "Allergens")
				{
					var udtprop = {
						ESTCAT: proplist[i].ESTCAT,
						propMode: proplist[i].propMode,
						// propMode: "Composition",
						editable: "",
						sortorder: "",
						PhrKey: "udt",
						UDT: "",
						_instanceKey: proplist[i]._instanceKey,
						instanceInfo: instinf
					};
					this._aPropInfos[i].UDTPos = this._aPropInfos.length;
					this._aPropInfos.push(udtprop);
				} else {
					this._aPropInfos[i].UDTPos = null;
				}
			}

			for (var i = 0; i < this._aPropInfos.length; i++) {
				var oPropInfo = this._aPropInfos[i];
				var oInstanceKey = oPropInfo._instanceKey;
				var oRequest = null;

				switch (oPropInfo.propMode) {
				case PropMode.Instance: // Already handled in _fetchInstanceCallback.
					if (oPropInfo.PhrKey == "udt") {
						oRequest = this.getOwnerComponent().getModelManager().requestForFetchUserDefinedTextByInstanceKey(oInstanceKey);
					}
					break;

				case PropMode.Composition:
					var sCOMP_TYPE = oPropInfo.instanceInfo.COMP_TYPE;

					switch (sCOMP_TYPE) {
					case CompType.Qual:

						oRequest = this.getOwnerComponent().getModelManager().requestForFetchQualByInstanceKey(oInstanceKey);
						break;

					case CompType.MultiComp:
						this._multicmpestcat = oPropInfo.ESTCAT;
						oRequest = this.getOwnerComponent().getModelManager().requestForFetchMultiCompositionByInstanceKey(oInstanceKey); //FIXMEVC:implement requestForFetchMultiCompositionByInstanceKey
						break;

					case CompType.Quant:

						oRequest = this.getOwnerComponent().getModelManager().requestForFetchQuantByInstanceKey(oInstanceKey); //FIXMEVC:implement requestForFetchMultiCompositionByInstanceKey
						break;

					case CompType.Phrase:
						var phrkey = oPropInfo.PhrKey;
						oRequest = this.getOwnerComponent().getODataManager().requestForFetchText(phrkey);
						var ndmetadata = [],
							txtnm = "name",
							phrkeytxt = "Phrkey";
						ndmetadata[txtnm] = "Phrase";
						ndmetadata[phrkeytxt] = phrkey;
						oRequest.nodeMetadata = ndmetadata;
						break;

					case CompType.UserDefinedText:
						oRequest = this.getOwnerComponent().getModelManager().requestForFetchUserDefinedTextByInstanceKey(oInstanceKey);
						break;
					default:
						var sUnknownComp = oPropInfo.ESTCAT + ": " + sCOMP_TYPE; //FIXMEVC:i18n?
						aUnknownComps.push(sUnknownComp);
					}
					break;

				default:
					assert(false, "propMode is unknown");
				}

				if (oRequest) {
					oPropInfo._fetchDetail = true; //FIXMEVC:or use _instancekey?
					aRequests.push(oRequest);
				}
			}

			// Display errors.

			if (aUnknownComps.length > 0) {
				var sDetail = aUnknownComps.join("\n");
				Util.showMessageBox(this.getOwnerComponent(), {
					type: Util.MessageBoxType.Error,
					message: this.getOwnerComponent().getI18nBundle().getText("SpecData.error.unknownComp"),
					details: sDetail
				}); //FIXMEVC:navigate back on error?

				return;
			}

			// If there are no requests, then we are finished.

			if (aRequests.length == 0) {
				this._fetchFinish();
				return;
			}

			// Execute data fetches.

			this.getOwnerComponent().getModelManager().executeFetchRequests(aRequests, jQuery.proxy(this._fetchDetailCallback, this));
		},

		_fetchDetailCallback: function (oExecuteData) {
			if (oExecuteData.allSuccess) {
				var aExecuteResponses = oExecuteData.responses;
				var iExecuteResponseIndex = 0;
				var tst = 0;
				for (var i = 0; i < this._aPropInfos.length; i++) {
					var oPropInfo = this._aPropInfos[i];
					var pos = oPropInfo.UDT;
					if (oPropInfo._fetchDetail || oPropInfo.PhrKey == "udt") {
						//FIXMEVC:or use _instancekey?
						var indx = iExecuteResponseIndex;

						var tst1 = tst++;
						var oCollection = aExecuteResponses[iExecuteResponseIndex++].response;
						var dat = oCollection.getEntries();
						oPropInfo.collection = oCollection;
					}
				}
				this._fetchFinish();
			} else {
				// On error, display dialog.

				Util.showExecuteError(this.getOwnerComponent(), "SpecData.error.fetch", oExecuteData, true, jQuery.proxy(this._fetchDetailClose,
					this));
			}
		},

		_fetchDetailClose: function () {
			// FIXMEVC: what to do in case of error?: navigate back?
		},

		_fetchFinish: function () {
			// Display properties.
			// if (this.secondrun) {
			// 	for (var i = 0; i < this._aTabControllers.length; i++) {
			// 		var oTabController = this._aTabControllers[i];
			// 		oTabController.onBeforeShow();
			// 	}
			// }
			for (var m = 0; m < this._aPropInfos.length; m++) {

				var oPropInfo = this._aPropInfos[m];
				if (oPropInfo.ESTCAT != "") {
					if (oPropInfo.Layout == "TABLE") {
						if (oPropInfo.instanceInfo.COMP_TYPE == "QUAL") {
							var aCharHeaders = oPropInfo.collection.getAdditional().parent.CompHeader;
						}else if (oPropInfo.instanceInfo.COMP_TYPE == "QUANT") {
							var aCharHeaders = oPropInfo.collection.getAdditional().parent.CompHeaderqnt;
						}
						for (var i = aCharHeaders.length - 1; i >= 0; i--) {
							var oCharHeader = aCharHeaders[i];

							if (oCharHeader.AsCheckBox) {
								if (oCharHeader._Linked_prop != "") {
									for (var p = 0; p < this._aPropInfos.length; p++) {
										if (this._aPropInfos[p].PropListId == oCharHeader._Linked_prop) {
											this._aPropInfos[p].Visible = oPropInfo.collection.getModel().getProperty("/0/" + oCharHeader._sFieldName + "/0/value");

										}
									}
								}
							}
						}
					} else if (oPropInfo.Layout == "FORM") {
						var aCharHeaders = oPropInfo.collection.getAdditional().charHeaderInfo.byOrder;
						for (var i = aCharHeaders.length - 1; i >= 0; i--) {
							var oCharHeader = aCharHeaders[i];

							if (oCharHeader._isCheckBox) {
								if (oCharHeader._Linked_prop != "") {
									for (var p = 0; p < this._aPropInfos.length; p++) {
										if (this._aPropInfos[p].PropListId == oCharHeader._Linked_prop) {
											this._aPropInfos[p].Visible = oPropInfo.collection.getModel().getProperty("/0/" + oCharHeader._sFieldName + "/0/value");

										}
									}
								}
							}
						}
					}

				}

			}
			for (var i = 0; i < this._aPropInfos.length; i++) {
				var oPropInfo = this._aPropInfos[i];
				// add condition to add to the document
				if (oPropInfo.PhrKey != "doc") {
					if (oPropInfo.UDTPos != null && oPropInfo.PhrKey != "udt" && (!this.secondrun || oPropInfo.instanceInfo.COMP_TYPE == "MLVL_COMP")) {
						var oTabController = oPropInfo.editable ? this._oTabControllerPropEditable : this._oTabControllerPropNonEditable;
						oTabController.addProp(oPropInfo.propMode, oPropInfo.treeNode, oPropInfo.instanceInfo, oPropInfo.collection, this._aPropInfos[
								oPropInfo.UDTPos], this.secondrun, this.oSpecificationkey, this._multicmpestcat, oPropInfo.UDTINST, oPropInfo.Layout, this._aPropInfos,
							oPropInfo, i);
					} else if (oPropInfo.UDTPos == null && oPropInfo.PhrKey != "udt" && (!this.secondrun || oPropInfo.instanceInfo.COMP_TYPE ==
							"MLVL_COMP")) {
						var oTabController = oPropInfo.editable ? this._oTabControllerPropEditable : this._oTabControllerPropNonEditable;
						oTabController.addProp(oPropInfo.propMode, oPropInfo.treeNode, oPropInfo.instanceInfo, oPropInfo.collection, null, this.secondrun,
							this.oSpecificationkey, this._multicmpestcat, oPropInfo.UDTINST, oPropInfo.Layout, this._aPropInfos, oPropInfo, i);
					}
				}

			}

			setTimeout(this._rtde, 1000);
			var instkey = {
				"RECNROOT": this.oSpecificationkey.RECNROOT,
				"ACTN": this.oSpecificationkey.ACTN,
				"RECNPARENT": "0",
				"ESTCAT": "0",
				"RECN_VP": "0",
				"ACTN_VP": "0"
			};

			if (this._aTabControllers.length == 4) {
				this._aTabControllers.splice(2, 2);
				for (var j = 0; j < this.otab.getItems().length; j++) {
					if (j > 1) {
						this.otab.removeItem(this.otab.getItems()[j]);
						j--;
					}
				}
			}

			// await this._rtde();

			setTimeout(this._rtde, 1000);
			this._oTabControllerAttachment = new SpecDataTabAttachment(this.getOwnerComponent(), instkey);
			this._setupTab(this._oTabControllerAttachment);

			this._oTabControllerMessage = new SpecDataTabMessage(this.getOwnerComponent(), this.oSpecificationkey.RECNROOT);
			this._setupTab(this._oTabControllerMessage);

			// Switch to edit mode, if needed.

			if (this._bNeedEditMode)
				this._setEditMode(true);

			this.byId("ictb").setSelectedKey("maintain");
			this._onEdit();
			this.byId("tlb2").setVisible(true);
		},
		_clearStorage: function () {
			this.getOwnerComponent().getModelManager().clearStorage();
		},

		_beforeSave: function (fContinue) {
			this._showError(false);

			fContinue();
		},
		_rtde: function () {
			var testdat = 1234;
		},
		_afterSave: function (oSaveInfo, fContinue) {
			// In case of top-level error, entryErrorInfos is null. Since
			// ModelManager is not clearing errors in this case, then we
			// need to retain them in error popover.

			var aEntryErrorInfos = oSaveInfo.entryErrorInfos;
			if (aEntryErrorInfos) {
				var iEntryErrorCount = aEntryErrorInfos.length;

				this._setEntryErrorCount(iEntryErrorCount);

				// Bring-up the error dialog, if there are errors to show.

				if (iEntryErrorCount > 0) {
					this._oErrorPopover.setEntryErrorInfos(aEntryErrorInfos);
					this._showError(true);
				}
			}
			// this.onInit();
			this._fcont = fContinue;
			if (this._subbtn) {
				var oRequest = this.getOwnerComponent().getODataManager().requestForSubmit(this.oSpecificationkey);
				this.getOwnerComponent().getODataManager().executeRequest(oRequest,
					jQuery.proxy(this._submitsuccess, this), jQuery.proxy(this._submiterror, this));
			} else {
				this._fetchSpecificationInfo();
				fContinue();
			}

		},

		_afterReset: function (fContinue) {
			// Initialize save indicators.

			this._initSave();

			fContinue();
		},
		_submitsuccess: function (fContinue) {
			this._fetchSpecificationInfo();
			this._fcont();
		},
		_submiterror: function (fContinue) {
			this._fetchSpecificationInfo();
			this._fcont();
		},

		_setEnablePage: function (bEnabled) {
			// this._oPageModel.setProperty("/enablePage", bEnabled);  test
		},

		_setEditMode: function (bEditMode) {
			// TODO: Check spec edit role on backend.
			this.getOwnerComponent().setEditMode(bEditMode);
		},

		_setEntryErrorCount: function (iEntryErrorCount) {
			// this._oPageModel.setProperty("/entryErrorCount", iEntryErrorCount);
		},

		_initSave: function () {
			this._setEditMode(false);
			this._setEntryErrorCount(0);
			this._showError(false);
		},

		_showError: function (bShow) {
			var oControl = this.byId("footer.showerror");
			this._oErrorPopover.show(bShow, oControl);
		},

		_formatEditEnabled: function (bEnablePage, bEditMode) {
			var bEnabled = (bEnablePage && !bEditMode);
			return bEnabled;
		},

		_formatEntryErrorText: function (iEntryErrorCount) {
			var sText = (iEntryErrorCount > 0) ? iEntryErrorCount.toString() : "";
			return sText;
		},

		_formatEntryErrorEnabled: function (iEntryErrorCount) {
			var bEnabled = (iEntryErrorCount > 0);
			return bEnabled;
		},

		_onEdit: function () {
			this._setEditMode(true);
		},

		_onShowError: function () {
			this._showError(null);
		},

		_onSave: function (oEvent) {
			if (oEvent.getSource().getId().includes("subbtn"))
				this._subbtn = true;
			else
				this._subbtn = false;
			this.getOwnerComponent().getSaveHandler().save();
		},

		_onCancel: function () {

			var objpgly = this.byId("ictb");
			var key = objpgly.getSelectedKey();

			var oI18nBundle = this.getOwnerComponent().getI18nBundle();
			this.getOwnerComponent().getSaveHandler().confirmAndReset(oI18nBundle.getText("SpecData.cancelConfirm"), null, key);
		}
	});

	return SpecData;
});