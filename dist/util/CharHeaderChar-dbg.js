/*
 * Character characteristic handling
 */

sap.ui.define([
	"gramont/VCDSM/specedit/util/CharHeaderBasic"
], function(CharHeaderBasic) {
	"use strict";

	var CharHeaderChar = function(oComponent, oODataHeader) {
		CharHeaderBasic.call(this, oComponent, oODataHeader);

		// EXT_CLASS
		oComponent.initClassExtension(this, "gramont.VCDSM.specedit.util.CharHeaderChar", arguments);
	};

	CharHeaderChar.prototype = Object.create(CharHeaderBasic.prototype);
	CharHeaderChar.prototype.constructor = CharHeaderChar;
	
	CharHeaderChar.prototype.getCharValues = function(oInstance) {
		// Called from PLMModelManager.

		var aCharValues = oInstance[this._sFieldName];
		return aCharValues;
	};

	CharHeaderChar.prototype.setCharValues = function(oInstance, aCharValues) {
		// Called from PLMModelManager.
		
		oInstance[this._sFieldName] = aCharValues; // FIXME type check?, length check?
	};
	
	return CharHeaderChar;
});
