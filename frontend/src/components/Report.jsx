import React, { useState, useEffect } from "react";
import axios from "axios";

export default function Report() {
  const token = localStorage.getItem("access");
  const [reports, setReports] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:8000/url/bulk-reports/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setReports(res.data.results || res.data));
  }, []);

  return (
    <div className="space-y-6">

      <h2 className="text-2xl font-bold text-blue-400">
        Bulk Upload Reports
      </h2>

      <div className="bg-slate-800 rounded-xl overflow-hidden">

        <table className="w-full text-sm text-slate-300">
          <thead className="bg-slate-700 text-slate-200 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Run ID</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Success</th>
              <th className="px-4 py-3">Failed</th>
              <th className="px-4 py-3">Skipped</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {reports.map((report) => (
              <React.Fragment key={report.run_id}>
                <tr className="border-t border-slate-700 hover:bg-slate-700/40">
                  <td className="px-4 py-3 font-mono text-blue-400">
                    {report.run_id}
                  </td>
                  <td className="px-4 py-3">{report.upload_type}</td>
                  <td className="px-4 py-3">{report.total_records}</td>
                  <td className="px-4 py-3 text-green-400">
                    {report.success_records}
                  </td>
                  <td className="px-4 py-3 text-red-400">
                    {report.failed_records}
                  </td>
                  <td className="px-4 py-3 text-yellow-400">
                    {report.skipped_records}
                  </td>

                  <td className="px-4 py-3">
                    <button
                      className="text-blue-400"
                      onClick={() =>
                        setExpanded(
                          expanded === report.run_id ? null : report.run_id
                        )
                      }
                    >
                      {expanded === report.run_id
                        ? "Hide Details"
                        : "View Details"}
                    </button>
                  </td>
                </tr>

                {expanded === report.run_id && (
                  <tr className="bg-slate-900">
                    <td colSpan="7" className="p-5">

                      {/* Failed Records */}
                      {report.failed_details?.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-red-400 font-semibold mb-2">
                            Failed Records
                          </h4>

                          {report.failed_details.map((f, index) => (
                            <div
                              key={index}
                              className="bg-red-500/10 text-red-300 p-2 rounded mb-2 text-xs"
                            >
                              Row {f.row}: {f.error}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Skipped Records */}
                      {report.skipped_details?.length > 0 && (
                        <div>
                          <h4 className="text-yellow-400 font-semibold mb-2">
                            Skipped Records
                          </h4>

                          {report.skipped_details.map((s, index) => (
                            <div
                              key={index}
                              className="bg-yellow-500/10 text-yellow-300 p-2 rounded mb-2 text-xs"
                            >
                              Row {s.row}: {s.reason}
                            </div>
                          ))}
                        </div>
                      )}

                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}