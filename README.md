# KeepToMD — Google Keep Takeout to Markdown

Local Keep bridge repo: `https://github.com/chris-obe/KeepToMD.bridge` (folder name: `KeepToMD-bridge`).

Live site: `https://keeptomd.lightpilot.co`

KeepToMD converts Google Keep Takeout exports into Obsidian-ready Markdown. It runs locally in your browser so your files never leave your device, and it offers an optional local bridge for continuous sync.

## ✨ Features

*   **Local Processing:** Conversion runs client-side in your browser for maximum privacy.
*   **Two Paths:** One-time Takeout export (recommended) or continuous sync via the local bridge.
*   **Live Preview:** See Markdown output (including linked media) before export.
*   **Conversion Preview:** Inspect converted files in a preview dialog before downloading.
*   **Customizable File Naming:** Control titles, dates, emojis, serials, filler text, and formats.
*   **Markdown Formatting Presets:** Save and reuse formatting presets (tags, checklists, etc.).
*   **Export Options:** Download as `.zip` or export to a folder (desktop browsers).
*   **Run History & Hashing:** Tracks past conversions to prevent duplicate runs.
*   **Theme Toggle:** Light/dark mode support.

## 🚀 Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites

*   Node.js (LTS version recommended)
*   npm (comes with Node.js) or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone <https://github.com/chris-obe/KeepToMD.git>
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

Contributions, issues, and feature requests are welcome. Please open an issue at:
`https://github.com/chris-obe/KeepToMD/issues`

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
