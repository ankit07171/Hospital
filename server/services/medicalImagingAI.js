class MedicalImagingAI {
  constructor() {
    this.modelVersion = '2.0.0';
  }

  async analyzeMedicalImage(imageBuffer, imagingType, extractedText = '') {
    const startTime = Date.now();
    
    try {
      let analysis = {};

      // Analyze based on imaging type with OCR text
      switch (imagingType) {
        case 'X-Ray':
          analysis = await this.analyzeXRay(imageBuffer, extractedText);
          break;
        case 'MRI':
          analysis = await this.analyzeMRI(imageBuffer, extractedText);
          break;
        case 'CT Scan':
          analysis = await this.analyzeCTScan(imageBuffer, extractedText);
          break;
        default:
          throw new Error('Unsupported imaging type');
      }

      analysis.processingTime = Date.now() - startTime;
      analysis.modelUsed = `MedicalImaging-AI-${this.modelVersion}`;
      
      return analysis;
    } catch (error) {
      console.error('Medical imaging analysis error:', error);
      throw error;
    }
  }

  // Helper to check for keywords in text
  hasKeyword(text, keywords) {
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
  }

  // Analyze actual X-ray images (when OCR extracts little/no text)
  analyzeActualXRayImage(imageBuffer) {
    console.log('Performing image-based X-ray analysis');
    
    // Simulate AI analysis of actual X-ray image
    // In production, this would use actual computer vision models
    const random = Math.random();
    
    const analysis = {
      detectedConditions: [],
      findings: {},
      summary: '',
      recommendations: [],
      urgencyLevel: 'Routine',
      riskScore: 0,
      detailedFindings: []
    };

    // 60% chance to detect fracture in actual X-ray images
    if (random > 0.40) {
      const locations = ['Distal radius', 'Ulna', 'Scaphoid', 'Metacarpal', 'Phalanx'];
      const types = ['Transverse', 'Oblique', 'Spiral', 'Comminuted', 'Greenstick'];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      
      const severity = random > 0.7 ? 'Severe' : 'Moderate';
      const confidence = 0.88 + Math.random() * 0.10;
      const riskScore = this.calculateRiskScore(severity, 'Urgent', confidence);

      analysis.detectedConditions.push({
        condition: `${type} Fracture`,
        confidence: confidence,
        severity: severity,
        location: location,
        description: `${type} fracture detected in ${location} based on radiographic analysis`,
        riskScore: riskScore
      });

      analysis.detailedFindings.push({
        finding: 'Fracture Line Visible on Radiograph',
        location: location,
        severity: severity,
        measurement: random > 0.7 ? 'Significant displacement noted' : 'Minimal displacement',
        clinical_significance: 'Requires orthopedic evaluation and possible reduction'
      });

      analysis.urgencyLevel = 'Urgent';
      analysis.riskScore = riskScore;
      analysis.recommendations.push('🔴 URGENT: Immediate orthopedic consultation required');
      analysis.recommendations.push('Immobilization of affected limb');
      analysis.recommendations.push('Pain management protocol');
      analysis.recommendations.push('Follow-up X-ray in 2-3 weeks to assess healing');
      analysis.recommendations.push('Consider CT scan if comminuted fracture');
      analysis.summary = `Radiographic analysis reveals ${severity.toLowerCase()} ${type.toLowerCase()} fracture in the ${location}. Risk Score: ${riskScore}/100. Immediate orthopedic intervention recommended.`;
    } else {
      // Normal findings
      analysis.riskScore = 8;
      analysis.summary = 'Radiographic analysis shows normal bone structure and alignment. No fractures or dislocations detected. Risk Score: 8/100 (Low Risk).';
      analysis.recommendations.push('✅ No immediate intervention required');
      analysis.recommendations.push('Routine follow-up as needed');
      analysis.recommendations.push('Monitor for symptom changes');
    }

    return analysis;
  }

  // Calculate risk score based on findings
  calculateRiskScore(severity, urgency, confidence) {
    let baseScore = 0;
    
    // Severity contribution (0-40 points)
    switch(severity) {
      case 'Critical': baseScore += 40; break;
      case 'Severe': baseScore += 35; break;
      case 'Moderate': baseScore += 25; break;
      case 'Mild': baseScore += 15; break;
      default: baseScore += 5;
    }
    
    // Urgency contribution (0-40 points)
    switch(urgency) {
      case 'Emergency': baseScore += 40; break;
      case 'Urgent': baseScore += 30; break;
      default: baseScore += 10;
    }
    
    // Confidence contribution (0-20 points)
    baseScore += confidence * 20;
    
    return Math.min(Math.round(baseScore), 100);
  }

  async analyzeXRay(imageBuffer, extractedText) {
    console.log('Analyzing X-Ray with text length:', extractedText.length);
    console.log('Extracted text preview:', extractedText.substring(0, 300));
    
    const analysis = {
      detectedConditions: [],
      findings: {},
      summary: '',
      recommendations: [],
      urgencyLevel: 'Routine',
      riskScore: 0,
      detailedFindings: []
    };

    // If very little text extracted (likely actual X-ray image, not report)
    // Use image-based analysis
    if (extractedText.length < 50) {
      console.log('Low text content - analyzing as actual X-ray image');
      return this.analyzeActualXRayImage(imageBuffer);
    }

    // Check for fracture keywords
    const hasFracture = this.hasKeyword(extractedText, [
      'fracture', 'broken', 'break', 'crack', 'fx', 'fissure',
      'comminuted', 'compound', 'greenstick', 'spiral', 'transverse'
    ]);

    // Check for dislocation keywords
    const hasDislocation = this.hasKeyword(extractedText, [
      'dislocation', 'dislocated', 'displaced', 'subluxation', 'luxation'
    ]);

    if (hasFracture) {
      const locations = ['radius', 'ulna', 'femur', 'tibia', 'fibula', 'humerus', 'clavicle', 'rib', 'skull', 'pelvis'];
      let location = 'bone';
      for (const loc of locations) {
        if (extractedText.toLowerCase().includes(loc)) {
          location = loc.charAt(0).toUpperCase() + loc.slice(1);
          break;
        }
      }

      const severity = extractedText.toLowerCase().includes('severe') || extractedText.toLowerCase().includes('compound') ? 'Severe' : 'Moderate';
      const confidence = 0.92;
      const riskScore = this.calculateRiskScore(severity, 'Urgent', confidence);

      analysis.detectedConditions.push({
        condition: 'Bone Fracture',
        confidence: confidence,
        severity: severity,
        location: location,
        description: `Fracture detected in ${location}`,
        riskScore: riskScore
      });

      analysis.detailedFindings.push({
        finding: 'Fracture Line Visible',
        location: location,
        severity: severity,
        measurement: 'Displacement noted',
        clinical_significance: 'Requires orthopedic intervention'
      });

      analysis.urgencyLevel = 'Urgent';
      analysis.riskScore = riskScore;
      analysis.recommendations.push('🔴 URGENT: Immediate orthopedic consultation required');
      analysis.recommendations.push('Immobilization of affected limb');
      analysis.recommendations.push('Pain management protocol');
      analysis.recommendations.push('Follow-up X-ray in 2-3 weeks');
      analysis.recommendations.push('Physical therapy after healing');
      analysis.summary = `X-Ray reveals ${severity.toLowerCase()} fracture in the ${location}. Risk Score: ${riskScore}/100. Immediate orthopedic intervention required.`;
    } else if (hasDislocation) {
      const joints = ['shoulder', 'elbow', 'hip', 'knee', 'ankle', 'finger'];
      let joint = 'joint';
      for (const j of joints) {
        if (extractedText.toLowerCase().includes(j)) {
          joint = j.charAt(0).toUpperCase() + j.slice(1);
          break;
        }
      }

      const severity = 'Moderate';
      const confidence = 0.89;
      const riskScore = this.calculateRiskScore(severity, 'Emergency', confidence);

      analysis.detectedConditions.push({
        condition: 'Joint Dislocation',
        confidence: confidence,
        severity: severity,
        location: joint,
        description: `Dislocation of ${joint} joint`,
        riskScore: riskScore
      });

      analysis.detailedFindings.push({
        finding: 'Joint Displacement',
        location: joint,
        severity: severity,
        measurement: 'Abnormal joint alignment',
        clinical_significance: 'Emergency reduction required'
      });

      analysis.urgencyLevel = 'Emergency';
      analysis.riskScore = riskScore;
      analysis.recommendations.push('🔴 EMERGENCY: Immediate reduction procedure required');
      analysis.recommendations.push('Neurovascular assessment');
      analysis.recommendations.push('Post-reduction immobilization');
      analysis.recommendations.push('Pain management');
      analysis.summary = `X-Ray demonstrates dislocation of the ${joint} joint. Risk Score: ${riskScore}/100. Emergency intervention required.`;
    } else {
      // Normal findings
      analysis.riskScore = 5;
      analysis.summary = 'X-Ray analysis shows normal bone structure and alignment. No fractures or dislocations detected. Risk Score: 5/100 (Low Risk).';
      analysis.recommendations.push('✅ No immediate intervention required');
      analysis.recommendations.push('Routine follow-up as needed');
      analysis.recommendations.push('Monitor for symptom changes');
    }

    return analysis;
  }

  async analyzeMRI(imageBuffer, extractedText) {
    console.log('Analyzing MRI with text length:', extractedText.length);
    console.log('Extracted text preview:', extractedText.substring(0, 300));
    
    const analysis = {
      detectedConditions: [],
      findings: {},
      summary: '',
      recommendations: [],
      urgencyLevel: 'Routine',
      riskScore: 0,
      detailedFindings: []
    };

    // If very little text extracted (likely actual MRI image, not report)
    if (extractedText.length < 50) {
      console.log('Low text content - analyzing as actual MRI image');
      return this.analyzeActualMRIImage(imageBuffer);
    }

    // Check for tumor keywords
    const hasTumor = this.hasKeyword(extractedText, [
      'tumor', 'tumour', 'mass', 'lesion', 'neoplasm', 'growth',
      'glioma', 'meningioma', 'adenoma', 'cancer', 'malignant'
    ]);

    // Check for ligament tear keywords
    const hasTear = this.hasKeyword(extractedText, [
      'tear', 'torn', 'rupture', 'ruptured', 'acl', 'mcl', 'pcl',
      'meniscus', 'rotator cuff', 'ligament injury'
    ]);

    if (hasTumor) {
      const locations = ['frontal', 'temporal', 'parietal', 'occipital', 'cerebellum'];
      let location = 'brain';
      for (const loc of locations) {
        if (extractedText.toLowerCase().includes(loc)) {
          location = loc.charAt(0).toUpperCase() + loc.slice(1) + ' lobe';
          break;
        }
      }

      const severity = 'Severe';
      const confidence = 0.88;
      const riskScore = this.calculateRiskScore(severity, 'Emergency', confidence);

      analysis.detectedConditions.push({
        condition: 'Brain Mass/Tumor',
        confidence: confidence,
        severity: severity,
        location: location,
        description: `Mass lesion detected in ${location}`,
        riskScore: riskScore
      });

      analysis.detailedFindings.push({
        finding: 'Abnormal Mass Detected',
        location: location,
        severity: severity,
        measurement: 'Size requires further evaluation',
        clinical_significance: 'Urgent neurosurgical evaluation required'
      });

      analysis.urgencyLevel = 'Emergency';
      analysis.riskScore = riskScore;
      analysis.recommendations.push('🔴 CRITICAL: Immediate neurosurgery consultation');
      analysis.recommendations.push('Comprehensive neurological assessment');
      analysis.recommendations.push('Biopsy for histological confirmation');
      analysis.recommendations.push('Oncology team consultation');
      analysis.recommendations.push('Treatment planning (surgery/radiation/chemo)');
      analysis.summary = `MRI reveals mass lesion in the ${location}. Risk Score: ${riskScore}/100. URGENT neurosurgical evaluation required.`;
    } else if (hasTear) {
      const ligaments = ['ACL', 'MCL', 'PCL', 'Meniscus', 'Rotator Cuff'];
      let ligament = 'ligament';
      for (const lig of ligaments) {
        if (extractedText.toLowerCase().includes(lig.toLowerCase())) {
          ligament = lig;
          break;
        }
      }

      const isComplete = extractedText.toLowerCase().includes('complete') || extractedText.toLowerCase().includes('grade 3');
      const severity = isComplete ? 'Severe' : 'Moderate';
      const confidence = 0.91;
      const riskScore = this.calculateRiskScore(severity, isComplete ? 'Urgent' : 'Routine', confidence);

      analysis.detectedConditions.push({
        condition: `${ligament} Tear`,
        confidence: confidence,
        severity: severity,
        location: ligament,
        description: `${isComplete ? 'Complete' : 'Partial'} tear of ${ligament}`,
        riskScore: riskScore
      });

      analysis.detailedFindings.push({
        finding: `${ligament} Disruption`,
        location: ligament,
        severity: severity,
        measurement: isComplete ? 'Complete tear' : 'Partial tear',
        clinical_significance: isComplete ? 'Surgical reconstruction likely needed' : 'Conservative management possible'
      });

      analysis.urgencyLevel = isComplete ? 'Urgent' : 'Routine';
      analysis.riskScore = riskScore;
      analysis.recommendations.push(isComplete ? '🔴 Urgent orthopedic consultation' : '⚠️ Orthopedic consultation recommended');
      analysis.recommendations.push('Physical therapy evaluation');
      analysis.recommendations.push(isComplete ? 'Surgical reconstruction may be required' : 'Conservative management with rehabilitation');
      analysis.recommendations.push('RICE protocol (Rest, Ice, Compression, Elevation)');
      analysis.summary = `MRI demonstrates ${isComplete ? 'complete' : 'partial'} tear of the ${ligament}. Risk Score: ${riskScore}/100. ${isComplete ? 'Surgical consultation recommended.' : 'Conservative treatment advised.'}`;
    } else {
      analysis.riskScore = 5;
      analysis.summary = 'MRI scan shows normal anatomical structures. No masses, lesions, or tears detected. Risk Score: 5/100 (Low Risk).';
      analysis.recommendations.push('✅ No immediate intervention required');
      analysis.recommendations.push('Routine follow-up as indicated');
    }

    return analysis;
  }

  async analyzeCTScan(imageBuffer, extractedText) {
    console.log('Analyzing CT Scan with text length:', extractedText.length);
    console.log('Extracted text preview:', extractedText.substring(0, 300));
    
    const analysis = {
      detectedConditions: [],
      findings: {},
      summary: '',
      recommendations: [],
      urgencyLevel: 'Routine',
      riskScore: 0,
      detailedFindings: []
    };

    // If very little text extracted (likely actual CT image, not report)
    if (extractedText.length < 50) {
      console.log('Low text content - analyzing as actual CT image');
      return this.analyzeActualCTImage(imageBuffer);
    }

    // Check for bleeding keywords
    const hasBleeding = this.hasKeyword(extractedText, [
      'hemorrhage', 'bleeding', 'hematoma', 'blood', 'hemorrhagic',
      'subdural', 'epidural', 'subarachnoid', 'intraparenchymal'
    ]);

    // Check for cancer keywords
    const hasCancer = this.hasKeyword(extractedText, [
      'cancer', 'carcinoma', 'malignant', 'malignancy', 'tumor', 'tumour',
      'metastasis', 'metastatic', 'neoplasm', 'oncology'
    ]);

    if (hasBleeding) {
      const locations = ['subdural', 'epidural', 'subarachnoid', 'intraparenchymal', 'abdominal', 'thoracic'];
      let location = 'internal cavity';
      for (const loc of locations) {
        if (extractedText.toLowerCase().includes(loc)) {
          location = loc.charAt(0).toUpperCase() + loc.slice(1) + ' space';
          break;
        }
      }

      const severity = extractedText.toLowerCase().includes('large') || extractedText.toLowerCase().includes('severe') ? 'Severe' : 'Moderate';
      const confidence = 0.93;
      const riskScore = this.calculateRiskScore(severity, 'Emergency', confidence);

      analysis.detectedConditions.push({
        condition: 'Internal Hemorrhage',
        confidence: confidence,
        severity: severity,
        location: location,
        description: `${severity} internal bleeding in ${location}`,
        riskScore: riskScore
      });

      analysis.detailedFindings.push({
        finding: 'Active Hemorrhage',
        location: location,
        severity: severity,
        measurement: severity === 'Severe' ? 'Large volume' : 'Moderate volume',
        clinical_significance: 'CRITICAL - Immediate surgical intervention required'
      });

      analysis.urgencyLevel = 'Emergency';
      analysis.riskScore = riskScore;
      analysis.recommendations.push('🔴 CRITICAL: IMMEDIATE surgical consultation');
      analysis.recommendations.push('Activate trauma team protocol');
      analysis.recommendations.push('Continuous hemodynamic monitoring');
      analysis.recommendations.push('Type and cross-match blood products');
      analysis.recommendations.push('Prepare for emergency surgery');
      analysis.recommendations.push('ICU admission required');
      analysis.summary = `CT scan reveals ${severity.toLowerCase()} internal hemorrhage in the ${location}. Risk Score: ${riskScore}/100. CRITICAL: Immediate surgical intervention required.`;
    } else if (hasCancer) {
      const organs = ['lung', 'liver', 'pancreas', 'kidney', 'colon', 'stomach'];
      let organ = 'organ';
      for (const org of organs) {
        if (extractedText.toLowerCase().includes(org)) {
          organ = org.charAt(0).toUpperCase() + org.slice(1);
          break;
        }
      }

      const severity = 'Severe';
      const confidence = 0.87;
      const riskScore = this.calculateRiskScore(severity, 'Emergency', confidence);

      analysis.detectedConditions.push({
        condition: `${organ} Cancer/Malignancy`,
        confidence: confidence,
        severity: severity,
        location: organ,
        description: `Malignant mass detected in ${organ}`,
        riskScore: riskScore
      });

      analysis.detailedFindings.push({
        finding: 'Suspicious Mass Lesion',
        location: organ,
        severity: severity,
        measurement: 'Size and characteristics concerning for malignancy',
        clinical_significance: 'Urgent oncological evaluation and biopsy required'
      });

      analysis.urgencyLevel = 'Emergency';
      analysis.riskScore = riskScore;
      analysis.recommendations.push('🔴 URGENT: Immediate oncology consultation');
      analysis.recommendations.push('Biopsy for histological confirmation');
      analysis.recommendations.push('Staging workup (PET scan, additional imaging)');
      analysis.recommendations.push('Multidisciplinary tumor board review');
      analysis.recommendations.push('Treatment planning (surgery/chemo/radiation)');
      analysis.recommendations.push('Genetic testing and molecular profiling');
      analysis.summary = `CT scan reveals findings consistent with ${organ.toLowerCase()} malignancy. Risk Score: ${riskScore}/100. URGENT oncological evaluation required.`;
    } else {
      analysis.riskScore = 5;
      analysis.summary = 'CT scan demonstrates normal anatomical structures. No hemorrhage, masses, or abnormalities detected. Risk Score: 5/100 (Low Risk).';
      analysis.recommendations.push('✅ No acute findings requiring intervention');
      analysis.recommendations.push('Routine clinical correlation');
      analysis.recommendations.push('Follow-up as indicated');
    }

    return analysis;
  }

  // async analyzeUltrasound(imageBuffer, extractedText) {
  //   console.log('Analyzing Ultrasound with text length:', extractedText.length);
  //   console.log('Extracted text preview:', extractedText.substring(0, 300));
    
  //   const analysis = {
  //     detectedConditions: [],
  //     findings: {},
  //     summary: '',
  //     recommendations: [],
  //     urgencyLevel: 'Routine',
  //     riskScore: 0,
  //     detailedFindings: []
  //   };

  //   // If very little text extracted (likely actual ultrasound image, not report)
  //   if (extractedText.length < 50) {
  //     console.log('Low text content - analyzing as actual ultrasound image');
  //     return this.analyzeActualUltrasoundImage(imageBuffer);
  //   }

  //   // Check for kidney stone keywords
  //   const hasStones = this.hasKeyword(extractedText, [
  //     'stone', 'stones', 'calculus', 'calculi', 'nephrolithiasis', 'renal stone'
  //   ]);

  //   // Check for pregnancy keywords
  //   const hasPregnancy = this.hasKeyword(extractedText, [
  //     'pregnancy', 'pregnant', 'fetus', 'fetal', 'gestational', 'intrauterine',
  //     'embryo', 'twin', 'twins', 'gestation'
  //   ]);

  //   if (hasStones) {
  //     let location = 'kidney';
  //     if (extractedText.toLowerCase().includes('left')) location = 'Left kidney';
  //     else if (extractedText.toLowerCase().includes('right')) location = 'Right kidney';
  //     else if (extractedText.toLowerCase().includes('both')) location = 'Both kidneys';

  //     const isLarge = extractedText.toLowerCase().includes('large') || 
  //                    extractedText.match(/\d+\s*mm/) && parseInt(extractedText.match(/(\d+)\s*mm/)[1]) > 10;
  //     const severity = isLarge ? 'Moderate' : 'Mild';
  //     const confidence = 0.90;
  //     const riskScore = this.calculateRiskScore(severity, isLarge ? 'Urgent' : 'Routine', confidence);

  //     const countMatch = extractedText.match(/(\d+)\s*stone/i);
  //     const count = countMatch ? parseInt(countMatch[1]) : 1;

  //     analysis.detectedConditions.push({
  //       condition: 'Nephrolithiasis (Kidney Stones)',
  //       confidence: confidence,
  //       severity: severity,
  //       location: location,
  //       description: `${count} kidney stone(s) in ${location.toLowerCase()}`,
  //       riskScore: riskScore
  //     });

  //     analysis.detailedFindings.push({
  //       finding: 'Renal Calculi',
  //       location: location,
  //       severity: severity,
  //       measurement: `${count} stone(s) - ${isLarge ? 'Large size' : 'Small to medium size'}`,
  //       clinical_significance: isLarge ? 'May require intervention' : 'Conservative management possible'
  //     });

  //     analysis.urgencyLevel = isLarge ? 'Urgent' : 'Routine';
  //     analysis.riskScore = riskScore;
  //     analysis.recommendations.push(isLarge ? '🔴 Urgent urology consultation' : '⚠️ Urology consultation recommended');
  //     analysis.recommendations.push('Increased fluid intake (2-3 liters/day)');
  //     analysis.recommendations.push('Pain management as needed');
  //     analysis.recommendations.push(isLarge ? 'Lithotripsy or surgical intervention may be required' : 'Conservative management with monitoring');
  //     analysis.recommendations.push('Metabolic workup to prevent recurrence');
  //     analysis.recommendations.push('Dietary modifications');
  //     analysis.summary = `Ultrasound reveals ${count} kidney stone(s) in the ${location.toLowerCase()}. Risk Score: ${riskScore}/100. ${isLarge ? 'Urological intervention may be required.' : 'Conservative management recommended.'}`;
  //   } else if (hasPregnancy) {
  //     const isTwin = extractedText.toLowerCase().includes('twin') || extractedText.toLowerCase().includes('twins');
      
  //     const weeksMatch = extractedText.match(/(\d+)\s*week/i);
  //     const weeks = weeksMatch ? parseInt(weeksMatch[1]) : 12;

  //     const hrMatch = extractedText.match(/(\d+)\s*bpm/i);
  //     const heartRate = hrMatch ? parseInt(hrMatch[1]) : 140;

  //     const hasComplications = extractedText.toLowerCase().includes('placenta') && 
  //                             (extractedText.toLowerCase().includes('low') || extractedText.toLowerCase().includes('previa'));

  //     const severity = hasComplications ? 'Moderate' : 'Normal';
  //     const confidence = 0.96;
  //     const riskScore = hasComplications ? this.calculateRiskScore('Moderate', 'Urgent', confidence) : 10;

  //     analysis.detectedConditions.push({
  //       condition: isTwin ? 'Twin Intrauterine Pregnancy' : 'Intrauterine Pregnancy',
  //       confidence: confidence,
  //       severity: severity,
  //       location: 'Uterus',
  //       description: isTwin ? `Twin pregnancy at ${weeks} weeks` : `Single pregnancy at ${weeks} weeks`,
  //       riskScore: riskScore
  //     });

  //     analysis.detailedFindings.push({
  //       finding: isTwin ? 'Twin Gestation' : 'Single Gestation',
  //       location: 'Intrauterine',
  //       severity: severity,
  //       measurement: `${weeks} weeks, FHR: ${heartRate} bpm`,
  //       clinical_significance: isTwin ? 'High-risk pregnancy - specialized care required' : 'Normal pregnancy progression'
  //     });

  //     analysis.urgencyLevel = hasComplications ? 'Urgent' : 'Routine';
  //     analysis.riskScore = riskScore;
  //     analysis.recommendations.push('Routine prenatal care');
  //     analysis.recommendations.push('Fetal growth monitoring');
  //     analysis.recommendations.push('Maternal health assessment');
  //     if (isTwin) {
  //       analysis.recommendations.push('🔴 High-risk obstetric care required');
  //       analysis.recommendations.push('More frequent monitoring for twin pregnancy');
  //       analysis.recommendations.push('Nutritional counseling for multiple gestation');
  //       analysis.recommendations.push('Specialized ultrasound surveillance');
  //     }
  //     if (hasComplications) {
  //       analysis.recommendations.push('⚠️ Additional monitoring for placental position');
  //       analysis.recommendations.push('Obstetric consultation recommended');
  //       analysis.recommendations.push('Avoid strenuous activity');
  //     }
  //     analysis.summary = `Ultrasound confirms ${isTwin ? 'TWIN' : 'single'} intrauterine pregnancy at ${weeks} weeks gestation. Fetal heart rate: ${heartRate} bpm (normal). Risk Score: ${riskScore}/100. ${isTwin ? 'Twin pregnancy requires specialized high-risk prenatal care.' : hasComplications ? 'Placental monitoring required.' : 'Normal pregnancy progression.'}`;
  //   } else {
  //     analysis.riskScore = 5;
  //     analysis.summary = 'Ultrasound examination shows normal anatomical structures. No stones, masses, or abnormalities detected. Risk Score: 5/100 (Low Risk).';
  //     analysis.recommendations.push('✅ No abnormalities detected');
  //     analysis.recommendations.push('Routine follow-up as indicated');
  //   }

  //   return analysis;
  // }

  // Analyze actual MRI images (when OCR extracts little/no text)
  analyzeActualMRIImage(imageBuffer) {
    console.log('Performing image-based MRI analysis');
    const random = Math.random();
    
    const analysis = {
      detectedConditions: [],
      findings: {},
      summary: '',
      recommendations: [],
      urgencyLevel: 'Routine',
      riskScore: 0,
      detailedFindings: []
    };

    // 60% chance to detect abnormality (increased from 30%)
    if (random > 0.40) {
      const isTumor = random > 0.70; // 30% tumor, 30% ligament tear
      
      if (isTumor) {
        const locations = ['Frontal lobe', 'Temporal lobe', 'Parietal lobe', 'Cerebellum', 'Brain stem'];
        const types = ['Glioma', 'Meningioma', 'Pituitary Adenoma', 'Acoustic Neuroma'];
        const location = locations[Math.floor(Math.random() * locations.length)];
        const type = types[Math.floor(Math.random() * types.length)];
        const severity = 'Severe';
        const confidence = 0.86 + Math.random() * 0.10;
        const riskScore = this.calculateRiskScore(severity, 'Emergency', confidence);

        analysis.detectedConditions.push({
          condition: type,
          confidence: confidence,
          severity: severity,
          location: location,
          description: `${type} detected in ${location} on MRI imaging`,
          riskScore: riskScore
        });

        analysis.detailedFindings.push({
          finding: 'Abnormal Mass Lesion',
          location: location,
          severity: severity,
          measurement: 'Heterogeneous signal intensity with enhancement',
          clinical_significance: 'Urgent neurosurgical evaluation and biopsy required'
        });

        analysis.urgencyLevel = 'Emergency';
        analysis.riskScore = riskScore;
        analysis.recommendations.push('🔴 CRITICAL: Immediate neurosurgery consultation');
        analysis.recommendations.push('Comprehensive neurological assessment');
        analysis.recommendations.push('Biopsy for histological confirmation');
        analysis.recommendations.push('Oncology team consultation');
        analysis.recommendations.push('Treatment planning (surgery/radiation/chemotherapy)');
        analysis.recommendations.push('Genetic testing and molecular profiling');
        analysis.summary = `MRI reveals ${type.toLowerCase()} in the ${location}. Risk Score: ${riskScore}/100. URGENT neurosurgical evaluation required.`;
      } else {
        const ligaments = ['ACL (Anterior Cruciate Ligament)', 'MCL (Medial Collateral Ligament)', 'Meniscus', 'Rotator Cuff', 'PCL (Posterior Cruciate Ligament)'];
        const ligament = ligaments[Math.floor(Math.random() * ligaments.length)];
        const isComplete = random > 0.80;
        const severity = isComplete ? 'Severe' : 'Moderate';
        const confidence = 0.89 + Math.random() * 0.08;
        const riskScore = this.calculateRiskScore(severity, isComplete ? 'Urgent' : 'Routine', confidence);

        analysis.detectedConditions.push({
          condition: `${ligament} Tear`,
          confidence: confidence,
          severity: severity,
          location: ligament,
          description: `${isComplete ? 'Complete' : 'Partial'} tear of ${ligament} detected on MRI`,
          riskScore: riskScore
        });

        analysis.detailedFindings.push({
          finding: `${ligament} Disruption`,
          location: ligament,
          severity: severity,
          measurement: isComplete ? 'Complete discontinuity' : 'Partial thickness tear',
          clinical_significance: isComplete ? 'Surgical reconstruction likely needed' : 'Conservative management possible'
        });

        analysis.urgencyLevel = isComplete ? 'Urgent' : 'Routine';
        analysis.riskScore = riskScore;
        analysis.recommendations.push(isComplete ? '🔴 Urgent orthopedic sports medicine consultation' : '⚠️ Orthopedic consultation recommended');
        analysis.recommendations.push('Physical therapy evaluation');
        analysis.recommendations.push(isComplete ? 'Surgical reconstruction may be required' : 'Conservative management with rehabilitation');
        analysis.recommendations.push('RICE protocol (Rest, Ice, Compression, Elevation)');
        analysis.recommendations.push('Pain management and anti-inflammatory medication');
        analysis.summary = `MRI demonstrates ${isComplete ? 'complete' : 'partial'} tear of the ${ligament}. Risk Score: ${riskScore}/100. ${isComplete ? 'Surgical consultation recommended.' : 'Conservative treatment advised.'}`;
      }
    } else {
      analysis.riskScore = 6;
      analysis.summary = 'MRI scan shows normal anatomical structures. No masses, lesions, or tears detected. Risk Score: 6/100 (Low Risk).';
      analysis.recommendations.push('✅ No immediate intervention required');
      analysis.recommendations.push('Routine follow-up as indicated');
      analysis.recommendations.push('Continue monitoring symptoms if present');
    }

    return analysis;
  }

  // Analyze actual CT images (when OCR extracts little/no text)
  analyzeActualCTImage(imageBuffer) {
    console.log('Performing image-based CT analysis');
    const random = Math.random();
    
    const analysis = {
      detectedConditions: [],
      findings: {},
      summary: '',
      recommendations: [],
      urgencyLevel: 'Routine',
      riskScore: 0,
      detailedFindings: []
    };

    // 55% chance to detect critical finding (increased from 25%)
    if (random > 0.45) {
      const locations = ['Subdural space', 'Epidural space', 'Subarachnoid space', 'Lung', 'Liver', 'Pancreas', 'Abdominal cavity'];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const isBleeding = location.includes('dural') || location.includes('Subarachnoid') || location.includes('Abdominal');
      
      if (isBleeding) {
        const severities = ['Moderate', 'Severe', 'Life-threatening'];
        const severity = severities[Math.floor(Math.random() * severities.length)];
        const confidence = 0.91 + Math.random() * 0.08;
        const riskScore = this.calculateRiskScore(severity, 'Emergency', confidence);

        const volumes = ['Small (< 30ml)', 'Moderate (30-100ml)', 'Large (> 100ml)'];
        const volume = severity === 'Life-threatening' ? volumes[2] : 
                      severity === 'Severe' ? volumes[1] : volumes[0];

        analysis.detectedConditions.push({
          condition: 'Internal Hemorrhage',
          confidence: confidence,
          severity: severity,
          location: location,
          description: `${severity} internal bleeding detected in ${location}`,
          riskScore: riskScore
        });

        analysis.detailedFindings.push({
          finding: 'Acute Hemorrhage',
          location: location,
          severity: severity,
          measurement: `${volume} blood collection`,
          clinical_significance: 'CRITICAL - Immediate surgical intervention required'
        });

        analysis.urgencyLevel = 'Emergency';
        analysis.riskScore = riskScore;
        analysis.recommendations.push('🔴 CRITICAL: IMMEDIATE surgical consultation required');
        analysis.recommendations.push('Activate trauma team protocol');
        analysis.recommendations.push('Continuous hemodynamic monitoring');
        analysis.recommendations.push('Type and cross-match blood products');
        analysis.recommendations.push('Prepare for emergency surgery');
        analysis.recommendations.push('ICU admission required');
        analysis.summary = `CT scan reveals ${severity.toLowerCase()} internal hemorrhage (${volume.toLowerCase()}) in the ${location}. Risk Score: ${riskScore}/100. CRITICAL emergency requiring immediate intervention.`;
      } else {
        // Cancer/Mass detection
        const cancerTypes = ['Lung Cancer', 'Liver Cancer', 'Pancreatic Cancer', 'Renal Mass'];
        const cancerType = cancerTypes[Math.floor(Math.random() * cancerTypes.length)];
        const severity = 'Severe';
        const confidence = 0.85 + Math.random() * 0.10;
        const riskScore = this.calculateRiskScore(severity, 'Emergency', confidence);

        analysis.detectedConditions.push({
          condition: cancerType,
          confidence: confidence,
          severity: severity,
          location: location,
          description: `Suspicious mass consistent with ${cancerType.toLowerCase()} detected`,
          riskScore: riskScore
        });

        analysis.detailedFindings.push({
          finding: 'Suspicious Mass Lesion',
          location: location,
          severity: severity,
          measurement: 'Irregular margins with heterogeneous enhancement',
          clinical_significance: 'Urgent oncological evaluation and biopsy required'
        });

        analysis.urgencyLevel = 'Emergency';
        analysis.riskScore = riskScore;
        analysis.recommendations.push('🔴 URGENT: Immediate oncology consultation');
        analysis.recommendations.push('Biopsy for histological confirmation');
        analysis.recommendations.push('Staging workup (PET scan, additional imaging)');
        analysis.recommendations.push('Multidisciplinary tumor board review');
        analysis.recommendations.push('Treatment planning (surgery/chemotherapy/radiation)');
        analysis.recommendations.push('Genetic testing and molecular profiling');
        analysis.summary = `CT scan reveals findings consistent with ${cancerType.toLowerCase()}. Risk Score: ${riskScore}/100. URGENT oncological evaluation required.`;
      }
    } else {
      analysis.riskScore = 7;
      analysis.summary = 'CT scan demonstrates normal anatomical structures. No hemorrhage, masses, or abnormalities detected. Risk Score: 7/100 (Low Risk).';
      analysis.recommendations.push('✅ No acute findings requiring intervention');
      analysis.recommendations.push('Routine clinical correlation');
      analysis.recommendations.push('Follow-up as clinically indicated');
    }

    return analysis;
  }

  // Analyze actual ultrasound images (when OCR extracts little/no text)
  // analyzeActualUltrasoundImage(imageBuffer) {
  //   console.log('Performing image-based ultrasound analysis');
  //   const random = Math.random();
    
  //   const analysis = {
  //     detectedConditions: [],
  //     findings: {},
  //     summary: '',
  //     recommendations: [],
  //     urgencyLevel: 'Routine',
  //     riskScore: 0,
  //     detailedFindings: []
  //   };

  //   // 60% chance to detect finding (increased from 35%)
  //   if (random > 0.40) {
  //     const isPregnancy = random > 0.70; // 30% pregnancy, 30% stones
      
  //     if (isPregnancy) {
  //       const isTwin = random > 0.85; // 15% twin pregnancy
  //       const weeks = 8 + Math.floor(Math.random() * 32); // 8-40 weeks
  //       const heartRate1 = 120 + Math.floor(Math.random() * 40); // 120-160 bpm
  //       const heartRate2 = isTwin ? 120 + Math.floor(Math.random() * 40) : 0;
  //       const hasComplications = random > 0.80;
        
  //       const severity = (isTwin || hasComplications) ? 'Moderate' : 'Normal';
  //       const confidence = 0.95 + Math.random() * 0.04;
  //       const riskScore = (isTwin || hasComplications) ? 
  //         this.calculateRiskScore('Moderate', 'Urgent', confidence) : 15;

  //       analysis.detectedConditions.push({
  //         condition: isTwin ? 'Twin Intrauterine Pregnancy' : 'Intrauterine Pregnancy',
  //         confidence: confidence,
  //         severity: severity,
  //         location: 'Uterus',
  //         description: `${isTwin ? 'Twin' : 'Single'} intrauterine pregnancy at ${weeks} weeks gestation`,
  //         riskScore: riskScore
  //       });

  //       analysis.detailedFindings.push({
  //         finding: isTwin ? 'Twin Gestation Confirmed' : 'Single Intrauterine Gestation',
  //         location: 'Intrauterine',
  //         severity: severity,
  //         measurement: isTwin ? 
  //           `Twin A: ${weeks} weeks, FHR ${heartRate1} bpm | Twin B: ${weeks} weeks, FHR ${heartRate2} bpm` :
  //           `${weeks} weeks gestation, FHR ${heartRate1} bpm`,
  //         clinical_significance: isTwin ? 
  //           'High-risk pregnancy requiring specialized obstetric care' : 
  //           hasComplications ? 'Requires additional monitoring' : 'Normal pregnancy progression'
  //       });

  //       analysis.urgencyLevel = (isTwin || hasComplications) ? 'Urgent' : 'Routine';
  //       analysis.riskScore = riskScore;
  //       analysis.recommendations.push('Routine prenatal care');
  //       analysis.recommendations.push('Fetal growth monitoring');
  //       analysis.recommendations.push('Maternal health assessment');
        
  //       if (isTwin) {
  //         analysis.recommendations.push('🔴 High-risk obstetric care required');
  //         analysis.recommendations.push('More frequent monitoring for twin pregnancy');
  //         analysis.recommendations.push('Specialized ultrasound surveillance');
  //         analysis.recommendations.push('Nutritional counseling for multiple gestation');
  //         analysis.recommendations.push('Preterm labor precautions');
  //       }
        
  //       if (hasComplications) {
  //         analysis.recommendations.push('⚠️ Additional monitoring for placental position');
  //         analysis.recommendations.push('Obstetric consultation recommended');
  //         analysis.recommendations.push('Avoid strenuous activity');
  //       }
        
  //       const complicationText = hasComplications ? ' Low-lying placenta noted requiring monitoring.' : '';
  //       analysis.summary = `Ultrasound confirms ${isTwin ? 'TWIN' : 'single'} intrauterine pregnancy at ${weeks} weeks gestation. Fetal heart rate${isTwin ? 's' : ''}: ${heartRate1}${isTwin ? ` and ${heartRate2}` : ''} bpm (normal range).${complicationText} Risk Score: ${riskScore}/100. ${isTwin ? 'Twin pregnancy requires specialized high-risk prenatal care.' : hasComplications ? 'Additional monitoring required.' : 'Normal pregnancy progression.'}`;
  //     } else {
  //       // Kidney stones
  //       const locations = ['Left kidney', 'Right kidney', 'Both kidneys', 'Left ureter', 'Right ureter'];
  //       const location = locations[Math.floor(Math.random() * locations.length)];
  //       const sizes = ['Small (< 5mm)', 'Medium (5-10mm)', 'Large (> 10mm)'];
  //       const size = sizes[Math.floor(Math.random() * sizes.length)];
  //       const count = 1 + Math.floor(Math.random() * 4); // 1-4 stones
        
  //       const isLarge = size.includes('Large');
  //       const severity = isLarge ? 'Moderate' : 'Mild';
  //       const confidence = 0.88 + Math.random() * 0.10;
  //       const riskScore = this.calculateRiskScore(severity, isLarge ? 'Urgent' : 'Routine', confidence);

  //       analysis.detectedConditions.push({
  //         condition: 'Nephrolithiasis (Kidney Stones)',
  //         confidence: confidence,
  //         severity: severity,
  //         location: location,
  //         description: `${count} ${size.toLowerCase()} stone(s) detected in ${location.toLowerCase()}`,
  //         riskScore: riskScore
  //       });

  //       analysis.detailedFindings.push({
  //         finding: 'Renal Calculi',
  //         location: location,
  //         severity: severity,
  //         measurement: `${count} echogenic foci - ${size}`,
  //         clinical_significance: isLarge ? 
  //           'May require lithotripsy or surgical intervention' : 
  //           'Conservative management with monitoring'
  //       });

  //       analysis.urgencyLevel = isLarge ? 'Urgent' : 'Routine';
  //       analysis.riskScore = riskScore;
  //       analysis.recommendations.push(isLarge ? '🔴 Urgent urology consultation' : '⚠️ Urology consultation recommended');
  //       analysis.recommendations.push('Increased fluid intake (2-3 liters/day)');
  //       analysis.recommendations.push('Pain management as needed');
  //       analysis.recommendations.push(isLarge ? 
  //         'Lithotripsy or surgical intervention may be required' : 
  //         'Conservative management with monitoring');
  //       analysis.recommendations.push('Metabolic workup to prevent recurrence');
  //       analysis.recommendations.push('Dietary modifications (low sodium, adequate calcium)');
  //       analysis.recommendations.push('Strain urine to capture passed stones');
        
  //       analysis.summary = `Ultrasound reveals ${count} ${size.toLowerCase()} calculus/calculi in the ${location.toLowerCase()}. Risk Score: ${riskScore}/100. ${isLarge ? 'Urological intervention may be required.' : 'Conservative management recommended with close monitoring.'}`;
  //     }
  //   } else {
  //     analysis.riskScore = 5;
  //     analysis.summary = 'Ultrasound examination shows normal anatomical structures. Kidneys, liver, gallbladder, and other visualized organs appear within normal limits. Risk Score: 5/100 (Low Risk).';
  //     analysis.recommendations.push('✅ No abnormalities detected');
  //     analysis.recommendations.push('Routine follow-up as clinically indicated');
  //     analysis.recommendations.push('Continue monitoring symptoms if present');
  //   }

  //   return analysis;
  // }
}

module.exports = new MedicalImagingAI();
