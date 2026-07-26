export interface EmailSender {
  name: string;
  send(params: { to: string; subject: string; body: string }): Promise<void>;
}

export interface SmsSender {
  name: string;
  send(params: { to: string; body: string }): Promise<void>;
}
