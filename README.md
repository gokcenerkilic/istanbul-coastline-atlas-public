# Istanbul Coastline Atlas

An interactive 2D/3D mapping platform for visualizing and documenting Istanbul's coastline development, featuring community contributions, multimedia content, and district-level information.

## Features

- **2D/3D Map Views** - Toggle between flat and terrain-enhanced 3D visualization using Mapbox GL JS
- **Interactive District Layers** - Hover over development zones (R1, D1, D2, A1, A2, G1, G2, GCL2) to view detailed information
- **Community Contributions** - Users can submit photos, videos, and audio recordings with location markers
- **Drawing Tools** - Freehand drawing capability to mark areas of interest on the map
- **Text Annotations** - Add contextual notes and descriptions to specific locations
- **Bilingual Support** - Full Turkish and English language support
- **Media Gallery** - Browse and filter community-submitted content by type and location

## Tech Stack

- **Frontend**: React 18 + Vite
- **Mapping**: Mapbox GL JS, react-map-gl
- **UI**: Tailwind CSS, Radix UI, Lucide Icons
- **Backend**: Base44 SDK for data management
- **Forms**: React Hook Form + Zod validation

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
├── components/atlas/    # Map components and controls
├── pages/              # Main application pages
└── api/                # Base44 API integration
```

## Contributing

This project documents Istanbul's coastal development and welcomes community contributions through the built-in submission system.

## License

MIT