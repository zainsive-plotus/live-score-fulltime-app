import { getI18n } from "@/lib/i18n/server";

export default async function AdminDashboardPage() {
  const t = await getI18n();

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-4">
        {t("admin_dashboard")}
      </h1>
      <p className="text-brand-muted">{t("welcome_to_admin_area")}</p>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-brand-secondary rounded-lg">
          <h3 className="font-bold text-white">{t("manage_users")}</h3>
          <p className="text-sm text-brand-muted mt-2">
            {t("view_and_edit_user_roles")}
          </p>
        </div>
        <div className="p-6 bg-brand-secondary rounded-lg">
          <h3 className="font-bold text-white">{t("manage_matches")}</h3>
          <p className="text-sm text-brand-muted mt-2">
            {t("update_match_details")}
          </p>
        </div>
        <div className="p-6 bg-brand-secondary rounded-lg">
          <h3 className="font-bold text-white">{t("view_analytics")}</h3>
          <p className="text-sm text-brand-muted mt-2">
            {t("check_site_traffic")}
          </p>
        </div>
      </div>
    </div>
  );
}
