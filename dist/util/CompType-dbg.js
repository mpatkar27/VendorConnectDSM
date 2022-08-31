sap.ui.define([
], function() {
	"use strict";
	
	var CompType = {
		Qual: "QUAL",          // Qualitative composition (e.g. allergen)
		MultiComp: "MLVL_COMP", // Multi-level composition
		Quant: "QUANT",
		Phrase:"Phrase",
		DocLink:"DocLink",
		UserDefinedText: "UserDefinedText"
	};
	
	return CompType;
});
