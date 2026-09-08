# Elysia with Bun runtime

## Getting Started

To get started with this template, simply paste this command into your terminal:

```bash
bun create elysia ./elysia-example
```

## Development

To start the development server run:

```bash
bun run dev
```

Open http://localhost:3000/ with your browser to see the result.

## Using LLM Generation

To use the llm generation you need to add the following to .env file:

```
OPENAI_API_KEY=your_openai_api_key
OPENAI_URL=https://api.openai.com/v1
OPENAI_MODEL=your_model
```

You can use whatever form of openAI you want. Please refer to the [OpenAI API documentation](https://platform.openai.com/docs) for more details on how to setup an openAI model yourself.
