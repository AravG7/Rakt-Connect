/**
 * H3 Hexagonal Spatial Indexing & Routing Engine
 * Decentralized emergency blood dispatch for Rakt-Connect
 * Powered by Uber H3 Spatial Indexing Library (h3-js)
 */

const h3 = require('h3-js');

class H3Router {
  /**
   * Converts GPS coordinates to an official 64-bit Uber H3 Hex Index
   * Resolution 7 (~5.16 km² cell) / Resolution 8 (~0.74 km² cell)
   */
  static geoToH3Index(lat, lon, res = 7) {
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      throw new Error(`Invalid GPS coordinates: lat=${lat}, lon=${lon}`);
    }
    return h3.latLngToCell(lat, lon, res);
  }

  /**
   * Calculates great-circle Haversine distance in kilometers between two GPS points
   */
  static haversineKm(lat1, lon1, lat2, lon2) {
    const dist = h3.greatCircleDistance([lat1, lon1], [lat2, lon2], 'km');
    return +dist.toFixed(2);
  }

  /**
   * Generates k-ring hexagonal neighbors around an origin H3 cell using official h3.gridDisk
   * (Ring 1 = 7 hexes [center + 6 neighbors], Ring 2 = 19 hexes, etc.)
   */
  static kRing(originLat, originLon, k = 1, res = 7) {
    const originH3 = this.geoToH3Index(originLat, originLon, res);
    return h3.gridDisk(originH3, k);
  }

  /**
   * Checks if two hex cells are immediate neighbors sharing a hexagonal edge
   */
  static areNeighbors(hexA, hexB) {
    try {
      return h3.areNeighborCells(hexA, hexB);
    } catch (_) {
      return false;
    }
  }

  /**
   * Computes hexagonal grid distance between two H3 cells
   */
  static gridDistance(hexA, hexB) {
    try {
      return h3.gridDistance(hexA, hexB);
    } catch (_) {
      return -1;
    }
  }

  /**
   * Ranks and routes candidate blood banks based on:
   * - H3 hexagonal proximity & Haversine distance
   * - Inventory availability
   * - Urgency SLA weighting
   */
  static rankDispatchCandidates(requestLocation, candidates, unitsNeeded = 1, urgency = 'ROUTINE') {
    const originH3 = this.geoToH3Index(requestLocation.lat, requestLocation.lon, 7);

    const urgencyMultipliers = {
      ROUTINE: 1.0,
      URGENT: 1.5,
      CRITICAL: 2.0
    };
    const urgencyWeight = urgencyMultipliers[urgency] || 1.0;

    const scored = candidates.map(facility => {
      const distKm = this.haversineKm(
        requestLocation.lat,
        requestLocation.lon,
        facility.lat,
        facility.lon
      );

      const facilityH3 = this.geoToH3Index(facility.lat, facility.lon, 7);
      const isSameHex = originH3 === facilityH3;

      // Estimated ambulance transit time at 35 km/h urban speed
      const estimatedMinutes = Math.max(3, Math.round((distKm / 35) * 60));

      // Scoring formula: (Stock sufficiency / Distance) * Urgency Weight
      const stock = facility.stock || 0;
      const stockScore = stock >= unitsNeeded ? 100 : (stock / unitsNeeded) * 50;
      const proximityScore = Math.max(0, 100 - distKm * 3);
      const compositeScore = +(proximityScore * 0.6 + stockScore * 0.4).toFixed(1);

      return {
        id: facility.id,
        name: facility.name,
        lat: facility.lat,
        lon: facility.lon,
        h3Index: facilityH3,
        distanceKm: distKm,
        isSameHexCell: isSameHex,
        estimatedTransitMinutes: estimatedMinutes,
        availableUnits: stock,
        score: compositeScore,
        meetsNeed: stock >= unitsNeeded,
        recommendedChannel: distKm <= 5 ? 'GROUND_AMBULANCE' : (distKm > 40 ? 'DRONE_AIR_CORRIDOR' : 'EXPRESS_CORRIDOR')
      };
    });

    // Sort by composite score descending
    scored.sort((a, b) => b.score - a.score);

    return {
      originH3,
      requestLocation,
      urgency,
      urgencyWeight,
      candidatesEvaluated: candidates.length,
      candidates: scored
    };
  }
}

module.exports = H3Router;
