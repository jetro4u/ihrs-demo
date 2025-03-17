import { FC, useState, useEffect, ChangeEvent, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  FormControl, 
  TextField,
  FormHelperText,
  RadioGroup,
  InputAdornment,
  FormControlLabel,
  Radio,
  Checkbox,
  Box,
  Paper,
  Typography,
  Divider,
  CircularProgress,
  Chip,
  IconButton
} from '@mui/material';
import DomsSvgIcon from '../components/DomsSvgIcon';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { openDB } from 'idb';
import { DataElement, QuestionTypes } from '../types';

// Define the structure of categoryOptionCombo based on your example
interface CategoryOptionCombo {
  id: string;
  name: string;
  categoryCombo?: {
    id: string;
  };
  cocOrder?: number;
}

interface QuestionBlockProps {
  q: DataElement;
  dataSet: string;
  period: string;
  source: string;
  onSave?: (data: any) => Promise<{ success: boolean }>;
  existingValues?: any[];
  onValuesUpdate?: (values: any[]) => void;
}

const QuestionBlock: FC<QuestionBlockProps> = ({
  q,
  dataSet,
  period,
  source,
  onSave,
  existingValues = [],
  onValuesUpdate
}) => {
  // States for managing form data and submission status
  const [results, setResults] = useState<Record<string, any>>({});
  const [submittedElements, setSubmittedElements] = useState<string[]>([]);
  const [submittedValues, setSubmittedValues] = useState<any[]>(existingValues || []);
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  const [autoSaving, setAutoSaving] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const dataElementId = q.uid;

  // Initialize IndexedDB
  useEffect(() => {
    const initIndexedDB = async () => {
      try {
        await openDB('ihrs-db', 1, {
          upgrade(db) {
            // Check if store already exists
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

  // Initialize results from existingValues
  useEffect(() => {
    if (existingValues && existingValues.length > 0) {
      const newResults = { ...results };
      const elementIds: string[] = [];
      
      existingValues.forEach(value => {
        if (value.dataElementId === dataElementId) {
          newResults[dataElementId] = value.value;
          elementIds.push(dataElementId);
        }
      });
      
      setResults(newResults);
      setSubmittedElements(elementIds);
    }
  }, [existingValues, dataElementId]);

  // Handle text input change
  const handleTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    console.log("handleTextChange event", event)
    const { value } = event.target;
    setResults(prev => ({
      ...prev,
      [dataElementId]: value
    }));
  };

  // Handle radio option change
  const handleOptionChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setResults(prev => ({
      ...prev,
      [dataElementId]: value
    }));
  };

  // Handle checkbox change
  const handleCheckboxChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    setResults(prev => ({
      ...prev,
      [dataElementId]: {
        ...(prev[dataElementId] || {}),
        [name]: checked
      }
    }));
  };

  // Handle saving data to server/IndexedDB
  const handleSaveData = async () => {
    if (!results[dataElementId]) {
      setErrors(prev => ({
        ...prev,
        [dataElementId]: 'Please enter a value'
      }));
      return;
    }

    try {
      setSavingStates(prev => ({ ...prev, [dataElementId]: true }));
      setErrors(prev => ({ ...prev, [dataElementId]: '' }));
      
      // Use values from props, falling back to localStorage if needed
      const effectiveSource = source || localStorage.getItem('ihrs-selected-org') || '';
      const effectivePeriod = period || localStorage.getItem('ihrs-selected-period') || '';
      const effectiveDataSet = dataSet || localStorage.getItem('ihrs-selected-dataset') || '';
      
      if (!effectiveSource || !effectivePeriod) {
        throw new Error('Missing required source ID or period');
      }

      // Convert value based on question type
      let formattedValue: string;
      if (q.dataElementQuestionType === QuestionTypes.MULTIPLE_SELECT && typeof results[dataElementId] === 'object') {
        // For checkbox values, convert to comma-separated string of selected options
        formattedValue = Object.entries(results[dataElementId])
          .filter(([_, selected]) => selected)
          .map(([option, _]) => option)
          .join(',');
      } else {
        // For text, number, and radio values
        formattedValue = String(results[dataElementId]);
      }
      
      // Prepare the data for saving
      const valuePayload = {
        uuid: crypto.randomUUID(),
        source: effectiveSource,
        period: effectivePeriod,
        dataElement: dataElementId,
        categoryOptionCombo: 'HllvX50cXC0',
        attributeOptionCombo: '',
        value: formattedValue,
        comment: 'ok',
        followup: false,
        date: new Date().toISOString(),
        savedBy: localStorage.getItem('userId') || 'unknown',
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
  
      // Update the in-memory values by removing any existing entry for this element
      const updatedValues = [
        ...submittedValues.filter(r => r.dataElementId !== dataElementId),
        valuePayload
      ];
      
      // Update local state immediately to ensure persistence
      setSubmittedValues(updatedValues);
      
      // Notify parent component of values update
      if (onValuesUpdate) {
        onValuesUpdate(updatedValues);
      }
      
      // Store in localStorage as backup
      try {
        localStorage.setItem('form-data-' + dataElementId, JSON.stringify(valuePayload));
      } catch (e) {
        console.warn('Failed to save to localStorage:', e);
      }
      
      // Store in IndexedDB with proper error handling
      try {
        const db = await openDB('ihrs-db', 1);
        const tx = db.transaction('ihrsDataValues', 'readwrite');
        await tx.store.put(valuePayload);
        await tx.done;
      } catch (dbError) {
        console.error('IndexedDB save error:', dbError);
        // Continue execution even if IndexedDB fails
      }
      
      // Then try to save to server
      if (onSave) {
        try {
          const response = await onSave(valuePayload);
          if (response.success) {
            // Mark as successfully submitted
            setSubmittedElements(prev => 
              prev.includes(dataElementId) ? prev : [...prev, dataElementId]
            );
          }
        } catch (error) {
          console.error('Error saving to server, keeping in IndexedDB for later sync:', error);
        }
      }
    } catch (error) {
      console.error('Error saving data:', error);
      setErrors(prev => ({
        ...prev,
        [dataElementId]: error instanceof Error ? error.message : 'Unknown error'
      }));
    } finally {
      setSavingStates(prev => ({ ...prev, [dataElementId]: false }));
    }
  };

  // Handle onBlur event for auto-saving
  const handleElementBlur = () => {
    if (results[dataElementId] && !savingStates[dataElementId] && !autoSaving[dataElementId]) {
      setAutoSaving(prev => ({ ...prev, [dataElementId]: true }));
      
      // Add a small delay before auto-saving to prevent immediate save during rapid interactions
      setTimeout(() => {
        handleSaveData().finally(() => {
          setAutoSaving(prev => ({ ...prev, [dataElementId]: false }));
        });
      }, 800);
    }
  };

  // Render input field based on element type
  const renderInputField = () => {
    const isSubmitted = submittedElements.includes(dataElementId);
    const isSaving = savingStates[dataElementId] || autoSaving[dataElementId];
    const error = errors[dataElementId];

    // Text and number inputs (INTEGER_INPUT, TEXT_INPUT)
    if (
      q.dataElementQuestionType === QuestionTypes.INTEGER_INPUT || 
      q.dataElementQuestionType === QuestionTypes.TEXT_INPUT
    ) {
      return (
        <Box sx={{ mb: 3 }}>
          <TextField
            id={`input-${dataElementId}`}
            name={dataElementId}
            fullWidth
            variant="outlined"
            size="medium"
            label={q.shortName}
            placeholder={`Enter ${q.shortName}`}
            type={q.fieldType}
            value={results[dataElementId] || ''}
            onChange={handleTextChange}
            onBlur={handleElementBlur}
            error={!!error}
            helperText={error || (autoSaving[dataElementId] ? "Auto-saving..." : "")}
            disabled={q.disabled || isSaving}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <DomsSvgIcon>{q.iconText || 'material-outline:edit'}</DomsSvgIcon>
                  </InputAdornment>
                )
              }
            }}
            sx={{ bgcolor: 'white' }}
          />
        </Box>
      );
    }

    // Radio buttons (INTEGER_SELECT, TEXT_SELECT, INTEGER_BOOLEAN, TEXT_BOOLEAN)
    if (
      q.dataElementQuestionType === QuestionTypes.INTEGER_SELECT || 
      q.dataElementQuestionType === QuestionTypes.TEXT_SELECT ||
      q.dataElementQuestionType === QuestionTypes.INTEGER_BOOLEAN ||
      q.dataElementQuestionType === QuestionTypes.TEXT_BOOLEAN
    ) {
      const options = q.optionSet?.options || [];

      return (
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth error={!!error}>
            <RadioGroup
              name={dataElementId}
              value={results[dataElementId] || ''}
              onChange={handleOptionChange}
              onBlur={handleElementBlur}
            >
              {options.map((option, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <FormControlLabel
                    value={option.name || option.uid}
                    control={<Radio size="small" disabled={q.disabled || isSaving} />}
                    label={option.name || option.name}
                    sx={{ color: 'text.secondary' }}
                  />
                </motion.div>
              ))}
            </RadioGroup>
            {(error || autoSaving[dataElementId]) && (
              <FormHelperText sx={{ mt: 1 }}>
                {error || (autoSaving[dataElementId] ? "Auto-saving..." : "")}
              </FormHelperText>
            )}
          </FormControl>
        </Box>
      );
    }

    // Checkboxes (MULTIPLE_SELECT)
    if (q.dataElementQuestionType === QuestionTypes.MULTIPLE_SELECT) {
      const options = q.optionSet?.options || [];

      return (
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth error={!!error}>
            {options.map((option, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={
                        results[dataElementId] && 
                        typeof results[dataElementId] === 'object' ? 
                        (results[dataElementId][option.name] || false) : 
                        false
                      }
                      size="small"
                      name={option.name}
                      onChange={handleCheckboxChange}
                      onBlur={handleElementBlur}
                      disabled={q.disabled || isSaving}
                    />
                  }
                  label={option.name}
                  sx={{ color: 'text.secondary' }}
                />
              </motion.div>
            ))}
            {(error || autoSaving[dataElementId]) && (
              <FormHelperText sx={{ mt: 1 }}>
                {error || (autoSaving[dataElementId] ? "Auto-saving..." : "")}
              </FormHelperText>
            )}
          </FormControl>
        </Box>
      );
    }

    return null;
  };

  const isSubmitted = submittedElements.includes(dataElementId);
  const isSaving = savingStates[dataElementId];

  return (
    <Paper
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      sx={{ p: 4, borderRadius: 2, boxShadow: 2, bgcolor: 'white', mb: 4 }}
    >
      <Box 
        sx={{ 
          p: 2, 
          bgcolor: isSubmitted ? '#f0f7f0' : 'transparent',
          border: isSubmitted ? '1px solid #c8e6c9' : 'none',
          borderRadius: 2,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                {q.name}
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
          </Box>
          
          {renderInputField()}
          
          {/*<Box sx={{ mt: 2, textAlign: 'left' }}>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <FormControl 
                variant="outlined"
                onClick={handleSaveData}
                sx={{ 
                  mt: 1,
                  backgroundColor: 'primary.main', 
                  color: 'white',
                  borderRadius: 1,
                  p: 1,
                  px: 2,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  transition: 'background-color 0.3s'
                }}
              >
                {isSaving ? (
                  <CircularProgress size={16} sx={{ color: 'white' }} />
                ) : (
                  <CheckCircleIcon fontSize="small" sx={{ color: 'white' }} />
                )}
                <Typography variant="button" sx={{ color: 'white' }}>
                  {isSaving ? 'Saving...' : `Save ${q.shortName}`}
                </Typography>
              </FormControl>
            </motion.div>
          </Box>*/}
        </motion.div>
      </Box>
    </Paper>
  );
};

// Helper function to transform results to DataValuePayload format for external use
export const transformToDataValuePayload = (
  results: Record<string, any>,
  source: string,
  period: string,
  dataSet: string,
  dataElement: DataElement
): any[] => {
  const payloads: any[] = [];
  const dataElementId = dataElement.uid;
  
  // Get categoryOptionCombo ID
  const getCategoryOptionComboId = (): string => {
    if (!dataElement.categoryOptionCombos) return '';

    // If multiple categoryOptionCombos exist, return the first one
    if (dataElement.categoryOptionCombos.length > 1) {
        return dataElement.categoryOptionCombos[0]?.id || '';
    }

    // If there is only one categoryOptionCombo (default case), return its id
    return dataElement.categoryOptionCombos[0].id || '';
  };
  
  if (results[dataElementId] !== null && results[dataElementId] !== undefined) {
    let formattedValue: string;
    
    // Handle different types of values
    if (typeof results[dataElementId] === 'object') {
      // For checkbox values, convert to comma-separated string of selected options
      const selectedOptions = Object.entries(results[dataElementId])
        .filter(([_, selected]) => selected)
        .map(([option, _]) => option);
      formattedValue = selectedOptions.join(',');
    } else {
      // For text, number, and radio values
      formattedValue = String(results[dataElementId]);
    }
    
    payloads.push({
      uuid: crypto.randomUUID(),
      source: source,
      periodId: period,
      dataElementId: dataElementId,
      categoryOptionCombo: getCategoryOptionComboId(),
      dataSet: dataSet,
      value: formattedValue,
      date: new Date().toISOString(),
      savedBy: localStorage.getItem('userId') || 'unknown',
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    });
  }
  
  return payloads;
};

export default QuestionBlock;