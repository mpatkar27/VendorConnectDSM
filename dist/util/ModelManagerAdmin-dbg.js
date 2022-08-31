sap.ui.define([
], function() {
	"use strict";

	// Administrative properties:

	var PREFIX = "_ModelManagerADMIN";

	var oPropNames = {
		Error:           "error",
		ErrorMessage:    "errorMessage",
		Deleted:         "deleted",
		Field:           "field",
		IntStatus:       "intStatus",
		AutoGrowEntry:   "autoGrowEntry",
		AutoGrowVisible: "autoGrowVisible",
		OrigEntry:       "origEntry",
		ForceReset:      "forceReset"
	};

	var oFullPropNames = {};

	for (var sPropName in oPropNames)
		oFullPropNames[sPropName] = PREFIX + "/" + oPropNames[sPropName];

	var ModelManagerAdmin = {
		Prefix: PREFIX,
		PropName: oPropNames,
		FullPropName: oFullPropNames
	};

	return ModelManagerAdmin;
});
