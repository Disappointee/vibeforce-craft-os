const fs = require('fs');
const path = require('path');

/**
 * CSV Bridge
 * 
 * Liest awork CSV-Dateien und wandelt sie in JSON-Objekte um,
 * die vom Transformer verarbeitet werden können.
 */

class CsvBridge {
    /**
     * Liest eine CSV-Datei und gibt ein Array von Objekten zurück.
     * Nutzt ein einfaches Split-Verfahren (für den Test ausreichend).
     */
    static parse(filePath) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Datei nicht gefunden: ${filePath}`);
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim());
        const data = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = values[index];
            });
            return obj;
        });

        return data;
    }
}

module.exports = { CsvBridge };
