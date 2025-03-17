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
import { openDB } from 'idb';
import { DataElement } from '../types';

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

export interface MetadataProps {
  dataElements?: DataElement[];
  dataElementGroups?: DataElementGroup[];
  organisations?: { id: string; name: string }[];
  dataset?: { uid: string; name: string; periodtypeid: number; shortName: string; description: string }[];
}

interface TemplateMenuValueFormProps {
  q: DataElement[];
  dataSet: string;
  period: string;
  source: string;
  onSave?: (data: any) => Promise<{ success: boolean }>;
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
  onSave,
  templates: externalTemplates = [],
  onNext,
  onBack,
  existingValues,
  onValuesUpdate
}) => {
  // Main data state
  const [data, setData] = useState<FormData>({});
  
  // Keep track of submitted values
  const [submittedValues, setSubmittedValues] = useState<any[]>(existingValues || []);
  
  // Keep track of successfully submitted elements
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
  const [autoSaving, setAutoSaving] = useState<Record<string, boolean>>({});
  
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
      try {
        await openDB('ihrs-db', 1, {
          upgrade(db) {
            if (!db.objectStoreNames.contains('ihrsDataValues')) {
              db.createObjectStore('ihrsDataValues', { keyPath: 'uuid' });
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
    return option?.name || shortname;
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
      setError({ element: 'This element already exists!' });
      return;
    }
    
    // Initialize with a value
    setData((prevData) => ({
      ...prevData,
      [normalizedKey]: value.value || ''
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
      
      // Clear localStorage
      localStorage.removeItem('ihrs-submitted-values');
      
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
      alert(`Please fill the field for ${getElementLabel(elementKey)}`);
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
      
      // Use values from props, falling back to localStorage if needed
      const effectiveSourceId = source || localStorage.getItem('ihrs-selected-org') || '';
      const effectivePeriod = period || localStorage.getItem('ihrs-selected-period') || '';
      const effectiveDataSetId = dataSet || localStorage.getItem('ihrs-selected-dataset') || '';
      
      if (!effectiveSourceId || !effectivePeriod) {
        throw new Error('Missing required source ID or period');
      }
      
      // Get the current value
      const currentValue = data[elementKey];
      
      // Prepare the data for saving
      const valueRecord = {
        uuid: crypto.randomUUID(),
        sourceId: effectiveSourceId,
        periodId: effectivePeriod,
        dataElementId: elementOption.uid,
        dataSetId: effectiveDataSetId,
        value: currentValue,
        date: new Date().toISOString(),
        savedBy: localStorage.getItem('userId') || 'unknown',
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
  
      // Update the in-memory values by removing any existing entry for this element
      const updatedValues = [
        ...submittedValues.filter(r => r.dataElementId !== elementOption.uid),
        valueRecord
      ];
      
      // Update local state immediately to ensure persistence
      setSubmittedValues(updatedValues);
      
      // Notify parent component of values update
      if (onValuesUpdate) {
        onValuesUpdate(updatedValues);
      }
      
      // Store in localStorage as backup
      try {
        localStorage.setItem('form-data-' + elementOption.uid, JSON.stringify(valueRecord));
      } catch (e) {
        console.warn('Failed to save to localStorage:', e);
      }
      
      // Store in IndexedDB with proper error handling
      try {
        const db = await openDB('ihrs-db', 1);
        const tx = db.transaction('ihrsDataValues', 'readwrite');
        await tx.store.put(valueRecord);
        await tx.done;
      } catch (dbError) {
        console.error('IndexedDB save error:', dbError);
        // Continue execution even if IndexedDB fails
      }
      
      // Then try to save to server
      if (onSave) {
        try {
          await onSave(valueRecord);
          
          // Mark as successfully submitted
          if (!submittedElements.includes(elementKey)) {
            setSubmittedElements(prev => [...prev, elementKey]);
          }
          
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
  // Create input field for an element 
const renderValueInput = (elementKey: string) => {
  const elementOption = elementOptions.find(
    opt => opt.shortName.toLowerCase() === elementKey.toLowerCase()
  );
  
  if (!elementOption) {
    return null;
  }
  
  // Get current value - very important for persistence
  const currentValue = data[elementKey] || '';
  
  // Determine status icon based on the current state
  const getStatusIcon = () => {
    if (savingBlocks[elementKey]) return <CircularProgress size={20} />;
    if (autoSaving[elementKey]) return <CircularProgress size={20} />;
    if (submittedElements.includes(elementKey)) return <CheckCircleIcon color="success" />;
    return <DomsSvgIcon>{elementOption.iconText || 'material-outline:edit'}</DomsSvgIcon>;
  };
  
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 8, md: 6 }}>
        <TextField
          label={elementOption.name}
          type={elementOption.fieldType || 'text'}
          value={currentValue}
          onChange={(e) => handleChange(elementKey, e.target.value)}
          onBlur={() => {
            if (data[elementKey] && !savingBlocks[elementKey] && !autoSaving[elementKey]) {
              setAutoSaving(prev => ({ ...prev, [elementKey]: true }));
              
              // Add a small delay before auto-saving
              setTimeout(() => {
                handleBlockSubmit(elementKey).finally(() => {
                  setAutoSaving(prev => ({ ...prev, [elementKey]: false }));
                });
              }, 800);
            }
          }}
          variant="outlined"
          fullWidth
          size="medium"
          disabled={savingBlocks[elementKey] || autoSaving[elementKey]}
          helperText={
            savingBlocks[elementKey] ? "Saving..." :
            autoSaving[elementKey] ? "Auto-saving..." :
            submittedElements.includes(elementKey) ? "Saved" : ""
          }
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  {getStatusIcon()}
                </InputAdornment>
              )
            }
          }}
          sx={{
            '& .MuiInputBase-root': {
              minHeight: '56px'
            },
            backgroundColor: 'white'
          }}
        />
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
                  No data elements added yet. Select a template or use the dropdown above to add elements.
                </Typography>
              </Paper>
            ) : (
              Object.entries(data).map(([elementKey]) => {
                const isSubmitted = submittedElements.includes(elementKey);
                const isBeingSaved = savingBlocks[elementKey] || autoSaving[elementKey];
                
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
                          {getElementLabel(elementKey)}
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

export default TemplateMenuValueForm;