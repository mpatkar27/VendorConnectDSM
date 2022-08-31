// This is the controller which is implementing instance maintenance.

sap.ui.define([
	"sap/base/assert",
	"sap/m/Label",
	"sap/m/MultiInput",
	"sap/m/Token",
	"sap/ui/model/json/JSONModel",
	"sap/ui/comp/smartfield/SmartField",
	"gramont/VCDSM/specedit/control/Column",
	"gramont/VCDSM/specedit/control/ColumnListItem",
	"gramont/VCDSM/specedit/util/TableManager",
	"gramont/VCDSM/specedit/util/PropBase",
	"gramont/VCDSM/specedit/util/ModelManagerAdmin",
	"gramont/VCDSM/specedit/util/ModelManagerAutoGrowOp",
	"gramont/VCDSM/specedit/util/ModelManagerIntStatus",
	"sap/ui/richtexteditor/RichTextEditor",
	"gramont/VCDSM/specedit/util/UsageDiag",
	"gramont/VCDSM/specedit/util/CharEditCommon",
	"gramont/VCDSM/specedit/util/AddCountry",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"gramont/VCDSM/specedit/util/LangValueHelp"
], function (assert, Label, MultiInput, Token, JSONModel, smartfield, Column, ColumnListItem, TableManager, PropBase, ModelManagerAdmin,
	ModelManagerAutoGrowOp,
	ModelManagerIntStatus, RichTextEditor, UsageDiag, CharEditCommon, AddCountry, Filter, FilterOperator, LangValueHelp) {
	"use strict";

	var PropInstance = function (oComponent, oTreeNode, oCollection, bEditable, udtprop, udtinst, layout,
		proplist, oPropInfo, propindex) { //FIXMEVC:if bEditable is false, then make this propcontrol readonly.
		PropBase.call(this, oComponent, "gramont.VCDSM.specedit.frag.PropInstance");

		// Setup prop model.//FIXMEVC:dup
		this._oCollection = oCollection;
		this._oComponent = oComponent;
		this._layout = layout;
		this._udtinst = udtinst;
		this._treenode = oTreeNode;
		this._estcat = oTreeNode.ESTCAT;
		this._subsec = this._byId("instsubsec");
		proplist[propindex].propid = this._subsec;
		this._subsec.setVisible(oPropInfo.Visible);
		this._proplist = proplist;

		var oPropModel = new JSONModel();

		var oPropControl = this.getControl();
		oPropControl.setModel(oPropModel, "propModel");

		oPropModel.setProperty("/title", oTreeNode.TEXT);

		// Build table://FIXMEVC:refactor:create a reusable method in ESM core which builds this table.
		// - No instance add/delete is possible.
		// - If there are no instances, a fake one will be created (see PLMModelManager->_extHookBackendFetchRequestForInstancePostProcess).

		var oTable = this._byId("table");
		// var oTemplate = new ColumnListItem();
		oTable.setEditable(bEditable);
		var oColLay = this._byId("ColLay");
		var smartgrp = this._byId("grp1");

		var _onChange = function (oEvent) {
			// This function is called when a field has been changed
			// by user.
			// var aPathComps = oEvent.getSource().getBindingContext().getPath().split("/");
			// if (oEvent.getSource().mBindingInfos.value)
			// 	var aPathComps = oEvent.getSource().mBindingInfos.value.binding.sPath.split("/");
			// else
			// 	var aPathComps = oEvent.getSource().mBindingInfos.state.binding.sPath.split("/");
			// // assert(aPathComps.length == 2 &&
			// // 	aPathComps[0] == "", "Control should have absolute binding context path");

			// var iIndex = parseInt(aPathComps[1]);
			var oCharHeader = oEvent.getSource().getModel("prog").getData().header;
			var aPathComps = oEvent.getSource().getModel("prog").getData().valbindpath.split("/");
			var iIndex = parseInt(aPathComps[0]);

			var omod = oEvent.getSource().getModel();

			var iLength = omod.getData().length;

			var sBindingPath = "/" + iIndex + "/" + ModelManagerAdmin.FullPropName.IntStatus;
			var sIntStatus = omod.getProperty(sBindingPath);

			// Entry state transition on field value change:
			// - EMPTY     -> NEW
			// - UNCHANGED -> MODIFIED
			// - MODIFIED  -> MODIFIED (no change)
			// - NEW       -> NEW      (no change)

			var sNewIntStatus = null;

			switch (sIntStatus) {
			case ModelManagerIntStatus.Empty:
				sNewIntStatus = ModelManagerIntStatus.New;
				break;

			case ModelManagerIntStatus.Unchanged:
				sNewIntStatus = ModelManagerIntStatus.Modified;
				break;
			}

			if (sNewIntStatus != null)
				omod.setProperty(sBindingPath, sNewIntStatus);

			if (oEvent.getSource().getValue)
				var inpval = oEvent.getSource().getValue();
			else {
				var inpval = oEvent.getSource().getState();
				
				if (oCharHeader._Linked_prop != "" && oCharHeader._isCheckBox) {
					var proplist = oEvent.getSource().getModel("prog").getData().proplist;
					for (var p = 0; p < proplist.length; p++) {
						if (proplist[p].PropListId == oCharHeader._Linked_prop) {

							var cntrlid = proplist[p].propid;
							cntrlid.setVisible(inpval);
						}
					}
				}
			}
			// if (oEvent.getSource().getValue)
			// 	var inpval = oEvent.getSource().getValue();
			// else
			// 	var inpval = oEvent.getSource().getState();

			// var sBindingPath = oEvent.getSource().getModel("prog").getData().valbindpath;
			// var bindpathmf = "/" + iIndex + "/Mandatoryfields";
			// var mandfarr = oEvent.getSource().getModel().getProperty(bindpathmf);

			// var bindpath = sBindingPath.split("/");
			// var sbindpath = "";
			// for (var i = 1; i < bindpath.length; i++) {
			// 	sbindpath = sbindpath + bindpath[i] + "/";
			// }
			// var finbindpath = "/" + iIndex + "/_ModelManagerADMIN/origEntry/" + sbindpath;

			// var finbindpathroot = "/" + iIndex + "/" + sbindpath;

			// var orgval = oEvent.getSource().getModel().getProperty(finbindpath);
			// var prgindref = oEvent.getSource().getModel("prog").getData().progindref;
			// var mandtot = oEvent.getSource().getModel("prog").getData().mandttot;

			// // In instance table: copy user entered value to phrase, since the control is bound to value.
			// // In edit dialog: copy user entered value to value, since the control is bound to phrase.
			// var mandtcont = prgindref.getModel().getProperty("/mandtchngdfieldsno");

			// var oldval = oEvent.getSource().getModel().getProperty(finbindpath);

			// for (var k = 0; k < mandfarr.length; k++) {

			// 	if (mandfarr[k].Label == bindpath[1]) {
			// 		if (mandfarr[k].changecounter == 0) {

			// 			if (inpval == "") {
			// 				oEvent.getSource().setValueState("Error");
			// 				mandtcont--;
			// 			} else if (orgval == "" && inpval != "") {
			// 				oEvent.getSource().setValueState("None");
			// 				mandtcont++;
			// 			}
			// 		} else {
			// 			if (mandfarr[k].changevalues[mandfarr[k].changevalues.length - 1] == "") {
			// 				mandtcont++;
			// 				oEvent.getSource().setValueState("None");
			// 			} else {
			// 				if (inpval == "") {
			// 					oEvent.getSource().setValueState("Error");
			// 					mandtcont--;
			// 				} else {
			// 					oEvent.getSource().setValueState("None");
			// 				}
			// 			}
			// 		}
			// 		mandfarr[k].changevalues.push(inpval);
			// 		mandfarr[k].changecounter++;
			// 		prgindref.getModel().setProperty("/mandtchngdfieldsno", mandtcont);

			// 		var mandtper = mandtcont / mandtot * 100;
			// 		prgindref.setDisplayValue(mandtper + '%');
			// 		prgindref.setPercentValue(mandtper);
			// 	}

			// }
			
			if (!oCharHeader._isCheckBox) {
				this._src = oEvent.getSource();
				var valinpkey = [];
				valinpkey["ATNAM"] = oCharHeader.getFieldName();
				valinpkey["ATWRT"] = oEvent.getSource().getValue();
				var valreq = this._oComponent.getODataManager().requestForValidateInput(valinpkey);
				this._oComponent.getODataManager().executeRequest(valreq,
					jQuery.proxy(this._ValinputSuccess, this));
			}
		};
		// var aCharHeaders = oCollection.charHeaderInfo.byOrder; // chng 1
		var _smarthelp = function (oInstance, fonstore) {
			if (!this._oEditDialog)
				this._oEditDialog = new CharEditCommon(this._oComponent);

			this._oEditDialog.open(this, oInstance, fonstore);
		};

		var _onCharEdit = function (oCollection, oCharHeader, oEvent) { //FIXMEVC:refactor
			var aPathComps = oEvent.getSource().getModel("prog").getData().valbindpath.split("/");
			var iIndex = parseInt(aPathComps[0]);

			var oInstance = oCollection.getEntry(iIndex);
			this._inpsrc = oEvent.getSource();
			if (!this._oEditDialog)
				this._oEditDialog = new CharEditCommon(this._oComponent);

			this._oEditDialog.open(oCharHeader, oInstance, jQuery.proxy(this._onCharEditStore, this, oCharHeader, iIndex, oCollection));
			// _smarthelp(oInstance, jQuery.proxy(this._onCharEditStore, this, oCharHeader, iIndex, oCollection));
		};
		var _onInnerControlsCreated = function (oCollection, oCharHeader, oEvent) {
			var that = this;
			if (oEvent.getParameters()[0] instanceof sap.m.Input) {
				oEvent.getParameters()[0].setValueHelpOnly(oEvent.getSource().getProperty("showValueHelp"));
				oEvent.getParameters()[0].setShowValueHelp(oEvent.getSource().getProperty("showValueHelp"));
				oEvent.getParameters()[0].setModel(oEvent.getSource().getModel());
				oEvent.getParameters()[0].attachValueHelpRequest(jQuery.proxy(_onCharEdit, that, this._oCollection, oCharHeader));
				if (oCharHeader._datatype == "NUM") {
					oEvent.getParameters()[0].setType("Number");
					oEvent.getParameters()[0].setMaxLength(oCharHeader._datalength);
				}
				if (oCharHeader._datatype == "CHAR") {
					oEvent.getParameters()[0].setMaxLength(oCharHeader._datalength);
				}
				// if (oCharHeader._datatype == "CURR") {
				// 	oEvent.getParameters()[0].setType("sap.ui.model.type.Currency");
				// }
			}
		};
		if (oCollection.getAdditional().charHeaderInfo != null) {
			var aCharHeaders = oCollection.getAdditional().charHeaderInfo.byOrder;

			for (var i = aCharHeaders.length - 1; i >= 0; i--) {
				var oCharHeader = aCharHeaders[i];
				if (oCharHeader._coledit == "")
					var coledit = false;
				else
					var coledit = true;

				var multiinp = oCharHeader._bIsMultiValue;
				// Build table header (Column objects).

				var sHeaderColumnText = oCharHeader.getLabel();
				var oHeaderColumnHeader = null;
				var oHeaderColumn = null;
				if (sHeaderColumnText != oComponent.getI18nBundle().getText("PropInstance.sortOrder")) {

					if (oCharHeader._valuehelppresent == "X") {
						var valhelp = true;
					} else {
						var valhelp = false;
					}
					this._valhelp = valhelp;
					var grpelement = new sap.ui.comp.smartform.GroupElement({
						label: sHeaderColumnText
					});
					var jmod = new JSONModel();
					jmod.setProperty("/radbtn", oCharHeader._isCheckBox);
					if (oCharHeader._bIsRealPhrase || oCharHeader._FLG_IS_PHR == "D") {
						if (oCharHeader._isCheckBox) {
							// oHeaderColumnHeader = new Text({});
							// oHeaderColumnHeader.setText(sHeaderColumnText);
							var switchfld = new sap.m.Switch({
								state: "{/0/" + oCharHeader._sFieldName + "/0/value}",
								enabled: bEditable && coledit,
								change: _onChange
							});
							// 	var switchfld = new smartfield({
							// 	dependents: oDataCell
							// });
							grpelement.insertElement(switchfld);
							// grpelement.insertElement(oDataCell);
							smartgrp.insertGroupElement(grpelement);
							jmod.setProperty("/valbindpath", "0/" + oCharHeader._sFieldName + "/0/value");
							jmod.setProperty("/multiinput", false);
							jmod.setProperty("/proplist", proplist);
							jmod.setProperty("/header", oCharHeader);
							switchfld.setModel(jmod, "prog");
							if (oCharHeader._Linked_prop != "") {
								for (var p = 0; p < proplist.length; p++) {
									if (proplist[p].PropListId == oCharHeader._Linked_prop) {
										proplist[p].Visible = oCollection.getModel().getProperty("/0/" + oCharHeader._sFieldName + "/0/value");

									}
								}
							}
						} else {
							if (multiinp) {

								var smartfield1 = new MultiInput({
									// text: "{/0/" + oCharHeader._sFieldName + "/value}",
									// textLabel: sHeaderColumnText,
									// textSeparator: "|",
									// value: "{/0/" + oCharHeader._sFieldName + "}",
									editable: bEditable && coledit,
									required: oCharHeader._mandatory,
									change: jQuery.proxy(_onChange, this),
									showValueHelp: valhelp,
									valueHelpOnly: valhelp,
									valueHelpRequest: jQuery.proxy(_onCharEdit, this, this._oCollection, oCharHeader)
								});
								// smartfield1.setTokens([
								// 	new Token({
								// 		text: "{value}",
								// 		key: "{phrase}"
								// 	})
								// ]);
								var tokens = oCollection.getModel().getProperty("/0/" + oCharHeader._sFieldName);
								for (var z = 0; z < tokens.length; z++) {
									smartfield1.addToken(new Token({
										text: tokens[z].value,
										key: tokens[z].phrase,
										editable: false
									}));
								}
								jmod.setProperty("/multiinput", true);

								jmod.setProperty("/header", oCharHeader);
							} else if (oCharHeader._datatype != "DATE") {
								var smartfield1 = new smartfield({
									value: "{/0/" + oCharHeader._sFieldName + "/0/value}",
									textLabel: sHeaderColumnText,
									editable: bEditable && coledit,
									mandatory: oCharHeader._mandatory,
									change: jQuery.proxy(_onChange, this),
									showValueHelp: valhelp,
									innerControlsCreated: jQuery.proxy(_onInnerControlsCreated, this, this._oCollection, oCharHeader)
								});
								jmod.setProperty("/multiinput", false);

								jmod.setProperty("/header", oCharHeader);
							} else {
								var datepick1 = new sap.m.DatePicker({
									dateValue: "{/0/" + oCharHeader._sFieldName + "/0/value}",
									change: jQuery.proxy(_onChange, this),
									editable: bEditable && coledit
								});
								datepick1.addEventDelegate({
									onAfterRendering: function () {
										var oDateInner = this.$().find('.sapMInputBaseInner');
										var oID = oDateInner[0].id;
										$('#' + oID).attr("disabled", "disabled");
									}
								}, datepick1);
								jmod.setProperty("/multiinput", false);
								jmod.setProperty("/header", oCharHeader);
							}
							// 	var smartfield1 = new smartfield({
							// 	dependents: oDataCell
							// });
							if (oCharHeader._datatype != "DATE") {
								grpelement.insertElement(smartfield1);
								smartgrp.insertGroupElement(grpelement);
								jmod.setProperty("/valbindpath", "0/" + oCharHeader._sFieldName + "/0/value");
								smartfield1.setModel(jmod, "prog");
							} else {
								grpelement.insertElement(datepick1);
								smartgrp.insertGroupElement(grpelement);
								jmod.setProperty("/valbindpath", "0/" + oCharHeader._sFieldName + "/0/value");
								datepick1.setModel(jmod, "prog");
							}
						}

					} else {
						if (oCharHeader._isCheckBox) {
							var switchfld = new sap.m.Switch({
								state: "{/0/" + oCharHeader._sFieldName + "/0/value}",
								enabled: bEditable && coledit,
								change: _onChange
							});
							// var switchfld = new smartfield({
							// 	dependents: oDataCell
							// });
							grpelement.insertElement(switchfld);

							// grpelement.insertElement(oDataCell);
							smartgrp.insertGroupElement(grpelement);
							jmod.setProperty("/valbindpath", "0/" + oCharHeader._sFieldName + "/0/value");
							jmod.setProperty("/multiinput", false);
							jmod.setProperty("/proplist", proplist);
							jmod.setProperty("/header", oCharHeader);
							switchfld.setModel(jmod, "prog");

							if (oCharHeader._Linked_prop != "") {
								for (var p = 0; p < proplist.length; p++) {
									if (proplist[p].PropListId == oCharHeader._Linked_prop) {

										proplist[p].Visible = oCollection.getModel().getProperty("/0/" + oCharHeader._sFieldName + "/0/value");
									}
								}
							}
						} else {
							if (multiinp) {
								var smartfield1 = new MultiInput({
									// text: "{/0/" + oCharHeader._sFieldName + "/value}",
									// textLabel: sHeaderColumnText,
									// textSeparator: "|",
									// value: "{/0/" + oCharHeader._sFieldName + "}",
									editable: bEditable && coledit,
									required: oCharHeader._mandatory,
									change: jQuery.proxy(_onChange, this),
									showValueHelp: valhelp,
									valueHelpOnly: valhelp,
									valueHelpRequest: jQuery.proxy(_onCharEdit, this, this._oCollection, oCharHeader)
								});
								var tokens = oCollection.getModel().getProperty("/0/" + oCharHeader._sFieldName);
								for (var z = 0; z < tokens.length; z++) {
									smartfield1.addToken(new Token({
										text: tokens[z].value,
										key: tokens[z].phrase,
										editable: false
									}));
								}
								jmod.setProperty("/multiinput", true);
								jmod.setProperty("/header", oCharHeader);
							} else if (oCharHeader._datatype != "DATE") {
								var smartfield1 = new smartfield({
									value: "{/0/" + oCharHeader._sFieldName + "/0}",
									textLabel: sHeaderColumnText,
									editable: bEditable && coledit,
									mandatory: oCharHeader._mandatory,
									change: jQuery.proxy(_onChange, this),
									showValueHelp: valhelp,
									innerControlsCreated: jQuery.proxy(_onInnerControlsCreated, this, this._oCollection, oCharHeader)
								});
								jmod.setProperty("/multiinput", false);
								jmod.setProperty("/header", oCharHeader);
							} else {
								var datepick1 = new sap.m.DatePicker({
									dateValue: "{/0/" + oCharHeader._sFieldName + "/0}",
									change: jQuery.proxy(_onChange, this),
									editable: bEditable && coledit
								});
								datepick1.addEventDelegate({
									onAfterRendering: function () {
										var oDateInner = this.$().find('.sapMInputBaseInner');
										var oID = oDateInner[0].id;
										$('#' + oID).attr("disabled", "disabled");
									}
								}, datepick1);
								jmod.setProperty("/multiinput", false);
								jmod.setProperty("/header", oCharHeader);
							}
							// var smartfield1 = new smartfield({
							// 	dependents: oDataCell
							// });

							if (oCharHeader._datatype != "DATE") {
								grpelement.insertElement(smartfield1);
								smartgrp.insertGroupElement(grpelement);
								jmod.setProperty("/valbindpath", "0/" + oCharHeader._sFieldName + "/0");
								smartfield1.setModel(jmod, "prog");
							} else {
								grpelement.insertElement(datepick1);
								smartgrp.insertGroupElement(grpelement);
								jmod.setProperty("/valbindpath", "0/" + oCharHeader._sFieldName + "/0");
								datepick1.setModel(jmod, "prog");
							}
						}
					}

				}
			}

			// var oTableManager = new TableManager(this._getOwnerComponent(), oTable, oTemplate);
			// oTableManager.setTableDeleteVisible(false);
			// oTableManager.setCollection(oCollection);
			oTable.setModel(oCollection.getModel());
			var delbtn = this._byId("delbtn");
			delbtn.setVisible(bEditable);

			var udtinstaddbtn = this._byId("udtinstadd");
			udtinstaddbtn.setVisible(bEditable);

			var addbtn = this._byId("addbtn");
			addbtn.setVisible(bEditable);

			var udtinstcmbbx = this._byId("cb_udtinst");
			udtinstcmbbx.setVisible(bEditable);

		}
		var _onselect = function (oEvent) {
			// This function is called when a field has been changed
			// by user.

			var aPathComps = oEvent.getSource().getBindingContext().getPath().split("/");
			assert(aPathComps.length == 2 &&
				aPathComps[0] == "", "Control should have absolute binding context path");

			var iIndex = parseInt(aPathComps[1]);

			var omod = oEvent.getSource().getModel();
			var Selectedst = oEvent.getSource().getSelected();
			var iLength = omod.getData().length;
			var stsel;
			if (Selectedst)
				stsel = "X";
			else
				stsel = "";
			var sBindingPath = "/" + iIndex + "/DELFLAG";
			omod.setProperty(sBindingPath, stsel);

			var sBindingPath = "/" + iIndex + "/" + ModelManagerAdmin.FullPropName.IntStatus;
			var sIntStatus = omod.getProperty(sBindingPath);

			// Entry state transition on field value change:
			// - EMPTY     -> NEW
			// - UNCHANGED -> MODIFIED
			// - MODIFIED  -> MODIFIED (no change)
			// - NEW       -> NEW      (no change)

			var sNewIntStatus = null;

			switch (sIntStatus) {
			case ModelManagerIntStatus.Empty:
				sNewIntStatus = ModelManagerIntStatus.New;
				break;

			case ModelManagerIntStatus.Unchanged:
				sNewIntStatus = ModelManagerIntStatus.Modified;
				break;
			}

			if (sNewIntStatus != null)
				omod.setProperty(sBindingPath, sNewIntStatus);

		};

		var udtab = this._byId("udt");
		this._udttab = udtab;
		var udtab1 = this._byId("udt1");
		this._udttab1 = udtab1;
		var rctcomp = this._byId("udt");

		if (layout == "UDT_INST") {
			oTable.setVisible(false);
			udtab.setVisible(false);
		} else {
			oTable.setVisible(true);
			udtab.setVisible(true);
		}

		if (this._udtinst) {

			var udtcmb = this._byId("cb1");
			udtcmb.setEditable(bEditable);

			var udtrtc = this._byId("cb_lang");
			udtrtc.setEditable(bEditable);

			this._byId("Rtc1").setEditable(bEditable);
			udtab1.setVisible(true);
			if (bEditable) {
				delbtn.setVisible(true);
				addbtn.setVisible(true);
				udtinstaddbtn.setVisible(true);
				udtinstcmbbx.setVisible(true);
			}

			this._oldudt = udtprop.collection.getModel();
			var udtdatlay = udtprop.collection.getModel().getData();

			for (var j = 0; j < udtdatlay.length; j++) {
				udtdatlay[j].LAYOUT = this._layout;
				udtdatlay[j].DELFLAG = "";
			}
			this._oldudt.setData(udtdatlay);

			var udtdata = udtprop.collection.getModel().getData();
			var udtdatnw = [];
			for (var j = 0; j < udtdata.length; j++) {
				// if (udtdata[j].RECN != "0") {
				udtdatnw.push(udtdata[j]);
				// }
			}
			var oModeludt = new sap.ui.model.json.JSONModel(udtdatnw);

			var cmbbxdat = [],
				insdat,
				dupl = false;
			for (var z = 0; z < udtdatnw.length; z++) {
				for (var m = 0; m < cmbbxdat.length; m++) {
					if (cmbbxdat[m].ORD == udtdatnw[z].ORD)
						dupl = true;
					else
						dupl = false;
				}
				if (!dupl) {
					cmbbxdat.push(udtdatnw[z]);
				}
			}

			var udtORG = new sap.ui.model.json.JSONModel(cmbbxdat);
			udtinstcmbbx.setModel(udtORG);
			this._cmbbxmod = udtORG;
			this._udtmod = oModeludt;
			udtab1.setModel(oModeludt);
			// udtinstcmbbx.setModel(oModeludt);
			this._cmbbxudt = udtinstcmbbx;
			if (udtdatnw.length != 0) {
				udtinstcmbbx.setSelectedKey(oModeludt.getData()[0].ORD);
				var selectedval = udtinstcmbbx.getSelectedKey();
				var aFilter = [];
				if (selectedval) {
					aFilter.push(new Filter("ORD", FilterOperator.Contains, selectedval));
				}
				// var udttabbind = this._udttab1.getBinding("items");
				var udttabbind = this._udttab1.getBinding("items");
				udttabbind.filter(aFilter);
			}
		} else {
			udtab1.setVisible(false);
			if (bEditable) {
				delbtn.setVisible(false);
				addbtn.setVisible(false);
				udtinstaddbtn.setVisible(false);
				udtinstcmbbx.setVisible(false);
			}
			if (udtprop != null) {

				var columnListItemrct = new sap.m.ColumnListItem();
				for (var k = 0; k < 2; k++) {
					if (k == 0) {
						oHeaderColumnHeader = new sap.m.Label({});
						oHeaderColumnHeader.setText(oComponent.getI18nBundle().getText("Name"));
						oHeaderColumn = new sap.m.Column({
							header: oHeaderColumnHeader,
							width: "20%"
						});
					} else if (k == 1) {
						oHeaderColumnHeader = new sap.m.Label({});
						oHeaderColumnHeader.setText(oComponent.getI18nBundle().getText("val"));
						oHeaderColumn = new sap.m.Column({
							header: oHeaderColumnHeader
						});
					}
					rctcomp.addColumn(oHeaderColumn);
				}
				columnListItemrct.addCell(new sap.m.Label({
					text: "{TEXTNAM}"
				}));
				columnListItemrct.addCell(new sap.ui.richtexteditor.RichTextEditor({
					value: "{TEXT}",
					change: _onChange,
					editable: bEditable,
					width: "100%"
				}));

				rctcomp.bindItems("/", columnListItemrct, null, null);
				var udtdata = udtprop.collection.getModel().getData();
				var oModeludt = new sap.ui.model.json.JSONModel(udtdata);
				udtab.setModel(oModeludt);
			} else {
				udtab.setVisible(false);
			}
		}

	};
	PropInstance.prototype = Object.create(PropBase.prototype);
	PropInstance.prototype.constructor = PropInstance;
	
	PropInstance.prototype._ValinputSuccess = function (oresp) {
		if (oresp.results[0]) {
			this._src.setValueState("Error");
			this._src.setValueStateText(oresp.results[0].MESSAGE);
		} else {
			this._src.setValueState("None");
			this._src.setValueStateText("");
		}

	};
	PropInstance.prototype._Langvalhelp = function (oEvent) {
		var srcfield = oEvent.getSource();
		var lang_valhelp = new LangValueHelp(this._oComponent, this._treenode, this._udtmod, this._oldudt, srcfield);
	};
	PropInstance.prototype._onCharEdit = function (oCollection, oCharHeader, oEvent) { //FIXMEVC:refactor
		var iInstanceIndex = oCollection.getEntryIndexOfControl(oEvent.getSource());
		var oInstance = oCollection.getEntry(iInstanceIndex);
		oCharHeader.openEdit(oInstance, jQuery.proxy(this._onCharEditStore, this, oCharHeader, iInstanceIndex, oCollection));
	};
	PropInstance.prototype._onCmbChange = function (oEvent) {
		var cmbmod = oEvent.getSource().getModel();
		var selectedval = oEvent.getSource().getSelectedKey();
		var aFilter = [];
		if (selectedval) {
			aFilter.push(new Filter("ORD", FilterOperator.Contains, selectedval));
		}
		// var udttabbind = this._udttab1.getBinding("items");
		var udttabbind = this._udttab1.getBinding("items");
		udttabbind.filter(aFilter);
	};
	PropInstance.prototype._oneditinst = function (oEvent) {
		var aPathComps = oEvent.getSource().getBindingContext().getPath().split("/");
		assert(aPathComps.length == 2 &&
			aPathComps[0] == "", "Control should have absolute binding context path");

		var iIndex = parseInt(aPathComps[1]);

		var omod = oEvent.getSource().getModel();
		var sBindingPath = "/" + iIndex + "/";
		var rowmod = omod.getProperty(sBindingPath);
		var editusage = new UsageDiag(this._oComponent, rowmod, this._treenode);
	};
	PropInstance.prototype._onselect = function (oEvent) {
		var aPathComps = oEvent.getSource().getBindingContext().getPath().split("/");
		assert(aPathComps.length == 2 &&
			aPathComps[0] == "", "Control should have absolute binding context path");

		var iIndex = parseInt(aPathComps[1]);

		var omod = oEvent.getSource().getModel();
		var Selectedst = oEvent.getSource().getSelected();
		var iLength = omod.getData().length;
		var stsel;
		if (Selectedst)
			stsel = "X";
		else
			stsel = "";
		var sBindingPath = "/" + iIndex + "/DELFLAG";
		omod.setProperty(sBindingPath, stsel);

		var sBindingPath = "/" + iIndex + "/" + ModelManagerAdmin.FullPropName.IntStatus;
		var sIntStatus = omod.getProperty(sBindingPath);

		// Entry state transition on field value change:
		// - EMPTY     -> NEW
		// - UNCHANGED -> MODIFIED
		// - MODIFIED  -> MODIFIED (no change)
		// - NEW       -> NEW      (no change)

		var sNewIntStatus = null;

		switch (sIntStatus) {
		case ModelManagerIntStatus.Empty:
			sNewIntStatus = ModelManagerIntStatus.New;
			break;

		case ModelManagerIntStatus.Unchanged:
			sNewIntStatus = ModelManagerIntStatus.Modified;
			break;
		}

		if (sNewIntStatus != null)
			omod.setProperty(sBindingPath, sNewIntStatus);

	};
	PropInstance.prototype._onChange = function (oEvent) {
		var aPathComps = oEvent.getSource().getBindingContext().getPath().split("/");
		assert(aPathComps.length == 2 &&
			aPathComps[0] == "", "Control should have absolute binding context path");

		var iIndex = parseInt(aPathComps[1]);

		var omod = oEvent.getSource().getModel();

		var iLength = omod.getData().length;

		var sBindingPath = "/" + iIndex + "/" + ModelManagerAdmin.FullPropName.IntStatus;
		var sIntStatus = omod.getProperty(sBindingPath);

		// Entry state transition on field value change:
		// - EMPTY     -> NEW
		// - UNCHANGED -> MODIFIED
		// - MODIFIED  -> MODIFIED (no change)
		// - NEW       -> NEW      (no change)

		var sNewIntStatus = null;

		switch (sIntStatus) {
		case ModelManagerIntStatus.Empty:
			sNewIntStatus = ModelManagerIntStatus.New;
			break;

		case ModelManagerIntStatus.Unchanged:
			sNewIntStatus = ModelManagerIntStatus.Modified;
			break;
		}

		if (sNewIntStatus != null)
			omod.setProperty(sBindingPath, sNewIntStatus);
	};
	PropInstance.prototype._onDelete = function (oEvent) {
		var udtdat = this._udtmod.getData();
		for (var i = 0; i < udtdat.length; i++) {
			if (udtdat[i].DELFLAG == "X") {
				udtdat.splice(i, 1);
				i--;
			}
		}
		this._udtmod.refresh();
	};
	PropInstance.prototype._onAdd = function (oEvent) {

		var udtdat = this._udtmod.getData();
		var cmbbxselectedkey = this._cmbbxudt.getSelectedKey();
		if (cmbbxselectedkey != "") {
			if (udtdat.length != 0) {
				for (var k = 0; k < udtdat.length; k++) {
					if (udtdat[k].ORD == cmbbxselectedkey) {
						var extdat = udtdat[k];
					}
				}
				if (extdat != "" && !extdat) {

					var udtlast = jQuery.extend(true, {}, extdat);
					udtlast.ORD = cmbbxselectedkey;
					udtlast._ModelManagerADMIN.intStatus = ModelManagerIntStatus.Modified;
					udtlast.DELFLAG = "";
					udtlast.TEXT = "";
					udtlast.RECN = "0";
					udtlast.LANGU = "";

				} else {
					var udtinit = this._oldudt.getProperty(this._cmbbxudt.getSelectedItem().getBindingContext().sPath);
					var udtlast = jQuery.extend(true, {}, udtinit);
					udtlast._ModelManagerADMIN.intStatus = ModelManagerIntStatus.Modified;
					udtlast.DELFLAG = "";
					udtlast.TEXT = "";
					udtlast.RECN = "0";
					udtlast.LANGU = "";
				}
			} else {
				var udtinit = this._oldudt.getProperty(this._cmbbxudt.getSelectedItem().getBindingContext().sPath);
				var udtlast = jQuery.extend(true, {}, udtinit);
				udtlast._ModelManagerADMIN.intStatus = ModelManagerIntStatus.Modified;
				udtlast.DELFLAG = "";
				udtlast.TEXT = "";
				udtlast.RECN = "0";
				udtlast.LANGU = "";
			}

			var udtolddat = this._oldudt.getData();
			udtolddat.push(udtlast);

			udtdat.push(udtlast);
			this._udtmod.refresh();
		} else {
			var errormsg = this._oComponent.getI18nBundle().getText("validinstance");
			sap.m.MessageToast.show(errormsg);
		}

	};

	PropInstance.prototype._onAddCountry = function (oEvent) {
		var editusage = new AddCountry(this._oComponent, this._treenode, this._udtmod, this._oldudt);

	};

	PropInstance.prototype._onCharEditStore = function (oCharHeader, iInstanceIndex, oCollection, aCharValues, bNoUpdate) { // FIXMEVC: refactor
		oCollection.setFieldValue(iInstanceIndex, oCharHeader.getFieldName(), aCharValues, bNoUpdate);

		var multiinput = this._inpsrc.getModel("prog").getData().multiinput;
		if (multiinput)
			this._inpsrc.removeAllTokens();
		if (multiinput) {
			for (var i = 0; i < aCharValues.length; i++) {
				this._inpsrc.addToken(new Token({
					text: aCharValues[i].value,
					key: aCharValues[i].phrase,
					editable: false
				}));
			}
		}
	};
	PropInstance.prototype._CreateInstanceSuccess = function (oData) {
		var udtdat = this._udtmod.getData();

		if (udtdat.length != 0) {
			var udtlast = jQuery.extend(true, {}, udtdat[udtdat.length - 1]);
			udtlast.ACTN = oData.ACTN;
			udtlast.ORD = "0001";
			udtlast.RECNPARENT = oData.RECNPARENT;
			udtlast.RECNROOT = oData.RECNROOT;
			udtlast.ACTN_VP = oData.ACTN_VP;
			udtlast.RECN_VP = oData.RECN_VP;
			udtlast._ModelManagerADMIN.intStatus = ModelManagerIntStatus.Modified;
			udtlast.DELFLAG = "";

			var udtolddat = this._oldudt.getData();
			udtolddat.push(udtlast);

			udtdat.push(udtlast);
			this._udtmod.refresh();
		} else {
			udtdat = this._oldudt.getData();
			var udtlast = jQuery.extend(true, {}, udtdat[0]);
			udtlast.ACTN = oData.ACTN;
			udtlast.RECNPARENT = oData.RECNPARENT;
			udtlast.RECNROOT = oData.RECNROOT;
			udtlast.ACTN_VP = oData.ACTN_VP;
			udtlast.RECN_VP = oData.RECN_VP;
			udtlast._ModelManagerADMIN.intStatus = ModelManagerIntStatus.Modified;
			udtlast.DELFLAG = "";

			var udtolddat = this._oldudt.getData();
			if (udtolddat[0].RECN == "0") {
				udtolddat.splice(0, 1);
				udtolddat.push(udtlast);
			}
			var udtdat = this._udtmod.getData();
			udtdat.push(udtlast);
			this._udtmod.refresh();
		}

	};
	PropInstance.prototype._infopop = function (oEvent) {

		this._oevent = oEvent;
		var sServiceUrl = "/sap/opu/odata/GMT/VC_ODATA_SRV";
		var oDatModel = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
		var that = this;
		var mParameters = {
			method: "GET",
			urlParameters: {
				"ESTCAT": that._estcat
			},
			context: null,
			success: function (OData, response) {
				that._oDialogadd = that._oComponent.getNavigator().createFragment("gramont.VCDSM.specedit.frag.helpopup", that);
				that._Odiahelp = new JSONModel();
				that._Odiahelp.setProperty("/aData", OData.Info);
				that._oDialogadd.control.setModel(that._Odiahelp, "resModel");

				that._oDialogadd.control.openBy(that._oevent.getSource());

				that.getOwnerComponent().getNavigator().releaseBusyDialog();
			},
			error: function (oError) {
				sap.m.MessageToast.show(oError.message);
				that.getOwnerComponent().getNavigator().releaseBusyDialog();
			},
			async: true
		};
		oDatModel.callFunction("/GetVatInfo", mParameters);
		this.getOwnerComponent().getNavigator().requireBusyDialog();

	};
	return PropInstance;
});