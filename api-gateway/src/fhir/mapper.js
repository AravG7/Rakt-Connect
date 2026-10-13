/**
 * ABDM & NRCES Compliant FHIR R4 Resource Mapper
 * Formats blood supply chain resources according to HL7 FHIR R4 and NDHM/ABDM Profiles
 */

class FHIRMapper {
  /**
   * Converts Blockchain native BloodUnit into FHIR R4 BiologicallyDerivedProduct
   */
  static bloodUnitToFHIR(unitRecord) {
    const isAvailable = unitRecord.state === 'Approved' || unitRecord.state === 'Stored';
    const isFluid = unitRecord.componentType === 'FFP' || unitRecord.componentType === 'Plasma' || unitRecord.componentType === 'Cryoprecipitate';

    return {
      resourceType: 'BiologicallyDerivedProduct',
      id: unitRecord.unitId || unitRecord.id,
      productCategory: isFluid ? 'fluid' : 'cells',
      productCode: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: this.mapComponentToSnomed(unitRecord.componentType || unitRecord.component),
          display: unitRecord.componentType || unitRecord.component
        }]
      },
      status: isAvailable ? 'available' : 'unavailable',
      collection: {
        collectedDateTime: unitRecord.collectionTime || new Date(unitRecord.collectionDate * 1000).toISOString(),
        source: {
          reference: `Patient/${unitRecord.donorHash || unitRecord.donorDid}`
        }
      },
      storage: [{
        description: 'Cold Chain Monitored (NBTC Guideline Compliant)',
        temperature: unitRecord.lastTempReading !== undefined && unitRecord.lastTempReading !== null ? unitRecord.lastTempReading : 4.0,
        scale: 'celsius'
      }]
    };
  }

  /**
   * SNOMED CT Mapping required by NDHM / NRCES
   */
  static mapComponentToSnomed(component) {
    const codes = {
      WholeBlood: '85028001',
      RBC: '1121000119106',
      'Packed RBC': '1121000119106',
      Platelets: '1182000119103',
      FFP: '1198000119106',
      Cryoprecipitate: '1198000119106',
      Plasma: '1190000119105'
    };
    return codes[component] || '85028001';
  }

  /**
   * Maps Blockchain Donor to valid FHIR R4 Patient resource.
   * NOTE: In FHIR R4, bloodGroup is NOT a legal top-level property of Patient.
   * It is properly mapped into standard FHIR extension and linked Observation.
   */
  static donorToFHIR(donorRecord) {
    const snomedCode = this.mapBloodGroupCode(donorRecord.bloodGroup);

    return {
      resourceType: 'Patient',
      id: donorRecord.donorHash || donorRecord.did,
      identifier: [{
        system: 'https://healthid.ndhm.gov.in',
        value: donorRecord.abhaId || donorRecord.abhaHash || 'ABHA-NOT-PROVIDED'
      }],
      name: [{
        text: donorRecord.name || 'Anonymous Donor'
      }],
      extension: [{
        url: 'http://hl7.org/fhir/StructureDefinition/patient-bloodGroup',
        valueCodeableConcept: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: snomedCode,
            display: donorRecord.bloodGroup
          }]
        }
      }]
    };
  }

  /**
   * Creates an Observation resource for Blood Group & Immunohematology (LOINC 883-9)
   */
  static bloodGroupObservationToFHIR(donorRecord) {
    return {
      resourceType: 'Observation',
      id: `OBS-BG-${donorRecord.donorHash || donorRecord.did}`,
      status: 'final',
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '883-9',
          display: 'ABO and Rh group [Type] in Blood'
        }]
      },
      subject: {
        reference: `Patient/${donorRecord.donorHash || donorRecord.did}`
      },
      effectiveDateTime: donorRecord.createdAt || new Date().toISOString(),
      valueCodeableConcept: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: this.mapBloodGroupCode(donorRecord.bloodGroup),
          display: donorRecord.bloodGroup
        }]
      }
    };
  }

  /**
   * Bundles Patient, Product, and Observation into a FHIR R4 Collection Bundle
   */
  static createDonationBundle(donorRecord, unitRecord) {
    const patient = this.donorToFHIR(donorRecord);
    const product = this.bloodUnitToFHIR(unitRecord);
    const observation = this.bloodGroupObservationToFHIR(donorRecord);

    return {
      resourceType: 'Bundle',
      id: `BUNDLE-${unitRecord.unitId || unitRecord.id}`,
      type: 'collection',
      timestamp: new Date().toISOString(),
      entry: [
        { fullUrl: `urn:uuid:${patient.id}`, resource: patient },
        { fullUrl: `urn:uuid:${product.id}`, resource: product },
        { fullUrl: `urn:uuid:${observation.id}`, resource: observation }
      ]
    };
  }

  static mapBloodGroupCode(bg) {
    const codes = {
      'O+': '278149003',
      'O-': '278152006',
      'A+': '278147001',
      'A-': '278150003',
      'B+': '278151004',
      'B-': '278154007',
      'AB+': '278153001',
      'AB-': '278155008',
      hh_Bombay: '278156009',
      Rh_null: '278157000'
    };
    return codes[bg] || '278149003';
  }
}

module.exports = FHIRMapper;
