import { FC, useState, useEffect, ChangeEvent, useMemo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { 
  TextField,
  InputAdornment,
  Box,
  Paper,
  Chip,
  TextFieldProps,
  Typography
} from '@mui/material';
import DomsSvgIcon from './DomsSvgIcon';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import { DataElement, DataSet, ValueType, DataValuePayload, FieldStatus } from '../types';
import { getValidationRules, getCustomLogic, validateInput } from '../utils/validateLogic';

// Extended props interface
interface DomsTextBlockProps {
  q: DataElement;
  dataSet: DataSet;
  period: string;
  source: string;
  onSubmit: (data: string, categoryOptionCombo: string) => Promise<{ success: boolean }>;
  existingValues?: any[];
  onValuesUpdate?: (values: any[]) => void;
  readOnly?: boolean;
  customValidation?: (value: any) => string | null;
  onValidationStateChange?: (isValid: boolean) => void;
  inputRef?: React.Ref<any>;
  onChange?: (value: any) => void;
  onBlur?: () => void;
}

const DomsTextBlock: FC<DomsTextBlockProps> = ({
  q,
  dataSet,
  period,
  source,
  onSubmit,
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
  const [value, setValue] = useState<string>('');
  const [allValues, setAllValues] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [status, setStatus] = useState<FieldStatus>(FieldStatus.IDLE);
  const [error, setError] = useState<string>('');
  const [autoSaving, setAutoSaving] = useState<boolean>(false);
  const dataElementId = q.uid;
  const valueType = q.valueType;
  const showSubmitIndicator = q.showSubmitIndicator || true;
  const disableAnimation = q.disableAnimation || false;
  const autoSaveDelay = q.autoSaveDelay || 300;

  const validationRules = useMemo(() => getValidationRules({
    elementOption: q,
    dataSet,
    fieldName: 'value'
  }), [q, dataSet]);

  const customLogic = useMemo(() => getCustomLogic({
    elementOption: q,
    dataSet,
  }), [q, dataSet]);
  
  useEffect(() => {
    if (existingValues && existingValues.length > 0) {
      const existingValue = existingValues.find(v => v.dataElement === dataElementId);
      if (existingValue) {
        setValue(existingValue.value);
        setSubmitted(true);
      }
    }

    if (existingValues && existingValues.length > 0) {
      const values: Record<string, any> = {};
      existingValues.forEach(v => {
        values[v.dataElement] = v.value;
      });
      setAllValues(values);
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

  // Handle input change
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    console.log('Input value:', newValue, 'Type:', typeof newValue);
    
    setValue(newValue);
    setStatus(FieldStatus.IDLE);
    
    let valueForValidation: string | number = newValue;
    if (getInputType === 'number' && newValue !== '') {
      valueForValidation = Number(newValue);
    }
    
    const updatedValues = { ...allValues, [dataElementId]: valueForValidation };
    
    const validationError = validateInput(
      valueForValidation, 
      validationRules, 
      updatedValues, 
      customLogic
    );
    
    setError(validationError);
    
    if (onValidationStateChange) {
      onValidationStateChange(!validationError);
    }
    
    if (onChange) {
      onChange(newValue);
    }
  };

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
      
      if (onSubmit) {
        try {
          const stringifiedValue = 
            typeof value === 'object' ? JSON.stringify(value) : 
            value !== null && value !== undefined ? String(value) : '';
            
          const result = await onSubmit(stringifiedValue, 'HllvX50cXC0');
  
          if (result.success) {
            setSubmitted(true);
            setStatus(FieldStatus.SAVED);
          }
        } catch (serverError) {
          console.error('Error saving to server, keeping in IndexedDB for later sync:', serverError);
          setStatus(FieldStatus.WARNING);
          setError('Saved locally, will sync later');
        }
      } else {
        setSubmitted(true);
        setStatus(FieldStatus.SAVED);
      }
    } catch (error) {
      console.error('Error saving data:', error);
      setStatus(FieldStatus.ERROR);
      setError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

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

  const getHelperText = (): string => {
    //if (q.formStyles.helpText) return q.formStyles.helpText;
    if (error) return `${error}${q.formStyles.helpText ? " - " + q.formStyles.helpText : ""}`;
    if (autoSaving) return "Auto-saving...";
    if (status === FieldStatus.SAVING) return "Saving...";
    if (status === FieldStatus.SAVED) return "Saved";
    if (status === FieldStatus.WARNING) return "Saved locally, will sync later";
    return "";
  };

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

  const startAdornment = (
    <InputAdornment position="start">
      {getStatusIcon()}
    </InputAdornment>
  );

  const endAdornment = valueType === ValueType.PERCENTAGE ? (
    <InputAdornment position="end">%</InputAdornment>
  ) : undefined;

  const textFieldProps: TextFieldProps = {
    id: `input-${dataElementId}`,
    name: dataElementId,
    fullWidth: true,
    variant: q.formStyles.variant || 'outlined',
    size: q.formStyles.fieldSize || 'medium',
    label: q.shortName,
    placeholder: q.formStyles.placeholder || `Enter here`,
    type: getInputType,
    value,
    onChange: handleInputChange,
    onBlur: handleElementBlur,
    error: status === FieldStatus.ERROR,
    disabled: readOnly || status === FieldStatus.SAVING || autoSaving,
    required: validationRules.required,
    inputRef,
    multiline: valueType === ValueType.LONG_TEXT,
    rows: valueType === ValueType.LONG_TEXT ? 4 : undefined,
    sx: { 
      bgcolor: 'white',
      ...(q.formStyles.sx || {})
    },
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
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mt: 0.5
        }}>
          {(error || status === FieldStatus.WARNING) && (
            <Typography variant="caption" color={error ? "error" : "text.secondary"}>
              {getHelperText()}
            </Typography>
          )}
        </Box>
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

export default DomsTextBlock;