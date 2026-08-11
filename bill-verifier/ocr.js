// OCR and image processing module

class OCRProcessor {
    /**
     * Extract data from bill image
     * Uses pattern recognition to find key fields
     */
    static async extractBillData(imageData) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                // Create canvas to analyze image
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                // Get image data for processing
                const imageDataArray = ctx.getImageData(0, 0, canvas.width, canvas.height);

                // Extract text regions (simplified approach)
                const extractedData = this.analyzeImageRegions(imageDataArray, img.width, img.height);

                resolve(extractedData);
            };
            img.src = imageData;
        });
    }

    /**
     * Analyze different regions of the image
     */
    static analyzeImageRegions(imageData, width, height) {
        const result = {
            subscriptionNumber: null,
            billNumber: null,
            consumptionValue: null,
            subscriberName: null,
            rawText: '',
            confidence: 0
        };

        // This is a placeholder for actual OCR
        // In production, use Tesseract.js library
        // For now, return basic structure

        return result;
    }

    /**
     * Detect text in image using simple pattern matching
     */
    static async detectPatterns(imageData) {
        const patterns = {
            subscriptionNumber: /رقم\s*الاشتراك\s*[:：]\s*(\d+)/gi,
            billNumber: /رقم\s*الفاتورة\s*[:：]\s*(\d+)/gi,
            consumptionValue: /قيمة\s*الاستهلاك\s*[:：]\s*([\d.]+)/gi,
            subscriberName: /اسم\s*المشترك\s*[:：]\s*([^\n]+)/gi
        };

        const result = {};

        for (const [key, pattern] of Object.entries(patterns)) {
            const match = pattern.exec(imageData);
            result[key] = match ? match[1] : null;
        }

        return result;
    }

    /**
     * Load Tesseract.js for better OCR
     */
    static async initTesseract() {
        if (!window.Tesseract) {
            // Load Tesseract from CDN if not available
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js';
            document.head.appendChild(script);
            
            return new Promise((resolve) => {
                script.onload = () => {
                    resolve(window.Tesseract);
                };
            });
        }
        return window.Tesseract;
    }

    /**
     * Extract text from image using Tesseract (if available)
     */
    static async extractTextWithTesseract(imageData) {
        try {
            const Tesseract = await this.initTesseract();
            
            if (Tesseract && Tesseract.recognize) {
                const result = await Tesseract.recognize(
                    imageData,
                    'ara+eng', // Arabic and English
                    {
                        logger: (m) => console.log('OCR Progress:', m)
                    }
                );

                return {
                    text: result.data.text,
                    confidence: result.data.confidence
                };
            }
        } catch (error) {
            console.error('Tesseract OCR error:', error);
        }

        return {
            text: '',
            confidence: 0
        };
    }

    /**
     * Validate extracted data
     */
    static validateExtractedData(data) {
        const validation = {
            isValid: false,
            errors: []
        };

        if (!data.subscriptionNumber) {
            validation.errors.push('لم يتم العثور على رقم الاشتراك');
        }

        if (!data.billNumber) {
            validation.errors.push('لم يتم العثور على رقم الفاتورة');
        }

        if (!data.consumptionValue) {
            validation.errors.push('لم يتم العثور على قيمة الاستهلاك');
        }

        validation.isValid = validation.errors.length === 0;

        return validation;
    }

    /**
     * Extract numbers from text
     */
    static extractNumbers(text) {
        if (!text) return [];
        const numbers = text.match(/\d+/g);
        return numbers ? numbers.map(Number) : [];
    }

    /**
     * Extract Arabic/English text
     */
    static extractText(text) {
        if (!text) return '';
        return text.replace(/[^\u0600-\u06FF\u0020-\u007Ea-zA-Z0-9]/g, '').trim();
    }

    /**
     * Clean and normalize extracted text
     */
    static normalizeExtractedText(text) {
        if (!text) return '';
        
        // Remove extra spaces
        text = text.replace(/\s+/g, ' ').trim();
        
        // Remove special characters but keep Arabic and English
        text = text.replace(/[^\u0600-\u06FF\u0020a-zA-Z0-9._\-]/g, '');
        
        return text;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OCRProcessor;
}