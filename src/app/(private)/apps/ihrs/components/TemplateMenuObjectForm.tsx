import React, { useState, useEffect } from 'react';
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
  Chip
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SaveIcon from '@mui/icons-material/Save';
import DomsSvgIcon from '../components/DomsSvgIcon';
import ObjectAutoCompleteSelect from './ObjectAutoCompleteSelect';
import { DataElement } from '../types';
import { openDB } from 'idb';

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

export interface DataElementGroup {
  name: string;
  uid: string;
  code: string;
  shortName: string;
  orderid: number;
}

export interface MetadataProps {
  dataElements?: DataElement[];
  dataElementGroups?: DataElementGroup[];
  organisations?: { id: string; name: string }[];
  dataset?: { uid: string; name: string; periodtypeid: number; shortName: string; description: string }[];
}

export const QuestionTypes: Record<string, number> = {
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
};

interface TemplateMenuObjectFormProps {
  q: DataElement[];
  dataSet: string;
  period: string;
  source: string;
  onSave?: (data: any) => Promise<{ success: boolean }>;
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
  onSave,
  templates: externalTemplates = [],
  onNext,
  onBack,
  existingRecords,
  onRecordsUpdate
}) => {
  // Main form data state
  const [data, setData] = useState<FormData>({});
  // Track submitted records
  const [submittedRecords, setSubmittedRecords] = useState<any[]>(existingRecords || []);
  // Track which elements have been submitted
  const [submittedElements, setSubmittedElements] = useState<string[]>([]);
  
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
  
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<DataElement | null>(null);
  const [error, setError] = useState({ element: '' });
  const [loading, setLoading] = useState(false);
  const [savingBlocks, setSavingBlocks] = useState<Record<string, boolean>>({});
  
  // Prepare data elements as options, sorted by dataElementOrder
  const elementOptions = q.sort((a, b) => a.dataElementOrder - b.dataElementOrder);

  const toTitleCase = (str) => {
    const spacedStr = str.replace(/([A-Z])/g, ' $1').toLowerCase();
    return spacedStr.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  // Initialize IndexedDB
  useEffect(() => {
    const initIndexedDB = async () => {
      await openDB('ihrs-db', 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('ihrsDataRecord')) {
            db.createObjectStore('ihrsDataRecord', { keyPath: 'uuid' });
          }
        },
      });
    };
    
    initIndexedDB();
  }, []);
  
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

  // Handle metric value change
  const handleChange = (elementKey: string, metric: string, value: string) => {
    // Determine if this should be a number or string based on the value
    const parsedValue = !isNaN(Number(value)) && value !== '' ? Number(value) : value;
    
    setData((prevData) => ({
      ...prevData,
      [elementKey]: {
        ...prevData[elementKey],
        [metric]: parsedValue
      }
    }));
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
    setData((prevData) => ({
      ...prevData,
      [normalizedKey]: value.metrics ? { ...value.metrics } : {}
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
      setSubmittedRecords([]);
      if (onRecordsUpdate) {
        onRecordsUpdate([]);
      }
      
      // Clear localStorage
      localStorage.removeItem('ihrs-submitted-records');
      
      // Clear locally stored form data
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('form-data-')) {
          localStorage.removeItem(key);
        }
      });
      
      alert('Template saved successfully! Form data has been reset.');
    }
  };

  const isFormValid = (elementKey) => {
    const currentData = data[elementKey];
    if (!currentData) return false;
    
    // Check if all metrics have values
    return Object.values(currentData).every(value => 
      (value !== null && value !== undefined && value !== '')
    );
  };

  // Handle submission for a single element block
  const handleBlockSubmit = async (elementKey) => {
    if (!isFormValid(elementKey)) {
      alert(`Please fill all fields for ${getElementLabel(elementKey)}`);
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
      
      // Use values from props, falling back to localStorage if needed
      const effectiveSourceId = source || localStorage.getItem('ihrs-selected-org') || '';
      const effectivePeriod = period || localStorage.getItem('ihrs-selected-period') || '';
      const effectiveDataSetId = dataSet || localStorage.getItem('ihrs-selected-dataset') || '';
      
      if (!effectiveSourceId || !effectivePeriod) {
        throw new Error('Missing required source ID or period');
      }
      
      // Prepare the data for saving
      const recordData = {
        uuid: crypto.randomUUID(),
        sourceId: effectiveSourceId,
        periodId: effectivePeriod,
        dataElementId: elementOption.uid,
        dataSetId: effectiveDataSetId,
        data: JSON.stringify(data[elementKey]),
        date: new Date().toISOString(),
        savedBy: localStorage.getItem('userId') || 'unknown',
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
  
      // First filter out any existing records for this element
      const filteredRecords = submittedRecords.filter(
        r => r.dataElementId !== elementOption.uid
      );
      
      // Then add the new record
      const updatedRecords = [...filteredRecords, recordData];
      
      // Update local state
      setSubmittedRecords(updatedRecords);
      
      // Notify parent component of records update
      if (onRecordsUpdate) {
        onRecordsUpdate(updatedRecords);
      }
      
      // Store in IndexedDB first
      const db = await openDB('ihrs-db', 1);
      await db.put('ihrsDataRecord', recordData);
      
      // Then try to save to server
      if (onSave) {
        try {
          await onSave(recordData);
          
          // Mark as successfully submitted
          if (!submittedElements.includes(elementKey)) {
            setSubmittedElements(prev => [...prev, elementKey]);
          }
          
          // Remove from IDB for successful submissions
          await db.delete('ihrsDataRecord', recordData.uuid);
          
          alert(`${getElementLabel(elementKey)} data submitted successfully!`);
        } catch (error) {
          console.error('Error saving to server, keeping in IndexedDB for later sync:', error);
          alert(`${getElementLabel(elementKey)} data could not be sent to server and has been saved locally. It will be synchronized when connection is restored.`);
        }
      } else {
        alert(`${getElementLabel(elementKey)} data saved locally.`);
      }
    } catch (error) {
      console.error('Error saving data:', error);
      alert(`Error saving ${elementKey} data: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    
    // Get the current data for this element (important for persistence)
    const currentData = data[elementKey] || {};
    
    // Use element's metrics only
    if (elementOption.metrics && Object.keys(elementOption.metrics).length > 0) {
      return (
        <Grid container spacing={2}>
          {Object.entries(elementOption.metrics).map(([metricKey, defaultValue]) => {
            // Use current value if it exists, otherwise use default
            const currentValue = currentData[metricKey] !== undefined 
              ? currentData[metricKey] 
              : defaultValue;
              
            return (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={metricKey}>
                <TextField
                  label={toTitleCase(metricKey)}
                  type={metricKey in elementOption.metrics && 
                    (elementOption.metrics[metricKey] === null || 
                      elementOption.metrics[metricKey] === 0 || 
                      typeof elementOption.metrics[metricKey] === 'number') ? 'number' : 'text'}
                  value={currentValue}
                  onChange={(e) => handleChange(elementKey, metricKey, e.target.value)}
                  variant="outlined"
                  fullWidth
                  size="medium"
                  disabled={savingBlocks[elementKey]}
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
    
    // Fallback if no metrics
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
    <Card sx={{ width: '100%', maxWidth: '1024px' }}>
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
      
      <CardContent sx={{ p: 3 }}>
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
                        {savingBlocks[elementKey] ? 'Saving...' : isSubmitted ? 'Update' : `Save`}
                      </Button>
                    </Box>
                  </Paper>
                );
              })
            )}
          </Box>
        )}
      </CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, mb: 3, px: 3, width: '100%' }}>
        {onBack && (
          <Button
            variant="outlined"
            onClick={onBack}
            disabled={Object.values(savingBlocks).some(Boolean)}
          >
            Back
          </Button>
        )}
        {onNext && (
          <Button
            variant="contained"
            color="primary"
            onClick={onNext}
            disabled={submittedElements.length === 0 || Object.values(savingBlocks).some(Boolean)}
          >
            Next
          </Button>
        )}
      </Box>
    </Card>
  );
};

export default TemplateMenuObjectForm;