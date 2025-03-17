import { FC, useState, useEffect, ChangeEvent, useMemo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { 
  TextField,
  InputAdornment,
  Box,
  Paper,
  Chip,
  TextFieldProps,
} from '@mui/material';
import DomsSvgIcon from '../components/DomsSvgIcon';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import { openDB } from 'idb';
import { DataElement, ValueType, DataValuePayload } from '../types';

// Status types for the field
export enum FieldStatus {
  IDLE = 'idle',
  SAVING = 'saving',
  SAVED = 'saved',
  ERROR = 'error',
  WARNING = 'warning'
}

// Extended props interface
interface DomsTextFieldProps {
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
  inputRef?: React.Ref<any>;
  onChange?: (value: any) => void;
  onBlur?: () => void;
}

const DomsTextField: FC<DomsTextFieldProps> = ({
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
  inputRef,
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
  const valueType = q.valueType;
  const validationRules = q.validationRules || {};
  const showSubmitIndicator = q.showSubmitIndicator || true;
  const disableAnimation = q.disableAnimation || false;
  const autoSaveDelay = q.autoSaveDelay || 400;

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

  // Get input type based on valueType
  const getInputType = useMemo(() => {
    switch (valueType) {
      case ValueType.NUMBER:
      case ValueType.INTEGER:
      case ValueType.INTEGER_POSITIVE:
      case ValueType.INTEGER_NEGATIVE:
      case ValueType.INTEGER_ZERO_OR_POSITIVE:
      case ValueType.PERCENTAGE:
        return 'number';
      case ValueType.EMAIL:
        return 'email';
      case ValueType.URL:
        return 'url';
      case ValueType.DATE:
        return 'date';
      case ValueType.DATETIME:
        return 'datetime-local';
      case ValueType.TIME:
        return 'time';
      case ValueType.PHONE_NUMBER:
        return 'tel';
      case ValueType.BOOLEAN:
        return 'checkbox';
      default:
        return 'text';
    }
  }, [valueType]);

  // Get input props based on valueType
  const getInputProps = useMemo(() => {
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
}, [valueType]);

const validateInput = (input: string | number): string => {
  // If empty and required
  if ((input === '' || input === null || input === undefined) && validationRules.required) {
    return 'This field is required';
  }

  // Type-specific validation
  switch (valueType) {
    case ValueType.EMAIL:
      if (input && !/\S+@\S+\.\S+/.test(String(input))) {
        return 'Please enter a valid email address';
      }
      break;
    case ValueType.URL:
      try {
        if (input) {
          new URL(String(input));
        }
      } catch (e) {
        return 'Please enter a valid URL';
      }
      break;
    case ValueType.PHONE_NUMBER:
      if (input && !/^\+?[0-9\s\-()]{8,20}$/.test(String(input))) {
        return 'Please enter a valid phone number';
      }
      break;
    case ValueType.INTEGER:
    case ValueType.INTEGER_POSITIVE:
    case ValueType.INTEGER_NEGATIVE:
    case ValueType.INTEGER_ZERO_OR_POSITIVE:
    case ValueType.NUMBER:
    case ValueType.PERCENTAGE:
      // Skip validation if empty and not required
      if (input === '' && !validationRules.required) {
        return '';
      }
      
      const num = typeof input === 'number' ? input : Number(input);
      
      if (isNaN(num)) {
        return 'Please enter a valid number';
      }
      
      if (validationRules.min !== undefined && validationRules.min !== null && num < validationRules.min) {
        return `Value must be at least ${validationRules.min}`;
      }
      
      if (validationRules.max !== undefined && validationRules.max !== null && num > validationRules.max) {
        return `Value must be at most ${validationRules.max}`;
      }
      
      // Special cases for different numeric types
      if (valueType === ValueType.INTEGER && !Number.isInteger(num)) {
        return 'Value must be an integer';
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
      
      if (valueType === ValueType.PERCENTAGE && (num < 0 || num > 100)) {
        return 'Percentage must be between 0 and 100';
      }
      break;
    case ValueType.LETTER:
      if (input && (typeof input !== 'string' || !/^[A-Za-z]$/.test(input))) {
        return 'Please enter a single letter';
      }
      break;
    default:
      break;
  }
  
  // Regex validation if provided
  if (validationRules.regex && input) {
    const regex = new RegExp(validationRules.regex);
    if (!regex.test(String(input))) {
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

  // Handle input change
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    console.log('Input value:', newValue, 'Type:', typeof newValue);
    
    // Always store as string in the state (to be compatible with TextField)
    // but handle '0' correctly during validation
    setValue(newValue);
    setStatus(FieldStatus.IDLE);
    
    // For validation, convert to number if it's a numeric field
  let valueForValidation: string | number = newValue;
    if (getInputType === 'number' && newValue !== '') {
      valueForValidation = Number(newValue);
    }
    
    // Run validation
    const validationError = validateInput(valueForValidation);
    setError(validationError);
    
    if (onValidationStateChange) {
      onValidationStateChange(!validationError);
    }
    
    if (onChange) {
      onChange(newValue);
    }
  };

  // Prepare payload for saving
  const preparePayload = (): DataValuePayload => {
    const stringifiedValue = 
      typeof value === 'object' ? JSON.stringify(value) : 
      value !== null && value !== undefined ? String(value) : '';
    
    return {
      //uuid: crypto.randomUUID(),
      source: source || localStorage.getItem('selected-org') || '',
      period: period || localStorage.getItem('selected-period') || '',
      dataElement: dataElementId,
      categoryOptionCombo: q.categoryCombo?.id || 'HllvX50cXC0',
      attributeOptionCombo: '',
      value: stringifiedValue,
      comment: q.formStyles.helpText || 'ok',
      followup: false,
      date: new Date()
    };
  };

  // Handle saving data
  const handleSaveData = async () => {
    // Skip save if there's validation error
    if (error) {
      setStatus(FieldStatus.ERROR);
      return;
    }
    
    // Skip save if value is empty and not required
    if ((value === '' || value === null || value === undefined) && !validationRules.required) {
      setStatus(FieldStatus.IDLE);
      return;
    }
    
    try {
      setStatus(FieldStatus.SAVING);
      
      // Check for required source and period
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

  // Get TextField helper text
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
          <DomsSvgIcon>material-outline:edit</DomsSvgIcon>;
      default:
        return null;
    }
  };

  // Create startAdornment with icon
  const startAdornment = (
    <InputAdornment position="start">
      {getStatusIcon()}
    </InputAdornment>
  );

  // For percentage type, create end adornment
  const endAdornment = valueType === ValueType.PERCENTAGE ? (
    <InputAdornment position="end">%</InputAdornment>
  ) : undefined;

  // Define TextField props
  const textFieldProps: TextFieldProps = {
    id: `input-${dataElementId}`,
    name: dataElementId,
    fullWidth: true,
    variant: q.formStyles.variant || 'outlined',
    size: q.formStyles.fieldSize || 'medium',
    label: q.shortName,
    placeholder: q.formStyles.placeholder || `Enter ${q.shortName || q.name}`,
    type: getInputType,
    value,
    onChange: handleInputChange,
    onBlur: handleElementBlur,
    error: status === FieldStatus.ERROR,
    helperText: getHelperText(),
    disabled: readOnly || status === FieldStatus.SAVING || autoSaving,
    required: validationRules.required,
    inputRef,
    multiline: valueType === ValueType.LONG_TEXT,
    rows: valueType === ValueType.LONG_TEXT ? 4 : undefined,
    sx: { 
      bgcolor: 'white',
      ...(q.formStyles.sx || {})
    },
    // Replace InputProps with slotProps for MUI v7
    slotProps: {
      input: {
        ...getInputProps,
        startAdornment,
        endAdornment
      }
    }
  };

  const titleDescription = (
    <Box sx={{ mb: 1, fontWeight: 'bold', color: 'text.secondary' }}>
      {q.name}
    </Box>
  );

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
      
      <TextField {...textFieldProps} />
    </Box>
  );

  // If animations are disabled, return content directly
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

export default DomsTextField;