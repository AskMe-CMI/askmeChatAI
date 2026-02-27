'use client';

import { useState } from 'react';
import type { Attachment } from '@/lib/types';
import { ImagePreviewModal } from './image-preview-modal';
import { LoaderIcon, CrossSmallIcon } from './icons';

export const PreviewAttachment = ({
  attachment,
  isUploading = false,
  onRemove,
}: {
  attachment: Attachment;
  isUploading?: boolean;
  onRemove?: () => void;
}) => {
  const { name, url, contentType } = attachment;
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const isImage = contentType?.startsWith('image');

  return (
    <>
      <div data-testid="input-attachment-preview" className="flex flex-col gap-2 relative mt-2">
        <div className="w-20 h-16 aspect-video bg-muted rounded-md relative flex flex-col items-center justify-center">
          {contentType ? (
            isImage ? (
              // NOTE: it is recommended to use next/image for images
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt={name ?? 'An image attachment'}
                className="rounded-md size-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setIsPreviewOpen(true)}
              />
            ) : (
              <div className="" />
            )
          ) : (
            <div className="" />
          )}

          {isUploading && (
            <div
              data-testid="input-attachment-loader"
              className="animate-spin absolute text-zinc-500"
            >
              <LoaderIcon />
            </div>
          )}

          {onRemove && (
            <div
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-zinc-800 text-white flex items-center justify-center cursor-pointer hover:bg-zinc-700 transition"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove();
              }}
            >
              <CrossSmallIcon />
            </div>
          )}
        </div>
        <div className="text-xs text-zinc-500 max-w-16 truncate">{name}</div>
      </div>

      {isImage && (
        <ImagePreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          url={url}
          alt={name ?? 'Attachment preview'}
        />
      )}
    </>
  );
};
