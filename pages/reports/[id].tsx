// pages/reports/[id].tsx
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';

export default function ReportPage() {
  const router = useRouter();
  const { id } = router.query;

  // Demo data (replace with real fetch)
  const report = {
    id: id ?? 'demo-report',
    title: 'Example: Flight 123 — Loss of Control After Takeoff',
    date: '2020-01-01',
    location: 'Springfield International Airport',
    operator: 'Example Air',
    aircraft: 'Boeing 737-800',
    registration: 'N123EX',
    fatalities: 0,
    injuries: 3,
    summary:
      'During initial climb the aircraft experienced a sudden roll and required an immediate return to the airport. This report summarises the investigation findings and safety recommendations.',
    pdfUrl: '/sample-report.pdf', // put a real pdf here in /public for demo
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold leading-tight">{report.title}</h1>
          <div className="mt-1 text-sm text-slate-600">
            {report.date} — {report.location}
          </div>
        </div>

        <div className="text-right text-sm">
          <div className="text-slate-700 font-medium">{report.operator}</div>
          <div className="text-slate-500">Aircraft — {report.aircraft}</div>
        </div>
      </div>

      {/* Lead summary */}
      <p className="text-base text-slate-700">{report.summary}</p>

      {/* Article body: two-column-ish with infobox on the right */}
      <div className="lg:flex lg:items-start lg:gap-6">
        {/* Main column */}
        <div className="lg:flex-1">
          <article className="article-content prose prose-slate max-w-none">
            <h2>History of the flight</h2>
            <p>
              Flight 123 departed at 08:12 local. The crew reported a normal
              takeoff roll but shortly after becoming airborne crew observed an
              uncommanded roll to the right. The captain took control and
              applied corrective inputs but the roll amplitude increased,
              accompanied by a brief pitch oscillation. The crew declared MAYDAY
              and returned to the airport for an emergency landing.
            </p>

            <h3>Sequence of events (timeline)</h3>
            <ul>
              <li>
                <strong>08:12</strong> — Takeoff from RWY 27.
              </li>
              <li>
                <strong>08:13</strong> — Uncommanded roll begins.
              </li>
              <li>
                <strong>08:14</strong> — Crew declares MAYDAY and initiates
                return.
              </li>
              <li>
                <strong>08:20</strong> — Aircraft lands safely with minor
                damage.
              </li>
            </ul>

            <h3>Investigation</h3>
            <p>
              The investigation recovered the flight data and cockpit voice
              recorders. Analysis showed a transient mismatch in the yaw damper
              and a jammed aileron actuator. Maintenance records indicated a
              recent repair in the aileron control system; laboratory testing
              reproduced the failure mode under certain hydraulic conditions.
            </p>

            <h3>Findings</h3>
            <ol>
              <li>
                Defective aileron actuator linkage leading to intermittent
                jamming.
              </li>
              <li>
                Insufficient maintenance inspection that failed to detect
                incorrect actuator installation torque.
              </li>
              <li>
                Flight crew responded appropriately and avoided serious injury.
              </li>
            </ol>

            <h3>Probable cause</h3>
            <p>
              The probable cause was a jammed aileron actuator caused by
              improper installation (insufficient torque on the actuator
              retaining nut) during recent maintenance.
            </p>

            <h3>Safety recommendations</h3>
            <ul>
              <li>
                Operator inspection of aileron actuator installations fleetwide.
              </li>
              <li>
                Revision of maintenance task card to include torque verification
                and post-installation functional check.
              </li>
              <li>
                Regulator to review oversight of the approved maintenance
                organization.
              </li>
            </ul>

            <h3>Data & tables</h3>
            <p>Key flight parameters recorded by FDR (excerpt):</p>
            <div className="overflow-x-auto">
              <table className="w-full table-auto text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="px-3 py-2 text-left">Time (UTC)</th>
                    <th className="px-3 py-2 text-left">Airspeed (kts)</th>
                    <th className="px-3 py-2 text-left">Pitch (deg)</th>
                    <th className="px-3 py-2 text-left">Roll (deg)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 py-2">08:12:10</td>
                    <td className="px-3 py-2">145</td>
                    <td className="px-3 py-2">2.1</td>
                    <td className="px-3 py-2">0.5</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">08:12:45</td>
                    <td className="px-3 py-2">150</td>
                    <td className="px-3 py-2">1.9</td>
                    <td className="px-3 py-2">15.2</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">08:13:10</td>
                    <td className="px-3 py-2">148</td>
                    <td className="px-3 py-2">2.3</td>
                    <td className="px-3 py-2">6.4</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3>Appendix</h3>
            <p>
              The full investigation report (PDF) is embedded below. You can
              download it or view selected figures inline.
            </p>

            {/* Embedded PDF (iframe) */}
            <div className="mt-3 border rounded overflow-hidden">
              <iframe
                src={report.pdfUrl}
                title="Investigation report PDF"
                className="w-full h-[600px] border-0"
              />
            </div>
          </article>
        </div>

        {/* Right-hand infobox */}
        <aside className="mt-6 lg:mt-0 lg:w-72 shrink-0">
          <div className="sticky top-[calc(var(--site-nav-height)+1rem)]">
            <div className="rounded border border-slate-200 bg-white p-3 text-sm shadow-sm">
              <div className="mb-3 text-xs text-slate-500 uppercase font-semibold">
                Occurrence
              </div>

              <div className="space-y-2">
                <div>
                  <strong>Date:</strong> {report.date}
                </div>
                <div>
                  <strong>Location:</strong> {report.location}
                </div>
                <div>
                  <strong>Operator:</strong> {report.operator}
                </div>
                <div>
                  <strong>Aircraft:</strong> {report.aircraft}
                </div>
                <div>
                  <strong>Registration:</strong> {report.registration}
                </div>
                <div>
                  <strong>Fatalities:</strong> {report.fatalities}
                </div>
                <div>
                  <strong>Injuries:</strong> {report.injuries}
                </div>
              </div>

              <div className="mt-3 border-t pt-3">
                <a
                  href={report.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full text-center rounded bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                >
                  Open full report (PDF)
                </a>

                <Link
                  href="/reports"
                  className="block mt-2 text-center text-xs text-slate-500"
                >
                  Back to reports
                </Link>
              </div>
            </div>

            {/* small figure */}
            <div className="mt-3 rounded bg-white p-2 text-xs text-slate-600 border border-slate-100">
              <div className="mb-2 font-medium text-slate-700">
                Figure 1 — damage
              </div>
              {/* replace with local image if you have one in /public */}
              <div className="w-full h-28 relative bg-slate-100">
                <Image
                  src="/sample-image.jpg"
                  alt="Sample"
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
