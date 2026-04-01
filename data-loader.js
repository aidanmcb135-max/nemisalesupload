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
        let lastCustomer = null;

        const mapped = rawData.map((row, index) => {
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
                    const cleaned = val.replace(/[^0-9.-]+/g, "");
                    return parseFloat(cleaned) || 0;
                }
                return 0;
            };

            let customer = getVal(['customer', 'client', 'name']);
            const transactionDate = getVal(['transaction date', 'date', 'trans date']);
            const productSold = getVal(['product sold', 'product', 'item']);
            const quantity = getVal(['quantity', 'qty']);
            const amount = getVal(['amount', 'revenue', 'value']);

            // IGNORE rows that are clearly subtotals or empty filler
            const rowString = JSON.stringify(row).toLowerCase();
            if (rowString.includes("total") && !productSold) {
                return null;
            }

            // FORWARD FILL CUSTOMER
            if (customer && String(customer).trim().length > 0) {
                lastCustomer = String(customer).trim();
            } else if (transactionDate) {
                customer = lastCustomer;
            }

            // DATE PARSING: Handle Excel Dates vs String DD/MM/YYYY
            let dateObj = transactionDate;
            if (typeof transactionDate === 'string' && transactionDate.includes('/')) {
                const parts = transactionDate.split('/');
                if (parts.length === 3) {
                    // Create date from DD/MM/YYYY
                    dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
                }
            }

            return {
                customer: customer || 'Unknown',
                transactionDate: dateObj,
                productSold,
                quantity: parseNumber(quantity),
                amount: parseNumber(amount)
            };
        }).filter(r => r !== null);

        const filtered = mapped.filter((row, index) => {
            const hasDate = !!row.transactionDate;
            const hasProduct = !!row.productSold;

            if (!hasDate || !hasProduct) {
                if (index < 5 && rawData.length > 5) {
                    console.warn(`Row ${index} missing required fields:`, { hasDate, hasProduct });
                }
            }
            return hasDate && hasProduct;
        });

        if (filtered.length === 0 && rawData.length > 0) {
            // Check first row keys to help user debug headers
            const sampleKeys = Object.keys(rawData[0]).join(", ");
            throw new Error(`No valid sales data found starting at Row 5. We found these headers: [${sampleKeys}]. Please make sure columns like "Transaction Date" and "Product Sold" are on Row 5.`);
        }

        return filtered;
    }
}
