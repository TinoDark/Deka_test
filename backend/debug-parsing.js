const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Simuler la logique de parsing Excel avec débogage
function parseExcelFile(filePath) {
  const workbook = XLSX.readFile(filePath);

  const worksheetName =
    workbook.SheetNames.find((name) => name.toLowerCase() === 'inventaire') ||
    workbook.SheetNames[0];

  const worksheet = workbook.Sheets[worksheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet);

  const rows = [];
  const errors = [];

  rawData.forEach((rawRow, index) => {
    console.log(`\nTraitement ligne ${index + 1}:`, rawRow);

    // Normaliser les clés
    const normalizedRow = {};
    const expectedKeys = [
      'nom_produit',
      'prix_vente',
      'commission',
      'pourcentage_commission',
      'quantite_stock',
      'description',
      'caracteristique',
      'categorie',
      'reference_interne',
      'url_image',
    ];

    for (const key of Object.keys(rawRow)) {
      let normalizedKey = key
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      console.log(`  Clé originale: '${key}' -> normalisée: '${normalizedKey}'`);

      const matchingKey = expectedKeys.find(
        (k) =>
          k.toLowerCase().replace(/[éèê]/g, 'e').replace(/[àâ]/g, 'a') === normalizedKey
            .replace(/[éèê]/g, 'e')
            .replace(/[àâ]/g, 'a'),
      );

      if (matchingKey) {
        normalizedRow[matchingKey] = rawRow[key];
        console.log(`  Match trouvé: '${matchingKey}' = ${rawRow[key]}`);
      } else {
        console.log(`  Pas de match pour '${normalizedKey}'`);
      }
    }

    console.log('  Ligne normalisée:', normalizedRow);

    // Validation
    const requiredFields = ['nom_produit', 'prix_vente', 'commission', 'pourcentage_commission', 'quantite_stock', 'description', 'reference_interne', 'url_image'];
    const missingFields = requiredFields.filter(field => !normalizedRow[field]);

    console.log('  Champs requis manquants:', missingFields);

    if (missingFields.length > 0) {
      errors.push({
        row: index + 2,
        reference: normalizedRow.reference_interne || 'UNKNOWN',
        reason: `Champs manquants: ${missingFields.join(', ')}`,
      });
    } else {
      rows.push(normalizedRow);
    }
  });

  return { rows, errors };
}

const filePath = path.join(__dirname, '..', 'test-inventory.xlsx');
const { rows, errors } = parseExcelFile(filePath);

console.log(`\nRésultat final:`);
console.log(`Lignes valides: ${rows.length}`);
console.log(`Erreurs: ${errors.length}`);

if (errors.length > 0) {
  console.log('Erreurs détaillées:', errors);
}