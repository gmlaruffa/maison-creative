// netlify/functions/generate-ideas.js

exports.handler = async function (event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { societyName, eventType } = JSON.parse(event.body);

    // This is where your secret API key is securely accessed
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('API key is not available.');
    }

    const prompt = `
        You are a creative event planner for university students. A client from the "${societyName}" at the University of Southampton needs ideas for their upcoming "${eventType}".
        Generate three distinct and creative theme ideas for this event. For each idea, provide:
        1. A catchy Theme Name.
        2. A short, exciting Promotional Blurb (2-3 sentences) to be used on social media to generate hype.
        3. A suggested Music Vibe (e.g., genres, artists, energy level).
        Format the entire response in HTML. Use <h3> for each theme name, <p> for the promo blurb, and <strong>Music Vibe:</strong> followed by the music suggestion. Do not include any other text, just the HTML for the three ideas.
    `;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error:", errorData);
      return {
        statusCode: response.status,
        body: JSON.stringify({ message: "Error from Gemini API." })
      };
    }

    const result = await response.json();

    // Get the raw text from the API response
    let generatedHtml = result.candidates[0].content.parts[0].text;

    // **FIX ADDED HERE:** Clean the response to remove Markdown formatting
    generatedHtml = generatedHtml.replace(/```html/g, '').replace(/```/g, '').trim();

    return {
      statusCode: 200,
      body: JSON.stringify({ html: generatedHtml })
    };

  } catch (error) {
    console.error("Function Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "An error occurred in the function." })
    };
  }
};
