"use client"

import { PortfolioState, SandBoxPortfolioState } from "@/app/stock-agent/page"
import { Badge } from "@/design-system/atoms/badge"
import { Card } from "@/design-system/atoms/card"

interface PortfolioStateDisplayProps {
  portfolioState: PortfolioState
  sandBoxPortfolio: SandBoxPortfolioState[]
  totalCash: number
  investedAmount: number
}

export function PortfolioStateDisplay({
  portfolioState,
  sandBoxPortfolio,
  totalCash,
  investedAmount
}: PortfolioStateDisplayProps) {
  const availableCash = totalCash - investedAmount
  const currentValue = portfolioState.currentPortfolioValue || 0

  return (
    <div className="space-y-6 p-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-500">Total Cash</div>
          <div className="text-2xl font-bold text-gray-900">
            ${totalCash.toLocaleString()}
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-500">Available Cash</div>
          <div className="text-2xl font-bold text-green-600">
            ${availableCash.toLocaleString()}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-medium text-gray-500">Invested Amount</div>
          <div className="text-2xl font-bold text-blue-600">
            ${investedAmount.toLocaleString()}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-medium text-gray-500">Current Value</div>
          <div className="text-2xl font-bold text-purple-600">
            ${currentValue.toLocaleString()}
          </div>
        </Card>
      </div>

      {/* Total Returns */}
      {portfolioState.totalReturns !== 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-500">Total Returns</div>
            <Badge 
              variant={portfolioState.totalReturns >= 0 ? "default" : "destructive"}
              className={portfolioState.totalReturns >= 0 ? "bg-green-500 hover:bg-green-600" : ""}
            >
              {portfolioState.totalReturns >= 0 ? "+" : ""}
              ${portfolioState.totalReturns.toLocaleString()}
            </Badge>
          </div>
        </Card>
      )}

      {/* Allocations */}
      {portfolioState.allocations.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Allocations</h3>
          <div className="space-y-3">
            {portfolioState.allocations.map((allocation, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{allocation.ticker}</div>
                  <div className="text-sm text-gray-500">
                    {allocation.allocation.toFixed(2)}% allocation
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    ${allocation.currentValue.toLocaleString()}
                  </div>
                  <div className={`text-sm ${allocation.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {allocation.totalReturn >= 0 ? "+" : ""}{allocation.totalReturn.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Returns Data */}
      {portfolioState.returnsData.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Returns by Stock</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {portfolioState.returnsData.map((returnData, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg text-center">
                <div className="font-semibold text-gray-900">{returnData.ticker}</div>
                <div className={`text-lg font-bold ${returnData.return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {returnData.return >= 0 ? "+" : ""}{returnData.return.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Bull Insights */}
      {portfolioState.bullInsights.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>📈</span> Bull Insights
          </h3>
          <div className="space-y-3">
            {portfolioState.bullInsights.map((insight, index) => (
              <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{insight.emoji}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{insight.title}</div>
                    <div className="text-sm text-gray-600 mt-1">{insight.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Bear Insights */}
      {portfolioState.bearInsights.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>📉</span> Bear Insights
          </h3>
          <div className="space-y-3">
            {portfolioState.bearInsights.map((insight, index) => (
              <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{insight.emoji}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{insight.title}</div>
                    <div className="text-sm text-gray-600 mt-1">{insight.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Performance Data */}
      {portfolioState.performanceData.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-gray-900">Date</th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-900">Portfolio</th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-900">SPY</th>
                </tr>
              </thead>
              <tbody>
                {portfolioState.performanceData.map((data, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2 px-3 text-gray-700">{data.date}</td>
                    <td className="py-2 px-3 text-right font-medium text-gray-900">
                      ${data.portfolio.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-gray-900">
                      ${data.spy.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Sandbox Portfolios */}
      {sandBoxPortfolio.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Sandbox Portfolios ({sandBoxPortfolio.length})
          </h3>
          <div className="space-y-4">
            {sandBoxPortfolio.map((sandbox, index) => (
              <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="font-semibold text-gray-900 mb-2">Sandbox #{index + 1}</div>
                <div className="text-sm text-gray-600">
                  {sandbox.performanceData.length} data points
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Debug: Raw State */}
      <details className="mt-6">
        <summary className="cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-700">
          Debug: View Raw State
        </summary>
        <Card className="mt-2 p-4">
          <pre className="text-xs overflow-auto bg-gray-50 p-4 rounded">
            {JSON.stringify({ portfolioState, sandBoxPortfolio, totalCash, investedAmount }, null, 2)}
          </pre>
        </Card>
      </details>
    </div>
  )
}

