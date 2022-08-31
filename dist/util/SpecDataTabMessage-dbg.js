// This tab is implementing the chat functionality.

sap.ui.define([
	"gramont/VCDSM/specedit/util/SpecDataTabBase",
	"gramont/VCDSM/specedit/util/ModelManagerAdmin",
	"gramont/VCDSM/specedit/util/ModelManagerAutoGrowOp",
	"gramont/VCDSM/specedit/util/ModelManagerIntStatus",
	"sap/ui/core/format/DateFormat",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (SpecDataTabBase, ModelManagerAdmin, ModelManagerAutoGrowOp,
	ModelManagerIntStatus, DateFormat, Filter, FilterOperator) {
	"use strict";

	var SpecDataTabMessage = function (oComponent, recnroot) {
		SpecDataTabBase.call(this, oComponent, "gramont.VCDSM.specedit.frag.SpecDataTabMessage");
		
		this._oComponent= oComponent;
		this._recnroot = recnroot;
		this.chattime = this._byId("chatTimeline");
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

		var oRequest = this._oComponent.getODataManager().requestForFetchChats(this._recnroot);
		this._oComponent.getODataManager().executeRequest(oRequest,
			jQuery.proxy(this._fetchdata, this));
	};

	SpecDataTabMessage.prototype = Object.create(SpecDataTabBase.prototype);
	SpecDataTabMessage.prototype.constructor = SpecDataTabMessage;

	SpecDataTabMessage.prototype._fetchdata = function (response) {

		var resp = response;
		for (var i = 0; i < resp.entries.length; i++) {
			resp.entries[i].status = "Unchanged";
			resp.entries[i].template = false;
			resp.entries[i].datetime = resp.entries[i].DATE + "  " + resp.entries[i].TIME;
		}
		resp.entries[resp.entries.length] = {
			RECNROOT: this._recnroot,
			CHAT: "",
			template: true,
			USER_NAME: "",
			DATE: "",
			TIME: "",
			CHAT_ID: "",
			PARENT_CHAT: ""
		};
		var oModeldoc = new sap.ui.model.json.JSONModel(resp.entries);
		this.chattime.setModel(oModeldoc);
	};
	SpecDataTabMessage.prototype._addcomment = function (oEvent) {
		var cnewnode = {
			RECNROOT: this._recnroot,
			CHAT: this._textcom,
			USER_NAME: "",
			DATE: "",
			TIME: "",
			CHAT_ID: "",
			PARENT_CHAT: ""
		};
		var oRequest = this._oComponent.getODataManager().requestForUpdateChats(cnewnode);
		this._oComponent.getODataManager().executeRequest(oRequest,
			jQuery.proxy(this._Success, this));
	};
	SpecDataTabMessage.prototype._formatDateTime = function (dateTime) {
		var oDateInstance = DateFormat.getDateInstance();
		return oDateInstance.format(oDateInstance.parse(dateTime));
	};
	SpecDataTabMessage.prototype._onChangeCom = function (oEvent) {
		this._textcom = oEvent.getSource().getValue();
	};
	SpecDataTabMessage.prototype._Success = function (response) {
		if (response.statusCode == 200) {
			sap.m.MessageToast.show(this._oComponent.getI18nBundle().getText("chagsavucc"));
			var oRequest = this._oComponent.getODataManager().requestForFetchChats(this._recnroot);
			this._oComponent.getODataManager().executeRequest(oRequest,
				jQuery.proxy(this._fetchdata, this));
		} else {
			sap.m.MessageToast.show(this._oComponent.getI18nBundle().getText("docvalid"));
		}
	};

	return SpecDataTabMessage;
});