sap.ui.define([
	"sap/base/assert",
	"sap/ui/core/Renderer",
	"gramont/VCDSM/specedit/control/TableConst"
], function(assert, Renderer, TableConst) {
	"use strict";

	// TODO: css colors should be generated using less.

	var TableRenderer = {
		render: function(oRm, oControl) {
			// Construct table matrix, depending on orientation.

			var bHorizontalRow = oControl.getHorizontalRow();
			var aColumns = oControl.getColumns();
			var aItems = oControl.getItems();

			var aTableRows = [];

			if (bHorizontalRow) {
				for (var i = -1; i < aItems.length; i++) {
					var aTableColumns = [];

					if (i == -1) {
						// Construct header cells.

						for (var j = 0; j < aColumns.length; j++) {
							var oColumn = aColumns[j];

							if (oColumn.getVisible()) {
								var oTableColumn = {
									styles: ["gramontPlmVc_Table_Header"],
									control: oColumn.getHeader(),
									width: oColumn.getWidth(),
									hAlign: oColumn.getHAlign()
								};

								aTableColumns.push(oTableColumn);
							}
						}
					} else {
						// Construct data cells.

						var oItem = aItems[i];

						var aDataColumns = TableRenderer._prepareDataColumns(oItem, aColumns, true);
						assert(aDataColumns.length == aColumns.length, "aDataColumns.length should be equal to aColumns.length");

						for (var j = 0; j < aColumns.length; j++) {
							var oColumn = aColumns[j];

							if (oColumn.getVisible()) {
								var oTableColumn = aDataColumns[j];
								aTableColumns.push(oTableColumn);
							}
						}
					}

					// Append new row only, if we have some columns.

					if (aTableColumns.length > 0)
						aTableRows.push(aTableColumns);
				}

				if (aItems.length == 0 && aTableRows.length > 0) {
					// Add "No Data" cell if:
					// - we don't have any items, and
					// - we have a header with some visible columns.

					var aTableColumns = [TableRenderer._getNoDataColumn(oControl)];
					aTableRows.push(aTableColumns);
				}
			} else {
				// Prepare columns early, since it is more efficient, than
				// doing it every time inside a for-loop.

				var aDataRows = [];

				for (var i = 0; i < aItems.length; i++) {
					var oItem = aItems[i];

					var aDataColumns = TableRenderer._prepareDataColumns(oItem, aColumns, false);
					assert(aDataColumns.length == aColumns.length, "aDataColumns.length should be equal to aColumns.length");

					aDataRows.push(aDataColumns);
				}

				for (var i = 0, bFirstColumn = true; i < aColumns.length; i++) {
					var oColumn = aColumns[i];

					if (oColumn.getVisible()) {
						var aTableColumns = [];

						for (var j = -1; j < aDataRows.length; j++) {
							if (j == -1) {
								// Construct header cells.

								var oTableColumn = {
									styles: ["gramontPlmVc_Table_Header"],
									control: oColumn.getHeader(),
									hAlign: oColumn.getHAlignForVerticalRow()
								};

								aTableColumns.push(oTableColumn);
							} else {
								// Construct data cells.

								var aDataColumns = aDataRows[j];
								var oTableColumn = aDataColumns[i];

								aTableColumns.push(oTableColumn);
							}
						}

						if (bFirstColumn) {
							var oTableColumn;

							if (aDataRows.length == 0) {
								// Add "No Data" cell.

								oTableColumn = TableRenderer._getNoDataColumn(oControl);
							} else {
								// Add empty cell to right to make sure that
								// separator lines are drawn.

								oTableColumn = TableRenderer._getRightFillColumn(oControl);
							}

							bFirstColumn = false;
							aTableColumns.push(oTableColumn);
						}

						aTableRows.push(aTableColumns);
					}
				}
			}

			// Render control header.

			oRm.write("<div");
			oRm.writeControlData(oControl);
			oRm.writeClasses();
			oRm.write(">");

			// Render toolbar.

			var oHeaderToolbar = oControl.getHeaderToolbar();
			if (oHeaderToolbar)
				oRm.renderControl(oHeaderToolbar);

			// Render table.

			oRm.write("<table");
			oRm.addClass("gramontPlmVc_Table_Table");
			oRm.addClass(bHorizontalRow ? "gramontPlmVc_Table_Table_RowMode_Horizontal" : "gramontPlmVc_Table_Table_RowMode_Vertical");

			if (oControl.getSticky())
				oRm.addClass("gramontPlmVc_Table_Table_Sticky");

			oRm.addClass((bHorizontalRow && oControl.getFixedLayout()) ? "gramontPlmVc_Table_Table_Layout_Fixed" : "gramontPlmVc_Table_Table_Layout_Auto");
			oRm.writeClasses();
			oRm.write(">");

			for (var i = 0; i < aTableRows.length; i++) {
				oRm.write("<tr>");

				var aTableColumns = aTableRows[i];
				for (var j = 0; j < aTableColumns.length; j++) {
					var oTableColumn = aTableColumns[j];
					assert(oTableColumn, "oTableColumn should be set");

					var bRenderHeader = (bHorizontalRow ? (i == 0) : (j == 0));

					oRm.write("<");
					oRm.write(bRenderHeader ? "th" : "td");

					oRm.addClass("gramontPlmVc_Table_Cell");

					var aStyles = oTableColumn.styles;
					if (aStyles) {
						for (var k = 0; k < aStyles.length; k++) {
							var sStyle = aStyles[k];
							oRm.addClass(sStyle);
						}
					}

					oRm.writeClasses();

					var sWidth = oTableColumn.width;
					if (sWidth) // Test for null and empty value.
						oRm.addStyle("width", sWidth);

					var sHAlign = oTableColumn.hAlign;
					if (sHAlign != null) {
						var sHAlignValue = Renderer.getTextAlign(sHAlign);
						if (sHAlignValue)
							oRm.addStyle("text-align", sHAlignValue);
					}

					oRm.writeStyles();

					var iColspan = oTableColumn.colspan;
					if (iColspan != null)
						oRm.writeAttribute("colspan", iColspan);

					var iRowspan = oTableColumn.rowspan;
					if (iRowspan != null)
						oRm.writeAttribute("rowspan", iRowspan);

					var sTooltip = oTableColumn.tooltip;
					if (sTooltip != null)
						oRm.writeAttributeEscaped("title", sTooltip);

					var iColumnIndex = oTableColumn.columnIndex;
					if (iColumnIndex != null)
						oRm.writeAttribute(TableConst.ColumnIndex, iColumnIndex);

					oRm.write(">");

					var oCell = oTableColumn.control;
					var sText = oTableColumn.text;

					if (oCell)
						oRm.renderControl(oCell);
					else if (sText != null)
						oRm.writeEscaped(sText);

					oRm.write("</");
					oRm.write(bRenderHeader ? "th" : "td");
					oRm.write(">");
				}

				oRm.write("</tr>");
			}

			oRm.write("</table>");

			// Render control footer.

			oRm.write("</div>");
		},

		_prepareDataColumns: function(oItem, aColumns, bHorizontalRow) {
			// Create missing cells.

			var iColumnsLength = aColumns.length;
			var aCells = oItem.getCells().slice(0, iColumnsLength);
			var iCellsToCreate = (iColumnsLength - aCells.length);

			for (var i = 0; i < iCellsToCreate; i++)
				aCells.push(null);

			assert(aCells.length == iColumnsLength, "aCells.length should be equal to iColumnsLength");

			// Construct columns.

			var aTableColumns = [];

			for (var i = 0; i < aCells.length; i++) {
				var oCell = aCells[i];
				var oColumn = aColumns[i];

				var aStyles = ["gramontPlmVc_Table_Data"];
				var sStyle = null;

				if (oItem.getError())
					sStyle = "gramontPlmVc_Table_Data_Error";
				else if (oItem.getDeleted())
					sStyle = "gramontPlmVc_Table_Data_Deleted";
				else if (oItem.getAutoGrow())
					sStyle = "gramontPlmVc_Table_Data_AutoGrow";

				if (sStyle != null)
					aStyles.push(sStyle);

				var oTableColumn = {
					styles: aStyles,
					hAlign: (bHorizontalRow ? oColumn.getHAlign() : oColumn.getHAlignForVerticalRow()),
					tooltip: oItem.getTooltip_AsString(),
					columnIndex: i,
					control: oCell
				};

				aTableColumns.push(oTableColumn);
			}

			assert(aTableColumns.length == iColumnsLength, "aTableColumns.length should be equal to iColumnsLength");
			return aTableColumns;
		},

		_getNoDataColumn: function(oControl) {
			// Determine colspan and rowspan.

			var bHorizontalRow = oControl.getHorizontalRow();
			var iVisibleColumnCount = TableRenderer._getVisibleColumnCount(oControl);
			var iColspan = bHorizontalRow ? iVisibleColumnCount : null;
			if (iColspan != null)
				assert(iColspan > 0, "iColspan should be > 0");
			var iRowspan = bHorizontalRow ? null : iVisibleColumnCount;
			if (iRowspan != null)
				assert(iRowspan > 0, "iRowspan should be > 0");

			// Construct column.

			var oTableColumn = {
				styles: ["gramontPlmVc_Table_NoData"],
				colspan: iColspan,
				rowspan: iRowspan,
				text: oControl.getModel("i18n").getProperty("Table.noData")
			};

			return oTableColumn;
		},

		_getRightFillColumn: function(oControl) {
			// Construct column.

			var oTableColumn = {
				styles: ["gramontPlmVc_Table_RightFill"],
				rowspan: TableRenderer._getVisibleColumnCount(oControl)
			};

			return oTableColumn;
		},

		_getVisibleColumnCount: function(oControl) {
			// Count visible columns.

			var aColumns = oControl.getColumns();
			var iVisibleColumnCount = 0;

			for (var i = 0; i < aColumns.length; i++) {
				var oColumn = aColumns[i];

				if (oColumn.getVisible())
					iVisibleColumnCount++;
			}

			return iVisibleColumnCount;
		}
	};

	return TableRenderer;
}, true);
