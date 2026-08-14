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
import { LineApi } from "./line-api";
import type {
  LineBotInfo,
  LineMessageResult,
  LineQuotaResponse,
  LineSession,
  LineUserProfile,
} from "./types";
import TYPES_CODE from "./types.txt";
import LINE_LOGO_SVG from "./line-logo.svg";

type Env = Cloudflare.Env & {
  BASE_URL?: string;
  LINE_CHANNEL_ACCESS_TOKEN?: string;
};

type LineGatekeeperImplProps = {
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
  return stripTrailingSlashes(env.BASE_URL || "http://localhost:8787/gatekeeper/line");
}

const LINE_LOGO_URL = `data:image/svg+xml,${encodeURIComponent(LINE_LOGO_SVG)}`;

const LINE_BOT_RESOURCE: SupportedResource = {
  urlPattern: "https://*",
  title: "LINE Official Account",
  description: "Send push messages, flex messages, and broadcasts with LINE Messaging API.",
  icon: { url: LINE_LOGO_URL },
};

const SUPPORTED_RESOURCES: SupportedResource[] = [LINE_BOT_RESOURCE];

const CONNECT_FORM_HTML = (doId: string, nonce: string) => `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>เชื่อมต่อ LINE Official Account - GetnotesOS</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 16px;
      color: #1e293b;
    }
    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
      padding: 32px;
      max-width: 460px;
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
      color: #0f172a;
    }
    p {
      font-size: 14px;
      line-height: 1.5;
      color: #64748b;
      margin: 0 0 24px 0;
    }
    label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #334155;
      margin-bottom: 6px;
    }
    input {
      width: 100%;
      padding: 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 14px;
      box-sizing: border-box;
      outline: none;
      margin-bottom: 16px;
      font-family: monospace;
    }
    input:focus {
      border-color: #06C755;
      box-shadow: 0 0 0 3px rgba(6, 199, 85, 0.2);
    }
    button {
      width: 100%;
      background: #06C755;
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
      background: #05b04c;
    }
    .hint {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 16px;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo-container">
      <img src="${LINE_LOGO_URL}" class="logo" alt="LINE" />
      <div>
        <h1 style="margin:0;">เชื่อมต่อ LINE Bot</h1>
        <span style="font-size:12px; color:#06C755; font-weight:600;">LINE Messaging API</span>
      </div>
    </div>
    <p>กรอก <b>Channel Access Token (long-lived)</b> จาก LINE Developers Console เพื่อให้ AI ใน GetnotesOS สั่งส่งข้อความและทำงานร่วมกับ LINE OA ได้</p>
    <form method="POST" action="/gatekeeper/line/submit">
      <input type="hidden" name="doId" value="${doId}">
      <input type="hidden" name="nonce" value="${nonce}">
      <label for="token">Channel Access Token</label>
      <input type="password" id="token" name="token" placeholder="วาง Channel Access Token ที่นี่..." required autofocus />
      <button type="submit">บันทึกและเชื่อมต่อ</button>
    </form>
    <div class="hint">
      💡 สามารถคัดลอกได้จาก LINE Developers Console &gt; แท็บ Messaging API &gt; Channel access token (long-lived)
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
    body { font-family: system-ui; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #1e293b; text-align: center; }
    .box { background: white; padding: 32px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    h2 { color: #06C755; margin-top: 0; }
  </style>
</head>
<body>
  <div class="box">
    <h2>✓ เชื่อมต่อ LINE Official Account สำเร็จ!</h2>
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
      displayName: "LINE",
      url: "https://line.me",
      logo: { url: LINE_LOGO_URL },
      color: "#06C755",
      tagline: "Send push messages, flex messages, and broadcasts",
      description:
        "Connect your LINE Official Account so GetnotesOS can send push messages, " +
        "rich flex messages, reply to users, and broadcast announcements to your followers.",
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
      displayName: desc.displayName || "LINE Bot Account",
      uniqueName: desc.uniqueName || "@linebot",
      avatar: desc.pictureUrl ? { url: desc.pictureUrl } : { url: LINE_LOGO_URL },
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
    const props: LineGatekeeperImplProps = {
      userObjectId: this.ctx.props.userObjectId,
    };
    return {
      class: this.ctx.exports.LineGatekeeperImpl({ props }),
      resource: LINE_BOT_RESOURCE,
    };
  }

  async startResourceConfigurator(resourceUrlPattern: string): Promise<ResourceConfiguratorFrame> {
    throw new Error(`Unsupported LINE resource configurator type: ${resourceUrlPattern}`);
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
    return this.ctx.exports.LineVerifier({});
  }
}

// ---------------------------------------------------------------------------
// Verifier

@validateRpc()
export class LineVerifier extends WorkerEntrypoint<Env> implements GatekeeperUserVerifier {
  verify(): void {}
}

// ---------------------------------------------------------------------------
// UserAccount (Durable Object storing Channel Access Token)

@validateRpc()
export class UserAccount extends DurableObject<Env> {
  private sql = this.ctx.storage.sql;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS credentials (
        key TEXT PRIMARY KEY,
        token TEXT NOT NULL,
        botName TEXT,
        basicId TEXT,
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

    // Verify token with LINE API to get Bot info
    const api = new LineApi(token);
    let botInfo: any = {};
    try {
      botInfo = await api.getBotInfo();
    } catch (err) {
      console.warn("Could not fetch bot info from LINE:", err);
    }

    const botName = botInfo.displayName || "LINE Official Account";
    const basicId = botInfo.basicId || botInfo.userId || "@linebot";
    const pictureUrl = botInfo.pictureUrl || null;

    this.sql.exec(
      `INSERT OR REPLACE INTO credentials (key, token, botName, basicId, pictureUrl, updatedAt) VALUES (default, ?, ?, ?, ?, ?)`,
      token,
      botName,
      basicId,
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
    const row = this.sql.exec<{ botName: string; basicId: string; pictureUrl: string | null }>(
      `SELECT botName, basicId, pictureUrl FROM credentials WHERE key = default`
    ).one();
    return {
      displayName: row?.botName || "LINE Bot Account",
      uniqueName: row?.basicId || "@linebot",
      pictureUrl: row?.pictureUrl || null,
    };
  }

  async getToken(): Promise<string> {
    const row = this.sql.exec<{ token: string }>(`SELECT token FROM credentials WHERE key = default`).one();
    return row?.token || this.env.LINE_CHANNEL_ACCESS_TOKEN || "";
  }

  async revoke(): Promise<void> {
    this.sql.exec(`DELETE FROM credentials`);
  }
}

// ---------------------------------------------------------------------------
// LineGatekeeperImpl (Session provider for AI Agent)

@validateRpc()
export class LineGatekeeperImpl extends DurableObject<Env, LineGatekeeperImplProps> implements Gatekeeper<LineSession> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  async describe(): Promise<ResourceDescription> {
    return {
      title: "LINE Official Account",
      icon: { url: LINE_LOGO_URL },
    };
  }

  async getAutoApprovableActions(): Promise<ActionDescription[]> {
    return [];
  }

  async startSession(approvalQueue: RpcStub<ApprovalQueue>): Promise<LineSession> {
    const queue = approvalQueue.dup();
    const userStub = this.env.UserAccount.get(this.env.UserAccount.idFromString(this.ctx.props.userObjectId));
    const token = await userStub.getToken();
    const api = new LineApi(token);
    return new LineSessionImpl(api, queue);
  }

  async addObserver(_id: string, _user: Fetcher<GatekeeperUserVerifier>): Promise<void> {}
  async removeObserver(_id: string): Promise<void> {}

  async applyAction(_id: number): Promise<void> {}
  async rejectAction(_id: number): Promise<void> {}
  async revertAction(_id: number): Promise<void> {}
}

// ---------------------------------------------------------------------------
// LineSessionImpl

class LineSessionImpl extends RpcTarget implements LineSession {
  constructor(
    private api: LineApi,
    private approvalQueue: RpcStub<ApprovalQueue>,
  ) {
    super();
  }

  async sendTextMessage(to: string, text: string): Promise<LineMessageResult> {
    await this.approvalQueue.authorizeMutatingAction({
      title: `Send LINE message to ${to}`,
      description: `Send text message: "${text.slice(0, 50)}${text.length > 50 ? "..." : ""}" to ${to}`,
    });
    const res = await this.api.sendPushMessage(to, [{ type: "text", text }]);
    return { success: true, sentMessages: res.sentMessages ?? 1 };
  }

  async sendFlexMessage(to: string, altText: string, contents: any): Promise<LineMessageResult> {
    await this.approvalQueue.authorizeMutatingAction({
      title: `Send LINE Flex Message to ${to}`,
      description: `Send flex card: "${altText}" to ${to}`,
    });
    const res = await this.api.sendPushMessage(to, [{ type: "flex", altText, contents }]);
    return { success: true, sentMessages: res.sentMessages ?? 1 };
  }

  async broadcastTextMessage(text: string): Promise<LineMessageResult> {
    await this.approvalQueue.authorizeMutatingAction({
      title: "Broadcast LINE message to all followers",
      description: `Broadcast: "${text.slice(0, 60)}${text.length > 60 ? "..." : ""}" to all followers`,
    });
    const res = await this.api.sendBroadcastMessage([{ type: "text", text }]);
    return { success: true, sentMessages: res.sentMessages ?? 1 };
  }

  async getUserProfile(userId: string): Promise<LineUserProfile> {
    await this.approvalQueue.authorizeObservation({
      title: `Get LINE Profile: ${userId}`,
      description: `Fetch profile details for LINE user ID ${userId}`,
    });
    return await this.api.getUserProfile(userId);
  }

  async getBotInfo(): Promise<LineBotInfo> {
    await this.approvalQueue.authorizeObservation({
      title: "Get LINE Bot Info",
      description: "Fetch status and details of this LINE Official Account",
    });
    return await this.api.getBotInfo();
  }

  async getMessageQuota(): Promise<LineQuotaResponse> {
    await this.approvalQueue.authorizeObservation({
      title: "Check LINE Message Quota",
      description: "Read monthly message quota and current consumption",
    });
    const quota = await this.api.getMessageQuota();
    let consumption = 0;
    try {
      const c = await this.api.getMessageQuotaConsumption();
      consumption = c.totalUsage ?? 0;
    } catch {}
    return {
      type: quota.type,
      value: quota.value,
      totalUsage: consumption,
    };
  }
}
