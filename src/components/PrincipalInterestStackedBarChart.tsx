import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { LoanContract, PaymentRecord } from '../types';
import { generateAmortizationSchedule, formatCurrency } from '../lib/loanUtils';

interface PrincipalInterestStackedBarChartProps {
  contracts: LoanContract[];
  payments: PaymentRecord[];
  onSelectContract?: (contractId: string) => void;
}

export default function PrincipalInterestStackedBarChart({
  contracts,
  payments,
  onSelectContract
}: PrincipalInterestStackedBarChartProps) {
  // Mode toggles
  // 'paid' = Actual payments to date (ตัดเงินต้นจริง vs ดอกเบี้ยที่จ่ายแล้วจริง)
  // 'lifetime' = Total contract duration (วงเงินกู้ต้นทั้งหมด vs ดอกเบี้ยรวมตลอดสัญญา)
  const [viewMode, setViewMode] = useState<'paid' | 'lifetime'>('paid');
  // 'amount' = Baht (THB)
  // 'percent' = 100% normalized stacked view
  const [displayType, setDisplayType] = useState<'amount' | 'percent'>('amount');

  // Filter active contracts only
  const activeContracts = useMemo(() => {
    return contracts.filter(c => c.status === 'Active' || !c.status);
  }, [contracts]);

  // Compute breakdown metrics for each active contract
  const contractChartData = useMemo(() => {
    return activeContracts.map(contract => {
      const schedule = generateAmortizationSchedule(contract, payments);
      
      // Calculate paid numbers
      let principalPaid = 0;
      let interestPaid = 0;
      let totalPaidMonths = 0;
      
      // Calculate lifetime numbers
      let totalProjectedInterest = 0;
      
      schedule.forEach(row => {
        if (row.isPaid) {
          principalPaid += row.principalPortion;
          interestPaid += row.interestPortion;
          totalPaidMonths += 1;
        }
        totalProjectedInterest += row.interestPortion;
      });

      const totalPaid = principalPaid + interestPaid;
      const lifetimeTotal = contract.loanAmount + totalProjectedInterest;

      // Values based on active viewMode
      const rawPrincipal = viewMode === 'paid' ? principalPaid : contract.loanAmount;
      const rawInterest = viewMode === 'paid' ? interestPaid : totalProjectedInterest;
      const rawTotal = rawPrincipal + rawInterest;

      // In 100% percent mode
      const principalDisplay = displayType === 'percent'
        ? (rawTotal > 0 ? Number(((rawPrincipal / rawTotal) * 100).toFixed(1)) : 0)
        : Math.round(rawPrincipal);

      const interestDisplay = displayType === 'percent'
        ? (rawTotal > 0 ? Number(((rawInterest / rawTotal) * 100).toFixed(1)) : 0)
        : Math.round(rawInterest);

      const principalPct = rawTotal > 0 ? ((rawPrincipal / rawTotal) * 100).toFixed(1) : '0';
      const interestPct = rawTotal > 0 ? ((rawInterest / rawTotal) * 100).toFixed(1) : '0';

      return {
        id: contract.id,
        shortName: contract.nickname.length > 12 ? contract.nickname.substring(0, 11) + '…' : contract.nickname,
        fullName: contract.nickname,
        bankName: contract.bankName,
        totalPaidMonths,
        // Chart numerical values
        principal: principalDisplay,
        interest: interestDisplay,
        // Raw values in Baht for tooltips and summary cards
        rawPrincipal,
        rawInterest,
        rawTotal,
        principalPct,
        interestPct,
        paidToDateTotal: totalPaid,
        lifetimeTotal,
        monthlyInstallment: contract.monthlyInstallment
      };
    });
  }, [activeContracts, payments, viewMode, displayType]);

  // Totals for all active contracts combined
  const overallTotals = useMemo(() => {
    let totalPrin = 0;
    let totalInt = 0;
    contractChartData.forEach(c => {
      totalPrin += c.rawPrincipal;
      totalInt += c.rawInterest;
    });
    const total = totalPrin + totalInt;
    const prinPct = total > 0 ? ((totalPrin / total) * 100).toFixed(1) : '0';
    const intPct = total > 0 ? ((totalInt / total) * 100).toFixed(1) : '0';
    return { totalPrin, totalInt, total, prinPct, intPct };
  }, [contractChartData]);

  if (activeContracts.length === 0) {
    return null;
  }

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#fbfbfa] border border-[#c0b298] p-3.5 rounded-xl shadow-lg text-xs space-y-2 min-w-[240px]">
          <div className="border-b border-[#e6e4d5] pb-1.5 flex items-start justify-between gap-2">
            <div>
              <div className="font-bold text-[#4a3e26] text-sm leading-tight">{data.fullName}</div>
              <div className="text-[11px] text-[#70644e]">{data.bankName}</div>
            </div>
            {data.totalPaidMonths > 0 && viewMode === 'paid' && (
              <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-1.5 py-0.5 rounded-md font-mono shrink-0">
                ผ่อนแล้ว {data.totalPaidMonths} งวด
              </span>
            )}
          </div>

          <div className="space-y-1.5 pt-0.5">
            <div className="flex justify-between items-center text-emerald-800 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block shrink-0" />
                <span>เงินต้น (Principal):</span>
              </span>
              <span className="font-mono font-bold">
                {formatCurrency(data.rawPrincipal)} บ. ({data.principalPct}%)
              </span>
            </div>

            <div className="flex justify-between items-center text-rose-800 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-700 inline-block shrink-0" />
                <span>ดอกเบี้ย (Interest):</span>
              </span>
              <span className="font-mono font-bold">
                {formatCurrency(data.rawInterest)} บ. ({data.interestPct}%)
              </span>
            </div>

            <div className="pt-2 border-t border-[#e6e4d5] flex justify-between items-center text-[#4a3e26] font-bold">
              <span>{viewMode === 'paid' ? 'รวมยอดจ่ายจริงสะสม:' : 'รวมมูลค่าสินเชื่อทั้งหมด:'}</span>
              <span className="font-mono text-sm">{formatCurrency(data.rawTotal)} บ.</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#fbfbfa] border border-[#c0b298]/80 p-2.5 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm space-y-2.5 sm:space-y-6">
      {/* 1. Header & Controls (div:nth-of-type(1)) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#e6e4d5] pb-2 sm:pb-4 gap-2 sm:gap-3">
        {/* Title Block (Shortened on mobile to save space) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#ebdcb2]/50 rounded-lg sm:rounded-xl text-[#7d6840] flex items-center justify-center shrink-0 text-xs sm:text-base">
            📊
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h3 className="text-[12px] sm:text-sm font-bold text-[#4a3e26]">
                <span className="sm:hidden">เงินต้น vs ดอกเบี้ยรายสัญญา</span>
                <span className="hidden sm:inline">สัดส่วนเงินต้น vs ดอกเบี้ย รายสัญญา (Principal vs Interest)</span>
              </h3>
              <span className="text-[9px] sm:text-[10px] font-mono font-bold bg-[#e8ebe0] text-[#70644e] px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-full shrink-0">
                <span className="sm:hidden">{activeContracts.length} สัญญา</span>
                <span className="hidden sm:inline">Stacked Bar · {activeContracts.length} สัญญา</span>
              </span>
            </div>
            <p className="hidden sm:block text-[11px] text-[#70644e] mt-0.5">
              แผนภูมิแท่งซ้อนแสดงการกระจายของเงินต้นและดอกเบี้ยสำหรับทุกสัญญาสินเชื่อที่กำลังผ่อนอยู่
            </p>
          </div>
        </div>

        {/* View Controls & Toggles (Single row & compact text on mobile) */}
        <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-between sm:justify-end shrink-0">
          {/* Mode Switcher: Paid to Date vs Total Lifetime */}
          <div className="inline-flex p-0.5 sm:p-1 bg-[#f4f3ea] border border-[#c0b298]/60 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold shrink-0">
            <button
              onClick={() => setViewMode('paid')}
              className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg transition-all cursor-pointer ${
                viewMode === 'paid'
                  ? 'bg-[#7d6840] text-white shadow-2xs'
                  : 'text-[#70644e] hover:text-[#4a3e26]'
              }`}
              title="แสดงเฉพาะยอดที่จ่ายจริงสะสมจนถึงปัจจุบัน"
            >
              <span className="sm:hidden">จ่ายแล้ว</span>
              <span className="hidden sm:inline">ยอดจ่ายแล้วสะสม</span>
            </button>
            <button
              onClick={() => setViewMode('lifetime')}
              className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg transition-all cursor-pointer ${
                viewMode === 'lifetime'
                  ? 'bg-[#7d6840] text-white shadow-2xs'
                  : 'text-[#70644e] hover:text-[#4a3e26]'
              }`}
              title="แสดงเงินต้นและดอกเบี้ยประมาณการตลอดอายุสัญญาเต็ม"
            >
              <span className="sm:hidden">ตลอดสัญญา</span>
              <span className="hidden sm:inline">ตลอดอายุสัญญา</span>
            </button>
          </div>

          {/* Unit Switcher: Baht vs 100% */}
          <div className="inline-flex p-0.5 sm:p-1 bg-[#f4f3ea] border border-[#c0b298]/60 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold shrink-0">
            <button
              onClick={() => setDisplayType('amount')}
              className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg transition-all cursor-pointer ${
                displayType === 'amount'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'text-[#70644e] hover:text-[#4a3e26]'
              }`}
              title="แสดงหน่วยเป็นจำนวนเงินบาท"
            >
              <span className="sm:hidden">บาท</span>
              <span className="hidden sm:inline">บาท (THB)</span>
            </button>
            <button
              onClick={() => setDisplayType('percent')}
              className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg transition-all cursor-pointer ${
                displayType === 'percent'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'text-[#70644e] hover:text-[#4a3e26]'
              }`}
              title="แสดงเป็นร้อยละสัดส่วน 100%"
            >
              <span className="sm:hidden">100%</span>
              <span className="hidden sm:inline">สัดส่วน 100%</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Aggregate Ratio Bar & Quick Statistics (div:nth-of-type(2)) */}
      <div className="grid grid-cols-3 gap-1 sm:gap-3.5">
        {/* Card 1: ต้นรวม */}
        <div className="bg-[#f2f4ec] border border-[#d6dcbe] p-1.5 sm:p-3.5 rounded-lg sm:rounded-xl flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between gap-1 w-full">
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-900 truncate">
              <span className="sm:hidden">ต้นรวม</span>
              <span className="hidden sm:inline">เงินต้นรวม ({viewMode === 'paid' ? 'ตัดแล้วสะสม' : 'วงเงินกู้ตั้งต้น'})</span>
            </span>
            <span className="text-[9px] sm:text-xs font-bold text-emerald-800 bg-emerald-100/90 px-1 sm:px-2 py-0.2 sm:py-0.5 rounded shrink-0 leading-tight">
              {overallTotals.prinPct}%
            </span>
          </div>
          <div className="text-[11px] sm:text-base font-black text-emerald-950 font-mono tracking-tight truncate mt-0.5 sm:mt-1">
            {formatCurrency(overallTotals.totalPrin)} <span className="text-[8px] sm:text-[10px] font-normal text-emerald-800">บ.</span>
          </div>
        </div>

        {/* Card 2: ดอกรวม */}
        <div className="bg-[#fdf3f4] border border-[#f5d0d4] p-1.5 sm:p-3.5 rounded-lg sm:rounded-xl flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between gap-1 w-full">
            <span className="text-[10px] sm:text-[11px] font-bold text-rose-900 truncate">
              <span className="sm:hidden">ดอกรวม</span>
              <span className="hidden sm:inline">ดอกเบี้ยรวม ({viewMode === 'paid' ? 'จ่ายแล้วสะสม' : 'ประมาณการตลอดสัญญา'})</span>
            </span>
            <span className="text-[9px] sm:text-xs font-bold text-rose-800 bg-rose-100/90 px-1 sm:px-2 py-0.2 sm:py-0.5 rounded shrink-0 leading-tight">
              {overallTotals.intPct}%
            </span>
          </div>
          <div className="text-[11px] sm:text-base font-black text-rose-950 font-mono tracking-tight truncate mt-0.5 sm:mt-1">
            {formatCurrency(overallTotals.totalInt)} <span className="text-[8px] sm:text-[10px] font-normal text-rose-800">บ.</span>
          </div>
        </div>

        {/* Card 3: ยอดรวม */}
        <div className="bg-[#f7f6f0] border border-[#e6e4d5] p-1.5 sm:p-3.5 rounded-lg sm:rounded-xl flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between gap-1 w-full">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#70644e] truncate">
              <span className="sm:hidden">ยอดรวม</span>
              <span className="hidden sm:inline">{viewMode === 'paid' ? 'รวมยอดชำระแล้ว' : 'รวมภาระหนี้'}</span>
            </span>
            <span className="text-[9px] sm:text-[11px] text-[#7d6840] font-bold bg-[#ebdcb2]/50 px-1 sm:px-2 py-0.2 sm:py-0.5 rounded shrink-0 leading-tight">
              100%
            </span>
          </div>
          <div className="text-[11px] sm:text-base font-black text-[#4a3e26] font-mono tracking-tight truncate mt-0.5 sm:mt-1">
            {formatCurrency(overallTotals.total)} <span className="text-[8px] sm:text-[10px] font-normal text-[#70644e]">บ.</span>
          </div>
        </div>
      </div>

      {/* 3. Main Recharts Stacked Bar Chart (div:nth-of-type(3)) */}
      <div className="w-full h-48 sm:h-80 pt-0.5 sm:pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={contractChartData}
            margin={{ top: 6, right: 6, left: -20, bottom: 0 }}
            maxBarSize={30}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e6e4d5" vertical={false} />
            <XAxis
              dataKey="shortName"
              tick={{ fill: '#4a3e26', fontSize: 10, fontWeight: 600 }}
              stroke="#c0b298"
              axisLine={{ stroke: '#c0b298' }}
              tickLine={{ stroke: '#c0b298' }}
              interval={0}
            />
            <YAxis
              tick={{ fill: '#70644e', fontSize: 9 }}
              stroke="#c0b298"
              axisLine={{ stroke: '#c0b298' }}
              tickLine={{ stroke: '#c0b298' }}
              width={30}
              tickFormatter={(value) => {
                if (displayType === 'percent') {
                  return `${value}%`;
                }
                if (value >= 1000000) {
                  return `${(value / 1000000).toFixed(1)}M`;
                }
                if (value >= 1000) {
                  return `${(value / 1000).toFixed(0)}k`;
                }
                return value.toString();
              }}
              domain={displayType === 'percent' ? [0, 100] : ['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(192, 178, 152, 0.15)' }} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={7}
              wrapperStyle={{ paddingBottom: '2px', fontSize: '10px' }}
              formatter={(value) => {
                return (
                  <span className="text-[10px] sm:text-xs font-semibold text-[#4a3e26]">
                    {value === 'principal' ? 'เงินต้น' : 'ดอกเบี้ย'}
                  </span>
                );
              }}
            />
            {/* Stacked Bars: Principal on bottom, Interest on top */}
            <Bar
              dataKey="principal"
              name="principal"
              stackId="principalInterestStack"
              fill="#10b981"
              radius={[0, 0, 2, 2]}
            />
            <Bar
              dataKey="interest"
              name="interest"
              stackId="principalInterestStack"
              fill="#be123c"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Contract Cards Quick Breakdown List */}
      <div className="pt-2 border-t border-[#e6e4d5]">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <span className="text-[11px] sm:text-xs font-bold text-[#4a3e26] uppercase tracking-wider">
            รายละเอียดเปรียบเทียบแต่ละสัญญา
          </span>
          <span className="text-[10px] sm:text-[11px] text-[#70644e]">
            {viewMode === 'paid' ? '* ประวัติผ่อนจริง' : '* ลดต้นลดดอก'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          {contractChartData.map(c => (
            <div
              key={c.id}
              onClick={() => onSelectContract && onSelectContract(c.id)}
              className={`p-2.5 sm:p-3.5 bg-white border border-[#e6e4d5] rounded-lg sm:rounded-xl hover:border-[#c0b298] transition-all space-y-2 ${
                onSelectContract ? 'cursor-pointer hover:shadow-xs group' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-xs text-[#4a3e26] flex items-center gap-1">
                    <span>{c.fullName}</span>
                    {onSelectContract && (
                      <span className="text-[10px] text-[#7d6840] opacity-60 group-hover:opacity-100 transition-opacity">↗️</span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-500">{c.bankName}</div>
                </div>
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  ต้น {c.principalPct}%
                </span>
              </div>

              {/* Progress Bar Stack */}
              <div className="w-full h-1.5 sm:h-2 rounded-full overflow-hidden bg-gray-200 flex">
                <div
                  style={{ width: `${c.principalPct}%` }}
                  className="bg-emerald-600 h-full"
                  title={`เงินต้น: ${c.principalPct}%`}
                />
                <div
                  style={{ width: `${c.interestPct}%` }}
                  className="bg-rose-700 h-full"
                  title={`ดอกเบี้ย: ${c.interestPct}%`}
                />
              </div>

              {/* Quick Details */}
              <div className="space-y-0.5 sm:space-y-1 text-[10px] sm:text-[11px]">
                <div className="flex justify-between items-center text-emerald-800">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                    <span>เงินต้น:</span>
                  </span>
                  <span className="font-mono font-bold">{formatCurrency(c.rawPrincipal)} บ.</span>
                </div>
                <div className="flex justify-between items-center text-rose-800">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-700 inline-block" />
                    <span>ดอกเบี้ย:</span>
                  </span>
                  <span className="font-mono font-bold">{formatCurrency(c.rawInterest)} บ.</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
