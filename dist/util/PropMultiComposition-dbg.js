// This is the controller which is implementing multi-level composition.

sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"gramont/VCDSM/specedit/util/PropBase",
	"gramont/VCDSM/specedit/util/MultilevelAdd",
	"gramont/VCDSM/specedit/util/ModelManagerAdmin",
	"gramont/VCDSM/specedit/util/ModelManagerAutoGrowOp",
	"gramont/VCDSM/specedit/util/ModelManagerIntStatus",
	"sap/m/MessageToast",
	"sap/base/assert"
], function (JSONModel, PropBase, MultilevelAdd, ModelManagerAdmin, ModelManagerAutoGrowOp,
	ModelManagerIntStatus, MessageToast, assert) {
	"use strict";

	var PropMultiComposition = function (oComponent, oTreeNode, oCollection, bEditable, udtprop, speckey, estcat, proplist, oPropInfo,
		propindex) {
		PropBase.call(this, oComponent, "gramont.VCDSM.specedit.frag.PropMultiComposition");
		
		
		this._subsec = this._byId("mlcsubsec");
		
		proplist[propindex].propid = this._subsec;
		this._subsec.setVisible(oPropInfo.Visible);
		
		this._estcat = oTreeNode.ESTCAT;
		this._oComponent = oComponent;
		// Setup prop model.//FIXME:dup
		this.speckey = speckey;
		this.estcat = estcat;
		var oPropModel = new JSONModel();
		this.cl1 = this._byId("Cl1");
		this.cl2 = this._byId("Cl2");
		this.cl3 = this._byId("Cl3");
		this.OBref = this._byId("OBRef");
		this.treetable = this._byId("MultiComp");
		this.cl1cnt = 0;
		this.colinf2 = [];
		this.colinf3 = [];
		this.coldat2 = [];
		this.coldat3 = [];
		this.delnodepaths = [];
		var oPropControl = this.getControl();
		oPropControl.setModel(oPropModel, "propModel");

		oPropModel.setProperty("/title", oTreeNode.TEXT);

		var treetab = this._byId("MultiComp");

		var aCompositions = oCollection.getModel().getData();

		for (var l = 0; l < aCompositions.length; l++) {
			if (aCompositions[l].EXP_LEVEL == "") {
				aCompositions.splice(l, 1);
				l--;
			}
		}
		this._acompsr = oCollection.getModel();

		var childnodes = 0,
			x = 0,
			temp,
			maxnodelvl;
		var cnodes = [],
			aComp = [];
		this.levelcnt1 = 0;
		this.levelcnt2 = 0;
		this.levelcnt3 = 0;
		for (var z = 0; z < aCompositions.length; z++) {
			if (aCompositions[z].EXP_LEVEL == 1) {
				aCompositions[z].ITOTVALVIS0 = true;
				aCompositions[z].ITOTVALVIS1 = false;
				aCompositions[z].ITOTVALVIS2 = false;
				aCompositions[z].ITOTVALVIS3 = false;

				aCompositions[z].ADDCHDBTN = true;
			} else if (aCompositions[z].EXP_LEVEL == 2) {
				aCompositions[z].ITOTVALVIS0 = false;
				aCompositions[z].ITOTVALVIS1 = true;
				aCompositions[z].ITOTVALVIS2 = false;
				aCompositions[z].ITOTVALVIS3 = false;

				aCompositions[z].ADDCHDBTN = true;
				this.levelcnt1++;

			} else if (aCompositions[z].EXP_LEVEL == 3) {
				aCompositions[z].ITOTVALVIS0 = false;
				aCompositions[z].ITOTVALVIS1 = false;
				aCompositions[z].ITOTVALVIS2 = true;
				aCompositions[z].ITOTVALVIS3 = false;

				aCompositions[z].ADDCHDBTN = true;
				this.levelcnt2++;

			} else if (aCompositions[z].EXP_LEVEL == 4) {
				aCompositions[z].ITOTVALVIS0 = false;
				aCompositions[z].ITOTVALVIS1 = false;
				aCompositions[z].ITOTVALVIS2 = false;
				aCompositions[z].ITOTVALVIS3 = true;

				aCompositions[z].ADDCHDBTN = false;
				this.levelcnt3++;
			} else {
				aCompositions[z].ADDCHDBTN = false;
			}
			aCompositions[z].DELFLG = "";
		}

		for (var z = 0; z < aCompositions.length; z++) {
			for (var y = 0; y < aCompositions.length; y++) {
				if (aCompositions[z].ITEM_KEY == aCompositions[y].PARENT_KEY && aCompositions[z].EXP_LEVEL < aCompositions[y].EXP_LEVEL) {
					childnodes++;
				}
				if (y != 0 && aCompositions[y].EXP_LEVEL > temp) {
					temp = aCompositions[y].EXP_LEVEL;
				} else if (y == 0) {
					temp = aCompositions[0].EXP_LEVEL;
				}
			}
			aCompositions[z].NoofChildnodes = childnodes;
			childnodes = 0;
		}

		for (z = aCompositions.length - 1; z >= 0; z--) {
			for (y = 0; y < aCompositions.length; y++) {
				if (aCompositions[z].ITEM_KEY == aCompositions[y].PARENT_KEY && aCompositions[z].EXP_LEVEL < aCompositions[y].EXP_LEVEL) {
					cnodes[x] = aCompositions[y];
					x++;
				}
			}
			aCompositions[z].aCompositions = cnodes;
			cnodes = [];
			x = 0;
		}
		for (z = 0; z < aCompositions.length; z++) {
			if (aCompositions[z].PARENT_KEY == "0") {
				aComp.push(aCompositions[z]);
			}
		}

		var oModel = new sap.ui.model.json.JSONModel(aComp);

		this._compnewr = oModel;
		treetab.setModel(oModel);
		this._referval();
		// FIXME: implement logic here
	};

	PropMultiComposition.prototype = Object.create(PropBase.prototype);
	PropMultiComposition.prototype.constructor = PropMultiComposition;

	PropMultiComposition.prototype._ontogglestate = function (oEvent) {

		var explvl = oEvent.getSource().getModel().getProperty(oEvent.getParameters().rowContext.sPath + "/EXP_LEVEL");
		var spath = oEvent.getParameters().rowContext.sPath;
		var expstate = oEvent.getParameters().expanded;
		var data = oEvent.getSource().getModel();
		var itmkey = oEvent.getSource().getModel().getProperty(oEvent.getParameters().rowContext.sPath + "/ITEM_KEY");

		if (expstate == true) {
			if (explvl == 1) {

				this.cl1.setVisible(true);
				this.cl1cnt++;
			} else if (explvl == 2) {
				this.cl2cnt = this.colinf2.length;
				this.cl2.setVisible(true);
				this.coldat2["vis"] = true;
				this.coldat2["path"] = spath;
				this.colinf2[this.cl2cnt] = jQuery.extend({}, this.coldat2);

			} else if (explvl == 3) {
				var path2 = spath.split("/");
				var pathsec;
				for (var h = 1; h < 4; h++) {
					if (h == 1)
						pathsec = "/" + path2[h];
					else
						pathsec = pathsec + "/" + path2[h];
				}
				this.cl3.setVisible(true);
				this.cl3cnt = this.colinf3.length;
				this.coldat3["vis"] = true;
				this.coldat3["path"] = spath;
				this.coldat3["pathsec"] = pathsec;
				this.colinf3[this.cl3cnt] = jQuery.extend({}, this.coldat3);
			}
		} else {
			if (explvl == 1) {
				if (this.cl1cnt == 1) {
					this.cl1.setVisible(false);
					this.cl2.setVisible(false);
					this.cl3.setVisible(false);
					this.cl1cnt--;
					this.colinf1 = [];
					this.colinf2 = [];
					this.colinf3 = [];
					this.cl2cnt = 0;
					this.cl3cnt = 0;
				} else if (this.cl1cnt > 1 && this.colinf2.length == 0 && this.colinf3.length == 0) {
					this.cl1cnt--;
				} else if (this.cl1cnt > 1 && this.colinf2.length != 0) {
					if (this.colinf3.length == 0) {
						for (var k = 0; k < this.colinf2.length; k++) {
							if (data.getProperty(this.colinf2[k].path + "/PARENT_KEY") == itmkey && this.colinf2.length == 1) {
								this.cl2.setVisible(false);
								this.colinf2.splice(k, 1);
							} else if (data.getProperty(this.colinf2[k].path + "/PARENT_KEY") == itmkey && this.colinf2.length > 1) {
								this.colinf2.splice(k, 1);
							}
						}
						this.cl1cnt--;
					} else {
						for (k = 0; k < this.colinf3.length; k++) {
							if (data.getProperty(this.colinf3[k].pathsec + "/PARENT_KEY") == itmkey && this.colinf3.length == 1 && this.colinf2.length == 1) {
								this.cl3.setVisible(false);
								this.cl2.setVisible(false);
								this.colinf3 = [];
								this.colinf2.splice(0, 1);
							} else if (data.getProperty(this.colinf3[k].pathsec + "/PARENT_KEY") == itmkey && this.colinf3.length != 1 && this.colinf2.length ==
								1) {
								this.cl3.setVisible(false);
								this.cl2.setVisible(false);
								this.colinf3 = [];
								this.colinf2.splice(0, 1);
							} else if (data.getProperty(this.colinf3[k].pathsec + "/PARENT_KEY") == itmkey && this.colinf3.length != 1 && this.colinf2.length >
								1) {
								this.colinf3.splice(k, 1);
							} else if (data.getProperty(this.colinf3[k].pathsec + "/PARENT_KEY") == itmkey && this.colinf3.length == 1 && this.colinf2.length >
								1) {
								this.colinf3.splice(k, 1);
								this.cl3.setVisible(false);
								for (var l = 0; l < this.colinf2.length; l++) {
									if (data.getProperty(this.colinf2[l].path + "/PARENT_KEY") == itmkey && this.colinf2.length == 1) {
										this.cl2.setVisible(false);
										this.colinf2.splice(l, 1);
									} else if (data.getProperty(this.colinf2[l].path + "/PARENT_KEY") == itmkey && this.colinf2.length > 1) {
										this.colinf2.splice(l, 1);
									}
								}
							}
						}
						this.cl1cnt--;
					}

				}
			} else if (explvl == 2) {
				for (k = 0; k < this.colinf2.length; k++) {
					if (this.colinf2.length == 1 && this.colinf3.length == 0) {
						this.cl2.setVisible(false);
						this.colinf2.splice(k, 1);
					} else if (this.colinf2.length == 1 && this.colinf3.length == 1 && data.getProperty(this.colinf2[k].path + "/ITEM_KEY") == itmkey &&
						data.getProperty(this.colinf3[0].path + "/PARENT_KEY") == itmkey) {
						this.cl2.setVisible(false);
						this.colinf2.splice(k, 1);
						this.cl3.setVisible(false);
						this.colinf3.splice(k, 1);
					} else if (this.colinf2.length > 1 && data.getProperty(this.colinf2[k].path + "/ITEM_KEY") == itmkey) {
						for (l = 0; l < this.colinf3.length; l++) {
							if (data.getProperty(this.colinf3[l].path + "/PARENT_KEY") == itmkey && this.colinf3.length > 1) {
								this.colinf3.splice(l, 1);
							} else if (data.getProperty(this.colinf3[l].path + "/PARENT_KEY") == itmkey && this.colinf3.length == 1) {
								this.colinf3.splice(l, 1);
								this.cl3.setVisible(false);
							}
						}
						this.colinf2.splice(k, 1);
					}
				}

			} else if (explvl == 3) {

				for (l = 0; l < this.colinf3.length; l++) {
					if (this.colinf3.length == 1) {
						this.cl3.setVisible(false);
						this.colinf3 = [];
					} else if (this.colinf3.length > 1) {
						if (itmkey == data.getProperty(this.colinf3[l].path + "/ITEM_KEY")) {
							this.colinf3.splice(l, 1);
						}
					}
				}
			}
		}
	};
	PropMultiComposition.prototype.addchildnode = function (oEvent) {

		this._childnodepath = oEvent.getSource().getBindingContext().getPath();
		var itemkey = this._compnewr.getProperty(this._childnodepath).ITEM_KEY;
		if (itemkey == "") {
			MessageToast.show(this._oComponent.getI18nBundle().getText("errorcnodecreation"));
		} else {
			var childnode = true;
			var multileveladd = new MultilevelAdd(this._oComponent, this._childnodepath, this._compnewr, this._acompsr, childnode, this.OBref,
				this.speckey, this.estcat);
		}

	};
	PropMultiComposition.prototype.addparentnode = function (oEvent) {
		var ilength = this._compnewr.getData().length;
		var cparpath = "/" + (ilength - 1);
		var childnode = false;
		var multileveladd = new MultilevelAdd(this._oComponent, cparpath, this._compnewr, this._acompsr, childnode, this.OBref, this.speckey,
			this.estcat);
	};
	PropMultiComposition.prototype._onChange = function (oEvent) {
		// This function is called when a field has been changed
		// by user.
		var aPathComps = oEvent.getSource().getBindingContext().getPath();
		var omod = oEvent.getSource().getModel();

		var iLength = omod.getData().length;

		var sBindingPath = aPathComps + "/" + ModelManagerAdmin.FullPropName.IntStatus;
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

		this._referval();
	};
	PropMultiComposition.prototype._Expandall = function (oEvent) {
		this.treetable.expandToLevel(4);
		var aCompositions = this._acompsr.getData();
		for (var z = 0; z < aCompositions.length; z++) {
			if (aCompositions[z].EXP_LEVEL == 2) {
				this.levelcnt1++;
			} else if (aCompositions[z].EXP_LEVEL == 3) {
				this.levelcnt2++;

			} else if (aCompositions[z].EXP_LEVEL == 4) {
				this.levelcnt3++;
			}
		}

		if (this.levelcnt1 > 0)
			this.cl1.setVisible(true);
		if (this.levelcnt2 > 0)
			this.cl2.setVisible(true);
		if (this.levelcnt3 > 0)
			this.cl3.setVisible(true);

		this.colinf2 = [];
		this.colinf3 = [];
		this.cl1cnt = 0;

		var delmod = this._compnewr.getData();
		for (var u = 0; u < delmod.length; u++) {
			if (delmod[u].NoofChildnodes > 0) {
				var delmodc1 = delmod[u].aCompositions;
				for (var v = 0; v < delmodc1.length; v++) {
					var sPathp = "/" + u + "/aCompositions/" + v;
					if (delmodc1[v].NoofChildnodes > 0) {
						var delmodc2 = delmodc1[v].aCompositions;
						for (var w = 0; w < delmodc2.length; w++) {
							var sPathc1 = sPathc1 + "/aCompositions/" + w;
							if (delmodc2[w].NoofChildnodes > 0) {
								var path2 = sPathc1.split("/");
								var pathsec;
								for (var h = 1; h < 4; h++) {
									if (h == 1)
										pathsec = "/" + path2[h];
									else
										pathsec = pathsec + "/" + path2[h];
								}
								this.cl3cnt = this.colinf3.length;
								this.coldat3["vis"] = true;
								this.coldat3["path"] = sPathc1;
								this.coldat3["pathsec"] = pathsec;
								this.colinf3[this.cl3cnt] = jQuery.extend({}, this.coldat3);
							}
						}
						this.cl2cnt = this.colinf2.length;
						this.cl2.setVisible(true);
						this.coldat2["vis"] = true;
						this.coldat2["path"] = sPathp;
						this.colinf2[this.cl2cnt] = jQuery.extend({}, this.coldat2);
					}
				}
				this.cl1cnt++;
			}
		}
	};
	PropMultiComposition.prototype._Collapseall = function (oEvent) {
		this.treetable.collapseAll();

		this.cl1.setVisible(false);
		this.cl2.setVisible(false);
		this.cl3.setVisible(false);

		this.colinf2 = [];
		this.colinf3 = [];
		this.cl1cnt = 0;

	};
	PropMultiComposition.prototype._Delflagset = function (oEvent) {

		if (!this._clearselect) {
			var iCurrRowIndex = oEvent.getParameter("rowIndex");
			var aSelInd = oEvent.getSource().getSelectedIndices();

			var aPathdel = oEvent.getParameters().rowContext.sPath;

			if (aSelInd.indexOf(iCurrRowIndex) == -1) {
				for (var m = 0; m < this.delnodepaths.length; m++) {
					if (this.delnodepaths[m] == aPathdel) {
						this.delnodepaths.splice(m, 1);
					}
				}
			} else {
				this.delnodepaths[this.delnodepaths.length] = aPathdel;
			}
		} else {
			this._clearselect = false;
		}

	};
	PropMultiComposition.prototype.deletenode = function (oEvent) {

		var delnodep = null,
			delnodec1 = null,
			delnodec2 = null,
			delnodec3 = null,
			delpatharr = [];

		for (var n = 0; n < this.delnodepaths.length; n++) {

			delnodep = this._compnewr.getProperty(this.delnodepaths[n]);
			delnodep.DELFLG = "X";
			delnodep._ModelManagerADMIN.intStatus = ModelManagerIntStatus.Modified;
			if (delnodep.NoofChildnodes > 0) {
				for (var p = 0; p < delnodep.NoofChildnodes; p++) {
					delnodec1 = this._compnewr.getProperty(this.delnodepaths[n] + "/aCompositions");
					delnodec1[p].DEFLG = "X";
					delnodec1[p]._ModelManagerADMIN.intStatus = ModelManagerIntStatus.Modified;
					if (delnodec1[p].NoofChildnodes > 0) {
						for (var q = 0; q < delnodec1[p].NoofChildnodes; q++) {
							delnodec2 = this._compnewr.getProperty(this.delnodepaths[n] + "/aCompositions/" + p + "/aCompositions");
							delnodec2[q].DELFLG = "X";
							delnodec2[q]._ModelManagerADMIN.intStatus = ModelManagerIntStatus.Modified;
							if (delnodec2[q].NoofChildnodes > 0) {
								for (var r = 0; r < delnodec2[q].NoofChildnodes; r++) {
									delnodec3 = this._compnewr.getProperty(this.delnodepaths[n] + "/aCompositions/" + p + "/aCompositions/" + q + "/aCompositions");
									delnodec3[r].DELFLG = "X";
									delnodec3[p]._ModelManagerADMIN.intStatus = ModelManagerIntStatus.Modified;
								}
							}
						}
					}
				}
			}
		}

		this._clearselect = true;
		this.treetable.clearSelection();
		var delmod = this._compnewr.getData();
		for (var u = 0; u < delmod.length; u++) {
			if (delmod[u].NoofChildnodes > 0) {
				var delmodc1 = delmod[u].aCompositions;
				for (var v = 0; v < delmodc1.length; v++) {
					if (delmodc1[v].NoofChildnodes > 0) {
						var delmodc2 = delmodc1[v].aCompositions;
						for (var w = 0; w < delmodc2.length; w++) {
							if (delmodc2[w].NoofChildnodes > 0) {
								var delmodc3 = delmodc2[w].aCompositions;
								for (var x = 0; x < delmodc3.length; x++) {
									if (delmodc3[x].DELFLG == "X") {
										delmodc3.splice(x, 1);
										x--;
										delmodc2[w].NoofChildnodes--;
									}
								}
							}
							if (delmodc2[w].DELFLG == "X") {
								delmodc2.splice(w, 1);
								w--;
								delmodc1[v].NoofChildnodes--;
							}
						}
					}
					if (delmodc1[v].DELFLG == "X") {
						delmodc1.splice(v, 1);
						v--;
						delmod[u].NoofChildnodes--;
					}

				}
			}
			if (delmod[u].DELFLG == "X") {
				delmod.splice(u, 1);
				u--;
			}
		}
		this._compnewr.refresh();
		this.delnodepaths = [];
		this._referval();
		this._Collapseall();
	};
	PropMultiComposition.prototype._referval = function () {
		var refval = 0,
			refstate = null;
		var refdat = this._compnewr.getData();
		for (var d = 0; d < refdat.length; d++) {
			refval = refval + parseInt(refdat[d].COMPAVG);
		}
		if (refval < 100) {
			refstate = "Warning";
		} else {
			refstate = "Success";
		}
		refval = refval + "%";
		this.OBref.setText(refval);
		this.OBref.setState(refstate);
	};
	PropMultiComposition.prototype._infopop = function (oEvent) {

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
				that._oDialogadd = that._oComponent.getNavigator().createFragment("gramont.vc.specedit.frag.helpopup", that);
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
	return PropMultiComposition;
});