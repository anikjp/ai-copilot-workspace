"""
Allocation Step: Cash allocation and portfolio simulation
"""

import json
import numpy as np
import pandas as pd
import yfinance as yf
from ag_ui.core import AssistantMessage, ToolMessage
from agno.workflow.v2 import StepOutput
from ..config import DEFAULT_INTERVAL
from ..utils import add_tool_log, update_tool_log_status


async def allocation_step(step_input):
    """
    WORKFLOW STEP 3: Cash allocation and portfolio simulation
    This function calculates how investments would perform over time
    """
    # Step 1: Validate that we have tool calls to process
    if step_input.additional_data["messages"][-1].tool_calls is None:
        return
    
    # Step 2: Initialize tool logging for allocation calculation
    tool_log_id = add_tool_log(step_input.additional_data, "Calculating portfolio allocation")
    
    # Step 3: Extract data from previous workflow steps
    stock_data = step_input.additional_data["be_stock_data"]  # DataFrame: index=date, columns=tickers
    args = step_input.additional_data["be_arguments"]  # Parsed user arguments
    tickers = args["ticker_symbols"]  # Stock symbols to invest in
    investment_date = args["investment_date"]  # When to start investing
    amounts = args["amount_of_dollars_to_be_invested"]  # list, one per ticker
    interval = args.get("interval_of_investment", "single_shot")  # Investment frequency

    # Step 4: Initialize cash and portfolio tracking variables
    # Use state['available_cash'] as a single integer (total wallet cash)
    if step_input.additional_data["available_cash"] is not None:
        total_cash = step_input.additional_data["available_cash"]  # Existing cash
    else:
        total_cash = sum(amounts)  # Sum of all investment amounts
    
    # Step 5: Initialize portfolio tracking structures
    holdings = {ticker: 0.0 for ticker in tickers}  # Shares owned per ticker
    investment_log = []  # Record of all transactions
    add_funds_needed = False  # Flag for insufficient funds
    add_funds_dates = []  # Dates when more funds were needed

    # Step 6: Ensure DataFrame is sorted chronologically
    stock_data = stock_data.sort_index()

    # Step 7: Handle different investment strategies
    if interval == "single_shot":
        # SINGLE SHOT INVESTMENT: Buy all shares at the first available date
        first_date = stock_data.index[0]  # Get first date in dataset
        row = stock_data.loc[first_date]  # Get prices for first date
        
        # Process each ticker for single-shot investment
        for idx, ticker in enumerate(tickers):
            price = row[ticker]  # Current stock price
            
            # Handle missing price data
            if np.isnan(price):
                investment_log.append(
                    f"{first_date.date()}: No price data for {ticker}, could not invest."
                )
                add_funds_needed = True
                add_funds_dates.append(
                    (str(first_date.date()), ticker, price, amounts[idx])
                )
                continue
            
            # Calculate shares to purchase
            allocated = amounts[idx]  # Amount allocated to this ticker
            if total_cash >= allocated and allocated >= price:
                shares_to_buy = allocated // price  # Integer division for whole shares
                if shares_to_buy > 0:
                    cost = shares_to_buy * price  # Total cost
                    holdings[ticker] += shares_to_buy  # Update holdings
                    total_cash -= cost  # Reduce available cash
                    investment_log.append(
                        f"{first_date.date()}: Bought {shares_to_buy:.2f} shares of {ticker} at ${price:.2f} (cost: ${cost:.2f})"
                    )
                else:
                    # Handle insufficient allocated funds
                    investment_log.append(
                        f"{first_date.date()}: Not enough allocated cash to buy {ticker} at ${price:.2f}. Allocated: ${allocated:.2f}"
                    )
                    add_funds_needed = True
                    add_funds_dates.append(
                        (str(first_date.date()), ticker, price, allocated)
                    )
            else:
                # Handle insufficient total cash
                investment_log.append(
                    f"{first_date.date()}: Not enough total cash to buy {ticker} at ${price:.2f}. Allocated: ${allocated:.2f}, Available: ${total_cash:.2f}"
                )
                add_funds_needed = True
                add_funds_dates.append(
                    (str(first_date.date()), ticker, price, total_cash)
                )
    else:
        # DOLLAR COST AVERAGING: Invest regularly over time
        for date, row in stock_data.iterrows():  # Iterate through all dates
            for i, ticker in enumerate(tickers):  # For each ticker
                price = row[ticker]  # Current price
                if np.isnan(price):
                    continue  # skip if price is NaN
                
                # Invest as much as possible for this ticker at this date
                if total_cash >= price:
                    shares_to_buy = total_cash // price  # Buy as many shares as possible
                    if shares_to_buy > 0:
                        cost = shares_to_buy * price
                        holdings[ticker] += shares_to_buy
                        total_cash -= cost
                        investment_log.append(
                            f"{date.date()}: Bought {shares_to_buy:.2f} shares of {ticker} at ${price:.2f} (cost: ${cost:.2f})"
                        )
                else:
                    # Record when more funds are needed
                    add_funds_needed = True
                    add_funds_dates.append(
                        (str(date.date()), ticker, price, total_cash)
                    )
                    investment_log.append(
                        f"{date.date()}: Not enough cash to buy {ticker} at ${price:.2f}. Available: ${total_cash:.2f}. Please add more funds."
                    )

    # Step 8: Calculate final portfolio value and performance metrics
    final_prices = stock_data.iloc[-1]  # Last row = most recent prices
    total_value = 0.0  # Total portfolio value
    returns = {}  # Absolute returns per ticker
    total_invested_per_stock = {}  # Amount invested per ticker
    percent_allocation_per_stock = {}  # Percentage allocation per ticker
    percent_return_per_stock = {}  # Percentage return per ticker
    total_invested = 0.0  # Total amount invested across all stocks
    
    # Calculate investment amounts and returns for each ticker
    for idx, ticker in enumerate(tickers):
        # Calculate how much was actually invested in this stock
        if interval == "single_shot":
            # Only one purchase at first date
            first_date = stock_data.index[0]
            price = stock_data.loc[first_date][ticker]
            shares_bought = holdings[ticker]
            invested = shares_bought * price  # Total invested = shares * price
        else:
            # Sum all purchases from the log
            invested = 0.0
            for log in investment_log:
                if f"shares of {ticker}" in log and "Bought" in log:
                    # Extract cost from log string
                    try:
                        cost_str = log.split("(cost: $")[-1].split(")")[0]
                        invested += float(cost_str)
                    except Exception:
                        pass  # Skip if parsing fails
        total_invested_per_stock[ticker] = invested
        total_invested += invested  # Accumulate total invested
    
    # Calculate percentage allocations and returns
    for ticker in tickers:
        invested = total_invested_per_stock[ticker]  # Amount invested in this ticker
        holding_value = holdings[ticker] * final_prices[ticker]  # Current value
        returns[ticker] = holding_value - invested  # Absolute return
        total_value += holding_value  # Add to total portfolio value
        
        # Calculate percentage allocation (what % of total investment this represents)
        percent_allocation_per_stock[ticker] = (
            (invested / total_invested * 100) if total_invested > 0 else 0.0
        )
        
        # Calculate percentage return (profit/loss as percentage of invested amount)
        percent_return_per_stock[ticker] = (
            ((holding_value - invested) / invested * 100) if invested > 0 else 0.0
        )
    total_value += total_cash  # Add remaining cash to total value

    # Step 9: Store comprehensive investment summary
    step_input.additional_data["investment_summary"] = {
        "holdings": holdings,  # Shares owned per ticker
        "final_prices": final_prices.to_dict(),  # Current stock prices
        "cash": total_cash,  # Remaining cash
        "returns": returns,  # Absolute returns per ticker
        "total_value": total_value,  # Total portfolio value
        "investment_log": investment_log,  # Transaction history
        "add_funds_needed": add_funds_needed,  # Whether more funds needed
        "add_funds_dates": add_funds_dates,  # Dates/amounts when funds needed
        "total_invested_per_stock": total_invested_per_stock,  # Investment per ticker
        "percent_allocation_per_stock": percent_allocation_per_stock,  # Allocation %
        "percent_return_per_stock": percent_return_per_stock,  # Return %
    }
    step_input.additional_data["available_cash"] = total_cash  # Update available cash in state

    # Step 10: Calculate benchmark comparison with SPY (S&P 500)
    spy_ticker = "SPY"  # S&P 500 ETF ticker
    spy_prices = None
    try:
        # Fetch SPY data for comparison
        spy_prices = yf.download(
            spy_ticker,
            interval=DEFAULT_INTERVAL,  # Same interval as portfolio data
            start=stock_data.index[0],  # Same start date
            end=stock_data.index[-1],  # Same end date
        )["Close"]
        # Align SPY prices to stock_data dates
        spy_prices = spy_prices.reindex(stock_data.index, method="ffill")  # Forward fill
    except Exception as e:
        print("Error fetching SPY data:", e)
        # Create dummy data if SPY fetch fails
        spy_prices = pd.Series([None] * len(stock_data), index=stock_data.index)

    # Simulate SPY investment with same strategy
    spy_shares = 0.0  # SPY shares owned
    spy_cash = total_invested  # Start with same amount
    spy_invested = 0.0  # Amount actually invested in SPY
    spy_investment_log = []  # SPY transaction log
    
    if interval == "single_shot":
        # Single-shot SPY investment
        first_date = stock_data.index[0]
        spy_price = spy_prices.loc[first_date]
        if isinstance(spy_price, pd.Series):
            spy_price = spy_price.iloc[0]  # Extract scalar value
        if not pd.isna(spy_price):
            spy_shares = spy_cash // spy_price  # Buy SPY shares
            spy_invested = spy_shares * spy_price  # Calculate cost
            spy_cash -= spy_invested  # Reduce cash
            spy_investment_log.append(
                f"{first_date.date()}: Bought {spy_shares:.2f} shares of SPY at ${spy_price:.2f} (cost: ${spy_invested:.2f})"
            )
    else:
        # Dollar cost averaging SPY investment
        # DCA: invest equal portions at each date
        dca_amount = total_invested / len(stock_data)  # Amount per period
        for date in stock_data.index:
            spy_price = spy_prices.loc[date]
            if isinstance(spy_price, pd.Series):
                spy_price = spy_price.iloc[0]
            if not pd.isna(spy_price):
                shares = dca_amount // spy_price  # Shares to buy this period
                cost = shares * spy_price
                spy_shares += shares
                spy_cash -= cost
                spy_invested += cost
                spy_investment_log.append(
                    f"{date.date()}: Bought {shares:.2f} shares of SPY at ${spy_price:.2f} (cost: ${cost:.2f})"
                )

    # Build performance comparison data
    performance_data = []  # Array for chart data
    running_holdings = holdings.copy()  # Copy holdings for calculation
    running_cash = total_cash
    
    for date in stock_data.index:
        # Calculate portfolio value at each date
        port_value = sum(
            running_holdings[t] * stock_data.loc[date][t]
            for t in tickers
            if not pd.isna(stock_data.loc[date][t])  # Skip NaN prices
        )
        
        # Calculate SPY value at each date
        spy_price = spy_prices.loc[date]
        if isinstance(spy_price, pd.Series):
            spy_price = spy_price.iloc[0]
        spy_val = (
            spy_shares * spy_price + spy_cash if not pd.isna(spy_price) else None
        )
        
        performance_data.append({
            "date": str(date.date()),  # Convert to string for JSON
            "portfolio": float(port_value) if port_value is not None else None,
            "spy": float(spy_val) if spy_val is not None else None,
        })

    # Store performance data for chart rendering
    step_input.additional_data["investment_summary"]["performanceData"] = performance_data

    # Step 11: Generate summary message for user
    if add_funds_needed:
        msg = "Some investments could not be made due to insufficient funds. Please add more funds to your wallet.\n"
        for d, t, p, c in add_funds_dates:
            msg += f"On {d}, not enough cash for {t}: price ${p:.2f}, available ${c:.2f}\n"
    else:
        msg = "All investments were made successfully.\n"
    
    msg += f"\nFinal portfolio value: ${total_value:.2f}\n"
    msg += "Returns by ticker (percent and $):\n"
    for ticker in tickers:
        percent = percent_return_per_stock[ticker]
        abs_return = returns[ticker]
        msg += f"{ticker}: {percent:.2f}% (${abs_return:.2f})\n"

    # Add tool message to conversation
    step_input.additional_data["messages"].append(
        ToolMessage(
            role="tool",
            id=str(__import__('uuid').uuid4()),
            content="The relevant details had been extracted",  # Confirmation message
            tool_call_id=step_input.additional_data["messages"][-1].tool_calls[0].id,
        )
    )

    # Request chart rendering through tool call
    step_input.additional_data["messages"].append(
        AssistantMessage(
            role="assistant",
            tool_calls=[
                {
                    "id": str(__import__('uuid').uuid4()),
                    "type": "function",
                    "function": {
                        "name": "render_standard_charts_and_table",  # Frontend rendering function
                        "arguments": json.dumps(
                            {"investment_summary": step_input.additional_data["investment_summary"]}
                        ),
                    },
                }
            ],
            id=str(__import__('uuid').uuid4()),
        )
    )
    
    # Step 9: Mark allocation calculation as completed
    update_tool_log_status(step_input.additional_data, tool_log_id, "completed")
    
    return


