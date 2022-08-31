sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"gramont/VCDSM/specedit/util/Util"
], function(Controller, Util) {
	"use strict";

	var ControllerBase = Controller.extend("gramont.VCDSM.specedit.util.ControllerBase", {
		constructor: function() {
			var fBaseOnInit = jQuery.proxy(this._onInit, this);
			var fControllerOnInit = jQuery.proxy(this.onInit, this);

			this.onInit = function() {
				fBaseOnInit();
				fControllerOnInit();
			};
		},

		// Lifecycle methods, override in derived class:

		onInit: function() {
			// Initialize view.
		},

		onBeforeShow: function(oViewParam) {
			// Called before the view is shown.
		},

		onAfterShow: function() {
			// Called after the view is shown, but before ODataManager is initialized.
		},

		onAfterShowInited: function() {
			// Called after the view is shown and ODataManager is initialized.
		},

		getHandledRoutes: function() {
			// Return with route names (see manifest.json) which are handled by the view.

			var aHandledRoutes = [];
			return aHandledRoutes;
		},

		// Wrapper methods:

		_onInit: function() {
			// Register for view lifecycle events.

			this.getOwnerComponent().getRouter().attachRouteMatched(jQuery.proxy(this._onRouteMatched, this));
			this.getView().addEventDelegate({
				onBeforeShow: jQuery.proxy(this._onBeforeShow, this),
				onAfterShow: jQuery.proxy(this._onAfterShow, this)
			});

			this._bHandleRoute = false;
		},

		_onRouteMatched: function(oEvent) {
			var sRoute = oEvent.getParameter("name");
			var bHandleRoute = this.getHandledRoutes().indexOf(sRoute) >= 0;

			if (bHandleRoute) {
				// If a hash-change doesn't trigger view switch (we display
				// the same view as before), then simulate BeforeShow/AfterShow
				// events. Since in this case, _onBeforeShow and _onAfterShow event
				// handlers won't be called by UI5.

				if (this._bHandleRoute) {
					var oShowEvent = { // FIXME
							isTo: true
					};

					this._onBeforeShow(oShowEvent);
					this._onAfterShow(oShowEvent);
				}
			}

			this._bHandleRoute = bHandleRoute;
		},

		_onBeforeShow: function(oEvent) {
			if (!this._isForwardNavigation(oEvent))
				return;

			var oViewParam = this.getOwnerComponent().getViewParam();
			this.onBeforeShow(oViewParam);
		},

		_onAfterShow: function(oEvent) {
			if (!this._isForwardNavigation(oEvent))
				return;

			// The application can't be used on mobile phones.

			if (jQuery.device.is.phone) {
				var oI18nBundle = this.getOwnerComponent().getI18nBundle();
				var sMessage    = oI18nBundle.getText("ControllerBase.error.device");

				Util.showMessageBox(this.getOwnerComponent(), {
					type: Util.MessageBoxType.Error,
					message: sMessage
				}, jQuery.proxy(this._onDeviceDialogClose, this));

				return;
			}

			this.onAfterShow();

			// If ODataManager is not initialized, then initialize it prior to
			// calling onAfterShowInited. Checking the state is necessary
			// because of deep-linking.

			if (this.getOwnerComponent().getODataManager().isInited())
				this.onAfterShowInited();
			else
				this._odataInit();
		},

		_isForwardNavigation: function(oEvent) {
			// Forward navigation happens if:
			// - either it is a "to" event (see viewLevel in Component.js),
			// - or the page is shown for the first time (even during a back navigation).

			return (oEvent.isTo || oEvent.firstTime);
		},

		_onDeviceDialogClose: function() {
			// Unsupported device, close application.

			this.getOwnerComponent().getNavigator().navigateBack();
		},

		// OData init methods:

		_odataInit: function() {
			this.getOwnerComponent().getODataManager().init("ControllerBase.error.odataInit",
					jQuery.proxy(this._odataInitMetadataSuccess, this),
					jQuery.proxy(this._odataInitError, this));
		},

		_odataInitMetadataSuccess: function() {
			// On successful metadata init, call config fetch.

			var oRequest = this.getOwnerComponent().getODataManager().requestForFetchConfig("ControllerBase.error.odataInit");
			this.getOwnerComponent().getODataManager().executeRequest(oRequest,
					jQuery.proxy(this._odataInitConfigSuccess, this),
					jQuery.proxy(this._odataInitError, this));
		},

		_odataInitConfigSuccess: function(oConfig) {
			this.getOwnerComponent().setConfig(oConfig);

			// On successful config init, call onAfterShowInited.

			this.onAfterShowInited();
		},

		_odataInitError: function() {
			// On OData error, close application.

			this.getOwnerComponent().getNavigator().navigateBack();
		}
	});

	return ControllerBase;
});
