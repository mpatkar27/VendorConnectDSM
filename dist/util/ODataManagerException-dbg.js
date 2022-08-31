sap.ui.define([
], function() {
	"use strict";

	var ODataManagerException = function(sDetailKey, aArgs, oData) {
		this.detailKey = sDetailKey;
		this.args = aArgs ? aArgs : [];
		this.data = oData;
	};

	return ODataManagerException;
});
