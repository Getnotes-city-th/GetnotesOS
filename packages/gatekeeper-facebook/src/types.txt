export interface FacebookPageInfo {
  id: string;
  name: string;
  category?: string;
  fan_count?: number;
  pictureUrl?: string;
  link?: string;
}

export interface FacebookPostResult {
  success: boolean;
  id?: string;
  message?: string;
}

export interface FacebookFeedItem {
  id: string;
  message?: string;
  created_time: string;
  permalink_url?: string;
  comments_count?: number;
  reactions_count?: number;
}

export interface FacebookInsightsMetric {
  name: string;
  period: string;
  values: Array<{ value: number; end_time: string }>;
  title?: string;
  description?: string;
}

export interface FacebookSession {
  /**
   * Publish a new post to the Facebook Page.
   * @param message Text content of the post.
   * @param link Optional URL link to attach.
   */
  publishPagePost(message: string, link?: string): Promise<FacebookPostResult>;

  /**
   * Send a direct message to a user via Facebook Messenger (Page inbox).
   * @param recipientId The PSID (Page-scoped ID) of the recipient.
   * @param message Text message to send.
   */
  sendPageMessage(recipientId: string, message: string): Promise<FacebookPostResult>;

  /**
   * Get recent posts and activity from the Facebook Page feed.
   * @param limit Number of posts to retrieve (default 10, max 50).
   */
  getPageFeed(limit?: number): Promise<FacebookFeedItem[]>;

  /**
   * Reply to a comment on a Facebook Page post.
   * @param commentId The ID of the comment to reply to.
   * @param message Reply text message.
   */
  replyComment(commentId: string, message: string): Promise<FacebookPostResult>;

  /**
   * Get public information and profile details of this Facebook Page.
   */
  getPageInfo(): Promise<FacebookPageInfo>;

  /**
   * Retrieve page engagement, reach, and follower insights.
   */
  getPageInsights(): Promise<FacebookInsightsMetric[]>;
}
