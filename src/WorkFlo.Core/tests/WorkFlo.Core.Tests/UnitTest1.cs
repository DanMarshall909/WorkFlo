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

    [Fact(DisplayName = "Ensure all existing tdd commands work identically under flo")]
    [Trait("AcceptanceTest", "#175")]
    [Trait("Given", "flo script has TDD commands implemented")]
    [Trait("When", "all TDD commands are available via flo")]
    [Trait("Then", "they should work identically to the original tdd commands")]
    public void all_existing_tdd_commands_work_identically_under_flo()
    {
        // Given: flo script exists and has TDD commands implemented
        var floScriptPath = "/home/dan/code/WorkFlo/flo";
        Assert.True(File.Exists(floScriptPath), $"flo script should exist at {floScriptPath}");
        
        var floContent = File.ReadAllText(floScriptPath);
        
        // When: we check for all required TDD commands
        var requiredCommands = new[] { "start", "red", "green", "refactor", "cover", "next", "status" };
        
        // Then: all commands should be implemented as functions in flo
        foreach (var command in requiredCommands)
        {
            var functionPattern = $"tdd_{command}()";
            Assert.True(floContent.Contains(functionPattern, StringComparison.Ordinal), 
                $"flo script should contain function {functionPattern} for command '{command}'");
            
            // And: they should not delegate to external tdd script
            var commandBlock = ExtractFunctionBlock(floContent, $"tdd_{command}");
            Assert.False(string.IsNullOrEmpty(commandBlock), $"Function tdd_{command} should have implementation");
            Assert.False(commandBlock.Contains("\"$SCRIPT_DIR/tdd\"", StringComparison.Ordinal), 
                $"tdd_{command} function should not delegate to external tdd script");
                
            // And: they should have full TDD workflow functionality
            if (command == "red" || command == "green" || command == "cover")
            {
                Assert.True(commandBlock.Contains("run-tests", StringComparison.Ordinal),
                    $"TDD command {command} should call test execution");
            }
            
            if (command == "start")
            {
                Assert.True(commandBlock.Contains("gh issue view", StringComparison.Ordinal),
                    $"TDD start command should validate GitHub issue");
            }
        }
        
        // And: flo should provide identical command interface mapping
        var commandMappings = new Dictionary<string, string>
        {
            {"start", "tdd_start"},
            {"red", "tdd_red"},
            {"green", "tdd_green"},
            {"refactor", "tdd_refactor"},
            {"cover", "tdd_cover"},
            {"next", "tdd_next"},
            {"status", "tdd_status"}
        };
        
        foreach (var mapping in commandMappings)
        {
            var casePattern = $"{mapping.Key})";
            Assert.True(floContent.Contains(casePattern, StringComparison.Ordinal),
                $"flo script should handle case '{mapping.Key}' in command dispatcher");
                
            var callPattern = $"{mapping.Value}";
            var contextAroundCase = ExtractCaseBlock(floContent, mapping.Key);
            Assert.True(contextAroundCase.Contains(callPattern, StringComparison.Ordinal),
                $"flo case '{mapping.Key}' should call function '{mapping.Value}'");
        }
    }
    
    private string ExtractFunctionBlock(string content, string functionName)
    {
        var startPattern = $"{functionName}() {{";
        var startIndex = content.IndexOf(startPattern, StringComparison.Ordinal);
        if (startIndex == -1) return "";
        
        var braceCount = 0;
        var inFunction = false;
        var result = new StringBuilder();
        
        for (int i = startIndex; i < content.Length; i++)
        {
            var c = content[i];
            result.Append(c);
            
            if (c == '{')
            {
                braceCount++;
                inFunction = true;
            }
            else if (c == '}' && inFunction)
            {
                braceCount--;
                if (braceCount == 0)
                {
                    break;
                }
            }
        }
        
        return result.ToString();
    }
    
    private string ExtractCaseBlock(string content, string caseValue)
    {
        var casePattern = $"{caseValue})";
        var startIndex = content.IndexOf(casePattern, StringComparison.Ordinal);
        if (startIndex == -1) return "";
        
        // Find the next case or end of case statement
        var endMarkers = new[] { ";;", "esac" };
        var endIndex = content.Length;
        
        foreach (var marker in endMarkers)
        {
            var markerIndex = content.IndexOf(marker, startIndex + casePattern.Length, StringComparison.Ordinal);
            if (markerIndex != -1 && markerIndex < endIndex)
            {
                endIndex = markerIndex + marker.Length;
            }
        }
        
        return content.Substring(startIndex, endIndex - startIndex);
    }

    [Fact(DisplayName = "Maintain backward compatibility for existing TDD state management")]
    [Trait("AcceptanceTest", "#175")]
    [Trait("Given", "existing TDD state management uses .tdd-state file")]
    [Trait("When", "flo TDD commands manage state")]
    [Trait("Then", "they should maintain backward compatibility with existing state format")]
    public void flo_maintains_backward_compatibility_for_existing_tdd_state_management()
    {
        // Given: flo script exists and has TDD state management
        var floScriptPath = "/home/dan/code/WorkFlo/flo";
        Assert.True(File.Exists(floScriptPath), $"flo script should exist at {floScriptPath}");
        
        var floContent = File.ReadAllText(floScriptPath);
        
        // When: we check for state management compatibility
        // Then: flo should use the same .tdd-state file format
        Assert.True(floContent.Contains(".tdd-state", StringComparison.Ordinal),
            "flo should use .tdd-state file for backward compatibility");
            
        // And: should read existing state variables
        var stateVariables = new[] { "ISSUE", "CRITERIA", "PHASE", "TOTAL" };
        foreach (var variable in stateVariables)
        {
            Assert.True(floContent.Contains($"{variable}=", StringComparison.Ordinal),
                $"flo should manage state variable {variable} for backward compatibility");
        }
        
        // And: should load state from file
        Assert.True(floContent.Contains("source $STATE_FILE", StringComparison.Ordinal) ||
                   floContent.Contains("source .tdd-state", StringComparison.Ordinal) ||
                   floContent.Contains("[[ -f $STATE_FILE ]] && source $STATE_FILE", StringComparison.Ordinal),
            "flo should load existing state from .tdd-state file");
            
        // And: should save state in compatible format
        var saveStateFunction = ExtractFunctionBlock(floContent, "save_state");
        if (!string.IsNullOrEmpty(saveStateFunction))
        {
            Assert.True(saveStateFunction.Contains("ISSUE=$ISSUE", StringComparison.Ordinal),
                "save_state function should write ISSUE variable");
            Assert.True(saveStateFunction.Contains("CRITERIA=$CRITERIA", StringComparison.Ordinal),
                "save_state function should write CRITERIA variable");
            Assert.True(saveStateFunction.Contains("PHASE=$PHASE", StringComparison.Ordinal),
                "save_state function should write PHASE variable");
            Assert.True(saveStateFunction.Contains("TOTAL=$TOTAL", StringComparison.Ordinal),
                "save_state function should write TOTAL variable");
        }
    }

    [Fact(DisplayName = "Update documentation and help text to reflect unified CLI structure")]
    [Trait("AcceptanceTest", "#175")]
    [Trait("Given", "flo script has integrated TDD functionality")]
    [Trait("When", "users access help documentation")]
    [Trait("Then", "it should reflect the unified CLI structure with TDD commands")]
    public void flo_documentation_reflects_unified_cli_structure()
    {
        // Given: flo script exists with integrated TDD functionality
        var floScriptPath = "/home/dan/code/WorkFlo/flo";
        Assert.True(File.Exists(floScriptPath), $"flo script should exist at {floScriptPath}");
        
        var floContent = File.ReadAllText(floScriptPath);
        
        // When: we check the help/usage documentation
        var usageFunction = ExtractFunctionBlock(floContent, "show_usage");
        Assert.False(string.IsNullOrEmpty(usageFunction), "flo should have show_usage function");
        
        // Then: it should document all TDD commands
        var tddCommands = new[] { "start", "red", "green", "refactor", "cover", "next", "status" };
        foreach (var command in tddCommands)
        {
            Assert.True(usageFunction.Contains(command, StringComparison.Ordinal),
                $"Usage documentation should include TDD command '{command}'");
        }
        
        // And: should show unified command structure (flo command, not tdd command)
        Assert.True(usageFunction.Contains("flo", StringComparison.Ordinal),
            "Usage documentation should reference 'flo' as the unified command");
            
        // And: should not reference separate tdd script
        Assert.False(usageFunction.Contains("tdd start", StringComparison.Ordinal) ||
                    usageFunction.Contains("tdd red", StringComparison.Ordinal),
            "Usage documentation should not reference separate tdd script commands");
    }
}
