sap.ui.define(["sap/ui/core/Element"],function(e){"use strict";var t=e.extend("gramont.VCDSM.specedit.control.ColumnListItem",{metadata:{properties:{error:{type:"boolean",defaultValue:false},deleted:{type:"boolean",defaultValue:false},autoGrow:{type:"boolean",defaultValue:false}},aggregations:{cells:{type:"sap.ui.core.Control",multiple:true,singularName:"cell"}},defaultAggregation:"cells"},getEnabled:function(){var e=!this.getDeleted();return e}});return t});