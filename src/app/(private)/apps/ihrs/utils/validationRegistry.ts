// Define the validation registry as before
const validationRegistry: Record<string, (values: Record<string, any>) => Record<string, string>> = {
  diseaseSurveillance: (values: Record<string, any>): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    if (values.death > values.cases) {
      errors.death = 'Deaths cannot exceed total cases';
    }
    
    if (values.referredCases > values.cases) {
      errors.referredCases = 'Referred cases cannot exceed total cases';
    }
    
    return errors;
  },
  
  // Other validation functions remain the same
  emergencyServices: (values: Record<string, any>): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    if (values.referredOut > values.cases) {
      errors.referredOut = 'Referred out cannot exceed total cases';
    }
    
    if (values.intraReferrer > values.cases) {
      errors.intraReferrer = 'Intra referrals cannot exceed total cases';
    }
    
    return errors;
  },
  
  radiologyServices: (values: Record<string, any>): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    if (values.reportIssued > values.conducted) {
      errors.reportIssued = 'Reports issued cannot exceed tests conducted';
    }
    
    if (values.referredCases > values.conducted) {
      errors.referredCases = 'Referred cases cannot exceed tests conducted';
    }
    
    return errors;
  },
  
  clinicalServices: (values: Record<string, any>): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    if (values.referrals > values.patients) {
      errors.referrals = 'Referrals cannot exceed total patients';
    }
    
    return errors;
  }
};

const inferValidationType = (metrics: Record<string, any> | undefined): string | null => {
  if (!metrics) return null;
  
  const metricKeys = Object.keys(metrics);
  
  // Check for disease surveillance pattern
  if (
    metricKeys.includes('cases') && 
    metricKeys.includes('death') && 
    metricKeys.includes('referredCases')
  ) {
    return 'diseaseSurveillance';
  }
  
  // Check for emergency services pattern
  if (
    metricKeys.includes('cases') && 
    metricKeys.includes('referredOut') && 
    metricKeys.includes('intraReferrer')
  ) {
    return 'emergencyServices';
  }
  
  // Check for radiology services pattern
  if (
    metricKeys.includes('conducted') && 
    metricKeys.includes('reportIssued') && 
    metricKeys.includes('referredCases')
  ) {
    return 'radiologyServices';
  }
  
  // Check for clinical services pattern
  if (
    metricKeys.includes('patients') && 
    metricKeys.includes('referrals')
  ) {
    return 'clinicalServices';
  }
  
  return null;
};