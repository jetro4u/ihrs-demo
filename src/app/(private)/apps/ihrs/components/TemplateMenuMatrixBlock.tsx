import { FC, useState, useEffect, ChangeEvent, useMemo, useRef } from 'react';
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
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  useMediaQuery, 
  useTheme 
} from '@mui/material';
import DomsSvgIcon from './DomsSvgIcon';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import { useMatrixDebounce } from 'src/@fuse/hooks'
import { DataElement, DataSet, ValueType, CategoryOptionCombo, DataValuePayload, FieldStatus } from '../types';
import ObjectAutoCompleteSelect from './ObjectAutoCompleteSelect';
import { getValidationRules, getCustomLogic, validateInput as validateInputFunction } from '../utils/validateLogic';

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

// Main component props
interface TemplateMenuMatrixBlockProps {
  q: DataElement[];
  coc: CategoryOptionCombo[];
  dataSet: DataSet;
  period: string;
  source: string;
  onSubmit?: (data: string, dataElement: string, categoryOptionCombo: string) => Promise<{ success: boolean }>;
  templates?: Template[];
  existingValues?: any[];
  onValuesUpdate?: (values: any[]) => void;
  readOnly?: boolean;
  customValidation?: (value: any) => string | null;
  onValidationStateChange?: (isValid: boolean) => void;
}

const SESSION_STORAGE_KEY_PREFIX = 'matrix-field-';

const TemplateMenuMatrixBlock: FC<TemplateMenuMatrixBlockProps> = ({
  q,
  coc,
  dataSet,
  period,
  source,
  onSubmit,
  templates: externalTemplates = [],
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
  const [statuses, setStatuses] = useState<Record<string, Record<string, FieldStatus>>>({});
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
  const [autoSaving, setAutoSaving] = useState<Record<string, Record<string, boolean>>>({});
  const [submittedCombos, setSubmittedCombos] = useState<Record<string, string[]>>({});
  const [submittedElements, setSubmittedElements] = useState<string[]>([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const pendingSavesRef = useRef<Record<string, Record<string, boolean>>>({});
  const abortControllersRef = useRef<Record<string, Record<string, AbortController>>>({});

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
    
    const validationRules = useMemo(() => getValidationRules({
      elementOption: selectedOption,
      dataSet,
      fieldName: 'value'
    }), [q, dataSet]);
  
    const customLogic = useMemo(() => getCustomLogic({
      elementOption: selectedOption,
      dataSet,
    }), [q, dataSet]);

  const elementOptions = q.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  
  useEffect(() => {
    setTemplates([mainTemplate, ...externalTemplates]);
  }, [externalTemplates]);

  // Add this useEffect for cleanup
  useEffect(() => {
    return () => {
      // Abort any pending save requests
      Object.keys(abortControllersRef.current).forEach(dataElementId => {
        Object.values(abortControllersRef.current[dataElementId] || {}).forEach(controller => {
          try {
            controller.abort();
          } catch (error) {
            console.error('Error aborting request:', error);
          }
        });
      });
    };
  }, []);

  // Filter out options already in data
  const availableOptions = elementOptions.filter(
    (option) => !Object.prototype.hasOwnProperty.call(data, option.uid)
  );

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
  const findCategoryOptionCombo = (dataElementId: string, row: string, column: string) => {
    const dataElement = q.find(de => de.uid === dataElementId);
    if (!dataElement || !dataElement.categoryCombo) return undefined;
    
    const ccId = dataElement.categoryCombo.id;
    
    // Filter category option combos by this category combo ID
    const relevantCocs = coc.filter(c => c.categoryCombo?.id === ccId);
    
    // Check if names contain commas
    const hasSplittableNames = relevantCocs.some(c => c.name.includes(','));
    
    if (hasSplittableNames) {
      // Find the combo where both row and column match
      return relevantCocs.find(c => {
        const parts = c.name.split(',').map(part => part.trim());
        return parts[0] === column && parts[1] === row;
      });
    } else {
      // For non-splittable names, we're using the column as the name and "Value" as the row
      if (row === "Value") {
        return relevantCocs.find(c => c.name === column);
      }
    }
    
    return undefined;
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

  const validateInputValue = (dataElementId: string, input: any): string => {
    // Find the specific data element
    const dataElement = q.find(de => de.uid === dataElementId);
    if (!dataElement) return 'Invalid data element';
    
    // Collect all values to support cross-field validation
    const allValues: Record<string, any> = {};
    Object.keys(values).forEach(elementId => {
      Object.entries(values[elementId]).forEach(([cocId, value]) => {
        // Add each value with a key that could be referenced in customLogic
        allValues[`${elementId}_${cocId}`] = value;
      });
    });
    
    // Use the imported validation function
    return validateInputFunction(input, validationRules, allValues, customLogic);
  };
  
  // Get input type based on valueType
  const getInputType = (dataElementId: string): string => {
    const dataElement = q.find(de => de.uid === dataElementId);
    if (!dataElement) return 'text';
    
    // Get validation rules to determine the value type
    const validationRules = getValidationRules({ 
      elementOption: dataElement,
      dataSet: dataSet,
      fieldName: 'value'
    });
    
    const valueType = validationRules.valueType;
    
    switch (valueType) {
      case ValueType.NUMBER:
      case ValueType.INTEGER:
      case ValueType.INTEGER_POSITIVE:
      case ValueType.INTEGER_NEGATIVE:
      case ValueType.INTEGER_ZERO_OR_POSITIVE:
      case ValueType.PERCENTAGE:
        return 'number';
      case ValueType.DATE:
        return 'date';
      case ValueType.BOOLEAN:
        return 'checkbox';
      default:
        return 'text';
    }
  };
  
  // Update the getInputProps function to use validationRules
  const getInputProps = (dataElementId: string) => {
    const dataElement = q.find(de => de.uid === dataElementId);
    if (!dataElement) return {};
    
    // Get validation rules to determine input constraints
    const validationRules = getValidationRules({ 
      elementOption: dataElement,
      dataSet: dataSet,
      fieldName: 'value'
    });
    
    const valueType = validationRules.valueType;
    const props: any = {};
    
    // Apply min/max from validationRules if available
    if (validationRules.min !== null && validationRules.min !== undefined) {
      props.min = validationRules.min;
    }
    
    if (validationRules.max !== null && validationRules.max !== undefined) {
      props.max = validationRules.max;
    }
    
    switch (valueType) {
      case ValueType.INTEGER:
      case ValueType.INTEGER_POSITIVE:
      case ValueType.INTEGER_NEGATIVE:
      case ValueType.INTEGER_ZERO_OR_POSITIVE:
        props.step = 1;
        props.inputMode = 'numeric';
        break;
      case ValueType.PERCENTAGE:
        props.step = 1;
        props.min = props.min || 0;
        props.max = props.max || 100;
        props.inputMode = 'numeric';
        break;
      case ValueType.NUMBER:
        props.inputMode = 'decimal';
        break;
      case ValueType.DATE:
        // Date-specific props if needed
        break;
      default:
        break;
    }
    
    return props;
  };
  
  // Handle saving data for a specific cell
  // Updated handleSaveData function with race condition prevention
  const handleSaveData = async (dataElementId: string, cocId: string) => {
    const currentValue = values[dataElementId]?.[cocId] || '';
    const currentErrors = errors[dataElementId]?.[cocId] || '';
    const dataElement = q.find(de => de.uid === dataElementId);
    if (!dataElement || !dataElement.categoryCombo) return;
    
    const ccId = dataElement.categoryCombo.id;
    
    // Skip save if there's validation error
    if (currentErrors) {
      setStatuses(prev => ({
        ...prev,
        [dataElementId]: {
          ...prev[dataElementId],
          [cocId]: FieldStatus.ERROR
        }
      }));
      return;
    }
    
    // Skip if already saving this field
    if (pendingSavesRef.current[dataElementId]?.[cocId]) {
      return;
    }
    
    // Initialize nested objects if they don't exist
    if (!pendingSavesRef.current[dataElementId]) {
      pendingSavesRef.current[dataElementId] = {};
    }
    if (!abortControllersRef.current[dataElementId]) {
      abortControllersRef.current[dataElementId] = {};
    }
    
    // Mark as saving
    pendingSavesRef.current[dataElementId][cocId] = true;
    
    // Create an abort controller for this save operation
    const controller = new AbortController();
    abortControllersRef.current[dataElementId][cocId] = controller;
    
    try {
      setStatuses(prev => ({
        ...prev,
        [dataElementId]: {
          ...prev[dataElementId],
          [cocId]: FieldStatus.SAVING
        }
      }));
      
      // Try to save to server
      if (onSubmit) {
        try {
          const response = await onSubmit(currentValue, dataElementId, cocId);
          
          if (response.success) {
            const newSubmittedCombos = {
              ...submittedCombos,
              [dataElementId]: [
                ...(submittedCombos[dataElementId] || []).filter(id => id !== cocId),
                cocId
              ]
            };
            
            setSubmittedCombos(newSubmittedCombos);
            setStatuses(prev => ({
              ...prev,
              [dataElementId]: {
                ...prev[dataElementId],
                [cocId]: FieldStatus.SAVED
              }
            }));
            
            // Check if all combos for this element are saved
            const relevantCombos = coc.filter(c => c.categoryCombo?.id === ccId);
            if (newSubmittedCombos[dataElementId].length === relevantCombos.length) {
              setSubmittedElements(prev => 
                prev.includes(dataElementId) ? prev : [...prev, dataElementId]
              );
            }
          } else {
            throw new Error("Server returned unsuccessful response");
          }
        } catch (error) {
          console.error('Error saving to server:', error);
          setStatuses(prev => ({
            ...prev,
            [dataElementId]: {
              ...prev[dataElementId],
              [cocId]: FieldStatus.ERROR
            }
          }));
          
          setErrors(prev => ({
            ...prev,
            [dataElementId]: {
              ...prev[dataElementId],
              [cocId]: error instanceof Error ? error.message : 'Unknown error'
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error in save process:', error);
      setStatuses(prev => ({
        ...prev,
        [dataElementId]: {
          ...prev[dataElementId],
          [cocId]: FieldStatus.ERROR
        }
      }));
      
      setErrors(prev => ({
        ...prev,
        [dataElementId]: {
          ...prev[dataElementId],
          [cocId]: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    } finally {
      // Clean up regardless of outcome
      if (pendingSavesRef.current[dataElementId]) {
        delete pendingSavesRef.current[dataElementId][cocId];
      }
      
      if (abortControllersRef.current[dataElementId]) {
        delete abortControllersRef.current[dataElementId][cocId];
      }
      
      // Clear auto-saving state
      setAutoSaving(prev => {
        const newState = { ...prev };
        if (newState[dataElementId]) {
          const elementAutoSaving = { ...newState[dataElementId] };
          delete elementAutoSaving[cocId];
          newState[dataElementId] = elementAutoSaving;
        }
        return newState;
      });
    }
  };

  // Add these debounced functions
  const debouncedSave = useMatrixDebounce((dataElementId: string, cocId: string, value: string) => {
    handleSaveData(dataElementId, cocId);
  }, 400);

  const debouncedValidate = useMatrixDebounce((dataElementId: string, cocId: string, value: string) => {
    // Run validation with the new validation function
    const validationError = validateInputValue(dataElementId, value);
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
  }, 300);

  // Updated handleInputChange function to use debounced validation
  const handleInputChange = (dataElementId: string, cocId: string) => (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    
    // Update value immediately for responsive UI
    setValues(prev => ({
      ...prev,
      [dataElementId]: {
        ...prev[dataElementId],
        [cocId]: newValue
      }
    }));
    
    // Set status to IDLE immediately
    setStatuses(prev => ({
      ...prev,
      [dataElementId]: {
        ...prev[dataElementId],
        [cocId]: FieldStatus.IDLE
      }
    }));
    
    // Use debounced validation
    debouncedValidate(dataElementId, cocId, newValue);
  };

  // Updated handleBlur function to use debounced save
  const handleBlur = (dataElementId: string, cocId: string) => () => {
    const currentValue = values[dataElementId]?.[cocId] || '';
    const currentErrors = errors[dataElementId]?.[cocId];
    
    // Only trigger save if we have a value and there are no errors
    if (currentValue && !currentErrors && !pendingSavesRef.current[dataElementId]?.[cocId]) {
      debouncedSave(dataElementId, cocId, currentValue);
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
    const currentValue = values[dataElementId]?.[cocId] || '';
    const isSaving = statuses[dataElementId]?.[cocId] === FieldStatus.SAVING || autoSaving[dataElementId]?.[cocId];
    const hasError = !!errors[dataElementId]?.[cocId];
    const dataElement = q.find(de => de.uid === dataElementId);
    
    if (!dataElement) return null;
    
    // Get validation rules to determine input properties
    const validationRules = getValidationRules({ 
      elementOption: dataElement,
      dataSet: dataSet,
      fieldName: 'value'
    });
    
    const valueType = validationRules.valueType;
  
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
      placeholder: dataElement.formStyles?.placeholder || `Enter here`,
      type: getInputType(dataElementId),
      value: currentValue,
      onChange: handleInputChange(dataElementId, cocId),
      onBlur: handleBlur(dataElementId, cocId),
      error: hasError,
      disabled: readOnly || (isSaving && !hasError),
      required: validationRules.required,
      sx: { 
        bgcolor: 'white',
        ...(isMobile && { width: '100%' })
      },
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
          {(hasError || statuses[dataElementId]?.[cocId] === FieldStatus.WARNING) && (
            <Typography variant="caption" color={hasError ? "error" : "text.secondary"}>
              {getHelperText()}
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  // Render a mobile-optimized version of the matrix table
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
      <Box sx={{ mb: 3 }}>
        {matrix.rows.map((row, rowIndex) => (
          <Accordion 
            key={`row-${rowIndex}`}
            expanded={!(collapsedRows[dataElementId]?.[row] ?? false)}
            onChange={() => toggleRowCollapse(dataElementId, row)}
            sx={{ 
              mb: 1,
              boxShadow: 2,
              '&:before': {
                display: 'none',
              },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ 
                bgcolor: 'primary.light', 
                color: 'primary.contrastText',
                '&.Mui-expanded': {
                  minHeight: 48,
                },
              }}
            >
              <Typography fontWeight="medium">{row}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {matrix.columns.map((column, colIndex) => {
                  const coc = findCategoryOptionCombo(dataElementId, row, column);
                  if (!coc) return null;
                  
                  return (
                    <Card key={`cell-${colIndex}`} sx={{ boxShadow: 1 }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          {column}
                        </Typography>
                        {renderCellInputField(dataElementId, coc.id)}
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  };

  const renderDesktopDisaggregatedTable = (dataElementId: string) => {
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
                    color: 'white !important',
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
              <TableRow key={rowIndex} sx={{ '&:nth-of-type(even)': { bgcolor: 'action.hover' } }}>
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
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Render matrix component for a specific data element
  const renderMatrixComponent = (dataElementId: string) => {
    const dataElement = q.find(de => de.uid === dataElementId);
    if (!dataElement) return null;
    
    const { totalCombos, submittedCount, hasAllSubmitted } = getElementStats(dataElementId) || { totalCombos: 0, submittedCount: 0, hasAllSubmitted: false };
    
    return (
      <Box sx={{ width: '100%' }} key={dataElementId}>
        <Paper
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          sx={{ 
            p: { xs: 2, sm: 4 },
            borderRadius: 2, 
            boxShadow: 3,  
            mb: 4,
            border: hasAllSubmitted ? '1px solid #c8e6c9' : 'none',
            bgcolor: hasAllSubmitted ? '#f0f7f0' : 'white'
          }}
        >
          {/* Mobile: Stack layout */}
          <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              {/* Left side: Title and expand/collapse */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton 
                  onClick={() => toggleComponentCollapse(dataElementId)}
                  aria-label={isComponentCollapsed[dataElementId] ? "Expand" : "Collapse"}
                  size="small"
                >
                  {isComponentCollapsed[dataElementId] ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                </IconButton>
                
                <Typography variant="h6" sx={{ fontWeight: 500, fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>
                  {dataElement.name}
                </Typography>
              </Box>
              
              {/* Delete button on right */}
              <IconButton 
                color="error" 
                size="small"
                onClick={() => handleRemoveElement(dataElementId)}
                disabled={autoSaving[dataElementId] && Object.values(autoSaving[dataElementId]).some(Boolean)}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
            
            {/* Status chips in their own row on mobile */}
            <Box sx={{ mb: 2 }}>
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
          </Box>
          
          {/* Desktop: Normal layout */}
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              {/* Left side: Title and expand/collapse */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton 
                  onClick={() => toggleComponentCollapse(dataElementId)}
                  aria-label={isComponentCollapsed[dataElementId] ? "Expand" : "Collapse"}
                  size="small"
                  sx={{ mr: 1 }}
                >
                  {isComponentCollapsed[dataElementId] ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                </IconButton>
                
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                  {dataElement.name}
                </Typography>
              </Box>
              
              {/* Right side: Status chips and delete button */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                
                <IconButton 
                  color="error" 
                  size="small"
                  onClick={() => handleRemoveElement(dataElementId)}
                  disabled={autoSaving[dataElementId] && Object.values(autoSaving[dataElementId]).some(Boolean)}
                  sx={{ ml: 2 }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
          </Box>
          
          {/* Render appropriate table based on device size */}
          {!isComponentCollapsed[dataElementId] && (
            isMobile 
              ? renderMobileDisaggregatedTable(dataElementId)
              : renderDesktopDisaggregatedTable(dataElementId)
          )}
        </Paper>
      </Box>
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

  // Main render function
  return (
    <Card sx={{ 
      width: '100%', 
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
              fullWidth={isMobile}
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
              fullWidth={isMobile}
            >
              Save as Template
            </Button>
          )}
        </Box>
      </Box>
      
      <CardContent sx={{ 
        p: 2,
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
    </Card>
  );
};

export default TemplateMenuMatrixBlock;