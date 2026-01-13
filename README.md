# KeepToMD — Google Keep Takeout to Markdown

Local Keep bridge repo: `https://github.com/chris-obe/KeepToMD.bridge` (folder name: `KeepToMD-bridge`).

This application provides a streamlined solution for converting your Google Keep takeout data into Obsidian-compatible Markdown files. Designed with privacy and user control in mind, it processes all files locally in your browser, ensuring your data never leaves your device.

## ✨ Features

*   **Local Processing:** All conversion happens client-side in your browser, ensuring complete data privacy and security.
*   **Intuitive Interface:** A clean, step-by-step UI guides you through the import, processing, and download stages.
*   **Customizable File Naming:** Define your own rules for how converted Markdown files are named, including:
    *   Adding emojis.
    *   Including filler text.
    *   Applying date formats.
    *   Generating serial numbers for notes.
*   **Markdown Presets:** Save and load custom Markdown formatting preferences to apply consistent styling.
*   **Progress Tracking:** Monitor the conversion process with a progress bar and real-time updates on the file currently being processed.
*   **Theme Toggle:** Switch between light and dark modes for a comfortable viewing experience.
*   **History Management:** Local storage for conversion history and user preferences.
*   **Error Handling:** Robust handling for common issues like hydration mismatches and build failures.

## 🚀 Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites

*   Node.js (LTS version recommended)
*   npm (comes with Node.js) or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone <your-repo-url>
    cd KeepToMD
    ```
2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```

### Local Development

1.  Run the development server:
    ```bash
    npm run dev
    # or
    yarn dev
    ```
2.  Open your browser to `http://localhost:9002`.

### Building for Production

To create a production-ready build (static export for Cloudflare Pages):
```bash
npm run build
# or
yarn build
```
The exported site is generated in `out/`.

## 🛠 Technologies Used

*   **Next.js:** React framework for production.
*   **TypeScript:** Type-safe JavaScript.
*   **Tailwind CSS:** Utility-first CSS framework for rapid UI development.
*   **Shadcn UI:** Reusable UI components.
*   **Git:** Version control.
*   **Cloudflare Pages:** Static hosting for the exported site.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check [issues page](link-to-issues-page-if-any) if you have any ideas.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
