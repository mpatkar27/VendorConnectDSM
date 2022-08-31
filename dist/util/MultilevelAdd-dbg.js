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
], function (SpecDataTabBase, sap_m_lib, Link, ModelManagerAdmin, ModelManagerAutoGrowOp,
	ModelManagerIntStatus, JSONModel, PropMultiComposition, assert) {
	"use strict";

	var MultilevelAdd = function (oComponent, cPath, newMod, oldMod, cnode, obref, speckey, estcat) {
		SpecDataTabBase.call(this, oComponent, "gramont.VCDSM.specedit.frag.MultilevelAdd");
		this.speckey = speckey;
		this.estcat = estcat;
		this._oComponent = oComponent;
		this._obref = obref;
		this._childnodepath = cPath;
		this._compnewr = newMod;
		this._acompsr = oldMod;
		this._panel1 = this._byId("pnl1");
		this._panel2 = this._byId("pnl2");
		this._childnode = cnode;
		this._spec = this._byId("specinp");
		this._specdet = this._byId("specdetinp");

		this._oDialogadd = oComponent.getNavigator().createFragment("gramont.VCDSM.specedit.frag.MultilevelAdd", this); //FIXME:parentcontrol
		this._oDialogDialogModel = new JSONModel();
		this._Odiagrestab = new JSONModel();
		// var diagmod = 
		// [{"AdvSrchPanel1Expanded":true,"AdvSrchPanel2Expanded" : false}];
		this._oDialogDialogModel.setProperty("/aData", [{}]);
		this._Odiagrestab.setProperty("/aData", []);
		this._oDialogDialogModel.setProperty("/AdvSrchPanel1Expanded", true);
		this._oDialogDialogModel.setProperty("/AdvSrchPanel2Expanded", false);
		this._oDialogadd.control.setModel(this._oDialogDialogModel, "dialogModel");
		this._oDialogadd.control.setModel(this._Odiagrestab, "resModel");

		this._oDialogadd.control.open();

	};
	MultilevelAdd.prototype = Object.create(SpecDataTabBase.prototype);
	MultilevelAdd.prototype.constructor = MultilevelAdd;

	MultilevelAdd.prototype._onClose = function () {

		this._oDialogadd.control.close();

	};

	MultilevelAdd.prototype._onaddnode = function (oEvent) {

		var sRowPath = oEvent.getParameters().rowBindingContext.getPath();
		var oTableModel = oEvent.getParameters().rowBindingContext.getModel();
		var oData = oTableModel.getProperty(sRowPath);

		var newnode = [], ModelManagerADM=[], orgentry = [] ;

		var modo = this._acompsr.getData();
		var noddet = this._compnewr.getProperty(this._childnodepath);
		newnode = jQuery.extend(true, {}, noddet);
		var newnodeol = newnode;
		if (this._childnode) {
			newnode.ACTN = "";
			newnode.CHILD_KEY = "0";
			newnode.EXP_LEVEL = newnode.EXP_LEVEL + 1;
			newnode.IDENT1 = oData.IDENT_DESCR1;
			newnode.NoofChildnodes = 0;
			newnode.ORD = (newnodeol.NoofChildnodes + 1).toString();
			newnode.PARENT_KEY = newnodeol.ITEM_KEY;
			newnode.ITEM_KEY = "";
			newnode.RECN = "";
			newnode.RECNPARENT = "";
			newnode.SUBID = oData.SUBID;
			newnode.aCompositions = [];
			noddet.NoofChildnodes = noddet.NoofChildnodes + 1;
			newnode.COMPAVG = 0;
			newnode.DELFLG = "";
		} else {
			if (noddet != null) {
				newnode.ACTN = "";
				newnode.CHILD_KEY = "0";
				newnode.EXP_LEVEL = 1;
				newnode.IDENT1 = oData.IDENT_DESCR1;
				newnode.ITEM_KEY = "";
				newnode.NoofChildnodes = 0;
				newnode.ORD = (this._compnewr.getData().length).toString();
				newnode.PARENT_KEY = "0";
				newnode.RECN = "";
				newnode.RECNPARENT = "";
				newnode.SUBID = oData.SUBID;
				newnode.aCompositions = [];
				noddet.NoofChildnodes = 0;
				newnode.COMPAVG = 0;
				newnode.DELFLG = "";
			} else {
				// create node for empty node
				newnode.ABS_QTY = "";
				newnode.ACTN = this.speckey.ACTN;
				newnode.ACTN_VP = "0";
				newnode.ADDCHDBTN = true;
				newnode.CHILD_KEY = "0";
				newnode.COMPAVG = "0.0000";
				newnode.COMPCAT = "COMPONENT";
				newnode.COMPNAM = "Component";
				newnode.COUNTRY_ORIG = "";
				newnode.DELFLG = "";
				newnode.ESTCAT = this.estcat;
				newnode.EXP_LEVEL = 1;
				newnode.IDENT1 = oData.IDENT_DESCR1;
				newnode.ITEM_KEY = "";
				newnode.ITOTVALVIS0 = true;
				newnode.ITOTVALVIS1 = false;
				newnode.ITOTVALVIS2 = false;
				newnode.ITOTVALVIS3 = false;
				newnode.NoofChildnodes = 0;
				newnode.ORD = "0001";
				newnode.PARENT_KEY = "0";
				newnode.RECN = "";
				newnode.RECNPARENT = "";
				newnode.RECNROOT = this.speckey.RECNROOT;
				newnode.RECN_VP = "";
				newnode.ROW_KEY = "0000";
				newnode.SORTNO = "0000";
				newnode.SUBID = oData.SUBID;
				newnode.UOM = "";
				newnode.aCompositions = [];
			}

		}

		if (newnode.EXP_LEVEL == 1) {
			newnode.ITOTVALVIS0 = true;
			newnode.ITOTVALVIS1 = false;
			newnode.ITOTVALVIS2 = false;
			newnode.ITOTVALVIS3 = false;

			newnode.ADDCHDBTN = true;

		} else if (newnode.EXP_LEVEL == 2) {
			newnode.ITOTVALVIS0 = false;
			newnode.ITOTVALVIS1 = true;
			newnode.ITOTVALVIS2 = false;
			newnode.ITOTVALVIS3 = false;

			newnode.ADDCHDBTN = true;

		} else if (newnode.EXP_LEVEL == 3) {
			newnode.ITOTVALVIS0 = false;
			newnode.ITOTVALVIS1 = false;
			newnode.ITOTVALVIS2 = true;
			newnode.ITOTVALVIS3 = false;

			newnode.ADDCHDBTN = true;

		} else if (newnode.EXP_LEVEL == 4) {
			newnode.ITOTVALVIS0 = false;
			newnode.ITOTVALVIS1 = false;
			newnode.ITOTVALVIS2 = false;
			newnode.ITOTVALVIS3 = true;

			newnode.ADDCHDBTN = false;
		} else {
			newnode.ADDCHDBTN = false;
		}
		if (this._childnode) {
			newnode._ModelManagerADMIN.intStatus = ModelManagerIntStatus.Modified;
			newnode._ModelManagerADMIN.origEntry.CHILD_KEY = "0";
			newnode._ModelManagerADMIN.origEntry.EXP_LEVEL = newnode.EXP_LEVEL;
			newnode._ModelManagerADMIN.origEntry.IDENT1 = oData.IDENT_DESCR1;
			newnode._ModelManagerADMIN.origEntry.NoofChildnodes = 0;
			newnode._ModelManagerADMIN.origEntry.ORD = (newnodeol.NoofChildnodes + 1).toString();
			newnode._ModelManagerADMIN.origEntry.PARENT_KEY = newnode.PARENT_KEY;
			newnode._ModelManagerADMIN.origEntry.ITEM_KEY = "";
			newnode._ModelManagerADMIN.origEntry.RECN = "";
			newnode._ModelManagerADMIN.origEntry.RECNPARENT = "";
			newnode._ModelManagerADMIN.origEntry.SUBID = oData.SUBID;
			newnode._ModelManagerADMIN.origEntry.aCompositions = [];
			noddet._ModelManagerADMIN.origEntry.NoofChildnodes = noddet.NoofChildnodes;
			newnode._ModelManagerADMIN.origEntry.ADDCHDBTN = newnode.ADDCHDBTN;
			newnode._ModelManagerADMIN.origEntry.ITOTVALVIS0 = newnode.ITOTVALVIS0;
			newnode._ModelManagerADMIN.origEntry.ITOTVALVIS1 = newnode.ITOTVALVIS1;
			newnode._ModelManagerADMIN.origEntry.ITOTVALVIS2 = newnode.ITOTVALVIS2;
			newnode._ModelManagerADMIN.origEntry.ITOTVALVIS3 = newnode.ITOTVALVIS3;
			newnode._ModelManagerADMIN.origEntry.COMPAVG = newnode.COMPAVG;
			newnode._ModelManagerADMIN.origEntry.ACTN = newnode.ACTN;
			newnode._ModelManagerADMIN.origEntry.DELFLG = newnode.DELFLG;

			var cnodep = this._childnodepath + "/aCompositions";
			var cnodesroot = this._compnewr.getProperty(cnodep);
			cnodesroot.push(newnode);
			this._compnewr.setProperty(cnodep, cnodesroot);
		} else {
			if (noddet != null) {
				newnode._ModelManagerADMIN.intStatus = ModelManagerIntStatus.Modified;
				newnode._ModelManagerADMIN.origEntry.CHILD_KEY = "0";
				newnode._ModelManagerADMIN.origEntry.EXP_LEVEL = 1;
				newnode._ModelManagerADMIN.origEntry.IDENT1 = oData.IDENT_DESCR1;
				newnode._ModelManagerADMIN.origEntry.ITEM_KEY = "";
				newnode._ModelManagerADMIN.origEntry.NoofChildnodes = 0;
				newnode._ModelManagerADMIN.origEntry.ORD = (this._compnewr.getData().length).toString();
				newnode._ModelManagerADMIN.origEntry.PARENT_KEY = newnodeol.PARENT_KEY;
				newnode._ModelManagerADMIN.origEntry.RECN = "";
				newnode._ModelManagerADMIN.origEntry.RECNPARENT = "";
				newnode._ModelManagerADMIN.origEntry.SUBID = oData.SUBID;
				newnode._ModelManagerADMIN.origEntry.aCompositions = [];
				noddet._ModelManagerADMIN.origEntry.NoofChildnodes = noddet.NoofChildnodes;
				newnode._ModelManagerADMIN.origEntry.ADDCHDBTN = newnode.ADDCHDBTN;
				newnode._ModelManagerADMIN.origEntry.ITOTVALVIS0 = newnode.ITOTVALVIS0;
				newnode._ModelManagerADMIN.origEntry.ITOTVALVIS1 = newnode.ITOTVALVIS1;
				newnode._ModelManagerADMIN.origEntry.ITOTVALVIS2 = newnode.ITOTVALVIS2;
				newnode._ModelManagerADMIN.origEntry.ITOTVALVIS3 = newnode.ITOTVALVIS3;
				newnode._ModelManagerADMIN.origEntry.COMPAVG = newnode.COMPAVG;
				newnode._ModelManagerADMIN.origEntry.ACTN = newnode.ACTN;
				newnode._ModelManagerADMIN.origEntry.DELFLG = newnode.DELFLG;
				
				var cnodep = "/"+ (this._compnewr.getData().length);
				this._compnewr.setProperty(cnodep, newnode);
			} else {
				orgentry.ABS_QTY = "";
				orgentry.ACTN = this.speckey.ACTN;
				orgentry.ACTN_VP = "0";
				orgentry.ADDCHDBTN = true;
				orgentry.CHILD_KEY = "0";
				orgentry.COMPAVG = "0.0000";
				orgentry.COMPCAT = "COMPONENT";
				orgentry.COMPNAM = "Component";
				orgentry.COUNTRY_ORIG = "";
				orgentry.DELFLG = "";
				orgentry.ESTCAT = this.estcat;
				orgentry.EXP_LEVEL = 1;
				orgentry.IDENT1 = oData.IDENT_DESCR1;
				orgentry.ITEM_KEY = "";
				orgentry.ITOTVALVIS0 = true;
				orgentry.ITOTVALVIS1 = false;
				orgentry.ITOTVALVIS2 = false;
				orgentry.ITOTVALVIS3 = false;
				orgentry.NoofChildnodes = 0;
				orgentry.ORD = "0001";
				orgentry.PARENT_KEY = "0";
				orgentry.RECN = "";
				orgentry.RECNPARENT = "";
				orgentry.RECNROOT = this.speckey.RECNROOT;
				orgentry.RECN_VP = "";
				orgentry.ROW_KEY = "0000";
				orgentry.SORTNO = "0000";
				orgentry.SUBID = oData.SUBID;
				orgentry.UOM = "";
				
				ModelManagerADM.intStatus = ModelManagerIntStatus.Modified;
				ModelManagerADM.origEntry = orgentry;
				newnode._ModelManagerADMIN = ModelManagerADM;
			}
		}
			this._noddet= noddet;
			this._newnode = newnode;
		var oRequest = this._oComponent.getODataManager().requestForFetchitmkey();
		this._oComponent.getODataManager().executeRequest(oRequest,
			jQuery.proxy(this._fetchrecnsuccess, this));
		
	};
	MultilevelAdd.prototype._fetchrecnsuccess = function (Recnval) {
		
		var modo = this._acompsr.getData();
		this._newnode._ModelManagerADMIN.origEntry.ITEM_KEY = Recnval.results[0].ItemKey;
		this._newnode.ITEM_KEY = Recnval.results[0].ItemKey;
		
		if(this._noddet == null)
		{
			this._compnewr.setProperty("/0", this._newnode);
		}else
		{
			this._compnewr.setProperty(this._childnodepath, this._noddet);
		}
		
		modo.push(this._newnode);
		this._acompsr.setData(modo);

		this._acompsr.refresh();
		this._compnewr.refresh();

		var refval = 0,
			refstate = null;
		var refdat = this._compnewr.getData();
		for (var d = 0; d < refdat.length; d++) {
			if(refdat[d] != undefined)
			refval = refval + parseInt(refdat[d].COMPAVG);
		}
		if (refval < 100) {
			refstate = "Warning";
		} else {
			refstate = "Success";
		}
		refval = refval + "%";
		this._obref.setText(refval);
		this._obref.setState(refstate);
		this._oDialogadd.control.close();
		
	};
	MultilevelAdd.prototype._onSpecSearch = function (oEvent) {

		var aData = this._oDialogDialogModel.getProperty("/aData");
		var keydat = aData[0];
		keydat.ESTCAT=this.estcat;
		var oRequest = this._oComponent.getODataManager().requestForFetchMLCSpecValue(keydat);
		this._oComponent.getODataManager().executeRequest(oRequest,
			jQuery.proxy(this._fetchCharValueSuccess, this));
	};
	MultilevelAdd.prototype._fetchCharValueSuccess = function (aCharEntries) {

		this._Odiagrestab.setProperty("/aData", aCharEntries.entries);
		this._oDialogDialogModel.setProperty("/AdvSrchPanel1Expanded", false);
		this._oDialogDialogModel.setProperty("/AdvSrchPanel2Expanded", true);
	};
	return MultilevelAdd;
});