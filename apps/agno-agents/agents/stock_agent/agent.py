"""
Stock Analysis Agent V2 - Modular Implementation

This is the clean, modular version of the stock analysis agent using our new structure.
It provides the same functionality as the original but with better organization and maintainability.
"""

from agno.workflow.v2 import Workflow
from .steps import chat_step, simulation_step, allocation_step, insights_step

# WORKFLOW DEFINITION: Complete stock analysis pipeline
# This workflow orchestrates all the steps in sequence:
# 1. chat_step: Parse user input and extract parameters
# 2. simulation_step: Gather historical stock data  
# 3. allocation_step: Calculate portfolio performance and allocations
# 4. insights_step: Generate market insights
stock_analysis_workflow = Workflow(
    name="Stock Analysis Pipeline - Modular",
    steps=[chat_step, simulation_step, allocation_step, insights_step],
)

# Export for easy importing
__all__ = ['stock_analysis_workflow']
