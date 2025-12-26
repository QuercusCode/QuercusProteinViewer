# QuercusProteinViewer 🧬

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

A high-performance, modern 3D Protein Structure Viewer built for speed and usability. Visualize PDB structures with advanced rendering, custom coloring, and molecular analysis tools directly in your browser.

## ✨ Features

- **📂 Dual Loading Modes**: Instantly fetch structures from the **RCSB PDB** by ID or upload your own `.pdb` / `.cif` files locally.
- **🎨 Rich Representations**: Switch between **Cartoon**, **Ball & Stick**, **Spacefill**, **Licorice**, **Surface**, and **Backbone** views.
- **🌈 Advanced Coloring**: Color by **Chain ID**, **Element**, **Residue**, **Secondary Structure**, **Hydrophobicity**, or define **Custom Color Rules**.
- **📏 Molecular Analysis**:
  - **Distance Measurement**: Click any two atoms to measure the distance in Angstroms (Å) with visual indicators.
  - **Ligand Focus**: Automatically detect and zoom into ligand binding sites.
  - **Sequence Viewer**: Interactive protein sequence bar—hover to identify residues, click to highlight them in 3D.
- **💡 Visual Enhancements**:
  - **Light/Dark Mode**: Toggle between a sleek dark interface and a clean light theme.
  - **Surface Overlay**: Toggle transparent molecular surfaces.
  - **High-Res Export**: Capture publication-quality renders (PNG) at 3x resolution.
- **📱 Responsive Design**: Fully responsive UI with a collapsible sidebar for seamless use on tablets and desktops.

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/YOUR_USERNAME/QuercusProteinViewer.git
    cd QuercusProteinViewer
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run the development server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🛠️ Building for Production

To create a production-ready build:

```bash
npm run build
```

The output will be in the `dist/` directory, ready to be deployed to Vercel, Netlify, or GitHub Pages.

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 📢 Acknowledgments & Attribution

This project relies on the following open-source libraries and data sources:

-   **Data Source**: Protein structures are fetched from the [RCSB PDB](https://www.rcsb.org/).
    -   *Berman, H.M., Westbrook, J., Feng, Z., Gilliland, G., Bhat, T.N., Weissig, H., Shindyalov, I.N., Bourne, P.E. (2000) The Protein Data Bank Nucleic Acids Research, 28: 235-242.*
-   **Visualization**: Molecular visualization is powered by [NGL Viewer](http://nglviewer.org/).
    -   *H. Rose, A.S. Rose, (2019) NGL Viewer: web-based molecular graphics for large complexes. Bioinformatics doi:10.1093/bioinformatics/btz031*
    -   *A.S. Rose, A.R. Bradley, Y. Valasatava, J.M. Duarte, A. Prlić and P.W. Rose. NGL viewer: web-based molecular graphics for large complexes. Bioinformatics (2018) 34 (21): 3755–3758. doi:10.1093/bioinformatics/bty419*

