/*
 * Doclink handling
 */
 
sap.ui.define([
	"sap/base/assert",
	"sap/m/library",
	"sap/m/Link",
	"gramont/VCDSM/specedit/util/CharEditDocLink",	
	"gramont/VCDSM/specedit/util/CharHeaderBase",
	"gramont/VCDSM/specedit/util/CharHeaderException"
], function(assert, sap_m_lib, Link, CharEditDocLink, CharHeaderBase, CharHeaderException) {
	"use strict";
	
	var FTEXT = "__FTEXT_";
	
	var CharHeaderDocLink = function(oComponent, oODataHeader) {
		CharHeaderBase.call(this, oComponent, oODataHeader);

		// EXT_CLASS
		oComponent.initClassExtension(this, "gramont.VCDSM.specedit.util.CharHeaderDocLink", arguments);

		this._bIsMultiValue = true; // Force multivalue -> editable only via edit dialog.
		
		if (this._sFieldName.indexOf(FTEXT) != 0) // startsWith
			throw new CharHeaderException("CharHeaderDocLink.error.invalidFieldName", [this._sFieldName]);

		this._sTextType = this._sFieldName.substr(FTEXT.length);
		
		this._sDocType = oODataHeader.DOKAR;
	};

	CharHeaderDocLink.prototype = Object.create(CharHeaderBase.prototype);
	CharHeaderDocLink.prototype.constructor = CharHeaderDocLink;
	
	CharHeaderDocLink.prototype.parseCharValues = function(oODataFieldEntry, oInstance) {
		// This method needs to be overridden, since the special nature of doclink.

		assert(oODataFieldEntry.FIELDNAME == this._sFieldName, "Fieldname mismatch");
		
		var sODataFieldEntryValue = oODataFieldEntry.FIELDVALUE;
		var oJSON = null;
		
		try {
			oJSON = JSON.parse(sODataFieldEntryValue);
		} catch (e) {
			if (!(e instanceof SyntaxError))
				throw e;
		}
		
		if (!oJSON)
			throw new CharHeaderException("CharHeaderDocLink.error.parse", [this._sFieldName]);
		
		var aCharValues = oJSON.DATA;
		if (jQuery.type(aCharValues) != "array")
			throw new CharHeaderException("CharHeaderDocLink.error.parse", [this._sFieldName]);
			
		// Store value into oInstance.

		oInstance[this._sFieldName] = aCharValues;

		// Store editable flag.

		this._storeEditable(oInstance, oODataFieldEntry.IS_EDITABLE);
	};
	
	CharHeaderDocLink.prototype.convertCharValues = function(oInstance) {
		return null;
	};
	
	CharHeaderDocLink.prototype.fetchValueHelperFirst = function() {
		return false;	
	};
	
	CharHeaderDocLink.prototype.getTextType = function() {
		return this._sTextType;
	};
	
	CharHeaderDocLink.prototype.getDocType = function() {
		return this._sDocType;	
	};
	
	CharHeaderDocLink.prototype.buildCharValues = function(aDocLinks) {
		var aCharValues = aDocLinks; // FIXME: type check?, length check?
		return aCharValues;
	};
	
	CharHeaderDocLink.prototype.openDoc = function(oDocKey) {
		// Open doc.
		
		var sURL = this._oComponent.getODataManager().getDocDownloadURL(oDocKey);
		sap_m_lib.URLHelper.redirect(sURL, true);
	};
	
	CharHeaderDocLink.prototype._createDisplayValueControlMultiTemplateImpl = function() {
		var oTemplate = new Link({
			text: {
				path: "FILENAME"
			},
			press: jQuery.proxy(this._onDocOpen, this)
		});
		
		return oTemplate;
	};

	CharHeaderDocLink.prototype._isEditButtonAlwaysEnabled = function() {
		return true;
	};
	
	CharHeaderDocLink.prototype._createEditDialog = function() {
		var oEditDialog = new CharEditDocLink(this._oComponent);
		return oEditDialog;
	};
	
	CharHeaderDocLink.prototype._onDocOpen = function(oEvent) {
		var oDocKey = oEvent.getSource().getBindingContext().getProperty();
		this.openDoc(oDocKey);
	};

	return CharHeaderDocLink;
});
