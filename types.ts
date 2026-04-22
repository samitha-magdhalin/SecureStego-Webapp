export interface User {
  id: number;
  username: string;
  public_key: string;
}

export interface Block {
  id: number;
  block_index: number;
  timestamp: string;
  data: string; // JSON string
  previous_hash: string;
  hash: string;
}

export interface Alert {
  id: number;
  user_id: number;
  type: string;
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
}

export interface DashboardData {
  blocks: Block[];
  alerts: Alert[];
  stats: {
    totalSent: number;
    totalReceived: number;
    alertCount: number;
  };
}
