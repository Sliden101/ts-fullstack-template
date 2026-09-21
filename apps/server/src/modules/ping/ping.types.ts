export class PingResult {
  serverTime!: Date;
  uptimeSeconds!: number;
  processingTimeMs!: number;
  nonce?: string | null;
}
