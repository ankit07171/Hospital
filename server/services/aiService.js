const axios = require('axios');

class AIService {
  constructor() {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    this.healthPredictionUrl = process.env.HEALTH_PREDICTION_API || 'http://localhost:8001';
  }

  async generateLabReportSummary(labResults) {
    try {
      // Simulate AI-based lab report summary generation
      const abnormalResults = labResults.filter(result => 
        result.status === 'High' || result.status === 'Low' || result.status === 'Critical'
      );

      let summary = 'Lab Report Summary:\n\n';

      if (abnormalResults.length === 0) {
        summary += 'All parameters are within normal ranges. No immediate concerns identified.';
      } else {
        summary += 'Key Findings:\n';
        abnormalResults.forEach(result => {
          summary += `• ${result.parameter}: ${result.value} ${result.unit} (${result.status}) - Normal range: ${result.normalRange}\n`;
        });

        // Add clinical recommendations based on abnormal values
        summary += '\nClinical Recommendations:\n';
        abnormalResults.forEach(result => {
          const recommendation = this.getRecommendationForParameter(result);
          if (recommendation) {
            summary += `• ${recommendation}\n`;
          }
        });
      }

      return {
        summary,
        abnormalCount: abnormalResults.length,
        totalParameters: labResults.length,
        riskLevel: this.calculateRiskLevel(abnormalResults),
        recommendations: this.generateRecommendations(abnormalResults)
      };
    } catch (error) {
      console.error('AI lab summary generation failed:', error);
      return {
        summary: 'Unable to generate AI summary at this time.',
        error: error.message
      };
    }
  }

  getRecommendationForParameter(result) {
    const recommendations = {
      'Hemoglobin': {
        'Low': 'Consider iron supplementation and dietary counseling',
        'High': 'Investigate for polycythemia, recommend hydration'
      },
      'Blood Sugar': {
        'High': 'Monitor for diabetes, recommend dietary modifications',
        'Low': 'Check for hypoglycemia, adjust medication if needed'
      },
      'Cholesterol': {
        'High': 'Recommend lipid-lowering therapy and lifestyle changes',
        'Low': 'Generally not concerning unless extremely low'
      },
      'Blood Pressure': {
        'High': 'Monitor cardiovascular risk, consider antihypertensive therapy',
        'Low': 'Monitor for hypotension symptoms'
      }
    };

    return recommendations[result.parameter]?.[result.status] || 
           `Monitor ${result.parameter} levels and consider follow-up testing`;
  }

  calculateRiskLevel(abnormalResults) {
    if (abnormalResults.length === 0) return 'Low';
    
    const criticalCount = abnormalResults.filter(r => r.status === 'Critical').length;
    if (criticalCount > 0) return 'Critical';
    
    if (abnormalResults.length > 3) return 'High';
    if (abnormalResults.length > 1) return 'Medium';
    return 'Low';
  }

  generateRecommendations(abnormalResults) {
    const recommendations = [];
    
    if (abnormalResults.some(r => r.parameter.includes('Sugar') || r.parameter.includes('Glucose'))) {
      recommendations.push('Schedule endocrinology consultation');
      recommendations.push('Implement diabetic diet plan');
    }
    
    if (abnormalResults.some(r => r.parameter.includes('Cholesterol') || r.parameter.includes('Lipid'))) {
      recommendations.push('Cardiology referral recommended');
      recommendations.push('Lifestyle modification counseling');
    }
    
    if (abnormalResults.some(r => r.parameter.includes('Hemoglobin') || r.parameter.includes('Iron'))) {
      recommendations.push('Hematology consultation if persistent');
      recommendations.push('Nutritional assessment');
    }

    return recommendations;
  }

  async predictHealthScore(patientData) {
    try {
      // Simulate health score prediction based on patient data
      const factors = {
        age: this.calculateAgeScore(patientData.age),
        chronicConditions: this.calculateChronicConditionsScore(patientData.chronicConditions || []),
        labResults: this.calculateLabScore(patientData.recentLabResults || []),
        lifestyle: this.calculateLifestyleScore(patientData.lifestyle || {}),
        vitals: this.calculateVitalsScore(patientData.vitals || {})
      };

      const baseScore = 100;
      const totalDeduction = Object.values(factors).reduce((sum, score) => sum + score, 0);
      const healthScore = Math.max(0, Math.min(100, baseScore - totalDeduction));

      const riskFactors = this.identifyRiskFactors(patientData, factors);
      const predictions = await this.generateHealthPredictions(patientData, healthScore);

      return {
        score: Math.round(healthScore),
        factors,
        riskFactors,
        predictions,
        recommendations: this.generateHealthRecommendations(healthScore, riskFactors)
      };
    } catch (error) {
      console.error('Health score prediction failed:', error);
      return {
        score: 0,
        error: error.message
      };
    }
  }

  calculateAgeScore(age) {
    if (age < 30) return 0;
    if (age < 50) return 5;
    if (age < 70) return 15;
    return 25;
  }

  calculateChronicConditionsScore(conditions) {
    const severityMap = {
      'diabetes': 15,
      'hypertension': 10,
      'heart disease': 20,
      'kidney disease': 18,
      'liver disease': 16,
      'cancer': 25
    };

    return conditions.reduce((score, condition) => {
      const severity = severityMap[condition.toLowerCase()] || 5;
      return score + severity;
    }, 0);
  }

  calculateLabScore(labResults) {
    const abnormalResults = labResults.filter(r => r.status !== 'Normal');
    return abnormalResults.length * 3;
  }

  calculateLifestyleScore(lifestyle) {
    let score = 0;
    if (lifestyle.smoking) score += 20;
    if (lifestyle.alcohol === 'heavy') score += 15;
    if (lifestyle.exercise === 'none') score += 10;
    if (lifestyle.diet === 'poor') score += 8;
    return score;
  }

  calculateVitalsScore(vitals) {
    let score = 0;
    if (vitals.bloodPressure && vitals.bloodPressure.systolic > 140) score += 10;
    if (vitals.heartRate && (vitals.heartRate > 100 || vitals.heartRate < 60)) score += 5;
    if (vitals.temperature && vitals.temperature > 100.4) score += 8;
    return score;
  }

  identifyRiskFactors(patientData, factors) {
    const riskFactors = [];
    
    if (factors.age > 20) riskFactors.push('Advanced age');
    if (factors.chronicConditions > 15) riskFactors.push('Multiple chronic conditions');
    if (factors.labResults > 9) riskFactors.push('Multiple abnormal lab values');
    if (factors.lifestyle > 25) riskFactors.push('High-risk lifestyle factors');
    if (factors.vitals > 15) riskFactors.push('Abnormal vital signs');

    return riskFactors;
  }

  async generateHealthPredictions(patientData, healthScore) {
    const predictions = [];

    // Simulate ML-based predictions
    if (healthScore < 60) {
      predictions.push({
        condition: 'Cardiovascular Event',
        probability: 0.25,
        timeframe: '2 years',
        confidence: 0.78
      });
    }

    if (patientData.chronicConditions?.includes('diabetes') && healthScore < 70) {
      predictions.push({
        condition: 'Diabetic Complications',
        probability: 0.35,
        timeframe: '3 years',
        confidence: 0.82
      });
    }

    if (healthScore < 50) {
      predictions.push({
        condition: 'Hospital Readmission',
        probability: 0.40,
        timeframe: '6 months',
        confidence: 0.75
      });
    }

    return predictions;
  }

  generateHealthRecommendations(healthScore, riskFactors) {
    const recommendations = [];

    if (healthScore < 70) {
      recommendations.push('Schedule comprehensive health assessment');
      recommendations.push('Implement preventive care plan');
    }

    if (riskFactors.includes('High-risk lifestyle factors')) {
      recommendations.push('Lifestyle modification counseling');
      recommendations.push('Nutritionist consultation');
    }

    if (riskFactors.includes('Multiple chronic conditions')) {
      recommendations.push('Care coordination with specialists');
      recommendations.push('Medication review and optimization');
    }

    if (healthScore < 50) {
      recommendations.push('Consider intensive monitoring program');
      recommendations.push('Family/caregiver education');
    }

    return recommendations;
  }

  async analyzeMedicalImage(imageBuffer, imageType) {
    try {
      // Placeholder for medical image analysis
      // In a real implementation, this would integrate with medical AI services
      return {
        findings: ['Analysis pending - requires specialized medical AI service'],
        confidence: 0,
        recommendations: ['Manual review by radiologist recommended']
      };
    } catch (error) {
      console.error('Medical image analysis failed:', error);
      return {
        findings: [],
        confidence: 0,
        error: error.message
      };
    }
  }
}

module.exports = new AIService();