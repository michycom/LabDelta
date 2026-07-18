import { profiles } from "../data/demo";
import { Panel } from "./Panel";

export function ProfileOverview() {
  return <Panel number={3} title="Laboratory profile overview" subtitle="for Müller, Anna" className="profiles"><div className="profile-grid">{profiles.map(profile => <article key={profile.name}><strong>{profile.name}</strong><span>{profile.affected}</span><em className={profile.severity}>{profile.status}</em><div className={`meter ${profile.severity}`}><i /></div></article>)}</div><button className="outline-button" type="button">Show all profiles in detail</button><p className="info">ⓘ Laboratory values can belong to several profiles. Counts overlap.</p></Panel>;
}

