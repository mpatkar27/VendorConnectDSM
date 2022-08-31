// This tab is implementing the attachment maintenance.

sap.ui.define([
	"gramont/VCDSM/specedit/util/SpecDataTabBase",
	"sap/m/library",
	"sap/m/Link",
	"gramont/VCDSM/specedit/util/ModelManagerAdmin",
	"gramont/VCDSM/specedit/util/ModelManagerAutoGrowOp",
	"gramont/VCDSM/specedit/util/ModelManagerIntStatus",
	"sap/ui/model/json/JSONModel",
	"gramont/VCDSM/specedit/util/PropMultiComposition",
	"sap/base/assert",
	"gramont/VCDSM/specedit/util/ValueHelperDialog"
], function (SpecDataTabBase, sap_m_lib, Link, ModelManagerAdmin, ModelManagerAutoGrowOp,
	ModelManagerIntStatus, JSONModel, PropMultiComposition, assert, ValueHelperDialog) {
	"use strict";

	var UsageDiag = function (oComponent, udtmod, otreenode) {
		SpecDataTabBase.call(this, oComponent, "gramont.VCDSM.specedit.frag.UsageDiag");

		this._oComponent = oComponent;
		this._vhiIndex = null;
		this._rowmod = null;
		this._usagecollection = null;
		this._udtmod = udtmod;
		this._treenode = otreenode;

		this._panel1 = this._byId("pnl1");
		this._spec = this._byId("specinp");
		this._specdet = this._byId("specdetinp");

		this._oDialogadd = oComponent.getNavigator().createFragment("gramont.VCDSM.specedit.frag.UsageDiag", this); //FIXME:parentcontrol

		this._Odiagrestab = new JSONModel();
		// var diagmod = 
		// [{"AdvSrchPanel1Expanded":true,"AdvSrchPanel2Expanded" : false}];

		this._oValueHelperPropMaps = {
			"VACLID": {
				"VACLID": {
					property: "VACLID"
				},
				"VACLNAM": {
					property: "VACLNAM"
				}
			},
			"RVLID": {
				"RVLID": {
					property: "RVLID"
				},
				"RVLNAM": {
					property: "RVLNAM"
				}
			}
		};

		// this._Odiagrestab.setProperty("/aData", [{}]);
		// this._oDialogadd.control.setModel(this._Odiagrestab, "resModel");
		this._oDialogadd.control.setModel(this._Odiagrestab);
		this._oDialogadd.control.open();

		// var usagekey = this._Odiagrestab.getProperty("/aData");
		var usagekey = [{
			"ACTN": "",
			"ACTN_VP": "",
			"RECN_VP": "",
			"RECNROOT": "",
			"RECNPARENT": "",
			"ESTCAT": ""
		}];
		usagekey[0].ACTN = udtmod.ACTN;
		usagekey[0].ACTN_VP = udtmod.ACTN_VP;
		usagekey[0].RECN_VP = udtmod.RECN_VP;
		usagekey[0].RECNROOT = udtmod.RECNROOT;
		usagekey[0].RECNPARENT = udtmod.RECNPARENT;
		usagekey[0].ESTCAT = otreenode.ESTCAT;

		var oRequest = this._oComponent.getODataManager().requestForFetcUsageDetails(usagekey[0]);
		this._oComponent.getODataManager().executeRequest(oRequest,
			jQuery.proxy(this._fetchCharValueSuccess, this));

	};
	UsageDiag.prototype = Object.create(SpecDataTabBase.prototype);
	UsageDiag.prototype.constructor = UsageDiag;

	UsageDiag.prototype._onCloseusag = function () {

		this._oDialogadd.control.close();

	};

	UsageDiag.prototype._onchange = function (oEvent) {
		var aPathComps = oEvent.getSource().getBindingContext().getPath().split("/");

		var iIndex = parseInt(aPathComps[1]);
		var omod = oEvent.getSource().getModel();
		this._modtab = omod;
		var sBindingPath = "/" + iIndex + "/Change";
		var rowmod = omod.setProperty(sBindingPath, true);
	};

	UsageDiag.prototype._onok = function (oEvent) {

		var resdata = this._modtab.getData();
		for (var l = 0; l < resdata.length; l++) {
			if (resdata[l].Change == true) {
				
				resdata[l].ESTCAT=this._treenode.ESTCAT;
				resdata[l].RECNROOT=this._treenode.RECNROOT;
				resdata[l].RECNMST=this._udtmod.RECN_VP;
				resdata[l].RECNPARENT=this._udtmod.RECNPARENT;
				var oRequest = this._oComponent.getODataManager().requestForUpdateUsagedat(resdata[l]);
				this._oComponent.getODataManager().executeRequest(oRequest,
					jQuery.proxy(this._onCloseusag, this));
			}
		}

	};
	UsageDiag.prototype._fetchCharValueSuccess = function (aCharEntries) {

		this._usagecollection = aCharEntries.entries;
		this._Odiagrestab.setProperty("/", aCharEntries.entries);
		this._modtab = this._Odiagrestab;
	};
	UsageDiag.prototype._onValueHelpRequestVAC = function (oEvent) {

		var aPathComps = oEvent.getSource().getBindingContext().getPath().split("/");

		this._vhiIndex = parseInt(aPathComps[1]);
		var omod = oEvent.getSource().getModel();
		var sBindingPath = "/" + this._vhiIndex + "/";
		this._rowmod = omod.getProperty(sBindingPath);

		ValueHelperDialog.openDialog(this._getOwnerComponent(),
			"Status", // Usage entity doesn't have value helper assigned for VACLID and RVLID.
			this._oValueHelperPropMaps,
			null,
			oEvent.getSource(),
			null,
			jQuery.proxy(this._onValueHelpRequestSelect, this));
		// null);
	};

	UsageDiag.prototype._onValueHelpRequestSelect = function (oControl, sFieldName) {
		if (sFieldName == "VACLID")
			this._updateFlagSingle(oControl);
	};

	UsageDiag.prototype._updateFlagSingle = function (oControl) {
		// If rating changes, then copy flags from an already existing
		// usage which has the same rating.
		// var iIndex = this._oCollection.getEntryIndexOfControl(oControl);
		// var oUsage = this._oCollection.getEntry(iIndex);
		var sVACLID = this._rowmod.VACLID;

		if (sVACLID != null && sVACLID.trim() != "") {
			var aUsages = this._usagecollection;

			for (var i = 0; i < aUsages.length; i++) {
				var oUsage = aUsages[i];

				if (i != this._vhiIndex && this._rowmod.VACLID == sVACLID) {
					this._oCollection.setFieldValue(this._vhiIndex, "ACTVFLG", oUsage.ACTVFLG);
					this._oCollection.setFieldValue(this._vhiIndex, "ESNTFLG", oUsage.ESNTFLG);
					break;
				}
			}
		}
		
	};
	return UsageDiag;
});