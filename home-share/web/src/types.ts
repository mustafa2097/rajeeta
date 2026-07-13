export interface FileMeta {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  from: string;
  createdAt: string;
}

export interface Message {
  id: string;
  text: string;
  from: string;
  createdAt: string;
}

export interface ServerInfo {
  hostname: string;
  ips: string[];
  port: number;
  pinEnabled: boolean;
  deviceCount: number;
  urls: string[];
}

export interface ClipboardPayload {
  text: string;
  from: string;
  at: string;
}

export interface DeviceInfo {
  name: string;
  type: string;
}
