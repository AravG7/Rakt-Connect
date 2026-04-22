export interface FHIRResource {
  resourceType: string;
  id?: string;
}

export interface FHIROperationOutcome extends FHIRResource {
  resourceType: 'OperationOutcome';
  issue: Array<{
    severity: 'fatal' | 'error' | 'warning' | 'information';
    code: string;
    details?: {
      text: string;
    };
    diagnostics?: string;
  }>;
}

export interface FHIRPatient extends FHIRResource {
  resourceType: 'Patient';
  identifier?: Array<{
    system: string;
    value: string;
  }>;
  name?: Array<{
    text: string;
    family?: string;
    given?: string[];
  }>;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
}

export interface FHIRObservation extends FHIRResource {
  resourceType: 'Observation';
  status: 'registered' | 'preliminary' | 'final' | 'amended';
  code: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  subject?: {
    reference: string; // e.g. "Patient/123"
  };
  valueQuantity?: {
    value: number;
    unit: string;
  };
  valueString?: string;
}
