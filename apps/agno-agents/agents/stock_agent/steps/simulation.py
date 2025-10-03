"""
Simulation Step: Stock data simulation and gathering
"""

import json
import yfinance as yf
from datetime import datetime
from ..config import DEFAULT_INTERVAL, MAX_HISTORICAL_YEARS, TOOL_LOG_MESSAGES
from ..utils import emit_tool_log_start, emit_tool_log_complete, emit_state_update


async def simulation_step(step_input):
    """
    WORKFLOW STEP 2: Stock data simulation and gathering
    This function retrieves historical stock data based on extracted parameters
    """
    # Step 1: Check if previous step generated tool calls
    # If no tool calls, skip this step (no parameters to process)
    if step_input.additional_data["messages"][-1].tool_calls is None:
        return
    
    # Step 2: Initialize tool logging for stock data gathering
    await emit_tool_log_start(
        step_input,
        TOOL_LOG_MESSAGES["gathering_data"]
    )
    
    # Step 3: Parse extracted arguments from previous AI tool call
    # Convert JSON string back to Python dictionary
    arguments = json.loads(step_input.additional_data["messages"][-1].tool_calls[0].function.arguments)
    
    # Step 4: Create investment portfolio structure
    # Build array of ticker-amount pairs from extracted data
    step_input.additional_data["investment_portfolio"] = json.dumps(
        [
            {
                "ticker": ticker,  # Stock symbol
                "amount": arguments["amount_of_dollars_to_be_invested"][index],  # Investment amount
            }
            for index, ticker in enumerate(arguments["ticker_symbols"])
        ]
    )
    
    # Step 5: Update UI with investment portfolio information
    await emit_state_update(
        step_input,
        "/investment_portfolio",
        json.loads(step_input.additional_data["investment_portfolio"])
    )
    
    # Brief pause for UI update
    import asyncio
    await asyncio.sleep(2)
    
    # Step 6: Process investment date and determine data range
    tickers = arguments["ticker_symbols"]  # Extract ticker symbols
    investment_date = arguments["investment_date"]  # Extract investment date
    current_year = datetime.now().year  # Get current year
    
    # Step 7: Validate and adjust investment date if too far in the past
    # Limit historical data to maximum 4 years for performance
    if current_year - int(investment_date[:4]) > MAX_HISTORICAL_YEARS:
        print("investment date is more than 4 years ago")
        investment_date = f"{current_year - MAX_HISTORICAL_YEARS}-01-01"  # Reset to 4 years ago
    
    # Step 8: Determine appropriate historical data period
    if current_year - int(investment_date[:4]) == 0:
        history_period = "1y"  # Current year: use 1 year
    else:
        history_period = f"{current_year - int(investment_date[:4])}y"  # Multi-year period

    # Step 9: Fetch historical stock data using yfinance
    # Download closing prices for specified tickers and date range
    data = yf.download(
        tickers,  # List of stock symbols
        interval=DEFAULT_INTERVAL,  # 3-month intervals for data points
        start=investment_date,  # Start date for data
        end=datetime.today().strftime("%Y-%m-%d"),  # End date (today)
    )
    
    # Step 10: Store retrieved data for next workflow steps
    step_input.additional_data["be_stock_data"] = data["Close"]  # Closing prices only
    step_input.additional_data["be_arguments"] = arguments  # Parsed arguments
    
    # Step 11: Mark data gathering as completed in UI
    await emit_tool_log_complete(step_input)
    
    # Return (no explicit return value needed)
    return
