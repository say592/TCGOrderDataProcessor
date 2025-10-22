# TCGPlayer Order Processor

Transform TCGPlayer and Manapool order data into spreadsheet-ready format.

## Live Demo

View the live application at: `https://say592.github.io/TCGOrderDataProcessor/`

## Features

- **Order Processing Mode**: Process TCGPlayer and Manapool CSV data
- **URL Generator Mode**: Convert order numbers to direct URLs
- **Set Mapping Configuration**: Manage set name to set code mappings
- Export data as CSV or copy to clipboard for pasting into spreadsheets

## Local Development

### Prerequisites

- Node.js 20.x or higher
- npm

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

This will start the development server at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production build will be created in the `dist/` directory.

## Deployment to GitHub Pages

This project is configured to automatically deploy to GitHub Pages using GitHub Actions.

### Initial Setup

1. Merge this branch into your main branch (or push directly to main)
2. Go to your repository settings on GitHub
3. Navigate to **Settings > Pages**
4. Under **Source**, select "GitHub Actions"
5. The site will automatically deploy when you push to the main branch

### Manual Deployment

You can also trigger a manual deployment:

1. Go to **Actions** tab in your GitHub repository
2. Select the "Deploy to GitHub Pages" workflow
3. Click "Run workflow"

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **GitHub Actions** - CI/CD for automatic deployment

## Project Structure

```
TCGOrderDataProcessor/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment workflow
├── src/
│   ├── App.tsx                 # Main application component
│   ├── main.tsx                # React application entry point
│   └── index.css               # Global styles with Tailwind imports
├── index.html                  # HTML template
├── vite.config.ts              # Vite configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Project dependencies
```

## Usage Instructions

### Order Processing Mode

1. Paste TCGPlayer or Manapool CSV data into the input area
2. Click "Process Orders" to transform the data
3. Review the results in the table
4. Click "Copy Data for Pasting" to copy to clipboard
5. Paste directly into your spreadsheet application

### Order Numbers to URLs Mode

1. Paste order numbers or UUIDs (one per line)
2. Supports both TCGPlayer and Manapool formats
3. Click "Generate URLs"
4. Click "Copy URLs" to copy all URLs to clipboard

### Set Mapping Configuration

1. Add custom set name to set code mappings
2. Mappings are applied automatically when processing orders
3. Helps organize and categorize your order data

## License

This project is open source and available for personal and commercial use.
