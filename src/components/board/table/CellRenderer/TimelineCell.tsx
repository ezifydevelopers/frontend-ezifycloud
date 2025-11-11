// Timeline cell renderer (date range)

import React from 'react';

interface TimelineCellProps {
  value: unknown;
  onClick: () => void;
}

export const TimelineCell: React.FC<TimelineCellProps> = ({ value, onClick }) => {
  try {
    const timeline = typeof value === 'object' && value !== null && 'start' in value && 'end' in value
      ? value as { start: string; end: string }
      : typeof value === 'string' 
        ? JSON.parse(value) 
        : null;
    
    if (timeline && timeline.start && timeline.end) {
      return (
        <span 
          className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
          onClick={onClick}
          title="Click to edit"
        >
          {`${new Date(timeline.start).toLocaleDateString()} - ${new Date(timeline.end).toLocaleDateString()}`}
        </span>
      );
    }
  } catch {
    // Invalid timeline format
  }

  return (
    <span 
      className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
      onClick={onClick}
      title="Click to edit"
    >
      —
    </span>
  );
};

