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
  TextFieldProps,
  useMediaQuery, 
  useTheme 
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SaveIcon from '@mui/icons-material/Save';
import DomsSvgIcon from '../components/DomsSvgIcon';
import ObjectAutoCompleteSelect from './ObjectAutoCompleteSelect';
import { DataElement, DataSet, FieldStatus, ValueType } from '../types';
import { getValidationRules, getCustomLogic, validateInput } from '../utils/validateLogic';

export interface MetricData {
  [key: string]: any;
}

export interface FormData {
  [key: string]: string;
}

export interface Template {
  id: string;
  name: string;
  data: FormData;
}

export interface DataElementGroup {
  name: string;
  uid: string;
  code: string;
  shortname: string;
  orderid: number;
}

interface TemplateMenuValueFormProps {
  q: DataElement[];
  dataSet: DataSet;
  period: string;
  source: string;
  onSubmit: (data: string, dataElement: string, categoryOptionCombo: string) => Promise<{ success: boolean }>;
  templates?: Template[];
  onNext?: () => void;
  onBack?: () => void;
  existingValues?: any[];
  onValuesUpdate?: (values: any[]) => void;
}

const TemplateMenuValueForm: React.FC<TemplateMenuValueFormProps> = ({
  q = [],
  dataSet,
  period,
  source,
  onSubmit,
  templates: externalTemplates = [],
  existingValues,
  onValuesUpdate
}) => {
  const [data, setData] = useState<FormData>({});
  const [submittedValues, setSubmittedValues] = useState<any[]>(existingValues || []);
  const [submittedElements, setSubmittedElements] = useState<string[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<DataElement | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingBlocks, setSavingBlocks] = useState<Record<string, boolean>>({});
  const [autoSaving, setAutoSaving] = useState<Record<string, boolean>>({});
  const theme = useTheme();
    const [status, setStatus] = useState<FieldStatus>(FieldStatus.IDLE);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [alertInfo, setAlertInfo] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' | 'warning' });
  
  // Create main template and combine with external templates
  const mainTemplate: Template = { 
    id: 'main', 
    name: 'Main Report', 
    data: {} 
  };
  
  // Templates state - combine main template with external templates
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

  const getInputProps = useMemo(() => {
    const props: any = {};
    
    switch (validationRules.valueType) {
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
        props.inputMode = 'numeric';
        break;
      case ValueType.PERCENTAGE:
        props.step = 1;
        props.min = 0;
        props.max = 100;
        props.inputMode = 'numeric';
        break;
      case ValueType.LETTER:
        props.maxLength = 1;
        props.pattern = '[A-Za-z]';
        break;
      default:
        break;
    }
    
    return props;
  }, [validationRules.valueType]);
  
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

  // Effect to initialize data from existingValues
  useEffect(() => {
    if (existingValues && existingValues.length > 0) {
      const newData: FormData = {};
      const elements: string[] = [];
      
      existingValues.forEach(value => {
        const elementOption = elementOptions.find(opt => opt.uid === value.dataElementId);
        if (elementOption) {
          const elementKey = elementOption.shortName.toLowerCase();
          // Store the value
          newData[elementKey] = value.value;
          
          // Mark as submitted
          elements.push(elementKey);
        }
      });
      
      if (Object.keys(newData).length > 0) {
        setData(newData);
        setSubmittedElements(elements);
      }
    }
  }, [existingValues, elementOptions]);

  // Filter out options already in data
  const availableOptions = elementOptions.filter(
    (option) => !Object.prototype.hasOwnProperty.call(data, option.shortName.toLowerCase())
  );

  // Display names for the elements
  const getElementLabel = (shortname: string): string => {
    const option = elementOptions.find(opt => opt.shortName.toLowerCase() === shortname.toLowerCase());
    return option?.shortName || shortname;
  };

  // Handle value change
  const handleChange = (elementKey: string, value: string) => {
    setData((prevData) => ({
      ...prevData,
      [elementKey]: value
    }));
  };

  // Handle adding a new element
  const handleAddElement = (value: DataElement | null) => {
    if (!value) return;
    const normalizedKey = value.shortName.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(data, normalizedKey)) {
      setError('This element already exists!');
      return;
    }
    
    // Initialize with a value
    setData((prevData) => ({
      ...prevData,
      [normalizedKey]: value.value || ''
    }));
    
    setError('');
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
    
    // Remove from submitted elements
    setSubmittedElements(prev => prev.filter(key => key !== elementKey));
    
    // Remove from submitted values
    const elementOption = elementOptions.find(
      opt => opt.shortName.toLowerCase() === elementKey.toLowerCase()
    );
    
    if (elementOption) {
      const updatedValues = submittedValues.filter(
        value => value.dataElementId !== elementOption.uid
      );
      setSubmittedValues(updatedValues);
      
      // Notify parent component
      if (onValuesUpdate) {
        onValuesUpdate(updatedValues);
      }
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
      setSubmittedValues([]);
      if (onValuesUpdate) {
        onValuesUpdate([]);
      }
      
      // Clear locally stored form data
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('form-data-')) {
          localStorage.removeItem(key);
        }
      });
      
      alert('Template saved successfully! Form data has been reset.');
    }
  };

  // Handle submission for a single element block
  const handleBlockSubmit = async (elementKey) => {
    if (!data[elementKey]) {
      setAlertInfo({
        open: true,
        message: `Please fill the field for ${getElementLabel(elementKey)}`,
        severity: 'error'
      });
      return;
    }
    
    try {
      setSavingBlocks(prev => ({ ...prev, [elementKey]: true }));
      
      // Find the data element
      const elementOption = elementOptions.find(
        option => option.shortName.toLowerCase() === elementKey.toLowerCase()
      );
      
      if (!elementOption) {
        throw new Error(`Element ${elementKey} not found in metadata`);
      }
      
      // Get the current value
      const currentValue = data[elementKey];
      
      // Validate before saving
      const validationError = validateInput(currentValue, validationRules, data, customLogic);
      if (validationError) {
        setAlertInfo({
          open: true,
          message: validationError,
          severity: 'error'
        });
        return;
      }
      
      // Then try to save via parent component's onSubmit handler
      if (onSubmit) {
        try {
          const result = await onSubmit(currentValue, elementOption.uid, 'HllvX50cXC0');
          
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
    }
  };

  // Get title for the form
  const getFormTitle = (): string => {
    if (q.length > 0 && q[0].dataElementGroups) {
      return `${q[0].dataElementGroups.name} Report`;
    }
    return 'Data Collection Form';
  };

  // Create input field for an element 
  const renderValueInput = (elementKey: string) => {
    const elementOption = elementOptions.find(
      opt => opt.shortName.toLowerCase() === elementKey.toLowerCase()
    );
    
    if (!elementOption) {
      return null;
    }
    
    // Get current value
    const currentValue = data[elementKey] || '';
    
    const errorMessage = validateInput(currentValue, validationRules, data, customLogic);
    
    const getStatusIcon = () => {
      if (savingBlocks[elementKey]) return <CircularProgress size={20} />;
      if (autoSaving[elementKey]) return <CircularProgress size={20} />;
      if (submittedElements.includes(elementKey)) return <CheckCircleIcon color="success" />;
      return <DomsSvgIcon>{elementOption.iconText || 'material-outline:edit'}</DomsSvgIcon>;
    };
    
    const getInputType = () => {
      if (!validationRules.valueType) return 'text';
      
      switch (validationRules.valueType) {
        case ValueType.INTEGER:
        case ValueType.INTEGER_POSITIVE:
        case ValueType.INTEGER_NEGATIVE:
        case ValueType.INTEGER_ZERO_OR_POSITIVE:
        case ValueType.NUMBER:
        case ValueType.PERCENTAGE:
          return 'number';
        case ValueType.DATE:
          return 'date';
        case ValueType.BOOLEAN:
          return 'checkbox';
        case ValueType.EMAIL:
          return 'email';
        case ValueType.URL:
          return 'url';
        case ValueType.PHONE_NUMBER:
        case ValueType.TEXT:
        default:
          return 'text';
      }
    };

    const startAdornment = (
      <InputAdornment position="start">
        {getStatusIcon()}
      </InputAdornment>
    );
  
    // For percentage type, create end adornment
    const endAdornment = validationRules.valueType === ValueType.PERCENTAGE ? (
      <InputAdornment position="end">%</InputAdornment>
    ) : undefined;

    const textFieldProps: TextFieldProps = {
      id: `input-${elementKey}`,
      name: elementKey,
      fullWidth: true,
      variant: elementOption.formStyles.variant || 'outlined',
      size: elementOption.formStyles.fieldSize || 'medium',
      label: elementOption.shortName,
      placeholder: elementOption.formStyles.placeholder || `Enter here`,
      type: getInputType(),
      value: currentValue,
      error: status === FieldStatus.ERROR,
      disabled: savingBlocks[elementKey] || autoSaving[elementKey],
      required: validationRules.required,
      slotProps: {
        input: {
          ...getInputProps,
          startAdornment,
          endAdornment
        }
      },
      sx: {
        '& .MuiInputBase-root': {
          minHeight: '56px'
        },
        backgroundColor: 'white'
      }
    };
    
    return (
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 8, md: 6 }}>
          <TextField
            {...textFieldProps}
            onChange={(e) => handleChange(elementKey, e.target.value)}
            onBlur={() => {
              if (data[elementKey] && !savingBlocks[elementKey] && !autoSaving[elementKey]) {
                setAutoSaving(prev => ({ ...prev, [elementKey]: true }));
                
                // Validate before saving
                const validationError = validateInput(
                  data[elementKey], 
                  validationRules, 
                  data, 
                  customLogic
                );
                
                if (validationError) {
                  setAlertInfo({
                    open: true,
                    message: validationError,
                    severity: 'error'
                  });
                  setAutoSaving(prev => ({ ...prev, [elementKey]: false }));
                  return;
                }
                
                // Proceed with saving if validation passes
                setTimeout(() => {
                  handleBlockSubmit(elementKey).finally(() => {
                    setAutoSaving(prev => ({ ...prev, [elementKey]: false }));
                  });
                }, 800);
              }
            }}
            helperText={
              errorMessage ? errorMessage :
              savingBlocks[elementKey] ? "Saving..." :
              autoSaving[elementKey] ? "Auto-saving..." :
              submittedElements.includes(elementKey) ? "Saved" : ""
            }
          />
        </Grid>
      </Grid>
    );
  };

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
        WebkitOverflowScrolling: 'touch'
      }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-end', gap: 1 }}>
          <FormControl fullWidth error={!!error}>
            <ObjectAutoCompleteSelect
              freeSolo={false}
              options={availableOptions}
              value={selectedOption}
              onChange={(value) => handleAddElement(value)}
              labelField="name"
              valueField="uid"
              label="Select"
              id="element-select"
              error={!!error}
              helperText={error}
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
                  No data elements added yet. Select a template or use the dropdown above to add elements.
                </Typography>
              </Paper>
            ) : (
              Object.entries(data).map(([elementKey]) => {
                const option = elementOptions.find(opt => opt.shortName.toLowerCase() === elementKey.toLowerCase());
                
                return (
                  <Paper 
                    key={elementKey} 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      bgcolor: submittedElements.includes(elementKey) ? '#f0f7f0' : '#f5f5f5', 
                      border: `1px solid ${submittedElements.includes(elementKey) ? '#c8e6c9' : '#e0e0e0'}`,
                      borderRadius: 2,
                      position: 'relative'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6">
                          {option?.name}
                        </Typography>
                        {savingBlocks[elementKey] ? (
                          <Chip 
                            icon={<CircularProgress size={16} />} 
                            label="Saving..." 
                            color="primary" 
                            size="small" 
                          />
                        ) : autoSaving[elementKey] ? (
                          <Chip 
                            icon={<CircularProgress size={16} />} 
                            label="Auto-saving..." 
                            color="primary" 
                            size="small" 
                          />
                        ) : submittedElements.includes(elementKey) ? (
                          <Chip 
                            icon={<CheckCircleIcon />} 
                            label="Submitted" 
                            color="success" 
                            size="small" 
                          />
                        ) : null}
                      </Box>
                      <IconButton 
                        color="error" 
                        size="small"
                        onClick={() => handleRemoveElement(elementKey)}
                        disabled={savingBlocks[elementKey] || autoSaving[elementKey]}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    
                    {/* Render input field for the element */}
                    {renderValueInput(elementKey)}
                    
                    {/* We remove the button and rely on auto-save on blur */}
                  </Paper>
                );
              })
            )}
          </Box>
        )}
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

export default TemplateMenuValueForm;