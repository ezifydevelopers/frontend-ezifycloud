// Group totals component - Calculate and display subtotals for grouped items

import React, { useMemo } from 'react';
import { Column, Item } from '@/types/workspace';
import { getCellValue } from './utils/tableUtils';
import { formatCellValue } from './utils/cellValueFormatter';

interface GroupTotalsProps {
  items: Item[];
  columns: Column[];
  groupValue: string;
}

export const GroupTotals: React.FC<GroupTotalsProps> = ({
  items,
  columns,
  groupValue,
}) => {
  const totals = useMemo(() => {
    const totalsMap: Record<string, { sum: number; count: number; avg: number }> = {};

    columns.forEach(column => {
      if (
        column.type === 'NUMBER' ||
        column.type === 'CURRENCY' ||
        column.type === 'PERCENTAGE' ||
        column.type === 'RATING' ||
        column.type === 'PROGRESS'
      ) {
        let sum = 0;
        let count = 0;

        items.forEach(item => {
          const cellValue = getCellValue(item, column.id);
          if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
            const numValue = typeof cellValue === 'number' ? cellValue : parseFloat(String(cellValue));
            if (!isNaN(numValue)) {
              sum += numValue;
              count++;
            }
          }
        });

        if (count > 0) {
          totalsMap[column.id] = {
            sum,
            count,
            avg: sum / count,
          };
        }
      }
    });

    return totalsMap;
  }, [items, columns]);

  if (Object.keys(totals).length === 0) {
    return null;
  }

  return (
    <tr className="bg-blue-50 border-t-2 border-blue-200">
      <td colSpan={100} className="p-2">
        <div className="flex items-center gap-4 text-sm">
          <span className="font-semibold text-blue-900">Totals ({items.length} items):</span>
          {columns.map(column => {
            const total = totals[column.id];
            if (!total) return null;

            return (
              <div key={column.id} className="flex items-center gap-2">
                <span className="text-muted-foreground">{column.name}:</span>
                <span className="font-medium">
                  {column.type === 'CURRENCY' || column.type === 'PERCENTAGE'
                    ? formatCellValue(total.sum, column)
                    : column.type === 'RATING' || column.type === 'PROGRESS'
                    ? `${total.avg.toFixed(1)} (avg)`
                    : total.sum.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </td>
    </tr>
  );
};
