# Project Structure Documentation

## 🏗️ **Model Implementation Pattern**

This document outlines the step-by-step process for implementing new models in the project, following the established pattern.

## 📋 **Implementation Steps**

### **Step 1: Create Prisma Schema Model**

- Add new model to `prisma/schema.prisma`
- Define all fields, relations, and indexes
- Run `npx prisma generate` to update Prisma client

### **Step 2: Create Type Definitions**

- Create file: `types/models/[model-name].ts`
- Define interfaces, schemas, and types
- Include form field configurations
- Define filter and search parameters

### **Step 3: Create Custom Hooks**

- Create file: `hooks/employee-hooks/use-[model-name].ts`
- Implement CRUD operations using `createQueryHook` and `createMutationHook`
- Handle data transformations and API calls

### **Step 4: Create API Route**

- Create file: `app/api/employee/[model-name]/route.ts`
- Use `createEmployeeModelRoutes` utility
- Configure permissions, relations, and field configs
- Add custom hooks for beforeCreate, beforeUpdate, etc.

### **Step 5: Create Table Columns**

- Create file: `components/columns/[model-name]-table-columns.tsx`
- Define column structure with render functions
- Include action buttons and custom cell renderers
- Handle permissions and user interactions

### **Step 6: Create Dialog Components**

- **Create Dialog**: `components/dialogs/[model-name]/create-[model-name]-dialog.tsx`
- **Filter Dialog**: `components/dialogs/[model-name]/filter-[model-name]-dialog.tsx`
- **Update Dialog**: `components/dialogs/[model-name]/update-[model-name]-dialog.tsx`
- **View Dialog**: `components/dialogs/[model-name]/view-[model-name]-dialog.tsx`

### **Step 7: Create Page Component**

- Create file: `app/dashboard/[model-name]/page.tsx`
- Use `useModelOperations` hook for state management
- Integrate all dialogs and table components
- Handle CRUD operations and user interactions

## 🔄 **File Dependencies Flow**

```
Schema → Types → Hooks → Route → Columns → Dialogs → Page
  ↓        ↓      ↓      ↓       ↓        ↓       ↓
Prisma → Zod → React → API → Table → Forms → UI
```

## 📁 **File Structure Example**

```
project/
├── prisma/
│   └── schema.prisma          # Step 1: Database model
├── types/models/
│   └── [model-name].ts        # Step 2: Type definitions
├── hooks/employee-hooks/
│   └── use-[model-name].ts    # Step 3: Custom hooks
├── app/api/employee/
│   └── [model-name]/
│       └── route.ts           # Step 4: API route
├── components/columns/
│   └── [model-name]-table-columns.tsx  # Step 5: Table columns
├── components/dialogs/
│   └── [model-name]/
│       ├── create-[model-name]-dialog.tsx    # Step 6a: Create
│       ├── filter-[model-name]-dialog.tsx    # Step 6b: Filter
│       ├── update-[model-name]-dialog.tsx    # Step 6c: Update
│       └── view-[model-name]-dialog.tsx      # Step 6d: View
└── app/dashboard/
    └── [model-name]/
        └── page.tsx           # Step 7: Main page
```

## 🎯 **Key Principles**

1. **Consistency**: Follow the same pattern for all models
2. **Reusability**: Use utility functions like `createEmployeeModelRoutes`
3. **Type Safety**: Leverage TypeScript and Zod for validation
4. **Permissions**: Always implement proper permission checks
5. **Internationalization**: Support multiple languages (en, ar, ckb)
6. **Responsive Design**: Ensure mobile-friendly interfaces

## 🚀 **Next Implementation: Page Layout System**

Following this pattern, we will implement:

- **Model**: PageLayout, PageSection, SectionComponent
- **Purpose**: Make portfolio page layout configurable and dynamic
- **Benefits**: No-code layout changes, admin control, A/B testing
