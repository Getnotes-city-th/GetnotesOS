export interface LineUserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
  language?: string;
}

export interface LineBotInfo {
  userId: string;
  basicId: string;
  premiumId?: string;
  displayName: string;
  pictureUrl?: string;
  chatMode: "chat" | "bot";
  markAsReadMode: "auto" | "manual";
}

export interface LineQuotaResponse {
  type: "none" | "limited";
  value?: number;
  totalUsage?: number;
}

export interface LineMessageResult {
  success: boolean;
  messageId?: string;
  sentMessages?: number;
}

export interface LineSession {
  /**
   * Send a push message to a specific LINE user or group chat.
   * @param to User ID, Group ID, or Room ID.
   * @param text The text message to send.
   */
  sendTextMessage(to: string, text: string): Promise<LineMessageResult>;

  /**
   * Send a rich Flex Message card to a specific LINE user or group chat.
   * @param to User ID, Group ID, or Room ID.
   * @param altText Alternative fallback text for notifications.
   * @param contents JSON structure of the Flex Bubble or Carousel.
   */
  sendFlexMessage(to: string, altText: string, contents: any): Promise<LineMessageResult>;

  /**
   * Broadcast a message to all followers of this LINE Official Account.
   * @param text The text message to broadcast.
   */
  broadcastTextMessage(text: string): Promise<LineMessageResult>;

  /**
   * Get user profile details by LINE User ID.
   * @param userId The target user ID.
   */
  getUserProfile(userId: string): Promise<LineUserProfile>;

  /**
   * Get this LINE Bot's information and status.
   */
  getBotInfo(): Promise<LineBotInfo>;

  /**
   * Check message quota and usage for the current month.
   */
  getMessageQuota(): Promise<LineQuotaResponse>;
}
