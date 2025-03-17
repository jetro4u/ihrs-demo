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
  Divider,
  IconButton,
  AppBar,
  Toolbar,
  Snackbar,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { styled } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import { convertDateToPeriod, GeneratedPeriod, PeriodTypeEnum } from '../utils/convertDateToPeriod';
import DomsSvgIcon from '../components/DomsSvgIcon';
import SignatureCanvas, { Point } from './SignatureCanvas';
import { ArrowBack, ArrowForward, ExpandMore } from '@mui/icons-material';
import TemplateMenuObjectForm from './TemplateMenuObjectForm';
import TemplateMenuValueForm from './TemplateMenuValueForm';
import QuestionBlock from './QuestionBlock';
import AggregateQuestionBlock from './AggregateQuestionBlock';
import metadata from '../metadata.json';
import { CompleteDatasetPayload, DataRecordPayload, DataValuePayload, DataValueMapping, DataElement } from '../types';

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

interface HospitalReportFormProps {
  metadata: any;
}      


const ReportLandingPage = () => {
  const steps = ['Dataset Information', 'Submit Report', 'Review & Submit'];
  const SESSION_TIMEOUT_MINUTES = 30; // Adjust as needed
  const SESSION_TIMER_CHECK_SECONDS = 60;
  
  const [alertInfo, setAlertInfo] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' });
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [templates, setTemplates] = useState([]);

  const [filteredDataElements, setFilteredDataElements] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [dataElements, setDataElements] = useState([]);
  const [mainSections, setMainSections] = useState([]);
  const [dynamicSections, setDynamicSections] = useState([]);

  const [periodFormatted, setPeriodFormatted] = useState('');
  const [lines, setLines] = useState<Point[][]>([]);
  const [organization, setOrganization] = useState('');
  const [bedCapacity, setBedCapacity] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // State for expanded sections and enabled dynamic sections
  const [expandedSections, setExpandedSections] = useState({});
  const [enabledDynamicSections, setEnabledDynamicSections] = useState({});
    
    // CompleteDatasetPayload state
  const [submittedRecords, setSubmittedRecords] = useState<DataRecordPayload[]>([]);
  const [submittedValues, setSubmittedValues] = useState<DataValuePayload[]>([]);
  const [completeDatasetInfo, setCompleteDatasetInfo] = useState<CompleteDatasetPayload>({
    dataSet: '',
    source: '',
    period: '',
    date: new Date(),
    signatures: [],
    completed: false
  });
  
  const [dataValue, setDataValue] = useState<DataValuePayload>({
    source: '',
    period: '',
    dataElement: '',
    categoryOptionCombo: '',
    attributeOptionCombo: '',
    value: '',
    date: new Date(),
    comment: null,
    followup: false
  });
  
  const [dataRecord, setDataRecord] = useState<DataRecordPayload>({
    source: '',
    period: '',
    dataElement: '',
    attributeOptionCombo: '',
    data: {},
    date: new Date(),
    comment: null,
    followup: false
  });
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

  // Function to fetch data elements and sections from metadata
  useEffect(() => {
    const loadDataAndSections = async () => {
      try {
        // Load data elements
        if (metadata && metadata.dataElements) {
          setDataElements(metadata.dataElements);
        }
        
        // Load and process sections
        if (metadata && metadata.dataSets && metadata.dataSets.length > 0) {
          const hospitalReport = metadata.dataSets.find(dataSet => dataSet.code === "HOS_REP");
          
          if (hospitalReport && hospitalReport.sections) {
            // Filter and sort main sections
            const mainSecs = hospitalReport.sections
              .filter(section => section.type === "main")
              .sort((a, b) => a.order - b.order);
            
            // Filter and sort dynamic sections
            const dynamicSecs = hospitalReport.sections
              .filter(section => section.type === "dynamic")
              .sort((a, b) => a.order - b.order);
            
            setMainSections(mainSecs);
            setDynamicSections(dynamicSecs);
            
            // Initialize expandedSections state for main sections
            const expandedSectionsState = {};
            mainSecs.forEach(section => {
              // Use section id as key for expanded state
              expandedSectionsState[section.id] = section.enabled;
            });
            setExpandedSections(expandedSectionsState);
            
            // Initialize enabledDynamicSections state for dynamic sections
            const enabledDynamicSectionsState = {};
            dynamicSecs.forEach(section => {
              // Use section id as key for enabled state
              enabledDynamicSectionsState[section.id] = section.enabled;
            });
            setEnabledDynamicSections(enabledDynamicSectionsState);
          }
        }
      } catch (error) {
        console.error("Error loading data elements and sections:", error);
        setAlertInfo({
          open: true,
          message: 'Error loading form elements. Please refresh the page.',
          severity: 'error'
        });
      }
    };
    
    loadDataAndSections();
  }, []);

  // Update filtered data elements when dataset changes
  useEffect(() => {
    if (completeDatasetInfo.dataSet && metadata?.dataElements?.length > 0) {
      const filtered = metadata.dataElements.filter(
        (de) => de.dataSets && de.dataSets.includes(completeDatasetInfo.dataSet)
      );
      setFilteredDataElements(filtered);
    }
  }, [completeDatasetInfo.dataSet, metadata?.dataElements]);
  
  useEffect(() => {
    // Restore submitted values from localStorage if available
    const savedRecords = localStorage.getItem('ihrs-submitted-records');
    if (savedRecords && submittedRecords.length === 0) {
      try {
        const parsedRecords = JSON.parse(savedRecords);
        setSubmittedRecords(parsedRecords);
        console.log("Restored records from localStorage:", parsedRecords);
      } catch (e) {
        console.error("Error parsing saved values:", e);
      }
    }
  }, []);

  useEffect(() => {
    // Event listener for tab close/refresh
    const handleTabClose = (event) => {
      // You have two options:
      // 1. Clear the data when tab is closed
      localStorage.removeItem('ihrs-submitted-records');
      
      // 2. Or show a confirmation dialog (browser dependent, may not work in all browsers)
      event.preventDefault();
      event.returnValue = 'Are you sure you want to leave? Your unsaved data will be lost.';
      return event.returnValue;
    };

    window.addEventListener('beforeunload', handleTabClose);
    
    return () => {
      window.removeEventListener('beforeunload', handleTabClose);
    };
  }, []);
  
  useEffect(() => {
    // Session timeout management
    const checkSessionTimeout = () => {
      const lastActivityTime = localStorage.getItem('ihrs-last-activity');
      
      if (lastActivityTime) {
        const currentTime = new Date().getTime();
        const lastActivity = parseInt(lastActivityTime, 10);
        const timeDifference = currentTime - lastActivity;
        
        // If more than the timeout period has passed
        if (timeDifference > SESSION_TIMEOUT_MINUTES * 60 * 1000) {
          // Clear all form data
          setSubmittedRecords([]);
          localStorage.removeItem('ihrs-submitted-records');
          
          // Clear locally stored form data
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('form-data-')) {
              localStorage.removeItem(key);
            }
          });
          
          // Update last activity time
          localStorage.setItem('ihrs-last-activity', currentTime.toString());
          
          // Notify user
          setAlertInfo({
            open: true,
            message: 'Your session timed out due to inactivity. Form data has been reset.',
            severity: 'error'
          });
        }
      } else {
        // initialize last activity time if it doesn't exist
        localStorage.setItem('ihrs-last-activity', new Date().getTime().toString());
      }
    };
    
    // Update activity timestamp on user interaction
    const updateActivity = () => {
      localStorage.setItem('ihrs-last-activity', new Date().getTime().toString());
    };
    
    // Check session timeout periodically
    const intervalId = setInterval(checkSessionTimeout, SESSION_TIMER_CHECK_SECONDS * 1000);
    
    // Add event listeners to update activity timestamp
    window.addEventListener('click', updateActivity);
    window.addEventListener('keypress', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('mousemove', updateActivity);
    
    // initialize activity timestamp
    updateActivity();
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('keypress', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('mousemove', updateActivity);
    };
  }, []);

  // Enhanced function to filter data elements by section
  const getDataElementsBySection = (selectedDataSet: string, sectionName: string): DataElement[] => {
  
    // Filter dataElements where the selectedDataSet is in the element's dataSets array
    // and the element's sectionName matches the given sectionName
    const elementsForSection = dataElements.filter(element =>
      element.dataSets.includes(selectedDataSet) &&
      element.sectionName === sectionName
    );
  
    // Optionally sort by a display order if available (using sectionDataElementOrder, fallback to 0)
    return elementsForSection.sort((a, b) => (a.sectionDataElementOrder || 0) - (b.sectionDataElementOrder || 0));
  };  

  // Toggle section expansion
  const toggleSectionExpansion = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Toggle dynamic section enabled status
  const toggleDynamicSection = (sectionId) => {
    setEnabledDynamicSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };
  
  const handleSaveRecord = async (data: DataRecordPayload) => {
    setLoading(true);
    try {
      // Prepare DataRecordPayload
      const record: DataRecordPayload = {
        source: localStorage.getItem('ihrs-selected-org') || '',
        period: localStorage.getItem('ihrs-selected-period') || '',
        dataElement: data.dataElement || '',
        attributeOptionCombo: data.attributeOptionCombo || '',
        data: data || {},
        date: new Date(),
        comment: data.comment || null,
        followup: data.followup || false
      };
    
      // Update the in-memory array of records
      const updatedRecords = submittedRecords.filter(
        r => r.dataElement !== data.dataElement
      ).concat(record);
      
      setSubmittedRecords(updatedRecords);
      setDataRecord(record);
      
      // Simulate storing in IndexedDB
      await storeInIndexedDB('dataRecords', record);
      
      setAlertInfo({
        open: true,
        message: 'Data saved successfully!',
        severity: 'success'
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error saving data:", error);
      setAlertInfo({
        open: true,
        message: 'Error saving data. Please try again.',
        severity: 'error'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };
    
  const handleSaveValue = async (data: DataValuePayload) => {
    setLoading(true);
    try {
      // Prepare DataValuePayload
      const value: DataValuePayload = {
        source: localStorage.getItem('ihrs-selected-org') || '',
        period: localStorage.getItem('ihrs-selected-period') || '',
        dataElement: data.dataElement || '',
        categoryOptionCombo: data.categoryOptionCombo || '',
        attributeOptionCombo: data.attributeOptionCombo || '',
        value: data.value || '',
        date: new Date(),
        comment: data.comment || null,
        followup: data.followup || false
      };
    
      // Update the in-memory array of values
      const updatedRecords = submittedValues.filter(
        r => r.dataElement !== data.dataElement
      ).concat(value);
      
      setSubmittedValues(updatedRecords);
      setDataValue(value);
      
      // Simulate storing in IndexedDB
      await storeInIndexedDB('dataValues', value);
      
      setAlertInfo({
        open: true,
        message: 'Data saved successfully!',
        severity: 'success'
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error saving data:", error);
      setAlertInfo({
        open: true,
        message: 'Error saving data. Please try again.',
        severity: 'error'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleRecordsUpdate = (records: any[]) => {
    setSubmittedRecords(records);
    
    localStorage.setItem('ihrs-submitted-records', JSON.stringify(records));
  };

  // Handle values update from child components
  const handleValuesUpdate = (updatedValues) => {
    setSubmittedValues(updatedValues);
    localStorage.setItem('ihrs-submitted-values', JSON.stringify(updatedValues));
  };
  
    const handleBedCapacityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setBedCapacity(event.target.value);
    };
  
    const handleDateChange = (date: Date | null) => {
      console.log("date", date);
      setSelectedDate(date);
      
      if (!date) {
        // Clear the period if date is null
        localStorage.removeItem('ihrs-selected-period');
        setPeriodFormatted('');
      }
    };
  
    const handleOrganizationChange = (event: React.ChangeEvent<{ value: unknown }>) => {
      const orgId = event.target.value as string;
    
      // If organization is changing to a different one, clear form data
      if (orgId !== completeDatasetInfo.source) {
        // Clear the submitted values
        setSubmittedRecords([]);
        localStorage.removeItem('ihrs-submitted-records');
        
        // Optionally notify the user
        setAlertInfo({
          open: true,
          message: 'Form data has been reset due to organization change',
          severity: 'success'
        });
      }
      const org = organizations.find(org => org.id === orgId);
      if (org) {
        setOrganization(org.name);
        setCompleteDatasetInfo(prev => ({
          ...prev,
          source: orgId
        }));
        setDataRecord(prev => ({
          ...prev,
          source: orgId
        }));
        localStorage.setItem('ihrs-selected-org', orgId);
      }
    };
  
    const handleDatasetChange = (event: React.ChangeEvent<{ value: unknown }>) => {
      const dataSet = event.target.value as string;
      if (dataSet !== completeDatasetInfo.dataSet) {
        // Clear the submitted values
        setSubmittedRecords([]);
        localStorage.removeItem('ihrs-submitted-records');
        
        // Optionally notify the user
        setAlertInfo({
          open: true,
          message: 'Form data has been reset due to dataset change',
          severity: 'success'
        });
      }
      setCompleteDatasetInfo(prev => ({
        ...prev,
        dataSet
      }));
      localStorage.setItem('ihrs-selected-dataset', dataSet);
      
      // When dataset changes, we might need to update the period format
      if (selectedDate) {
        handleDateChange(selectedDate);
      }
    };
    
    const handleDrawing = (newLines: Point[][]) => {
      setLines(newLines);
      setCompleteDatasetInfo(prev => ({
        ...prev,
        signatures: newLines
      }));
    };
  
    // Clear signature
    const clearSignature = () => {
      setLines([]);
      setCompleteDatasetInfo(prev => ({
        ...prev,
        signatures: []
      }));
    };
  
    // Simulate storing in IndexedDB
  const storeInIndexedDB = async (storeName: string, data: any) => {
    return new Promise((resolve, reject) => {
      try {
        // In a real app, you would use actual IndexedDB
        // This is just a simulation
        const localStorageKey = `ihrs-${storeName}-${Date.now()}`;
        localStorage.setItem(localStorageKey, JSON.stringify(data));
        setTimeout(() => resolve(true), 500); // Simulate async operation
      } catch (error) {
        reject(error);
      }
    });
  };
  
    // Handle dataset submit
  const handleDatasetSubmit = async () => {
    setSubmitting(true);
    
    try {
      // Update complete dataset payload
      const payload: CompleteDatasetPayload = {
        ...completeDatasetInfo,
        date: new Date(),
        completed: true
      };
      
      console.log('Submitting complete dataset:', payload);
      
      // Simulate API call to /api/completeDatasets
      await storeInIndexedDB('completeDatasets', payload);
      
      setAlertInfo({
        open: true,
        message: 'Report submitted successfully!',
        severity: 'success'
      });
      
      // Reset form
      setActiveStep(0);
      setCompleteDatasetInfo({
        dataSet: '',
        source: '',
        period: '',
        date: new Date(),
        signatures: [],
        completed: false
      });
      setDataRecord({
        source: '',
        period: '',
        dataElement: '',
        attributeOptionCombo: '',
        data: {},
        date: new Date(),
        comment: null,
        followup: false
      });
      setDataRecords([]);
      setLines([]);
      setPeriodFormatted('');
      setOrganization('');
      setBedCapacity('');
      setSelectedDate(null);
      
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

  // Handle navigation to next step
  
  const handleNext = () => {
    // If we have a selected date, calculate the formatted period
    if (selectedDate) {
      // Clear any previously submitted records
      setSubmittedValues([]);
      setSubmittedRecords([]);
      
      // Get the selected dataset from localStorage
      const selectedDatasetUid = localStorage.getItem('ihrs-selected-dataset');
      const selectedDataset = datasets.find(ds => ds.uid === selectedDatasetUid);
            
      let formattedPeriod: GeneratedPeriod = {
        type: '',
        format: '',
        period: ''
      };
      
      if (selectedDataset) {
        formattedPeriod = convertDateToPeriod(selectedDate, selectedDataset.periodType as PeriodTypeEnum);
        
        // Store in localStorage and state
        localStorage.setItem('ihrs-selected-period', formattedPeriod.period);
        setPeriodFormatted(formattedPeriod.period);
        
        // Update both payloads
        setCompleteDatasetInfo(prev => ({
          ...prev,
          period: formattedPeriod.period
        }));
        
        setDataRecord(prev => ({
          ...prev,
          period: formattedPeriod.period
        }));
      }
    }
    
    // Proceed to the next step
    setActiveStep((prevStep) => Math.min(prevStep + 1, steps.length - 1));
  };

  // Handle navigation to previous step
  const handleBack = () => {
    setActiveStep((prevStep) => Math.max(prevStep - 1, 0));
  };

  // Check if dataset info is complete
  const isDatasetInfoComplete = () => {
    return (
      organization.trim() !== '' &&
      completeDatasetInfo.dataSet.trim() !== '' &&
      selectedDate !== null &&
      bedCapacity.trim() !== ''
    );
  };

  // Dynamic component renderer based on section component type
  const renderSectionComponent = (section) => {
    const selectedSource = localStorage.getItem('ihrs-selected-org') || '';
    const selectedDataSet = localStorage.getItem('ihrs-selected-dataset') || '';
    const selectedPeriod = localStorage.getItem('ihrs-selected-period') || '';
    const filteredDataElements = getDataElementsBySection(selectedDataSet, section.name);
    
    switch(section.component) {
      case 'TemplateMenuObjectForm':
        return (
          <TemplateMenuObjectForm 
            q={filteredDataElements}
            dataSet={selectedDataSet}
            period={selectedPeriod}
            source={selectedSource}
            onSave={handleSaveRecord}
            templates={templates}
            existingRecords={submittedRecords}
            onRecordsUpdate={handleRecordsUpdate}
          />
        );
        
      case 'TemplateMenuValueForm':
        return (
          <TemplateMenuValueForm 
            q={filteredDataElements}
            dataSet={selectedDataSet}
            period={selectedPeriod}
            source={selectedSource}
            onSave={handleSaveValue}
            templates={templates}
            existingValues={submittedValues}
            onValuesUpdate={handleValuesUpdate}
          />
        );
        
      case 'QuestionBlock':
        return (
          <Box>
            {filteredDataElements.map(element => (
              <Box key={element.uid} sx={{ mb: 2 }}>
                <AggregateQuestionBlock
                  q={element} // Pass the individual element, not the entire array
                  dataSet={selectedDataSet}
                  period={selectedPeriod}
                  source={selectedSource}
                  onSave={handleSaveValue}
                  existingValues={submittedValues}
                  onValuesUpdate={handleValuesUpdate}
                />
              </Box>
            ))}
          </Box>
        );
      
      case 'AggregateQuestionBlock':
          return (
            <Box>
              {filteredDataElements.map(element => (
                <Box key={element.uid} sx={{ mb: 2 }}>
                  <AggregateQuestionBlock
                    q={element} // Pass the individual element, not the entire array
                    dataSet={selectedDataSet}
                    period={selectedPeriod}
                    source={selectedSource}
                    onSave={handleSaveValue}
                    existingValues={submittedValues}
                    onValuesUpdate={handleValuesUpdate}
                  />
                </Box>
              ))}
            </Box>
          );
        
      default:
        return (
          <Typography color="text.secondary">
            Unknown component type: {section.component}
          </Typography>
        );
    }
  };

  // Render dataset info form
  const renderDatasetInfoForm = () => {
    return (
      <FormPaper elevation={2}>
        <Typography variant="h6" gutterBottom>
          Dataset Information
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth required>
              <InputLabel>Organization</InputLabel>
              <Select
                value={completeDatasetInfo.source}
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
                value={completeDatasetInfo.dataSet}
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
              label="Date"
              views={['day']}
              value={selectedDate}
              onChange={(newDate) => handleDateChange(newDate)}
             // onChange={handleDateChange}
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
              value={bedCapacity}
              onChange={handleBedCapacityChange}
            />
          </Grid>
        </Grid>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleNext}
            disabled={!isDatasetInfoComplete()}
          >
            Next
          </Button>
        </Box>
      </FormPaper>
    );
  };

  // Render general patient statistics form with better organization
  const renderDatasetSections = () => {
    return (
      <Box>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Hospital Report Form
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please complete all applicable sections below. Your report will be saved automatically as you progress.
          </Typography>
          
          {/* Main Sections - Always Visible but collapsible */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Required Information
            </Typography>
            
            {/* Render main sections dynamically from metadata */}
            {mainSections.map(section => (
              <Accordion 
                key={section.id}
                expanded={expandedSections[section.id] !== undefined ? expandedSections[section.id] : section.enabled} 
                onChange={() => toggleSectionExpansion(section.id)}
                sx={{ mb: 2 }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  aria-controls={`section-${section.id}-content`}
                  id={`section-${section.id}-header`}
                >
                  <Typography variant="subtitle1">{section.name}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {renderSectionComponent(section)}
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
          
          {/* Dynamic Sections Selection */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Specialized Services
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select the specialized services offered by your facility to enable the corresponding form sections.
            </Typography>
            
            <Paper sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={2}>
                {dynamicSections.map(section => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={section.id}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={enabledDynamicSections[section.id] || false}
                          onChange={() => toggleDynamicSection(section.id)}
                        />
                      }
                      label={section.name}
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Box>
          
          {/* Render sections for enabled dynamic services */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Active Specialized Service Forms
            </Typography>
            
            {/* Dynamically render enabled dynamic sections */}
            {dynamicSections
              .filter(section => enabledDynamicSections[section.id])
              .map(section => (
                <Accordion key={section.id} sx={{ mb: 2 }}>
                  <AccordionSummary
                    expandIcon={<ExpandMore />}
                    aria-controls={`section-${section.id}-content`}
                    id={`section-${section.id}-header`}
                  >
                    <Typography variant="subtitle1">{section.name}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {renderSectionComponent(section)}
                  </AccordionDetails>
                </Accordion>
              ))
            }
            
            {/* No dynamic sections enabled message */}
            {!dynamicSections.some(section => enabledDynamicSections[section.id]) && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 3 }}>
                No specialized services selected. Enable services above to see their form sections here.
              </Typography>
            )}
          </Box>
          
          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              variant="outlined"
              onClick={() => setActiveStep(0)}
              startIcon={<ArrowBack />}
            >
              Previous
            </Button>
            <Button
              variant="contained"
              onClick={() => setActiveStep(2)}
              endIcon={<ArrowForward />}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Review & Submit'}
            </Button>
          </Box>
        </Paper>
      </Box>
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
              Dataset Information
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2">
                  <strong>Organization:</strong> {organization}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2">
                  <strong>Dataset:</strong> {datasets.find(ds => ds.uid === completeDatasetInfo.dataSet)?.name || 'N/A'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2">
                  <strong>Reporting Period:</strong> {selectedDate 
                    ? format(selectedDate, 'MMMM yyyy') 
                    : 'N/A'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2">
                  <strong>Bed Capacity:</strong> {bedCapacity}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Hospital Data
            </Typography>
            
            {submittedRecords.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <StyledTableCell>Indicators</StyledTableCell>
                    <StyledTableCell align="center">Value</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {submittedRecords.map((record, index) => {
                    const dataElement = filteredDataElements.find(
                      (element) => element.uid === record.dataElement                    );
                    let displayContent: React.ReactNode = '-';
                    if (record.data) {
                      let recordData: any;
                      try {
                        recordData =
                          typeof record.data.data === 'string'
                            ? JSON.parse(record.data.data)
                            : record.data.data;
                      } catch (err) {
                        recordData = record.data.data;
                      }

                      if (
                        recordData &&
                        typeof recordData === 'object' &&
                        !Array.isArray(recordData)
                      ) {
                        displayContent = (
                          <Box>
                            {Object.entries(recordData).map(([key, value]) => {
                              const formattedKey = key
                                .replace(/([A-Z])/g, ' $1')
                                .replace(/^./, (str) => str.toUpperCase());
                              return (
                                <Typography key={key} variant="body2">
                                  {formattedKey}: {String(value)}
                                </Typography>
                              );
                            })}
                          </Box>
                        );
                      } else if (Array.isArray(recordData)) {
                        displayContent = recordData.join(', ');
                      } else if (typeof recordData === 'boolean') {
                        displayContent = recordData ? 'Yes' : 'No';
                      } else {
                        displayContent = String(recordData);
                      }
                    }
                    return (
                      <React.Fragment key={record.dataElement}>
                        {dataElement && (
                          <TableRow>
                            <TableCell component="th" scope="row">
                              {dataElement.name}
                            </TableCell>
                            <TableCell align="center">{displayContent}</TableCell>
                          </TableRow>
                        )}
                        {index < submittedRecords.length - 1 && (
                          <TableRow>
                            <TableCell colSpan={2} sx={{ p: 0 }}>
                              <Divider />
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            ) : (
              <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 3 }}>
                No data has been submitted yet. Please go back and fill in some indicators.
              </Typography>
            )}
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
            {lines.length > 0 ? (
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
            onClick={handleDatasetSubmit}
            disabled={submitting || lines.length === 0 || submittedRecords.length === 0}
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
        return renderDatasetInfoForm();
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
            <DomsSvgIcon>heroicons-outline:arrow-left</DomsSvgIcon>
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Hospital Report
          </Typography>
          <IconButton 
            color="inherit" 
            onClick={() => setCollapsed(prev => !prev)}
            aria-label={collapsed ? "expand" : "collapse"}
          >
            <DomsSvgIcon>
              {collapsed ? 'heroicons-outline:chevron-down' : 'heroicons-outline:chevron-up'}
            </DomsSvgIcon>
          </IconButton>
        </Toolbar>
      </HeaderAppBar>
      
      <Box sx={{ display: collapsed ? 'none' : 'block' }}>
        <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }} orientation="vertical">
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>
      
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

export default ReportLandingPage;