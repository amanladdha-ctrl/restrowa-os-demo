# Menu Import Workflow

This is the practical low-cost path for onboarding restaurant menus.

## Current Working Format

Use `menu-imports/example-menu-import.json` as the ready-to-import format.

Import command:

```bash
npm run menu:import -- menu-imports/example-menu-import.json
```

The JSON file supports:

- Restaurant slug
- Categories
- Menu item name
- Price
- Veg type: `veg`, `non_veg`, or `egg`
- Description
- Image URL
- Availability
- Popular/recommended flags
- Sort order

## Near-Term Dashboard Flow

Later, Super Admin and Restaurant Owner should get a dashboard upload screen:

- Upload JSON/CSV menu file
- Preview categories and items before saving
- Validate missing prices, duplicate names, and invalid image URLs
- Import into the correct restaurant only

## PDF, Photo, Or DOC Menu Flow

For menus sent by restaurants as PDF, image, or document:

1. Extract text from PDF/DOC/photo.
2. Convert it into the ready-to-import JSON format.
3. Manually review categories, prices, veg/non-veg, and spelling.
4. Add image URLs manually at first.
5. Import using the script or future dashboard importer.

Future automation can use OCR/AI to read PDF/photos, but we should keep human review before publishing because menu mistakes hurt trust quickly.

## Image Strategy

MVP:

- Use restaurant-provided image URLs where available.
- Use demo food image URLs when needed.
- Leave image blank for placeholder.

Later:

- Upload images into a restaurant folder.
- Select image per dish from dashboard.
- Store optimized images in Cloudinary or Supabase Storage.
