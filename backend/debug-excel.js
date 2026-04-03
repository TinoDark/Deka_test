const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'test-inventory.xlsx');
console.log('Chemin du fichier:', filePath);
console.log('Fichier existe:', fs.existsSync(filePath));

if (fs.existsSync(filePath)) {
  const workbook = XLSX.readFile(filePath);
  console.log('Feuilles:', workbook.SheetNames);

  const worksheetName = workbook.SheetNames.find((name) => name.toLowerCase() === 'inventaire') || workbook.SheetNames[0];
  console.log('Feuille utilisée:', worksheetName);

  const worksheet = workbook.Sheets[worksheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet);
  console.log('Nombre de lignes:', rawData.length);
  console.log('Données brutes:');
  rawData.forEach((row, index) => {
    console.log(`Ligne ${index + 1}:`, row);
  });
} else {
  console.log('Fichier non trouvé');
}