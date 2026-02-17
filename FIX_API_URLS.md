# Fix API URL Double Prefix Issue

## Problem
The axios instance in `client/src/api/axios.ts` has `baseURL` set to include `/api`:
```typescript
baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
```

But all components are calling axios with `/api/` prefix:
```typescript
axios.get('/api/patients')  // Results in: /api/api/patients ❌
```

## Solution
Remove `/api/` prefix from all axios calls in components:
```typescript
axios.get('/patients')  // Results in: /api/patients ✅
```

## Files to Fix

### Critical Files (Data Fetching):
1. ✅ Dashboard.tsx - FIXED
2. PatientManagement.tsx
3. PatientForm.tsx
4. DoctorManagement.tsx
5. DoctorForm.tsx
6. AppointmentManagement.tsx
7. LabManagement.tsx
8. BillingManagement.tsx
9. PharmacyManagement.tsx
10. EmergencyManagement.tsx
11. OCRTools.tsx
12. Sidebar.tsx

### Pattern to Replace:
- `axios.get('/api/` → `axios.get('/`
- `axios.post('/api/` → `axios.post('/`
- `axios.put('/api/` → `axios.put('/`
- `axios.delete('/api/` → `axios.delete('/`
- `axios.patch('/api/` → `axios.patch('/`

## Manual Fix Instructions

For each file, find and replace:
1. Open file in editor
2. Find: `'/api/`
3. Replace with: `'/`
4. Save file

This will fix the double `/api/api/` issue and allow data to be fetched correctly.
