export class LineApiError extends Error {
  constructor(
    public status: number,
    public body: any,
    message: string
  ) {
    super(message);
    this.name = "LineApiError";
  }
}

export class LineApi {
  constructor(private channelAccessToken: string) {}

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `https://api.line.me/v2/bot${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.channelAccessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!res.ok) {
      let body: any = null;
      try {
        body = await res.json();
      } catch {
        body = await res.text();
      }
      throw new LineApiError(
        res.status,
        body,
        body?.message || `LINE API request failed with status ${res.status}`
      );
    }

    if (res.status === 204 || res.headers.get("content-length") === "0") {
      return {} as T;
    }
    return (await res.json()) as T;
  }

  async sendPushMessage(to: string, messages: any[]): Promise<{ sentMessages?: number }> {
    await this.request("/message/push", {
      method: "POST",
      body: JSON.stringify({
        to,
        messages,
      }),
    });
    return { sentMessages: messages.length };
  }

  async sendBroadcastMessage(messages: any[]): Promise<{ sentMessages?: number }> {
    await this.request("/message/broadcast", {
      method: "POST",
      body: JSON.stringify({
        messages,
      }),
    });
    return { sentMessages: messages.length };
  }

  async getUserProfile(userId: string): Promise<any> {
    return this.request(`/profile/${encodeURIComponent(userId)}`);
  }

  async getBotInfo(): Promise<any> {
    return this.request("/info");
  }

  async getMessageQuota(): Promise<any> {
    return this.request("/message/quota");
  }

  async getMessageQuotaConsumption(): Promise<any> {
    return this.request("/message/quota/consumption");
  }
}
