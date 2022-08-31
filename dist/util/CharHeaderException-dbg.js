sap.ui.define([
], function() {
	"use strict";

	var CharHeaderException = function(sMessageKey, aArgs) {
		this.messageKey = sMessageKey;
		this.args = aArgs ? aArgs : [];
	};

	return CharHeaderException;
});
