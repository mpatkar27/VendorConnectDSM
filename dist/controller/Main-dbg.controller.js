sap.ui.define([
	"sap/base/assert",
	"sap/ui/core/Fragment",
	"sap/ui/core/XMLTemplateProcessor",
	"gramont/VCDSM/specedit/util/ControllerBase",
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
], function (assert, Fragment, XMLTemplateProcessor, ControllerBase, Filter, FilterOperator) {
	"use strict";
	var Main = ControllerBase.extend("gramont.VCDSM.specedit.controller.Main", {

		onInit: function () {
			var specs = {
				"Specifications": [{
					"SpecId": "000000010382",
					"Description": "test1"
				}, {
					"SpecId": "000000004039",
					"Description": "test2"
				}, {
					"SpecId": "000000004039",
					"Description": "test3"
				}, {
					"SpecId": "000000004039",
					"Description": "test4"
				}, {
					"SpecId": "000000004039",
					"Description": "test5"
				}, {
					"SpecId": "000000004039",
					"Description": "test6"
				}, {
					"SpecId": "000000004039",
					"Description": "test7"
				}, {
					"SpecId": "000000004039",
					"Description": "test8"
				}, {
					"SpecId": "000000010224",
					"Description": "test9"
				}]

			};
			var oModel = new sap.ui.model.json.JSONModel(specs);
			// oModel.setData("./model/specs.json", false);
			this.getView().setModel(oModel);
			this._iFragIdCounter = 0;
			this._iBusyDialogCounter = 0;
			this._oFragmentContents = {};

			this._setupContentDensity(this.getView());

			var sValue = jQuery.sap.getUriParameters().get("Specification");
			if (sValue != null) {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("SpecData", {
					SUBID: sValue
				});
			} else {

				var sServiceUr1l = "/sap/opu/odata/GMT/VC_ODATA_SRV";
				var oModel = new sap.ui.model.odata.ODataModel(sServiceUr1l, true);
				var that = this;
				var mParameters = {
					method: "GET",
					urlParameters: {},
					context: null,
					success: function (oLogo) {
						var logod = oLogo.results;
						var oLogoKey1 = {
							DOKAR: logod[0].DOKAR,
							DOKNR: logod[0].DOKNR,
							DOKVR: logod[0].DOKVR,
							DOKTL: logod[0].DOKTL
						};
						var sURL = that.getOwnerComponent().getComponentConfig().serviceURL + "/DocCollection(DOKAR='" + logod[0].DOKAR + "',DOKNR='" +
							logod[
								0].DOKNR + "',DOKVR='" + logod[0].DOKVR +
							"',DOKTL='" + logod[0].DOKTL + "')/$value";
						that.getView().byId("imglog").setSrc(sURL);
						// that.getOwnerComponent().getNavigator().releaseBusyDialog();
					},
					error: function (oError) {
						// sap.m.MessageToast.show(oError.message);
						// that.getOwnerComponent().getNavigator().releaseBusyDialog();
					},
					async: true
				};
				oModel.callFunction("/GetLogoDoc", mParameters);
				// this.getOwnerComponent().getNavigator().requireBusyDialog();
			}
		},
		// _logosuccess: function (oLogo) {

		// 	var logod = oLogo.entries;

		// 	var oLogoKey1 = {
		// 		DOKAR: logod[0].DOKAR,
		// 		DOKNR: logod[0].DOKNR,
		// 		DOKVR: logod[0].DOKVR,
		// 		DOKTL: logod[0].DOKTL
		// 	};

		// 	var sURL = this.getOwnerComponent().getComponentConfig().serviceURL + "/DocCollection(DOKAR=" + logod[0].DOKAR + ",DOKNR=" + logod[
		// 			0].DOKNR + ",DOKVR=" + logod[0].DOKVR +
		// 		",DOKTL=" + logod[0].DOKTL + ")/$value";

		// 	this.getView().byId("imglog").setSrc(sURL);
		// },
		// _logoerror: function (oLogo) {},
		handleValueHelp: function (oEvent) {
			var sServiceUrl = "/sap/opu/odata/GMT/VC_ADD_ODATA_SRV";
			var oModel = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
			var that = this;
			var matnr = this.getView().byId("mat").getValue();
			var mParameters = {
				method: "GET",
				urlParameters: {
					"MATNR_EXT": matnr
				},
				context: null,
				success: function (OData, response) {
					var MaterialDat = OData.results;
					var oJsonModel = new sap.ui.model.json.JSONModel(MaterialDat);
					that.getView().setModel(oJsonModel, "matdat");
					var oView = that.getView();
					if (!that._pValueHelpDialog) {
						that._pValueHelpDialog = Fragment.load({
							name: "gramont.VCDSM.specedit.frag.MaterialValuehelp",
							controller: that
						}).then(function (oValueHelpDialog) {
							oView.addDependent(oValueHelpDialog);
							return oValueHelpDialog;
						});
					}

					// open value help dialog
					that._pValueHelpDialog.then(function (oValueHelpDialog) {
						oValueHelpDialog.open();
					});
					that.getOwnerComponent().getNavigator().releaseBusyDialog();
				},
				error: function (oError) {
					sap.m.MessageToast.show(oError.message);
					that.getOwnerComponent().getNavigator().releaseBusyDialog();
				},
				async: true
			};
			oModel.callFunction("/MatSearchHelp", mParameters);
			this.getOwnerComponent().getNavigator().requireBusyDialog();
		},
		_handleValueHelpSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter(
				"MATNR",
				FilterOperator.Contains, sValue
			);
			oEvent.getSource().getBinding("items").filter([oFilter]);
		},

		_handleValueHelpClose: function (oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem");
			if (oSelectedItem) {
				var productInput = this.byId("mat");
				productInput.setValue(oSelectedItem.getTitle());
			}
			oEvent.getSource().getBinding("items").filter([]);
		},
		_onpressnav: function (oEvent) {
			var itm = oEvent.getParameter("listItem").getTitle();
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("SpecData", {
				SUBID: itm
			});

		},

		_oncrtnwspec: function (oEvent) {

			var matnr = this.getView().byId("mat").getValue();
			var sServiceUrl = "/sap/opu/odata/GMT/VC_ADD_ODATA_SRV";
			var oModel = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
			var oJsonModel = new sap.ui.model.json.JSONModel();
			var that = this;
			var sParam = "'" + matnr + "'";
			var mParameters = {
				method: "GET",
				urlParameters: {
					"MATNR": matnr
				},
				context: null,
				success: function (OData, response) {
					var newspec = OData.results[0].SUBID;
					if (newspec == "") {
						sap.m.MessageToast.show(OData.results[0].MESSAGE);
						that.getOwnerComponent().getNavigator().releaseBusyDialog();
					} else {
						var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
						oRouter.navTo("SpecData", {
							SUBID: newspec
						});
					}

				},
				error: function (oError, response) {
					sap.m.MessageToast.show(oError.message);
					that.getOwnerComponent().getNavigator().releaseBusyDialog();
				},
				async: true
			};
			oModel.callFunction("/CreateSpec", mParameters);
			this.getOwnerComponent().getNavigator().requireBusyDialog();

		},
		navigateTo: function (sViewName, oViewParam) {
			// Public method for view navigation.

			this.getOwnerComponent().getRouter().navTo(sViewName, oViewParam);
		},

		navigateBack: function () {
			// Public method for going back in view stack.

			window.history.back();
		},

		createFragment: function (sFragmentName, oController, oParentControl) {
			// Instantiate fragment.

			var iFragIdCounter = this._iFragIdCounter++;
			var sFragmentId = this.createId("frag" + iFragIdCounter.toString());
			var sFragmentRealName = this.getOwnerComponent().getFragmentName(sFragmentName);

			// Lookup fragment xml content in cache to prevent fetching it
			// multiple times (see sap/ui/core/Fragment-dbg.js).

			var oFragmentContent = this._oFragmentContents[sFragmentRealName];
			if (!oFragmentContent)
				oFragmentContent = this._oFragmentContents[sFragmentRealName] = XMLTemplateProcessor.loadTemplate(sFragmentRealName, "fragment");

			var oFragmentConfig = {
				fragmentContent: oFragmentContent,
				sId: sFragmentId
			};

			var oControl = sap.ui.xmlfragment(oFragmentConfig, oController); // FIXME: convert to async load
			assert(jQuery.type(oControl) == "object", "Fragment should contain only one top-level control");

			// For popup-like controls, connect lifecycle management and i18n
			// model. (Others controls are embedded inside a parent, and the above operations
			// are automatically done.)
			// TODO: switch dialogs/popovers to draggable to resizeable?

			// Wrapping convention, if input is:
			// - Input
			//   - short text: Text wrapping=false
			//   - long text
			//     - fixed width parent: Text wrapping=true, width should be set
			//     - non-fixed width parent: Text wrapping=false
			// - TextArea: Text wrapping=true, width=same as TextArea

			if (oControl.isA(["sap.m.BusyDialog", "sap.m.Dialog", "sap.m.Popover", "sap.m.TableSelectDialog", "sap.m.ViewSettingsDialog"])) { //FIXMEVC:remove what is not needed
				if (!oParentControl)
					oParentControl = this.getView();
				oParentControl.addDependent(oControl);

				this._setupContentDensity(oControl);
			}

			var fById = function (sId) {
				var oControl = Fragment.byId(sFragmentId, sId);
				return oControl;
			};

			var oFragment = {
				control: oControl,
				byId: fById
			};

			return oFragment;
		},

		requireBusyDialog: function () {
			if (this._iBusyDialogCounter++ == 0) {
				if (!this._oBusyDialog)
					this._oBusyDialog = this.createFragment("gramont.VCDSM.specedit.frag.BusyDialog", this);

				this._oBusyDialog.control.open();
			}
		},

		releaseBusyDialog: function () {
			assert(this._iBusyDialogCounter > 0, "iBusyDialogCounter should be > 0");
			if (--this._iBusyDialogCounter == 0) {
				// UI5: Don't set focus at busy dialog close, since there is a possibility
				// that it has been changed during wait.

				if (this._oBusyDialog.control._oDialog &&
					this._oBusyDialog.control._oDialog.oPopup &&
					this._oBusyDialog.control._oDialog.oPopup._oPreviousFocus)
					this._oBusyDialog.control._oDialog.oPopup._oPreviousFocus = null;

				this._oBusyDialog.control.close();
			}
		},

		getContentDensityClass: function () {
			var sClass = jQuery.device.is.desktop ? "sapUiSizeCompact" : "";
			return sClass;
		},

		_setupContentDensity: function (oControl) {
			var sClass = this.getContentDensityClass();
			if (sClass != "")
				oControl.addStyleClass(sClass);
		}
	});

	return Main;
});