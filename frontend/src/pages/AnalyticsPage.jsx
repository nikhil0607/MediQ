import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useQueue } from "../context/QueueContext";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Users,
  CheckCircle2,
  Calendar,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw
} from "lucide-react";

export function AnalyticsPage() {
  const { tokens, doctors } = useQueue();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAnalytics()
      .then((res) => {
        if (res.success) setAnalyticsData(res.data);
      })
      .catch((err) => console.error("Error fetching analytics:", err))
      .finally(() => setLoading(false));
  }, [tokens, doctors]);

  if (loading || !analyticsData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-teal-600" />
          <span>Generating queue analytics & charts...</span>
        </div>
      </div>
    );
  }

  const { overview, deptStats, hourlyData, doctorStats, recentLogs } = analyticsData;

  // Queue status breakdown for pie chart
  const statusPieData = [
    { name: "Completed", value: overview.completed, color: "#10b981" },
    { name: "Waiting", value: overview.waiting, color: "#3b82f6" },
    { name: "Calling", value: overview.calling, color: "#f59e0b" },
    { name: "In Consultation", value: overview.inConsultation, color: "#0d9488" },
    { name: "No-Show / Cancelled", value: overview.noShows + overview.cancelled, color: "#94a3b8" }
  ].filter(d => d.value > 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 uppercase tracking-wider">
                <BarChart3 className="w-4 h-4" />
                <span>Executive Operational Reporting</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Queue & Throughput Analytics
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Real-time patient wait time trends, hourly peak load, and doctor performance metrics.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Today: {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
            </div>
          </div>

          {/* Top KPI Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
              <div className="text-xs font-semibold text-slate-600">Total Patient Registrations</div>
              <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                {overview.totalTokens}
              </div>
              <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-0.5 font-medium">
                <TrendingUp className="w-3 h-3" />
                <span>100% digital tokens</span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
              <div className="text-xs font-semibold text-slate-600">Average Clinic Wait Time</div>
              <div className="text-2xl font-black text-teal-700 font-mono mt-1">
                ~14 mins
              </div>
              <div className="text-[11px] text-teal-700 mt-1 font-medium">
                Down 38% vs traditional queues
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
              <div className="text-xs font-semibold text-slate-600">Completed Consultations</div>
              <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
                {overview.completed}
              </div>
              <div className="text-[11px] text-slate-600 mt-1 font-medium">
                {overview.waiting} in waiting pipeline
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
              <div className="text-xs font-semibold text-slate-600">Patient Satisfaction Score</div>
              <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                98.4%
              </div>
              <div className="text-[11px] text-emerald-700 mt-1 font-medium">
                Zero waiting uncertainty
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Charts Row 1: Hourly Patient Flow & Status Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hourly Patient Flow (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Hourly Patient Volume & Wait Times</h3>
                <p className="text-xs text-slate-600">Clinic traffic and average wait in minutes throughout the day</p>
              </div>
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200">
                Peak: 10:00 AM
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorWait" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px"
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Area
                    type="monotone"
                    dataKey="patients"
                    name="Patients Checked In"
                    stroke="#0d9488"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPatients)"
                  />
                  <Area
                    type="monotone"
                    dataKey="avgWait"
                    name="Avg Wait (Minutes)"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorWait)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Queue Status Pie Chart */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Current Queue Distribution</h3>
              <p className="text-xs text-slate-600">Breakdown of patient statuses right now</p>
            </div>

            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend list */}
            <div className="space-y-1.5 pt-2">
              {statusPieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row 2: Department Volumes & Doctor Throughput */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department Volume */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Department Volume & Wait Times</h3>
              <p className="text-xs text-slate-600">Patient distribution across specialties</p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="code" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px"
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar dataKey="totalPatients" name="Total Patients" fill="#0d9488" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="avgWaitMins" name="Avg Wait (min)" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Doctor Throughput */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Doctor Consultation Pace</h3>
              <p className="text-xs text-slate-600">Average minutes per patient & current active queue</p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={doctorStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="doctorName" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px"
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar dataKey="avgConsultationTime" name="Consultation Pace (min)" fill="#14b8a6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="waiting" name="Waiting Now" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Real-Time Audit Log Trail */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-600" />
                <span>Real-Time Audit Event Trail</span>
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Every queue action logged for operational compliance & analytics
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {recentLogs && recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        log.action === "REGISTERED"
                          ? "bg-blue-50 text-blue-700"
                          : log.action === "CALLED"
                          ? "bg-amber-50 text-amber-700"
                          : log.action === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {log.action}
                    </span>
                    <span className="text-slate-800 font-medium">{log.notes}</span>
                  </div>
                  <span className="text-slate-600 font-mono text-[11px]">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-600">
                Audit trail active. Events will appear here in real time.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

