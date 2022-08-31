sap.ui.define(["sap/base/assert","sap/ui/model/json/JSONModel","sap/m/IconTabFilter","sap/m/Text","gramont/VCDSM/specedit/util/ControllerBase","gramont/VCDSM/specedit/util/SpecDataError","gramont/VCDSM/specedit/util/Util","gramont/VCDSM/specedit/util/CompType","gramont/VCDSM/specedit/util/PropMode","gramont/VCDSM/specedit/util/Commit","gramont/VCDSM/specedit/util/SpecDataTabProp","gramont/VCDSM/specedit/util/SpecDataTabAttachment","gramont/VCDSM/specedit/util/SpecDataTabMessage","sap/ui/core/routing/History","sap/m/Dialog","sap/m/DialogType","sap/m/Button","sap/m/ButtonType","gramont/VCDSM/specedit/util/AdhocReport"],function(e,t,o,n,r,i,s,a,h,c,l,p,f,u,_,d,g,C,v){"use strict";var T=r.extend("gramont.VCDSM.specedit.controller.SpecData",{onInit:function(){this.getOwnerComponent().getNavigator().releaseBusyDialog();this.getOwnerComponent().getSaveHandler().attachBeforeSave(jQuery.proxy(this._beforeSave,this));this.getOwnerComponent().getSaveHandler().attachAfterSave(jQuery.proxy(this._afterSave,this));this.getOwnerComponent().getSaveHandler().attachAfterReset(jQuery.proxy(this._afterReset,this));var e=this.byId("ictb");this._oErrorPopover=new i(this.getOwnerComponent(),this.getView());this._aTabControllers=[];this._oTabControllerPropNonEditable=new l(this.getOwnerComponent(),false);this._setupTab(this._oTabControllerPropNonEditable);this._oTabControllerPropEditable=new l(this.getOwnerComponent(),true);this._setupTab(this._oTabControllerPropEditable)},onnavtab:function(){var e=this.byId("ictb");this.fttlb=this.byId("tlb2");var t=e.getSelectedKey();if(t=="maintain"||t=="attachments"){this._onEdit();this.fttlb.setVisible(true)}else{this.fttlb.setVisible(false);this._onCancel()}},_onBack:function(){var e=u.getInstance();var t=e.getPreviousHash();if(t!==undefined){window.history.go(-1)}else{var o=sap.ui.core.UIComponent.getRouterFor(this);o.navTo("Main")}},_onCommit:function(){var e=new c(this.getOwnerComponent())},onBeforeShow:function(e){this._oSpecificationSUBIDKey=null;var t=e.SUBID;if(t!=null){this._oSpecificationSUBIDKey={SUBID:t,KEYDATE:new Date}}this._bNeedEditMode=false;var o=e["?query"];if(o&&o.mode=="edit")this._bNeedEditMode=true;this._setEnablePage(false);this._clearStorage();this._initSave();for(var n=0;n<this._aTabControllers.length;n++){var r=this._aTabControllers[n];r.onBeforeShow()}},onAfterShowInited:function(){if(!this._oSpecificationSUBIDKey){s.showMessageBox(this.getOwnerComponent(),{type:s.MessageBoxType.Error,message:this.getOwnerComponent().getI18nBundle().getText("SpecData.error.param")},jQuery.proxy(this._noParameter,this));return}this._fetchSpecificationInfo()},_formatTitle:function(e,t,o){var n=this.getOwnerComponent().getI18nBundle();var r;if(t&&o)r=n.getText("SpecDetail.title.final",[e,t,o]);else r=n.getText("SpecDetail.title.initial",[e]);return r},getHandledRoutes:function(){var e=["SpecData","SpecData_SUBID"];return e},_onAdhocReport:function(){var e=this.getOwnerComponent().getI18nBundle();this.getOwnerComponent().getSaveHandler().confirmAndSave(e.getText("SpecDetail.adhocReportConfirm"),false,jQuery.proxy(this._onAdhocReportContinue,this))},_onAdhocReportContinue:function(e){if(e){if(!this._oAdhocReport)this._oAdhocReport=new v(this.getOwnerComponent(),this.getView());this._oAdhocReport.open(this.oSpecificationkey)}},_setupTab:function(e){this._aTabControllers.push(e);var t=e.getControl();t.bindProperty("visible",{path:"pageModel>/enablePage"});this.otab=this.byId("ictb");this.otab.addItem(t)},_noParameter:function(){},_fetchSpecificationInfo:function(){e(this._oSpecificationSUBIDKey,"oSpecificationSUBIDKey should be set");var t=this.getOwnerComponent().getODataManager().requestForFetchSpecificationInfo(this._oSpecificationSUBIDKey);this.getOwnerComponent().getODataManager().executeRequest(t,jQuery.proxy(this._fetchSpecificationInfoSuccess,this),jQuery.proxy(this._fetchSpecificationInfoError,this))},_fetchSpecificationInfoSuccess:function(e){var t={RECNROOT:e.RECNROOT,ACTN:e.ACTN};this.oSpecificationkey=t;this.getOwnerComponent().getSaveHandler().setSpecificationKey(t);var o=this.getOwnerComponent().getODataManager().requestForFetchLogo(t);this.getOwnerComponent().getODataManager().executeRequest(o,jQuery.proxy(this._logosuccess,this),jQuery.proxy(this._logoerror,this))},_logosuccess:function(e){var t=e.entries;if(t[0].DOKAR){var o={DOKAR:t[0].DOKAR,DOKNR:t[0].DOKNR,DOKVR:t[0].DOKVR,DOKTL:t[0].DOKTL};var n=this.getOwnerComponent().getODataManager().getDocDownloadURL(o);this.byId("imglog").setSrc(n)}this._initialFetch(this.oSpecificationkey)},_logoerror:function(e){this._initialFetch(this.oSpecificationkey)},_fetchSpecificationInfoError:function(){},_initialFetch:function(e){var t=this.getOwnerComponent().getModelManager().requestForFetchPropertyBySpecificationKey(e);var o=jQuery.sap.getUriParameters().get("ACTIVITY");if(o)e.actvtparam=o;else e.actvtparam="";var n=[];var r=this.getOwnerComponent().getModelManager().requestForFetchHeaderInfoBySpecificationKey(e);n.push(r);n.push(t);this.getOwnerComponent().getModelManager().executeFetchRequests(n,jQuery.proxy(this._initialFetchCallback,this))},_initialFetchCallback:function(e,t){if(e.allSuccess){var o=e.responses[0].response._oModel.oData[0].ID_VALUE;var n=this._oSpecificationSUBIDKey.SUBID;var r=this.getOwnerComponent().getI18nBundle().getText("specnum");this.byId("txthd1").setText(o+"\n"+r+n);var i=e.responses[0].response;var a=e.responses[1].response;var c=a.getAdditional();if(t.responses[2]!=null){var l=t.responses[2].response[0].__metadata.type;var p=t.responses[2].response;this.secondrun=false}else{this.secondrun=true;var l=t.responses[0].response[0].__metadata.type;var p=t.responses[0].response}this._aPropInfos=[];var f="UDT";if(l=="GMT.VC_ODATA_SRV.GetVATList"){for(var u=0;u<p.length;u++){var _,d=false;if(p[u].Layout=="TABLE"){_=h.Composition;this._mlc=false}else if(p[u].Layout=="FORM"){_=h.Instance;this._mlc=false}else if(p[u].Layout=="TREE TABLE"){this._mlc=true;_=h.Composition}else if(p[u].Layout=="PHRASE"){_=h.Phrase;this._mlc=false}else if(p[u].Layout=="UDT_INST"){_=h.Instance;this._mlc=false;d=true}var g={ESTCAT:p[u].Estcat,propMode:_,editable:p[u].Editable,sortorder:p[u].SortOrder,PhrKey:p[u].Phrkey,UDT:p[u].NumOfTexts,UDTPos:"",MLC:this._mlc,UDTINST:d,Layout:p[u].Layout,Visible:true,PropListId:p[u].PropertyListId,propid:null};this._aPropInfos.push(g)}}else{this._aPropInfos=[{ESTCAT:null,propMode:null,editable:false}]}this._fetchInstance(c,i)}else{s.showExecuteError(this.getOwnerComponent(),"SpecData.error.fetch",e,true,jQuery.proxy(this._initialFetchClose,this))}},_initialFetchClose:function(){},_fetchInstance:function(e,t){var o=e.nodesByESTCAT;var n=[];var r=[];var i=t._oModel.oData[0];for(var s=0;s<this._aPropInfos.length;s++){var a=this._aPropInfos[s];var h=a.ESTCAT;var c=o[h];var l=this._aPropInfos[s].PhrKey;if(!c&&this._aPropInfos[s].propMode!="Phrase"){n.push(h);continue}if(this._aPropInfos[s].propMode=="Phrase"){var p={RECNROOT:"",ACTN:"",MENID:"",ID:"",TEXT:"",ESTCAT:"",Phrkey:l,MLC:this._aPropInfos[s].MLC}}else{var p={RECNROOT:c.RECNROOT,ACTN:c.ACTN,MENID:c.MENID,ID:c.ID,TEXT:c.TEXT,ESTCAT:c.ESTCAT,Phrkey:l,MLC:this._aPropInfos[s].MLC}}a.treeNode=p;var f=this.getOwnerComponent().getModelManager().requestForFetchInstanceByPropertyKey(p);r.push(f)}for(var s=0;s<this._aPropInfos.length;s++){var a=this._aPropInfos[s];var h=a.ESTCAT;var c=o[h];if(!c&&this._aPropInfos[s].propMode!="Phrase"&&this._aPropInfos[s].propMode!="doc"){this._aPropInfos.splice(s,1);s--;continue}}if(r.length==0){this._fetchFinish();return}this.getOwnerComponent().getModelManager().executeFetchRequests(r,jQuery.proxy(this._fetchInstanceCallback,this))},_fetchInstanceCallback:function(t,o){if(t.allSuccess){var n=t.responses;e(this._aPropInfos.length==n.length,"Length inconsistency");var r=[],i=[],a=null;var c="COMP_TYPE";r[c]="Phrase";i[c]="DocLink";for(var l=0;l<this._aPropInfos.length;l++){var p=this._aPropInfos[l];if(p.propMode!="Phrase"&&p.propMode!="doc"){var f=n[l].response;var u=f.getAdditional();p.instanceInfo=u.info;if(p.propMode==h.Instance){a=p.treeNode;if(p.UDT>0){var _=f.getEntries();e(_.length>0,"aInstances.length should be > 0");_[0].LAYOUT=p.Layout;p._instanceKey=_[0]}p.collection=f}else{var _=f.getEntries();e(_.length>0,"aInstances.length should be > 0");p._instanceKey=_[0];var d=_[0]}}else{p.propMode="Composition";p.instanceInfo=r}}this._fetchDetail()}else{s.showExecuteError(this.getOwnerComponent(),"SpecData.error.fetch",t,true,jQuery.proxy(this._fetchInstanceClose,this))}},_fetchInstanceClose:function(){},_fetchDetail:function(){var t=[];var o=[];var n=this._aPropInfos;var r=[];var i="COMP_TYPE";r[i]="UserDefinedText";for(var c=0;c<n.length;c++){if(n[c].UDT!=0){var l={ESTCAT:n[c].ESTCAT,propMode:n[c].propMode,editable:"",sortorder:"",PhrKey:"udt",UDT:"",_instanceKey:n[c]._instanceKey,instanceInfo:r};this._aPropInfos[c].UDTPos=this._aPropInfos.length;this._aPropInfos.push(l)}else{this._aPropInfos[c].UDTPos=null}}for(var c=0;c<this._aPropInfos.length;c++){var p=this._aPropInfos[c];var f=p._instanceKey;var u=null;switch(p.propMode){case h.Instance:if(p.PhrKey=="udt"){u=this.getOwnerComponent().getModelManager().requestForFetchUserDefinedTextByInstanceKey(f)}break;case h.Composition:var _=p.instanceInfo.COMP_TYPE;switch(_){case a.Qual:u=this.getOwnerComponent().getModelManager().requestForFetchQualByInstanceKey(f);break;case a.MultiComp:this._multicmpestcat=p.ESTCAT;u=this.getOwnerComponent().getModelManager().requestForFetchMultiCompositionByInstanceKey(f);break;case a.Quant:u=this.getOwnerComponent().getModelManager().requestForFetchQuantByInstanceKey(f);break;case a.Phrase:var d=p.PhrKey;u=this.getOwnerComponent().getODataManager().requestForFetchText(d);var g=[],C="name",v="Phrkey";g[C]="Phrase";g[v]=d;u.nodeMetadata=g;break;case a.UserDefinedText:u=this.getOwnerComponent().getModelManager().requestForFetchUserDefinedTextByInstanceKey(f);break;default:var T=p.ESTCAT+": "+_;t.push(T)}break;default:e(false,"propMode is unknown")}if(u){p._fetchDetail=true;o.push(u)}}if(t.length>0){var y=t.join("\n");s.showMessageBox(this.getOwnerComponent(),{type:s.MessageBoxType.Error,message:this.getOwnerComponent().getI18nBundle().getText("SpecData.error.unknownComp"),details:y});return}if(o.length==0){this._fetchFinish();return}this.getOwnerComponent().getModelManager().executeFetchRequests(o,jQuery.proxy(this._fetchDetailCallback,this))},_fetchDetailCallback:function(e){if(e.allSuccess){var t=e.responses;var o=0;var n=0;for(var r=0;r<this._aPropInfos.length;r++){var i=this._aPropInfos[r];var a=i.UDT;if(i._fetchDetail||i.PhrKey=="udt"){var h=o;var c=n++;var l=t[o++].response;var p=l.getEntries();i.collection=l}}this._fetchFinish()}else{s.showExecuteError(this.getOwnerComponent(),"SpecData.error.fetch",e,true,jQuery.proxy(this._fetchDetailClose,this))}},_fetchDetailClose:function(){},_fetchFinish:function(){for(var e=0;e<this._aPropInfos.length;e++){var t=this._aPropInfos[e];if(t.ESTCAT!=""){if(t.Layout=="TABLE"){if(t.instanceInfo.COMP_TYPE=="QUAL"){var o=t.collection.getAdditional().parent.CompHeader}else if(t.instanceInfo.COMP_TYPE=="QUANT"){var o=t.collection.getAdditional().parent.CompHeaderqnt}for(var n=o.length-1;n>=0;n--){var r=o[n];if(r.AsCheckBox){if(r._Linked_prop!=""){for(var i=0;i<this._aPropInfos.length;i++){if(this._aPropInfos[i].PropListId==r._Linked_prop){this._aPropInfos[i].Visible=t.collection.getModel().getProperty("/0/"+r._sFieldName+"/0/value")}}}}}}else if(t.Layout=="FORM"){var o=t.collection.getAdditional().charHeaderInfo.byOrder;for(var n=o.length-1;n>=0;n--){var r=o[n];if(r._isCheckBox){if(r._Linked_prop!=""){for(var i=0;i<this._aPropInfos.length;i++){if(this._aPropInfos[i].PropListId==r._Linked_prop){this._aPropInfos[i].Visible=t.collection.getModel().getProperty("/0/"+r._sFieldName+"/0/value")}}}}}}}}for(var n=0;n<this._aPropInfos.length;n++){var t=this._aPropInfos[n];if(t.PhrKey!="doc"){if(t.UDTPos!=null&&t.PhrKey!="udt"&&(!this.secondrun||t.instanceInfo.COMP_TYPE=="MLVL_COMP")){var s=t.editable?this._oTabControllerPropEditable:this._oTabControllerPropNonEditable;s.addProp(t.propMode,t.treeNode,t.instanceInfo,t.collection,this._aPropInfos[t.UDTPos],this.secondrun,this.oSpecificationkey,this._multicmpestcat,t.UDTINST,t.Layout,this._aPropInfos,t,n)}else if(t.UDTPos==null&&t.PhrKey!="udt"&&(!this.secondrun||t.instanceInfo.COMP_TYPE=="MLVL_COMP")){var s=t.editable?this._oTabControllerPropEditable:this._oTabControllerPropNonEditable;s.addProp(t.propMode,t.treeNode,t.instanceInfo,t.collection,null,this.secondrun,this.oSpecificationkey,this._multicmpestcat,t.UDTINST,t.Layout,this._aPropInfos,t,n)}}}setTimeout(this._rtde,1e3);var a={RECNROOT:this.oSpecificationkey.RECNROOT,ACTN:this.oSpecificationkey.ACTN,RECNPARENT:"0",ESTCAT:"0",RECN_VP:"0",ACTN_VP:"0"};if(this._aTabControllers.length==4){this._aTabControllers.splice(2,2);for(var h=0;h<this.otab.getItems().length;h++){if(h>1){this.otab.removeItem(this.otab.getItems()[h]);h--}}}setTimeout(this._rtde,1e3);this._oTabControllerAttachment=new p(this.getOwnerComponent(),a);this._setupTab(this._oTabControllerAttachment);this._oTabControllerMessage=new f(this.getOwnerComponent(),this.oSpecificationkey.RECNROOT);this._setupTab(this._oTabControllerMessage);if(this._bNeedEditMode)this._setEditMode(true);this.byId("ictb").setSelectedKey("maintain");this._onEdit();this.byId("tlb2").setVisible(true)},_clearStorage:function(){this.getOwnerComponent().getModelManager().clearStorage()},_beforeSave:function(e){this._showError(false);e()},_rtde:function(){var e=1234},_afterSave:function(e,t){var o=e.entryErrorInfos;if(o){var n=o.length;this._setEntryErrorCount(n);if(n>0){this._oErrorPopover.setEntryErrorInfos(o);this._showError(true)}}this._fcont=t;if(this._subbtn){var r=this.getOwnerComponent().getODataManager().requestForSubmit(this.oSpecificationkey);this.getOwnerComponent().getODataManager().executeRequest(r,jQuery.proxy(this._submitsuccess,this),jQuery.proxy(this._submiterror,this))}else{this._fetchSpecificationInfo();t()}},_afterReset:function(e){this._initSave();e()},_submitsuccess:function(e){this._fetchSpecificationInfo();this._fcont()},_submiterror:function(e){this._fetchSpecificationInfo();this._fcont()},_setEnablePage:function(e){},_setEditMode:function(e){this.getOwnerComponent().setEditMode(e)},_setEntryErrorCount:function(e){},_initSave:function(){this._setEditMode(false);this._setEntryErrorCount(0);this._showError(false)},_showError:function(e){var t=this.byId("footer.showerror");this._oErrorPopover.show(e,t)},_formatEditEnabled:function(e,t){var o=e&&!t;return o},_formatEntryErrorText:function(e){var t=e>0?e.toString():"";return t},_formatEntryErrorEnabled:function(e){var t=e>0;return t},_onEdit:function(){this._setEditMode(true)},_onShowError:function(){this._showError(null)},_onSave:function(e){if(e.getSource().getId().includes("subbtn"))this._subbtn=true;else this._subbtn=false;this.getOwnerComponent().getSaveHandler().save()},_onCancel:function(){var e=this.byId("ictb");var t=e.getSelectedKey();var o=this.getOwnerComponent().getI18nBundle();this.getOwnerComponent().getSaveHandler().confirmAndReset(o.getText("SpecData.cancelConfirm"),null,t)}});return T});