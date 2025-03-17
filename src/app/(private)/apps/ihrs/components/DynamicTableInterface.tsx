import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Paper,
  Box
} from '@mui/material';
import { 
  Save as SaveIcon, 
  Cancel as CancelIcon 
} from '@mui/icons-material';

const DynamicTableInterface = () => {
  const [data, setData] = useState({
    xray: { testConducted: 0, reportIssued: 0, referredCases: 0 },
    uss: { testConducted: 0, reportIssued: 0, referredCases: 0 },
    ctscan: { testConducted: 0, reportIssued: 0, referredCases: 0 },
    mri: { testConducted: 0, reportIssued: 0, referredCases: 0 }
  });

  // Display names for the test types
  const testTypeLabels = {
    xray: 'X-Ray',
    uss: 'USS',
    ctscan: 'CT-Scan',
    mri: 'MRI'
  };

  // Column headers
  const columnLabels = {
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

  // Calculate totals for each column
  const calculateColumnTotals = () => {
    const totals = {
      testConducted: 0,
      reportIssued: 0,
      referredCases: 0
    };

    Object.values(data).forEach(test => {
      totals.testConducted += test.testConducted;
      totals.reportIssued += test.reportIssued;
      totals.referredCases += test.referredCases;
    });

    return totals;
  };

  const columnTotals = calculateColumnTotals();

  const handleSubmit = () => {
    console.log('Submitting data:', data);
    alert('Data submitted successfully!');
  };

  return (
    <Card sx={{ width: '100%', maxWidth: '100%', boxShadow: 3 }}>
      <CardHeader 
        title="Radiology Services Report" 
        subheader="Enter monthly data for all radiology services"
        sx={{ 
          backgroundColor: 'primary.light', 
          color: 'primary.contrastText',
          '& .MuiCardHeader-subheader': {
            color: 'primary.contrastText'
          }
        }}
      />
      
      <CardContent sx={{ p: 3 }}>
        <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
          <Table aria-label="radiology data table">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Test Type</TableCell>
                {Object.entries(columnLabels).map(([key, label]) => (
                  <TableCell key={key} align="center" sx={{ fontWeight: 'bold' }}>
                    {label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(data).map(([testType, metrics]) => (
                <TableRow 
                  key={testType}
                  sx={{ '&:hover': { backgroundColor: 'grey.50' } }}
                >
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                    {testTypeLabels[testType]}
                  </TableCell>
                  {Object.entries(metrics).map(([metric, value]) => (
                    <TableCell key={metric} align="center">
                      <TextField
                        type="number"
                        inputProps={{ min: 0 }}
                        value={value}
                        onChange={(e) => handleChange(testType, metric, e.target.value)}
                        variant="outlined"
                        size="small"
                        sx={{ 
                          width: '80%', 
                          '& input': { textAlign: 'center' } 
                        }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              <TableRow sx={{ backgroundColor: 'primary.light' }}>
                <TableCell sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>
                  TOTALS
                </TableCell>
                {Object.entries(columnTotals).map(([metric, total]) => (
                  <TableCell 
                    key={metric} 
                    align="center"
                    sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}
                  >
                    {total}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
      
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        p: 2, 
        backgroundColor: 'grey.100' 
      }}>
        <Button 
          variant="outlined" 
          startIcon={<CancelIcon />}
        >
          Cancel
        </Button>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSubmit}
        >
          Submit Report
        </Button>
      </Box>
    </Card>
  );
};

export default DynamicTableInterface;