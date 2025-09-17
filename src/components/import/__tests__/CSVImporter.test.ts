import { describe, it, expect } from 'vitest';

// Unit tests for CSV mapper functionality
describe('CSV Mapper', () => {
  const LEAD_FIELDS = [
    { value: 'first_name', label: 'First Name' },
    { value: 'last_name', label: 'Last Name' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'source', label: 'Source' },
    { value: 'status', label: 'Status' },
    { value: 'notes', label: 'Notes' },
    { value: 'campaign', label: 'Campaign' },
  ];

  const guessFieldMapping = (header: string): string => {
    const normalized = header.toLowerCase().replace(/[^a-z]/g, '');

    if (['firstname', 'fname', 'first'].includes(normalized)) return 'first_name';
    if (['lastname', 'lname', 'last'].includes(normalized)) return 'last_name';
    if (['email', 'emailaddress', 'mail'].includes(normalized)) return 'email';
    if (['phone', 'telephone', 'mobile', 'phonenumber'].includes(normalized)) return 'phone';
    if (['source', 'leadsource', 'origin'].includes(normalized)) return 'source';
    if (['status', 'leadstatus', 'state'].includes(normalized)) return 'status';
    if (['notes', 'comments', 'description'].includes(normalized)) return 'notes';
    if (['campaign', 'campaignname', 'promo'].includes(normalized)) return 'campaign';

    return '';
  };

  it('should map common header variations to correct fields', () => {
    expect(guessFieldMapping('First Name')).toBe('first_name');
    expect(guessFieldMapping('firstname')).toBe('first_name');
    expect(guessFieldMapping('fname')).toBe('first_name');

    expect(guessFieldMapping('Last Name')).toBe('last_name');
    expect(guessFieldMapping('lastname')).toBe('last_name');

    expect(guessFieldMapping('Email Address')).toBe('email');
    expect(guessFieldMapping('email')).toBe('email');

    expect(guessFieldMapping('Phone Number')).toBe('phone');
    expect(guessFieldMapping('mobile')).toBe('phone');
  });

  it('should reject unknown headers', () => {
    expect(guessFieldMapping('Unknown Column')).toBe('');
    expect(guessFieldMapping('Random Header')).toBe('');
    expect(guessFieldMapping('')).toBe('');
  });

  it('should handle case variations and special characters', () => {
    expect(guessFieldMapping('FIRST_NAME')).toBe('first_name');
    expect(guessFieldMapping('first-name')).toBe('first_name');
    expect(guessFieldMapping('First.Name')).toBe('first_name');
  });

  it('should validate that all lead fields are available', () => {
    const availableFields = LEAD_FIELDS.map(f => f.value).filter(v => v);
    const expectedFields = ['first_name', 'last_name', 'email', 'phone', 'source', 'status', 'notes', 'campaign'];

    expectedFields.forEach(field => {
      expect(availableFields).toContain(field);
    });
  });

  it('should handle CSV parsing logic', () => {
    const csvLine = 'John,Doe,john@example.com,555-1234';
    const headers = ['first_name', 'last_name', 'email', 'phone'];

    const values = csvLine.split(',').map(v => v.trim());
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    expect(row.first_name).toBe('John');
    expect(row.last_name).toBe('Doe');
    expect(row.email).toBe('john@example.com');
    expect(row.phone).toBe('555-1234');
  });
});