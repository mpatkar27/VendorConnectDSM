sap.ui.define(["sap/base/assert"],function(t){"use strict";var o=function(o,e){this._oComponent=o;this._oFragment=this._oComponent.getNavigator().createFragment(e,this);t(this._oFragment.control.isA("sap.uxap.ObjectPageSubSection"),"Top-level fragment control should be sap.uxap.ObjectPageSubSection")};o.prototype.getControl=function(){return this._oFragment.control};o.prototype.destroy=function(){this._oFragment.control.destroy()};o.prototype._getOwnerComponent=function(){return this._oComponent};o.prototype._byId=function(t){var o=this._oFragment.byId(t);return o};return o});