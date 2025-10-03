"""Stock Agent Package

This package provides a stock analysis agent that helps users analyze stocks,
simulate investments, and generate insights.

Now using the clean, modular implementation with separated components:
- agent.py: Main workflow orchestration (modular)
- config.py: Configuration constants
- tools.py: Tool definitions
- utils.py: Utility functions
- steps/: Workflow step modules
"""

from .agent import stock_analysis_workflow

__all__ = ['stock_analysis_workflow']