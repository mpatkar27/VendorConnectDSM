/*
 * ExpandVerticalLayout implements similar control as VerticalLayout,
 * however it also provides more/less button for expand/collapse.
 */

sap.ui.define([
	"sap/m/Link",
	"sap/ui/core/Control",
	"sap/ui/core/EnabledPropagator"
], function(Link, Control, EnabledPropagator) {
	"use strict";

	var ExpandVerticalLayout = Control.extend("gramont.VCDSM.specedit.control.ExpandVerticalLayout", {
		metadata: {
			properties: {
				enabled: {type: "boolean", defaultValue: true},
				expanded: {type: "boolean", defaultValue: false},
				collapseLimit: {type: "int", defaultValue: 0}
			},

			aggregations: {
				content: {type: "sap.ui.core.Control", multiple: true, singularName: "content"}, // Keep UI5 standard: use "content" and not "contents".
				_link: {type: "sap.m.Link", multiple: false, visibility: "hidden"}
			}
		},

		init: function() {
			// Create more/less link.

			var oLink = new Link({
				press: jQuery.proxy(this._onLinkPress, this)
			});

			this.setAggregation("_link", oLink);
		},

		_onLinkPress: function() {
			// Flip expanded flag.

			var bExpanded = this.getExpanded();
			this.setExpanded(!bExpanded);
		}
	});

	EnabledPropagator.call(ExpandVerticalLayout.prototype);

	return ExpandVerticalLayout;
});
