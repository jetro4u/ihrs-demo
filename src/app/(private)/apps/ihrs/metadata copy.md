1. Example customValidation and customLogic JSON objects for dataElement object record with multiple field inputs
Here is an examples for disease surveillance
jsonCopy{
				"customValidation": {
				  "suspected": {
					"required": true,
					"default": null,
					"min": 0,
					"max": null,
					"regex": null,
					"valueType": "INTEGER_ZERO_OR_POSITIVE",
					"errorMessage": "Suspected cases must be a non-negative integer"
				  },
				  "confirmed": {
					"required": true,
					"default": null,
					"min": 0,
					"max": null,
					"regex": null,
					"valueType": "INTEGER_ZERO_OR_POSITIVE",
					"errorMessage": "Confirmed cases must be a non-negative integer"
				  },
				  "referred": {
					"required": true,
					"default": null,
					"min": 0,
					"max": null,
					"regex": null,
					"valueType": "INTEGER_ZERO_OR_POSITIVE",
					"errorMessage": "Referred cases must be a non-negative integer"
				  },
				  "death": {
					"required": true,
					"default": null,
					"min": 0,
					"max": null,
					"regex": null,
					"valueType": "INTEGER_ZERO_OR_POSITIVE",
					"errorMessage": "Death cases must be a non-negative integer"
				  }
				},
  "customLogic": "{\"validations\":[{\"field\":\"death\",\"compareTo\":\"suspected + confirmed\",\"operator\":\"<=\",\"message\":\"Death cases cannot exceed suspected plus confirmed cases\"},{\"field\":\"referred\",\"compareTo\":\"suspected + confirmed\",\"operator\":\"<=\",\"message\":\"Referred cases cannot exceed suspected plus confirmed cases\"}]}",
}