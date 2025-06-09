# AdamantFi Design System

A comprehensive guide to the styling patterns, color system, and component design principles used throughout the AdamantFi application.

## Table of Contents

- [Color System](#color-system)
- [Typography](#typography)
- [Spacing & Layout](#spacing--layout)
- [Component Patterns](#component-patterns)
- [Input Components](#input-components)
- [Button Styles](#button-styles)
- [Table Components](#table-components)
- [Special Effects](#special-effects)
- [Responsive Design](#responsive-design)

## Color System

### Adamant Brand Colors

All colors use the `adamant-*` prefix for consistency and are defined in `tailwind.config.ts`.

#### Primary Colors

```css
/* Brand accent colors */
bg-adamant-accentText       /* #A78E5A - Primary brand gold */
bg-adamant-accentBg         /* #cfd0d2 - Light background accent */
bg-adamant-dark             /* #8A754A - Darker brand tone */
bg-adamant-contrastDark     /* #3F331D - High contrast dark */
bg-adamant-gradientBright   /* #A68C57 - Gradient start */
bg-adamant-gradientDark     /* #B59D6B - Gradient end */
bg-adamant-background       /* #151321 - Main app background */
```

#### Box & Container Colors

```css
/* Box color hierarchy (from darkest to lightest) */
bg-adamant-box-veryDark     /* #0B0B16 - Deepest containers */
bg-adamant-box-dark         /* #0C0C20 - Dark containers */
bg-adamant-box-light        /* #0D0C22 - Lighter containers */
bg-adamant-box-regular      /* #2a2835 - Standard containers */
bg-adamant-box-buttonDark   /* #100F20 - Dark button backgrounds */
bg-adamant-box-buttonLight  /* #151426 - Light button backgrounds */
bg-adamant-box-border       /* #313131 - Border color */
```

#### App-Specific Colors

```css
/* App component colors */
bg-adamant-app-box          /* #272632 - App-level boxes */
bg-adamant-app-boxHighlight /* #444a5f - Highlighted app boxes */
bg-adamant-app-input        /* #10131f - Input backgrounds */
bg-adamant-app-selectTrigger /* #232631 - Select trigger backgrounds */
bg-adamant-app-buttonDisabled /* #999ca4 - Disabled button state */
```

#### Text Colors

```css
/* Text color hierarchy */
text-adamant-text-box-main       /* #ffffff - Primary text in boxes */
text-adamant-text-box-secondary  /* #819dae - Secondary text in boxes */
text-adamant-text-form-main      /* #ffffff - Primary form text */
text-adamant-text-form-secondary /* #929499 - Secondary form text */
text-adamant-accentText          /* #A78E5A - Accent text (highlights, labels) */
```

#### Button Colors

```css
/* Button-specific colors */
bg-adamant-button-box-gradientA    /* #e9e9ea - Box button gradient start */
bg-adamant-button-box-gradientB    /* #c6c6c7 - Box button gradient end */
bg-adamant-button-form-main        /* #ffffff - Form button background */
bg-adamant-button-form-secondary   /* #232631 - Secondary form button */
text-adamant-button-box            /* #1a1836 - Box button text */
text-adamant-button-form-main      /* #000000 - Form button primary text */
text-adamant-button-form-secondary /* #ffffff - Form button secondary text */
```

### Utility Color Classes

#### Status Colors

```css
/* Success/positive states */
text-green-500, text-green-400
bg-green-500/20, border-green-500/20

/* Error/negative states */
text-red-400, text-red-500
bg-red-500/20, border-red-500/20

/* Warning states */
text-yellow-400, text-yellow-500
bg-yellow-500/20, border-yellow-500/20

/* Loading/disabled states */
text-gray-400, text-gray-500
text-white/50, text-white/70, text-white/75
bg-white/5, bg-white/10, bg-white/20
```

## Typography

### Font System

- **Primary Font**: `Inter` (defined in tailwind config)
- **Fallback**: `sans-serif`

### Text Sizing & Weight

```css
/* Headers */
text-lg font-semibold        /* Section headers */
text-xl font-semibold        /* Primary data display */
text-2xl font-light          /* Input fields */

/* Body text */
text-sm font-medium          /* Labels, secondary info */
text-xs font-medium          /* Small labels, badges */
text-base font-medium        /* Standard buttons, selectors */

/* Special formatting */
font-light                   /* Input fields, large numbers */
font-semibold               /* Important labels, headers */
font-bold                   /* Emphasized text, uppercase buttons */
tracking-wide               /* Button text, tabs */
leading-relaxed             /* Paragraph text */
leading-tight               /* Compact headers */
```

## Spacing & Layout

### Border Radius System

```css
rounded-lg      /* 8px - Small components, inputs */
rounded-xl      /* 12px - Cards, containers, buttons */
rounded-full    /* Pills, badges, indicators */
rounded-md      /* 6px - Small badges, tags */
```

### Padding & Margin

```css
/* Container padding */
p-4            /* Standard container padding */
p-6            /* Larger container padding */
px-4 py-4      /* Button padding */
px-8 py-4      /* Large button padding */
px-2 py-1      /* Small badge padding */
px-3 py-1      /* Medium badge padding */

/* Spacing */
gap-2, gap-3, gap-4    /* Flexbox gaps */
space-y-3, space-y-4   /* Vertical spacing */
mt-4, mb-4             /* Margins */
```

### Layout Patterns

```css
/* Flexbox layouts */
flex items-center justify-between    /* Header rows */
flex items-center gap-3             /* Icon + text combinations */
flex flex-col gap-4                 /* Vertical stacks */
grid grid-cols-2 gap-4             /* Two-column grids */

/* Container patterns */
max-w-7xl mx-auto                  /* Page containers */
max-w-xl mx-auto                   /* Form containers */
```

## Component Patterns

### Container Components

#### Standard Container

```css
bg-adamant-box-regular rounded-xl p-4 border border-adamant-box-border
```

#### App-level Container

```css
bg-adamant-app-box rounded-xl p-4 border border-white/5
```

#### Input Container

```css
bg-adamant-app-input/30 backdrop-blur-sm rounded-lg p-4 border border-white/5
transition-all duration-200 hover:bg-adamant-app-input/40
```

#### Highlighted Container (for rewards, staking)

```css
bg-adamant-box-dark/30 backdrop-blur-sm rounded-xl p-4 border border-adamant-accentText/20
```

### Loading States

```css
/* Skeleton loading */
bg-white/5 animate-pulse rounded

/* Loading overlays */
absolute inset-0 flex items-center
```

## Input Components

### Base Input Field

```tsx
<input
  type="text"
  className="w-full bg-transparent text-2xl font-light outline-none 
             [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none 
             [&::-webkit-inner-spin-button]:appearance-none 
             placeholder:text-gray-500/50"
  placeholder="0.0"
  data-input-id="unique-identifier"
/>
```

### Input Container Pattern

```tsx
<div
  className="bg-adamant-app-input/30 backdrop-blur-sm rounded-lg p-4 border border-white/5 
                transition-all duration-200 hover:bg-adamant-app-input/40"
>
  {/* Header with label and balance */}
  <div className="flex justify-between items-center">
    <label className="text-sm font-medium text-adamant-text-box-main">Amount</label>
    <div className="text-right">
      <div className="text-sm text-adamant-text-box-secondary">Balance</div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-adamant-text-box-main">
          {formatBalance(balance)}
        </span>
        <button
          className="text-xs text-adamant-accentText hover:text-adamant-accentText/80 
                           transition-colors"
        >
          MAX
        </button>
      </div>
    </div>
  </div>

  {/* Input row */}
  <div className="flex items-center gap-4 mt-2.5">
    <div className="relative flex-1">
      <input className="[input field classes from above]" />
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center">
          <div className="h-8 w-32 bg-white/5 animate-pulse rounded" />
        </div>
      )}
    </div>

    {/* Token selector */}
    <div
      className="flex gap-3 items-center rounded-xl text-base font-medium py-1 px-3 
                    bg-adamant-app-selectTrigger min-w-max cursor-pointer 
                    hover:bg-adamant-app-selectTrigger/80 transition-colors"
    >
      <TokenImage src={tokenIcon} size={24} />
      {tokenSymbol}
    </div>
  </div>
</div>
```

### Input Validation States

```css
/* Invalid input */
text-red-400

/* Valid input */
text-adamant-text-box-main

/* Disabled input */
text-gray-500/50
```

## Button Styles

### Primary Action Button

```tsx
<button
  className="bg-gradient-to-r from-adamant-gradientBright to-adamant-gradientDark 
                   text-black font-bold uppercase hover:from-adamant-gradientDark 
                   hover:to-adamant-gradientBright transition-all duration-300 
                   shadow-[0_0_20px_-4px_rgba(167,142,90,0.3)] py-3.5 rounded-xl"
>
  Action
</button>
```

### Form Button (Light)

```tsx
<button
  className="bg-adamant-button-form-main text-adamant-button-form-secondary 
                   hover:opacity-90 border border-adamant-box-border px-5 py-3 rounded-lg 
                   font-medium transition-all duration-200 shadow-md"
>
  Submit
</button>
```

### Secondary Button

```tsx
<button
  className="bg-adamant-button-form-secondary text-adamant-button-form-secondary 
                   border border-adamant-box-border px-4 py-3 rounded-lg font-medium 
                   hover:bg-adamant-app-boxHighlight transition-colors"
>
  Cancel
</button>
```

### Disabled Button

```tsx
<button
  className="bg-adamant-app-buttonDisabled text-adamant-app-boxHighlight 
                   cursor-not-allowed border border-adamant-box-border px-5 py-3 rounded-lg 
                   font-medium"
  disabled
>
  Disabled
</button>
```

### Icon Button

```tsx
<button className="text-white/50 hover:text-white/80 transition-colors p-2">
  <Icon className="h-4 w-4" />
</button>
```

## Table Components

### Financial Data Row

```tsx
<div className="flex justify-between text-white w-full">
  {cells.map((cell, index) => (
    <div
      key={index}
      className={cn(
        'flex-1',
        { 'text-green-500': cell.modifier === 'positive' },
        { 'text-red-500': cell.modifier === 'negative' },
        { 'font-bold': cell.bold }
      )}
      style={{ minWidth: cell.minWidth }}
    >
      {cell.content}
    </div>
  ))}
</div>
```

### Table Headers

```css
/* Common minWidth values */
minWidth: '240px'  /* Pool names */
minWidth: '160px'  /* Medium data */
minWidth: '120px'  /* Numerical data */
minWidth: '100px'  /* Compact data */
minWidth: '80px'   /* Very compact */

/* Text alignment */
text-left    /* Default alignment */
text-right   /* Numerical data */
text-center  /* Centered content */
```

## Special Effects

### Sparkly/Incentivized Components

#### Glitter Animation (from `globals.css`)

```css
.sparkle-overlay {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 25%,
    rgba(234, 179, 8, 0.05) 45%,
    rgba(234, 179, 8, 0.1) 50%,
    rgba(234, 179, 8, 0.05) 55%,
    transparent 75%
  );
  animation: glitter 6s infinite linear;
  pointer-events: none;
  mix-blend-mode: screen;
  opacity: 0.3;
  transition: opacity 0.3s, animation-duration 0.3s;
}

.sparkle-overlay-hover {
  animation-duration: 2s;
  opacity: 0.8;
  background: linear-gradient(
    45deg,
    transparent 25%,
    rgba(253, 224, 71, 0.1) 45%,
    rgba(253, 224, 71, 0.3) 50%,
    rgba(253, 224, 71, 0.1) 55%,
    transparent 75%
  );
}

@keyframes glitter {
  0% {
    transform: translateX(-50%) translateY(-50%);
  }
  100% {
    transform: translateX(-50%) translateY(-60%);
  }
}

@keyframes sparkle {
  0% {
    opacity: 0;
    transform: translateY(0) scale(0);
  }
  50% {
    opacity: 1;
    transform: translateY(-10px) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-20px) scale(0);
  }
}

.animate-sparkle {
  animation: sparkle 2.5s infinite;
}
```

#### Sparkly Button

```tsx
<button
  className="px-4 py-3 border-2 rounded-lg font-semibold flex gap-2 items-center 
                   relative transition-all duration-300 overflow-hidden transform hover:scale-105
                   border-yellow-300 text-yellow-300 bg-gradient-to-br from-yellow-900/20 to-yellow-800/20"
>
  {/* Glittery overlay */}
  <div className="absolute inset-0 sparkle-overlay sparkle-overlay-hover"></div>

  {/* Star particles */}
  {Array.from({ length: 24 }, (_, i) => (
    <div
      key={i}
      className="absolute w-[2px] h-[2px] bg-yellow-500/50 rounded-full animate-sparkle"
      style={{
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        animationDelay: `${i * 0.2}s`,
        opacity: 0.8,
      }}
    />
  ))}

  <Icon className="w-5 h-5" />
  <span>Incentivized</span>
</button>
```

#### Sparkly Tab

```tsx
<Tabs.Trigger
  className="flex-1 bg-adamant-app-box-lighter px-4 py-4 rounded-xl text-white/75
                         data-[state=active]:text-black data-[state=active]:bg-gradient-to-br 
                         data-[state=active]:from-yellow-300/90 data-[state=active]:to-amber-400/90
                         hover:bg-white/5 transition-all duration-300 font-medium tracking-wide
                         relative overflow-hidden transform hover:scale-105
                         data-[state=active]:border-2 data-[state=active]:border-yellow-300/50"
>
  {/* Glittery overlay */}
  <div className="absolute inset-0 sparkle-overlay" />

  {/* Star particles */}
  {Array.from({ length: 16 }, (_, i) => (
    <div
      key={i}
      className="absolute w-[1.5px] h-[1.5px] bg-yellow-400/60 rounded-full animate-sparkle"
      style={{
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        animationDelay: `${i * 0.3}s`,
      }}
    />
  ))}

  {children}
</Tabs.Trigger>
```

### Reward/Badge Components

```tsx
{
  /* Reward indicator badge */
}
<div
  className="flex items-center gap-1 bg-gradient-to-r from-yellow-500/20 to-amber-600/20 
                px-2 py-1 rounded-full border border-yellow-500/20"
>
  <Sparkles className="w-3 h-3 text-yellow-400" />
  <span className="text-xs font-medium text-yellow-400">Rewards</span>
</div>;

{
  /* Static status indicator */
}
<div className="w-2 h-2 bg-adamant-accentText rounded-full"></div>;

{
  /* LP balance badge */
}
<div
  className="flex items-center gap-1 bg-gradient-to-r from-yellow-500/20 to-amber-600/20 
                px-2 py-1 rounded-md border border-yellow-500/20"
>
  <span className="text-xs font-medium text-yellow-400">{balance.toFixed(2)} LP</span>
</div>;
```

### Motion Effects (Framer Motion)

```tsx
import { motion } from 'framer-motion';

{
  /* Button with hover/tap effects */
}
<motion.button
  className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700"
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
  Click me
</motion.button>;

{
  /* Staggered list animations */
}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.1 }}
>
  List item
</motion.div>;
```

## Responsive Design

### Breakpoint System

```css
/* Tailwind breakpoints (from config) */
xs: '375px'
sm: '640px'
md: '768px'
lg: '1024px'
xl: '1280px'
2xl: '1440px'
3xl: '1920px'
4xl: '2560px'
```

### Common Responsive Patterns

```css
/* Container sizing */
max-w-full md:max-w-xl mx-auto        /* Form containers */
max-w-7xl mx-auto                     /* Page containers */

/* Grid layouts */
grid grid-cols-1 md:grid-cols-2       /* Responsive grids */
flex flex-col md:flex-row             /* Responsive flex direction */

/* Text sizing */
text-sm md:text-base                  /* Responsive text */
text-xl md:text-2xl                   /* Responsive headers */

/* Spacing adjustments */
px-2.5 md:px-4                        /* Responsive padding */
gap-2 md:gap-4                        /* Responsive gaps */
```

## Toast/Notification System

### Custom Toast Component

```tsx
<div
  className="relative bg-gradient-to-r from-green-600/90 to-emerald-600/90 
                border border-green-500/30 rounded-xl p-4 backdrop-blur-sm 
                min-w-[320px] max-w-[480px] shadow-lg shadow-black/20"
>
  {/* Background overlay */}
  <div className="absolute inset-0 bg-adamant-app-box/40 rounded-xl" />

  {/* Content */}
  <div className="relative flex items-start gap-3">
    <div className="flex-shrink-0 text-green-400">
      <Icon className="h-5 w-5" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-medium text-green-100 text-sm leading-tight">Success message</div>
      <div className="text-white/70 text-xs mt-1 leading-relaxed">Additional details</div>
    </div>
  </div>
</div>
```

## Best Practices

### Color Usage

1. **Always use `adamant-*` colors** for brand consistency
2. **Use semantic color modifiers** (`/20`, `/30`, `/50`, `/70`, `/80`) for transparency
3. **Pair colors logically**: dark backgrounds with light text, light backgrounds with dark text
4. **Use gradient combinations** for primary actions and highlights

### Component Composition

1. **Layer containers** from darkest to lightest: `veryDark` → `dark` → `regular` → `light`
2. **Use backdrop blur** (`backdrop-blur-sm`) for modern glass-morphism effects
3. **Apply consistent padding**: `p-4` for standard containers, `p-6` for larger ones
4. **Add subtle borders** with `border border-white/5` or `border border-adamant-box-border`

### Interactive States

1. **Always include hover states** with `hover:` classes
2. **Use transitions** with `transition-all duration-200` or `transition-colors`
3. **Apply loading states** with skeleton loaders (`bg-white/5 animate-pulse`)
4. **Disable interactions properly** with `cursor-not-allowed` and disabled styling

### Accessibility

1. **Use semantic HTML** elements where possible
2. **Include proper ARIA labels** and roles
3. **Ensure color contrast** meets accessibility standards
4. **Support keyboard navigation** with focus states

### Performance

1. **Use CSS classes** instead of inline styles where possible
2. **Leverage Tailwind's optimization** by using standard utility classes
3. **Minimize custom CSS** in favor of utility classes
4. **Use appropriate loading strategies** for heavy components

## Implementation Guidelines

When implementing new components:

1. **Start with existing patterns** - reference this document and existing components
2. **Use the `INPUT_STYLES` constants** for input components (from `inputStyles.ts`)
3. **Follow the container hierarchy** for proper visual depth
4. **Test responsive behavior** across all breakpoints
5. **Implement loading and error states** for all data-dependent components
6. **Add appropriate animations** using Framer Motion for enhanced UX

This design system ensures consistency, maintainability, and a cohesive user experience across the entire AdamantFi application.
