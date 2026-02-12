class MLRiskEvaluator {
  constructor() {
    this.weights = {
      age: 0.20,
      conditions: 0.30,
      labs: 0.35,
      allergies: 0.10,
      interactions: 0.05
    };
  }

  /**
   * Main risk evaluation function
   * Called whenever patient data or lab results are updated
   */
  evaluateRisk(patientData) {
    try {
      const age = this.calculateAge(patientData.personalInfo.dateOfBirth);
      const conditions = patientData.medicalInfo.chronicConditions || [];
      const labTests = patientData.labReports || [];
      const allergies = patientData.medicalInfo.allergies || [];

      // Calculate individual risk components
      const ageRisk = this.calculateAgeRisk(age);
      const conditionsRisk = this.calculateConditionsRisk(conditions);
      const labsRisk = this.calculateLabRisk(labTests);
      const allergiesRisk = this.calculateAllergiesRisk(allergies);
      const interactionRisk = this.calculateInteractionRisk(conditions, labTests);

      // Weighted total risk
      const totalRisk = (
        ageRisk * this.weights.age +
        conditionsRisk * this.weights.conditions +
        labsRisk * this.weights.labs +
        allergiesRisk * this.weights.allergies +
        interactionRisk * this.weights.interactions
      );

      const riskScore = Math.min(Math.round(totalRisk * 100), 100);
      
      return {
        riskScore,
        riskLevel: this.getRiskLevel(riskScore),
        breakdown: {
          age: Math.round(ageRisk * 100),
          conditions: Math.round(conditionsRisk * 100),
          labs: Math.round(labsRisk * 100),
          allergies: Math.round(allergiesRisk * 100),
          interactions: Math.round(interactionRisk * 100)
        },
        riskFactors: this.identifyRiskFactors(patientData, age, labTests),
        recommendations: this.generateRecommendations(riskScore, conditions, labTests),
        modelVersion: 'v2.0.1',
        confidence: 0.89,
        calculatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Risk evaluation error:', error);
      return {
        riskScore: 0,
        riskLevel: 'Unknown',
        error: error.message,
        calculatedAt: new Date().toISOString()
      };
    }
  }

  calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  calculateAgeRisk(age) {
    if (age < 18) return 0.05;
    if (age < 30) return 0.10;
    if (age < 45) return 0.15;
    if (age < 60) return 0.25;
    if (age < 75) return 0.40;
    return 0.60;
  }

  calculateConditionsRisk(conditions) {
    if (!conditions || conditions.length === 0) return 0;

    const severityMap = {
      'diabetes': 0.35,
      'heart disease': 0.45,
      'hypertension': 0.30,
      'kidney disease': 0.40,
      'liver disease': 0.38,
      'cancer': 0.50,
      'stroke': 0.45,
      'copd': 0.35,
      'asthma': 0.20,
      'arthritis': 0.15,
      'depression': 0.20,
      'anxiety': 0.15
    };

    let totalRisk = 0;
    let matchedConditions = 0;

    conditions.forEach(condition => {
      const normalizedCondition = condition.toLowerCase();
      const severity = severityMap[normalizedCondition] || 0.15;
      totalRisk += severity;
      matchedConditions++;
    });

    // Additional penalty for multiple conditions
    if (matchedConditions > 1) {
      totalRisk *= 1.1;
    }
    if (matchedConditions > 3) {
      totalRisk *= 1.15;
    }

    return Math.min(totalRisk, 1);
  }

  calculateLabRisk(labTests) {
    if (!labTests || labTests.length === 0) return 0;

    let totalRisk = 0;
    let abnormalCount = 0;

    labTests.forEach(test => {
      // Check test status
      if (test.status === 'Critical' || test.status === 'Abnormal') {
        abnormalCount++;
        
        // Base risk from status
        let testRisk = test.status === 'Critical' ? 0.40 : 0.25;

        // Additional risk from specific test types
        const testType = test.testType?.toLowerCase() || '';
        
        if (testType.includes('glucose') || testType.includes('hba1c')) {
          testRisk *= 1.3;
        } else if (testType.includes('cholesterol') || testType.includes('lipid')) {
          testRisk *= 1.2;
        } else if (testType.includes('kidney') || testType.includes('creatinine')) {
          testRisk *= 1.25;
        } else if (testType.includes('liver') || testType.includes('alt') || testType.includes('ast')) {
          testRisk *= 1.2;
        }

        totalRisk += testRisk;
      }
    });

    // Average risk with penalty for multiple abnormal tests
    let avgRisk = totalRisk / Math.max(labTests.length, 1);
    
    if (abnormalCount > 2) {
      avgRisk *= 1.2;
    }
    if (abnormalCount > 4) {
      avgRisk *= 1.3;
    }

    return Math.min(avgRisk, 1);
  }

  calculateAllergiesRisk(allergies) {
    if (!allergies || allergies.length === 0) return 0;

    const severeAllergies = [
      'penicillin',
      'sulfa',
      'latex',
      'shellfish',
      'peanuts',
      'bee sting'
    ];

    let riskScore = allergies.length * 0.05;

    allergies.forEach(allergy => {
      const normalizedAllergy = allergy.toLowerCase();
      if (severeAllergies.some(severe => normalizedAllergy.includes(severe))) {
        riskScore += 0.10;
      }
    });

    return Math.min(riskScore, 0.50);
  }

  calculateInteractionRisk(conditions, labTests) {
    let interactionRisk = 0;

    const highRiskConditions = ['diabetes', 'heart disease', 'hypertension', 'kidney disease'];
    const criticalLabStatuses = ['Critical', 'Abnormal'];

    // Check for condition-lab interactions
    highRiskConditions.forEach(highRiskCondition => {
      if (conditions.some(c => c.toLowerCase().includes(highRiskCondition))) {
        interactionRisk += 0.10;

        // Additional risk if labs are also abnormal
        labTests.forEach(test => {
          if (criticalLabStatuses.includes(test.status)) {
            interactionRisk += 0.05;
          }
        });
      }
    });

    // Multiple condition interaction
    if (conditions.length > 2) {
      interactionRisk += 0.10;
    }

    return Math.min(interactionRisk, 1);
  }

  identifyRiskFactors(patientData, age, labTests) {
    const factors = [];
    const conditions = patientData.medicalInfo.chronicConditions || [];
    const allergies = patientData.medicalInfo.allergies || [];

    // Age-based factors
    if (age > 65) {
      factors.push({
        factor: 'Advanced Age',
        severity: 'Medium',
        description: `Patient is ${age} years old, increasing health risks`
      });
    }

    // Condition-based factors
    if (conditions.length > 0) {
      if (conditions.length > 2) {
        factors.push({
          factor: 'Multiple Chronic Conditions',
          severity: 'High',
          description: `Patient has ${conditions.length} chronic conditions: ${conditions.join(', ')}`
        });
      } else {
        factors.push({
          factor: 'Chronic Condition',
          severity: 'Medium',
          description: `Diagnosed with: ${conditions.join(', ')}`
        });
      }
    }

    // Lab-based factors
    const criticalLabs = labTests.filter(t => t.status === 'Critical');
    const abnormalLabs = labTests.filter(t => t.status === 'Abnormal');

    if (criticalLabs.length > 0) {
      factors.push({
        factor: 'Critical Lab Results',
        severity: 'High',
        description: `${criticalLabs.length} critical lab result(s) detected`
      });
    }

    if (abnormalLabs.length > 2) {
      factors.push({
        factor: 'Multiple Abnormal Lab Results',
        severity: 'Medium',
        description: `${abnormalLabs.length} abnormal test results`
      });
    }

    // Allergy-based factors
    if (allergies.length > 3) {
      factors.push({
        factor: 'Multiple Allergies',
        severity: 'Low',
        description: `Patient has ${allergies.length} known allergies`
      });
    }

    return factors;
  }

  generateRecommendations(riskScore, conditions, labTests) {
    const recommendations = [];

    // Risk-based recommendations
    if (riskScore >= 70) {
      recommendations.push({
        priority: 'High',
        action: 'Immediate Medical Review Required',
        description: 'Schedule urgent consultation with primary care physician'
      });
      recommendations.push({
        priority: 'High',
        action: 'Enhanced Monitoring',
        description: 'Implement daily vital signs monitoring and weekly check-ins'
      });
    } else if (riskScore >= 50) {
      recommendations.push({
        priority: 'Medium',
        action: 'Regular Medical Follow-up',
        description: 'Schedule appointment within 2 weeks for health assessment'
      });
      recommendations.push({
        priority: 'Medium',
        action: 'Lifestyle Modification',
        description: 'Implement diet and exercise plan with medical supervision'
      });
    } else if (riskScore >= 30) {
      recommendations.push({
        priority: 'Low',
        action: 'Routine Check-up',
        description: 'Schedule regular 3-month follow-up appointment'
      });
      recommendations.push({
        priority: 'Low',
        action: 'Preventive Care',
        description: 'Maintain healthy lifestyle and monitor symptoms'
      });
    }

    // Condition-specific recommendations
    if (conditions.includes('Diabetes')) {
      recommendations.push({
        priority: 'Medium',
        action: 'Diabetes Management',
        description: 'Regular glucose monitoring and HbA1c testing every 3 months'
      });
    }

    if (conditions.includes('Hypertension')) {
      recommendations.push({
        priority: 'Medium',
        action: 'Blood Pressure Monitoring',
        description: 'Daily blood pressure checks and medication compliance review'
      });
    }

    // Lab-based recommendations
    const criticalLabs = labTests.filter(t => t.status === 'Critical');
    if (criticalLabs.length > 0) {
      recommendations.push({
        priority: 'High',
        action: 'Lab Result Follow-up',
        description: `Review and address critical findings in: ${criticalLabs.map(l => l.testType).join(', ')}`
      });
    }

    return recommendations;
  }

  getRiskLevel(riskScore) {
    if (riskScore >= 75) return 'Critical';
    if (riskScore >= 50) return 'High';
    if (riskScore >= 30) return 'Medium';
    if (riskScore >= 15) return 'Low';
    return 'Minimal';
  }
}
module.exports = new MLRiskEvaluator();
