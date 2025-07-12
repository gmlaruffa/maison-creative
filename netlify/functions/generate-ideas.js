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

    // *** NEW, MORE PRACTICAL PROMPT ***
    const prompt = `
        You are an expert student event planner based in Southampton, UK. You know all the best spots and activities for students. A client from the "${societyName}" needs a practical plan for their upcoming "${eventType}".

        Generate a creative and practical plan for the event. The plan should include:
        1.  A catchy, fun name for the event night.
        2.  A list of 2-3 pre-event activity ideas suitable for students in Southampton (e.g., specific pubs for pre-drinks, cheap eats).
        3.  A main event suggestion based on the "${eventType}".
        4.  A list of 2-3 post-event ideas (e.g., specific late-night food spots in Southampton).

        Format the entire response in clean HTML.
        - Use an <h3> for the catchy event name.
        - Use <h4> for the subheadings: "Pre-Event Plan", "Main Event", and "Post-Event Food".
        - Use a <ul> with <li> items for the lists of ideas.
        - Be specific to Southampton where possible. Do not include any other text outside of this HTML structure.
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

    // Clean the response to remove Markdown formatting
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
