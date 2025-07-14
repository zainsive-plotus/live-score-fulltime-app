import dbConnect from "@/lib/dbConnect";
import Language, { ILanguage } from "@/models/Language";
import path from "path";
import { promises as fs } from "fs";

const LOCALES_DIR = path.join(process.cwd(), "src/locales");

interface CachedLocaleData {
  language: ILanguage;
  translations: Record<string, any>;
}

export class I18nCache {
  private static instance: I18nCache;
  private cache: Map<string, CachedLocaleData> = new Map();
  private isInitialized = false;
  private defaultLocale: string = "tr";

  private constructor() {}

  public static getInstance(): I18nCache {
    if (!I18nCache.instance) {
      I18nCache.instance = new I18nCache();
    }
    return I18nCache.instance;
  }

  public async initialize(): Promise<void> {
    // This guard prevents re-running the expensive DB/file operations
    if (this.isInitialized) {
      return;
    }
    console.log("[I18N_CACHE] First-time initialization running...");
    await this.loadData();
  }

  private async loadData(): Promise<void> {
    // ... existing loadData logic is correct ...
    console.log("[I18N_CACHE] Loading languages and translations...");
    try {
      await dbConnect();
      const activeLanguages = await Language.find({ isActive: true }).lean();
      const newCache = new Map<string, CachedLocaleData>();
      let foundDefault = false;

      for (const lang of activeLanguages) {
        try {
          const filePath = path.join(LOCALES_DIR, `${lang.code}.json`);
          const fileContent = await fs.readFile(filePath, "utf-8");
          const translations = JSON.parse(fileContent);
          newCache.set(lang.code, { language: lang, translations });
          if (lang.isDefault) {
            this.defaultLocale = lang.code;
            foundDefault = true;
          }
        } catch (error) {
          console.error(
            `[I18N_CACHE] Failed to load translations for '${lang.code}'. Skipping.`,
            error
          );
        }
      }

      if (!foundDefault && activeLanguages.length > 0) {
        this.defaultLocale = activeLanguages[0].code;
        console.warn(
          `[I18N_CACHE] No default language set in DB. Falling back to '${this.defaultLocale}'.`
        );
      }

      this.cache = newCache;
      this.isInitialized = true;
      console.log(`[I18N_CACHE] Loaded ${this.cache.size} active languages.`);
    } catch (error) {
      console.error(
        "[I18N_CACHE] CRITICAL: Failed to load any i18n data.",
        error
      );
    }
  }

  public async reload(): Promise<void> {
    console.log("[I18N_CACHE] Received request to reload data.");
    this.isInitialized = false; // Force re-initialization
    await this.initialize();
  }

  // --- Public Getters (now async) ---

  public async getLocales(): Promise<string[]> {
    await this.initialize();
    return Array.from(this.cache.keys());
  }

  public async getDefaultLocale(): Promise<string> {
    await this.initialize();
    return this.defaultLocale;
  }

  public async getTranslations(
    locale: string
  ): Promise<Record<string, any> | undefined> {
    await this.initialize();
    return this.cache.get(locale)?.translations;
  }
}

export const i18nCache = I18nCache.getInstance();
// REMOVED: i18nCache.initialize(); <-- We no longer call this on module load
