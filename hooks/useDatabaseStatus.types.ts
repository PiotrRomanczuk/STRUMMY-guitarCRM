export type DatabaseType = 'local' | 'remote';

export interface DatabaseStatusState {
  type: DatabaseType;
  url: string;
  isLocal: boolean;
  source: 'cookie' | 'header' | 'default';
  localAvailable: boolean;
  remoteAvailable: boolean;
  isConnected: boolean;
  latency?: number;
  error?: string;
}

export interface UseDatabaseStatusReturn {
  /** Current database type */
  type: DatabaseType;
  /** Whether connected to local database */
  isLocal: boolean;
  /** Full database status */
  status: DatabaseStatusState | null;
  /** Loading state */
  isLoading: boolean;
  /** Error if any */
  error: string | null;
  /** Toggle between local and remote */
  toggleDatabase: () => void;
  /** Switch to specific database type */
  switchTo: (type: DatabaseType) => void;
  /** Test the current connection */
  testConnection: () => Promise<boolean>;
  /** Refresh status */
  refresh: () => Promise<void>;
}
