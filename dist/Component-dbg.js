/*
 * Vendor Connect
 * Fiori/UI5 application component
 *
 * Author(s): Szalai Andras <andras.szalai@gramont.ch>
 * Company: Gramont Kft.
 */

sap.ui.define([
	"sap/base/assert",
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/resource/ResourceModel",
	"gramont/VCDSM/specedit/util/PLMModelManager",
	"gramont/VCDSM/specedit/util/PLMODataManager",
	"gramont/VCDSM/specedit/util/SaveHandler",
	"gramont/VCDSM/specedit/util/Util"
], function (assert, UIComponent, JSONModel, ResourceModel, PLMModelManager, PLMODataManager, SaveHandler, Util) {
	"use strict";

	var Component = UIComponent.extend("gramont.VCDSM.specedit.Component", {
		metadata: {
			manifest: "json",

			events: {
				editModeChange: {
					parameters: {
						editMode: {
							type: "boolean"
						}
					}
				}
			}
		},

		init: function () {
			UIComponent.prototype.init.apply(this, arguments);

			// Initialize i18n.

			this._oI18nModel = new ResourceModel({
				bundleName: "gramont.VCDSM.specedit.i18n.i18n"
			});
			this.setModel(this._oI18nModel, "i18n");

			// Initialize app model.

			this._oAppModel = new JSONModel();
			this.setModel(this._oAppModel, "appModel");

			// Instantiate ODataManager.

			this._oODataManager = new PLMODataManager(this);

			// Instantiate ModelManager.

			this._oModelManager = new PLMModelManager(this);

			// Instantiate SaveHandler.

			this._oSaveHandler = new SaveHandler(this);

			// EXT_HOOK: _extHookBeforeInitRouter
			// Run extra code before initializing router.

			if (this._extHookBeforeInitRouter)
				this._extHookBeforeInitRouter();

			// Initialize router. Register early for route matched event, since it is
			// needed to handle view parameters.

			var oRouter = this.getRouter();

			oRouter.attachBeforeRouteMatched(jQuery.proxy(this._onBeforeRouteMatched, this));
			oRouter.initialize();

			var oRootPath = jQuery.sap.getModulePath("gramont.VCDSM.specedit"); // your resource root

			var oImageModel = new sap.ui.model.json.JSONModel({
				path: oRootPath,
			});

			this.setModel(oImageModel, "imageModel");
		},

		createContent: function () {
			// Create main view, which is responsible for navigation.

			var oConfig = this.getMetadata().getManifestEntry("/sap.ui5/routing/config", true); // FIXME: getManifestEntry is deprecated, but then how to merge manifest with public api?
			assert(oConfig, "oConfig should be set");

			var oView = sap.ui.xmlview(oConfig.viewPath + ".Main"); // FIXME: convert to async load
			this._oNavigator = oView.getController();

			return oView;
		},

		getNavigator: function () {
			assert(this._oNavigator, "oNavigator should be set");
			return this._oNavigator;
		},

		getODataManager: function () {
			assert(this._oODataManager, "oODataManager should be set");
			return this._oODataManager;
		},

		getModelManager: function () {
			assert(this._oModelManager, "oModelManager should be set");
			return this._oModelManager;
		},

		getSaveHandler: function () {
			assert(this._oSaveHandler, "oSaveHandler should be set");
			return this._oSaveHandler;
		},

		getI18nBundle: function () {
			assert(this._oI18nModel, "oI18nModel should be set");
			var oI18nBundle = this._oI18nModel.getResourceBundle();
			return oI18nBundle;
		},

		getComponentConfig: function () {
			var oConfig = this.getMetadata().getManifestEntry("/sap.ui5/config", true);
			assert(oConfig, "oConfig should be set");
			return oConfig;
		},

		setConfig: function (oConfig) { //FIXMEVC: is it needed?
			assert(!this._oConfig, "oConfig should be cleared");
			this._oConfig = oConfig;
		},

		getConfig: function () { //FIXMEVC: is it needed?
			assert(this._oConfig, "oConfig should be set");
			return this._oConfig;
		},

		initClassExtension: function (oObj, sClassName, aArgs) {
			// For classes which are not real UI5 view controllers, we provide "class extensions"
			// to allow customization of these classes. initClassExtension should be called right
			// after calling base class constructor (if exists).

			// 1) Lookup class extension.

			var oCustomizing = this._getComponentCustomizing();
			var oClassExtensions = oCustomizing["gramont.classExtensions"];
			if (!oClassExtensions)
				return;

			var sClassExtensionName = oClassExtensions[sClassName];
			if (!sClassExtensionName)
				return;

			// 2) Load class.

			var fClassExtensionConstructor = sap.ui.requireSync(Util.getModulePath(sClassExtensionName)); // FIXME: convert to async load
			assert(fClassExtensionConstructor, "fClassExtensionConstructor should be set");

			// 3) Extend oObj instance with the prototype content of extension class. Do not override
			// the prototype of base class, since we would like to allow the extension class to
			// call base implementation using prototype methods.

			jQuery.extend(oObj, fClassExtensionConstructor.prototype);

			// 4) Call constructor of the extension class.

			fClassExtensionConstructor.apply(oObj, aArgs);
		},

		getFragmentName: function (sFragmentName) {
			// Customization is provided to allow replacing of fragments.

			var oCustomizing = this._getComponentCustomizing();
			var oFragmentReplacements = oCustomizing["gramont.fragmentReplacements"];
			if (!oFragmentReplacements)
				return sFragmentName;

			var sFragmentReplacementName = oFragmentReplacements[sFragmentName];
			return (sFragmentReplacementName == null) ? sFragmentName : sFragmentReplacementName;
		},

		getViewParam: function () {
			assert(this._oViewParam, "oViewParam should be set");
			return this._oViewParam;
		},

		setEditMode: function (bEditMode) {
			// TODO: Would be nicer if this model was created in SpecDetail.
			this._oAppModel.setProperty("/editMode", bEditMode);

			this.fireEditModeChange({
				editMode: bEditMode
			});
		},

		getEditMode: function () {
			var bEditMode = this._oAppModel.getProperty("/editMode");
			return bEditMode;
		},

		_getComponentCustomizing: function () {
			var oCustomizing = this.getMetadata().getManifestEntry("/sap.ui5/extends/extensions", true);
			if (!oCustomizing)
				oCustomizing = {};

			return oCustomizing;
		},

		_onBeforeRouteMatched: function (oEvent) {
			this._oViewParam = oEvent.getParameter("arguments");
		}
	});

	return Component;
});