# Zulip MCP Server

MCP Server for the Zulip API, enabling AI assistants like Claude to interact with Zulip workspaces.

## Tools

1. `zulip_list_channels`
   - List available channels (streams) in the Zulip organization
   - Optional inputs:
     - `include_private` (boolean, default: false): Whether to include private streams 
     - `include_web_public` (boolean, default: true): Whether to include web-public streams
     - `include_subscribed` (boolean, default: true): Whether to include streams the bot is subscribed to
   - Returns: List of streams with their IDs and information

2. `zulip_post_message`
   - Post a new message to a Zulip channel (stream)
   - Required inputs:
     - `channel_name` (string): The name of the stream to post to
     - `topic` (string): The topic within the stream
     - `content` (string): The message content to post
   - Returns: Message posting confirmation and ID

3. `zulip_send_direct_message`
   - Send a direct message to one or more users
   - Required inputs:
     - `recipients` (string[]): Email addresses or user IDs of recipients
     - `content` (string): The message content to send
   - Returns: Message sending confirmation and ID

4. `zulip_add_reaction`
   - Add an emoji reaction to a message
   - Required inputs:
     - `message_id` (number): The ID of the message to react to
     - `emoji_name` (string): Emoji name without colons
   - Returns: Reaction confirmation

5. `zulip_get_channel_history`
   - Get recent messages from a channel (stream) and topic
   - Required inputs:
     - `channel_name` (string): The name of the stream
     - `topic` (string): The topic name
   - Optional inputs:
     - `limit` (number, default: 20): Number of messages to retrieve
     - `anchor` (string, default: "newest"): Message ID to start from
   - Returns: List of messages with their content and metadata

6. `zulip_get_topics`
   - Get topics in a channel (stream)
   - Required inputs:
     - `channel_id` (number): The ID of the stream
   - Returns: List of topics in the stream

7. `zulip_subscribe_to_channel`
   - Subscribe the bot to a channel (stream)
   - Required inputs:
     - `channel_name` (string): The name of the stream to subscribe to
   - Returns: Subscription confirmation

8. `zulip_get_users`
   - Get list of users in the Zulip organization
   - Returns: List of users with their basic information

## Setup

1. Create a Zulip Bot:
   - Log in to your Zulip instance
   - Navigate to Settings > Personal > Bots
   - Click "Add a new bot"
   - Select "Generic bot" type
   - Fill in the required information
   - Click "Create bot"

2. Permissions:
   - By default, Zulip bots have limited permissions
   - Make sure to subscribe the bot to any streams it needs to access
   - If you need the bot to have more permissions, consider using a full user account instead

3. Get the API credentials:
   - Bot's email address
   - Bot's API key (displayed when you create the bot)
   - Zulip instance URL (e.g., https://zulip.example.com)

### Usage with Claude Desktop

Add the following to your `claude_desktop_config.json`:

#### npx

```json
{
  "mcpServers": {
    "zulip": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-zulip"
      ],
      "env": {
        "ZULIP_EMAIL": "your-bot@zulip.example.com",
        "ZULIP_API_KEY": "your-bot-api-key",
        "ZULIP_URL": "https://zulip.example.com"
      }
    }
  }
}
```

#### docker

```json
{
  "mcpServers": {
    "zulip": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "ZULIP_EMAIL",
        "-e",
        "ZULIP_API_KEY",
        "-e",
        "ZULIP_URL",
        "mcp/zulip"
      ],
      "env": {
        "ZULIP_EMAIL": "your-bot@zulip.example.com",
        "ZULIP_API_KEY": "your-bot-api-key",
        "ZULIP_URL": "https://zulip.example.com"
      }
    }
  }
}
```

### Troubleshooting

If you encounter permission errors, verify that:
1. The bot API key is correct
2. The bot has been subscribed to the channels it needs to access
3. The Zulip URL is correct and accessible

## Build

Docker build:

```bash
docker build -t mcp/zulip .
```

## License

This MCP server is licensed under the MIT License.