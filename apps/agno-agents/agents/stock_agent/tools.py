"""
Tool definitions for the Stock Analysis Agent
"""

# Tool function definition: Extract investment parameters from user input
# This tool allows the AI to parse user requests and extract structured data like:
# - Stock ticker symbols (e.g., AAPL, GOOGL)
# - Investment amounts in dollars
# - Investment dates and intervals
# - Portfolio preferences (main vs sandbox)
extract_relevant_data_from_user_prompt = {
    "type": "function",  # <--- REQUIRED in `tools` list
    "function": {
        "name": "extract_relevant_data_from_user_prompt",
        "description": "Gets the data like ticker symbols, amount of dollars to be invested, interval of investment.",
        "parameters": {
            "type": "object",
            "properties": {
                "ticker_symbols": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    },
                    "description": "A list of stock ticker symbols, e.g. ['AAPL', 'GOOGL']."
                },
                "investment_date": {
                    "type": "string",
                    "description": "The date of investment, e.g. '2023-01-01'.",
                    "format": "date"
                },
                "amount_of_dollars_to_be_invested": {
                    "type": "array",
                    "items": {
                        "type": "number"
                    },
                    "description": "The amount of dollars to be invested, e.g. [10000, 20000, 30000]."
                },
                "interval_of_investment": {
                    "type": "string",
                    "description": "The interval of investment, e.g. '1d', '5d', '1mo', '3mo', '6mo', '1y'. If the user did not specify the interval, assume it as 'single_shot'.",
                    "enum": ["1d", "5d", "7d", "1mo", "3mo", "6mo", "1y", "2y", "3y", "4y", "5y", "single_shot"]
                },
                "to_be_added_in_portfolio": {
                    "type": "boolean",
                    "description": "True if the user wants to add it to the current portfolio; false if they want to add it to the sandbox portfolio."
                }
            },
            "required": [
                "ticker_symbols",
                "investment_date",
                "amount_of_dollars_to_be_invested",
                "to_be_added_in_portfolio"
            ]
        }
    }
}

# Tool function definition: Generate bull/bear market insights
# This tool creates positive and negative market analysis for stocks/portfolios
# Each insight includes a title, detailed description, and emoji for UI display
generate_insights = {
  "type": "function",
  "function": {
    "name": "generate_insights",
    "description": "Generate positive (bull) and negative (bear) insights for a stock or portfolio.",
    "parameters": {
      "type": "object",
      "properties": {
        "bullInsights": {
          "type": "array",
          "description": "A list of positive insights (bull case) for the stock or portfolio.",
          "items": {
            "type": "object",
            "properties": {
              "title": {
                "type": "string",
                "description": "Short title for the positive insight."
              },
              "description": {
                "type": "string",
                "description": "Detailed description of the positive insight."
              },
              "emoji": {
                "type": "string",
                "description": "Emoji representing the positive insight."
              }
            },
            "required": ["title", "description", "emoji"]
          }
        },
        "bearInsights": {
          "type": "array",
          "description": "A list of negative insights (bear case) for the stock or portfolio.",
          "items": {
            "type": "object",
            "properties": {
              "title": {
                "type": "string",
                "description": "Short title for the negative insight."
              },
              "description": {
                "type": "string",
                "description": "Detailed description of the negative insight."
              },
              "emoji": {
                "type": "string",
                "description": "Emoji representing the negative insight."
              }
            },
            "required": ["title", "description", "emoji"]
          }
        }
      },
      "required": ["bullInsights", "bearInsights"]
    }
  }
}

# Export all tools for easy importing
__all__ = [
    'extract_relevant_data_from_user_prompt',
    'generate_insights'
]
