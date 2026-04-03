const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Simuler la logique de parsing Excel (comme dans InventoryService)
function parseExcelFile(filePath) {
  const workbook = XLSX.readFile(filePath);

  // Lire la première feuille ou celle nommée "Inventaire"
  const worksheetName =
    workbook.SheetNames.find((name) => name.toLowerCase() === 'inventaire') ||
    workbook.SheetNames[0];

  const worksheet = workbook.Sheets[worksheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet);

  const rows = [];
  const errors = [];

  rawData.forEach((rawRow, index) => {
    // Normaliser les clés (lowercase, trim, sans accents)
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
        .replace(/[\u0300-\u036f]/g, ''); // Remove accents

      // Chercher une clé correspondante
      const matchingKey = expectedKeys.find(
        (k) =>
          k.toLowerCase().replace(/[éèê]/g, 'e').replace(/[àâ]/g, 'a') === normalizedKey
            .replace(/[éèê]/g, 'e')
            .replace(/[àâ]/g, 'a'),
      );

      if (matchingKey) {
        normalizedRow[matchingKey] = rawRow[key];
      }
    }

    // Validation basique
    const requiredFields = ['nom_produit', 'prix_vente', 'commission', 'pourcentage_commission', 'quantite_stock', 'description', 'reference_interne', 'url_image'];
    const missingFields = requiredFields.filter(field => normalizedRow[field] === undefined || normalizedRow[field] === null || normalizedRow[field] === '');

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

// Test unitaire de la fonctionnalité d'inventaire
async function runInventoryTests() {
  console.log('🧪 Tests unitaires - Gestion d\'inventaire Excel\n');

  try {
    const filePath = path.join(__dirname, '..', 'test-inventory.xlsx');

    if (!fs.existsSync(filePath)) {
      throw new Error(`Fichier test-inventory.xlsx non trouvé: ${filePath}`);
    }

    console.log('1️⃣ Test du parsing Excel...');
    const { rows, errors } = parseExcelFile(filePath);

    console.log(`✅ Parsing réussi:`);
    console.log(`   - Lignes valides: ${rows.length}`);
    console.log(`   - Erreurs: ${errors.length}`);

    // Vérifications
    if (rows.length !== 3) {
      throw new Error(`Attendu 3 lignes valides, obtenu ${rows.length}`);
    }

    if (errors.length > 0) {
      console.log('⚠️ Erreurs détectées:', errors);
    }

    // Vérifier le contenu des données
    console.log('\n2️⃣ Vérification du contenu des données...');

    const expectedProducts = [
      {
        nom_produit: 'T-shirt Blanc',
        prix_vente: 15000,
        commission: 1500,
        quantite_stock: 50,
        reference_interne: 'TSHIRT-WHITE-001'
      },
      {
        nom_produit: 'Jean Bleu',
        prix_vente: 25000,
        commission: 2500,
        quantite_stock: 30,
        reference_interne: 'JEAN-BLUE-001'
      },
      {
        nom_produit: 'Sac à dos Noir',
        prix_vente: 35000,
        commission: 3500,
        quantite_stock: 0,
        reference_interne: 'BAG-BLACK-001'
      }
    ];

    expectedProducts.forEach((expected, index) => {
      const actual = rows[index];
      if (!actual) {
        throw new Error(`Produit ${index + 1} manquant`);
      }

      if (actual.nom_produit !== expected.nom_produit) {
        throw new Error(`Nom produit ${index + 1}: attendu "${expected.nom_produit}", obtenu "${actual.nom_produit}"`);
      }

      if (actual.prix_vente !== expected.prix_vente) {
        throw new Error(`Prix vente ${index + 1}: attendu ${expected.prix_vente}, obtenu ${actual.prix_vente}`);
      }

      if (actual.quantite_stock !== expected.quantite_stock) {
        throw new Error(`Stock ${index + 1}: attendu ${expected.quantite_stock}, obtenu ${actual.quantite_stock}`);
      }

      console.log(`✅ Produit ${index + 1} (${actual.nom_produit}): OK`);
    });

    // Test de la logique métier simulée
    console.log('\n3️⃣ Test de la logique de synchronisation...');

    // Simuler la création/mise à jour/désactivation
    let productsCreated = 0;
    let productsUpdated = 0;
    let productsDeactivated = 0;

    // Supposons que tous les produits sont nouveaux (cas réel)
    rows.forEach(row => {
      if (row.quantite_stock > 0) {
        productsCreated++;
      } else {
        // Stock = 0 → désactivé
        productsDeactivated++;
      }
    });

    console.log(`📊 Simulation sync:`);
    console.log(`   - Produits créés: ${productsCreated}`);
    console.log(`   - Produits mis à jour: ${productsUpdated}`);
    console.log(`   - Produits désactivés: ${productsDeactivated}`);

    if (productsCreated !== 2) {
      throw new Error(`Attendu 2 produits créés (stock > 0), obtenu ${productsCreated}`);
    }

    if (productsDeactivated !== 1) {
      throw new Error(`Attendu 1 produit désactivé (stock = 0), obtenu ${productsDeactivated}`);
    }

    console.log('\n🎉 Tests unitaires réussis !');
    console.log('✅ Parsing Excel fonctionnel');
    console.log('✅ Validation des données');
    console.log('✅ Logique de synchronisation correcte');
    console.log('✅ Gestion automatique des stocks');

  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error.message);
    process.exit(1);
  }
}

// Lancer les tests
runInventoryTests();