// ABDM Sandbox compliance wrapper (FHIR R4 format)

class FHIRMapper {
    /**
     * Converts Blockchain native BloodUnit resource into FHIR R4 BiologicallyDerivedProduct
     */
    static bloodUnitToFHIR(unitRecord) {
        return {
            resourceType: "BiologicallyDerivedProduct",
            id: unitRecord.unitId,
            productCategory: "cells",
            productCode: {
                coding: [{
                    system: "http://snomed.info/sct",
                    code: this.mapComponentToSnomed(unitRecord.componentType),
                    display: unitRecord.componentType
                }]
            },
            status: unitRecord.state === "Approved" ? "available" : "unavailable",
            collection: {
                collectedDateTime: unitRecord.collectionTime,
                source: {
                    reference: `Patient/${unitRecord.donorHash}`
                }
            },
            storage: [{
                description: "Cold Chain Monitored",
                temperature: unitRecord.lastTempReading,
                scale: "celsius"
            }]
        };
    }

    /**
     * SNOMED CT Mapping required by NDHM
     */
    static mapComponentToSnomed(component) {
        const codes = {
            "WholeBlood": "85028001",
            "RBC": "1121000119106",
            "Platelets": "1182000119103",
            "FFP": "1198000119106",
            "Plasma": "1190000119105"
        };
        return codes[component] || "00000000";
    }

    /**
     * Maps Blockchain Donor to FHIR Patient profile
     */
    static donorToFHIR(donorRecord) {
        return {
            resourceType: "Patient",
            id: donorRecord.donorHash,
            identifier: [{
                system: "https://healthid.ndhm.gov.in",
                value: donorRecord.abhaId
            }],
            bloodGroup: {
                 coding: [{
                     system: "http://snomed.info/sct",
                     code: this.mapBloodGroupCode(donorRecord.bloodGroup),
                     display: donorRecord.bloodGroup
                 }]
             }
        };
    }

    static mapBloodGroupCode(bg) {
        const codes = { "O+":"278149003", "A+":"278147001", "B+":"278151004", "AB+":"278153001" };
        return codes[bg] || "UNKNOWN";
    }
}

module.exports = FHIRMapper;
