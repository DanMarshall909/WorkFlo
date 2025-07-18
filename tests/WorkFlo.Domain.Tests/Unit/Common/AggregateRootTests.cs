using WorkFlo.Domain.Common;
using FluentAssertions;

namespace WorkFlo.Domain.Tests.Unit.Common;

/// <summary>
/// Unit tests for AggregateRoot base class
/// Tests domain event management functionality
/// </summary>
public class AggregateRootTests
{
    // Test implementation of AggregateRoot for testing purposes
    private class TestAggregate : AggregateRoot
    {
        public void AddTestEvent(IDomainEvent domainEvent)
        {
            AddDomainEvent(domainEvent);
        }
    }

    // Test implementation of IDomainEvent for testing purposes
    private record TestDomainEvent : IDomainEvent
    {
        public Guid EventId { get; } = Guid.NewGuid();
        public DateTime OccurredAt { get; } = DateTime.UtcNow;
    }

    [Fact]
    public void GetUncommittedEvents_when_no_events_added_returns_empty_list()
    {
        // Arrange
        var aggregate = new TestAggregate();

        // Act
        var events = aggregate.GetUncommittedEvents();

        // Assert
        events.Should().NotBeNull();
        events.Should().BeEmpty();
    }

    [Fact]
    public void AddDomainEvent_stores_event_in_uncommitted_list()
    {
        // Arrange
        var aggregate = new TestAggregate();
        var testEvent = new TestDomainEvent();

        // Act
        aggregate.AddTestEvent(testEvent);
        var events = aggregate.GetUncommittedEvents();

        // Assert
        events.Should().HaveCount(1);
        events.Should().Contain(testEvent);
    }

    [Fact]
    public void AddDomainEvent_when_multiple_events_stores_all_in_order()
    {
        // Arrange
        var aggregate = new TestAggregate();
        var event1 = new TestDomainEvent();
        var event2 = new TestDomainEvent();

        // Act
        aggregate.AddTestEvent(event1);
        aggregate.AddTestEvent(event2);
        var events = aggregate.GetUncommittedEvents();

        // Assert
        events.Should().HaveCount(2);
        events[0].Should().Be(event1);
        events[1].Should().Be(event2);
    }

    [Fact]
    public void GetUncommittedEvents_returns_readonly_list()
    {
        // Arrange
        var aggregate = new TestAggregate();
        var testEvent = new TestDomainEvent();
        aggregate.AddTestEvent(testEvent);

        // Act
        var events = aggregate.GetUncommittedEvents();

        // Assert
        events.Should().BeAssignableTo<IReadOnlyList<IDomainEvent>>();
    }

    [Fact]
    public void ClearEvents_removes_all_uncommitted_events()
    {
        // Arrange
        var aggregate = new TestAggregate();
        var event1 = new TestDomainEvent();
        var event2 = new TestDomainEvent();
        aggregate.AddTestEvent(event1);
        aggregate.AddTestEvent(event2);

        // Act
        aggregate.ClearEvents();
        var events = aggregate.GetUncommittedEvents();

        // Assert
        events.Should().BeEmpty();
    }

    [Fact]
    public void ClearEvents_when_no_events_does_not_throw()
    {
        // Arrange
        var aggregate = new TestAggregate();

        // Act & Assert
        var action = () => aggregate.ClearEvents();
        action.Should().NotThrow();

        var events = aggregate.GetUncommittedEvents();
        events.Should().BeEmpty();
    }
}
