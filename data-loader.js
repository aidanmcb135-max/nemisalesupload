/**
 * Handles file reading and parsing using SheetJS
 */
class DataLoader {
    static async parseExcelFile(file, logger = console.log) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    logger("Parsing spreadsheet structure...");
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                    
                    const firstSheetName = workbook.SheetNames[0];
                    logger(`Sheet found: "${firstSheetName}". Converting to JSON...`);
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    // START AT ROW 5: range: 4 (0-indexed) skips the first 4 rows
                    const rawJson = XLSX.utils.sheet_to_json(worksheet, { 
                        defval: null,
                        range: 4 
                    });
                    
                    logger(`Found ${rawJson.length} raw rows (starting from Row 5). Starting analysis...`);
                    
                    if (rawJson.length === 0) {
                        throw new Error("The spreadsheet appears to be empty or headers were not found on Row 5.");
                    }

                    const cleanedData = this.cleanAndFilterData(rawJson, logger);
                    resolve(cleanedData);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = (error) => {
                reject(error);
            };

            reader.readAsArrayBuffer(file);
        });
    }

    static cleanAndFilterData(rawData, logger = console.log) {
        const mapped = rawData.map(row => {
            // Find keys case-insensitively using a helper
            const getVal = (possibleKeys) => {
                const key = Object.keys(row).find(k =>
                    possibleKeys.some(pk => k.toLowerCase().includes(pk.toLowerCase()))
                );
                return key ? row[key] : null;
            };

            // Safely parse numbers, stripping currency symbols or commas
            const parseNumber = (val) => {
                if (typeof val === 'number') return val;
                if (typeof val === 'string') {
                    // Remove anything that isn't a digit, period, or minus sign
                    const cleaned = val.replace(/[^0-9.-]+/g, "");
                    return parseFloat(cleaned) || 0;
                }
                return 0;
            };

            // STRICT FILTERING: We intentionally ignore 'transaction type', 
            // 'transaction number', 'sales price', and 'balance' as requested.
            const customer = getVal(['customer']);
            const transactionDate = getVal(['transaction date', 'date']);
            const productSold = getVal(['product sold', 'product']);
            const description = getVal(['description']);
            const quantity = getVal(['quantity', 'qty']);
            const amount = getVal(['amount']); // specifically keep amount for revenue

            return {
                customer,
                transactionDate, // JS Date object (if cellDates: true worked) or string
                productSold,
                description,
                quantity: parseNumber(quantity),
                amount: parseNumber(amount)
            };
        });

        const filtered = mapped.filter((row, index) => {
            const hasDate = !!row.transactionDate;
            const hasProduct = !!row.productSold;

            if (!hasDate || !hasProduct) {
                if (index < 5) { // Log first few failures for debugging
                    console.warn(`Row ${index} missing required fields:`, { hasDate, hasProduct });
                }
            }
            return hasDate && hasProduct;
        });

        if (filtered.length === 0 && rawData.length > 0) {
            // Check first row keys to help user debug headers
            const sampleKeys = Object.keys(rawData[0]).join(", ");
            throw new Error(`No valid sales data found. We looked for columns like 'Transaction Date' and 'Product Sold', but we found: [${sampleKeys}]. Please check your column headers.`);
        }

        return filtered;
    }
}
