# QuercusProteinViewer 🧬

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

A high-performance, interactive 3D Protein Structure Viewer built for modern research. Visualize PDB structures with advanced rendering, custom coloring, and molecular analysis tools directly in your browser.

## ✨ Key Features

### 🔍 Visualization & Rendering

- **Dual Loading Modes**: Fetch structures instantly from **RCSB PDB** by ID or drag & drop local `.pdb` / `.cif` files.
- **Rich Representations**: Switch between professional styles: **Cartoon**, **Ball & Stick**, **Spacefill**, **Licorice**, **Surface**, and **Backbone**.
- **Surface Overlay**: Toggle transparent molecular surfaces to visualize pockets and topology.
- **Spin & Auto-Rotate**: Animate the protein for presentations or structural overview.

### 🎨 Advanced Coloring & Theming

- **Dynamic Coloring**: Color by **Chain ID**, **Element**, **Residue Type**, **Secondary Structure**, **Hydrophobicity**, or **B-factor**.
- **Custom Color Rules**: Create complex selection rules (e.g., "Chain A residues 10-50") and assign custom colors interactively.
- **Light/Dark Mode**: Toggle between a sleek dark interface for low-light work and a clean light theme for presentation/print.

### 📉 Analysis Tools

- **Interactive Contact Map**:
  - Visualize residue-residue interactions as a 2D heatmap.
  - **Interaction Guessing**: Tooltips automatically predict interactions (Salt Bridges, Disulfides, Hydrophobic, Pi-Stacking).
  - **3D Sync**: Clicking a pixel on the map draws a connection line between the residues in the 3D viewer.
- **Distance Measurement**: Click any two atoms to measure the precise Angstrom distance.
- **Sequence Viewer**: Browse the amino acid sequence, hover to identify residues, and click to highlight them in 3D.
- **Ligand Focus**: Automatically detect and zoom into ligand binding sites.

### 🤖 Dr. AI Analyst (V7)

- **Real-Time Intelligence**: Integrated with **Google Gemini 1.5 Flash** for natural language understanding and complex reasoning.
- **Deep Context**: The AI "sees" what you see—it knows the PDB ID, chains, composition, and your selected residues.
- **Biological Insight**: Automatically fetches data from **UniProt** to explain protein function and highlight active sites/domains.
- **Viewer Control**: Ask the AI to "Show me hydrophobic residues" or "Color by charge", and it will autonomously control the 3D viewer.
- **Privacy First**: Uses a "Bring Your Own Key" model (Settings Panel) to ensure your API usage is private and secure.

### 💾 Sharing & Export

- **Deep Linking**: Share exact views with URLs. State (PDB ID, Representation, Coloring, Orientation) is encoded in the link.
- **Session Management**: Save your entire workspace to a JSON file and restore it later.
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
