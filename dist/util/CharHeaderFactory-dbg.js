sap.ui.define([
	"sap/base/assert",
	"gramont/VCDSM/specedit/util/CharHeaderChar",
	"gramont/VCDSM/specedit/util/CharHeaderCharPhrase",
	"gramont/VCDSM/specedit/util/CharHeaderCurr",
	"gramont/VCDSM/specedit/util/CharHeaderDate",
	"gramont/VCDSM/specedit/util/CharHeaderDocLink",
	"gramont/VCDSM/specedit/util/CharHeaderException",
	"gramont/VCDSM/specedit/util/CharHeaderNum",
	"gramont/VCDSM/specedit/util/CharHeaderTime",
	"gramont/VCDSM/specedit/util/CharHeaderUserDefinedText"
], function(assert, CharHeaderChar, CharHeaderCharPhrase, CharHeaderCurr, CharHeaderDate, CharHeaderDocLink, CharHeaderException, CharHeaderNum, CharHeaderTime, CharHeaderUserDefinedText) {
	"use strict";

	var CharHeaderFactory = function(oComponent) {
		// EXT_CLASS
		oComponent.initClassExtension(this, "gramont.VCDSM.specedit.util.CharHeaderFactory", arguments);

		this._oComponent = oComponent;
	};

	CharHeaderFactory.prototype.create = function(oODataHeader) {
		// Create characteristic header, based on characteristic type.

		var oCharHeader = null;

		// EXT_HOOK: _extHookCreate
		// Executed during CharHeader object construction.

		if (this._extHookCreate)
			oCharHeader = this._extHookCreate(this._oComponent, oODataHeader);

		if (!oCharHeader) {
			var fCharHeaderConstructor = null;

			switch (oODataHeader.TYPE) { // Transformed ATFOR.
			case "":
			case "CHAR":
				fCharHeaderConstructor = CharHeaderChar;
				break;

			case "CURR":
				fCharHeaderConstructor = CharHeaderCurr;
				break;

			case "NUM":
				fCharHeaderConstructor = CharHeaderNum;
				break;

			case "DATE":
				fCharHeaderConstructor = CharHeaderDate;
				break;

			case "TIME":
				fCharHeaderConstructor = CharHeaderTime;
				break;

			case "CHAR_PHRASE":
				fCharHeaderConstructor = CharHeaderCharPhrase;
				break;

			case "FTEXT":
				fCharHeaderConstructor = CharHeaderUserDefinedText;
				break;
				
			case "DOCLINK":
				fCharHeaderConstructor = CharHeaderDocLink;
				break;
				
			default:
				throw new CharHeaderException("CharHeaderFactory.error.unknownCharType", [oODataHeader.TYPE, oODataHeader.ATNAM]);
			}

			assert(fCharHeaderConstructor, "fCharHeaderConstructor should be set");
			oCharHeader = new fCharHeaderConstructor(this._oComponent, oODataHeader);
		}

		return oCharHeader;
	};

	return CharHeaderFactory;
});
