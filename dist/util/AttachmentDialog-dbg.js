// This tab is implementing the attachment maintenance.

sap.ui.define([
	"gramont/VCDSM/specedit/util/SpecDataTabBase",
	"sap/m/library",
	"sap/m/Link",
	"gramont/VCDSM/specedit/util/SpecDataTabAttachment",
	"gramont/VCDSM/specedit/util/ModelManagerAdmin",
	"gramont/VCDSM/specedit/util/ModelManagerAutoGrowOp",
	"gramont/VCDSM/specedit/util/ModelManagerIntStatus",
	"sap/ui/model/json/JSONModel",
	"sap/base/assert",
], function (SpecDataTabBase, sap_m_lib, Link, SpecDataTabAttachment, ModelManagerAdmin, ModelManagerAutoGrowOp,
	ModelManagerIntStatus, JSONModel, assert) {
	"use strict";

	var AttachmentDialog = function (oComponent, collection, attachtab) {
		SpecDataTabBase.call(this, oComponent, "gramont.VCDSM.specedit.frag.AttachmentDialog");
		this._atttab = attachtab;
		this._oComponent = oComponent;
		this._collection = collection;
		this._oDialog = oComponent.getNavigator().createFragment("gramont.VCDSM.specedit.frag.AttachmentDialog", this); //FIXME:parentcontrol
		this._oDialogDialogModel = new JSONModel();
		this._oDialog.control.setModel(this._oDialogDialogModel, "dialogModel");
		var self = this._oDialog.byId("selectfsub");

		this._subtxt = null;
		this._subky = null;
		this._desc = null;
		this._evef = null;
		this._dat = null;
		var upldURL = this._oComponent.getODataManager().getDocUploadURL();
		this._upldr = this._oDialog.byId("uploaderd");
		this._upldr.setUploadUrl(upldURL);

		this._omod = new JSONModel();
		self.setModel(this._omod);
		var data = collection.getData();

		var selectdata = [],
			j = 0,
			initdat = [];
		for (var m = 0; m < data.length; m++) {
			if (m != 0) {
				if (data[m].SUBID != data[m - 1].SUBID) {
					initdat["SUBID"] = data[m].SUBID;
					initdat["IDENT1"] = data[m].IDENT1;
					selectdata[j] = jQuery.extend({}, initdat);
					j++;
				}
			} else {
				initdat["SUBID"] = data[m].SUBID;
				initdat["IDENT1"] = data[m].IDENT1;
				selectdata[j] = jQuery.extend({}, initdat);
				j++;
			}
		}
		this._omod.setData(selectdata);
		this._oDialog.control.open();
	};
	AttachmentDialog.prototype = Object.create(SpecDataTabBase.prototype);
	AttachmentDialog.prototype.constructor = AttachmentDialog;

	AttachmentDialog.prototype._onupld = function () {

		this._subtxt = this._oDialog.byId("selectfsub")._getSelectedItemText();
		this._subky = this._oDialog.byId("selectfsub").getSelectedKey();
		this._desc = this._oDialog.byId("inpdesc").getValue();
		this._upldr = this._oDialog.byId("uploaderd");
		var slugval = this._upldr.getValue() + "/" + this._desc;
		var headerParam = new sap.ui.unified.FileUploaderParameter();
		var headerParam1 = new sap.ui.unified.FileUploaderParameter();
		var headerParam2 = new sap.ui.unified.FileUploaderParameter();

		headerParam.setName("slug");
		headerParam.setValue(slugval);

		headerParam1.setName("Accept");
		headerParam1.setValue("application/json");

		headerParam2.setName("x-csrf-token");
		headerParam2.setValue(this._oComponent.getODataManager().getSecurityToken());

		this._upldr.addHeaderParameter(headerParam);
		this._upldr.addHeaderParameter(headerParam1);
		this._upldr.addHeaderParameter(headerParam2);
		this._upldr.upload();
		this._oComponent.getNavigator().requireBusyDialog();
	};
	AttachmentDialog.prototype._onClose = function () {
		this._oDialog.control.close();
	};
	AttachmentDialog.prototype._onUploadComplete = function (oEvent2) {
		this._oComponent.getNavigator().releaseBusyDialog();

		var iStatus = oEvent2.getParameter("status");
		var sRawResponse = oEvent2.getParameter("responseRaw");
		var sFilename = oEvent2.getParameter("fileName");
		this._oComponent.getODataManager().parseRawResponse(iStatus, sRawResponse, "CharEditDocLink.error.upload", jQuery.proxy(this._onUploadCompleteSuccess,
			this, sFilename));

	};
	AttachmentDialog.prototype._onUploadCompleteSuccess = function (sFilename, oData) {
		// Create doclink.
		var oEvent = this._oevent;
		var iLength = this._collection.getData().length;

		var dataf = this._collection.getData();
		for (var l = 0; l < dataf.length; l++) {
			if (dataf[l].SUBID == this._subky) {
				var propdataf = jQuery.extend(true, {}, dataf[l]);
			}
		}

		propdataf.SUBID = this._subky;
		propdataf.IDENT1 = this._subtxt;
		propdataf.FILEDESC = this._desc;
		propdataf.DOKAR = oData.DOKAR;
		propdataf.DOKNR = oData.DOKNR;
		propdataf.DOKVR = oData.DOKVR;
		propdataf.DOKTL = oData.DOKTL;
		propdataf.FILENAME = sFilename;
		propdataf.LOEDK = false;
		propdataf.status = ModelManagerIntStatus.Modified;

		dataf[iLength] = jQuery.extend({}, propdataf);

		dataf.sort(function (a, b) {
			if (a.SUBID === b.SUBID) return 0;
			return a.SUBID > b.SUBID ? 1 : -1;
		});
		this._collection.setData(dataf);
		this._atttab.setModel(this._collection);
		this._oDialog.control.close();
	};
	AttachmentDialog.prototype._docopen = function (oEvent3) {
		var oDocKey = oEvent3.getSource().getBindingContext().getProperty();
		var sURL = this._oComponent.getODataManager().getDocDownloadURL(oDocKey);
		sap_m_lib.URLHelper.redirect(sURL, true);
		// this._oCharHeader.openDoc(oDocKey);
	};
	AttachmentDialog.prototype._onChangesel = function (oEvent4) {
		this._subtxt = oEvent4.getSource()._getSelectedItemText();
		this._subky = oEvent4.getSource().getSelectedKey();
	};
	AttachmentDialog.prototype._onChangedat = function (oEventd) {
		this._dat = oEventd.getSource().getValue();
	};
	AttachmentDialog.prototype._onChange = function (oEvent) {

	};
	AttachmentDialog.prototype._onChangedes = function (oEvent6) {
		this._desc = oEvent6.getSource().getValue();
	};

	return AttachmentDialog;
});