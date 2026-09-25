export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    const { messages = [], web_search = false } = req.body || {};

    if (!messages.length) {
      return res.status(400).json({ error: "No messages provided" });
    }

    let webContext = "";

    // Optional web search
    if (web_search && process.env.TAVILY_API_KEY) {
      const lastUserMessage = [...messages]
        .reverse()
        .find((m) => m.role === "user");

      if (lastUserMessage) {
        const searchResponse = await fetch(
          "https://api.tavily.com/search",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              api_key: process.env.TAVILY_API_KEY,
              query: lastUserMessage.content,
              search_depth: "basic",
              max_results: 6
            })
          }
        );

        const searchData = await searchResponse.json();

        if (searchResponse.ok) {
          webContext = (searchData.results || [])
            .map(
              (item) =>
                `${item.title}\nURL: ${item.url}\n${item.content || ""}`
            )
            .join("\n\n");
        }
      }
    }

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

    aiMessages.push(...messages.slice(-30));

    const apiBase = (
      process.env.AI_BASE_URL ||
      "https://api.openai.com/v1"
    ).replace(/\/$/, "");

    const response = await fetch(
      apiBase + "/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization":
            "Bearer " + process.env.AI_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL,
          messages: aiMessages,
          temperature: 0.2
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error?.message ||
        "AI provider request failed"
      );
    }

    const answer =
      data?.choices?.[0]?.message?.content;

    if (!answer) {
      throw new Error("AI returned no answer");
    }

    return res.status(200).json({
      answer
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message || "Server error"
    });
  }
}
