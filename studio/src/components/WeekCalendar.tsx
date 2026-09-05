import {fmtTime, statusChip, type ScheduleEntry} from "../api";
import {PlatformBadge} from "./Schedule";

// Monday 00:00 of the week containing d.
export const mondayOf = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
};
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

type Props = {entries: ScheduleEntry[]; week: Date; onWeek: (monday: Date) => void; onSelect: (entry: ScheduleEntry) => void; selectedId?: string | null};

// Mon–Sun columns; entries as chips (platform badge, time, episode, status colour).
export const WeekCalendar = ({entries, week, onWeek, onSelect, selectedId}: Props) => {
  const monday = mondayOf(week);
  const today = new Date();
  const days = Array.from({length: 7}, (_, i) => addDays(monday, i));
  const sunday = days[6];
  const range = `${monday.toLocaleDateString(undefined, {month: "short", day: "numeric"})} – ${sunday.toLocaleDateString(undefined, {month: "short", day: "numeric", year: "numeric"})}`;
  const forDay = (d: Date) =>
    entries
      .filter((e) => {
        const t = new Date(e.scheduledAt);
        return !Number.isNaN(t.getTime()) && sameDay(t, d);
      })
      .sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt));

  return (
    <div className="cal">
      <div className="cal-bar">
        <div className="btn-row">
          <button className="sm" onClick={() => onWeek(addDays(monday, -7))}>
            ‹ Prev
          </button>
          <button className="sm" onClick={() => onWeek(mondayOf(new Date()))}>
            This week
          </button>
          <button className="sm" onClick={() => onWeek(addDays(monday, 7))}>
            Next ›
          </button>
        </div>
        <strong>{range}</strong>
        <span className="small muted">{entries.length} entries in the schedule</span>
      </div>
      <div className="cal-grid">
        {days.map((d) => {
          const list = forDay(d);
          const isToday = sameDay(d, today);
          return (
            <div key={d.toISOString()} className={`cal-day ${isToday ? "today" : ""} ${d.getDay() === 0 || d.getDay() === 6 ? "weekend" : ""}`}>
              <div className="cal-head">
                <span>{d.toLocaleDateString(undefined, {weekday: "short"})}</span>
                <strong>{d.getDate()}</strong>
              </div>
              {list.map((e) => (
                <button key={e.id} className={`cal-chip ${statusChip(e.status)} ${selectedId === e.id ? "selected" : ""}`} onClick={() => onSelect(e)} title={`${e.platform} · ${e.status} · ${e.episodeTitle}`}>
                  <PlatformBadge platform={e.platform} size={18} />
                  <span className="t">{fmtTime(e.scheduledAt)}</span>
                  <span className="n">{e.episodeTitle}</span>
                </button>
              ))}
              {list.length === 0 && <div className="cal-empty" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};
