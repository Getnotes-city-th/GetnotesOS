export class FacebookApiError extends Error {
  constructor(
    public status: number,
    public body: any,
    message: string
  ) {
    super(message);
    this.name = "FacebookApiError";
  }
}

export class FacebookApi {
  constructor(private pageAccessToken: string) {}

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = new URL(`https://graph.facebook.com/v21.0${path}`);
    if (options.method === "GET" || !options.method) {
      url.searchParams.set("access_token", this.pageAccessToken);
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as any),
    };

    let body = options.body;
    if (options.method === "POST" && typeof body === "string") {
      try {
        const parsed = JSON.parse(body);
        parsed.access_token = this.pageAccessToken;
        body = JSON.stringify(parsed);
      } catch {}
    }

    const res = await fetch(url.toString(), {
      ...options,
      headers,
      body,
    });

    if (!res.ok) {
      let errBody: any = null;
      try {
        errBody = await res.json();
      } catch {
        errBody = await res.text();
      }
      throw new FacebookApiError(
        res.status,
        errBody,
        errBody?.error?.message || `Facebook API request failed with status ${res.status}`
      );
    }

    return (await res.json()) as T;
  }

  async getPageInfo(): Promise<any> {
    return this.request("/me?fields=id,name,category,fan_count,picture{url},link");
  }

  async publishPagePost(message: string, link?: string): Promise<any> {
    const payload: any = { message };
    if (link) payload.link = link;
    return this.request("/me/feed", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async sendPageMessage(recipientId: string, message: string): Promise<any> {
    return this.request("/me/messages", {
      method: "POST",
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: message },
      }),
    });
  }

  async getPageFeed(limit: number = 10): Promise<any> {
    return this.request(
      `/me/feed?fields=id,message,created_time,permalink_url,comments.summary(true),reactions.summary(true)&limit=${Math.min(limit, 50)}`
    );
  }

  async replyComment(commentId: string, message: string): Promise<any> {
    return this.request(`/${encodeURIComponent(commentId)}/comments`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  }

  async getPageInsights(): Promise<any> {
    return this.request("/me/insights?metric=page_impressions,page_post_engagements,page_fans");
  }
}
