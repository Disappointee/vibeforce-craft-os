/**
 * Awork Migration Test Runner (v2)
 * 
 * Diese Datei bereitet den Testlauf der Import-Middleware vor.
 * Sie nutzt die CSV-Exporte aus dem 'Vibeforce' Ordner und simuliert den Import.
 * 
 * VORBEREITUNG:
 * 1. PocketBase muss laufen (http://127.0.0.1:8090)
 * 2. Die CSV-Dateien müssen in ../../Vibeforce/ vorhanden sein.
 */

const { Transformer } = require('./transformer');
const { CsvBridge } = require('./csv_bridge');
const path = require('path');

async function prepareTest() {
    console.log('🧪 Vorbereitung des Migrations-Tests...');
    
    const taskCsv = path.join(__dirname, '../../Vibeforce/awork_tasks_export.csv');
    const timeCsv = path.join(__dirname, '../../Vibeforce/awork_time_export.csv');

    console.log(`📂 Lade Tasks aus: ${taskCsv}`);
    const rawTasks = CsvBridge.parse(taskCsv);
    console.log(`✅ ${rawTasks.length} Tasks geladen.`);

    console.log(`📂 Lade Zeiteinträge aus: ${timeCsv}`);
    const rawTime = CsvBridge.parse(timeCsv);
    console.log(`✅ ${rawTime.length} Zeiteinträge geladen.`);

    const transformer = new Transformer();

    console.log('\n🔄 Transformationstest (Vorschau):');
    
    const tTasks = rawTasks.map(t => transformer.transformTask(t));
    console.log(`   - Tasks transformiert: ${tTasks.length}`);
    console.log(`   - Beispiel: "${tTasks[0].title}" -> Status: ${tTasks[0].status}`);

    const tTime = rawTime.map(e => transformer.transformTimeEntry(e));
    console.log(`   - Zeiteinträge transformiert: ${tTime.length}`);
    console.log(`   - Beispiel: "${tTime[0].description}" -> ${tTime[0].duration_minutes} min`);

    console.log('\n🚀 BEREIT FÜR TESTLAUF');
    console.log('Verwende "node backend/migration/test_import.js --execute" um den echten Import zu starten.');
}

if (require.main === module) {
    prepareTest().catch(console.error);
}
