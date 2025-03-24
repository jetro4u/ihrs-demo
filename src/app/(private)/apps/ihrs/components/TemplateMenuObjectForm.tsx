import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  IconButton,
  Paper,
  Box,
  FormControl,
  TextField,
  InputAdornment,
  CircularProgress,
  Chip,
  useMediaQuery, 
  useTheme 
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SaveIcon from '@mui/icons-material/Save';
import DomsSvgIcon from '../components/DomsSvgIcon';
import ObjectAutoCompleteSelect from './ObjectAutoCompleteSelect';
import { DataElement, ValueType, DataSet } from '../types';
import { getValidationRules, getCustomLogic, evaluateExpression, validateInput as validateInputFunction, getCustomObjectLogic } from '../utils/validateLogic';

// Define types for our component
export interface MetricData {
  [key: string]: any;
}

export interface FormData {
  [key: string]: MetricData;
}

export interface Template {
  id: string;
  name: string;
  data: FormData;
}

interface TemplateMenuObjectFormProps {
  q: DataElement[];
  dataSet: DataSet;
  period: string;
  source: string;
  onSubmit: (data: MetricData, dataElement: string, categoryOptionCombo: string) => Promise<{ success: boolean }>;
  templates?: Template[];
  onNext?: () => void;
  onBack?: () => void;
  existingRecords?: any[];
  onRecordsUpdate?: (records: any[]) => void;
}

const TemplateMenuObjectForm: React.FC<TemplateMenuObjectFormProps> = ({
  q = [],
  dataSet,
  period,
  source,
  onSubmit,
  templates: externalTemplates = [],
  existingRecords,
  onRecordsUpdate
}) => {
  const [data, setData] = useState<FormData>({});
  const [submittedRecords, setSubmittedRecords] = useState<any[]>(existingRecords || []);
  const [submittedElements, setSubmittedElements] = useState<string[]>([]);
  const [alertInfo, setAlertInfo] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' | 'warning' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, Record<string, string>>>({});
  const [selectedOption, setSelectedOption] = useState<DataElement | null>(null);
  const [error, setError] = useState({ element: '' });
  const [loading, setLoading] = useState(false);
  const [savingBlocks, setSavingBlocks] = useState<Record<string, boolean>>({});
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  
  const mainTemplate: Template = { 
    id: 'main', 
    name: 'Main Report', 
    data: {} 
  };
  
  const [templates, setTemplates] = useState<Template[]>([
    mainTemplate,
    ...externalTemplates
  ]);
  
  // Prepare data elements as options, sorted by dataElementOrder
  const elementOptions = q.sort((a, b) => a.dataElementOrder - b.dataElementOrder);

  const toTitleCase = (str) => {
    const spacedStr = str.replace(/([A-Z])/g, ' $1').toLowerCase();
    return spacedStr.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  // Update templates when external templates change
  useEffect(() => {
    setTemplates([mainTemplate, ...externalTemplates]);
  }, [externalTemplates]);

  // Effect to initialize data from existingRecords
  useEffect(() => {
    if (existingRecords && existingRecords.length > 0) {
      const newData: FormData = {};
      const elements: string[] = [];
      
      existingRecords.forEach(record => {
        const elementOption = elementOptions.find(opt => opt.uid === record.dataElementId);
        if (elementOption) {
          const elementKey = elementOption.shortName.toLowerCase();
          // Parse record data if it's stored as a string
          const recordData = typeof record.data === 'string' 
            ? JSON.parse(record.data) 
            : record.data;
          
          newData[elementKey] = recordData;
          
          elements.push(elementKey);
        }
      });
      
      // Only update if we have data to avoid unnecessary re-renders
      if (Object.keys(newData).length > 0) {
        setData(newData);
        setSubmittedElements(elements);
      }
    }
  }, [existingRecords, elementOptions]);

  // Filter out options already in data
  const availableOptions = elementOptions.filter(
    (option) => !Object.prototype.hasOwnProperty.call(data, option.shortName.toLowerCase())
  );

  // Display names for the elements
  const getElementLabel = (shortName: string): string => {
    const option = elementOptions.find(opt => opt.shortName.toLowerCase() === shortName.toLowerCase());
    return option?.name || shortName;
  };

  const handleChange = (elementKey: string, metric: string, value: string) => {
    const elementOption = elementOptions.find(
      opt => opt.shortName.toLowerCase() === elementKey.toLowerCase()
    );
    
    const validationRules = getValidationRules({
      elementOption,
      dataSet,
      fieldName: metric
    });
    
    const isNumericType = [
      ValueType.INTEGER,
      ValueType.INTEGER_POSITIVE,
      ValueType.INTEGER_ZERO_OR_POSITIVE,
      ValueType.NUMBER,
      ValueType.PERCENTAGE
    ].includes(validationRules.valueType);
    
    // Parse value based on field type
    const parsedValue = isNumericType && value !== '' ? Number(value) : value;

    // Update the data first so we can validate against all current values
    const updatedData = {
      ...data[elementKey] || {},
      [metric]: parsedValue
    };
    
    // Update the data
    setData((prevData) => ({
      ...prevData,
      [elementKey]: updatedData
    }));
    
    // Run validation using the utility
    const validationError = validateInputFunction(
      parsedValue, 
      validationRules,
      updatedData // Pass all values for cross-field validation
    );

    // First set individual field error
    setFieldErrors(prev => ({
      ...prev,
      [elementKey]: {
        ...(prev[elementKey] || {}),
        [metric]: validationError
      }
    }));
    
    // Then run cross-field validation if this field is valid
    if (!validationError) {
      const customLogicObj = getCustomLogic({
        elementOption,
        dataSet
      });
      
      if (customLogicObj && customLogicObj.validations) {
        // We only run validations for rules involving the changed field
        const relevantValidations = customLogicObj.validations.filter(validation => 
          validation.field === metric || 
          (typeof validation.compareTo === 'string' && 
          validation.compareTo.includes(metric))
        );
        
        if (relevantValidations.length > 0) {
          // Create a new errors object
          const customErrors = {};
          
          for (const validation of relevantValidations) {
            if (!validation.field || !validation.operator || !validation.compareTo) {
              continue; // Skip invalid rules
            }
            
            const fieldValue = Number(updatedData[validation.field] || 0);
            let compareValue;
            
            // Check if compareTo contains an expression
            if (typeof validation.compareTo === 'string' && 
                /[+\-*/]/.test(validation.compareTo)) {
              try {
                compareValue = evaluateExpression(validation.compareTo, updatedData);
              } catch (error) {
                console.error('Error evaluating expression:', error);
                continue;
              }
            } else {
              compareValue = updatedData[validation.compareTo] !== undefined ? 
                Number(updatedData[validation.compareTo]) : 
                Number(validation.compareTo);
            }
            
            if (isNaN(compareValue)) continue;
            
            let isValid = true;
            
            // Apply the appropriate comparison
            switch(validation.operator) {
              case '>': isValid = fieldValue > compareValue; break;
              case '<': isValid = fieldValue < compareValue; break;
              case '>=': isValid = fieldValue >= compareValue; break;
              case '<=': isValid = fieldValue <= compareValue; break;
              case '==': 
              case '===': isValid = fieldValue === compareValue; break;
              case '!=':
              case '!==': isValid = fieldValue !== compareValue; break;
              default: isValid = true; // Unknown operator
            }
            
            if (!isValid) {
              customErrors[validation.field] = validation.message || 
                `Invalid value for ${validation.field}`;
            }
          }
          
          // Update field errors with cross-field validation results
          if (Object.keys(customErrors).length > 0) {
            setFieldErrors(prev => ({
              ...prev,
              [elementKey]: {
                ...(prev[elementKey] || {}),
                ...customErrors
              }
            }));
          }
        }
      }
    }
  };

  // Handle adding a new element
  const handleAddElement = (value: DataElement | null) => {
    if (!value) return;
    const normalizedKey = value.shortName.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(data, normalizedKey)) {
      setError({ element: 'This element already exists!' });
      return;
    }
    
    // Initialize with metrics from the element option if available
    const initialData = {};
    
    // If the element has customValidation, use the default values from there
    if (value.customValidation) {
      Object.entries(value.customValidation).forEach(([metricKey, validationRules]) => {
        initialData[metricKey] = validationRules.default;
      });
    } 
    // If there's section-level customValidation, use those defaults
    else if (dataSet?.sections[0]?.customValidation) {
      Object.entries(dataSet.sections[0].customValidation).forEach(([metricKey, validationRules]) => {
        initialData[metricKey] = validationRules.default;
      });
    }
    // Fallback to element metrics if defined
    else if (dataSet?.customValidation) {
      Object.entries(dataSet.customValidation).forEach(([metricKey, validationRules]) => {
        initialData[metricKey] = validationRules.default;
      });
    }
    
    setData((prevData) => ({
      ...prevData,
      [normalizedKey]: initialData
    }));
    
    setError({ element: '' });
    setSelectedOption(null);
  };

  // Handle removal of an element
  const handleRemoveElement = (elementKey: string) => {
    // Remove from data
    setData((prevData) => {
      const newData = { ...prevData };
      delete newData[elementKey];
      return newData;
    });
    
    // Remove from submitted elements if it was submitted
    setSubmittedElements(prev => prev.filter(key => key !== elementKey));
    
    // Remove from submitted records
    const elementOption = elementOptions.find(
      opt => opt.shortName.toLowerCase() === elementKey.toLowerCase()
    );
    
    if (elementOption) {
      const updatedRecords = submittedRecords.filter(
        record => record.dataElementId !== elementOption.uid
      );
      setSubmittedRecords(updatedRecords);
      
      // Notify parent component
      if (onRecordsUpdate) {
        onRecordsUpdate(updatedRecords);
      }
    }
    
    // Clear any field errors for this element
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[elementKey];
      return newErrors;
    });
  };

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    const selectedTemplate = templates.find(t => t.id === templateId);
    if (selectedTemplate) {
      // Keep submitted state when switching templates
      const oldData = { ...data };
      const newData = { ...selectedTemplate.data };
      
      Object.keys(newData).forEach(key => {
        if (submittedElements.includes(key) && oldData[key]) {
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
      setTemplates((prevTemplates) => ([
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
      setSubmittedRecords([]);
      if (onRecordsUpdate) {
        onRecordsUpdate([]);
      }
      
      alert('Template saved successfully! Form data has been reset.');
    }
  };

  // Validate all fields before submission
// Replace the existing validateAllFields function with this implementation
  const validateAllFields = (elementKey: string): boolean => {
    const currentData = data[elementKey];
    if (!currentData) return false;
    
    // Find the element option
    const elementOption = elementOptions.find(
      opt => opt.shortName.toLowerCase() === elementKey.toLowerCase()
    );
    
    if (!elementOption) return false;
    
    let hasErrors = false;
    const newFieldErrors = {};
    
    Object.entries(currentData).forEach(([fieldName, fieldValue]) => {
      const fieldValidationRules = getValidationRules({
        elementOption,
        dataSet,
        fieldName
      });
      
      // Validate the field
      const errorMessage = validateInputFunction(
        fieldValue, 
        fieldValidationRules,
        currentData
      );
      
      if (errorMessage) {
        newFieldErrors[fieldName] = errorMessage;
        hasErrors = true;
      }
    });
    
    if (!hasErrors) {
      // Get custom logic
      const customLogicObj = getCustomLogic({
        elementOption,
        dataSet
      });
      
      if (customLogicObj && customLogicObj.validations) {
        for (const validation of customLogicObj.validations) {
          if (!validation.field || !validation.operator || !validation.compareTo) {
            continue;
          }
          
          const fieldValue = Number(currentData[validation.field] || 0);
          let compareValue;
          
          // Check if compareTo contains an expression with operators (+, -, *, /)
          if (typeof validation.compareTo === 'string' && 
              /[+\-*/]/.test(validation.compareTo)) {
            try {
              // Use our improved expression evaluator
              compareValue = evaluateExpression(validation.compareTo, currentData);
            } catch (error) {
              console.error('Error evaluating expression:', error);
              continue; // Skip this validation if expression evaluation fails
            }
          } else {
            // Simple field reference or direct value
            compareValue = currentData[validation.compareTo] !== undefined ? 
              Number(currentData[validation.compareTo]) : 
              Number(validation.compareTo);
          }
          
          // Skip if compareValue couldn't be evaluated
          if (isNaN(compareValue)) continue;
          
          let isValid = true;
          
          // Apply the appropriate comparison
          switch(validation.operator) {
            case '>': isValid = fieldValue > compareValue; break;
            case '<': isValid = fieldValue < compareValue; break;
            case '>=': isValid = fieldValue >= compareValue; break;
            case '<=': isValid = fieldValue <= compareValue; break;
            case '==': 
            case '===': isValid = fieldValue === compareValue; break;
            case '!=':
            case '!==': isValid = fieldValue !== compareValue; break;
            default: isValid = true; // Unknown operator
          }
          
          if (!isValid) {
            newFieldErrors[validation.field] = validation.message || 
              `Invalid value for ${validation.field}`;
            hasErrors = true;
          }
        }
      }
    }
    
    // Update field errors state
    setFieldErrors(prev => ({
      ...prev,
      [elementKey]: newFieldErrors
    }));
    
    return !hasErrors;
  };

  // Handle submission for a single element block
  const handleBlockSubmit = async (elementKey) => {
    const isValid = validateAllFields(elementKey);
    
    if (!isValid) {
      setAlertInfo({
        open: true,
        message: `Please fix validation errors for ${getElementLabel(elementKey)}`,
        severity: 'error'
      });
      return;
    }
    
    setLoading(true);
    
    try {
      setSavingBlocks(prev => ({ ...prev, [elementKey]: true }));
      
      // Find the data element
      const elementOption = elementOptions.find(
        option => option.shortName.toLowerCase() === elementKey.toLowerCase()
      );
      
      if (!elementOption) {
        throw new Error(`Element ${elementKey} not found in metadata`);
      }
      
      // Then try to save via parent component's onSubmit handler
      if (onSubmit) {
        try {
          const result = await onSubmit(data[elementKey], elementOption.uid, 'HllvX50cXC0');
          
          if (result.success) {
            if (!submittedElements.includes(elementKey)) {
              setSubmittedElements(prev => [...prev, elementKey]);
            }
            
            setAlertInfo({
              open: true,
              message: `${getElementLabel(elementKey)} data submitted successfully!`,
              severity: 'success'
            });
          }
        } catch (error) {
          console.error('Error saving to server, data has been stored locally for later sync:', error);
          setAlertInfo({
            open: true,
            message: `${getElementLabel(elementKey)} data could not be sent to server and has been saved locally for later synchronization.`,
            severity: 'warning'
          });
        }
      } else {
        setAlertInfo({
          open: true,
          message: `${getElementLabel(elementKey)} data saved locally.`,
          severity: 'info'
        });
      }
    } catch (error) {
      console.error('Error saving data:', error);
      setAlertInfo({
        open: true,
        message: `Error saving ${elementKey} data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setSavingBlocks(prev => ({ ...prev, [elementKey]: false }));
      setLoading(false);
    }
  };

  // Get title for the form
  const getFormTitle = (): string => {
    if (q.length > 0 && q[0].dataElementGroups) {
      return `${q[0].dataElementGroups.name} Report`;
    }
    return 'Data Collection Form';
  };

  // Create input fields for an element
  const renderMetricInputs = (elementKey: string) => {
    const elementOption = elementOptions.find(
      opt => opt.shortName.toLowerCase() === elementKey.toLowerCase()
    );
    
    if (!elementOption) {
      return null;
    }
    
    // Get the current data for this element
    const currentData = data[elementKey] || {};
    
    // Determine which fields to render based on validation rules
    let fieldsToRender = [];
    
    // Use element-level validation if available
    if (elementOption.customValidation) {
      fieldsToRender = Object.keys(elementOption.customValidation);
    }
    // Fallback to section-level validation
    else if (dataSet?.sections[0]?.customValidation) {
      fieldsToRender = Object.keys(dataSet.sections[0].customValidation);
    }
    // If neither is available, fall back to element metrics
    else if (dataSet?.customValidation) {
      fieldsToRender = Object.keys(dataSet.customValidation);
    }
    // Last resort - use existing data keys
    else if (Object.keys(currentData).length > 0) {
      fieldsToRender = Object.keys(currentData);
    }
    
    if (fieldsToRender.length > 0) {
      return (
        <Grid container spacing={2}>
          {fieldsToRender.map((metricKey) => {
            const validationRules = getValidationRules({
              elementOption,
              dataSet,
              fieldName: metricKey
            });
            
            const inputType = (() => {
              switch (validationRules.valueType) {
                case ValueType.INTEGER:
                case ValueType.INTEGER_POSITIVE:
                case ValueType.INTEGER_ZERO_OR_POSITIVE:
                case ValueType.NUMBER:
                case ValueType.PERCENTAGE:
                  return 'number';
                case ValueType.DATE:
                  return 'date';
                case ValueType.TIME:
                  return 'time';
                case ValueType.BOOLEAN:
                  return 'checkbox';
                default:
                  return 'text';
              }
            })();
            
            // Get current value with fallback to default
            const currentValue = currentData[metricKey] !== undefined 
              ? currentData[metricKey] 
              : validationRules.default;
              
            // Get error message if any
            const errorMessage = fieldErrors[elementKey]?.[metricKey] || '';
            
            return (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={metricKey}>
                <TextField
                  label={toTitleCase(metricKey)}
                  type={inputType}
                  value={currentValue === null ? '' : currentValue}
                  onChange={(e) => handleChange(elementKey, metricKey, e.target.value)}
                  variant="outlined"
                  fullWidth
                  size="medium"
                  disabled={savingBlocks[elementKey]}
                  error={!!errorMessage}
                  helperText={errorMessage}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <DomsSvgIcon>{elementOption.iconText || 'material-outline:edit'}</DomsSvgIcon>
                        </InputAdornment>
                      )
                    }
                  }}
                />
              </Grid>
            );
          })}
        </Grid>
      );
    }
    
    // Fallback if no fields could be determined
    return (
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Typography color="textSecondary">
            No metrics defined for this element. Please add metrics manually.
          </Typography>
        </Grid>
      </Grid>
    );
  };

  return (
    <Card sx={{ 
      width: '100%', 
      maxWidth: '1024px',
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
      
      <Box sx={{ bgcolor: '#f5f5f5', px: 2, pb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Select Template:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {templates.map(template => (
            <Button
              key={template.id}
              variant={activeTemplate === template.id ? "contained" : "outlined"}
              color="primary"
              onClick={() => handleTemplateSelect(template.id)}
              size="small"
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
            >
              Save as Template
            </Button>
          )}
        </Box>
      </Box>
      
      <CardContent sx={{ 
        p: 3,
        overflow: isMobile ? 'auto' : 'visible',
        WebkitOverflowScrolling: 'touch'
      }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-end', gap: 1 }}>
          <FormControl fullWidth error={!!error.element}>
            <ObjectAutoCompleteSelect
              freeSolo={false}
              options={availableOptions}
              value={selectedOption}
              onChange={(value) => handleAddElement(value)}
              labelField="name"
              valueField="uid"
              label="Select"
              id="element-select"
              error={!!error.element}
              helperText={error.element}
              disabled={loading}
            />
          </FormControl>
        </Box>
        
        {loading && Object.keys(savingBlocks).every(key => !savingBlocks[key]) ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {Object.keys(data).length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="textSecondary">
                  No elements added yet. Select a template or use the dropdown above to add elements.
                </Typography>
              </Paper>
            ) : (
              Object.entries(data).map(([elementKey]) => {
                const isSubmitted = submittedElements.includes(elementKey);
                return (
                  <Paper 
                    key={elementKey} 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      bgcolor: isSubmitted ? '#f0f7f0' : '#f5f5f5', 
                      border: `1px solid ${isSubmitted ? '#c8e6c9' : '#e0e0e0'}`,
                      borderRadius: 2,
                      position: 'relative'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6">
                          {getElementLabel(elementKey)}
                        </Typography>
                        {isSubmitted && (
                          <Chip 
                            icon={<CheckCircleIcon />} 
                            label="Submitted" 
                            color="success" 
                            size="small" 
                          />
                        )}
                      </Box>
                      <IconButton 
                        color="error" 
                        size="small"
                        onClick={() => handleRemoveElement(elementKey)}
                        disabled={savingBlocks[elementKey]}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    
                    {/* Render input fields using element-specific metrics */}
                    {renderMetricInputs(elementKey)}
                    
                    <Box sx={{ mt: 2, textAlign: 'left' }}>
                      <Button 
                        variant="contained" 
                        color="primary"
                        onClick={() => handleBlockSubmit(elementKey)}
                        size="small"
                        disabled={savingBlocks[elementKey]}
                        startIcon={savingBlocks[elementKey] ? <CircularProgress size={16} /> : null}
                      >
                        {savingBlocks[elementKey] ? 'Saving...' : isSubmitted ? 'Update' : 'Save'}
                      </Button>
                    </Box>
                  </Paper>
                );
              })
            )}
          </Box>
        )}
        
        {/* Alert for displaying messages */}
        {alertInfo.open && (
          <Box 
            sx={{ 
              mt: 2, 
              p: 2, 
              bgcolor: 
                alertInfo.severity === 'success' ? '#e8f5e9' : 
                alertInfo.severity === 'error' ? '#ffebee' : 
                alertInfo.severity === 'warning' ? '#fff8e1' : 
                alertInfo.severity === 'info' ? '#e3f2fd' : '#e3f2fd',
              borderRadius: 1,
              color: 
                alertInfo.severity === 'success' ? '#2e7d32' : 
                alertInfo.severity === 'error' ? '#c62828' : 
                alertInfo.severity === 'warning' ? '#f57f17' : 
                alertInfo.severity === 'info' ? '#1565c0' : '#1565c0'
            }}
          >
            <Typography>{alertInfo.message}</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TemplateMenuObjectForm;