const Tesseract = require('tesseract.js');
const sharp = require('sharp');

class OCRService {
  constructor() {
    this.worker = null;
    this.initializeWorker();
  }

  async initializeWorker() {
    try {
      this.worker = await Tesseract.createWorker();
      await this.worker.loadLanguage('eng');
      await this.worker.initialize('eng');
      console.log('OCR Worker initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OCR worker:', error);
    }
  }

  async preprocessImage(imageBuffer) {
    try {
      // Enhance image quality for better OCR results
      const processedImage = await sharp(imageBuffer)
        .resize(null, 800, { withoutEnlargement: true })
        .normalize()
        .sharpen()
        .greyscale()
        .png()
        .toBuffer();
      
      return processedImage;
    } catch (error) {
      console.error('Image preprocessing failed:', error);
      return imageBuffer;
    }
  }

  async extractTextFromImage(imageBuffer, options = {}) {
    try {
      if (!this.worker) {
        await this.initializeWorker();
      }

      const processedImage = await this.preprocessImage(imageBuffer);
      
      const { data: { text, confidence } } = await this.worker.recognize(processedImage, {
        tessedit_char_whitelist: options.whitelist || '',
        tessedit_pageseg_mode: options.pageSegMode || Tesseract.PSM.AUTO
      });

      return {
        text: text.trim(),
        confidence,
        success: true
      };
    } catch (error) {
      console.error('OCR extraction failed:', error);
      return {
        text: '',
        confidence: 0,
        success: false,
        error: error.message
      };
    }
  }

  async extractPatientID(imageBuffer) {
    try {
      // Specific configuration for ID card recognition
      const result = await this.extractTextFromImage(imageBuffer, {
        whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        pageSegMode: Tesseract.PSM.SINGLE_BLOCK
      });

      if (!result.success) {
        return result;
      }

      // Extract patient ID patterns (PAT followed by 6 digits)
      const patientIdPattern = /PAT\d{6}/g;
      const matches = result.text.match(patientIdPattern);

      return {
        ...result,
        patientIds: matches || [],
        primaryPatientId: matches ? matches[0] : null
      };
    } catch (error) {
      console.error('Patient ID extraction failed:', error);
      return {
        text: '',
        confidence: 0,
        success: false,
        error: error.message,
        patientIds: [],
        primaryPatientId: null
      };
    }
  }

  async extractConsultationNotes(imageBuffer) {
    try {
      // Configuration optimized for handwritten text (stylus input)
      const result = await this.extractTextFromImage(imageBuffer, {
        pageSegMode: Tesseract.PSM.AUTO
      });

      if (!result.success) {
        return result;
      }

      // Process and structure the consultation notes
      const processedNotes = this.processConsultationText(result.text);

      return {
        ...result,
        structuredNotes: processedNotes
      };
    } catch (error) {
      console.error('Consultation notes extraction failed:', error);
      return {
        text: '',
        confidence: 0,
        success: false,
        error: error.message,
        structuredNotes: null
      };
    }
  }

  processConsultationText(text) {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    const structuredNotes = {
      chiefComplaint: '',
      symptoms: [],
      examination: '',
      diagnosis: '',
      treatment: '',
      prescription: [],
      followUp: '',
      rawText: text
    };

    // Simple keyword-based extraction (can be enhanced with NLP)
    const keywords = {
      chiefComplaint: ['complaint', 'chief complaint', 'cc:', 'presenting complaint'],
      symptoms: ['symptoms', 'symptom', 'presents with', 'complains of'],
      examination: ['examination', 'exam', 'pe:', 'physical exam'],
      diagnosis: ['diagnosis', 'dx:', 'impression', 'assessment'],
      treatment: ['treatment', 'plan', 'rx:', 'prescription'],
      followUp: ['follow up', 'followup', 'next visit', 'review']
    };

    lines.forEach(line => {
      const lowerLine = line.toLowerCase();
      
      for (const [section, keywordList] of Object.entries(keywords)) {
        if (keywordList.some(keyword => lowerLine.includes(keyword))) {
          if (section === 'symptoms') {
            structuredNotes[section].push(line.trim());
          } else if (section === 'prescription') {
            structuredNotes[section].push(line.trim());
          } else {
            structuredNotes[section] = line.trim();
          }
          break;
        }
      }
    });

    return structuredNotes;
  }

  async extractLabReportData(imageBuffer) {
    try {
      const result = await this.extractTextFromImage(imageBuffer);

      if (!result.success) {
        return result;
      }

      // Extract structured lab data
      const labData = this.parseLabReport(result.text);

      return {
        ...result,
        labData
      };
    } catch (error) {
      console.error('Lab report extraction failed:', error);
      return {
        text: '',
        confidence: 0,
        success: false,
        error: error.message,
        labData: null
      };
    }
  }

  parseLabReport(text) {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const labData = {
      testName: '',
      parameters: [],
      patientInfo: {},
      reportDate: null,
      rawText: text
    };

    // Extract test parameters (simplified pattern matching)
    const parameterPattern = /([A-Za-z\s]+)\s*:\s*([0-9.]+)\s*([A-Za-z/%]*)\s*\(([0-9.-]+)\s*-\s*([0-9.-]+)\)/g;
    
    let match;
    while ((match = parameterPattern.exec(text)) !== null) {
      labData.parameters.push({
        name: match[1].trim(),
        value: parseFloat(match[2]),
        unit: match[3].trim(),
        normalRangeMin: parseFloat(match[4]),
        normalRangeMax: parseFloat(match[5]),
        status: this.determineParameterStatus(parseFloat(match[2]), parseFloat(match[4]), parseFloat(match[5]))
      });
    }

    return labData;
  }

  determineParameterStatus(value, min, max) {
    if (value < min) return 'Low';
    if (value > max) return 'High';
    return 'Normal';
  }

  async cleanup() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

module.exports = new OCRService();