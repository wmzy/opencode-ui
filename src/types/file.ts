export type FileNode = {
  name: string;
  path: string;
  absolute: string;
  type: 'file' | 'directory';
  ignored: boolean;
};

export type FileContent = {
  type: 'text' | 'binary';
  content: string;
  diff?: string;
  patch?: {
    oldFileName: string;
    newFileName: string;
    oldHeader?: string;
    newHeader?: string;
    hunks: Array<{
      oldStart: number;
      oldLines: number;
      newStart: number;
      newLines: number;
      lines: Array<string>;
    }>;
    index?: string;
  };
  encoding?: 'base64';
  mimeType?: string;
};

export type FileChange = {
  path: string;
  added: number;
  removed: number;
  status: 'added' | 'deleted' | 'modified';
};

export type FindTextMatch = {
  path: {
    text: string;
  };
  lines: {
    text: string;
  };
  line_number: number;
  absolute_offset: number;
  submatches: Array<{
    match: {
      text: string;
    };
    start: number;
    end: number;
  }>;
};
