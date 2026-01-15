# Quercus Viewer 🧬

<div align="center">
  <img src="public/logo/full-black.png#gh-light-mode-only" alt="Quercus Viewer Logo" width="600" />
  <img src="public/logo/full-white.png#gh-dark-mode-only" alt="Quercus Viewer Logo" width="600" />
</div>

<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
</div>

<br />

**Quercus Viewer** is a professional-grade 3D viewer for protein and chemical structures. Designed for researchers and students, it combines publication-quality rendering with intuitive analysis tools right in your browser.

---

## ⚡️ Key Capabilities

### 🔬 Visualization

* **Universal Loading**: Instantly load structures from **RCSB PDB**, **PubChem** (CIDs), or drag-and-drop local files (`.pdb`, `.cif`, `.sdf`, `.mol`).
* **Rich Representations**: Switch seamlessly between Cartoon, Ball & Stick, Spacefill, Surface, Licorice, Backbone, and more.
* **Smart Defaults**: Automatic recognition of DNA/RNA, ligands, and ions.
* **Multi-View**: Split the screen (Side-by-Side or Grid) to compare up to 4 structures simultaneously.

### 🧬 Analysis

* **Structure Superposition**: Visually align multiple structures to compare conformations and binding sites.
* **Contact Maps**: Interactive 2D heatmaps synced with the 3D view to explore residue interactions.
* **Measurements**: Precise distance tools (Angstroms) to measure bond lengths and proximity.
* **Sequence Viewer**: Interactive sequence track to highlight and select specific residues.

### 🎨 Customization & Export

* **Advanced Coloring**: Color by Chain, Residue, Element, Hydrophobicity, B-Factor, or define custom selection rules (e.g., "Chain A, 10-50").
* **Publication-Ready Export**: Save transparent, high-resolution (3x) PNG images.
* **Turntable Recording**: Generate smooth 360° video loops for presentations.
* **Playlists**: Organize and save collections of structures for quick access.

---

## 🚀 Quick Start

Get running in seconds:

```bash
# 1. Clone
git clone https://github.com/QuercusCode/QuercusProteinViewer.git
cd QuercusProteinViewer

# 2. Install
npm install

# 3. Launch
npm run dev
```

Open `http://localhost:5173` to start viewing.

---

## 🤝 Support

If you find this tool useful, consider supporting its development!

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-support-orange?style=for-the-badge&logo=buy-me-a-coffee)](https://buymeacoffee.com/amirmcheraghali)

## 📄 License

MIT License. Data providers: [RCSB PDB](https://www.rcsb.org/), [PubChem](https://pubchem.ncbi.nlm.nih.gov/). Engine: [NGL Viewer](http://nglviewer.org/).
