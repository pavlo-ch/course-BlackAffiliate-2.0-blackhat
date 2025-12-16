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
    const cpcMin = payout / ratioRanges.cpc.max;
    const cpcMid = payout / 40;
    const cpcMax = payout / ratioRanges.cpc.min;
    const cpiMin = payout / ratioRanges.cpi.max;
    const cpiMid = payout / 10;
    const cpiMax = payout / ratioRanges.cpi.min;
    const cprMin = payout / ratioRanges.cpr.max;
    const cprMid = payout / 5;
    const cprMax = payout / ratioRanges.cpr.min;
    
    const cpaDivisor = 1 + (roi / 100);
    const cpa = payout / cpaDivisor;

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
      cpcRatioMin: ratioRanges.cpc.min,
      cpcRatioMid: 40,
      cpcRatioMax: ratioRanges.cpc.max,
      cpiRatioMin: ratioRanges.cpi.min,
      cpiRatioMid: 10,
      cpiRatioMax: ratioRanges.cpi.max,
      cprRatioMin: ratioRanges.cpr.min,
      cprRatioMid: 5,
      cprRatioMax: ratioRanges.cpr.max,
      roi,
    };
  }, [payout, roi]);

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

        <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-300 leading-relaxed mb-3">
            <span className="font-semibold text-blue-400">Note:</span> With the same CPA and ROI, you may have different costs for clicks, installs, and registrations. This depends on <span className="font-medium">Facebook optimization</span> (targeting, creatives, bidding strategy) and <span className="font-medium">funnel performance</span> (conversion rates between stages). Better optimization can improve click-to-install and install-to-registration ratios, reducing costs at each stage while maintaining the same final CPA.
          </p>
          <div className="text-xs text-gray-400 space-y-1 pt-2 border-t border-blue-600/30">
            <p><span className="font-semibold">Ratio (X:1)</span> means how many clicks/installs/registrations you need to get 1 deposit. Lower ratio = better performance.</p>
            <p><span className="font-semibold">Minimum/Middle/Maximum</span> represent different optimization scenarios - from best case (minimum costs) to worst case (maximum costs) performance.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Metric</th>
                <th className="text-center py-4 px-4 text-sm font-medium text-gray-400">Minimum</th>
                <th className="text-center py-4 px-4 text-sm font-medium text-gray-400">Middle</th>
                <th className="text-center py-4 px-4 text-sm font-medium text-gray-400">Maximum</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-800 hover:bg-gray-900/50 transition-colors">
                <td className="py-4 px-4 text-sm text-gray-300 font-medium">
                  CPC (Cost per Click)
                  <div className="text-xs text-gray-500 font-normal mt-1">Price per click on your ad</div>
                </td>
                <td className="py-4 px-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-white font-medium">{formatCurrency(calculateMetrics.cpcMin)}</span>
                    <span className="text-xs text-gray-500">Ratio {calculateMetrics.cpcRatioMax}:1</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
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
                <td className="py-4 px-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-white font-medium">{formatCurrency(calculateMetrics.cpiMin)}</span>
                    <span className="text-xs text-gray-500">Ratio {calculateMetrics.cpiRatioMax}:1</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
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
                <td className="py-4 px-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-white font-medium">{formatCurrency(calculateMetrics.cprMin)}</span>
                    <span className="text-xs text-gray-500">Ratio {calculateMetrics.cprRatioMax}:1</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
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
              <tr className="border-b border-gray-800 hover:bg-gray-900/50 transition-colors">
                <td className="py-4 px-4 text-sm text-gray-300 font-medium">
                  CPA (Cost per Acquisition)
                  <div className="text-xs text-gray-500 font-normal mt-1">Final cost per deposit</div>
                </td>
                <td colSpan={3} className="py-4 px-4">
                  <div className="text-center">
                    <span className="text-white font-medium">{formatCurrency(calculateMetrics.cpaMin)}</span>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-gray-900/50 transition-colors">
                <td className="py-4 px-4 text-sm text-gray-300 font-medium">
                  ROI (Return on Investment)
                  <div className="text-xs text-gray-500 font-normal mt-1">Profit percentage</div>
                </td>
                <td colSpan={3} className="py-4 px-4">
                  <div className="text-center">
                    <span className={`font-medium ${
                      calculateMetrics.roi >= 50 ? 'text-green-400' : calculateMetrics.roi >= 25 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {calculateMetrics.roi}%
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

