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

	var LangValueHelp = function (oComponent, otreenode, udtmod, oldudt, srcfield) {
		SpecDataTabBase.call(this, oComponent, "gramont.VCDSM.specedit.frag.LangValueHelp");

		this._oComponent = oComponent;
		this._treenode = otreenode;
		this.patharr = [];
		this._oDialogadd = oComponent.getNavigator().createFragment("gramont.VCDSM.specedit.frag.LangValueHelp", this); //FIXME:parentcontrol
		this._udtmod = udtmod;
		this._oldudt = oldudt;
		this._Odiagrestab = new JSONModel();
		this._srcfield= srcfield;
		
		this._oDialogadd.control.setModel(this._Odiagrestab);
		this._oDialogadd.control.open();

		var oRequest = this._oComponent.getODataManager().requestForFetchLanguage();
		this._oComponent.getODataManager().executeRequest(oRequest,
			jQuery.proxy(this._FetchLanguageSuccess, this));

	};
	LangValueHelp.prototype = Object.create(SpecDataTabBase.prototype);
	LangValueHelp.prototype.constructor = LangValueHelp;

	LangValueHelp.prototype._onCloseusag = function () {

		this._oDialogadd.control.close();

	};
	LangValueHelp.prototype._onok = function (oEvent) {
		
		var selkey = oEvent.getSource().getSelectedKey();
		var aPathComps = this._srcfield.getBindingContext().getPath().split("/");
		assert(aPathComps.length == 2 &&
			aPathComps[0] == "", "Control should have absolute binding context path");
		var iIndex = parseInt(aPathComps[1]);
		var omod = this._srcfield.getModel();
		var iLength = omod.getData().length;
		
		var ValBindPath = "/" + iIndex + "/LANGU";
		omod.setProperty(ValBindPath, selkey);
		
		var sBindingPath = "/" + iIndex + "/" + ModelManagerAdmin.FullPropName.IntStatus;
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
			
			this._oDialogadd.control.close();
	};
	LangValueHelp.prototype._FetchLanguageSuccess = function (aCharEntries) {

		this._usagecollection = aCharEntries.entries;
		for (var i = 0; i < aCharEntries.entries.length; i++) {
			aCharEntries.entries[i].Selected = false;
		}
		this._Odiagrestab.setProperty("/", aCharEntries.entries);
		this._modtab = this._Odiagrestab;
	};
	return LangValueHelp;
});