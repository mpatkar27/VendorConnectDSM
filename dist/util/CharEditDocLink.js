sap.ui.define(["sap/base/assert","sap/ui/model/Filter","sap/ui/model/FilterOperator","sap/ui/model/json/JSONModel","gramont/VCDSM/specedit/util/ModelManagerStatus","gramont/VCDSM/specedit/util/TableManager"],function(e,t,o,a,r,i){"use strict";var n=function(e){this._oComponent=e;this._oDialog=this._oComponent.getNavigator().createFragment("gramont.VCDSM.specedit.frag.CharEditDocLink",this);this._oDialogDialogModel=new a;this._oDialog.control.setModel(this._oDialogDialogModel,"dialogModel");var t=this._oDialog.byId("uploader");t.setUploadUrl(this._oComponent.getODataManager().getDocUploadURL());var o=this._oDialog.byId("table");var r=this._oDialog.byId("table.item");this._oTableManager=new i(this._oComponent,o,r)};n.prototype.open=function(e,t,o){this._oCharHeader=e;this._oInstance=t;this._fOnStore=o;this._fetchData()};n.prototype._fetchData=function(){var e=this._oComponent.getModelManager().requestForFetchDocLinkByInstanceKey(this._oInstance);this._oComponent.getModelManager().executeFetchRequest(e,jQuery.proxy(this._fetchDataSuccess,this))};n.prototype._fetchDataSuccess=function(a){this._oCollection=a;e(this._oCollection,"oCollection should be set");this._oDialogDialogModel.setProperty("/enableCreate",this._oCharHeader.getDocType()!="");this._oTableManager.setCollection(this._oCollection);var r=this._oCharHeader.getTextType();var i=new t({path:"TEXTCAT",operator:o.EQ,value1:r});this._oTableManager.setFilter(i);e(!this._oDialog.control.isOpen(),"oDialog should be closed");this._oDialog.control.open()};n.prototype._formatCreateEnabled=function(e,t){var o=e&&t;return o};n.prototype._onUploadStart=function(e){var t=e.getParameter("requestHeaders");var o={name:"slug",value:this._oCharHeader.getDocType()+"/"+e.getParameter("fileName")};t.push(o);var a={name:"Accept",value:"application/json"};t.push(a);var r={name:"x-csrf-token",value:this._oComponent.getODataManager().getSecurityToken()};t.push(r);this._oComponent.getNavigator().requireBusyDialog()};n.prototype._onUploadComplete=function(e){this._oComponent.getNavigator().releaseBusyDialog();var t=e.getParameter("status");var o=e.getParameter("responseRaw");var a=e.getParameter("fileName");this._oComponent.getODataManager().parseRawResponse(t,o,"CharEditDocLink.error.upload",jQuery.proxy(this._onUploadCompleteSuccess,this,a))};n.prototype._onUploadCompleteSuccess=function(e,t){var o=this._oCharHeader.getTextType();var a={TEXTCAT:o,FILENAME:e,DOKAR:t.DOKAR,DOKNR:t.DOKNR,DOKVR:t.DOKVR,DOKTL:t.DOKTL};this._oCollection.create(a)};n.prototype._onDocOpen=function(e){var t=e.getSource().getBindingContext().getProperty();this._oCharHeader.openDoc(t)};n.prototype._onClose=function(){this._oDialog.control.close();var t=this._oCharHeader.getTextType();var o=this._oCollection.getEntries();var a=[];for(var i=0;i<o.length;i++){var n=o[i];var s=this._oComponent.getModelManager().getEntryStatus(n);switch(s){case r.Deleted:break;case r.New:case r.Unchanged:if(n.TEXTCAT==t)a.push(n);break;default:e(false,"sStatus is unknown")}}var l=this._oCharHeader.buildCharValues(a);this._fOnStore(l,true)};return n});