# 🧠 BrainFlow

«AI-powered multi-tenant collaborative digital workspace»

""Live Demo" (https://brain-flow-three.vercel.app/)
""GitHub"  (https://github.com/digvi2133-cpu/BrainFlow)

BrainFlow is a full-stack collaborative workspace designed to bring documents, real-time collaboration, and contextual AI assistance into one place.

The idea came from a simple workflow problem:

Write → switch to an AI tool → copy context → get the response → switch back → collaborate

BrainFlow reduces that friction by bringing AI directly into the workspace where the work is happening.

---

✨ The recovery flow is designed to avoid storing the raw OTP and includes expiry and verification-attempt controls.

---

🤝 Real-Time Collaboration

Real-time collaboration is implemented using Socket.IO and Yjs.

The system supports:

- Collaborative document updates
- Presence events
- Real-time communication
- Workspace-aware events

Real-time communication is treated as part of the application's authorization model rather than simply exposing client-supplied workspace or document identifiers.

---

🤖 AI Workflow

BrainFlow keeps AI actions close to the document workflow.

Instead of:

Document → Copy → External AI Tool → Paste → Document

the intended workflow becomes:

Document
   ↓
Select / Work With Content
   ↓
BrainFlow AI
   ↓
Choose Action
   ↓
Generate Result
   ↓
Continue Editing

This makes AI assistance a part of the workspace instead of a separate destination.

---

🌐 Live Demo

🚀 Try BrainFlow

https://brain-flow-three.vercel.app/

💻 Source Code

https://github.com/digvi2133-cpu/BrainFlow

---

⚙️ Local Development

1. Clone the repository

git clone https://github.com/digvi2133-cpu/BrainFlow.git

cd BrainFlow

2. Backend setup

cd backend
npm install

Create:

backend/.env

using the provided example:

backend/.env.example

Configure the required MongoDB and JWT environment variables.

For AI functionality, configure:

OPENAI_API_KEY

SMTP variables can be configured for email-based password recovery.

Start the backend:

npm run dev

3. Frontend setup

Open another terminal:

cd frontend
npm install
npm run dev

The frontend and backend can then be run independently during development.

For the complete environment configuration, refer to ""SETUP.md"" (./SETUP.md).

---

📌 Engineering Focus

BrainFlow was built with emphasis on:

- Full-stack architecture
- Multi-tenant application design
- Authentication and authorization
- Secure password recovery
- Persistent data modeling
- Real-time communication
- Collaborative editing
- Contextual AI integration
- Activity and usage tracking
- Maintainable frontend/backend separation

The project was not built simply as a UI prototype. The goal was to understand how the different parts of a real product connect:

«Users → Workspaces → Permissions → Documents → Real-Time Systems → AI → Persistence»

---

🎯 Project Goal

BrainFlow is an exploration of how AI can become a native part of collaborative work instead of another tool users need to open separately.

The project focuses on reducing context switching while learning and applying real-world concepts in:

software architecture, security, real-time systems, databases, AI integration, and product development.

---

📄 License

This project is currently intended as a personal portfolio
