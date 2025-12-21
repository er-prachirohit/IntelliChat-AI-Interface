# IntelliChat: Multi-Modal AI Assistant

A high-performance conversational AI interface built with Vanilla JavaScript and the Google Gemini API.

### 🚀 Features
- **Multi-Modal Support:** Upload images or documents (PDF, Text) for instant analysis.
- **Resume Parsing:** Capable of analyzing resumes and providing feedback.
- **Smart UI:** Fully responsive design with Dark and Light mode support.
- **Secure:** Built with API key protection using environment separation.

### 🛠️ Setup Instructions
1. Clone this repository.
2. Create a `config.js` file in the root directory.
3. Add your Gemini API Key:
   ```javascript
   const config = {
       GEMINI_API_KEY: "YOUR_API_KEY_HERE"
   };