sap.ui.define(["gramont/VCDSM/specedit/util/SpecDataTabBase","gramont/VCDSM/specedit/util/ModelManagerAdmin","gramont/VCDSM/specedit/util/ModelManagerAutoGrowOp","gramont/VCDSM/specedit/util/ModelManagerIntStatus","sap/ui/core/format/DateFormat","sap/ui/model/Filter","sap/ui/model/FilterOperator"],function(t,e,a,o,r,n,s){"use strict";var i=function(e,a){t.call(this,e,"gramont.VCDSM.specedit.frag.SpecDataTabMessage");this._oComponent=e;this._recnroot=a;this.chattime=this._byId("chatTimeline");var r=function(t){var e=t.getSource().getBindingContext().getPath().split("/");assert(e.length==2&&e[0]=="","Control should have absolute binding context path");this._oevent=t;var a=parseInt(e[1]);var r=t.getSource().getModel();var n=r.getData().length;var s="/"+a+"/status";var i=r.getProperty(s);var c=null;switch(i){case o.Empty:c=o.New;break;case o.Unchanged:c=o.Modified;break}if(c!=null)r.setProperty(s,c)};var n=this._oComponent.getODataManager().requestForFetchChats(this._recnroot);this._oComponent.getODataManager().executeRequest(n,jQuery.proxy(this._fetchdata,this))};i.prototype=Object.create(t.prototype);i.prototype.constructor=i;i.prototype._fetchdata=function(t){var e=t;for(var a=0;a<e.entries.length;a++){e.entries[a].status="Unchanged";e.entries[a].template=false;e.entries[a].datetime=e.entries[a].DATE+"  "+e.entries[a].TIME}e.entries[e.entries.length]={RECNROOT:this._recnroot,CHAT:"",template:true,USER_NAME:"",DATE:"",TIME:"",CHAT_ID:"",PARENT_CHAT:""};var o=new sap.ui.model.json.JSONModel(e.entries);this.chattime.setModel(o)};i.prototype._addcomment=function(t){var e={RECNROOT:this._recnroot,CHAT:this._textcom,USER_NAME:"",DATE:"",TIME:"",CHAT_ID:"",PARENT_CHAT:""};var a=this._oComponent.getODataManager().requestForUpdateChats(e);this._oComponent.getODataManager().executeRequest(a,jQuery.proxy(this._Success,this))};i.prototype._formatDateTime=function(t){var e=r.getDateInstance();return e.format(e.parse(t))};i.prototype._onChangeCom=function(t){this._textcom=t.getSource().getValue()};i.prototype._Success=function(t){if(t.statusCode==200){sap.m.MessageToast.show(this._oComponent.getI18nBundle().getText("chagsavucc"));var e=this._oComponent.getODataManager().requestForFetchChats(this._recnroot);this._oComponent.getODataManager().executeRequest(e,jQuery.proxy(this._fetchdata,this))}else{sap.m.MessageToast.show(this._oComponent.getI18nBundle().getText("docvalid"))}};return i});