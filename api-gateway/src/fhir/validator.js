/**
 * FHIR R4 Profile Validator Engine
 * Validates resources against official HL7 FHIR R4 and ABDM/NRCES Indian Health Profiles.
 */

class FHIRValidator {
  /**
   * Validate a single FHIR R4 resource or Bundle
   */
  static validate(resource) {
    if (!resource || typeof resource !== 'object') {
      return {
        isValid: false,
        errors: ['Invalid resource: must be a valid JSON object'],
        warnings: [],
        profile: 'UNKNOWN'
      };
    }

    const errors = [];
    const warnings = [];

    // 1. Mandatory top-level resourceType
    if (!resource.resourceType || typeof resource.resourceType !== 'string') {
      errors.push("Missing mandatory 'resourceType' string");
      return { isValid: false, errors, warnings, profile: 'UNKNOWN' };
    }

    // 2. Dispatch based on resourceType
    switch (resource.resourceType) {
      case 'Patient':
        this.validatePatient(resource, errors, warnings);
        break;
      case 'BiologicallyDerivedProduct':
        this.validateBiologicallyDerivedProduct(resource, errors, warnings);
        break;
      case 'Observation':
        this.validateObservation(resource, errors, warnings);
        break;
      case 'Bundle':
        this.validateBundle(resource, errors, warnings);
        break;
      default:
        warnings.push(`Resource type '${resource.resourceType}' does not have dedicated profile checks`);
    }

    return {
      isValid: errors.length === 0,
      resourceType: resource.resourceType,
      errors,
      warnings,
      profile: `HL7_FHIR_R4_${resource.resourceType.toUpperCase()}`
    };
  }

  /**
   * Validates FHIR R4 Patient against ABDM / NRCES profile:
   * Rejects illegal top-level attributes like raw 'bloodGroup'.
   */
  static validatePatient(patient, errors, warnings) {
    if (!patient.id) {
      errors.push("Patient resource must contain 'id'");
    }

    // Critical FHIR R4 conformance check:
    // Patient DOES NOT have a top-level 'bloodGroup' element in the HL7 specification.
    if ('bloodGroup' in patient) {
      errors.push("FHIR R4 Schema Violation: 'bloodGroup' is not a valid element of Patient resource. Use extension or linked Observation.");
    }

    if (patient.identifier) {
      if (!Array.isArray(patient.identifier)) {
        errors.push("Patient 'identifier' must be an array");
      } else {
        patient.identifier.forEach((ident, idx) => {
          if (!ident.system || !ident.value) {
            errors.push(`Patient identifier[${idx}] must contain both 'system' and 'value'`);
          }
        });
      }
    } else {
      warnings.push("Patient has no identifiers (ABDM profile expects ABHA identifier)");
    }
  }

  /**
   * Validates FHIR R4 BiologicallyDerivedProduct
   */
  static validateBiologicallyDerivedProduct(product, errors, warnings) {
    if (!product.id) {
      errors.push("BiologicallyDerivedProduct must contain 'id'");
    }

    const validCategories = ['organ', 'tissue', 'fluid', 'cells', 'biologicalAgent'];
    if (!product.productCategory || !validCategories.includes(product.productCategory)) {
      errors.push(`Invalid productCategory: must be one of [${validCategories.join(', ')}]`);
    }

    const validStatuses = ['available', 'unavailable'];
    if (!product.status || !validStatuses.includes(product.status)) {
      errors.push(`Invalid status: must be one of [${validStatuses.join(', ')}]`);
    }

    if (!product.productCode || !product.productCode.coding || !Array.isArray(product.productCode.coding)) {
      errors.push("BiologicallyDerivedProduct must have 'productCode' with coding array");
    } else {
      const snomedCoding = product.productCode.coding.find(c => c.system === 'http://snomed.info/sct');
      if (!snomedCoding) {
        warnings.push("Product coding should include SNOMED CT system ('http://snomed.info/sct')");
      }
    }

    if (product.collection) {
      if (product.collection.collectedDateTime) {
        if (isNaN(Date.parse(product.collection.collectedDateTime))) {
          errors.push("Invalid collectedDateTime: must be valid ISO 8601 date string");
        }
      }
      if (product.collection.source && !product.collection.source.reference) {
        errors.push("collection.source must include a 'reference' to Patient");
      }
    }

    if (product.storage) {
      if (!Array.isArray(product.storage)) {
        errors.push("'storage' must be an array of storage condition objects");
      }
    }
  }

  /**
   * Validates FHIR R4 Observation
   */
  static validateObservation(obs, errors, warnings) {
    if (!obs.id) {
      errors.push("Observation must contain 'id'");
    }

    const validStatuses = ['registered', 'preliminary', 'final', 'amended', 'corrected', 'cancelled', 'entered-in-error', 'unknown'];
    if (!obs.status || !validStatuses.includes(obs.status)) {
      errors.push(`Invalid Observation status: must be one of [${validStatuses.join(', ')}]`);
    }

    if (!obs.code || !obs.code.coding || !Array.isArray(obs.code.coding)) {
      errors.push("Observation must contain 'code.coding' array");
    }

    if (!obs.subject || !obs.subject.reference) {
      errors.push("Observation must contain 'subject.reference' linking to Patient or Product");
    }
  }

  /**
   * Validates FHIR R4 Bundle
   */
  static validateBundle(bundle, errors, warnings) {
    if (!bundle.id) {
      errors.push("Bundle must contain 'id'");
    }

    const validTypes = ['document', 'message', 'transaction', 'transaction-response', 'batch', 'batch-response', 'history', 'searchset', 'collection'];
    if (!bundle.type || !validTypes.includes(bundle.type)) {
      errors.push(`Invalid Bundle type: must be one of [${validTypes.join(', ')}]`);
    }

    if (!bundle.entry || !Array.isArray(bundle.entry)) {
      errors.push("Bundle must contain 'entry' array");
    } else {
      bundle.entry.forEach((entry, idx) => {
        if (!entry.resource) {
          errors.push(`Bundle entry[${idx}] missing 'resource' object`);
        } else {
          const entryResult = this.validate(entry.resource);
          if (!entryResult.isValid) {
            errors.push(`Bundle entry[${idx}] (${entry.resource.resourceType}) errors: ${entryResult.errors.join('; ')}`);
          }
        }
      });
    }
  }
}

module.exports = FHIRValidator;
