using FluentAssertions;
using WorkFlo.Application.Services;
using WorkFlo.Domain.Common;

namespace WorkFlo.Application.Tests.Services;

public class TddStateServiceTests
{
    private readonly ITddStateService _service;

    public TddStateServiceTests()
    {
        _service = new TddStateService();
    }

    [Fact]
    public async Task new_feature_starts_with_no_phaseAsync()
    {
        // Act
        var result = await _service.GetCurrentPhaseAsync("new-feature");

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be(TddPhase.None);
    }

    [Fact]
    public async Task can_set_feature_to_red_phaseAsync()
    {
        // Act
        var setResult = await _service.SetPhaseAsync("test-feature", TddPhase.Red);
        var getResult = await _service.GetCurrentPhaseAsync("test-feature");

        // Assert
        setResult.IsSuccess.Should().BeTrue();
        getResult.IsSuccess.Should().BeTrue();
        getResult.Value.Should().Be(TddPhase.Red);
    }

    [Fact]
    public async Task valid_phase_transition_from_red_to_green_succeedsAsync()
    {
        // Arrange
        await _service.SetPhaseAsync("test-feature", TddPhase.Red);

        // Act
        var result = await _service.ValidatePhaseTransitionAsync("test-feature", TddPhase.Red, TddPhase.Green);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().BeTrue();
    }

    [Fact]
    public async Task invalid_phase_transition_from_red_to_cover_failsAsync()
    {
        // Arrange
        await _service.SetPhaseAsync("test-feature", TddPhase.Red);

        // Act
        var result = await _service.ValidatePhaseTransitionAsync("test-feature", TddPhase.Red, TddPhase.Cover);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().BeFalse();
    }

    [Fact]
    public async Task clearing_feature_state_removes_phase_trackingAsync()
    {
        // Arrange
        await _service.SetPhaseAsync("test-feature", TddPhase.Green);

        // Act
        var clearResult = await _service.ClearFeatureStateAsync("test-feature");
        var getResult = await _service.GetCurrentPhaseAsync("test-feature");

        // Assert
        clearResult.IsSuccess.Should().BeTrue();
        getResult.IsSuccess.Should().BeTrue();
        getResult.Value.Should().Be(TddPhase.None);
    }
}
