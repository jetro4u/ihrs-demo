import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepButton,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress
} from '@mui/material';
import { 
  ArrowBack, 
  ArrowForward, 
  Save as SaveIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';

type RadiologyData = {
  testConducted: number;
  reportIssued: number;
  referredCases: number;
};

const WizardStyleDataEntry = () => {
  const testTypes = ['xray', 'uss', 'ctscan', 'mri'];
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<Record<string, RadiologyData>>({
    xray: { testConducted: 0, reportIssued: 0, referredCases: 0 },
    uss: { testConducted: 0, reportIssued: 0, referredCases: 0 },
    ctscan: { testConducted: 0, reportIssued: 0, referredCases: 0 },
    mri: { testConducted: 0, reportIssued: 0, referredCases: 0 }
  });
  const [completed, setCompleted] = useState({
    xray: false,
    uss: false,
    ctscan: false,
    mri: false
  });

  // Display names for the test types
  const testTypeLabels = {
    xray: 'X-Ray',
    uss: 'USS',
    ctscan: 'CT-Scan',
    mri: 'MRI'
  };

  // Metric labels
  const metricLabels = {
    testConducted: 'Tests Conducted',
    reportIssued: 'Reports Issued',
    referredCases: 'Referred Cases'
  };

  const handleChange = (metric, value) => {
    const currentTest = testTypes[currentStep];
    const numValue = parseInt(value) || 0;
    
    setData({
      ...data,
      [currentTest]: {
        ...data[currentTest],
        [metric]: numValue
      }
    });
    
    // Mark as completed if any field has data
    const hasData = Object.values({...data[currentTest], [metric]: numValue}).some(val => val > 0);
    if (hasData) {
      setCompleted({
        ...completed,
        [currentTest]: true
      });
    }
  };

  const nextStep = () => {
    if (currentStep < testTypes.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // We're at the final step, show summary
      setCurrentStep(testTypes.length);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    console.log('Submitting data:', data);
    alert('Radiology report submitted successfully!');
  };

  // Get current test type
  const getCurrentTest = () => {
    if (currentStep < testTypes.length) {
      return testTypes[currentStep];
    }
    return null;
  };

  // Calculate overall progress
  const calculateProgress = () => {
    const totalSteps = testTypes.length;
    const completedSteps = Object.values(completed).filter(Boolean).length;
    return (completedSteps / totalSteps) * 100;
  };

  const currentTest = getCurrentTest();
  const progress = calculateProgress();

  return (
    <Card sx={{ width: '100%', maxWidth: 'md', mx: 'auto', boxShadow: 3 }}>
      <CardHeader 
        title="Radiology Services Report" 
        sx={{ 
          backgroundColor: 'primary.light',
          color: 'primary.contrastText',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      />
      
      <Box sx={{ px: 3, pt: 3, pb: 1 }}>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ 
            height: 10, 
            borderRadius: 5,
            mb: 2
          }}
        />
        
        <Stepper activeStep={currentStep} alternativeLabel>
          {testTypes.map((test, index) => (
            <Step key={test} completed={completed[test]}>
              <StepButton 
                onClick={() => setCurrentStep(index)}
                optional={
                  <Typography variant="caption">
                    {testTypeLabels[test]}
                  </Typography>
                }
              >
                {completed[test] && <CheckIcon color="success" fontSize="small" />}
              </StepButton>
            </Step>
          ))}
          <Step key="submit" completed={false}>
            <StepButton 
              onClick={() => {
                if (Object.values(completed).some(Boolean)) {
                  setCurrentStep(testTypes.length);
                }
              }}
              optional={
                <Typography variant="caption">
                  Submit
                </Typography>
              }
              disabled={!Object.values(completed).some(Boolean)}
            >
              <SaveIcon fontSize="small" />
            </StepButton>
          </Step>
        </Stepper>
      </Box>
      
      <CardContent sx={{ px: 3, py: 4 }}>
        {currentTest ? (
          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              {testTypeLabels[currentTest]} Data
            </Typography>
            <Box sx={{ my: 4 }}>
              {Object.entries(data[currentTest]).map(([metric, value]) => (
                <Box 
                  key={metric} 
                  sx={{ 
                    mb: 3, 
                    p: 2, 
                    bgcolor: 'grey.50',
                    borderRadius: 1
                  }}
                >
                  <Typography 
                    variant="subtitle1" 
                    component="label" 
                    sx={{ 
                      display: 'block',
                      mb: 1,
                      fontWeight: 'medium'
                    }}
                  >
                    {metricLabels[metric]}
                  </Typography>
                  <TextField
                    type="number"
                    fullWidth
                    variant="outlined"
                    inputProps={{ min: 0 }}
                    value={value}
                    onChange={(e) => handleChange(metric, e.target.value)}
                    sx={{ 
                      '& input': { 
                        textAlign: 'center',
                        fontSize: '1.25rem',
                        py: 1.5
                      }
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        ) : (
          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              Summary
            </Typography>
            <TableContainer component={Paper} sx={{ mt: 3, boxShadow: 1 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell>Test Type</TableCell>
                    {Object.keys(metricLabels).map(metric => (
                      <TableCell key={metric} align="center">
                        {metricLabels[metric]}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(data).map(([testType, metrics]) => (
                    <TableRow 
                      key={testType} 
                      sx={{ bgcolor: completed[testType] ? 'success.50' : 'inherit' }}
                    >
                      <TableCell 
                        component="th" 
                        scope="row"
                        sx={{ fontWeight: 'medium' }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {testTypeLabels[testType]}
                          {completed[testType] && (
                            <CheckIcon 
                              color="success" 
                              fontSize="small"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      {Object.entries(metrics).map(([metric, value]) => (
                        <TableCell key={metric} align="center">
                          {value}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </CardContent>
      
      <CardActions sx={{ 
        justifyContent: 'space-between', 
        p: 2, 
        bgcolor: 'grey.50',
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={prevStep}
          disabled={currentStep === 0}
        >
          Previous
        </Button>
        
        {currentStep < testTypes.length ? (
          <Button
            variant="contained"
            color="primary"
            endIcon={<ArrowForward />}
            onClick={nextStep}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            color="success"
            startIcon={<SaveIcon />}
            onClick={handleSubmit}
          >
            Submit Report
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default WizardStyleDataEntry;