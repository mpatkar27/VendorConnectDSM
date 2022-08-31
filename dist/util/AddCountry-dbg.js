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

	var AddCountry = function (oComponent, otreenode, udtmod, oldudt,cmbmod) {
		SpecDataTabBase.call(this, oComponent, "gramont.VCDSM.specedit.frag.AddCountry");

	this._oComponent = oComponent;
		this._vhiIndex = null;
		this._rowmod = null;
		this._usagecollection = null;
		this._treenode = otreenode;
		this.selectedkeys = null;
		this._panel1 = this._byId("pnl1");
		this._spec = this._byId("specinp");
		this._specdet = this._byId("specdetinp");
		this._adcntrytab = this._byId("countryusagetab");
		this.patharr = [];
		this._oDialogadd = oComponent.getNavigator().createFragment("gramont.VCDSM.specedit.frag.AddCountry", this); //FIXME:parentcontrol
		this._udtmod = udtmod;
		this._oldudt = oldudt;
		this._cmbmod = cmbmod;
		this._Odiagrestab = new JSONModel();
		
		this._oDialogadd.control.setModel(this._Odiagrestab);
		this._oDialogadd.control.open();

		var oRequest = this._oComponent.getODataManager().requestForFetchCountry();
		this._oComponent.getODataManager().executeRequest(oRequest,
			jQuery.proxy(this._FetchCountrySuccess, this));

	};
	AddCountry.prototype = Object.create(SpecDataTabBase.prototype);
	AddCountry.prototype.constructor = AddCountry;

	AddCountry.prototype._onCloseusag = function () {

		this._oDialogadd.control.close();

	};

	AddCountry.prototype._onchange = function (oEvent) {
		var aPathComps = oEvent.getSource().getBindingContext().getPath().split("/");

		var iIndex = parseInt(aPathComps[1]);
		var omod = oEvent.getSource().getModel();
		this._modtab = omod;
		var sBindingPath = "/" + iIndex + "/Change";
		var rowmod = omod.setProperty(sBindingPath, true);
	};
	AddCountry.prototype._onSelectionChng = function (oEvent) {

		var spath = oEvent.getSource().getBindingContext().sPath;

		if (this.patharr.length == 0) {
			this.patharr.push(spath);
		}else{
			for (var j = 0; j < this.patharr.length; j++) {
			if (this.patharr[j] == spath) {
				this.patharr.splice(j, 1);
				j--;
			} else {
				this.patharr.push(spath);
			}
		}
		}
		
	};
	AddCountry.prototype._onok = function (oEvent) {

		var usagekey = [{
			"ACTN": "",
			"MENID": "",
			"ID": "",
			"RECNROOT": "",
			"ESTCAT": ""
		}];
		usagekey[0].ACTN = this._treenode.ACTN;
		usagekey[0].RECNROOT = this._treenode.RECNROOT;
		usagekey[0].ESTCAT = this._treenode.ESTCAT;
		// var udtdat = this._udtmod.getData();
		// if (udtdat.length != 0) {
		// 	var udtlast = jQuery.extend(true, {}, udtdat[udtdat.length - 1]);
		// }
		for (var l = 0; l < this.patharr.length; l++) {
			
			// if (this.patharr[l].Change == true) {
				var moddat = this._Odiagrestab.getProperty(this.patharr[l]);
				moddat.ESTCAT = this._treenode.ESTCAT;
				moddat.RECNROOT = this._treenode.RECNROOT;
				moddat.RECNMST = "";
				moddat.RECNPARENT = "";
				moddat.ACTN = this._treenode.ACTN;
				var oRequest = this._oComponent.getODataManager().requestForUpdateUsagedat(moddat);
				this._oComponent.getODataManager().executeRequest(oRequest,
					jQuery.proxy(this._onUpdtSuccess, this));
			// }
		}
	};
	AddCountry.prototype._onUpdtSuccess = function (oData) {

		var udtdat = this._udtmod.getData();

		if (udtdat.length != 0) {
			var udtlast = jQuery.extend(true, {}, udtdat[udtdat.length - 1]);
			udtlast.ACTN = this._treenode.ACTN;
			udtlast.ORD = oData.ORD;
			udtlast.RECNPARENT = oData.RECNPARENT;
			udtlast.RECNROOT = oData.RECNROOT;
			udtlast.ACTN_VP = oData.ACTN_VP;
			udtlast.RECN_VP = oData.RECN_VP;
			udtlast._ModelManagerADMIN.intStatus = ModelManagerIntStatus.Modified;
			udtlast.DELFLAG = "";

			var udtolddat = this._oldudt.getData();
			udtolddat.push(udtlast);
			var cmbdat = this._cmbmod.getData();
			cmbdat.push(udtlast);
			this._cmbmod.refresh();
			
			udtdat.push(udtlast);
			this._udtmod.refresh();
		} else {
			udtdat = this._oldudt.getData();
			var udtlast = jQuery.extend(true, {}, udtdat[0]);
			udtlast.ACTN = this._treenode.ACTN;
			udtlast.RECNPARENT = oData.RECNPARENT;
			udtlast.RECNROOT = oData.RECNROOT;
			udtlast.ACTN_VP = oData.ACTN_VP;
			udtlast.RECN_VP = oData.RECN_VP;
			udtlast._ModelManagerADMIN.intStatus = ModelManagerIntStatus.Modified;
			udtlast.DELFLAG = "";

			var udtolddat = this._oldudt.getData();
			if (udtolddat[0].RECN == "0") {
				udtolddat.splice(0, 1);
				udtolddat.push(udtlast);
			}
			var udtdat = this._udtmod.getData();
			udtdat.push(udtlast);
			this._udtmod.refresh();
		}
		this._oDialogadd.control.close();
	};
	AddCountry.prototype._FetchCountrySuccess = function (aCharEntries) {

		this._usagecollection = aCharEntries.entries;
		for (var i = 0; i < aCharEntries.entries.length; i++) {
			aCharEntries.entries[i].Selected = false;
		}
		this._Odiagrestab.setProperty("/", aCharEntries.entries);
		this._modtab = this._Odiagrestab;
	};
	return AddCountry;
});