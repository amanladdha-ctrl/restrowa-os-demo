import fs from "node:fs/promises";
import path from "node:path";
import * as XLSX from "xlsx";

const rows = [
  {
    categoryName: "Starters",
    categorySortOrder: 1,
    itemName: "Paneer Tikka",
    price: 249,
    vegType: "veg",
    description: "Smoky paneer cubes with mint chutney.",
    imageUrl: "https://example.com/paneer-tikka.jpg",
    available: "yes",
    recommended: "yes",
    popular: "yes",
    itemSortOrder: 1
  },
  {
    categoryName: "Starters",
    categorySortOrder: 1,
    itemName: "Crispy Corn",
    price: 189,
    vegType: "veg",
    description: "Crunchy corn tossed with peppers.",
    imageUrl: "https://example.com/crispy-corn.jpg",
    available: "yes",
    recommended: "no",
    popular: "yes",
    itemSortOrder: 2
  },
  {
    categoryName: "Main Course",
    categorySortOrder: 2,
    itemName: "Dal Tadka",
    price: 169,
    vegType: "veg",
    description: "Yellow dal finished with cumin tadka.",
    imageUrl: "https://example.com/dal-tadka.jpg",
    available: "yes",
    recommended: "yes",
    popular: "no",
    itemSortOrder: 1
  },
  {
    categoryName: "Main Course",
    categorySortOrder: 2,
    itemName: "Butter Naan",
    price: 35,
    vegType: "veg",
    description: "Soft tandoor naan with butter.",
    imageUrl: "https://example.com/butter-naan.jpg",
    available: "yes",
    recommended: "no",
    popular: "yes",
    itemSortOrder: 2
  },
  {
    categoryName: "Beverages",
    categorySortOrder: 3,
    itemName: "Cold Coffee",
    price: 129,
    vegType: "veg",
    description: "Cafe-style chilled coffee.",
    imageUrl: "https://example.com/cold-coffee.jpg",
    available: "yes",
    recommended: "yes",
    popular: "yes",
    itemSortOrder: 1
  }
];

async function main() {
  const publicDir = path.join(process.cwd(), "public", "templates");
  const importDir = path.join(process.cwd(), "menu-imports");

  await fs.mkdir(publicDir, { recursive: true });
  await fs.mkdir(importDir, { recursive: true });

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, "MenuTemplate");

  XLSX.writeFile(workbook, path.join(publicDir, "restrowa-menu-template.xlsx"));
  XLSX.writeFile(workbook, path.join(importDir, "restrowa-menu-template.xlsx"));

  const csv = XLSX.utils.sheet_to_csv(worksheet);
  await fs.writeFile(
    path.join(publicDir, "restrowa-menu-template.csv"),
    csv,
    "utf8"
  );
  await fs.writeFile(
    path.join(importDir, "restrowa-menu-template.csv"),
    csv,
    "utf8"
  );

  console.log("Menu templates generated.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
