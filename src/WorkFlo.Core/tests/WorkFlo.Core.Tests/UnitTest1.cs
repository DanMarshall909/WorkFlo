using System.IO;
using System.Text;

namespace WorkFlo.Core.Tests;

public class UnitTest1
{
    [Fact]
    public void Test1()
    {

    }
}

public class FloTddIntegrationTests
{
    [Fact(DisplayName = "Remove delegation from flo to tdd script and implement TDD functionality directly in flo")]
    [Trait("AcceptanceTest", "#175")]
    [Trait("Given", "flo script exists with TDD commands")]
    [Trait("When", "TDD commands are executed via flo")]
    [Trait("Then", "they should execute directly without delegating to external tdd script")]
    public void flo_commands_execute_tdd_functionality_directly()
    {
        // Given: flo script exists and has TDD commands
        var floScriptPath = "/home/dan/code/WorkFlo/flo";
        Assert.True(File.Exists(floScriptPath), $"flo script should exist at {floScriptPath}");
        
        // When: we examine the flo script content
        var floContent = File.ReadAllText(floScriptPath);
        
        // Then: it should not delegate to external tdd script
        var delegationPattern = "PROJECT_TYPE=\"$project_type\" \"$SCRIPT_DIR/tdd\"";
        Assert.False(floContent.Contains(delegationPattern), 
            "flo script should not delegate to external tdd script - TDD functionality should be implemented directly in flo");
    }
}
