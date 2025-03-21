import React, { useState, useEffect, useRef } from 'react';
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
  Checkbox,
  Icon
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { styled } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import { ArrowBack, ArrowForward, ExpandMore, Print, Description } from '@mui/icons-material';
import { convertDateToPeriod, GeneratedPeriod, PeriodTypeEnum } from '../utils/convertDateToPeriod';
import DomsSvgIcon from '../components/DomsSvgIcon';
import SignatureCanvas, { Point } from '../components/SignatureCanvas';
import TemplateMenuObjectForm from '../components/TemplateMenuObjectForm';
import TemplateMenuValueForm from '../components/TemplateMenuValueForm';
import DomsTextBlock from '../components/DomsTextBlock';
import ObjectAutoCompleteSelect from '../components/ObjectAutoCompleteSelect';
import TemplateMenuMatrixBlock from '../components/TemplateMenuMatrixBlock';
import TextFieldMatrixBlock from '../components/TextFieldMatrixBlock';
import { PDFViewer } from '@react-pdf/renderer';
import HospitalReportPDF from '../components/HospitalReportPDF';
import metadata from '../metadata.json';
import { initDB, storeDataRecord, storeDataValue, getDataValues, getDataRecords, storeFailedDataRecord, storeFailedDataValue, retryAllFailedData } from '../../../../../services/indexedDB';
import { CategoryCombo,CompleteDatasetPayload, CategoryOptionCombo, DataRecordPayload, DataValuePayload, StoredDataRecord, StoredDataValue, DataElement } from '../types';
import { submitToServer } from '../utils/apiService';
import { determineStorageType } from '../utils/determineStorageType';

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

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  backgroundColor: theme.palette.grey[100],
}));

interface HospitalReportFormProps {
  metadata: any;
}      

const HospitalReportLandingPage = () => {
  const steps = ['Dataset Information', 'Submit Report', 'Review & Submit'];
  
  const [alertInfo, setAlertInfo] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' });
  const [loading, setLoading] = useState(false);
  const [submittedRecords, setSubmittedRecords] = useState<DataRecordPayload[]>([]);
  const [submittedValues, setSubmittedValues] = useState<DataValuePayload[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [dataElements, setDataElements] = useState([]);
  const [mainSections, setMainSections] = useState([]);
  const [dynamicSections, setDynamicSections] = useState([]);
  const [templates, setTemplates] = useState([]);

  const [filteredDataElements, setFilteredDataElements] = useState([]);
  const [periodFormatted, setPeriodFormatted] = useState('');
  const [lines, setLines] = useState<Point[][]>([]);
  const [organization, setOrganization] = useState('');
  const [bedCapacity, setBedCapacity] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [showStepper, setShowStepper] = useState(true);
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [dbInitialized, setDbInitialized] = useState(false);
  
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const contentRef = useRef(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [enabledDynamicSections, setEnabledDynamicSections] = useState({});
    const SESSION_TIMEOUT_MINUTES = 30; // Adjust as needed
    const SESSION_TIMER_CHECK_SECONDS = 60;
    const reporterName = React.useMemo(() => {
      // In a real app, you would fetch this from an API based on user-id in localStorage
      // For demo purposes, we'll return a static name
      const userId = localStorage.getItem('user-id') || 'demo-user';
      
      // Demo data - in real implementation, this would be an API call
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
 
  const [dataValue, setDataValue] = useState<DataValuePayload>({
    source: '',
    period: '',
    dataElement: '',
    categoryOptionCombo: '',
    value: '',
    date: new Date(),
    comment: null,
    followup: false
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
  const coc = metadata?.categoryOptionCombos || [];
  const datasets = metadata?.dataSets || [];

  const groupDataElementsBySection = () => {
    if (!submittedValues.length && !submittedRecords.length) {
      console.log('No data to group');
      return { mainSectionData: [], dynamicSectionData: [] };
    }
    
    console.log('Grouping data elements by section');
    console.log('Available values:', submittedValues);
    console.log('Available records:', submittedRecords);
    
    const sectionElementMapping: Record<string, string[]> = {};
    
    // Create a mapping of section IDs to data element IDs
    const selectedDataset = datasets.find(ds => ds.uid === completeDatasetInfo.dataSet);
    if (selectedDataset && selectedDataset.sections) {
      selectedDataset.sections.forEach(section => {
        // Handle two possible structures of dataElements in sections
        if (Array.isArray(section.dataElements)) {
          sectionElementMapping[section.id] = section.dataElements.map(de => 
            typeof de === 'string' ? de : de.uid || de.id
          );
        } else {
          // If dataElements is undefined, create an empty array for now
          sectionElementMapping[section.id] = [];
        }
      });
    }
    
    console.log('Section to element mapping:', sectionElementMapping);
    
    const mainSectionData = mainSections.map(section => {
      // Get data elements for this section
      const sectionElementIds = sectionElementMapping[section.id] || [];
      
      // Filter values and records by data element ID
      const sectionValues = submittedValues.filter(value => 
        sectionElementIds.includes(value.dataElement)
      );
      
      const sectionRecords = submittedRecords.filter(record => 
        sectionElementIds.includes(record.dataElement)
      );
      
      console.log(`Section ${section.name} has ${sectionValues.length} values and ${sectionRecords.length} records`);
      
      return {
        section,
        elements: sectionElementIds
          .map(id => metadata.dataElements?.find(el => el.uid === id))
          .filter(Boolean),
        values: sectionValues,
        records: sectionRecords
      };
    });
    
    const dynamicSectionData = dynamicSections
      .filter(section => enabledDynamicSections[section.id])
      .map(section => {
        const sectionElementIds = sectionElementMapping[section.id] || [];
        
        const sectionValues = submittedValues.filter(value => 
          sectionElementIds.includes(value.dataElement)
        );
        
        const sectionRecords = submittedRecords.filter(record => 
          sectionElementIds.includes(record.dataElement)
        );
        
        console.log(`Dynamic section ${section.name} has ${sectionValues.length} values and ${sectionRecords.length} records`);
        
        return {
          section,
          elements: sectionElementIds
            .map(id => metadata.dataElements?.find(el => el.uid === id))
            .filter(Boolean),
          values: sectionValues,
          records: sectionRecords
        };
      });
      
    return { mainSectionData, dynamicSectionData };
  };

  // Add a function to automatically retry failed submissions
  const retryFailedSubmissions = async () => {
    setLoading(true);
    try {
      // Get all failed records and values
      const result = await retryAllFailedData();
      
      if (result.records > 0 || result.values > 0) {
        setAlertInfo({
          open: true,
          message: `Successfully resubmitted ${result.records} records and ${result.values} values.`,
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
    
    // Perform an initial retry when the component mounts
    retryFailedSubmissions();
    
    // Set up a periodic retry every 5 minutes
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

  const getCategoryOptionCombos = (ccId: string) => {
    // First, find the specific data element by ID
   // const dataElement = metadata.dataElements.find(de => de.uid === dataElementId);
    
    // Check if data element exists and has a categoryCombo
    if (!coc || coc.length === 0) {
      return [];
    }
    
    // Filter categoryOptionCombos that belong to this dataElement's categoryCombo
    const sortedCocs = coc.filter(
      (coc: CategoryOptionCombo) => coc.categoryCombo.id === ccId
    );

    return sortedCocs.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  };
  
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
        if (metadata && metadata.dataElements) {
          setDataElements(metadata.dataElements);
        }
        
        // Load and process sections
        if (metadata && metadata.dataSets && metadata.dataSets.length > 0) {
          const hospitalReport = datasets.find(ds => ds.uid === "cTxL0iUYdG4");
          
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
      const filtered = metadata.dataElements.filter(de =>
        de.dataSets && de.dataSets.some(ds => ds.id === completeDatasetInfo.dataSet)
      );
      setFilteredDataElements(filtered);
    }
  }, [completeDatasetInfo.dataSet, metadata?.dataElements]);

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

  // Enhanced function to filter data elements by section
  const getDataElementsBySection = (selectedDataSet: string, sectionName: string): DataElement[] => {
  
    // Filter dataElements where the selectedDataSet is in the element's dataSets array
    // and the element's sectionName matches the given sectionName
    const elementsForSection = dataElements.filter(element =>
      element.dataSets && 
      element.dataSets.some(ds => ds.id === selectedDataSet) &&
      element.section && // Check if section exists
      element.section.name === sectionName
    );
  
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

  // Toggle dynamic section enabled status
  const toggleDynamicSection = (sectionId) => {
    setEnabledDynamicSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Update the submitToServerWithRetry function
  const submitToServerWithRetry = async (payload, type) => {
    try {
      const result = await submitToServer(payload, type);
      return { success: true, data: result };
    } catch (error) {
      console.error(`Failed to submit ${type} to server:`, error);
      // Store the failed submission in appropriate store for later retry
      try {
        if (type === 'record') {
          await storeFailedDataRecord(payload);
        } else if (type === 'value') {
          await storeFailedDataValue(payload);
        }
      } catch (storageError) {
        console.error(`Failed to store failed ${type} submission:`, storageError);
      }
      throw new Error(`Server submission failed: ${error.message}`);
    }
  };

  /**
  * Handles form block submission and routes to appropriate storage
  * @param {string | Record<string, any>} data - The data submitted from the form block
  * @param {string} formBlockType - The type of form block that submitted the data
  * @param {string} dataElement - The ID of the data element
  * @param {string} categoryOptionCombo - The ID of the category option combo (for value storage)
  * @param {string} attributeOptionCombo - The ID of the attribute option combo (for value storage)
  * @param {string|null} sectionId - The ID of the section containing the form block
  */
  const handleFormBlockSubmit = async (
    data: string | Record<string, any>, 
    formBlockType: string, 
    dataElement: string, 
    categoryOptionCombo: string, 
    sectionId?: string
  ): Promise<{ success: boolean }> => {
    console.log('Form block submit:', {  
      formBlockType, 
      dataElement,
      categoryOptionCombo, 
      sectionId, 
      data 
    });
    
    if (!data) {
      console.error('No data provided to handleFormBlockSubmit');
      return { success: false };
    }
    
    // Get the data element details to access its componentName
    const dataElementDetails = metadata.dataElements?.find(el => el.uid === dataElement);
    const componentName = dataElementDetails?.componentName || '';
    const selectedDataset = datasets.find(ds => ds.uid === completeDatasetInfo.dataSet);
    console.log('dataElementDetails', dataElementDetails)
    console.log('componentName', componentName)
    console.log('selectedDataset', selectedDataset)
    
    // Determine storage type
    const storageType = determineStorageType({
      dataSet: selectedDataset,
      //datasetId: completeDatasetInfo.dataSet,
      sectionId,
      dataElement,
      formBlockType,
      componentName,
      data
    });
    
    console.log(`Storage decision for element ${dataElement}: ${storageType}`);
    
    try {
      setLoading(true);
      
      if (storageType === 'dataRecordStore') {
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
      } else {
        // Create data value payload
        let valueToStore = '';
        
        if (typeof data === 'object') {
          // For objects that go into value store, stringify them
          try {
            valueToStore = JSON.stringify(data);
          } catch (e) {
            console.error('Error stringifying object:', e);
            valueToStore = String(data); // Fallback
          }
        } else {
          valueToStore = String(data);
        }
        
        const valuePayload = {
          source: completeDatasetInfo.source,
          period: completeDatasetInfo.period,
          dataElement: dataElement,
          categoryOptionCombo: categoryOptionCombo,
          value: valueToStore as string,
          date: new Date(),
          comment: null,
          followup: false
        };
        
        console.log('Saving as value:', valuePayload);
        const result = await handleSaveValue(valuePayload);
        
        return result;
      }
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

  // Update the handleSaveValue function
  const handleSaveValue = async (value: DataValuePayload): Promise<{ success: boolean }> => {
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
      if (!value.source) value.source = completeDatasetInfo.source;
      if (!value.period) value.period = completeDatasetInfo.period;
      
      console.log('Saving value to IndexedDB:', value);
      
      // Try to submit to server first
      try {
        await submitToServerWithRetry(value, 'value');
        // Server submission successful
      } catch (serverError) {
        // Server submission failed, but we'll continue to save locally
        console.log('Server submission failed, storing locally:', serverError);
        // Note: the failed value is already stored in the failed values store by submitToServerWithRetry
      }
      
      // Store in IndexedDB regardless of server response - will generate a uniqueKey internally
      const savedValue: StoredDataValue = await storeDataValue(value);
      
      // Update state with the new value
      setSubmittedValues((prevValues: StoredDataValue[]) => {
        const existingIndex = prevValues.findIndex(v => 
          v.uniqueKey === savedValue.uniqueKey || 
          (v.dataElement === savedValue.dataElement && 
          v.source === savedValue.source && 
          v.categoryOptionCombo === savedValue.categoryOptionCombo));
        
        if (existingIndex >= 0) {
          const updatedValues = [...prevValues];
          updatedValues[existingIndex] = savedValue;
          return updatedValues;
        } else {
          return [...prevValues, savedValue];
        }
      });

      setAlertInfo({
        open: true,
        message: 'Value saved successfully',
        severity: 'success'
      });

      return { success: true };

    } catch (error) {
      console.error('Failed to save value:', error);
      setAlertInfo({
        open: true,
        message: 'Failed to save value: ' + error.message,
        severity: 'error'
      });

      return { success: false };
    } finally {
      setLoading(false);
    }
  };  

  const handleRecordsUpdate = (records: DataRecordPayload[]) => {
    setSubmittedRecords(records);
  };

  // Handle values update from child components
  const handleValuesUpdate = (updatedValues) => {
    setSubmittedValues(updatedValues);
  };

  // Update the loadDataFromIndexedDB function
  const loadDataFromIndexedDB = async () => {
    try {
      setLoading(true);
      const { source, period } = completeDatasetInfo;
      
      if (!source || !period) {
        return;
      }
      
      const values = await getDataValues(period, source);
      const records = await getDataRecords(period, source);
      
      setSubmittedValues(values);
      setSubmittedRecords(records);
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
  
    const handleDateChange = (date: Date | null) => {
      console.log("date", date);
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
  
    
  const handleDatasetChange = (selectedDataset: { uid: string; name: string; } | null) => {
    if (!selectedDataset) return;
    
    const dataSet = selectedDataset.uid;
    
    if (dataSet !== completeDatasetInfo.dataSet) {
      // Clear the submitted values
      setSubmittedRecords([]);
      setSubmittedValues([]);
      
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
    //  await storeInIndexedDB('completeDatasets', payload);
      
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
      selectedDate !== null
    );
  };

  // Dynamic component renderer based on section component type
  const renderSectionComponent = (section) => {
    const selectedSource = localStorage.getItem('ihrs-selected-org') || '';
    const selectedDataSet = localStorage.getItem('ihrs-selected-dataset') || '';
    const selectedPeriod = localStorage.getItem('ihrs-selected-period') || '';
    const filteredDataElements = getDataElementsBySection(selectedDataSet, section.name);
    console.log("section.id", section.id)
    
    switch(section.formBlock) {
      case 'TemplateMenuObjectForm':
        return (
          <TemplateMenuObjectForm 
            q={filteredDataElements}
            dataSet={selectedDataSet}
            period={selectedPeriod}
            source={selectedSource}
            onSubmit={(data, dataElement, categoryOptionCombo) => handleFormBlockSubmit(data, 'TemplateMenuObjectForm', dataElement, section.id)}
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
            onSubmit={(data, dataElement, categoryOptionCombo) => 
              handleFormBlockSubmit(data, 'TemplateMenuValueForm', dataElement, categoryOptionCombo, section.id)}
            templates={templates}
            existingValues={submittedValues}
            onValuesUpdate={handleValuesUpdate}
          />
        );
        
      case 'DomsTextBlock':
        return (
          <Box>
            {filteredDataElements.map(element => (
              <Box key={element.uid} sx={{ mb: 2 }}>
                <DomsTextBlock
                  q={element}
                  dataSet={selectedDataSet}
                  period={selectedPeriod}
                  source={selectedSource}
                  onSubmit={(data, categoryOptionCombo) => 
                    handleFormBlockSubmit(data, 'DomsTextBlock', element.uid, categoryOptionCombo, section.id)}
                  existingValues={submittedValues}  
                  onValuesUpdate={handleValuesUpdate}
                />
              </Box>
            ))}
          </Box>
        );
      
      case 'TextFieldMatrixBlock':
        return (
          <Box>
            {filteredDataElements.map(element => (
              <Box key={element.uid} sx={{ mb: 2 }}>
                <TextFieldMatrixBlock
                  q={element}
                  coc={getCategoryOptionCombos(element.categoryCombo.id)}
                  dataSet={selectedDataSet}
                  period={selectedPeriod}
                  source={selectedSource}
                  onSubmit={(data, dataElement, categoryOptionCombo) => 
                    handleFormBlockSubmit(data, 'TextFieldMatrixBlock', dataElement, categoryOptionCombo, section.id)}
                  existingValues={submittedValues}
                  onValuesUpdate={handleValuesUpdate}
                />
              </Box>
            ))}
          </Box>
        );
        
      case 'TemplateMenuMatrixBlock':
          return (
            <TemplateMenuMatrixBlock
              q={filteredDataElements}
              coc={coc}
              dataSet={selectedDataSet}
              period={selectedPeriod}
              source={selectedSource}
              onSubmit={(data, dataElement, categoryOptionCombo) => 
                handleFormBlockSubmit(data, 'TemplateMenuMatrixBlock', dataElement, categoryOptionCombo, section.id)}
              templates={templates}
              onNext={handleNext}
              onBack={handleBack}
              existingValues={submittedValues}
              onValuesUpdate={handleValuesUpdate}
            />
          );
        
      default:
        return (
          <Typography color="text.secondary">
            Unknown form block type: {section.formBlock}
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
                onChange={(selectedDataset) => handleDatasetChange(selectedDataset)}
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
             // onChange={handleDateChange}
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

  // Render general patient statistics form with better organization
  const renderDatasetSections = () => {
    return (
      <Box sx={{
        height: '100%',
        overflow: 'visible'
      }}>
        <Paper sx={{ 
          p: 3, 
          mb: 3, 
          width: '100%', 
          maxWidth: '100%', 
          boxSizing: 'border-box',
          overflowX: 'hidden'
        }}>
          <Typography variant="h5" gutterBottom>
            Hospital Report Form
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please complete all applicable sections below. Your report will be saved automatically as you progress.
          </Typography>
          
          {/* Main Sections - Always Visible but collapsible */}
          <Box sx={{ 
            mb: 5,
            p: 3,
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
                  mb: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  '&.Mui-expanded': {
                    border: '2px solid #1976d2',
                    bgcolor: 'rgba(25, 118, 210, 0.03)'
                  },
                  '&:before': {
                    display: 'none'
                  }
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
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600,
                        color: '#0d47a1',
                        mr: 1
                      }}
                    >
                      {index + 1}.
                    </Typography>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 600,
                        fontSize: '1.1rem'
                      }}
                    >
                      {section.name}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ 
                  padding: { xs: 2, sm: 3 },
                  maxHeight: '70vh', // Limit height on small screens
                  overflow: 'auto',
                  borderTop: '1px solid #e0e0e0'
                }}>
                  {renderSectionComponent(section)}
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
          
          {/* Dynamic Sections Selection */}
          <Box sx={{ 
            mb: 5,
            p: 3,
            bgcolor: '#fffde7', 
            borderRadius: 2,
            border: '1px solid #e0e0e0' 
          }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                mb: 2,
                pb: 1,
                borderBottom: '2px solid #ff9800',
                display: 'inline-block'
              }}
            >
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
          <Box sx={{ 
            mb: 4,
            p: 3,
            bgcolor: '#fff8e1', 
            borderRadius: 2,
            border: '1px solid #ffe0b2'
          }}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ 
                mb: 2,
                pb: 1,
                borderBottom: '2px solid #ff9800',
                display: 'inline-block'
              }}
            >
              Active Specialized Service Forms
            </Typography>
            
            {/* Dynamically render enabled dynamic sections */}
            {dynamicSections
              .filter(section => enabledDynamicSections[section.id])
              .map((section, index) => (
                <Accordion 
                  key={section.id} 
                  sx={{ 
                    mb: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    '&.Mui-expanded': {
                      border: '2px solid #ff9800',
                      bgcolor: 'rgba(255, 152, 0, 0.03)'
                    },
                    '&:before': {
                      display: 'none'
                    }
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMore />}
                    aria-controls={`section-${section.id}-content`}
                    id={`section-${section.id}-header`}
                    sx={{
                      bgcolor: '#ffecb3',
                      '&.Mui-expanded': {
                        bgcolor: '#ffe082'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600,
                          color: '#e65100',
                          mr: 1
                        }}
                      >
                        S{index + 1}.
                      </Typography>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: '1.1rem'
                        }}
                      >
                        {section.name}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ 
                    padding: { xs: 2, sm: 3 },
                    borderTop: '1px solid #ffe0b2'
                  }}>
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
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mt: 4,
            position: 'fixed', // Changed from sticky to fixed
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'background.paper',
            padding: 2,
            zIndex: 1050,
            boxShadow: '0px -2px 4px rgba(0,0,0,0.1)', // Add shadow for visual separation
            maxWidth: 1024, // Match the container width
            margin: '0 auto', // Center the buttons
            boxSizing: 'border-box'
          }}>
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
    const selectedDataset = datasets.find(ds => ds.uid === completeDatasetInfo.dataSet);
    const selectedOrg = organizations.find(org => org.id === completeDatasetInfo.source);
    
  const { mainSectionData, dynamicSectionData } = groupDataElementsBySection();
    
    const getElementName = (elementId) => {
      const element = metadata.dataElements?.find(el => el.uid === elementId);
      return element ? element.name : elementId;
    };
    
    const getCategoryOptionComboName = (cocId) => {
      const combo = metadata.categoryOptionCombos?.find(c => c.id === cocId);
      return combo ? combo.name : cocId;
    };
    
    const renderValueDisplay = (value) => {
      return (
        <Box key={value.uniqueKey || `${value.dataElement}-${value.categoryOptionCombo}`} sx={{ mb: 1 }}>
          <Typography variant="body2" component="div" sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>
              {getElementName(value.dataElement)}
              {value.categoryOptionCombo && ` - ${getCategoryOptionComboName(value.categoryOptionCombo)}`}:
            </span>
            <strong>{String(value.value)}</strong>
          </Typography>
        </Box>
      );
    };
    
    const renderRecordDisplay = (record) => {
      return (
        <Box key={record.uniqueKey || `${record.dataElement}-${record.attributeOptionCombo}`} sx={{ mb: 2, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="subtitle2">{getElementName(record.dataElement) || 'Record'}</Typography>
          {Object.entries(record.data || {}).map(([key, value]) => (
            <Typography key={key} variant="body2" component="div" sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{key}:</span>
              <strong>{String(value)}</strong>
            </Typography>
          ))}
        </Box>
      );
    };
    
    const renderSectionData = (sectionData) => {
      const { section, values, records } = sectionData;
      
      return (
        <Box key={section.id} sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>{section.name}</Typography>
          
          {/* Render values */}
          {values.length > 0 && (
            <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Data Values</Typography>
              {values.map(renderValueDisplay)}
            </Paper>
          )}
          
          {/* Render records */}
          {records.length > 0 && (
            <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Records</Typography>
              {records.map(renderRecordDisplay)}
            </Paper>
          )}
          
          {/* No data message */}
          {values.length === 0 && records.length === 0 && (
            <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No data entered for this section
            </Typography>
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
              <HospitalReportPDF 
                dataset={selectedDataset}
                organization={selectedOrg}
                period={periodFormatted}
                mainSectionData={mainSectionData}
                dynamicSectionData={dynamicSectionData}
                submittedValues={submittedValues}
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
                  <Typography variant="body1">{selectedDataset?.name || 'Not selected'}</Typography>
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
                  Hospital Data
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              {/* Main Sections */}
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Required Information
              </Typography>
              
              {mainSectionData.map(renderSectionData)}
              
              {/* Dynamic Sections */}
              {dynamicSectionData.length > 0 && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    Specialized Services
                  </Typography>
                  {dynamicSectionData.map(renderSectionData)}
                </>
              )}
              
              {/* No data message */}
              {submittedValues.length === 0 && submittedRecords.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Icon color="action" fontSize="large">info</Icon>
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    No data has been entered for this report yet
                  </Typography>
                </Box>
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
    }}>{/*
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
              Hospital Report
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
      </HeaderAppBar>*/}
      
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
            overflowX: 'auto', // Allow horizontal scrolling if needed
            '& .MuiStepConnector-line': {
              minWidth: '20px' // Ensure connectors have minimum width
            }
          }} 
          orientation="horizontal" // Change to horizontal orientation
          alternativeLabel // Place labels below icons for better horizontal layout
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

export default HospitalReportLandingPage;