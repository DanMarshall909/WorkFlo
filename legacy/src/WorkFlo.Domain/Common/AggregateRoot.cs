namespace WorkFlo.Domain.Common;

public abstract class AggregateRoot
{
    private readonly List<IDomainEvent> _uncommittedEvents = [];

    protected void AddDomainEvent(IDomainEvent domainEvent)
    {
        _uncommittedEvents.Add(domainEvent);
    }

    public IReadOnlyList<IDomainEvent> GetUncommittedEvents()
    {
        return _uncommittedEvents.AsReadOnly();
    }

    public void ClearEvents()
    {
        _uncommittedEvents.Clear();
    }
}
