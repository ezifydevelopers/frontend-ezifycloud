export type WorkspaceRole = 'owner' | 'admin' | 'finance' | 'member' | 'viewer';
export type BoardType = 'invoices' | 'payments' | 'clients' | 'custom';
export type ColumnType = 'TEXT' | 'LONG_TEXT' | 'EMAIL' | 'PHONE' | 'NUMBER' | 'CURRENCY' | 'PERCENTAGE' | 'DATE' | 'DATETIME' | 'WEEK' | 'MONTH' | 'YEAR' | 'CHECKBOX' | 'DROPDOWN' | 'MULTI_SELECT' | 'RADIO' | 'PEOPLE' | 'STATUS' | 'TIMELINE' | 'FILE' | 'FORMULA' | 'AUTO_NUMBER' | 'LINK' | 'RATING' | 'VOTE' | 'PROGRESS' | 'LOCATION' | 'MIRROR';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  settings?: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    boards: number;
    members: number;
  };
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
}

export interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  token: string;
  invitedBy: string;
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
}

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
  logo?: string;
  settings?: Record<string, unknown>;
}

export interface UpdateWorkspaceInput {
  name?: string;
  description?: string;
  logo?: string;
  settings?: Record<string, unknown>;
}

// Board types
export interface Board {
  id: string;
  workspaceId: string;
  name: string;
  type: BoardType;
  description?: string;
  color?: string;
  icon?: string;
  isPublic: boolean;
  isArchived: boolean;
  permissions?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  workspace?: {
    id: string;
    name: string;
  };
  _count?: {
    items: number;
    columns: number;
  };
  columns?: Column[];
}

export interface Column {
  id: string;
  boardId: string;
  name: string;
  type: ColumnType;
  position: number;
  width?: number;
  required: boolean;
  defaultValue?: unknown;
  settings?: Record<string, unknown>;
  permissions?: Record<string, unknown>;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: string;
  boardId: string;
  name: string;
  status?: string;
  cells?: Record<string, Cell>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Cell {
  id: string;
  itemId: string;
  columnId: string;
  value?: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBoardInput {
  workspaceId: string;
  name: string;
  type: BoardType;
  description?: string;
  color?: string;
  icon?: string;
  permissions?: Record<string, unknown>;
  settings?: Record<string, unknown>;
}

export interface UpdateBoardInput {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  isPublic?: boolean;
  isArchived?: boolean;
  permissions?: Record<string, unknown>;
  settings?: Record<string, unknown>;
}

export interface CreateColumnInput {
  name: string;
  type: ColumnType;
  position?: number;
  width?: number;
  required?: boolean;
  defaultValue?: unknown;
  settings?: Record<string, unknown>;
  permissions?: Record<string, unknown>;
}

export interface UpdateColumnInput {
  name?: string;
  type?: ColumnType;
  position?: number;
  width?: number;
  required?: boolean;
  defaultValue?: unknown;
  settings?: Record<string, unknown>;
  permissions?: Record<string, unknown>;
  isHidden?: boolean;
}

export interface CreateItemInput {
  name: string;
  status?: string;
  cells?: Record<string, unknown>;
}

export interface UpdateItemInput {
  name?: string;
  status?: string;
  cells?: Record<string, unknown>;
}

// Comment types
export interface Comment {
  id: string;
  itemId: string;
  userId: string;
  content: string;
  mentions: string[];
  reactions?: Record<string, string[]>;
  isPrivate: boolean;
  isPinned?: boolean;
  isResolved?: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  resolvedByUser?: {
    id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  replies?: Comment[];
  _count?: {
    replies: number;
  };
}

export interface CreateCommentInput {
  itemId: string;
  content: string;
  mentions?: string[];
  isPrivate?: boolean;
  parentId?: string;
  fileIds?: string[];
}

export interface UpdateCommentInput {
  content?: string;
  mentions?: string[];
  isPrivate?: boolean;
}

export interface AddReactionInput {
  emoji: string;
}

// File types
export interface ItemFile {
  id: string;
  itemId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
  uploader?: {
    id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
}

export interface UploadFileInput {
  itemId: string;
  fileName: string;
  fileData: string; // base64 encoded
  mimeType: string;
  fileSize: number;
}

// Approval types
export type ApprovalLevel = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Approval {
  id: string;
  itemId: string;
  level: ApprovalLevel;
  approverId?: string;
  status: ApprovalStatus;
  comments?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  item?: {
    id: string;
    name: string;
    boardId: string;
  };
  approver?: {
    id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
}

export interface ItemApprovalStatus {
  level1: Approval | null;
  level2: Approval | null;
  level3: Approval | null;
  overallStatus: 'pending' | 'approved' | 'rejected' | 'in_progress';
  isComplete: boolean;
}

export interface CreateApprovalInput {
  itemId: string;
  level: ApprovalLevel;
  approverId?: string;
}

export interface UpdateApprovalInput {
  status: ApprovalStatus;
  comments?: string;
  approverId?: string;
}

export interface RequestApprovalInput {
  levels?: ApprovalLevel[];
}
