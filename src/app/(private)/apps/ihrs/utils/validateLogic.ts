import { DataElement, ValueType, DataSet, CustomValidation } from '../types';

interface ValidationOptions {
  elementOption?: DataElement;
  dataSet?: DataSet;
  fieldName?: string;
}

// Get validation rules for a specific field
export const getValidationRules = (options: ValidationOptions): CustomValidation => {
  const { elementOption, dataSet, fieldName = 'value' } = options;
  
  // Try to get element-specific validation rules
  if (elementOption?.customValidation && elementOption.customValidation[fieldName]) {
    return elementOption.customValidation[fieldName];
  }
  
  // Fallback to section-level validation if available
  if (dataSet?.sections && dataSet.sections.length > 0 && 
      dataSet.sections[0]?.customValidation && 
      dataSet.sections[0].customValidation[fieldName]) {
    return dataSet.sections[0].customValidation[fieldName];
  }
  
  // Fallback to dataset-level validation if available
  if (dataSet?.customValidation && dataSet.customValidation[fieldName]) {
    return dataSet.customValidation[fieldName];
  }
  
  // Default validation rules if nothing is specified
  return { 
    required: false, 
    default: null, 
    min: null, 
    max: null, 
    regex: null,
    valueType: ValueType.TEXT,
    errorMessage: ''
  };
};

// Get custom logic for cross-field validation
export const getCustomLogic = (options: ValidationOptions): any => {
  const { elementOption, dataSet } = options;
  let customLogicStr = null;
  
  if (elementOption?.customLogic) {
    customLogicStr = elementOption.customLogic;
  } else if (dataSet?.sections && dataSet.sections.length > 0 && dataSet.sections[0]?.customLogic) {
    customLogicStr = dataSet.sections[0].customLogic;
  } else if (dataSet?.customLogic) {
    customLogicStr = dataSet.customLogic;
  }
  
  if (customLogicStr) {
    try {
      return JSON.parse(customLogicStr);
    } catch (e) {
      console.error("Failed to parse custom logic:", e);
      return null;
    }
  }
  
  return null;
};

// Function to validate input based on validation rules and custom logic
export const validateInput = (input: any, validationRules: CustomValidation, allValues: Record<string, any> = {}, customLogic: any = null): string => {
  const valueType = validationRules.valueType;
  
  // If empty and required
  if ((input === '' || input === null || input === undefined) && validationRules.required) {
    return validationRules.errorMessage || 'This field is required';
  }

  // Type-specific validation
  switch (valueType) {
    case ValueType.EMAIL:
      if (input && !/\S+@\S+\.\S+/.test(String(input))) {
        return validationRules.errorMessage || 'Please enter a valid email address';
      }
      break;
    case ValueType.URL:
      try {
        if (input) {
          new URL(String(input));
        }
      } catch (e) {
        return validationRules.errorMessage || 'Please enter a valid URL';
      }
      break;
    case ValueType.PHONE_NUMBER:
      if (input && !/^\+?[0-9\s\-()]{8,20}$/.test(String(input))) {
        return validationRules.errorMessage || 'Please enter a valid phone number';
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
        return validationRules.errorMessage || 'Please enter a valid number';
      }
      
      if (validationRules.min !== undefined && validationRules.min !== null && num < validationRules.min) {
        return validationRules.errorMessage || `Value must be at least ${validationRules.min}`;
      }
      
      if (validationRules.max !== undefined && validationRules.max !== null && num > validationRules.max) {
        return validationRules.errorMessage || `Value must be at most ${validationRules.max}`;
      }
      
      // Special cases for different numeric types
      if (valueType === ValueType.INTEGER && !Number.isInteger(num)) {
        return validationRules.errorMessage || 'Value must be an integer';
      }
      
      if (valueType === ValueType.INTEGER_POSITIVE && num <= 0) {
        return validationRules.errorMessage || 'Value must be a positive integer';
      }
      
      if (valueType === ValueType.INTEGER_NEGATIVE && num >= 0) {
        return validationRules.errorMessage || 'Value must be a negative integer';
      }
      
      if (valueType === ValueType.INTEGER_ZERO_OR_POSITIVE && num < 0) {
        return validationRules.errorMessage || 'Value must be zero or a positive integer';
      }
      
      if (valueType === ValueType.PERCENTAGE && (num < 0 || num > 100)) {
        return validationRules.errorMessage || 'Percentage must be between 0 and 100';
      }
      break;
    case ValueType.LETTER:
      if (input && (typeof input !== 'string' || !/^[A-Za-z]$/.test(input))) {
        return validationRules.errorMessage || 'Please enter a single letter';
      }
      break;
    case ValueType.DATE:
      if (input) {
        const date = new Date(input);
        if (isNaN(date.getTime())) {
          return validationRules.errorMessage || 'Please enter a valid date';
        }
      }
      break;
    case ValueType.BOOLEAN:
      // Boolean values are typically handled by UI components like checkboxes
      // and don't require traditional validation
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
  
  // Apply custom logic validations if provided
  if (customLogic && customLogic.validations && customLogic.validations.length > 0) {
    for (const rule of customLogic.validations) {
      if (rule.field === 'value') {
        // For single value fields, we may compare against a static value or another field
        let compareValue = rule.compareTo;
        
        // If compareTo refers to another field, get its value
        if (allValues[rule.compareTo] !== undefined) {
          compareValue = allValues[rule.compareTo];
        }
        
        // Convert values to appropriate types for comparison
        let fieldValue = input;
        if (typeof compareValue === 'number' && typeof fieldValue !== 'number') {
          fieldValue = Number(fieldValue);
        }
        
        // Perform the comparison based on the operator
        let validationFailed = false;
        switch (rule.operator) {
          case '<':
            validationFailed = !(fieldValue < compareValue);
            break;
          case '<=':
            validationFailed = !(fieldValue <= compareValue);
            break;
          case '>':
            validationFailed = !(fieldValue > compareValue);
            break;
          case '>=':
            validationFailed = !(fieldValue >= compareValue);
            break;
          case '==':
          case '===':
            validationFailed = !(fieldValue == compareValue);
            break;
          case '!=':
          case '!==':
            validationFailed = !(fieldValue != compareValue);
            break;
          default:
            break;
        }
        
        if (validationFailed) {
          return rule.message || 'Validation failed';
        }
      }
    }
  }
  
  return '';
};

// This is an improved implementation of getCustomObjectLogic
export const getCustomObjectLogic = (values: any, options: ValidationOptions): Record<string, string> => {
  const errors: Record<string, string> = {};
  const { elementOption, dataSet } = options;
  let customLogicStr = null;
  
  // Get custom logic from the appropriate level
  if (elementOption?.customLogic) {
    customLogicStr = elementOption.customLogic;
  } else if (dataSet?.sections && dataSet.sections.length > 0 && dataSet.sections[0]?.customLogic) {
    customLogicStr = dataSet.sections[0].customLogic;
  } else if (dataSet?.customLogic) {
    customLogicStr = dataSet.customLogic;
  }
  
  if (!customLogicStr) return errors;
  
  try {
    // Parse the custom logic JSON
    const customLogic = typeof customLogicStr === 'string' 
      ? JSON.parse(customLogicStr) 
      : customLogicStr;
    
    if (!customLogic.validations || !Array.isArray(customLogic.validations)) {
      return errors;
    }
    
    // Apply each validation rule
    customLogic.validations.forEach(validation => {
      // Skip validation if required fields are missing
      if (!validation.field || !validation.operator) {
        return;
      }
      
      const fieldValue = Number(values[validation.field] || 0);
      let compareValue;
      
      // Determine what to compare against
      if (validation.compareTo !== undefined) {
        // Check if compareTo contains an expression with operators
        if (typeof validation.compareTo === 'string' && 
            /[+\-*/]/.test(validation.compareTo)) {
          try {
            compareValue = evaluateExpression(validation.compareTo, values);
          } catch (error) {
            console.error('Error evaluating expression:', error);
            return; // Skip this validation
          }
        } else {
          // Simple field reference or direct value
          compareValue = values[validation.compareTo] !== undefined ? 
            Number(values[validation.compareTo]) : 
            Number(validation.compareTo);
        }
      } else {
        // Direct value comparison
        compareValue = Number(validation.value || 0);
      }
      
      // Skip if compareValue couldn't be properly evaluated
      if (isNaN(compareValue)) return;
      
      let isValid = true;
      
      // Apply the comparison
      switch(validation.operator) {
        case ">": isValid = fieldValue > compareValue; break;
        case "<": isValid = fieldValue < compareValue; break;
        case ">=": isValid = fieldValue >= compareValue; break;
        case "<=": isValid = fieldValue <= compareValue; break;
        case "===": isValid = fieldValue === compareValue; break;
        case "!==": isValid = fieldValue !== compareValue; break;
        case "==": isValid = fieldValue == compareValue; break;
        case "!=": isValid = fieldValue != compareValue; break;
        default: isValid = true; // Unknown operator
      }
      
      // If validation fails, add the error message
      if (!isValid) {
        errors[validation.field] = validation.message || 
          `Invalid value for ${validation.field}`;
      }
    });
  } catch (error) {
    console.error("Error parsing or processing custom logic:", error);
    return errors;
  }
  
  return errors;
};

export const evaluateExpression = (expression: string, values: Record<string, any>): number => {
  // Remove all whitespace for consistent parsing
  const cleanExpr = expression.replace(/\s+/g, '');
  
  // Use a regex to split by operators but keep the operators
  const tokens = cleanExpr.split(/([+\-*/])/).filter(Boolean);
  
  let result = 0;
  let currentOp = '+';
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    if (['+', '-', '*', '/'].includes(token)) {
      currentOp = token;
    } else {
      // Check if it's a field reference or a number
      const value = values[token] !== undefined ? 
        parseFloat(values[token]) : 
        parseFloat(token);
      
      if (isNaN(value)) {
        throw new Error(`Invalid value in expression: ${token}`);
      }
      
      // Apply operation
      switch(currentOp) {
        case '+': result += value; break;
        case '-': result -= value; break;
        case '*': result *= value; break;
        case '/': 
          if (value === 0) {
            throw new Error('Division by zero');
          }
          result /= value; 
          break;
      }
    }
  }
  
  return result;
};