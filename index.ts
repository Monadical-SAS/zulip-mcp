#!/usr/bin/env node
/*
 * Copyright 2025 The Apache Software Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequest,
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import zulipInit from "zulip-js";

// Type definitions for tool arguments
interface ListChannelsArgs {
  include_private?: boolean;
  include_web_public?: boolean;
  include_subscribed?: boolean;
}

interface PostMessageArgs {
  channel_name: string;
  topic: string;
  content: string;
}

interface SendDirectMessageArgs {
  recipients: string[];
  content: string;
}

interface AddReactionArgs {
  message_id: number;
  emoji_name: string;
}

interface GetChannelHistoryArgs {
  channel_name: string;
  topic: string;
  limit?: number;
  anchor?: string;
}

interface GetTopicsArgs {
  channel_id: number;
}

interface SubscribeToChannelArgs {
  channel_name: string;
}

// Tool definitions
const listChannelsTool: Tool = {
  name: "zulip_list_channels",
  description: "List available channels (streams) in the Zulip organization",
  inputSchema: {
    type: "object",
    properties: {
      include_private: {
        type: "boolean",
        description: "Whether to include private streams",
        default: false,
      },
      include_web_public: {
        type: "boolean",
        description: "Whether to include web-public streams",
        default: true,
      },
      include_subscribed: {
        type: "boolean",
        description: "Whether to include streams the bot is subscribed to",
        default: true,
      },
    },
  },
};

const postMessageTool: Tool = {
  name: "zulip_post_message",
  description: "Post a new message to a Zulip channel (stream)",
  inputSchema: {
    type: "object",
    properties: {
      channel_name: {
        type: "string",
        description: "The name of the stream to post to",
      },
      topic: {
        type: "string",
        description: "The topic within the stream",
      },
      content: {
        type: "string",
        description: "The message content to post",
      },
    },
    required: ["channel_name", "topic", "content"],
  },
};

const sendDirectMessageTool: Tool = {
  name: "zulip_send_direct_message",
  description: "Send a direct message to one or more users",
  inputSchema: {
    type: "object",
    properties: {
      recipients: {
        type: "array",
        items: {
          type: "string",
        },
        description: "Email addresses or user IDs of recipients",
      },
      content: {
        type: "string",
        description: "The message content to send",
      },
    },
    required: ["recipients", "content"],
  },
};

const addReactionTool: Tool = {
  name: "zulip_add_reaction",
  description: "Add an emoji reaction to a message",
  inputSchema: {
    type: "object",
    properties: {
      message_id: {
        type: "number",
        description: "The ID of the message to react to",
      },
      emoji_name: {
        type: "string",
        description: "Emoji name without colons",
      },
    },
    required: ["message_id", "emoji_name"],
  },
};

const getChannelHistoryTool: Tool = {
  name: "zulip_get_channel_history",
  description: "Get recent messages from a channel (stream) and topic",
  inputSchema: {
    type: "object",
    properties: {
      channel_name: {
        type: "string",
        description: "The name of the stream",
      },
      topic: {
        type: "string",
        description: "The topic name",
      },
      limit: {
        type: "number",
        description: "Number of messages to retrieve (default 20)",
        default: 20,
      },
      anchor: {
        type: "string",
        description: "Message ID to start from (default 'newest')",
        default: "newest",
      },
    },
    required: ["channel_name", "topic"],
  },
};

const getTopicsTool: Tool = {
  name: "zulip_get_topics",
  description: "Get topics in a channel (stream)",
  inputSchema: {
    type: "object",
    properties: {
      channel_id: {
        type: "number",
        description: "The ID of the stream",
      },
    },
    required: ["channel_id"],
  },
};

const subscribeToChannelTool: Tool = {
  name: "zulip_subscribe_to_channel",
  description: "Subscribe the bot to a channel (stream)",
  inputSchema: {
    type: "object",
    properties: {
      channel_name: {
        type: "string",
        description: "The name of the stream to subscribe to",
      },
    },
    required: ["channel_name"],
  },
};

const getUsersTool: Tool = {
  name: "zulip_get_users",
  description: "Get list of users in the Zulip organization",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

class ZulipClient {
  private client: any;
  
  constructor(config: any) {
    this.initClient(config);
  }
  
  private async initClient(config: any) {
    try {
      this.client = await zulipInit(config);
    } catch (error) {
      console.error("Error initializing Zulip client:", error);
      throw error;
    }
  }

  async getStreams(includePrivate = false, includeWebPublic = true, includeSubscribed = true) {
    try {
      const params: any = {};
      
      if (includePrivate) {
        params.include_private = true;
      }
      
      if (!includeWebPublic) {
        params.include_web_public = false;
      }
      
      if (!includeSubscribed) {
        params.include_subscribed = false;
      }
      
      return await this.client.streams.retrieve(params);
    } catch (error) {
      console.error("Error getting streams:", error);
      throw error;
    }
  }

  async sendStreamMessage(streamName: string, topic: string, content: string) {
    try {
      const params = {
        to: streamName,
        type: "stream",
        topic: topic,
        content: content,
      };
      
      return await this.client.messages.send(params);
    } catch (error) {
      console.error("Error sending stream message:", error);
      throw error;
    }
  }

  async sendDirectMessage(recipients: string[], content: string) {
    try {
      const params = {
        to: recipients,
        type: "private",
        content: content,
      };
      
      return await this.client.messages.send(params);
    } catch (error) {
      console.error("Error sending direct message:", error);
      throw error;
    }
  }

  async addReaction(messageId: number, emojiName: string) {
    try {
      return await this.client.reactions.add({
        message_id: messageId,
        emoji_name: emojiName,
      });
    } catch (error) {
      console.error("Error adding reaction:", error);
      throw error;
    }
  }

  async getMessages(streamName: string, topic: string, limit = 20, anchor = "newest") {
    try {
      // First, need to find the stream ID
      const streamsResponse = await this.getStreams(true, true, true);
      const stream = streamsResponse.streams.find((s: any) => s.name === streamName);
      
      if (!stream) {
        throw new Error(`Stream "${streamName}" not found`);
      }
      
      // Construct narrow to filter by stream and topic
      const narrow = [
        { operator: "stream", operand: streamName },
        { operator: "topic", operand: topic },
      ];
      
      const params = {
        narrow: JSON.stringify(narrow),
        num_before: Math.floor(limit / 2),
        num_after: Math.floor(limit / 2),
        anchor: anchor,
      };
      
      return await this.client.messages.retrieve(params);
    } catch (error) {
      console.error("Error getting messages:", error);
      throw error;
    }
  }

  async getTopics(streamId: number) {
    try {
      return await this.client.streams.topics.retrieve({ stream_id: streamId });
    } catch (error) {
      console.error("Error getting topics:", error);
      throw error;
    }
  }

  async subscribeToStream(streamName: string) {
    try {
      const subscriptions = [{ name: streamName }];
      return await this.client.streams.subscribe({ subscriptions: JSON.stringify(subscriptions) });
    } catch (error) {
      console.error("Error subscribing to stream:", error);
      throw error;
    }
  }

  async getUsers() {
    try {
      return await this.client.users.retrieve();
    } catch (error) {
      console.error("Error getting users:", error);
      throw error;
    }
  }
}

async function main() {
  const zulipEmail = process.env.ZULIP_EMAIL;
  const zulipApiKey = process.env.ZULIP_API_KEY;
  const zulipUrl = process.env.ZULIP_URL;

  if (!zulipEmail || !zulipApiKey || !zulipUrl) {
    console.error(
      "Please set ZULIP_EMAIL, ZULIP_API_KEY, and ZULIP_URL environment variables"
    );
    process.exit(1);
  }

  console.error("Starting Zulip MCP Server...");
  const server = new Server(
    {
      name: "Zulip MCP Server",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  const zulipConfig = {
    username: zulipEmail,
    apiKey: zulipApiKey,
    realm: zulipUrl
  };
  
  const zulipClient = new ZulipClient(zulipConfig);

  server.setRequestHandler(
    CallToolRequestSchema,
    async (request: CallToolRequest) => {
      console.error("Received CallToolRequest:", request);
      try {
        if (!request.params.arguments) {
          throw new Error("No arguments provided");
        }

        switch (request.params.name) {
          case "zulip_list_channels": {
            const args = request.params.arguments as unknown as ListChannelsArgs;
            const response = await zulipClient.getStreams(
              args.include_private,
              args.include_web_public,
              args.include_subscribed
            );
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "zulip_post_message": {
            const args = request.params.arguments as unknown as PostMessageArgs;
            if (!args.channel_name || !args.topic || !args.content) {
              throw new Error(
                "Missing required arguments: channel_name, topic, and content"
              );
            }
            const response = await zulipClient.sendStreamMessage(
              args.channel_name,
              args.topic,
              args.content
            );
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "zulip_send_direct_message": {
            const args = request.params.arguments as unknown as SendDirectMessageArgs;
            if (!args.recipients || !args.content) {
              throw new Error(
                "Missing required arguments: recipients and content"
              );
            }
            const response = await zulipClient.sendDirectMessage(
              args.recipients,
              args.content
            );
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "zulip_add_reaction": {
            const args = request.params.arguments as unknown as AddReactionArgs;
            if (args.message_id === undefined || !args.emoji_name) {
              throw new Error(
                "Missing required arguments: message_id and emoji_name"
              );
            }
            const response = await zulipClient.addReaction(
              args.message_id,
              args.emoji_name
            );
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "zulip_get_channel_history": {
            const args = request.params.arguments as unknown as GetChannelHistoryArgs;
            if (!args.channel_name || !args.topic) {
              throw new Error(
                "Missing required arguments: channel_name and topic"
              );
            }
            const response = await zulipClient.getMessages(
              args.channel_name,
              args.topic,
              args.limit,
              args.anchor
            );
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "zulip_get_topics": {
            const args = request.params.arguments as unknown as GetTopicsArgs;
            if (args.channel_id === undefined) {
              throw new Error("Missing required argument: channel_id");
            }
            const response = await zulipClient.getTopics(args.channel_id);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "zulip_subscribe_to_channel": {
            const args = request.params.arguments as unknown as SubscribeToChannelArgs;
            if (!args.channel_name) {
              throw new Error("Missing required argument: channel_name");
            }
            const response = await zulipClient.subscribeToStream(args.channel_name);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "zulip_get_users": {
            const response = await zulipClient.getUsers();
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        console.error("Error executing tool:", error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: error instanceof Error ? error.message : String(error),
              }),
            },
          ],
        };
      }
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    console.error("Received ListToolsRequest");
    return {
      tools: [
        listChannelsTool,
        postMessageTool,
        sendDirectMessageTool,
        addReactionTool,
        getChannelHistoryTool,
        getTopicsTool,
        subscribeToChannelTool,
        getUsersTool,
      ],
    };
  });

  const transport = new StdioServerTransport();
  console.error("Connecting server to transport...");
  await server.connect(transport);

  console.error("Zulip MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});