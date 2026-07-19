import { FlaskConical, ShieldAlert } from "lucide-react";

export function DemoBanner() {
  return <div className="demo-banner" role="status">
    <FlaskConical aria-hidden="true" size={17} />
    <strong>Demo – ausschließlich synthetische Testdaten</strong>
  </div>;
}

export function DemoDisclaimer({ onAcknowledge }: { onAcknowledge: () => void }) {
  return <main className="demo-disclaimer-page">
    <section aria-labelledby="demo-disclaimer-title" aria-modal="true" className="demo-disclaimer" role="dialog">
      <div className="demo-disclaimer-heading">
        <ShieldAlert aria-hidden="true" size={30} />
        <div>
          <span>Demo – ausschließlich synthetische Testdaten</span>
          <h1 id="demo-disclaimer-title">Hinweis vor dem Start</h1>
        </div>
      </div>
      <p>LabDelta ist ein Forschungs- und Demonstrationsprojekt. Es ist nicht klinisch validiert und nicht für medizinische Nutzung freigegeben.</p>
      <ul>
        <li>Die Anwendung verarbeitet ausschließlich mitgelieferte synthetische Testdaten.</li>
        <li>Alle dargestellten Personen, Befunde und Nutzungsszenarien sind synthetisch. Es wird kein reales klinisches Nutzungsszenario dargestellt oder freigegeben.</li>
        <li>Für diese Demonstration sind ausschließlich die mitgelieferten synthetischen Originaldokumente gegenüber daraus abgeleiteten Demo-Anzeigen maßgeblich.</li>
        <li>Die Software darf nicht für medizinische Entscheidungen genutzt werden.</li>
        <li>LabDelta erstellt keine Diagnose, Prognose oder Therapie-, Test- oder Behandlungsempfehlung.</li>
        <li>Dieser Hinweis und seine Kenntnisnahme sind keine regulatorische Prüfung, Zertifizierung oder Freigabe.</li>
      </ul>
      <p className="demo-acknowledgement-note">Die lokale Speicherung dokumentiert ausschließlich, dass dieser technische UI-Hinweis angezeigt und zur Kenntnis genommen wurde.</p>
      <button className="primary-button" type="button" onClick={onAcknowledge}>Hinweis zur Kenntnis nehmen und Demo öffnen</button>
    </section>
  </main>;
}
