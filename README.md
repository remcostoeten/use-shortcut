# Beautiful Code Block Component - Usage Guide

## Overview

This is a feature-rich, customizable code display component for React/Next.js applications with syntax highlighting, search functionality, keyboard shortcuts, and custom badges. It's designed to be the most beautiful and performant code block component available.

## Features

- ✅ Syntax highlighting for 100+ languages
- ✅ Interactive search with Cmd/Ctrl+F
- ✅ Line highlighting and click callbacks
- ✅ Copy to clipboard with Cmd/Ctrl+C
- ✅ Collapsible code blocks with smooth animations
- ✅ Custom badge system with variants and auto-scroll
- ✅ Keyboard shortcuts and accessibility support
- ✅ Multi-file code blocks with tabs
- ✅ Diff/code comparison blocks
- ✅ Dark/light mode support
- ✅ Responsive design with Tailwind CSS

## Installation

### Required Dependencies

```bash
bun add framer-motion lucide-react react-syntax-highlighter clsx
```

### Optional Dependencies (for full functionality)

```bash
bun add -D @types/react @types/react-dom
```

### Setup

You can access the component files directly from GitHub without cloning the repo:

**Main Component Files:**
- `code-block.tsx` - https://raw.githubusercontent.com/remcostoeten/react-beautiful-featurerich-codeblock/master/src/components/code-block.tsx
- `language-icons.tsx` - https://raw.githubusercontent.com/remcostoeten/react-beautiful-featurerich-codeblock/master/src/components/language-icons.tsx
- `multi-file-code-block.tsx` - https://raw.githubusercontent.com/remcostoeten/react-beautiful-featurerich-codeblock/master/src/components/multi-file-code-block.tsx
- `diff-code-block.tsx` - https://raw.githubusercontent.com/remcostoeten/react-beautiful-featurerich-codeblock/master/src/components/diff-code-block.tsx
- `cn.ts` (utility) - https://raw.githubusercontent.com/remcostoeten/react-beautiful-featurerich-codeblock/master/src/helpers/cn.ts

**Quick Setup:**
```bash
# Download the main component
curl -o components/code-block.tsx https://raw.githubusercontent.com/remcostoeten/react-beautiful-featurerich-codeblock/master/src/components/code-block.tsx

# Download language icons
curl -o components/language-icons.tsx https://raw.githubusercontent.com/remcostoeten/react-beautiful-featurerich-codeblock/master/src/components/language-icons.tsx

# Download utility function
mkdir -p helpers
curl -o helpers/cn.ts https://raw.githubusercontent.com/remcostoeten/react-beautiful-featurerich-codeblock/master/src/helpers/cn.ts
```

1. Copy the component files to your project using the links above
2. Ensure you have Tailwind CSS configured in your project

## Complete Code Examples

### Full Component Code (for reference)

If you want to see the complete implementation, you can view the raw files:

- **Main CodeBlock Component**: https://raw.githubusercontent.com/remcostoeten/react-beautiful-featurerich-codeblock/master/src/components/code-block.tsx
- **Language Icons**: https://raw.githubusercontent.com/remcostoeten/react-beautiful-featurerich-codeblock/master/src/components/language-icons.tsx
- **Multi-File Component**: https://raw.githubusercontent.com/remcostoeten/react-beautiful-featurerich-codeblock/master/src/components/multi-file-code-block.tsx
- **Diff Component**: https://raw.githubusercontent.com/remcostoeten/react-beautiful-featurerich-codeblock/master/src/components/diff-code-block.tsx
- **Utility Function**: https://raw.githubusercontent.com/remcostoeten/react-beautiful-featurerich-codeblock/master/src/helpers/cn.ts

## Basic Usage

### Simple Code Block

```tsx
import { CodeBlock } from './components/code-block';

function MyComponent() {
  const code = `function hello(name) {
  console.log(\`Hello, \${name}!\`);
}

hello('World');`;

  return (
    <CodeBlock
      code={code}
      language="javascript"
      fileName="example.js"
    />
  );
}
```

### Advanced Code Block with All Features

```tsx
import { CodeBlock } from './components/code-block';

function AdvancedExample() {
  const code = `async function fetchUserData(userId) {
  try {
    const response = await fetch(\`https://api.example.com/users/\${userId}\`);
    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }
    const userData = await response.json();
    return userData;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}`;

  const badges = [
    { text: 'Async', variant: 'primary' },
    { text: 'Error Handling', variant: 'success' },
    { text: 'API', variant: 'warning' }
  ];

  return (
    <CodeBlock
      code={code}
      language="javascript"
      fileName="api-service.js"
      badges={badges}
      showLineNumbers={true}
      enableLineHighlight={true}
      enableLineHover={true}
      showMetaInfo={true}
      maxHeight="500px"
      showIcon={true}
      onCopy={(copiedCode) => console.log('Code copied:', copiedCode)}
      onLineClick={(lineNumber) => console.log('Line clicked:', lineNumber)}
      onSearch={(query, results) => console.log('Search:', query, results)}
    />
  );
}
```

### Multi-File Code Block

```tsx
import { MultiFileCodeBlock } from './components/multi-file-code-block';

function MultiFileExample() {
  const files = [
    {
      name: 'utils.js',
      language: 'javascript',
      code: `export function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}`,
      badges: [{ text: 'Utility', variant: 'secondary' }]
    },
    {
      name: 'api.js',
      language: 'javascript',
      code: `import { formatDate } from './utils.js';

export async function fetchPosts() {
  const response = await fetch('/api/posts');
  return response.json();
}`,
      badges: [{ text: 'API', variant: 'primary' }]
    }
  ];

  return (
    <MultiFileCodeBlock
      files={files}
      showLineNumbers={true}
      enableLineHighlight={true}
      maxHeight="400px"
      showIcon={true}
    />
  );
}
```

### Diff Code Block

```tsx
import { DiffCodeBlock } from './components/diff-code-block';

function DiffExample() {
  const oldCode = `function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}`;

  const newCode = `function calculateTotal(items) {
  return items.reduce((total, item) => total + item.price, 0);
}`;

  return (
    <DiffCodeBlock
      fileName="calculator.js"
      oldCode={oldCode}
      newCode={newCode}
      language="javascript"
      maxHeight="300px"
    />
  );
}
```

## Props Reference

### CodeBlock Props

```typescript
type TCodeBlockProps = {
  // Required
  code: string;                    // The source code to display
  language: string;                 // Programming language for syntax highlighting

  // Optional
  fileName?: string;                // File name to display in header
  badges?: TBadge[];               // Array of badges to display
  showLineNumbers?: boolean;        // Show line numbers (default: true)
  enableLineHighlight?: boolean;    // Enable interactive line highlighting (default: false)
  enableLineHover?: boolean;       // Enable hover highlighting (default: false)
  hoverHighlightColor?: string;     // Custom hover highlight color
  showMetaInfo?: boolean;          // Show metadata like line count (default: true)
  maxHeight?: string;               // Max height before scrolling (default: "400px")
  className?: string;               // Additional CSS classes
  onCopy?: (code: string) => void;  // Callback when code is copied
  onLineClick?: (lineNumber: number) => void; // Callback when line is clicked
  onSearch?: (query: string, results: number[]) => void; // Search callback
  badgeVariant?: TBadgeVariant;     // Default badge variant
  badgeColor?: string;              // Custom badge color
  fileNameColor?: string;          // Custom file name color
  initialSearchQuery?: string;      // Initial search query
  initialSearchResults?: number[];  // Initial search results
  initialHighlightedLines?: number[]; // Initial highlighted lines
  autoScrollSpeed?: number;         // Badge auto-scroll speed (default: 20)
  enableAutoScroll?: boolean;       // Enable badge auto-scroll (default: true)
  showIcon?: boolean;               // Show language icon (default: false)
  showBottomFade?: boolean;         // Show bottom fade effect (default: true)
  width?: string;                   // Custom width
  height?: string;                  // Custom height
  resizable?: boolean;              // Enable resizing (default: false)
  resizeStorageKey?: string;        // Storage key for resize (default: 'codeblock-resize')
  disableSearch?: boolean;          // Disable search (default: false)
  disableCopy?: boolean;            // Disable copy (default: false)
  disableTopBar?: boolean;          // Disable top bar (default: false)
};
```

### Badge Types

```typescript
type TBadge = {
  text: string;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'custom';
};
```

### MultiFileCodeBlock Props

```typescript
type TMultiFileCodeBlockProps = {
  files: TFile[];                   // Array of files to display
  className?: string;
  showLineNumbers?: boolean;
  enableLineHighlight?: boolean;
  enableLineHover?: boolean;
  maxHeight?: string;
  showInnerFileName?: boolean;
  showMetaInfo?: boolean;
  showIcon?: boolean;
};

type TFile = {
  name: string;
  code: string;
  language: string;
  badges?: TBadge[];
};
```

### DiffCodeBlock Props

```typescript
type TDiffCodeBlockProps = {
  fileName?: string;
  oldCode: string;
  newCode: string;
  language: string;
  className?: string;
  maxHeight?: string;
  showBottomFade?: boolean;
  width?: string;
  height?: string;
};
```

## Keyboard Shortcuts

- `Cmd/Ctrl + F` - Open search
- `Cmd/Ctrl + C` - Copy code to clipboard
- `Escape` - Close search
- `Enter` - Navigate to next search result
- `Shift + Enter` - Navigate to previous search result

## Supported Languages

The component supports 100+ languages through `react-syntax-highlighter`, including:

- JavaScript/TypeScript
- Python
- Java
- C/C++/C#
- Go
- Rust
- PHP
- Ruby
- Swift
- Kotlin
- SQL
- HTML/CSS
- JSON/XML
- YAML
- Markdown
- And many more...

## Styling and Customization

### Custom Themes

The component includes built-in light and dark themes that automatically adapt to your app's theme. You can customize colors by modifying the CSS variables or passing custom colors via props.

### Custom Badge Colors

```tsx
const badges = [
  { text: 'Custom', variant: 'custom', customColor: '#ff6b6b' }
];
```

### Custom CSS Classes

```tsx
<CodeBlock
  code={code}
  language="javascript"
  className="my-custom-codeblock"
  fileNameColor="text-blue-600"
/>
```

## Performance Tips

1. Use `memo()` for parent components that pass code props
2. For large code blocks, consider setting a reasonable `maxHeight` 
3. Disable features you don't need (e.g., `disableSearch={true}`)
4. Use `enableAutoScroll={false}` for better performance with many badges

## Accessibility

- Full keyboard navigation support
- Screen reader compatible
- ARIA labels and descriptions
- High contrast mode support
- Focus management for interactive elements

## Troubleshooting

### Common Issues

1. **Syntax highlighting not working**: Ensure the language string is correct (e.g., 'javascript' not 'js')
2. **Icons not showing**: Make sure `lucide-react` is installed
3. **Styling issues**: Ensure Tailwind CSS is properly configured
4. **Performance issues**: Disable unused features or use memoization

### Getting Help

- Check the component source code for detailed implementation
- Ensure all dependencies are installed
- Verify your Tailwind CSS configuration

## License

This component is provided as-is for use in your projects. Please refer to the licenses of the dependencies used.