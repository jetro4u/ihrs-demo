import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Stepper,
  Step,
  StepLabel,
  Divider,
  Snackbar,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
  Icon,
  IconButton,
  Toolbar,
  AppBar
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { styled } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers';
import { ArrowBack, ArrowForward, ExpandMore, Print, Description } from '@mui/icons-material';
import { convertDateToPeriod, GeneratedPeriod } from '../utils/convertDateToPeriod';
import SignatureCanvas, { Point } from './SignatureCanvas';
import TemplateMenuObjectForm from './TemplateMenuObjectForm';
import ObjectAutoCompleteSelect from './ObjectAutoCompleteSelect';
import { PDFViewer } from '@react-pdf/renderer';
import DomsSvgIcon from '../components/DomsSvgIcon';
import ObjectFormBlockReportPDF from './ObjectFormBlockReportPDF';
import metadata from '../metadata.json';
import { initDB, storeDataRecord, getDataRecords, retryAllFailedData, submitToServerWithRetry } from '../../../../../services/indexedDB';
import { AggregationType, PeriodType, DataSet, CompleteDatasetPayload, DataRecordPayload, DataValuePayload, StoredDataRecord, DataElement } from '../types';

// Styled components
const FormPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: 12,
  width: '100%',
  maxWidth: '100%',
  boxSizing: 'border-box',
  overflowX: 'hidden',
  '& .MuiTable-root': {
    tableLayout: 'fixed',
    width: '100%',
    maxWidth: '100%'
  },
  '& .MuiTableContainer-root': {
    overflowX: 'auto',
    width: '100%'
  }
})); 

const HeaderAppBar = styled(AppBar)(({ theme }) => ({
  position: 'relative',
  boxShadow: theme.shadows[1],
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  padding: theme.spacing(1, 2),
  marginBottom: theme.spacing(3)
})); 

interface ObjectFormBlockReportLandingPageProps {
  title: string;
  category: string;
  dataSetUid: string;
}

const ObjectFormBlockReportLandingPage: React.FC<ObjectFormBlockReportLandingPageProps> = ({ title, category, dataSetUid }) => {
  const steps = ['Dataset Information', 'Submit Report', 'Review & Submit'];
  const [alertInfo, setAlertInfo] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' });
  const [loading, setLoading] = useState(false);
  const [submittedRecords, setSubmittedRecords] = useState<DataRecordPayload[]>([]);
  const [submittedValues, setSubmittedValues] = useState<DataValuePayload[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [dataElements, setDataElements] = useState([]);
  const [mainSections, setMainSections] = useState([]);
  const [templates, setTemplates] = useState([]);

  const [filteredDataElements, setFilteredDataElements] = useState([]);
  const [periodFormatted, setPeriodFormatted] = useState('');
  const [lines, setLines] = useState<Point[][]>([]);
  const [organization, setOrganization] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDataSet, setSelectedDataSet] = useState<Partial<DataSet>>({});
  const [collapsed, setCollapsed] = useState(false);
  const [showStepper, setShowStepper] = useState(true);
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [dbInitialized, setDbInitialized] = useState(false);
  
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const contentRef = useRef(null);
  const [expandedSections, setExpandedSections] = useState({});
  const SESSION_TIMEOUT_MINUTES = 30; // Adjust as needed
  const SESSION_TIMER_CHECK_SECONDS = 60;
  const reporterName = React.useMemo(() => {
  const userId = localStorage.getItem('user-id') || 'demo-user';
  const userDetails = {
    'demo-user': { firstName: 'Jane', lastName: 'Doe' },
    'user-123': { firstName: 'John', lastName: 'Smith' },
    'user-456': { firstName: 'Alex', lastName: 'Johnson' }
  };
  
  const user = userDetails[userId] || { firstName: 'Demo', lastName: 'User' };
    return `${user.firstName} ${user.lastName}`;
  }, []);
    
    // CompleteDatasetPayload state
  const [completeDatasetInfo, setCompleteDatasetInfo] = useState<CompleteDatasetPayload>({
    dataSet: '',
    source: '',
    period: '',
    date: new Date(),
    signatures: [],
    completed: false
  });
  
  const [dataRecord, setDataRecord] = useState<DataRecordPayload>({
    source: '',
    period: '',
    dataElement: '',
    data: {},
    date: new Date(),
    comment: null,
    followup: false
  });

  const orgs = metadata?.organisations || [];
  const organizations = orgs.filter(org => org.level === 5);
  const datasets = metadata?.dataSets as DataSet[] || [];

  const groupDataElementsBySection = () => {
    if (!submittedRecords || !Array.isArray(submittedRecords) || submittedRecords.length === 0) {
      console.log('No data to group or submittedRecords is undefined');
      return { mainSectionData: [] };
    }
    
    // Get the selected dataset from state
    const dataSetId = completeDatasetInfo?.dataSet;
    if (!dataSetId) {
      console.error('No dataset ID available in completeDatasetInfo');
      return { mainSectionData: [] };
    }
    if (!metadata || !metadata.dataElements) {
      console.error('Metadata or dataElements is undefined');
      return { mainSectionData: [] };
    }
    
    // Create the section element mapping
    const sectionElementMapping = createSectionElementMapping(dataSetId);
    
    console.log('Section to element mapping:', sectionElementMapping);
    
    const recordMap = new Map();
    submittedRecords.forEach(record => {
      if (!recordMap.has(record.dataElement)) {
        recordMap.set(record.dataElement, []);
      }
      recordMap.get(record.dataElement).push(record);
    });
  
    if (!mainSections || !Array.isArray(mainSections) || mainSections.length === 0) {
      console.error('No main sections available');
      return { mainSectionData: [] };
    }
    
    // Debug the maps
    console.log('Record map has entries for elements:', Array.from(recordMap.keys()));
    
    const mainSectionData = mainSections.map(section => {
      const sectionElementIds = sectionElementMapping[section.id] || [];
      
      const sectionRecords = [];
      
      // Collect values and records for this section
      sectionElementIds.forEach(elementId => {
        if (recordMap.has(elementId)) {
          sectionRecords.push(...recordMap.get(elementId));
        }
      });
      
      console.log(`Section ${section.name} has ${sectionRecords.length} records`);
      
      return {
        section,
        elements: sectionElementIds
          .map(id => metadata.dataElements?.find(el => el.uid === id))
          .filter(Boolean),
        records: sectionRecords
      };
    });
      
    return { mainSectionData };
  };

  // Add this function as a fallback
  const groupDataByElementDirectly = () => {
    const mainSectionData = mainSections.map(section => {
      // Get all elements that belong to this section
      const sectionElements = metadata.dataElements?.filter(el => 
        el.section && el.section.name === section.name
      ) || [];
      
      const sectionElementIds = sectionElements.map(el => el.uid);
      
      const sectionRecords = submittedRecords.filter(rec => 
        sectionElementIds.includes(rec.dataElement)
      );
      
      console.log(`Direct mapping: Section ${section.name} has ${sectionRecords.length} records`);
      
      return {
        section,
        elements: sectionElements,
        records: sectionRecords
      };
    });
    
    return { mainSectionData };
  };

  // Add a function to automatically retry failed submissions
  const retryFailedSubmissions = async () => {
    setLoading(true);
    try {
      // Get all failed records and values
      const result = await retryAllFailedData();
      
      if (result.records > 0) {
        setAlertInfo({
          open: true,
          message: `Successfully resubmitted ${result.records} records.`,
          severity: 'success'
        });
      } else {
        setAlertInfo({
          open: true,
          message: 'No failed submissions were resubmitted successfully.',
          severity: 'info'
        });
      }
    } catch (error) {
      console.error('Error retrying failed submissions:', error);
      setAlertInfo({
        open: true,
        message: `Error retrying failed submissions: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Add this useEffect to set up periodic retries of failed submissions
  useEffect(() => {
    if (!dbInitialized) return;
    
    retryFailedSubmissions();
    
    const retryInterval = setInterval(retryFailedSubmissions, 5 * 60 * 1000);
    
    // Clear the interval when the component unmounts
    return () => {
      clearInterval(retryInterval);
    };
  }, [dbInitialized]);

  useEffect(() => {
    const setupDb = async () => {
      try {
        await initDB();
        setDbInitialized(true);
        console.log('IndexedDB initialized successfully');
      } catch (error) {
        console.error('Failed to initialize IndexedDB:', error);
        setAlertInfo({
          open: true,
          message: 'Failed to initialize database. Please refresh the page.',
          severity: 'error'
        });
      }
    };
    
    setupDb();
  }, []);

  // Handle scroll events to collapse/expand stepper
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const scrollTop = contentRef.current.scrollTop;
        
        // Determine scroll direction
        if (scrollTop > lastScrollTop && scrollTop > 50) {
          // Scrolling down past threshold - hide stepper
          setShowStepper(false);
        } else if (scrollTop < lastScrollTop || scrollTop <= 50) {
          // Scrolling up or at top - show stepper
          setShowStepper(true);
        }
        
        // Update last scroll position
        setLastScrollTop(scrollTop);
      }
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
      return () => contentElement.removeEventListener('scroll', handleScroll);
    }
  }, [lastScrollTop]);
  
  // Effect to fetch templates from API
  useEffect(() => {
    const loadDataAndSections = async () => {
      try {
        if (metadata && metadata.dataElements) {
          setDataElements(metadata.dataElements);
        }
        
        // Load and process sections
        if (metadata && metadata.dataSets && metadata.dataSets.length > 0) {
          const objectReport = datasets.find(ds => ds.uid === dataSetUid);
          console.log("objectReport", objectReport)
          console.log("objectReport.sections", objectReport.sections)
          
          if (objectReport && objectReport.sections) {
            const mainSecs = objectReport.sections
              .filter(section => section.type === "dynamic")
              .sort((a, b) => a.sortOrder - b.sortOrder);
              console.log("mainSecs", mainSecs)
            
            setMainSections(mainSecs);
            
            // Initialize expandedSections state for main sections
            const expandedSectionsState = {};
            mainSecs.forEach(section => {
              // Use section id as key for expanded state
              expandedSectionsState[section.id] = section.enabled;
            });
            console.log("expandedSectionsState", expandedSectionsState)
            setExpandedSections(expandedSectionsState);
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
      const filtered = metadata.dataElements.filter(de =>
        de.dataSets && de.dataSets.some(ds => ds.id === completeDatasetInfo.dataSet)
      );
      setFilteredDataElements(filtered);
    }
  }, [completeDatasetInfo.dataSet, metadata?.dataElements]);

  useEffect(() => {
    // Event listener for tab close/refresh
    const handleTabClose = (event) => {
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

  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide stepper when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowStepper(false);
      } else if (currentScrollY < lastScrollY) {
        setShowStepper(true);
      }
      
      lastScrollY = currentScrollY;
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  

    
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
  
  // Add this useEffect to ensure data is loaded when needed
  useEffect(() => {
    // Initialize IndexedDB when component mounts
    if (!dbInitialized && completeDatasetInfo?.dataSet) {
      const initializeDB = async () => {
        try {
          await initDB();
          setDbInitialized(true);
          console.log('IndexedDB initialized successfully');
          
          // Load data after DB is initialized
          await loadDataFromIndexedDB();
        } catch (error) {
          console.error('Failed to initialize IndexedDB:', error);
          setAlertInfo({
            open: true,
            message: 'Failed to initialize database: ' + error.message,
            severity: 'error'
          });
        }
      };
      
      initializeDB();
    } else if (dbInitialized && completeDatasetInfo?.dataSet && activeStep === 2) {
      // Load data when moving to review step
      loadDataFromIndexedDB();
    }
  }, [dbInitialized, completeDatasetInfo, activeStep]);
  
    // Enhanced function to filter data elements by section
  const getDataElementsBySection = (selectedDataSet: string, sectionName: string): DataElement[] => {
    console.log("selectedDataSet", selectedDataSet)
    console.log("sectionName", sectionName)
  
    // Filter dataElements where the selectedDataSet is in the element's dataSets array
    // and the element's sectionName matches the given sectionName
    const elementsForSection = dataElements.filter(element =>
      element.dataSets && 
      element.dataSets.some(ds => ds.id === selectedDataSet) &&
      element.section && // Check if section exists
      element.section.name === sectionName
    );
    console.log("elementsForSection", elementsForSection)
  
    // Optionally sort by a display order if available (using sectionDataElementOrder, fallback to 0)
    return elementsForSection.sort((a, b) => (a.section.deOrder || 0) - (b.section.deOrder || 0));
  }; 

  // Toggle section expansion
  const toggleSectionExpansion = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  /**
  * Handles form block submission and routes to appropriate storage
  * @param {string | Record<string, any>} data - The data submitted from the form block
  * @param {string} dataElement - The ID of the data element
  */
  const handleFormBlockSubmit = async (
    data: string | Record<string, any>, 
    dataElement: string
  ): Promise<{ success: boolean }> => {
    console.log('Form block submit:', {  
      dataElement, 
      data 
    });
    
    if (!data) {
      console.error('No data provided to handleFormBlockSubmit');
      return { success: false };
    }
    
    try {
      setLoading(true);
      const recordPayload = {
        source: completeDatasetInfo.source,
        period: completeDatasetInfo.period,
        dataElement: dataElement,
        data: data as Record<string, any>,
        date: new Date(),
        comment: null,
        followup: false
      };
      
      console.log('Saving as record:', recordPayload);
      const result = await handleSaveRecord(recordPayload);
      
      return result;

    } catch (error) {
      console.error('Error in handleFormBlockSubmit:', error);
      setAlertInfo({
        open: true,
        message: `Error saving data: ${error.message || 'Unknown error'}`,
        severity: 'error'
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };
    
  // Handler for saving data records
  const handleSaveRecord = async (record: DataRecordPayload): Promise<{ success: boolean }> => {
    if (!dbInitialized) {
      setAlertInfo({
        open: true,
        message: 'Database not initialized yet. Please try again.',
        severity: 'error'
      });
      return { success: false };
    }
    try {
      setLoading(true);
    
      // Ensure required fields are present
      if (!record.source) record.source = completeDatasetInfo.source;
      if (!record.period) record.period = completeDatasetInfo.period;
      
      console.log('Saving record to IndexedDB:', record);

      // Try to submit to server first
      try {
        await submitToServerWithRetry(record, 'record');
        // Server submission successful
      } catch (serverError) {
        // Server submission failed, but we'll continue to save locally
        console.log('Server submission failed, storing locally:', serverError);
        // Note: the failed record is already stored in the failed records store by submitToServerWithRetry
      }
  
      // Store in IndexedDB regardless of server response - will generate a uniqueKey internally
      const savedRecord: StoredDataRecord = await storeDataRecord(record);
  
      // Update state with the new record
      setSubmittedRecords((prevRecords: StoredDataRecord[]) => {
        const existingIndex = prevRecords.findIndex(r => 
          r.uniqueKey === savedRecord.uniqueKey || 
          (r.dataElement === savedRecord.dataElement && 
          r.source === savedRecord.source));
  
        if (existingIndex >= 0) {
          const updatedRecords = [...prevRecords];
          updatedRecords[existingIndex] = savedRecord;
          return updatedRecords;
        } else {
          return [...prevRecords, savedRecord];
        }
      });
  
      setAlertInfo({
        open: true,
        message: 'Record saved successfully',
        severity: 'success'
      });
  
      // Return expected success response
      return { success: true };
  
    } catch (error) {
      console.error('Failed to save record:', error);
      setAlertInfo({
        open: true,
        message: 'Failed to save record: ' + error.message,
        severity: 'error'
      });
  
      return { success: false }; // Ensure the expected return type
    } finally {
      setLoading(false);
    }
  }; 
  
  const handleRecordsUpdate = (records: DataRecordPayload[]) => {
    setSubmittedRecords(records);
  };
  
  const loadDataFromIndexedDB = async () => {
    try {
      setLoading(true);
      const { source, period, dataSet } = completeDatasetInfo;
    
      if (!source || !period || !dataSet) {
        console.warn('Missing source, period, or dataSet in completeDatasetInfo');
        setLoading(false);
        return;
      }
    
      console.log('Loading data from IndexedDB for:', { source, period, dataSet });
      
      // Load values and records from IndexedDB
      const records = await getDataRecords(period, source);
    
      console.log('Loaded data:', { records: records.length });
      
      const selectedds = datasets.find(ds => ds.uid === dataSet);
      const selectedDataset: DataSet = {
        ...selectedds,
        periodType: selectedds.periodType as PeriodType,
        aggregationType: selectedds.aggregationType as AggregationType
      };
      if (selectedDataset) {
        setSelectedDataSet(selectedDataset);
      } else {
        console.error(`Dataset with ID ${dataSet} not found in metadata`);
      }
      
      setSubmittedRecords(records);
      
      // Set formatted period for display
      if (period) {
        try {
          // This assumes period is in format YYYYMM
          const year = period.substring(0, 4);
          const month = period.substring(4, 6);
          const date = new Date(parseInt(year), parseInt(month) - 1);
          const formatter = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'long' });
          setPeriodFormatted(formatter.format(date));
        } catch (error) {
          console.error('Error formatting period:', error);
          setPeriodFormatted(period);
        }
      }
    } catch (error) {
      console.error('Failed to load data from IndexedDB:', error);
      setAlertInfo({
        open: true,
        message: 'Failed to load data: ' + error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const createSectionElementMapping = (dataSetId) => {
    const sectionElementMapping = {};
    
    const selectedDataset = datasets.find(ds => ds.uid === dataSetId);
    
    if (selectedDataset && selectedDataset.sections) {
      // Log for debugging
      console.log('Creating mapping for dataset:', selectedDataset.name);
      
      selectedDataset.sections.forEach(section => {
        // Initialize array for this section
        sectionElementMapping[section.id] = [];
        
        if (section.dataElements && section.dataElements.length > 0) {
          // Handle both array of strings and array of objects
          const elementIds = section.dataElements.map(de => 
            typeof de === 'string' ? de : (de.uid)
          );
          
          sectionElementMapping[section.id] = elementIds;
          console.log(`Section ${section.name} mapped to ${elementIds.length} elements:`, elementIds);
        } else {
          console.warn(`Section ${section.name} has no data elements`);
        }
      });
    } else {
      console.error(`Dataset with ID ${dataSetId} not found or has no sections`);
    }
    
    return sectionElementMapping;
  };
    
  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    
    if (!date) {
      // Clear the period if date is null
      localStorage.removeItem('ihrs-selected-period');
      setPeriodFormatted('');
    }
  };
    
  const handleOrganizationChange = (selectedOrg: { id: string; name: string; /* other properties */ } | null) => {
    if (!selectedOrg) return;
    
    const orgId = selectedOrg.id;
  
    // If organization is changing to a different one, clear form data
    if (orgId !== completeDatasetInfo.source) {
      // Clear the submitted values
      setSubmittedRecords([]);
      setSubmittedValues([]);
      
      // Optionally notify the user
      setAlertInfo({
        open: true,
        message: 'Form data has been reset due to organization change',
        severity: 'success'
      });
    }
    
    setOrganization(selectedOrg.name);
    setCompleteDatasetInfo(prev => ({
      ...prev,
      source: orgId
    }));
  
    // After updating the source, load data if period is already selected
    if (completeDatasetInfo.period) {
      loadDataFromIndexedDB();
    }
    localStorage.setItem('ihrs-selected-org', orgId);
  };
      
  const handleDatasetChange = (selectedDataset: DataSet | null) => {
    if (!selectedDataset) return;
    
    const dataSet = selectedDataset.uid;
    //const selectedDatasetWithEnum = datasets.find(ds => ds.uid === dataSet);
    const selectedds: DataSet = {
      ...selectedDataset,
      aggregationType: selectedDataset.aggregationType as AggregationType
    };
    setSelectedDataSet(selectedds)
    
    if (dataSet !== completeDatasetInfo.dataSet) {
      setSubmittedRecords([]);
      setSubmittedValues([]);
      
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
    localStorage.setItem('ihrs-selected-dataset', JSON.stringify(selectedds));
    
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
    
  const clearSignature = () => {
    setLines([]);
    setCompleteDatasetInfo(prev => ({
      ...prev,
      signatures: []
    }));
  };
    
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
        data: {},
        date: new Date(),
        comment: null,
        followup: false
      });
      setLines([]);
      setPeriodFormatted('');
      setOrganization('');
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
    
    const handleNext = () => {
      // If we have a selected date, calculate the formatted period
      if (selectedDate) {
        setSubmittedRecords([]);
        
        // Get the selected dataset from localStorage
        const dataset = localStorage.getItem('ihrs-selected-dataset');
        const retrievedDataset = JSON.parse(dataset);
        const selectedDataset = datasets.find(ds => ds.uid === retrievedDataset.uid);
              
        let formattedPeriod: GeneratedPeriod = {
          type: '',
          format: '',
          period: ''
        };
        
        if (selectedDataset) {
          formattedPeriod = convertDateToPeriod(selectedDate, selectedDataset.periodType);
          
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
        selectedDate !== null
      );
    };

    // Dynamic component renderer based on section component type
  const renderSectionComponent = (section) => {
    console.log("section?????????", section)
    const selectedSource = localStorage.getItem('ihrs-selected-org') || '';
    const dataset = localStorage.getItem('ihrs-selected-dataset');
    const selectedDataSet = JSON.parse(dataset) as DataSet;
    console.log("selectedDataSet", selectedDataSet)
    const selectedPeriod = localStorage.getItem('ihrs-selected-period') || '';
    const filteredDataElements = getDataElementsBySection(selectedDataSet.uid, section.name);
    console.log("filteredDataElements", filteredDataElements)
    console.log("section.name", section.name)
    const filteredDataSet = {
      ...selectedDataSet,
      sections: selectedDataSet.sections?.filter(sec => sec.name === section.name) || []
    };
    
    return (
      <TemplateMenuObjectForm 
        q={filteredDataElements}
        dataSet={filteredDataSet}
        period={selectedPeriod}
        source={selectedSource}
        onSubmit={(data, dataElement) => handleFormBlockSubmit(data, dataElement)}
        templates={templates}
        existingRecords={submittedRecords}
        onRecordsUpdate={handleRecordsUpdate}
      />
    );
  };
  
  const renderDatasetInfoForm = () => {
    return (
      <FormPaper elevation={2}>
        <Typography variant="h6" gutterBottom>
          Dataset Information
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth required>
            <ObjectAutoCompleteSelect
              freeSolo={false}
              options={organizations}
              value={organizations.find(org => org.id === completeDatasetInfo.source) || null}
              onChange={(selectedOrg) => handleOrganizationChange(selectedOrg)}
              labelField="name"
              valueField="uid"
              label="Organization"
              id="org-select"
              disabled={loading}
              groupOption={false}
            />
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth required>
              <ObjectAutoCompleteSelect
                freeSolo={false}
                options={datasets}
                value={datasets.find(dataset => dataset.uid === completeDatasetInfo.dataSet) || null}
                onChange={(e: any) => {
                  handleDatasetChange(e as DataSet);
                }}
                labelField="name"
                valueField="uid"
                label="Dataset"
                id="dataset-select"
                disabled={loading}
                groupOption={false}
              />
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DatePicker
              label="Date"
              views={['day']}
              value={selectedDate}
              onChange={(newDate) => handleDateChange(newDate)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true
                }
              }}
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
  
  const renderDatasetSections = () => {
    return (
      <Box sx={{
        height: '100%',
        overflow: 'visible'
      }}>
        <Paper sx={{ 
          p: { xs: 1, sm: 2, md: 3 },
          mb: 3, 
          width: '100%', 
          maxWidth: '100%', 
          boxSizing: 'border-box',
          overflowX: 'hidden'
        }}>
          <Typography variant="h5" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please complete all applicable sections below. Your report will be saved automatically as you progress.
          </Typography>
          
          {/* Main Sections - Always Visible but collapsible */}
          <Box sx={{ 
            mb: { xs: 3, sm: 4, md: 5 }, // Reduced margin on mobile
            p: { xs: 1, sm: 2, md: 3 }, // Reduced padding on mobile
            bgcolor: '#f8f9fa', 
            borderRadius: 2,
            border: '1px solid #e0e0e0'
          }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                mb: 2,
                pb: 1,
                borderBottom: '2px solid #1976d2',
                display: 'inline-block'
              }}
            >
              Required Information
            </Typography>
            
            {/* Render main sections dynamically from metadata */}
            {mainSections.map((section, index) => (
              <Accordion 
                key={section.id}
                expanded={expandedSections[section.id] !== undefined ? expandedSections[section.id] : section.enabled} 
                onChange={() => toggleSectionExpansion(section.id)}
                sx={{ 
                  mb: { xs: 1, sm: 2 }, // Reduced margin between accordions
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  '&.Mui-expanded': {
                    border: '2px solid #1976d2',
                    bgcolor: 'rgba(25, 118, 210, 0.03)'
                  },
                  '&:before': {
                    display: 'none'
                  },
                  width: '100%'
                }}
                slotProps={{ transition: { unmountOnExit: true } }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  aria-controls={`section-${section.id}-content`}
                  id={`section-${section.id}-header`}
                  sx={{
                    bgcolor: '#e3f2fd',
                    '&.Mui-expanded': {
                      bgcolor: '#bbdefb'
                    },
                    minHeight: { xs: '48px', sm: 'auto' }, // Reduce header height on mobile
                    '& .MuiAccordionSummary-content': {
                      margin: { xs: '8px 0', sm: '12px 0' } // Reduce margin in accordion summary
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600,
                        color: '#0d47a1',
                        mr: 1,
                        fontSize: { xs: '1rem', sm: '1.1rem' } // Slightly smaller on mobile
                      }}
                    >
                      {index + 1}.
                    </Typography>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 600,
                        fontSize: { xs: '0.95rem', sm: '1.1rem' } // Slightly smaller on mobile
                      }}
                    >
                      {section.name}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ 
                  padding: { xs: '8px', sm: '12px', md: '16px' }, // Greatly reduced padding
                  maxHeight: { xs: '65vh', sm: '70vh' }, // Slightly smaller max height on mobile
                  overflow: 'auto',
                  borderTop: '1px solid #e0e0e0',
                  '& .MuiFormControl-root': {
                    width: '100%',
                    maxWidth: '100%',
                    marginBottom: { xs: '8px', sm: '16px' } // Less spacing between form elements
                  },
                  '& .MuiBox-root': {
                    width: '100%',
                    maxWidth: '100%',
                    padding: { xs: 0, sm: '4px' } // Remove padding in nested boxes on mobile
                  },
                  '& .MuiGrid-container': {
                    margin: 0,
                    width: '100%'
                  },
                  '& .MuiGrid-item': {
                    padding: { xs: '4px', sm: '8px' } // Reduced grid item padding
                  },
                  '& .MuiFormLabel-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' } // Smaller labels on mobile
                  },
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' } // Smaller input text on mobile
                  }
                }}>
                  {renderSectionComponent(section)}
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
          
          {/* Navigation Buttons */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mt: 4,
            position: 'sticky', // Changed from fixed to sticky
            bottom: 16,
            backgroundColor: 'background.paper',
            padding: { xs: 1, sm: 2 },
            zIndex: 1050,
            boxShadow: '0px -2px 4px rgba(0,0,0,0.1)',
            width: '100%',
            boxSizing: 'border-box',
            left: 'auto',
            right: 'auto',
            margin: '0',
            borderRadius: 1
          }}>
            <Button
              variant="outlined"
              onClick={() => setActiveStep(0)}
              startIcon={<ArrowBack />}
              size='small'
              sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
            >
              Previous
            </Button>
            <Button
              variant="contained"
              onClick={() => setActiveStep(2)}
              endIcon={<ArrowForward />}
              disabled={loading}
              size='small'
              sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
            >
              {loading ? <CircularProgress size={20} /> : 'Review & Submit'}
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  };

  const renderReviewForm = () => {
    const selectedOrg = organizations.find(org => org.id === completeDatasetInfo.source);
  
    console.log('Rendering review form with:', {
      dataset: selectedDataSet,
      submittedRecords: submittedRecords.length
    });
    
  let { mainSectionData } = groupDataElementsBySection();
  
  console.log('Grouped data:', {
    mainSections: mainSectionData.length
  });

  const hasAnyData = mainSectionData.some(section => 
    section.records.length > 0
  );
  
  // If no data was found using the mapping, try direct lookup
  if (!hasAnyData && (submittedRecords.length > 0)) {
    console.log('No data found using mapping, trying direct lookup');
    const directData = groupDataByElementDirectly();
    mainSectionData = directData.mainSectionData;
  }
    
    const getElementName = (elementId) => {
      const element = metadata.dataElements?.find(el => el.uid === elementId);
      return element ? element.name : elementId;
    };

    const renderRecordDisplay = (record) => {
      let entries = Object.entries(record.data || {});
      
      // Sort entries based on the sortOrder of questions in metadata.dataElements
      entries = entries.sort((a, b) => {
        const questionA = metadata.dataElements?.find(el => el.uid === a[0]);
        const questionB = metadata.dataElements?.find(el => el.uid === b[0]);
        
        if (questionA?.sortOrder !== undefined && questionB?.sortOrder !== undefined) {
          return questionA.sortOrder - questionB.sortOrder;
        }
        
        // Fallback to alphabetical sorting if sortOrder is not available
        return a[0].localeCompare(b[0]);
      });
      
      return (
        <Box key={record.uniqueKey || `${record.dataElement}-${record.attributeOptionCombo}`} sx={{ mb: 2, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="subtitle2">{getElementName(record.dataElement) || 'Record'}</Typography>
          {entries.map(([key, value]) => (
            <Typography key={key} variant="body2" component="div" sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{key}:</span>
              <strong>{String(value)}</strong>
            </Typography>
          ))}
        </Box>
      );
    };   
    
    const renderSectionData = (sectionData) => {
      const { section, records } = sectionData;
      
      return (
        <Box key={section.id} sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>{section.name}</Typography>
          
          {/* Render records */}
          {records.length > 0 && (
            <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Records</Typography>
              {records.map(renderRecordDisplay)}
            </Paper>
          )}
        </Box>
      );
    };
    
    const handleGenerateReport = () => {
      setIsPdfOpen(true);
    };
    
    return (
      <Box>
        {isPdfOpen ? (
          <Box sx={{ height: '80vh', width: '100%' }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => setIsPdfOpen(false)}>
                Back to Review
              </Button>
              <Button variant="contained" startIcon={<Print />} onClick={() => window.print()}>
                Print Report
              </Button>
            </Box>
            <PDFViewer width="100%" height="100%">
              <ObjectFormBlockReportPDF 
                dataset={selectedDataSet}
                organization={selectedOrg}
                period={periodFormatted}
                mainSectionData={mainSectionData}
                submittedRecords={submittedRecords}
                metadata={metadata}
                reporterName={reporterName}
                signature={lines}
              />
            </PDFViewer>
          </Box>
        ) : (
          <Box>
            {/* Dataset Information Card */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                Dataset Information
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">Organization</Typography>
                  <Typography variant="body1">{selectedOrg?.name || 'Not selected'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">Dataset</Typography>
                  <Typography variant="body1">{selectedDataSet?.name || 'Not selected'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">Reporting Period</Typography>
                  <Typography variant="body1">{periodFormatted || 'Not selected'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">Reporter Name</Typography>
                  <Typography variant="body1">{reporterName}</Typography>
                </Grid>
              </Grid>
            </Paper>
            
            {/* Hospital Data Card */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">
                  {category} Data
                </Typography>
                {loading && <CircularProgress size={24} />}
              </Box>
              
              <Divider sx={{ mb: 3 }} />
            
            {/* Show message when loading */}
            {loading ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress size={40} />
                <Typography color="text.secondary" sx={{ mt: 2 }}>
                  Loading report data...
                </Typography>
              </Box>
            ) : (
              <>
                {/* Main Sections */}
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                  Required Information
                </Typography>
                
                {mainSectionData.map(renderSectionData)}
                
                {/* No data message */}
                {!loading && submittedValues.length === 0 && submittedRecords.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Icon color="action" fontSize="large">info</Icon>
                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                      No data has been entered for this report yet
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Paper>
            
            {/* Signature Pad Card */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Card variant="outlined" sx={{ 
                mb: 3, 
                width: '100%', 
                maxWidth: '100%', 
                overflowX: 'hidden',
                boxSizing: 'border-box'
              }}>
                <CardContent sx={{
                  width: '100%',
                  maxWidth: '100%',
                  overflowX: 'hidden',
                  boxSizing: 'border-box'
                }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Signature Pad
                  </Typography>
                  <Box sx={{ 
                    border: '1px dashed grey', 
                    p: 2, 
                    mb: 2,
                    width: '100%',
                    maxWidth: '100%',
                    overflowX: 'hidden',
                    boxSizing: 'border-box'
                  }}>
                    <SignatureCanvas
                      lines={lines}
                      onDraw={handleDrawing}
                      width="100%"
                      height={200}
                      className="w-full h-[200px] border-2 border-gray-300 rounded shadow-sm"
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
              
              {/* Generate Report Button - Moved here */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<Description />}
                  onClick={handleGenerateReport}
                  disabled={loading}
                  sx={{ px: 4 }}
                >
                  Generate Report
                </Button>
              </Box>
        
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
            </Paper>
          </Box>
        )}
      </Box>
    );
  };

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

  return (
    <Box sx={{ 
      width: '100%',
      maxWidth: 1100,
      margin: '0 auto',
      height: '100vh', // Set to viewport height
      maxHeight: '100vh', // Constrain to viewport height
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden', // Don't allow overflow at container level
      padding: { xs: 1, sm: 2 },
      boxSizing: 'border-box' // Ensure padding doesn't affect total width/height
    }}>
      <HeaderAppBar>
        <Toolbar sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          overflowX: 'hidden',
          width: '100%'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton edge="start" color="inherit" aria-label="back" sx={{ mr: 1 }}>
              <DomsSvgIcon>heroicons-outline:arrow-left</DomsSvgIcon>
            </IconButton>
            <Typography variant="h6" component="div" noWrap sx={{ flexGrow: 1 }}>
              {title}
            </Typography>
          </Box>    
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
      
      <Box sx={{ 
        display: (collapsed || !showStepper) ? 'none' : 'block',
        flexShrink: 0,
        transition: 'all 0.3s ease-in-out', 
        position: 'sticky',
        top: 64, // Adjust based on your header height
        backgroundColor: 'background.paper',
        zIndex: 1000,
        maxHeight: showStepper ? '200px' : '0px',  // Control height based on showStepper
        opacity: showStepper ? 1 : 0,  // Fade in/out with scroll
        overflow: 'hidden',  // Hide overflow during transition
        width: '100%'
      }}>
        <Stepper 
          activeStep={activeStep} 
          sx={{ 
            pt: 2, 
            pb: 2,
            px: { xs: 1, sm: 2 },
            overflowX: 'auto',
            '& .MuiStepConnector-line': {
              minWidth: '20px'
            }
          }} 
          orientation="horizontal"
          alternativeLabel
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>
      
      <Box 
        ref={contentRef}
        sx={{ 
          flex: '1 1 auto',
          overflow: 'auto',
          overscrollBehavior: 'contain',
          paddingBottom: '100px',
          position: 'relative',
          width: '100%',
          maxWidth: '100%',
          '& > *': { // Apply to all immediate children
            maxWidth: '100%',
            overflowX: 'hidden'
          }
        }}
      >
        {renderStep()}
      </Box>
      
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

export default ObjectFormBlockReportLandingPage;