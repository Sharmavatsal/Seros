import { useState, useEffect } from 'react';
import { Download, FileText, BarChart2, Calendar, Filter } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/ToastContext';
import { SkeletonChart, SkeletonTable } from '../../components/ui/Skeletons';

const ROLE_VERTICAL = {
  admin: null,
  rental_manager: 'rental',
  piling_manager: 'piling',
  om_manager: 'om',
};

const MOCK_DATA = {
  daily: [
    { date: '2026-07-14', revenue: 12400, count: 3 },
    { date: '2026-07-15', revenue: 18200, count: 5 },
    { date: '2026-07-16', revenue: 9800, count: 2 },
    { date: '2026-07-17', revenue: 22100, count: 6 },
    { date: '2026-07-18', revenue: 15600, count: 4 },
    { date: '2026-07-19', revenue: 19800, count: 5 },
    { date: '2026-07-20', revenue: 8400, count: 2 },
  ],
  monthly: [
    { date: '2026-01', revenue: 85000, count: 18 },
    { date: '2026-02', revenue: 92000, count: 22 },
    { date: '2026-03', revenue: 78000, count: 15 },
    { date: '2026-04', revenue: 110000, count: 28 },
    { date: '2026-05', revenue: 125000, count: 31 },
    { date: '2026-06', revenue: 138000, count: 35 },
  ],
  yearly: [
    { date: '2022', revenue: 820000, count: 180 },
    { date: '2023', revenue: 940000, count: 210 },
    { date: '2024', revenue: 1050000, count: 235 },
    { date: '2025', revenue: 1230000, count: 275 },
    { date: '2026', revenue: 628000, count: 149 },
  ],
};

const formatCurrency = (v) => `\u20B9${Number(v || 0).toLocaleString()}`;

const ReportsPage = () => {
  const user = useAuthStore((s) => s.user);
  const toast = useToast();
  const userVertical = ROLE_VERTICAL[user?.role];

  const [timeframe, setTimeframe] = useState('monthly');
  const [vertical, setVertical] = useState(userVertical || 'all');
  const [viewMode, setViewMode] = useState('graphical');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [exporting, setExporting] = useState(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = { timeframe };
      if (vertical !== 'all') params.vertical = vertical;
      const res = await api.get('/reports/data', { params });
      const rows = res.data.data || [];
      setData(rows.length ? rows.map(r => ({ date: r.date, revenue: r.metrics?.revenue || 0, count: r.metrics?.count || 0 })) : MOCK_DATA[timeframe]);
      setSummary(res.data.summary || null);
    } catch {
      setData(MOCK_DATA[timeframe]);
      setSummary({ total_records: 0, summary_metrics: { total_revenue: MOCK_DATA[timeframe].reduce((a, b) => a + b.revenue, 0) } });
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchReport(); }, [timeframe, vertical]);

  const handleExport = async (format) => {
    setExporting(format);
    try {
      if (format === 'csv') {
        exportCSV();
      } else if (format === 'pdf') {
        exportPDF();
      }
      toast.success(`${format.toUpperCase()} exported successfully`);
    } catch {
      toast.error(`Failed to export ${format.toUpperCase()}`);
    } finally {
      setExporting(null);
    }
  };

  const exportCSV = () => {
    const headers = ['Period', 'Revenue', 'Transactions', 'Avg per Transaction'];
    const rows = data.map(r => [
      r.date,
      r.revenue?.toFixed(2) || '0.00',
      r.count || 0,
      r.count ? (r.revenue / r.count).toFixed(2) : '0.00',
    ]);
    const summaryRow = ['TOTAL', totalRevenue.toFixed(2), totalCount, totalCount ? (totalRevenue / totalCount).toFixed(2) : '0.00'];

    const csvContent = [headers, ...rows, [], summaryRow]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report_${vertical}_${timeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const RS = 'Rs.';

    const verticalLabel = vertical === 'all' ? 'All Verticals' : vertical.charAt(0).toUpperCase() + vertical.slice(1);
    const title = `${verticalLabel} — ${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} Report`;
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, 42, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('SEROSOPS', margin, 18);

    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('Business Operations Platform', margin, 25);

    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${dateStr}`, pageWidth - margin, 18, { align: 'right' });
    doc.text(`Period: ${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}`, pageWidth - margin, 25, { align: 'right' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(title, margin, 54);

    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.6);
    doc.line(margin, 57, pageWidth - margin, 57);

    const kpiY = 64;
    const kpiBoxW = (pageWidth - 2 * margin - 12) / 3;
    const kpis = [
      { label: 'Total Revenue', value: `${RS} ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
      { label: 'Total Transactions', value: totalCount.toLocaleString() },
      { label: 'Avg / Period', value: `${RS} ${(data.length ? totalRevenue / data.length : 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
    ];

    kpis.forEach((kpi, i) => {
      const x = margin + i * (kpiBoxW + 6);
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(x, kpiY, kpiBoxW, 20, 2, 2, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, kpiY, kpiBoxW, 20, 2, 2, 'S');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(kpi.label, x + kpiBoxW / 2, kpiY + 7, { align: 'center' });

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text(kpi.value, x + kpiBoxW / 2, kpiY + 15, { align: 'center' });
    });

    const tableStartY = kpiY + 30;
    const tableData = data.map(row => {
      const rev = row.revenue || 0;
      const cnt = row.count || 0;
      const avg = cnt ? (rev / cnt).toFixed(2) : '0.00';
      return [row.date, `${RS} ${rev.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, cnt.toString(), `${RS} ${Number(avg).toLocaleString('en-US', { minimumFractionDigits: 2 })}`];
    });

    const avgTotal = data.length ? (totalRevenue / data.length).toFixed(2) : '0.00';
    tableData.push(['TOTAL', `${RS} ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, totalCount.toString(), `${RS} ${Number(avgTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}`]);

    const tableResult = autoTable(doc, {
      startY: tableStartY,
      head: [['Period', 'Revenue', 'Transactions', 'Avg / Transaction']],
      body: tableData,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 3,
        textColor: [33, 37, 41],
        lineColor: [226, 232, 240],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
      },
      alternateRowStyles: {
        fillColor: [241, 245, 249],
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 50 },
        1: { halign: 'right', cellWidth: 42 },
        2: { halign: 'center', cellWidth: 35 },
        3: { halign: 'right', cellWidth: 42 },
      },
      margin: { left: margin, right: margin },
      didParseCell: function (hookData) {
        if (hookData.section === 'body' && hookData.row.index === data.length) {
          hookData.cell.styles.fontStyle = 'bold';
          hookData.cell.styles.fillColor = [30, 41, 59];
          hookData.cell.styles.textColor = [255, 255, 255];
        }
      },
    });

    const finalY = (tableResult ? tableResult.finalY : tableStartY) + 10;
    if (finalY > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
    }
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184);
    doc.text('This report is auto-generated by the SEROSOPS Business Operations Platform.', pageWidth / 2, footerY, { align: 'center' });

    doc.save(`report_${vertical}_${timeframe}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const totalRevenue = summary?.summary_metrics?.total_revenue || data.reduce((a, b) => a + b.revenue, 0);
  const totalCount = summary?.total_records || data.reduce((a, b) => a + b.count, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Reports</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">
            {userVertical ? `${userVertical.charAt(0).toUpperCase() + userVertical.slice(1)} vertical` : 'All verticals'}
          </p>
        </div>

        {/* Export buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting === 'csv'}
            className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-surface border border-border text-xs md:text-sm text-gray-300 hover:text-white hover:border-primary rounded-lg transition-colors disabled:opacity-50"
          >
            <Download size={15} />
            {exporting === 'csv' ? 'Exporting...' : 'CSV'}
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting === 'pdf'}
            className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-primary hover:bg-primary-dark text-white text-xs md:text-sm rounded-lg transition-colors disabled:opacity-50"
          >
            <FileText size={15} />
            {exporting === 'pdf' ? 'Exporting...' : 'PDF'}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        {/* Period selector */}
        <div className="flex gap-1 bg-surface border border-border rounded-lg p-1">
          {['daily', 'monthly', 'yearly'].map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-md text-xs md:text-sm font-medium capitalize transition-all ${timeframe === t ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Calendar size={13} />
              {t === 'daily' ? 'Day' : t === 'monthly' ? 'Month' : 'Year'}
            </button>
          ))}
        </div>

        {/* Vertical filter (admin only) */}
        {!userVertical && (
          <div className="flex flex-wrap gap-1 bg-surface border border-border rounded-lg p-1">
            {['all', 'rental', 'piling', 'om'].map((v) => (
              <button
                key={v}
                onClick={() => setVertical(v)}
                className={`px-2 md:px-3 py-1.5 rounded-md text-xs md:text-sm font-medium capitalize transition-all ${vertical === v ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white'}`}
              >
                {v === 'all' ? 'All' : v}
              </button>
            ))}
          </div>
        )}

        {/* View toggle */}
        <div className="flex gap-1 bg-surface border border-border rounded-lg p-1 ml-auto">
          <button
            onClick={() => setViewMode('graphical')}
            className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-md text-xs md:text-sm transition-all ${viewMode === 'graphical' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <BarChart2 size={14} />
            Graph
          </button>
          <button
            onClick={() => setViewMode('tabular')}
            className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-md text-xs md:text-sm transition-all ${viewMode === 'tabular' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <Filter size={14} />
            Table
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), color: 'text-healthy' },
          { label: 'Total Transactions', value: totalCount.toLocaleString(), color: 'text-primary' },
          { label: 'Avg per Period', value: formatCurrency(data.length ? totalRevenue / data.length : 0), color: 'text-warning' },
          { label: 'Period', value: timeframe.charAt(0).toUpperCase() + timeframe.slice(1), color: 'text-gray-300' },
        ].map((item, i) => (
          <div key={i} className="bg-surface border border-border rounded-lg p-3 md:p-4">
            <p className="text-[10px] md:text-xs text-gray-500 mb-0.5 md:mb-1">{item.label}</p>
            <p className={`text-base md:text-xl font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Main content */}
      {loading ? (
        viewMode === 'graphical' ? <SkeletonChart height={380} title /> : <SkeletonTable rows={8} cols={3} />
      ) : viewMode === 'graphical' ? (
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-lg p-4 md:p-6 shadow-sm">
            <h3 className="text-sm md:text-lg font-medium text-white mb-4 md:mb-6 capitalize">
              {vertical === 'all' ? 'All Verticals' : vertical} — {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} Revenue
            </h3>
            <div style={{ height: 280 }} className="md:min-h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                  <XAxis dataKey="date" stroke="#A1A1AA" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#A1A1AA" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `\u20B9${v / 1000}k`} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#27272A', color: '#FFF' }} formatter={(v, n) => [n === 'revenue' ? `\u20B9${v.toLocaleString()}` : v, n === 'revenue' ? 'Revenue' : 'Transactions']} />
                  <Legend wrapperStyle={{ color: '#A1A1AA' }} />
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-4 md:p-6 shadow-sm">
            <h3 className="text-sm md:text-lg font-medium text-white mb-4 md:mb-6">Transaction Volume</h3>
            <div style={{ height: 220 }} className="md:min-h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                  <XAxis dataKey="date" stroke="#A1A1AA" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#A1A1AA" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#27272A', color: '#FFF' }} cursor={{ fill: '#27272A', opacity: 0.3 }} />
                  <Bar dataKey="count" name="Transactions" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm md:text-base font-medium text-white capitalize">{timeframe} Report Data</h3>
            <span className="text-xs text-gray-500">{data.length} periods</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background/40">
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg per Transaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-3 md:px-6 py-3 font-mono text-xs text-gray-300">{row.date}</td>
                    <td className="px-3 md:px-6 py-3 font-semibold text-white">{formatCurrency(row.revenue)}</td>
                    <td className="px-3 md:px-6 py-3 text-gray-400">{row.count}</td>
                    <td className="px-3 md:px-6 py-3 text-gray-400">{row.count ? formatCurrency(row.revenue / row.count) : '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-background/40">
                  <td className="px-3 md:px-6 py-3 text-sm font-semibold text-gray-300">Total</td>
                  <td className="px-3 md:px-6 py-3 text-sm font-bold text-white">{formatCurrency(totalRevenue)}</td>
                  <td className="px-3 md:px-6 py-3 text-sm font-semibold text-gray-300">{totalCount}</td>
                  <td className="px-3 md:px-6 py-3 text-sm text-gray-400">{totalCount ? formatCurrency(totalRevenue / totalCount) : '—'}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
