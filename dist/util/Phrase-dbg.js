// This is the controller which is implementing instance maintenance.

sap.ui.define([
	"sap/base/assert",
	"sap/m/Label",
	"sap/ui/model/json/JSONModel",
	"gramont/VCDSM/specedit/control/Column",
	"gramont/VCDSM/specedit/control/ColumnListItem",
	"gramont/VCDSM/specedit/util/TableManager",
	"gramont/VCDSM/specedit/util/PropBase"
], function(assert, Label, JSONModel, Column, ColumnListItem, TableManager, PropBase) {
	"use strict";

	var Phrase = function(oComponent, oTreeNode, oCollection, bEditable, udtprop) {//FIXMEVC:if bEditable is false, then make this propcontrol readonly.
		PropBase.call(this, oComponent, "gramont.VCDSM.specedit.frag.Phrase");

		// Setup prop model.//FIXMEVC:dup
		var msgstrp = this._byId("msgstrp");
		var data = oCollection.getModel().getData();
		var txt = data[0][0].Phrtext;
		msgstrp.setText(txt);
		
		};
	
	Phrase.prototype = Object.create(PropBase.prototype);
	Phrase.prototype.constructor = Phrase;
	
	Phrase.prototype._onCharEdit = function(oCollection, oCharHeader, oEvent) {//FIXMEVC:refactor
		var iInstanceIndex = oCollection.getEntryIndexOfControl(oEvent.getSource());
		var oInstance = oCollection.getEntry(iInstanceIndex);
		oCharHeader.openEdit(oInstance, jQuery.proxy(this._onCharEditStore, this, oCharHeader, iInstanceIndex, oCollection));
	};
	
	Phrase.prototype._onCharEditStore = function(oCharHeader, iInstanceIndex, oCollection, aCharValues, bNoUpdate) { // FIXMEVC: refactor
		oCollection.setFieldValue(iInstanceIndex, oCharHeader.getFieldName(), aCharValues, bNoUpdate);
	};
	
	return Phrase;
});
