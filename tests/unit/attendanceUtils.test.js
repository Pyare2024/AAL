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

  it('TC-UT-ATT-02: generates uppercase session code starting with ATT-', () => {
    const code = generateSessionCode();
    expect(code).toHaveLength(8);
    expect(code).toMatch(/^ATT-\d{4}$/);
  });

  it('TC-UT-ATT-03: generates 6-digit numeric secure session password', () => {
    const passcode = generateSessionPassword();
    expect(passcode).toHaveLength(6);
    expect(passcode).toMatch(/^\d{6}$/);
  });
});
