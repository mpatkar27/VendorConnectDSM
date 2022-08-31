// This tab is implementing the property tree (instance, composition, etc.) maintenance functions.

sap.ui.define([
	"sap/base/assert",
	"sap/ui/model/json/JSONModel",
	"gramont/VCDSM/specedit/util/CompType",
	"gramont/VCDSM/specedit/util/PropInstance",
	"gramont/VCDSM/specedit/util/PropMode",
	"gramont/VCDSM/specedit/util/PropMultiComposition",
	"gramont/VCDSM/specedit/util/PropQual",
	"gramont/VCDSM/specedit/util/PropQuant",
	"gramont/VCDSM/specedit/util/Phrase",
	"gramont/VCDSM/specedit/util/SpecDataTabBase"
], function (assert, JSONModel, CompType, PropInstance, PropMode, PropMultiComposition, PropQual, PropQuant, Phrase, SpecDataTabBase) {
	"use strict";

	var SpecDataTabProp = function (oComponent, bEditable) {
		SpecDataTabBase.call(this, oComponent, "gramont.VCDSM.specedit.frag.SpecDataTabProp");

		this._bEditable = bEditable;

		// Setup tab model.

		this._oTabModel = new JSONModel();

		var oTab = this.getControl();
		oTab.setModel(this._oTabModel, "tabModel");

		var sTitle = this._getOwnerComponent().getI18nBundle().getText(this._bEditable ? "SpecDataTabProp.title.editable" :
			"SpecDataTabProp.title.nonEditable");

		//test
		if (sTitle == "Prerequisites") {
			this._oTabModel.setProperty("/title", sTitle);
			oTab.setProperty("text", sTitle);
			oTab.setProperty("key", "prereq");
			oTab.setProperty("icon", "sap-icon://form");
			// this.byId("tlb2").setVisible(false);
		} else {
			this._oTabModel.setProperty("/title", sTitle);
			oTab.setProperty("text", sTitle);
			oTab.setProperty("icon", "sap-icon://request");
			oTab.setProperty("key", "maintain");
			// this.byId("tlb2").setVisible(true);
			// var ovrtlbr= new sap.m.OverflowToolbar({
			// 	id:"tlb2"
			// });
			// var oHelpButton = new sap.m.Button({
			//          icon : "sap-icon://question-mark",
			//          text: "Help",
			//          press:this.onClickHelpButton.bind(this)
			//      });
			oTab.addContent();
		}
		//test

		// Initialize property controls.

		this._aPropControls = [];
	};

	SpecDataTabProp.prototype = Object.create(SpecDataTabBase.prototype);
	SpecDataTabProp.prototype.constructor = SpecDataTabProp;

	SpecDataTabProp.prototype.onBeforeShow = function () {
		// Remove all controls.

		for (var i = 0; i < this._aPropControls.length; i++) {
			var oPropControl = this._aPropControls[i];
			oPropControl.destroy();
		}
		var oTab = this.getControl();
		oTab.removeAllContent();
		this._aPropControls = [];
	};

	SpecDataTabProp.prototype.addProp = function (sPropMode, oTreeNode, oInstanceInfo, oCollection, udtprop, secndrn, speckey, estcat,
		udtinst,layout, proplist, oPropInfo, propindex) {
		var fConstructor = null;

		switch (sPropMode) {
		case PropMode.Instance:
			fConstructor = PropInstance;
			break;

		case PropMode.Composition:
			switch (oInstanceInfo.COMP_TYPE) {
			case CompType.Qual:
				fConstructor = PropQual;
				break;

			case CompType.MultiComp:
				fConstructor = PropMultiComposition;
				break;

			case CompType.Quant:
				fConstructor = PropQuant;
				break;

			case CompType.Phrase:
				fConstructor = Phrase;
				break;

			default:
				assert(false, "COMP_TYPE is unknown");
			}
			break;

		default:
			assert(false, "sPropMode is unknown");
		}

		assert(fConstructor, "fConstructor should be set");
		if (fConstructor == PropMultiComposition) {
			var oPropControl = new fConstructor(this._getOwnerComponent(), oTreeNode, oCollection, this._bEditable, udtprop, speckey, estcat, proplist, oPropInfo, propindex);
		} else if (fConstructor == PropInstance) {
			var oPropControl = new fConstructor(this._getOwnerComponent(), oTreeNode, oCollection, this._bEditable, udtprop, udtinst,layout, proplist, oPropInfo, propindex);
		} else {
			var oPropControl = new fConstructor(this._getOwnerComponent(), oTreeNode, oCollection, this._bEditable, udtprop, udtinst, proplist, oPropInfo, propindex);
		}
		if (!secndrn) {
			this._aPropControls.push(oPropControl);

			var oTab = this.getControl();
			oTab.addContent(oPropControl.getControl());
		} else {

			for (var i = 0; i < this._aPropControls.length; i++) {
				if (this._aPropControls[i].estcat == estcat) {
					this._aPropControls.splice(i, 1);
					i--;
				}
			}
			this._aPropControls.push(oPropControl);
			var oTab = this.getControl();
			var otabcont = oTab.getContent();
			for (var j = 0; j < otabcont.length; j++) {
				try {
					var htext = otabcont[j].getHeaderText();
					var htextprop = oPropControl.getControl().getHeaderText();
				} catch (e) {
					var htext = 0;
				};
				if (htext != 0) {
					if (otabcont[j].getHeaderText() == oPropControl.getControl().getHeaderText()) {
						oTab.removeContent(j);
						otabcont.splice(j, 1);
						j--;
					}
				}

			}
			oTab.addContent(oPropControl.getControl());

		}

	};

	return SpecDataTabProp;
});