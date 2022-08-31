/*
 * SaveHandler: Execute series of UI actions during save/reset.
 */

sap.ui.define([
	"sap/base/assert",
	"gramont/VCDSM/specedit/util/Util"
], function (assert, Util) {
	"use strict";

	var SaveHandler = function (oComponent) {
		this._oComponent = oComponent;
		this._oSpecificationKey = null;
		this._aBeforeSaveCbs = [];
		this._aAfterSaveCbs = [];
		this._aAfterResetCbs = [];
	};

	SaveHandler.prototype.setSpecificationKey = function (oSpecificationKey) {
		this._oSpecificationKey = oSpecificationKey;
	};

	SaveHandler.prototype.attachBeforeSave = function (fBeforeSaveCb) {
		// Attach before save action.

		this._aBeforeSaveCbs.push(fBeforeSaveCb);
	};

	SaveHandler.prototype.attachAfterSave = function (fAfterSaveCb) {
		// Attach after save action.

		this._aAfterSaveCbs.push(fAfterSaveCb);
	};

	SaveHandler.prototype.attachAfterReset = function (fAfterResetCb) {
		// Attach after reset action.

		this._aAfterResetCbs.push(fAfterResetCb);
	};

	SaveHandler.prototype.needSave = function () {
		// Check for unsaved changes.

		assert(this._oSpecificationKey, "oSpecificationKey should be set");

		var bNeedSave = this._oComponent.getModelManager().needSaveForSpecificationByKey(this._oSpecificationKey);
		return bNeedSave;
	};

	SaveHandler.prototype.save = function () {
		this._save(true, null);
	};

	SaveHandler.prototype.reset = function () {
		this._reset(true, null);
	};

	SaveHandler.prototype.confirmAndSave = function (sMessage, bCancel, fContinue) {
		var _fContinue = function (bContinue) {
			// bContinue:
			// - true (operation can continue): there were no unsaved changes, or user clicked on yes and save was successful.
			// - false: user clicked on no.
			// - null (cancel operation): user clicked on cancel, or user clicked on yes and save was unsuccessful.

			if (fContinue)
				fContinue(bContinue);
		};

		if (this.needSave()) {
			Util.showMessageBox(this._oComponent, {
				type: Util.MessageBoxType.Confirm,
				message: sMessage,
				cancel: bCancel
			}, jQuery.proxy(this._onConfirmAndSaveConfirm, this, _fContinue));
		} else {
			// If no changes, then we still need to invoke callbacks.

			var fSaveDone = function (oSaveInfo) {
				_fContinue(true);
			};

			this._save(false, fSaveDone);
		}
	};

	SaveHandler.prototype.confirmAndReset = function (sMessage, fContinue, key) {
		var _fContinue = function (bContinue) {
			// bContinue:
			// - true (operation can continue): there were no unsaved changes, or user clicked on yes.
			// - false: user clicked on no.

			if (fContinue)
				fContinue(bContinue);
		};
		this._key = key;
		if (this.needSave()) {
			Util.showMessageBox(this._oComponent, {
				type: Util.MessageBoxType.Confirm,
				message: sMessage
			}, jQuery.proxy(this._onConfirmAndResetConfirm, this, _fContinue));
		} else {
			// If no changes, then we still need to invoke callbacks.

			var fResetDone = function () {
				_fContinue(true);
			};

			this._reset(false, fResetDone);
		}
	};

	SaveHandler.prototype._save = function (bInvoke, fSaveDone) {
		assert(this._oSpecificationKey, "oSpecificationKey should be set");

		this._runCbs(this._aBeforeSaveCbs, []);

		var aAfterSaveCbs = this._aAfterSaveCbs.slice(0);
		if (fSaveDone)
			aAfterSaveCbs.push(fSaveDone);

		var _fSaveDone = jQuery.proxy(this._afterSave, this, aAfterSaveCbs);

		if (bInvoke) {
			this._oComponent.getModelManager().saveSpecificationByKey(this._oSpecificationKey, _fSaveDone);
		} else {
			var oSaveInfo = this._oComponent.getModelManager().createSaveInfo(true, []);
			_fSaveDone(oSaveInfo);
		}
	};

	SaveHandler.prototype._afterSave = function (aAfterSaveCbs, oSaveInfo) {
		this._runCbs(aAfterSaveCbs, [oSaveInfo]);
	};

	SaveHandler.prototype._reset = function (bInvoke, fResetDone) {
		assert(this._oSpecificationKey, "oSpecificationKey should be set");

		if (this._key == "maintain" || this._bOK == true) {
			if (bInvoke)
				this._oComponent.getModelManager().resetSpecificationByKey(this._oSpecificationKey);
		}
		var aAfterResetCbs = this._aAfterResetCbs.slice(0);
		if (fResetDone)
			aAfterResetCbs.push(fResetDone);

		this._runCbs(aAfterResetCbs, []);
	};

	SaveHandler.prototype._runCbs = function (aCbs, aArgs) {
		// Copy aCbs to avoid error in case of modify during
		// iterate.

		var aCbs = aCbs.slice(0);

		var iIndex = 0;
		var fContinue = function () {
			if (iIndex < aCbs.length) {
				// Callbacks have to call fContinue, when they are finished with processing. It
				// can be used to block callback queue while some UI action is pending (e.g. displaying dialog).

				var fCb = aCbs[iIndex++];
				var _aArgs = aArgs.slice(0);
				_aArgs.push(fContinue);

				fCb.apply(null, _aArgs);
			}
		};

		fContinue();
	};

	SaveHandler.prototype._onConfirmAndSaveConfirm = function (fContinue, bOK) {
		switch (bOK) {
		case true:
			this._save(true, jQuery.proxy(this._onConfirmAndSaveSaveDone, this, fContinue));
			break;

		case false:
			fContinue(false);
			break;

		case null:
			fContinue(null);
			break;

		default:
			assert(false, "bOK is unknown");
		}
	};

	SaveHandler.prototype._onConfirmAndSaveSaveDone = function (fContinue, oSaveInfo) {
		fContinue(oSaveInfo.success ? true : null);
	};

	SaveHandler.prototype._onConfirmAndResetConfirm = function (fContinue, bOK) {

		this._bOK = bOK;
		if (this._key == "prereq") {
			this._reset(true, jQuery.proxy(this._onConfirmAndResetResetDone, this, fContinue));
		} else {
			if (bOK)
				this._reset(true, jQuery.proxy(this._onConfirmAndResetResetDone, this, fContinue));
			else
				fContinue(false);
		}

	};

	SaveHandler.prototype._onConfirmAndResetResetDone = function (fContinue) {
		fContinue(true);
	};

	return SaveHandler;
});