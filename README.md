# Quercus Viewer 🧬

<div align="center">
  <img src="public/logo/full-black.png#gh-light-mode-only" alt="Quercus Viewer Logo" width="200" />
  <img src="public/logo/full-white.png#gh-dark-mode-only" alt="Quercus Viewer Logo" width="200" />
</div>

<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
</div>

A professional, high-performance 3D Protein & Chemical structure viewer built for modern research. Visualize PDB structures with publication-quality rendering, advanced comparison tools, and intuitive customizations directly in your browser.

## ✨ New in v1.0

### advanced Structural Comparison

- **Structure Superposition**: Align multiple structures (PDB IDs or local files) on top of each other to compare active sites, mutant variations, or conformational changes.
- **Multi-View System**: Split the screen into up to 4 viewports (Single, Side-by-Side, Grid) to compare distinct structures simultaneously.

### 🎨 Customization & Branding

- **Custom Residue Coloring**: Define precise coloring rules (e.g., "Chain A, residues 20-40") to highlight specific domains or interaction sites.
- **Persistent State**: Custom colors and view settings are now saved in the shared URL.
- **Adaptive Theming**: Full support for Light and Dark modes, with adaptive logos and high-contrast UI updates.
- **Brand Identity**: Featuring the new **Quercus** visual identity.

### 🤝 Support & Community

- **GitHub Issues**: Direct reporting for bugs and features.
- **Community Support**: "Buy Me a Coffee" integration for supporting development.

---

## 🔬 Core Features

### Visualization

- **Dual Loading**: Fetch typically from **RCSB PDB**, **PubChem** (CIDs), or drag & drop local files (`.pdb`, `.cif`, `.sdf`, `.mol`).
- **representations**: Cartoon, Ball & Stick (with bond order), Spacefill, Licorice, Surface, Backbone, and more.
- **Smart Detection**: Automatically handles DNA/RNA bases and small molecule bonds.

### Analysis

- **Contact Map**: 2D heatmap of residue interactions with 3D sync.
- **Measurements**: Precise Angstrom distance tools.
- **Motif Search**: Find specific sequences or substructures instantly.

### Export

- **Publication-Ready**: Export transparent, high-res PNGs (3x scaling).
- **Movies**: Record 360° turntable animations.
- **Sessions**: Save your workspace state to JSON for later use.

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- npm

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

3. **Run locally**

   ```bash
   npm run dev
   ```

   Open `http://localhost:5173`.

## 🤝 Contributing & Support

We welcome contributions! Please open an issue for bugs or feature requests.

If you find this tool useful for your work, consider supporting its development:
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-support-orange?style=for-the-badge&logo=buy-me-a-coffee)](https://buymeacoffee.com/amirmcheraghali)

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 📢 Acknowledgments

- Data: [RCSB PDB](https://www.rcsb.org/), [PubChem](https://pubchem.ncbi.nlm.nih.gov/).
- Engine: [NGL Viewer](http://nglviewer.org/).
