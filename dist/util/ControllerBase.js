sap.ui.define(["sap/ui/core/mvc/Controller","gramont/VCDSM/specedit/util/Util"],function(t,e){"use strict";var o=t.extend("gramont.VCDSM.specedit.util.ControllerBase",{constructor:function(){var t=jQuery.proxy(this._onInit,this);var e=jQuery.proxy(this.onInit,this);this.onInit=function(){t();e()}},onInit:function(){},onBeforeShow:function(t){},onAfterShow:function(){},onAfterShowInited:function(){},getHandledRoutes:function(){var t=[];return t},_onInit:function(){this.getOwnerComponent().getRouter().attachRouteMatched(jQuery.proxy(this._onRouteMatched,this));this.getView().addEventDelegate({onBeforeShow:jQuery.proxy(this._onBeforeShow,this),onAfterShow:jQuery.proxy(this._onAfterShow,this)});this._bHandleRoute=false},_onRouteMatched:function(t){var e=t.getParameter("name");var o=this.getHandledRoutes().indexOf(e)>=0;if(o){if(this._bHandleRoute){var n={isTo:true};this._onBeforeShow(n);this._onAfterShow(n)}}this._bHandleRoute=o},_onBeforeShow:function(t){if(!this._isForwardNavigation(t))return;var e=this.getOwnerComponent().getViewParam();this.onBeforeShow(e)},_onAfterShow:function(t){if(!this._isForwardNavigation(t))return;if(jQuery.device.is.phone){var o=this.getOwnerComponent().getI18nBundle();var n=o.getText("ControllerBase.error.device");e.showMessageBox(this.getOwnerComponent(),{type:e.MessageBoxType.Error,message:n},jQuery.proxy(this._onDeviceDialogClose,this));return}this.onAfterShow();if(this.getOwnerComponent().getODataManager().isInited())this.onAfterShowInited();else this._odataInit()},_isForwardNavigation:function(t){return t.isTo||t.firstTime},_onDeviceDialogClose:function(){this.getOwnerComponent().getNavigator().navigateBack()},_odataInit:function(){this.getOwnerComponent().getODataManager().init("ControllerBase.error.odataInit",jQuery.proxy(this._odataInitMetadataSuccess,this),jQuery.proxy(this._odataInitError,this))},_odataInitMetadataSuccess:function(){var t=this.getOwnerComponent().getODataManager().requestForFetchConfig("ControllerBase.error.odataInit");this.getOwnerComponent().getODataManager().executeRequest(t,jQuery.proxy(this._odataInitConfigSuccess,this),jQuery.proxy(this._odataInitError,this))},_odataInitConfigSuccess:function(t){this.getOwnerComponent().setConfig(t);this.onAfterShowInited()},_odataInitError:function(){this.getOwnerComponent().getNavigator().navigateBack()}});return o});