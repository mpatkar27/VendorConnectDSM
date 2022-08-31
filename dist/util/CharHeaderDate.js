sap.ui.define(["sap/m/DatePicker","sap/ui/model/type/Date","gramont/VCDSM/specedit/util/CharHeaderBase","gramont/VCDSM/specedit/util/CharHeaderException","gramont/VCDSM/specedit/util/Util"],function(r,t,e,a,n){"use strict";var o=function(r,t){e.call(this,r,t);r.initClassExtension(this,"gramont.VCDSM.specedit.util.CharHeaderDate",arguments)};o.prototype=Object.create(e.prototype);o.prototype.constructor=o;o.prototype._parseCharValue=function(r){var t=n.parseDateFromString(r);if(!t)throw new a("CharHeaderDate.error.date",[r,this._sFieldName]);return t};o.prototype._convertCharValue=function(r){var t=n.convertDateToString(r);return t};o.prototype._emptyCharValue=function(){return null};o.prototype._isEmptyCharValue=function(r){var t=r==null;return t};o.prototype._isCharValueEqual=function(r,t){var e=r.getTime()==t.getTime();return e};o.prototype._getCharValueInputImpl=function(e,a){var n=new r({value:{path:a,type:new t({strictParsing:true})},width:"9rem",enabled:this._calculateEnabledBinding(e),parseError:jQuery.proxy(this._onParseError,this)});return n};o.prototype._formatterForCharValue=function(r,e){var a=new t;var n=a.formatValue(e,"string");return n};o.prototype._parseCharValueOfCharEntry=function(r,t){var e=this._parseCharValue(r);return e};o.prototype._createCharEntryFromCharValue=function(r){var t=this._makeCharEntryFromCharValue(r,"");return t};o.prototype._getCharEntryFilterPath=function(){return null};o.prototype._createCharValueFromValueHelperValue=function(r,t){return null};o.prototype._onParseError=function(r){var t=r.getSource();var e=t.getBinding("value");e.setValue(null);e.refresh(true)};return o});