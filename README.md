# TestAPI – API Tester for VS Code

**TestAPI** is a lightweight API testing tool built directly into VS Code.  
No need to switch to external apps like Postman or Thunder Client — you can test APIs in your editor.

---

## ✨ Features

- 🔑 **Authentication Support**  
  Easily add headers for token or API key authentication.

- 📡 **Send Requests**  
  Supports `GET`, `POST`, `PUT`, `DELETE` and more.

- 📂 **Multi-Media Support**  
  Upload JSON, files, or raw data in request bodies.

- 📝 **Body Editor**  
  Clean editor with syntax highlighting for request bodies.

- 🔄 **Tabs for Requests**  
  Open and switch between multiple API requests in tabs.

- 📊 **Response Viewer**  
  See response status, headers, and body formatted (JSON pretty-print).

---

## 🚀 Getting Started

1. Install the extension in VS Code (from `.vsix` or Marketplace).
2. Open the **TestAPI** panel in the Activity Bar.
3. Create a new request:
   - Select HTTP method.
   - Enter your API URL.
   - Add headers or body if needed.
4. Hit **Send** 🚀 and see the response instantly.

---

## 🛠️ Development

To build and run locally:

```bash
# Install dependencies
npm install

# Compile the extension
npm run compile

# Package the extension
vsce package
