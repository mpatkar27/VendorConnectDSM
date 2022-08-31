/*
 * In ESM, fragment controllers are built as standalone classes, and not
 * by inheriting sap.ui.core.Control. Detecting of destroy events can
 * be done by putting DestroyListener into "dependents" aggregation
 * of the parent control.
 */

sap.ui.define([
	"sap/ui/core/Control"
], function(Control) {
	"use strict";

	var DestroyListener = Control.extend("gramont.VCDSM.specedit.control.DestroyListener", {
		setDestroyCallback: function(fDestroyCallback) {
			this._fDestroyCallback = fDestroyCallback;
		},

		exit: function() {
			// Do not use UI5 event mechanism for dispatching events, since
			// it could interfere with the destroy process.

			if (this._fDestroyCallback)
				this._fDestroyCallback();
		}
	});

	return DestroyListener;
});
