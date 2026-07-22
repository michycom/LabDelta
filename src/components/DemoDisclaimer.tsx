import { FlaskConical, ShieldAlert } from "lucide-react";
import { localizedDisclaimerItems, localizedDisclaimerStorage, useI18n } from "../i18n";

export function DemoBanner() {
  const { t } = useI18n();
  return <div className="demo-banner" data-demo-target="demo-banner" role="status">
    <FlaskConical aria-hidden="true" size={17} />
    <strong>{t("demoBanner")}</strong>
  </div>;
}

export function DemoDisclaimer({ onAcknowledge }: { onAcknowledge: () => void }) {
  const { language, t } = useI18n();
  return <main className="demo-disclaimer-page">
    <section aria-labelledby="demo-disclaimer-title" aria-modal="true" className="demo-disclaimer" role="dialog">
      <div className="demo-disclaimer-heading">
        <ShieldAlert aria-hidden="true" size={30} />
        <div>
          <span>{t("demoBanner")}</span><h1 id="demo-disclaimer-title">{t("disclaimerTitle")}</h1>
        </div>
      </div>
      <p>{t("disclaimerBody")}</p>
      <ul>{localizedDisclaimerItems(language).map(item => <li key={item}>{item}</li>)}</ul>
      <p className="demo-acknowledgement-note">{localizedDisclaimerStorage(language)}</p>
      <button className="primary-button" type="button" onClick={onAcknowledge}>{t("disclaimerAccept")}</button>
    </section>
  </main>;
}
