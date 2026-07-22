import { createDraft, migrateDraft, QUOTE_DRAFT_VERSION } from "./quote-core.mjs";

export const DRAFT_STORAGE_KEY = "woodallDealerQuoteDraftsV1";
export const ACTIVE_DRAFT_KEY = "woodallDealerQuoteActiveV1";

export class DraftRepository {
  constructor(storage = globalThis.localStorage, namespace = "") {
    this.storage = storage;
    this.draftsKey = namespace ? `${DRAFT_STORAGE_KEY}:${namespace}` : DRAFT_STORAGE_KEY;
    this.activeKey = namespace ? `${ACTIVE_DRAFT_KEY}:${namespace}` : ACTIVE_DRAFT_KEY;
  }

  list() {
    try {
      const parsed = JSON.parse(this.storage.getItem(this.draftsKey) || "[]");
      if (!Array.isArray(parsed)) return [];
      return parsed.map(migrateDraft).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    } catch {
      return [];
    }
  }

  get(id) {
    return this.list().find((draft) => draft.id === id) || null;
  }

  active() {
    try {
      return this.storage.getItem(this.activeKey) || "";
    } catch {
      return "";
    }
  }

  setActive(id) {
    this.storage.setItem(this.activeKey, id || "");
  }

  save(draft, options = {}) {
    const now = options.preserveUpdatedAt ? (draft.updatedAt || new Date().toISOString()) : new Date().toISOString();
    const normalized = migrateDraft({ ...draft, version: QUOTE_DRAFT_VERSION, updatedAt: now });
    const drafts = this.list().filter((item) => item.id !== normalized.id);
    drafts.unshift(normalized);
    this.storage.setItem(this.draftsKey, JSON.stringify(drafts));
    this.setActive(normalized.id);
    return normalized;
  }

  import(draft) {
    return this.save(draft, { preserveUpdatedAt: true });
  }

  create(overrides = {}) {
    return this.save(createDraft(overrides));
  }

  duplicate(id) {
    const source = this.get(id);
    if (!source) return null;
    const copy = createDraft({
      ...source,
      id: undefined,
      title: `${source.title || source.project.name || "未命名报价"}（副本）`,
      createdAt: undefined,
      updatedAt: undefined,
    });
    return this.save(copy);
  }

  rename(id, title) {
    const draft = this.get(id);
    if (!draft) return null;
    draft.title = String(title || "").trim() || "未命名报价";
    draft.customTitle = true;
    return this.save(draft);
  }

  delete(id) {
    const drafts = this.list().filter((draft) => draft.id !== id);
    this.storage.setItem(this.draftsKey, JSON.stringify(drafts));
    if (this.active() === id) this.setActive(drafts[0]?.id || "");
    return drafts;
  }
}
