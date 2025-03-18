import { FC, useState, useEffect, ChangeEvent, useMemo, Fragment } from 'react';
import { motion } from 'framer-motion';
import { 
  TextField,
  InputAdornment,
  Box,
  Paper,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  CircularProgress,
  TextFieldProps,
  IconButton,
  Card,
  CardHeader,
  CardContent,
  Button,
  FormControl,
  useMediaQuery, 
  useTheme 
} from '@mui/material';
import DomsSvgIcon from '../components/DomsSvgIcon';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import { openDB } from 'idb';
import { DataElement, ValueType, CategoryOptionCombo } from '../types';
import ObjectAutoCompleteSelect from '../components/ObjectAutoCompleteSelect';

// Import the FieldStatus enum from DomsTextField
export enum FieldStatus {
  IDLE = 'idle',
  SAVING = 'saving',
  SAVED = 'saved',
  ERROR = 'error',
  WARNING = 'warning'
}

// Helper types to manage aggregated data
type CategoryMatrix = {
  rows: string[]; // e.g., "0-1 year", "1-5 years"
  columns: string[]; // e.g., "Female", "Male"
};

// Template definitions
type Template = {
  id: string;
  name: string;
  data: Record<string, any>;
};

// Adapted from DomsTextField's DataValuePayload
interface DataValuePayload {
  uuid: string;
  source: string;
  period: string;
  dataElement: string;
  categoryOptionCombo: string;
  attributeOptionCombo: string;
  value: string;
  comment: string;
  followup: boolean;
  date: Date;
  storedBy: string;
  created: string;
  lastUpdated: string;
  deleted: boolean;
}

// Main component props
interface TemplateMenuVerticalMatrixProps {
  q: DataElement[];
  coc: CategoryOptionCombo[];
  dataSet: string;
  period: string;
  source: string;
  onSave?: (data: any) => Promise<{ success: boolean }>;
  templates?: Template[];
  onNext?: () => void;
  onBack?: () => void;
  existingValues?: any[];
  onValuesUpdate?: (values: any[]) => void;
  readOnly?: boolean;
  customValidation?: (value: any) => string | null;
  onValidationStateChange?: (isValid: boolean) => void;
}

const SESSION_STORAGE_KEY_PREFIX = 'matrix-field-';

const TemplateMenuVerticalMatrix: FC<TemplateMenuVerticalMatrixProps> = ({
  q,
  coc,
  dataSet,
  period,
  source,
  onSave,
  templates: externalTemplates = [],
  onNext,
  onBack,
  existingValues = [],
  onValuesUpdate,
  readOnly = false,
  customValidation,
  onValidationStateChange
}) => {
  // Template and selection states
  const [data, setData] = useState<Record<string, Record<string, string>>>({});
  const [selectedOption, setSelectedOption] = useState<DataElement | null>(null);
  const [error, setError] = useState({ element: '' });
  const [loading, setLoading] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  
  // Matrix visualization states
  const [matrices, setMatrices] = useState<Record<string, CategoryMatrix>>({});
  const [collapsedRows, setCollapsedRows] = useState<Record<string, Record<string, boolean>>>({});
  const [isComponentCollapsed, setIsComponentCollapsed] = useState<Record<string, boolean>>({});
  
  // Value tracking and status states
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
//  const [statuses, setStatuses] = useState<Record<string, FieldStatus>>({})
  const [statuses, setStatuses] = useState<Record<string, Record<string, FieldStatus>>>({});
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
  const [autoSaving, setAutoSaving] = useState<Record<string, Record<string, boolean>>>({});
  const [submittedCombos, setSubmittedCombos] = useState<Record<string, string[]>>({});
  const [submittedElements, setSubmittedElements] = useState<string[]>([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  //const valueType = q.valueType || ValueType.TEXT;
  //const autoSaveDelay = q.autoSaveDelay || 400;

  // Create main template and combine with external templates
  const mainTemplate: Template = { 
    id: 'main', 
    name: 'Main Report', 
    data: {} 
  };
  
  const [templates, setTemplates] = useState<Template[]>([
    mainTemplate,
    ...externalTemplates
  ]);

  const elementOptions = q.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  
  useEffect(() => {
    setTemplates([mainTemplate, ...externalTemplates]);
  }, [externalTemplates]);

  // Filter out options already in data
  const availableOptions = elementOptions.filter(
    (option) => !Object.prototype.hasOwnProperty.call(data, option.uid)
  );

  // Initialize IndexedDB
  useEffect(() => {
    const initIndexedDB = async () => {
      try {
        await openDB('dataorb-db', 1, {
          upgrade(db) {
            if (!db.objectStoreNames.contains('dataValues')) {
              db.createObjectStore('dataValues', { keyPath: 'uuid' });
            }
          },
        });
        console.log('IndexedDB initialized successfully');
      } catch (error) {
        console.error('Error initializing IndexedDB:', error);
      }
    };
    
    initIndexedDB();
  }, []);

  // Load from session storage
  const loadFromSessionStorage = (dataElementId: string) => {
    try {
      const storageKey = `${SESSION_STORAGE_KEY_PREFIX}${dataElementId}`;
      const storedData = sessionStorage.getItem(storageKey);
      
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        
        // Update the states for this specific dataElement
        setValues(prev => ({
          ...prev,
          [dataElementId]: parsedData.values || {}
        }));
        
        setStatuses(prev => ({
          ...prev,
          [dataElementId]: parsedData.statuses || {}
        }));
        
        setErrors(prev => ({
          ...prev,
          [dataElementId]: parsedData.errors || {}
        }));
        
        setSubmittedCombos(prev => ({
          ...prev,
          [dataElementId]: parsedData.submittedCombos || []
        }));
      }
    } catch (error) {
      console.error('Error loading from session storage:', error);
    }
  };

  // Save to session storage
  const saveToSessionStorage = (
    dataElementId: string,
    newValues: Record<string, string>,
    newStatuses: Record<string, FieldStatus>,
    newErrors: Record<string, string>,
    newSubmittedCombos: string[]
  ) => {
    try {
      const storageKey = `${SESSION_STORAGE_KEY_PREFIX}${dataElementId}`;
      const dataToStore = {
        values: newValues,
        statuses: newStatuses,
        errors: newErrors,
        submittedCombos: newSubmittedCombos,
        timestamp: new Date().getTime()
      };
      
      sessionStorage.setItem(storageKey, JSON.stringify(dataToStore));
    } catch (error) {
      console.error('Error saving to session storage:', error);
    }
  };

  // Initialize values from existingValues for all selected data elements
  useEffect(() => {
    if (existingValues && existingValues.length > 0) {
      // Group existing values by dataElement
      const valuesByDataElement: Record<string, any[]> = {};
      
      existingValues.forEach(val => {
        if (!valuesByDataElement[val.dataElement]) {
          valuesByDataElement[val.dataElement] = [];
        }
        valuesByDataElement[val.dataElement].push(val);
      });
      
      // For each data element that has values
      Object.entries(valuesByDataElement).forEach(([dataElementId, elementValues]) => {
        const dataElement = q.find(de => de.uid === dataElementId);
        if (!dataElement || !dataElement.categoryCombo) return undefined;
        
        const ccId = dataElement.categoryCombo.id;
        // Load from session storage first
        loadFromSessionStorage(dataElementId);
        
        // Then merge with existing values
        const newElementValues: Record<string, string> = values[dataElementId] || {};
        const newElementStatuses: Record<string, FieldStatus> = statuses[dataElementId] || {};
        const newElementSubmittedCombos: string[] = submittedCombos[dataElementId] || [];
        
        elementValues.forEach(val => {
          // Only update if not already set from sessionStorage
          if (!newElementValues[val.categoryOptionCombo]) {
            newElementValues[val.categoryOptionCombo] = val.value;
            newElementStatuses[val.categoryOptionCombo] = FieldStatus.SAVED;
            
            if (!newElementSubmittedCombos.includes(val.categoryOptionCombo)) {
              newElementSubmittedCombos.push(val.categoryOptionCombo);
            }
          }
        });
        
        // Update states
        setValues(prev => ({
          ...prev,
          [dataElementId]: newElementValues
        }));
        
        setStatuses(prev => ({
          ...prev,
          [dataElementId]: newElementStatuses
        }));
        
        setSubmittedCombos(prev => ({
          ...prev,
          [dataElementId]: newElementSubmittedCombos
        }));
        
        // Add to data if not already present
        if (!data[dataElementId]) {
          const dataElement = q.find(de => de.uid === dataElementId);
          if (dataElement) {
            setData(prev => ({
              ...prev,
              [dataElementId]: newElementValues
            }));
            
            // Create matrix for this element as well
            createMatrixForElement(dataElementId);
          }
        }
        
        // Save the merged data to sessionStorage
        saveToSessionStorage(
          dataElementId, 
          newElementValues, 
          newElementStatuses, 
          errors[dataElementId] || {}, 
          newElementSubmittedCombos
        );
        
        // Add to submittedElements if all combos are submitted
        const relevantCombos = coc.filter(c => c.categoryCombo?.id === ccId);
        if (newElementSubmittedCombos.length === relevantCombos.length) {
          setSubmittedElements(prev => 
            prev.includes(dataElementId) ? prev : [...prev, dataElementId]
          );
        }
      });
    }
  }, [existingValues]);
  
  // Find the specific categoryOptionCombo based on row and column values
  const findCategoryOptionCombo = (
    dataElementId: string,
    rowValue: string, // Age category or "Value"
    colValue: string  // Gender or individual name
  ): CategoryOptionCombo | undefined => {
    // Get the data element's categoryCombo.id first
    const dataElement = q.find(de => de.uid === dataElementId);
    if (!dataElement || !dataElement.categoryCombo) return undefined;
    
    const ccId = dataElement.categoryCombo.id;
    
    // Filter category option combos by this category combo ID first
    const relevantCocs = coc.filter(c => c.categoryCombo?.id === ccId);
    
    // Check if names contain commas
    const hasSplittableNames = relevantCocs.some(c => c.name.includes(','));
    
    if (hasSplittableNames) {
      // Original logic for comma-separated names
      return relevantCocs.find(c => {
        const parts = c.name.split(',').map(part => part.trim());
        return parts.length >= 2 && 
               parts[0] === colValue && 
               parts[1] === rowValue;
      });
    } else {
      // Alternative logic for single-value names
      // For a single-row format, we just match the column name directly
      if (rowValue === "Value") {
        return relevantCocs.find(c => c.name === colValue);
      }
      return undefined;
    }
  };

  // Create a matrix for a selected data element
  const createMatrixForElement = (dataElementId: string) => {
    const dataElement = q.find(de => de.uid === dataElementId);
    if (!dataElement || !dataElement.categoryCombo) return undefined;
  
    // Initialize with default fallback in case we can't identify clear row/column structure
    const rowValues = new Set<string>();
    const colValues = new Set<string>();
    
    const ccId = dataElement.categoryCombo.id;
    
    // Filter category option combos by this category combo ID
    const relevantCocs = coc.filter(c => c.categoryCombo?.id === ccId);
    console.log('relevantCocs', relevantCocs);
    
    // If we have category options but they don't follow the expected comma format
    if (relevantCocs.length > 0) {
      // Check if names contain commas
      const hasSplittableNames = relevantCocs.some(c => c.name.includes(','));
      
      if (hasSplittableNames) {
        // Original logic for comma-separated names
        relevantCocs.forEach(c => {
          const parts = c.name.split(',').map(part => part.trim());
          if (parts.length >= 2) {
            colValues.add(parts[0]); // e.g., "Female"
            rowValues.add(parts[1]); // e.g., "0-1 year"
          }
        });
      } else {
        // Alternative logic for single-value names - use the name as the column
        // and a default "Value" as the row
        relevantCocs.forEach(c => {
          colValues.add(c.name);
        });
        rowValues.add("Value"); // Single row for all values
      }
    }
    
    setMatrices(prev => ({
      ...prev,
      [dataElementId]: {
        rows: Array.from(rowValues),
        columns: Array.from(colValues)
      }
    }));
    
    // Initialize collapsed state for this element's rows
    const initialCollapsedState: Record<string, boolean> = {};
    Array.from(rowValues).forEach(row => {
      initialCollapsedState[row] = false;
    });
    
    setCollapsedRows(prev => ({
      ...prev,
      [dataElementId]: initialCollapsedState
    }));
    
    // Initialize component collapsed state
    setIsComponentCollapsed(prev => ({
      ...prev,
      [dataElementId]: false
    }));
  };

  // Handle adding a new element
  const handleAddElement = (value: DataElement | null) => {
    if (!value) return;
    const elementId = value.uid;
    
    if (Object.prototype.hasOwnProperty.call(data, elementId)) {
      setError({ element: 'This element already exists!' });
      return;
    }
    
    // Initialize empty data for this element
    setData(prevData => ({
      ...prevData,
      [elementId]: {}
    }));
    
    // Initialize other states for this element
    setValues(prev => ({
      ...prev,
      [elementId]: {}
    }));
    
    setStatuses(prev => ({
      ...prev,
      [elementId]: {}
    }));
    
    setErrors(prev => ({
      ...prev,
      [elementId]: {}
    }));
    
    setSubmittedCombos(prev => ({
      ...prev,
      [elementId]: []
    }));
    
    // Create matrix for visualization
    createMatrixForElement(elementId);
    
    setError({ element: '' });
    setSelectedOption(null);
  };

  // Handle removal of an element
  const handleRemoveElement = (elementId: string) => {
    // Remove from data
    setData(prevData => {
      const newData = { ...prevData };
      delete newData[elementId];
      return newData;
    });
    
    // Remove from all tracking states
    setValues(prev => {
      const newValues = { ...prev };
      delete newValues[elementId];
      return newValues;
    });
    
    setStatuses(prev => {
      const newStatuses = { ...prev };
      delete newStatuses[elementId];
      return newStatuses;
    });
    
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[elementId];
      return newErrors;
    });
    
    setSubmittedCombos(prev => {
      const newSubmitted = { ...prev };
      delete newSubmitted[elementId];
      return newSubmitted;
    });
    
    setMatrices(prev => {
      const newMatrices = { ...prev };
      delete newMatrices[elementId];
      return newMatrices;
    });
    
    setCollapsedRows(prev => {
      const newCollapsed = { ...prev };
      delete newCollapsed[elementId];
      return newCollapsed;
    });
    
    setIsComponentCollapsed(prev => {
      const newCollapsed = { ...prev };
      delete newCollapsed[elementId];
      return newCollapsed;
    });
    
    // Remove from submitted elements
    setSubmittedElements(prev => prev.filter(id => id !== elementId));
    
    // Remove from submitted values
    if (onValuesUpdate) {
      const updatedValues = existingValues.filter(
        value => value.dataElement !== elementId
      );
      onValuesUpdate(updatedValues);
    }
  };
  
  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    const selectedTemplate = templates.find(t => t.id === templateId);
    if (selectedTemplate) {
      // Keep submitted state when switching templates
      const oldData = { ...data };
      const newData = { ...selectedTemplate.data };
      
      // For elements that are both in old and new data, preserve the submitted state
      Object.keys(newData).forEach(key => {
        if (submittedElements.includes(key) && oldData[key]) {
          // This element was submitted, so we should keep its data
          newData[key] = oldData[key];
        }
      });
      
      setData(newData);
      setActiveTemplate(templateId);
    }
  };
  
  // Save the current template
  const handleSaveAsTemplate = () => {
    const templateName = prompt('Enter a name for this template:');
    if (templateName) {
      const newTemplateId = templateName.toLowerCase().replace(/\s+/g, '-');
      setTemplates(prevTemplates => ([
        ...prevTemplates,
        {
          id: newTemplateId,
          name: templateName,
          data: { ...data }
        }
      ]));
      setActiveTemplate(newTemplateId);
      
      // Clear submitted elements when creating a new template
      setSubmittedElements([]);
      
      // Clear sessionStorage
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith(SESSION_STORAGE_KEY_PREFIX)) {
          sessionStorage.removeItem(key);
        }
      });
      
      alert('Template saved successfully! Form data has been reset.');
    }
  };
  
  // Get title for the form
  const getFormTitle = (): string => {
    const firstDataElement = q.length > 0 ? q[0] : null;
    if (firstDataElement && firstDataElement.dataElementGroups) {
      return `${firstDataElement.dataElementGroups.name} Report`;
    }
    return 'Data Collection Form';
  };
  
  // Validate input based on valueType
  const validateInput = (dataElementId: string, input: any): string => {
    // Find the specific data element first
    const dataElement = q.find(de => de.uid === dataElementId);
    if (!dataElement) return 'Invalid data element';
    
    const valueType = dataElement.valueType;
    const validationRules = dataElement.validationRules || {};
    
    // If empty and required
    if ((input === '' || input === null || input === undefined) && validationRules.required) {
      return 'This field is required';
    }
  
    // Type-specific validation
    switch (valueType) {
      case ValueType.INTEGER:
      case ValueType.INTEGER_POSITIVE:
      case ValueType.INTEGER_NEGATIVE:
      case ValueType.INTEGER_ZERO_OR_POSITIVE:
      case ValueType.NUMBER:
        if (input !== '' && isNaN(Number(input))) {
          return 'Please enter a valid number';
        }
        
        const num = Number(input);
        
        if (validationRules.min !== undefined && validationRules.min !== null && num < validationRules.min) {
          return `Value must be at least ${validationRules.min}`;
        }
        
        if (validationRules.max !== undefined && validationRules.max !== null && num > validationRules.max) {
          return `Value must be at most ${validationRules.max}`;
        }
        
        if (valueType === ValueType.INTEGER_POSITIVE && num <= 0) {
          return 'Value must be a positive integer';
        }
        
        if (valueType === ValueType.INTEGER_NEGATIVE && num >= 0) {
          return 'Value must be a negative integer';
        }
        
        if (valueType === ValueType.INTEGER_ZERO_OR_POSITIVE && num < 0) {
          return 'Value must be zero or a positive integer';
        }
        break;
      default:
        break;
    }
    
    // Regex validation if provided
    if (validationRules.regex && input) {
      const regex = new RegExp(validationRules.regex);
      if (!regex.test(input)) {
        return validationRules.errorMessage || 'Invalid format';
      }
    }
    
    // Custom validation if provided
    if (customValidation) {
      const customError = customValidation(input);
      if (customError) {
        return customError;
      }
    }
    
    return '';
  };
  
  // Get input type based on valueType
  const getInputType = (dataElementId: string): string => {
    const dataElement = q.find(de => de.uid === dataElementId);
    if (!dataElement) return 'text';
    
    const valueType = dataElement.valueType;
    
    switch (valueType) {
      case ValueType.NUMBER:
      case ValueType.INTEGER:
      case ValueType.INTEGER_POSITIVE:
      case ValueType.INTEGER_NEGATIVE:
      case ValueType.INTEGER_ZERO_OR_POSITIVE:
      case ValueType.PERCENTAGE:
        return 'number';
      default:
        return 'text';
    }
  };
  
  // Get input props based on valueType
  const getInputProps = (dataElementId: string) => {
    const dataElement = q.find(de => de.uid === dataElementId);
    if (!dataElement) return {};
    
    const valueType = dataElement.valueType;
    const props: any = {};
    
    switch (valueType) {
      case ValueType.INTEGER:
        props.step = 1;
        props.inputMode = 'numeric';
        break;
      case ValueType.INTEGER_POSITIVE:
        props.step = 1;
        props.min = 1;
        props.inputMode = 'numeric';
        break;
      case ValueType.INTEGER_NEGATIVE:
        props.step = 1;
        props.max = -1;
        props.inputMode = 'numeric';
        break;
      case ValueType.INTEGER_ZERO_OR_POSITIVE:
        props.step = 1;
        props.min = 0;
        props.inputMode = 'numeric';
        break;
      case ValueType.PERCENTAGE:
        props.step = 1;
        props.min = 0;
        props.max = 100;
        props.inputMode = 'numeric';
        break;
      default:
        break;
    }
    
    return props;
  };
  
  // Prepare payload for saving
  const preparePayload = (dataElementId: string, cocId: string, value: string): DataValuePayload => {
    const stringifiedValue = 
      typeof value === 'object' ? JSON.stringify(value) : 
      value !== null && value !== undefined ? String(value) : '';
    
    return {
      uuid: crypto.randomUUID(),
      source: source || localStorage.getItem('selected-org') || '',
      period: period || localStorage.getItem('selected-period') || '',
      dataElement: dataElementId,
      categoryOptionCombo: cocId,
      attributeOptionCombo: '',
      value: stringifiedValue,
      comment: '',
      followup: false,
      date: new Date(),
      storedBy: localStorage.getItem('userId') || 'unknown',
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      deleted: false
    };
  };
  
  // Handle saving data for a specific cell
  const handleSaveData = async (dataElementId: string, cocId: string) => {
    const currentValue = values[dataElementId]?.[cocId] || '';
    const currentErrors = errors[dataElementId]?.[cocId] || '';
    const dataElement = q.find(de => de.uid === dataElementId);
    if (!dataElement || !dataElement.categoryCombo) return undefined;
    
    const ccId = dataElement.categoryCombo.id;
    
    // Skip save if there's validation error
    if (currentErrors) {
      const newStatuses = {
        ...statuses,
        [dataElementId]: {
          ...statuses[dataElementId],
          [cocId]: FieldStatus.ERROR
        }
      };
      setStatuses(newStatuses);
      
      // Save to session storage even in error state
      saveToSessionStorage(
        dataElementId, 
        values[dataElementId] || {}, 
        newStatuses[dataElementId] || {}, 
        errors[dataElementId] || {}, 
        submittedCombos[dataElementId] || []
      );
      return;
    }
    
    try {
      const newStatuses = {
        ...statuses,
        [dataElementId]: {
          ...statuses[dataElementId],
          [cocId]: FieldStatus.SAVING
        }
      };
      setStatuses(newStatuses);
      
      // Save to session storage
      saveToSessionStorage(
        dataElementId, 
        values[dataElementId] || {}, 
        newStatuses[dataElementId] || {}, 
        errors[dataElementId] || {}, 
        submittedCombos[dataElementId] || []
      );
      
      // Prepare payload
      const valuePayload = preparePayload(dataElementId, cocId, currentValue);
      
      // Update local values
      const updatedValues = [
        ...(existingValues || []).filter(v => !(v.dataElement === dataElementId && v.categoryOptionCombo === cocId)),
        valuePayload
      ];
      
      // Notify parent component
      if (onValuesUpdate) {
        onValuesUpdate(updatedValues);
      }
      
      // Try to save to server
      if (onSave) {
        const response = await onSave(valuePayload);
        if (response.success) {
          const newSubmittedCombos = {
            ...submittedCombos,
            [dataElementId]: [
              ...(submittedCombos[dataElementId] || []).filter(id => id !== cocId),
              cocId
            ]
          };
          
          const newStatuses = {
            ...statuses,
            [dataElementId]: {
              ...statuses[dataElementId],
              [cocId]: FieldStatus.SAVED
            }
          };
          
          setSubmittedCombos(newSubmittedCombos);
          setStatuses(newStatuses);
          
          // Filter category option combos by this category combo ID first
          const relevantCombos = coc.filter(c => c.categoryCombo?.id === ccId);
          if (newSubmittedCombos[dataElementId].length === relevantCombos.length) {
            setSubmittedElements(prev => 
              prev.includes(dataElementId) ? prev : [...prev, dataElementId]
            );
          }
          
          // Save to session storage
          saveToSessionStorage(
            dataElementId, 
            values[dataElementId] || {}, 
            newStatuses[dataElementId] || {}, 
            errors[dataElementId] || {}, 
            newSubmittedCombos[dataElementId] || []
          );
        }
      }
    } catch (error) {
      console.error('Error saving data:', error);
      const newStatuses = {
        ...statuses,
        [dataElementId]: {
          ...statuses[dataElementId],
          [cocId]: FieldStatus.ERROR
        }
      };
      
      const newErrors = {
        ...errors,
        [dataElementId]: {
          ...errors[dataElementId],
          [cocId]: error instanceof Error ? error.message : 'Unknown error'
        }
      };
      
      setStatuses(newStatuses);
      setErrors(newErrors);
      
      // Save error state to session storage
      saveToSessionStorage(
        dataElementId, 
        values[dataElementId] || {}, 
        newStatuses[dataElementId] || {}, 
        newErrors[dataElementId] || {}, 
        submittedCombos[dataElementId] || []
      );
    }
  };
  
  // Handle input change for a specific cell
  const handleInputChange = (dataElementId: string, cocId: string) => (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    
    // Update value
    setValues(prev => ({
      ...prev,
      [dataElementId]: {
        ...prev[dataElementId],
        [cocId]: newValue
      }
    }));
    
    // Set status to IDLE
    setStatuses(prev => ({
      ...prev,
      [dataElementId]: {
        ...prev[dataElementId],
        [cocId]: FieldStatus.IDLE
      }
    }));
    
    // Run validation
    const validationError = validateInput(dataElementId, newValue);
    if (validationError) {
      setErrors(prev => ({
        ...prev,
        [dataElementId]: {
          ...prev[dataElementId],
          [cocId]: validationError
        }
      }));
      
      // Notify parent about validation state
      if (onValidationStateChange) {
        onValidationStateChange(false);
      }
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors[dataElementId]) {
          const elementErrors = { ...newErrors[dataElementId] };
          delete elementErrors[cocId];
          newErrors[dataElementId] = elementErrors;
        }
        return newErrors;
      });
      
      // Notify parent about validation state
      if (onValidationStateChange) {
        onValidationStateChange(true);
      }
    }
    
    // Save to session storage
    saveToSessionStorage(
      dataElementId, 
      {
        ...(values[dataElementId] || {}),
        [cocId]: newValue
      },
      {
        ...(statuses[dataElementId] || {}),
        [cocId]: FieldStatus.IDLE
      },
      errors[dataElementId] || {},
      submittedCombos[dataElementId] || []
    );
  };
  
  // Handle blur event for auto-saving
  const handleBlur = (dataElementId: string, cocId: string) => () => {
    const currentValue = values[dataElementId]?.[cocId] || '';
    const currentErrors = errors[dataElementId]?.[cocId];
    
    // Only autosave if there's a value and no errors
    if (currentValue && !currentErrors && !autoSaving[dataElementId]?.[cocId]) {
      setAutoSaving(prev => ({
        ...prev,
        [dataElementId]: {
          ...prev[dataElementId],
          [cocId]: true
        }
      }));
      
      // Auto-save with a delay
      setTimeout(() => {
        handleSaveData(dataElementId, cocId).finally(() => {
          setAutoSaving(prev => {
            const newState = { ...prev };
            if (newState[dataElementId]) {
              const elementAutoSaving = { ...newState[dataElementId] };
              delete elementAutoSaving[cocId];
              newState[dataElementId] = elementAutoSaving;
            }
            return newState;
          });
        });
      }, 1000); // 1 second delay
    }
  };
  
  // Toggle row collapse
  const toggleRowCollapse = (dataElementId: string, row: string) => {
    setCollapsedRows(prev => ({
      ...prev,
      [dataElementId]: {
        ...(prev[dataElementId] || {}),
        [row]: !(prev[dataElementId]?.[row] || false)
      }
    }));
  };
  
  // Toggle component collapse
  const toggleComponentCollapse = (dataElementId: string) => {
    setIsComponentCollapsed(prev => ({
      ...prev,
      [dataElementId]: !prev[dataElementId]
    }));
  };
  
  // Get status icon for a specific cell
  const getStatusIcon = (dataElement: DataElement, cocId: string) => {
    const status = statuses[dataElement.uid]?.[cocId];
    
    switch (status) {
      case FieldStatus.SAVED:
        return <CheckCircleIcon color="success" fontSize="small" />;
      case FieldStatus.ERROR:
        return <ErrorIcon color="error" fontSize="small" />;
      case FieldStatus.WARNING:
        return <WarningIcon color="warning" fontSize="small" />;
      case FieldStatus.IDLE:
        if (dataElement.iconText) {
          return <DomsSvgIcon>{dataElement.iconText}</DomsSvgIcon>;
        } else {
          return <DomsSvgIcon>material-outline:edit</DomsSvgIcon>;
        }
      case FieldStatus.SAVING:
        return <CircularProgress size={16} />;
      default:
        return null;
    }
  };

  // Render a specific input field within the matrix
  const renderCellInputField = (dataElementId: string, cocId: string) => {
    console.log('dataElementId', dataElementId)
    console.log('cocId', cocId)
    const currentValue = values[dataElementId]?.[cocId] || '';
    const isSaving = statuses[dataElementId]?.[cocId] === FieldStatus.SAVING || autoSaving[dataElementId]?.[cocId];
    const hasError = !!errors[dataElementId]?.[cocId];
    const dataElement = q.find(de => de.uid === dataElementId);
    
    if (!dataElement) return null;
    
    const valueType = dataElement.valueType;
  
    const startAdornment = (
      <InputAdornment position="start">
        {getStatusIcon(dataElement, cocId)}
      </InputAdornment>
    );
    
    // For percentage type, create end adornment
    const endAdornment = valueType === ValueType.PERCENTAGE ? (
      <InputAdornment position="end">%</InputAdornment>
    ) : undefined;
  
    // Get helper text for a specific cell
    const getHelperText = (): string => {
      if (errors[dataElementId]?.[cocId]) return errors[dataElementId]?.[cocId];
      if (autoSaving[dataElementId]?.[cocId]) return "Auto-saving...";
      if (statuses[dataElementId]?.[cocId] === FieldStatus.SAVING) return "Saving...";
      if (statuses[dataElementId]?.[cocId] === FieldStatus.SAVED) return "Saved";
      if (statuses[dataElementId]?.[cocId] === FieldStatus.WARNING) return "Saved locally, will sync later";
      return "";
    };
  
    const textFieldProps: TextFieldProps = {
      id: `input-${dataElementId}-${cocId}`,
      name: dataElementId,
      fullWidth: true,
      variant: dataElement.formStyles?.variant || 'outlined',
      size: dataElement.formStyles?.fieldSize || 'small',
      label: dataElement.shortName,
      placeholder: dataElement.formStyles?.placeholder || `Enter ${dataElement.shortName || dataElement.name}`,
      type: getInputType(dataElementId),
      value: currentValue,
      onChange: handleInputChange(dataElementId, cocId),
      onBlur: handleBlur(dataElementId, cocId),
      error: hasError,
      helperText: getHelperText(),
      disabled: readOnly || isSaving,
      required: dataElement.validationRules?.required,
      sx: { 
        bgcolor: 'white',
        ...(isMobile && { width: '100%' })
      },
      // Replace InputProps with slotProps for MUI v7
      slotProps: {
        input: {
          ...getInputProps(dataElementId),
          startAdornment,
          endAdornment
        }
      }
    };
    
    return (
      <Box sx={{ position: 'relative' }}>
        <TextField {...textFieldProps} />
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mt: 0.5
        }}>
          {getHelperText() && (
            <Typography variant="caption" color={hasError ? "error" : "text.secondary"}>
              {getHelperText()}
            </Typography>
          )}
          
          {!isSaving && getStatusIcon(dataElement, cocId) && (
            <Box sx={{ ml: 'auto' }}>
              {getStatusIcon(dataElement, cocId)}
            </Box>
          )}
          
          {isSaving && (
            <Box sx={{ ml: 'auto' }}>
              <CircularProgress size={16} />
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  const renderMobileDisaggregatedTable = (dataElementId: string) => {
    const matrix = matrices[dataElementId];
    
    if (!matrix || matrix.rows.length === 0 || matrix.columns.length === 0) {
      return (
        <Box sx={{ mb: 3 }}>
          <Typography color="text.secondary">
            No category option combinations available for this data element.
          </Typography>
        </Box>
      );
    }
    
    return (
      <TableContainer component={Paper} sx={{ mb: 3, boxShadow: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell 
                sx={{ 
                  fontWeight: 'bold', 
                  bgcolor: 'primary.main', 
                  color: 'white',
                  width: '40%'
                }}
              >
                Category
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 'bold', 
                  bgcolor: 'primary.main', 
                  color: 'white',
                  width: '60%'
                }}
              >
                Value
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {matrix.rows.map((row) => (
              matrix.columns.map((column, index) => {
                const coc = findCategoryOptionCombo(dataElementId, row, column);
                if (!coc) return null;
                
                return (
                  <TableRow key={`${row}-${column}`} sx={{ '&:nth-of-type(even)': { bgcolor: 'action.hover' } }}>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                      <Typography variant="body2" fontWeight="medium">{row}</Typography>
                      <Typography variant="caption" color="text.secondary">{column}</Typography>
                    </TableCell>
                    <TableCell>
                      {renderCellInputField(dataElementId, coc.id)}
                    </TableCell>
                  </TableRow>
                );
              })
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Render the complete matrix table for a specific data element
  const renderDisaggregatedTable = (dataElementId: string) => {
    console.log('matrices', matrices)
    const matrix = matrices[dataElementId];
    
    // If no disaggregation is available, render a message
    if (!matrix || matrix.rows.length === 0 || matrix.columns.length === 0) {
      return (
        <Box sx={{ mb: 3 }}>
          <Typography color="text.secondary">
            No category option combinations available for this data element.
          </Typography>
        </Box>
      );
    }
    
    return (
      <TableContainer component={Paper} sx={{ mb: 3, boxShadow: 2, overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell 
                sx={{ 
                  fontWeight: 'bold', 
                  bgcolor: 'primary.main', 
                  color: 'white',
                  '& .MuiTableCell-root': {
                    color: 'white !important'
                  }
                }}
              >
              </TableCell>
              {matrix.columns.map((column, index) => (
                <TableCell 
                  key={index} 
                  align="center" 
                  sx={{ 
                    fontWeight: 'bold', 
                    bgcolor: 'primary.main', 
                    color: 'white !important', // Force white text
                    minWidth: '120px',
                    '& .MuiTableCell-root': {
                      color: 'white !important'
                    }
                  }}
                >
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {matrix.rows.map((row, rowIndex) => (
              <Fragment key={rowIndex}>
                <TableRow sx={{ '&:nth-of-type(even)': { bgcolor: 'action.hover' } }}>
                  <TableCell 
                    component="th" 
                    scope="row"
                    sx={{ 
                      fontWeight: 'bold', 
                      width: '20%'
                    }}
                  >
                    {row}
                  </TableCell>
                  {!isComponentCollapsed[dataElementId] && matrix.columns.map((column, colIndex) => {
                    // Column is gender and row is age category
                    const coc = findCategoryOptionCombo(dataElementId, row, column);
                    if (!coc) {
                      console.warn(`Could not find category option combo for: ${column}, ${row}`);
                      return <TableCell key={colIndex}></TableCell>;
                    }
                    
                    return (
                      <TableCell key={colIndex} align="center" sx={{ p: 1, minWidth: '120px' }}>
                        {renderCellInputField(dataElementId, coc.id)}
                      </TableCell>
                    );
                  })}
                  {isComponentCollapsed[dataElementId] && (
                    <TableCell colSpan={matrix.columns.length} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Matrix collapsed. Click the expand icon to show fields.
                      </Typography>
                    </TableCell>
                  )}
                </TableRow>
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Calculate submission statistics for a specific data element
  const getElementStats = (dataElementId: string) => {
    const dataElement = q.find(de => de.uid === dataElementId);
    if (!dataElement || !dataElement.categoryCombo) return undefined;
    
    const ccId = dataElement.categoryCombo.id;
    const relevantCombos = coc.filter(c => c.categoryCombo?.id === ccId);
    const totalCombos = relevantCombos.length;
    const submittedCount = submittedCombos[dataElementId]?.length || 0;
    const hasAllSubmitted = totalCombos > 0 && submittedCount === totalCombos;
    
    return {
      totalCombos,
      submittedCount,
      hasAllSubmitted
    };
  };

  // Render matrix component for a specific data element
  const renderMatrixComponent = (dataElementId: string) => {
    const dataElement = q.find(de => de.uid === dataElementId);
    if (!dataElement) return null;
    
    const { totalCombos, submittedCount, hasAllSubmitted } = getElementStats(dataElementId);
    
    return (
      <Box sx={{ width: '100%' }} key={dataElementId}>
        <Paper
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          sx={{ 
            p: { xs: 1, sm: 4 },  // Less padding on mobile
            borderRadius: 2, 
            boxShadow: 3,  
            mb: 4,
            border: hasAllSubmitted ? '1px solid #c8e6c9' : 'none',
            bgcolor: hasAllSubmitted ? '#f0f7f0' : 'white'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                {dataElement.name}
              </Typography>
              
              {hasAllSubmitted && (
                <Chip 
                  icon={<CheckCircleIcon />} 
                  label="All Submitted" 
                  color="success" 
                  size="small" 
                />
              )}
              
              {!hasAllSubmitted && submittedCount > 0 && (
                <Chip 
                  label={`${submittedCount}/${totalCombos} Submitted`} 
                  color="warning" 
                  size="small" 
                />
              )}
            </Box>
            
            {/* Toggle collapse/expand and remove buttons */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton 
                onClick={() => toggleComponentCollapse(dataElementId)}
                aria-label={isComponentCollapsed[dataElementId] ? "Expand" : "Collapse"}
                size="small"
              >
                {isComponentCollapsed[dataElementId] ? <ExpandMoreIcon /> : <ExpandLessIcon />}
              </IconButton>
              
              <IconButton 
                color="error" 
                size="small"
                onClick={() => handleRemoveElement(dataElementId)}
                disabled={autoSaving[dataElementId] && Object.values(autoSaving[dataElementId]).some(Boolean)}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>
          
          {/* Render the matrix table */}
          {!isComponentCollapsed[dataElementId] && (
            isMobile 
              ? renderMobileDisaggregatedTable(dataElementId)
              : renderDisaggregatedTable(dataElementId)
          )}
        </Paper>
      </Box>
    );
  };

  // Main render function
  return (
    <Card sx={{ 
      width: '100%', 
    //  maxWidth: '1024px',
    //  overflowX: 'hidden', // Prevent horizontal scrolling
      WebkitOverflowScrolling: 'touch'
    }}>
      <CardHeader 
        title={
          <Typography variant="h5" color="primary">
            {getFormTitle()}
          </Typography>
        }
        sx={{ bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0', pb: 3 }}
      />
      
      {/* Template selection section */}
      <Box sx={{ bgcolor: '#f5f5f5', px: 2, pb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Select Template:
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 1, 
          mb: 2,
          flexDirection: isMobile ? 'column' : 'row'  // Stack on mobile
        }}>
          {templates.map(template => (
            <Button
              key={template.id}
              variant={activeTemplate === template.id ? "contained" : "outlined"}
              color="primary"
              onClick={() => handleTemplateSelect(template.id)}
              size="small"
              fullWidth={isMobile} // Optional: make buttons full width on mobile
            >
              {template.name}
            </Button>
          ))}
          {Object.keys(data).length > 0 && (
            <Button 
              variant="outlined" 
              startIcon={<SaveIcon />}
              onClick={handleSaveAsTemplate}
              size="small"
              fullWidth={isMobile} // Optional: make button full width on mobile
            >
              Save as Template
            </Button>
          )}
        </Box>
      </Box>
      
      <CardContent sx={{ 
        p: 3,
      //  maxHeight: isMobile ? '70vh' : 'none',
      //  overflow: isMobile ? 'auto' : 'visible',
        WebkitOverflowScrolling: 'touch'
      }}>
        {/* Data element selection dropdown */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-end', gap: 1 }}>
          <FormControl fullWidth error={!!error.element}>
            <ObjectAutoCompleteSelect
              freeSolo={false}
              options={availableOptions}
              value={selectedOption}
              onChange={(value) => handleAddElement(value)}
              labelField="name"
              valueField="uid"
              label="Select Data Element"
              id="element-select"
              error={!!error.element}
              helperText={error.element}
              disabled={loading}
            />
          </FormControl>
        </Box>
        
        {/* Loading state */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* When no data elements added yet */}
            {Object.keys(data).length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="textSecondary">
                  No data elements added yet. Select a template or use the dropdown above to add elements.
                </Typography>
              </Paper>
            ) : (
              /* Render all selected data elements with their matrices */
              Object.keys(data).map(dataElementId => renderMatrixComponent(dataElementId))
            )}
          </Box>
        )}
      </CardContent>
      
      {/* Navigation buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, mb: 3, px: 3, width: '100%' }}>
        {onBack && (
          <Button
            variant="outlined"
            onClick={onBack}
            disabled={loading}
          >
            Back
          </Button>
        )}
        {onNext && (
          <Button
            variant="contained"
            color="primary"
            onClick={onNext}
            disabled={submittedElements.length === 0 || loading}
          >
            Next
          </Button>
        )}
      </Box>
    </Card>
  );
};

export default TemplateMenuVerticalMatrix;