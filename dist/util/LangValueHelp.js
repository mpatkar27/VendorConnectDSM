sap.ui.define(["gramont/VCDSM/specedit/util/SpecDataTabBase","sap/m/library","sap/m/Link","gramont/VCDSM/specedit/util/ModelManagerAdmin","gramont/VCDSM/specedit/util/ModelManagerAutoGrowOp","gramont/VCDSM/specedit/util/ModelManagerIntStatus","sap/ui/model/json/JSONModel","gramont/VCDSM/specedit/util/PropMultiComposition","sap/base/assert","gramont/VCDSM/specedit/util/ValueHelperDialog"],function(t,e,a,o,r,s,i,n,l,g){"use strict";var c=function(e,a,o,r,s){t.call(this,e,"gramont.VCDSM.specedit.frag.LangValueHelp");this._oComponent=e;this._treenode=a;this.patharr=[];this._oDialogadd=e.getNavigator().createFragment("gramont.VCDSM.specedit.frag.LangValueHelp",this);this._udtmod=o;this._oldudt=r;this._Odiagrestab=new i;this._srcfield=s;this._oDialogadd.control.setModel(this._Odiagrestab);this._oDialogadd.control.open();var n=this._oComponent.getODataManager().requestForFetchLanguage();this._oComponent.getODataManager().executeRequest(n,jQuery.proxy(this._FetchLanguageSuccess,this))};c.prototype=Object.create(t.prototype);c.prototype.constructor=c;c.prototype._onCloseusag=function(){this._oDialogadd.control.close()};c.prototype._onok=function(t){var e=t.getSource().getSelectedKey();var a=this._srcfield.getBindingContext().getPath().split("/");l(a.length==2&&a[0]=="","Control should have absolute binding context path");var r=parseInt(a[1]);var i=this._srcfield.getModel();var n=i.getData().length;var g="/"+r+"/LANGU";i.setProperty(g,e);var c="/"+r+"/"+o.FullPropName.IntStatus;var d=i.getProperty(c);var p=null;switch(d){case s.Empty:p=s.New;break;case s.Unchanged:p=s.Modified;break}if(p!=null)i.setProperty(c,p);this._oDialogadd.control.close()};c.prototype._FetchLanguageSuccess=function(t){this._usagecollection=t.entries;for(var e=0;e<t.entries.length;e++){t.entries[e].Selected=false}this._Odiagrestab.setProperty("/",t.entries);this._modtab=this._Odiagrestab};return c});