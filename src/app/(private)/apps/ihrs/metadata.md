1. Example customValidation and customLogic JSON objects for single string value inputs
Here are examples for different ValueTypes where the field name is "value":
TEXT
jsonCopy{
  "customValidation": {
    "value": {
      "required": true,
      "default": "",
      "min": 2,
      "max": 100,
      "valueType": "TEXT",
      "errorMessage": "Please enter valid text between 2-100 characters"
    }
  },
  "customLogic": "{\"validations\":[]}"
}
EMAIL
jsonCopy{
  "customValidation": {
    "value": {
      "required": true,
      "default": "",
      "min": null,
      "max": null,
      "valueType": "EMAIL",
      "errorMessage": "Please enter a valid email address"
    }
  },
  "customLogic": "{\"validations\":[]}"
}
PHONE_NUMBER
jsonCopy{
  "customValidation": {
    "value": {
      "required": true,
      "default": "",
      "min": null,
      "max": null,
      "valueType": "PHONE_NUMBER",
      "errorMessage": "Please enter a valid phone number"
    }
  },
  "customLogic": "{\"validations\":[]}"
}
INTEGER_ZERO_OR_POSITIVE
jsonCopy{
  "customValidation": {
    "value": {
      "required": true,
      "default": null,
      "min": 0,
      "max": 2147483647,
      "valueType": "INTEGER_ZERO_OR_POSITIVE",
      "errorMessage": "Please enter a positive integer or zero"
    }
  },
  "customLogic": "{\"validations\":[]}"
}
PERCENTAGE
jsonCopy{
  "customValidation": {
    "value": {
      "required": true,
      "default": null,
      "min": 0,
      "max": 100,
      "valueType": "PERCENTAGE",
      "errorMessage": "Please enter a percentage between 0-100"
    }
  },
  "customLogic": "{\"validations\":[]}"
}
DATE
jsonCopy{
  "customValidation": {
    "value": {
      "required": true,
      "default": null,
      "min": null,
      "max": null,
      "valueType": "DATE",
      "errorMessage": "Please enter a valid date"
    }
  },
  "customLogic": "{\"validations\":[{\"field\":\"value\",\"compareTo\":\"2023-01-01\",\"operator\":\">\",\"message\":\"Date must be after January 1, 2023\"}]}"
}
URL
jsonCopy{
  "customValidation": {
    "value": {
      "required": true,
      "default": "",
      "min": null,
      "max": null,
      "valueType": "URL",
      "errorMessage": "Please enter a valid URL"
    }
  },
  "customLogic": "{\"validations\":[]}"
}
BOOLEAN
jsonCopy{
  "customValidation": {
    "value": {
      "required": true,
      "default": false,
      "min": null,
      "max": null,
      "valueType": "BOOLEAN",
      "errorMessage": ""
    }
  },
  "customLogic": "{\"validations\":[]}"
}
BOOLEAN
jsonCopy{
  "customValidation": {
    "value": {
      "required": true,
      "default": false,
      "min": null,
      "max": null,
      "valueType": "BOOLEAN",
      "errorMessage": ""
    }
  },
  "customLogic": "{\"validations\":[]}"
}