sap.ui.define([],function(){"use strict";var t={render:function(t,e){t.write("<div");t.writeControlData(e);t.addClass("gramontPlmVc_Field");t.writeClasses();var i=e.getWidth();if(i)t.addStyle("width",i);t.writeStyles();t.write(">");var r=!e.getEditMode()?e.getDisplay():e.getEdit();if(r)t.renderControl(r);t.write("</div>")}};return t},true);