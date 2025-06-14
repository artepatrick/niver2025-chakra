# Services Page Design Documentation

## Overview
This document outlines the key design patterns and characteristics of the Services page implementation, serving as a reference for maintaining consistency across similar features.

## Architecture

### Page Structure
- Uses Next.js 13+ App Router with client-side components
- Implements a modular component architecture with clear separation of concerns
- Follows the pattern of a main page component delegating to specialized components

```typescript
// page.tsx
export default async function Page() {
  return <ServicesPage />;
}
```

### Key Components

1. **ServicesPage**
   - Main container component
   - Manages global state and data fetching
   - Coordinates between child components
   - Implements pagination and filtering logic

2. **FiltersBar**
   - Handles all filtering operations
   - Implements a flexible filter system with multiple filter types
   - Uses Chakra UI components for consistent styling

3. **ServicesTable**
   - Displays data in a tabular format
   - Implements sorting and selection functionality
   - Handles row-level actions

4. **NewConversationModal**
   - Modal component for creating new conversations
   - Implements form handling and validation

## Design Patterns

### State Management
- Uses React's useState and useEffect for local state management
- Implements context providers for global state (AuthContext, HostContext)
- Follows a unidirectional data flow pattern

```typescript
const [filters, setFilters] = useState({
  ticket: false,
  attention: false,
  humanHelp: false,
  favorite: false,
});
```

### Filtering System
- Implements a composable filter system
- Supports multiple filter types:
  - Boolean filters (attention, ticket, humanHelp, favorite)
  - Sentiment filters
  - Tag-based filters
  - Operator-based filters
  - Sorting filters

```typescript
const composeFilters = useCallback(() => {
  const allFilters: any[] = [];
  if (filters.attention)
    allFilters.push({ key: 'attention', type: 'String', value: true });
  // ... other filters
  return allFilters;
}, [filters, selectedSentiment, selectedTags, selectedOperators]);
```

### UI Components
- Uses Chakra UI as the component library
- Implements custom theme configuration
- Follows a consistent color scheme:
  - Primary: Purple (purple.500, purple.600)
  - Text: Gray scale (gray.300, gray.500, gray.700)
  - Interactive elements: White/Inherit

```typescript
<Button
  size="sm"
  variant="outline"
  color={filters.attention ? 'white' : 'gray.500'}
  bgColor={filters.attention ? 'purple.500' : 'inherit'}
  borderColor={filters.attention ? 'purple.500' : 'inherit'}
  _hover={{
    bgColor: 'purple.600',
    color: 'white',
    borderColor: 'purple.600',
  }}
>
```

### Data Fetching
- Implements server-side data fetching with client-side updates
- Uses pagination for large datasets
- Implements error handling and loading states

```typescript
const fetchData = async () => {
  try {
    setIsLoadingData(true);
    const response = await fetch('/api/fly/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostId,
        avatarIds: subSlugIds,
        noCache: true,
        chunkSize: itemsPerPage,
        searchParams: composeFilters(),
      }),
    });
    // ... handle response
  } catch (error) {
    // ... error handling
  }
};
```

## Best Practices

1. **Component Organization**
   - Components are organized by feature
   - Each component has a single responsibility
   - Props are properly typed with TypeScript

2. **Error Handling**
   - Implements toast notifications for user feedback
   - Graceful error states and loading indicators
   - Proper error boundaries

3. **Performance**
   - Implements pagination for large datasets
   - Uses useCallback for memoized functions
   - Efficient state updates

4. **Accessibility**
   - Uses semantic HTML elements
   - Implements proper ARIA attributes
   - Keyboard navigation support

## Dependencies
- Next.js
- Chakra UI
- Lucide React (for icons)
- TypeScript
- React Hooks

## Theme Configuration
The application uses a custom theme with the following key characteristics:
- Purple as primary color
- Gray scale for text and borders
- Consistent spacing and sizing
- Responsive design patterns
- Custom component variants

This design system ensures consistency across the application while maintaining flexibility for different use cases.