const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini if API key exists
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

/**
 * Generate a greeting for the customer.
 */
const getGreeting = async (department) => {
  return `Welcome to FIC ${department} Assistant. How can I help you today?`;
};

/**
 * Handle AI conversation and generate summary.
 * In a real scenario, this would be called after receiving a transcript or during a stream.
 */
const generateCallSummary = async (transcript) => {
  if (!genAI) {
    console.warn("Gemini API key not found. Using fallback structured insights.");
    // Fallback logic for demo
    const isUrgent = /urgent|immediate|problem|emergency/i.test(transcript);
    const isHappy = /thank|great|good|excellent/i.test(transcript);
    return {
      summary: "Demo Summary: Customer interested in services and left contact details.",
      sentiment: isHappy ? "Positive" : "Neutral",
      priority: isUrgent ? "High" : "Medium",
      category: "General"
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `
      Analyze the following call transcript: "${transcript}"
      Return ONLY a JSON object with the following fields:
      - summary: A one-sentence summary of the user's need.
      - sentiment: Either "Positive", "Neutral", or "Negative".
      - priority: Either "High", "Medium", or "Low" based on urgency.
      - category: The best matching department from [SBI, IT, Insurance, Job Consulting].
    `;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Attempt to parse JSON
    try {
      return JSON.parse(text);
    } catch (parseErr) {
      console.warn("AI returned non-JSON response, attempting manual parse.");
      return {
        summary: text.substring(0, 100),
        sentiment: "Neutral",
        priority: "Medium",
        category: "General"
      };
    }
  } catch (error) {
    console.error("Error generating insights:", error);
    return {
      summary: "Error processing transcript.",
      sentiment: "Neutral",
      priority: "Low",
      category: "General"
    };
  }
};

module.exports = {
  getGreeting,
  generateCallSummary
};
