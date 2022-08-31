// This tab is implementing the attachment maintenance.

sap.ui.define([
	"gramont/VCDSM/specedit/util/SpecDataTabBase",
	"sap/m/library",
	"sap/m/Link",
	"gramont/VCDSM/specedit/util/ModelManagerAdmin",
	"gramont/VCDSM/specedit/util/ModelManagerAutoGrowOp",
	"gramont/VCDSM/specedit/util/ModelManagerIntStatus",
	"gramont/VCDSM/specedit/util/AttachmentDialog",
	"sap/base/assert",
], function (SpecDataTabBase, sap_m_lib, Link, ModelManagerAdmin, ModelManagerAutoGrowOp,
	ModelManagerIntStatus, AttachmentDialog, assert) {
	"use strict";

	var SpecDataTabAttachment = function (oComponent, instkey) {
		SpecDataTabBase.call(this, oComponent, "gramont.VCDSM.specedit.frag.SpecDataTabAttachment");

		this._instkey = instkey;
		this._oComponent = oComponent;
		// this._ocollection = collection;
		var columnListItem = new sap.m.ColumnListItem();

		var atttab = this._byId("attachmenttable");
		var upldbtn = this._byId("upldbtn");
		var oHeaderColumnHeader = null;
		var oHeaderColumn = null;
		var _onChange = function (oEvent) {
			// This function is called when a field has been changed
			// by user.
			var aPathComps = oEvent.getSource().getBindingContext().getPath().split("/");
			assert(aPathComps.length == 2 &&
				aPathComps[0] == "", "Control should have absolute binding context path");
			this._oevent = oEvent;
			var iIndex = parseInt(aPathComps[1]);

			var omod = oEvent.getSource().getModel();

			var iLength = omod.getData().length;

			var sBindingPath = "/" + iIndex + "/status";
			var sIntStatus = omod.getProperty(sBindingPath);
			// Entry state transition on field value change:
			// - EMPTY     -> NEW
			// - UNCHANGED -> MODIFIED
			// - MODIFIED  -> MODIFIED (no change)
			// - NEW       -> NEW      (no change)

			var sNewIntStatus = null;

			switch (sIntStatus) {
			case ModelManagerIntStatus.Empty:
				sNewIntStatus = ModelManagerIntStatus.New;
				break;

			case ModelManagerIntStatus.Unchanged:
				sNewIntStatus = ModelManagerIntStatus.Modified;
				break;
			}

			if (sNewIntStatus != null)
				omod.setProperty(sBindingPath, sNewIntStatus);
		};
		var _onUploadStart = function (oEvent) {
			var aReqHeaders = oEvent.getParameter("requestHeaders");
			this._event = oEvent;
			var oFilenameReqHeader = {
				name: "slug",
				value: oEvent.getParameter("fileName") // FIXME: nicer way of passing doctype?
			};
			aReqHeaders.push(oFilenameReqHeader);

			var oAcceptReqHeader = {
				name: "Accept",
				value: "application/json"
			};
			aReqHeaders.push(oAcceptReqHeader);
			var oSecurityTokenReqHeader = {
				name: "x-csrf-token",
				value: oComponent.getODataManager().getSecurityToken()
			};
			aReqHeaders.push(oSecurityTokenReqHeader);

			oComponent.getNavigator().requireBusyDialog();
		};
		var handleUploadComplete = function (oEvent) {
			oComponent.getNavigator().releaseBusyDialog();

			var iStatus = oEvent.getParameter("status");
			var sRawResponse = oEvent.getParameter("responseRaw");
			var sFilename = oEvent.getParameter("fileName");

			oComponent.getODataManager().parseRawResponse(iStatus, sRawResponse, "CharEditDocLink.error.upload", jQuery.proxy(
				_onUploadCompleteSuccess,
				this, sFilename));

		};

		var _onUploadCompleteSuccess = function (sFilename, oData) {
			// Create doclink.
			var oEvent = this._oevent;
			// var sTextType = this._oCharHeader.getTextType();
			var aPathComps = oEvent.getSource().getBindingContext().getPath().split("/");
			assert(aPathComps.length == 2 &&
				aPathComps[0] == "", "Control should have absolute binding context path");
			var iIndex = parseInt(aPathComps[1]);
			var omod = oEvent.getSource().getModel();

			var sBindingPath0 = "/" + iIndex + "/DOKAR";
			var sBindingPath1 = "/" + iIndex + "/DOKNR";
			var sBindingPath2 = "/" + iIndex + "/DOKVR";
			var sBindingPath3 = "/" + iIndex + "/DOKTL";
			var sBindingPath4 = "/" + iIndex + "/FILENAME";
			omod.setProperty(sBindingPath0, oData.DOKAR);
			omod.setProperty(sBindingPath1, oData.DOKNR);
			omod.setProperty(sBindingPath2, oData.DOKVR);
			omod.setProperty(sBindingPath3, oData.DOKTL);
			omod.setProperty(sBindingPath4, sFilename);
		};
		var _docopen = function (oEvent) {
			var oDocKey = oEvent.getSource().getBindingContext().getProperty();
			var sURL = oComponent.getODataManager().getDocDownloadURL(oDocKey);
			sap_m_lib.URLHelper.redirect(sURL, true);
		};
		var _opendialog = function (oEvent) {
			var attachdiaolog = new AttachmentDialog(oComponent, oEvent.getSource().getModel(), atttab);
		};
		upldbtn.attachPress(_opendialog);
		var upldURL = this._oComponent.getODataManager().getDocUploadURL();
		for (var k = 0; k < 5; k++) {
			if (k == 0) {
				oHeaderColumnHeader = new sap.m.Label({});
				oHeaderColumnHeader.setText(this._oComponent.getI18nBundle().getText("reqfilat"));
				oHeaderColumn = new sap.m.Column({
					header: oHeaderColumnHeader,
					mergeDuplicates: true
				});
			} else if (k == 1) {
				oHeaderColumnHeader = new sap.m.Label({});
				oHeaderColumnHeader.setText(this._oComponent.getI18nBundle().getText("fildesc"));
				oHeaderColumn = new sap.m.Column({
					header: oHeaderColumnHeader
				});
			} else if (k == 2) {
				oHeaderColumnHeader = new sap.m.Label({});
				oHeaderColumnHeader.setText(this._oComponent.getI18nBundle().getText("docvalid"));
				oHeaderColumn = new sap.m.Column({
					header: oHeaderColumnHeader
				});
			} else if (k == 3) {
				oHeaderColumnHeader = new sap.m.Label({});
				oHeaderColumnHeader.setText("");
				oHeaderColumn = new sap.m.Column({
					header: oHeaderColumnHeader
				});
			} else {
				oHeaderColumnHeader = new sap.ui.core.Icon({
					src: "sap-icon://delete"
				});
				oHeaderColumn = new sap.m.Column({
					header: oHeaderColumnHeader
				});
			}

			atttab.addColumn(oHeaderColumn);
		}

		columnListItem.addCell(new sap.m.Label({

			text: "{IDENT1}" // enter the odata column of the description where we get the text
		}));

		columnListItem.addCell(new sap.m.Label({
			text: "{FILEDESC}"
		}));

		columnListItem.addCell(new sap.m.DatePicker({
			change: _onChange
		}));

		columnListItem.addCell(new sap.m.Link({
			text: "{FILENAME}",
			press: _docopen
		}));
		columnListItem.addCell(new sap.m.CheckBox({
			selected: "{LOEDK}",
			select: _onChange
		}));
		atttab.bindItems("/", columnListItem, null, null);

		var oRequest = this._oComponent.getODataManager().requestForFetchDocLink(instkey);
		this._oComponent.getODataManager().executeRequest(oRequest,
			jQuery.proxy(this._fetchdata, this));
	};
	SpecDataTabAttachment.prototype = Object.create(SpecDataTabBase.prototype);
	SpecDataTabAttachment.prototype.constructor = SpecDataTabAttachment;

	SpecDataTabAttachment.prototype.addProp = function (oCollection) {
		var fConstructor = null;
		var atttab = this._byId("attachmenttable");
		this.collection = oCollection;
		if (oCollection != null) {
			this._docdata = oCollection.getModel().getData();
			var oModeldoc = new sap.ui.model.json.JSONModel(this._docdata);
			atttab.setModel(oModeldoc);
		}
	};

	SpecDataTabAttachment.prototype._onSave = function (oCollection) {
		var atttab = this._byId("attachmenttable");
		var fdata = atttab.getModel().getData();
		for (var h = 0; h < fdata.length; h++) {
			var docdat = fdata[h];
			if (docdat.status == "Modified") {
				var oRequest = this._oComponent.getODataManager().requestForUpdatedoclink(docdat);
				this._oComponent.getODataManager().executeRequest(oRequest,
					jQuery.proxy(this._Success, this));
			}
		}

	};

	SpecDataTabAttachment.prototype._Success = function (response) {
		var resp = response;
		if (resp.statusCode == 200) {
			sap.m.MessageToast.show(this._oComponent.getI18nBundle().getText("chagsavucc"));
			var oRequest = this._oComponent.getODataManager().requestForFetchDocLink(this._instkey);
			this._oComponent.getODataManager().executeRequest(oRequest,
				jQuery.proxy(this._fetchdata, this));
		} else {
			sap.m.MessageToast.show(this._oComponent.getI18nBundle().getText("docvalid"));
		}
	};
	SpecDataTabAttachment.prototype._fetchdata = function (response) {

		var atttab = this._byId("attachmenttable");
		var resp = response;
		for (var i = 0; i < resp.entries.length; i++) {
			resp.entries[i].status = "Unchanged";
		}
		var oModeldoc = new sap.ui.model.json.JSONModel(resp.entries);
		atttab.setModel(oModeldoc);
	};
	return SpecDataTabAttachment;
});