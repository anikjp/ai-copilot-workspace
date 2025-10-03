# Agno Agents Backend

A FastAPI-based backend server for AI agents with real-time streaming capabilities.

## Features

- **Stock Analysis Agent**: Comprehensive portfolio analysis with real-time charts and insights
- **TheGreatBonnie Pattern**: Reference implementation following exact patterns from the community
- **Real-time Streaming**: Event-driven communication with the frontend
- **Modular Architecture**: Clean separation of concerns with reusable components
- **Error Handling**: Robust error handling and logging throughout
- **Configuration Management**: Environment-based configuration system

## Quick Start

1. **Install Dependencies**:
   ```bash
   cd apps/agno-agents
   pip install -r requirements.txt
   ```

2. **Environment Setup**:
   Create a `.env` file with:
   ```
   PORT=8000
   HOST=0.0.0.0
   DEBUG=false
   OPENAI_API_KEY=your_api_key_here
   DEFAULT_CASH=1000000
   ```

3. **Run the Server**:
   ```bash
   python main.py
   ```

## API Endpoints

### Stock Analysis Agents

- **`POST /stock-reference`**: Reference implementation following TheGreatBonnie pattern
- **`POST /stock-agent`**: Standard stock analysis agent

### Other Agents

- **`POST /ringi-agent`**: Ringi System agent for collaborative decision-making
- **`POST /bpp-agent`**: Business Process Platform AI Assistant
- **`POST /generic-agent`**: Generic agent with model selection capabilities

## Architecture

### Main Components

1. **`main.py`**: FastAPI application with TheGreatBonnie pattern implementation
2. **`agents/stock_agent/agent_reference.py`**: Stock analysis workflow with 4-step process
3. **`shared/base_agent.py`**: Standardized agent endpoint creation utilities

### TheGreatBonnie Pattern

The `/stock-reference` endpoint implements the exact pattern from:
https://github.com/TheGreatBonnie/open-ag-ui-demo-agno/blob/main/agent/main.py

**Key Features**:
- Event-driven streaming with `EventEncoder`
- Real-time tool log updates
- Comprehensive portfolio simulation
- Interactive chart rendering
- Market insights generation

### Workflow Steps

1. **Chat**: Parse user input and extract investment parameters
2. **Simulation**: Gather historical stock data using yfinance
3. **Cash Allocation**: Calculate portfolio performance and allocations
4. **Gather Insights**: Generate bull/bear market insights

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8000 | Server port |
| `HOST` | 0.0.0.0 | Server host |
| `DEBUG` | false | Enable debug mode |
| `OPENAI_API_KEY` | - | OpenAI API key (required) |
| `DEFAULT_CASH` | 1000000 | Default cash amount for portfolios |

### Logging

The server uses structured logging with:
- Console output for development
- File logging to `agno_agents.log`
- Configurable log levels

## Development

### Code Structure

```
apps/agno-agents/
├── main.py                          # FastAPI application
├── agents/
│   ├── stock_agent/
│   │   └── agent_reference.py      # Stock analysis workflow
│   ├── ringi_agent/                # Ringi system agent
│   ├── bpp_agent/                  # BPP assistant
│   └── generic_agent/              # Generic agent
├── shared/
│   └── base_agent.py               # Shared utilities
└── requirements.txt                # Dependencies
```

### Error Handling

- Comprehensive try-catch blocks throughout
- Structured logging for debugging
- Graceful degradation on failures
- HTTP status codes for API responses

### Testing

The backend can be tested using:
- FastAPI's built-in documentation at `/docs` (when DEBUG=true)
- Direct API calls to endpoints
- Integration with the frontend application

## Performance

- **Async/Await**: Full async implementation for high concurrency
- **Event Streaming**: Real-time updates without polling
- **Efficient Data Processing**: Optimized pandas/numpy operations
- **Memory Management**: Proper cleanup and resource management

## Security

- **CORS Configuration**: Restricted to allowed origins
- **Environment Variables**: Sensitive data in environment files
- **Input Validation**: Type checking and validation
- **Error Sanitization**: No sensitive data in error responses