export default async function handler(req, res) {
  // =========================
  // CORS SETTINGS
  // =========================
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://jhonsmithp.github.io"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  // Browser CORS preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only POST is allowed
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "POST only"
    });
  }

  try {
    // =========================
    // GET REQUEST DATA
    // =========================
    const {
      messages = [],
      web_search = false
    } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "No messages provided"
      });
    }

    // =========================
    // OPTIONAL WEB SEARCH
    // =========================
    let webContext = "";

    if (
      web_search &&
      process.env.TAVILY_API_KEY
    ) {
      const lastUserMessage = [...messages]
        .reverse()
        .find(
          (message) =>
            message &&
            message.role === "user"
        );

      if (lastUserMessage) {
        try {
          const searchResponse = await fetch(
            "https://api.tavily.com/search",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                api_key:
                  process.env.TAVILY_API_KEY,
                query:
                  lastUserMessage.content,
                search_depth: "basic",
                max_results: 6
              })
            }
          );

          const searchData =
            await searchResponse.json();

          if (searchResponse.ok) {
            webContext = (
              searchData.results || []
            )
              .map(
                (item) =>
                  `${item.title || ""}\n` +
                  `URL: ${item.url || ""}\n` +
                  `${item.content || ""}`
              )
              .join("\n\n");
          }
        } catch (searchError) {
          // Web search failed.
          // Continue with normal AI response.
          webContext = "";
        }
      }
    }

    // =========================
    // SYSTEM PROMPT
    // =========================
    const systemPrompt = `
You are a general-purpose personal AI assistant.

Help the user with:
- General questions
- Writing and rewriting
- Translation
- Programming
- HTML, CSS and JavaScript
- Websites
- Python, PHP, Java, C, C++, JavaScript and other languages
- Debugging
- Mathematics
- Research
- Explanations
- Creative and technical tasks

Follow the user's instructions as closely as possible when the request is lawful and safe.

Do not invent facts, sources, search results, or actions you did not perform.

When web search information is provided, use it to answer current or externally verifiable questions.

If the user asks for code, provide complete usable code whenever practical.
`;

    // =========================
    // BUILD AI MESSAGES
    // =========================
    const aiMessages = [
      {
        role: "system",
        content: systemPrompt
      }
    ];

    if (webContext) {
      aiMessages.push({
        role: "system",
        content:
          "WEB SEARCH RESULTS:\n\n" +
          webContext
      });
    }

    // Keep the latest 30 messages
    aiMessages.push(
      ...messages.slice(-30)
    );

    // =========================
    // OPENAI API SETTINGS
    // =========================
    const apiBase = (
      process.env.AI_BASE_URL ||
      "https://api.openai.com/v1"
    ).replace(/\/$/, "");

    const apiKey =
      process.env.AI_API_KEY;

    const model =
      process.env.AI_MODEL;

    // Check required environment variables
    if (!apiKey) {
      throw new Error(
        "AI_API_KEY is not configured in Vercel"
      );
    }

    if (!model) {
      throw new Error(
        "AI_MODEL is not configured in Vercel"
      );
    }

    // =========================
    // CALL AI API
    // =========================
    const response = await fetch(
      apiBase + "/chat/completions",
      {
        method: "POST",

        headers: {
          "Authorization":
            "Bearer " + apiKey,
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          model: model,
          messages: aiMessages,
          temperature: 0.2
        })
      }
    );

    // =========================
    // READ AI RESPONSE
    // =========================
    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error?.message ||
        "AI provider request failed"
      );
    }

    const answer =
      data?.choices?.[0]?.message?.content;

    if (!answer) {
      throw new Error(
        "AI returned no answer"
      );
    }

    // =========================
    // SUCCESS
    // =========================
    return res.status(200).json({
      answer: answer
    });

  } catch (error) {
    // =========================
    // ERROR
    // =========================
    console.error(
      "API ERROR:",
      error
    );

    return res.status(500).json({
      error:
        error?.message ||
        "Server error"
    });
  }
}
