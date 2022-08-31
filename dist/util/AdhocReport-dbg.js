sap.ui.define([
	"sap/base/assert",
	"sap/m/library",
	"sap/ui/model/json/JSONModel",
	"gramont/VCDSM/specedit/util/ValueHelperDialog"
], function(assert, sap_m_lib, JSONModel, ValueHelperDialog) {
	"use strict";

	var AdhocReport = function(oComponent, oParentControl) {
		// EXT_CLASS
		oComponent.initClassExtension(this, "gramont.VCDSM.specedit.util.AdhocReport", arguments);

		this._oComponent = oComponent;

		// Construct dialog.

		this._oDialog = this._oComponent.getNavigator().createFragment("gramont.VCDSM.specedit.frag.AdhocReport", this, oParentControl);

		var oForm = this._oDialog.byId("form");
		this._oDialogFormModel = new JSONModel();
		oForm.setModel(this._oDialogFormModel);

		// Setup value helper parameters.

		this._oValueHelperPropMaps = {
				"LDEPID": {"LDEPID": {property: "LDEPID"}},
				"LANGU": {"LANGU": {property: "SPRAS"}}
		};
	};

	AdhocReport.prototype.open = function(oSpecificationKey) {
		// Prepare model.

		var sLanguage = this._oComponent.getConfig().language;

		var oFormData = {
				RECNROOT: oSpecificationKey.RECNROOT,
				ACTN: oSpecificationKey.ACTN,
				LDEPID: "",
				STATUS_CHK_IND: false,
				LANGU: sLanguage,
				KEY_DATE: this._getKeyDate()
		};

		// EXT_HOOK: _extHookOpen
		// Executed when the user wants to open Ad-Hoc Report dialog.

		if (this._extHookOpen)
			this._extHookOpen(oFormData);
		else
			this._open(oFormData);
	};

	AdhocReport.prototype._open = function(oFormData) {
		// Setup model.

		this._oDialogFormModel.setData(oFormData);

		// Open dialog.

		assert(!this._oDialog.control.isOpen(), "oDialog should be closed");
		this._oDialog.control.open();
	};

	AdhocReport.prototype._close = function() {
		this._oDialog.control.close();
	};

	AdhocReport.prototype._fetchReportURL = function() {
		var oAdhocReportKey = this._oDialogFormModel.getData();
		var oRequest = this._oComponent.getODataManager().requestForFetchAdhocReportURL(oAdhocReportKey);
		this._oComponent.getODataManager().executeRequest(oRequest,
				jQuery.proxy(this._fetchReportURLSuccess, this));
	};

	AdhocReport.prototype._fetchReportURLSuccess = function(sURL) {
		this._close();

		// Open report.

		sap_m_lib.URLHelper.redirect(sURL, true);
	};

	AdhocReport.prototype._getKeyDate = function() {
		var oKeyDate = new Date();
		oKeyDate.setHours(0);
		oKeyDate.setMinutes(0);
		oKeyDate.setSeconds(0);

		return oKeyDate;
	};

	AdhocReport.prototype._resetKeyDate = function() {
		this._oDialogFormModel.setProperty("/KEY_DATE", this._getKeyDate());
	};

	AdhocReport.prototype._onValueHelpRequest = function(oEvent) {
		ValueHelperDialog.openDialog(this._oComponent,
				"AdhocReport",
				this._oValueHelperPropMaps,
				null,
				oEvent.getSource());
	};

	AdhocReport.prototype._onKeyDateChange = function() {
		// If date is empty, then reset it.

		var oKeyDate = this._oDialogFormModel.getProperty("/KEY_DATE");
		if (!oKeyDate)
			this._resetKeyDate();
	};

	AdhocReport.prototype._onKeyDateParseError = function() {
		// On parse error, reset date.

		this._resetKeyDate();
	};

	AdhocReport.prototype._onOK = function() {
		this._fetchReportURL();
	};

	AdhocReport.prototype._onCancel = function() {
		this._close();
	};

	return AdhocReport;
});
