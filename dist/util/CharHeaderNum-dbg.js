/*
 * Numeric characteristic handling
 */

sap.ui.define([
	"gramont/VCDSM/specedit/util/CharHeaderBasic"
], function(CharHeaderBasic) {
	"use strict";

	var CharHeaderNum = function(oComponent, oODataHeader) {
		CharHeaderBasic.call(this, oComponent, oODataHeader);

		// EXT_CLASS
		oComponent.initClassExtension(this, "gramont.VCDSM.specedit.util.CharHeaderNum", arguments);
	};

	CharHeaderNum.prototype = Object.create(CharHeaderBasic.prototype);
	CharHeaderNum.prototype.constructor = CharHeaderNum;

	return CharHeaderNum;
});
