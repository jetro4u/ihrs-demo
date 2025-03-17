import { FC, useState, useEffect, ChangeEvent, useMemo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { 
  Box,
  Paper,
  Chip,
  Radio,
  RadioGroup,
  FormControl,
  FormControlLabel,
  FormLabel,
  FormHelperText,
} from '@mui/material';
import DomsSvgIcon from '../components/DomsSvgIcon';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import { openDB } from 'idb';
import { DataElement, DataValuePayload } from '../types';

// Status types for the field
export enum FieldStatus {
  IDLE = 'idle',
  SAVING = 'saving',
  SAVED = 'saved',
  ERROR = 'error',
  WARNING = 'warning'
}

// Extended props interface
interface DomsRadioProps {
  q: DataElement;
  dataSet: string;
  period: string;
  source: string;
  onSave?: (data: any) => Promise<{ success: boolean }>;
  existingValues?: any[];
  onValuesUpdate?: (values: any[]) => void;
  readOnly?: boolean;
  customValidation?: (value: any) => string | null;
  onValidationStateChange?: (isValid: boolean) => void;
  onChange?: (value: any) => void;
  onBlur?: () => void;
}

const DomsRadio: FC<DomsRadioProps> = ({
  q,
  dataSet,
  period,
  source,
  onSave,
  existingValues = [],
  onValuesUpdate,
  readOnly = false,
  customValidation,
  onValidationStateChange,
  onChange,
  onBlur
}) => {
  // States for managing form data and submission status
  const [value, setValue] = useState<any>('');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [status, setStatus] = useState<FieldStatus>(FieldStatus.IDLE);
  const [error, setError] = useState<string>('');
  const [autoSaving, setAutoSaving] = useState<boolean>(false);
  
  const dataElementId = q.uid;
  const validationRules = q.validationRules || {};
  const showSubmitIndicator = q.showSubmitIndicator || true;
  const disableAnimation = q.disableAnimation || false;
  const autoSaveDelay = q.autoSaveDelay || 400;
  const options = q.optionSet?.options || [];

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

  // Initialize value from existingValues
  useEffect(() => {
    if (existingValues && existingValues.length > 0) {
      const existingValue = existingValues.find(v => v.dataElement === dataElementId);
      if (existingValue) {
        setValue(existingValue.value);
        setSubmitted(true);
      }
    }
  }, [existingValues, dataElementId]);

  const validateInput = (input: string): string => {
    // If empty and required
    if ((input === '' || input === null || input === undefined) && validationRules.required) {
      return 'This field is required';
    }

    // Check if the value is one of the allowed options
    if (input && options.length > 0) {
      const validOption = options.some(option => option.name === input || option.shortName === input);
      if (!validOption) {
        return 'Invalid option selected';
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

  // Handle radio selection change
  const handleRadioChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    
    setValue(newValue);
    setStatus(FieldStatus.IDLE);
    
    // Run validation
    const validationError = validateInput(newValue);
    setError(validationError);
    
    if (onValidationStateChange) {
      onValidationStateChange(!validationError);
    }
    
    if (onChange) {
      onChange(newValue);
    }
  };

  const preparePayload = (): DataValuePayload => {
    const stringifiedValue = 
      typeof value === 'object' ? JSON.stringify(value) : 
      value !== null && value !== undefined ? String(value) : '';
    
    return {
      source: source || localStorage.getItem('selected-org') || '',
      period: period || localStorage.getItem('selected-period') || '',
      dataElement: dataElementId,
      categoryOptionCombo: q.categoryCombo?.id || 'HllvX50cXC0',
      attributeOptionCombo: '',
      value: stringifiedValue,
      comment: 'ok',
      followup: false,
      date: new Date(),
    };
  };

  // Handle saving data
  const handleSaveData = async () => {
    if (error) {
      setStatus(FieldStatus.ERROR);
      return;
    }
    
    if ((value === '' || value === null || value === undefined) && !validationRules.required) {
      setStatus(FieldStatus.IDLE);
      return;
    }
    
    try {
      setStatus(FieldStatus.SAVING);
      
      const effectiveSource = source || localStorage.getItem('selected-org') || '';
      const effectivePeriod = period || localStorage.getItem('selected-period') || '';
      
      if (!effectiveSource || !effectivePeriod) {
        throw new Error('Missing required source ID or period');
      }
      
      // Prepare payload
      const valuePayload = preparePayload();
      
      // Update local values
      const updatedValues = [
        ...(existingValues || []).filter(v => v.dataElement !== dataElementId),
        valuePayload
      ];
      
      // Notify parent component of values update
      if (onValuesUpdate) {
        onValuesUpdate(updatedValues);
      }
      
      // Store in localStorage as backup
      try {
        localStorage.setItem(`form-data-${dataElementId}`, JSON.stringify(valuePayload));
      } catch (e) {
        console.warn('Failed to save to localStorage:', e);
      }
      
      // Store in IndexedDB
      try {
        const db = await openDB('dataorb-db', 1);
        const tx = db.transaction('dataValues', 'readwrite');
        await tx.store.put(valuePayload);
        await tx.done;
      } catch (dbError) {
        console.error('IndexedDB save error:', dbError);
      }
      
      // Try to save to server
      if (onSave) {
        try {
          const response = await onSave(valuePayload);
          if (response.success) {
            setSubmitted(true);
            setStatus(FieldStatus.SAVED);
          }
        } catch (serverError) {
          console.error('Error saving to server, keeping in IndexedDB for later sync:', serverError);
          setStatus(FieldStatus.WARNING);
          setError('Saved locally, will sync later');
        }
      } else {
        // Mark as saved even without server save
        setSubmitted(true);
        setStatus(FieldStatus.SAVED);
      }
    } catch (error) {
      console.error('Error saving data:', error);
      setStatus(FieldStatus.ERROR);
      setError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Handle blur event for auto-saving
  const handleElementBlur = () => {
    // Only autosave if there's a value and no errors
    if (value && !error && !autoSaving) {
      setAutoSaving(true);
      
      // Add delay before auto-saving
      setTimeout(() => {
        handleSaveData().finally(() => {
          setAutoSaving(false);
        });
      }, autoSaveDelay);
    }
    
    // Call parent onBlur if provided
    if (onBlur) {
      onBlur();
    }
  };

  // Get helper text
  const getHelperText = (): string => {
    if (q.formStyles.helpText) return q.formStyles.helpText;
    if (error) return error;
    if (autoSaving) return "Auto-saving...";
    if (status === FieldStatus.SAVING) return "Saving...";
    if (status === FieldStatus.SAVED) return "Saved";
    if (status === FieldStatus.WARNING) return "Saved locally, will sync later";
    return "";
  };

  // Get status icon
  const getStatusIcon = (): ReactNode => {
    switch (status) {
      case FieldStatus.SAVED:
        return <CheckCircleIcon color="success" />;
      case FieldStatus.ERROR:
        return <ErrorIcon color="error" />;
      case FieldStatus.WARNING:
        return <WarningIcon color="warning" />;
      case FieldStatus.IDLE:
        return q.iconText ? 
          <DomsSvgIcon>{q.iconText}</DomsSvgIcon> : 
          <DomsSvgIcon>material-outline:radio_button_checked</DomsSvgIcon>;
      default:
        return null;
    }
  };

  const titleDescription = (
    <Box sx={{ mb: 1, fontWeight: 'bold', color: 'text.secondary' }}>
      {q.name}
    </Box>
  );

  const sortedOptions = useMemo(() => {
    if (!options || options.length === 0) {
      return [];
    }
    
    return [...options].sort((a, b) => {
      // Handle cases where sortOrder might be undefined
      const sortOrderA = typeof a.sortOrder === 'number' ? a.sortOrder : Infinity;
      const sortOrderB = typeof b.sortOrder === 'number' ? b.sortOrder : Infinity;
      
      return sortOrderA - sortOrderB;
    });
  }, [options]);

  // Render component
  const content = (
    <Box 
      sx={{ 
        p: showSubmitIndicator ? 2 : 0, 
        bgcolor: submitted && showSubmitIndicator ? '#f0f7f0' : 'transparent',
        border: submitted && showSubmitIndicator ? '1px solid #c8e6c9' : 'none',
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: showSubmitIndicator ? 2 : 0 }}>
        {showSubmitIndicator && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {submitted && (
              <Chip 
                icon={<CheckCircleIcon />} 
                label="Submitted" 
                color="success" 
                size="small" 
              />
            )}
          </Box>
        )}
      </Box>
      {titleDescription}
      
      <FormControl 
        component="fieldset" 
        error={status === FieldStatus.ERROR}
        disabled={readOnly || status === FieldStatus.SAVING || autoSaving}
        required={validationRules.required}
        fullWidth
      >
        <FormLabel id={`radio-group-label-${dataElementId}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getStatusIcon()}
          {q.shortName}
        </FormLabel>
        
        <RadioGroup
          aria-labelledby={`radio-group-label-${dataElementId}`}
          name={dataElementId}
          value={value}
          onChange={handleRadioChange}
          onBlur={handleElementBlur}
          row={q.formStyles.row}
        >
          {sortedOptions.map((option) => (
            <FormControlLabel
              key={option.name || option.shortName}
              value={option.name || option.shortName}
              control={
                <Radio 
                  size={q.formStyles.fieldSize} 
                  color={q.formStyles.muiColor}
                  sx={{ '&.Mui-checked': { color: status === FieldStatus.ERROR ? 'error.main' : undefined } }}
                />
              }
              label={option.name}
              sx={{ mb: 1 }}
            />
          ))}
        </RadioGroup>
        
        <FormHelperText>{getHelperText()}</FormHelperText>
      </FormControl>
    </Box>
  );

  if (disableAnimation) {
    return (
      <Paper
        sx={{ 
          p: 4, 
          borderRadius: 2, 
          boxShadow: 2, 
          bgcolor: 'white', 
          mb: 4,
          ...(q.formStyles.sx?.paper || {})
        }}
      >
        {content}
      </Paper>
    );
  }

  // Return with animations
  return (
    <Paper
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      sx={{ 
        p: 4, 
        borderRadius: 2, 
        boxShadow: 2, 
        bgcolor: 'white', 
        mb: 4,
        ...(q.formStyles.sx?.paper || {})
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {content}
      </motion.div>
    </Paper>
  );
};

export default DomsRadio;