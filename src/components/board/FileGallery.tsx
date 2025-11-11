import React from 'react';
import { EnhancedFileGallery } from './EnhancedFileGallery';

interface FileGalleryProps {
  itemId: string;
  itemName?: string;
}

/**
 * FileGallery component - now uses EnhancedFileGallery for backward compatibility
 * @deprecated Consider using EnhancedFileGallery directly for more features
 */
export const FileGallery: React.FC<FileGalleryProps> = ({ itemId, itemName }) => {
  return (
    <EnhancedFileGallery
      itemId={itemId}
      itemName={itemName}
      showUpload={true}
    />
  );
};

