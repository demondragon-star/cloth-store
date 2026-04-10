# Design Document: Application Cleanup and Upgrade

## Overview

This design outlines the approach for upgrading a React Native Expo cloth store application from SDK 50 to SDK 54, while performing comprehensive cleanup of temporary files, debug logging, and code quality improvements. The application consists of three components: User Mobile App, Admin Mobile App (both React Native), and Admin Web (Next.js), all backed by Supabase.

The upgrade process will be performed incrementally to minimize risk, with each phase validated before proceeding. The cleanup activities will be coordinated to ensure no production functionality is broken while removing technical debt.

Key considerations from [Expo SDK 54 release notes](https://expo.dev/changelog/sdk-54):
- React Native upgraded to 0.81 with React 19.1
- New Architecture is now the default (Legacy Architecture frozen)
- Edge-to-edge enabled by default on Android
- Precompiled XCFrameworks for iOS (faster builds)
- expo-file-system API changes (new API is now default)
- Xcode 26 required for iOS 26 features

## Architecture

### Component Structure

```
cloth-store-app/
├── src/                    # User & Admin Mobile App (React Native)
│   ├── components/
│   ├── screens/
│   ├── services/
│   ├── navigation/
│   └── utils/
├── admin-web/             # Admin Web Interface (Next.js)
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── middleware.ts
│   └── migrations/
├── package.json           # Mobile app dependencies
└── admin-web/package.json # Web admin dependencies
```

### Upgrade Strategy

The upgrade will follow a phased approach:

1. **Phase 1: Dependency Upgrade**
   - Upgrade Expo SDK and related packages
   - Update React Native to 0.81
   - Verify compatibility of third-party packages

2. **Phase 2: File Cleanup**
   - Remove temporary diagnostic files
   - Consolidate environment files
   - Update .gitignore

3. **Phase 3: Code Quality**
   - Implement logging strategy
   - Remove dead code
   - Clean up dependencies

4. **Phase 4: Validation**
   - Build verification
   - TypeScript validation
   - Runtime testing

## Components and Interfaces

### 1. Dependency Manager

Responsible for upgrading and managing package dependencies across all three applications.

```typescript
interface DependencyManager {
  // Upgrade Expo SDK and related packages
  upgradeExpoSDK(targetVersion: string): Promise<UpgradeResult>;
  
  // Identify and remove unused dependencies
  cleanUnusedDependencies(projectPath: string): Promise<string[]>;
  
  // Verify all imports have corresponding dependencies
  verifyDependencies(projectPath: string): Promise<ValidationResult>;
  
  // Check for duplicate dependencies across projects
  findDuplicateDependencies(): Promise<DuplicateReport>;
}

interface UpgradeResult {
  success: boolean;
  upgradedPackages: PackageInfo[];
  warnings: string[];
  errors: string[];
}

interface PackageInfo {
  name: string;
  oldVersion: string;
  newVersion: string;
}

interface ValidationResult {
  valid: boolean;
  missingDependencies: string[];
  unusedDependencies: string[];
}

interface DuplicateReport {
  duplicates: Array<{
    package: string;
    locations: string[];
    versions: string[];
  }>;
}
```

### 2. File Cleanup Manager

Handles removal of temporary files and consolidation of environment files.

```typescript
interface FileCleanupManager {
  // Remove specified temporary files
  removeTemporaryFiles(files: string[]): Promise<CleanupResult>;
  
  // Consolidate environment files
  consolidateEnvFiles(projectPath: string): Promise<EnvConsolidationResult>;
  
  // Verify .gitignore coverage
  verifyGitIgnore(projectPath: string): Promise<GitIgnoreReport>;
}

interface CleanupResult {
  removedFiles: string[];
  errors: Array<{file: string; error: string}>;
}

interface EnvConsolidationResult {
  exampleFile: string;
  requiredVariables: string[];
  removedFiles: string[];
}

interface GitIgnoreReport {
  missingPatterns: string[];
  trackedSensitiveFiles: string[];
}
```

### 3. Logging Strategy Manager

Implements proper logging strategy by removing debug logs while preserving error handling.

```typescript
interface LoggingStrategyManager {
  // Analyze logging usage across codebase
  analyzeLogging(projectPath: string): Promise<LoggingAnalysis>;
  
  // Remove debug console.log statements
  removeDebugLogs(projectPath: string): Promise<LogRemovalResult>;
  
  // Verify error handling remains intact
  verifyErrorHandling(projectPath: string): Promise<ErrorHandlingReport>;
}

interface LoggingAnalysis {
  totalLogs: number;
  debugLogs: number;
  errorLogs: number;
  warnLogs: number;
  fileBreakdown: Array<{
    file: string;
    debugCount: number;
    errorCount: number;
    warnCount: number;
  }>;
}

interface LogRemovalResult {
  filesModified: number;
  logsRemoved: number;
  logsPreserved: number;
}

interface ErrorHandlingReport {
  valid: boolean;
  missingErrorHandling: string[];
}
```

### 4. Code Quality Analyzer

Identifies and removes dead code, unused imports, and ensures code consistency.

```typescript
interface CodeQualityAnalyzer {
  // Find unused imports
  findUnusedImports(projectPath: string): Promise<UnusedImportsReport>;
  
  // Remove unused imports
  removeUnusedImports(projectPath: string): Promise<ImportCleanupResult>;
  
  // Identify duplicate code between mobile and web admin
  findDuplicateCode(): Promise<DuplicateCodeReport>;
  
  // Verify TypeScript configuration
  verifyTypeScriptConfig(projectPath: string): Promise<TypeScriptReport>;
}

interface UnusedImportsReport {
  files: Array<{
    path: string;
    unusedImports: string[];
  }>;
}

interface ImportCleanupResult {
  filesModified: number;
  importsRemoved: number;
}

interface DuplicateCodeReport {
  duplicates: Array<{
    description: string;
    mobileLocation: string;
    webLocation: string;
    recommendation: string;
  }>;
}

interface TypeScriptReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
  configIssues: string[];
}
```

### 5. Build Validator

Validates that all applications build and run correctly after changes.

```typescript
interface BuildValidator {
  // Validate mobile app builds
  validateMobileBuild(mode: 'user' | 'admin'): Promise<BuildResult>;
  
  // Validate web admin build
  validateWebBuild(): Promise<BuildResult>;
  
  // Run TypeScript compiler
  validateTypeScript(projectPath: string): Promise<TypeScriptValidation>;
  
  // Run linter
  validateLinting(projectPath: string): Promise<LintingValidation>;
}

interface BuildResult {
  success: boolean;
  buildTime: number;
  warnings: string[];
  errors: string[];
}

interface TypeScriptValidation {
  success: boolean;
  errors: Array<{
    file: string;
    line: number;
    message: string;
  }>;
}

interface LintingValidation {
  success: boolean;
  errors: string[];
  warnings: string[];
}
```

## Data Models

### Package Configuration

```typescript
interface PackageJson {
  name: string;
  version: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
}

interface ExpoConfig {
  expo: {
    name: string;
    slug: string;
    version: string;
    sdkVersion?: string;
    ios?: IOSConfig;
    android?: AndroidConfig;
    plugins?: string[];
  };
}

interface IOSConfig {
  supportsTablet: boolean;
  bundleIdentifier: string;
}

interface AndroidConfig {
  adaptiveIcon: {
    foregroundImage: string;
    backgroundColor: string;
  };
  package: string;
}
```

### Environment Configuration

```typescript
interface EnvironmentVariables {
  // Supabase configuration
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  
  // App configuration
  EXPO_PUBLIC_APP_MODE?: 'user' | 'admin';
}

interface EnvFile {
  path: string;
  variables: Record<string, string>;
  isExample: boolean;
}
```

### Upgrade Tracking

```typescript
interface UpgradeProgress {
  phase: 'dependencies' | 'cleanup' | 'quality' | 'validation';
  completedSteps: string[];
  currentStep: string;
  errors: string[];
  warnings: string[];
}
```

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Expo Package Compatibility

*For any* Expo-related package in the dependencies, after upgrading to SDK 54, the package version SHALL be compatible with Expo SDK 54.

**Validates: Requirements 1.2**

### Property 2: Plugin Compatibility Verification

*For any* plugin listed in the Expo configuration, the plugin SHALL be verified as compatible with SDK 54 before the upgrade is marked complete.

**Validates: Requirements 1.5**

### Property 3: No References to Removed Files

*For any* file that is removed during cleanup, there SHALL be no import statements or file references to that file in the remaining codebase.

**Validates: Requirements 2.9**

### Property 4: Debug Log Removal

*For any* file in the codebase, all console.log statements used for debugging SHALL be removed while console.error and console.warn statements SHALL be preserved.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 5: Error Handling Preservation

*For any* try-catch block or error handling pattern in the codebase, removing debug logs SHALL NOT remove or break the error handling logic.

**Validates: Requirements 4.4**

### Property 6: Production Logging Standards

*For any* remaining logging statement in production code, it SHALL use an appropriate log level (console.error for errors, console.warn for warnings).

**Validates: Requirements 4.6**

### Property 7: Unused Dependency Identification

*For any* package listed in dependencies or devDependencies, if the package is not imported or used anywhere in the codebase, it SHALL be identified as unused.

**Validates: Requirements 5.1**

### Property 8: Dependency Removal Safety

*For any* dependency that is removed, there SHALL be no import statements for that dependency in the codebase.

**Validates: Requirements 5.2**

### Property 9: Import Coverage

*For any* import statement in the codebase, the imported package SHALL be listed in either dependencies or devDependencies in the appropriate package.json file.

**Validates: Requirements 5.3**

### Property 10: Duplicate Dependency Detection

*For any* package that appears in multiple package.json files (mobile and web), it SHALL be identified as a duplicate dependency.

**Validates: Requirements 5.4**

### Property 11: Type Consistency

*For any* shared type or interface definition between Admin_Mobile_App and Admin_Web, the type structure SHALL be consistent across both applications.

**Validates: Requirements 6.3**

### Property 12: Unused Import Identification

*For any* import statement in a TypeScript or JavaScript file, if the imported symbol is not used in that file, it SHALL be identified as unused.

**Validates: Requirements 7.1**

### Property 13: Import Removal Safety

*For any* import that is removed, the imported symbol SHALL NOT be referenced anywhere in that file.

**Validates: Requirements 7.2**

### Property 14: Export Usage Verification

*For any* exported function or component, it SHALL be imported and used in at least one other file, or it SHALL be identified as potentially unused.

**Validates: Requirements 7.4**

### Property 15: TypeScript Compiler Options Consistency

*For any* compiler option in tsconfig.json files across projects, the option SHALL have consistent values where appropriate for the project type.

**Validates: Requirements 8.5**

### Property 16: Sensitive File Detection

*For any* file currently tracked in git, if the file contains sensitive information (environment variables, keys, credentials), it SHALL be identified and flagged.

**Validates: Requirements 9.5**

## Error Handling

### Upgrade Failures

**Scenario**: Expo SDK upgrade fails due to incompatible dependencies

**Handling**:
1. Rollback to previous package.json state
2. Log specific incompatibility errors
3. Provide recommendations for manual resolution
4. Document which packages need updates before retry

**Example**:
```typescript
try {
  await upgradeExpoSDK('54.0.0');
} catch (error) {
  if (error instanceof IncompatibilityError) {
    await rollbackPackageJson();
    logger.error('Incompatible packages found:', error.packages);
    logger.info('Recommendations:', error.recommendations);
  }
  throw error;
}
```

### File Removal Failures

**Scenario**: Cannot remove temporary file due to permissions or file in use

**Handling**:
1. Log the specific file and error
2. Continue with other file removals
3. Provide summary of files that couldn't be removed
4. Suggest manual removal steps

**Example**:
```typescript
const results = await removeTemporaryFiles(filesToRemove);
if (results.errors.length > 0) {
  logger.warn('Some files could not be removed:');
  results.errors.forEach(({file, error}) => {
    logger.warn(`  ${file}: ${error}`);
  });
  logger.info('Please remove these files manually');
}
```

### Build Failures

**Scenario**: Application fails to build after cleanup

**Handling**:
1. Capture full build error output
2. Identify which cleanup step may have caused the issue
3. Provide rollback instructions
4. Document the error for investigation

**Example**:
```typescript
const buildResult = await validateMobileBuild('user');
if (!buildResult.success) {
  logger.error('Build failed after cleanup');
  logger.error('Errors:', buildResult.errors);
  logger.info('Consider reverting the last cleanup step');
  logger.info('Run: git checkout HEAD~1');
}
```

### TypeScript Compilation Errors

**Scenario**: TypeScript compilation fails after removing imports or code

**Handling**:
1. Run TypeScript compiler to get all errors
2. Group errors by file
3. Identify if errors are due to removed imports
4. Provide specific fix recommendations

**Example**:
```typescript
const tsResult = await validateTypeScript('./');
if (!tsResult.success) {
  const errorsByFile = groupBy(tsResult.errors, 'file');
  logger.error('TypeScript compilation errors:');
  Object.entries(errorsByFile).forEach(([file, errors]) => {
    logger.error(`\n${file}:`);
    errors.forEach(err => {
      logger.error(`  Line ${err.line}: ${err.message}`);
    });
  });
}
```

### Dependency Conflicts

**Scenario**: Removing a dependency breaks other packages that depend on it

**Handling**:
1. Check peer dependencies before removal
2. Warn about potential conflicts
3. Provide option to keep dependency
4. Document the dependency chain

**Example**:
```typescript
const unusedDeps = await findUnusedDependencies('./');
for (const dep of unusedDeps) {
  const dependents = await findDependents(dep);
  if (dependents.length > 0) {
    logger.warn(`${dep} is required by: ${dependents.join(', ')}`);
    logger.warn('Keeping this dependency');
    continue;
  }
  await removeDependency(dep);
}
```

## Testing Strategy

### Dual Testing Approach

This project requires both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Together, these provide comprehensive coverage where unit tests catch concrete bugs and property tests verify general correctness.

### Property-Based Testing

We will use **fast-check** for JavaScript/TypeScript property-based testing. Each property test will:
- Run a minimum of 100 iterations
- Be tagged with a comment referencing the design property
- Tag format: `// Feature: application-cleanup-and-upgrade, Property N: [property text]`

**Example Property Test**:
```typescript
import fc from 'fast-check';

// Feature: application-cleanup-and-upgrade, Property 9: Import Coverage
test('all imports have corresponding dependencies', () => {
  fc.assert(
    fc.property(
      fc.array(fc.string()), // Generate array of import statements
      async (imports) => {
        const dependencies = await getDependencies('./package.json');
        for (const importStatement of imports) {
          const packageName = extractPackageName(importStatement);
          expect(dependencies).toContain(packageName);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing

Unit tests will focus on:

1. **Specific File Operations**
   - Test removal of each specific temporary file
   - Test .gitignore pattern additions
   - Test environment file consolidation

2. **Edge Cases**
   - Empty package.json files
   - Missing tsconfig.json files
   - Malformed import statements
   - Circular dependencies

3. **Error Conditions**
   - File permission errors
   - Network failures during package downloads
   - Invalid package versions
   - Build failures

4. **Integration Points**
   - Package manager interactions (npm, yarn)
   - Git operations
   - File system operations
   - TypeScript compiler integration

**Example Unit Test**:
```typescript
describe('FileCleanupManager', () => {
  it('should remove specific temporary file', async () => {
    const manager = new FileCleanupManager();
    const result = await manager.removeTemporaryFiles([
      'admin-web/check-env.js'
    ]);
    
    expect(result.removedFiles).toContain('admin-web/check-env.js');
    expect(fs.existsSync('admin-web/check-env.js')).toBe(false);
  });
  
  it('should handle file not found gracefully', async () => {
    const manager = new FileCleanupManager();
    const result = await manager.removeTemporaryFiles([
      'non-existent-file.js'
    ]);
    
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].file).toBe('non-existent-file.js');
  });
});
```

### Testing Phases

**Phase 1: Pre-Upgrade Testing**
- Verify current application builds successfully
- Document current dependency versions
- Capture baseline metrics (build time, bundle size)

**Phase 2: Post-Upgrade Testing**
- Verify all applications build successfully
- Run full test suite
- Compare metrics with baseline
- Test on physical devices (iOS and Android)

**Phase 3: Cleanup Validation**
- Verify all temporary files removed
- Verify no broken imports
- Verify logging strategy implemented
- Run property tests for code quality

**Phase 4: Integration Testing**
- Test user mobile app end-to-end
- Test admin mobile app end-to-end
- Test admin web interface end-to-end
- Verify Supabase integration works

### Test Environment

- **Node.js**: Version compatible with Expo SDK 54
- **Package Manager**: npm (as used in current project)
- **Testing Framework**: Jest (built into Expo)
- **Property Testing**: fast-check
- **Build Testing**: Expo CLI, Next.js CLI
- **Devices**: iOS Simulator, Android Emulator, physical devices

### Success Criteria

All tests must pass before the upgrade and cleanup is considered complete:

1. All property tests pass (100+ iterations each)
2. All unit tests pass
3. All three applications build without errors
4. TypeScript compilation succeeds with no errors
5. Linting passes with no errors
6. Manual smoke testing on devices succeeds

## Implementation Notes

### Expo SDK 54 Specific Changes

Based on the [Expo SDK 54 release notes](https://expo.dev/changelog/sdk-54), key changes to address:

1. **expo-file-system API Change**
   - The new API is now default
   - Old API available at `expo-file-system/legacy`
   - Update all imports from `expo-file-system/next` to `expo-file-system`
   - Consider migrating legacy usage to new API

2. **React Native 0.81 with React 19.1**
   - Verify compatibility with React 19.1 features
   - Test for any breaking changes in React Native 0.81

3. **New Architecture Default**
   - Legacy Architecture is frozen
   - Ensure all dependencies support New Architecture
   - Test with New Architecture enabled

4. **Edge-to-Edge Android**
   - Always enabled, cannot be disabled
   - Verify UI layouts work with edge-to-edge
   - Test safe area handling

5. **Xcode 26 Requirement**
   - Update build configuration for Xcode 26
   - Test iOS builds with new Xcode version

### Incremental Upgrade Path

Since the project is on SDK 50 and needs to reach SDK 54, consider incremental upgrades:

1. SDK 50 → SDK 51
2. SDK 51 → SDK 52
3. SDK 52 → SDK 53
4. SDK 53 → SDK 54

Each step should be validated before proceeding. However, for this project, we'll attempt a direct upgrade to SDK 54 with careful testing.

### Logging Strategy Details

**Remove**:
- `console.log('[App] Starting initialization...')`
- `console.log('[MockPayment] Processing payment:', ...)`
- `console.log('Sample product:', ...)`
- All other debug logging

**Keep**:
- `console.error('Error updating profile:', ...)`
- `console.warn('[App] Error preparing app:', ...)`
- Error handling in try-catch blocks

**Pattern**:
```typescript
// Before
console.log('[Component] Debug info:', data);

// After (remove entirely for debug logs)

// Before (error handling)
catch (error) {
  console.error('Error:', error);
}

// After (keep error handling)
catch (error) {
  console.error('Error:', error);
}
```

### Dependency Cleanup Strategy

**Analyze**:
1. Run `npx depcheck` to find unused dependencies
2. Manually verify each unused dependency
3. Check for dynamic imports that tools might miss
4. Verify peer dependencies

**Common False Positives**:
- Type-only imports (TypeScript)
- Babel plugins (used in config)
- Expo plugins (used in app.json)
- Testing utilities (used in test files)

### Git Ignore Patterns

Ensure these patterns are in .gitignore:

```gitignore
# Environment files
.env.local
.env.*.local

# Dependencies
node_modules/

# Build outputs
.next/
.expo/
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
```

## Rollback Strategy

If issues arise during upgrade or cleanup:

1. **Git-based Rollback**
   - Each phase should be committed separately
   - Use `git revert` or `git reset` to rollback
   - Tag stable points for easy reference

2. **Package Rollback**
   - Keep backup of package.json and package-lock.json
   - Use `npm ci` to restore exact dependency versions

3. **File Restoration**
   - Keep list of removed files
   - Restore from git history if needed

4. **Build Cache**
   - Clear build caches after rollback
   - Run clean builds to verify state

## Timeline Estimate

- **Phase 1 (Dependencies)**: 2-4 hours
  - Upgrade packages
  - Resolve conflicts
  - Initial build testing

- **Phase 2 (Cleanup)**: 1-2 hours
  - Remove temporary files
  - Consolidate env files
  - Update .gitignore

- **Phase 3 (Code Quality)**: 3-5 hours
  - Remove debug logs
  - Clean unused imports
  - Remove unused dependencies

- **Phase 4 (Validation)**: 2-3 hours
  - Build all applications
  - Run test suites
  - Manual testing

**Total**: 8-14 hours (depending on issues encountered)
