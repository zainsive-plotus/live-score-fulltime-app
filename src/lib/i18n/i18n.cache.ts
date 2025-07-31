// ===== src/lib/i18n/i18n.cache.ts =====

import dbConnect from "@/lib/dbConnect";
import Language, { ILanguage } from "@/models/Language";
import Translation from "@/models/Translation";
import redis from "@/lib/redis"; // Import your configured Redis client

const CACHE_TTL_SECONDS = 60 * 60 * 24; // 24 hours

const CACHE_KEYS = {
  LOCALES: "i18n:meta:locales",
  DEFAULT_LOCALE: "i18n:meta:default_locale",
  TRANSLATIONS_PREFIX: "i18n:translations:",
};

interface CachedLocaleData {
  language: ILanguage;
  translations: Record<string, any>;
}

const isProduction = process.env.NODE_ENV === "production";

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
    // In development, we skip initialization to force a fresh DB fetch on every request.
    // In production, if already initialized, we don't need to do it again.
    if (this.isInitialized) {
      return;
    }

    // --- PRODUCTION CACHING LOGIC ---
    if (isProduction) {
      try {
        console.log(
          "[I18N_CACHE] [PROD] Attempting to load translations from Redis..."
        );
        const cachedLocalesStr = await redis.get(CACHE_KEYS.LOCALES);
        const cachedDefaultLocale = await redis.get(CACHE_KEYS.DEFAULT_LOCALE);

        if (cachedLocalesStr && cachedDefaultLocale) {
          const locales: string[] = JSON.parse(cachedLocalesStr);
          const newCache = new Map<string, CachedLocaleData>();

          for (const locale of locales) {
            const translationsStr = await redis.get(
              `${CACHE_KEYS.TRANSLATIONS_PREFIX}${locale}`
            );
            if (translationsStr) {
              newCache.set(locale, JSON.parse(translationsStr));
            } else {
              throw new Error(
                `Inconsistent cache: Missing translations for locale '${locale}'.`
              );
            }
          }

          this.cache = newCache;
          this.defaultLocale = cachedDefaultLocale;
          this.isInitialized = true;
          console.log(
            `[I18N_CACHE] [PROD] ✓ Successfully loaded translations for ${this.cache.size} locales from Redis.`
          );
          return;
        }

        console.log(
          "[I18N_CACHE] [PROD] Redis cache miss. Loading from database..."
        );
        await this.loadDataFromDB();
        return;
      } catch (error) {
        console.warn(
          "[I18N_CACHE] [PROD] Could not load from Redis. Falling back to database.",
          error
        );
        await this.loadDataFromDB();
        return;
      }
    }

    // --- DEVELOPMENT LOGIC (Always fetch from DB) ---
    console.log(
      "[I18N_CACHE] [DEV] Bypassing cache, loading directly from database..."
    );
    await this.loadDataFromDB();
  }

  private async loadDataFromDB(): Promise<void> {
    try {
      await dbConnect();

      const [activeLanguages, allTranslations] = await Promise.all([
        Language.find({ isActive: true }).lean(),
        Translation.find({}).lean(),
      ]);

      const newCache = new Map<string, CachedLocaleData>();
      let foundDefault = false;

      if (activeLanguages.length === 0) {
        console.warn("[I18N_CACHE] No active languages found in the database.");
        this.isInitialized = !isProduction; // Stay uninitialized in dev to allow re-fetching
        return;
      }

      for (const lang of activeLanguages) {
        newCache.set(lang.code, { language: lang, translations: {} });
        if (lang.isDefault) {
          this.defaultLocale = lang.code;
          foundDefault = true;
        }
      }

      if (!foundDefault) {
        this.defaultLocale = activeLanguages[0].code;
        console.warn(
          `[I18N_CACHE] No default language set. Falling back to '${this.defaultLocale}'.`
        );
      }

      for (const translationDoc of allTranslations) {
        for (const [langCode, text] of Object.entries(
          translationDoc.translations
        )) {
          if (newCache.has(langCode)) {
            newCache.get(langCode)!.translations[translationDoc.key] = text;
          }
        }
      }

      if (isProduction) {
        const redisPipeline = redis.pipeline();
        redisPipeline.set(
          CACHE_KEYS.LOCALES,
          JSON.stringify(Array.from(newCache.keys()))
        );
        redisPipeline.set(CACHE_KEYS.DEFAULT_LOCALE, this.defaultLocale);

        for (const [locale, data] of newCache.entries()) {
          redisPipeline.set(
            `${CACHE_KEYS.TRANSLATIONS_PREFIX}${locale}`,
            JSON.stringify(data),
            "EX",
            CACHE_TTL_SECONDS
          );
        }
        await redisPipeline.exec();
        console.log(
          "[I18N_CACHE] [PROD] ✓ Populated Redis cache from database."
        );
      }

      this.cache = newCache;
      // In development, we don't set isInitialized to true, so it re-fetches on every request.
      // In production, we set it to true to prevent re-fetching until the server restarts or cache is invalidated.
      this.isInitialized = isProduction;
      console.log(
        `[I18N_CACHE] Successfully loaded translations for ${this.cache.size} locales from DB.`
      );
    } catch (error) {
      console.error(
        "[I18N_CACHE] CRITICAL: Failed to load i18n data from database.",
        error
      );
      this.isInitialized = false;
    }
  }

  public async reload(): Promise<void> {
    console.log("[I18N_CACHE] Reload triggered. Invalidating cache...");

    if (isProduction) {
      const locales = await this.getLocales(); // This will initialize if not already
      const keysToDel = [
        CACHE_KEYS.LOCALES,
        CACHE_KEYS.DEFAULT_LOCALE,
        ...locales.map((l) => `${CACHE_KEYS.TRANSLATIONS_PREFIX}${l}`),
      ];
      if (keysToDel.length > 2) {
        await redis.del(...keysToDel);
      }
    }

    this.isInitialized = false;
    this.cache.clear();
    await this.initialize();
  }

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
