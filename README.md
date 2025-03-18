# MCP Perplexity API Server

This Model Context Protocol (MCP) server integrates Perplexity's API to provide Claude with real-time, web-wide research capabilities.

## Features

-   **Web Search**: Quick web searches using Perplexity's "sonar-reasoning-pro" model
-   **Deep Research**: Comprehensive research using Perplexity's "sonar-deep-research" model
-   Full citations for all results
-   Detailed error handling and logging

## Installation

```bash
# Clone the repository
git clone https://github.com/nathanonn/mcp-perplexity-api.git
cd mcp-perplexity-api

# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

You need to set the following environment variables:

```bash
export PERPLEXITY_API_KEY=your_api_key_here
```

You can get a Perplexity API key by signing up at [Perplexity.ai](https://www.perplexity.ai/).

## Usage

Run the server:

```bash
npm start
```

### Integrating with Claude for Desktop

To use this server with Claude for Desktop, add it to your `claude_desktop_config.json` file:

```json
{
    "mcpServers": {
        "perplexity": {
            "command": "node",
            "args": ["/path/to/mcp-perplexity-search/build/index.js"],
            "env": {
                "PERPLEXITY_API_KEY": "your_api_key_here"
            }
        }
    }
}
```

The location of this file depends on your operating system:

-   macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
-   Windows: `%APPDATA%\Claude\claude_desktop_config.json`

## Available Tools

### Web Search

The `web-search` tool provides quick factual information from the web.

Parameters:

-   `query` (required): The search query (3-1000 characters)
-   `max_tokens` (optional): Maximum number of tokens in the response (50-4000, default: 500)
-   `temperature` (optional): Temperature for response generation (0.0-1.0, default: 0.2)

Example usage in Claude:

```
What are the latest developments in quantum computing?
```

### Deep Research

The `deep-research` tool provides comprehensive research on complex topics.

Parameters:

-   `query` (required): The research question or topic (3-2000 characters)
-   `max_tokens` (optional): Maximum number of tokens in the response (100-8000, default: 500)
-   `temperature` (optional): Temperature for response generation (0.0-1.0, default: 0.2)

Example usage in Claude:

```
Can you do deep research on the current state of fusion energy and recent breakthroughs?
```

## Troubleshooting

If you encounter issues:

1. Check the logs for error messages
2. Verify your Perplexity API key is correctly set
3. Make sure you have Node.js version 18 or higher
4. Check your network connection

## License

MIT
