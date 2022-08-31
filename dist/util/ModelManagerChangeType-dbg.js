sap.ui.define([
], function() {
	"use strict";

	// Change event types:

	var ModelManagerChangeType = {
		Fetch:        "Fetch",       // Fetch, after save and reset
		Key:          "Key",         // After save: key change of EMPTY, NEW and MODIFIED entries
		Count:        "Count",       // Entry count changed: create, delete and before reload
		DeleteChange: "DeleteChange" // Entry delete flag has been changed
	};

	return ModelManagerChangeType;
});
