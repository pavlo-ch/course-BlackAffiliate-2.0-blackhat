'use client';

import { useState, useMemo } from 'react';
import { Calculator, BarChart3 } from 'lucide-react';

interface CalculatedMetrics {
  cpcMin: number;
  cpcMid: number;
  cpcMax: number;
  cpiMin: number;
  cpiMid: number;
  cpiMax: number;
  cprMin: number;
  cprMid: number;
  cprMax: number;
  cpaMin: number;
  cpaMax: number;
  cpcRatioMin: number;
  cpcRatioMid: number;
  cpcRatioMax: number;
  cpiRatioMin: number;
  cpiRatioMid: number;
  cpiRatioMax: number;
  cprRatioMin: number;
  cprRatioMid: number;
  cprRatioMax: number;
  clickToInstallRateMin: number;
  clickToInstallRateMid: number;
  clickToInstallRateMax: number;
  clickToInstallRatioMin: number;
  clickToInstallRatioMid: number;
  clickToInstallRatioMax: number;
  installToRegistrationRateMin: number;
  installToRegistrationRateMid: number;
  installToRegistrationRateMax: number;
  installToRegistrationRatioMin: number;
  installToRegistrationRatioMid: number;
  installToRegistrationRatioMax: number;
  registrationToDepositRateMin: number;
  registrationToDepositRateMid: number;
  registrationToDepositRateMax: number;
  registrationToDepositRatioMin: number;
  registrationToDepositRatioMid: number;
  registrationToDepositRatioMax: number;
  clickToDepositRateMin: number;
  clickToDepositRateMid: number;
  clickToDepositRateMax: number;
  clickToDepositRatioMin: number;
  clickToDepositRatioMid: number;
  clickToDepositRatioMax: number;
  roi: number;
}

const ratioRanges = {
  cpc: { min: 30, max: 50 },
  cpi: { min: 8, max: 12 },
  cpr: { min: 4, max: 6 },
};

export default function FacebookAdsCalculator() {
  const [payout, setPayout] = useState<number>(187.0);
  const [roi, setRoi] = useState<number>(10);

  const formatCurrency = (value: number): string => {
    return `$${value.toFixed(2)}`;
  };

  const calculateMetrics = useMemo((): CalculatedMetrics => {
    const cpaDivisor = 1 + (roi / 100);
    const cpa = payout / cpaDivisor;

    const cpcMin = cpa / ratioRanges.cpc.max;
    const cpcMid = cpa / 40;
    const cpcMax = cpa / ratioRanges.cpc.min;
    const cpiMin = cpa / ratioRanges.cpi.max;
    const cpiMid = cpa / 10;
    const cpiMax = cpa / ratioRanges.cpi.min;
    const cprMin = cpa / ratioRanges.cpr.max;
    const cprMid = cpa / 5;
    const cprMax = cpa / ratioRanges.cpr.min;

    const cpcRatioMin = ratioRanges.cpc.min;
    const cpcRatioMid = 40;
    const cpcRatioMax = ratioRanges.cpc.max;
    const cpiRatioMin = ratioRanges.cpi.min;
    const cpiRatioMid = 10;
    const cpiRatioMax = ratioRanges.cpi.max;
    const cprRatioMin = ratioRanges.cpr.min;
    const cprRatioMid = 5;
    const cprRatioMax = ratioRanges.cpr.max;

    const clickToInstallRateMin = (cpiRatioMax / cpcRatioMax) * 100;
    const clickToInstallRateMid = (cpiRatioMid / cpcRatioMid) * 100;
    const clickToInstallRateMax = (cpiRatioMin / cpcRatioMin) * 100;
    const clickToInstallRatioMin = cpcRatioMax / cpiRatioMax;
    const clickToInstallRatioMid = cpcRatioMid / cpiRatioMid;
    const clickToInstallRatioMax = cpcRatioMin / cpiRatioMin;

    const installToRegistrationRateMin = (cprRatioMax / cpiRatioMax) * 100;
    const installToRegistrationRateMid = (cprRatioMid / cpiRatioMid) * 100;
    const installToRegistrationRateMax = (cprRatioMin / cpiRatioMin) * 100;
    const installToRegistrationRatioMin = cpiRatioMax / cprRatioMax;
    const installToRegistrationRatioMid = cpiRatioMid / cprRatioMid;
    const installToRegistrationRatioMax = cpiRatioMin / cprRatioMin;

    const registrationToDepositRateMin = (1 / cprRatioMax) * 100;
    const registrationToDepositRateMid = (1 / cprRatioMid) * 100;
    const registrationToDepositRateMax = (1 / cprRatioMin) * 100;
    const registrationToDepositRatioMin = cprRatioMax;
    const registrationToDepositRatioMid = cprRatioMid;
    const registrationToDepositRatioMax = cprRatioMin;

    const clickToDepositRateMin = (1 / cpcRatioMax) * 100;
    const clickToDepositRateMid = (1 / cpcRatioMid) * 100;
    const clickToDepositRateMax = (1 / cpcRatioMin) * 100;
    const clickToDepositRatioMin = cpcRatioMax;
    const clickToDepositRatioMid = cpcRatioMid;
    const clickToDepositRatioMax = cpcRatioMin;

    return {
      cpcMin,
      cpcMid,
      cpcMax,
      cpiMin,
      cpiMid,
      cpiMax,
      cprMin,
      cprMid,
      cprMax,
      cpaMin: cpa,
      cpaMax: cpa,
      cpcRatioMin,
      cpcRatioMid,
      cpcRatioMax,
      cpiRatioMin,
      cpiRatioMid,
      cpiRatioMax,
      cprRatioMin,
      cprRatioMid,
      cprRatioMax,
      clickToInstallRateMin,
      clickToInstallRateMid,
      clickToInstallRateMax,
      clickToInstallRatioMin,
      clickToInstallRatioMid,
      clickToInstallRatioMax,
      installToRegistrationRateMin,
      installToRegistrationRateMid,
      installToRegistrationRateMax,
      installToRegistrationRatioMin,
      installToRegistrationRatioMid,
      installToRegistrationRatioMax,
      registrationToDepositRateMin,
      registrationToDepositRateMid,
      registrationToDepositRateMax,
      registrationToDepositRatioMin,
      registrationToDepositRatioMid,
      registrationToDepositRatioMax,
      clickToDepositRateMin,
      clickToDepositRateMid,
      clickToDepositRateMax,
      clickToDepositRatioMin,
      clickToDepositRatioMid,
      clickToDepositRatioMax,
      roi,
    };
  }, [payout, roi]);

  const formatPercent = (value: number): string => {
    const rounded = Number(value.toFixed(2));
    return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(2)}%`;
  };

  const formatRatio = (value: number): string => {
    return `${Math.round(value)}:1`;
  };

  return (
    <div className="space-y-8">
      <div className="bg-[#0f1012] border border-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calculator className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">INPUT PARAMETERS</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="payout" className="block text-sm font-medium text-gray-300 mb-2">
              Payout (per FTD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
              <input
                id="payout"
                type="number"
                step="0.01"
                min="0"
                value={payout}
                onChange={(e) => setPayout(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-2 bg-black border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>
          <div>
            <label htmlFor="roi" className="block text-sm font-medium text-gray-300 mb-2">
              ROI (%)
            </label>
            <div className="relative">
              <input
                id="roi"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={roi}
                onChange={(e) => setRoi(parseFloat(e.target.value) || 0)}
                className="w-full pl-4 pr-8 py-2 bg-black border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="10"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0f1012] border border-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">CALCULATED METRICS</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Metric</th>
                <th className="text-center py-4 px-4 text-sm font-medium text-gray-400 border-x border-gray-700">Minimum</th>
                <th className="text-center py-4 px-4 text-sm font-medium text-gray-400 border-r border-gray-700">Middle</th>
                <th className="text-center py-4 px-4 text-sm font-medium text-gray-400">Maximum</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-800 hover:bg-gray-900/50 transition-colors">
                <td className="py-4 px-4 text-sm text-gray-300 font-medium">
                  CPC (Cost per Click)
                  <div className="text-xs text-gray-500 font-normal mt-1">Price per click on your ad</div>
                </td>
                <td className="py-4 px-4 text-center border-x border-gray-700">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-white font-medium">{formatCurrency(calculateMetrics.cpcMin)}</span>
                    <span className="text-xs text-gray-500">Ratio {calculateMetrics.cpcRatioMax}:1</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center border-r border-gray-700">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-white font-medium">{formatCurrency(calculateMetrics.cpcMid)}</span>
                    <span className="text-xs text-gray-500">Ratio {calculateMetrics.cpcRatioMid}:1</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-white font-medium">{formatCurrency(calculateMetrics.cpcMax)}</span>
                    <span className="text-xs text-gray-500">Ratio {calculateMetrics.cpcRatioMin}:1</span>
                  </div>
                </td>
              </tr>
              <tr className="border-b border-gray-800 hover:bg-gray-900/50 transition-colors">
                <td className="py-4 px-4 text-sm text-gray-300 font-medium">
                  CPI (Cost per Install)
                  <div className="text-xs text-gray-500 font-normal mt-1">Price per app installation</div>
                </td>
                <td className="py-4 px-4 text-center border-x border-gray-700">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-white font-medium">{formatCurrency(calculateMetrics.cpiMin)}</span>
                    <span className="text-xs text-gray-500">Ratio {calculateMetrics.cpiRatioMax}:1</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center border-r border-gray-700">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-white font-medium">{formatCurrency(calculateMetrics.cpiMid)}</span>
                    <span className="text-xs text-gray-500">Ratio {calculateMetrics.cpiRatioMid}:1</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-white font-medium">{formatCurrency(calculateMetrics.cpiMax)}</span>
                    <span className="text-xs text-gray-500">Ratio {calculateMetrics.cpiRatioMin}:1</span>
                  </div>
                </td>
              </tr>
              <tr className="border-b border-gray-800 hover:bg-gray-900/50 transition-colors">
                <td className="py-4 px-4 text-sm text-gray-300 font-medium">
                  CPR (Cost per Registration)
                  <div className="text-xs text-gray-500 font-normal mt-1">Price per user registration</div>
                </td>
                <td className="py-4 px-4 text-center border-x border-gray-700">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-white font-medium">{formatCurrency(calculateMetrics.cprMin)}</span>
                    <span className="text-xs text-gray-500">Ratio {calculateMetrics.cprRatioMax}:1</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center border-r border-gray-700">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-white font-medium">{formatCurrency(calculateMetrics.cprMid)}</span>
                    <span className="text-xs text-gray-500">Ratio {calculateMetrics.cprRatioMid}:1</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-white font-medium">{formatCurrency(calculateMetrics.cprMax)}</span>
                    <span className="text-xs text-gray-500">Ratio {calculateMetrics.cprRatioMin}:1</span>
                  </div>
                </td>
              </tr>
              <tr className="border-b border-gray-800 hover:bg-blue-900/20 transition-colors bg-blue-900/10">
                <td className="py-4 px-4 text-sm text-blue-200 font-medium">
                  CPA (Cost per Acquisition)
                  <div className="text-xs text-blue-400 font-normal mt-1">Final cost per deposit</div>
                </td>
                <td colSpan={3} className="py-4 px-4">
                  <div className="text-center">
                    <span className="text-blue-300 font-medium">{formatCurrency(calculateMetrics.cpaMin)}</span>
                  </div>
                </td>
              </tr>
              <tr className="border-b border-gray-800 hover:bg-gray-900/50 transition-colors">
                <td className="py-4 px-4 text-sm text-gray-300 font-medium">
                  Click → Install
                  <div className="text-xs text-gray-500 font-normal mt-1">Conversion rate from clicks to installs</div>
                </td>
                <td className="py-4 px-4 text-center border-x border-gray-700">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-white font-medium">{formatPercent(calculateMetrics.clickToInstallRateMin)}</span>
                    <span className="text-xs text-gray-500">Ratio {formatRatio(calculateMetrics.clickToInstallRatioMin)}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center border-r border-gray-700">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-white font-medium">{formatPercent(calculateMetrics.clickToInstallRateMid)}</span>
                    <span className="text-xs text-gray-500">Ratio {formatRatio(calculateMetrics.clickToInstallRatioMid)}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-white font-medium">{formatPercent(calculateMetrics.clickToInstallRateMax)}</span>
                    <span className="text-xs text-gray-500">Ratio {formatRatio(calculateMetrics.clickToInstallRatioMax)}</span>
                  </div>
                </td>
              </tr>
              <tr className="border-b border-gray-800 hover:bg-gray-900/50 transition-colors">
                <td className="py-4 px-4 text-sm text-gray-300 font-medium">
                  Install → Registration
                  <div className="text-xs text-gray-500 font-normal mt-1">Conversion rate from installs to registrations</div>
                </td>
                <td className="py-4 px-4 text-center border-x border-gray-700">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-white font-medium">{formatPercent(calculateMetrics.installToRegistrationRateMin)}</span>
                    <span className="text-xs text-gray-500">Ratio {formatRatio(calculateMetrics.installToRegistrationRatioMin)}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center border-r border-gray-700">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-white font-medium">{formatPercent(calculateMetrics.installToRegistrationRateMid)}</span>
                    <span className="text-xs text-gray-500">Ratio {formatRatio(calculateMetrics.installToRegistrationRatioMid)}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-white font-medium">{formatPercent(calculateMetrics.installToRegistrationRateMax)}</span>
                    <span className="text-xs text-gray-500">Ratio {formatRatio(calculateMetrics.installToRegistrationRatioMax)}</span>
                  </div>
                </td>
              </tr>
              <tr className="border-b border-gray-800 hover:bg-gray-900/50 transition-colors">
                <td className="py-4 px-4 text-sm text-gray-300 font-medium">
                  Registration → Deposit
                  <div className="text-xs text-gray-500 font-normal mt-1">Conversion rate from registrations to deposits</div>
                </td>
                <td className="py-4 px-4 text-center border-x border-gray-700">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-white font-medium">{formatPercent(calculateMetrics.registrationToDepositRateMin)}</span>
                    <span className="text-xs text-gray-500">Ratio {formatRatio(calculateMetrics.registrationToDepositRatioMin)}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center border-r border-gray-700">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-white font-medium">{formatPercent(calculateMetrics.registrationToDepositRateMid)}</span>
                    <span className="text-xs text-gray-500">Ratio {formatRatio(calculateMetrics.registrationToDepositRatioMid)}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-white font-medium">{formatPercent(calculateMetrics.registrationToDepositRateMax)}</span>
                    <span className="text-xs text-gray-500">Ratio {formatRatio(calculateMetrics.registrationToDepositRatioMax)}</span>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-gray-900/50 transition-colors">
                <td className="py-4 px-4 text-sm text-gray-300 font-medium">
                  Click → Deposit (Overall CR)
                  <div className="text-xs text-gray-500 font-normal mt-1">Overall conversion rate from clicks to deposits</div>
                </td>
                <td className="py-4 px-4 text-center border-x border-gray-700">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-white font-medium">{formatPercent(calculateMetrics.clickToDepositRateMin)}</span>
                    <span className="text-xs text-gray-500">Ratio {formatRatio(calculateMetrics.clickToDepositRatioMin)}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center border-r border-gray-700">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-white font-medium">{formatPercent(calculateMetrics.clickToDepositRateMid)}</span>
                    <span className="text-xs text-gray-500">Ratio {formatRatio(calculateMetrics.clickToDepositRatioMid)}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-white font-medium">{formatPercent(calculateMetrics.clickToDepositRateMax)}</span>
                    <span className="text-xs text-gray-500">Ratio {formatRatio(calculateMetrics.clickToDepositRatioMax)}</span>
                  </div>
                </td>
              </tr> 
            </tbody>
          </table>

          <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4 mt-6">
            <p className="text-sm text-gray-300 leading-relaxed mb-3">
              <span className="font-semibold text-blue-400">Note:</span> With the same CPA and ROI, you may have different costs for clicks, installs, and registrations. This depends on <span className="font-medium">Facebook optimization</span> (targeting, creatives, bidding strategy) and <span className="font-medium">funnel performance</span> (conversion rates between stages). Better optimization can improve click-to-install and install-to-registration ratios, reducing costs at each stage while maintaining the same final CPA.
            </p>
            <div className="text-xs text-gray-400 space-y-1 pt-2 border-t border-blue-600/30">
              <p><span className="font-semibold">Ratio (X:1)</span> means how many clicks/installs/registrations you need to get 1 deposit. Lower ratio = better performance.</p>
              <p><span className="font-semibold">Minimum/Middle/Maximum</span> represent different optimization scenarios - from best case (minimum costs) to worst case (maximum costs) performance.</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

