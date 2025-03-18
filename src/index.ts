import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fetch from "node-fetch";

// Configuration
const DEFAULT_MAX_TOKENS = 500;
const DEFAULT_TEMPERATURE = 0.2;

// Interface for Perplexity API response
interface PerplexityResponse {
    id: string;
    model: string;
    object: string;
    created: number;
    citations: string[];
    choices: {
        index: number;
        finish_reason: string;
        message: {
            role: string;
            content: string;
        };
        delta: {
            role: string;
            content: string;
        };
    }[];
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

// Create an MCP server
const server = new McpServer({
    name: "PerplexitySearch",
    version: "1.0.0",
});

// Utility function for logging
function log(message: string, level: "info" | "error" = "info") {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

    if (level === "error") {
        console.error(formattedMessage);
    } else {
        console.error(formattedMessage); // Using console.error for logging because stdout is used for MCP communication
    }
}

// Helper function to call Perplexity API
async function callPerplexityAPI(
    query: string,
    model: string,
    maxTokens: number = DEFAULT_MAX_TOKENS,
    temperature: number = DEFAULT_TEMPERATURE
): Promise<PerplexityResponse> {
    // Get API key from environment
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
        throw new Error("PERPLEXITY_API_KEY environment variable is not set");
    }

    log(
        `Calling Perplexity API with model ${model}, query: "${query.substring(
            0,
            50
        )}${query.length > 50 ? "..." : ""}"`
    );

    try {
        const response = await fetch(
            "https://api.perplexity.ai/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: "system",
                            content: "Be precise and concise.",
                        },
                        {
                            role: "user",
                            content: query,
                        },
                    ],
                    max_tokens: maxTokens,
                    temperature: temperature,
                    top_p: 0.9,
                    return_citations: true,
                }),
            }
        );

        if (!response.ok) {
            const error = await response.text();
            log(`Perplexity API error: ${response.status} ${error}`, "error");
            throw new Error(
                `Perplexity API error: ${response.status} ${error}`
            );
        }

        const data = (await response.json()) as PerplexityResponse;
        log(
            `Perplexity API response received, ${data.usage.total_tokens} tokens used`
        );
        return data;
    } catch (error) {
        log(
            `Error calling Perplexity API: ${
                error instanceof Error ? error.message : String(error)
            }`,
            "error"
        );
        throw error;
    }
}

// Implement the web search tool using sonar-reasoning-pro
server.tool(
    "web-search",
    "Quickly search the web for current and factual information using Perplexity. This tool is best for straightforward questions that require up-to-date information.",
    {
        query: z
            .string()
            .min(3)
            .max(1000)
            .describe("The search query - be specific and clear"),
        max_tokens: z
            .number()
            .min(50)
            .max(4000)
            .optional()
            .describe(
                "Maximum number of tokens in the response (default: 500)"
            ),
        temperature: z
            .number()
            .min(0)
            .max(1)
            .optional()
            .describe(
                "Temperature for response generation, 0.0 (deterministic) to 1.0 (creative), default: 0.2"
            ),
    },
    async ({ query, max_tokens, temperature }) => {
        try {
            const result = await callPerplexityAPI(
                query,
                "sonar-reasoning-pro",
                max_tokens || DEFAULT_MAX_TOKENS,
                temperature || DEFAULT_TEMPERATURE
            );

            // Format the response with content and citations
            let responseText = result.choices[0].message.content;

            // Add citations
            if (result.citations && result.citations.length > 0) {
                responseText += "\n\nSources:";
                result.citations.forEach((citation, index) => {
                    responseText += `\n[${index + 1}] ${citation}`;
                });
            }

            return {
                content: [
                    {
                        type: "text",
                        text: responseText,
                    },
                ],
            };
        } catch (error) {
            log(
                `Error in web-search tool: ${
                    error instanceof Error ? error.message : String(error)
                }`,
                "error"
            );
            return {
                isError: true,
                content: [
                    {
                        type: "text",
                        text: `Error: ${
                            error instanceof Error
                                ? error.message
                                : String(error)
                        }`,
                    },
                ],
            };
        }
    }
);

// Implement the deep research tool using sonar-deep-research
server.tool(
    "deep-research",
    "Perform comprehensive, thorough research on a complex topic using Perplexity's advanced research model. This tool provides more detailed analysis with multiple sources and is best for in-depth questions requiring nuanced understanding.",
    {
        query: z
            .string()
            .min(3)
            .max(2000)
            .describe(
                "The research question or topic - be specific about what you want to learn"
            ),
        max_tokens: z
            .number()
            .min(100)
            .max(8000)
            .optional()
            .describe(
                "Maximum number of tokens in the response (default: 500)"
            ),
        temperature: z
            .number()
            .min(0)
            .max(1)
            .optional()
            .describe(
                "Temperature for response generation, 0.0 (deterministic) to 1.0 (creative), default: 0.2"
            ),
    },
    async ({ query, max_tokens, temperature }) => {
        try {
            const result = await callPerplexityAPI(
                query,
                "sonar-deep-research",
                max_tokens || DEFAULT_MAX_TOKENS,
                temperature || DEFAULT_TEMPERATURE
            );

            // Format the response with content and citations
            let responseText = result.choices[0].message.content;

            // Add citations
            if (result.citations && result.citations.length > 0) {
                responseText += "\n\nSources:";
                result.citations.forEach((citation, index) => {
                    responseText += `\n[${index + 1}] ${citation}`;
                });
            }

            return {
                content: [
                    {
                        type: "text",
                        text: responseText,
                    },
                ],
            };
        } catch (error) {
            log(
                `Error in deep-research tool: ${
                    error instanceof Error ? error.message : String(error)
                }`,
                "error"
            );
            return {
                isError: true,
                content: [
                    {
                        type: "text",
                        text: `Error: ${
                            error instanceof Error
                                ? error.message
                                : String(error)
                        }`,
                    },
                ],
            };
        }
    }
);

// Start the server
async function main() {
    try {
        log("Starting Perplexity Search MCP Server...");

        // Check for API key
        if (!process.env.PERPLEXITY_API_KEY) {
            log("PERPLEXITY_API_KEY environment variable is not set", "error");
            process.exit(1);
        }

        // Create a stdio transport
        const transport = new StdioServerTransport();

        // Connect the server to the transport
        await server.connect(transport);

        log("Perplexity Search MCP Server running on stdio");
    } catch (error) {
        log(
            `Failed to start server: ${
                error instanceof Error ? error.message : String(error)
            }`,
            "error"
        );
        process.exit(1);
    }
}

main();
