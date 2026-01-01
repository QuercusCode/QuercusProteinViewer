# QuercusProteinViewer 🧬

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

A high-performance, interactive 3D Protein Structure Viewer built for modern research. Visualize PDB structures with advanced rendering, custom coloring, and molecular analysis tools directly in your browser.

## ✨ Key Features

### 🔍 Visualization & Rendering

- **Deep Linking**: Share exact views with URLs. State (PDB ID, Representation, Coloring, Orientation) is encoded in the link.
- **Session Management**: Save your entire workspace (custom colors, view angle, settings) to a JSON file and restore it later.
- **Multimedia Export**:
  - **High-Res Snapshots**: Capture publication-quality PNG renders at 3x resolution.
  - **Movie Recording**: Record turntable animations as `.webm` or `.mp4` videos.

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)

### Installation

1. **Clone the repository**

    ```bash
    git clone https://github.com/QuercusCode/QuercusProteinViewer.git
    cd QuercusProteinViewer
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Run the development server**

    ```bash
    npm run dev
    ```

    Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🛠️ Controls

### Mouse Controls

- **Rotate**: Left Click + Drag
- **Zoom**: Scroll Wheel
- **Pan**: Right Click + Drag
- **Center View**: Ctrl + Click on an atom

### Interactive Tools

- **Measurement**: Enable measurement mode in the toolbar, then click two atoms.
- **Contact Map**: Open from the toolbar. Hover for details, click for 3D lines.

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request for new features or bug fixes.

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 📢 Acknowledgments

- **Data Source**: [RCSB PDB](https://www.rcsb.org/).
- **Visualization Engine**: [NGL Viewer](http://nglviewer.org/).
