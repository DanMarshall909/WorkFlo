# Domain Tests Organization

This document describes the organization and patterns used in the WorkFlo domain tests, particularly the mutation testing
improvements.

## 📁 **Test Structure**

### **Core Directories**

- `Common/` - Shared test utilities, constants, and extensions
- `Unit/Sessions/` - SessionAggregate tests split by concern
- `Unit/Tasks/` - TaskAggregate and value object tests
- `Unit/Tasks/ValueObjects/` - Dedicated value object tests

### **File Organization Pattern**

**Large aggregates are split by concern:**

- `SessionAggregateCreationTests.cs` - Start method and validation
- `SessionAggregateStateTransitionTests.cs` - Pause/Resume/Complete logic
- `SessionAggregateCalculationTests.cs` - Duration and percentage calculations
- `SessionAggregateMutationTests.cs` - Specific mutation testing scenarios

**Value objects have comprehensive single files:**

- `TaskPriorityTests.cs` - All priority-related test scenarios
- `TaskComplexityTests.cs` - All complexity-related test scenarios
- `EstimatedDurationTests.cs` - All duration-related test scenarios

## 🔧 **Test Utilities**

### **TestConstants.cs**

Centralized constants to eliminate magic numbers:

```csharp
public const int MinFocusScore = 60;
public const int MaxSessionDuration = 180;
public const int PomodoroSessionDuration = 25;
```

### **TestExtensions.cs**

Fluent assertion helpers to reduce duplication:

```csharp
result.ShouldBeSuccessWithValue("because valid input should succeed");
result.ShouldBeFailureWithError("Expected error message");
dateTime.ShouldBeCloseToNow("because timing should be current");
```

### **TestBuilders.cs**

Builder pattern for complex object creation:

```csharp
var session = SessionBuilder.Default()
    .AsPomodoroSession()
    .WithNotes("Test notes")
    .Build();
```

## 🎯 **Mutation Testing Strategy**

### **Coverage Goals**

- **Value Objects:** 90%+ (achieved: TaskPriority 94.74%, TaskComplexity 90.00%, EstimatedDuration 91.43%)
- **Aggregates:** 80%+ (achieved: TaskAggregate 80.85%, SessionAggregate 71.97%)
- **Overall:** 80%+ (achieved: 80.68%)

### **Testing Patterns**

#### **1. Boundary Condition Testing**

Test exact boundaries and edge cases:

```csharp
[Theory]
[InlineData(TestConstants.MinSessionDuration)]     // Exactly at boundary
[InlineData(TestConstants.MinSessionDuration - 1)] // Just below boundary
[InlineData(TestConstants.MaxSessionDuration)]     // Exactly at boundary
[InlineData(TestConstants.MaxSessionDuration + 1)] // Just above boundary
```

#### **2. Boolean Logic Operator Testing**

Target specific logical operators:

```csharp
// Test condition: score < 1 || score > 10
TaskPriority.Create(0).IsSuccess.Should().BeFalse("because 0 < 1 is true");
TaskPriority.Create(1).IsSuccess.Should().BeTrue("because 1 < 1 is false");
TaskPriority.Create(10).IsSuccess.Should().BeTrue("because 10 > 10 is false");
TaskPriority.Create(11).IsSuccess.Should().BeFalse("because 11 > 10 is true");
```

#### **3. Arithmetic Operation Testing**

Validate Math operations and calculations:

```csharp
// Test Math.Max(60, FocusScore - 10)
session.Pause(); // Reduces focus score
session.FocusScore.ShouldBeAtMinimum(TestConstants.MinFocusScore);

// Test Math.Min(100, FocusScore + 10)
session.Complete(); // May add bonus
session.FocusScore.Should().BeLessThanOrEqualTo(TestConstants.MaxFocusScore);
```

#### **4. Switch Expression Coverage**

Ensure all cases are tested:

```csharp
[Theory]
[InlineData(SessionType.Quick, "Quick session")]
[InlineData(SessionType.Pomodoro, "Classic Pomodoro")]
[InlineData(SessionType.Focus, "Extended focus")]
[InlineData(SessionType.Deep, "Deep work")]
public void GetADHDRecommendations_covers_all_session_types(SessionType type, string expectedContent)
```

### **Domain-Focused Testing**

Tests prioritize business value over pure mutation coverage:

**✅ Good - Business Logic Focus:**

```csharp
public void Overwhelming_complexity_provides_breakdown_warning()
{
    // Tests actual ADHD user needs
    guidance.Should().Contain("SHOULD BE BROKEN DOWN",
        "because overwhelming tasks paralyze ADHD users");
}
```

**⚠️ Less Valuable - Pure Mutation Focus:**

```csharp
public void Less_than_operator_boundary_is_exclusive()
{
    // Tests implementation details rather than business requirements
}
```

## 📊 **Test Categories**

### **Fast Tests (< 100ms)**

- Value object creation and validation
- Property getter tests
- Simple calculation tests

### **Medium Tests (100ms - 1s)**

- Aggregate state transitions
- Complex business logic validation
- Event publishing tests

### **Integration Tests**

- Cross-aggregate interactions
- Time-dependent scenarios
- External dependency mocking

## 🚀 **Best Practices**

### **1. Use Constants Instead of Magic Numbers**

```csharp
// ❌ Bad
session.FocusScore.Should().Be(60);

// ✅ Good
session.FocusScore.ShouldBeAtMinimum(TestConstants.MinFocusScore);
```

### **2. Use Helper Methods for Common Patterns**

```csharp
// ❌ Bad - Repetitive
result.IsSuccess.Should().BeTrue();
result.Error.Should().BeNull();
result.Value.Should().NotBeNull();

// ✅ Good - Concise
result.ShouldBeSuccessWithValue();
```

### **3. Focus on Business Value**

```csharp
// ✅ Good - Tests domain requirements
public void Sessions_under_5_minutes_fail_for_ADHD_focus_needs()

// ⚠️ Questionable - Pure mutation targeting
public void Validates_less_than_operator_exactly()
```

### **4. Clear Test Organization**

- Group related tests in nested classes
- Use descriptive test method names
- Include domain context in assertions

## 🔄 **Maintenance Guidelines**

### **When Adding New Tests**

1. Use existing constants and helpers
2. Follow established naming conventions
3. Add business context to assertions
4. Consider test file size (split at ~500 lines)

### **When Updating Domain Logic**

1. Update corresponding constants
2. Review affected test categories
3. Maintain mutation coverage targets
4. Update this documentation if patterns change

### **Performance Considerations**

- Use `TestData` factory methods for common objects
- Avoid unnecessary object creation in loops
- Consider test categorization for CI/CD optimization

This organization ensures maintainable, readable tests that provide both business value and excellent mutation coverage
for the ADHD-focused domain logic.
