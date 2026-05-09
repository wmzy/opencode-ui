export type Project = {
  id: string;
  worktree: string;
  vcs?: 'git';
  name?: string;
  icon?: {
    url?: string;
    override?: string;
    color?: string;
  };
  commands?: {
    start?: string;
  };
  time: {
    created: number;
    updated: number;
    initialized?: number;
  };
  sandboxes: Array<string>;
};

export type Path = {
  state: string;
  config: string;
  worktree: string;
  directory: string;
};

export type VcsInfo = {
  branch: string;
};
