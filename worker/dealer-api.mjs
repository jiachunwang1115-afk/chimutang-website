const API_PREFIX = "/api/dealer";
const SESSION_COOKIE = "woodall_dealer_session";
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const PASSWORD_ITERATIONS = 120000;
const MAX_JSON_BYTES = 196 * 1024;
const MAX_QUOTE_LINES = 8;

const INITIAL_ADMIN = {
  id: "woodall-initial-admin",
  username: "woodall_admin",
  displayName: "痴木堂总部",
  salt: "IunpOIairu8ob9DFQtDq1Q",
  hash: "VnZaujockTFyM9bhG91J4R7S65WMLuqps9M81Pky_6c",
  iterations: 120000,
};

const encoder = new TextEncoder();
let schemaPromise = null;

function nowIso() {
  return new Date().toISOString();
}

function addSeconds(iso, seconds) {
  return new Date(new Date(iso).getTime() + seconds * 1000).toISOString();
}

function clampNumber(value, minimum, maximum) {
  const number = Number(value);
  if (!Number.isFinite(number)) return minimum;
  return Math.min(maximum, Math.max(minimum, number));
}

function cleanText(value, maxLength = 160) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function normalizeUsername(value) {
  return cleanText(value, 40).toLowerCase();
}

export function isValidUsername(value) {
  return /^[a-z0-9][a-z0-9._-]{2,39}$/.test(normalizeUsername(value));
}

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value) {
  const normalized = String(value).replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function randomToken(bytes = 32) {
  const value = new Uint8Array(bytes);
  crypto.getRandomValues(value);
  return bytesToBase64Url(value);
}

export function createTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return `WA-${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")}`;
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(digest));
}

export async function hashPassword(password, salt = randomToken(16), iterations = PASSWORD_ITERATIONS) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(String(password)), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: base64UrlToBytes(salt), iterations },
    key,
    256,
  );
  return { salt, hash: bytesToBase64Url(new Uint8Array(bits)), iterations };
}

export async function verifyPassword(password, salt, expectedHash, iterations = PASSWORD_ITERATIONS) {
  const actual = await hashPassword(password, salt, iterations);
  const left = base64UrlToBytes(actual.hash);
  const right = base64UrlToBytes(expectedHash);
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

function json(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...extraHeaders,
    },
  });
}

function errorResponse(code, message, status = 400, details) {
  return json({ ok: false, error: { code, message, ...(details ? { details } : {}) } }, status);
}

async function readJson(request) {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_JSON_BYTES) throw new Error("PAYLOAD_TOO_LARGE");
  const text = await request.text();
  if (encoder.encode(text).byteLength > MAX_JSON_BYTES) throw new Error("PAYLOAD_TOO_LARGE");
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("INVALID_JSON");
  }
}

function parseCookies(request) {
  return Object.fromEntries((request.headers.get("cookie") || "").split(";").map((part) => {
    const [name, ...rest] = part.trim().split("=");
    return [name, rest.join("=")];
  }).filter(([name]) => name));
}

function sessionTokenFromRequest(request) {
  const authorization = request.headers.get("authorization") || "";
  if (authorization.startsWith("Bearer ")) return { token: authorization.slice(7).trim(), transport: "bearer" };
  return { token: parseCookies(request)[SESSION_COOKIE] || "", transport: "cookie" };
}

function sessionCookie(token, maxAge = SESSION_MAX_AGE_SECONDS) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

function publicUser(row) {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    active: Boolean(row.active),
    mustChangePassword: Boolean(row.must_change_password),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at || null,
  };
}

async function ensureSchema(db) {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await db.batch([
        db.prepare(`CREATE TABLE IF NOT EXISTS dealer_users (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL UNIQUE COLLATE NOCASE,
          display_name TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('admin', 'dealer')),
          password_salt TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          password_iterations INTEGER NOT NULL,
          active INTEGER NOT NULL DEFAULT 1,
          must_change_password INTEGER NOT NULL DEFAULT 1,
          failed_login_count INTEGER NOT NULL DEFAULT 0,
          locked_until TEXT,
          created_by TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          last_login_at TEXT
        )`),
        db.prepare(`CREATE TABLE IF NOT EXISTS dealer_sessions (
          token_hash TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          created_at TEXT NOT NULL,
          last_seen_at TEXT NOT NULL,
          user_agent TEXT,
          ip_hint TEXT,
          FOREIGN KEY (user_id) REFERENCES dealer_users(id) ON DELETE CASCADE
        )`),
        db.prepare(`CREATE TABLE IF NOT EXISTS dealer_quotes (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          dealer_name TEXT NOT NULL,
          title TEXT NOT NULL,
          project_name TEXT NOT NULL,
          city TEXT NOT NULL,
          quote_date TEXT NOT NULL,
          line_count INTEGER NOT NULL,
          total_net_area REAL NOT NULL,
          total_billable_area REAL NOT NULL,
          total_cents INTEGER NOT NULL,
          draft_json TEXT NOT NULL,
          totals_json TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES dealer_users(id) ON DELETE CASCADE
        )`),
        db.prepare("CREATE INDEX IF NOT EXISTS dealer_sessions_user_idx ON dealer_sessions(user_id)"),
        db.prepare("CREATE INDEX IF NOT EXISTS dealer_sessions_expiry_idx ON dealer_sessions(expires_at)"),
        db.prepare("CREATE INDEX IF NOT EXISTS dealer_quotes_user_updated_idx ON dealer_quotes(user_id, updated_at DESC)"),
        db.prepare("CREATE INDEX IF NOT EXISTS dealer_quotes_updated_idx ON dealer_quotes(updated_at DESC)"),
      ]);

      const timestamp = nowIso();
      await db.prepare(`INSERT OR IGNORE INTO dealer_users (
        id, username, display_name, role, password_salt, password_hash, password_iterations,
        active, must_change_password, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, 'admin', ?, ?, ?, 1, 1, 'system', ?, ?)`)
        .bind(
          INITIAL_ADMIN.id,
          INITIAL_ADMIN.username,
          INITIAL_ADMIN.displayName,
          INITIAL_ADMIN.salt,
          INITIAL_ADMIN.hash,
          INITIAL_ADMIN.iterations,
          timestamp,
          timestamp,
        ).run();
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  return schemaPromise;
}

async function getSession(request, db) {
  const credential = sessionTokenFromRequest(request);
  if (!credential.token || credential.token.length < 32) return null;
  const tokenHash = await sha256(credential.token);
  const row = await db.prepare(`SELECT
      s.token_hash, s.expires_at, u.*
    FROM dealer_sessions s
    JOIN dealer_users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ? AND u.active = 1`)
    .bind(tokenHash, nowIso()).first();
  if (!row) return null;
  return { user: publicUser(row), tokenHash, transport: credential.transport };
}

async function requireSession(request, db, role) {
  const session = await getSession(request, db);
  if (!session) return { response: errorResponse("AUTH_REQUIRED", "请先登录", 401) };
  if (session.user.mustChangePassword && new URL(request.url).pathname !== `${API_PREFIX}/auth/change-password`) {
    return { response: errorResponse("PASSWORD_CHANGE_REQUIRED", "首次登录需要修改密码", 403), session };
  }
  if (role && session.user.role !== role) return { response: errorResponse("FORBIDDEN", "没有访问权限", 403), session };
  return { session };
}

function validateMutationOrigin(request, transport) {
  if (transport === "bearer") return true;
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

function normalizeLine(line = {}) {
  return {
    room: cleanText(line.room, 60),
    productCode: cleanText(line.productCode, 60).toUpperCase(),
    netArea: clampNumber(line.netArea, 0, 1000000),
    wasteRate: clampNumber(line.wasteRate, 0, 100),
    unitPrice: clampNumber(line.unitPrice, 0, 1000000),
    note: cleanText(line.note, 500),
  };
}

export function sanitizeDraft(raw = {}) {
  const lines = Array.isArray(raw.lines) ? raw.lines.slice(0, MAX_QUOTE_LINES).map(normalizeLine) : [];
  return {
    version: 1,
    id: cleanText(raw.id, 80),
    title: cleanText(raw.title, 120) || "未命名报价",
    customTitle: Boolean(raw.customTitle),
    createdAt: cleanText(raw.createdAt, 40) || nowIso(),
    updatedAt: cleanText(raw.updatedAt, 40) || nowIso(),
    project: {
      name: cleanText(raw.project?.name, 120),
      city: cleanText(raw.project?.city, 80),
      address: cleanText(raw.project?.address, 240),
      quoteDate: cleanText(raw.project?.quoteDate, 20),
      validUntil: cleanText(raw.project?.validUntil, 20),
      needs: cleanText(raw.project?.needs, 1200),
      advice: cleanText(raw.project?.advice, 1200),
    },
    tax: {
      mode: raw.tax?.mode === "excluded" ? "excluded" : "included",
      rate: clampNumber(raw.tax?.rate, 0, 100),
    },
    discount: {
      type: raw.discount?.type === "fixed" ? "fixed" : "percent",
      value: clampNumber(raw.discount?.value, 0, 100000000),
    },
    fees: {
      accessoryUnitPrice: clampNumber(raw.fees?.accessoryUnitPrice, 0, 1000000),
      installationUnitPrice: clampNumber(raw.fees?.installationUnitPrice, 0, 1000000),
      transportAmount: clampNumber(raw.fees?.transportAmount, 0, 100000000),
      otherAmount: clampNumber(raw.fees?.otherAmount, 0, 100000000),
      otherLabel: cleanText(raw.fees?.otherLabel, 120),
    },
    terms: cleanText(raw.terms, 2000),
    lines,
  };
}

export function calculateServerTotals(draft) {
  const roundArea = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
  const yuanToCents = (value) => Math.round((value + Number.EPSILON) * 100);
  const lines = draft.lines.map((line) => {
    const netArea = roundArea(line.netArea);
    const billableArea = roundArea(netArea * (1 + line.wasteRate / 100));
    const amountCents = Math.round(billableArea * yuanToCents(line.unitPrice));
    return { netArea, billableArea, amountCents };
  });
  const totalNetArea = roundArea(lines.reduce((sum, line) => sum + line.netArea, 0));
  const totalBillableArea = roundArea(lines.reduce((sum, line) => sum + line.billableArea, 0));
  const materialCents = lines.reduce((sum, line) => sum + line.amountCents, 0);
  const accessoryCents = Math.round(totalBillableArea * yuanToCents(draft.fees.accessoryUnitPrice));
  const installationCents = Math.round(totalBillableArea * yuanToCents(draft.fees.installationUnitPrice));
  const transportCents = yuanToCents(draft.fees.transportAmount);
  const otherCents = yuanToCents(draft.fees.otherAmount);
  const subtotalCents = materialCents + accessoryCents + installationCents + transportCents + otherCents;
  const rawDiscount = draft.discount.type === "fixed"
    ? yuanToCents(draft.discount.value)
    : Math.round(subtotalCents * Math.min(100, draft.discount.value) / 100);
  const discountCents = Math.min(subtotalCents, rawDiscount);
  const discountedCents = subtotalCents - discountCents;
  const taxCents = draft.tax.mode === "excluded"
    ? Math.round(discountedCents * draft.tax.rate / 100)
    : draft.tax.rate > 0 ? Math.round(discountedCents * draft.tax.rate / (100 + draft.tax.rate)) : 0;
  const totalCents = draft.tax.mode === "excluded" ? discountedCents + taxCents : discountedCents;
  return { totalNetArea, totalBillableArea, materialCents, subtotalCents, discountCents, taxCents, totalCents };
}

async function handleLogin(request, db) {
  const body = await readJson(request);
  const username = normalizeUsername(body.username);
  const password = String(body.password || "");
  const client = body.client === "miniprogram" ? "miniprogram" : "web";
  if (!isValidUsername(username) || !password) return errorResponse("INVALID_CREDENTIALS", "账号或密码不正确", 401);

  const row = await db.prepare("SELECT * FROM dealer_users WHERE username = ?").bind(username).first();
  if (row?.locked_until && row.locked_until > nowIso()) {
    return errorResponse("ACCOUNT_LOCKED", "登录尝试过多，请稍后再试", 429);
  }
  const verified = row
    ? await verifyPassword(password, row.password_salt, row.password_hash, row.password_iterations)
    : await verifyPassword(password, INITIAL_ADMIN.salt, INITIAL_ADMIN.hash, INITIAL_ADMIN.iterations).then(() => false);
  if (!row || !verified || !row.active) {
    if (row) {
      const failures = Number(row.failed_login_count || 0) + 1;
      const lockedUntil = failures >= 5 ? addSeconds(nowIso(), 15 * 60) : null;
      await db.prepare("UPDATE dealer_users SET failed_login_count = ?, locked_until = ?, updated_at = ? WHERE id = ?")
        .bind(failures >= 5 ? 0 : failures, lockedUntil, nowIso(), row.id).run();
    }
    return errorResponse("INVALID_CREDENTIALS", "账号或密码不正确", 401);
  }

  const token = randomToken(32);
  const tokenHash = await sha256(token);
  const createdAt = nowIso();
  const expiresAt = addSeconds(createdAt, SESSION_MAX_AGE_SECONDS);
  await db.batch([
    db.prepare("DELETE FROM dealer_sessions WHERE expires_at <= ?").bind(createdAt),
    db.prepare(`INSERT INTO dealer_sessions
      (token_hash, user_id, expires_at, created_at, last_seen_at, user_agent, ip_hint)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind(
        tokenHash,
        row.id,
        expiresAt,
        createdAt,
        createdAt,
        cleanText(request.headers.get("user-agent"), 240),
        cleanText(request.headers.get("cf-connecting-ip"), 64),
      ),
    db.prepare(`UPDATE dealer_users SET failed_login_count = 0, locked_until = NULL,
      last_login_at = ?, updated_at = ? WHERE id = ?`).bind(createdAt, createdAt, row.id),
  ]);

  const headers = client === "web" ? { "set-cookie": sessionCookie(token) } : {};
  return json({ ok: true, user: publicUser(row), ...(client === "miniprogram" ? { sessionToken: token, expiresAt } : {}) }, 200, headers);
}

async function handleSession(request, db) {
  const session = await getSession(request, db);
  if (!session) return errorResponse("AUTH_REQUIRED", "请先登录", 401);
  return json({ ok: true, user: session.user });
}

async function handleLogout(request, db) {
  const session = await getSession(request, db);
  if (session) await db.prepare("DELETE FROM dealer_sessions WHERE token_hash = ?").bind(session.tokenHash).run();
  return json({ ok: true }, 200, { "set-cookie": sessionCookie("", 0) });
}

async function handleChangePassword(request, db) {
  const authorization = await requireSession(request, db);
  if (authorization.response && authorization.response.status !== 403) return authorization.response;
  const session = authorization.session;
  if (!session) return authorization.response;
  if (!validateMutationOrigin(request, session.transport)) return errorResponse("INVALID_ORIGIN", "请求来源无效", 403);
  const body = await readJson(request);
  const currentPassword = String(body.currentPassword || "");
  const nextPassword = String(body.nextPassword || "");
  if (nextPassword.length < 12 || nextPassword.length > 128) {
    return errorResponse("WEAK_PASSWORD", "新密码至少需要 12 位", 400);
  }
  const row = await db.prepare("SELECT * FROM dealer_users WHERE id = ?").bind(session.user.id).first();
  if (!row || !await verifyPassword(currentPassword, row.password_salt, row.password_hash, row.password_iterations)) {
    return errorResponse("INVALID_CURRENT_PASSWORD", "当前密码不正确", 400);
  }
  const next = await hashPassword(nextPassword);
  const timestamp = nowIso();
  await db.batch([
    db.prepare(`UPDATE dealer_users SET password_salt = ?, password_hash = ?, password_iterations = ?,
      must_change_password = 0, updated_at = ? WHERE id = ?`)
      .bind(next.salt, next.hash, next.iterations, timestamp, row.id),
    db.prepare("DELETE FROM dealer_sessions WHERE user_id = ? AND token_hash <> ?").bind(row.id, session.tokenHash),
  ]);
  return json({ ok: true, user: { ...session.user, mustChangePassword: false } });
}

async function handleOwnQuotes(request, db) {
  const authorization = await requireSession(request, db);
  if (authorization.response) return authorization.response;
  const rows = await db.prepare(`SELECT id, title, project_name, city, quote_date, line_count,
      total_net_area, total_billable_area, total_cents, created_at, updated_at, draft_json
    FROM dealer_quotes WHERE user_id = ? ORDER BY updated_at DESC LIMIT 100`)
    .bind(authorization.session.user.id).all();
  return json({ ok: true, quotes: (rows.results || []).map((row) => ({
    id: row.id,
    title: row.title,
    projectName: row.project_name,
    city: row.city,
    quoteDate: row.quote_date,
    lineCount: row.line_count,
    totalNetArea: row.total_net_area,
    totalBillableArea: row.total_billable_area,
    totalCents: row.total_cents,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    draft: JSON.parse(row.draft_json),
  })) });
}

async function handleSaveQuote(request, db, quoteId) {
  const authorization = await requireSession(request, db);
  if (authorization.response) return authorization.response;
  const session = authorization.session;
  if (!validateMutationOrigin(request, session.transport)) return errorResponse("INVALID_ORIGIN", "请求来源无效", 403);
  const body = await readJson(request);
  const draft = sanitizeDraft(body.draft || body);
  if (!quoteId || quoteId !== draft.id || quoteId.length > 80) return errorResponse("INVALID_QUOTE_ID", "报价编号无效");
  const owner = await db.prepare("SELECT user_id FROM dealer_quotes WHERE id = ?").bind(quoteId).first();
  if (owner && owner.user_id !== session.user.id) return errorResponse("QUOTE_ID_CONFLICT", "报价编号冲突", 409);
  const totals = calculateServerTotals(draft);
  const timestamp = nowIso();
  const createdAt = owner ? undefined : cleanText(draft.createdAt, 40) || timestamp;
  await db.prepare(`INSERT INTO dealer_quotes (
      id, user_id, dealer_name, title, project_name, city, quote_date, line_count,
      total_net_area, total_billable_area, total_cents, draft_json, totals_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      dealer_name = excluded.dealer_name,
      title = excluded.title,
      project_name = excluded.project_name,
      city = excluded.city,
      quote_date = excluded.quote_date,
      line_count = excluded.line_count,
      total_net_area = excluded.total_net_area,
      total_billable_area = excluded.total_billable_area,
      total_cents = excluded.total_cents,
      draft_json = excluded.draft_json,
      totals_json = excluded.totals_json,
      updated_at = excluded.updated_at`)
    .bind(
      quoteId,
      session.user.id,
      session.user.displayName,
      draft.title || draft.project.name || "未命名报价",
      draft.project.name,
      draft.project.city,
      draft.project.quoteDate,
      draft.lines.length,
      totals.totalNetArea,
      totals.totalBillableArea,
      totals.totalCents,
      JSON.stringify(draft),
      JSON.stringify(totals),
      createdAt || timestamp,
      timestamp,
    ).run();
  return json({ ok: true, quote: { id: quoteId, updatedAt: timestamp, totals } });
}

async function handleDeleteQuote(request, db, quoteId) {
  const authorization = await requireSession(request, db);
  if (authorization.response) return authorization.response;
  const session = authorization.session;
  if (!validateMutationOrigin(request, session.transport)) return errorResponse("INVALID_ORIGIN", "请求来源无效", 403);
  await db.prepare("DELETE FROM dealer_quotes WHERE id = ? AND user_id = ?").bind(quoteId, session.user.id).run();
  return json({ ok: true });
}

async function handleAdminUsers(request, db) {
  const authorization = await requireSession(request, db, "admin");
  if (authorization.response) return authorization.response;
  const rows = await db.prepare(`SELECT id, username, display_name, role, active, must_change_password,
      created_at, updated_at, last_login_at FROM dealer_users ORDER BY role, created_at`).all();
  return json({ ok: true, users: (rows.results || []).map(publicUser) });
}

async function handleCreateUser(request, db) {
  const authorization = await requireSession(request, db, "admin");
  if (authorization.response) return authorization.response;
  const session = authorization.session;
  if (!validateMutationOrigin(request, session.transport)) return errorResponse("INVALID_ORIGIN", "请求来源无效", 403);
  const body = await readJson(request);
  const username = normalizeUsername(body.username);
  const displayName = cleanText(body.displayName, 80);
  const role = body.role === "admin" ? "admin" : "dealer";
  if (!isValidUsername(username)) return errorResponse("INVALID_USERNAME", "账号需为 3-40 位字母、数字、点、横线或下划线");
  if (!displayName) return errorResponse("DISPLAY_NAME_REQUIRED", "请填写经销商或成员名称");
  if (await db.prepare("SELECT id FROM dealer_users WHERE username = ?").bind(username).first()) {
    return errorResponse("USERNAME_EXISTS", "该账号已存在", 409);
  }
  const temporaryPassword = createTemporaryPassword();
  const password = await hashPassword(temporaryPassword);
  const timestamp = nowIso();
  const id = crypto.randomUUID();
  await db.prepare(`INSERT INTO dealer_users (
    id, username, display_name, role, password_salt, password_hash, password_iterations,
    active, must_change_password, created_by, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?, ?)`)
    .bind(id, username, displayName, role, password.salt, password.hash, password.iterations, session.user.id, timestamp, timestamp).run();
  return json({ ok: true, user: { id, username, displayName, role, active: true, mustChangePassword: true, createdAt: timestamp, updatedAt: timestamp, lastLoginAt: null }, temporaryPassword }, 201);
}

async function handleUpdateUser(request, db, userId) {
  const authorization = await requireSession(request, db, "admin");
  if (authorization.response) return authorization.response;
  const session = authorization.session;
  if (!validateMutationOrigin(request, session.transport)) return errorResponse("INVALID_ORIGIN", "请求来源无效", 403);
  const target = await db.prepare("SELECT * FROM dealer_users WHERE id = ?").bind(userId).first();
  if (!target) return errorResponse("USER_NOT_FOUND", "账号不存在", 404);
  const body = await readJson(request);
  if (body.action === "reset_password") {
    const temporaryPassword = createTemporaryPassword();
    const password = await hashPassword(temporaryPassword);
    const timestamp = nowIso();
    await db.batch([
      db.prepare(`UPDATE dealer_users SET password_salt = ?, password_hash = ?, password_iterations = ?,
        must_change_password = 1, failed_login_count = 0, locked_until = NULL, updated_at = ? WHERE id = ?`)
        .bind(password.salt, password.hash, password.iterations, timestamp, userId),
      db.prepare("DELETE FROM dealer_sessions WHERE user_id = ?").bind(userId),
    ]);
    return json({ ok: true, temporaryPassword });
  }
  if (body.action === "set_active") {
    const active = Boolean(body.active);
    if (target.id === session.user.id && !active) return errorResponse("CANNOT_DISABLE_SELF", "不能停用当前管理员账号");
    await db.batch([
      db.prepare("UPDATE dealer_users SET active = ?, updated_at = ? WHERE id = ?").bind(active ? 1 : 0, nowIso(), userId),
      ...(active ? [] : [db.prepare("DELETE FROM dealer_sessions WHERE user_id = ?").bind(userId)]),
    ]);
    return json({ ok: true, active });
  }
  return errorResponse("INVALID_ACTION", "不支持的账号操作");
}

async function adminQuoteRows(db, limit = 200) {
  const rows = await db.prepare(`SELECT id, user_id, dealer_name, title, project_name, city, quote_date,
      line_count, total_net_area, total_billable_area, total_cents, created_at, updated_at
    FROM dealer_quotes ORDER BY updated_at DESC LIMIT ?`).bind(limit).all();
  return rows.results || [];
}

function quoteSummary(row) {
  return {
    id: row.id,
    userId: row.user_id,
    dealerName: row.dealer_name,
    title: row.title,
    projectName: row.project_name,
    city: row.city,
    quoteDate: row.quote_date,
    lineCount: row.line_count,
    totalNetArea: row.total_net_area,
    totalBillableArea: row.total_billable_area,
    totalCents: row.total_cents,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function handleAdminQuotes(request, db) {
  const authorization = await requireSession(request, db, "admin");
  if (authorization.response) return authorization.response;
  return json({ ok: true, quotes: (await adminQuoteRows(db)).map(quoteSummary) });
}

async function handleAdminQuoteDetail(request, db, quoteId) {
  const authorization = await requireSession(request, db, "admin");
  if (authorization.response) return authorization.response;
  const row = await db.prepare("SELECT * FROM dealer_quotes WHERE id = ?").bind(quoteId).first();
  if (!row) return errorResponse("QUOTE_NOT_FOUND", "报价不存在", 404);
  return json({ ok: true, quote: { ...quoteSummary(row), draft: JSON.parse(row.draft_json), totals: JSON.parse(row.totals_json) } });
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

async function handleAdminCsv(request, db) {
  const authorization = await requireSession(request, db, "admin");
  if (authorization.response) return authorization.response;
  const rows = await adminQuoteRows(db, 1000);
  const lines = [
    ["经销商", "项目名称", "城市", "报价日期", "产品条数", "净面积", "计价面积", "报价总额（元）", "更新时间"],
    ...rows.map((row) => [row.dealer_name, row.project_name, row.city, row.quote_date, row.line_count, row.total_net_area, row.total_billable_area, (row.total_cents / 100).toFixed(2), row.updated_at]),
  ];
  return new Response(`\uFEFF${lines.map((line) => line.map(csvCell).join(",")).join("\r\n")}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="woodall-dealer-quotes-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}.csv"`,
      "cache-control": "no-store",
    },
  });
}

export async function handleDealerApi(request, env) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith(API_PREFIX)) return null;
  if (!env?.DB) return errorResponse("DATABASE_UNAVAILABLE", "报价数据库尚未启用", 503);

  try {
    await ensureSchema(env.DB);
    const path = url.pathname.slice(API_PREFIX.length) || "/";
    const method = request.method.toUpperCase();

    if (method === "GET" && path === "/health") return json({ ok: true });
    if (method === "POST" && path === "/auth/login") return handleLogin(request, env.DB);
    if (method === "GET" && path === "/auth/session") return handleSession(request, env.DB);
    if (method === "POST" && path === "/auth/logout") return handleLogout(request, env.DB);
    if (method === "POST" && path === "/auth/change-password") return handleChangePassword(request, env.DB);
    if (method === "GET" && path === "/quotes") return handleOwnQuotes(request, env.DB);
    if (method === "GET" && path === "/admin/users") return handleAdminUsers(request, env.DB);
    if (method === "POST" && path === "/admin/users") return handleCreateUser(request, env.DB);
    if (method === "GET" && path === "/admin/quotes") return handleAdminQuotes(request, env.DB);
    if (method === "GET" && path === "/admin/quotes.csv") return handleAdminCsv(request, env.DB);

    const ownQuoteMatch = path.match(/^\/quotes\/([^/]+)$/);
    if (ownQuoteMatch && method === "PUT") return handleSaveQuote(request, env.DB, decodeURIComponent(ownQuoteMatch[1]));
    if (ownQuoteMatch && method === "DELETE") return handleDeleteQuote(request, env.DB, decodeURIComponent(ownQuoteMatch[1]));

    const adminUserMatch = path.match(/^\/admin\/users\/([^/]+)$/);
    if (adminUserMatch && method === "PATCH") return handleUpdateUser(request, env.DB, decodeURIComponent(adminUserMatch[1]));

    const adminQuoteMatch = path.match(/^\/admin\/quotes\/([^/]+)$/);
    if (adminQuoteMatch && method === "GET") return handleAdminQuoteDetail(request, env.DB, decodeURIComponent(adminQuoteMatch[1]));

    return errorResponse("NOT_FOUND", "接口不存在", 404);
  } catch (error) {
    if (error?.message === "PAYLOAD_TOO_LARGE") return errorResponse("PAYLOAD_TOO_LARGE", "提交的数据过大", 413);
    if (error?.message === "INVALID_JSON") return errorResponse("INVALID_JSON", "提交的数据格式无效", 400);
    console.error("Dealer API error", error);
    return errorResponse("INTERNAL_ERROR", "服务暂时不可用，请稍后重试", 500);
  }
}

