import { DurableObject, RpcStub, RpcTarget, WorkerEntrypoint } from "cloudflare:workers";
import { validateRpc, skipRpcValidation } from "capnweb-validate";
import {
  ApprovalQueue,
  stripTrailingSlashes,
  type AccountDescription,
  type ActionDescription,
  type Gatekeeper,
  type GatekeeperConnectCallback,
  type GatekeeperConnectOptions,
  type GatekeeperUser,
  type GatekeeperUserVerifier,
  type GatekeeperVendor as GatekeeperVendorIface,
  type ResourceConfiguratorFrame,
  type ResourceDescription,
  type SupportedResource,
  type VendorDescription,
} from "@gadgets/workshop-shared/gatekeeper";
import { FacebookApi } from "./facebook-api";
import type {
  FacebookFeedItem,
  FacebookInsightsMetric,
  FacebookPageInfo,
  FacebookPostResult,
  FacebookSession,
} from "./types";
import TYPES_CODE from "./types.txt";
import FACEBOOK_LOGO_SVG from "./facebook-logo.svg";

type Env = Cloudflare.Env & {
  BASE_URL?: string;
  FACEBOOK_PAGE_ACCESS_TOKEN?: string;
};

type FacebookGatekeeperImplProps = {
  userObjectId: string;
};

type GatekeeperUserImplProps = {
  userObjectId: string;
};

const NONCE_BYTES = 32;
const NONCE_LIFETIME_MS = 10 * 60 * 1000;

function hexEncode(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateNonce(): string {
  return hexEncode(crypto.getRandomValues(new Uint8Array(NONCE_BYTES)));
}

function getBaseUrl(env: Env): string {
  return stripTrailingSlashes(env.BASE_URL || "http://localhost:8787/gatekeeper/facebook");
}

const FACEBOOK_LOGO_URL = `data:image/svg+xml,${encodeURIComponent(FACEBOOK_LOGO_SVG)}`;

const FACEBOOK_PAGE_RESOURCE: SupportedResource = {
  urlPattern: "https://*",
  title: "Facebook Page",
  description: "Publish posts, reply to comments, send Messenger messages, and read page insights.",
  icon: { url: FACEBOOK_LOGO_URL },
};

const SUPPORTED_RESOURCES: SupportedResource[] = [FACEBOOK_PAGE_RESOURCE];

const CONNECT_FORM_HTML = (doId: string, nonce: string) => `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>เชื่อมต่อ Facebook Page - GetnotesOS</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f0f2f5;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 16px;
      color: #1c1e21;
    }
    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
      padding: 32px;
      max-width: 480px;
      width: 100%;
      box-sizing: border-box;
    }
    .logo-container {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }
    .logo {
      width: 44px;
      height: 44px;
    }
    h1 {
      font-size: 20px;
      margin: 0 0 8px 0;
      color: #050505;
    }
    p {
      font-size: 14px;
      line-height: 1.5;
      color: #65676b;
      margin: 0 0 24px 0;
    }
    label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #050505;
      margin-bottom: 6px;
    }
    input {
      width: 100%;
      padding: 12px;
      border: 1px solid #ced0d4;
      border-radius: 8px;
      font-size: 14px;
      box-sizing: border-box;
      outline: none;
      margin-bottom: 16px;
      font-family: monospace;
    }
    input:focus {
      border-color: #0866FF;
      box-shadow: 0 0 0 3px rgba(8, 102, 255, 0.2);
    }
    button {
      width: 100%;
      background: #0866FF;
      color: white;
      border: none;
      padding: 12px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover {
      background: #0056df;
    }
    .hint {
      font-size: 12px;
      color: #8a8d91;
      margin-top: 16px;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo-container">
      <img src="${FACEBOOK_LOGO_URL}" class="logo" alt="Facebook" />
      <div>
        <h1 style="margin:0;">เชื่อมต่อ Facebook Page</h1>
        <span style="font-size:12px; color:#0866FF; font-weight:600;">Meta Graph API / Messenger</span>
      </div>
    </div>
    <p>กรอก <b>Page Access Token</b> จาก Meta for Developers เพื่อให้ AI ใน GetnotesOS ช่วยโพสต์ ตอบคอมเมนต์ และส่งข้อความแฟนเพจได้</p>
    <form method="POST" action="/gatekeeper/facebook/submit">
      <input type="hidden" name="doId" value="${doId}">
      <input type="hidden" name="nonce" value="${nonce}">
      <label for="token">Page Access Token</label>
      <input type="password" id="token" name="token" placeholder="วาง Page Access Token ที่นี่..." required autofocus />
      <button type="submit">บันทึกและเชื่อมต่อ</button>
    </form>
    <div class="hint">
      💡 สามารถสร้าง Page Access Token ได้จาก Meta for Developers &gt; Graph API Explorer หรือ App Dashboard
    </div>
  </div>
</body>
</html>`;

const SUCCESS_HTML = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <title>เชื่อมต่อสำเร็จ</title>
  <style>
    body { font-family: system-ui; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f0f2f5; color: #1c1e21; text-align: center; }
    .box { background: white; padding: 32px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    h2 { color: #0866FF; margin-top: 0; }
  </style>
</head>
<body>
  <div class="box">
    <h2>✓ เชื่อมต่อ Facebook Page สำเร็จ!</h2>
    <p>คุณสามารถปิดหน้านี้และกลับไปยัง GetnotesOS ได้เลยครับ</p>
    <script>setTimeout(() => window.close(), 1500);</script>
  </div>
</body>
</html>`;

// ---------------------------------------------------------------------------
// Worker entrypoint (HTTP routing)

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    const basePath = new URL(getBaseUrl(env)).pathname;
    const relPath = url.pathname.startsWith(basePath)
      ? url.pathname.slice(basePath.length) || "/"
      : url.pathname;

    const path = relPath.split("/").filter(Boolean);

    // Initial connect page: /:doId/:nonce
    if (path.length === 2) {
      const doId = path[0];
      const nonce = path[1];
      return new Response(CONNECT_FORM_HTML(doId, nonce), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Submit token form: POST /submit
    if (relPath === "/submit" && req.method === "POST") {
      const formData = await req.formData();
      const doId = String(formData.get("doId") || "");
      const nonce = String(formData.get("nonce") || "");
      const token = String(formData.get("token") || "").trim();

      if (!doId || !nonce || !token) {
        return new Response("Missing required fields", { status: 400 });
      }

      const stub = ctx.exports.UserAccount.get(ctx.exports.UserAccount.idFromString(doId));
      const ok = await stub.acceptToken(token, nonce);
      if (!ok) {
        return new Response("Invalid or expired connection session. Please try again from GetnotesOS.", {
          status: 400,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }

      return new Response(SUCCESS_HTML, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
};

// ---------------------------------------------------------------------------
// Vendor

@validateRpc()
export class GatekeeperVendor extends WorkerEntrypoint<Env> implements GatekeeperVendorIface {
  async describe(): Promise<VendorDescription> {
    return {
      displayName: "Facebook",
      url: "https://facebook.com",
      logo: { url: FACEBOOK_LOGO_URL },
      color: "#0866FF",
      tagline: "Manage Facebook Pages, post content, and reply in Messenger",
      description:
        "Connect your Facebook Page so GetnotesOS can publish posts, " +
        "reply to comments, send Messenger messages, and read page insights.",
    };
  }

  async connectAccount(
    callback: Fetcher<GatekeeperConnectCallback>,
    _options?: GatekeeperConnectOptions,
  ): Promise<{ url: string }> {
    const userObjectId = this.ctx.exports.UserAccount.newUniqueId();
    const initiationNonce = generateNonce();
    await this.ctx.exports.UserAccount.get(userObjectId).setCallback(callback, initiationNonce);
    return { url: `${getBaseUrl(this.env)}/${userObjectId.toString()}/${initiationNonce}` };
  }

  async getSupportedResources(): Promise<SupportedResource[]> {
    return SUPPORTED_RESOURCES;
  }

  async getTypeScriptTypes(): Promise<string> {
    return TYPES_CODE;
  }
}

// ---------------------------------------------------------------------------
// GatekeeperUser

export class GatekeeperUserImpl extends WorkerEntrypoint<Env, GatekeeperUserImplProps> implements GatekeeperUser {
  #userAccount(): DurableObjectStub<UserAccount> {
    return this.ctx.exports.UserAccount.get(this.ctx.exports.UserAccount.idFromString(this.ctx.props.userObjectId));
  }

  async describe(): Promise<AccountDescription> {
    const desc = await this.#userAccount().describe();
    return {
      displayName: desc.displayName || "Facebook Page",
      uniqueName: desc.uniqueName || "@fbpage",
      avatar: desc.pictureUrl ? { url: desc.pictureUrl } : { url: FACEBOOK_LOGO_URL },
    };
  }

  async getAuthenticatedEmail(): Promise<string | null> {
    return null;
  }

  async ensureResources(_resourceUrlPatterns: string[]): Promise<{ url?: string }> {
    return {};
  }

  async getSupportedResources(): Promise<SupportedResource[]> {
    return SUPPORTED_RESOURCES;
  }

  async getGatekeeperClassFor(url: string): Promise<{
    class: DurableObjectClass<Gatekeeper<any>>;
    resource: SupportedResource;
  }> {
    const props: FacebookGatekeeperImplProps = {
      userObjectId: this.ctx.props.userObjectId,
    };
    return {
      class: this.ctx.exports.FacebookGatekeeperImpl({ props }),
      resource: FACEBOOK_PAGE_RESOURCE,
    };
  }

  async startResourceConfigurator(resourceUrlPattern: string): Promise<ResourceConfiguratorFrame> {
    throw new Error(`Unsupported Facebook resource configurator type: ${resourceUrlPattern}`);
  }

  async revoke(): Promise<void> {
    await this.#userAccount().revoke();
  }

  async reconnect(): Promise<{ url: string }> {
    const initiationNonce = generateNonce();
    await this.#userAccount().prepareReconnect(initiationNonce);
    return { url: `${getBaseUrl(this.env)}/${this.ctx.props.userObjectId}/${initiationNonce}` };
  }

  @skipRpcValidation()
  async getVerifier(): Promise<Fetcher<GatekeeperUserVerifier>> {
    return this.ctx.exports.FacebookVerifier({});
  }
}

// ---------------------------------------------------------------------------
// Verifier

@validateRpc()
export class FacebookVerifier extends WorkerEntrypoint<Env> implements GatekeeperUserVerifier {
  verify(): void {}
}

// ---------------------------------------------------------------------------
// UserAccount (Durable Object storing Page Access Token)

@validateRpc()
export class UserAccount extends DurableObject<Env> {
  private sql = this.ctx.storage.sql;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS credentials (
        key TEXT PRIMARY KEY,
        token TEXT NOT NULL,
        pageName TEXT,
        pageId TEXT,
        pictureUrl TEXT,
        updatedAt INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS nonces (
        value TEXT PRIMARY KEY,
        expiresAt INTEGER NOT NULL
      );
    `);
  }

  async setCallback(callback: Fetcher<GatekeeperConnectCallback>, nonce: string): Promise<void> {
    this.ctx.storage.kv.put("callback", callback);
    this.sql.exec(`INSERT OR REPLACE INTO nonces (value, expiresAt) VALUES (?, ?)`, nonce, Date.now() + NONCE_LIFETIME_MS);
  }

  async prepareReconnect(nonce: string): Promise<void> {
    this.sql.exec(`INSERT OR REPLACE INTO nonces (value, expiresAt) VALUES (?, ?)`, nonce, Date.now() + NONCE_LIFETIME_MS);
  }

  async acceptToken(token: string, nonce: string): Promise<boolean> {
    const nonceRow = this.sql.exec<{ value: string; expiresAt: number }>(`SELECT * FROM nonces WHERE value = ?`, nonce).one();
    if (!nonceRow || nonceRow.expiresAt < Date.now()) return false;
    this.sql.exec(`DELETE FROM nonces WHERE value = ?`, nonce);

    // Verify token with Meta Graph API
    const api = new FacebookApi(token);
    let pageInfo: any = {};
    try {
      pageInfo = await api.getPageInfo();
    } catch (err) {
      console.warn("Could not fetch page info from Facebook:", err);
    }

    const pageName = pageInfo.name || "Facebook Page";
    const pageId = pageInfo.id || "page";
    const pictureUrl = pageInfo.picture?.data?.url || null;

    this.sql.exec(
      `INSERT OR REPLACE INTO credentials (key, token, pageName, pageId, pictureUrl, updatedAt) VALUES (default, ?, ?, ?, ?, ?)`,
      token,
      pageName,
      pageId,
      pictureUrl,
      Date.now(),
    );

    const callback = this.ctx.storage.kv.get<Fetcher<GatekeeperConnectCallback>>("callback");
    if (callback) {
      const user = this.ctx.exports.GatekeeperUserImpl({ props: { userObjectId: this.ctx.id.toString() } });
      await callback.accepted(this.ctx.id.toString(), user);
    }
    return true;
  }

  async describe(): Promise<{ displayName: string; uniqueName: string; pictureUrl: string | null }> {
    const row = this.sql.exec<{ pageName: string; pageId: string; pictureUrl: string | null }>(
      `SELECT pageName, pageId, pictureUrl FROM credentials WHERE key = default`
    ).one();
    return {
      displayName: row?.pageName || "Facebook Page",
      uniqueName: row?.pageId ? `@${row.pageId}` : "@fbpage",
      pictureUrl: row?.pictureUrl || null,
    };
  }

  async getToken(): Promise<string> {
    const row = this.sql.exec<{ token: string }>(`SELECT token FROM credentials WHERE key = default`).one();
    return row?.token || this.env.FACEBOOK_PAGE_ACCESS_TOKEN || "";
  }

  async revoke(): Promise<void> {
    this.sql.exec(`DELETE FROM credentials`);
  }
}

// ---------------------------------------------------------------------------
// FacebookGatekeeperImpl (Session provider for AI Agent)

@validateRpc()
export class FacebookGatekeeperImpl extends DurableObject<Env, FacebookGatekeeperImplProps> implements Gatekeeper<FacebookSession> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  async describe(): Promise<ResourceDescription> {
    return {
      title: "Facebook Page",
      icon: { url: FACEBOOK_LOGO_URL },
    };
  }

  async getAutoApprovableActions(): Promise<ActionDescription[]> {
    return [];
  }

  async startSession(approvalQueue: RpcStub<ApprovalQueue>): Promise<FacebookSession> {
    const queue = approvalQueue.dup();
    const userStub = this.env.UserAccount.get(this.env.UserAccount.idFromString(this.ctx.props.userObjectId));
    const token = await userStub.getToken();
    const api = new FacebookApi(token);
    return new FacebookSessionImpl(api, queue);
  }

  async addObserver(_id: string, _user: Fetcher<GatekeeperUserVerifier>): Promise<void> {}
  async removeObserver(_id: string): Promise<void> {}

  async applyAction(_id: number): Promise<void> {}
  async rejectAction(_id: number): Promise<void> {}
  async revertAction(_id: number): Promise<void> {}
}

// ---------------------------------------------------------------------------
// FacebookSessionImpl

class FacebookSessionImpl extends RpcTarget implements FacebookSession {
  constructor(
    private api: FacebookApi,
    private approvalQueue: RpcStub<ApprovalQueue>,
  ) {
    super();
  }

  async publishPagePost(message: string, link?: string): Promise<FacebookPostResult> {
    await this.approvalQueue.authorizeMutatingAction({
      title: "Publish post to Facebook Page",
      description: `Publish: "${message.slice(0, 60)}${message.length > 60 ? "..." : ""}"`,
    });
    const res = await this.api.publishPagePost(message, link);
    return { success: true, id: res.id, message: "Post published successfully" };
  }

  async sendPageMessage(recipientId: string, message: string): Promise<FacebookPostResult> {
    await this.approvalQueue.authorizeMutatingAction({
      title: `Send Messenger message to ${recipientId}`,
      description: `Send message: "${message.slice(0, 50)}${message.length > 50 ? "..." : ""}" to ${recipientId}`,
    });
    const res = await this.api.sendPageMessage(recipientId, message);
    return { success: true, id: res.message_id, message: "Message sent" };
  }

  async getPageFeed(limit?: number): Promise<FacebookFeedItem[]> {
    await this.approvalQueue.authorizeObservation({
      title: "Read Facebook Page feed",
      description: `Fetch latest ${limit ?? 10} posts from page feed`,
    });
    const res = await this.api.getPageFeed(limit);
    return (res.data || []).map((item: any) => ({
      id: item.id,
      message: item.message,
      created_time: item.created_time,
      permalink_url: item.permalink_url,
      comments_count: item.comments?.summary?.total_count ?? 0,
      reactions_count: item.reactions?.summary?.total_count ?? 0,
    }));
  }

  async replyComment(commentId: string, message: string): Promise<FacebookPostResult> {
    await this.approvalQueue.authorizeMutatingAction({
      title: `Reply to Facebook comment ${commentId}`,
      description: `Reply: "${message.slice(0, 50)}${message.length > 50 ? "..." : ""}"`,
    });
    const res = await this.api.replyComment(commentId, message);
    return { success: true, id: res.id, message: "Comment reply posted" };
  }

  async getPageInfo(): Promise<FacebookPageInfo> {
    await this.approvalQueue.authorizeObservation({
      title: "Get Facebook Page info",
      description: "Read page profile details and followers count",
    });
    const res = await this.api.getPageInfo();
    return {
      id: res.id,
      name: res.name,
      category: res.category,
      fan_count: res.fan_count,
      pictureUrl: res.picture?.data?.url,
      link: res.link,
    };
  }

  async getPageInsights(): Promise<FacebookInsightsMetric[]> {
    await this.approvalQueue.authorizeObservation({
      title: "Get Facebook Page Insights",
      description: "Read page reach, engagement, and fan metrics",
    });
    const res = await this.api.getPageInsights();
    return res.data || [];
  }
}
