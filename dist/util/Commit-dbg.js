// This tab is implementing the attachment maintenance.

sap.ui.define([
	"gramont/VCDSM/specedit/util/SpecDataTabBase",
	"sap/m/library",
	"sap/m/Link",
	"gramont/VCDSM/specedit/util/SpecDataTabAttachment",
	"sap/ui/model/json/JSONModel",
	"sap/base/assert",
], function (SpecDataTabBase, sap_m_lib, Link, SpecDataTabAttachment, JSONModel, assert) {
	"use strict";

	var Commit = function (oComponent) {
		SpecDataTabBase.call(this, oComponent, "gramont.VCDSM.specedit.frag.Commit");
		this._oComponent = oComponent;
		this._oDialog = oComponent.getNavigator().createFragment("gramont.VCDSM.specedit.frag.Commit", this); //FIXME:parentcontrol
		this._oDialogDialogModel = new JSONModel();
		this._oDialog.control.setModel(this._oDialogDialogModel, "dialogModel");
		this._oDialog.control.open();
	};
	Commit.prototype = Object.create(SpecDataTabBase.prototype);
	Commit.prototype.constructor = Commit;

	Commit.prototype._onClose = function () {
		this._oDialog.control.close();
	};
	Commit.prototype._onlgn = function (oEvent6) {
		this._oDialog.control.close();
	};

	return Commit;
});