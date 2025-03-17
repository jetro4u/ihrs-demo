import React, { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  TextField,
  MenuItem,
  Button,
  Box,
  Card,
  CardContent,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  CircularProgress,
  IconButton,
  AppBar,
  Toolbar,
  Snackbar,
  Alert,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ArrowBack, ArrowForward } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { DatePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import SignatureCanvas, { Point } from '../components/SignatureCanvas';
import TemplateMenuObjectForm from '../components/TemplateMenuObjectForm';
import metadata from '../metadata.json';

export const QuestionTypes = {
  INTEGER_SELECT: 1,
  TEXT_SELECT: 2,
  BOOLEAN_SELECT: 3,
  MULTIPLE_SELECT: 4,
  INTEGER_DESCRIPTIVE: 5,
  TEXT_DESCRIPTIVE: 6,
  CUSTOM: 7,
  INTEGER_INPUT: 8,
  TEXT_INPUT: 9,
  HIDDEN: 10
}

interface DataElement {
  id: number;
  uuid: string;
  uid: string;
  name: string;
  shortname: string;
  code: string;
  description: string;
  app: string;
  valueType: string;
  aggregationType: string;
  categorycomboid: number;
  domaintype: string;
  dataElementOrder?: number;
  dataElementQuestionType?: number;
  sectionName: string;
  sectionOrderId?: number;
  sectionDataElementOrder?: number;
  dataSets: string[];
  dataElementGroups: {
    id: string;
    name: string;
  }
}

interface DataValue {
  dataElementId: string;
  value: string;
}

interface ReporterInfo {
  firstName: string;
  lastName: string;
  contactNumber: string;
  email: string;
  organization: string;
  organizationId: string;
  period: string | null;
  bedCapacity: string;
  datasetId: string;
}

interface Organization {
  id: string;
  name: string;
}

interface Dataset {
  uid: string;
  name: string;
  periodType: string;
  shortname: string;
  description: string;
}

interface DataElementGroup {
  name: string;
  uid: string;
  code: string;
  shortname: string;
  orderid: number;
}

interface Metadata {
  categoryOptions: any[];
  categories: any[];
  categoryCombos: any[];
  categoryOptionCombos?: any[];
  dataElements: any[];
  dataElementGroups: DataElementGroup[];
  dataset: Dataset[];
  organisations: Organization[];
}

// Styled components
const FormPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: 12
}));

const HeaderAppBar = styled(AppBar)(({ theme }) => ({
  position: 'relative',
  boxShadow: theme.shadows[1],
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  padding: theme.spacing(1, 2),
  marginBottom: theme.spacing(3)
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  backgroundColor: theme.palette.grey[100],
}));  

interface LaboratoryReportFormProps {
  metadata: Metadata;
}

const LaboratoryReportForm = () => {
  const steps = ['Reporter Details', 'Submit Report', 'Review & Submit'];
  
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [reporterInfo, setReporterInfo] = useState<ReporterInfo>({
    firstName: '',
    lastName: '',
    contactNumber: '',
    email: '',
    organization: '',
    organizationId: '',
    period: null,
    bedCapacity: '',
    datasetId: ''
  });
  const [dataValues, setDataValues] = useState<DataValue[]>([]);
  const [signature, setSignature] = useState<string>('');
  const [templates, setTemplates] = useState([]);
  const [filteredDataElements, setFilteredDataElements] = useState([]);
  const [periodFormatted, setPeriodFormatted] = useState('');
  const [lines, setLines] = useState<Point[][]>([]);
  

  // Organizations from metadata
  const organizations = metadata?.organisations || [];

  // Datasets from metadata
  const datasets = metadata?.dataSets || [];

  // Effect to fetch templates from API
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/templates');
        const data = await response.json();
        setTemplates(data);
      } catch (error) {
        console.error("Error fetching templates:", error);
      }
    };

    fetchTemplates();
  }, []);

  // Effect to initialize data from localStorage and filter data elements
  useEffect(() => {
    // Load organization from localStorage if available
    const savedOrgId = localStorage.getItem('ihrs-selected-org');
    if (savedOrgId) {
      const savedOrg = organizations.find(org => org.id === savedOrgId);
      if (savedOrg) {
        setReporterInfo(prev => ({
          ...prev,
          organization: savedOrg.name,
          organizationId: savedOrg.id
        }));
      }
    }

    // Load dataset from localStorage if available
    const savedDatasetId = localStorage.getItem('ihrs-selected-dataset');
    if (savedDatasetId) {
      setReporterInfo(prev => ({
        ...prev,
        datasetId: savedDatasetId
      }));
      
      // Filter data elements that belong to this dataset
      if (metadata?.dataElements?.length > 0) {
        const filtered = metadata.dataElements.filter(
          (de) => de.dataSets && de.dataSets.includes(savedDatasetId)
        );
        setFilteredDataElements(filtered);
      }
    }
    
    // Load period from localStorage if available
    const savedPeriod = localStorage.getItem('ihrs-selected-period');
    if (savedPeriod) {
      setPeriodFormatted(savedPeriod);
    }
    
    // Initialize data values if needed
    if (metadata?.dataElements?.length > 0 && dataValues.length === 0) {
      const initialValues: DataValue[] = [];
      metadata.dataElements.forEach((element) => {
        if (element.uid) {
          initialValues.push({
            dataElementId: element.uid,
            value: ''
          });
        }
      });
      setDataValues(initialValues);
    }
  }, [metadata?.dataElements, organizations]);

  // Update filtered data elements when dataset changes
  useEffect(() => {
    if (reporterInfo.datasetId && metadata?.dataElements?.length > 0) {
      const filtered = metadata.dataElements.filter(
        (de) => de.dataSets && de.dataSets.includes(reporterInfo.datasetId)
      );
      setFilteredDataElements(filtered);
    }
  }, [reporterInfo.datasetId, metadata?.dataElements]);
  
  const handleSave = async (data) => {
    // Save to your backend
    try {
      const response = await fetch('/api/datarecords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save data');
      }
      
      return response.json();
    } catch (error) {
      console.error("Error saving data:", error);
      throw error;
    }
  };

  const handleReporterInfoChange = (prop: keyof ReporterInfo) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setReporterInfo({ ...reporterInfo, [prop]: event.target.value });
  };

  const handleDateChange = (field: 'period') => (date: string | null) => {
    setReporterInfo({ ...reporterInfo, [field]: date });
    
    if (date) {
      // Find the selected dataset to determine period type
      const selectedDataset = datasets.find(ds => ds.uid === reporterInfo.datasetId);
      let formattedPeriod = '';
      
      if (selectedDataset) {
        // Format the period based on periodType
        switch (selectedDataset.periodType) {
          case 'Daily':
            formattedPeriod = format(date, 'yyyyMMdd');
            break;
          case 'Monthly':
            formattedPeriod = format(date, 'yyyyMM');
            break;
          case 'Yearly':
            formattedPeriod = format(date, 'yyyy');
            break;
          default:
            formattedPeriod = format(date, 'yyyyMM'); // Default to monthly
        }
        
        // Store in localStorage and state
        localStorage.setItem('ihrs-selected-period', formattedPeriod);
        setPeriodFormatted(formattedPeriod);
      }
    } else {
      // Clear the period if date is null
      localStorage.removeItem('ihrs-selected-period');
      setPeriodFormatted('');
    }
  };

  const handleOrganizationChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const orgId = event.target.value as string;
    const organization = organizations.find(org => org.id === orgId);
    if (organization) {
      setReporterInfo({ 
        ...reporterInfo, 
        organization: organization.name,
        organizationId: orgId 
      });
      localStorage.setItem('ihrs-selected-org', orgId);
    }
  };

  const handleDatasetChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const datasetId = event.target.value as string;
    setReporterInfo({ ...reporterInfo, datasetId });
    localStorage.setItem('ihrs-selected-dataset', datasetId);
    
    // When dataset changes, we might need to update the period format
    if (reporterInfo.period) {
      handleDateChange('period')(reporterInfo.period);
    }
  };
  
  const handleDrawing = (newLines: Point[][]) => {
    setLines(newLines);
  };

  // Clear signature
  const clearSignature = () => {
    setSignature('');
  };

  // Handle form submission
  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      const payload = {
        reportingPeriod: periodFormatted || (reporterInfo.period ? format(reporterInfo.period, 'yyyy-MM') : null),
        submissionDate: format(new Date(), 'yyyy-MM-dd'),
        reporter: {
          firstName: reporterInfo.firstName,
          lastName: reporterInfo.lastName,
          contactNumber: reporterInfo.contactNumber,
          email: reporterInfo.email,
        },
        organization: reporterInfo.organization,
        organizationId: reporterInfo.organizationId,
        datasetId: reporterInfo.datasetId,
        bedCapacity: reporterInfo.bedCapacity,
        dataValues: dataValues.filter(dv => dv.value !== '').map(dv => {
          const dataElement = metadata.dataElements.find(de => de.uid === dv.dataElementId);
          return {
            dataElement: dataElement?.code,
            value: dv.value
          };
        }),
        signature: lines
      };
      
      // In a real app, you would send this to your backend
      console.log('Submitting data:', payload);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setAlertInfo({
        open: true,
        message: 'Report submitted successfully!',
        severity: 'success'
      });
      
      // Reset form
      setActiveStep(0);
      setReporterInfo({
        firstName: '',
        lastName: '',
        contactNumber: '',
        email: '',
        organization: '',
        organizationId: '',
        period: null,
        bedCapacity: '',
        datasetId: ''
      });
      setDataValues([]);
      setSignature('');
      setPeriodFormatted('');
      
      // Clear localStorage items
      localStorage.removeItem('ihrs-selected-dataset');
      localStorage.removeItem('ihrs-selected-org');
      localStorage.removeItem('ihrs-selected-period');
    } catch (error) {
      setAlertInfo({
        open: true,
        message: 'Error submitting report. Please try again.',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle step navigation
  const handleNext = () => {
    setActiveStep(prevStep => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };

  // Check if reporter info is complete
  const isReporterInfoComplete = () => {
    return (
      reporterInfo.firstName.trim() !== '' &&
      reporterInfo.lastName.trim() !== '' &&
      reporterInfo.contactNumber.trim() !== '' &&
      reporterInfo.organization.trim() !== '' &&
      reporterInfo.datasetId.trim() !== '' &&
      reporterInfo.period !== null &&
      reporterInfo.bedCapacity.trim() !== ''
    );
  };

  // Render reporter info form
  const renderReporterInfoForm = () => {
    return (
      <FormPaper elevation={2}>
        <Typography variant="h6" gutterBottom>
          Reporter Information
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              required
              fullWidth
              label="First Name"
              value={reporterInfo.firstName}
              onChange={handleReporterInfoChange('firstName')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              required
              fullWidth
              label="Last Name"
              value={reporterInfo.lastName}
              onChange={handleReporterInfoChange('lastName')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              required
              fullWidth
              label="Contact Number"
              value={reporterInfo.contactNumber}
              onChange={handleReporterInfoChange('contactNumber')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={reporterInfo.email}
              onChange={handleReporterInfoChange('email')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth required>
              <InputLabel>Organization</InputLabel>
              <Select
                value={reporterInfo.organizationId}
                label="Organization"
                onChange={(e) => handleOrganizationChange(e as React.ChangeEvent<{ value: unknown }>)}
              >
                {organizations.map((org) => (
                  <MenuItem key={org.id} value={org.id}>
                    {org.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth required>
              <InputLabel>Dataset</InputLabel>
              <Select
                value={reporterInfo.datasetId}
                label="Dataset"
                onChange={(e) => handleDatasetChange(e as React.ChangeEvent<{ value: unknown }>)}
              >
                {datasets.map((dataset) => (
                  <MenuItem key={dataset.uid} value={dataset.uid}>
                    {dataset.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DatePicker
              label="Period"
              views={['month']}
              value={reporterInfo.period}
              onChange={handleDateChange('period')}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true
                }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              required
              fullWidth
              label="Bed Capacity"
              type="number"
              value={reporterInfo.bedCapacity}
              onChange={handleReporterInfoChange('bedCapacity')}
            />
          </Grid>
        </Grid>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleNext}
            disabled={!isReporterInfoComplete()}
          >
            Next
          </Button>
        </Box>
      </FormPaper>
    );
  };

  // Render dataset sections form
  const renderDatasetSections = () => {
    const sourceId = localStorage.getItem('ihrs-selected-org') || '';
    const dataSetId = localStorage.getItem('ihrs-selected-dataset') || '';
    const period = localStorage.getItem('ihrs-selected-period') || '';
    
    return (
      <FormPaper elevation={2}>
        <Typography variant="h6" gutterBottom>
          Laboratory Form
        </Typography>
        <TemplateMenuObjectForm 
          q={filteredDataElements}
          dataSetId={dataSetId}
          period={period}
          sourceId={sourceId}
          onSave={handleSave}
          templates={templates}
          onNext={handleNext}
        />
      </FormPaper>
    );
  };

  // Render review and submit form
  const renderReviewForm = () => {
    return (
      <FormPaper elevation={2}>
        <Typography variant="h6" gutterBottom>
          Review & Submit
        </Typography>
        
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Reporter Information
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2">
                  <strong>Name:</strong> {reporterInfo.firstName} {reporterInfo.lastName}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2">
                  <strong>Contact:</strong> {reporterInfo.contactNumber}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2">
                  <strong>Email:</strong> {reporterInfo.email || 'N/A'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2">
                  <strong>Organization:</strong> {reporterInfo.organization}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2">
                  <strong>Dataset:</strong> {datasets.find(ds => ds.uid === reporterInfo.datasetId)?.name || 'N/A'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2">
                  <strong>Reporting Period:</strong> {reporterInfo.period 
                    ? format(reporterInfo.period, 'MMMM yyyy') 
                    : 'N/A'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2">
                  <strong>Bed Capacity:</strong> {reporterInfo.bedCapacity}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2">
                  <strong>Submission Date:</strong> {format(new Date(), 'dd MMMM yyyy')}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Laboratory Data
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <StyledTableCell>Indicators</StyledTableCell>
                    <StyledTableCell align="center">Value</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDataElements.map((element) => {
                    const dataValue = dataValues.find(dv => dv.dataElementId === element.uid);
                    return (
                      <TableRow key={element.uid}>
                        <TableCell component="th" scope="row">
                          {element.name}
                        </TableCell>
                        <TableCell align="center">
                          {dataValue?.value || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
                
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Signature Pad
            </Typography>
            <Box sx={{ border: '1px dashed grey', p: 2, mb: 2 }}>
              <SignatureCanvas
                lines={lines}
                onDraw={handleDrawing}
                width={400}
                height={200}
                className="w-[400px] h-[200px] border-2 border-gray-300 rounded shadow-sm"
              />
            </Box>
            {signature ? (
              <Box>
                <Typography variant="body2" color="success.main" sx={{ mb: 1 }}>
                  Signature recorded
                </Typography>
                <Button size="small" variant="outlined" onClick={clearSignature}>
                  Clear Signature
                </Button>
              </Box>
            ) : (
              <Typography variant="body2" color="error">
                Please sign above to complete the submission
              </Typography>
            )}
          </CardContent>
        </Card>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button variant="outlined" onClick={handleBack}>
            Back
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={submitting || !signature}
          >
            {submitting ? (
              <CircularProgress size={24} />
            ) : (
              'Submit Report'
            )}
          </Button>
        </Box>
      </FormPaper>
    );
  };

  // Render the active step
  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return renderReporterInfoForm();
      case 1:
        return renderDatasetSections();
      case 2:
        return renderReviewForm();
      default:
        return null;
    }
  };

  // Main render
  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto' }}>
      <HeaderAppBar>
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="back" sx={{ mr: 2 }}>
            <FuseSvgIcon>heroicons-outline:arrow-left</FuseSvgIcon>
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Laboratory Report
          </Typography>
        </Toolbar>
      </HeaderAppBar>
      
      <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }} orientation="vertical">
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {renderStep()}
      
      <Snackbar
        open={alertInfo.open}
        autoHideDuration={6000}
        onClose={() => setAlertInfo({ ...alertInfo, open: false })}
      >
        <Alert 
          onClose={() => setAlertInfo({ ...alertInfo, open: false })} 
          severity={alertInfo.severity}
        >
          {alertInfo.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LaboratoryReportForm;