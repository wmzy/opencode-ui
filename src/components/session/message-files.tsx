import { css, cx } from '@linaria/core';
import type { FilePart } from '@/types/part';

const fileListStyle = css`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 8px 0;
`;

const fileItemStyle = css`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
  cursor: default;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const fileIconStyle = css`
  flex-shrink: 0;
  font-size: 14px;
`;

const fileNameStyle = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
`;

const imagePreviewStyle = css`
  width: 100%;
  max-width: 300px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  margin: 4px 0;
`;

function getFileIcon(mime: string): string {
  if (mime.startsWith('image/')) return '🖼️';
  if (mime.startsWith('text/')) return '📄';
  return '📎';
}

export type MessageFilesProps = {
  files: FilePart[];
  className?: string;
};

export function MessageFiles({ files, className }: MessageFilesProps) {
  if (files.length === 0) return null;

  const images = files.filter((f) => f.mime.startsWith('image/'));
  const others = files.filter((f) => !f.mime.startsWith('image/'));

  return (
    <div className={cx(fileListStyle, className)}>
      {images.map((file) => (
        <div key={file.id}>
          <img
            className={imagePreviewStyle}
            src={file.url}
            alt={file.filename ?? 'Attached image'}
            loading="lazy"
          />
        </div>
      ))}
      {others.map((file) => (
        <div key={file.id} className={fileItemStyle}>
          <span className={fileIconStyle}>{getFileIcon(file.mime)}</span>
          <span className={fileNameStyle}>{file.filename ?? 'file'}</span>
        </div>
      ))}
    </div>
  );
}
