"""
Configuration constants for the Stock Analysis Agent
"""

# OpenAI Model Configuration
OPENAI_MODEL = "gpt-4o-mini"

# Investment Configuration
MAX_HISTORICAL_YEARS = 4
DEFAULT_INTERVAL = "3mo"
BENCHMARK_TICKER = "SPY"

# Investment Intervals
INVESTMENT_INTERVALS = [
    "1d", "5d", "7d", "1mo", "3mo", "6mo", "1y", "2y", "3y", "4y", "5y", "single_shot"
]

# Tool Log Messages
TOOL_LOG_MESSAGES = {
    "analyzing_query": "Analyzing user query",
    "gathering_data": "Gathering Stock Data", 
    "calculating_allocation": "Calculating portfolio allocation",
    "allocating_cash": "Allocating cash",
    "extracting_insights": "Extracting Key insights"
}

# Default Cash Amount (can be overridden)
DEFAULT_CASH = 100000
