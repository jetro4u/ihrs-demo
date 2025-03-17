import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Typography,
  Grid,
  Box,
  TextField,
  Button,
  IconButton,
  Paper,
  Collapse
} from '@mui/material';
import { 
  Add as PlusIcon, 
  Remove as MinusIcon, 
  Save as SaveIcon
} from '@mui/icons-material';

const CardBasedEntrySystem = () => {
  const [data, setData] = useState({
    xray: { testConducted: 0, reportIssued: 0, referredCases: 0 },
    uss: { testConducted: 0, reportIssued: 0, referredCases: 0 },
    ctscan: { testConducted: 0, reportIssued: 0, referredCases: 0 },
    mri: { testConducted: 0, reportIssued: 0, referredCases: 0 }
  });
  
  const [expandedCards, setExpandedCards] = useState({
    xray: true,
    uss: true,
    ctscan: true,
    mri: true
  });

  // Display names and colors for test types
  const testTypeInfo = {
    xray: { label: 'X-Ray', color: '#bbdefb', headerColor: '#1976d2' },
    uss: { label: 'USS', color: '#c8e6c9', headerColor: '#388e3c' },
    ctscan: { label: 'CT-Scan', color: '#e1bee7', headerColor: '#7b1fa2' },
    mri: { label: 'MRI', color: '#ffe0b2', headerColor: '#f57c00' }
  };

  const metricLabels = {
    testConducted: 'Tests Conducted',
    reportIssued: 'Reports Issued',
    referredCases: 'Referred Cases'
  };

  const handleChange = (testType, metric, value) => {
    const numValue = parseInt(value) || 0;
    setData({
      ...data,
      [testType]: {
        ...data[testType],
        [metric]: numValue
      }
    });
  };

  const toggleCard = (testType) => {
    setExpandedCards({
      ...expandedCards,
      [testType]: !expandedCards[testType]
    });
  };

  const handleSubmit = () => {
    console.log('Submitting data:', data);
    alert('Report data saved successfully!');
  };

  // Calculate completion percentage for each card
  const calculateCompletion = (testData: Record<string, number>): number => {
    const totalFields = Object.keys(testData).length;
    const filledFields = Object.values(testData).filter(value => value > 0).length;
    return (filledFields / totalFields) * 100;
  };  

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      <Box sx={{ 
        mb: 3, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
          Radiology Services Report
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<SaveIcon />}
          onClick={handleSubmit}
        >
          Save Report
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {Object.entries(data).map(([testType, metrics]) => {
          const { label, color, headerColor } = testTypeInfo[testType];
          const completionPercentage = calculateCompletion(metrics);
          
          return (
            <Grid item xs={12} key={testType}>
              <Card 
                sx={{ 
                  borderLeft: `4px solid ${headerColor}`,
                  boxShadow: 2,
                  bgcolor: color,
                  '&:hover': {
                    boxShadow: 4
                  }
                }}
              >
                <CardHeader 
                  title={
                    <Typography variant="h6" component="div">
                      {label}
                    </Typography>
                  }
                  action={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ mr: 2 }}>
                        Completion: {completionPercentage.toFixed(0)}%
                      </Typography>
                      <IconButton
                        onClick={() => toggleCard(testType)}
                        aria-expanded={expandedCards[testType]}
                        aria-label="show more"
                      >
                        {expandedCards[testType] ? <MinusIcon /> : <PlusIcon />}
                      </IconButton>
                    </Box>
                  }
                  onClick={() => toggleCard(testType)}
                  sx={{ 
                    bgcolor: headerColor,
                    color: 'white',
                    cursor: 'pointer',
                    '& .MuiCardHeader-action': {
                      color: 'white'
                    }
                  }}
                />
                
                <Collapse in={expandedCards[testType]} timeout="auto" unmountOnExit>
                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={2}>
                      {Object.entries(metrics).map(([metric, value]) => (
                        <Grid item xs={12} md={4} key={metric}>
                          <Paper 
                            elevation={1} 
                            sx={{ 
                              p: 2, 
                              bgcolor: 'background.paper',
                              height: '100%'
                            }}
                          >
                            <Typography 
                              variant="subtitle2" 
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
                              onChange={(e) => handleChange(testType, metric, e.target.value)}
                              sx={{ 
                                '& input': { 
                                  textAlign: 'center',
                                  fontSize: '1.2rem'
                                }
                              }}
                            />
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Collapse>
                
                <CardActions sx={{ 
                  bgcolor: 'background.paper', 
                  justifyContent: 'flex-end',
                  p: 2
                }}>
                  <Typography variant="body2" color="text.secondary">
                    Last updated: {new Date().toLocaleDateString()}
                  </Typography>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default CardBasedEntrySystem;