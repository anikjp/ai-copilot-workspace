"use client"

import { PortfolioStateDisplay } from "@/components/stock-agent/portfolio-state-display"
import { AllocationTableComponent } from "@/design-system/molecules/chart-components/allocation-table"
import { BarChartComponent } from "@/design-system/molecules/chart-components/bar-chart"
import { LineChartComponent } from "@/design-system/molecules/chart-components/line-chart"
import { GenerativeCanvas } from "@/design-system/organisms/generative-canvas"
import { INVESTMENT_SUGGESTION_PROMPT } from "@/utils/prompts"
import { useCoAgent, useCoAgentStateRender, useCopilotAction, useCopilotReadable } from "@copilotkit/react-core"
import { useCopilotChatSuggestions } from "@copilotkit/react-ui"
import { useEffect, useState } from "react"

export interface PortfolioState {
  id: string
  trigger: string
  investmentAmount?: number
  currentPortfolioValue?: number
  performanceData: Array<{
    date: string
    portfolio: number
    spy: number
  }>
  allocations: Array<{
    ticker: string
    allocation: number
    currentValue: number
    totalReturn: number
  }>
  returnsData: Array<{
    ticker: string
    return: number
  }>
  bullInsights: Array<{
    title: string
    description: string
    emoji: string
  }>
  bearInsights: Array<{
    title: string
    description: string
    emoji: string
  }>
  totalReturns: number
}

export interface SandBoxPortfolioState {
  performanceData: Array<{
    date: string
    portfolio: number
    spy: number
  }>
}
export interface InvestmentPortfolio {
  ticker: string
  amount: number
}


export default function StockAgentPage() {
  const [currentState, setCurrentState] = useState<PortfolioState>({
    id: "",
    trigger: "",
    performanceData: [],
    allocations: [],
    returnsData: [],
    bullInsights: [],
    bearInsights: [],
    currentPortfolioValue: 0,
    totalReturns: 0
  })
  const [sandBoxPortfolio, setSandBoxPortfolio] = useState<SandBoxPortfolioState[]>([])
  const [selectedStock, setSelectedStock] = useState<string | null>(null)
  const [totalCash, setTotalCash] = useState(1000000)
  const [investedAmount, setInvestedAmount] = useState(0)

  const { state, setState } = useCoAgent({
    name: "agnoAgent",
    initialState: {
      available_cash: totalCash,
      investment_summary: {} as any,
      investment_portfolio: [] as InvestmentPortfolio[]
    }
  })

  // Ensure state syncs with totalCash
  useEffect(() => {
    if (state.available_cash !== totalCash) {
      setState({
        ...state,
        available_cash: totalCash
      })
    }
  }, [totalCash])

  // useCopilotAction({
  //   name: "*",
  //   description: "This is a catch all action for the agent. It will be used to render the agent's response.",
  //   render: (args: any) => {
  //     function respond(arg0: string) {
  //       throw new Error("Function not implemented.")
  //     }

  //     return (
  //       <>
  //         <div className="flex flex-col gap-4">
  //           <div className="text-sm text-gray-500">
  //             {JSON.stringify(args)}
  //           </div>
  //           <button onClick={() => {
  //             respond?.("Data rendered successfully. Provide summary of the investments by not making any tool calls")
  //           }}>
  //             Accept
  //           </button>     
  //           <button onClick={() => {
  //             respond?.("Data rendered rejected. Just give a summary of the rejected investments by not making any tool calls")
  //           }}>
  //             Reject
  //           </button>
  //         </div>
  //       </>
  //     )
  //   }
  // })

  useCoAgentStateRender({
    name: "agnoAgent",
    render: ({state}) => {
      const logs = state.tool_logs || [];
      if (logs.length === 0) return null;
      
      return (
        <div className="flex flex-col gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
            Agent Progress
          </div>
          <div className="flex flex-col gap-1.5">
            {logs.map((log: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {log.status === 'completed' ? (
                  <span className="text-green-600 font-bold text-base">✓</span>
                ) : log.status === 'processing' ? (
                  <span className="text-blue-600 animate-pulse text-base">⋯</span>
                ) : (
                  <span className="text-gray-400 text-base">○</span>
                )}
                <span className={`${
                  log.status === 'completed' ? 'text-green-700' : 
                  log.status === 'processing' ? 'text-blue-700 font-medium' : 
                  'text-gray-600'
                }`}>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    }
  })


  useCopilotAction({
    name: "changeBackgroundColour",
    description: "This is an action to change the background colour of the canvas.",
    render: (args: any) => {
      return (
        <>
          <div className="flex flex-col gap-4">
            <div className="text-sm text-gray-500">
              {JSON.stringify(args)}
            </div>
          </div>
        </>
      )
    }
  })

  useCopilotAction({
    name: "render_standard_charts_and_table",
    description: "This is an action to render a standard chart and table. The chart can be a bar chart or a line chart. The table can be a table of data.",
    renderAndWaitForResponse: ({ args, respond, status }) => {
      return (
        <>
          {(args?.investment_summary?.percent_allocation_per_stock && args?.investment_summary?.percent_return_per_stock && args?.investment_summary?.performanceData) &&
            <>
              <div className="flex flex-col gap-4">
                <LineChartComponent data={args?.investment_summary?.performanceData} size="small" />
                <BarChartComponent data={Object.entries(args?.investment_summary?.percent_return_per_stock).map(([ticker, return1]) => ({
                  ticker,
                  return: return1 as number
                }))} size="small" />
                <AllocationTableComponent allocations={Object.entries(args?.investment_summary?.percent_allocation_per_stock).map(([ticker, allocation]) => ({
                  ticker,
                  allocation: allocation as number,
                  currentValue: args?.investment_summary.final_prices[ticker] * args?.investment_summary.holdings[ticker],
                  totalReturn: args?.investment_summary.percent_return_per_stock[ticker]
                }))} size="small" />

                {/* Display Bull and Bear Insights */}
                {(args?.insights?.bullInsights || args?.insights?.bearInsights) && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {/* Bull Insights */}
                    {args?.insights?.bullInsights && args.insights.bullInsights.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-green-700 mb-3 flex items-center gap-2">
                          📈 Bull Case
                        </h3>
                        <div className="flex flex-col gap-3">
                          {args.insights.bullInsights.map((insight: any, i: number) => (
                            <div key={i} className="bg-white rounded-md p-3 border border-green-100">
                              <div className="flex items-start gap-2">
                                <span className="text-2xl">{insight.emoji}</span>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-green-800 text-sm">{insight.title}</h4>
                                  <p className="text-xs text-green-700 mt-1">{insight.description}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bear Insights */}
                    {args?.insights?.bearInsights && args.insights.bearInsights.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-red-700 mb-3 flex items-center gap-2">
                          📉 Bear Case
                        </h3>
                        <div className="flex flex-col gap-3">
                          {args.insights.bearInsights.map((insight: any, i: number) => (
                            <div key={i} className="bg-white rounded-md p-3 border border-red-100">
                              <div className="flex items-start gap-2">
                                <span className="text-2xl">{insight.emoji}</span>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-red-800 text-sm">{insight.title}</h4>
                                  <p className="text-xs text-red-700 mt-1">{insight.description}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button hidden={status == "complete"}
                className="mt-4 rounded-full px-6 py-2 bg-green-50 text-green-700 border border-green-200 shadow-sm hover:bg-green-100 transition-colors font-semibold text-sm"
                onClick={() => {
                  if (respond) {
                    setTotalCash(args?.investment_summary?.cash)
                    setCurrentState({
                      ...currentState,
                      returnsData: Object.entries(args?.investment_summary?.percent_return_per_stock).map(([ticker, return1]) => ({
                        ticker,
                        return: return1 as number
                      })),
                      allocations: Object.entries(args?.investment_summary?.percent_allocation_per_stock).map(([ticker, allocation]) => ({
                        ticker,
                        allocation: allocation as number,
                        currentValue: args?.investment_summary?.final_prices[ticker] * args?.investment_summary?.holdings[ticker],
                        totalReturn: args?.investment_summary?.percent_return_per_stock[ticker]
                      })),
                      performanceData: args?.investment_summary?.performanceData,
                      bullInsights: args?.insights?.bullInsights || [],
                      bearInsights: args?.insights?.bearInsights || [],
                      currentPortfolioValue: args?.investment_summary?.total_value,
                      totalReturns: (Object.values(args?.investment_summary?.returns) as number[])
                        .reduce((acc, val) => acc + val, 0)
                    })
                    setInvestedAmount(
                      (Object.values(args?.investment_summary?.total_invested_per_stock) as number[])
                        .reduce((acc, val) => acc + val, 0)
                    )
                    setState({
                      ...state,
                      available_cash: args?.investment_summary?.cash,
                    })
                    respond("Data rendered successfully. Provide a summary of the investments by not making any tool calls.");
                  }
                }}
              >
                Accept (render_standard_charts_and_table)
              </button>
              <button hidden={status == "complete"}
                className="rounded-full px-6 py-2 bg-red-50 text-red-700 border border-red-200 shadow-sm hover:bg-red-100 transition-colors font-semibold text-sm ml-2"
                onClick={() => {
                  if (respond) {
                    respond("Data rendering rejected. Just give a summary of the rejected investments by not making any tool calls.");
                  }
                }}
              >
                Reject
              </button>
            </>
          }

        </>

      )
    }
  })

  useCopilotAction({
    name: "render_custom_charts",
    renderAndWaitForResponse: ({ args, respond, status }) => {
      return (
        <>
          <LineChartComponent data={args?.investment_summary?.performanceData} size="small" />
          <button hidden={status == "complete"}
            className="mt-4 rounded-full px-6 py-2 bg-green-50 text-green-700 border border-green-200 shadow-sm hover:bg-green-100 transition-colors font-semibold text-sm"
            onClick={() => {
              if (respond) {
                setSandBoxPortfolio([...sandBoxPortfolio, {
                  performanceData: args?.investment_summary?.performanceData.map((item: any) => ({
                    date: item.date,
                    portfolio: item.portfolio,
                    spy: 0
                  })) || []
                }])
                respond("Data rendered successfully. Provide summary of the investments")
              }
            }}
          >
            Accept(render_custom_charts)
          </button>
          <button hidden={status == "complete"}
            className="rounded-full px-6 py-2 bg-red-50 text-red-700 border border-red-200 shadow-sm hover:bg-red-100 transition-colors font-semibold text-sm ml-2"
            onClick={() => {
              if (respond) {
                respond("Data rendering rejected. Just give a summary of the rejected investments")
              }
            }}
          >
            Reject
          </button>
        </>
      )
    }
  })

  useCopilotReadable({
    description: "This is the current state of the portfolio",
    value: JSON.stringify(state.investment_portfolio)
  })

  useCopilotChatSuggestions({
    available: selectedStock ? "disabled" : "enabled",
    instructions: INVESTMENT_SUGGESTION_PROMPT,
  },
    [selectedStock])

  // const toggleComponentTree = () => {
  //   setShowComponentTree(!showComponentTree)
  // }

  // const availableCash = totalCash - investedAmount
  // const currentPortfolioValue = currentState.currentPortfolioValue || investedAmount


  useEffect(() => {
    getBenchmarkData()
  }, [])

  function getBenchmarkData() {
    let result: PortfolioState = {
      id: "aapl-nvda",
      trigger: "apple nvidia",
      performanceData: [
        { date: "Jan 2023", portfolio: 10000, spy: 10000 },
        { date: "Mar 2023", portfolio: 10200, spy: 10200 },
        { date: "Jun 2023", portfolio: 11000, spy: 11000 },
        { date: "Sep 2023", portfolio: 10800, spy: 10800 },
        { date: "Dec 2023", portfolio: 11500, spy: 11500 },
        { date: "Mar 2024", portfolio: 12200, spy: 12200 },
        { date: "Jun 2024", portfolio: 12800, spy: 12800 },
        { date: "Sep 2024", portfolio: 13100, spy: 13100 },
        { date: "Dec 2024", portfolio: 13600, spy: 13600 },
      ],
      allocations: [],
      returnsData: [],
      bullInsights: [],
      bearInsights: [],
      totalReturns: 0,
      currentPortfolioValue: totalCash
    }
    setCurrentState(result)
  }



  return (
    <GenerativeCanvas title="Portfolio Dashboard">
      <PortfolioStateDisplay
        portfolioState={currentState}
        sandBoxPortfolio={sandBoxPortfolio}
        totalCash={totalCash}
        investedAmount={investedAmount}
      />
    </GenerativeCanvas>
  )
}
