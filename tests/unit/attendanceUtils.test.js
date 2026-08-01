import { describe, it, expect } from 'vitest';
import { 
  calculateGpsDistanceMeters, 
  generateSessionCode, 
  generateSessionPassword 
} from '../../src/utils/attendanceUtils';

describe('attendanceUtils Pure Functions', () => {
  it('TC-UT-ATT-01: calculates GPS distance accurately via Haversine formula', () => {
    // Distance between two points ~111km apart (1 degree latitude)
    const distance = calculateGpsDistanceMeters(12.9716, 77.5946, 13.0827, 80.2707);
    expect(distance).toBeGreaterThan(200000); // ~290km
  });

  it('TC-UT-ATT-02: generates uppercase 6-character alphanumeric session code', () => {
    const code = generateSessionCode();
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
  });

  it('TC-UT-ATT-03: generates 8-character secure session password', () => {
    const passcode = generateSessionPassword();
    expect(passcode).toHaveLength(8);
  });
});
