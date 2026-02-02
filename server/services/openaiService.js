const axios = require('axios');

class OpenAIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseUrl = 'https://api.openai.com/v1';
  }

  async generateLabReportSummary(labResults) {
    try {
      const prompt = `
        Analyze these lab results and provide a clinical summary:
        ${JSON.stringify(labResults, null, 2)}
        
        Please provide:
        1. Key findings
        2. Clinical recommendations
        3. Risk assessment
        4. Follow-up suggestions
      `;

      const response = await axios.post(`${this.baseUrl}/chat/completions`, {
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a medical AI assistant specializing in lab result analysis."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        summary: response.data.choices[0].message.content,
        source: 'OpenAI GPT-4'
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      // Fallback to simulated AI
      return require('./aiService').generateLabReportSummary(labResults);
    }
  }

  async predictHealthScore(patientData) {
    try {
      const prompt = `
        Based on this patient data, calculate a health score (0-100) and identify risk factors:
        Age: ${patientData.age}
        Chronic Conditions: ${patientData.chronicConditions?.join(', ') || 'None'}
        Recent Lab Results: ${JSON.stringify(patientData.recentLabResults || [])}
        
        Provide:
        1. Health score (0-100)
        2. Risk factors
        3. Recommendations
        4. Predictions
      `;

      const response = await axios.post(`${this.baseUrl}/chat/completions`, {
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a medical AI specializing in health risk assessment."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.2
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      // Parse the response and format it
      const aiResponse = response.data.choices[0].message.content;
      
      return {
        score: this.extractHealthScore(aiResponse),
        analysis: aiResponse,
        source: 'OpenAI GPT-4'
      };
    } catch (error) {
      console.error('OpenAI health prediction error:', error);
      // Fallback to simulated AI
      return require('./aiService').predictHealthScore(patientData);
    }
  }

  extractHealthScore(text) {
    const scoreMatch = text.match(/health score[:\s]*(\d+)/i);
    return scoreMatch ? parseInt(scoreMatch[1]) : 75; // Default score
  }
}

module.exports = new OpenAIService();