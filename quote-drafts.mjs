import { createDraft, migrateDraft, QUOTE_DRAFT_VERSION } from "./quote-core.mjs";

export const DRAFT_STORAGE_KEY = "woodallDealerQuoteDraftsV1";
export const ACTIVE_DRAFT_KEY = "woodallDealerQuoteActiveV1";

export class DraftRepository {
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
  }

  list() {
    try {
      const parsed = JSON.parse(this.storage.getItem(DRAFT_STORAGE_KEY) || "[]");
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
      return this.storage.getItem(ACTIVE_DRAFT_KEY) || "";
    } catch {
      return "";
    }
  }

  setActive(id) {
    this.storage.setItem(ACTIVE_DRAFT_KEY, id || "");
  }

  save(draft) {
    const now = new Date().toISOString();
    const normalized = migrateDraft({ ...draft, version: QUOTE_DRAFT_VERSION, updatedAt: now });
    const drafts = this.list().filter((item) => item.id !== normalized.id);
    drafts.unshift(normalized);
    this.storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
    this.setActive(normalized.id);
    return normalized;
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
    this.storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
    if (this.active() === id) this.setActive(drafts[0]?.id || "");
    return drafts;
  }
}
